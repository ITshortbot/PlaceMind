# AI-Based Interview & Resume Intelligence Platform
## Project Architecture & Execution Specification Document

**Document Type:** Technical Architecture Specification
**Prepared For:** Project-Based Learning (PBL) — College Capstone Project
**Target Local Dev Environment:** MacBook Air M5, 24GB Unified Memory
**Version:** 1.0

---

## 1. Executive Summary & System Architecture

### 1.1 Project Overview

The **AI-Based Interview & Resume Intelligence Platform** is an end-to-end career-readiness system that unifies four traditionally separate tools — a resume parser, an ATS (Applicant Tracking System) match scorer, a tailored resume generator, and an adaptive AI mock-interviewer — into a single pipeline built entirely on open-weights models runnable on consumer hardware.

**Core Objectives:**

1. **Resume Parsing & Structuring** — Convert unstructured resume PDFs/DOCX into a normalized, validated JSON schema (work history, education, skills, projects) with high extraction fidelity, including multi-column and non-linear layouts.
2. **ATS Match Scoring** — Quantify semantic and lexical alignment between a candidate's resume and a target job description (JD), surfacing missing keywords, weak bullet phrasing, and quantifiable-impact gaps.
3. **Tailored Resume Generation** — Given the structured resume JSON and a target JD, produce a rewritten, ATS-optimized resume rendered as a pixel-perfect, single-column, parser-safe PDF.
4. **Adaptive Mock Interviewing** — Run a multi-turn, role-specific interview session that adapts follow-up questions based on the candidate's weak areas (as detected from the ATS gap analysis) and scores answers on structure, relevance, and specificity (e.g., STAR method adherence).

**Why this matters as a PBL project:** it exercises full-stack engineering (Next.js + FastAPI), applied NLP/ML (NER, embeddings, LLM prompting), systems design (async task queues, vector search), and document engineering (LaTeX/Typst compilation) — a genuinely representative slice of production AI-platform engineering, while remaining fully runnable on a single laptop with no paid cloud GPU dependency.

### 1.2 System Design Diagram (End-to-End Data Pipeline)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│   Next.js 14 (App Router, TS) ── Tailwind CSS ── shadcn/ui                             │
│   ┌────────────┐   ┌────────────────┐   ┌───────────────────┐   ┌──────────────────┐  │
│   │ Resume      │   │ JD Paste /      │   │ Resume Preview     │   │ Live Interview    │ │
│   │ Upload (DnD)│   │ URL Fetch       │   │ (react-pdf/md)     │   │ Room (WebRTC/MSR) │ │
│   └─────┬──────┘   └────────┬────────┘   └──────────┬─────────┘   └─────────┬─────────┘ │
└─────────┼───────────────────┼───────────────────────┼────────────────────────┼──────────┘
          │  multipart/form   │  JSON POST             │ GET (SSE/WS stream)    │ WS (audio chunks)
          ▼                   ▼                        ▲                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER (FastAPI + Uvicorn)                     │
│   /api/v1/resume/upload   /api/v1/jd/analyze   /api/v1/resume/generate                 │
│   /api/v1/interview/start /api/v1/interview/turn   /api/v1/interview/score             │
│   Auth (JWT) ── Rate limiting ── Request validation (Pydantic v2)                       │
└───────────────┬───────────────────────────────────────────────────┬────────────────────┘
                │ enqueue heavy jobs                                 │ sync lightweight calls
                ▼                                                    ▼
┌───────────────────────────────────┐               ┌──────────────────────────────────────┐
│      ASYNC TASK QUEUE LAYER        │               │        SYNC INFERENCE LAYER           │
│   Celery Workers  ◄── Redis Broker │               │  Direct calls for low-latency turns   │
│  ┌─────────────────────────────┐   │               │  (interview Q&A, short completions)   │
│  │ Task: parse_resume          │   │               └──────────────────┬────────────────────┘
│  │ Task: embed_and_score       │   │                                  │
│  │ Task: generate_resume_pdf   │   │                                  │
│  │ Task: score_interview_turn  │   │                                  │
│  └──────────────┬───────────────┘  │                                  │
└─────────────────┼──────────────────┘                                  │
                   ▼                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                             ML / INFERENCE SUBSYSTEM                                   │
