from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from .api_response import error_response, resolve_trace_id
from .auth import ensure_entity_permission, require_auth
from .extensions import db
from .models import ContractRecord


bp_contracts = Blueprint("contracts", __name__, url_prefix="/api/contracts")


def _load_contract_or_404(contract_id: str, trace_id: str):
    contract = db.session.get(ContractRecord, contract_id)
    if contract is None:
        return None, error_response(
            code="C4041",
            message="contract not found",
            status=404,
            trace_id=trace_id,
            details={"contract_id": contract_id},
        )
    return contract, None


@bp_contracts.get("")
@require_auth()
def list_contracts():
    denied = ensure_entity_permission(g.current_user, "contract", "read", g.trace_id)
    if denied:
        return denied
    rows = ContractRecord.query.order_by(ContractRecord.created_at.desc()).all()
    return jsonify({"items": [row.to_dict() for row in rows], "total": len(rows)})


@bp_contracts.post("")
@require_auth()
def create_contract():
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_entity_permission(g.current_user, "contract", "write", trace_id)
    if denied:
        return denied
    contract_id = payload.get("id")
    contract_no = payload.get("contract_no")
    if not contract_id or not contract_no:
        return error_response(
            code="C4001",
            message="id and contract_no are required",
            status=400,
            trace_id=trace_id,
        )

    if db.session.get(ContractRecord, contract_id) is not None:
        return error_response(
            code="C4091",
            message="contract id already exists",
            status=409,
            trace_id=trace_id,
            details={"contract_id": contract_id},
        )

    contract = ContractRecord(
        id=contract_id,
        contract_no=contract_no,
        title=payload.get("title"),
        counterparty=payload.get("counterparty"),
        amount=payload.get("amount"),
        status=payload.get("status", "draft"),
    )
    db.session.add(contract)
    db.session.commit()
    return jsonify({"item": contract.to_dict(), "trace_id": trace_id}), 201


@bp_contracts.get("/<contract_id>")
@require_auth()
def get_contract(contract_id: str):
    trace_id = resolve_trace_id()
    denied = ensure_entity_permission(g.current_user, "contract", "read", trace_id)
    if denied:
        return denied
    contract, error = _load_contract_or_404(contract_id, trace_id)
    if error:
        return error
    return jsonify({"item": contract.to_dict(), "trace_id": trace_id})


@bp_contracts.put("/<contract_id>")
@require_auth()
def update_contract(contract_id: str):
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_entity_permission(g.current_user, "contract", "write", trace_id)
    if denied:
        return denied
    contract, error = _load_contract_or_404(contract_id, trace_id)
    if error:
        return error

    for field in ["contract_no", "title", "counterparty", "amount"]:
        if field in payload:
            setattr(contract, field, payload.get(field))
    db.session.commit()
    return jsonify({"item": contract.to_dict(), "trace_id": trace_id})


@bp_contracts.post("/<contract_id>/submit")
@require_auth()
def submit_contract(contract_id: str):
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_entity_permission(g.current_user, "contract", "write", trace_id)
    if denied:
        return denied
    contract, error = _load_contract_or_404(contract_id, trace_id)
    if error:
        return error

    new_status = payload.get("status", "pending_approval")
    contract.status = new_status
    db.session.commit()
    return jsonify({"item": contract.to_dict(), "trace_id": trace_id})