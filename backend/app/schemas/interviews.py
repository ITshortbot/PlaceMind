# ============================================================================
# File: backend/app/schemas/interviews.py
# Description: Pydantic contracts for the mock-interview API
# ============================================================================

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=255)
    company: Optional[str] = Field(default=None, max_length=255)
    interview_type: Literal["practice", "real"] = "practice"
    question_count: int = Field(default=5, ge=3, le=10)
    resume_text: Optional[str] = Field(default=None, max_length=20000)
    job_description: Optional[str] = Field(default=None, max_length=20000)


class PlannedQuestionOut(BaseModel):
    order: int
    category: str
    prompt: str
    focus: str


class TurnOut(BaseModel):
    order: int
    category: str
    question_text: str
    focus: Optional[str]
    answer_text: Optional[str]
    score: Optional[float]
    feedback: Optional[dict]


class SessionOut(BaseModel):
    session_id: UUID
    target_role: str
    company: Optional[str]
    interview_type: str
    question_count: int
    status: str
    current_question: Optional[PlannedQuestionOut]
    answered: int
    turns: list[TurnOut] = []


class SessionSummaryOut(BaseModel):
    session_id: UUID
    target_role: str
    company: Optional[str]
    status: str
    question_count: int
    answered: int
    average_score: Optional[float]
    created_at: str


class AnswerRequest(BaseModel):
    answer: str = Field(..., min_length=1, max_length=10000)


class FeedbackOut(BaseModel):
    score: float
    strengths: list[str]
    improvements: list[str]
    signals: dict


class AnswerResponse(BaseModel):
    feedback: FeedbackOut
    progress: str
    next_question: Optional[PlannedQuestionOut]
    completed: bool


class ReportOut(BaseModel):
    overall_score: Optional[float]
    dimensions: dict
    per_question: list[dict]
    recommendations: list[str]
    method_note: str
