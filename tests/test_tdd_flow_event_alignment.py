def login(plain_client, username, password):
    response = plain_client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_tdd_operator_can_write_customer_but_not_employee(plain_client):
    """TDD-ENTITY-01: operator entity boundary must allow customer write and deny employee write."""
    operator_headers = login(plain_client, "operator", "operator123")

    customer_resp = plain_client.post(
        "/api/entities/customer",
        headers=operator_headers,
        json={"id": "TDD-CUS-OP-01", "customer_no": "TDD-CUS-OP-01", "name": "Operator Allowed"},
    )
    assert customer_resp.status_code == 201

    employee_resp = plain_client.post(
        "/api/entities/employee",
        headers=operator_headers,
        json={"id": "TDD-EMP-OP-01", "employee_no": "TDD-EMP-OP-01", "name": "Operator Denied"},
    )
    assert employee_resp.status_code == 403
    assert employee_resp.get_json()["error_code"] == "P4031"
