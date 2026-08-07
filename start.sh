#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 PlaceMind Platform Startup Script"
echo "=========================================="

# 1. Start Docker Infrastructure
echo "🐳 [1/4] Starting Docker services (Postgres, Redis, MinIO)..."
docker compose up -d

# 2. Run DB Migrations
echo "📦 [2/4] Running Alembic Database Migrations..."
(cd backend && source .venv/bin/activate && alembic upgrade head)

# 3. Setup Trap for Graceful Shutdown
cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "🛑 Shutting down PlaceMind services..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 4. Launch Backend, Celery Worker, and Frontend concurrently
echo "⚡ [3/4] Starting FastAPI Backend Server (http://localhost:8000)..."
(cd backend && source .venv/bin/activate && exec uvicorn app.main:app --reload --port 8000) &

echo "🔄 [4/4] Starting Celery Task Worker..."
(cd backend && source .venv/bin/activate && exec celery -A app.worker worker --loglevel=info) &

echo "💻 [ALL SET] Starting Next.js Frontend (http://localhost:3000)..."
(cd frontend && exec npm run dev) &

wait
