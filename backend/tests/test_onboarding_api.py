# ============================================================================
# File: backend/tests/test_onboarding_api.py
# Description: Onboarding bootstrap tests: answers become a real filled resume
#              built only from supplied facts, and gaps come back in `missing`.
# ============================================================================

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database.models import Resume, ResumeSection, User
from app.database.session import get_db
from app.main import app

SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
SQLiteTypeCompiler.visit_vector = lambda self, type_, **kw: "BLOB"

for _table in (User.__table__, Resume.__table__, ResumeSection.__table__):
    for _col in _table.c:
        if _col.server_default is not None and str(_col.server_default.arg).endswith("::jsonb"):
            _col.server_default = None


@pytest.fixture
async def client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(User.__table__.create, checkfirst=True)
        await conn.run_sync(Resume.__table__.create, checkfirst=True)
        await conn.run_sync(ResumeSection.__table__.create, checkfirst=True)
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
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


@pytest.mark.asyncio
async def test_bootstrap_builds_resume_from_supplied_facts(client):
    res = await client.post(
        "/api/v1/onboarding/bootstrap",
        json={
            "full_name": "Test Student",
            "university": "MIT",
            "specialization": "Computer Science",
            "target_role": "Software Engineer",
            "target_company": "Acme",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    resume = body["resume"]
    assert resume["file_name"] == "Test Student Resume"
    types = [s["section_type"] for s in resume["sections"]]
    assert "contact" in types and "education" in types and "objective" in types
    # Nothing invented: no skills/experience sections were asked for or given.
    assert "skills" not in types and "experience" not in types
    assert "skills" in body["missing"] and "experience" in body["missing"]
    assert "contact.phone" in body["missing"]  # phone not supplied


@pytest.mark.asyncio
async def test_bootstrap_minimal_facts_still_creates(client):
    res = await client.post("/api/v1/onboarding/bootstrap", json={"full_name": "Solo Name"})
    assert res.status_code == 201, res.text
    body = res.json()
    assert [s["section_type"] for s in body["resume"]["sections"]] == ["contact"]
    assert "education.institution" in body["missing"]
