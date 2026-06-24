def test_full_5dim_create_publish_export(client):
    dims_data = {
        'structural': {'entities': [{'id':'lead','attributes':[{'id':'source','type':'string'}]}]},
        'behavioral': {'actions': [{'id':'score_lead','name':'评分'}]},
        'rules': {'validations': [{'id':'v1','type':'field_validation','entity':'lead','field':'source'}]},
        'events': {'event_types': [{'id':'lead_created','severity':'info'}]},
        'interfaces': {'apis': [{'id':'api1','url':'http://x','method':'GET'}]},
    }
    ids = []
    for dim, content in dims_data.items():
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'e2e_{dim}', 'version': '1.0.0', 'content': content
        })
        assert r.status_code == 201
        ids.append(r.get_json()['id'])
    pub = client.post('/api/meta-models/publish', json={
        'release_no': 'e2e-v1', 'model_ids': ids, 'operator': 'e2e'
    })
    assert pub.status_code == 201
    export = client.get('/api/export/json/e2e-v1')
    assert export.status_code == 200
    data = export.get_json()
    for dim in ['structural','behavioral','rules','events','interfaces']:
        assert dim in data
    assert data['structural']['entities'][0]['id'] == 'lead'
