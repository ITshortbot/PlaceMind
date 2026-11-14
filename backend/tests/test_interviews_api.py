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
async def test_list_sessions_counts_completed_planned_not_raw_turns(client):
    """Dashboard summary must match progress semantics: a planned question with a
    pending follow-up is not yet answered, and follow-up turns never inflate the
    count beyond question_count (the '6/3 Questions Answered' bug)."""
    sid = await _create(client)
    await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": THIN_ANSWER})
    sessions = (await client.get("/api/v1/interviews/sessions")).json()
    s = next(x for x in sessions if x["session_id"] == sid)
    assert s["answered"] == 0  # planned Q1 answered but its follow-up is pending
    assert s["question_count"] == 4

    await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": RICH_ANSWER})
    sessions = (await client.get("/api/v1/interviews/sessions")).json()
    s = next(x for x in sessions if x["session_id"] == sid)
    assert s["answered"] == 1


@pytest.mark.asyncio
async def test_question_count_validation(client):
    res = await client.post(
        "/api/v1/interviews/sessions",
        json={"target_role": "Backend Engineer", "question_count": 99},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_duplicate_answer_retry_lands_on_pending_follow_up(client):
    """Characterize retry behavior: a double-submitted answer is applied to the
    pending follow-up turn (no crash, progress/report integrity preserved)."""
    sid = await _create(client)
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": THIN_ANSWER})
    assert res.json()["next_question"]["category"] == "follow-up"

    # client retry of the SAME answer text (e.g. double click / network retry)
    res = await client.post(f"/api/v1/interviews/sessions/{sid}/answer", json={"answer": THIN_ANSWER})
    assert res.status_code == 200, res.text
    body = res.json()
    # the duplicate was consumed as the follow-up's answer; session stays coherent
    assert body["progress"] == "1/4"
    assert body["next_question"]["category"] != "follow-up"
    assert body["next_question"]["order"] == 2

    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    assert state.json()["answered"] == 1
    report = await client.get(f"/api/v1/interviews/sessions/{sid}/report")
    assert report.status_code == 200
    assert len(report.json()["per_question"]) == 2


@pytest.mark.asyncio
async def test_stale_retry_same_category_different_turn_replays(client):
    """Category alone is not identity: after advancing to another planned
    question of the SAME category, a delayed retry of the old answer must not
    be consumed against the new turn."""
    sid = await _create(client)
    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    q1 = state.json()["current_question"]

    first = await client.post(
        f"/api/v1/interviews/sessions/{sid}/answer",
        json={"answer": RICH_ANSWER, "expected_order": q1["order"], "expected_category": q1["category"]},
    )
    assert first.status_code == 200
    nxt = first.json()["next_question"]
    assert nxt["order"] != q1["order"] or nxt["category"] != q1["category"]  # rich answer moves on
    before = await client.get(f"/api/v1/interviews/sessions/{sid}/report")
    before_count = len(before.json()["per_question"])

    # delayed retry of the Q1 answer, carrying Q1's identity, while the
    # session now serves a different turn - possibly the same category
    retry = await client.post(
        f"/api/v1/interviews/sessions/{sid}/answer",
        json={"answer": RICH_ANSWER, "expected_order": q1["order"], "expected_category": q1["category"]},
    )
    assert retry.status_code == 200, retry.text
    body = retry.json()
    assert body["progress"] == "1/4"  # unchanged: nothing consumed
    assert body["next_question"]["order"] == nxt["order"]
    after = await client.get(f"/api/v1/interviews/sessions/{sid}/report")
    assert len(after.json()["per_question"]) == before_count


@pytest.mark.asyncio
async def test_duplicate_concurrent_requests_consume_once(client):
    """Two in-flight submissions of the same answer: exactly one is consumed,
    exactly one follow-up turn is created."""
    import asyncio as _asyncio

    sid = await _create(client)
    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    q1 = state.json()["current_question"]
    payload = {"answer": THIN_ANSWER, "expected_order": q1["order"], "expected_category": q1["category"]}

    r1, r2 = await _asyncio.gather(
        client.post(f"/api/v1/interviews/sessions/{sid}/answer", json=payload),
        client.post(f"/api/v1/interviews/sessions/{sid}/answer", json=payload),
    )
    assert r1.status_code == 200 and r2.status_code == 200
    bodies = sorted([r1.json(), r2.json()], key=lambda b: b["progress"])
    assert bodies[0]["progress"] == "0/4"  # consumer: follow-up pending
    assert bodies[1]["progress"] == "0/4"  # replay: same state, nothing extra consumed

    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    turns = state.json()["turns"]
    follow_ups = [t for t in turns if t["category"] == "follow-up"]
    assert len(follow_ups) == 1
    answered = [t for t in turns if t["answer_text"] is not None]
    assert len(answered) == 1


@pytest.mark.asyncio
async def test_matching_identity_consumes_normally(client):
    """A request whose expected identity matches the current turn is consumed,
    even when the same answer text legitimately repeats."""
    sid = await _create(client)
    state = await client.get(f"/api/v1/interviews/sessions/{sid}")
    q1 = state.json()["current_question"]
    res = await client.post(
        f"/api/v1/interviews/sessions/{sid}/answer",
        json={"answer": THIN_ANSWER, "expected_order": q1["order"], "expected_category": q1["category"]},
    )
    assert res.status_code == 200
    assert res.json()["next_question"]["category"] == "follow-up"

    fu = res.json()["next_question"]
    res = await client.post(
        f"/api/v1/interviews/sessions/{sid}/answer",
        json={"answer": THIN_ANSWER, "expected_order": fu["order"], "expected_category": "follow-up"},
    )
    assert res.status_code == 200
    assert res.json()["progress"] == "1/4"  # same text, correct turn: consumed