│  ┌───────────────────┐  ┌────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Doc Parsing        │  │ Embedding Service   │  │ LLM Inference (Ollama/llama.cpp)  │  │
│  │ Docling / Marker → │  │ BAAI/bge-large-en   │  │ Qwen2.5-7B-Instruct (GGUF Q4_K_M)  │  │
│  │ DeBERTa-v3 NER     │  │ v1.5 → 1024-dim vec │  │ DeepSeek-R1-Distill-8B (interview) │  │
│  └─────────┬──────────┘  └──────────┬──────────┘  └─────────────────┬──────────────────┘  │
└────────────┼────────────────────────┼───────────────────────────────┼─────────────────────┘
             ▼                        ▼                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE & DOCUMENT LAYER                                │
│  ┌──────────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐ │
│  │ PostgreSQL 16 + pgvector  │   │ Object Storage (S3/    │   │ Typst / Tectonic       │ │
│  │ - users, resumes, jds     │   │ MinIO local)            │   │ Compilation Engine     │ │
│  │ - resume_embeddings       │   │ - raw uploads           │   │ - JSON → .typ template │ │
│  │ - interview_sessions      │   │ - generated PDFs        │   │ - typst compile → PDF  │ │
│  └──────────────────────────┘   └───────────────────────┘   └───────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
                   ▲
                   │  result polling / SSE push back to client
                   └────────────────────────────────────────────────────────────────────
