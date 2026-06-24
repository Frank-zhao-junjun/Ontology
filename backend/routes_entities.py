from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from .api_response import error_response, resolve_trace_id
from .auth import ensure_entity_permission, require_auth
from .extensions import db
from .models import CustomerRecord, EmployeeRecord, InvoiceRecord, ProductRecord


bp_entities = Blueprint("entities", __name__, url_prefix="/api/entities")


ENTITY_CONFIG = {
    "customer": {
        "model": CustomerRecord,
        "required": ["id", "customer_no", "name"],
        "fields": ["customer_no", "name", "industry", "status"],
    },
    "employee": {
        "model": EmployeeRecord,
        "required": ["id", "employee_no", "name"],
        "fields": ["employee_no", "name", "department", "job_title", "status"],
    },
    "product": {
        "model": ProductRecord,
        "required": ["id", "product_no", "name"],
        "fields": ["product_no", "name", "category", "price", "status"],
    },
    "invoice": {
        "model": InvoiceRecord,
        "required": ["id", "invoice_no", "customer_id"],
        "fields": ["invoice_no", "customer_id", "contract_id", "amount", "status"],
    },
}


def _entity_config(entity_type: str):
    return ENTITY_CONFIG.get(entity_type)


def _resolve_entity_or_error(entity_type: str, trace_id: str):
    config = _entity_config(entity_type)
    if config is None:
        return None, error_response(code="C4042", message="entity type not supported", status=404, trace_id=trace_id)
    return config, None


def _load_record(config: dict, record_id: str, trace_id: str, entity_type: str):
    record = db.session.get(config["model"], record_id)
    if record is None:
        return None, error_response(
            code="C4041",
            message=f"{entity_type} record not found",
            status=404,
            trace_id=trace_id,
            details={"entity_type": entity_type, "record_id": record_id},
        )
    return record, None


@bp_entities.get("/grouped")
@require_auth()
def list_entities_grouped():
    from .models import MetaModelDefinition, Domain

    models = MetaModelDefinition.query.filter_by(model_type="structural").all()
    domains = {d.id: d.name for d in Domain.query.all()}

    # Build: domain → subDomain → scenario → entities
    tree: dict[int, dict[str, dict[str, list[dict]]]] = {}
    for m in models:
        c = m.content_json or {}
        did = c.get("domainId")
        if not did or did not in domains:
            continue
        sd = c.get("subDomain", "默认子域")
        sc = c.get("scenario", "默认场景")
        ent = c.get("entities", [])
        if not ent:
            continue
        entity_name = c.get("entityName", ent[0].get("name", m.name))

        tree.setdefault(did, {}).setdefault(sd, {}).setdefault(sc, []).append({
            "id": ent[0].get("id", m.name),
            "name": entity_name,
            "dimsConfirmed": 0,
        })

    result = []
    for did, subdoms in tree.items():
        sd_list = []
        for sname, scenarios in subdoms.items():
            sc_list = []
            for cname, entities in scenarios.items():
                sc_list.append({"name": cname, "entities": entities})
            sd_list.append({"name": sname, "scenarios": sc_list})
        result.append({"domainId": did, "domainName": domains[did], "subDomains": sd_list})

    return jsonify(result)


@bp_entities.get("/<entity_type>")
@require_auth()
def list_entities(entity_type: str):
    trace_id = g.trace_id
    denied = ensure_entity_permission(g.current_user, entity_type, "read", trace_id)
    if denied:
        return denied
    config, error = _resolve_entity_or_error(entity_type, trace_id)
    if error:
        return error
    rows = config["model"].query.order_by(config["model"].created_at.desc()).all()
    return jsonify({"items": [row.to_dict() for row in rows], "total": len(rows), "entity_type": entity_type})


@bp_entities.post("/<entity_type>")
@require_auth()
def create_entity(entity_type: str):
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_entity_permission(g.current_user, entity_type, "write", trace_id)
    if denied:
        return denied
    config, error = _resolve_entity_or_error(entity_type, trace_id)
    if error:
        return error

    for field in config["required"]:
        if payload.get(field) in (None, ""):
            return error_response(code="C4001", message=f"{field} is required", status=400, trace_id=trace_id)

    if db.session.get(config["model"], payload["id"]) is not None:
        return error_response(code="C4091", message="entity id already exists", status=409, trace_id=trace_id)

    record = config["model"](**{field: payload.get(field) for field in ["id", *config["fields"]]})
    db.session.add(record)
    db.session.commit()
    return jsonify({"item": record.to_dict(), "entity_type": entity_type, "trace_id": trace_id}), 201


@bp_entities.get("/<entity_type>/<record_id>")
@require_auth()
def get_entity(entity_type: str, record_id: str):
    trace_id = g.trace_id
    denied = ensure_entity_permission(g.current_user, entity_type, "read", trace_id)
    if denied:
        return denied
    config, error = _resolve_entity_or_error(entity_type, trace_id)
    if error:
        return error
    record, error = _load_record(config, record_id, trace_id, entity_type)
    if error:
        return error
    return jsonify({"item": record.to_dict(), "entity_type": entity_type, "trace_id": trace_id})


@bp_entities.put("/<entity_type>/<record_id>")
@require_auth()
def update_entity(entity_type: str, record_id: str):
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    denied = ensure_entity_permission(g.current_user, entity_type, "write", trace_id)
    if denied:
        return denied
    config, error = _resolve_entity_or_error(entity_type, trace_id)
    if error:
        return error
    record, error = _load_record(config, record_id, trace_id, entity_type)
    if error:
        return error

    for field in config["fields"]:
        if field in payload:
            setattr(record, field, payload.get(field))
    db.session.commit()
    return jsonify({"item": record.to_dict(), "entity_type": entity_type, "trace_id": trace_id})