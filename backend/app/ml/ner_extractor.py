from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
from typing import List
from pydantic import BaseModel

import torch

class Entity(BaseModel):
    entity_group: str
    word: str
    score: float
    start: int
    end: int

class NERExtractor:
    def __init__(self, model_name: str = "AventIQ-AI/Resume-Parsing-NER-AI-Model"):
        """
        Initializes the NER pipeline for parsing resume sections.
        This model helps extract entities like JOB_TITLE, COMPANY, SKILL, etc.
        """
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(model_name)
            device = 0 if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else -1)
            self.nlp = pipeline("ner", model=self.model, tokenizer=self.tokenizer, aggregation_strategy="simple", device=device)
            self.is_ready = True
        except Exception as e:
            print(f"Error loading NER model: {e}")
            self.is_ready = False

    def extract_entities(self, text: str) -> List[Entity]:
        """
        Runs the NER pipeline on a given chunk of text and returns extracted entities.
        """
        if not self.is_ready:
            raise RuntimeError("NER model is not properly loaded.")
            
        entities = self.nlp(text)
        
        return [
            Entity(
                entity_group=ent.get("entity_group", "UNKNOWN"),
                word=ent.get("word", ""),
                score=float(ent.get("score", 0.0)),
                start=ent.get("start", 0),
                end=ent.get("end", 0)
            )
            for ent in entities
        ]

ner_extractor = NERExtractor()
