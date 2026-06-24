"""Login and current user (JWT)."""

from __future__ import annotations

from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models.user import User
from app.services.auth_tokens import issue_access_token

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _trace_id() -> str:
    return getattr(request, "trace_id", "no-trace")


@bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(force=True, silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return (
            jsonify(
                {
                    "ok": False,
                    "error_code": "A4002",
                    "trace_id": _trace_id(),
                }
            ),
            400,
        )
    u = User.query.filter_by(username=username).first()
    if not u or not check_password_hash(u.password_hash, password):
        return (
            jsonify(
                {
                    "ok": False,
                    "error_code": "A4013",
                    "message": "invalid username or password",
                    "trace_id": _trace_id(),
                }
            ),
            401,
        )
    token = issue_access_token(user_id=u.id, username=u.username, role=u.role)
    return jsonify(
        {
            "ok": True,
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": 86400,
            "user": {
                "id": u.id,
                "username": u.username,
                "role": u.role,
            },
            "trace_id": _trace_id(),
        }
    )


@bp.route("/me", methods=["GET"])
def me():
    if current_app.config.get("AUTH_DISABLED"):
        return jsonify(
            {
                "ok": True,
                "user": {"id": 0, "username": "dev", "role": "admin"},
                "trace_id": _trace_id(),
            }
        )
    claims = getattr(g, "jwt_claims", None) or {}
    uid = claims.get("uid")
    u = db.session.get(User, uid) if uid else None
    if not u:
        return jsonify({"ok": False, "error_code": "A4014", "trace_id": _trace_id()}), 404
    return jsonify(
        {
            "ok": True,
            "user": {
                "id": u.id,
                "username": u.username,
                "role": u.role,
            },
            "trace_id": _trace_id(),
        }
    )


def seed_default_users(app) -> None:
    """Idempotent dev users; passwords documented in README."""
    with app.app_context():
        if User.query.count() > 0:
            return
        users = [
            ("admin", "Admin!dev1", "admin"),
            ("modeler", "Modeler!dev1", "modeler"),
            ("operator", "Operator!dev1", "operator"),
            ("viewer", "Viewer!dev1", "viewer"),
        ]
        for uname, pw, role in users:
            db.session.add(
                User(
                    username=uname,
                    password_hash=generate_password_hash(pw),
                    role=role,
                )
            )
        db.session.commit()
