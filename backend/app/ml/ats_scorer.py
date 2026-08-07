import numpy as np
import re
from typing import List
from ..schemas.gap_report import ATSGapReport, RequirementCoverage
from ..schemas.jd import JDRequirements
from ..schemas.resume import ResumeSchema

class ATSScorer:
    def _get_coverage_label(self, similarity: float) -> str:
        if similarity < 0.55:
            return "not_covered"
        elif similarity < 0.75:
            return "weakly_covered"
        else:
            return "well_covered"

    def score_resume_against_jd(
        self, 
        resume: ResumeSchema, 
        jd_reqs: JDRequirements, 
        similarity_matrix: np.ndarray, 
        req_texts: List[str], 
        chunk_texts: List[str]
    ) -> ATSGapReport:
        # 1. Semantic Coverage (40%)
        semantic_coverage_score = 0.0
        requirement_coverages = []
        
        if len(req_texts) > 0 and len(chunk_texts) > 0:
            best_match_indices = np.argmax(similarity_matrix, axis=1)
            best_match_scores = np.max(similarity_matrix, axis=1)
            semantic_coverage_score = float(np.mean(best_match_scores))
            
            for i, req in enumerate(req_texts):
                best_idx = best_match_indices[i]
                sim_score = float(best_match_scores[i])
                label = self._get_coverage_label(sim_score)
                requirement_coverages.append(RequirementCoverage(
                    requirement=req,
                    best_match_chunk=chunk_texts[best_idx],
                    similarity_score=sim_score,
                    coverage_label=label
                ))
        
        # 2. Keyword Density (25%)
        keyword_density_score = 0.0
        missing_keywords = []
        if jd_reqs.required_skills:
            resume_skills_lower = [s.lower() for s in resume.skills]
            matched_count = 0
            for skill in jd_reqs.required_skills:
                if skill.lower() in resume_skills_lower:
                    matched_count += 1
                else:
                    missing_keywords.append(skill)
            keyword_density_score = matched_count / len(jd_reqs.required_skills)
        else:
            keyword_density_score = 1.0

        # 3. Quantification (20%)
        total_bullets = 0
        quantified_bullets = 0
        number_pattern = re.compile(r'\b\d+(\.\d+)?%?\b')
        
        for exp in resume.experience:
            for bullet in exp.bullets:
                total_bullets += 1
                if number_pattern.search(bullet):
                    quantified_bullets += 1
                    
        if total_bullets > 0:
            quantification_score = quantified_bullets / total_bullets
        else:
            quantification_score = 0.0

        # 4. Formatting/Parseability (15%)
        formatting_score = 1.0 
        
        # Overall Score
        overall_score = (
            (semantic_coverage_score * 0.40) +
            (keyword_density_score * 0.25) +
            (quantification_score * 0.20) +
            (formatting_score * 0.15)
        )
        
        return ATSGapReport(
            overall_score=overall_score,
            semantic_coverage_score=semantic_coverage_score,
            keyword_density_score=keyword_density_score,
            quantification_score=quantification_score,
            formatting_score=formatting_score,
            requirement_coverages=requirement_coverages,
            missing_keywords=missing_keywords
        )

ats_scorer = ATSScorer()
