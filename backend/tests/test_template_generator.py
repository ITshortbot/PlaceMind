# ============================================================================
# File: backend/tests/test_template_generator.py
# Description: Unit tests for TemplateGenerator with fake LLM router covering:
#              - good response
#              - malformed response (1-turn retry success)
#              - oversize response (fallback to preset)
#              - prompt-injection output (HTML/markdown strip, URL/email guard)
#              - timeout (graceful fallback)
#              - preset selection based on keywords
# ============================================================================

import asyncio
import json
from types import SimpleNamespace
import pytest

from app.schemas.templates import GenerateRequest
from app.services.ai_router import RoutingMode
from app.services.template_generator import TemplateGenerator


def _sample_valid_json() -> str:
    return json.dumps({
        "style": {
            "layout": "single_column",
            "font": "Calibri",
            "size_pt": 11.0,
            "density": "normal",
            "header_style": "left",
            "section_order": ["summary", "skills", "experience", "projects", "education"],
            "mood": "corporate",
            "hue": 210,
        },
        "content": {
            "headline": "Full-Stack Engineer",
            "summary": "Experienced engineer building distributed systems with Python and TypeScript.",
            "skills": ["Python", "FastAPI", "React", "Docker"],
            "experience": [
                {
                    "role": "Senior Engineer",
                    "company": "Tech Corp",
                    "bullets": ["Led development of microservices.", "Optimized queries by 30%."],
                }
            ],
            "projects": [
                {
                    "name": "Placemind ATS",
                    "description": "ATS scoring and resume builder platform.",
                    "bullets": ["Built with FastAPI and Next.js."],
                }
            ],
            "education": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "Tech University",
                    "year": "2021",
                }
            ],
        },
    })


class FakeLLMRouter:
    def __init__(self, responses=None, exception_to_raise=None):
        self.responses = list(responses or [])
        self.exception_to_raise = exception_to_raise
        self.calls = []

    async def complete(self, messages, mode=RoutingMode.OSS, **kwargs):
        self.calls.append({"messages": messages, "mode": mode, "kwargs": kwargs})
        if self.exception_to_raise:
            raise self.exception_to_raise

        if self.responses:
            res_content = self.responses.pop(0)
            return SimpleNamespace(content=res_content)

        return SimpleNamespace(content=_sample_valid_json())


@pytest.mark.asyncio
async def test_generate_good():
    """Valid model response parses cleanly with source='model' and no warnings."""
    router = FakeLLMRouter(responses=[_sample_valid_json()])
    generator = TemplateGenerator(ai_router=router)

    req = GenerateRequest(prompt="Create a clean corporate resume for a software engineer")
    response = await generator.generate(req)

    assert response.source == "model"
    assert response.warnings == []
    assert response.style.font.value == "Calibri"
    assert response.content.headline == "Full-Stack Engineer"
    assert response.latency_ms >= 0.0
    assert len(router.calls) == 1


@pytest.mark.asyncio
async def test_generate_malformed_retry_success():
    """First attempt returns malformed JSON, second attempt succeeds via retry."""
    malformed_json = '{"style": {"layout": "invalid_layout"}, "content": "not an object"}'
    valid_json = _sample_valid_json()

    router = FakeLLMRouter(responses=[malformed_json, valid_json])
    generator = TemplateGenerator(ai_router=router)

    req = GenerateRequest(prompt="Generate a resume for a data scientist")
    response = await generator.generate(req)

    assert response.source == "model"
    assert len(router.calls) == 2
    # Verify retry prompt includes validation failure notice
    retry_call_messages = router.calls[1]["messages"]
    assert any("failed validation" in m["content"] for m in retry_call_messages)
    assert response.content.headline == "Full-Stack Engineer"


@pytest.mark.asyncio
async def test_generate_oversize_fallback():
    """Oversize content fails validation on both attempts and triggers fallback preset."""
    # Headline > 120 chars violates schema limit
    oversize_json = json.dumps({
        "style": {
            "layout": "single_column",
            "font": "Calibri",
            "size_pt": 11.0,
            "density": "normal",
            "header_style": "left",
            "section_order": ["summary", "skills", "experience", "projects", "education"],
            "mood": "corporate",
            "hue": 200,
        },
        "content": {
            "headline": "A" * 150,  # exceeds max 120
            "summary": "Valid summary",
            "skills": ["Python"],
            "experience": [],
            "projects": [],
            "education": [],
        },
    })

    router = FakeLLMRouter(responses=[oversize_json, oversize_json])
    generator = TemplateGenerator(ai_router=router)

    req = GenerateRequest(prompt="Software engineer modern resume")
    response = await generator.generate(req)

    assert response.source == "fallback"
    assert any("fallback preset" in w for w in response.warnings)
    assert response.style is not None
    assert response.content is not None
    assert len(response.content.headline) <= 120


