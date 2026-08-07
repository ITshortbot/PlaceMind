# 🎬 PlaceMind Live Demonstration Script

This document details the step-by-step walkthrough for presenting the PlaceMind AI platform during a live demonstration or defense.

## 📋 Pre-Demo Checklist

1. **Verify Services**: Run `./start.sh` or `npm run dev` in terminal and confirm all 4 docker containers (Postgres, Redis, MinIO) and servers are running.
2. **Access App**: Open `http://localhost:3000` in Google Chrome or Arc.
3. **API Docs**: Open `http://localhost:8000/docs` in a secondary tab.

---

## 🚀 Live Demo Step-by-Step Flow

### Stage 1: Pipeline A — Resume Upload & Layout Parsing
1. Navigate to the **1. Upload & Ingest** tab.
2. Drag and drop a sample candidate PDF resume.
3. Paste a target Job Description (e.g., Senior Full Stack Engineer at TechCorp).
4. Click **Analyze Candidate Match**.
5. *Highlight to Audience*: Point out how Docling extracts structural layout while DeBERTa NER parses entity categories (companies, skills, metrics).

### Stage 2: Pipeline B — ATS Gap Analysis Engine
1. The app automatically transitions to the **2. ATS Gap Matrix** tab.
2. *Highlight to Audience*:
   - View the overall composite **ATS Match Score** (e.g., 78%).
   - Show the 4 weighted subscores: Semantic Coverage (40%), Keyword Density (25%), Quantified Impact (20%), and Format Parseability (15%).
   - Inspect the **Missing Hard Skills** pills generated via pgvector cosine distance `<=>`.
   - Point out the per-requirement coverage badges (`well_covered`, `weakly_covered`, `not_covered`).

### Stage 3: Pipeline C — STAR Method Resume Rewrite & Typst PDF Compiler
1. Click on the **3. PDF Generator** tab.
2. Click **Generate Tailored Resume PDF**.
3. *Highlight to Audience*: Explain that Ollama LLM rewrites experience bullets using the STAR method, injects missing skills, passes the Anti-Hallucination Guard, and compiles a single-column PDF via Typst.
4. Click **Download Compiled PDF** to open the generated PDF.

### Stage 4: Pipeline D — Adaptive AI Mock Interviewer
1. Click on the **4. Live AI Interview** tab.
2. Click **Start Mock Interview Session**.
3. *Highlight to Audience*:
   - Watch the LLM stream questions token-by-token over WebSockets.
   - Type a response to the question.
   - Show the real-time STAR structure & specificity evaluation badge appearing after submission.
   - Submit answers to complete the session and view the **Session-End Aggregate Report** (communication score, feedback, growth areas).

---

## ⚡ Fallback Options

If local Ollama inference is slow on the host laptop:
```bash
export LLM_PROVIDER=openrouter
export OPENROUTER_API_KEY=your_key_here
```
The backend automatically fails over seamlessly to OpenRouter Cloud API.