```

**Flow narrative:** A resume upload hits `/api/v1/resume/upload`, is persisted to object storage, and enqueues a Celery `parse_resume` task. Docling/Marker extracts layout-aware text, which is passed to a DeBERTa-v3 NER model fine-tuned for resume entities, producing structured JSON persisted in PostgreSQL. When a JD is submitted, both resume bullets and JD requirements are embedded via `bge-large-en-v1.5` and stored in `pgvector` columns; a cosine-similarity matrix drives the ATS gap report. Resume generation takes the structured JSON + gap report, runs it through an LLM rewriting prompt, and pipes the result into a Typst template, compiled server-side to a final PDF. The interview engine consumes the same gap report to seed an adaptive system prompt, then runs a stateful multi-turn loop over WebSocket, scoring each answer synchronously.

---

## 2. Tech Stack Specification

### 2.1 Frontend

| Component | Technology | Purpose |
|---|---|---|
| Framework | **Next.js 14** (App Router, TypeScript) | SSR/CSR hybrid UI, file-based routing, API route proxying |
| Styling | **Tailwind CSS** + `shadcn/ui` | Utility-first styling, accessible component primitives |
| State Management | **Zustand** or React Query (`@tanstack/react-query`) | Server-state caching, optimistic UI for async job polling |
| PDF Preview | `react-pdf` (pdf.js wrapper) | In-browser resume preview without download |
| Markdown Rendering | `react-markdown` + `remark-gfm` | Rendering LLM-generated feedback/gap reports |
| Audio/Voice | **WebRTC** (`SimplePeer` or native `MediaRecorder API`) | Capturing candidate voice answers during mock interviews |
| Real-time Transport | **WebSocket** (native) or `socket.io-client` | Streaming interview turns and token-by-token LLM output |
| Forms & Validation | `react-hook-form` + `zod` | Type-safe form validation matching backend Pydantic schemas |

### 2.2 Backend & API Layer

| Component | Technology | Purpose |
|---|---|---|
| API Framework | **FastAPI** (Python 3.11+) | Async-first REST + WebSocket endpoints, auto OpenAPI docs |
| ASGI Server | **Uvicorn** (with `uvloop`, `httptools`) | Production-grade async serving |
| Task Queue | **Celery** + **Redis** (broker + result backend) | Offloading parsing, embedding, PDF compilation, long LLM calls |
| Schema Validation | **Pydantic v2** | Request/response contracts, structured LLM output validation |
| Auth | `python-jose` (JWT) + `passlib[bcrypt]` | Session/token-based auth |
| Background Scheduling | `celery beat` | Periodic cleanup of stale uploads/sessions |

### 2.3 Database & Vector Storage

| Component | Technology | Purpose |
|---|---|---|
| Primary RDBMS | **PostgreSQL 16** | Relational data — users, resumes, JDs, sessions, scores |
| Vector Extension | **pgvector** (`vector` column type, HNSW index) | Storing 1024-dim `bge-large` embeddings for semantic search |
| Alternative Vector DB | **Qdrant** or **ChromaDB** (local, embedded mode) | Drop-in alternative if pgvector performance is insufficient at scale |
| ORM | **SQLAlchemy 2.0** (async) + **Alembic** | Schema migrations, async query layer |
| Cache | **Redis** (dual-purpose: Celery broker + cache) | Caching embedding results, rate-limit counters |

### 2.4 Document Compilation Engine

| Component | Technology | Purpose |
|---|---|---|
| Primary | **Typst** (via `typst-py` or CLI subprocess) | Fast (sub-second), deterministic, ATS-safe single-column PDF compilation from a templated `.typ` file populated with resume JSON |
| Fallback | **Tectonic** (self-contained LaTeX engine) | For users wanting classic LaTeX resume templates (e.g., Jake's Resume, Awesome-CV ports) |
| Rationale | — | Typst compiles ~10-50x faster than `pdflatex`/Tectonic and has a saner templating syntax for programmatic JSON injection, making it the preferred default; Tectonic is retained for LaTeX-template compatibility. |

### 2.5 Inference Servers & Runtime

| Component | Technology | Purpose |
|---|---|---|
| Local Inference (primary) | **Ollama** | Simplest local model management (`ollama pull`, `ollama serve`), OpenAI-compatible API, native Apple Silicon Metal support |
| Local Inference (advanced) | **llama.cpp** (direct) or **mlx-lm** | Finer-grained control over quantization, context length, batching when Ollama's abstraction is insufficient |
| High-throughput option | **vLLM** | Only relevant if/when deploying to a cloud GPU box for demo-day load testing; not used in local M5 dev loop (CUDA-only, no native Apple Silicon support) |
| Cloud fallback | **OpenRouter** API | Fallback for demo resilience if local inference is slow/unavailable during live presentation |

---

## 3. Machine Learning & Data Processing Pipelines

### 3.1 Pipeline A — Resume Parsing & Structure Extraction

```
[Uploaded PDF/DOCX]
        │
        ▼
[Docling / Marker: layout-aware extraction]
   - Detects columns, tables, headers, bullet hierarchy
   - Outputs clean Markdown + bounding-box metadata
        │
        ▼
[Section Segmentation (rule-based + regex heuristics)]
   - Split into: Contact | Summary | Experience | Education | Skills | Projects | Certifications
        │
        ▼
[Fine-tuned DeBERTa-v3 NER pass per section]
   - Entity labels: JOB_TITLE, COMPANY, DATE_RANGE, DEGREE, INSTITUTION, SKILL, METRIC
        │
        ▼
[Post-processing & Normalization]
   - Date parsing (dateparser) → ISO 8601
   - Skill canonicalization against a controlled skill taxonomy
   - Deduplication of skill mentions across sections
        │
        ▼
[Structured JSON Output] ──► persisted to PostgreSQL (resumes.parsed_json JSONB column)
```

**Structured Resume Output Schema:**

```json
{
  "candidate_id": "uuid",
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "links": [{"type": "linkedin|github|portfolio", "url": "string"}]
  },
  "summary": "string",
  "experience": [
    {
      "job_title": "string",
      "company": "string",
      "location": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM|present",
      "bullets": [
        {
          "text": "string",
          "detected_skills": ["string"],
          "has_quantified_metric": true,
          "action_verb": "string"
        }
      ]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "gpa": "string|null"
    }
  ],
  "skills": {
    "technical": ["string"],
    "tools": ["string"],
    "soft": ["string"]
  },
  "projects": [
    {"name": "string", "description": "string", "tech_stack": ["string"], "link": "string|null"}
  ],
  "certifications": [{"name": "string", "issuer": "string", "date": "YYYY-MM"}],
  "parsing_metadata": {
    "parser_confidence": 0.0,
    "parser_engine": "docling|marker",
    "ner_model_version": "string",
    "parsed_at": "ISO8601 timestamp"
  }
}
```

### 3.2 Pipeline B — ATS Match Scoring & Keyword Gap Analysis

```
[Structured Resume JSON]              [Job Description Text]
        │                                       │
        ▼                                       ▼
