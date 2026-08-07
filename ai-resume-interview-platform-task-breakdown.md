# AI-Based Interview & Resume Intelligence Platform
## Granular Task Breakdown (for Agentic Coding Prompt Generation)

**Purpose of this document:** each ticket below is scoped to be a *single, self-contained unit of implementation work* — small enough that one prompt to an agentic coding assistant (e.g. Claude Opus inside an agentic IDE) should be able to complete it in one focused session, with a clear definition of done. Feed each ticket (or a small cluster of related tickets) to Gemini to expand into a full implementation prompt.

**How to use this with Gemini → Claude Opus:**
1. Pick one ticket (or a tightly related pair, e.g. "T-102 + T-103").
2. Give Gemini: the ticket below + the relevant excerpt of the architecture spec (§ references included per ticket) + your repo's current file tree.
3. Ask Gemini to produce a prompt containing: task goal, exact file paths to create/modify, the schema/interfaces it must conform to, acceptance criteria, and explicit "do not" boundaries (e.g. "do not modify unrelated files", "do not add new dependencies without listing them").
4. Feed that generated prompt to Claude Opus in your agentic coding environment.

Each ticket includes: **Goal**, **Depends on**, **Inputs**, **Outputs**, **Acceptance Criteria**, **Suggested files**, and a **Spec ref** back to the architecture document section.

---

## EPIC 0 — Repo & Environment Bootstrap

### T-001: Monorepo scaffold
- **Goal:** Create the base monorepo structure with `/frontend`, `/backend`, `/ml`, `/data`, `/infra`, root `README.md`, `.gitignore` (excluding `data/raw`, `.env`, model weights, `__pycache__`, `node_modules`).
- **Depends on:** none
- **Inputs:** none
- **Outputs:** empty-but-runnable folder skeletons, root `docker-compose.yml` stub (Postgres + Redis services only, no app containers yet)
- **Acceptance criteria:** `docker compose up postgres redis` starts both services cleanly; `tree -L 2` matches the agreed layout.
- **Suggested files:** `/docker-compose.yml`, `/.gitignore`, `/README.md`
- **Spec ref:** §2 (Tech Stack)

### T-002: Backend Python project init
- **Goal:** Initialize FastAPI project with `pyproject.toml` (or `requirements.txt`), Uvicorn entrypoint, `/health` endpoint, Pydantic v2 settings module reading from `.env`.
- **Depends on:** T-001
- **Outputs:** `backend/app/main.py`, `backend/app/core/config.py`, `GET /health` returns `{"status": "ok"}`
- **Acceptance criteria:** `uvicorn app.main:app --reload` runs; `/health` returns 200.
- **Suggested files:** `backend/app/main.py`, `backend/app/core/config.py`, `backend/pyproject.toml`
- **Spec ref:** §2.2

### T-003: Frontend Next.js project init
- **Goal:** Scaffold Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui base install, one placeholder landing page.
- **Depends on:** T-001
- **Outputs:** working `npm run dev` on port 3000
- **Acceptance criteria:** landing page renders with Tailwind styles applied.
- **Suggested files:** `frontend/app/page.tsx`, `frontend/tailwind.config.ts`
- **Spec ref:** §2.1

### T-004: Postgres schema + Alembic migrations init
- **Goal:** Define initial SQLAlchemy 2.0 async models for `users`, `resumes`, `job_descriptions`, `interview_sessions`, `interview_turns`; enable `pgvector` extension; first Alembic migration.
- **Depends on:** T-002
- **Outputs:** `alembic upgrade head` creates all tables including a `vector(1024)` column on a `resume_embeddings` table
- **Acceptance criteria:** migration runs clean on fresh DB; rollback (`alembic downgrade -1`) works.
- **Suggested files:** `backend/app/models/*.py`, `backend/alembic/versions/0001_init.py`
- **Spec ref:** §2.3, §3.1 (schema), §3.4 (schema)

### T-005: Redis + Celery wiring
- **Goal:** Configure Celery app with Redis broker/backend, one trivial test task (`ping`), and a worker Docker Compose service.
- **Depends on:** T-002
- **Outputs:** `celery -A app.worker worker --loglevel=info` runs and processes the `ping` task from a FastAPI-triggered call.
- **Acceptance criteria:** hitting a `/debug/ping-task` endpoint returns a Celery task ID, and polling shows `SUCCESS` within 2s.
- **Suggested files:** `backend/app/worker.py`, `backend/app/tasks/debug.py`
- **Spec ref:** §2.2, §1.2 (async task queue layer)

