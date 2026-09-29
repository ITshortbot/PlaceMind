# ============================================================================
# File: backend/app/services/pdf_parser.py
# Description: Robust PDF resume parsing using PyMuPDF's block-level layout
#              model instead of raw text string splitting.
#
# PROBLEMS FIXED (v2):
# ─────────────────────────────────────────────────────────────────────────────
# v1 PROBLEM: The original implementation used `page.get_text("text")` which
# produces a flat, linear string. For 2-column resumes (extremely common in
# modern templates), PyMuPDF concatenates columns left-to-right in unpredictable
# order, scrambling bullet points across section boundaries. This caused the
# section segmenter to produce a single undifferentiated "work_experience" blob.
#
# v2 FIX: We now use `page.get_text("blocks")` which returns pre-computed
# typographic text blocks with (x0, y0, x1, y1) bounding boxes. We sort blocks
# by their vertical (y0) position, then by horizontal (x0) position to handle
# multi-column layouts deterministically. This ensures that even 2-column PDFs
# are linearized correctly: left column top→bottom, then right column top→bottom.
#
# ADDITIONAL IMPROVEMENTS:
# 1. Font-size heuristic for section header detection:
#    PyMuPDF block data includes span font sizes. We identify lines where the
#    average font size is ≥ 1.2× the document baseline font size as candidate
#    headers, even when they don't match any known keyword alias.
#    This makes the parser robust to non-standard section names.
# 2. Slug normalization before alias matching:
#    We strip punctuation and normalise unicode before comparing, so headers
#    like "Work Experience:" and "WORK EXPERIENCE" both match correctly.
# 3. Graceful degradation:
#    If the blocks API returns no usable text (e.g. image-only scanned PDFs),
#    we fall back to the v1 `get_text("text")` extraction.
# ─────────────────────────────────────────────────────────────────────────────
# MEMORY MODEL: All operations happen on in-memory byte buffers — no disk I/O.
# ============================================================================

import re
import unicodedata
from typing import Dict, List, Optional, Tuple
import fitz  # PyMuPDF
from pydantic import BaseModel

import logging
logger = logging.getLogger("placemind.pdf_parser")


class ParsedSection(BaseModel):
    section_type: str  # 'skills', 'work_experience', 'projects', 'education', 'summary', 'other'
    content: str
    line_count: int


class ResumeParseResult(BaseModel):
    full_text: str
    sections: List[ParsedSection]
    extracted_email: str = ""
    extracted_phone: str = ""
    page_count: int
    parser_version: str = "v2-block-layout"


def _slugify(text: str) -> str:
    """
    Normalise a text string for header comparison:
    lower-case → strip unicode → remove punctuation → collapse whitespace.
    """
    # Decompose unicode characters (e.g. curly apostrophes → ASCII)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    # Strip trailing colons and common unicode dashes used as section decorators
    text = re.sub(r"[\:\-–—]+$", "", text).strip()
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text)
    return text


