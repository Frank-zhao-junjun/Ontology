import os
import tempfile


def _test_sqlite_uri() -> str:
    path = os.path.join(tempfile.gettempdir(), "ontology_backend_test.sqlite")
    return f"sqlite:///{path.replace(chr(92), '/')}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-in-prod")
    JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "24"))
    # When True, all API routes behave as admin without Bearer (for automated tests).
    AUTH_DISABLED = os.environ.get("AUTH_DISABLED", "").lower() in ("1", "true", "yes")
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///:memory:",
    )


class TestConfig(Config):
    TESTING = True
    AUTH_DISABLED = True
    # File-based SQLite so background event worker thread shares the same DB as tests.
    SQLALCHEMY_DATABASE_URI = _test_sqlite_uri()
