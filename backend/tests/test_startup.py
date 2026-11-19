import logging

import pytest

from app.main import initialize_database


class UnavailableDatabase:
    def begin(self):
        raise ConnectionError("database unavailable")


@pytest.mark.asyncio
async def test_database_initialization_failure_aborts_startup_and_logs_operation(caplog):
    with caplog.at_level(logging.ERROR, logger="placemind.main"):
        with pytest.raises(RuntimeError, match="open initialization transaction") as exc:
            await initialize_database(UnavailableDatabase(), metadata=None)

    assert isinstance(exc.value.__cause__, ConnectionError)
    assert "Database initialization failed during open initialization transaction" in caplog.text
    assert "database unavailable" in caplog.text