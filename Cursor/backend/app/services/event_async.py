"""B-011: in-process async event queue + compensation audit on worker failure."""

from __future__ import annotations

import queue
import threading
import uuid
from typing import Any

from flask import Flask

_q: queue.Queue[dict[str, Any]] | None = None
_worker_lock = threading.Lock()


def init_event_worker(app: Flask) -> None:
    global _q
    with _worker_lock:
        if _q is not None:
            return
        _q = queue.Queue()

        def _loop() -> None:
            while True:
                job = _q.get()
                if job is None:
                    _q.task_done()
                    continue
                jid = job.get("job_id")
                try:
                    with app.app_context():
                        from app.services.event_dispatcher import execute_event_dispatch

                        execute_event_dispatch(
                            job["event_type"],
                            job["payload"],
                            trace_id=job.get("trace_id"),
                            user_id=job.get("user_id"),
                            session_id=job.get("session_id"),
                        )
                except Exception as ex:  # noqa: BLE001
                    with app.app_context():
                        from app.services.audit_log_service import write_audit

                        write_audit(
                            module="event_async",
                            action="compensation_needed",
                            error_code="E5001",
                            trace_id=job.get("trace_id"),
                            details={"job_id": jid, "error": str(ex)},
                        )
                finally:
                    _q.task_done()

        threading.Thread(target=_loop, daemon=True, name="event-async-worker").start()


def enqueue_event_dispatch(
    *,
    event_type: str,
    payload: dict[str, Any],
    trace_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> str:
    if _q is None:
        raise RuntimeError("event async worker not initialized")
    jid = str(uuid.uuid4())
    _q.put(
        {
            "job_id": jid,
            "event_type": event_type,
            "payload": payload,
            "trace_id": trace_id,
            "user_id": user_id,
            "session_id": session_id,
        }
    )
    return jid
