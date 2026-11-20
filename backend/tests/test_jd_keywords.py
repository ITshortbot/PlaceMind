from app.services.jd_keywords import jd_terms, resume_covers

JD = [
    "We want a fresher to join our marketing team and learn about social media marketing",
    "You will learn more about SEO, content strategy and Google Analytics",
    "Want to join a team that loves data? Learn Excel and campaign reporting",
]


def test_filler_words_never_become_keywords():
    terms = jd_terms(JD)
    for filler in ["want", "join", "learn", "about", "more", "fresher", "team", "will"]:
        assert filler not in terms


def test_role_and_skill_terms_are_kept_and_ranked_by_frequency():
    terms = jd_terms(JD)
    assert terms[0] == "marketing"
    for kept in ["social", "media", "seo", "content", "strategy", "analytics", "excel", "campaign", "reporting"]:
        assert kept in terms


def test_every_keyword_comes_from_the_job_text():
    text = " ".join(JD).lower()
    assert all(t in text for t in jd_terms(JD))


def test_result_is_deterministic():
    assert jd_terms(JD) == jd_terms(list(JD))


def test_no_text_gives_no_keywords():
    assert jd_terms([]) == []
    assert jd_terms(["we want to join and learn more"]) == []


def test_resume_coverage_uses_alias_and_stem():
    assert resume_covers("analytics", {"analytic"}) or resume_covers("campaigns", {"campaign"})
    assert not resume_covers("seo", {"python", "sql"})
