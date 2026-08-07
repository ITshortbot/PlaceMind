import os
from typing import Dict, Any, Optional
from pydantic import BaseModel

try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.pipeline_options import PdfPipelineOptions
except ImportError:
    DocumentConverter = None

class ParsedDocument(BaseModel):
    markdown_text: str
    metadata: Dict[str, Any] = {}

class DocumentParser:
    def __init__(self):
        if DocumentConverter:
            try:
                pipeline_options = PdfPipelineOptions(do_ocr=False)
                self.converter = DocumentConverter(
                    format_options={
                        "pdf": PdfFormatOption(pipeline_options=pipeline_options)
                    }
                )
            except Exception:
                self.converter = DocumentConverter()
        else:
            self.converter = None

    def extract_layout_text(self, file_path: str) -> ParsedDocument:
        """
        Uses docling to extract layout-aware markdown from a PDF with fast fallback.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        if self.converter:
            try:
                result = self.converter.convert(file_path)
                markdown_text = result.document.export_to_markdown()
                if markdown_text and markdown_text.strip():
                    return ParsedDocument(
                        markdown_text=markdown_text,
                        metadata={"source": "docling", "status": "success"}
                    )
            except Exception as e:
                print(f"Docling parse failed ({e}), using pypdf fallback...")
            
        # Fallback layout extraction via pypdf / text reading
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            extracted = "\n\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
            return ParsedDocument(
                markdown_text=extracted,
                metadata={"source": "pypdf_fallback", "status": "success"}
            )
        except Exception as fallback_err:
            raise RuntimeError(f"Failed to extract PDF layout: {fallback_err}")

document_parser = DocumentParser()
