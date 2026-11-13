# ============================================================================
# File: backend/app/services/interview_engine.py
# Description: Deterministic mock-interview engine.
#   - Generates a question plan from a role/company and optional resume skills.
#   - Scores each answer with transparent heuristics (length, quantification,
#     STAR structure, action verbs, filler words) - no LLM required.
#   - Aggregates a per-dimension practice report.
#   All feedback is labeled heuristic practice feedback, not a recruiter verdict.
# ============================================================================

from __future__ import annotations

import random
import re
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Question bank. {role}, {company} and {skill} placeholders are filled from
# the session setup. Categories rotate so a plan mixes behavioural,
# technical and situational probes.
# ---------------------------------------------------------------------------

QUESTION_BANK: dict[str, list[str]] = {
    "behavioral": [
        "Tell me about yourself and why the {role} role at {company} fits your next step.",
        "Describe a time you had to learn a new technology quickly to deliver a project. What was your approach?",
        "Tell me about a conflict or disagreement in a team project and how you resolved it.",
        "What project are you most proud of, and what specifically was your contribution?",
        "Describe a time you missed a deadline or a requirement. What did you do next?",
    ],
    "technical": [
        "Walk me through the architecture of a recent project you built. Why did you choose that design?",
        "How do you approach debugging a production issue you cannot reproduce locally?",
        "Explain a technical concept from your work on {skill} as if I were a new teammate.",
        "How do you decide between building something yourself and using an existing library or service?",
        "What testing strategy did you use on your last project, and what did it catch?",
    ],
    "situational": [
        "Imagine your demo fails five minutes before a presentation. Walk me through your next ten minutes.",
        "If a reviewer questioned why your project needs to exist at all, how would you defend it?",
        "Suppose two requirements conflict and the deadline is fixed. How do you choose what ships?",
        "If you joined {company} tomorrow, what would you want to learn in your first two weeks?",
        "How would you explain your final-year project to a non-technical interviewer?",
    ],
    "resume_deep_dive": [
        "You mention experience with {skill}. What was the hardest problem you solved with it?",
        "Which result on your resume best shows your strengths with {skill}? Give me the numbers behind it.",
        "If you could rebuild your {skill} project from scratch, what would you do differently?",
    ],
    "jd_alignment": [
        "The job description emphasizes {skill}. Walk me through a project where you used it and the outcome.",
        "This role lists {skill} as a requirement. Where have you applied it, and what did you measure?",
        "How would your experience with {skill} transfer to the work described in this job posting?",
    ],
    "jd_gap": [
        "The job description mentions {skill}, which does not appear on your resume. How would you ramp up on it in your first month?",
        "This posting asks for {skill}. You have not listed it - what adjacent experience would you draw on?",
    ],
}

CATEGORY_ORDER = ["behavioral", "technical", "situational", "technical", "behavioral", "situational"]

FILLER_WORDS = {"um", "uh", "like", "basically", "actually", "literally", "stuff", "things"}

ACTION_VERBS = {
    "built", "led", "designed", "implemented", "reduced", "improved", "created",
    "optimized", "shipped", "automated", "migrated", "debugged", "scaled",
    "launched", "refactored", "deployed", "measured", "tested",
}

STAR_MARKERS = {
    "situation": {"when", "while", "during", "context", "background"},
    "task": {"goal", "needed", "had to", "responsible", "tasked", "objective", "requirement"},
    "action": {"i built", "i led", "i designed", "i implemented", "we decided", "i chose", "i wrote", "i set up"},
    "result": {"result", "outcome", "improved", "reduced", "increased", "saved", "because of that", "as a result"},
}


@dataclass
class PlannedQuestion:
    order: int
    category: str
    prompt: str
    focus: str


@dataclass
class AnswerFeedback:
    score: float  # 0-100, heuristic practice score
    strengths: list[str] = field(default_factory=list)
    improvements: list[str] = field(default_factory=list)
    signals: dict = field(default_factory=dict)


