#!/usr/bin/env python3
# ============================================================================
# File: backend/scripts/ping_llm.py
# Description: Sends "say hi" to OSS LLM endpoint via HybridLLMRouter and prints
#              the reply and seconds taken.
# ============================================================================

import asyncio
import os
import sys
import time
from pathlib import Path

# Add backend directory to sys.path so app modules can be loaded
script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent if script_dir.name == "scripts" else script_dir
if not (backend_root / "app").exists() and (backend_root.parent / "backend" / "app").exists():
    backend_root = backend_root.parent / "backend"

if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.services.ai_router import HybridLLMRouter, RoutingMode


async def ping() -> None:
    router = HybridLLMRouter()
    start_time = time.perf_counter()
    try:
        response = await router.complete(
            messages=[{"role": "user", "content": "say hi"}],
            mode=RoutingMode.OSS,
        )
        elapsed = time.perf_counter() - start_time
        print(f"Reply: {response.content}")
        print(f"Seconds taken: {elapsed:.2f}s")
    except Exception as exc:
        elapsed = time.perf_counter() - start_time
        print(f"Error pinging OSS LLM after {elapsed:.2f}s: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(ping())
