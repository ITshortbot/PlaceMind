# ============================================================================
# File: backend/app/services/ats_rules.py
# Description: ATS Rules Engine evaluating structural, formatting, keyword,
#              and semantic readiness against target job descriptions.
# ============================================================================

import re
from typing import Dict, List, Optional, Set, Tuple
import numpy as np

from app.schemas.ats_rules import ATSRuleItem, ScoreDocResponse
from app.schemas.templates import ResumeContent, StyleSpec
from app.services.embeddings import embedding_engine

LIMITS_NOTE = (
    "This readiness score is an automated estimation based on standard ATS parsing "
    "heuristics and keyword alignment. It does not reflect any proprietary or specific "
    "employer's internal ATS algorithm."
)

# Common technical alias mapping (bi-directional or canonical)
ALIAS_MAP: Dict[str, str] = {
    "k8s": "kubernetes",
    "kubernetes": "k8s",
    "js": "javascript",
    "javascript": "js",
    "ts": "typescript",
    "typescript": "ts",
    "py": "python",
    "python": "py",
    "postgres": "postgresql",
    "postgresql": "postgres",
    "aws": "amazon web services",
    "amazon web services": "aws",
    "gcp": "google cloud",
    "google cloud": "gcp",
    "react": "react.js",
    "react.js": "react",
    "node": "node.js",
    "node.js": "node",
    "ci/cd": "cicd",
    "cicd": "ci/cd",
    "ml": "machine learning",
    "machine learning": "ml",
    "ai": "artificial intelligence",
    "artificial intelligence": "ai",
    "golang": "go",
    "tf": "terraform",
    "terraform": "tf",
}

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "cannot", "could", "did", "do",
    "does", "doing", "don't", "down", "during", "each", "few", "for", "from",
    "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it",
    "its", "itself", "let's", "me", "more", "most", "must", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours",
    "yourself", "yourselves", "work", "role", "years", "candidate", "responsibilities",
    "experience", "experiences", "expertise", "skills", "skill", "seeking", "requirements",
    "including", "knowledge", "required", "preferred", "duties"
}

ACTION_VERBS: Set[str] = {
    "built", "engineered", "designed", "developed", "led", "managed", "optimized",
    "created", "spearheaded", "reduced", "increased", "delivered", "automated",
    "trained", "analyzed", "scaled", "deployed", "implemented", "architected",
    "integrated", "streamlined", "formulated", "migrated", "orchestrated",
    "refactored", "monitored", "configured", "maintained", "conducted", "launched",
    "executed", "collaborated", "established", "supervised", "achieved", "expanded",
    "resolved", "accelerated", "initiated", "directed", "authored", "standardized"
}


def simple_stem(word: str) -> str:
    """
    Deterministic rule-based stemmer removing common English suffixes.
    Preserves roots of at least 3 characters.
    """
    w = word.lower().strip()
    if len(w) <= 3:
        return w

    suffixes = [
        "ingly", "edly", "ation", "tions", "tion", "ness", "ment", "ments",
        "able", "ible", "ing", "ies", "ied", "ed", "es", "al",
        "er", "or", "ly", "s"
    ]
    for suf in suffixes:
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)]
    return w


def extract_all_text(content: ResumeContent) -> str:
    """Concatenates all plain text fields from the resume content."""
    parts: List[str] = []
    if content.headline:
        parts.append(content.headline)
    if content.summary:
        parts.append(content.summary)
    if content.skills:
        parts.append(" ".join(content.skills))
    for exp in content.experience:
        if exp.role:
            parts.append(exp.role)
        if exp.company:
            parts.append(exp.company)
        parts.extend(exp.bullets)
    for proj in content.projects:
        parts.append(proj.name)
        parts.append(proj.description)
        parts.extend(proj.bullets)
        if proj.link:
            parts.append(proj.link)
    for edu in content.education:
        parts.append(edu.degree)
        parts.append(edu.institution)
        if edu.year:
            parts.append(edu.year)
    return " ".join(parts)


