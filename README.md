# Placemind — AI ATS Optimization & Template Studio
> **Decoupled Hybrid Architecture:** Next.js 15 Frontend + FastAPI Backend + Local OSS Model (Ollama `gpt-oss:20b`) & Cloud Track (Gemini 2.5 Flash).

---

## Quickstart & Demo Guide

### 1. Prerequisites & Model Setup
Install [Ollama](https://ollama.com/) and pull the local 20B OSS model:
```bash
# Pull local OSS model
ollama pull gpt-oss:20b

# Start local model runtime (default port 11434)
ollama serve
```

### 2. Environment Configuration
Ensure `backend/.env` is configured:
```env
# Local OSS Model Configuration
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=gpt-oss:20b
LLM_TIMEOUT_S=60
LLM_MAX_TOKENS=1500

# Embedding & CORS
EMBEDDING_MODEL_NAME=BAAI/bge-small-en-v1.5
CORS_ORIGINS=["http://localhost:3000"]
```

Ensure `frontend/.env.local` is configured:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

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
npm install
npm run dev
```
Open **http://localhost:3000/template** to use the Prompt-to-Template Studio and ATS Readiness Auditor.

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
