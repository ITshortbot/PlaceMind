"""Keyword extraction from a job description for the ATS gap report.

Deterministic. Every keyword shown to the user is a word that appears in the
job description text. Nothing is invented. Generic job-post filler (verbs like
"want", "join", "learn", level words like "fresher", connectives like "about",
"more") is dropped so only role and skill terms remain.
"""

import re
from collections import Counter
from typing import Iterable, List, Optional, Set

from app.services.ats_rules import ACTION_VERBS, ALIAS_MAP, STOPWORDS, simple_stem

JOB_POST_FILLER: Set[str] = {
    # wants / invitations
    "want", "wants", "wanted", "wanting", "join", "joins", "joined", "joining", "learn", "learns",
    "learning", "learned", "grow", "growing", "growth", "looking", "look", "looks", "seek", "seeks",
    "need", "needs", "needed", "hire", "hiring", "hired", "apply", "applying", "application",
    "applicants", "applicant", "opportunity", "opportunities", "opening", "openings", "vacancy",
    "position", "positions", "job", "jobs", "career", "careers", "company", "companies", "organization",
    "organisation", "employer", "employee", "employees", "people", "person", "someone", "everyone",
    # level words
    "fresher", "freshers", "entry", "level", "junior", "senior", "intern", "internship", "graduate",
    "graduates", "beginner", "beginners", "trainee", "trainees", "new", "newbie",
    # generic verbs
    "will", "shall", "may", "might", "make", "makes", "making", "made", "get", "gets", "getting",
    "got", "give", "gives", "take", "takes", "taking", "come", "comes", "going", "goes", "help",
    "helps", "helping", "use", "uses", "used", "using", "ensure", "ensuring", "support", "supporting",
    "provide", "provides", "providing", "responsible", "perform", "performing", "handle", "handling",
    "keep", "keeping", "know", "knows", "knowing", "think", "thinking", "see", "say", "tell", "ask",
    "try", "trying", "start", "starting", "begin", "work", "works", "worked", "working", "bring",
    "build", "builds", "building", "run", "runs", "running", "love", "like", "enjoy", "ready",
    "willing", "excited", "passionate", "passion", "eager", "motivated", "driven",
    # generic adjectives, adverbs, connectives
    "good", "great", "strong", "excellent", "best", "better", "ideal", "outstanding", "solid",
    "basic", "basics", "fundamental", "fundamentals", "various", "multiple", "many", "much", "several",
    "also", "just", "even", "still", "well", "etc", "plus", "bonus", "nice", "high", "low", "key",
    "related", "relevant", "similar", "based", "across", "within", "without", "per", "via", "using",
    "every", "always", "never", "often", "like", "e.g", "ie", "day", "days", "time", "times",
    "year", "month", "months", "week", "weeks", "full", "part", "one", "two", "three", "first",
    "last", "next", "own", "able", "ability", "abilities", "capable", "capability", "etc",
    "something", "anything", "thing", "things", "way", "ways", "part", "area", "areas", "field",
    "fields", "environment", "culture", "fast", "paced", "dynamic", "exciting", "join", "our",
    "team", "teams", "member", "members", "role", "roles", "responsibility", "responsibilities",
    "duty", "duties", "requirement", "requirements", "qualification", "qualifications", "degree",
    "preferred", "required", "mandatory", "desired", "desirable", "minimum", "maximum", "least",
    "equivalent", "demonstrated", "proven", "track", "record", "understanding", "understand",
    "familiar", "familiarity", "exposure", "hands", "hand", "willingness", "interest", "interested",
    "should", "must", "can", "could", "would", "does", "doing", "done", "been", "being", "are",
    "has", "have", "had", "was", "were", "not", "and", "the", "for", "with", "from", "that", "this",
    "your", "you", "who", "what", "how", "why", "when", "where", "about", "more", "less", "most",
    "least", "all", "any", "some", "other", "others", "over", "under", "into", "onto", "out",
}

_DROP: Set[str] = {w.lower() for w in STOPWORDS} | JOB_POST_FILLER | {w.lower() for w in ACTION_VERBS}
_TOKEN = re.compile(r"\b[a-z]{3,}\b")


def jd_terms(texts: Iterable[str]) -> List[str]:
    """Keyword candidates from the job text, most repeated first, ties by first appearance."""
    tokens = _TOKEN.findall(" ".join(texts).lower())
    counts: Counter = Counter()
    first: dict = {}
    for i, tok in enumerate(tokens):
        if tok in _DROP:
            continue
        counts[tok] += 1
        first.setdefault(tok, i)
    return sorted(counts, key=lambda t: (-counts[t], first[t]))


def resume_covers(term: str, resume_words: Set[str], resume_stems: Optional[Set[str]] = None) -> bool:
    """True if the resume text has the term, a known alias, or the same stem."""
    if term in resume_words:
        return True
    alias = ALIAS_MAP.get(term)
    if alias and alias in resume_words:
        return True
    stems = resume_stems if resume_stems is not None else {simple_stem(w) for w in resume_words}
    return simple_stem(term) in stems or bool(alias and simple_stem(alias) in stems)