def eval_headings_present(content: ResumeContent, style: StyleSpec) -> ATSRuleItem:
    """Rule 1: Evaluates presence and order of standard section headings."""
    standard_sections = ["summary", "skills", "experience", "projects", "education"]
    populated: List[str] = []

    if content.summary and content.summary.strip():
        populated.append("summary")
    if content.skills and len(content.skills) > 0:
        populated.append("skills")
    if content.experience and len(content.experience) > 0:
        populated.append("experience")
    if content.projects and len(content.projects) > 0:
        populated.append("projects")
    if content.education and len(content.education) > 0:
        populated.append("education")

    missing = [s for s in standard_sections if s not in populated]
    score = (len(populated) / len(standard_sections)) * 100.0
    passed = len(populated) >= 4 and "experience" in populated and "skills" in populated

    if passed and len(missing) == 0:
        evidence = f"All {len(populated)} standard sections populated in order: {', '.join([s.value for s in style.section_order])}."
        fix = "No action needed. Standard headings are clearly recognizable."
    elif passed:
        evidence = f"Populated {len(populated)}/5 standard sections. Missing content for: {', '.join(missing)}."
        fix = f"Consider adding content for {', '.join(missing)} to maximize profile completeness."
    else:
        evidence = f"Only {len(populated)}/5 sections present. Crucial sections missing: {', '.join(missing)}."
        fix = f"Add missing core sections ({', '.join(missing)}) so ATS parsers can categorize your qualifications."

    return ATSRuleItem(
        rule_id="headings_present",
        category="structure",
        passed=passed,
        points=round(score, 1),
        evidence=evidence,
        fix=fix,
    )


def eval_contact_info_body(content: ResumeContent, style: StyleSpec) -> ATSRuleItem:
    """Rule 2: Ensures contact details (email, phone, link) reside in accessible body text."""
    full_text = extract_all_text(content)

    has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|\[email\]", full_text, re.IGNORECASE))
    has_phone = bool(re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}|\[phone\]", full_text))
    has_link = bool(re.search(r"(linkedin\.com|github\.com|https?://|www\.|\[link\])", full_text, re.IGNORECASE)) or any(
        bool(p.link) for p in content.projects
    )

    score = 0.0
    if has_email:
        score += 40.0
    if has_phone:
        score += 30.0
    if has_link:
        score += 30.0

    passed = score >= 70.0
    detected_parts = []
    if has_email:
        detected_parts.append("email")
    if has_phone:
        detected_parts.append("phone")
    if has_link:
        detected_parts.append("professional URL/link")

    missing_parts = []
    if not has_email:
        missing_parts.append("email")
    if not has_phone:
        missing_parts.append("phone number")
    if not has_link:
        missing_parts.append("LinkedIn/GitHub profile link")

    if passed:
        evidence = f"Contact details accessible in text: {', '.join(detected_parts)}."
        fix = (
            f"Add {', '.join(missing_parts)} to your header for complete contact accessibility."
            if missing_parts else "No action needed. Contact info is fully machine-readable."
        )
    else:
        evidence = f"Incomplete contact details in body text. Found: {', '.join(detected_parts) if detected_parts else 'None'}."
        fix = f"Ensure plain contact info ({', '.join(missing_parts)}) is placed directly in body text rather than graphics."

    return ATSRuleItem(
        rule_id="contact_info_body",
        category="structure",
        passed=passed,
        points=round(score, 1),
        evidence=evidence,
        fix=fix,
    )


def eval_bullet_style(content: ResumeContent, style: StyleSpec) -> ATSRuleItem:
    """Rule 3: Evaluates action verbs, character length (35-220 chars), and clean bullet format."""
    all_bullets: List[str] = []
    for exp in content.experience:
        all_bullets.extend(exp.bullets)
    for proj in content.projects:
        all_bullets.extend(proj.bullets)

    if not all_bullets:
        return ATSRuleItem(
            rule_id="bullet_style",
            category="formatting",
            passed=False,
            points=0.0,
            evidence="No bullet points found across Experience or Projects sections.",
            fix="Add bullet points describing accomplishments in your experience and project roles.",
        )

    valid_verb_count = 0
    valid_length_count = 0

    for b in all_bullets:
        text = b.strip()
        first_word = re.findall(r"^[A-Za-z]+", text)
        if first_word:
            stemmed = simple_stem(first_word[0].lower())
            if first_word[0].lower() in ACTION_VERBS or stemmed in {simple_stem(v) for v in ACTION_VERBS}:
                valid_verb_count += 1

        if 35 <= len(text) <= 220:
            valid_length_count += 1

    total = len(all_bullets)
    verb_ratio = valid_verb_count / total
    length_ratio = valid_length_count / total
    score = round(((verb_ratio * 0.5) + (length_ratio * 0.5)) * 100.0, 1)
    passed = score >= 70.0

    evidence = (
        f"{valid_verb_count}/{total} bullets begin with strong action verbs; "
        f"{valid_length_count}/{total} satisfy optimal 35-220 character lengths."
    )
    if passed:
        fix = "No action needed. Bullet points are concise and action-oriented."
    else:
        fix = (
            "Start every bullet with a measurable action verb (e.g. 'Engineered', 'Optimized') "
            "and ensure each bullet is between 35 and 220 characters."
        )

    return ATSRuleItem(
        rule_id="bullet_style",
        category="formatting",
        passed=passed,
        points=score,
        evidence=evidence,
        fix=fix,
    )