### T-006: Local model runtime setup (Ollama)
- **Goal:** Document + script the pulling of `qwen2.5:7b-instruct-q4_K_M` and `deepseek-r1-distill-llama:8b-q4_K_M` via Ollama; write a thin Python client wrapper (`backend/app/ml/llm_client.py`) around the Ollama OpenAI-compatible endpoint.
- **Depends on:** T-002
- **Outputs:** `llm_client.chat(messages, model=...)` returns a completion; `llm_client.chat_json(messages, schema)` returns schema-validated JSON (retry-on-invalid loop, max 2 retries)
- **Acceptance criteria:** a manual smoke test script produces a valid completion from both models.
- **Suggested files:** `backend/app/ml/llm_client.py`, `scripts/setup_ollama_models.sh`
- **Spec ref:** §2.5, §6.2

---

## EPIC 1 — Pipeline A: Resume Parsing & Structure Extraction

### T-101: Object storage integration
- **Goal:** Add local MinIO (S3-compatible) service to Docker Compose; implement `backend/app/storage/object_store.py` with `upload_file`, `get_presigned_url`, `delete_file`.
- **Depends on:** T-001
- **Acceptance criteria:** unit test uploads a dummy file and retrieves it via presigned URL.
- **Suggested files:** `backend/app/storage/object_store.py`, `docker-compose.yml` (minio service)
- **Spec ref:** §1.2 (persistence layer)

### T-102: `/resume/upload` endpoint + Celery enqueue
- **Goal:** Multipart upload endpoint that stores the raw file, creates a `resumes` row with `status=pending`, enqueues `parse_resume` Celery task, returns `{resume_id, status}`.
- **Depends on:** T-004, T-005, T-101
- **Acceptance criteria:** POST with a sample PDF returns 202 + resume_id; DB row exists with `status=pending`.
- **Suggested files:** `backend/app/api/v1/resume.py`, `backend/app/tasks/parsing.py`
- **Spec ref:** §1.2, §3.1

### T-103: Docling/Marker extraction wrapper
- **Goal:** Implement `backend/app/ml/document_parser.py::extract_layout_text(file_path) -> ParsedDocument` using Docling (fallback to Marker if Docling fails on a given file), returning Markdown text + section boundary hints.
- **Depends on:** T-002
- **Acceptance criteria:** running against 5 sample resumes (1 single-column, 1 two-column, 1 with a table, 1 scanned/OCR, 1 minimal) returns non-empty structured Markdown for all 5.
- **Suggested files:** `backend/app/ml/document_parser.py`, `tests/ml/test_document_parser.py`
- **Spec ref:** §3.1

### T-104: Section segmentation heuristics
- **Goal:** Implement `segment_sections(markdown_text) -> Dict[str, str]` splitting into Contact/Summary/Experience/Education/Skills/Projects/Certifications using header regex + fallback keyword scoring.
- **Depends on:** T-103
- **Acceptance criteria:** ≥90% section-boundary accuracy on a 20-resume manually-labeled dev set (include the labeled set as a fixture).
- **Suggested files:** `backend/app/ml/section_segmenter.py`, `tests/fixtures/labeled_sections.json`
- **Spec ref:** §3.1

### T-105: NER model integration (DeBERTa-v3)
- **Goal:** Load a pretrained/fine-tuned DeBERTa-v3 NER pipeline (HF `transformers`) tagging JOB_TITLE, COMPANY, DATE_RANGE, DEGREE, INSTITUTION, SKILL, METRIC; wrap in `backend/app/ml/ner_extractor.py::extract_entities(section_text) -> List[Entity]`.
- **Depends on:** T-104
- **Acceptance criteria:** entity extraction on the Experience section of the fixture set achieves ≥80% F1 against manually labeled entities (small eval script included).
- **Suggested files:** `backend/app/ml/ner_extractor.py`, `ml/eval/eval_ner.py`
- **Spec ref:** §3.1, §4

### T-106: NER fine-tuning script (optional/stretch)
- **Goal:** Standalone training script fine-tuning `deberta-v3-base` on `datasetmaster/resumes` + `saugataroyarghya/resume-dataset`, saving checkpoint to `ml/checkpoints/`.
- **Depends on:** T-105
- **Acceptance criteria:** training completes locally in <2hrs on M5 CPU/MPS; eval F1 on held-out split logged to `ml/checkpoints/eval_report.json`.
- **Suggested files:** `ml/training/finetune_ner.py`, `ml/data/prepare_ner_dataset.py`
- **Spec ref:** §4, §5

