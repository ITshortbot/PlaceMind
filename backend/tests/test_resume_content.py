from types import SimpleNamespace

from app.services.resume_content import content_from_resume


def _sec(section_type, content, meta_info=None):
    return SimpleNamespace(section_type=section_type, content=content, meta_info=meta_info or {})


def _resume(sections):
    return SimpleNamespace(sections=sections, raw_text="Meera Synth", file_name="synth.txt")


def test_meta_info_draft_experience_is_exact_not_flattened():
    resume = _resume([
        _sec("experience", "Prose first line\nProse second line", {
            "version": 1,
            "draft": {"items": [
                {"role": "Backend Engineer", "company": "SynthCorp",
                 "bullets": ["Built payment retry pipeline", "Cut failure rate"]},
            ]},
        }),
    ])
    content = content_from_resume(resume)
    assert len(content.experience) == 1
    item = content.experience[0]
    assert item.role == "Backend Engineer"
    assert item.company == "SynthCorp"
    assert item.bullets == ["Built payment retry pipeline", "Cut failure rate"]


def test_legacy_content_only_sections_keep_line_mapping():
    resume = _resume([
        _sec("experience", "Support Engineer\nResolved tickets\nWrote runbooks"),
        _sec("skills", "Go, Postgres"),
    ])
    content = content_from_resume(resume)
    assert content.experience[0].role == "Support Engineer"
    assert content.experience[0].company is None
    assert content.experience[0].bullets == ["Resolved tickets", "Wrote runbooks"]
    assert content.skills == ["Go", "Postgres"]


def test_meta_info_draft_skills_and_education_exact():
    resume = _resume([
        _sec("skills", "ignored prose", {"version": 1, "draft": {"skills": ["Go", "Postgres"]}}),
        _sec("education", "ignored", {"version": 1, "draft": {"items": [
            {"degree": "B.Tech CSE", "institution": "Synth Institute", "year": "2024"},
        ]}}),
    ])
    content = content_from_resume(resume)
    assert content.skills == ["Go", "Postgres"]
    assert content.education[0].degree == "B.Tech CSE"
    assert content.education[0].institution == "Synth Institute"
    assert content.education[0].year == "2024"
