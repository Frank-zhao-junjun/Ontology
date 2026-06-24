"""B-010: low-interrupt rule index refresh with rollback on failure."""

from __future__ import annotations

from typing import Any

from app.extensions import db
from app.models.runtime import RuleRuntimeIndex
from app.services.publish import build_current_snapshot
from app.services.runtime_index import rebuild_rule_indexes_only


def _serialize_rule_rows() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for r in RuleRuntimeIndex.query.all():
        out.append(
            {
                "rule_id": r.rule_id,
                "model_def_id": r.model_def_id,
                "entity_type": r.entity_type,
                "kind": r.kind,
                "is_active": r.is_active,
                "checksum": r.checksum,
                "rule_json": r.rule_json,
            }
        )
    return out


def _restore_rule_rows(rows: list[dict[str, Any]]) -> None:
    RuleRuntimeIndex.query.delete()
    db.session.flush()
    for d in rows:
        db.session.add(
            RuleRuntimeIndex(
                rule_id=d["rule_id"],
                model_def_id=d["model_def_id"],
                entity_type=d["entity_type"],
                kind=d["kind"],
                is_active=d.get("is_active", True),
                checksum=d.get("checksum"),
                rule_json=d["rule_json"],
            )
        )
    db.session.commit()


def hot_reload_rules_from_current_snapshot() -> dict[str, Any]:
    """
    Rebuild only RuleRuntimeIndex from latest published snapshot.
    On any failure, restore previous index rows.
    """
    backup = _serialize_rule_rows()
    try:
        snap = build_current_snapshot()
        if not snap or not snap.get("models"):
            raise ValueError("no published snapshot")
        rebuild_rule_indexes_only(snap["models"])
        return {"ok": True, "rule_rows": RuleRuntimeIndex.query.count()}
    except Exception as ex:  # noqa: BLE001
        _restore_rule_rows(backup)
        return {"ok": False, "restored": True, "error": str(ex)}
