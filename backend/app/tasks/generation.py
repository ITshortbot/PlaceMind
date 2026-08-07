from ..worker import celery_app
from ..models.schema import Resume, JobDescription, ResumeJDMatch
from ..db.database import AsyncSessionLocal
from ..ml.resume_rewriter import resume_rewriter
from ..ml.hallucination_guard import hallucination_guard
from ..ml.pdf_compiler import pdf_compiler
from ..storage.object_store import object_store
import asyncio
from ..schemas.resume import ResumeSchema
from ..schemas.gap_report import ATSGapReport
from ..schemas.jd import JDRequirements
from ..core.logger import logger
import os

async def async_generate_resume(match_id: str):
    try:
        async with AsyncSessionLocal() as session:
            match = await session.get(ResumeJDMatch, match_id)
            if not match or match.status != "complete" or not match.gap_report:
                print(f"Match {match_id} not ready for generation")
                return

            resume = await session.get(Resume, match.resume_id)
            jd = await session.get(JobDescription, match.jd_id)
            
            original_resume_schema = ResumeSchema(**resume.parsed_json)
            gap_report = ATSGapReport(**match.gap_report)
            
            # Note: We should ideally have saved JDRequirements, but for this step we will pass a placeholder 
            # since the JD text is all the prompt really needs to infer the context.
            jd_reqs = JDRequirements() 
            
        # 1. T-302: Rewrite
        rewritten_resume = await resume_rewriter.rewrite_resume(original_resume_schema, gap_report, jd_reqs)
        
        # 2. T-303: Guard
        validation = hallucination_guard.validate_no_new_entities(original_resume_schema, rewritten_resume)
        if not validation.is_valid:
            print(f"Hallucination detected! {validation.hallucinations}. Falling back to original.")
            rewritten_resume = original_resume_schema
            
        # 3. T-305: Compile PDF
        pdf_bytes = pdf_compiler.render_resume_pdf(rewritten_resume)
        
        # 4. Save to MinIO
        object_name = f"generated_{resume.id}_{jd.id}.pdf"
        temp_path = f"/tmp/{object_name}"
        with open(temp_path, "wb") as f:
            f.write(pdf_bytes)
            
        object_store.upload_file(temp_path, object_name)
        pdf_url = object_store.get_presigned_url(object_name)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # 5. Save to DB
        async with AsyncSessionLocal() as session:
            resume = await session.get(Resume, match.resume_id)
            resume.generated_pdf_url = pdf_url
            await session.commit()
            
        logger.info(f"Task generate_resume COMPLETED - PDF URL: {pdf_url}")
        return {"status": "complete", "url": pdf_url}
            
    except Exception as e:
        logger.error(f"Error in generate_resume task for match {match_id}: {e}", exc_info=True)

@celery_app.task(name="generate_resume")
def generate_resume_task(match_id: str):
    logger.info(f"Celery task generate_resume DISPATCHED - Match ID: {match_id}")
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(async_generate_resume(match_id))
