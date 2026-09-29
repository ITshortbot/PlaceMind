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
