import json
import subprocess
import os
from ..schemas.resume import ResumeSchema
import uuid

class PDFCompiler:
    def __init__(self):
        self.template_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../templates/resume_base.typ"))

    def render_resume_pdf(self, resume: ResumeSchema) -> bytes:
        run_id = str(uuid.uuid4())
        data_path = f"/tmp/{run_id}_data.json"
        out_path = f"/tmp/{run_id}_resume.pdf"
        main_path = f"/tmp/{run_id}_main.typ"

        resume_dict = resume.model_dump()
        
        data = {
            "name": resume_dict.get("contact", {}).get("name", ""),
            "email": resume_dict.get("contact", {}).get("email", ""),
            "phone": resume_dict.get("contact", {}).get("phone", ""),
            "linkedin": resume_dict.get("contact", {}).get("linkedin", ""),
            "github": resume_dict.get("contact", {}).get("github", ""),
            "summary": resume_dict.get("summary", ""),
            "experience": resume_dict.get("experience", []),
            "education": resume_dict.get("education", []),
            "skills": resume_dict.get("skills", []),
            "projects": resume_dict.get("projects", []),
            "certifications": resume_dict.get("certifications", [])
        }
        
        with open(data_path, "w") as f:
            json.dump(data, f)
            
        main_typ = f"""
#import "{self.template_path}": resume
#let data = json("{data_path}")

#resume(
  name: data.name,
  email: data.email,
  phone: data.phone,
  linkedin: data.linkedin,
  github: data.github,
  summary: data.summary,
  experience: data.experience,
  education: data.education,
  skills: data.skills,
  projects: data.projects,
  certifications: data.certifications
)
"""
        with open(main_path, "w") as f:
            f.write(main_typ)
            
        try:
            subprocess.run(["typst", "compile", "--root", "/", main_path, out_path], check=True, capture_output=True)
            
            with open(out_path, "rb") as f:
                pdf_bytes = f.read()
                
            return pdf_bytes
        except subprocess.CalledProcessError as e:
            print(f"Typst compilation failed: {e.stderr.decode('utf-8')}")
            raise e
        finally:
            for p in [data_path, main_path, out_path]:
                if os.path.exists(p):
                    os.remove(p)

pdf_compiler = PDFCompiler()
