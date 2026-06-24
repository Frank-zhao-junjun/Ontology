def test_chat_execute_has_trace(client):
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "s1", "message": "hello query"},
    )
    assert r.status_code == 200
    assert "trace_id" in r.get_json()
    assert "assistant_message" in r.get_json()


def test_chat_retry_limit(client):
    mid = "msg-1"
    for i in range(5):
        r = client.post("/api/chat/retry", json={"message_id": mid})
        assert r.status_code == 200, i
    r = client.post("/api/chat/retry", json={"message_id": mid})
    assert r.status_code == 400
    assert r.get_json().get("error_code") == "A4092"


def test_chat_permission_stub(client):
    r = client.post(
        "/api/chat/execute",
        json={
            "session_id": "s2",
            "message": "error permission denied simulation",
        },
    )
    assert r.status_code == 200
    assert r.get_json().get("error_code") == "P4031"


def test_chat_analyze_returns_tool_results_and_chart_action(client):
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "s-chart", "message": "请分析统计图表"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert "tool_results" in j
    assert any(tr.get("tool") == "chart_tool" for tr in j["tool_results"])
    actions = j.get("actions") or []
    assert any(a.get("type") == "RENDER_CHART" for a in actions)
    chart = next(a for a in actions if a.get("type") == "RENDER_CHART").get("chart")
    assert chart.get("labels")
    assert chart.get("values")
