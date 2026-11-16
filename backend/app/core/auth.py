# ============================================================================
# File: backend/app/core/auth.py
# Description: FastAPI dependency that resolves the signed-in user from the
#   session cookie. Applied to every data router; endpoints that serve user
#   data depend on this instead of the old single local demo account.
# ============================================================================

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import read_session_token
from app.database.models import User
from app.database.session import get_db

SESSION_COOKIE_NAME = "placemind_session"


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = read_session_token(token) if token else None
    try:
        user_uuid = uuid.UUID(user_id) if user_id else None
    except ValueError:
        user_uuid = None
    if not user_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in required.",
        )
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session account no longer exists.",
        )
    return user
