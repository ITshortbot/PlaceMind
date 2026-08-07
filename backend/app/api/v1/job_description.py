from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import trafilatura
import uuid

from ...db.database import get_db
from ...models.schema import JobDescription
from ...core.logger import logger

router = APIRouter(prefix="/api/v1/jd", tags=["job_description"])

class JDSubmitRequest(BaseModel):
    url: Optional[HttpUrl] = None
    text: Optional[str] = None

@router.post("/submit")
async def submit_jd(request: JDSubmitRequest, db: AsyncSession = Depends(get_db)):
    if not request.url and not request.text:
        raise HTTPException(status_code=400, detail="Must provide either url or text")

    jd_text = ""
    if request.url:
        downloaded = trafilatura.fetch_url(str(request.url))
        if downloaded:
            jd_text = trafilatura.extract(downloaded)
        if not jd_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from URL")
    else:
        jd_text = request.text

    jd_id = str(uuid.uuid4())
    new_jd = JobDescription(
        id=jd_id,
        text=jd_text
    )
    db.add(new_jd)
    await db.commit()

    logger.info(f"POST /api/v1/jd/submit - Length: {len(jd_text)} chars, JD ID: {jd_id}")
    return {"message": "Job description submitted successfully", "jd_id": jd_id}

class AnalyzeRequest(BaseModel):
    jd_id: str
    resume_id: str

@router.post("/analyze")
async def analyze_jd(request: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    from ...models.schema import ResumeJDMatch
    from ...tasks.scoring import analyze_jd_resume_task
    
    match_id = str(uuid.uuid4())
    new_match = ResumeJDMatch(
        id=match_id,
        jd_id=request.jd_id,
        resume_id=request.resume_id,
        status="pending"
    )
    db.add(new_match)
    await db.commit()
    
    analyze_jd_resume_task.delay(match_id)
    logger.info(f"POST /api/v1/jd/analyze - JD ID: {request.jd_id}, Resume ID: {request.resume_id}, Match ID: {match_id}")
    return {"message": "Analysis started", "match_id": match_id}

@router.get("/analyze/{match_id}")
async def get_analysis(match_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from ...models.schema import ResumeJDMatch
    
    result = await db.execute(select(ResumeJDMatch).where(ResumeJDMatch.id == match_id))
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    logger.info(f"GET /api/v1/jd/analyze/{match_id} - Status: {match.status}")
    return {
        "match_id": match.id,
        "status": match.status,
        "gap_report": match.gap_report
    }
