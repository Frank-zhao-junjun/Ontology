"""State transition lookup and validation."""

from __future__ import annotations

import json
from typing import Any

from app.models.runtime import StateMachineRuntimeIndex


def find_sm_row(entity_type: str) -> StateMachineRuntimeIndex | None:
    return StateMachineRuntimeIndex.query.filter_by(entity_type=entity_type).first()


def find_transition(
    sm_content: dict[str, Any], current_state: str, action: str
) -> dict[str, Any] | None:
    for t in sm_content.get("transitions") or []:
        if (
            t.get("from") == current_state
            and (t.get("action") or t.get("trigger")) == action
        ):
            return t
    return None


def initial_state(sm_content: dict[str, Any]) -> str:
    states = sm_content.get("states") or []
    if not states:
        return "draft"
    init = sm_content.get("initialState") or sm_content.get("initial_state")
    if init:
        return str(init)
    return str(states[0]) if isinstance(states[0], str) else str(states[0].get("name", "draft"))


def load_sm_json(row: StateMachineRuntimeIndex) -> dict[str, Any]:
    return json.loads(row.sm_json)
