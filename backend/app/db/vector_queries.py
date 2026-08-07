from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from ..models.schema import ResumeChunkEmbedding, JDEmbedding
import numpy as np
from typing import List, Tuple

class VectorQueries:
    @staticmethod
    async def store_resume_embeddings(db: AsyncSession, resume_id: str, chunks: List[str], embeddings: List[np.ndarray]):
        for chunk, emb in zip(chunks, embeddings):
            row = ResumeChunkEmbedding(
                resume_id=resume_id,
                chunk_text=chunk,
                embedding=emb.tolist()
            )
            db.add(row)
        await db.commit()

    @staticmethod
    async def store_jd_embeddings(db: AsyncSession, jd_id: str, requirements: List[str], embeddings: List[np.ndarray]):
        for req, emb in zip(requirements, embeddings):
            row = JDEmbedding(
                jd_id=jd_id,
                requirement_text=req,
                embedding=emb.tolist()
            )
            db.add(row)
        await db.commit()

    @staticmethod
    async def compute_similarity_matrix(db: AsyncSession, jd_id: str, resume_id: str) -> Tuple[List[str], List[str], np.ndarray]:
        """
        Computes cosine similarity matrix between all JD requirements and all resume chunks via pgvector.
        """
        query = text("""
            SELECT j.requirement_text, r.chunk_text, 1 - (j.embedding <=> r.embedding) as similarity
            FROM jd_embeddings j
            CROSS JOIN resume_embeddings r
            WHERE j.jd_id = :jd_id AND r.resume_id = :resume_id
        """)
        
        result = await db.execute(query, {"jd_id": jd_id, "resume_id": resume_id})
        
        req_set = []
        chunk_set = []
        scores = {}
        
        for row in result:
            req = row.requirement_text
            chunk = row.chunk_text
            sim = row.similarity
            
            if req not in req_set:
                req_set.append(req)
            if chunk not in chunk_set:
                chunk_set.append(chunk)
                
            scores[(req, chunk)] = float(sim)
            
        matrix = np.zeros((len(req_set), len(chunk_set)))
        for i, req in enumerate(req_set):
            for j, chunk in enumerate(chunk_set):
                matrix[i, j] = scores.get((req, chunk), 0.0)
                
        return req_set, chunk_set, matrix

vector_queries = VectorQueries()
