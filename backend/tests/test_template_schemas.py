# ============================================================================
# File: backend/tests/test_template_schemas.py
# Description: Unit tests validating every single limit and constraint
#              on the Template Pydantic schemas.
# ============================================================================

import pytest
from pydantic import ValidationError

from app.schemas.templates import (
    DensityEnum,
    EducationItem,
    ExperienceItem,
    FontEnum,
    GenerateRequest,
    GenerateResponse,
    HeaderStyleEnum,
    LayoutEnum,
    MoodEnum,
    ProjectItem,
    ResumeContent,
    SectionName,
    StyleSpec,
)


def _valid_style_dict(**overrides):
    base = {
        "layout": "single_column",
        "font": "Calibri",
        "size_pt": 11.0,
        "density": "normal",
        "header_style": "left",
        "section_order": ["summary", "skills", "experience", "projects", "education"],
        "mood": "corporate",
        "hue": 210,
    }
    base.update(overrides)
    return base


def _valid_content_dict(**overrides):
    base = {
        "headline": "Full Stack AI Engineer",
        "summary": "Building scalable LLM systems and distributed backends.",
        "skills": ["Python", "TypeScript", "FastAPI"],
        "experience": [
            {
                "role": "Senior Engineer",
                "company": "Tech Corp",
                "bullets": ["Engineered core APIs", "Reduced latency by 40%"],
            }
        ],
        "projects": [
            {
                "name": "Placemind",
                "description": "ATS and resume platform",
                "bullets": ["Deployed on Kubernetes"],
            }
        ],
        "education": [
            {
                "degree": "B.S. Computer Science",
                "institution": "University of Tech",
                "year": "2022",
            }
        ],
    }
    base.update(overrides)
    return base


# ============================================================================
# StyleSpec Limits
# ============================================================================

def test_style_spec_valid():
    spec = StyleSpec(**_valid_style_dict())
    assert spec.layout == LayoutEnum.SINGLE_COLUMN
    assert spec.font == FontEnum.CALIBRI
    assert spec.size_pt == 11.0
    assert spec.hue == 210


def test_style_spec_extra_forbidden():
    data = _valid_style_dict(extra_field="disallowed")
    with pytest.raises(ValidationError) as exc:
        StyleSpec(**data)
    assert "extra_forbidden" in str(exc.value)


@pytest.mark.parametrize("size", [10.0, 11.0, 12.0])
def test_style_spec_size_pt_valid_limits(size):
    spec = StyleSpec(**_valid_style_dict(size_pt=size))
    assert spec.size_pt == size


@pytest.mark.parametrize("size", [9.9, 12.1, 5.0, 15.0])
def test_style_spec_size_pt_invalid_limits(size):
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(size_pt=size))


@pytest.mark.parametrize("hue", [None, 0, 180, 360])
def test_style_spec_hue_valid_limits(hue):
    spec = StyleSpec(**_valid_style_dict(hue=hue))
    assert spec.hue == hue


@pytest.mark.parametrize("hue", [-1, 361, 500])
def test_style_spec_hue_invalid_limits(hue):
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(hue=hue))


def test_style_spec_invalid_enums():
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(layout="invalid_layout"))
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(font="Comic Sans"))
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(density="ultra_loose"))
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(header_style="floating"))
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(mood="wild"))


def test_style_spec_section_order_permutation_valid():
    # Different valid permutation of all 5 sections
    perm = ["education", "projects", "skills", "experience", "summary"]
    spec = StyleSpec(**_valid_style_dict(section_order=perm))
    assert [s.value for s in spec.section_order] == perm


@pytest.mark.parametrize(
    "invalid_order",
    [
        ["summary", "skills", "experience", "projects"],  # missing education (4 items)
        ["summary", "skills", "experience", "projects", "education", "summary"],  # 6 items
        ["summary", "skills", "experience", "projects", "projects"],  # duplicate
        ["summary", "skills", "experience", "projects", "certifications"],  # unknown section
        [],  # empty
    ],
)
def test_style_spec_section_order_permutation_invalid(invalid_order):
    with pytest.raises(ValidationError):
        StyleSpec(**_valid_style_dict(section_order=invalid_order))


# ============================================================================
# ResumeContent Limits
# ============================================================================

def test_resume_content_valid():
    content = ResumeContent(**_valid_content_dict())
    assert content.headline == "Full Stack AI Engineer"
    assert len(content.skills) == 3


def test_resume_content_extra_forbidden():
    data = _valid_content_dict(extra_field="not_allowed")
    with pytest.raises(ValidationError) as exc:
        ResumeContent(**data)
    assert "extra_forbidden" in str(exc.value)


def test_resume_content_headline_limit():
    # 120 chars allowed
    valid_headline = "A" * 120
    content = ResumeContent(**_valid_content_dict(headline=valid_headline))
    assert content.headline == valid_headline

    # 121 chars rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(headline="A" * 121))


def test_resume_content_summary_limit():
    # 400 chars allowed
    valid_summary = "B" * 400
    content = ResumeContent(**_valid_content_dict(summary=valid_summary))
    assert content.summary == valid_summary

    # 401 chars rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(summary="B" * 401))


