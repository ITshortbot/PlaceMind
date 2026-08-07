import os
import sys
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from app.schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry
from app.schemas.jd import JDRequirements
from app.ml.ats_scorer import ats_scorer

def run_ats_calibration_eval():
    print("==========================================")
    print("🎯 Running ATS Scoring Calibration Eval")
    print("==========================================")

    sample_resume = ResumeSchema(
        contact=ContactInfo(name="Alex Smith", email="alex@example.com"),
        summary="Senior Backend Engineer specializing in Distributed Systems.",
        experience=[
            ExperienceEntry(
                company="CloudTech",
                job_title="Lead Engineer",
                start_date="2019",
                end_date="Present",
                bullets=["Architected Kubernetes cluster handling 50k QPS", "Implemented Redis caching saving 40% DB load"]
            )
        ],
        skills=["Python", "Go", "Kubernetes", "Redis", "PostgreSQL", "Docker"]
    )

    sample_jd = JDRequirements(
        job_title="Senior Systems Architect",
        required_skills=["Kubernetes", "Redis", "Go", "Distributed Systems"],
        responsibilities=["Maintain high-availability Kubernetes infrastructure", "Optimize cache strategies"]
    )

    matrix = np.array([[0.92, 0.45], [0.55, 0.88]])
    req_texts = ["Kubernetes infrastructure", "Optimize cache strategies"]
    chunk_texts = ["Architected Kubernetes cluster handling 50k QPS", "Implemented Redis caching saving 40% DB load"]

    gap_report = ats_scorer.score_resume_against_jd(sample_resume, sample_jd, matrix, req_texts, chunk_texts)

    print(f"✅ Composite Match Score: {gap_report.overall_score * 100:.1f}%")
    print(f"  - Semantic Coverage (40%): {gap_report.semantic_coverage_score * 100:.1f}%")
    print(f"  - Keyword Density (25%): {gap_report.keyword_density_score * 100:.1f}%")
    print(f"  - Quantified Impact (20%): {gap_report.quantification_score * 100:.1f}%")
    print(f"  - Parseability (15%): {gap_report.formatting_score * 100:.1f}%")
    print("==========================================")
    print("✅ Calibration Eval Complete!")

if __name__ == "__main__":
    run_ats_calibration_eval()
