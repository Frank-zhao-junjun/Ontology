"""QA-001 ~ QA-002: 轻量烟测（单进程 Flask client）"""


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.get_json() or {}
    assert body.get("status") == "ok" or "ok" in str(body).lower()


def test_health_includes_trace_header(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.headers.get("X-Trace-Id")


def test_chat_roundtrip(client):
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "qa-smoke", "message": "list query"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j.get("trace_id")
    assert "assistant_message" in j


def test_meta_validate_exists(client):
    r = client.post(
        "/api/meta-models/validate",
        json={"model_type": "entity", "content": {"name": "smoke"}},
    )
    assert r.status_code == 200
    assert "is_valid" in (r.get_json() or {})
