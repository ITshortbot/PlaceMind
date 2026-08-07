from pydantic import BaseModel
from typing import List

class JDRequirements(BaseModel):
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    years_of_experience: str = ""
    responsibilities: List[str] = []
