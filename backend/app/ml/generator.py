import httpx
import json
from typing import Dict, Any

class ResumeGenerator:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "qwen2.5:7b-instruct-q4_K_M"):
        self.ollama_url = ollama_url
        self.model = model

    async def rewrite_resume(self, original_resume: Dict[str, Any], gap_report: Dict[str, Any], jd_text: str) -> Dict[str, Any]:
        """
        Uses an LLM via Ollama to rewrite the resume based on the gap report.
        """
        prompt = f"""
        You are an expert ATS resume writer. Rewrite the provided resume to better match the Job Description,
        addressing the gaps in the gap report.
        
        CRITICAL RULES:
        1. DO NOT hallucinate. Do not invent employers, titles, dates, or degrees.
        2. Use the STAR method for bullets and quantify impact.
        3. Output valid JSON only, matching the exact structure of the input resume.
        
        Original Resume: {json.dumps(original_resume)}
        Gap Report: {json.dumps(gap_report)}
        Job Description: {jd_text}
        """
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.ollama_url}/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()
            
            try:
                rewritten_resume = json.loads(result["response"])
                return rewritten_resume
            except json.JSONDecodeError:
                raise ValueError("LLM did not return valid JSON.")
