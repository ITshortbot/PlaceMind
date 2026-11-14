# ============================================================================
# File: backend/app/api/v1/endpoints/interviews.py
# Description: Mock-interview API - deterministic practice sessions.
#   Create a session (question plan), answer turn by turn with heuristic
#   feedback, then fetch an aggregate report. No LLM calls; the engine is
#   rule-based and every score is reproducible.
# ============================================================================

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import InterviewSession, InterviewTurn
from app.database.session import get_db
from app.schemas.interviews import (
    AnswerRequest,
    AnswerResponse,
    CreateSessionRequest,
    FeedbackOut,
    PlannedQuestionOut,
    ReportOut,
    SessionOut,
    SessionSummaryOut,
    TurnOut,
)
from app.services.interview_engine import (
    acknowledge_answer,
    build_report,
    evaluate_answer,
    generate_follow_up,
    generate_plan,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


def _planned_out(q) -> PlannedQuestionOut:
    return PlannedQuestionOut(order=q["order"], category=q["category"], prompt=q["prompt"], focus=q["focus"])


async def _load_session(session_id: UUID, db: AsyncSession) -> InterviewSession:
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    return session


async def _turns(session_id: UUID, db: AsyncSession) -> list[InterviewTurn]:
    result = await db.execute(
        select(InterviewTurn).where(InterviewTurn.session_id == session_id).order_by(InterviewTurn.order)
    )
    return list(result.scalars().all())


def _next_unanswered(turns: list[InterviewTurn]) -> InterviewTurn | None:
    return next((t for t in turns if t.answer_text is None), None)


def _answered_planned(turns: list[InterviewTurn]) -> int:
    """Planned questions fully answered; a pending follow-up keeps its parent open."""
    pending_followups = {t.order for t in turns if t.category == "follow-up" and t.answer_text is None}
    return sum(
        1
        for t in turns
        if t.category != "follow-up" and t.answer_text is not None and t.order not in pending_followups
    )


def _question_out_for(turn: InterviewTurn, planned: dict) -> PlannedQuestionOut:
    """Planned questions come from the session plan; follow-up turns carry
    their own prompt (category 'follow-up', same order as their parent)."""
    if turn.category == "follow-up":
        return PlannedQuestionOut(
            order=turn.order, category="follow-up", prompt=turn.question_text, focus=turn.focus or ""
        )
    return _planned_out(planned[turn.order])


def _turn_out(t: InterviewTurn) -> TurnOut:
    return TurnOut(
        order=t.order,
        category=t.category,
        question_text=t.question_text,
        focus=t.focus,
        answer_text=t.answer_text,
        score=float(t.score) if t.score is not None else None,
        feedback=t.feedback,
    )


@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(payload: CreateSessionRequest, db: AsyncSession = Depends(get_db)):
    plan = generate_plan(
        target_role=payload.target_role,
        company=payload.company,
        question_count=payload.question_count,
        resume_text=payload.resume_text,
        job_description=payload.job_description,
        seed=None,
    )
    session = InterviewSession(
        target_role=payload.target_role.strip(),
        company=(payload.company or "").strip() or None,
        interview_type=payload.interview_type,
        question_count=len(plan),
        status="active",
        planned_questions=[{"order": q.order, "category": q.category, "prompt": q.prompt, "focus": q.focus} for q in plan],
    )
    db.add(session)
    await db.flush()

    for q in plan:
        db.add(
            InterviewTurn(
                session_id=session.id,
                order=q.order,
                category=q.category,
                question_text=q.prompt,
                focus=q.focus,
            )
        )
    await db.flush()

    return SessionOut(
        session_id=session.id,
        target_role=session.target_role,
        company=session.company,
        interview_type=session.interview_type,
        question_count=session.question_count,
        status=session.status,
        current_question=_planned_out(session.planned_questions[0]),
        answered=0,
        turns=[
            TurnOut(order=q["order"], category=q["category"], question_text=q["prompt"], focus=q["focus"],
                    answer_text=None, score=None, feedback=None)
            for q in session.planned_questions
        ],
    )


@router.get("/sessions", response_model=list[SessionSummaryOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).order_by(InterviewSession.created_at.desc()))
    sessions = list(result.scalars().all())
    out: list[SessionSummaryOut] = []
    for s in sessions:
        turns = await _turns(s.id, db)
        answered = _answered_planned(turns)
        scores = [float(t.score) for t in turns if t.score is not None]
        out.append(
            SessionSummaryOut(
                session_id=s.id,
                target_role=s.target_role,
                company=s.company,
                status=s.status,
                question_count=s.question_count,
                answered=answered,
                average_score=round(sum(scores) / len(scores), 1) if scores else None,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
        )
    return out


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    session = await _load_session(session_id, db)
    turns = await _turns(session_id, db)
    nxt = _next_unanswered(turns)
    answered = _answered_planned(turns)
    planned = {q["order"]: q for q in session.planned_questions}
    return SessionOut(
        session_id=session.id,
        target_role=session.target_role,
        company=session.company,
        interview_type=session.interview_type,
        question_count=session.question_count,
        status=session.status,
        current_question=_question_out_for(nxt, planned) if nxt else None,
        answered=answered,
        turns=[_turn_out(t) for t in turns],
    )


_ANSWER_LOCKS: dict[UUID, asyncio.Lock] = {}


@router.post("/sessions/{session_id}/answer", response_model=AnswerResponse)
async def answer_current(session_id: UUID, payload: AnswerRequest, db: AsyncSession = Depends(get_db)):
    # Serialize concurrent submissions per session: a double-fired request must
    # observe the state the first one left behind, not the state before it.
    lock = _ANSWER_LOCKS.setdefault(session_id, asyncio.Lock())
    async with lock:
        return await _answer_locked(session_id, payload, db)


async def _answer_locked(session_id: UUID, payload: AnswerRequest, db: AsyncSession) -> AnswerResponse:
    session = await _load_session(session_id, db)
    if session.status == "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session already completed. Start a new one.")
    turns = await _turns(session_id, db)
    current = _next_unanswered(turns)
    if current is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No unanswered question remains.")

    stale = (
        (payload.expected_order is not None and payload.expected_order != current.order)
        or (payload.expected_category is not None and payload.expected_category != current.category)
    )
    if stale:
        # Stale retry: this answer was already consumed and the session moved
        # on. Replay the current state idempotently instead of consuming the
        # answer against the wrong turn. The acknowledgment is deterministic.
        answered = _answered_planned(turns)
        planned = {q["order"]: q for q in session.planned_questions}
        return AnswerResponse(
            feedback=None,
            acknowledgment=acknowledge_answer(payload.answer),
            progress=f"{answered}/{session.question_count}",
            next_question=_question_out_for(current, planned),
            completed=False,
        )

    fb = evaluate_answer(current.question_text, payload.answer)
    current.answer_text = payload.answer.strip()
    current.score = fb.score
    current.feedback = {
        "score": fb.score,
        "strengths": fb.strengths,
        "improvements": fb.improvements,
        "signals": fb.signals,
    }
    current.answered_at = datetime.now(timezone.utc)

    # Conversational flow: a planned answer that leaves a gap earns one
    # targeted follow-up before moving on. The score is stored silently and
    # surfaced in the end-of-session report, not as a per-answer scorecard.
    if current.category != "follow-up":
        follow_up_text = generate_follow_up(current.category, payload.answer)
        if follow_up_text:
            db.add(
                InterviewTurn(
                    session_id=session.id,
                    order=current.order,
                    category="follow-up",
                    question_text=follow_up_text,
                    focus=current.focus,
                )
            )
    await db.flush()

    turns = await _turns(session_id, db)
    nxt = _next_unanswered(turns)
    completed = nxt is None
    if completed:
        session.status = "completed"
        await db.flush()

    answered = _answered_planned(turns)
    planned = {q["order"]: q for q in session.planned_questions}
    acknowledgment = (
        "That completes the set - your full practice report is ready."
        if completed
        else acknowledge_answer(payload.answer)
    )
    return AnswerResponse(
        feedback=None,
        acknowledgment=acknowledgment,
        progress=f"{answered}/{session.question_count}",
        next_question=_question_out_for(nxt, planned) if nxt else None,
        completed=completed,
    )


@router.get("/sessions/{session_id}/report", response_model=ReportOut)
async def session_report(session_id: UUID, db: AsyncSession = Depends(get_db)):
    session = await _load_session(session_id, db)
    turns = await _turns(session_id, db)
    shaped = []
    for t in turns:
        fb = None
        if t.feedback:
            class _FB:
                score = float(t.feedback["score"])
                strengths = list(t.feedback["strengths"])
                improvements = list(t.feedback["improvements"])
                signals = dict(t.feedback["signals"])
            fb = _FB()
        shaped.append({"category": t.category, "prompt": t.question_text, "answer": t.answer_text, "feedback": fb})
    report = build_report(shaped)
    return ReportOut(**report)