[Bullet-level chunking]              [JD requirement extraction]
   - One chunk per experience bullet    - LLM-assisted extraction of
   - One chunk per project bullet         required skills, years-of-exp,
                                           responsibilities, nice-to-haves
        │                                       │
        └───────────────┬───────────────────────┘
                         ▼
        [Embed all chunks: BAAI/bge-large-en-v1.5]
                         │
                         ▼
        [Cosine Similarity Matrix: resume_chunks × jd_requirements]
                         │
                         ▼
        [Thresholding & Gap Detection]
   - similarity < 0.55  → "not covered" (hard gap)
   - 0.55 ≤ sim < 0.75  → "weakly covered" (rephrase candidate)
   - sim ≥ 0.75         → "well covered"
                         │
                         ▼
        [Missing Entity Detection]
   - Set difference: JD required skills − resume detected skills
   - Weighted by frequency/emphasis in JD (LLM importance scoring)
                         │
                         ▼
        [ATS Score Aggregation]
   - overall_score = weighted avg(coverage_score, keyword_density_score,
                                   quantification_score, formatting_score)
                         │
                         ▼
        [Gap Report JSON] ──► feeds Pipeline C (generation) & Pipeline D (interview seeding)
```

**ATS Score Weighting (default configuration):**

| Sub-score | Weight | Computation |
|---|---|---|
| Semantic Coverage | 40% | Mean cosine similarity of JD requirements to best-matching resume chunk |
| Keyword Density | 25% | (Matched hard-skill keywords) / (Total hard-skill keywords in JD) |
| Quantification | 20% | % of experience bullets containing a numeric/metric token |
| Formatting/Parseability | 15% | Rule-based checks: single-column, standard section headers, no images/tables in critical sections |

### 3.3 Pipeline C — Resume Generation & Optimization

```
[Original Resume JSON] + [Gap Report JSON] + [Target JD]
                    │
                    ▼
        [LLM Rewrite Prompt Construction]
   - System prompt enforces: STAR-method bullets, active voice,
     quantified impact, JD-keyword injection (no fabrication)
   - Few-shot examples of before/after bullet rewrites
                    │
                    ▼
        [LLM Inference: Qwen2.5-7B-Instruct via Ollama]
   - Structured output mode (JSON schema-constrained generation)
                    │
                    ▼
        [Output Validation]
   - Pydantic schema validation of returned JSON
   - Fact-consistency check: no new companies/dates/degrees invented
     (diff against original entities; flag & reject hallucinated additions)
                    │
                    ▼
        [Typst Template Population]
   - Jinja-style variable substitution into .typ resume template
                    │
                    ▼
        [typst compile resume.typ -o resume.pdf]  (sub-second compile)
                    │
                    ▼
        [Final ATS-Safe PDF] ──► stored in object storage, linked to resumes.generated_pdf_url
