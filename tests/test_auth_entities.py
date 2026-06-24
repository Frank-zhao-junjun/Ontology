def login(plain_client, username, password):
    response = plain_client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_required_for_protected_routes(plain_client):
    response = plain_client.get("/api/contracts")
    assert response.status_code == 401
    assert response.get_json()["error_code"] == "U4011"


def test_login_and_me_endpoint(plain_client):
    headers = login(plain_client, "admin", "admin123")
    response = plain_client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["user"]["role"] == "admin"
    assert body["permissions"]["meta_admin"] is True


def test_viewer_cannot_write(plain_client):
    headers = login(plain_client, "viewer", "viewer123")
    create_resp = plain_client.post(
        "/api/contracts",
        headers=headers,
        json={"id": "AUTH-001", "contract_no": "HT-AUTH-001", "title": "Denied"},
    )
    assert create_resp.status_code == 403
    assert create_resp.get_json()["error_code"] == "P4031"


def test_multi_entity_crud_and_role_boundaries(plain_client):
    admin_headers = login(plain_client, "admin", "admin123")
    operator_headers = login(plain_client, "operator", "operator123")
    analyst_headers = login(plain_client, "analyst", "analyst123")

    customer_resp = plain_client.post(
        "/api/entities/customer",
        headers=operator_headers,
        json={"id": "CUS-100", "customer_no": "CU-100", "name": "Acme", "industry": "Retail"},
    )
    assert customer_resp.status_code == 201

    product_resp = plain_client.post(
        "/api/entities/product",
        headers=operator_headers,
        json={"id": "PRD-100", "product_no": "PD-100", "name": "License", "category": "Software", "price": 88.0},
    )
    assert product_resp.status_code == 201

    invoice_resp = plain_client.post(
        "/api/entities/invoice",
        headers=operator_headers,
        json={"id": "INV-100", "invoice_no": "IV-100", "customer_id": "CUS-100", "contract_id": "CT-100", "amount": 88.0},
    )
    assert invoice_resp.status_code == 201

    employee_denied = plain_client.post(
        "/api/entities/employee",
        headers=operator_headers,
        json={"id": "EMP-100", "employee_no": "EM-100", "name": "Alice", "department": "Sales", "job_title": "Lead"},
    )
    assert employee_denied.status_code == 403

    employee_admin = plain_client.post(
        "/api/entities/employee",
        headers=admin_headers,
        json={"id": "EMP-101", "employee_no": "EM-101", "name": "Bob", "department": "Ops", "job_title": "Manager"},
    )
    assert employee_admin.status_code == 201

    employee_read = plain_client.get("/api/entities/employee/EMP-101", headers=analyst_headers)
    assert employee_read.status_code == 200
    assert employee_read.get_json()["item"]["employee_no"] == "EM-101"

    customer_list = plain_client.get("/api/entities/customer", headers=analyst_headers)
    assert customer_list.status_code == 200
    assert customer_list.get_json()["total"] >= 1