@pytest.mark.asyncio
async def test_generate_prompt_injection_output():
    """HTML, markdown fences, and unauthorized URLs/emails in model output are scrubbed."""
    injected_json = json.dumps({
        "style": {
            "layout": "single_column",
            "font": "Arial",
            "size_pt": 11.0,
            "density": "normal",
            "header_style": "left",
            "section_order": ["summary", "skills", "experience", "projects", "education"],
            "mood": "tech",
            "hue": 190,
        },
        "content": {
            "headline": "<b>Principal Architect</b> with <script>alert(1)</script>",
            "summary": "**Senior** architect at [Company]. Check out https://unauthorized-phishing.com or email attacker@evil.org and user@allowed.com",
            "skills": ["`Python`", "<b>Kubernetes</b>"],
            "experience": [
                {
                    "role": "**Tech Lead**",
                    "company": "Startup",
                    "bullets": ["Engineered *high-throughput* systems with https://unauthorized-phishing.com/data"],
                }
            ],
            "projects": [
                {
                    "name": "Project Alpha",
                    "description": "Visit https://allowed-portfolio.com for info.",
                    "bullets": ["Shipped on time."],
                    "link": "https://unauthorized-phishing.com",
                }
            ],
            "education": [],
        },
    })

    router = FakeLLMRouter(responses=[injected_json])
    generator = TemplateGenerator(ai_router=router)

    # Allowed URL and email in prompt
    req = GenerateRequest(
        prompt="Resume for portfolio https://allowed-portfolio.com and email user@allowed.com"
    )
    response = await generator.generate(req)

    assert response.source == "model"
    # HTML stripped
    assert "<b>" not in response.content.headline
    assert "<script>" not in response.content.headline
    assert "Principal Architect with" in response.content.headline

    # Markdown stripped
    assert "**Senior**" not in response.content.summary
    assert "Senior architect" in response.content.summary
    assert "`Python`" not in response.content.skills
    assert "Python" in response.content.skills

    # Unauthorized URLs / emails removed
    assert "unauthorized-phishing.com" not in response.content.summary
    assert "attacker@evil.org" not in response.content.summary
    assert "unauthorized-phishing.com" not in response.content.experience[0].bullets[0]
    assert "unauthorized-phishing.com" not in (response.content.projects[0].link or "")

    # Allowed URL / email preserved
    assert "user@allowed.com" in response.content.summary
    assert "https://allowed-portfolio.com" in response.content.projects[0].description


@pytest.mark.asyncio
async def test_generate_timeout():
    """LLM timeout triggers graceful fallback preset without crashing."""
    router = FakeLLMRouter(exception_to_raise=asyncio.TimeoutError("Request timed out after 60s"))
    generator = TemplateGenerator(ai_router=router)

    req = GenerateRequest(prompt="Academic researcher resume")
    response = await generator.generate(req)

    assert response.source == "fallback"
    assert any("Academic" in w for w in response.warnings)
    assert response.style is not None
    assert response.content is not None
    assert response.latency_ms >= 0.0


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("prompt", "expected_preset"),
    [
        ("Need an academic CV for a postdoctoral research fellowship with papers", "Academic"),
        ("Single page compact dense resume for junior developer", "Compact"),
        ("Modern creative tech startup banner layout", "Modern"),
        ("Classic standard corporate financial analyst format", "Classic"),
    ],
)
async def test_preset_selection_keywords(prompt, expected_preset):
    """Fallback preset matcher selects the most relevant preset based on prompt keywords."""
    router = FakeLLMRouter(exception_to_raise=RuntimeError("Model offline"))
    generator = TemplateGenerator(ai_router=router)

    req = GenerateRequest(prompt=prompt)
    response = await generator.generate(req)

    assert response.source == "fallback"
    assert any(expected_preset in w for w in response.warnings)
