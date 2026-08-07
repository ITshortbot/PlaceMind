from fastapi import FastAPI, UploadFile, File, BackgroundTasks, WebSocket
import shutil
import uuid
import os

app = FastAPI(
    title="PlaceMind API",
    description="AI-Based Interview & Resume Intelligence Platform API",
    version="1.0.0"
)

from .worker import celery_app
from celery.result import AsyncResult

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/debug/ping-task")
async def ping_task(message: str = "pong"):
    task = celery_app.send_task("ping", kwargs={"message": message})
    return {"task_id": task.id, "status": "enqueued"}

@app.get("/debug/task-status/{task_id}")
async def task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {"task_id": task_id, "status": result.status, "result": result.result}

from .api.v1 import resume, job_description, interview_ws, interview
app.include_router(resume.router)
app.include_router(job_description.router)
app.include_router(interview_ws.router)
app.include_router(interview.router)

@app.websocket("/api/v1/interview/ws")
async def interview_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for the stateful multi-turn interview loop.
    """
    await websocket.accept()
    # In a full implementation, we would instantiate InterviewAgent here
    # and maintain the chat history across the session.
    await websocket.send_json({"type": "system", "content": "Connected to AI Interviewer."})
    
    try:
        while True:
            data = await websocket.receive_text()
            # Mock echoing back for now
            # Here we would call agent.score_answer() and agent.generate_next_question()
            await websocket.send_json({
                "type": "agent",
                "content": f"You said: {data}. Could you elaborate on the STAR method for that?",
                "scores": {"relevance": 0.8}
            })
    except Exception as e:
        print(f"WebSocket closed: {e}")


