def test_export_json(client):
    ids = []
    for dim in ['structural','behavioral','rules','events','interfaces']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'exp_{dim}', 'version': '1.0.0',
            'content': {dim: True}
        })
        ids.append(r.get_json()['id'])
    client.post('/api/meta-models/publish', json={
        'release_no': 'exp-v1', 'model_ids': ids, 'operator': 't'
    })
    r = client.get('/api/export/json/exp-v1')
    assert r.status_code == 200
    assert 'structural' in r.get_json()
