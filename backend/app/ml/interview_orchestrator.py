from .llm_client import LLMClient
from ..schemas.interview import TurnScore
from typing import List, Dict, Any, AsyncGenerator

class InterviewOrchestrator:
    def __init__(self):
        self.llm = LLMClient()

    async def generate_next_question_stream(
        self, 
        system_prompt: str, 
        turns_history: List[Dict[str, Any]], 
        last_score: TurnScore = None
    ) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}]
        
        for turn in turns_history:
            if turn.get("question"):
                messages.append({"role": "assistant", "content": turn["question"]})
            if turn.get("answer"):
                messages.append({"role": "user", "content": turn["answer"]})

        if last_score and last_score.needs_follow_up:
            instruction = (
                f"Candidate's previous response lacked detail or specificity (Feedback: {last_score.feedback}). "
                "Ask a focused, polite follow-up question digging deeper into their specific action, tools used, or quantifiable impact."
            )
            messages.append({"role": "system", "content": instruction})

        async for chunk in self.llm.chat_stream(messages):
            yield chunk

interview_orchestrator = InterviewOrchestrator()
