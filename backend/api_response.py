from __future__ import annotations

import uuid
from typing import Any

from flask import jsonify, request


def resolve_trace_id(payload: dict[str, Any] | None = None) -> str:
    payload = payload or {}
    return payload.get("trace_id") or request.headers.get("X-Trace-Id") or str(uuid.uuid4())


def error_response(
    *,
    code: str,
    message: str,
    status: int,
    trace_id: str,
    details: dict[str, Any] | None = None,
):
    body = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
        "error_code": code,
        "message": message,
        "trace_id": trace_id,
    }
    if details:
        body["details"] = details
    return jsonify(body), status
