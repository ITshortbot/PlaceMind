import os
from typing import Dict, Any, Optional
from pydantic import BaseModel

try:
    from docling.document_converter import DocumentConverter
except ImportError:
    DocumentConverter = None

class ParsedDocument(BaseModel):
    markdown_text: str
    metadata: Dict[str, Any] = {}

class DocumentParser:
    def __init__(self):
        if DocumentConverter:
            self.converter = DocumentConverter()
        else:
            self.converter = None

    def extract_layout_text(self, file_path: str) -> ParsedDocument:
        """
        Uses docling to extract layout-aware markdown from a PDF.
        """
        if not self.converter:
            raise RuntimeError("DocumentConverter (docling) is not installed.")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        try:
            result = self.converter.convert(file_path)
            markdown_text = result.document.export_to_markdown()
            return ParsedDocument(
                markdown_text=markdown_text,
                metadata={"source": "docling", "status": "success"}
            )
        except Exception as e:
            # Fallback to marker if we had it, but for now just raise
            print(f"Docling failed to parse {file_path}: {e}")
            raise e

document_parser = DocumentParser()
