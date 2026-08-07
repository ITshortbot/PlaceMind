import time
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from app.ml.embedding_service import embedding_service
from app.ml.pdf_compiler import pdf_compiler
from app.schemas.resume import ResumeSchema, ContactInfo, ExperienceEntry

def benchmark_local():
    print("==========================================")
    print("⚡ PlaceMind Local Latency & Throughput Benchmark")
    print("==========================================")

    # 1. Embedding Benchmark
    texts = ["Developed scalable microservices in Python", "Optimized PostgreSQL query latency", "Managed Redis cache layers"] * 10
    start = time.time()
    embeddings = embedding_service.embed_texts(texts)
    elapsed = time.time() - start
    throughput = len(texts) / elapsed if elapsed > 0 else 0
    print(f"📊 Embedding Service (bge-large-en): {len(texts)} texts in {elapsed:.3f}s ({throughput:.1f} texts/sec)")

    # 2. PDF Compilation Benchmark
    sample_resume = ResumeSchema(
        contact=ContactInfo(name="Benchmark Candidate", email="test@example.com"),
        summary="Senior Full Stack Engineer with 5 years experience.",
        experience=[
            ExperienceEntry(
                company="Tech Co",
                job_title="Software Engineer",
                start_date="2021",
                end_date="Present",
                bullets=["Built high-throughput REST APIs using Python and FastAPI."]
            )
        ],
        skills=["Python", "FastAPI", "Docker", "PostgreSQL"]
    )

    start = time.time()
    pdf_bytes = pdf_compiler.render_resume_pdf(sample_resume)
    elapsed = time.time() - start
    print(f"📄 Typst PDF Compiler: Rendered {len(pdf_bytes)} bytes in {elapsed:.3f}s")
    print("==========================================")
    print("✅ Benchmark Completed Successfully!")

if __name__ == "__main__":
    benchmark_local()