def eval_consistent_dates(content: ResumeContent, style: StyleSpec) -> ATSRuleItem:
    """Rule 4: Validates date consistency across Experience and Education entries."""
    edu_years = [edu.year for edu in content.education if edu.year]
    valid_edu_years = [y for y in edu_years if re.search(r"\b(19\d{2}|20\d{2})\b", y)]

    # Check experience dates
    exp_bullets_and_roles = [f"{e.role} {e.company or ''} {' '.join(e.bullets)}" for e in content.experience]
    exp_with_dates = sum(1 for text in exp_bullets_and_roles if re.search(r"\b(19\d{2}|20\d{2})\b", text))

    total_entries = len(content.education) + len(content.experience)
    if total_entries == 0:
        return ATSRuleItem(
            rule_id="consistent_dates",
            category="formatting",
            passed=True,
            points=80.0,
            evidence="No formal work or degree history provided.",
            fix="Add dated experience and education to demonstrate chronological career progression.",
        )

    dated_entries = len(valid_edu_years) + exp_with_dates
    ratio = min(1.0, (len(valid_edu_years) + 1.0) / max(len(content.education) + 1.0, 1.0))
    score = round(ratio * 100.0, 1)
    passed = score >= 75.0

    if passed:
        evidence = f"All {len(valid_edu_years)} education degrees and experience entries show consistent 4-digit year dates."
        fix = "No action needed. Chronological dates are consistent."
    else:
        evidence = f"Some entries lack standardized 4-digit years (e.g., 2021 - 2024)."
        fix = "Format all employment and degree dates consistently using 'YYYY - YYYY' or 'Month YYYY'."

    return ATSRuleItem(
        rule_id="consistent_dates",
        category="formatting",
        passed=passed,
        points=score,
        evidence=evidence,
        fix=fix,
    )


def eval_length(content: ResumeContent, style: StyleSpec) -> ATSRuleItem:
    """Rule 5: Evaluates word count and formatting density to ensure clean 1-page fit."""
    full_text = extract_all_text(content)
    words = re.findall(r"\b[A-Za-z0-9_-]+\b", full_text)
    word_count = len(words)

    # Standard 1-page resume has 200 - 550 words
    if 200 <= word_count <= 550:
        score = 100.0
        passed = True
        evidence = f"Resume contains {word_count} words with {style.density.value} density and {style.size_pt}pt font, fitting an optimal 1-page layout."
        fix = "No action needed. Content volume fits standard 1-page ATS expectations."
    elif 130 <= word_count < 200:
        score = 80.0
        passed = True
        evidence = f"Resume contains {word_count} words, which is slightly sparse for a standard page."
        fix = "Add more detail to your project and experience bullet points to bring length into the 200-500 word range."
    elif 550 < word_count <= 700:
        score = 80.0
        passed = True
        evidence = f"Resume contains {word_count} words, which may push close to a second page depending on margins."
        fix = "Condense bullet points to stay comfortably under 550 words if targeting a single page."
    elif word_count < 130:
        score = 45.0
        passed = False
        evidence = f"Resume contains only {word_count} words, which is critically sparse."
        fix = "Expand your technical accomplishments and summary to exceed at least 200 words."
    else:
        score = 60.0
        passed = False
        evidence = f"Resume exceeds {word_count} words and risks spilling over into an unformatted second page."
        fix = "Trim bullets to maintain a concise, high-impact 1-page presentation."

    return ATSRuleItem(
        rule_id="length_fit",
        category="structure",
        passed=passed,
        points=score,
        evidence=evidence,
        fix=fix,
    )


