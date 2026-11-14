# ============================================================================
# File: backend/app/api/v1/router.py
# Description: Aggregates all V1 API domain routers
# ============================================================================

from fastapi import APIRouter
from app.api.v1.endpoints.scoring import router as scoring_router
from app.api.v1.endpoints.templates import router as templates_router
from app.api.v1.endpoints.ats import router as ats_router
from app.api.v1.endpoints.interviews import router as interviews_router
from app.api.v1.endpoints.resumes import router as resumes_router
from app.api.v1.endpoints.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(scoring_router)
api_router.include_router(templates_router)
api_router.include_router(ats_router)
api_router.include_router(interviews_router)
api_router.include_router(resumes_router)
