"""JWT gate + per-endpoint RBAC."""

from __future__ import annotations

from flask import Flask, g, jsonify, request

from app.services.auth_tokens import decode_access_token
from app.services.rbac import role_may

# Flask endpoint name → required permission (None = any authenticated user)
ENDPOINT_PERMISSION: dict[str, str | None] = {
    "auth.login": None,
    "auth.me": None,
    "health.health": None,
    "meta_models.validate": "meta:validate",
    "meta_models.create_definition": "meta:draft",
    "meta_models.publish": "meta:publish",
    "meta_models.current_snapshot": "meta:read",
    "meta_models.rollback": "meta:publish",
    "domain.vt": "domain:write",
    "domain.entity_types": "meta:read",
    "chat.execute": "chat:execute",
    "chat.retry": "chat:execute",
    "chat.session_context": "chat:execute",
    "runtime_admin.rules_refresh": "runtime:admin",
    "runtime_admin.events_dispatch_async": "runtime:admin",
}


def _public_path(path: str) -> bool:
    if path == "/health" or path.startswith("/health/"):
        return True
    if path == "/api/auth/login" or path.startswith("/api/auth/login"):
        return True
    return False


def _extract_bearer() -> str | None:
    h = request.headers.get("Authorization") or ""
    if h.lower().startswith("bearer "):
        return h[7:].strip() or None
    return None


def register_auth(app: Flask) -> None:
    @app.before_request
    def _auth_and_rbac() -> tuple | None:
        if app.config.get("AUTH_DISABLED"):
            g.jwt_claims = {
                "sub": "dev",
                "uid": 0,
                "role": "admin",
            }
            return None

        if request.method == "OPTIONS":
            return None

        if _public_path(request.path):
            g.jwt_claims = None
            return None

        if not request.path.startswith("/api/"):
            g.jwt_claims = None
            return None

        token = _extract_bearer()
        if not token:
            return (
                jsonify(
                    {
                        "ok": False,
                        "error_code": "A4011",
                        "message": "Authorization Bearer token required",
                        "trace_id": getattr(request, "trace_id", ""),
                    }
                ),
                401,
            )

        claims = decode_access_token(token)
        if not claims:
            return (
                jsonify(
                    {
                        "ok": False,
                        "error_code": "A4012",
                        "message": "invalid or expired token",
                        "trace_id": getattr(request, "trace_id", ""),
                    }
                ),
                401,
            )

        g.jwt_claims = {
            "sub": claims.get("sub"),
            "uid": claims.get("uid"),
            "role": claims.get("role") or "viewer",
        }

        ep = request.endpoint
        if ep not in ENDPOINT_PERMISSION:
            return (
                jsonify(
                    {
                        "ok": False,
                        "error_code": "P4031",
                        "message": "endpoint not registered for RBAC",
                        "trace_id": getattr(request, "trace_id", ""),
                    }
                ),
                403,
            )
        need = ENDPOINT_PERMISSION[ep]
        if need is None:
            return None
        role = g.jwt_claims["role"]
        if not role_may(str(role), need):
            return (
                jsonify(
                    {
                        "ok": False,
                        "error_code": "P4031",
                        "message": "insufficient role for this operation",
                        "trace_id": getattr(request, "trace_id", ""),
                    }
                ),
                403,
            )
        return None
