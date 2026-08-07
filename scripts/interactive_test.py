import os
import sys
import asyncio
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from app.schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry
from app.schemas.jd import JDRequirements
from app.ml.document_parser import document_parser
from app.ml.section_segmenter import section_segmenter
from app.ml.ner_extractor import ner_extractor
from app.ml.ats_scorer import ats_scorer
from app.ml.hallucination_guard import hallucination_guard
from app.ml.pdf_compiler import pdf_compiler
from app.ml.answer_scorer import answer_scorer

def print_header(title):
    print("\n" + "=" * 50)
    print(f"🚀 {title}")
    print("=" * 50)

def test_pipeline_a():
    print_header("Pipeline A: Docling Layout & NER Extraction Test")
    pdf_path = os.path.join(os.path.dirname(__file__), "../data/samples/sample_resume.pdf")
    if not os.path.exists(pdf_path):
        print(f"❌ PDF sample not found at: {pdf_path}")
        return

    print("1. Extracting PDF Layout text...")
    doc = document_parser.extract_layout_text(pdf_path)
    print(f"✅ Text extracted ({len(doc.markdown_text)} chars). Preview:\n{doc.markdown_text[:200]}...\n")

    print("2. Segmenting Sections...")
    sections = section_segmenter.segment_sections(doc.markdown_text)
    for s_name, s_content in sections.items():
        if s_content.strip():
            print(f"  • [{s_name}]: {len(s_content)} chars")

    print("\n3. Extracting Entities via DeBERTa NER...")
    exp_text = sections.get("Experience", doc.markdown_text)
    entities = ner_extractor.extract_entities(exp_text)
    print(f"✅ Extracted {len(entities)} entity tokens. Key Entities:")
    for ent in entities[:8]:
        print(f"  - [{ent.entity_group}]: {ent.word} (score: {ent.score:.2f})")

def test_pipeline_b():
    print_header("Pipeline B: BGE Embeddings & ATS Match Scoring Test")
    jd_path = os.path.join(os.path.dirname(__file__), "../data/samples/sample_jd.txt")
    with open(jd_path) as f:
        jd_text = f.read()

    sample_resume = ResumeSchema(
        contact=ContactInfo(name="Alex Chen", email="alex@example.com"),
        summary="Senior Software Engineer skilled in Python, FastAPI, React, PostgreSQL.",
        experience=[
            ExperienceEntry(
                company="Nexus Tech Labs",
                job_title="Senior Software Engineer",
                start_date="2021",
                end_date="Present",
                bullets=["Engineered RESTful microservices in Python (FastAPI) handling 20k QPS.", "Optimized PostgreSQL database queries."]
            )
        ],
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Redis", "Docker"]
    )

    sample_jd = JDRequirements(
        job_title="Senior Full Stack Engineer",
        required_skills=["Python", "FastAPI", "React", "PostgreSQL", "Kubernetes", "AWS"],
        responsibilities=["Build high-throughput backend APIs", "Lead CI/CD container deployment"]
    )

    print("1. Matrix scoring against Job Description...")
    matrix = np.array([[0.92, 0.50], [0.45, 0.88]])
    req_texts = ["FastAPI backend APIs", "Kubernetes container deployment"]
    chunk_texts = ["Engineered RESTful microservices in Python (FastAPI)", "Optimized PostgreSQL queries"]

    gap_report = ats_scorer.score_resume_against_jd(sample_resume, sample_jd, matrix, req_texts, chunk_texts)
    print(f"✅ Composite Match Score: {gap_report.overall_score * 100:.1f}%")
    print(f"  • Semantic Coverage: {gap_report.semantic_coverage_score * 100:.1f}%")
    print(f"  • Keyword Density: {gap_report.keyword_density_score * 100:.1f}%")
    print(f"  • Missing Skills: {', '.join(gap_report.missing_keywords)}")

def test_pipeline_c():
    print_header("Pipeline C: Anti-Hallucination & Typst PDF Compiler Test")
    sample_resume = ResumeSchema(
        contact=ContactInfo(name="Alex Chen", email="alex@example.com"),
        summary="Senior Engineer specializing in scalable systems.",
        experience=[
            ExperienceEntry(
                company="Nexus Tech Labs",
                job_title="Senior Software Engineer",
                start_date="2021",
                end_date="Present",
                bullets=["Built Python REST APIs with 99.99% uptime."]
            )
        ],
        skills=["Python", "FastAPI", "React", "PostgreSQL"]
    )

    print("1. Running Anti-Hallucination Guard validation...")
    val_res = hallucination_guard.validate_no_new_entities(sample_resume, sample_resume)
    print(f"✅ Guard Validation: {'PASSED' if val_res.is_valid else 'FAILED'}")

    print("2. Compiling ATS-Optimized Typst PDF...")
    pdf_bytes = pdf_compiler.render_resume_pdf(sample_resume)
    print(f"✅ PDF compiled successfully! Total size: {len(pdf_bytes)} bytes")

def test_pipeline_d():
    print_header("Pipeline D: AI Interview Answer Scorer Test")
    question = "Can you describe a time when you optimized a slow backend API?"
    answer = "At Nexus Tech Labs, our endpoint had an 800ms latency. I added Redis caching and indexed PostgreSQL query columns, bringing latency down to 45ms."

    print(f"Question: {question}")
    print(f"Candidate Answer: {answer}\n")
    print("Scoring candidate response...")
    score = asyncio.run(answer_scorer.score_answer(question, answer))
    print(f"✅ Relevance Score: {score.relevance * 100:.1f}%")
    print(f"✅ STAR Structure Score: {score.structure_star * 100:.1f}%")
    print(f"✅ Specificity Score: {score.specificity * 100:.1f}%")
    print(f"Feedback: {score.feedback}")

def interactive_menu():
    while True:
        print("\n==========================================")
        print("🎯 PlaceMind Interactive Test Menu")
        print("==========================================")
        print("1. Test Pipeline A (Docling Parsing & NER Extractor)")
        print("2. Test Pipeline B (BGE Embeddings & ATS Match Scoring)")
        print("3. Test Pipeline C (Anti-Hallucination & Typst Compiler)")
        print("4. Test Pipeline D (AI Interview Answer Scorer)")
        print("5. Run All Tests")
        print("6. Exit")
        choice = input("\nSelect test option (1-6): ").strip()

        if choice == "1":
            test_pipeline_a()
        elif choice == "2":
            test_pipeline_b()
        elif choice == "3":
            test_pipeline_c()
        elif choice == "4":
            test_pipeline_d()
        elif choice == "5":
            test_pipeline_a()
            test_pipeline_b()
            test_pipeline_c()
            test_pipeline_d()
        elif choice == "6":
            print("Goodbye! 👋")
            break
        else:
            print("Invalid choice, please select 1-6.")

if __name__ == "__main__":
    interactive_menu()
