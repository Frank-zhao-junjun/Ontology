from __future__ import annotations

import uuid

from flask import Flask, g, request
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        expose_headers=["X-Trace-Id"],
        allow_headers=["Content-Type", "Authorization", "X-Trace-Id", "X-LLM-Available"],
    )

    db.init_app(app)

    @app.before_request
    def _trace():
        tid = request.headers.get("X-Trace-Id") or str(uuid.uuid4())
        g.trace_id = tid
        request.trace_id = tid  # type: ignore[attr-defined]

    @app.after_request
    def _add_trace(resp):
        resp.headers["X-Trace-Id"] = getattr(g, "trace_id", "")
        return resp

    from app.api.auth import bp as auth_bp
    from app.api.auth import seed_default_users
    from app.api.chat import bp as chat_bp
    from app.api.domain import bp as domain_bp
    from app.api.health import bp as health_bp
    from app.api.meta_models import bp as meta_bp
    from app.api.runtime_admin import bp as runtime_bp
    from app.http_auth import register_auth
    from app.models.user import User  # noqa: F401

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(meta_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(domain_bp)
    app.register_blueprint(runtime_bp)

    register_auth(app)

    from app.services.event_async import init_event_worker

    init_event_worker(app)

    with app.app_context():
        db.create_all()
        seed_default_users(app)

    return app
