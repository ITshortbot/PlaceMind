# ============================================================================
# File: backend/app/api/v1/endpoints/ats.py
# Description: ATS Document Readiness endpoint evaluating structural,
#              formatting, keyword, and semantic parameters.
# ============================================================================

from fastapi import APIRouter, status
from app.schemas.ats_rules import ScoreDocRequest, ScoreDocResponse
from app.services.ats_rules import compute_ats_readiness

router = APIRouter(prefix="/ats", tags=["ATS Readiness"])


@router.post(
    "/score-doc",
    response_model=ScoreDocResponse,
    status_code=status.HTTP_200_OK,
    summary="Score resume document for ATS readiness and get actionable fixes",
)
async def score_resume_doc(request: ScoreDocRequest) -> ScoreDocResponse:
    """
    Evaluates resume content, layout specifications, and optional job description
    against standard ATS parsing rules and returns deterministic readiness metrics.
    """
    return compute_ats_readiness(
        content=request.content,
        style=request.style,
        jd_text=request.jd_text,
    )
