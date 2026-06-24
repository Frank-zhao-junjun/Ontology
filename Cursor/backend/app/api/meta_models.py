from __future__ import annotations

import json
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.meta import MetaModelDefinition
from app.services.publish import build_current_snapshot, publish_release, rollback_to
from app.services.validator import validate_structure

bp = Blueprint("meta_models", __name__, url_prefix="/api/meta-models")


def _trace_id() -> str:
    return getattr(request, "trace_id", "no-trace")


@bp.route("/validate", methods=["POST"])
def validate():
    body = request.get_json(force=True, silent=True) or {}
    model_type = body.get("model_type")
    content = body.get("content")
    ok, errors, warnings = validate_structure(model_type or "", content)
    return jsonify(
        {
            "is_valid": ok,
            "errors": errors,
            "warnings": warnings,
            "trace_id": _trace_id(),
        }
    )


@bp.route("/definitions", methods=["POST"])
def create_definition():
    """MVP admin: create draft model definition (not in LLD minimal list; needed for integration)."""
    body = request.get_json(force=True, silent=True) or {}
    model_type = body.get("model_type")
    name = body.get("name")
    version = body.get("version", "1.0.0")
    content = body.get("content")
    if not all([model_type, name, content is not None]):
        return jsonify(
            {"ok": False, "error_code": "M4001", "trace_id": _trace_id()}
        ), 400
    ok, errors, _ = validate_structure(model_type, content)
    if not ok:
        return jsonify(
            {
                "is_valid": False,
                "errors": errors,
                "error_code": "M4001",
                "trace_id": _trace_id(),
            }
        ), 400
    d = MetaModelDefinition(
        model_type=model_type,
        name=name,
        version=version,
        content_json=json.dumps(content) if isinstance(content, dict) else str(content),
        status="draft",
    )
    db.session.add(d)
    db.session.commit()
    return jsonify(
        {
            "id": d.id,
            "status": d.status,
            "trace_id": _trace_id(),
        }
    ), 201


@bp.route("/publish", methods=["POST"])
def publish():
    body = request.get_json(force=True, silent=True) or {}
    release_no = body.get("release_no")
    model_ids = body.get("model_ids") or []
    operator = body.get("operator")
    out, status = publish_release(release_no, model_ids, operator=operator)
    out["trace_id"] = _trace_id()
    return jsonify(out), status


@bp.route("/snapshots/current", methods=["GET"])
def current_snapshot():
    snap = build_current_snapshot()
    if not snap:
        return jsonify(
            {
                "release_no": None,
                "models": [],
                "checksum": None,
                "trace_id": _trace_id(),
            }
        )
    return jsonify(
        {
            "release_no": snap.get("release_no"),
            "models": snap.get("models"),
            "checksum": snap.get("checksum"),
            "trace_id": _trace_id(),
        }
    )


@bp.route("/rollback", methods=["POST"])
def rollback():
    body = request.get_json(force=True, silent=True) or {}
    target = body.get("target_release_no")
    operator = body.get("operator")
    out, status = rollback_to(target, operator=operator)
    out["trace_id"] = _trace_id()
    return jsonify(out), status
