# ============================================================================
# File: backend/tests/test_db_init.py
# Description: Regression test - database initialization must create tables
#              on SQLite (and other non-PostgreSQL backends) instead of
#              silently skipping create_all when the Postgres-only
#              CREATE EXTENSION statement fails.
# ============================================================================

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.database.models import Base
from app.main import initialize_database


async def test_initialize_database_creates_tables_on_sqlite(tmp_path):
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
