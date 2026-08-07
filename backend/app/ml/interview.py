import json
import httpx
from typing import Dict, Any, List

class InterviewAgent:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "deepseek-r1:8b"):
        self.ollama_url = ollama_url
        self.model = model

    def construct_system_prompt(self, role: str, weak_areas: List[str]) -> str:
        weak_focus = ", ".join(weak_areas) if weak_areas else "general technical competency"
        return f"""
        You are a senior technical interviewer for the role of {role}.
        The candidate has shown potential weaknesses in the following areas: {weak_focus}.
        Your goal is to conduct a multi-turn interview, asking one question at a time.
        Keep your questions concise.
        """

    async def generate_next_question(self, chat_history: List[Dict[str, str]], system_prompt: str) -> str:
        """
        Generates the next question based on the chat history.
        """
        messages = [{"role": "system", "content": system_prompt}] + chat_history
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.ollama_url}/api/chat", json=payload)
            response.raise_for_status()
            result = response.json()
            return result["message"]["content"]

    async def score_answer(self, question: str, answer: str) -> Dict[str, Any]:
        """
        Evaluates the candidate's answer returning a structured score schema.
        """
        prompt = f"""
        Evaluate the candidate's answer to the following question.
        Question: {question}
        Answer: {answer}
        
        Return a JSON object strictly matching this schema:
        {{
            "scores": {{
                "relevance": 0.9,
                "structure_star": 0.5,
                "specificity": 0.7,
                "communication_clarity": 0.8
            }},
            "feedback": "Your answer was good but lacked specific metric outcomes.",
            "follow_up_triggered": true,
            "red_flags": []
        }}
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{self.ollama_url}/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()
            try:
                return json.loads(result["response"])
            except:
                return {"error": "Failed to parse JSON score"}
