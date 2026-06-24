import pytest

from backend import create_app


@pytest.fixture()
def app():
    app = create_app(testing=True)
    yield app


@pytest.fixture()
def plain_client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(plain_client):
    response = plain_client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def client(plain_client, auth_headers):
    plain_client.environ_base["HTTP_AUTHORIZATION"] = auth_headers["Authorization"]
    return plain_client
