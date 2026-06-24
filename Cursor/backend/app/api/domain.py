"""Domain write path: validate_and_transition + entity catalog."""

from __future__ import annotations

import json

from flask import Blueprint, current_app, g, jsonify, request

from app.extensions import db
from app.models.user import User
from app.services.entity_catalog import list_entity_types_from_snapshot
from app.services.transition_service import validate_and_transition

bp = Blueprint("domain", __name__, url_prefix="/api/domain")


def _trace_id() -> str:
    return getattr(request, "trace_id", "no-trace")


def _entity_type_allowed_for_user(entity_type: str) -> bool:
    claims = getattr(g, "jwt_claims", None) or {}
    uid = claims.get("uid")
    if uid is None or uid == 0:
        return True
    u = db.session.get(User, uid)
    if not u or not u.allowed_entity_types_json:
        return True
    try:
        allowed = json.loads(u.allowed_entity_types_json)
    except json.JSONDecodeError:
        return True
    if not allowed:
        return True
    return entity_type in allowed


@bp.route("/entity-types", methods=["GET"])
def entity_types():
    types = list_entity_types_from_snapshot()
    return jsonify(
        {
            "entity_types": types,
            "trace_id": _trace_id(),
        }
    )


@bp.route("/validate-and-transition", methods=["POST"])
def vt():
    body = request.get_json(force=True, silent=True) or {}
    entity_type = body.get("entity_type") or ""

    if not _entity_type_allowed_for_user(entity_type):
        return (
            jsonify(
                {
                    "ok": False,
                    "error_code": "P4031",
                    "message": "entity type not allowed for this user",
                    "trace_id": _trace_id(),
                }
            ),
            403,
        )

    claims = getattr(g, "jwt_claims", None) or {}
    if current_app.config.get("AUTH_DISABLED"):
        operator = body.get("operator")
        user_id = body.get("user_id")
    else:
        operator = claims.get("sub")
        if body.get("operator") == "blocked":
            operator = "blocked"
        uid = claims.get("uid")
        user_id = str(uid) if uid is not None else body.get("user_id")

    out, status = validate_and_transition(
        entity_type=entity_type,
        entity_id=body.get("entity_id") or "",
        action=body.get("action"),
        payload=body.get("payload") or {},
        operator=operator,
        trace_id=_trace_id(),
        user_id=user_id,
        session_id=body.get("session_id"),
    )
    out["trace_id"] = _trace_id()
    return jsonify(out), status
