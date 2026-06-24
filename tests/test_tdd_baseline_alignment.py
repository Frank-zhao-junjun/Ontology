def login(plain_client, username, password):
    response = plain_client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_tdd_auth_permissions_payload_is_json_safe(plain_client):
    """TDD-AUTH-01: auth payload must be JSON-safe and stable for frontend consumption."""
    headers = login(plain_client, "admin", "admin123")

    me_resp = plain_client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    body = me_resp.get_json()

    entities = body["permissions"]["entities"]
    assert isinstance(entities, dict)
    assert isinstance(entities["*"], list)
    assert "read" in entities["*"]
    assert "write" in entities["*"]


def test_tdd_permission_boundary_viewer_cannot_chat_write(plain_client):
    """TDD-AUTH-02: viewer can query but cannot trigger WRITE intent in chat."""
    viewer_headers = login(plain_client, "viewer", "viewer123")

    resp = plain_client.post(
        "/api/chat/execute",
        headers=viewer_headers,
        json={
            "session_id": "tdd-auth-s1",
            "user_id": "tdd-viewer-user",
            "message": "please create a contract",
            "ui_context": {
                "entity_type": "contract",
                "payload": {"id": "TDD-C-001", "contract_no": "TDD-001", "status": "draft"},
                "current_state": "draft",
                "transition_id": "submit",
            },
        },
    )
    assert resp.status_code == 403
    assert resp.get_json()["error_code"] == "P4031"


def test_tdd_meta_admin_boundary_analyst_cannot_publish(plain_client):
    """TDD-AUTH-03: non-meta-admin role must be denied for publish operations."""
    analyst_headers = login(plain_client, "analyst", "analyst123")

    validate_resp = plain_client.post(
        "/api/meta-models/validate",
        headers=analyst_headers,
        json={"model_type": "data", "content": {"entities": [{"id": "contract"}]}},
    )
    assert validate_resp.status_code == 403
    assert validate_resp.get_json()["error_code"] == "P4031"

