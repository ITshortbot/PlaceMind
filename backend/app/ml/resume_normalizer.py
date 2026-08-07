import json
import os
from typing import List, Dict, Any
from .ner_extractor import Entity
from ..schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry, EducationEntry

class ResumeNormalizer:
    def __init__(self):
        taxonomy_path = os.path.join(os.path.dirname(__file__), "skill_taxonomy.json")
        try:
            with open(taxonomy_path, "r") as f:
                self.skill_taxonomy = set(json.load(f))
        except:
            self.skill_taxonomy = set()

    def _canonicalize_skill(self, skill: str) -> str:
        # Simple canonicalization, ideally fuzzy match against taxonomy
        for t in self.skill_taxonomy:
            if t.lower() == skill.lower():
                return t
        return skill

    def build_structured_resume(self, entities: List[Entity], sections: Dict[str, str]) -> ResumeSchema:
        contact = ContactInfo()
        # In a full implementation, we map `entities` (like JOB_TITLE, COMPANY) to fields.
        
        experience = []
        if "Experience" in sections and sections["Experience"]:
            # Simple fallback parsing for Experience bullets
            experience.append(ExperienceEntry(
                company="Unknown Company",
                job_title="Unknown Title",
                start_date="",
                end_date="",
                is_current=False,
                bullets=[line.strip() for line in sections["Experience"].split('\n') if line.strip().startswith("-")]
            ))

        education = []
        if "Education" in sections and sections["Education"]:
            education.append(EducationEntry(
                institution="Unknown University",
                degree="Degree",
                start_date="",
                end_date="",
                gpa=None
            ))

        skills = set()
        for ent in entities:
            if ent.entity_group == "SKILL":
                skills.add(self._canonicalize_skill(ent.word))

        return ResumeSchema(
            contact=contact,
            summary=sections.get("Summary", ""),
            experience=experience,
            education=education,
            skills=list(skills),
            projects=[],
            certifications=[]
        )

resume_normalizer = ResumeNormalizer()
