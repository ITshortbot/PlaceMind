# PlaceMind

A chat-first resume workspace for students. You tell PlaceMind about yourself, it builds a resume from only what you wrote, scores it against a job description with visible rules, and runs interview practice from your own resume.

PlaceMind never invents jobs, numbers or dates. Anything it cannot find stays blank, and the app tells you what is missing.

This is a working prototype for a project review. It runs on synthetic or user-entered data. It is not a hosted production service.

## What works

| Area | What it does |
| --- | --- |
| Dashboard chat (`/dashboard`) | Paste a plain paragraph about yourself, paste sectioned resume text, or attach a PDF or text file. A rule-based parser (no AI) extracts name, email, phone, skills, education, experience, projects and a goal, shows a review card with what it found and what is missing, and saves on "Save as my resume". Explicit edit commands such as "add skill Tableau" change the active resume, with "undo". Invalid or unclear input is refused with a plain reply. |
| Resume Builder (`/resume`) and Templates (`/template`) | Edit sections with a live preview and switch between built-in templates. Switching a template does not change your content. Template generation builds only from your saved facts. |
| ATS check (`/ats`) | Upload a PDF and paste a job description. Text is extracted in memory with PyMuPDF. The overall score is 50% semantic similarity (local embeddings), 30% keyword coverage and 20% structure. The report shows a per-requirement gap matrix, missing keywords, and which engine ran. The ATS pipeline can call an LLM (Gemini, optional, needs `GEMINI_API_KEY`) to split the job description into requirements and to write the gap suggestions. With no provider it says so ("none (deterministic local analysis)") and uses a line-based requirement split and fixed suggestions. |
| Interview practice (`/interview`) | Questions based on your resume, per-answer scoring and a report. Rule-based, so it works offline. |
| History (`/history`) | Saved resumes and ATS scores. |
| Settings (`/settings`) | Profile and education basics (stored in this browser, used to pre-fill new drafts) and a sign-out button. |
| Guest access | Each visitor gets an independent guest identity with a signed HttpOnly session cookie. No sign-up needed. Records are owned per user. |
| Google sign-in | Built, optional, and needs your own Google OAuth client configured. It is not needed for guest mode or for local runs. |

## Where AI is used

Most of the app is rule-based and needs no AI model: paragraph and PDF import, chat edits, saving, history, and interview practice. The interview is fully rule-based: question planning (templates plus skills found in the resume), follow-ups, acknowledgments and per-answer scoring are all code, with no LLM call.

ATS scoring is hybrid. Matching uses local fastembed embeddings, and the weights are fixed (50% semantic, 30% keyword, 20% structure). Two steps can use an LLM when a provider is configured: splitting the job description into requirements, and writing the gap suggestions. The ATS route uses the Gemini route in `ai_router.py` (`GEMINI_API_KEY`), not OpenRouter. If no provider is configured or the call fails, it falls back to a line-based requirement split and fixed suggestions, and the report says "no LLM call made". Tested on 3101 and 3100 with no provider: the report returns in about 2 seconds with that label.

Optional AI features:

- Open-ended chat answers and AI-written template generation use the OpenRouter **free** route when `OPENROUTER_API_KEY` is set. The backend keeps an allowlist of free models (`openrouter/free`) and refuses any other model before a request is made, so a configuration mistake cannot cause a paid call.
- Without a key, chat gives simple local replies and template generation falls back to a clearly labelled preset layout.
- The code can also route to Gemini (used by the ATS route) or to an OpenAI-compatible local server (LM Studio, Ollama) through `backend/app/services/ai_router.py`. These are optional and off unless you configure them. The demo setup does not configure them.
- Embeddings run locally with `BAAI/bge-small-en-v1.5` through fastembed. The model is downloaded on first use.

The free model can be slow or rate limited. If it is down or rate limited, chat answers fall back to simple local replies, template generation to a labelled preset, and ATS to the labelled local analysis. Import, edits, interview and history are unaffected.

## Privacy

PDF text is read in memory. Embeddings run on the backend machine. Resumes, parsed text and scores are stored in the backend database so they appear in History, and you can delete saved records there. Only text sent to the optional free chat or template model leaves the backend, and only when a key is configured.

## Tech stack

- Frontend: Next.js 15, React 19, Tailwind CSS, Framer Motion (Node 22)
- Backend: FastAPI, async SQLAlchemy, PyMuPDF, fastembed, LiteLLM
- Database: PostgreSQL with pgvector, or SQLite for local runs
- Auth: guest sessions (default), optional Google sign-in

## Run locally (SQLite, no Postgres, no AI key needed)

Requirements: Node 22 and Python 3.11 or 3.12.

Backend (port 8100):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (it is git-ignored; never commit it):

```env
ENVIRONMENT=development
DATABASE_URL=sqlite+aiosqlite:///./placemind_local.db
FRONTEND_URL=http://localhost:3100
CORS_ORIGINS=["http://localhost:3100","http://localhost:3000"]
OPENROUTER_API_KEY=
```

Leave `OPENROUTER_API_KEY` empty to run without AI, or paste your own free-tier key into that file yourself. Then:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8100
```

Check it: `curl http://127.0.0.1:8100/health`

Frontend (port 3100):

```bash
cd frontend
npm ci
NEXT_PUBLIC_BACKEND_URL=http://localhost:8100 npm run dev -- -p 3100
```

Open http://localhost:3100 and continue as guest.

To use PostgreSQL instead, set `DATABASE_URL` to a `postgresql+asyncpg://...` URL. The pgvector extension is created on start.

## Without an AI key

Works: landing, guest mode, paragraph and PDF import, chat edits and undo, Resume Builder, template switching, ATS scoring, interview practice, history.

Limited: open-ended chat answers (simple local replies) and AI template generation (labelled preset layout).

## Tests

The repository contains a backend `pytest` suite (`backend/tests`) and a Playwright suite (`frontend/tests`). They are not required to run the app. See `REVIEWING.md` for how the Playwright suite is run.

## Limits

- Prototype with guest mode as the demo path. Guest data belongs to that browser session.
- The import parser is rule-based. It prefers leaving a field blank over guessing, so unusual wording can leave fields empty. Use the builder to fill them.
- The ATS score measures alignment between a resume and a job text. It does not predict a hiring decision, and the gap-matrix thresholds are hand-tuned heuristics. There is no accuracy benchmark.
- No production deployment, no usage numbers and no performance claims.

## More documents

- `JURY_DEMO.md`: demo checklist and script
- `REVIEWING.md`: reviewing in a Codespace
- `README_UI.md`, `README_DEVOPS.md`, `README_MLOPS.md`: area notes (may describe older setups; this README is the current overview)
