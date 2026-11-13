#!/usr/bin/env python3
"""Seed synthetic demo data into the local PlaceMind Postgres database.

ALL records are fictional synthetic personas for demo purposes only.
Safe to re-run: it skips seeding when resumes already exist.

Usage:
    cd backend && python ../scripts/seed_demo.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database.session import async_session  # noqa: E402
from app.database.models import JobDescription, Resume, User  # noqa: E402
from sqlalchemy import select  # noqa: E402

SYNTHETIC_RESUMES = [
    {
        "file_name": "demo_alex_backend_2026.pdf",
        "raw_text": (
            "Alex Doe\nBackend Engineer\n\n"
            "EXPERIENCE\n"
            "Backend Engineer, ExampleCorp (2023-2026)\n"
            "- Built FastAPI services serving 2M requests/day on PostgreSQL and Redis.\n"
            "- Cut p95 API latency from 800ms to 240ms with query tuning and caching.\n\n"
            "SKILLS\n"
            "Python, FastAPI, PostgreSQL, Redis, Docker, Kafka\n\n"
            "EDUCATION\n"
            "B.Tech Computer Science, 2023\n"
        ),
        "job_title": "Backend Engineer",
        "job_company": "ExampleCorp",
        "job_description_raw": (
            "Backend Engineer: Python, FastAPI, PostgreSQL, Redis, Docker. "
            "Nice to have: Kafka, Kubernetes."
        ),
    },
    {
        "file_name": "demo_sara_frontend_2026.pdf",
        "raw_text": (
            "Sara Rao\nFrontend Developer\n\n"
            "EXPERIENCE\n"
            "Frontend Developer, DemoSoft (2022-2026)\n"
            "- Shipped Next.js 15 dashboards used by 40k monthly users.\n"
            "- Raised Lighthouse performance score from 61 to 94.\n\n"
            "SKILLS\n"
            "TypeScript, React, Next.js, Tailwind CSS, Playwright\n\n"
            "EDUCATION\n"
            "B.Sc. Information Technology, 2022\n"
        ),
        "job_title": "Frontend Developer",
        "job_company": "DemoSoft",
        "job_description_raw": (
            "Frontend Developer: TypeScript, React, Next.js, Tailwind CSS. "
            "Nice to have: Playwright, accessibility experience."
        ),
    },
]


async def main() -> None:
    async with async_session() as session:
        existing = await session.execute(select(Resume).limit(1))
        if existing.scalar_one_or_none() is not None:
            print("Resumes already present - skipping seed.")
            return

        user = (
            await session.execute(
                select(User).where(User.email == "demo@placemind.local")
            )
        ).scalar_one_or_none()
        if user is None:
            user = User(
                email="demo@placemind.local",
                full_name="Demo User (synthetic)",
                is_local_only=True,
            )
            session.add(user)
            await session.flush()

        for item in SYNTHETIC_RESUMES:
            session.add(
                Resume(
                    user_id=user.id,
                    file_name=item["file_name"],
                    raw_text=item["raw_text"],
                    parsed_metadata={"synthetic_demo": True},
                )
            )
            session.add(
                JobDescription(
                    user_id=user.id,
                    title=item["job_title"],
                    company=item["job_company"],
                    raw_text=item["job_description_raw"],
                )
            )
        await session.commit()
        print(f"Seeded {len(SYNTHETIC_RESUMES)} synthetic demo resumes + JDs.")


if __name__ == "__main__":
    asyncio.run(main())
