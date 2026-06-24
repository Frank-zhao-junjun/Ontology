"""B-008: process-local event dispatch, E4041 / E5001."""

from __future__ import annotations

import json
import uuid
from typing import Any, Callable

from app.extensions import db
from app.models.runtime import EventDispatchLog, EventSubscriptionRegistry
from app.services.audit_log_service import write_audit

SKILL_HANDLERS: dict[str, Callable[..., tuple[bool, str | None]]] = {}


def register_skill_handler(name: str, fn: Callable[..., tuple[bool, str | None]]) -> None:
    SKILL_HANDLERS[name] = fn


def execute_event_dispatch(
    event_type: str,
    payload: dict[str, Any],
    *,
    trace_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> list[dict[str, Any]]:
    """Synchronous dispatch (used by async worker too)."""
    subs = EventSubscriptionRegistry.query.filter_by(
        event_type=event_type, is_active=True
    ).all()
    results: list[dict[str, Any]] = []
    event_id = str(uuid.uuid4())

    for sub in subs:
        ref = sub.target_ref
        fn = SKILL_HANDLERS.get(ref)
        if fn is None:
            err = "E4041"
            db.session.add(
                EventDispatchLog(
                    event_id=event_id,
                    event_type=event_type,
                    target_ref=ref,
                    result="fail",
                    error_code=err,
                    details_json=json.dumps({"reason": "skill not registered"}),
                    trace_id=trace_id,
                )
            )
            write_audit(
                module="event",
                action="dispatch",
                error_code=err,
                trace_id=trace_id,
                user_id=user_id,
                session_id=session_id,
                details={"target_ref": ref, "event_type": event_type},
            )
            results.append({"target_ref": ref, "ok": False, "error_code": err})
            continue
        try:
            ok, msg = fn(payload)
            if ok:
                db.session.add(
                    EventDispatchLog(
                        event_id=event_id,
                        event_type=event_type,
                        target_ref=ref,
                        result="ok",
                        error_code=None,
                        details_json=None,
                        trace_id=trace_id,
                    )
                )
                results.append({"target_ref": ref, "ok": True})
            else:
                err = "E5001"
                db.session.add(
                    EventDispatchLog(
                        event_id=event_id,
                        event_type=event_type,
                        target_ref=ref,
                        result="fail",
                        error_code=err,
                        details_json=json.dumps({"message": msg}),
                        trace_id=trace_id,
                    )
                )
                write_audit(
                    module="event",
                    action="dispatch",
                    error_code=err,
                    trace_id=trace_id,
                    user_id=user_id,
                    session_id=session_id,
                    details={"target_ref": ref, "message": msg},
                )
                results.append({"target_ref": ref, "ok": False, "error_code": err})
        except Exception as ex:  # noqa: BLE001
            err = "E5001"
            db.session.add(
                EventDispatchLog(
                    event_id=event_id,
                    event_type=event_type,
                    target_ref=ref,
                    result="fail",
                    error_code=err,
                    details_json=json.dumps({"exception": str(ex)}),
                    trace_id=trace_id,
                )
            )
            results.append({"target_ref": ref, "ok": False, "error_code": err})

    db.session.commit()
    return results


def dispatch_event(
    event_type: str,
    payload: dict[str, Any],
    *,
    trace_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> list[dict[str, Any]]:
    """Alias: synchronous dispatch."""
    return execute_event_dispatch(
        event_type,
        payload,
        trace_id=trace_id,
        user_id=user_id,
        session_id=session_id,
    )


def _default_echo_skill(payload: dict[str, Any]) -> tuple[bool, str | None]:
    return True, None


register_skill_handler("echo_skill", _default_echo_skill)
