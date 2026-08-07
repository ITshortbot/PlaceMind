from ..worker import celery_app
from ..storage.object_store import object_store
from ..ml.document_parser import document_parser
from ..ml.section_segmenter import section_segmenter
from ..ml.ner_extractor import ner_extractor
from ..ml.resume_normalizer import resume_normalizer
from ..db.database import AsyncSessionLocal
from ..models.schema import Resume
from ..core.logger import logger
import os
import asyncio

async def async_parse_resume(resume_id: str, object_name: str):
    temp_path = f"/tmp/{object_name}"
    try:
        # Download file from minio to /tmp
        object_store.s3_client.download_file(object_store.bucket_name, object_name, temp_path)
        
        # 1. T-103: Parse PDF to layout markdown
        parsed_doc = document_parser.extract_layout_text(temp_path)
        
        # 2. T-104: Segment sections
        sections = section_segmenter.segment_sections(parsed_doc.markdown_text)
        
        # 3. T-105: NER on experience sections
        entities = ner_extractor.extract_entities(parsed_doc.markdown_text)
        
        # 4. T-107: Normalize to JSON Schema
        resume_schema = resume_normalizer.build_structured_resume(entities, sections)
        
        # Update DB
        async with AsyncSessionLocal() as session:
            resume = await session.get(Resume, resume_id)
            if resume:
                resume.parsed_json = resume_schema.model_dump()
                resume.status = "complete"
                resume.parser_confidence = 0.95  # Mock confidence
                await session.commit()
                
        os.remove(temp_path)
        logger.info(f"Task parse_resume COMPLETED successfully for Resume ID: {resume_id}")
        return {"status": "complete", "resume_id": resume_id}
        
    except Exception as e:
        logger.error(f"Error in parse_resume task for Resume ID {resume_id}: {e}", exc_info=True)
        async with AsyncSessionLocal() as session:
            resume = await session.get(Resume, resume_id)
            if resume:
                resume.status = "failed"
                await session.commit()
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise e

@celery_app.task(name="parse_resume")
def parse_resume_task(resume_id: str, object_name: str):
    logger.info(f"Celery task parse_resume DISPATCHED - Resume ID: {resume_id}, Object: {object_name}")
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(async_parse_resume(resume_id, object_name))
