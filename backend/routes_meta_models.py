from flask import Blueprint, jsonify, request

from .api_response import error_response, resolve_trace_id
from .auth import ensure_meta_admin, require_auth
from .extensions import db
from .meta_model_service import MetaModelValidator, PublishService, SnapshotProvider
from .models import MetaModelDefinition


bp_meta = Blueprint("meta_models", __name__, url_prefix="/api/meta-models")

validator = MetaModelValidator()
snapshots = SnapshotProvider()
publisher = PublishService(validator, snapshots)


@bp_meta.post("/definitions")
@require_auth()
def create_definition():
    from flask import g

    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_meta_admin(g.current_user, trace_id)
    if denied:
        return denied
    model_type = payload.get("model_type")
    name = payload.get("name")
    version = payload.get("version")
    content = payload.get("content")

    check = validator.validate_structure(model_type, content)
    if not check.is_valid:
        response, status = error_response(
            code="M4001",
            message="model validation failed",
            status=400,
            trace_id=trace_id,
            details={"is_valid": False, "errors": check.errors, "warnings": check.warnings},
        )
        payload = response.get_json()
        payload["is_valid"] = False
        payload["errors"] = check.errors
        payload["warnings"] = check.warnings
        return jsonify(payload), status

    model = MetaModelDefinition(
        model_type=model_type,
        name=name,
        version=version,
        content_json=content,
        status="draft",
    )
    db.session.add(model)
    db.session.commit()
    return jsonify({"id": model.id, "status": model.status}), 201


@bp_meta.post("/validate")
@require_auth()
def validate_model():
    from flask import g

    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_meta_admin(g.current_user, trace_id)
    if denied:
        return denied
    check = validator.validate_structure(payload.get("model_type"), payload.get("content"))
    if check.is_valid:
        return jsonify({"is_valid": True, "errors": [], "warnings": check.warnings})
    response, status = error_response(
        code="M4001",
        message="model validation failed",
        status=400,
        trace_id=trace_id,
        details={"is_valid": False, "errors": check.errors, "warnings": check.warnings},
    )
    body = response.get_json()
    body["is_valid"] = False
    body["errors"] = check.errors
    body["warnings"] = check.warnings
    return jsonify(body), status


@bp_meta.post("/publish")
@require_auth()
def publish_models():
    from flask import g

    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_meta_admin(g.current_user, trace_id)
    if denied:
        return denied
    release_no = payload.get("release_no")
    model_ids = payload.get("model_ids") or []
    operator = payload.get("operator", "system")
    try:
        release = publisher.publish(release_no, model_ids, operator)
        return (
            jsonify(
                {
                    "release_id": release.id,
                    "status": release.status,
                    "snapshot_ref": release.release_no,
                }
            ),
            201,
        )
    except ValueError as exc:
        msg = str(exc)
        code = msg.split(":", 1)[0] if ":" in msg else "M4002"
        return error_response(code=code, message=msg, status=400, trace_id=trace_id)


@bp_meta.get("/snapshots/current")
@require_auth()
def current_snapshot():
    return jsonify(snapshots.get_current())


@bp_meta.post("/rollback")
@require_auth()
def rollback_release():
    from flask import g

    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_meta_admin(g.current_user, trace_id)
    if denied:
        return denied
    target_release_no = payload.get("target_release_no")
    operator = payload.get("operator", "system")
    try:
        release = publisher.rollback(target_release_no, operator)
        return jsonify({"new_release_id": release.id, "status": release.status, "snapshot_ref": release.release_no})
    except ValueError as exc:
        msg = str(exc)
        code = msg.split(":", 1)[0] if ":" in msg else "M4002"
        return error_response(code=code, message=msg, status=400, trace_id=trace_id)
