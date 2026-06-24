def test_qa_chain_model_publish_positive_and_negative(client):
    # Positive: create data model then publish.
    data = client.post(
        "/api/meta-models/definitions",
        json={
            "model_type": "data",
            "name": "qa_data",
            "version": "1.0.0",
            "content": {"entities": [{"id": "contract", "attributes": [{"id": "status"}]}]},
        },
    )
    assert data.status_code == 201
    model_id = data.get_json()["id"]

    publish = client.post(
        "/api/meta-models/publish",
        json={"release_no": "qa-r1", "model_ids": [model_id], "operator": "qa"},
    )
    assert publish.status_code == 201

    # Negative: invalid structure.
    invalid = client.post("/api/meta-models/validate", json={"model_type": "event", "content": {}})
    assert invalid.status_code == 400


def test_qa_chain_read_query_is_routed_as_idle(client):
    resp = client.post(
        "/api/chat/execute",
        json={"session_id": "qa-s1", "user_id": "qa", "message": "查询合同列表"},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["conversation_state"] == "idle"
    assert body["plan"][0]["intent"] == "QUERY"


def test_qa_chain_controlled_write_routes_as_idle(client):
    resp = client.post(
        "/api/chat/execute",
        json={"session_id": "qa-s2", "user_id": "qa", "message": "创建合同"},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["conversation_state"] == "idle"
    assert body["plan"][0]["intent"] == "WRITE"