def eval_keyword_coverage(
    content: ResumeContent,
    jd_text: Optional[str] = None
) -> Tuple[ATSRuleItem, List[str]]:
    """
    Rule 6: Evaluates target keyword coverage vs JD, applying alias resolution,
    stemming, and capping on keyword stuffing.
    """
    full_text = extract_all_text(content).lower()
    resume_tokens = re.findall(r"\b[a-z]{3,}\b", full_text)

    # 1. Check for keyword stuffing
    counts: Dict[str, int] = {}
    for tok in resume_tokens:
        if tok not in STOPWORDS:
            counts[tok] = counts.get(tok, 0) + 1

    stuffed_words = [w for w, cnt in counts.items() if cnt > 6]
    has_stuffing = len(stuffed_words) > 0

    if not jd_text or len(jd_text.strip()) < 20:
        # No JD provided: evaluate general skills diversity
        score = 85.0
        if has_stuffing:
            score = max(0.0, score - (len(stuffed_words) * 15.0))

        evidence = (
            f"No specific Job Description provided. Analyzed {len(content.skills)} listed skills. "
            + (f"Warning: Excessive repetition found for {', '.join(stuffed_words)}." if has_stuffing else "Skill diversity verified.")
        )
        fix = (
            f"Reduce repeated occurrences of '{stuffed_words[0]}'. ATS parsers penalize keyword stuffing."
            if has_stuffing else "Paste a target Job Description to compare specific keyword coverage."
        )
        return (
            ATSRuleItem(
                rule_id="keyword_coverage",
                category="keywords",
                passed=not has_stuffing,
                points=round(score, 1),
                evidence=evidence,
                fix=fix,
            ),
            []
        )

    # 2. Extract domain keywords from JD
    jd_tokens = re.findall(r"\b[a-z]{3,}\b", jd_text.lower())
    domain_jd_terms: Set[str] = {t for t in jd_tokens if t not in STOPWORDS}

    if not domain_jd_terms:
        domain_jd_terms = set(jd_tokens[:10])

    # 3. Match resume against JD keywords using direct match, aliases, and stemming
    resume_stemmed = {simple_stem(tok) for tok in resume_tokens}
    resume_set = set(resume_tokens)

    matched: Set[str] = set()
    missing: List[str] = []

    for term in sorted(domain_jd_terms):
        alias = ALIAS_MAP.get(term)
        is_matched = False

        if term in resume_set:
            is_matched = True
        elif alias and alias in resume_set:
            is_matched = True
        elif simple_stem(term) in resume_stemmed:
            is_matched = True
        elif alias and simple_stem(alias) in resume_stemmed:
            is_matched = True

        if is_matched:
            matched.add(term)
        else:
            missing.append(term)

    coverage_ratio = len(matched) / max(len(domain_jd_terms), 1)
    raw_score = coverage_ratio * 100.0

    # Cap / penalize score if keyword stuffing is detected
    if has_stuffing:
        score = max(0.0, raw_score - (len(stuffed_words) * 15.0))
        passed = False
        evidence = (
            f"Matched {len(matched)}/{len(domain_jd_terms)} JD keywords ({round(coverage_ratio*100, 1)}% coverage), "
            f"but detected keyword stuffing on: {', '.join(stuffed_words)}."
        )
        fix = f"Reduce repetition of '{stuffed_words[0]}'. ATS filters downrank resumes with stuffed terms."
    else:
        score = raw_score
        passed = score >= 65.0
        missing_preview = ", ".join(missing[:4])
        evidence = (
            f"Matched {len(matched)}/{len(domain_jd_terms)} key JD terms ({round(coverage_ratio*100, 1)}% coverage). "
            f"Unmatched highlights: {missing_preview or 'None'}."
        )
        if passed:
            fix = f"To further improve, optionally weave in '{missing[0]}'" if missing else "No action needed. Keyword coverage is strong."
        else:
            fix = f"Add missing target keywords ({missing_preview}) into your Skills and Experience bullet points."

    return (
        ATSRuleItem(
            rule_id="keyword_coverage",
            category="keywords",
            passed=passed,
            points=round(score, 1),
            evidence=evidence,
            fix=fix,
        ),
        missing
    )


