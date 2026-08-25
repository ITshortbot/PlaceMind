# Placemind — DevOps, Backend & Cloud Infrastructure Guide
> **Owner/Role:** DevOps & Cloud Infrastructure Engineer  
> **Tech Stack:** Docker, Docker Compose, FastAPI, PostgreSQL (pgvector), Cloudflare R2, Nginx, GitHub Actions, Vercel / Railway

---

## 1. Overview & Responsibility
This guide outlines the backend infrastructure, database configuration, container orchestration, CI/CD deployment pipelines, and cloud storage management for the Placemind ecosystem.

---

## 2. Infrastructure Architecture Diagram

```
                 [ User Browser / Client ]
                             │
                  (HTTPS / DNS via Cloudflare)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Next.js Frontend ]              [ FastAPI Backend ]
   (Vercel / Port 3000)             (Railway / Port 8000)
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            [ PostgreSQL DB ]         [ Cloudflare R2 ]        [ Gemini / LM Studio ]
            (pgvector extension)      (Encrypted Blobs)          (Dual AI Router)
```

---

## 3. Database Schema & Vector Indexing (`schema.sql`)

Placemind uses PostgreSQL with the `pgvector` extension for storing resume embeddings and executing fast cosine distance similarity queries.

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_sections JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume Chunks & Dense Vector Embeddings
CREATE TABLE IF NOT EXISTS resume_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    section_type VARCHAR(64) NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding vector(384) NOT NULL, -- 384 dimensions for bge-small-en
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast HNSW Cosine Vector Index
CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding 
ON resume_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 4. Docker Compose Setup

Run the full stack locally with one command:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: placemind-db
    environment:
      POSTGRES_USER: placemind
      POSTGRES_PASSWORD: placemind_secure_password
      POSTGRES_DB: placemind_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: placemind-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://placemind:placemind_secure_password@postgres:5432/placemind_db
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: placemind-ui
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## 5. Deployment Guidelines

### A. Frontend Deployment (Vercel)
1. Link GitHub repository to Vercel.
2. Root Directory: `frontend`
3. Framework Preset: `Next.js`
4. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.placemind.app`

### B. Backend Deployment (Railway / Render)
1. Deploy from root using Dockerfile or Python buildpack.
2. Root Directory: `backend`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Database Connection: `DATABASE_URL` pointing to PostgreSQL with pgvector enabled.

---

## 6. Health & Readiness Endpoints

- **API Health Check:** `GET /health` &rarr; Returns `{"status": "ok", "version": "1.0.0"}`
- **Database Connection Check:** `GET /health/db` &rarr; Verifies pgvector readiness.
- **ATS Evaluation Endpoint:** `POST /api/v1/score`
