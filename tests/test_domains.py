def test_create_and_list_domains(client):
    r = client.post('/api/domains', json={'name': '销售', 'description': 'Sales domain'})
    assert r.status_code == 201
    assert r.get_json()['name'] == '销售'

    r2 = client.post('/api/domains', json={'name': '制造业', 'description': 'Manufacturing'})
    assert r2.status_code == 201

    r3 = client.get('/api/domains')
    assert r3.status_code == 200
    items = r3.get_json()['items']
    assert len(items) == 2

def test_create_domain_duplicate_name(client):
    client.post('/api/domains', json={'name': '客服', 'description': 'CS'})
    r = client.post('/api/domains', json={'name': '客服', 'description': 'dup'})
    assert r.status_code == 409
