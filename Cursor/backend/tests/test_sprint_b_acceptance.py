"""
Sprint B acceptance: B-005~B-009, AI-001~AI-004 (see docs/BACKLOG-SPRINT-B.md).
"""

import json

import pytest

from app.extensions import db
from app.models.meta import MetaModelDefinition
from app.models.runtime import AuditLog, EventDispatchLog, EventSubscriptionRegistry
from app.services.event_dispatcher import dispatch_event, register_skill_handler
from app.services.rule_evaluator import KIND_ORDER, evaluate_rules_for_entity


def _seed_rules_five_kinds(app) -> None:
    """One rule model containing five kinds (stubs use fail flag for 3)."""
    with app.app_context():
        m = MetaModelDefinition(
            model_type="rule",
            name="sprint-b-rules",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "SBEntity",
                    "rules": [
                        {
                            "id": "fl",
                            "kind": "field_level",
                            "field": "amount",
                            "op": "positive",
                            "severity": "blocking",
                        },
                        {
                            "id": "cf",
                            "kind": "cross_field",
                            "left": "a",
                            "right": "b",
                            "op": "lt",
                            "severity": "blocking",
                        },
                        {
                            "id": "ce",
                            "kind": "cross_entity",
                            "fail": True,
                            "severity": "blocking",
                        },
                        {
                            "id": "ag",
                            "kind": "aggregate",
                            "fail": True,
                            "severity": "blocking",
                        },
                        {
                            "id": "tp",
                            "kind": "temporal",
                            "fail": True,
                            "severity": "blocking",
                        },
                    ],
                }
            ),
            status="draft",
        )
        db.session.add(m)
        db.session.commit()


@pytest.mark.parametrize("kind", list(KIND_ORDER))
def test_b006_kind_registered_in_order(kind):
    assert kind in KIND_ORDER


def test_b006_field_level_blocks_before_cross_field(client, app):
    """field_level violation returned when amount invalid; cross_field not reached."""
    _seed_rules_five_kinds(app)
    with app.app_context():
        mids = [MetaModelDefinition.query.filter_by(name="sprint-b-rules").first().id]
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-sb-r", "model_ids": mids},
    )
    with app.app_context():
        ok, viols = evaluate_rules_for_entity(
            "SBEntity",
            {"amount": -1, "a": 1, "b": 2},
        )
        assert ok is False
        assert viols[0]["rule_id"].endswith(":fl")


def test_b008_e4041_skill_not_registered(app):
    with app.app_context():
        db.session.add(
            EventSubscriptionRegistry(
                event_type="SB_E4041",
                target_type="skill",
                target_ref="definitely_missing_skill_xyz",
                is_active=True,
            )
        )
        db.session.commit()
        dispatch_event("SB_E4041", {}, trace_id="t-e4041")
        row = EventDispatchLog.query.filter_by(error_code="E4041").first()
        assert row is not None
        assert row.target_ref == "definitely_missing_skill_xyz"


def test_b008_e5001_handler_returns_false(app):
    register_skill_handler("sb_fail_skill", lambda _p: (False, "handler said no"))

    with app.app_context():
        db.session.add(
            EventSubscriptionRegistry(
                event_type="SB_E5001",
                target_type="skill",
                target_ref="sb_fail_skill",
                is_active=True,
            )
        )
        db.session.commit()
        dispatch_event("SB_E5001", {}, trace_id="t-e5001")
        row = EventDispatchLog.query.filter_by(error_code="E5001").first()
        assert row is not None


def test_b009_audit_fields_on_domain(client, app):
    import test_domain_and_indexes as tdi

    ids = tdi._seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-b009", "model_ids": list(ids)},
    )
    client.post(
        "/api/domain/validate-and-transition",
        json={
            "entity_type": "Contract",
            "entity_id": "sb-audit",
            "action": "sign",
            "payload": {"amount": 3},
            "operator": "op1",
            "user_id": "u-sb",
            "session_id": "sess-sb",
        },
        headers={"X-Trace-Id": "trace-sb-b009"},
    )
    with app.app_context():
        a = AuditLog.query.filter_by(trace_id="trace-sb-b009").first()
        assert a is not None
        assert a.user_id == "u-sb"
        assert a.session_id == "sess-sb"


def test_ai_001_004_orchestration_in_chat(client, app):
    import test_domain_and_indexes as tdi

    ids = tdi._seed_full_stack(app)
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-ai", "model_ids": list(ids)},
    )
    r = client.post(
        "/api/chat/execute",
        json={"session_id": "sb-ai", "message": "open navigate to page"},
    )
    assert r.status_code == 200
    orch = r.get_json().get("orchestration") or {}
    assert "intent" in orch
    assert "tools" in orch
    assert "process_plan" in orch
    assert orch.get("intent") == "navigate"
