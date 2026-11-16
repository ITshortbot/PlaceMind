# ============================================================================
# File: backend/app/api/v1/router.py
# Description: Aggregates all V1 API domain routers
# ============================================================================

from fastapi import APIRouter, Depends
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.scoring import router as scoring_router
from app.api.v1.endpoints.templates import router as templates_router
from app.api.v1.endpoints.ats import router as ats_router
from app.api.v1.endpoints.interviews import router as interviews_router
from app.api.v1.endpoints.resumes import router as resumes_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.onboarding import router as onboarding_router
from app.core.auth import get_current_user

# Every data router requires a signed-in account; individual endpoints also
# resolve the user for ownership checks. /auth stays open (it is the sign-in).
_auth = [Depends(get_current_user)]

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(chat_router, dependencies=_auth)
api_router.include_router(onboarding_router, dependencies=_auth)
api_router.include_router(scoring_router, dependencies=_auth)
api_router.include_router(templates_router, dependencies=_auth)
api_router.include_router(ats_router, dependencies=_auth)
api_router.include_router(interviews_router, dependencies=_auth)
api_router.include_router(resumes_router, dependencies=_auth)
