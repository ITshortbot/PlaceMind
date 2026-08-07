from pydantic import BaseModel, Field
from typing import List, Optional

class ContactInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""

class ExperienceEntry(BaseModel):
    company: str
    job_title: str
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    bullets: List[str] = []

class EducationEntry(BaseModel):
    institution: str
    degree: str
    start_date: str = ""
    end_date: str = ""
    gpa: Optional[float] = None

class ResumeSchema(BaseModel):
    contact: ContactInfo
    summary: str = ""
    experience: List[ExperienceEntry] = []
    education: List[EducationEntry] = []
    skills: List[str] = []
    projects: List[str] = []
    certifications: List[str] = []
