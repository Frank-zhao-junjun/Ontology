def _create_data_model(client, version="1.0.0"):
    resp = client.post(
        "/api/meta-models/definitions",
        json={
            "model_type": "data",
            "name": "contract_data",
            "version": version,
            "content": {
                "entities": [
                    {
                        "id": "contract",
                        "attributes": [
                            {"id": "status"},
                            {"id": "contract_no"},
                        ],
                    }
                ]
            },
        },
    )
    assert resp.status_code == 201
    return resp.get_json()["id"]


def _create_rule_model(client):
    resp = client.post(
        "/api/meta-models/definitions",
        json={
            "model_type": "rule",
            "name": "contract_rules",
            "version": "1.0.0",
            "content": {
                "rules": [
                    {
                        "id": "amount_positive",
                        "entity": "contract",
                        "field": "contract_no",
                    }
                ]
            },
        },
    )
    assert resp.status_code == 201
    return resp.get_json()["id"]


def test_validate_invalid_structure_returns_m4001(client):
    resp = client.post("/api/meta-models/validate", json={"model_type": "data", "content": {}})
    assert resp.status_code == 400
    payload = resp.get_json()
    assert payload["errors"][0]["code"] == "M4001"


def test_publish_and_get_current_snapshot(client):
    data_id = _create_data_model(client)
    rule_id = _create_rule_model(client)
    publish = client.post(
        "/api/meta-models/publish",
        json={"release_no": "r1", "model_ids": [data_id, rule_id], "operator": "tester"},
    )
    assert publish.status_code == 201
    assert publish.get_json()["snapshot_ref"] == "r1"

    current = client.get("/api/meta-models/snapshots/current")
    assert current.status_code == 200
    snapshot = current.get_json()
    assert snapshot["release_no"] == "r1"
    assert len(snapshot["models"]) == 2
    assert snapshot["checksum"]


def test_publish_cross_model_error_returns_m4002(client):
    bad_rule = client.post(
        "/api/meta-models/definitions",
        json={
            "model_type": "rule",
            "name": "bad_rule",
            "version": "1.0.0",
            "content": {
                "rules": [
                    {
                        "id": "bad_ref",
                        "entity": "missing_entity",
                        "field": "missing_field",
                    }
                ]
            },
        },
    )
    assert bad_rule.status_code == 201
    bad_rule_id = bad_rule.get_json()["id"]

    publish = client.post(
        "/api/meta-models/publish",
        json={"release_no": "r-bad", "model_ids": [bad_rule_id], "operator": "tester"},
    )
    assert publish.status_code == 400
    assert publish.get_json()["error_code"] == "M4002"


def test_rollback_creates_new_release_and_refreshes_snapshot(client):
    data_id = _create_data_model(client)
    rule_id = _create_rule_model(client)

    pub1 = client.post(
        "/api/meta-models/publish",
        json={"release_no": "r10", "model_ids": [data_id, rule_id], "operator": "tester"},
    )
    assert pub1.status_code == 201

    data_id2 = _create_data_model(client, version="1.1.0")
    pub2 = client.post(
        "/api/meta-models/publish",
        json={"release_no": "r11", "model_ids": [data_id2, rule_id], "operator": "tester"},
    )
    assert pub2.status_code == 201
    current_before = client.get("/api/meta-models/snapshots/current").get_json()
    assert current_before["release_no"] == "r11"

    rollback = client.post(
        "/api/meta-models/rollback",
        json={"target_release_no": "r10", "operator": "tester"},
    )
    assert rollback.status_code == 200
    current_after = client.get("/api/meta-models/snapshots/current").get_json()
    assert current_after["release_no"].startswith("rollback-r10")
