# ============================================================================
# File: backend/app/api/v1/endpoints/auth.py
# Description: Google OAuth 2.0 sign-in with remembered sessions.
#   /auth/google/login    -> 302 to Google's consent screen. The state value
#                            is a short-lived signed token whose nonce is also
#                            set in an HttpOnly cookie, binding the round-trip
#                            to the browser that started it; the cookie is
#                            deleted on callback so a state cannot be replayed.
#   /auth/google/callback -> code exchange at Google, then the id_token is
#                            verified LOCALLY with google-auth (JWKS signature,
#                            issuer, audience, expiry) per Google's production
#                            guidance - the tokeninfo endpoint is debug-only:
#                            developers.google.com/identity/gsi/web/guides/verify-google-id-token
#   /auth/me              -> the signed-in account (drives the UI auth gate)
#   /auth/logout          -> clears the session cookie
#   Post-login redirects go only to fixed allowlisted frontend paths.
#   The Google client secret and the session signing key live in the host
#   environment only; nothing secret is stored in this repository.
#   Pre-auth demo data (the old single local account) is left untouched and
#   quarantined: it is never reassigned to a signing-in user.
# ============================================================================

import asyncio
import logging
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import SESSION_COOKIE_NAME, get_current_user
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, rate_limiter, request_client_ip
from app.core.security import (
    create_session_token,
    create_state_token,
    verify_state_token,
)
from app.database.models import User
from app.database.session import get_db

