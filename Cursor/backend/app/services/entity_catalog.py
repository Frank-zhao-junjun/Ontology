"""Entity type names from current published snapshot."""

from __future__ import annotations

from app.services.publish import build_current_snapshot


def list_entity_types_from_snapshot() -> list[str]:
    snap = build_current_snapshot()
    if not snap:
        return []
    names: set[str] = set()
    for m in snap.get("models") or []:
        mt = m.get("model_type")
        c = m.get("content") or {}
        if isinstance(c, str):
            import json

            try:
                c = json.loads(c)
            except json.JSONDecodeError:
                c = {}
        if mt == "data":
            for e in c.get("entities") or []:
                n = e.get("name")
                if n:
                    names.add(str(n))
        if mt in ("behavior", "rule"):
            et = c.get("entityType")
            if et:
                names.add(str(et))
    return sorted(names)
