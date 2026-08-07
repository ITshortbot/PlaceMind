from sqlalchemy import Column, String, JSON, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from ..db.database import Base
import uuid
import datetime

def generate_uuid():
    return str(uuid.uuid4())

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(String, primary_key=True, default=generate_uuid)
    parsed_json = Column(JSON)
    status = Column(String, default="pending")
    parser_confidence = Column(Float, nullable=True)
    generated_pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(String, primary_key=True, default=generate_uuid)
    text = Column(String)
    extracted_requirements = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
class ResumeChunkEmbedding(Base):
    __tablename__ = "resume_embeddings"
    id = Column(String, primary_key=True, default=generate_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    chunk_text = Column(String)
    embedding = Column(Vector(1024)) # bge-large-en is 1024-dim
    
class JDEmbedding(Base):
    __tablename__ = "jd_embeddings"
    id = Column(String, primary_key=True, default=generate_uuid)
    jd_id = Column(String, ForeignKey("job_descriptions.id"))
    requirement_text = Column(String)
    embedding = Column(Vector(1024))

class ResumeJDMatch(Base):
    __tablename__ = "resume_jd_matches"
    id = Column(String, primary_key=True, default=generate_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    jd_id = Column(String, ForeignKey("job_descriptions.id"))
    gap_report = Column(JSON, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    match_id = Column(String, ForeignKey("resume_jd_matches.id"))
    role_title = Column(String, default="Software Engineer")
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InterviewTurn(Base):
    __tablename__ = "interview_turns"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"))
    turn_number = Column(Float)
    question = Column(String)
    answer = Column(String, nullable=True)
    score_data = Column(JSON, nullable=True)
    is_follow_up = Column(String, default="false")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
