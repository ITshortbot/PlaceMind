# ============================================================================
# File: backend/app/api/v1/router.py
# Description: Aggregates all V1 API domain routers
# ============================================================================

from fastapi import APIRouter
from app.api.v1.endpoints.scoring import router as scoring_router

api_router = APIRouter()
api_router.include_router(scoring_router)
