from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend import create_app  # noqa: E402


def login(client, username="admin", password="admin123"):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def create_model(client, headers, model_type, name, content, version="1.0.0"):
    response = client.post(
        "/api/meta-models/definitions",
        headers=headers,
        json={"model_type": model_type, "name": name, "version": version, "content": content},
    )
    assert response.status_code == 201, response.get_json()
    return response.get_json()["id"]


def publish_runtime_models(client, headers):
    data_id = create_model(
        client,
        headers,
        "data",
        "validation_data_contract",
        {
            "entities": [
                {"id": "contract", "attributes": [{"id": "id"}, {"id": "status"}, {"id": "contract_no"}]},
                {"id": "customer", "attributes": [{"id": "id"}, {"id": "customer_no"}, {"id": "name"}]},
                {"id": "employee", "attributes": [{"id": "id"}, {"id": "employee_no"}, {"id": "name"}]},
                {"id": "product", "attributes": [{"id": "id"}, {"id": "product_no"}, {"id": "name"}]},
                {"id": "invoice", "attributes": [{"id": "id"}, {"id": "invoice_no"}, {"id": "customer_id"}]},
            ]
        },
    )
    behavior_id = create_model(
        client,
        headers,
        "behavior",
        "validation_behavior_contract",
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
    rule_id = create_model(
        client,
        headers,
        "rule",
        "validation_rule_contract",
        {"rules": [{"id": "contract_no_required", "type": "field_validation", "entity": "contract", "field": "contract_no"}]},
    )
    event_id = create_model(
        client,
        headers,
        "event",
        "validation_event_contract",
        {
            "event_types": [{"event_type": "contract.submitted", "payload_schema": {"entity_id": "string"}}],
            "subscriptions": [
                {"event_type": "contract.submitted", "target_type": "skill", "target_ref": "skill:notify_ops"},
                {"event_type": "contract.submitted", "target_type": "skill", "target_ref": "invalid_target"},
            ],
        },
    )
    response = client.post(
        "/api/meta-models/publish",
        headers=headers,
        json={"release_no": "validation-r1", "model_ids": [data_id, behavior_id, rule_id, event_id], "operator": "validator"},
    )
    assert response.status_code == 201, response.get_json()


def run() -> int:
    app = create_app(testing=True)
    client = app.test_client()
    headers = login(client)

    print("[1/5] publish runtime models")
    publish_runtime_models(client, headers)

    print("[2/5] verify query path")
    query_resp = client.post("/api/chat/execute", headers=headers, json={"session_id": "validation-1", "message": "查询合同列表"})
    assert query_resp.status_code == 200, query_resp.get_json()

    print("[3/5] verify contract create and submit path")
    create_resp = client.post(
        "/api/contracts",
        headers=headers,
        json={"id": "VAL-001", "contract_no": "HT-VAL-001", "title": "Validation Contract", "counterparty": "Demo", "amount": 88.6},
    )
    assert create_resp.status_code == 201, create_resp.get_json()
    submit_resp = client.post("/api/contracts/VAL-001/submit", headers=headers, json={"session_id": "validation-1"})
    assert submit_resp.status_code == 200, submit_resp.get_json()
    submit_body = submit_resp.get_json()
    assert submit_body["item"]["status"] == "pending_approval", submit_body

    customer_resp = client.post(
        "/api/entities/customer",
        headers=headers,
        json={"id": "CUS-001", "customer_no": "CU-001", "name": "Demo Customer", "industry": "Software"},
    )
    assert customer_resp.status_code == 201, customer_resp.get_json()
    product_resp = client.post(
        "/api/entities/product",
        headers=headers,
        json={"id": "PRD-001", "product_no": "PD-001", "name": "Demo Product", "category": "SaaS", "price": 19.9},
    )
    assert product_resp.status_code == 201, product_resp.get_json()
    invoice_resp = client.post(
        "/api/entities/invoice",
        headers=headers,
        json={"id": "INV-001", "invoice_no": "IV-001", "customer_id": "CUS-001", "contract_id": "VAL-001", "amount": 88.6},
    )
    assert invoice_resp.status_code == 201, invoice_resp.get_json()

    print("[4/5] verify degraded mode")
    app.config["AI_AVAILABLE"] = False
    degraded_resp = client.post("/api/chat/execute", headers=headers, json={"session_id": "validation-1", "message": "查询合同"})
    assert degraded_resp.status_code == 200, degraded_resp.get_json()
    assert degraded_resp.get_json()["conversation_state"] == "degraded", degraded_resp.get_json()
    app.config["AI_AVAILABLE"] = True

    print("[5/5] verify unified error and event observability")
    fail_resp = client.post(
        "/api/chat/execute",
        headers=headers,
        json={"session_id": "validation-1", "message": "query with bad_field hard_fail"},
    )
    fail_body = fail_resp.get_json()
    assert fail_resp.status_code == 400, fail_body
    assert fail_body["success"] is False, fail_body
    assert fail_body["error"]["code"] == "A5001", fail_body

    event_id = submit_body["event_dispatch"]["event_id"]
    event_resp = client.get(f"/api/runtime/events/{event_id}", headers=headers)
    event_body = event_resp.get_json()
    assert event_resp.status_code == 200, event_body
    assert any(item["result"] == "success" for item in event_body["items"]), event_body
    assert any(item["error_code"] == "E4041" for item in event_body["items"]), event_body

    employee_admin_headers = login(client, username="admin", password="admin123")
    employee_resp = client.post(
        "/api/entities/employee",
        headers=employee_admin_headers,
        json={"id": "EMP-001", "employee_no": "EM-001", "name": "Alice", "department": "Sales", "job_title": "Manager"},
    )
    assert employee_resp.status_code == 201, employee_resp.get_json()

    print("validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())