### T-107: Normalization & JSON assembly
- **Goal:** Implement `backend/app/ml/resume_normalizer.py::build_structured_resume(entities, sections) -> ResumeSchema` producing the exact JSON schema from spec §3.1, including date parsing via `dateparser`, skill canonicalization against a controlled taxonomy (`backend/app/ml/skill_taxonomy.json`), and dedup.
- **Depends on:** T-105
- **Acceptance criteria:** output validates against the Pydantic `ResumeSchema` for all 20 fixture resumes with zero validation errors.
- **Suggested files:** `backend/app/ml/resume_normalizer.py`, `backend/app/schemas/resume.py`, `backend/app/ml/skill_taxonomy.json`
- **Spec ref:** §3.1 (JSON schema block)

### T-108: `parse_resume` Celery task — full pipeline wiring
- **Goal:** Wire T-103→T-107 into a single Celery task that updates `resumes.parsed_json`, `resumes.status`, and `resumes.parser_confidence` on completion; handle and log parse failures gracefully (`status=failed`, error message stored).
- **Depends on:** T-102, T-107
- **Acceptance criteria:** end-to-end: upload → poll `/resume/{id}/status` → `status=complete` with populated `parsed_json` within 30s for a typical 1-page resume.
- **Suggested files:** `backend/app/tasks/parsing.py`, `backend/app/api/v1/resume.py`
- **Spec ref:** §3.1, §1.2

---

## EPIC 2 — Pipeline B: ATS Match Scoring & Gap Analysis

### T-201: JD ingestion endpoint
- **Goal:** `/jd/submit` endpoint accepting raw JD text or URL (fetch + strip HTML via `trafilatura`), persist to `job_descriptions` table.
- **Depends on:** T-004
- **Acceptance criteria:** submitting a plain-text JD and a JD URL both produce a `job_descriptions` row with clean text.
- **Suggested files:** `backend/app/api/v1/job_description.py`

### T-202: JD requirement extraction (LLM-assisted)
- **Goal:** `backend/app/ml/jd_extractor.py::extract_requirements(jd_text) -> JDRequirements` calling the LLM with a schema-constrained prompt to extract required skills, years-of-exp, responsibilities, nice-to-haves.
- **Depends on:** T-006, T-201
- **Acceptance criteria:** returns valid JSON matching `JDRequirements` Pydantic schema for 10 sample JDs from `jacob-hugging-face/job-descriptions`.
- **Suggested files:** `backend/app/ml/jd_extractor.py`, `backend/app/schemas/jd.py`
- **Spec ref:** §3.2, §5

### T-203: Embedding service
- **Goal:** `backend/app/ml/embedding_service.py::embed_texts(List[str]) -> List[np.ndarray]` wrapping `BAAI/bge-large-en-v1.5` (via `sentence-transformers`, MPS device if available), with batching and Redis-backed caching keyed by text hash.
- **Depends on:** T-005
- **Acceptance criteria:** embedding 100 short texts completes in <5s on M5; identical text returns cached vector on second call (verified via cache-hit log/metric).
- **Suggested files:** `backend/app/ml/embedding_service.py`
- **Spec ref:** §3.2, §6.1

### T-204: pgvector storage + similarity query
- **Goal:** Implement storage of resume-bullet and JD-requirement embeddings into `resume_embeddings`/`jd_embeddings` tables (`vector(1024)`), and a cosine-similarity SQL query (`<=>` operator with HNSW index) returning top matches.
- **Depends on:** T-004, T-203
- **Acceptance criteria:** given 20 resume bullets and 10 JD requirements, similarity query returns a 20×10 matrix matching a NumPy-computed reference matrix within 1e-4 tolerance.
- **Suggested files:** `backend/app/db/vector_queries.py`, `backend/app/models/embeddings.py`
- **Spec ref:** §3.2, §2.3

### T-205: Gap analysis & scoring aggregation
- **Goal:** `backend/app/ml/ats_scorer.py::score_resume_against_jd(resume, jd_requirements, similarity_matrix) -> ATSGapReport` implementing the exact weighting formula from spec §3.2 (40/25/20/15 split), producing per-requirement coverage labels (not_covered/weakly_covered/well_covered).
- **Depends on:** T-202, T-204
- **Acceptance criteria:** unit tests cover all three coverage-label thresholds; overall_score is deterministic given fixed inputs (snapshot test).
- **Suggested files:** `backend/app/ml/ats_scorer.py`, `backend/app/schemas/gap_report.py`
- **Spec ref:** §3.2 (full pipeline + weighting table)

