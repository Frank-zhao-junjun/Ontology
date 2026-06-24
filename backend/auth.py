from __future__ import annotations

import hashlib
from functools import wraps
from typing import Any, Callable

from flask import g, request

from .api_response import error_response, resolve_trace_id


ROLE_PERMISSIONS: dict[str, dict[str, Any]] = {
    "admin": {
        "entities": {"*": {"read", "write"}},
        "ai": {"QUERY", "WRITE", "NAVIGATE", "ANALYZE"},
        "meta_admin": True,
    },
    "operator": {
        "entities": {
            "contract": {"read", "write"},
            "customer": {"read", "write"},
            "product": {"read", "write"},
            "invoice": {"read", "write"},
            "employee": {"read"},
        },
        "ai": {"QUERY", "WRITE", "NAVIGATE", "ANALYZE"},
        "meta_admin": False,

    },
    "analyst": {
        "entities": {
            "contract": {"read"},
            "customer": {"read"},
            "product": {"read"},
            "invoice": {"read"},
            "employee": {"read"},
        },
        "ai": {"QUERY", "NAVIGATE", "ANALYZE"},
        "meta_admin": False,
    },
    "viewer": {
        "entities": {
            "contract": {"read"},
            "customer": {"read"},
            "product": {"read"},
            "invoice": {"read"},
        },
        "ai": {"QUERY", "NAVIGATE"},
        "meta_admin": False,

    },
}


DEFAULT_USERS = [
    {"username": "admin", "password": "admin123", "role": "admin", "full_name": "System Admin"},
    {"username": "operator", "password": "operator123", "role": "operator", "full_name": "Business Operator"},
    {"username": "analyst", "password": "analyst123", "role": "analyst", "full_name": "Business Analyst"},
    {"username": "viewer", "password": "viewer123", "role": "viewer", "full_name": "Read Only User"},
]


def hash_password(password: str) -> str:
    from werkzeug.security import generate_password_hash
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    from werkzeug.security import check_password_hash
    return check_password_hash(password_hash, password)


def token_for(username: str, role: str) -> str:
    import secrets
    import hashlib
    raw = f"ontology::{username}::{role}::{secrets.token_hex(16)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def seed_default_users() -> None:
    import os
    from .extensions import db
    from .models import UserAccount

    env = os.environ.get('FLASK_ENV', 'development')
    if env != 'development':
        return  # 默认密码仅限开发环境

    for item in DEFAULT_USERS:
        existing = UserAccount.query.filter_by(username=item["username"]).first()
        if existing is not None:
            continue
        db.session.add(
            UserAccount(
                username=item["username"],
                password_hash=hash_password(item["password"]),
                role=item["role"],
                token=token_for(item["username"], item["role"]),
                full_name=item["full_name"],
                is_active=True,
            )
        )
    db.session.commit()


def _payload_for_trace() -> dict[str, Any]:
    return request.get_json(silent=True) or {}


def get_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    token = request.headers.get("X-Auth-Token")
    return token.strip() if token else None


def get_current_user():
    from .models import UserAccount

    token = get_bearer_token()
    if not token:
        return None
    return UserAccount.query.filter_by(token=token, is_active=True).first()


def permission_denied(trace_id: str, message: str = "permission denied"):
    return error_response(code="P4031", message=message, status=403, trace_id=trace_id)


def authentication_required(trace_id: str):
    return error_response(code="U4011", message="authentication required", status=401, trace_id=trace_id)


def require_auth(roles: set[str] | None = None):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            trace_id = resolve_trace_id(_payload_for_trace())
            user = get_current_user()
            if user is None:
                return authentication_required(trace_id)
            if roles and user.role not in roles:
                return permission_denied(trace_id)
            g.current_user = user
            g.trace_id = trace_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def permissions_for_role(role: str) -> dict[str, Any]:
    return ROLE_PERMISSIONS.get(role, {})


def ensure_entity_permission(user, entity_type: str, action: str, trace_id: str):
    permissions = permissions_for_role(user.role).get("entities", {})
    wildcard = permissions.get("*", set())
    entity_permissions = permissions.get(entity_type, set())
    if action in wildcard or action in entity_permissions:
        return None
    return permission_denied(trace_id, f"permission denied for {entity_type}:{action}")


def ensure_ai_permission(user, intent_type: str, trace_id: str):
    allowed = permissions_for_role(user.role).get("ai", set())
    if intent_type in allowed:
        return None
    return permission_denied(trace_id, f"permission denied for AI intent {intent_type}")


def ensure_meta_admin(user, trace_id: str):
    if permissions_for_role(user.role).get("meta_admin"):
        return None
    return permission_denied(trace_id, "meta-model admin permission required")

