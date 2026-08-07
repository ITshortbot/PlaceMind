from typing import Dict, Any, List
import json
import os
from .llm_client import LLMClient
from ..schemas.resume import ResumeSchema
from ..schemas.gap_report import ATSGapReport
from ..schemas.jd import JDRequirements

class ResumeRewriter:
    def __init__(self):
        self.llm = LLMClient()
        self.fewshot_path = os.path.join(os.path.dirname(__file__), "prompts", "rewrite_fewshot.json")
        try:
            with open(self.fewshot_path, "r") as f:
                self.fewshot_examples = json.load(f)
        except:
            self.fewshot_examples = []
            
        self.system_prompt_base = """You are an expert ATS optimization AI. 
Your goal is to rewrite the provided resume to better match the target job description.
Follow these rules strictly:
1. Use the STAR method (Situation, Task, Action, Result) for all experience bullets.
2. Use strong action verbs and active voice.
3. Quantify impact where possible, but DO NOT invent or hallucinate metrics, dates, companies, or degrees that are not present in the original resume.
4. Integrate missing skills from the gap report naturally into the text ONLY IF they align with the candidate's existing experience.
5. You must output the entire rewritten resume conforming exactly to the provided JSON schema.
"""

    def build_rewrite_prompt(self, resume: ResumeSchema, gap_report: ATSGapReport, jd: JDRequirements) -> str:
        prompt = self.system_prompt_base
        
        if self.fewshot_examples:
            prompt += "\n\n### Few-Shot Examples of Good Bullet Rewrites:\n"
            for ex in self.fewshot_examples:
                prompt += f"- Original: {ex['original']}\n  Rewritten: {ex['rewritten']}\n"
            
        prompt += f"\n### Target Job Description Requirements:\n{jd.model_dump_json(indent=2)}\n"
        
        prompt += f"\n### ATS Gap Report (Focus on improving these areas):\n"
        prompt += f"Missing Keywords to integrate: {', '.join(gap_report.missing_keywords)}\n"
        prompt += "Weakly Covered Areas:\n"
        for req in gap_report.requirement_coverages:
            if req.coverage_label in ["weakly_covered", "not_covered"]:
                prompt += f"- {req.requirement} (Current best match: {req.best_match_chunk})\n"
                
        prompt += f"\n### Original Resume:\n{resume.model_dump_json(indent=2)}\n"
        
        prompt += "\nOutput the rewritten resume as a valid JSON object matching the ResumeSchema. Do not output anything else."
        return prompt

    async def rewrite_resume(self, resume: ResumeSchema, gap_report: ATSGapReport, jd: JDRequirements) -> ResumeSchema:
        prompt = self.build_rewrite_prompt(resume, gap_report, jd)
        
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        try:
            result_json = await self.llm.chat_json(messages)
            return ResumeSchema(**result_json)
        except Exception as e:
            print(f"Failed to rewrite resume: {e}")
            return resume # Fallback to original

resume_rewriter = ResumeRewriter()
