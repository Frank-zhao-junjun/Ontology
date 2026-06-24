import json

from app.extensions import db
from app.models.meta import MetaModelDefinition


def test_validate_invalid_type(client):
    r = client.post(
        "/api/meta-models/validate",
        json={"model_type": "unknown", "content": {}},
    )
    assert r.status_code == 200
    data = r.get_json()
    assert data["is_valid"] is False
    assert data["errors"]


def test_publish_flow(client, app):
    with app.app_context():
        dm = MetaModelDefinition(
            model_type="data",
            name="core-data",
            version="1.0.0",
            content_json=json.dumps(
                {"entities": [{"name": "Contract", "fields": [{"name": "id"}]}]}
            ),
            status="draft",
        )
        bm = MetaModelDefinition(
            model_type="behavior",
            name="contract-sm",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "Contract",
                    "states": ["draft", "signed"],
                    "transitions": [],
                }
            ),
            status="draft",
        )
        db.session.add_all([dm, bm])
        db.session.commit()
        mid_data, mid_beh = dm.id, bm.id

    r = client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-1", "model_ids": [mid_data, mid_beh], "operator": "tester"},
    )
    assert r.status_code == 200
    body = r.get_json()
    assert body.get("release_id") is not None
    assert body.get("checksum")

    r2 = client.get("/api/meta-models/snapshots/current")
    assert r2.status_code == 200
    snap = r2.get_json()
    assert snap["release_no"] == "rel-1"
    assert len(snap["models"]) == 2

    r3 = client.post(
        "/api/meta-models/rollback",
        json={"target_release_no": "rel-1", "operator": "tester"},
    )
    assert r3.status_code == 200
    rb = r3.get_json()
    assert rb.get("rolled_back_from") == "rel-1"


def test_publish_idempotent(client, app):
    with app.app_context():
        dm = MetaModelDefinition(
            model_type="data",
            name="d2",
            version="1.0.0",
            content_json=json.dumps({"entities": [{"name": "A"}]}),
            status="draft",
        )
        db.session.add(dm)
        db.session.commit()
        mid = dm.id

    client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-idem", "model_ids": [mid]},
    )
    r = client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-idem", "model_ids": [mid]},
    )
    assert r.status_code == 200
    assert r.get_json().get("idempotent") is True


def test_consistency_failure(client, app):
    with app.app_context():
        dm = MetaModelDefinition(
            model_type="data",
            name="only",
            version="1.0.0",
            content_json=json.dumps({"entities": [{"name": "X"}]}),
            status="draft",
        )
        bm = MetaModelDefinition(
            model_type="behavior",
            name="bad",
            version="1.0.0",
            content_json=json.dumps(
                {
                    "entityType": "MissingEntity",
                    "states": ["a"],
                    "transitions": [],
                }
            ),
            status="draft",
        )
        db.session.add_all([dm, bm])
        db.session.commit()
        ids = [dm.id, bm.id]

    r = client.post(
        "/api/meta-models/publish",
        json={"release_no": "rel-bad", "model_ids": ids},
    )
    assert r.status_code == 400
    assert r.get_json().get("error_code") == "M4002"
