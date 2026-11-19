# ============================================================================
# File: backend/tests/test_auth_api.py
# Description: Google sign-in and ownership tests.
#   - Protected endpoints 401 without a session
#   - Login redirect carries signed, browser-bound single-use state
#   - Callback verifies state, creates/links accounts correctly, and only
#     links an existing email when Google is authoritative for that address
#   - Sessions remember the user (cookie -> /auth/me) and logout clears them
#   - Object-level ownership: cross-user ids 404 across every endpoint family
#   - Legacy pre-auth demo data stays quarantined and is never claimed
#   Google token exchange and id_token verification are stubbed at the module
#   boundary; no live network calls happen in tests.
# ============================================================================

import uuid
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.v1.endpoints import auth as auth_endpoints
from app.api.v1.endpoints.auth import STATE_COOKIE_NAME
from app.core.auth import SESSION_COOKIE_NAME, get_current_user
from app.core.config import settings
from app.core.security import create_session_token
from app.database.models import (
    ATSMatchScore,
    InterviewSession,
    InterviewTurn,
    JobDescription,
    Resume,
    ResumeSection,
    User,
)
from app.database.session import get_db
from app.main import app

SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
SQLiteTypeCompiler.visit_vector = lambda self, type_, **kw: "BLOB"
for _table in (User.__table__, Resume.__table__, ResumeSection.__table__, JobDescription.__table__, ATSMatchScore.__table__):
    for _col in _table.c:
        if _col.server_default is not None and str(_col.server_default.arg).endswith("::jsonb"):
            _col.server_default = None

TABLES = (
    User.__table__,
    Resume.__table__,
    ResumeSection.__table__,
    JobDescription.__table__,
    ATSMatchScore.__table__,
    InterviewSession.__table__,
    InterviewTurn.__table__,
)

GMAIL_CLAIMS = {
    "sub": "g-1001",
    "email": "newuser@gmail.com",
    "email_verified": True,
    "name": "New User",
    "picture": "https://example.test/pic.png",
}


@pytest.fixture
def auth_settings(monkeypatch):
    monkeypatch.setattr(settings, "AUTH_SECRET_KEY", "test-signing-key-0123456789abcdef0123456789")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setattr(settings, "GOOGLE_REDIRECT_URI", "http://test/api/v1/auth/google/callback")
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://localhost:3000")
    monkeypatch.setattr(settings, "AUTH_COOKIE_SECURE", False)
    monkeypatch.setattr(settings, "CORS_ORIGINS", ["http://localhost:3005"])
    return settings


@pytest.fixture
async def maker():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        for t in TABLES:
            await conn.run_sync(t.create, checkfirst=True)
    session_maker = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def _get_db():
        async with session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _get_db
    yield session_maker
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


@pytest.fixture
async def client(maker, auth_settings):
    # Exercise the real cookie/session path: remove the conftest auth stub.
    app.dependency_overrides.pop(get_current_user, None)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=False) as ac:
        yield ac


async def _make_user(maker, email, sub=None, is_local_only=False):
    async with maker() as session:
        user = User(email=email, full_name="Existing User", google_sub=sub, is_local_only=is_local_only)
        session.add(user)
        await session.commit()
        return user


def _session_cookie(user) -> str:
    token, _ = create_session_token(str(user.id))
    return token


def _stub_google(monkeypatch, claims):
    async def fake_exchange(code: str) -> dict:
        return {"id_token": "stub-id-token"}

    async def fake_verify(id_token: str) -> dict:
        return claims

    monkeypatch.setattr(auth_endpoints, "_exchange_code", fake_exchange)
    monkeypatch.setattr(auth_endpoints, "_verify_id_token", fake_verify)


async def _login(client) -> tuple[str, str]:
    """Start the flow; returns (state, state-cookie-nonce)."""
    res = await client.get("/api/v1/auth/google/login")
    assert res.status_code == 302, res.text
    location = res.headers["location"]
    assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    query = parse_qs(urlparse(location).query)
    assert query["client_id"] == ["test-client-id.apps.googleusercontent.com"]
    assert query["redirect_uri"] == ["http://test/api/v1/auth/google/callback"]
    assert query["response_type"] == ["code"]
    nonce = client.cookies.get(STATE_COOKIE_NAME)
    assert nonce
    return query["state"][0], nonce


async def _callback(client, state: str, code: str = "auth-code"):
    return await client.get(
        "/api/v1/auth/google/callback", params={"code": code, "state": state}
    )


