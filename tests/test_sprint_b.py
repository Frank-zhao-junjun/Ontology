def test_ai008_degradation_mode(client, app):
    app.config["AI_AVAILABLE"] = False
    resp = client.post(
        "/api/chat/execute",
        json={"session_id": "sb-s4", "user_id": "sb-u4", "message": "查询合同"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["conversation_state"] == "degraded"

    app.config["AI_AVAILABLE"] = True
