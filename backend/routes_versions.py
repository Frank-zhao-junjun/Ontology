from flask import Blueprint, jsonify, request
from .auth import require_auth
from .models import MetaModelDefinition, MetaModelRelease, MetaModelReleaseItem

bp_versions = Blueprint('versions', __name__, url_prefix='/api/versions')


@bp_versions.get('')
@require_auth()
def list_versions():
    releases = MetaModelRelease.query.order_by(MetaModelRelease.released_at.desc(), MetaModelRelease.id.desc()).all()
    items = []
    for rel in releases:
        items.append({
            'release_no': rel.release_no,
            'status': rel.status,
            'released_by': rel.released_by,
            'released_at': rel.released_at.isoformat() if rel.released_at else None,
        })
    return jsonify({'items': items})


@bp_versions.get('/<release_no>/changelog')
@require_auth()
def changelog(release_no: str):
    rel = MetaModelRelease.query.filter_by(release_no=release_no).first()
    if not rel:
        return jsonify({'error': 'not found'}), 404
    items = MetaModelReleaseItem.query.filter_by(release_id=rel.id).all()
    ids = [i.model_definition_id for i in items]
    models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
    return jsonify({
        'release_no': release_no,
        'released_by': rel.released_by,
        'released_at': rel.released_at.isoformat() if rel.released_at else None,
        'models': [{'model_type': m.model_type, 'name': m.name, 'version': m.version} for m in models],
    })


@bp_versions.get('/diff')
@require_auth()
def diff_versions():
    from_rel_no = request.args.get('from', '')
    to_rel_no = request.args.get('to', '')
    if not from_rel_no or not to_rel_no:
        return jsonify({'error': 'from and to required'}), 400

    def _model_types(release_no: str):
        rel = MetaModelRelease.query.filter_by(release_no=release_no).first()
        if not rel:
            return set()
        items = MetaModelReleaseItem.query.filter_by(release_id=rel.id).all()
        ids = [i.model_definition_id for i in items]
        models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
        return {m.model_type for m in models}

    from_types = _model_types(from_rel_no)
    to_types = _model_types(to_rel_no)

    return jsonify({
        'from': from_rel_no,
        'to': to_rel_no,
        'added': sorted(list(to_types - from_types)),
        'removed': sorted(list(from_types - to_types)),
        'unchanged': sorted(list(from_types & to_types)),
    })
