# ============================================================================
# File: backend/Dockerfile
# Description: Production Dockerfile for the Placemind FastAPI/FastEmbed backend.
#
# WHY A CONTAINER (NOT SERVERLESS):
# ─────────────────────────────────────────────────────────────────────────────
# FastEmbed loads BAAI/bge-small-en-v1.5 ONNX weights into RAM (~200MB) at
# startup and keeps them resident. This is incompatible with serverless
# platforms (AWS Lambda, Vercel Functions, Cloudflare Workers) because:
#   1. Serverless functions have a hard RAM limit (128MB–256MB typical).
#   2. Cold-start initialisation of the ONNX Runtime takes 2–8 seconds,
#      which exceeds API Gateway / Vercel timeout thresholds.
#   3. There is no persistent process between invocations, so the model
#      would need to be loaded from scratch on every cold request.
#
# SOLUTION: Deploy as a long-running container on a managed compute service:
#   - Google Cloud Run  (recommended: scales to 0 but keeps warm container alive
#                        if min-instances=1 is set)
#   - Railway.app       (simple Docker deploy, free tier available)
#   - Render.com        (Docker support, persistent process)
#   - AWS ECS Fargate   (production-grade, pay-per-use)
#
# BUILD STAGES:
#   Stage 1 (builder): Install Python dependencies in a clean layer.
#   Stage 2 (runtime): Copy only installed packages into a slim image.
#   This reduces final image size by ~40% vs a single-stage build.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependency builder ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# System packages needed for PyMuPDF (libmupdf) and asyncpg (Postgres C driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Slim runtime image ──────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Minimal runtime system dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/

# FastEmbed downloads model weights on first use.
# We pre-download at build time so the container is ready immediately
# without any cold-start model pull latency in production.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

# Expose FastAPI port
EXPOSE 8000

# WORKERS: Use 2 workers for typical cloud VM (1 vCPU = 1-2 workers recommended).
# Gunicorn manages process restarts; uvicorn handles async I/O.
# Adjust WEB_CONCURRENCY env var at runtime if needed.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
