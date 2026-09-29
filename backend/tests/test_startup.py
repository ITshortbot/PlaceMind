import logging

import pytest

from app.main import initialize_database


class UnavailableDatabase:
    def begin(self):
        raise ConnectionError("database unavailable")


@pytest.mark.asyncio
async def test_database_initialization_failure_does_not_abort_startup(caplog):
    with caplog.at_level(logging.WARNING, logger="placemind.main"):
        await initialize_database(UnavailableDatabase(), metadata=None)

    assert "continuing without database features" in caplog.text