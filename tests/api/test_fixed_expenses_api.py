import pytest
import requests

def test_get_fixed_expenses_unauthorized(base_url):
    url = f"{base_url}/fixed_expenses"
    response = requests.get(url)
    assert response.status_code in [400, 401]

def test_create_and_get_fixed_expense(base_url, auth_headers):
    # 1. Create a fixed expense
    create_url = f"{base_url}/fixed_expenses"
    payload = {
        "fixed_expense": 1000.00,
        "fexpense_type": "housing",
        "fexpense_start_date": "2023-01-01T00:00:00Z",
        "fexpense_end_date": "2023-12-31T00:00:00Z",
        "fexpense_description": "Rent",
        "expire": False
    }
    create_response = requests.post(create_url, json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    
    response_text = create_response.text
    fixed_expense_id = response_text.split("ID: ")[1] if "ID: " in response_text else None
    assert fixed_expense_id is not None

    # 2. Get the fixed expenses and verify
    get_url = f"{base_url}/fixed_expenses"
    get_response = requests.get(get_url, headers=auth_headers)
    assert get_response.status_code == 200
    
    fixed_expenses = get_response.json()
    assert isinstance(fixed_expenses, list)
    
    created_fexpense = next((e for e in fixed_expenses if e.get("id") == fixed_expense_id), None)
    assert created_fexpense is not None
    assert created_fexpense["fixed_expense"] == 1000.00

    # 3. Update the fixed expense
    update_url = f"{base_url}/fixed_expenses/{fixed_expense_id}"
    update_payload = payload.copy()
    update_payload["fixed_expense"] = 1050.00
    update_response = requests.put(update_url, json=update_payload, headers=auth_headers)
    assert update_response.status_code == 200

    # 4. Delete the fixed expense
    delete_url = f"{base_url}/fixed_expenses/{fixed_expense_id}"
    delete_response = requests.delete(delete_url, headers=auth_headers)
    assert delete_response.status_code in [200, 204, 404]
