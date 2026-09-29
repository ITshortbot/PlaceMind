# ============================================================================
# File: backend/tests/test_pdf_parser.py
# Description: Unit tests for the v2 block-layout resume section chunker.
#              Updated to use the new _segment_into_sections API which now
#              receives List[Tuple[str, float]] (text, font_size) tuples
#              and a baseline_font_size float instead of a raw string.
# ============================================================================

from app.services.pdf_parser import PDFResumeParser, _slugify


def _make_lines(text: str, default_font_size: float = 10.0):
    """
    Convert a plain text string to the List[Tuple[str, float]] format
    expected by the v2 segmenter. Lines that look like section headers
    are given a larger font size to exercise the font heuristic.
    """
    lines = []
    for raw_line in text.strip().split("\n"):
        stripped = raw_line.strip()
        if not stripped:
            continue
        # Simulate section headers by giving them a font size 1.4× baseline
        is_known_header = _slugify(stripped) in PDFResumeParser._ALIAS_MAP
        font = default_font_size * 1.4 if is_known_header else default_font_size
        lines.append((stripped, font))
    return lines


def test_slug_normalisation():
    """Ensure slug normalizer handles unicode, casing, trailing colons."""
    assert _slugify("Work Experience:") == "work experience"
    assert _slugify("TECHNICAL SKILLS") == "technical skills"
    assert _slugify("Profil") == "profil"  # no match expected
    assert _slugify("Education—") == "education"


def test_alias_map_coverage():
    """Verify the ALIAS_MAP is pre-computed and non-empty."""
    assert len(PDFResumeParser._ALIAS_MAP) > 20, (
        "ALIAS_MAP should contain all aliases for all section types"
    )
    assert "experience" in PDFResumeParser._ALIAS_MAP
    assert "education" in PDFResumeParser._ALIAS_MAP
    assert "skills" in PDFResumeParser._ALIAS_MAP
    assert "projects" in PDFResumeParser._ALIAS_MAP


def test_resume_segmentation_standard_headers():
    """Basic segmentation with commonly named section headers."""
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

    baseline = 10.0
    lines = _make_lines(sample_text, baseline)
    sections = PDFResumeParser._segment_into_sections(lines, baseline)

    section_types = [s.section_type for s in sections]
    assert "summary" in section_types, f"Expected 'summary' in {section_types}"
    assert "skills" in section_types, f"Expected 'skills' in {section_types}"
    assert "work_experience" in section_types, f"Expected 'work_experience' in {section_types}"
    assert "education" in section_types, f"Expected 'education' in {section_types}"

    # Verify content assigned correctly
    skills_sec = next(s for s in sections if s.section_type == "skills")
    assert "FastAPI" in skills_sec.content
    assert "pgvector" in skills_sec.content

    exp_sec = next(s for s in sections if s.section_type == "work_experience")
    assert "RAG" in exp_sec.content or "Apex" in exp_sec.content


def test_segmentation_nonstandard_header_font_heuristic():
    """
    When a short line (≤6 words) has font size ≥1.25× baseline, it should
    be identified as an 'other' section header even if not in alias map.
    """
    # Simulate a resume with a non-standard 'Achievements' heading that
    # uses a large font (e.g. 14pt vs 10pt baseline)
    lines = [
        ("Jane Doe, Staff Engineer", 10.0),
        ("Achievements", 14.0),     # non-standard but large font → 'other'
        ("Won AWS re:Invent hackathon 2023", 10.0),
        ("Education", 14.0),        # standard header
        ("B.S. Computer Science", 10.0),
    ]
    sections = PDFResumeParser._segment_into_sections(lines, baseline_font_size=10.0)
    types = [s.section_type for s in sections]

    assert "other" in types, f"Expected 'other' (font heuristic) in {types}"
    assert "education" in types, f"Expected 'education' in {types}"


def test_segmentation_with_trailing_colon_headers():
    """Section headers formatted as 'Experience:' should still be matched."""
    lines = [
        ("Rohan K. Patel", 10.0),
        ("Work Experience:", 13.0),
        ("Senior Engineer at Stripe (2021-Present)", 10.0),
        ("Skills:", 13.0),
        ("Python, Kafka, Kubernetes", 10.0),
    ]
    sections = PDFResumeParser._segment_into_sections(lines, baseline_font_size=10.0)
    types = [s.section_type for s in sections]

    assert "work_experience" in types, f"Expected 'work_experience' in {types}"
    assert "skills" in types, f"Expected 'skills' in {types}"


def test_fallback_when_no_headers_matched():
    """
    If the document has no recognisable headers and no large-font lines,
    the entire content should be returned as a single 'work_experience' section.
    """
    lines = [
        ("John Smith", 10.0),
        ("Led backend team to ship 3 products.", 10.0),
        ("Reduced DB query time by 60%.", 10.0),
    ]
    sections = PDFResumeParser._segment_into_sections(lines, baseline_font_size=10.0)
    assert len(sections) == 1
    assert sections[0].section_type == "work_experience"
    assert "backend" in sections[0].content
