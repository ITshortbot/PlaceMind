from ..schemas.interview import TurnScore
from .llm_client import LLMClient

class AnswerScorer:
    def __init__(self):
        self.llm = LLMClient()
        self.system_prompt = """You are an expert technical interview evaluator.
Evaluate the candidate's answer to the given interview question.
Respond with a JSON object strictly matching this schema:
{
    "relevance": float (0.0 to 1.0),
    "structure_star": float (0.0 to 1.0),
    "specificity": float (0.0 to 1.0),
    "communication_clarity": float (0.0 to 1.0),
    "feedback": "string feedback",
    "red_flags": ["flag1"],
    "needs_follow_up": boolean
}
Rule for needs_follow_up: set to true if specificity < 0.5 OR structure_star < 0.5 OR relevance < 0.5.
Only return valid JSON."""

    async def score_answer(self, question: str, answer: str, role_title: str = "Software Engineer") -> TurnScore:
        user_prompt = f"Role: {role_title}\nQuestion: {question}\nCandidate Answer: {answer}"
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        try:
            res = await self.llm.chat_json(messages)
            score = TurnScore(**res)
            if score.specificity < 0.5 or score.structure_star < 0.5 or score.relevance < 0.5:
                score.needs_follow_up = True
            return score
        except Exception as e:
            print(f"Error scoring answer: {e}")
            return TurnScore(
                relevance=0.7,
                structure_star=0.7,
                specificity=0.7,
                communication_clarity=0.7,
                feedback="Response recorded.",
                red_flags=[],
                needs_follow_up=False
            )

answer_scorer = AnswerScorer()
