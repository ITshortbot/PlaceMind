import pytest
from app.schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry
from app.schemas.jd import JDRequirements
from app.ml.ats_scorer import ats_scorer
from app.ml.hallucination_guard import hallucination_guard
from app.ml.pdf_compiler import pdf_compiler
import numpy as np

def test_pipeline_contracts():
    # 1. Resume Schema Contract
    sample_resume = ResumeSchema(
        contact=ContactInfo(name="Jane Doe", email="jane@example.com", phone="555-1234"),
        summary="Experienced Full Stack Developer skilled in Python and React.",
        experience=[
            ExperienceEntry(
                company="Tech Corp",
                job_title="Senior Developer",
                start_date="2020",
                end_date="Present",
                bullets=["Developed REST APIs in Python", "Optimized database performance by 25%"]
            )
        ],
        skills=["Python", "React", "SQL", "FastAPI"]
    )
    assert sample_resume.contact.name == "Jane Doe"

    # 2. JD Requirements Contract
    sample_jd = JDRequirements(
        job_title="Senior Backend Engineer",
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        responsibilities=["Build scalable backend APIs", "Manage database migrations"]
    )
    assert "Python" in sample_jd.required_skills

    # 3. ATS Scorer Matrix Contract
    matrix = np.array([[0.85, 0.60], [0.40, 0.90]])
    req_texts = ["Python API development", "PostgreSQL tuning"]
    chunk_texts = ["Developed REST APIs in Python", "Optimized database performance by 25%"]
    
    gap_report = ats_scorer.score_resume_against_jd(sample_resume, sample_jd, matrix, req_texts, chunk_texts)
    assert gap_report.overall_score > 0.0
    assert "PostgreSQL" in gap_report.missing_keywords or "Docker" in gap_report.missing_keywords

    # 4. Anti-Hallucination Guard Contract
    val_result = hallucination_guard.validate_no_new_entities(sample_resume, sample_resume)
    assert val_result.is_valid is True

    # 5. Typst PDF Compiler Contract
    pdf_bytes = pdf_compiler.render_resume_pdf(sample_resume)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:4] == b"%PDF"
