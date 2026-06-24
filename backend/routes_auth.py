from flask import Blueprint, jsonify, request

from .api_response import error_response, resolve_trace_id
from .auth import ROLE_PERMISSIONS, verify_password, require_auth
from .models import UserAccount


bp_auth = Blueprint("auth", __name__, url_prefix="/api/auth")


def serialize_permissions(permissions):
    entities = {
        entity_name: sorted(list(actions))
        for entity_name, actions in permissions.get("entities", {}).items()
    }
    return {
        "entities": entities,
        "ai": sorted(list(permissions.get("ai", set()))),
        "meta_admin": permissions.get("meta_admin", False),
    }


@bp_auth.post("/login")
def login():
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    username = payload.get("username", "")
    password = payload.get("password", "")
    user = UserAccount.query.filter_by(username=username, is_active=True).first()
    if user is None or not verify_password(password, user.password_hash):
        return error_response(code="U4012", message="invalid username or password", status=401, trace_id=trace_id)

    permissions = ROLE_PERMISSIONS.get(user.role, {})
    return jsonify(
        {
            "token": user.token,
            "user": {
                "username": user.username,
                "role": user.role,
                "full_name": user.full_name,
            },
            "permissions": serialize_permissions(permissions),
            "trace_id": trace_id,
        }
    )


@bp_auth.get("/me")
@require_auth()
def me():
    from flask import g

    permissions = ROLE_PERMISSIONS.get(g.current_user.role, {})
    return jsonify(
        {
            "user": {
                "username": g.current_user.username,
                "role": g.current_user.role,
                "full_name": g.current_user.full_name,
            },
            "permissions": serialize_permissions(permissions),
        }
    )