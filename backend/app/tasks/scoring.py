from ..worker import celery_app
from ..models.schema import JobDescription, Resume, ResumeJDMatch
from ..db.database import AsyncSessionLocal
from ..ml.jd_extractor import jd_extractor
from ..ml.embedding_service import embedding_service
from ..db.vector_queries import vector_queries
from ..ml.ats_scorer import ats_scorer
import asyncio
from ..schemas.resume import ResumeSchema
from ..core.logger import logger

async def async_analyze_jd_resume(match_id: str):
    try:
        async with AsyncSessionLocal() as session:
            match = await session.get(ResumeJDMatch, match_id)
            if not match:
                print(f"Match {match_id} not found")
                return

            jd = await session.get(JobDescription, match.jd_id)
            resume = await session.get(Resume, match.resume_id)
            
            if not jd or not resume or not resume.parsed_json:
                match.status = "failed"
                await session.commit()
                return
                
            jd_text = jd.text
            resume_data = ResumeSchema(**resume.parsed_json)
            
        # 1. T-202: JD requirement extraction
        jd_reqs = await jd_extractor.extract_requirements(jd_text)
        
        # 2. Extract bullets from resume
        resume_chunks = []
        for exp in resume_data.experience:
            for bullet in exp.bullets:
                resume_chunks.append(bullet)
        for proj in resume_data.projects:
            resume_chunks.append(proj) 

        # Compile requirements
        all_reqs = jd_reqs.required_skills + jd_reqs.nice_to_have_skills + jd_reqs.responsibilities
        if jd_reqs.years_of_experience:
            all_reqs.append(jd_reqs.years_of_experience)
            
        # 3. T-203: Embeddings
        jd_embs = embedding_service.embed_texts(all_reqs)
        res_embs = embedding_service.embed_texts(resume_chunks)
        
        # 4. T-204: Store in pgvector and query
        async with AsyncSessionLocal() as session:
            await vector_queries.store_jd_embeddings(session, jd.id, all_reqs, jd_embs)
            await vector_queries.store_resume_embeddings(session, resume.id, resume_chunks, res_embs)
            req_texts, chunk_texts, matrix = await vector_queries.compute_similarity_matrix(session, jd.id, resume.id)
            
        # 5. T-205: Gap Analysis
        gap_report = ats_scorer.score_resume_against_jd(resume_data, jd_reqs, matrix, req_texts, chunk_texts)
        
        # Save report
        async with AsyncSessionLocal() as session:
            match = await session.get(ResumeJDMatch, match_id)
            match.gap_report = gap_report.model_dump()
            match.status = "complete"
            await session.commit()
            
        logger.info(f"Task analyze_jd_resume COMPLETED for Match ID: {match_id}")
        return {"status": "complete", "match_id": match_id}
            
    except Exception as e:
        logger.error(f"Error in analyze_jd_resume for Match ID {match_id}: {e}", exc_info=True)
        async with AsyncSessionLocal() as session:
            match = await session.get(ResumeJDMatch, match_id)
            if match:
                match.status = "failed"
                await session.commit()

@celery_app.task(name="analyze_jd_resume")
def analyze_jd_resume_task(match_id: str):
    logger.info(f"Celery task analyze_jd_resume DISPATCHED - Match ID: {match_id}")
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(async_analyze_jd_resume(match_id))
