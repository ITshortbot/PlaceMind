from pydantic import BaseModel
from typing import List, Dict, Any
from .llm_client import LLMClient

class SessionReport(BaseModel):
    session_id: str
    overall_communication_score: float
    avg_relevance: float
    avg_star_structure: float
    avg_specificity: float
    summary_feedback: str
    strengths: List[str]
    growth_areas: List[str]
    suggested_resources: List[str]

class InterviewReportGenerator:
    def __init__(self):
        self.llm = LLMClient()

    async def generate_report(self, session_id: str, role_title: str, turns: List[Dict[str, Any]]) -> SessionReport:
        if not turns:
            return SessionReport(
                session_id=session_id,
                overall_communication_score=0.0,
                avg_relevance=0.0,
                avg_star_structure=0.0,
                avg_specificity=0.0,
                summary_feedback="No turns recorded for this session.",
                strengths=[],
                growth_areas=[],
                suggested_resources=[]
            )

        rel_scores, star_scores, spec_scores, clar_scores = [], [], [], []
        turn_summaries = []

        for t in turns:
            s = t.get("score_data") or {}
            rel_scores.append(s.get("relevance", 0.7))
            star_scores.append(s.get("structure_star", 0.7))
            spec_scores.append(s.get("specificity", 0.7))
            clar_scores.append(s.get("communication_clarity", 0.7))
            turn_summaries.append(
                f"Q: {t.get('question')}\nA: {t.get('answer')}\nFeedback: {s.get('feedback', '')}\n"
            )

        avg_rel = float(sum(rel_scores) / len(rel_scores))
        avg_star = float(sum(star_scores) / len(star_scores))
        avg_spec = float(sum(spec_scores) / len(spec_scores))
        avg_clar = float(sum(clar_scores) / len(clar_scores))

        overall = (avg_rel * 0.3) + (avg_star * 0.3) + (avg_spec * 0.2) + (avg_clar * 0.2)

        prompt = f"""Summarize this mock interview performance for a {role_title} role.
Turn history:
{"".join(turn_summaries)}

Respond with a JSON object strictly matching this schema:
{{
    "summary_feedback": "Paragraph summarizing performance",
    "strengths": ["strength1"],
    "growth_areas": ["growth1"],
    "suggested_resources": ["resource1"]
}}
"""
        try:
            llm_res = await self.llm.chat_json([{"role": "user", "content": prompt}])
            return SessionReport(
                session_id=session_id,
                overall_communication_score=round(overall * 100, 1),
                avg_relevance=round(avg_rel, 2),
                avg_star_structure=round(avg_star, 2),
                avg_specificity=round(avg_spec, 2),
                summary_feedback=llm_res.get("summary_feedback", "Solid effort in the mock interview."),
                strengths=llm_res.get("strengths", []),
                growth_areas=llm_res.get("growth_areas", []),
                suggested_resources=llm_res.get("suggested_resources", [])
            )
        except Exception as e:
            print(f"Error generating report: {e}")
            return SessionReport(
                session_id=session_id,
                overall_communication_score=round(overall * 100, 1),
                avg_relevance=round(avg_rel, 2),
                avg_star_structure=round(avg_star, 2),
                avg_specificity=round(avg_spec, 2),
                summary_feedback="Completed mock interview.",
                strengths=["Engaged actively in questions"],
                growth_areas=["Provide more quantified results"],
                suggested_resources=["STAR Method Guide"]
            )

interview_report_generator = InterviewReportGenerator()
