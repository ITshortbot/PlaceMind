# ============================================================================
# File: backend/app/api/v1/router.py
# Description: Aggregates all V1 API domain routers
# ============================================================================

from fastapi import APIRouter, Depends, Request
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.scoring import router as scoring_router
from app.api.v1.endpoints.templates import router as templates_router
from app.api.v1.endpoints.ats import router as ats_router
from app.api.v1.endpoints.interviews import router as interviews_router
from app.api.v1.endpoints.resumes import router as resumes_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.onboarding import router as onboarding_router
from app.core.auth import get_current_user
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, rate_limiter, request_client_ip
from app.database.models import User


async def _authenticate_and_limit_guest_operations(
    request: Request,
    user: User = Depends(get_current_user),
) -> None:
    if user.is_guest:
        rate_limiter.check_many(
            [
                RateLimitRule(
                    bucket="guest-operations-user",
                    identity=str(user.id),
                    limit=settings.RATE_LIMIT_GUEST_OPERATIONS_PER_USER,
                    window_seconds=settings.RATE_LIMIT_GUEST_OPERATIONS_WINDOW_SECONDS,
                ),
                RateLimitRule(
                    bucket="guest-operations-ip",
                    identity=request_client_ip(request),
                    limit=settings.RATE_LIMIT_GUEST_OPERATIONS_PER_IP,
                    window_seconds=settings.RATE_LIMIT_GUEST_OPERATIONS_WINDOW_SECONDS,
                ),
            ]
        )


# Every data router requires a signed-in account; individual endpoints also
# resolve the user for ownership checks. Guest requests receive bounded limits.
# /auth stays open for session establishment and Google sign-in.
_auth = [Depends(_authenticate_and_limit_guest_operations)]

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(chat_router, dependencies=_auth)
api_router.include_router(onboarding_router, dependencies=_auth)
api_router.include_router(scoring_router, dependencies=_auth)
api_router.include_router(templates_router, dependencies=_auth)
api_router.include_router(ats_router, dependencies=_auth)
api_router.include_router(interviews_router, dependencies=_auth)
api_router.include_router(resumes_router, dependencies=_auth)