logger = logging.getLogger("placemind.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
STATE_COOKIE_NAME = "placemind_oauth_state"
STATE_COOKIE_MAX_AGE = 600  # seconds, matches the signed state's 10-minute expiry

# Consumed state nonces: a state may complete exactly once, even if an
# attacker replays both the state value and a captured nonce cookie. The
# authorization code itself is also single-use at Google. This in-process
# store fits the single-worker deployment; a multi-worker deployment would
# move it to shared storage.
_used_state_nonces: dict[str, float] = {}


def _consume_state_nonce(nonce: str) -> bool:
    """Mark a state nonce used. Returns False when it was already consumed."""
    now = time.time()
    expired = [n for n, exp in _used_state_nonces.items() if exp < now]
    for n in expired:
        del _used_state_nonces[n]
    if nonce in _used_state_nonces:
        return False
    _used_state_nonces[nonce] = now + STATE_COOKIE_MAX_AGE
    return True

# Fixed allowlist of post-login destinations. Never derived from the request.
REDIRECT_NEW_USER = "/onboarding"
REDIRECT_RETURNING_USER = "/dashboard"


def google_auth_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


async def _exchange_code(code: str) -> dict:
    """Trade the authorization code for tokens at Google."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google token exchange failed.",
        )
    return response.json()


def _verify_id_token_sync(id_token: str) -> dict:
    """Local verification of the Google id_token: JWKS signature, issuer,
    audience and expiry, via the official google-auth library."""
    return google_id_token.verify_oauth2_token(
        id_token,
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )


async def _verify_id_token(id_token: str) -> dict:
    try:
        claims = await asyncio.to_thread(_verify_id_token_sync, id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google identity token could not be validated.",
        )
    if claims.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified.",
        )
    return claims


def _google_authoritative_for_email(claims: dict, email: str) -> bool:
    """Per Google guidance, Google vouches for an email address only when it
    is a Gmail address or a verified Workspace (hd) account. Only then may an
    existing account with the same email be linked to this Google identity."""
    if claims.get("email_verified") is not True:
        return False
    return email.endswith("@gmail.com") or bool(claims.get("hd"))


def _error_redirect(reason: str) -> RedirectResponse:
    target = f"{settings.FRONTEND_URL}/login?error={reason}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


@router.get("/google/login")
async def google_login():
    if not google_auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on this server yet.",
        )
    state, nonce = create_state_token()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    response = RedirectResponse(
        url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}",
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        STATE_COOKIE_NAME,
        nonce,
        max_age=STATE_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=settings.AUTH_COOKIE_SECURE,
        # Scoped to "/" (not the auth route) so the cookie survives URL-prefix
        # reverse proxies, which rewrite the browser-visible path but do not
        # rewrite Set-Cookie Path attributes. HttpOnly, 10-minute, single-use.
        path="/",
    )
    return response


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    def _fail(reason: str) -> RedirectResponse:
        response = _error_redirect(reason)
        response.delete_cookie(STATE_COOKIE_NAME, path="/")
        return response

    if error or not code:
        return _fail("google_declined")
    if not google_auth_configured():
        return _fail("not_configured")

    # State must be valid AND bound to this browser via the nonce cookie.
    # Deleting the cookie on first use makes the state single-use.
    expected_nonce = request.cookies.get(STATE_COOKIE_NAME)
    state_nonce = verify_state_token(state) if state else None
    if (
        not expected_nonce
        or not state_nonce
        or expected_nonce != state_nonce
        or not _consume_state_nonce(state_nonce)
    ):
        return _fail("invalid_state")

    tokens = await _exchange_code(code)
    id_token = tokens.get("id_token")
    if not id_token:
        return _fail("no_id_token")
    claims = await _verify_id_token(id_token)

    google_sub = str(claims.get("sub", "")).strip()
    email = str(claims.get("email", "")).strip().lower()
    full_name = str(claims.get("name", "")).strip() or None
    avatar_url = str(claims.get("picture", "")).strip() or None
    if not google_sub or not email:
        return _fail("missing_identity")

    # The Google subject is the stable account key. An existing account is
    # matched by email ONLY when Google is authoritative for that address;
    # otherwise a same-email account is a conflict, never a silent takeover.
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()
    is_new_user = False
    if user is None:
        result = await db.execute(select(User).where(User.email == email))
        by_email = result.scalar_one_or_none()
        if by_email is not None:
            # A quarantined pre-auth demo identity is never claimed, and an
            # email Google does not vouch for is never linked - both would be
            # account takeover paths.
            if (
                by_email.is_guest
                or by_email.is_local_only
                or not _google_authoritative_for_email(claims, email)
            ):
                return _fail("account_exists")
            user = by_email
            user.google_sub = google_sub
    if user is None:
        user = User(
            email=email,
            full_name=full_name,
            google_sub=google_sub,
            avatar_url=avatar_url,
            is_local_only=False,
            is_guest=False,
        )
        db.add(user)
        await db.flush()
        is_new_user = True
    else:
        if user.is_guest:
            return _fail("account_exists")
        # Keep profile fields fresh from Google on each login.
        if full_name:
            user.full_name = full_name
        if avatar_url:
            user.avatar_url = avatar_url
        if user.is_local_only:
            user.is_local_only = False

    token, max_age = create_session_token(str(user.id))
    destination = REDIRECT_NEW_USER if is_new_user else REDIRECT_RETURNING_USER
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}{destination}",
        status_code=status.HTTP_302_FOUND,
    )
    response.delete_cookie(STATE_COOKIE_NAME, path="/")
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.AUTH_COOKIE_SECURE,
        path="/",
    )
    return response


def _user_identity(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "is_guest": user.is_guest,
    }


async def _current_user_or_none(request: Request, db: AsyncSession) -> User | None:
    try:
        return await get_current_user(request, db)
    except HTTPException as error:
        if error.status_code != status.HTTP_401_UNAUTHORIZED:
            raise
        return None


@router.get("/me")
async def auth_me(user: User = Depends(get_current_user)):
    return _user_identity(user)


@router.post("/guest")
async def create_guest_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    current_user = await _current_user_or_none(request, db)
    if current_user is not None:
        return _user_identity(current_user)

    if not settings.AUTH_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication sessions are not configured on this server.",
        )

    rate_limiter.check_many(
        [
            RateLimitRule(
                bucket="guest-create-ip",
                identity=request_client_ip(request),
                limit=settings.RATE_LIMIT_GUEST_CREATION_PER_IP,
                window_seconds=settings.RATE_LIMIT_GUEST_CREATION_WINDOW_SECONDS,
            )
        ]
    )

    guest = User(email=None, full_name=None, is_local_only=False, is_guest=True)
    db.add(guest)
    await db.flush()

    token, max_age = create_session_token(str(guest.id))
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.AUTH_COOKIE_SECURE,
        path="/",
    )
    return _user_identity(guest)


@router.post("/logout")
async def auth_logout():
    response = JSONResponse({"status": "signed_out"})
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return response