### T-206: Calibration eval against ground-truth datasets
- **Goal:** `ml/eval/eval_ats_scoring.py` computing Spearman's ρ between `ats_scorer` output and the held-out 15% splits of `netsol/resume-score-details` + `0xnbk/resume-ats-score-v1-en`.
- **Depends on:** T-205
- **Acceptance criteria:** script outputs ρ ≥ 0.6 (or documents current value + tuning notes if below target); results written to `ml/eval/reports/ats_calibration.json`.
- **Suggested files:** `ml/eval/eval_ats_scoring.py`
- **Spec ref:** §5, §7 Phase 2 deliverable

### T-207: `/jd/analyze` endpoint — full wiring
- **Goal:** Orchestrate T-201→T-205 into one Celery task + polling endpoint, storing the `ATSGapReport` on the `job_descriptions` (or a join table `resume_jd_matches`).
- **Depends on:** T-108, T-205
- **Acceptance criteria:** end-to-end: upload resume + submit JD → `/jd/analyze` → poll → gap report JSON returned with all fields populated.
- **Suggested files:** `backend/app/api/v1/job_description.py`, `backend/app/tasks/scoring.py`

---

## EPIC 3 — Pipeline C: Resume Generation & Optimization

### T-301: Rewrite prompt construction + few-shot library
- **Goal:** `backend/app/ml/resume_rewriter.py::build_rewrite_prompt(resume, gap_report, jd)` assembling the system prompt with STAR-method/active-voice/quantification instructions and a curated few-shot before/after bullet-rewrite example set (`backend/app/ml/prompts/rewrite_fewshot.json`).
- **Depends on:** T-107, T-205
- **Acceptance criteria:** prompt unit-tested to include all required constraint clauses (checked via string assertions) and correctly interpolates gap-report weak areas.
- **Suggested files:** `backend/app/ml/resume_rewriter.py`, `backend/app/ml/prompts/rewrite_fewshot.json`
- **Spec ref:** §3.3

### T-302: LLM rewrite call + schema-constrained output
- **Goal:** Call `llm_client.chat_json` with the Pipeline-C prompt, validating against `RewrittenResumeSchema` (same shape as `ResumeSchema` but bullets replaced with optimized text).
- **Depends on:** T-006, T-301
- **Acceptance criteria:** 10 test runs across varied resumes produce schema-valid output on first or second (retry) attempt ≥95% of the time.
- **Suggested files:** `backend/app/ml/resume_rewriter.py` (extend), `backend/app/schemas/resume.py`

### T-303: Anti-hallucination validator
- **Goal:** `backend/app/ml/hallucination_guard.py::validate_no_new_entities(original, rewritten) -> ValidationResult` diffing COMPANY/DEGREE/DATE_RANGE/INSTITUTION entity sets, flagging any addition not present in source; on failure, trigger one corrective regeneration with an explicit "you invented X" follow-up prompt.
- **Depends on:** T-302, T-105
- **Acceptance criteria:** adversarial test where the LLM is prompted to fabricate a company name is caught and rejected 100% of the time in a 10-run test.
- **Suggested files:** `backend/app/ml/hallucination_guard.py`, `tests/ml/test_hallucination_guard.py`
- **Spec ref:** §3.3 (anti-hallucination guardrail)

### T-304: Typst template authoring
- **Goal:** Author a base ATS-safe single-column `.typ` resume template (`backend/templates/resume_base.typ`) with placeholder variables matching `ResumeSchema` field names.
- **Depends on:** none (parallelizable)
- **Acceptance criteria:** `typst compile` on a hand-filled sample produces a clean, single-column PDF with no rendering errors.
- **Suggested files:** `backend/templates/resume_base.typ`

