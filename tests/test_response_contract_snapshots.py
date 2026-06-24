from __future__ import annotations

import json
import re
from pathlib import Path


SNAPSHOT_DIR = Path(__file__).parent / "snapshots" / "response_contracts"
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.IGNORECASE)


def _snapshot(name: str) -> dict:
    with (SNAPSHOT_DIR / name).open("r", encoding="utf-8") as f:
        return json.load(f)


def _normalize(value, key: str | None = None):
    if isinstance(value, dict):
        return {k: _normalize(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    if isinstance(value, str):
        if key == "token":
            return "<TOKEN>"
        if key == "trace_id":
            return "<TRACE_ID>"
        if key in {"model_snapshot_ref", "snapshot"}:
            return "<SNAPSHOT_REF>"
        if key in {"created_at", "updated_at"}:
            return "<ISO8601>"
        if UUID_RE.match(value):
            return "<UUID>"
    return value


def _assert_snapshot(name: str, payload: dict):
    assert _normalize(payload) == _snapshot(name)


def _login(plain_client, username: str, password: str) -> dict[str, str]:
    response = plain_client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def _create_model(client, model_type, name, content, version="1.0.0"):
    resp = client.post(
        "/api/meta-models/definitions",
        json={"model_type": model_type, "name": name, "version": version, "content": content},
    )
    assert resp.status_code == 201
    return resp.get_json()["id"]


def test_snapshot_error_unauth_contracts_get(plain_client):
    response = plain_client.get("/api/contracts")
    assert response.status_code == 401
    _assert_snapshot("error_unauth_contracts_get.json", response.get_json())


def test_snapshot_auth_login_admin(plain_client):
    response = plain_client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    _assert_snapshot("auth_login_admin.json", response.get_json())


def test_snapshot_auth_me_admin(plain_client):
    headers = _login(plain_client, "admin", "admin123")
    response = plain_client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    _assert_snapshot("auth_me_admin.json", response.get_json())


def test_snapshot_meta_validate_invalid_type(plain_client):
    headers = _login(plain_client, "admin", "admin123")
    response = plain_client.post(
        "/api/meta-models/validate",
        headers=headers,
        json={"model_type": "invalid_type", "content": {}},
    )
    assert response.status_code == 400
    _assert_snapshot("meta_validate_invalid_type.json", response.get_json())


def test_snapshot_entity_customer_create(client):
    response = client.post(
        "/api/entities/customer",
        json={
            "id": "SNAP-CUS-001",
            "customer_no": "SNAP-CNO-001",
            "name": "Snapshot Customer",
            "industry": "Software",
            "trace_id": "snap-trace-customer-create",
        },
    )
    assert response.status_code == 201
    _assert_snapshot("entity_customer_create.json", response.get_json())


def test_snapshot_chat_execute_query(client):
    response = client.post(
        "/api/chat/execute",
        json={
            "session_id": "snap-chat-query-session",
            "user_id": "snap-chat-query-user",
            "message": "show contract list",
            "trace_id": "snap-trace-chat-query",
        },
    )
    assert response.status_code == 200
    _assert_snapshot("chat_execute_query.json", response.get_json())


def test_snapshot_contract_submit_success(client):
    create_response = client.post(
        "/api/contracts",
        json={
            "id": "SNAP-SUBMIT-OK-001",
            "contract_no": "SNAP-SUBMIT-OK-001",
            "title": "Snapshot Submit Success",
            "counterparty": "Acme",
            "amount": 66.0,
            "trace_id": "snap-trace-submit-success",
        },
    )
    assert create_response.status_code == 201

    submit_response = client.post(
        "/api/contracts/SNAP-SUBMIT-OK-001/submit",
        json={"status": "pending_approval", "trace_id": "snap-trace-submit-success"},
    )
    assert submit_response.status_code == 200
    _assert_snapshot("contract_submit_success.json", submit_response.get_json())


def test_snapshot_meta_publish_success(client):
    data_id = _create_model(
        client,
        "data",
        "snap_publish_data",
        {"entities": [{"id": "contract", "attributes": [{"id": "id"}, {"id": "status"}, {"id": "contract_no"}]}]},
    )
    behavior_id = _create_model(
        client,
        "behavior",
        "snap_publish_behavior",
        {
            "state_machines": [
                {
                    "id": "contract_lifecycle",
                    "entity": "contract",
                    "status_field": "status",
                    "transitions": [{"id": "submit", "from": "draft", "to": "pending_approval"}],
                }
            ]
        },
    )
    rule_id = _create_model(
        client,
        "rule",
        "snap_publish_rule",
        {"rules": [{"id": "contract_no_required", "type": "field_validation", "entity": "contract", "field": "contract_no"}]},
    )
    event_id = _create_model(
        client,
        "event",
        "snap_publish_event",
        {
            "event_types": [{"event_type": "contract.submitted", "payload_schema": {"entity_id": "string"}}],
            "subscriptions": [{"event_type": "contract.submitted", "target_type": "skill", "target_ref": "skill:notify_ops"}],
        },
    )

    response = client.post(
        "/api/meta-models/publish",
        json={
            "release_no": "snap-publish-success-r1",
            "model_ids": [data_id, behavior_id, rule_id, event_id],
            "operator": "snapshot",
        },
    )
    assert response.status_code == 201
    _assert_snapshot("meta_publish_success.json", response.get_json())


def test_snapshot_contract_create_conflict_409(client):
    first = client.post(
        "/api/contracts",
        json={
            "id": "SNAP-CONFLICT-001",
            "contract_no": "SNAP-CONFLICT-001",
            "title": "Conflict Contract",
            "counterparty": "Acme",
            "amount": 10.0,
            "trace_id": "snap-trace-conflict-1",
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/contracts",
        json={
            "id": "SNAP-CONFLICT-001",
            "contract_no": "SNAP-CONFLICT-001-B",
            "title": "Conflict Contract Duplicate",
            "counterparty": "Acme",
            "amount": 12.0,
            "trace_id": "snap-trace-conflict-1",
        },
    )
    assert second.status_code == 409
    _assert_snapshot("contract_create_conflict_409.json", second.get_json())
