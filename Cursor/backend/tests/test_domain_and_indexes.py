import json

from app.extensions import db
from app.models.meta import MetaModelDefinition
from app.models.runtime import (
    AuditLog,
    DomainEntityState,
    EventDispatchLog,
    RuleRuntimeIndex,
    StateMachineRuntimeIndex,
)


def _seed_full_stack(app) -> tuple[int, int, int, int]:
    with app.app_context():
        dm = MetaModelDefinition(
            model_type="data",
            name="core",
            version="1.0.0",
            content_json=json.dumps(
                {"entities": [{"name": "Contract", "fields": [{"name": "amount"}]}]}
            ),
            status="draft",
        )
        bm = MetaModelDefinition(
            model_type="behavior",
            name="c-sm",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "Contract",
                    "states": ["draft", "active"],
                    "transitions": [
                        {
                            "id": "t1",
                            "from": "draft",
                            "to": "active",
                            "action": "sign",
                            "emit": ["ContractSigned"],
                        }
                    ],
                }
            ),
            status="draft",
        )
        rm = MetaModelDefinition(
            model_type="rule",
            name="c-rules",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "Contract",
                    "rules": [
                        {
                            "id": "amount_positive",
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
        em = MetaModelDefinition(
            model_type="event",
            name="c-ev",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "events": [{"type": "ContractSigned"}],
                    "subscriptions": [
                        {"event_type": "ContractSigned", "targetSkill": "echo_skill"}
                    ],
                }
            ),
            status="draft",
        )
        db.session.add_all([dm, bm, rm, em])
        db.session.commit()
        return dm.id, bm.id, rm.id, em.id


def test_publish_rebuilds_runtime_indexes(client, app):
    ids = _seed_full_stack(app)
    r = client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-idx", "model_ids": list(ids)},
    )
    assert r.status_code == 200
    with app.app_context():
        assert RuleRuntimeIndex.query.count() >= 1
        assert StateMachineRuntimeIndex.query.count() >= 1


def test_validate_and_transition_rule_failure(client, app):
    ids = _seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-v", "model_ids": list(ids)},
    )
    r = client.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "c1",
            "action": "sign",
            "payload": {"amount": -1},
            "operator": "u1",
        },
        headers={"X-Trace-Id": "t-rule"},
    )
    assert r.status_code == 400
    assert r.get_json().get("error_code") == "R4001"


def test_validate_and_transition_success_and_event(client, app):
    ids = _seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-ok", "model_ids": list(ids)},
    )
    r = client.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "c2",
            "action": "sign",
            "payload": {"amount": 100},
            "operator": "u1",
            "user_id": "u1",
            "session_id": "s1",
        },
        headers={"X-Trace-Id": "t-ok"},
    )
    assert r.status_code == 200
    body = r.get_json()
    assert body["ok"] is True
    assert body["new_state"] == "active"
    with app.app_context():
        assert DomainEntityState.query.filter_by(entity_id="c2").first() is not None
        assert EventDispatchLog.query.count() >= 1


def test_permission_blocked(client, app):
    ids = _seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-p", "model_ids": list(ids)},
    )
    r = client.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "c3",
            "action": "sign",
            "payload": {"amount": 10},
            "operator": "blocked",
        },
    )
    assert r.status_code == 403
    assert r.get_json().get("error_code") == "P4031"


def test_chat_orchestration_payload(client, app):
    ids = _seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-o2", "model_ids": list(ids)},
    )
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "sx", "message": "please query the list"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert "orchestration" in j
    assert j["orchestration"]["intent"] == "query"


def test_audit_log_written(client, app):
    ids = _seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-a", "model_ids": list(ids)},
    )
    client.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "c4",
            "action": "sign",
            "payload": {"amount": 1},
            "operator": "u1",
        },
        headers={"X-Trace-Id": "trace-audit"},
    )
    with app.app_context():
        assert AuditLog.query.filter_by(trace_id="trace-audit").count() >= 1
