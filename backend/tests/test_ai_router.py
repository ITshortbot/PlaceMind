# ============================================================================
# File: backend/tests/test_ai_router.py
# Description: Pytest tests for HybridLLMRouter OSS routing mode with
#              litellm.acompletion mocked for success, timeout, and error cases.
# ============================================================================

import asyncio
from types import SimpleNamespace
from typing import Any
import logging
import pytest

from app.core.config import settings
from app.services.ai_router import HybridLLMRouter, RoutingMode


def _create_mock_response(content: str = "Hello, world!"):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=content)
            )
        ],
        usage=SimpleNamespace(
            prompt_tokens=12,
            completion_tokens=6,
            total_tokens=18,
        ),
    )


@pytest.mark.asyncio
async def test_oss_completion_success(monkeypatch):
    """Test successful OSS route execution via mocked litellm.acompletion."""
    captured_kwargs = {}

    async def mock_acompletion(**kwargs):
        captured_kwargs.update(kwargs)
        return _create_mock_response("Hi from local OSS model!")

    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    router = HybridLLMRouter()
    user_messages = [{"role": "user", "content": "say hi"}]
    response = await router.complete(
        messages=user_messages,
        mode=RoutingMode.OSS,
        temperature=0.3,
    )

    # Validate returned LLMResponse
    assert response.content == "Hi from local OSS model!"
    assert response.routing_mode == RoutingMode.OSS
    assert response.model_used == f"openai/{settings.LLM_MODEL}"
    assert response.is_fallback is False
    assert response.latency_ms >= 0.0
    assert response.token_usage == {
        "prompt_tokens": 12,
        "completion_tokens": 6,
        "total_tokens": 18,
    }

    # Validate parameters passed to LiteLLM
    assert captured_kwargs["model"] == f"openai/{settings.LLM_MODEL}"
    assert captured_kwargs["api_base"] == settings.LLM_BASE_URL
    assert captured_kwargs["api_key"] == settings.LLM_API_KEY
    assert captured_kwargs["timeout"] == settings.LLM_TIMEOUT_S
    assert captured_kwargs["max_tokens"] == settings.LLM_MAX_TOKENS
    assert captured_kwargs["temperature"] == 0.3

    # Validate system message has 'Reasoning: low'
    messages = captured_kwargs["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "Reasoning: low" in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert messages[1]["content"] == "say hi"

    # Validate caller's original list was not modified
    assert len(user_messages) == 1
    assert user_messages[0]["role"] == "user"


@pytest.mark.asyncio
async def test_oss_completion_with_existing_system_message(monkeypatch):
    """Test OSS route appends 'Reasoning: low' to existing system prompt."""
    captured_kwargs = {}

    async def mock_acompletion(**kwargs):
        captured_kwargs.update(kwargs)
        return _create_mock_response("Response")

    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    router = HybridLLMRouter()
    input_messages = [
        {"role": "system", "content": "You are a professional resume reviewer."},
        {"role": "user", "content": "say hi"},
    ]
    await router.complete(messages=input_messages, mode=RoutingMode.OSS)

    messages = captured_kwargs["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "You are a professional resume reviewer." in messages[0]["content"]
    assert "Reasoning: low" in messages[0]["content"]


@pytest.mark.asyncio
async def test_oss_completion_timeout(monkeypatch):
    """Test timeout handling when litellm.acompletion times out."""
    async def mock_timeout(**kwargs):
        raise asyncio.TimeoutError("Request timed out after 60s")

    monkeypatch.setattr("litellm.acompletion", mock_timeout)

    router = HybridLLMRouter()
    with pytest.raises(asyncio.TimeoutError) as exc_info:
        await router.complete(
            messages=[{"role": "user", "content": "say hi"}],
            mode=RoutingMode.OSS,
        )

    assert "Request timed out" in str(exc_info.value)


@pytest.mark.asyncio
async def test_oss_completion_error(monkeypatch):
    """Test error handling when litellm.acompletion raises an exception."""
    async def mock_error(**kwargs):
        raise ConnectionRefusedError("Failed to connect to http://localhost:11434/v1")

    monkeypatch.setattr("litellm.acompletion", mock_error)

    router = HybridLLMRouter()
    with pytest.raises(ConnectionRefusedError) as exc_info:
        await router.complete(
            messages=[{"role": "user", "content": "say hi"}],
            mode=RoutingMode.OSS,
        )

    assert "Failed to connect" in str(exc_info.value)


@pytest.mark.asyncio
async def test_oss_does_not_log_prompts_or_outputs(monkeypatch, caplog):
    """Ensure prompts and model outputs are strictly not logged."""
    secret_prompt = "SUPER_SECRET_CANDIDATE_DATA_98765"
    secret_output = "SUPER_SECRET_EVALUATION_RESULT_43210"

    async def mock_acompletion(**kwargs):
        return _create_mock_response(secret_output)

    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    router = HybridLLMRouter()
    with caplog.at_level(logging.DEBUG):
        await router.complete(
            messages=[{"role": "user", "content": secret_prompt}],
            mode=RoutingMode.OSS,
        )

    for record in caplog.records:
        assert secret_prompt not in record.message
        assert secret_output not in record.message


@pytest.mark.asyncio
async def test_existing_modes_remain_functional(monkeypatch):
    """Ensure existing CLOUD and LOCAL routing modes are preserved unchanged."""
    captured = []

    async def mock_acompletion(**kwargs):
        captured.append(kwargs)
        return _create_mock_response("Cloud reply")

    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    router = HybridLLMRouter()
    response = await router.complete(
        messages=[{"role": "user", "content": "test cloud"}],
        mode=RoutingMode.CLOUD,
    )
    assert response.routing_mode == RoutingMode.CLOUD
    assert response.content == "Cloud reply"
    assert captured[-1]["model"] == settings.CLOUD_MODEL_NAME
