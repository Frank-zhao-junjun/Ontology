from flask import Blueprint, jsonify, request
from .auth import require_auth
from .extensions import db
from .models import MetaModelDefinition

bp_epc = Blueprint('epc', __name__, url_prefix='/api/epc')


@bp_epc.post('/processes')
@require_auth()
def create_epc():
    p = request.get_json(force=True)
    m = MetaModelDefinition(model_type='epc', name=p['name'], version='1.0.0',
        content_json={'steps': p.get('steps',[]), 'scenario': p.get('scenario','')},
        status='draft')
    db.session.add(m); db.session.commit()
    return jsonify({'id': m.id, 'name': m.name, 'steps': p.get('steps',[])}), 201


@bp_epc.get('/processes')
@require_auth()
def list_epc():
    rows = MetaModelDefinition.query.filter_by(model_type='epc').all()
    return jsonify({'items': [{'id': r.id, 'name': r.name, 'content': r.content_json} for r in rows]})


@bp_epc.put('/processes/<int:process_id>')
@require_auth()
def update_epc(process_id: int):
    m = db.session.get(MetaModelDefinition, process_id)
    if not m or m.model_type != 'epc':
        return jsonify({'error': 'not found'}), 404
    p = request.get_json(force=True)
    if 'name' in p:
        m.name = p['name']
    if 'steps' in p or 'scenario' in p:
        c = dict(m.content_json or {})
        if 'steps' in p:
            c['steps'] = p['steps']
        if 'scenario' in p:
            c['scenario'] = p['scenario']
        m.content_json = c
    db.session.commit()
    return jsonify({'id': m.id, 'name': m.name, 'content': m.content_json})


@bp_epc.delete('/processes/<int:process_id>')
@require_auth()
def delete_epc(process_id: int):
    m = db.session.get(MetaModelDefinition, process_id)
    if not m or m.model_type != 'epc':
        return jsonify({'error': 'not found'}), 404
    db.session.delete(m)
    db.session.commit()
    return jsonify({'deleted': process_id})
