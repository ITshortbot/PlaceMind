from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import os
import shutil

from ...storage.object_store import object_store
from ...tasks.parsing import parse_resume_task
from ...db.database import get_db
from ...models.schema import Resume
from ...core.logger import logger
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/resume", tags=["resume"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Uploads resume to object store, creates a database record with status pending, 
    and enqueues the parsing task.
    """
    resume_id = str(uuid.uuid4())
    object_name = f"{resume_id}_{file.filename}"
    
    # Save temporarily to upload to MinIO
    temp_path = f"/tmp/{object_name}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    logger.info(f"POST /api/v1/resume/upload - File: {file.filename}, Resume ID: {resume_id}")
    success = object_store.upload_file(temp_path, object_name)
    os.remove(temp_path)
    
    if not success:
        logger.error(f"Failed to upload resume {file.filename} to storage")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")
        
    # Create DB row with status=pending
    new_resume = Resume(
        id=resume_id,
        status="pending"
    )
    db.add(new_resume)
    await db.commit()
    
    # Enqueue Celery task
    parse_resume_task.delay(resume_id, object_name)
    logger.info(f"Resume {resume_id} saved to DB and parse_resume task enqueued")
    
    return {"message": "Resume uploaded successfully, parsing started", "resume_id": resume_id, "status": "pending"}

class GenerateRequest(BaseModel):
    match_id: str

@router.post("/generate")
async def generate_resume_pdf(request: GenerateRequest):
    """
    Triggers the Pipeline C generation process.
    """
    logger.info(f"POST /api/v1/resume/generate - Match ID: {request.match_id}")
    from ...tasks.generation import generate_resume_task
    generate_resume_task.delay(request.match_id)
    return {"message": "Resume generation started", "match_id": request.match_id}
