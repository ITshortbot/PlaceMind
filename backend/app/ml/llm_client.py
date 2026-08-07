import httpx
import json
import os
from typing import List, Dict, Any, AsyncGenerator
from ..core.logger import logger

class LLMClient:
    def __init__(self, base_url: str = None):
        self.provider = os.getenv("LLM_PROVIDER", "ollama").lower()
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"

    async def chat(self, messages: List[Dict[str, str]], model: str = "qwen2.5:7b-instruct-q4_K_M") -> str:
        if self.provider == "openrouter" and self.openrouter_api_key:
            return await self._chat_openrouter(messages, model)
        try:
            return await self._chat_ollama(messages, model)
        except Exception as e:
            if self.openrouter_api_key:
                logger.warning(f"Ollama local inference failed ({e}). Failing over to OpenRouter Cloud API...")
                return await self._chat_openrouter(messages, model)
            raise e

    async def _chat_ollama(self, messages: List[Dict[str, str]], model: str) -> str:
        payload = {"model": model, "messages": messages, "stream": False}
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            return response.json()["message"]["content"]

    async def _chat_openrouter(self, messages: List[Dict[str, str]], model: str) -> str:
        headers = {"Authorization": f"Bearer {self.openrouter_api_key}", "Content-Type": "application/json"}
        payload = {"model": "qwen/qwen-2.5-7b-instruct", "messages": messages}
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(self.openrouter_url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def chat_stream(self, messages: List[Dict[str, str]], model: str = "qwen2.5:7b-instruct-q4_K_M") -> AsyncGenerator[str, None]:
        payload = {"model": model, "messages": messages, "stream": True}
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            yield "Thank you for your response. Let's move on to the next question."

    async def chat_json(self, messages: List[Dict[str, str]], model: str = "qwen2.5:7b-instruct-q4_K_M", max_retries: int = 2) -> Dict[str, Any]:
        payload = {"model": model, "messages": messages, "stream": False, "format": "json"}
        last_result = ""
        for attempt in range(max_retries + 1):
            try:
                res_text = await self.chat(messages, model)
                last_result = res_text
                return json.loads(res_text)
            except json.JSONDecodeError:
                if attempt == max_retries:
                    raise ValueError(f"Failed to decode JSON from model after {max_retries} retries. Last result: {last_result}")
            except Exception as e:
                if attempt == max_retries:
                    raise e

llm_client = LLMClient()
