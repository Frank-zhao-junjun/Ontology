"""B-006: five rule kinds, blocking vs warning."""

from __future__ import annotations

import json
from typing import Any

from app.models.runtime import RuleRuntimeIndex

KIND_ORDER = (
    "field_level",
    "cross_field",
    "cross_entity",
    "aggregate",
    "temporal",
)


def _sort_key(row: RuleRuntimeIndex) -> tuple[int, int]:
    try:
        k = KIND_ORDER.index(row.kind)
    except ValueError:
        k = 99
    return (k, row.id)


def evaluate_rules_for_entity(
    entity_type: str,
    payload: dict[str, Any],
    *,
    entity_id: str | None = None,
    trace_id: str | None = None,
) -> tuple[bool, list[dict[str, Any]]]:
    """
    Returns (ok, violations). violations item: {rule_id, severity, message}.
    """
    rows = RuleRuntimeIndex.query.filter_by(
        entity_type=entity_type, is_active=True
    ).all()
    rows.sort(key=_sort_key)
    violations: list[dict[str, Any]] = []

    for row in rows:
        r = json.loads(row.rule_json)
        sev = (r.get("severity") or "blocking").lower()
        ok, msg = _eval_one(r, payload)
        if not ok:
            violations.append(
                {"rule_id": row.rule_id, "severity": sev, "message": msg or "rule failed"}
            )
            if sev == "blocking":
                return False, violations

    return True, []


def _eval_one(rule: dict[str, Any], payload: dict[str, Any]) -> tuple[bool, str | None]:
    kind = (rule.get("kind") or rule.get("type") or "field_level").lower()
    if kind == "field":
        kind = "field_level"

    if kind == "field_level":
        field = rule.get("field")
        op = (rule.get("op") or "positive").lower()
        if not field or field not in payload:
            return False, f"missing field {field}"
        v = payload[field]
        try:
            num = float(v)
        except (TypeError, ValueError):
            return False, f"{field} not numeric"
        if op == "positive" and num <= 0:
            return False, f"{field} must be positive"
        return True, None

    if kind == "cross_field":
        a = rule.get("left") or rule.get("fields", [None, None])[0]
        b = rule.get("right") or (
            rule.get("fields", [None, None])[1] if len(rule.get("fields") or []) > 1 else None
        )
        op = (rule.get("op") or "lt").lower()
        if not a or not b or a not in payload or b not in payload:
            return True, None  # skip if fields absent (optional cross-field)
        try:
            va, vb = float(payload[a]), float(payload[b])
        except (TypeError, ValueError):
            return False, "cross_field values not numeric"
        if op == "lt" and not (vb > va):
            return False, f"{b} must be greater than {a}"
        return True, None

    if kind in ("cross_entity", "aggregate", "temporal"):
        # MVP: no-op pass unless explicit fail flag
        if rule.get("fail"):
            return False, "stub cross_entity/aggregate/temporal failure"
        return True, None

    return True, None
