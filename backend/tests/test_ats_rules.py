# ============================================================================
# File: backend/tests/test_ats_rules.py
# Description: Unit tests for ATS Rules Engine, individual rule evaluations,
#              keyword alias/stemming/stuffing logic, composite weights, and API.
# ============================================================================

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.templates import (
    DensityEnum,
    FontEnum,
    HeaderStyleEnum,
    LayoutEnum,
    MoodEnum,
    ResumeContent,
    SectionName,
    StyleSpec,
    ExperienceItem,
    ProjectItem,
    EducationItem,
)
from app.services.ats_rules import (
    eval_headings_present,
    eval_contact_info_body,
    eval_bullet_style,
    eval_consistent_dates,
    eval_length,
    eval_keyword_coverage,
    compute_ats_readiness,
    simple_stem,
    LIMITS_NOTE,
)


@pytest.fixture
def valid_style() -> StyleSpec:
    return StyleSpec(
        layout=LayoutEnum.SINGLE_COLUMN,
        font=FontEnum.CALIBRI,
        size_pt=11.0,
        density=DensityEnum.NORMAL,
        header_style=HeaderStyleEnum.LEFT,
        section_order=[
            SectionName.SUMMARY,
            SectionName.SKILLS,
            SectionName.EXPERIENCE,
            SectionName.PROJECTS,
            SectionName.EDUCATION,
        ],
        mood=MoodEnum.TECH,
        hue=200,
    )


@pytest.fixture
def valid_content() -> ResumeContent:
    return ResumeContent(
        headline="Senior Distributed Systems Architect | contact@example.com | +1-555-019-2834 | linkedin.com/in/alex",
        summary="Versatile distributed systems engineer with 8+ years architecting fault-tolerant cloud infrastructure platforms and high-throughput vector processing engines.",
        skills=["Python", "FastAPI", "Kubernetes", "PostgreSQL", "Docker", "Redis", "TypeScript", "AWS"],
        experience=[
            ExperienceItem(
                role="Principal Architect",
                company="Tech Systems Corp",
                bullets=[
                    "Engineered distributed ingestion pipeline processing [X] million telemetry events daily.",
                    "Optimized database query latency by [X]% across production PostgreSQL shards (2021 - 2024).",
                    "Automated Kubernetes cluster provisioning and blue-green canary deployments.",
                ],
            ),
            ExperienceItem(
                role="Senior Backend Engineer",
                company="Cloud Solutions Inc",
                bullets=[
                    "Managed event-driven microservices architecture using RabbitMQ and Redis (2018 - 2021).",
                    "Reduced p99 request latency from [X]ms to [X]ms through asynchronous I/O refactoring.",
                ],
            ),
        ],
        projects=[
            ProjectItem(
                name="Vector Search Engine",
                description="High-speed vector similarity database with custom cosine distance indexing.",
                bullets=[
                    "Built lightweight embedded ANN index supporting sub-millisecond nearest neighbor queries.",
                    "Scaled memory usage down by [X]% using float16 quantization algorithms.",
                ],
                link="github.com/alex/vector-engine",
            ),
        ],
        education=[
            EducationItem(
                degree="B.S. in Computer Science",
                institution="State University",
                year="2018",
            ),
        ],
    )


# ─── Individual Rule Tests ───────────────────────────────────────────────────

def test_rule_headings_present(valid_style: StyleSpec, valid_content: ResumeContent):
    # Fully populated
    item = eval_headings_present(valid_content, valid_style)
    assert item.rule_id == "headings_present"
    assert item.passed is True
    assert item.points == 100.0

    # Missing core sections (e.g. experience and projects empty)
    sparse_content = ResumeContent(
        headline="Junior Dev",
        summary="Short summary.",
        skills=["Python"],
        experience=[],
        projects=[],
        education=[],
    )
    item_sparse = eval_headings_present(sparse_content, valid_style)
    assert item_sparse.passed is False
    assert item_sparse.points < 50.0


def test_rule_contact_info_body(valid_style: StyleSpec, valid_content: ResumeContent):
    # Full contact info in headline/body
    item = eval_contact_info_body(valid_content, valid_style)
    assert item.rule_id == "contact_info_body"
    assert item.passed is True
    assert item.points == 100.0

    # Stripped of contact info
    no_contact = valid_content.model_copy(update={
        "headline": "Software Engineer",
        "projects": [ProjectItem(name="App", description="Desc", bullets=["Built something."], link=None)],
    })
    item_no_contact = eval_contact_info_body(no_contact, valid_style)
    assert item_no_contact.passed is False
    assert item_no_contact.points == 0.0


