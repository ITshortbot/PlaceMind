from pydantic import BaseModel
from typing import List, Optional

class TurnScore(BaseModel):
    relevance: float  # 0.0 to 1.0
    structure_star: float  # 0.0 to 1.0
    specificity: float  # 0.0 to 1.0
    communication_clarity: float  # 0.0 to 1.0
    feedback: str
    red_flags: List[str] = []
    needs_follow_up: bool = False