def test_resume_content_skills_limit():
    # 20 skills allowed
    valid_skills = [f"Skill{i}" for i in range(20)]
    content = ResumeContent(**_valid_content_dict(skills=valid_skills))
    assert len(content.skills) == 20

    # 21 skills rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(skills=[f"Skill{i}" for i in range(21)]))


def test_resume_content_experience_limit():
    item = {"role": "Engineer", "company": "Co", "bullets": ["Did work"]}
    # 4 experiences allowed
    content = ResumeContent(**_valid_content_dict(experience=[item] * 4))
    assert len(content.experience) == 4

    # 5 experiences rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(experience=[item] * 5))


def test_experience_item_bullets_limit():
    # 5 bullets allowed
    item = ExperienceItem(role="Dev", company="Co", bullets=["bullet"] * 5)
    assert len(item.bullets) == 5

    # 6 bullets rejected
    with pytest.raises(ValidationError):
        ExperienceItem(role="Dev", company="Co", bullets=["bullet"] * 6)

    # Bullet length <= 220 chars allowed
    valid_bullet = "X" * 220
    item2 = ExperienceItem(role="Dev", bullets=[valid_bullet])
    assert item2.bullets[0] == valid_bullet

    # Bullet length 221 chars rejected
    with pytest.raises(ValidationError):
        ExperienceItem(role="Dev", bullets=["X" * 221])


def test_experience_item_optional_company():
    # company is optional
    item = ExperienceItem(role="Founder", bullets=["Built product"])
    assert item.company is None


def test_resume_content_projects_limit():
    proj = {"name": "Proj", "description": "Desc", "bullets": ["B1"]}
    # 4 projects allowed
    content = ResumeContent(**_valid_content_dict(projects=[proj] * 4))
    assert len(content.projects) == 4

    # 5 projects rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(projects=[proj] * 5))


def test_project_item_bullets_limit():
    # 5 bullets allowed
    item = ProjectItem(name="App", bullets=["b"] * 5)
    assert len(item.bullets) == 5

    # 6 bullets rejected
    with pytest.raises(ValidationError):
        ProjectItem(name="App", bullets=["b"] * 6)

    # Bullet length 221 chars rejected
    with pytest.raises(ValidationError):
        ProjectItem(name="App", bullets=["b" * 221])


def test_resume_content_education_limit():
    edu = {"degree": "B.S.", "institution": "College"}
    # 3 education items allowed
    content = ResumeContent(**_valid_content_dict(education=[edu] * 3))
    assert len(content.education) == 3

    # 4 education items rejected
    with pytest.raises(ValidationError):
        ResumeContent(**_valid_content_dict(education=[edu] * 4))


# ============================================================================
# GenerateRequest Limits
# ============================================================================

def test_generate_request_valid():
    req = GenerateRequest(prompt="Make modern resume", jd_text="Job description")
    assert req.prompt == "Make modern resume"
    assert req.jd_text == "Job description"


def test_generate_request_prompt_limit():
    # 500 chars allowed
    valid_p = "P" * 500
    req = GenerateRequest(prompt=valid_p)
    assert req.prompt == valid_p

    # 501 chars rejected
    with pytest.raises(ValidationError):
        GenerateRequest(prompt="P" * 501)


def test_generate_request_jd_text_limit():
    # None allowed
    req1 = GenerateRequest(prompt="Prompt", jd_text=None)
    assert req1.jd_text is None

    # 4000 chars allowed
    valid_jd = "J" * 4000
    req2 = GenerateRequest(prompt="Prompt", jd_text=valid_jd)
    assert req2.jd_text == valid_jd

    # 4001 chars rejected
    with pytest.raises(ValidationError):
        GenerateRequest(prompt="Prompt", jd_text="J" * 4001)


def test_generate_request_extra_forbidden():
    with pytest.raises(ValidationError) as exc:
        GenerateRequest(prompt="Prompt", injected_field="hack")
    assert "extra_forbidden" in str(exc.value)


# ============================================================================
# GenerateResponse Limits
# ============================================================================

def test_generate_response_valid():
    style = StyleSpec(**_valid_style_dict())
    content = ResumeContent(**_valid_content_dict())
    res = GenerateResponse(
        style=style,
        content=content,
        warnings=["Low contrast adjusted"],
        latency_ms=125.4,
        source="model",
    )
    assert res.source == "model"
    assert res.latency_ms == 125.4

    res2 = GenerateResponse(
        style=style,
        content=content,
        source="fallback",
    )
    assert res2.source == "fallback"


def test_generate_response_source_invalid():
    style = StyleSpec(**_valid_style_dict())
    content = ResumeContent(**_valid_content_dict())
    with pytest.raises(ValidationError):
        GenerateResponse(
            style=style,
            content=content,
            source="invalid_source",
        )


def test_generate_response_extra_forbidden():
    style = StyleSpec(**_valid_style_dict())
    content = ResumeContent(**_valid_content_dict())
    with pytest.raises(ValidationError) as exc:
        GenerateResponse(
            style=style,
            content=content,
            source="model",
            extra_field="forbidden",
        )
    assert "extra_forbidden" in str(exc.value)