def _extract_skills(resume_text: str) -> list[str]:
    """Very small skill spotter: known tech tokens present in the resume text."""
    known = [
        "python", "java", "c++", "javascript", "typescript", "react", "next.js",
        "fastapi", "django", "flask", "node", "sql", "postgresql", "mysql",
        "mongodb", "redis", "docker", "kubernetes", "aws", "gcp", "azure",
        "git", "linux", "ml", "machine learning", "pandas", "numpy",
        "tensorflow", "pytorch", "firebase", "supabase", "graphql", "rest",
    ]
    text = resume_text.lower()
    found = [k for k in known if k in text]
    return found[:6]


def generate_plan(
    target_role: str,
    company: Optional[str],
    question_count: int,
    resume_text: Optional[str] = None,
    job_description: Optional[str] = None,
    seed: Optional[int] = None,
) -> list[PlannedQuestion]:
    rng = random.Random(seed)
    role = (target_role or "this role").strip()
    comp = (company or "our team").strip()
    skills = _extract_skills(resume_text or "")
    jd_skills = _extract_skills(job_description or "")
    gap_skills = [s for s in jd_skills if s not in skills]

    used: set[str] = set()
    plan: list[PlannedQuestion] = []

    # Reserve one deep-dive per distinct skill, then rotate the base categories.
    deep_dives = []
    if skills:
        for skill in skills[:2]:
            template = rng.choice(QUESTION_BANK["resume_deep_dive"])
            deep_dives.append(("resume_deep_dive", template.format(role=role, company=comp, skill=skill)))

    # JD alignment: matched requirements first, then honest gap probes.
    jd_probes = []
    for skill in [s for s in jd_skills if s in skills][:2]:
        template = rng.choice(QUESTION_BANK["jd_alignment"])
        jd_probes.append(("jd_alignment", template.format(role=role, company=comp, skill=skill)))
    for skill in gap_skills[:1]:
        template = rng.choice(QUESTION_BANK["jd_gap"])
        jd_probes.append(("jd_gap", template.format(role=role, company=comp, skill=skill)))

    count = max(3, min(10, question_count))
    idx = 0
    while len(plan) < count:
        if deep_dives and len(plan) >= 2:
            category, prompt = deep_dives.pop(0)
        elif jd_probes and len(plan) >= 3:
            category, prompt = jd_probes.pop(0)
        else:
            category = CATEGORY_ORDER[idx % len(CATEGORY_ORDER)]
            choices = [q for q in QUESTION_BANK[category] if q not in used]
            if not choices:
                choices = QUESTION_BANK[category]
            template = rng.choice(choices)
            used.add(template)
            skill = skills[idx % len(skills)] if skills else "your main stack"
            prompt = template.format(role=role, company=comp, skill=skill)
        plan.append(
            PlannedQuestion(
                order=len(plan) + 1,
                category=category,
                prompt=prompt,
                focus={
                    "behavioral": "Communication and self-awareness",
                    "technical": "Technical depth and reasoning",
                    "situational": "Judgment under constraints",
                    "resume_deep_dive": "Evidence behind resume claims",
                    "jd_alignment": "Alignment with the job description",
                    "jd_gap": "Honest gap between resume and job description",
                }[category],
            )
        )
        idx += 1
    return plan


