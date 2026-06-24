def test_entities_grouped_by_domain(client):
    # Create domains
    d1 = client.post('/api/domains', json={'name': '销售', 'description': 'Sales'})
    d2 = client.post('/api/domains', json={'name': '制造业', 'description': 'Mfg'})
    domain1_id = d1.get_json()['id']
    domain2_id = d2.get_json()['id']

    # Create structural models with domain info
    client.post('/api/meta-models/definitions', json={
        'model_type': 'structural', 'name': 'lead', 'version': '1.0.0',
        'content': {
            'entities': [{'id': 'lead', 'name': 'Lead'}],
            'entityName': 'Lead', 'domainId': domain1_id,
            'subDomain': 'Marketing to Leads', 'scenario': '展会获客跟进'
        }
    })
    client.post('/api/meta-models/definitions', json={
        'model_type': 'structural', 'name': 'customer', 'version': '1.0.0',
        'content': {
            'entities': [{'id': 'customer', 'name': 'Customer'}],
            'entityName': 'Customer', 'domainId': domain1_id,
            'subDomain': 'Marketing to Leads', 'scenario': '展会获客跟进'
        }
    })
    client.post('/api/meta-models/definitions', json={
        'model_type': 'structural', 'name': 'equipment', 'version': '1.0.0',
        'content': {
            'entities': [{'id': 'equipment', 'name': 'Equipment'}],
            'entityName': 'Equipment', 'domainId': domain2_id,
            'subDomain': '设备管理', 'scenario': '设备监控'
        }
    })

    r = client.get('/api/entities/grouped')
    assert r.status_code == 200
    data = r.get_json()

    assert len(data) == 2  # 2 domains

    # Domain 1: 销售
    sales = next(d for d in data if d['domainName'] == '销售')
    assert len(sales['subDomains']) == 1
    mtl = sales['subDomains'][0]
    assert mtl['name'] == 'Marketing to Leads'
    assert len(mtl['scenarios']) == 1
    exh = mtl['scenarios'][0]
    assert exh['name'] == '展会获客跟进'
    assert len(exh['entities']) == 2

    # Domain 2: 制造业
    mfg = next(d for d in data if d['domainName'] == '制造业')
    assert len(mfg['subDomains']) == 1
    assert mfg['subDomains'][0]['scenarios'][0]['entities'][0]['name'] == 'Equipment'
