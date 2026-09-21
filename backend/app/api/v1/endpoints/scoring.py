# ============================================================================
# File: backend/app/api/v1/endpoints/scoring.py
# Description: FastAPI endpoint for PDF upload, PyMuPDF parsing, vector scoring, and Gap Report
# ============================================================================

import uuid
import json
from typing import Literal
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.scoring import ATSGapReportResponse, ParsedSectionDTO
from app.services.pdf_parser import PDFResumeParser
from app.services.embeddings import embedding_engine
from app.services.ai_router import HybridLLMRouter, RoutingMode
from app.services.ats_scorer import ATSScoringEngine
from app.services.r2_storage import r2_storage
from app.database.session import get_db
from app.database.models import Resume, ResumeSection, JobDescription, JobRequirement, ATSMatchScore, User

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
    db: AsyncSession = Depends(get_db),
):
    """
    Complete Pipeline Execution:
    1. Validation: Verifies PDF MIME type and non-empty parameters.
    2. Extraction: Reads binary stream in-memory via PyMuPDF (`fitz`), segmenting into sections.
    3. Storage: (Optional) Uploads binary blob to Cloudflare R2 if cloud credentials exist.
    4. Extraction of JD Requirements: Uses LLM or deterministic regex to extract atomic expectations.
    5. Vector Matching: Computes 384-d Cosine Similarity Matrix using BAAI/bge-small-en-v1.5.
    6. DB Persistence: Saves resume, sections, JD, requirements, and match scores to PostgreSQL.
    7. Gap Synthesis: Synthesizes structured JSON report and returns to Next.js client.
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

        # Step 5: Compute ATS Score and LLM Gap Matrix (now with structure scoring)
        report = await scoring_engine.compute_scoring_pipeline(
            parsed_sections=parsed_dtos,
            job_requirements=requirements,
            mode=selected_mode,
            pdf_r2_url=r2_url,
            extracted_email=parse_result.extracted_email,
            extracted_phone=parse_result.extracted_phone,
            page_count=parse_result.page_count,
        )

        # Step 6: Persist to Database (non-blocking - silently skip on DB errors)
        try:
            # Create an anonymous user for the session
            anon_email = f"anonymous-{uuid.uuid4()}@placemind.local"
            db_user = User(email=anon_email, full_name="Anonymous", is_local_only=(routing_mode == "local"))
            db.add(db_user)
            await db.flush()

            # Save resume record
            db_resume = Resume(
                user_id=db_user.id,
                file_name=file.filename,
                r2_storage_key=r2_url,
                raw_text=parse_result.full_text,
                parsed_metadata={
                    "email": parse_result.extracted_email,
                    "phone": parse_result.extracted_phone,
                    "page_count": parse_result.page_count,
                },
            )
            db.add(db_resume)
            await db.flush()

            # Save resume sections with embeddings
            section_texts = [f"[{s.section_type.upper()}] {s.content}" for s in parsed_dtos]
            section_vectors = embedding_engine.embed_documents(section_texts)
            for idx, sec in enumerate(parse_result.sections):
                db_section = ResumeSection(
                    resume_id=db_resume.id,
                    section_type=sec.section_type,
                    content=sec.content,
                    embedding=section_vectors[idx],
                )
                db.add(db_section)

            # Save job description
            db_jd = JobDescription(
                user_id=db_user.id,
                title=job_title,
                raw_text=job_description_raw,
            )
            db.add(db_jd)
            await db.flush()

            # Save extracted requirements with embeddings
            req_vectors = embedding_engine.embed_documents(requirements)
            for idx, req_text in enumerate(requirements):
                db_req = JobRequirement(
                    job_id=db_jd.id,
                    requirement_text=req_text,
                    embedding=req_vectors[idx],
                )
                db.add(db_req)

            # Save match score record
            gap_report_json = [item.model_dump() for item in report.gap_matrix]
            db_score = ATSMatchScore(
                resume_id=db_resume.id,
                job_id=db_jd.id,
                overall_score=report.overall_score,
                semantic_score=report.semantic_score,
                keyword_score=report.keyword_score,
                routing_mode=routing_mode,
                gap_report={
                    "gap_matrix": gap_report_json,
                    "missing_keywords": report.missing_keywords,
                    "actionable_bullets": report.actionable_bullet_points,
                    "structure_score": report.structure_score,
                },
                processing_time_ms=report.processing_metadata.latency_ms,
            )
            db.add(db_score)
            await db.commit()

        except Exception as db_err:
            await db.rollback()
            # DB errors are non-fatal; scoring result is still returned
            import logging
            logging.getLogger("placemind.scoring").warning(f"DB persistence skipped: {db_err}")

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
