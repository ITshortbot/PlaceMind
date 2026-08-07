from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...db.database import get_db
from ...models.schema import InterviewSession, InterviewTurn
from ...ml.interview_report import interview_report_generator
from ...core.logger import logger

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

@router.get("/{session_id}/report")
async def get_interview_report(session_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session_obj = res.scalars().first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    turns_res = await db.execute(
        select(InterviewTurn).where(InterviewTurn.session_id == session_id).order_by(InterviewTurn.turn_number)
    )
    turns = turns_res.scalars().all()
    
    turns_data = [
        {
            "question": t.question,
            "answer": t.answer,
            "score_data": t.score_data
        }
        for t in turns
    ]
    
    report = await interview_report_generator.generate_report(
        session_id=session_id,
        role_title=session_obj.role_title,
        turns=turns_data
    )
    logger.info(f"GET /api/v1/interview/{session_id}/report - Score: {report.overall_communication_score}%")
    return report
