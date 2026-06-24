import json
import time

from app.extensions import db
from app.models.meta import MetaModelDefinition
from app.models.runtime import EventDispatchLog


def _seed_minimal_contract_stack(app):
    with app.app_context():
        dm = MetaModelDefinition(
            model_type="data",
            name="d",
            version="1.0.0",
            content_json=json.dumps({"entities": [{"name": "Contract"}]}),
            status="draft",
        )
        rm = MetaModelDefinition(
            model_type="rule",
            name="r",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "Contract",
                    "rules": [
                        {
                            "id": "x",
                            "kind": "field_level",
                            "field": "amount",
                            "op": "positive",
                            "severity": "blocking",
                        }
                    ],
                }
            ),
            status="draft",
        )
        db.session.add_all([dm, rm])
        db.session.commit()
        return dm.id, rm.id


def test_llm_degradation_header(client):
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "d1", "message": "hello"},
        headers={"X-LLM-Available": "false"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j.get("degraded") is True
    assert any(a.get("type") == "SHOW_UI_ONLY" for a in j.get("actions", []))


def test_tool_results_in_execute(client, app):
    _seed_minimal_contract_stack(app)
    with app.app_context():
        mids = [m.id for m in MetaModelDefinition.query.all()]
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-t2", "model_ids": mids},
    )
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "t1", "message": "list all please"},
    )
    assert r.status_code == 200
    assert "tool_results" in r.get_json()["assistant_message"]


def test_flaky_self_healing_succeeds(client, app):
    _seed_minimal_contract_stack(app)
    with app.app_context():
        mids = [m.id for m in MetaModelDefinition.query.all()]
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-f", "model_ids": mids},
    )
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "f1", "message": "flaky_tool please run query"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert "attempts=2" in j["assistant_message"] or "attempts=2" in str(j)


def test_rules_refresh_ok(client, app):
    _seed_minimal_contract_stack(app)
    with app.app_context():
        mids = [m.id for m in MetaModelDefinition.query.all()]
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-rh", "model_ids": mids},
    )
    r = client.post("/api/runtime/rules/refresh")
    assert r.status_code == 200
    assert r.get_json().get("ok") is True


def test_async_event_dispatch(client, app):
    _seed_minimal_contract_stack(app)
    with app.app_context():
        # need event model with subscription for dispatch to log
        em = MetaModelDefinition(
            model_type="event",
            name="ev",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "events": [{"type": "E1"}],
                    "subscriptions": [{"event_type": "E1", "targetSkill": "echo_skill"}],
                }
            ),
            status="draft",
        )
        db.session.add(em)
        db.session.commit()
        mids = [m.id for m in MetaModelDefinition.query.all()]
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-async", "model_ids": mids},
    )
    r = client.post(
        "/api/runtime/events/dispatch-async",
        json={"event_type": "E1", "payload": {"k": 1}},
    )
    assert r.status_code == 202
    time.sleep(0.3)
    with app.app_context():
        assert EventDispatchLog.query.filter_by(event_type="E1").count() >= 1