```

**Anti-hallucination guardrail (critical for a resume-generation tool):** the rewrite prompt is explicitly constrained to *rephrase and quantify existing content*, never to invent employers, titles, dates, or credentials. The validation step diffs entity sets between the original parsed JSON and the LLM output; any new `COMPANY`, `DEGREE`, or `DATE_RANGE` entity not present in the source triggers a rejection and regeneration with a corrective prompt.

### 3.4 Pipeline D — Adaptive Role-Specific AI Interview Engine

```
[Job Role] + [Gap Report weak areas] + [Resume JSON]
                    │
                    ▼
        [System Prompt Construction]
   - Persona: senior technical interviewer for {role}
   - Injected focus areas: topics tied to gap-report weak skills
   - Interview structure: 1 intro Q, 3-5 role/behavioral Qs, 1-2 follow-ups per answer
                    │
                    ▼
        [Turn Loop — stateful, per session_id]
   ┌──────────────────────────────────────────────────────────┐
   │  1. LLM generates next question (streamed via WS)          │
   │  2. Candidate responds (text or transcribed voice via       │
   │     Whisper-small local ASR)                                │
   │  3. LLM evaluates answer:                                   │
   │       - relevance_score, structure_score (STAR),            │
   │         specificity_score, red_flags[]                      │
   │  4. LLM decides: follow-up probe OR move to next question   │
   │     (adaptive branching based on answer quality)             │
   └──────────────────────────────────────────────────────────┘
                    │
                    ▼
        [Session-End Aggregate Report]
   - Per-question scores, overall communication score,
     strengths/weaknesses summary, suggested resources
                    │
                    ▼
        [Persisted to interview_sessions + interview_turns tables]
