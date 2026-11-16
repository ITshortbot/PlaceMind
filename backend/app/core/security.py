# ============================================================================
# File: backend/app/core/security.py
# Description: Signed session and OAuth-state tokens (HS256 JWT via PyJWT).
#   Sessions are what "remember the user" means: a signed, expiring token in
#   an HttpOnly cookie. State tokens are short-lived CSRF protection for the
#   Google OAuth round-trip. The signing key comes from AUTH_SECRET_KEY and
#   is never stored in the repository.
# ============================================================================

import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

SESSION_PURPOSE = "session"
STATE_PURPOSE = "oauth-state"


class AuthConfigurationError(RuntimeError):
    """Raised when an auth operation needs configuration that is missing."""


def _signing_key() -> str:
    key = settings.AUTH_SECRET_KEY
    if not key:
        raise AuthConfigurationError(
            "AUTH_SECRET_KEY is not set; sessions cannot be issued or verified."
        )
    return key


def _mint(purpose: str, lifetime: timedelta, claims: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "purpose": purpose,
        "iat": now,
        "exp": now + lifetime,
        "nonce": secrets.token_urlsafe(8),
        **claims,
    }
    return jwt.encode(payload, _signing_key(), algorithm="HS256")


def _read(token: str, purpose: str) -> dict | None:
    try:
        payload = jwt.decode(token, _signing_key(), algorithms=["HS256"])
    except (jwt.PyJWTError, AuthConfigurationError):
        return None
    if payload.get("purpose") != purpose:
        return None
    return payload


def create_session_token(user_id: str) -> tuple[str, int]:
    """Returns (token, max_age_seconds) for a remembered session."""
    max_age = int(timedelta(days=settings.AUTH_SESSION_DAYS).total_seconds())
    return _mint(SESSION_PURPOSE, timedelta(seconds=max_age), {"sub": user_id}), max_age


def read_session_token(token: str) -> str | None:
    """Returns the user id for a valid session token, else None."""
    payload = _read(token, SESSION_PURPOSE)
    if not payload:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


def create_state_token() -> tuple[str, str]:
    """Short-lived signed state for the OAuth round-trip. Returns
    (state_token, nonce): the nonce is also stored in an HttpOnly cookie so
    the callback can bind the round-trip to the browser that started it, and
    the cookie is deleted on use so a state cannot be replayed."""
    nonce = secrets.token_urlsafe(16)
    return _mint(STATE_PURPOSE, timedelta(minutes=10), {"state_nonce": nonce}), nonce


def verify_state_token(token: str) -> str | None:
    """Returns the embedded nonce for a valid state token, else None."""
    payload = _read(token, STATE_PURPOSE)
    if not payload:
        return None
    nonce = payload.get("state_nonce")
    return str(nonce) if nonce else None
