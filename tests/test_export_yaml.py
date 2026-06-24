def test_export_yaml(client):
    ids = []
    for dim in ['structural','behavioral']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'yaml_{dim}', 'version': '1.0.0',
            'content': {dim: True}
        })
        ids.append(r.get_json()['id'])
    client.post('/api/meta-models/publish', json={
        'release_no': 'yaml-v1', 'model_ids': ids, 'operator': 't'
    })
    r = client.get('/api/export/yaml/yaml-v1')
    assert r.status_code == 200
    data = r.get_data(as_text=True)
    assert 'version: yaml-v1' in data
    assert 'structural:' in data
    assert 'behavioral:' in data
