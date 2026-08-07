from pydantic import BaseModel
from typing import List

class RequirementCoverage(BaseModel):
    requirement: str
    best_match_chunk: str
    similarity_score: float
    coverage_label: str  # "not_covered", "weakly_covered", "well_covered"

class ATSGapReport(BaseModel):
    overall_score: float
    semantic_coverage_score: float
    keyword_density_score: float
    quantification_score: float
    formatting_score: float
    requirement_coverages: List[RequirementCoverage]
    missing_keywords: List[str]