```

**Turn-scoring output schema:**

```json
{
  "turn_id": "uuid",
  "question": "string",
  "candidate_answer": "string",
  "scores": {
    "relevance": 0.0,
    "structure_star": 0.0,
    "specificity": 0.0,
    "communication_clarity": 0.0
  },
  "feedback": "string",
  "follow_up_triggered": true,
  "red_flags": ["string"]
}
```

---

## 4. LLM Models & Open-Weights Strategy

| Function | Primary Model | Alternative | Quantization (local) |
|---|---|---|---|
| Resume Parsing / NER | Fine-tuned `DeBERTa-v3-base-NER` | `AventIQ-AI/Resume-Parsing-NER-AI-Model` | FP16 (small model, no quant needed) |
| ATS Analysis & Feedback | `Qwen2.5-7B-Instruct` | `Llama-3.1-8B-Instruct` | GGUF Q4_K_M via Ollama |
| Resume Generation & Rewriting | `Qwen2.5-7B-Instruct` | `DeepSeek-R1-Distill-Qwen-7B` | GGUF Q4_K_M |
| Interview Simulation | `DeepSeek-R1-Distill-Llama-8B` | `Qwen2.5-7B-Instruct` | GGUF Q4_K_M (Q8_0 if headroom allows) |
| Embeddings | `BAAI/bge-large-en-v1.5` | `BAAI/bge-base-en-v1.5` (lighter) | FP16 / ONNX |
| Local ASR (voice interview) | `whisper-small` (via `whisper.cpp`) | `whisper-base` | INT8 |

**Model Selection Rationale:**
- **Qwen2.5-7B-Instruct** is chosen as the default general-purpose model for its strong instruction-following and structured-JSON-output reliability at 7B scale, which matters for the schema-constrained generation used in Pipelines B/C.
- **DeepSeek-R1-Distill-Llama-8B** is preferred for interview simulation specifically because its distilled reasoning traces produce more coherent multi-step follow-up logic (deciding *whether* to probe deeper), at the cost of slightly slower generation — acceptable since interview turns are inherently paced by human response time.
- **GGUF Q4_K_M** quantization is the sweet spot for M-series laptops: ~4.5-5.5GB per 7-8B model with minimal quality degradation versus Q8_0 (~8GB), leaving headroom for concurrent services.

---

## 5. Datasets & Data Engineering Strategy

| Dataset | Source | Role in Pipeline |
|---|---|---|
| `datasetmaster/resumes` | Hugging Face | Diverse raw resume text corpus for NER fine-tuning / augmentation |
| `saugataroyarghya/resume-dataset` | Hugging Face | Additional labeled resume samples for parser robustness testing |
| `hadikp/resume-data-pdf` | Kaggle | Real-world PDF layout variety (multi-column, tables) for Docling/Marker stress-testing |
| `netsol/resume-score-details` | Hugging Face | Ground-truth ATS scoring pairs for calibrating the scoring weight function |
| `0xnbk/resume-ats-score-v1-en` | Hugging Face | Additional ATS score validation / regression testing set |
| `jacob-hugging-face/job-descriptions` | Hugging Face | JD corpus for requirement-extraction prompt tuning and embedding calibration |
| `andmev/interview-question-with-context` | Hugging Face | Seed bank for interview question generation, contextual grounding |
| `RUCAIBox/Question-Generation` | Hugging Face | Auxiliary QG training/reference data for follow-up question diversity |

**Data Engineering Notes:**
- All HF datasets should be pulled via `datasets.load_dataset(...)`, cached locally in `~/.cache/huggingface`, and versioned via a `data/manifest.json` pinning exact dataset revisions/commit hashes for reproducibility.
- The Kaggle PDF dataset requires the `kaggle` CLI with API credentials; store PDFs in `data/raw/pdfs/` and never commit raw resume PII to version control — add `data/` to `.gitignore` and use a `data/README.md` documenting acquisition steps instead.
- A held-out 15% split from `netsol/resume-score-details` and `0xnbk/resume-ats-score-v1-en` should be reserved purely for evaluating the ATS scoring formula's correlation (Spearman's ρ) against human/ground-truth scores — this becomes a concrete, gradable evaluation metric for the PBL report.

---

## 6. Hardware & Feasibility Analysis — MacBook Air M5 (24GB Unified Memory)

### 6.1 RAM Allocation Budget (24GB Unified Memory)

| Component | Estimated RAM Usage | Notes |
|---|---|---|
| macOS + background OS processes | ~4.0 GB | Typical idle-to-light-use overhead on Apple Silicon |
| Ollama-served LLM (7-8B, Q4_K_M) | ~5.0-5.5 GB | Single model resident at a time; unified memory shared with GPU cores |
| Embedding model (`bge-large-en-v1.5`, FP16) | ~1.3-1.5 GB | Loaded once, kept warm for repeated embedding calls |
| Whisper-small (INT8, ASR) | ~0.5 GB | Only resident during active voice-interview sessions |
| FastAPI + Uvicorn workers | ~0.3-0.5 GB | Lightweight async Python process |
| PostgreSQL + pgvector | ~0.5-1.0 GB | Local dev instance, small dataset scale |
| Redis + Celery workers | ~0.3-0.5 GB | Broker + 1-2 worker processes |
| Docker Desktop overhead (if containerized) | ~1.5-2.0 GB | Only if services run in Docker rather than natively |
| Next.js dev server | ~0.4-0.6 GB | Node.js process |
| **Subtotal (active dev, all services warm)** | **~14-16 GB** | |
| **Headroom remaining** | **~8-10 GB** | Buffer for browser, IDE (VS Code/Cursor), OS caching |

**Conclusion:** running the full stack simultaneously — one quantized 7-8B LLM, the embedding model, Postgres, Redis, Celery, and a Next.js dev server — fits comfortably within 24GB without touching swap, provided only **one** LLM is kept resident in memory at a time (Ollama's default behavior is to lazily load/unload models per request, which naturally enforces this).

### 6.2 Apple Silicon Acceleration

- **Metal Performance Shaders (MPS) via `llama.cpp`/Ollama:** Ollama's backend uses `llama.cpp`'s Metal kernels automatically on Apple Silicon — no manual configuration required beyond `ollama pull <model>` and `ollama run`. Matrix multiplications for attention/FFN layers are offloaded to the GPU cores.
- **`mlx-lm` alternative:** Apple's MLX framework offers a native, more memory-efficient path for M-series chips, particularly beneficial for the M5's enhanced Neural Engine; useful as a comparison benchmark (`mlx-lm` vs `llama.cpp`/Ollama tokens/sec) as an optional PBL evaluation experiment.
- **Unified Memory Architecture (UMA):** because CPU, GPU, and Neural Engine share the same memory pool, there is no PCIe transfer bottleneck between "host" and "device" memory as on discrete-GPU systems — the entire 24GB is fungibly available to whichever subsystem needs it, which is precisely why a 7-8B quantized model plus a full web-app stack coexists without OOM pressure.
- **Neural Engine usage:** Whisper.cpp can leverage Core ML-converted encoder models to route ASR inference partly through the Neural Engine, reducing CPU/GPU contention during live voice-interview sessions.

### 6.3 Local vs. Production Trade-offs

A 24GB M5 MacBook Air is **more than sufficient** for the full PBL development lifecycle:

- **Dataset processing:** All listed HF datasets are small-to-medium (tens of MB to low GB), well within disk and RAM budget for pandas/HF `datasets` in-memory operations.
- **Model inference:** A single 4-bit quantized 7-8B model achieves interactive token generation speeds (commonly 15-30+ tokens/sec on M-series unified memory) — adequate for both batch scoring tasks and live-feeling interview turns.
- **Concurrent services:** Docker Desktop *can* be used for Postgres/Redis containers if preferred for environment parity, but native Homebrew installs (`brew install postgresql@16 redis`) are recommended on a 24GB machine to reclaim the ~1.5-2GB Docker Desktop VM overhead for LLM headroom.
- **Where local stops being enough:** the local setup is a development and demo environment, not a multi-user production deployment — concurrent multi-user LLM serving at low latency would require either request queuing (acceptable for a live demo of 1-2 simultaneous users) or a move to a hosted GPU (`vLLM` on a cloud instance) for a real multi-tenant launch. This distinction is worth stating explicitly in the PBL report as a scoped limitation, not a stack deficiency.

---

## 7. Project Execution Roadmap & Milestones

### Phase 1 (Weeks 1-2): Data Pipeline & Document Parser Setup
- Set up monorepo structure (`/frontend`, `/backend`, `/ml`, `/data`), Docker Compose for Postgres+Redis, FastAPI skeleton with health-check endpoint.
- Integrate Docling/Marker; benchmark extraction accuracy against `hadikp/resume-data-pdf` sample set.
- Fine-tune or adapt DeBERTa-v3 NER on `datasetmaster/resumes` + `saugataroyarghya/resume-dataset`; establish parsing → structured JSON pipeline with the schema in §3.1.
- **Deliverable:** working `/resume/upload` endpoint returning validated structured JSON for ≥90% of test PDFs without manual correction.

### Phase 2 (Weeks 3-4): Embedding Pipeline, ATS Scoring Engine & Resume Generator
- Stand up `pgvector`-backed embedding storage; implement bullet/JD chunking + `bge-large-en-v1.5` embedding service.
- Build cosine-similarity gap-analysis logic and calibrate scoring weights against `netsol/resume-score-details` held-out split (target: Spearman's ρ ≥ 0.6 vs ground-truth scores).
- Implement the Typst templating pipeline and LLM rewrite prompt with the anti-hallucination validation step.
- **Deliverable:** `/jd/analyze` and `/resume/generate` endpoints producing a downloadable, ATS-optimized PDF end-to-end.

### Phase 3 (Weeks 5-6): Interactive Interview Agent & Dynamic Q&A Flow
- Design and test the adaptive system prompt using `andmev/interview-question-with-context` as a grounding/reference bank.
- Implement the stateful WebSocket turn loop, per-turn scoring schema, and follow-up branching logic.
- Integrate Whisper.cpp for optional voice-mode transcription.
- **Deliverable:** a runnable multi-turn interview session (text-mode minimum, voice-mode stretch goal) producing a final session report.

### Phase 4 (Weeks 7-8): Next.js UI Integration, API Deployment & End-to-End Evaluation
- Build out the four core UI flows (upload → parse review, JD paste → gap report, generation → preview/download, interview → live session UI).
- Wire SSE/WebSocket streaming for real-time LLM output in the UI.
- Conduct end-to-end evaluation: parser accuracy, ATS score correlation, generation hallucination-rejection rate, interview session usability testing with sample users.
- **Deliverable:** fully integrated demo-ready application + final PBL report documenting architecture, evaluation metrics, and scoped limitations (per §6.3).

---

*End of Specification Document.*
