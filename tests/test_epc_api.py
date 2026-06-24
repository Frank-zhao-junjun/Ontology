def test_create_epc_process(client):
    r = client.post('/api/epc/processes', json={
        'name': '线索分配流程', 'scenario': '展会获客',
        'steps': [{'event_trigger': 'lead_created', 'action': 'score_lead'}]
    })
    assert r.status_code == 201
