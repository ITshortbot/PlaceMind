import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func, text
from sqlalchemy import JSON, Uuid as GenericUuid
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    is_local_only = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    r2_storage_key = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=False)
    parsed_metadata = Column(JSONB, default=dict, server_default=text("'{}'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="resumes")
    sections = relationship("ResumeSection", back_populates="resume", cascade="all, delete-orphan")
    match_scores = relationship("ATSMatchScore", back_populates="resume", cascade="all, delete-orphan")


class ResumeSection(Base):
    __tablename__ = "resume_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    section_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    meta_info = Column(JSONB, default=dict, server_default=text("'{}'"))
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="sections")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="job_descriptions")
    requirements = relationship("JobRequirement", back_populates="job", cascade="all, delete-orphan")
    match_scores = relationship("ATSMatchScore", back_populates="job", cascade="all, delete-orphan")


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    requirement_text = Column(Text, nullable=False)
    category = Column(String(50), default="technical", server_default="'technical'")
    is_mandatory = Column(Boolean, default=True, server_default="true")
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("JobDescription", back_populates="requirements")


class ATSMatchScore(Base):
    __tablename__ = "ats_match_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    semantic_score = Column(Numeric(5, 2), nullable=False)
    keyword_score = Column(Numeric(5, 2), nullable=False)
    routing_mode = Column(String(20), nullable=False)
    gap_report = Column(JSONB, nullable=False)
    processing_time_ms = Column(Numeric(8, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="match_scores")
    job = relationship("JobDescription", back_populates="match_scores")

class InterviewSession(Base):
    """A mock-interview practice session. Single-user demo: user_id optional."""

    __tablename__ = "interview_sessions"

    id = Column(GenericUuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(GenericUuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_role = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    interview_type = Column(String(20), nullable=False, default="practice")  # practice | real
    question_count = Column(Integer, nullable=False, default=5)
    status = Column(String(20), nullable=False, default="active")  # active | completed
    planned_questions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    turns = relationship("InterviewTurn", back_populates="session", cascade="all, delete-orphan")


class InterviewTurn(Base):
    """One question/answer exchange inside a session."""

    __tablename__ = "interview_turns"

    id = Column(GenericUuid, primary_key=True, default=uuid.uuid4)
    session_id = Column(GenericUuid, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    focus = Column(String(255), nullable=True)
    answer_text = Column(Text, nullable=True)
    score = Column(Numeric(5, 1), nullable=True)
    feedback = Column(JSON, nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)

    session = relationship("InterviewSession", back_populates="turns")
