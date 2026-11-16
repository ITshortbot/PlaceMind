# ============================================================================
# File: backend/app/main.py
# Description: FastAPI Application entrypoint with CORS, Lifespan, and health checks
# ============================================================================

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
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


async def initialize_database(engine, metadata):
    try:
        if engine.url.get_backend_name() == "postgresql":
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create missing tables before altering existing ones. A fresh
        # PostgreSQL database does not have a users table yet.
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
        if engine.url.get_backend_name() == "postgresql":
            async with engine.begin() as conn:
                # Idempotent auth-column migration: create_all never alters
                # existing tables, so add the sign-in columns explicitly.
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub varchar(255)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text"))
                await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)"))
        logger.info("Database tables ensured (pgvector extension on PostgreSQL only).")
    except Exception as exc:
        logger.warning("Database initialization failed; continuing without database features: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Event:
    Pre-warms the BAAI/bge-small-en-v1.5 embedding ONNX model into memory
    to avoid a cold-start delay on the user's first request.
    """
    logger.info("Initializing Placemind Backend Lifespan...")
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

    from app.database.session import engine
    from app.database.models import Base
    await initialize_database(engine, Base.metadata)
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
        return {"status": "offline", "error": str(exc)}

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
