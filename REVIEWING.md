# Reviewing PlaceMind

How to run and review this project in its GitHub Codespace. Everything here is a
single-user demo: no production auth, no multi-tenant isolation, synthetic data only.

## 1. Start the Codespace

From the repo page: Code -> Codespaces -> start the existing codespace
(or `gh codespace start -c <codespace-name>`). Open it in the browser VS Code.

## 2. Start the backend (port 8000)

```bash
cd /workspaces/PlaceMind/backend && \
CORS_ORIGINS='["http://localhost:3000","http://localhost:3001","http://localhost:3005","https://<codespace-name>-3001.app.github.dev","https://<codespace-name>-3000.app.github.dev"]' \
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/uvicorn.log 2>&1 &
```

Replace `<codespace-name>` with the actual codespace name (visible in the URL).
Health check: `curl -s http://localhost:8000/health`.

## 3. Start the frontend (port 3001)

```bash
cd /workspaces/PlaceMind/frontend && \
(nvm use 22) && \
NEXT_PUBLIC_BACKEND_URL=https://<codespace-name>-8000.app.github.dev \
npm run dev -- -p 3001
```

Node 22 is required (matches CI). The app is then at
`https://<codespace-name>-3001.app.github.dev` (private: it goes through a GitHub
sign-in interstitial because the port forward is not public).

## 4. Run the Playwright suite

Stop the dev server first (the dev server and `npm run build` share `.next` and
corrupt each other):

```bash
cd /workspaces/PlaceMind/frontend && (nvm use 22) && \
BACKEND_URL=http://localhost:8000 npx playwright test
```

The suite seeds synthetic records, exercises the real dashboard/interview rounds/
settings/ATS flows, and generates its test PDF on the fly. Tests that involve AI
providers run without any API key and assert the deterministic fallback paths;
no live provider is called.

## What is real vs. limited

- Resume records, interview questions, ATS scoring: real, backed by local Postgres
  and local embeddings (no data leaves the machine).
- AI-written suggestions (ATS gap synthesis, template generation, interview
  evaluation): require a Gemini API key or a local LM Studio server configured on
  the backend. Without one, every flow falls back to a clearly labeled
  deterministic/preset result instead of failing.
- Settings (profile, engine preference) save to this browser's localStorage only.
- This is a single-user demo: one local database, no auth, no isolation.
