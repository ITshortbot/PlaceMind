# ============================================================================
# File: backend/tests/test_interviews_api.py
# Description: API tests for the mock-interview endpoints, backed by an
#              in-memory SQLite database via get_db dependency override.
# ============================================================================

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database.models import InterviewSession, InterviewTurn
from app.database.session import get_db
from app.main import app


@pytest.fixture
async def db_override():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(InterviewSession.__table__.create, checkfirst=True)
        await conn.run_sync(InterviewTurn.__table__.create, checkfirst=True)
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


async def _create(client: AsyncClient) -> str:
    res = await client.post(
        "/api/v1/interviews/sessions",
        json={
            "target_role": "Backend Engineer",
            "company": "Acme",
            "interview_type": "practice",
            "question_count": 4,
            "resume_text": "Python FastAPI PostgreSQL Docker project experience",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["session_id"]


@pytest.mark.asyncio
async def test_create_session_returns_plan(client):
    sid = await _create(client)
    res = await client.get(f"/api/v1/interviews/sessions/{sid}")
    assert res.status_code == 200
    body = res.json()
    assert body["question_count"] == 4
    assert body["answered"] == 0
    assert body["current_question"]["order"] == 1
    assert body["status"] == "active"


RICH_ANSWER = (
    "During my final year I had to deliver a FastAPI service for 200 users. "
    "I designed the schema, implemented the endpoints and reduced response time "
    "by 40 percent, and as a result the demo handled 500 requests per second "
    "while the jury rated the project the best of 12 teams on demo day."
)

THIN_ANSWER = "I worked on it."


async def _answer_until_completed(client: AsyncClient, sid: str, answer: str, cap: int = 40) -> dict:
    """Drive the conversational flow: follow-ups and planned questions both
    arrive as next_question; keep answering until the session completes."""
    body: dict = {}
    for _ in range(cap):
        res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": answer})
        assert res.status_code == 200, res.text
        body = res.json()
        if body["completed"]:
            return body
    raise AssertionError("session did not complete within the answer cap")


@pytest.mark.asyncio
async def test_full_session_flow_to_completion(client):
    sid = await _create(client)
    answered_progress = 0
    for _ in range(60):
        res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": RICH_ANSWER})
        assert res.status_code == 200, res.text
        body = res.json()
        # conversational contract: no per-answer scorecard, always an acknowledgment
        assert body["feedback"] is None
        assert body["acknowledgment"]
        if body["completed"]:
            assert body["next_question"] is None
            break
        nxt = body["next_question"]
        assert nxt is not None
        if nxt["category"] != "follow-up":
            answered_progress += 1
            assert body["progress"] == f"{answered_progress}/4"
    else:
        raise AssertionError("session did not complete")
    assert answered_progress == 3  # 4th planned question completed the session

    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    assert state.json()["status"] == "completed"
    assert state.json()["answered"] == 4

    # answering a completed session is rejected
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": "again"})
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_thin_answer_earns_follow_up_before_moving_on(client):
    sid = await _create(client)
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": THIN_ANSWER})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["feedback"] is None
    assert body["acknowledgment"]
    assert body["progress"] == "0/4"
    assert body["completed"] is False
    follow_up = body["next_question"]
    assert follow_up["category"] == "follow-up"
    assert follow_up["order"] == 1  # anchored to the planned question it probes

    # session state serves the follow-up as the current question
    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    assert state.json()["current_question"]["category"] == "follow-up"
    assert state.json()["answered"] == 0

    # answering the follow-up moves on to the next planned question
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": RICH_ANSWER})
    body = res.json()
    assert body["progress"] == "1/4"
    assert body["next_question"]["category"] != "follow-up"
    assert body["next_question"]["order"] == 2


@pytest.mark.asyncio
async def test_rich_answer_skips_follow_up(client):
    sid = await _create(client)
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": RICH_ANSWER})
    body = res.json()
    assert body["progress"] == "1/4"
    assert body["next_question"]["category"] != "follow-up"
    assert body["next_question"]["order"] == 2


@pytest.mark.asyncio
async def test_report_aggregates_and_is_labeled_heuristic(client):
    sid = await _create(client)
    await _answer_until_completed(client, sid, "I built a python api and it improved speed by 30% as a result.")
    res = await client.get(f"/api/v1/interviews/sessions/{sid}/report")
    assert res.status_code == 200
    body = res.json()
    assert body["overall_score"] is not None
    assert set(body["dimensions"].keys()) == {"structure", "quantification", "ownership", "delivery"}
    assert len(body["per_question"]) >= 1
    assert "heuristic" in body["method_note"].lower()
    assert body["recommendations"]


@pytest.mark.asyncio
async def test_list_sessions_and_404(client):
    sid = await _create(client)
    res = await client.get("/api/v1/interviews/sessions")
    assert res.status_code == 200
    sessions = res.json()
    assert any(s["session_id"] == sid for s in sessions)

    res = await client.get("/api/v1/interviews/sessions/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_question_count_validation(client):
    res = await client.post(
        "/api/v1/interviews/sessions",
        json={"target_role": "Backend Engineer", "question_count": 99},
    )
    assert res.status_code == 422
