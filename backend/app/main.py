# ============================================================================
# File: backend/app/main.py
# Description: FastAPI Application entrypoint with CORS, Lifespan, and health checks
# ============================================================================

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("placemind.main")

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
    # ---------------------------------------------------------------------------
    # Database table creation (if not exists)
    # ---------------------------------------------------------------------------
    from app.database.session import engine
    from app.database.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured.")
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

# ---------------------------------------------------------------------------
# Database Health Endpoint
# ---------------------------------------------------------------------------
from fastapi import Depends
from sqlalchemy import text
from app.database.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

@app.get("/health/db", tags=["Health Probe"])
async def db_health_check(db: AsyncSession = Depends(get_db)):
    """Check PostgreSQL connectivity and verify that the `vector` extension is installed."""
    try:
        # Simple connectivity test
        await db.execute(text("SELECT 1"))
        # Verify vector extension
        result = await db.execute(text("SELECT extname FROM pg_extension WHERE extname='vector'"))
        extension_row = result.fetchone()
        vector_installed = extension_row is not None
        return {
            "status": "online",
            "database": "connected",
            "vector_extension": "installed" if vector_installed else "missing",
        }
    except Exception as e:
        return {
            "status": "offline",
            "error": str(e),
        }

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