@pytest.mark.asyncio
async def test_protected_endpoints_require_signin(client):
    for method, path in [
        ("GET", "/api/v1/resumes"),
        ("GET", "/api/v1/interviews/sessions"),
        ("GET", "/api/v1/templates/presets"),
        ("POST", "/api/v1/chat"),
        ("POST", "/api/v1/onboarding/bootstrap"),
        ("POST", "/api/v1/ats/score-doc"),
        ("GET", "/api/v1/auth/me"),
    ]:
        res = await client.request(method, path)
        assert res.status_code == 401, f"{method} {path} -> {res.status_code}"


@pytest.mark.asyncio
async def test_health_endpoints_stay_open(client):
    res = await client.get("/health")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_login_unconfigured_returns_503(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "")
    res = await client.get("/api/v1/auth/google/login")
    assert res.status_code == 503


@pytest.mark.asyncio
async def test_login_redirects_to_google_with_browser_bound_state(client):
    state, nonce = await _login(client)
    assert state
    set_cookie = None
    # The state cookie is HttpOnly; path "/" keeps it working behind URL-prefix proxies.
    res = await client.get("/api/v1/auth/google/login")
    for header in res.headers.get_list("set-cookie"):
        if header.startswith(STATE_COOKIE_NAME):
            set_cookie = header
    assert set_cookie is not None
    assert "HttpOnly" in set_cookie
    assert "Path=/" in set_cookie


