# Placemind — MLOps & AI Logic Architecture Guide
> **Owner/Role:** MLOps Engineer & AI Systems Lead  
> **Tech Stack:** Python 3.11+, PyMuPDF (fitz), HuggingFace Transformers (`bge-small-en-v1.5`), pgvector, Gemini 2.5 Flash, LM Studio (Local RAG)

---

## 1. Overview & Responsibility
This guide details the AI routing mechanism, text extraction pipelines, vector embedding workflows, and prompt engineering architecture for the Placemind ATS Scoring and AI Rehearsal platform.

Placemind features a **Dual-Engine Privacy Router**:
1. **Cloud Fast Track:** Gemini 2.5 Flash for high-speed cloud parsing, Google XYZ metric synthesis, and instant interview simulation.
2. **Local Privacy Track:** LM Studio / Ollama local LLM endpoint for zero data egress, offline parsing, and privacy-first resume analysis.

---

## 2. Directory & Module Architecture

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   └── scoring.py          # FastAPI endpoint for resume + JD evaluation
│   │   └── router.py               # API route registry
│   ├── core/
│   │   └── config.py               # Environment configuration & model flags
│   ├── schemas/
│   │   └── scoring.py              # Pydantic schemas for request/response validation
│   ├── services/
│   │   ├── ai_router.py            # Dynamic switch between Gemini Cloud & LM Studio
│   │   ├── ats_scorer.py           # Hybrid score calculation (Cosine + Keyword + Structure)
│   │   ├── embeddings.py           # In-memory bge-small-en-v1.5 vector generator
│   │   ├── pdf_parser.py           # Zero-disk in-memory PyMuPDF stream parser
│   │   └── r2_storage.py           # Optional Cloudflare R2 resume blob storage
│   └── main.py                     # FastAPI application entry point
├── database/
│   └── schema.sql                  # PostgreSQL pgvector table definitions & indexes
└── requirements.txt                # Python dependencies
```

---

## 3. Core AI Pipelines

### A. In-Memory Zero-Disk PDF Parsing (`pdf_parser.py`)
- Resumes are streamed directly into memory via `fitz.open(stream=file_bytes, filetype="pdf")`.
- Text is sanitized, stripped of formatting noise, and segmented into semantic blocks:
  - Header & Contact Info
  - Work Experience & Impact Metrics
  - Technical & Soft Skills
  - Education & Certifications

### B. Vector Embeddings & Similarity (`embeddings.py`)
- Model: `BAAI/bge-small-en-v1.5` (384-dimensional dense vector embeddings).
- Normalization: Vectors are L2-normalized for cosine similarity computation:
  $$\text{Semantic Similarity} = \cos(\theta) = \frac{\mathbf{v}_{\text{resume}} \cdot \mathbf{v}_{\text{job}}}{\|\mathbf{v}_{\text{resume}}\| \|\mathbf{v}_{\text{job}}\|}$$

### C. Hybrid ATS Scoring Formula (`ats_scorer.py`)
Overall ATS score combines semantic relevance, hard keyword presence, and structural integrity:

$$\text{Final ATS Score} = (0.50 \times \text{Semantic Score}) + (0.30 \times \text{Keyword Match}) + (0.20 \times \text{Structure Score})$$

- **Semantic Score (50%):** Cosine distance between chunk vectors in pgvector.
- **Keyword Match (30%):** Exact & fuzzy match of required technical skills, tooling, and frameworks.
- **Structure Score (20%):** Single-column layout verification, standard section headers, and font parsability.

### D. Google XYZ Bullet Point Rewrite Prompting
Prompt structure used by `ai_router.py` to upgrade candidate bullet points:
```
Accomplished [X], as measured by [Y], by doing [Z].
Input Bullet: "Maintained SQL database and wrote queries."
Output Bullet: "Engineered high-throughput cloud database index handling 250M queries daily, cutting latency by 42%."
```

---

## 4. Local AI & Cloud Configuration

In `backend/.env`:
```env
# Cloud Engine (Gemini)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Local OSS Privacy Engine (Ollama / OpenAI-compatible endpoint)
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=gpt-oss:20b
LLM_TIMEOUT_S=60
LLM_MAX_TOKENS=1500

# Legacy LM Studio Compatibility
USE_LOCAL_LLM=false
LOCAL_LLM_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=meta-llama-3-8b-instruct

# Vector Embedding Model
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

---

## 5. Local Setup & Pulling the Model

### Step 1: Pull the Local OSS Model
```bash
# Pull the recommended local 20B OSS model via Ollama
ollama pull gpt-oss:20b

# Ensure Ollama server is running locally on port 11434
ollama serve
```

### Step 2: Verify Local Model Connectivity
```bash
# Ping the model via Placemind AI Router
python scripts/ping_llm.py
```

### Step 3: Run Demo Hardening Check
```bash
# Execute 5 sample prompts x 3 iterations to test schema pass rate and latency
python scripts/demo_check.py
```

---

## 6. Running the Demo Full Stack

### Terminal 1: Backend API
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Note:* The backend automatically performs a non-blocking warm-up call on startup to preload the model into memory.

### Terminal 2: Frontend Studio
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000/template** to access the Prompt-to-Template Studio and ATS Readiness Auditor.

---

## 7. Privacy & Security Guarantee
> **Privacy Note:** Nothing leaves the laptop in local mode.
> 
> - All resume content, prompts, and extracted text are processed 100% locally on your machine via Ollama/LM Studio and the embedded ONNX vector engine (`BAAI/bge-small-en-v1.5`).
> - Zero telemetry, zero external logging, and zero data egress are enforced across all local routing paths.