def test_rule_bullet_style(valid_style: StyleSpec, valid_content: ResumeContent):
    item = eval_bullet_style(valid_content, valid_style)
    assert item.rule_id == "bullet_style"
    assert item.passed is True
    assert item.points >= 80.0

    # Poor bullets: no action verbs, too short
    bad_content = valid_content.model_copy(update={
        "experience": [
            ExperienceItem(
                role="Dev",
                company="Company",
                bullets=["bad", "short", "not good"],
            ),
        ],
        "projects": [],
    })
    item_bad = eval_bullet_style(bad_content, valid_style)
    assert item_bad.passed is False
    assert item_bad.points < 50.0


def test_rule_consistent_dates(valid_style: StyleSpec, valid_content: ResumeContent):
    item = eval_consistent_dates(valid_content, valid_style)
    assert item.rule_id == "consistent_dates"
    assert item.passed is True
    assert item.points == 100.0


def test_rule_length_fit(valid_style: StyleSpec, valid_content: ResumeContent):
    # Valid content contains ~220 words
    item = eval_length(valid_content, valid_style)
    assert item.rule_id == "length_fit"
    assert item.passed is True
    assert item.points >= 80.0

    # Critically sparse (< 100 words)
    sparse_content = ResumeContent(
        headline="Engineer",
        summary="Short.",
        skills=["Python"],
        experience=[],
        projects=[],
        education=[],
    )
    item_sparse = eval_length(sparse_content, valid_style)
    assert item_sparse.passed is False
    assert item_sparse.points < 50.0


def test_rule_keyword_coverage_aliases_and_stemming(valid_content: ResumeContent):
    jd_text = (
        "We are seeking a Backend Engineer with k8s expertise, Postgres database skills, "
        "and experience managing cloud infrastructures."
    )
    # Resume contains Kubernetes (alias of k8s), PostgreSQL (alias of postgres),
    # and "managing" is stemmed to match "manage"
    item, missing = eval_keyword_coverage(valid_content, jd_text)
    assert item.rule_id == "keyword_coverage"
    assert item.passed is True
    assert item.points >= 65.0


def test_rule_keyword_stuffing_detection(valid_content: ResumeContent):
    jd_text = "Looking for a Python developer with FastAPI and Kubernetes skills."
    # Create content that artificially repeats "python" 8 times
    stuffed_bullets = ["Python " * 8 + "engineering tasks."]
    stuffed_content = valid_content.model_copy(update={
        "experience": [
            ExperienceItem(
                role="Python Python Developer",
                company="Python Inc",
                bullets=stuffed_bullets,
            ),
        ],
    })
    item, _ = eval_keyword_coverage(stuffed_content, jd_text)
    assert item.passed is False
    assert "keyword stuffing" in item.evidence.lower()


def test_stemmer_function():
    assert simple_stem("engineered") == "engineer"
    assert simple_stem("deploying") == "deploy"
    assert simple_stem("optimization") == "optimiz"
    assert simple_stem("cats") == "cat"
    assert simple_stem("go") == "go"  # <= 3 chars preserved


# ─── Composite Scoring & Determinism Tests ────────────────────────────────────

def test_compute_ats_readiness_determinism(valid_style: StyleSpec, valid_content: ResumeContent):
    jd = "Seeking a Principal Cloud Architect with Kubernetes, PostgreSQL, and Python experience."
    res1 = compute_ats_readiness(valid_content, valid_style, jd)
    res2 = compute_ats_readiness(valid_content, valid_style, jd)

    assert res1.overall == res2.overall
    assert res1.categories == res2.categories
    assert len(res1.items) == len(res2.items)
    for i in range(len(res1.items)):
        assert res1.items[i].rule_id == res2.items[i].rule_id
        assert res1.items[i].points == res2.items[i].points
        assert res1.items[i].evidence == res2.items[i].evidence

    assert res1.limits_note == LIMITS_NOTE
    assert len(res1.top_fixes) <= 5


def test_compute_ats_readiness_configurable_weights(valid_style: StyleSpec, valid_content: ResumeContent):
    jd = "Looking for high scale systems engineer."
    # Default weights (0.5 semantic, 0.3 keyword, 0.2 structure)
    res_default = compute_ats_readiness(valid_content, valid_style, jd)
    # Heavy structure weight
    res_custom = compute_ats_readiness(
        valid_content, valid_style, jd,
        semantic_weight=0.1, keyword_weight=0.1, structure_weight=0.8
    )
    assert 0.0 <= res_default.overall <= 100.0
    assert 0.0 <= res_custom.overall <= 100.0


# ─── API Endpoint Test ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_api_score_doc_endpoint(valid_style: StyleSpec, valid_content: ResumeContent):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "content": valid_content.model_dump(),
            "style": valid_style.model_dump(),
            "jd_text": "We are seeking a senior software engineer with Python and Docker skills.",
        }
        res = await client.post("/api/v1/ats/score-doc", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "overall" in data
        assert "categories" in data
        assert "items" in data
        assert "top_fixes" in data
        assert "limits_note" in data
        assert len(data["items"]) == 6
        assert data["limits_note"] == LIMITS_NOTE
