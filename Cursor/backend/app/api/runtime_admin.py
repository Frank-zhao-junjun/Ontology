"""Runtime admin: B-010 rule refresh, B-011 async dispatch."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.services.event_async import enqueue_event_dispatch
from app.services.rule_hot_reload import hot_reload_rules_from_current_snapshot

bp = Blueprint("runtime_admin", __name__, url_prefix="/api/runtime")


def _trace_id() -> str:
    return getattr(request, "trace_id", "no-trace")


@bp.route("/rules/refresh", methods=["POST"])
def rules_refresh():
    out = hot_reload_rules_from_current_snapshot()
    out["trace_id"] = _trace_id()
    status = 200 if out.get("ok") else 500
    return jsonify(out), status


@bp.route("/events/dispatch-async", methods=["POST"])
def events_dispatch_async():
    body = request.get_json(force=True, silent=True) or {}
    et = body.get("event_type")
    payload = body.get("payload") or {}
    if not et:
        return jsonify({"ok": False, "error_code": "M4001", "trace_id": _trace_id()}), 400
    jid = enqueue_event_dispatch(
        event_type=et,
        payload=payload,
        trace_id=_trace_id(),
        user_id=body.get("user_id"),
        session_id=body.get("session_id"),
    )
    return jsonify({"job_id": jid, "trace_id": _trace_id()}), 202
