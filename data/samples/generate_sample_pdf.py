import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from app.schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry, EducationEntry
from app.ml.pdf_compiler import pdf_compiler

def create_sample_pdf():
    print("📄 Generating sample candidate resume PDF...")
    sample_resume = ResumeSchema(
        contact=ContactInfo(
            name="Alex Chen",
            email="alex.chen@example.com",
            phone="+1 (555) 019-2834",
            linkedin="linkedin.com/in/alexchen-dev",
            github="github.com/alexchen-dev"
        ),
        summary="Senior Full Stack Software Engineer with 5+ years of experience building high-performance distributed backend services, real-time web applications, and database architectures.",
        experience=[
            ExperienceEntry(
                company="Nexus Tech Labs",
                job_title="Senior Software Engineer",
                start_date="2021",
                end_date="Present",
                bullets=[
                    "Engineered RESTful microservices in Python (FastAPI) handling 20,000 requests per minute with 99.99% uptime.",
                    "Optimized PostgreSQL database queries and indexing strategies, reducing median response latency by 35%.",
                    "Implemented Redis cache strategy to accelerate user session state resolution."
                ]
            ),
            ExperienceEntry(
                company="Apex Innovations",
                job_title="Full Stack Developer",
                start_date="2019",
                end_date="2021",
                bullets=[
                    "Developed responsive web dashboards using React, TypeScript, and Tailwind CSS.",
                    "Integrated WebSocket channels for real-time live data streaming across 10,000 concurrent clients."
                ]
            )
        ],
        education=[
            EducationEntry(
                institution="University of California, Berkeley",
                degree="B.S. in Computer Science",
                start_date="2015",
                end_date="2019"
            )
        ],
        skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Redis", "Docker", "Git", "REST APIs"]
    )

    pdf_bytes = pdf_compiler.render_resume_pdf(sample_resume)
    out_path = os.path.join(os.path.dirname(__file__), "sample_resume.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
        
    print(f"✅ Generated {len(pdf_bytes)} bytes PDF at: {out_path}")

if __name__ == "__main__":
    create_sample_pdf()
