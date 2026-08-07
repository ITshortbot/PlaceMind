from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
import json

from ...db.database import get_db, AsyncSessionLocal
from ...models.schema import InterviewSession, InterviewTurn, ResumeJDMatch, Resume
from ...ml.interview_prompt_builder import interview_prompt_builder
from ...ml.interview_orchestrator import interview_orchestrator
from ...ml.answer_scorer import answer_scorer
from ...core.logger import logger

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

class StartSessionRequest(BaseModel):
    match_id: str
    role_title: str = "Software Engineer"

@router.post("/start")
async def start_interview_session(req: StartSessionRequest, db: AsyncSession = Depends(get_db)):
    session_id = str(uuid.uuid4())
    session_row = InterviewSession(
        id=session_id,
        match_id=req.match_id,
        role_title=req.role_title,
        status="active"
    )
    db.add(session_row)
    await db.commit()
    logger.info(f"POST /api/v1/interview/start - Session ID: {session_id}, Role: {req.role_title}")
    return {"session_id": session_id, "status": "active"}

@router.websocket("/ws/{session_id}")
async def interview_websocket_endpoint(websocket: WebSocket, session_id: str):
    logger.info(f"WebSocket connecting for session: {session_id}")
    await websocket.accept()
    
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
        session_obj = res.scalars().first()
        if not session_obj:
            await websocket.send_text(json.dumps({"type": "error", "message": "Session not found"}))
            await websocket.close()
            return
            
        match_res = await db.execute(select(ResumeJDMatch).where(ResumeJDMatch.id == session_obj.match_id))
        match_obj = match_res.scalars().first()
        
        gap_report = match_obj.gap_report if match_obj else {}
        resume_data = {}
        if match_obj:
            resume_res = await db.execute(select(Resume).where(Resume.id == match_obj.resume_id))
            resume_obj = resume_res.scalars().first()
            if resume_obj and resume_obj.parsed_json:
                resume_data = resume_obj.parsed_json
                
        system_prompt = interview_prompt_builder.build_system_prompt(
            role_title=session_obj.role_title,
            gap_report=gap_report or {},
            resume_data=resume_data or {}
        )

        turns_res = await db.execute(
            select(InterviewTurn).where(InterviewTurn.session_id == session_id).order_by(InterviewTurn.turn_number)
        )
        existing_turns = turns_res.scalars().all()
        
    history = [{"question": t.question, "answer": t.answer} for t in existing_turns]
    turn_counter = len(existing_turns) + 1
    
    # Generate initial question if no turns exist
    if not existing_turns:
        full_q = ""
        await websocket.send_text(json.dumps({"type": "stream_start"}))
        async for chunk in interview_orchestrator.generate_next_question_stream(system_prompt, []):
            full_q += chunk
            await websocket.send_text(json.dumps({"type": "stream_token", "token": chunk}))
        await websocket.send_text(json.dumps({"type": "stream_end", "full_question": full_q}))
        
        async with AsyncSessionLocal() as db:
            turn_row = InterviewTurn(
                id=str(uuid.uuid4()),
                session_id=session_id,
                turn_number=1,
                question=full_q,
                is_follow_up="false"
            )
            db.add(turn_row)
            await db.commit()
        history.append({"question": full_q, "answer": None})
        
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            if data.get("type") == "answer":
                user_answer = data.get("answer", "")
                
                # Update current turn answer and score it
                score = None
                async with AsyncSessionLocal() as db:
                    turns_res = await db.execute(
                        select(InterviewTurn)
                        .where(InterviewTurn.session_id == session_id)
                        .order_by(InterviewTurn.turn_number.desc())
                    )
                    last_turn = turns_res.scalars().first()
                    
                    if last_turn:
                        last_turn.answer = user_answer
                        score = await answer_scorer.score_answer(
                            question=last_turn.question,
                            answer=user_answer,
                            role_title=session_obj.role_title
                        )
                        last_turn.score_data = score.model_dump()
                        await db.commit()

                # Update local history
                if history and history[-1]["answer"] is None:
                    history[-1]["answer"] = user_answer
                
                if score:
                    await websocket.send_text(json.dumps({"type": "score_eval", "score": score.model_dump()}))
                
                # End session after 6 turns if no follow up needed
                if len(history) >= 6 and not (score and score.needs_follow_up):
                    async with AsyncSessionLocal() as db:
                        res = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
                        s = res.scalars().first()
                        if s:
                            s.status = "completed"
                            await db.commit()
                    await websocket.send_text(json.dumps({"type": "session_complete", "session_id": session_id}))
                    break

                # Stream next question / follow-up
                turn_counter += 1
                full_q = ""
                await websocket.send_text(json.dumps({"type": "stream_start"}))
                async for chunk in interview_orchestrator.generate_next_question_stream(system_prompt, history, score):
                    full_q += chunk
                    await websocket.send_text(json.dumps({"type": "stream_token", "token": chunk}))
                await websocket.send_text(json.dumps({"type": "stream_end", "full_question": full_q}))
                
                async with AsyncSessionLocal() as db:
                    turn_row = InterviewTurn(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        turn_number=turn_counter,
                        question=full_q,
                        is_follow_up="true" if score and score.needs_follow_up else "false"
                    )
                    db.add(turn_row)
                    await db.commit()
                history.append({"question": full_q, "answer": None})

    except WebSocketDisconnect:
        print(f"WebSocket client disconnected from session {session_id}")
