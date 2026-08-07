import re
from typing import Dict

class SectionSegmenter:
    def __init__(self):
        # Common section headers used in resumes
        self.section_mapping = {
            r"experience|employment|work history": "Experience",
            r"education|academic": "Education",
            r"skills|technologies|core competencies": "Skills",
            r"projects": "Projects",
            r"certifications|licenses": "Certifications",
            r"summary|profile|about me": "Summary",
            r"contact|personal information": "Contact"
        }

    def segment_sections(self, markdown_text: str) -> Dict[str, str]:
        """
        Splits markdown text into standard resume sections using header regex heuristics.
        """
        sections = {
            "Contact": "",
            "Summary": "",
            "Experience": "",
            "Education": "",
            "Skills": "",
            "Projects": "",
            "Certifications": ""
        }
        
        lines = markdown_text.split('\n')
        current_section = "Contact" # Default to contact at the top
        
        for line in lines:
            # Check if line is a header (Markdown headers or uppercase short lines)
            is_header = False
            clean_line = line.strip().lower()
            
            if clean_line.startswith('#'):
                clean_line = clean_line.lstrip('#').strip()
                is_header = True
            elif len(clean_line) > 0 and len(clean_line) < 40 and line.strip().isupper():
                is_header = True
                
            matched_section = None
            if is_header:
                for pattern, section_name in self.section_mapping.items():
                    if re.search(pattern, clean_line):
                        matched_section = section_name
                        break
                        
            if matched_section:
                current_section = matched_section
            else:
                sections[current_section] += line + "\n"
                
        # Clean up empty sections and strip whitespace
        return {k: v.strip() for k, v in sections.items() if v.strip()}

section_segmenter = SectionSegmenter()
