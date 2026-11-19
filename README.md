# Placemind — AI ATS Optimization & Template Studio
> **Decoupled Hybrid Architecture:** Next.js 15 Frontend + FastAPI Backend + Ollama (`qwen2.5-coder:1.5b`) by default, with optional Gemini and LM Studio providers.

---

## Quickstart & Demo Guide

### 1. Prerequisites & Model Setup
Install [Ollama](https://ollama.com/) and pull the configured model:
```bash
# Pull the default ATS model
ollama pull qwen2.5-coder:1.5b

# Start local model runtime (default port 11434)
ollama serve
```

### 2. Environment Configuration
Ensure `backend/.env` is configured:
```env
# Local OSS Model Configuration
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=qwen2.5-coder:1.5b
LLM_TIMEOUT_S=60
LLM_MAX_TOKENS=1500

# Embedding & CORS
EMBEDDING_MODEL_NAME=BAAI/bge-small-en-v1.5
CORS_ORIGINS=["http://localhost:3000"]
```

The frontend uses same-origin `/api/...` requests. No public backend URL is
required in frontend environment variables. Use `vercel dev` from `frontend/`
to exercise the Vercel API proxy locally.

---

## 3. Running the Application

### Backend API (FastAPI)
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Startup Lifespan Note:* Pre-warms the ONNX embedding engine and local OSS model endpoint on boot to ensure zero cold-start delay for end users.

### Frontend (Next.js 15 + Tailwind CSS)
```bash
cd frontend
vercel dev --listen 3000
```
The Vercel CLI uses `frontend/vercel.json` for the same-origin Render API
proxy. Open **http://localhost:3000/template** to use the Prompt-to-Template
Studio and ATS Readiness Auditor.

---

## 4. Verification & Hardening Scripts

- **Ping LLM Endpoint:**
  ```bash
  python scripts/ping_llm.py
  ```
- **Demo Hardening Check (5 Prompts x 3 Iterations):**
  ```bash
  python scripts/demo_check.py
  ```
  Evaluates schema first-try pass rate, preset fallback rate, and mean/max execution latency.

---

## 5. Privacy & Security Note
> **Privacy Note: Zero Data Egress in Local Mode.**  
> When operating with the local OSS model, all candidate information, resume content, and prompts remain strictly on the local machine. Zero external network calls, zero prompt telemetry, and zero unverified hallucinated records are permitted.

## Guest access and database upgrade

Visitors receive an independent guest identity and signed, HttpOnly session cookie automatically. Guest records use a null email and an explicit `is_guest` flag; user-owned API routes retain their ownership checks and guest requests are rate limited. Guest data is not transferred when signing in with Google.

Before deploying to an existing PostgreSQL database, run the read-only
`backend/database/verify_neon_schema.sql` audit and review its results against
the expected ORM schema. The backend does not apply
`backend/database/migrations/001_guest_identity.sql` automatically:

1. Back up the database and confirm the audit shows the pre-migration state:
   `users.email` is NOT NULL, and `is_guest` plus
   `ck_users_guest_email` are both absent.
2. If the audit already shows the complete post-migration state, do not rerun
   the migration. If it shows a partial or otherwise different state, stop and
   reconcile that state manually.
3. Only for the exact pre-migration state, apply
   `001_guest_identity.sql` once through the normal approved database change
   process, then rerun the audit and verify that `email` is nullable,
   `is_guest` is NOT NULL with a false default, and the named check constraint
   exists.
4. Do not blindly reverse this migration after guest rows exist. Requiring
   non-NULL emails again can fail and dropping `is_guest` would discard guest
   identity state. Prefer restoring the pre-migration backup or plan a separate
   data-preserving rollback after reviewing affected guest rows.

Startup serializes its non-destructive PostgreSQL initialization DDL across
workers, creates missing ORM tables, and ensures the Google OAuth columns and
unique subject index. It does not repair columns in existing tables. Startup
fails before serving requests if the required user schema is incomplete. The
database role needs the privileges required for the applicable `CREATE EXTENSION`,
`CREATE TABLE`, `ALTER TABLE`, and `CREATE INDEX` operations.

## Production deployment: Vercel, Render, and Neon

Vercel hosts only the Next.js frontend. In the Vercel project settings, set
**Root Directory** to `frontend`, select the Next.js framework, and use the
`npm` package manager detected from `frontend/package-lock.json`. The build
command is `npm run build`; leave the output directory at the Next.js default.
The repository root has no frontend package manifest, and there is no linked
Vercel project metadata in this checkout, so verify the dashboard Root
Directory is `frontend`.

The authoritative API proxy is `frontend/vercel.json`: `/api/:path*` is
rewritten to `https://placemind-tdhj.onrender.com/api/:path*`. The `/api`
prefix is preserved and browser URLs stay on the Vercel domain. Render remains
the only FastAPI backend and continues to use the existing Neon PostgreSQL
database. Do not create a Vercel backend service or add a public backend URL to
frontend environment variables.

No Vercel environment variables are required for API routing. After the Vercel
domain is known, configure these non-secret settings on the existing Render
backend:

```env
ENVIRONMENT=production
FRONTEND_URL=https://<vercel-domain>
CORS_ORIGINS=["https://<vercel-domain>"]
GOOGLE_REDIRECT_URI=https://<vercel-domain>/api/v1/auth/google/callback
AUTH_COOKIE_SECURE=true
```

The Google OAuth authorized redirect URI must exactly match
`GOOGLE_REDIRECT_URI`. The callback is served on the Vercel origin and proxied
to Render; the backend then redirects to `FRONTEND_URL`. The existing auth
implementation already uses these configured URLs, so no callback code change
is needed. `CORS_ORIGINS` is also checked by the backend's origin guard for
mutating requests.

Keep `DATABASE_URL`, `AUTH_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`,
`GEMINI_API_KEY`, and any configured storage/provider credentials only in
Render's environment. `GOOGLE_CLIENT_ID` is also configured on Render for the
backend OAuth flow. Never put secrets in `NEXT_PUBLIC_*` variables or commit
them to the repository.

After deployment, verify that `/` serves the Next.js site and that browser
requests to `/api/v1/...` remain on the Vercel domain and receive API responses
from Render. For example, `GET /api/v1/auth/me` should return the expected
unauthenticated or current-session response. Then test the Google login flow
and confirm its callback and final redirect remain on the configured Vercel
domain.
