"""
Structured-ish logging setup. In production, point this at a real
aggregator (CloudWatch, Datadog, etc.) instead of stdout.
"""
import logging
import sys


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        stream=sys.stdout,
    )
    # Keep noisy libraries quiet
    logging.getLogger("httpx").setLevel(logging.WARNING)