### T-305: JSON → Typst population + compile subprocess wrapper
- **Goal:** `backend/app/ml/pdf_compiler.py::render_resume_pdf(resume_json, template_path) -> pdf_bytes` — populates the `.typ` template (string templating or Typst's own data-injection via a generated `.json` sidecar + `sys.inputs`) and shells out to `typst compile`.
- **Depends on:** T-304, T-302
- **Acceptance criteria:** given 5 varied `RewrittenResumeSchema` payloads, all 5 compile to valid, openable PDFs in <1s each.
- **Suggested files:** `backend/app/ml/pdf_compiler.py`

### T-306: `/resume/generate` endpoint — full wiring
- **Goal:** Orchestrate T-301→T-305 as a Celery task; store the resulting PDF via `object_store`, save URL to `resumes.generated_pdf_url`.
- **Depends on:** T-207, T-305
- **Acceptance criteria:** end-to-end: given an uploaded resume + analyzed JD, `/resume/generate` returns a downloadable PDF URL within 20s.
- **Suggested files:** `backend/app/api/v1/resume.py`, `backend/app/tasks/generation.py`

---

## EPIC 4 — Pipeline D: Adaptive AI Interview Engine

### T-401: Interview session state model
- **Goal:** Define `interview_sessions` / `interview_turns` SQLAlchemy models (session status, role, gap-report reference, turn history) — extend T-004 migration if needed.
- **Depends on:** T-004
- **Acceptance criteria:** migration adds tables cleanly; a session row can be created and retrieved via a repository class.
- **Suggested files:** `backend/app/models/interview.py`

### T-402: Adaptive system prompt builder
- **Goal:** `backend/app/ml/interview_prompt_builder.py::build_system_prompt(role, gap_report, resume) -> str` injecting role persona, weak-area focus topics, and structural instructions (1 intro Q, 3-5 role/behavioral Qs, 1-2 follow-ups per answer).
- **Depends on:** T-205
- **Acceptance criteria:** unit test asserts weak-skill terms from a sample gap report appear in the generated prompt.
- **Suggested files:** `backend/app/ml/interview_prompt_builder.py`
- **Spec ref:** §3.4

### T-403: WebSocket turn loop — question generation
- **Goal:** `/ws/interview/{session_id}` endpoint: on connect, stream the first LLM-generated question token-by-token; persist as an `interview_turns` row.
- **Depends on:** T-006, T-401, T-402
- **Acceptance criteria:** connecting a WS test client receives a streamed question and the DB row is created with `question` populated.
- **Suggested files:** `backend/app/api/v1/interview_ws.py`

### T-404: Answer scoring (text-mode)
- **Goal:** `backend/app/ml/answer_scorer.py::score_answer(question, answer, context) -> TurnScore` matching the exact schema in spec §3.4 (relevance, structure_star, specificity, communication_clarity, feedback, red_flags).
- **Depends on:** T-403
- **Acceptance criteria:** schema-valid output on 10 test Q&A pairs; scores are deterministic-enough for snapshot testing (temperature=0 for scoring calls).
- **Suggested files:** `backend/app/ml/answer_scorer.py`

### T-405: Adaptive follow-up branching logic
- **Goal:** After scoring, decide `follow_up_triggered` based on a threshold (e.g. `specificity < 0.5` OR `structure_star < 0.5`) and generate either a probing follow-up or the next planned question.
- **Depends on:** T-404
- **Acceptance criteria:** unit test with a deliberately vague mock answer triggers a follow-up; a strong mock answer proceeds to the next question.
- **Suggested files:** `backend/app/ml/interview_orchestrator.py`
- **Spec ref:** §3.4

### T-406: Voice mode — Whisper.cpp ASR integration
- **Goal:** `backend/app/ml/asr_service.py::transcribe(audio_bytes) -> str` wrapping `whisper.cpp` (whisper-small, INT8) for local transcription of WebRTC-captured audio chunks.
- **Depends on:** T-403
- **Acceptance criteria:** transcribing a 15s sample audio clip returns text with reasonable WER (manually spot-checked); latency <3s on M5.
- **Suggested files:** `backend/app/ml/asr_service.py`
- **Spec ref:** §2.5, §6.2

### T-407: Session-end aggregate report
- **Goal:** `backend/app/ml/interview_report.py::aggregate_session(session_id) -> SessionReport` computing overall communication score, strengths/weaknesses summary (LLM-generated), suggested resources.
- **Depends on:** T-404
- **Acceptance criteria:** given a completed mock session with 5 turns, endpoint `/interview/{id}/report` returns a populated `SessionReport`.
- **Suggested files:** `backend/app/ml/interview_report.py`, `backend/app/api/v1/interview.py`

---

## EPIC 5 — Frontend Integration

### T-501: Resume upload UI + status polling
- **Goal:** Drag-and-drop upload component (`frontend/app/(dashboard)/upload/page.tsx`) calling `/resume/upload`, polling `/resume/{id}/status`, showing a progress state, then a structured-JSON preview (collapsible sections).
- **Depends on:** T-108
- **Acceptance criteria:** manual QA: upload a PDF, see live status transition pending→processing→complete, view parsed sections.
- **Suggested files:** `frontend/app/(dashboard)/upload/page.tsx`, `frontend/lib/api/resume.ts`

### T-502: JD input + gap report UI
- **Goal:** JD paste/URL form + rendered gap report (coverage badges per requirement, missing-keyword chips, overall score gauge).
- **Depends on:** T-207
- **Suggested files:** `frontend/app/(dashboard)/jd/page.tsx`, `frontend/components/GapReportView.tsx`

### T-503: Resume generation + PDF preview/download UI
- **Goal:** "Generate optimized resume" button → polls generation task → embeds `react-pdf` preview + download button.
- **Depends on:** T-306
- **Suggested files:** `frontend/app/(dashboard)/generate/page.tsx`, `frontend/components/PdfPreview.tsx`

### T-504: Live interview room UI (text mode)
- **Goal:** Chat-style interview UI over WebSocket: streamed question display, answer textarea, per-turn score reveal after submission, session progress indicator.
- **Depends on:** T-403, T-404
- **Suggested files:** `frontend/app/(dashboard)/interview/[sessionId]/page.tsx`, `frontend/hooks/useInterviewSocket.ts`

### T-505: Voice mode UI (WebRTC capture)
- **Goal:** Add mic-record button using `MediaRecorder API`, chunked audio upload over the same WS channel, visual recording indicator, transcript display once ASR returns.
- **Depends on:** T-406, T-504
- **Suggested files:** `frontend/components/VoiceRecorder.tsx`

### T-506: Session report dashboard
- **Goal:** Post-interview summary page: per-question score breakdown (charts via `recharts`), strengths/weaknesses text, suggested resources list.
- **Depends on:** T-407
- **Suggested files:** `frontend/app/(dashboard)/interview/[sessionId]/report/page.tsx`

---

## EPIC 6 — Evaluation, Hardening & Demo Readiness

### T-601: End-to-end integration test suite
- **Goal:** `tests/e2e/test_full_flow.py` — scripted flow: upload → analyze → generate → interview → report, asserting each stage's contract.
- **Depends on:** T-108, T-207, T-306, T-407

### T-602: Parser accuracy report
- **Goal:** Aggregate T-104/T-105/T-107 eval outputs into a single `reports/parser_accuracy.md` for the PBL writeup.
- **Depends on:** T-104, T-105, T-107

### T-603: Hallucination-rejection rate report
- **Goal:** Run T-303's validator across 50 generation attempts, log rejection/regeneration rate to `reports/hallucination_guard.md`.
- **Depends on:** T-303

### T-604: Load/latency benchmark on M5
- **Goal:** `scripts/benchmark_local.py` measuring tokens/sec for both LLMs, embedding throughput, and end-to-end latency per pipeline stage; results feed spec §6.
- **Depends on:** T-006, T-203

### T-605: Demo script + fallback-to-OpenRouter switch
- **Goal:** Env-var-driven toggle (`LLM_PROVIDER=ollama|openrouter`) so the demo can fail over to a cloud API if local inference stalls live; write `DEMO_SCRIPT.md` walking through the 4-flow demo.
- **Depends on:** T-006, T-601

---

## Suggested Grouping for Prompt Batches

If feeding this to Gemini in batches rather than one ticket at a time, these clusters make coherent single "sessions" of agentic work:

| Batch | Tickets | Theme |
|---|---|---|
| 1 | T-001 → T-006 | Bootstrap everything, get a runnable skeleton |
| 2 | T-101 → T-108 | Full resume parsing pipeline, upload to structured JSON |
| 3 | T-201 → T-207 | ATS scoring end-to-end |
| 4 | T-301 → T-306 | Resume generation + PDF compilation |
| 5 | T-401 → T-407 | Interview engine (text mode first, then T-406 voice as a stretch) |
| 6 | T-501 → T-506 | Frontend, one page per batch item |
| 7 | T-601 → T-605 | Evaluation + demo hardening (do last, near week 7-8) |

**Note on scoping prompts for Claude Opus specifically:** each generated prompt should explicitly state (a) the exact files it's allowed to touch, (b) the schema/interface contracts from the tickets above that must not be broken, and (c) that it should stop and ask rather than silently redesigning an already-defined interface from an earlier ticket — this keeps a multi-session agentic build internally consistent as tickets are completed out of order across sessions.
