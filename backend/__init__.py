from flask import Flask

from .auth import seed_default_users
from .extensions import db
from .routes_auth import bp_auth
from .routes_chat import bp_chat
from .routes_contracts import bp_contracts
from .routes_domains import bp_domains
from .routes_entities import bp_entities
from .routes_epc import bp_epc
from .routes_export import bp_export
from .routes_meta_models import bp_meta
from .routes_versions import bp_versions


def create_app(testing: bool = False) -> Flask:
    app = Flask(__name__)
    if testing:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+pysqlite:///:memory:"
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+pysqlite:///ontology.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = testing
    app.config["AI_AVAILABLE"] = True

    db.init_app(app)
    with app.app_context():
        from . import models  # noqa: F401

        db.create_all()
        seed_default_users()

    app.register_blueprint(bp_auth)
    app.register_blueprint(bp_domains)
    app.register_blueprint(bp_entities)
    app.register_blueprint(bp_epc)
    app.register_blueprint(bp_chat)
    app.register_blueprint(bp_contracts)
    app.register_blueprint(bp_export)
    app.register_blueprint(bp_meta)
    app.register_blueprint(bp_versions)
    return app
