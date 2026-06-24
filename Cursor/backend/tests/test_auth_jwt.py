"""JWT + RBAC when AUTH_DISABLED is False."""

import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db


class AuthOnConfig(TestConfig):
    AUTH_DISABLED = False


@pytest.fixture
def app_auth():
    application = create_app(AuthOnConfig)
    with application.app_context():
        db.create_all()
        from app.api.auth import seed_default_users

        seed_default_users(application)
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client_auth(app_auth):
    return app_auth.test_client()


def test_login_returns_token(client_auth):
    r = client_auth.post(
        "/api/auth/login",
        json={"username": "operator", "password": "Operator!dev1"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j.get("access_token")
    assert j["user"]["role"] == "operator"


def test_chat_requires_token(client_auth):
    r = client_auth.post("/api/chat/execute", json={"session_id": "x", "message": "hi"})
    assert r.status_code == 401
    assert r.get_json().get("error_code") == "A4011"


def test_viewer_cannot_domain_write(client_auth):
    login = client_auth.post(
        "/api/auth/login",
        json={"username": "viewer", "password": "Viewer!dev1"},
    )
    token = login.get_json()["access_token"]
    r = client_auth.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "e1",
            "action": "save",
            "payload": {},
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403
    assert r.get_json().get("error_code") == "P4031"


def test_operator_can_domain_with_token(client_auth, app_auth):
    import test_domain_and_indexes as tdi

    ids = tdi._seed_full_stack(app_auth)
    client_auth.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-auth", "model_ids": list(ids)},
    )
    login = client_auth.post(
        "/api/auth/login",
        json={"username": "operator", "password": "Operator!dev1"},
    )
    token = login.get_json()["access_token"]
    r = client_auth.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "auth-c1",
            "action": "sign",
            "payload": {"amount": 5},
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.get_json().get("ok") is True
