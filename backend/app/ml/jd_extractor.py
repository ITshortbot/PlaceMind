from typing import Optional
from ..schemas.jd import JDRequirements
from .llm_client import LLMClient

class JDExtractor:
    def __init__(self):
        self.llm = LLMClient()
        self.system_prompt = """You are an expert technical recruiter. Your task is to extract job requirements from a job description text.
Respond with a JSON object exactly matching this schema:
{
    "required_skills": ["skill1", "skill2"],
    "nice_to_have_skills": ["skill3"],
    "years_of_experience": "string summarizing experience requirements",
    "responsibilities": ["resp1", "resp2"]
}
Only return the JSON, nothing else."""

    async def extract_requirements(self, jd_text: str) -> JDRequirements:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": jd_text}
        ]
        
        try:
            result_json = await self.llm.chat_json(messages)
            return JDRequirements(**result_json)
        except Exception as e:
            print(f"Failed to extract requirements: {e}")
            return JDRequirements()

jd_extractor = JDExtractor()