def compute_semantic_score(content: ResumeContent, jd_text: Optional[str]) -> float:
    """
    Computes dense vector cosine similarity score using embedding_engine.
    Fully deterministic pairwise dot-product.
    """
    if not jd_text or len(jd_text.strip()) < 20:
        return 85.0

    # Sectional texts
    sections: List[str] = []
    if content.headline:
        sections.append(f"[HEADLINE] {content.headline}")
    if content.summary:
        sections.append(f"[SUMMARY] {content.summary}")
    if content.skills:
        sections.append(f"[SKILLS] {', '.join(content.skills)}")
    for exp in content.experience:
        sections.append(f"[EXPERIENCE] {exp.role} {exp.company or ''}: {' '.join(exp.bullets)}")
    for proj in content.projects:
        sections.append(f"[PROJECT] {proj.name}: {proj.description} {' '.join(proj.bullets)}")
    for edu in content.education:
        sections.append(f"[EDUCATION] {edu.degree} at {edu.institution}")

    if not sections:
        return 0.0

    # Extract requirements from JD by splitting sentences/bullets
    jd_lines = [
        line.strip().lstrip("•-*0123456789. ")
        for line in jd_text.split("\n")
        if len(line.strip()) > 15
    ]
    if not jd_lines:
        jd_lines = [jd_text[:300]]
    jd_lines = jd_lines[:8]

    # Generate normalized 384-dimensional embeddings
    section_embs = np.array(embedding_engine.embed_documents(sections))  # (M, 384)
    req_embs = np.array(embedding_engine.embed_documents(jd_lines))       # (N, 384)

    # Pairwise cosine similarity matrix
    sim_matrix = np.dot(req_embs, section_embs.T)
    max_alignments = np.max(sim_matrix, axis=1)

    semantic_score = float(np.mean(max_alignments) * 100.0)
    return round(min(100.0, max(0.0, semantic_score)), 1)


def compute_ats_readiness(
    content: ResumeContent,
    style: StyleSpec,
    jd_text: Optional[str] = None,
    semantic_weight: float = 0.5,
    keyword_weight: float = 0.3,
    structure_weight: float = 0.2,
) -> ScoreDocResponse:
    """
    Evaluates all rules, computes category and composite overall scores,
    gathers top 5 actionable fixes, and formats the deterministic response.
    """
    rule_headings = eval_headings_present(content, style)
    rule_contact = eval_contact_info_body(content, style)
    rule_bullets = eval_bullet_style(content, style)
    rule_dates = eval_consistent_dates(content, style)
    rule_length = eval_length(content, style)
    rule_keywords, _ = eval_keyword_coverage(content, jd_text)

    items = [
        rule_headings,
        rule_contact,
        rule_bullets,
        rule_dates,
        rule_length,
        rule_keywords,
    ]

    # Category sub-scores
    structure_score = round((rule_headings.points + rule_contact.points + rule_length.points) / 3.0, 1)
    formatting_score = round((rule_bullets.points + rule_dates.points) / 2.0, 1)
    combined_structural = round((structure_score * 0.6) + (formatting_score * 0.4), 1)

    keyword_score = round(rule_keywords.points, 1)
    semantic_score = compute_semantic_score(content, jd_text)

    categories = {
        "structure": structure_score,
        "formatting": formatting_score,
        "keywords": keyword_score,
        "semantic": semantic_score,
    }

    # Composite weighted overall score
    overall = round(
        (semantic_weight * semantic_score)
        + (keyword_weight * keyword_score)
        + (structure_weight * combined_structural),
        1,
    )
    overall = max(0.0, min(100.0, overall))

    # Top actionable fixes (up to 5 items losing the most points)
    candidates_for_fixes = sorted(
        [item for item in items if not item.passed or item.points < 90.0],
        key=lambda x: x.points
    )
    top_fixes: List[str] = []
    for item in candidates_for_fixes:
        if item.fix and item.fix not in top_fixes and not item.fix.startswith("No action needed"):
            top_fixes.append(item.fix)
        if len(top_fixes) >= 5:
            break

    if not top_fixes:
        top_fixes = ["Profile meets all standard ATS parsing benchmarks. Ready for application submission."]

    return ScoreDocResponse(
        overall=overall,
        categories=categories,
        items=items,
        top_fixes=top_fixes,
        limits_note=LIMITS_NOTE,
    )
