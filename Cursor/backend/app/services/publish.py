from __future__ import annotations

import hashlib
import json
import uuid
from typing import Any

from app.extensions import db
from app.models.meta import (
    MetaModelChangeLog,
    MetaModelDefinition,
    MetaModelRelease,
    MetaModelReleaseItem,
)
from app.services.runtime_index import rebuild_runtime_indexes
from app.services.snapshot_cache import cache
from app.services.validator import (
    _parse_content,
    validate_consistency,
    validate_structure,
)


def _checksum_definition(mid: int, content: str) -> str:
    return hashlib.sha256(f"{mid}:{content}".encode()).hexdigest()


def publish_release(
    release_no: str,
    model_ids: list[int],
    operator: str | None = None,
) -> tuple[dict[str, Any], int | None]:
    """
    Returns (body, http_status). 200 on success, 409 on conflict, 400 on validation error.
    """
    if not release_no or not model_ids:
        return {
            "ok": False,
            "error_code": "M4001",
            "message": "release_no and model_ids required",
        }, 400

    existing = MetaModelRelease.query.filter_by(release_no=release_no).first()
    defs = (
        MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(model_ids)).all()
    )
    if len(defs) != len(set(model_ids)):
        return {
            "ok": False,
            "error_code": "M4001",
            "message": "one or more model_ids not found",
        }, 400

    # Build consistency batch
    parsed: list[tuple[str, dict]] = []
    for d in defs:
        c = _parse_content(d.content_json)
        if c is None:
            return {
                "ok": False,
                "error_code": "M4001",
                "message": f"invalid JSON for definition id={d.id}",
            }, 400
        ok, errs, _ = validate_structure(d.model_type, c)
        if not ok:
            return {
                "ok": False,
                "error_code": "M4001",
                "errors": errs,
            }, 400
        parsed.append((d.model_type, c))

    ok_c, c_errs = validate_consistency(parsed)
    if not ok_c:
        return {"ok": False, "error_code": "M4002", "errors": c_errs}, 400

    item_checksums = []
    models_payload = []
    for d in defs:
        c = json.loads(d.content_json) if d.content_json else {}
        ch = _checksum_definition(d.id, d.content_json)
        item_checksums.append(ch)
        models_payload.append(
            {
                "id": d.id,
                "model_type": d.model_type,
                "name": d.name,
                "version": d.version,
                "content": c,
            }
        )

    snapshot_checksum = cache.compute_checksum(models_payload)

    if existing:
        # Idempotent: same snapshot -> same response
        if existing.snapshot_checksum == snapshot_checksum:
            items = MetaModelReleaseItem.query.filter_by(release_id=existing.id).all()
            return {
                "release_id": existing.id,
                "status": existing.status,
                "snapshot_ref": f"snapshot:{existing.release_no}",
                "checksum": snapshot_checksum,
                "idempotent": True,
            }, 200
        return {
            "ok": False,
            "error_code": "M4091",
            "message": f"release_no {release_no} exists with different payload",
        }, 409

    rel = MetaModelRelease(
        release_no=release_no,
        status="completed",
        released_by=operator,
        snapshot_checksum=snapshot_checksum,
    )
    db.session.add(rel)
    db.session.flush()

    for d in defs:
        ch = _checksum_definition(d.id, d.content_json)
        db.session.add(
            MetaModelReleaseItem(
                release_id=rel.id,
                model_definition_id=d.id,
                checksum=ch,
            )
        )
        d.status = "published"
        db.session.add(
            MetaModelChangeLog(
                model_definition_id=d.id,
                change_type="publish",
                diff_json=json.dumps({"release_no": release_no}),
                operator=operator,
            )
        )

    db.session.commit()

    cache.set_snapshot(release_no, models_payload, snapshot_checksum)
    rebuild_runtime_indexes(models_payload)

    return {
        "release_id": rel.id,
        "status": "completed",
        "snapshot_ref": f"snapshot:{release_no}",
        "checksum": snapshot_checksum,
    }, 200


def rollback_to(release_no: str, operator: str | None = None) -> tuple[dict[str, Any], int]:
    target = MetaModelRelease.query.filter_by(release_no=release_no).first()
    if not target:
        return {"ok": False, "error_code": "M4001", "message": "target release not found"}, 400

    items = MetaModelReleaseItem.query.filter_by(release_id=target.id).all()
    model_ids = [i.model_definition_id for i in items]
    new_no = f"{release_no}-rb-{uuid.uuid4().hex[:12]}"
    body, status = publish_release(new_no, model_ids, operator=operator)
    if status >= 400:
        return body, status
    body["rolled_back_from"] = release_no
    return body, 200


def build_current_snapshot() -> dict[str, Any] | None:
    c = cache.get()
    if c:
        return c
    last = (
        MetaModelRelease.query.order_by(MetaModelRelease.released_at.desc())
        .first()
    )
    if not last:
        return None
    items = MetaModelReleaseItem.query.filter_by(release_id=last.id).all()
    ids = [i.model_definition_id for i in items]
    defs = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
    models_payload = []
    for d in defs:
        c = json.loads(d.content_json) if d.content_json else {}
        models_payload.append(
            {
                "id": d.id,
                "model_type": d.model_type,
                "name": d.name,
                "version": d.version,
                "content": c,
            }
        )
    chk = cache.compute_checksum(models_payload)
    cache.set_snapshot(last.release_no, models_payload, chk)
    return {"release_no": last.release_no, "models": models_payload, "checksum": chk}
