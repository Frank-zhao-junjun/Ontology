"""AI-006: automatic retry (max 2 retries = 3 attempts) for retriable failures."""

from __future__ import annotations

from typing import Callable, TypeVar

T = TypeVar("T")


class NonRetriableError(Exception):
    """Permission/rules — no auto-retry."""


class RetriableError(Exception):
    """Fixable — auto-retry allowed."""


def run_with_self_healing(
    fn: Callable[[], T],
    *,
    max_retries: int = 2,
    retriable: type[Exception] | tuple[type[Exception], ...] = RetriableError,
) -> tuple[T | None, int, str | None]:
    """
    max_retries: number of retries after first failure (LLD: at most 2).
    Returns (result, last_attempt_index, error_code).
    """
    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            return fn(), attempt, None
        except NonRetriableError:
            raise
        except retriable as e:
            last_err = e
            if attempt == max_retries:
                return None, attempt + 1, "A5001"
        except Exception:
            return None, attempt, "A5001"
    return None, max_retries + 1, "A5001"
