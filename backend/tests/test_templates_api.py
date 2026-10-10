# ============================================================================
# File: backend/tests/test_templates_api.py
# Description: API Integration tests using httpx.AsyncClient for:
#              - GET /api/v1/templates/presets
#              - POST /api/v1/templates/generate (success, validation, fallback)
#              - In-process concurrency semaphore (429 Too Many Requests with Retry-After)
#              - CORS restriction to http://localhost:3000
# ============================================================================

import asyncio
from unittest.mock import patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints.templates import _generation_semaphore
from app.main import app
from app.schemas.templates import GenerateResponse, ResumeContent, StyleSpec


@pytest.fixture
def mock_template_generator():
    """Mock generator returning valid GenerateResponse immediately."""
    with patch("app.api.v1.endpoints.templates.TemplateGenerator") as mock_cls:
        instance = mock_cls.return_value

        async def _mock_gen(req):
            return GenerateResponse(
                style=StyleSpec(
                    layout="single_column",
                    font="Calibri",
                    size_pt=11.0,
                    density="normal",
                    header_style="left",
                    section_order=["summary", "skills", "experience", "projects", "education"],
                    mood="corporate",
                    hue=210,
                ),
                content=ResumeContent(
                    headline="Software Engineer",
                    summary="Passionate backend engineer.",
                    skills=["Python", "FastAPI"],
                    experience=[],
                    projects=[],
                    education=[],
                ),
                warnings=[],
                latency_ms=45.2,
                source="model",
            )

        instance.generate.side_effect = _mock_gen
        yield instance


@pytest.mark.asyncio
async def test_get_presets_returns_all_four_presets():
    """GET /api/v1/templates/presets returns Classic, Modern, Compact, and Academic."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/templates/presets")

    assert res.status_code == 200
    data = res.json()
    assert "Classic" in data
    assert "Modern" in data
    assert "Compact" in data
    assert "Academic" in data

    for name in ("Classic", "Modern", "Compact", "Academic"):
        assert "style" in data[name]
        assert "content" in data[name]


@pytest.mark.asyncio
async def test_post_generate_success(mock_template_generator):
    """POST /api/v1/templates/generate returns 200 with valid GenerateResponse."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"prompt": "Modern resume for full stack developer"}
        res = await client.post("/api/v1/templates/generate", json=payload)

    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "model"
    assert data["style"]["layout"] == "single_column"
    assert data["content"]["headline"] == "Software Engineer"


@pytest.mark.asyncio
async def test_post_generate_validation_errors():
    """POST /api/v1/templates/generate returns 422 on schema limit violations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Prompt exceeds 500 chars limit
        res_oversize = await client.post(
            "/api/v1/templates/generate",
            json={"prompt": "X" * 501},
        )
        assert res_oversize.status_code == 422

        # Disallowed extra field (extra="forbid")
        res_extra = await client.post(
            "/api/v1/templates/generate",
            json={"prompt": "Valid prompt", "extra_token": "malicious"},
        )
        assert res_extra.status_code == 422


@pytest.mark.asyncio
async def test_concurrency_semaphore_returns_429():
    """Semaphore blocks concurrent generation requests with 429 and Retry-After header."""
    transport = ASGITransport(app=app)

    # Simulate ongoing request holding the semaphore
    async with _generation_semaphore:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/templates/generate",
                json={"prompt": "Fast simultaneous request"},
            )

            assert res.status_code == 429
            assert res.headers.get("retry-after") == "5"
            assert "busy" in res.json()["detail"].lower()

    # Once released, generation succeeds
    with patch("app.api.v1.endpoints.templates.TemplateGenerator") as mock_cls:
        async def _mock_gen2(req):
            return GenerateResponse(
                style=StyleSpec(
                    layout="single_column",
                    font="Calibri",
                    size_pt=11.0,
                    density="normal",
                    header_style="left",
                    section_order=["summary", "skills", "experience", "projects", "education"],
                    mood="corporate",
                    hue=210,
                ),
                content=ResumeContent(
                    headline="Dev",
                    summary="Summary",
                    skills=[],
                    experience=[],
                    projects=[],
                    education=[],
                ),
                warnings=[],
                latency_ms=10.0,
                source="model",
            )
        mock_cls.return_value.generate.side_effect = _mock_gen2

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res_after = await client.post(
                "/api/v1/templates/generate",
                json={"prompt": "Request after release"},
            )
            assert res_after.status_code == 200


@pytest.mark.asyncio
async def test_cors_restricted_to_localhost_3000():
    """Verify CORS headers only permit http://localhost:3000."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request from allowed origin
        res_allowed = await client.options(
            "/api/v1/templates/presets",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"

        # Request from disallowed origin
        res_disallowed = await client.options(
            "/api/v1/templates/presets",
            headers={
                "Origin": "https://unauthorized-domain.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res_disallowed.headers.get("access-control-allow-origin") != "https://unauthorized-domain.com"
