# ============================================================================
# File: backend/tests/conftest.py
# Description: Shared fixtures. Every API test runs signed in as a stable stub
#   account via a FastAPI dependency override of get_current_user - the
#   standard override mechanism, with no auth backdoor in application code.
#   Auth-flow tests in test_auth_api.py remove this override to exercise the
#   real cookie/session path.
# ============================================================================

import uuid

import pytest

from app.core.auth import get_current_user
from app.database.models import User
from app.main import app


@pytest.fixture(autouse=True)
def authenticated_test_user():
    """Install a signed-in stub account for the duration of each test.

    The same instance is returned for the whole test, so objects created
    through the API belong to the same id the ownership checks compare
    against. Yields the user so a test can assert on its id.
    """
    user = User(
        id=uuid.uuid4(),
        email="tester@example.com",
        full_name="Test User",
        google_sub="test-google-sub",
        is_local_only=False,
    )
    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture(autouse=True)
def no_live_ai_key(monkeypatch):
    """Unit tests must never reach a live provider, even if the host .env has a key."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    yield
