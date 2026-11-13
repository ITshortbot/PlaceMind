# ============================================================================
# File: backend/tests/test_resumes_api.py
# Description: API tests for resume persistence CRUD, backed by an in-memory
#              SQLite database via get_db dependency override. JSONB/vector
#              column types are compiled to SQLite-friendly types here; the
#              production models stay Postgres-native.
# ============================================================================

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database.models import ATSMatchScore, JobDescription, Resume, ResumeSection, User
from app.database.session import get_db
from app.main import app

SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
SQLiteTypeCompiler.visit_vector = lambda self, type_, **kw: "BLOB"

# Postgres-only jsonb defaults cannot compile under SQLite; tests drop them.
for _table in (User.__table__, Resume.__table__, ResumeSection.__table__, JobDescription.__table__, ATSMatchScore.__table__):
    for _col in _table.c:
        if _col.server_default is not None and str(_col.server_default.arg).endswith("::jsonb"):
            _col.server_default = None


@pytest.fixture
async def db_override():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(User.__table__.create, checkfirst=True)
        await conn.run_sync(Resume.__table__.create, checkfirst=True)
        await conn.run_sync(ResumeSection.__table__.create, checkfirst=True)
        await conn.run_sync(JobDescription.__table__.create, checkfirst=True)
        await conn.run_sync(ATSMatchScore.__table__.create, checkfirst=True)
    maker = async_sessionmaker(bind=engine, expire_on_commit=False)

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
async def client(db_override):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


SAMPLE = {
    "file_name": "alex_backend_2026.pdf",
    "raw_text": "Alex Doe\nBackend engineer with Python, FastAPI and PostgreSQL experience.",
    "parsed_metadata": {"source": "test"},
    "sections": [
        {"section_type": "summary", "content": "Backend engineer with 5 years of experience."},
        {"section_type": "skills", "content": "Python, FastAPI, PostgreSQL"},
    ],
}


async def _create(client: AsyncClient) -> str:
    res = await client.post("/api/v1/resumes", json=SAMPLE)
    assert res.status_code == 201, res.text
    return res.json()["id"]


async def test_create_resume_returns_stored_record(client):
    res = await client.post("/api/v1/resumes", json=SAMPLE)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["file_name"] == SAMPLE["file_name"]
    assert body["raw_text"] == SAMPLE["raw_text"]
    assert len(body["sections"]) == 2
    assert body["latest_ats_score"] is None  # no analysis ran - must not be fabricated


async def test_list_resumes_returns_created_rows(client):
    resume_id = await _create(client)
    res = await client.get("/api/v1/resumes")
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) == 1
    assert rows[0]["id"] == resume_id
    assert rows[0]["section_count"] == 2
    assert rows[0]["latest_ats_score"] is None


async def test_get_resume_returns_detail(client):
    resume_id = await _create(client)
    res = await client.get(f"/api/v1/resumes/{resume_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["parsed_metadata"] == {"source": "test"}
    assert {s["section_type"] for s in body["sections"]} == {"summary", "skills"}


async def test_update_resume_replaces_fields_and_sections(client):
    resume_id = await _create(client)
    res = await client.put(
        f"/api/v1/resumes/{resume_id}",
        json={
            "file_name": "alex_renamed.pdf",
            "sections": [{"section_type": "summary", "content": "Updated summary."}],
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["file_name"] == "alex_renamed.pdf"
    assert len(body["sections"]) == 1
    assert body["sections"][0]["content"] == "Updated summary."


async def test_delete_resume_removes_row(client):
    resume_id = await _create(client)
    res = await client.delete(f"/api/v1/resumes/{resume_id}")
    assert res.status_code == 204
    assert (await client.get("/api/v1/resumes")).json() == []


async def test_get_missing_resume_is_404(client):
    res = await client.get("/api/v1/resumes/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


async def test_analyze_resume_persists_real_score(client):
    resume_id = await _create(client)
    res = await client.post(
        f"/api/v1/resumes/{resume_id}/analyze",
        json={
            "job_title": "Backend Engineer",
            "job_description": "We need strong Python and FastAPI skills, plus PostgreSQL experience.",
        },
    )
    assert res.status_code == 200, res.text
    report = res.json()
    assert 0.0 <= report["overall"] <= 100.0
    assert report["limits_note"]  # readiness disclaimer travels with the score

    detail = (await client.get(f"/api/v1/resumes/{resume_id}")).json()
    assert detail["latest_ats_score"] == pytest.approx(report["overall"], abs=0.01)

    listed = (await client.get("/api/v1/resumes")).json()
    assert listed[0]["latest_ats_score"] == pytest.approx(report["overall"], abs=0.01)
