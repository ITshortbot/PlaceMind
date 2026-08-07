import logging
import sys

logger = logging.getLogger("placemind")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(filename)s:%(lineno)d] - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
