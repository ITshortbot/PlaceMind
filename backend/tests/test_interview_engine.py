# ============================================================================
# File: backend/tests/test_interview_engine.py
# Description: Unit tests for the deterministic interview engine
# ============================================================================

from app.services.interview_engine import build_report, evaluate_answer, generate_plan


def test_plan_respects_count_bounds():
    plan = generate_plan("Data Analyst", None, 99, None, seed=1)
    assert len(plan) == 10
    plan = generate_plan("Data Analyst", None, 1, None, seed=1)
    assert len(plan) == 3


def test_plan_is_deterministic_with_seed():
    a = generate_plan("Backend Engineer", "Acme", 5, None, seed=42)
    b = generate_plan("Backend Engineer", "Acme", 5, None, seed=42)
    assert [q.prompt for q in a] == [q.prompt for q in b]


def test_plan_uses_role_and_company():
    plan = generate_plan("Backend Engineer", "Acme Corp", 5, None, seed=2)
    joined = " ".join(q.prompt for q in plan)
    assert "Backend Engineer" in joined or "Acme Corp" in joined


def test_resume_skills_create_deep_dives():
    plan = generate_plan("ML Engineer", None, 5, "Python, PyTorch and Docker experience", seed=3)
    categories = [q.category for q in plan]
    assert "resume_deep_dive" in categories
    joined = " ".join(q.prompt for q in plan if q.category == "resume_deep_dive")
    assert "python" in joined.lower() or "pytorch" in joined.lower()


def test_evaluate_strong_answer_beats_weak_answer():
    strong = (
        "When our club project missed its first demo, I had to rebuild the API in two days. "
        "I designed a smaller schema, implemented the endpoints, and reduced response time by 40%. "
        "As a result we served 200 requests per second and passed the evaluation."
    )
    weak = "um i did some stuff with code and it was basically fine"
    q = "Tell me about a project."
    strong_fb = evaluate_answer(q, strong)
    weak_fb = evaluate_answer(q, weak)
    assert strong_fb.score > weak_fb.score
    assert weak_fb.improvements  # weak answers get concrete fixes
    assert strong_fb.signals["metrics_cited"] >= 2


def test_empty_answer_scores_low_with_guidance():
    fb = evaluate_answer("q", "")
    assert fb.score < 20
    assert fb.improvements


def test_report_without_answers_is_honest():
    report = build_report([{"category": "behavioral", "prompt": "p", "answer": None, "feedback": None}])
    assert report["overall_score"] is None
    assert report["recommendations"]


def test_report_dimensions_present():
    fb = evaluate_answer("q", "I built and tested a FastAPI app, reducing errors by 25% as a result.")
    report = build_report([{"category": "technical", "prompt": "p", "answer": "a", "feedback": fb}])
    assert set(report["dimensions"]) == {"structure", "quantification", "ownership", "delivery"}
    assert 0 <= report["overall_score"] <= 100


def test_jd_alignment_and_gap_questions():
    resume = "Python, FastAPI and Postgres experience"
    jd = "We need strong Python, Docker and Kubernetes skills"
    plan = generate_plan("Backend Engineer", "Stripe", 6, resume, jd, seed=7)
    cats = [q.category for q in plan]
    assert "jd_alignment" in cats
    alignment = [q for q in plan if q.category == "jd_alignment"]
    assert any("python" in q.prompt.lower() for q in alignment)
    gaps = [q for q in plan if q.category == "jd_gap"]
    # docker/kubernetes are in the JD but not on the resume -> gap probe
    assert gaps and ("docker" in gaps[0].prompt.lower() or "kubernetes" in gaps[0].prompt.lower())


def test_jd_only_without_resume_uses_gap_probe():
    plan = generate_plan("Backend Engineer", None, 5, None, "Requires Go and Kubernetes", seed=11)
    gap = [q for q in plan if q.category == "jd_gap"]
    assert gap  # JD requirements with no resume skills produce gap questions


def test_plan_without_jd_unchanged_categories():
    plan = generate_plan("Backend Engineer", None, 5, None, None, seed=5)
    assert all(q.category in {"behavioral", "technical", "situational"} for q in plan)
