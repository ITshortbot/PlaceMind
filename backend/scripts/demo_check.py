#!/usr/bin/env python3
# ============================================================================
# File: backend/scripts/demo_check.py
# Description: Hardening verification script running 5 sample prompts 3 times
#              each against the configured model, reporting schema first-try
#              pass rate, fallback rate, and mean/max seconds.
# ============================================================================

import asyncio
import os
import sys
import time
from pathlib import Path
from typing import List

# Add backend directory to sys.path so app modules load seamlessly
script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent if script_dir.name == "scripts" else script_dir
if not (backend_root / "app").exists() and (backend_root.parent / "backend" / "app").exists():
    backend_root = backend_root.parent / "backend"

if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.schemas.templates import GenerateRequest
from app.services.template_generator import TemplateGenerator

SAMPLE_PROMPTS = [
    "clean dark-teal resume for a fresher data analyst, projects first",
    "modern executive tech lead resume with accent banner",
    "compact 1-page software engineer resume, skills first",
    "academic CV for research scientist with education first",
    "minimal finance analyst resume with corporate layout",
]

RUNS_PER_PROMPT = 3


async def run_demo_check():
    generator = TemplateGenerator()
    total_runs = len(SAMPLE_PROMPTS) * RUNS_PER_PROMPT
    latencies: List[float] = []
    first_try_passes = 0
    fallbacks = 0

    print("=" * 72)
    print(" PLACEMIND DEMO HARDENING VERIFICATION")
    print(f" Testing {len(SAMPLE_PROMPTS)} sample prompts x {RUNS_PER_PROMPT} iterations = {total_runs} total executions")
    print("=" * 72)

    run_idx = 0
    for p_idx, prompt in enumerate(SAMPLE_PROMPTS, 1):
        print(f"\n[Prompt {p_idx}/{len(SAMPLE_PROMPTS)}]: \"{prompt}\"")
        for r_idx in range(1, RUNS_PER_PROMPT + 1):
            run_idx += 1
            start = time.perf_counter()
            req = GenerateRequest(prompt=prompt)
            res = await generator.generate(req)
            elapsed = time.perf_counter() - start
            latencies.append(elapsed)

            is_fallback = res.source == "fallback"
            has_retry_warning = any("retry" in w.lower() for w in res.warnings)
            is_first_try = (res.source == "model") and not has_retry_warning

            if is_first_try:
                first_try_passes += 1
            if is_fallback:
                fallbacks += 1

            status_indicator = "✓ FIRST-TRY" if is_first_try else ("⚠ RETRIED" if res.source == "model" else "✖ FALLBACK")
            print(
                f"  Run {r_idx}/{RUNS_PER_PROMPT}: {status_indicator} | "
                f"source={res.source:<8} | latency={elapsed:5.2f}s | "
                f"warnings={len(res.warnings)}"
            )

    mean_sec = sum(latencies) / len(latencies) if latencies else 0.0
    max_sec = max(latencies) if latencies else 0.0
    first_try_rate = (first_try_passes / total_runs) * 100.0 if total_runs else 0.0
    fallback_rate = (fallbacks / total_runs) * 100.0 if total_runs else 0.0

    print("\n" + "=" * 72)
    print(" SUMMARY METRICS")
    print("=" * 72)
    print(f" Total Executions:           {total_runs}")
    print(f" Schema First-Try Pass Rate: {first_try_rate:6.1f}%  ({first_try_passes}/{total_runs})")
    print(f" Fallback Rate:              {fallback_rate:6.1f}%  ({fallbacks}/{total_runs})")
    print(f" Mean Latency:               {mean_sec:6.2f}s")
    print(f" Max Latency:                {max_sec:6.2f}s")
    print("=" * 72)


if __name__ == "__main__":
    asyncio.run(run_demo_check())
