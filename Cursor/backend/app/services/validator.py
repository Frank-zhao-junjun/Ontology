from __future__ import annotations

import json
from typing import Any

MODEL_TYPES = frozenset({"data", "behavior", "rule", "process", "event"})


def _parse_content(content: Any) -> dict | None:
    if isinstance(content, dict):
        return content
    if isinstance(content, str):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None
    return None


def validate_structure(model_type: str, content: Any) -> tuple[bool, list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if model_type not in MODEL_TYPES:
        errors.append(f"invalid model_type: {model_type}")
        return False, errors, warnings

    body = _parse_content(content)
    if body is None:
        errors.append("content must be JSON object")
        return False, errors, warnings

    if model_type == "data":
        if "entities" not in body or not isinstance(body["entities"], list):
            errors.append('data model requires "entities" array')
        else:
            for i, ent in enumerate(body["entities"]):
                if not isinstance(ent, dict) or "name" not in ent:
                    errors.append(f"entities[{i}] must have name")
    elif model_type == "behavior":
        for key in ("entityType", "states", "transitions"):
            if key not in body:
                errors.append(f'behavior model requires "{key}"')
    elif model_type == "rule":
        if "entityType" not in body:
            errors.append('rule model requires "entityType"')
        if "rules" not in body or not isinstance(body["rules"], list):
            errors.append('rule model requires "rules" array')
    elif model_type == "process":
        if "steps" not in body or not isinstance(body["steps"], list):
            errors.append('process model requires "steps" array')
    elif model_type == "event":
        if "events" not in body or not isinstance(body["events"], list):
            errors.append('event model requires "events" array')
        subs = body.get("subscriptions")
        if subs is not None:
            if not isinstance(subs, list):
                errors.append("subscriptions must be an array")
            else:
                for j, s in enumerate(subs):
                    if not isinstance(s, dict):
                        errors.append(f"subscriptions[{j}] must be object")
                    else:
                        tgt = s.get("targetSkill") or s.get("target_skill")
                        if not tgt or not isinstance(tgt, str):
                            errors.append(
                                f"subscriptions[{j}] requires targetSkill (non-empty string)"
                            )

    return len(errors) == 0, errors, warnings


def collect_entity_names(data_contents: list[dict]) -> set[str]:
    names: set[str] = set()
    for c in data_contents:
        for ent in c.get("entities", []):
            if isinstance(ent, dict) and "name" in ent:
                names.add(str(ent["name"]))
    return names


def validate_consistency(definitions: list[tuple[str, dict]]) -> tuple[bool, list[str]]:
    """definitions: list of (model_type, content_dict)."""
    errors: list[str] = []
    data_contents = [c for t, c in definitions if t == "data"]
    entity_names = collect_entity_names(data_contents)

    for model_type, content in definitions:
        if model_type == "behavior":
            et = content.get("entityType")
            if et and entity_names and et not in entity_names:
                errors.append(f"behavior references unknown entityType: {et}")
        if model_type == "rule":
            et = content.get("entityType")
            if et and entity_names and et not in entity_names:
                errors.append(f"rule references unknown entityType: {et}")
        if model_type == "process":
            for i, step in enumerate(content.get("steps", [])):
                if isinstance(step, dict):
                    tr = step.get("toolRef") or step.get("tool_ref")
                    if tr is not None and not str(tr).strip():
                        errors.append(f"process.steps[{i}] has empty toolRef")

    return len(errors) == 0, errors
