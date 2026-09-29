from types import SimpleNamespace

import numpy as np
import pytest

from app.schemas.scoring import ParsedSectionDTO
from app.services.ai_router import RoutingMode
from app.services.ats_scorer import ATSScoringEngine


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("section_types", "email", "phone", "page_count", "expected_structure_score"),
    [
        (["work_experience", "education", "skills"], "person@example.com", "", 1, 100.0),
        (["work_experience"], "", "", 3, 30.0),
        (["projects"], "", "", 0, 0.0),
    ],
)
async def test_structure_score_uses_resume_signals(
    monkeypatch, section_types, email, phone, page_count, expected_structure_score
):
    monkeypatch.setattr(
        "app.services.ats_scorer.embedding_engine.embed_documents",
        lambda texts: np.zeros((len(texts), 384)),
    )

    async def complete(**kwargs):
        return SimpleNamespace(
            content='{"remediations": [], "actionable_bullets": []}',
            model_used="test-model",
            routing_mode=RoutingMode.LOCAL,
            latency_ms=1.0,
            is_fallback=False,
        )

    engine = ATSScoringEngine(ai_router=SimpleNamespace(complete=complete))
    sections = [
        ParsedSectionDTO(section_type=section_type, content="unrelated resume content")
        for section_type in section_types
    ]

    report = await engine.compute_scoring_pipeline(
        parsed_sections=sections,
        job_requirements=["Kubernetes distributed systems"],
        mode=RoutingMode.LOCAL,
        extracted_email=email,
        extracted_phone=phone,
        page_count=page_count,
    )

    assert report.structure_score == expected_structure_score
    assert report.overall_score == round(expected_structure_score * 0.2, 1)