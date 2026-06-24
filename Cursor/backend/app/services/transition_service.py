"""B-007: validate_and_transition unified entry."""

from __future__ import annotations

import json
from typing import Any

from app.extensions import db
from app.models.runtime import DomainEntityState, StateTransitionLog
from app.services.audit_log_service import write_audit
from app.services.event_dispatcher import dispatch_event
from app.services.rule_evaluator import evaluate_rules_for_entity
from app.services.state_machine_executor import (
    find_sm_row,
    find_transition,
    initial_state,
    load_sm_json,
)


def validate_and_transition(
    *,
    entity_type: str,
    entity_id: str,
    action: str | None,
    payload: dict[str, Any],
    operator: str | None,
    trace_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> tuple[dict[str, Any], int]:
    """
    Three paths per LLD:
    - SM + rules: full transition
    - no SM: rules + data merge only (action may be None or 'save')
    """
    write_audit(
        module="domain",
        action="validate_and_transition",
        trace_id=trace_id,
        user_id=user_id,
        session_id=session_id,
        details={"entity_type": entity_type, "entity_id": entity_id, "action": action},
    )

    if operator == "blocked":
        write_audit(
            module="domain",
            action="permission_denied",
            error_code="P4031",
            trace_id=trace_id,
            user_id=user_id,
            session_id=session_id,
        )
        return {"ok": False, "error_code": "P4031"}, 403

    ok, violations = evaluate_rules_for_entity(
        entity_type,
        payload,
        entity_id=entity_id,
        trace_id=trace_id,
    )
    if not ok:
        write_audit(
            module="rule",
            action="evaluate",
            error_code="R4001",
            trace_id=trace_id,
            user_id=user_id,
            session_id=session_id,
            details={"violations": violations},
        )
        return {
            "ok": False,
            "error_code": "R4001",
            "violations": violations,
        }, 400

    sm_row = find_sm_row(entity_type)
    des = DomainEntityState.query.filter_by(
        entity_type=entity_type, entity_id=entity_id
    ).first()

    if not sm_row:
        merged = _merge_data(des, payload)
        if des:
            des.data_json = json.dumps(merged)
            des.updated_at = db.func.now()
        else:
            des = DomainEntityState(
                entity_type=entity_type,
                entity_id=entity_id,
                current_state="n/a",
                data_json=json.dumps(merged),
            )
            db.session.add(des)
        db.session.commit()
        return {
            "ok": True,
            "old_state": None,
            "new_state": None,
            "entity": {"id": entity_id, "data": merged},
        }, 200

    sm = load_sm_json(sm_row)
    current = des.current_state if des else initial_state(sm)
    act = action or "save"
    tr = find_transition(sm, current, act)
    if not tr:
        db.session.commit()
        write_audit(
            module="state_machine",
            action="illegal_transition",
            error_code="S4001",
            trace_id=trace_id,
            details={"from": current, "action": act},
        )
        return {
            "ok": False,
            "error_code": "S4001",
            "message": f"no transition from {current} with action {act}",
        }, 400

    new_state = tr.get("to")
    merged = _merge_data(des, payload)

    if des:
        des.current_state = new_state
        des.data_json = json.dumps(merged)
    else:
        des = DomainEntityState(
            entity_type=entity_type,
            entity_id=entity_id,
            current_state=new_state,
            data_json=json.dumps(merged),
        )
        db.session.add(des)

    db.session.add(
        StateTransitionLog(
            entity_id=entity_id,
            from_state=current,
            to_state=new_state,
            transition_id=str(tr.get("id") or ""),
            operator=operator,
            trace_id=trace_id,
        )
    )
    db.session.commit()

    for ev in tr.get("emit") or []:
        et = ev if isinstance(ev, str) else ev.get("type")
        if et:
            dispatch_event(
                et,
                {"entity_type": entity_type, "entity_id": entity_id, "payload": merged},
                trace_id=trace_id,
                user_id=user_id,
                session_id=session_id,
            )

    return {
        "ok": True,
        "old_state": current,
        "new_state": new_state,
        "event_list": tr.get("emit") or [],
        "entity": {"id": entity_id, "state": new_state, "data": merged},
    }, 200


def _merge_data(
    des: DomainEntityState | None, payload: dict[str, Any]
) -> dict[str, Any]:
    base: dict[str, Any] = {}
    if des and des.data_json:
        try:
            base = json.loads(des.data_json)
        except json.JSONDecodeError:
            base = {}
    out = {**base, **payload}
    return out
