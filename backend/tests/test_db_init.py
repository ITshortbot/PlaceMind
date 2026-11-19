# ============================================================================
# File: backend/tests/test_db_init.py
# Description: Database initialization regression tests.
# ============================================================================

import pytest

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.database.models import Base
from app.main import initialize_database


async def test_initialize_database_creates_tables_on_sqlite(tmp_path, monkeypatch):
    # This test uses the same explicit PostgreSQL-type compiler shims as the
    # API fixtures, without depending on other test modules being collected.
    from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
    monkeypatch.setattr(SQLiteTypeCompiler, "visit_JSONB", lambda self, type_, **kw: "JSON", raising=False)
    monkeypatch.setattr(SQLiteTypeCompiler, "visit_vector", lambda self, type_, **kw: "BLOB", raising=False)
    db_file = tmp_path / "init.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    try:
        await initialize_database(engine, Base.metadata)
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            )
            tables = {row[0] for row in result}
        assert "interview_sessions" in tables
        assert "interview_turns" in tables
    finally:
        await engine.dispose()


async def test_postgres_initialization_is_serialized_and_validates_users():
    """DDL is serialized, and the schema is checked after create_all."""
    calls = []

    class Result:
        def mappings(self):
            return self

        def one(self):
            return {
                "id_ready": True,
                "email_ready": True,
                "google_sub_ready": True,
                "full_name_ready": True,
                "avatar_url_ready": True,
                "is_local_only_ready": True,
                "created_at_ready": True,
                "updated_at_ready": True,
                "is_guest_ready": True,
                "guest_email_check_ready": True,
                "google_sub_unique_ready": True,
                "email_unique_ready": True,
            }

    class Connection:
        async def execute(self, statement):
            sql = str(statement)
            if "AS email_ready" in sql:
                assert "create_all" in calls
                return Result()
            calls.append(sql)

        async def run_sync(self, callback):
            callback(None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

    class URL:
        def get_backend_name(self):
            return "postgresql"

    class Engine:
        url = URL()

        def begin(self):
            return Connection()

    class Metadata:
        def create_all(self, connection):
            calls.append("create_all")

    await initialize_database(Engine(), Metadata())
    assert calls[0] == "SELECT pg_advisory_xact_lock(1347179085, 1)"
    assert calls[1] == "CREATE EXTENSION IF NOT EXISTS vector"
    assert calls[2] == "create_all"
    assert sum(sql.startswith("ALTER TABLE users") for sql in calls) == 2
    assert any(sql.startswith("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub") for sql in calls)


@pytest.mark.asyncio
async def test_postgres_initialization_fails_when_guest_migration_is_missing():
    class Result:
        def mappings(self):
            return self

        def one(self):
            return {
                "id_ready": True,
                "email_ready": False,
                "google_sub_ready": True,
                "full_name_ready": True,
                "avatar_url_ready": True,
                "is_local_only_ready": True,
                "created_at_ready": True,
                "updated_at_ready": True,
                "is_guest_ready": False,
                "guest_email_check_ready": False,
                "google_sub_unique_ready": True,
                "email_unique_ready": True,
            }

    class Connection:
        async def execute(self, statement):
            if "AS email_ready" in str(statement):
                return Result()

        async def run_sync(self, callback):
            callback(None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

    class URL:
        def get_backend_name(self):
            return "postgresql"

    class Engine:
        url = URL()

        def begin(self):
            return Connection()

    class Metadata:
        def create_all(self, connection):
            pass

    with pytest.raises(RuntimeError, match="validate required users schema") as exc:
        await initialize_database(Engine(), Metadata())

    assert "is_guest_ready" in str(exc.value.__cause__)
