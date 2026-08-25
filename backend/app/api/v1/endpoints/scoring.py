# ============================================================================
# File: backend/app/api/v1/endpoints/scoring.py
# Description: FastAPI endpoint for PDF upload, PyMuPDF parsing, vector scoring, and Gap Report
# ============================================================================

import uuid
from typing import Literal
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas.scoring import ATSGapReportResponse, ParsedSectionDTO
from app.services.pdf_parser import PDFResumeParser
from app.services.embeddings import embedding_engine
from app.services.ai_router import HybridLLMRouter, RoutingMode
from app.services.ats_scorer import ATSScoringEngine
from app.services.r2_storage import r2_storage

router = APIRouter(prefix="/resume", tags=["Resume & ATS Scoring"])

# Initialize services
ai_router = HybridLLMRouter()
scoring_engine = ATSScoringEngine(ai_router=ai_router)

@router.post(
    "/score",
    response_model=ATSGapReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload PDF Resume, Extract Sections, & Compute ATS Gap Analysis",
)
async def score_resume_pdf(
    file: UploadFile = File(..., description="Binary PDF Resume File"),
    job_title: str = Form(..., description="Target Job Title (e.g. Senior Frontend Engineer)"),
    job_description_raw: str = Form(..., description="Raw text of the target Job Description"),
    routing_mode: Literal["cloud", "local"] = Form("cloud", description="'cloud' (Gemini) or 'local' (LM Studio)"),
):
    """
    Complete Pipeline Execution:
    1. Validation: Verifies PDF MIME type and non-empty parameters.
    2. Extraction: Reads binary stream in-memory via PyMuPDF (`fitz`), segmenting into sections.
    3. Storage: (Optional) Uploads binary blob to Cloudflare R2 if cloud credentials exist.
    4. Extraction of JD Requirements: Uses LLM or deterministic regex to extract atomic expectations.
    5. Vector Matching: Computes 384-d Cosine Similarity Matrix using BAAI/bge-small-en-v1.5.
    6. Gap Synthesis: Synthesizes structured JSON report and returns to Next.js client.
    """
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid PDF document.",
        )

    if len(job_description_raw.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description must contain at least 20 characters of detail.",
        )

    try:
        # Step 1: Read PDF into memory buffer
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDF file is empty.",
            )

        # Step 2: Parse PDF using PyMuPDF
        parse_result = PDFResumeParser.extract_from_bytes(pdf_bytes)
        if not parse_result.sections or not parse_result.full_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract readable text from PDF. Ensure it is not an image-only scan.",
            )

        parsed_dtos = [
            ParsedSectionDTO(section_type=sec.section_type, content=sec.content)
            for sec in parse_result.sections
        ]

        # Step 3: Optional Cloudflare R2 Upload (Skipped in local privacy mode)
        r2_url = None
        if routing_mode == "cloud":
            file_key = f"resumes/{uuid.uuid4()}-{file.filename}"
            r2_url = await r2_storage.upload_pdf(pdf_bytes, file_key)

        # Step 4: Extract requirements from JD
        selected_mode = RoutingMode.CLOUD if routing_mode == "cloud" else RoutingMode.LOCAL
        requirements = await scoring_engine.extract_requirements_from_jd(
            job_description=job_description_raw,
            mode=selected_mode,
        )

        # Step 5: Compute ATS Score and LLM Gap Matrix
        report = await scoring_engine.compute_scoring_pipeline(
            parsed_sections=parsed_dtos,
            job_requirements=requirements,
            mode=selected_mode,
            pdf_r2_url=r2_url,
        )

        return report

    except HTTPException:
        raise
    except ConnectionError as conn_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(conn_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS Scoring Pipeline Failure: {str(err)}",
        )