@pytest.mark.asyncio
async def test_callback_rejects_missing_or_mismatched_state(client, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    # No state cookie at all.
    res = await client.get(
        "/api/v1/auth/google/callback", params={"code": "x", "state": "bogus"}
    )
    assert res.status_code == 302
    assert res.headers["location"].endswith("/login?error=invalid_state")

    # A stale state from an earlier login does not match the current cookie.
    state_a, _ = await _login(client)
    state_b, _ = await _login(client)  # overwrites the state cookie
    res = await _callback(client, state_a)
    assert res.headers["location"].endswith("/login?error=invalid_state")

    # A failed attempt consumes the cookie; a fresh login round-trips cleanly.
    state_c, _ = await _login(client)
    res = await _callback(client, state_c)
    assert res.status_code == 302
    assert "/onboarding" in res.headers["location"] or "/dashboard" in res.headers["location"]


@pytest.mark.asyncio
async def test_callback_creates_account_session_and_remembers_user(client, maker, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert res.status_code == 302
    assert res.headers["location"] == "http://localhost:3000/onboarding"

    session_token = client.cookies.get(SESSION_COOKIE_NAME)
    assert session_token

    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "newuser@gmail.com"
    assert body["full_name"] == "New User"
    assert body["is_guest"] is False

    # A second sign-in with the same Google subject lands on the dashboard.
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert res.headers["location"] == "http://localhost:3000/dashboard"


@pytest.mark.asyncio
async def test_state_is_single_use(client, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    res = await client.get("/api/v1/auth/google/login")
    state = parse_qs(urlparse(res.headers["location"]).query)["state"][0]
    nonce = client.cookies.get(STATE_COOKIE_NAME)

    res = await _callback(client, state)
    assert "/login" not in res.headers["location"]

    # Replay the same state with the same nonce: the cookie was consumed.
    client.cookies.set(STATE_COOKIE_NAME, nonce)
    res = await _callback(client, state)
    assert res.headers["location"].endswith("/login?error=invalid_state")


@pytest.mark.asyncio
async def test_existing_email_links_only_when_google_is_authoritative(client, maker, monkeypatch):
    # Non-authoritative domain: same-email account must NOT be linked.
    await _make_user(maker, "person@example.com")
    _stub_google(
        monkeypatch,
        {**GMAIL_CLAIMS, "sub": "g-2002", "email": "person@example.com", "email_verified": True},
    )
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert res.headers["location"].endswith("/login?error=account_exists")

    # Gmail address: Google is authoritative, the account links and signs in.
    existing = await _make_user(maker, "person@gmail.com")
    _stub_google(
        monkeypatch,
        {**GMAIL_CLAIMS, "sub": "g-2003", "email": "person@gmail.com", "email_verified": True},
    )
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert res.headers["location"] == "http://localhost:3000/dashboard"
    async with maker() as session:
        from sqlalchemy import select

        row = (await session.execute(select(User).where(User.id == existing.id))).scalar_one()
        assert row.google_sub == "g-2003"


@pytest.mark.asyncio
async def test_cross_user_object_access_is_404_everywhere(client, maker, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    user_a = await _make_user(maker, "a@example.com", sub="g-a")
    user_b = await _make_user(maker, "b@example.com", sub="g-b")

    # User A creates a resume and an interview session through the API.
    client.cookies.set(SESSION_COOKIE_NAME, _session_cookie(user_a))
    res = await client.post(
        "/api/v1/resumes",
        json={
            "file_name": "a.pdf",
            "raw_text": "User A resume text",
            "parsed_metadata": {},
            "sections": [{"section_type": "summary", "content": "A summary"}],
        },
    )
    assert res.status_code == 201, res.text
    resume_id = res.json()["id"]
    res = await client.post(
        "/api/v1/interviews/sessions", json={"target_role": "Engineer", "question_count": 3}
    )
    assert res.status_code == 201, res.text
    session_id = res.json()["session_id"]

    # User A sees both in scoped lists.
    assert len((await client.get("/api/v1/resumes")).json()) == 1
    assert len((await client.get("/api/v1/interviews/sessions")).json()) == 1

    # User B: lists are empty and every object-level route 404s.
    client.cookies.set(SESSION_COOKIE_NAME, _session_cookie(user_b))
    assert (await client.get("/api/v1/resumes")).json() == []
    assert (await client.get("/api/v1/interviews/sessions")).json() == []
    for method, path, body in [
        ("GET", f"/api/v1/resumes/{resume_id}", None),
        ("PUT", f"/api/v1/resumes/{resume_id}", {"file_name": "stolen"}),
        ("DELETE", f"/api/v1/resumes/{resume_id}", None),
        ("POST", f"/api/v1/resumes/{resume_id}/analyze", {"job_title": "T", "job_description": "x" * 40}),
        ("POST", "/api/v1/templates/generate", {"prompt": "improve", "resume_id": resume_id}),
        ("GET", f"/api/v1/interviews/sessions/{session_id}", None),
        ("POST", f"/api/v1/interviews/sessions/{session_id}/answer", {"answer": "mine"}),
        ("GET", f"/api/v1/interviews/sessions/{session_id}/report", None),
    ]:
        res = await client.request(method, path, json=body)
        assert res.status_code == 404, f"{method} {path} -> {res.status_code}: {res.text}"

    # User A's data is untouched.
    client.cookies.set(SESSION_COOKIE_NAME, _session_cookie(user_a))
    res = await client.get(f"/api/v1/resumes/{resume_id}")
    assert res.status_code == 200
    assert res.json()["file_name"] == "a.pdf"


@pytest.mark.asyncio
async def test_legacy_demo_data_stays_quarantined(client, maker, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    # Legacy demo account with data from before sign-in existed.
    local = await _make_user(maker, "local@placemind.app", is_local_only=True)
    async with maker() as session:
        legacy_resume = Resume(
            user_id=local.id, file_name="legacy.pdf", raw_text="legacy content"
        )
        session.add(legacy_resume)
        await session.commit()
        legacy_id = legacy_resume.id

    # A new user signs in with Google: the legacy data is NOT claimed.
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert "/onboarding" in res.headers["location"]

    assert (await client.get("/api/v1/resumes")).json() == []
    res = await client.get(f"/api/v1/resumes/{legacy_id}")
    assert res.status_code == 404

    # The legacy row still belongs to the demo account.
    async with maker() as session:
        from sqlalchemy import select

        row = (await session.execute(select(Resume).where(Resume.id == legacy_id))).scalar_one()
        assert row.user_id == local.id


@pytest.mark.asyncio
async def test_logout_clears_session(client, maker, monkeypatch):
    _stub_google(monkeypatch, GMAIL_CLAIMS)
    user = await _make_user(maker, "c@example.com", sub="g-c")
    client.cookies.set(SESSION_COOKIE_NAME, _session_cookie(user))
    assert (await client.get("/api/v1/auth/me")).status_code == 200

    res = await client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    set_cookie = res.headers.get("set-cookie", "")
    assert SESSION_COOKIE_NAME in set_cookie and "Max-Age=0" in set_cookie
    client.cookies.clear()
    assert (await client.get("/api/v1/auth/me")).status_code == 401
    guest_res = await client.post("/api/v1/auth/guest")
    assert guest_res.status_code == 200
    assert guest_res.json()["is_guest"] is True
    assert guest_res.json()["id"] != str(user.id)
    assert (await client.get("/api/v1/auth/me")).json()["is_guest"] is True


@pytest.mark.asyncio
async def test_guest_sessions_are_independent_persistent_and_http_only(client, maker, auth_settings):
    transport_a = ASGITransport(app=app, client=("198.51.100.21", 10021))
    transport_b = ASGITransport(app=app, client=("198.51.100.22", 10022))
    async with (
        AsyncClient(transport=transport_a, base_url="http://test") as guest_a,
        AsyncClient(transport=transport_b, base_url="http://test") as guest_b,
    ):
        response_a = await guest_a.post("/api/v1/auth/guest")
        response_b = await guest_b.post("/api/v1/auth/guest")

        assert response_a.status_code == response_b.status_code == 200
        identity_a = response_a.json()
        identity_b = response_b.json()
        assert identity_a["is_guest"] is True
        assert identity_a["email"] is None
        assert identity_a["id"] != identity_b["id"]
        assert "session_token" not in identity_a

        cookie = next(
            value for value in response_a.headers.get_list("set-cookie")
            if value.startswith(SESSION_COOKIE_NAME)
        )
        assert "HttpOnly" in cookie
        assert "SameSite=lax" in cookie
        assert f"Max-Age={settings.AUTH_SESSION_DAYS * 86400}" in cookie

        refreshed = await guest_a.get("/api/v1/auth/me")
        assert refreshed.status_code == 200
        assert refreshed.json()["id"] == identity_a["id"]


@pytest.mark.asyncio
async def test_guest_cookie_is_secure_when_configured(client, maker, auth_settings, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_COOKIE_SECURE", True)
    transport = ASGITransport(app=app, client=("198.51.100.23", 10023))
    async with AsyncClient(transport=transport, base_url="http://test") as guest:
        response = await guest.post("/api/v1/auth/guest")
    assert response.status_code == 200
    cookie = next(
        value for value in response.headers.get_list("set-cookie")
        if value.startswith(SESSION_COOKIE_NAME)
    )
    assert "Secure" in cookie
    assert "HttpOnly" in cookie


@pytest.mark.asyncio
async def test_expired_guest_session_is_replaced(client, auth_settings, monkeypatch):
    created = await client.post("/api/v1/auth/guest")
    assert created.status_code == 200
    old_guest_id = created.json()["id"]

    session_days = settings.AUTH_SESSION_DAYS
    monkeypatch.setattr(settings, "AUTH_SESSION_DAYS", -1)
    expired_token, _ = create_session_token(old_guest_id)
    monkeypatch.setattr(settings, "AUTH_SESSION_DAYS", session_days)
    client.cookies.set(SESSION_COOKIE_NAME, expired_token)

    assert (await client.get("/api/v1/auth/me")).status_code == 401
    replacement = await client.post("/api/v1/auth/guest")
    assert replacement.status_code == 200
    assert replacement.json()["is_guest"] is True
    assert replacement.json()["id"] != old_guest_id


@pytest.mark.asyncio
async def test_guest_data_is_isolated_from_other_guests_and_registered_users(client, maker, auth_settings):
    transport_a = ASGITransport(app=app, client=("198.51.100.24", 10024))
    transport_b = ASGITransport(app=app, client=("198.51.100.25", 10025))
    async with (
        AsyncClient(transport=transport_a, base_url="http://test") as guest_a,
        AsyncClient(transport=transport_b, base_url="http://test") as guest_b,
    ):
        identity_a = (await guest_a.post("/api/v1/auth/guest")).json()
        identity_b = (await guest_b.post("/api/v1/auth/guest")).json()
        assert identity_a["id"] != identity_b["id"]

        resume_a = await guest_a.post(
            "/api/v1/resumes",
            json={
                "file_name": "guest-a.pdf",
                "raw_text": "Guest A resume text",
                "parsed_metadata": {},
                "sections": [{"section_type": "summary", "content": "Guest A summary"}],
            },
        )
        assert resume_a.status_code == 201, resume_a.text
        resume_a_id = resume_a.json()["id"]

        resume_b = await guest_b.post(
            "/api/v1/resumes",
            json={
                "file_name": "guest-b.pdf",
                "raw_text": "Guest B resume text",
                "parsed_metadata": {},
                "sections": [{"section_type": "summary", "content": "Guest B summary"}],
            },
        )
        assert resume_b.status_code == 201, resume_b.text
        resume_b_id = resume_b.json()["id"]

        assert (await guest_a.get("/api/v1/resumes")).json()[0]["id"] == resume_a_id
        assert (await guest_b.get("/api/v1/resumes")).json()[0]["id"] == resume_b_id
        assert (await guest_a.get(f"/api/v1/resumes/{resume_b_id}")).status_code == 404
        assert (await guest_b.get(f"/api/v1/resumes/{resume_a_id}")).status_code == 404

        interview_a = await guest_a.post(
            "/api/v1/interviews/sessions",
            json={"target_role": "Engineer", "question_count": 3},
        )
        assert interview_a.status_code == 201, interview_a.text
        interview_id = interview_a.json()["session_id"]
        assert (
            await guest_b.get(f"/api/v1/interviews/sessions/{interview_id}")
        ).status_code == 404

        registered = await _make_user(maker, "registered-isolation@example.com", sub="g-isolation")
        guest_b.cookies.set(SESSION_COOKIE_NAME, _session_cookie(registered))
        assert (await guest_b.get(f"/api/v1/resumes/{resume_a_id}")).status_code == 404
        assert (await guest_b.get(f"/api/v1/resumes/{resume_b_id}")).status_code == 404
        assert (
            await guest_b.get(f"/api/v1/interviews/sessions/{interview_id}")
        ).status_code == 404


@pytest.mark.asyncio
async def test_guest_creation_is_rate_limited_per_ip(client, maker, auth_settings, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_GUEST_CREATION_PER_IP", 1)
    transport = lambda: ASGITransport(app=app, client=("198.51.100.26", 10026))
    async with (
        AsyncClient(transport=transport(), base_url="http://test") as first,
        AsyncClient(transport=transport(), base_url="http://test") as second,
    ):
        assert (await first.post("/api/v1/auth/guest")).status_code == 200
        limited = await second.post("/api/v1/auth/guest")
        assert limited.status_code == 429
        assert int(limited.headers["retry-after"]) > 0


@pytest.mark.asyncio
async def test_guest_data_operations_are_rate_limited_per_user(client, maker, auth_settings, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_GUEST_OPERATIONS_PER_USER", 1)
    transport = ASGITransport(app=app, client=("198.51.100.27", 10027))
    async with AsyncClient(transport=transport, base_url="http://test") as guest:
        created = await guest.post("/api/v1/auth/guest")
        assert created.status_code == 200
        assert (await guest.get("/api/v1/resumes")).status_code == 200
        limited = await guest.get("/api/v1/resumes")
        assert limited.status_code == 429


@pytest.mark.asyncio
async def test_guest_creation_fails_closed_without_session_signing_key(client, maker, auth_settings, monkeypatch):
    monkeypatch.setattr(settings, "AUTH_SECRET_KEY", "")
    transport = ASGITransport(app=app, client=("198.51.100.28", 10028))
    async with AsyncClient(transport=transport, base_url="http://test") as guest:
        response = await guest.post("/api/v1/auth/guest")
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_tampered_or_unknown_session_is_401(client, maker):
    client.cookies.set(SESSION_COOKIE_NAME, "not-a-real-token")
    assert (await client.get("/api/v1/auth/me")).status_code == 401

    # Well-formed token for a user id that does not exist.
    token, _ = create_session_token(str(uuid.uuid4()))
    client.cookies.set(SESSION_COOKIE_NAME, token)
    assert (await client.get("/api/v1/auth/me")).status_code == 401


@pytest.mark.asyncio
async def test_local_demo_identity_is_never_linked(client, maker, monkeypatch):
    """Even when Google is authoritative for the email, a quarantined
    is_local_only demo identity must not be claimed by a sign-in."""
    local = await _make_user(maker, "owner@gmail.com", is_local_only=True)
    _stub_google(
        monkeypatch,
        {**GMAIL_CLAIMS, "sub": "g-3001", "email": "owner@gmail.com", "email_verified": True},
    )
    state, _ = await _login(client)
    res = await _callback(client, state)
    assert res.headers["location"].endswith("/login?error=account_exists")
    async with maker() as session:
        from sqlalchemy import select

        row = (await session.execute(select(User).where(User.id == local.id))).scalar_one()
        assert row.google_sub is None


@pytest.mark.asyncio
async def test_mutating_requests_reject_foreign_origin(client, maker):
    user = await _make_user(maker, "origin@example.com", sub="g-origin")
    client.cookies.set(SESSION_COOKIE_NAME, _session_cookie(user))

    # A cross-site browser request presents an Origin and is refused.
    res = await client.post(
        "/api/v1/chat",
        json={"message": "hi", "page": {"path": "/dashboard"}},
        headers={"Origin": "https://evil.example"},
    )
    assert res.status_code == 403

    # The configured frontend origin passes the guard.
    res = await client.post(
        "/api/v1/chat",
        json={"message": "hi", "page": {"path": "/dashboard"}},
        headers={"Origin": "http://localhost:3005"},
    )
    assert res.status_code != 403


def test_production_config_fails_closed_on_insecure_cookie(monkeypatch):
    from app.core.config import Settings

    monkeypatch.setenv("GEMINI_API_KEY", "g")
    monkeypatch.setenv("AUTH_SECRET_KEY", "k" * 40)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "secret")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "false")
    with pytest.raises(Exception):
        Settings()

    monkeypatch.setenv("AUTH_COOKIE_SECURE", "true")
    assert Settings().AUTH_COOKIE_SECURE is True
