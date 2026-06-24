def test_accepts_all_five_dims(client):
    for dim in ['structural', 'behavioral', 'rules', 'events', 'interfaces']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'test_{dim}', 'version': '1.0.0', 'content': {}
        })
        assert r.status_code == 201
