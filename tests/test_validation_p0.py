def test_mvp002_contract_crud_and_submit_flow(client):
    create_resp = client.post(
        "/api/contracts",
        json={"id": "P0-001", "contract_no": "HT-P0-001", "title": "P0 Contract", "counterparty": "Acme", "amount": 128.0},
    )
    assert create_resp.status_code == 201

    list_resp = client.get("/api/contracts")
    assert list_resp.status_code == 200
    assert list_resp.get_json()["total"] == 1

    detail_resp = client.get("/api/contracts/P0-001")
    assert detail_resp.status_code == 200
    assert detail_resp.get_json()["item"]["contract_no"] == "HT-P0-001"

    update_resp = client.put("/api/contracts/P0-001", json={"title": "P0 Contract Updated", "amount": 256.0})
    assert update_resp.status_code == 200
    assert update_resp.get_json()["item"]["amount"] == 256.0

    submit_resp = client.post("/api/contracts/P0-001/submit", json={"status": "pending_approval"})
    assert submit_resp.status_code == 200
    submit_body = submit_resp.get_json()
    assert submit_body["item"]["status"] == "pending_approval"