"""Multi-entity snapshot: Contract, Invoice, Customer — each can transition."""

import json

from app.extensions import db
from app.models.meta import MetaModelDefinition


def _build_stack_multi() -> list[int]:
    """Data model lists 3 entities; behavior+rule per entity; one shared event model."""
    dm = MetaModelDefinition(
        model_type="data",
        name="multi-entities",
        version="1.0.0",
        content_json=json.dumps(
            {
                "entities": [
                    {"name": "Contract", "fields": [{"name": "amount"}]},
                    {"name": "Invoice", "fields": [{"name": "total"}]},
                    {"name": "Customer", "fields": [{"name": "credit_score"}]},
                ]
            }
        ),
        status="draft",
    )
    db.session.add(dm)
    db.session.flush()

    def behavior(name: str, action: str, ev: str) -> MetaModelDefinition:
        return MetaModelDefinition(
            model_type="behavior",
            name=f"sm-{name}",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": name,
                    "states": ["draft", "active"],
                    "transitions": [
                        {
                            "id": f"t-{name}",
                            "from": "draft",
                            "to": "active",
                            "action": action,
                            "emit": [ev],
                        }
                    ],
                }
            ),
            status="draft",
        )

    def rules(name: str, field: str) -> MetaModelDefinition:
        return MetaModelDefinition(
            model_type="rule",
            name=f"rules-{name}",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": name,
                    "rules": [
                        {
                            "id": f"{field}_positive",
                            "kind": "field_level",
                            "field": field,
                            "op": "positive",
                            "severity": "blocking",
                        }
                    ],
                }
            ),
            status="draft",
        )

    bm_c = behavior("Contract", "sign", "ContractSigned")
    bm_i = behavior("Invoice", "issue", "InvoiceIssued")
    bm_k = behavior("Customer", "activate", "CustomerActivated")
    rm_c = rules("Contract", "amount")
    rm_i = rules("Invoice", "total")
    rm_k = rules("Customer", "credit_score")
    em = MetaModelDefinition(
        model_type="event",
        name="multi-ev",
        version="1.0.0",
        content_json=json.dumps(
            {
                "events": [
                    {"type": "ContractSigned"},
                    {"type": "InvoiceIssued"},
                    {"type": "CustomerActivated"},
                ],
                "subscriptions": [
                    {"event_type": "ContractSigned", "targetSkill": "echo_skill"}
                ],
            }
        ),
        status="draft",
    )
    db.session.add_all([bm_c, bm_i, bm_k, rm_c, rm_i, rm_k, em])
    db.session.commit()
    return [
        dm.id,
        bm_c.id,
        bm_i.id,
        bm_k.id,
        rm_c.id,
        rm_i.id,
        rm_k.id,
        em.id,
    ]


def test_entity_types_lists_all_three(client, app):
    with app.app_context():
        mids = _build_stack_multi()
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-multi-et", "model_ids": mids},
    )
    r = client.get("/api/domain/entity-types")
    assert r.status_code == 200
    types = r.get_json().get("entity_types") or []
    assert "Contract" in types
    assert "Invoice" in types
    assert "Customer" in types


def test_transition_each_entity(client, app):
    with app.app_context():
        mids = _build_stack_multi()
    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-multi-tr", "model_ids": mids},
    )
    cases = [
        ("Contract", "c-1", "sign", {"amount": 1}),
        ("Invoice", "i-1", "issue", {"total": 10}),
        ("Customer", "k-1", "activate", {"credit_score": 100}),
    ]
    for et, eid, act, payload in cases:
        r = client.post(
            "/api/domain/validate-and-transition",
            json={
                "entity_type": et,
                "entity_id": eid,
                "action": act,
                "payload": payload,
                "operator": "u1",
            },
        )
        assert r.status_code == 200, (et, r.get_json())
        assert r.get_json().get("ok") is True