def evaluate_answer(question: PlannedQuestion | str, answer: str) -> AnswerFeedback:
    text = (answer or "").strip()
    words = re.findall(r"[a-zA-Z']+", text.lower())
    word_count = len(words)
    numbers = re.findall(r"\d+(?:\.\d+)?%?", text)
    lowered = text.lower()

    filler_hits = sum(1 for w in words if w in FILLER_WORDS)
    action_hits = sorted({v for v in ACTION_VERBS if re.search(rf"\b{re.escape(v)}\b", lowered)})
    star_hits = [name for name, markers in STAR_MARKERS.items() if any(m in lowered for m in markers)]

    # --- Score composition (transparent, max 100) ---
    # Structure (STAR markers): 30, Quantification: 20, Action ownership: 20,
    # Substance (length): 20, Delivery (filler penalty): 10
    structure_score = min(30, 10 * len(star_hits))
    quant_score = 20 if len(numbers) >= 2 else (10 if numbers else 0)
    action_score = min(20, 7 * len(action_hits))
    if word_count >= 80:
        length_score = 20
    elif word_count >= 40:
        length_score = 14
    elif word_count >= 15:
        length_score = 8
    else:
        length_score = 2
    delivery_score = max(0, 10 - 5 * filler_hits)

    total = structure_score + quant_score + action_score + length_score + delivery_score

    strengths: list[str] = []
    improvements: list[str] = []

    if star_hits:
        strengths.append(f"STAR structure detected ({', '.join(star_hits)}).")
    else:
        improvements.append("Frame answers as Situation - Task - Action - Result so the story has a clear arc.")
    if len(numbers) >= 2:
        strengths.append("Good quantification - multiple concrete metrics cited.")
    elif numbers:
        improvements.append("Add one more concrete metric (percentage, count, latency) to make the result verifiable.")
    else:
        improvements.append("Quantify the outcome (e.g. 'cut load time by 40%') instead of describing it only qualitatively.")
    if action_hits:
        strengths.append(f"Clear ownership verbs: {', '.join(action_hits[:4])}.")
    else:
        improvements.append("Use first-person action verbs (built, led, reduced) to show what you personally did.")
    if word_count < 40:
        improvements.append("Answer is short for an interview - aim for 60-120 words with one concrete example.")
    if filler_hits:
        improvements.append(f"Cut filler words ({filler_hits} detected) for a more confident delivery.")

    return AnswerFeedback(
        score=round(float(total), 1),
        strengths=strengths,
        improvements=improvements,
        signals={
            "word_count": word_count,
            "metrics_cited": len(numbers),
            "action_verbs": action_hits,
            "star_sections": star_hits,
            "filler_count": filler_hits,
        },
    )


def build_report(turns: list[dict]) -> dict:
    """Aggregate a session report from answered turns.

    turns: [{category, prompt, answer, feedback: AnswerFeedback}]
    """
    answered = [t for t in turns if t.get("feedback")]
    if not answered:
        return {
            "overall_score": None,
            "dimensions": {},
            "per_question": [],
            "recommendations": ["Answer at least one question to generate a practice report."],
            "method_note": METHOD_NOTE,
        }

    def avg(xs):
        return round(sum(xs) / len(xs), 1)

    dims = {
        "structure": avg([min(100, t["feedback"].signals["star_sections"] and 33.3 * len(t["feedback"].signals["star_sections"]) or 0) for t in answered]),
        "quantification": avg([min(100, 50 * t["feedback"].signals["metrics_cited"]) for t in answered]),
        "ownership": avg([min(100, 33 * len(t["feedback"].signals["action_verbs"])) for t in answered]),
        "delivery": avg([max(0, 100 - 50 * t["feedback"].signals["filler_count"]) for t in answered]),
    }
    overall = avg([t["feedback"].score for t in answered])

    per_q = [
        {
            "order": i + 1,
            "category": t["category"],
            "prompt": t["prompt"],
            "score": t["feedback"].score,
            "strengths": t["feedback"].strengths,
            "improvements": t["feedback"].improvements,
        }
        for i, t in enumerate(answered)
    ]

    weakest = sorted(dims.items(), key=lambda kv: kv[1])[:2]
    recs = [f"Work on {name}: weakest practice dimension ({score}/100)." for name, score in weakest]
    recs.append("Re-record your weakest answer with a metric and a STAR arc, then compare scores.")

    return {
        "overall_score": overall,
        "dimensions": dims,
        "per_question": per_q,
        "recommendations": recs,
        "method_note": METHOD_NOTE,
    }


METHOD_NOTE = (
    "Scores come from transparent answer heuristics (STAR structure, quantified "
    "results, action verbs, length, filler words). They are practice feedback, "
    "not a prediction of any real interview outcome."
)
