# ============================================================================
# File: backend/tests/test_pdf_parser.py
# Description: Unit tests for deterministic resume section chunker
# ============================================================================

from app.services.pdf_parser import PDFResumeParser

def test_resume_segmentation_logic():
    sample_text = """
    Jane Doe
    jane.doe@example.com | (555) 123-4567 | San Francisco, CA

    Professional Summary
    Senior Full-Stack AI Engineer with 6 years building distributed microservices and LLM agents.

    Technical Skills
    Languages: Python, TypeScript, SQL, Rust
    Frameworks: FastAPI, Next.js 15, PyTorch, LangChain
    Databases: PostgreSQL, pgvector, Redis

    Work Experience
    Lead AI Architect at Apex Labs (2022 - Present)
    - Architected high-throughput RAG search engine serving 2M daily queries.
    - Optimized vector cosine retrieval latency from 180ms to 24ms using pgvector HNSW indexing.

    Education
    B.S. in Computer Science, University of California, Berkeley (2018)
    """

    sections = PDFResumeParser._segment_into_sections(sample_text)
    
    section_types = [s.section_type for s in sections]
    assert "summary" in section_types
    assert "skills" in section_types
    assert "work_experience" in section_types
    assert "education" in section_types

    # Ensure content was assigned properly
    skills_sec = next(s for s in sections if s.section_type == "skills")
    assert "FastAPI" in skills_sec.content
    assert "pgvector" in skills_sec.content
