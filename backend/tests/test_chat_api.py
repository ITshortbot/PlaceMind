# ============================================================================
# File: backend/tests/test_chat_api.py
# Description: Chat endpoint contract tests. The deterministic local fallback
#              must always answer with a real reply plus page-legal actions,
#              and the OpenRouter service must refuse any non-free model before
#              a request is attempted. No live model calls in tests.
# ============================================================================

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services import openrouter


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_chat_fallback_answers_with_page_actions(client):
    # No OpenRouter key configured in tests -> service raises -> fallback path.
    res = await client.post(
        "/api/v1/chat",
        json={"message": "how do I check my ATS score?", "page": {"path": "/dashboard"}},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["is_fallback"] is True
    assert body["model_used"] == "local-fallback"
    assert len(body["reply"]) > 10
    # ATS intent on the dashboard should surface the ATS navigation action.
    ids = [a["id"] for a in body["actions"]]
    assert any("ats" in i for i in ids)


@pytest.mark.asyncio
async def test_chat_actions_stay_within_page_capabilities(client):
    res = await client.post(
        "/api/v1/chat",
        json={"message": "hello, what can you do?", "page": {"path": "/settings"}},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["actions"] == []  # settings has no page actions today
    assert len(body["reply"]) > 10


@pytest.mark.asyncio
async def test_free_only_allowlist_refuses_paid_model():
    with pytest.raises(openrouter.OpenRouterError):
        await openrouter.chat_completion(
            [{"role": "user", "content": "hi"}],
            model="openai/gpt-4o",
        )


@pytest.mark.asyncio
async def test_missing_key_raises_honest_error(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    with pytest.raises(openrouter.OpenRouterError) as exc:
        await openrouter.chat_completion([{"role": "user", "content": "hi"}])
    assert "not configured" in str(exc.value)