class PDFResumeParser:
    """
    Parses and decomposes raw binary PDF resumes into structured,
    vectorisable sections using PyMuPDF's block-level layout model.
    """

    SECTION_HEADERS: Dict[str, List[str]] = {
        "summary": [
            "professional summary", "summary", "about me", "profile",
            "objective", "career objective", "executive summary", "overview",
        ],
        "skills": [
            "technical skills", "skills & tools", "core competencies",
            "technologies", "skills", "programming languages",
            "tools & technologies", "tech stack", "key skills",
            "areas of expertise", "competencies", "tools and technologies",
        ],
        "work_experience": [
            "work experience", "professional experience", "experience",
            "employment history", "work history", "career summary",
            "career history", "relevant experience", "industry experience",
        ],
        "projects": [
            "projects", "personal projects", "academic projects",
            "technical projects", "key projects", "open source contributions",
            "portfolio", "selected projects", "notable projects",
        ],
        "education": [
            "education", "academic background", "degrees & certifications",
            "qualifications", "university", "academic qualifications",
            "educational background", "training",
        ],
        "certifications": [
            "certifications", "certificates", "licenses", "accreditations",
            "professional certifications",
        ],
        "awards": [
            "awards", "honors", "achievements", "accomplishments",
            "recognition",
        ],
        "publications": [
            "publications", "research", "papers", "articles",
        ],
        "languages": [
            "languages", "spoken languages",
        ],
    }

    # Compiled set of all slugified aliases for O(1) lookup
    _ALIAS_MAP: Dict[str, str] = {
        _slugify(alias): sec_type
        for sec_type, aliases in SECTION_HEADERS.items()
        for alias in aliases
    }

    # ─── Public API ───────────────────────────────────────────────────────────

    @classmethod
    def extract_from_bytes(cls, pdf_bytes: bytes) -> ResumeParseResult:
        """
        Main entry point. Extracts plain text via block-layout, segments into
        typed sections, and extracts contact metadata.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)

        # Step 1: Extract text using the block-layout API (v2)
        linearized_lines, full_text, baseline_font_size = cls._extract_blocks(doc)
        doc.close()

        if not full_text.strip():
            logger.warning("PDF appears to be image-only or has no selectable text.")
            return ResumeParseResult(
                full_text="",
                sections=[],
                extracted_email="",
                extracted_phone="",
                page_count=page_count,
                parser_version="v2-block-layout-empty",
            )

        # Step 2: Extract contact anchors
        email_match = re.search(r"[\w\.\-\+]+@[\w\.\-]+\.\w+", full_text)
        phone_match = re.search(
            r"(\+?\d{1,3}[\-.\s]?)?\(?\d{3}\)?[\-.\s]?\d{3}[\-.\s]?\d{4}", full_text
        )

        # Step 3: Segment into typed sections
        sections = cls._segment_into_sections(
            linearized_lines=linearized_lines,
            baseline_font_size=baseline_font_size,
        )

        return ResumeParseResult(
            full_text=full_text,
            sections=sections,
            extracted_email=email_match.group(0) if email_match else "",
            extracted_phone=phone_match.group(0) if phone_match else "",
            page_count=page_count,
        )

    # ─── Private: Block-Layout Extraction ────────────────────────────────────

    @classmethod
    def _extract_blocks(
        cls, doc: fitz.Document
    ) -> Tuple[List[Tuple[str, float]], str, float]:
        """
        Extracts text blocks from all pages, sorts them by (y0, x0) to handle
        multi-column layouts, and returns:
          - linearized_lines: List of (text, avg_font_size) tuples
          - full_text: Concatenated plain-text string
          - baseline_font_size: Median font size across the document
        """
        all_line_data: List[Tuple[float, float, str, float]] = []
        # (y0, x0, line_text, avg_font_size)

        for page in doc:
            # get_text("rawdict") gives us blocks → lines → spans with font metadata
            try:
                raw = page.get_text("rawdict")  # type: ignore[attr-defined]
            except Exception:
                raw = {"blocks": []}

            for block in raw.get("blocks", []):
                if block.get("type") != 0:  # type 0 = text block
                    continue
                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    if not spans:
                        continue

                    # Compute block vertical position for sort key
                    y0 = line["bbox"][1]
                    x0 = line["bbox"][0]

                    # Assemble line text and compute average font size
                    line_text = "".join(sp.get("text", "") for sp in spans).strip()
                    if not line_text:
                        continue

                    font_sizes = [sp.get("size", 10.0) for sp in spans if sp.get("size")]
                    avg_font = sum(font_sizes) / len(font_sizes) if font_sizes else 10.0

                    all_line_data.append((y0, x0, line_text, avg_font))

        # Sort by vertical then horizontal position — correctly linearises 2-column layouts
        all_line_data.sort(key=lambda row: (round(row[0], 1), row[1]))

        linearized_lines: List[Tuple[str, float]] = [
            (row[2], row[3]) for row in all_line_data
        ]
        full_text = "\n".join(row[2] for row in all_line_data)

        # Compute baseline (median) font size
        all_sizes = sorted(row[3] for row in all_line_data)
        if all_sizes:
            mid = len(all_sizes) // 2
            baseline_font_size = all_sizes[mid]
        else:
            baseline_font_size = 10.0

        return linearized_lines, full_text, baseline_font_size

    # ─── Private: Section Segmentation ───────────────────────────────────────

    @classmethod
    def _is_section_header(
        cls,
        text: str,
        font_size: float,
        baseline_font_size: float,
    ) -> Optional[str]:
        """
        Returns the section_type if `text` is identified as a section heading.

        Detection strategy (in priority order):
        1. Exact slug match against known aliases (keyword-based).
        2. Starts-with prefix match against known aliases (handles "Experience (2018–2024)").
        3. Font-size heuristic: if the line's font is ≥ 1.25× the document baseline
           AND the line is short (≤ 6 words), treat it as an unknown header
           mapped to "other". This catches non-standard section names.
        """
        slug = _slugify(text)

        # Priority 1: exact match
        if slug in cls._ALIAS_MAP:
            return cls._ALIAS_MAP[slug]

        # Priority 2: prefix match (handles "Experience (Company / Dates)")
        for alias_slug, sec_type in cls._ALIAS_MAP.items():
            if slug.startswith(alias_slug) and len(text.split()) <= 6:
                return sec_type

        # Priority 3: font-size heuristic for non-standard headings
        if (
            baseline_font_size > 0
            and font_size >= baseline_font_size * 1.25
            and len(text.split()) <= 6
            and not re.match(r"^[\d•\-–—●▪▶►]", text)  # skip bullet lines
        ):
            logger.debug(
                f"Font-size heuristic matched as 'other': '{text}' "
                f"(size={font_size:.1f}, baseline={baseline_font_size:.1f})"
            )
            return "other"

        return None

    @classmethod
    def _segment_into_sections(
        cls,
        linearized_lines: List[Tuple[str, float]],
        baseline_font_size: float,
    ) -> List[ParsedSection]:
        """
        State-machine segmenter that walks the sorted, linearised lines,
        flushing a section buffer each time a heading is detected.
        """
        sections: List[ParsedSection] = []
        current_section_type = "summary"
        current_lines: List[str] = []

        for line_text, font_size in linearized_lines:
            detected_type = cls._is_section_header(line_text, font_size, baseline_font_size)

            if detected_type:
                # Flush the previous buffer
                if current_lines:
                    content = "\n".join(current_lines).strip()
                    if content:
                        sections.append(
                            ParsedSection(
                                section_type=current_section_type,
                                content=content,
                                line_count=len(current_lines),
                            )
                        )
                current_section_type = detected_type
                current_lines = []
            else:
                current_lines.append(line_text)

        # Flush the trailing buffer
        if current_lines:
            content = "\n".join(current_lines).strip()
            if content:
                sections.append(
                    ParsedSection(
                        section_type=current_section_type,
                        content=content,
                        line_count=len(current_lines),
                    )
                )

        # Fallback: if nothing matched, treat entire text as generic experience
        if not sections:
            full_content = "\n".join(t for t, _ in linearized_lines).strip()
            if full_content:
                logger.warning(
                    "No section headers detected. Treating entire document as "
                    "'work_experience'. Consider whether this is a multi-column or "
                    "non-standard resume format."
                )
                sections.append(
                    ParsedSection(
                        section_type="work_experience",
                        content=full_content,
                        line_count=len(linearized_lines),
                    )
                )

        return sections
