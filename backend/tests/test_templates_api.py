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

        async def _mock_gen(req, facts=None):
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
        async def _mock_gen2(req, facts=None):
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


# ─── Candidate-facts pathway (API level, DB-backed) ──────────────────────────

import json as _json
import uuid as _uuid

from unittest.mock import AsyncMock

from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler as _SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import async_sessionmaker as _async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine as _create_async_engine

from app.database.models import ATSMatchScore, JobDescription, Resume, ResumeSection, User
from app.database.session import get_db
from app.services.ai_router import HybridLLMRouter

_SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
_SQLiteTypeCompiler.visit_vector = lambda self, type_, **kw: "BLOB"
for _table in (User.__table__, Resume.__table__, ResumeSection.__table__, JobDescription.__table__, ATSMatchScore.__table__):
    for _col in _table.c:
        if _col.server_default is not None and str(_col.server_default.arg).endswith("::jsonb"):
            _col.server_default = None


@pytest.fixture
async def facts_db():
    engine = _create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        for t in (User.__table__, Resume.__table__, ResumeSection.__table__, JobDescription.__table__, ATSMatchScore.__table__):
            await conn.run_sync(t.create, checkfirst=True)
    maker = _async_sessionmaker(bind=engine, expire_on_commit=False)

    async def _get_db():
        async with maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


@pytest.fixture
async def facts_client(facts_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


RESUME_A = {
    "file_name": "alpha.pdf",
    "raw_text": "Alpha Person\nData analyst at Aardvark Systems.",
    "parsed_metadata": {},
    "sections": [
        {"section_type": "summary", "content": "Data analyst at Aardvark Systems."},
        {"section_type": "skills", "content": "SQL, AardvarkQL"},
    ],
}
RESUME_B = {
    "file_name": "beta.pdf",
    "raw_text": "Beta Person\nDesigner at Bison Labs.",
    "parsed_metadata": {},
    "sections": [
        {"section_type": "summary", "content": "Designer at Bison Labs."},
        {"section_type": "skills", "content": "Figma, BisonScript"},
    ],
}


async def _create_resume(client, payload):
    res = await client.post("/api/v1/resumes", json=payload)
    assert res.status_code in (200, 201), res.text
    return res.json()["id"]


def _no_model():
    return patch.object(
        HybridLLMRouter, "complete", new=AsyncMock(side_effect=RuntimeError("no model"))
    )


@pytest.mark.asyncio
async def test_generate_with_resume_id_uses_only_that_resumes_facts(facts_client):
    """resume_id derives facts server-side; no cross-resume leakage."""
    id_a = await _create_resume(facts_client, RESUME_A)
    await _create_resume(facts_client, RESUME_B)

    with _no_model():
        res = await facts_client.post(
            "/api/v1/templates/generate",
            json={"prompt": "data analyst resume", "resume_id": id_a},
        )

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["facts_used"] is True
    blob = _json.dumps(data["content"])
    assert "Aardvark" in blob
    assert "Bison" not in blob
    assert "[X" not in blob
    assert "Enterprise Corp" not in blob


@pytest.mark.asyncio
async def test_generate_missing_resume_id_returns_404(facts_client):
    with _no_model():
        res = await facts_client.post(
            "/api/v1/templates/generate",
            json={"prompt": "resume", "resume_id": str(_uuid.uuid4())},
        )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_generate_prompt_only_returns_empty_not_canned(facts_client):
    """No facts + no model: empty content with a clear warning, never preset filler."""
    with _no_model():
        res = await facts_client.post(
            "/api/v1/templates/generate", json={"prompt": "software engineer resume"}
        )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["facts_used"] is False
    blob = _json.dumps(data["content"])
    assert "Enterprise Corp" not in blob
    assert "Senior Software Engineer" not in blob
    assert "[X" not in blob
    assert data["content"]["skills"] == []
    assert data["content"]["experience"] == []


@pytest.mark.asyncio
async def test_generate_explicit_facts_win_over_resume_id(facts_client):
    id_a = await _create_resume(facts_client, RESUME_A)

    with _no_model():
        res = await facts_client.post(
            "/api/v1/templates/generate",
            json={
                "prompt": "tailor my resume",
                "resume_id": id_a,
                "facts": {
                    "headline": "Explicit Headline",
                    "experience": [
                        {"role": "Engineer", "company": "Explicit Co", "bullets": ["Shipped things."]}
                    ],
                },
            },
        )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["facts_used"] is True
    blob = _json.dumps(data["content"])
    assert "Explicit Co" in blob
    assert "Aardvark" not in blob


@pytest.mark.asyncio
async def test_generate_empty_facts_object_returns_empty(facts_client):
    with _no_model():
        res = await facts_client.post(
            "/api/v1/templates/generate", json={"prompt": "resume", "facts": {}}
        )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["facts_used"] is False
    assert data["content"]["headline"] == ""
    assert data["content"]["skills"] == []
