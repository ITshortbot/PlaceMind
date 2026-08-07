from typing import List
from ..schemas.resume import ResumeSchema
from .ner_extractor import ner_extractor

class ValidationResult:
    def __init__(self, is_valid: bool, hallucinations: List[str] = None):
        self.is_valid = is_valid
        self.hallucinations = hallucinations or []

class HallucinationGuard:
    def __init__(self):
        # We protect factual entities that should not be invented by the LLM
        self.protected_entities = {"COMPANY", "DEGREE", "DATE_RANGE", "INSTITUTION", "JOB_TITLE"}

    def _extract_protected_entities(self, resume: ResumeSchema) -> set:
        text = resume.model_dump_json()
        entities = ner_extractor.extract_entities(text)
        
        protected = set()
        for ent in entities:
            if ent.entity_group in self.protected_entities:
                protected.add(ent.word.lower().strip())
        return protected

    def validate_no_new_entities(self, original: ResumeSchema, rewritten: ResumeSchema) -> ValidationResult:
        original_entities = self._extract_protected_entities(original)
        rewritten_entities = self._extract_protected_entities(rewritten)
        
        hallucinations = []
        for ent in rewritten_entities:
            # We use substring matching to allow slight semantic variations
            found = False
            for orig_ent in original_entities:
                if ent in orig_ent or orig_ent in ent:
                    found = True
                    break
            
            if not found:
                hallucinations.append(ent)
                
        if hallucinations:
            return ValidationResult(is_valid=False, hallucinations=hallucinations)
        return ValidationResult(is_valid=True)

hallucination_guard = HallucinationGuard()
