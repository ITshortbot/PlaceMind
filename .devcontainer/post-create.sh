#!/usr/bin/env bash
# PlaceMind one-shot environment setup: backend deps, frontend deps, local Postgres.
set -e
cd /workspaces/PlaceMind 2>/dev/null || cd "$(dirname "$0")/.."

echo "== Backend dependencies =="
pip install -r backend/requirements.txt

echo "== Frontend dependencies =="
cd frontend && npm ci && cd ..

echo "== Local Postgres (pgvector) =="
if ! docker ps --format '{{.Names}}' | grep -q '^pmdblocal$'; then
  docker run -d --name pmdblocal \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=placemind \
    -p 5432:5432 pgvector/pgvector:pg16 || echo "Postgres container start skipped (already exists or docker unavailable)"
fi

echo "== Backend tests =="
cd backend && python -m pytest tests/ -q || true

echo "Done. Start backend:  cd backend && CORS_ORIGINS='[\"<your-3000-url>\"]' uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "Start frontend: cd frontend && NEXT_PUBLIC_BACKEND_URL=<your-8000-url> npm run dev"
