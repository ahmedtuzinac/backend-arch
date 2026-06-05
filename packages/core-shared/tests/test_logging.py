import structlog

from core_shared.logging import setup_logging


def test_setup_logging_configures_structlog():
    setup_logging(log_level="DEBUG")
    logger = structlog.get_logger()
    assert logger is not None


def test_setup_logging_returns_logger():
    logger = setup_logging(log_level="INFO")
    assert logger is not None
