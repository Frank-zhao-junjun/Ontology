def test_export_xlsx(client):
    # Create 5 dims + EPC
    ids = []
    contents = {
        'structural': {'entities': [{'id':'lead','name':'Lead','attributes':[{'id':'source','type':'string'}]}]},
        'behavioral': {'actions': [{'id':'score','name':'评分'}], 'stateMachines': []},
        'rules': {'validations': [{'id':'v1','type':'field_validation','entity':'lead','field':'source'}]},
        'events': {'eventTypes': [{'id':'lead_created','severity':'info','source':'system'}]},
        'interfaces': {'apis': [{'id':'api1','url':'http://x','method':'GET'}]},
    }
    for dim, content in contents.items():
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'xlsx_{dim}', 'version': '1.0.0', 'content': content
        })
        assert r.status_code == 201
        ids.append(r.get_json()['id'])

    # EPC
    r = client.post('/api/epc/processes', json={
        'name': '线索分配', 'scenario': '展会获客',
        'steps': [{'event_trigger': 'lead_created', 'action': 'score_lead'}]
    })
    assert r.status_code == 201
    ids.append(r.get_json()['id'])

    client.post('/api/meta-models/publish', json={
        'release_no': 'xlsx-v1', 'model_ids': ids, 'operator': 't'
    })

    r = client.get('/api/export/xlsx/xlsx-v1')
    assert r.status_code == 200
    assert r.content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert len(r.data) > 100  # xlsx has content
