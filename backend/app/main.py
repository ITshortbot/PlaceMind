# ============================================================================
# File: backend/app/main.py
# Description: FastAPI Application entrypoint with CORS, Lifespan, and health checks
# ============================================================================

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("placemind.main")


_USER_SCHEMA_READINESS_SQL = text("""
    SELECT
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'id'
              AND data_type = 'uuid'
              AND is_nullable = 'NO'
        ) AS id_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'email'
              AND data_type = 'character varying'
              AND character_maximum_length = 255
              AND is_nullable = 'YES'
        ) AS email_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'google_sub'
              AND data_type = 'character varying'
              AND character_maximum_length = 255
              AND is_nullable = 'YES'
        ) AS google_sub_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'full_name'
              AND data_type = 'character varying'
              AND character_maximum_length = 255
              AND is_nullable = 'YES'
        ) AS full_name_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'avatar_url'
              AND data_type = 'text'
              AND is_nullable = 'YES'
        ) AS avatar_url_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'is_local_only'
              AND data_type = 'boolean'
        ) AS is_local_only_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'created_at'
              AND data_type = 'timestamp with time zone'
        ) AS created_at_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'updated_at'
              AND data_type = 'timestamp with time zone'
        ) AS updated_at_ready,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'is_guest'
              AND data_type = 'boolean'
              AND is_nullable = 'NO'
              AND column_default IN ('false', 'false::boolean')
        ) AS is_guest_ready,
        EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'users'::regclass
              AND conname = 'ck_users_guest_email'
              AND contype = 'c'
              AND regexp_replace(
                    lower(pg_get_constraintdef(oid)),
                    '[^a-z0-9_]',
                    '',
                    'g'
                  ) = 'checkis_guesttrueandemailisnulloris_guestfalseandemailisnotnull'
        ) AS guest_email_check_ready,
        EXISTS (
            SELECT 1
            FROM pg_index AS idx
            JOIN pg_class AS index_table ON index_table.oid = idx.indexrelid
            JOIN pg_attribute AS column_info
              ON column_info.attrelid = idx.indrelid
             AND column_info.attname = 'google_sub'
            WHERE idx.indrelid = 'users'::regclass
              AND index_table.relname = 'ix_users_google_sub'
              AND idx.indisunique
              AND idx.indisvalid
              AND idx.indnatts = 1
              AND idx.indpred IS NULL
              AND idx.indexprs IS NULL
              AND idx.indkey[0] = column_info.attnum
        ) AS google_sub_unique_ready,
        EXISTS (
            SELECT 1
            FROM pg_index AS idx
            JOIN pg_attribute AS column_info
              ON column_info.attrelid = idx.indrelid
             AND column_info.attname = 'email'
            WHERE idx.indrelid = 'users'::regclass
              AND idx.indisunique
              AND idx.indisvalid
              AND idx.indnatts = 1
              AND idx.indpred IS NULL
              AND idx.indexprs IS NULL
              AND idx.indkey[0] = column_info.attnum
        ) AS email_unique_ready
""")


async def _validate_user_schema(connection):
    result = await connection.execute(_USER_SCHEMA_READINESS_SQL)
    state = result.mappings().one()
    missing = [name for name, ready in state.items() if not ready]
    if missing:
        raise RuntimeError(
            "Required users schema is incomplete: "
            + ", ".join(missing)
            + ". Review backend/database/migrations/001_guest_identity.sql "
            "and the preflight procedure in README.md before deployment."
        )


async def initialize_database(engine, metadata):
    operation = "open initialization transaction"
    try:
        async with engine.begin() as conn:
            is_postgresql = engine.url.get_backend_name() == "postgresql"
            if is_postgresql:
                operation = "acquire PostgreSQL schema initialization lock"
                await conn.execute(text("SELECT pg_advisory_xact_lock(1347179085, 1)"))

                operation = "ensure pgvector extension"
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            # Create missing tables before altering existing ones. A fresh
            # PostgreSQL database does not have a users table yet.
            operation = "create missing ORM tables"
            await conn.run_sync(metadata.create_all)

            if is_postgresql:
                # Idempotent auth-column migration: create_all never alters
                # existing tables, so add the sign-in columns explicitly.
                operation = "ensure users.google_sub column"
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub varchar(255)"))
                operation = "ensure users.avatar_url column"
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text"))
                operation = "ensure unique users.google_sub index"
                await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)"))

                operation = "validate required users schema"
                await _validate_user_schema(conn)

        logger.info("Database initialization completed (pgvector extension on PostgreSQL only).")
    except Exception as exc:
        logger.exception("Database initialization failed during %s: %s", operation, exc)
        raise RuntimeError(f"Database initialization failed during {operation}.") from exc


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Event:
    Pre-warms the BAAI/bge-small-en-v1.5 embedding ONNX model into memory
    to avoid a cold-start delay on the user's first request.
    """
    logger.info("Initializing Placemind Backend Lifespan...")
    from app.database.session import engine
    from app.database.models import Base
    await initialize_database(engine, Base.metadata)

    from app.services.embeddings import embedding_engine
    _ = embedding_engine.embed_query("Placemind cold start probe")
    logger.info("Embedding engine warmed up successfully.")

    # Warm up local OSS LLM model endpoint (safe and non-blocking if offline)
    try:
        from app.services.ai_router import HybridLLMRouter, RoutingMode
        router = HybridLLMRouter()
        _ = await router.complete(
            messages=[{"role": "user", "content": "ping"}],
            mode=RoutingMode.OSS,
            temperature=0.0,
        )
        logger.info("Local OSS LLM model warmed up successfully.")
    except Exception as exc:
        logger.info("Local OSS LLM warm-up skipped (model offline or unavailable): %s", exc)

    yield
    logger.info("Placemind Backend shutting down cleanly.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Decoupled Hybrid AI ATS Platform (Gemini Cloud + LM Studio Local)",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) for Next.js and Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Depends
from app.database.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

@app.get("/health/db", tags=["Health Probe"])
async def db_health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        result = await db.execute(text("SELECT extname FROM pg_extension WHERE extname='vector'"))
        extension_row = result.fetchone()
        return {
            "status": "online",
            "database": "connected",
            "vector_extension": "installed" if extension_row is not None else "missing",
        }
    except Exception as exc:
        logger.warning("Database readiness check failed (%s).", type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail="Database is unavailable.",
        ) from None

# CSRF defense in depth: the session cookie is SameSite=Lax (cross-site POSTs
# never carry it); additionally, any mutating request that presents an Origin
# header must come from a configured frontend origin. Cookie-less tooling
# without an Origin header is unaffected.
_MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


@app.middleware("http")
async def origin_guard(request: Request, call_next):
    if request.method in _MUTATING_METHODS:
        origin = request.headers.get("origin")
        if origin:
            allowed = {o.rstrip("/") for o in settings.CORS_ORIGINS}
            if origin.rstrip("/") not in allowed:
                return JSONResponse(status_code=403, content={"detail": "Forbidden origin."})
    return await call_next(request)


# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health Probe"])
async def health_check():
    """Service health probe for load balancers and deployment probes."""
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }
