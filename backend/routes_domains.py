from flask import Blueprint, jsonify, request
from .auth import require_auth
from .extensions import db
from .models import Domain

bp_domains = Blueprint('domains', __name__, url_prefix='/api/domains')

@bp_domains.post('')
@require_auth()
def create_domain():
    p = request.get_json(force=True)
    name = p.get('name', '')
    if not name:
        return jsonify({'error': 'name required'}), 400
    if Domain.query.filter_by(name=name).first():
        return jsonify({'error': 'domain name exists'}), 409
    d = Domain(name=name, description=p.get('description', ''), tags=p.get('tags', ''))
    db.session.add(d)
    db.session.commit()
    return jsonify({'id': d.id, 'name': d.name, 'description': d.description, 'tags': d.tags}), 201

@bp_domains.get('')
@require_auth()
def list_domains():
    rows = Domain.query.order_by(Domain.id.asc()).all()
    return jsonify({'items': [{'id': r.id, 'name': r.name, 'description': r.description, 'tags': r.tags} for r in rows]})
