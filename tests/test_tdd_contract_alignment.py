from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]


def login(plain_client, username: str, password: str) -> dict[str, str]:
    response = plain_client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_contract_error_response_shape_for_unauthenticated_access(plain_client):
    """TDD-CONTRACT-ERR-01: protected routes must return unified error contract."""
    response = plain_client.get("/api/contracts")
    assert response.status_code == 401
    body = response.get_json()

    assert body["success"] is False
    assert body["error_code"] == "U4011"
    assert isinstance(body["trace_id"], str) and body["trace_id"]
    assert set(body["error"].keys()) == {"code", "message", "details"}
    assert body["error"]["code"] == "U4011"
    assert isinstance(body["error"]["details"], dict)


def test_contract_auth_login_success_payload_shape(plain_client):
    """TDD-CONTRACT-AUTH-01: login success payload must keep stable contract for frontend."""
    response = plain_client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    body = response.get_json()

    assert isinstance(body.get("token"), str) and body["token"]
    assert set(body["user"].keys()) == {"username", "role", "full_name"}
    assert set(body["permissions"].keys()) == {"entities", "ai", "meta_admin"}
    assert isinstance(body["permissions"]["entities"], dict)
    assert isinstance(body["permissions"]["entities"]["*"], list)
    assert all(isinstance(item, str) for item in body["permissions"]["entities"]["*"])


@pytest.mark.parametrize(
    "role,entity_type,action,expected_status",
    [
        ("operator", "customer", "create", 201),
        ("operator", "employee", "create", 403),
        ("analyst", "customer", "create", 403),
        ("admin", "employee", "create", 201),
    ],
)
def test_contract_entity_write_permission_matrix(plain_client, role, entity_type, action, expected_status):
    """TDD-CONTRACT-ENTITY-01: entity write permission matrix contract."""
    headers = login(plain_client, role, f"{role}123")

    payload_by_entity = {
        "customer": {"id": f"TDD-CUS-{role}", "customer_no": f"TDD-CNO-{role}", "name": "TDD Customer"},
        "employee": {"id": f"TDD-EMP-{role}", "employee_no": f"TDD-ENO-{role}", "name": "TDD Employee"},
    }

    response = plain_client.post(f"/api/entities/{entity_type}", headers=headers, json=payload_by_entity[entity_type])
    assert response.status_code == expected_status
    if expected_status == 403:
        assert response.get_json()["error_code"] == "P4031"


def test_contract_meta_validation_error_payload_shape(plain_client):
    """TDD-CONTRACT-META-01: meta validation failure keeps both unified and compatibility fields."""
    headers = login(plain_client, "admin", "admin123")
    response = plain_client.post(
        "/api/meta-models/validate",
        headers=headers,
        json={"model_type": "invalid_type", "content": {}},
    )
    assert response.status_code == 400
    body = response.get_json()

    assert body["success"] is False
    assert body["error_code"] == "M4001"
    assert "trace_id" in body
    assert body["is_valid"] is False
    assert isinstance(body["errors"], list)
    assert isinstance(body["warnings"], list)
    assert isinstance(body["error"]["details"], dict)


def test_contract_daily_smoke_run_command_result_shape():
    """TDD-CONTRACT-SMOKE-01: daily_smoke run_command output shape remains stable."""
    script_path = ROOT / "scripts" / "daily_smoke.py"
    spec = importlib.util.spec_from_file_location("daily_smoke_module", script_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    result = module.run_command([sys.executable, "-c", "print('ok')"])
    assert set(result.keys()) == {"command", "exit_code", "stdout", "stderr"}
    assert result["exit_code"] == 0
    assert result["stdout"] == "ok"
    assert isinstance(result["stderr"], str)
