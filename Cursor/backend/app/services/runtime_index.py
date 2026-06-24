"""B-005: rebuild rule/sm/event indexes from published snapshot."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.extensions import db
from app.models.runtime import (
    EventSubscriptionRegistry,
    EventTypeRegistry,
    RuleRuntimeIndex,
    StateMachineRuntimeIndex,
)


def _ch(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:32]


def _insert_rule_rows_from_models(models_payload: list[dict[str, Any]]) -> None:
    for m in models_payload:
        if m.get("model_type") != "rule":
            continue
        mid = m["id"]
        content = m.get("content") or {}
        name = m.get("name", "")
        ver = m.get("version", "")
        _ = ver
        entity_type = content.get("entityType") or ""
        for r in content.get("rules") or []:
            rid = str(r.get("id") or r.get("rule_id") or "rule")
            kind = (r.get("kind") or r.get("type") or "field_level").lower()
            if kind == "field":
                kind = "field_level"
            db.session.add(
                RuleRuntimeIndex(
                    rule_id=f"{name}:{rid}",
                    model_def_id=mid,
                    entity_type=entity_type,
                    kind=kind,
                    checksum=_ch(json.dumps(r, sort_keys=True)),
                    rule_json=json.dumps(r, ensure_ascii=False),
                )
            )


def rebuild_rule_indexes_only(models_payload: list[dict[str, Any]]) -> None:
    """B-010: refresh only rule index rows from snapshot (SM/event unchanged)."""
    RuleRuntimeIndex.query.delete()
    db.session.flush()
    _insert_rule_rows_from_models(models_payload)
    db.session.commit()


def rebuild_runtime_indexes(models_payload: list[dict[str, Any]]) -> None:
    RuleRuntimeIndex.query.delete()
    StateMachineRuntimeIndex.query.delete()
    EventTypeRegistry.query.delete()
    EventSubscriptionRegistry.query.delete()
    db.session.flush()

    _insert_rule_rows_from_models(models_payload)

    for m in models_payload:
        mid = m["id"]
        mtype = m["model_type"]
        content = m.get("content") or {}
        name = m.get("name", "")
        ver = m.get("version", "")

        if mtype == "behavior":
            et = content.get("entityType") or ""
            sm_id = f"{name}-{ver}"
            db.session.add(
                StateMachineRuntimeIndex(
                    sm_id=sm_id,
                    model_def_id=mid,
                    entity_type=et,
                    checksum=_ch(json.dumps(content, sort_keys=True)),
                    sm_json=json.dumps(content, ensure_ascii=False),
                )
            )

        if mtype == "event":
            for ev in content.get("events") or []:
                etype = ev.get("type") or ev.get("name")
                if not etype:
                    continue
                db.session.add(
                    EventTypeRegistry(
                        event_type=etype,
                        model_def_id=mid,
                        payload_schema_json=json.dumps(ev.get("payloadSchema") or {}),
                        version=ver,
                    )
                )
            for sub in content.get("subscriptions") or []:
                etype = sub.get("event_type") or sub.get("eventType")
                tgt = sub.get("targetSkill") or sub.get("target_skill")
                if not etype or not tgt:
                    continue
                db.session.add(
                    EventSubscriptionRegistry(
                        event_type=etype,
                        target_type="skill",
                        target_ref=tgt,
                        model_def_id=mid,
                    )
                )

    db.session.commit()
