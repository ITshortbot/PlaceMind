# ============================================================================
# File: backend/app/schemas/ats_rules.py
# Description: Pydantic v2 schemas for ATS Readiness Report and Rule Evaluation.
# ============================================================================

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.templates import ResumeContent, StyleSpec


class ATSRuleItem(BaseModel):
    """Evaluation result for an individual ATS rule."""
    model_config = ConfigDict(extra="forbid")

    rule_id: str = Field(..., description="Unique identifier for the rule")
    category: str = Field(..., description="Category: structure, formatting, or keywords")
    passed: bool = Field(..., description="Whether the rule passed threshold criteria")
    points: float = Field(..., ge=0.0, le=100.0, description="Rule score between 0 and 100")
    evidence: str = Field(..., description="Detailed deterministic evidence of what was detected")
    fix: str = Field(..., description="Actionable recommendation to remediate the issue")


class ScoreDocRequest(BaseModel):
    """Request payload for POST /api/v1/ats/score-doc."""
    model_config = ConfigDict(extra="forbid")

    content: ResumeContent
    style: StyleSpec
    jd_text: Optional[str] = Field(default=None, max_length=10000, description="Optional target job description")


class ScoreDocResponse(BaseModel):
    """Response payload for POST /api/v1/ats/score-doc."""
    model_config = ConfigDict(extra="forbid")

    overall: float = Field(..., ge=0.0, le=100.0, description="Weighted composite ATS readiness score (0-100)")
    categories: Dict[str, float] = Field(..., description="Category sub-scores (structure, formatting, keywords, semantic)")
    items: List[ATSRuleItem] = Field(..., description="List of all evaluated rule items")
    top_fixes: List[str] = Field(..., description="Top actionable fixes ordered by impact (up to 5)")
    limits_note: str = Field(..., description="Disclaimer that this is a readiness estimate, not an employer ATS")
