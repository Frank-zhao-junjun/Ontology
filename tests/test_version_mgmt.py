def test_version_list_and_changelog(client):
    # Create models and publish 2 releases
    ids_v1 = []
    for dim in ['structural', 'behavioral']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'ver_{dim}_v1', 'version': '1.0.0',
            'content': {dim: 'v1'}
        })
        ids_v1.append(r.get_json()['id'])

    pub1 = client.post('/api/meta-models/publish', json={
        'release_no': 'ver-1.0.0', 'model_ids': ids_v1, 'operator': 'tester'
    })
    assert pub1.status_code == 201

    # Second release
    ids_v2 = []
    for dim in ['structural', 'rules']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'ver_{dim}_v2', 'version': '1.1.0',
            'content': {dim: 'v2'}
        })
        ids_v2.append(r.get_json()['id'])

    pub2 = client.post('/api/meta-models/publish', json={
        'release_no': 'ver-1.1.0', 'model_ids': ids_v2, 'operator': 'tester'
    })
    assert pub2.status_code == 201

    # List versions
    r = client.get('/api/versions')
    assert r.status_code == 200
    items = r.get_json()['items']
    assert len(items) >= 2
    assert items[0]['release_no'] == 'ver-1.1.0'  # newest first

    # Changelog
    cl = client.get('/api/versions/ver-1.1.0/changelog')
    assert cl.status_code == 200
    log = cl.get_json()
    assert log['release_no'] == 'ver-1.1.0'
    assert len(log['models']) >= 2


def test_version_diff(client):
    ids1 = []
    for dim in ['structural', 'behavioral']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'diff_{dim}_v1', 'version': '1.0.0',
            'content': {dim: 'a'}
        })
        ids1.append(r.get_json()['id'])
    client.post('/api/meta-models/publish', json={
        'release_no': 'diff-v1', 'model_ids': ids1, 'operator': 't'
    })

    ids2 = []
    for dim in ['structural', 'rules']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'diff_{dim}_v2', 'version': '1.1.0',
            'content': {dim: 'b'}
        })
        ids2.append(r.get_json()['id'])
    client.post('/api/meta-models/publish', json={
        'release_no': 'diff-v2', 'model_ids': ids2, 'operator': 't'
    })

    r = client.get('/api/versions/diff?from=diff-v1&to=diff-v2')
    assert r.status_code == 200
    data = r.get_json()
    assert 'added' in data
    assert 'removed' in data
    assert len(data['added']) >= 1
    assert len(data['removed']) >= 1
