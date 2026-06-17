import pytest
import requests
import json

def test_get_savings_unauthorized(base_url):
    url = f"{base_url}/savings_accounts"
    response = requests.get(url)
    assert response.status_code in [400, 401]

def test_create_get_update_delete_savings(base_url, auth_headers):
    # 1. Create a savings account
    create_url = f"{base_url}/savings_accounts"
    payload = {
        "name": "Integration Savings Account",
        "interest_rate": 3.75,
        "balance": 5000.0,
        "description": "Short-term goal savings"
    }
    create_response = requests.post(create_url, json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    
    res_data = create_response.json()
    account_id = res_data.get("id")
    assert account_id is not None
    assert "Savings account created successfully" in res_data.get("message", "")

    # 2. Get the savings accounts and verify the new one is listed
    get_url = f"{base_url}/savings_accounts"
    get_response = requests.get(get_url, headers=auth_headers)
    assert get_response.status_code == 200
    
    accounts = get_response.json()
    assert isinstance(accounts, list)
    
    created_account = next((a for a in accounts if a.get("id") == account_id), None)
    assert created_account is not None
    assert created_account["name"] == "Integration Savings Account"
    assert created_account["interest_rate"] == 3.75
    assert created_account["balance"] == 5000.0

    # 3. Get the savings account by ID
    get_by_id_url = f"{base_url}/savings_accounts/{account_id}"
    get_by_id_response = requests.get(get_by_id_url, headers=auth_headers)
    assert get_by_id_response.status_code == 200
    account_by_id = get_by_id_response.json()
    assert account_by_id["name"] == "Integration Savings Account"

    # 4. Update the savings account
    update_url = f"{base_url}/savings_accounts/{account_id}"
    update_payload = payload.copy()
    update_payload["name"] = "Integration Savings Account Updated"
    update_payload["interest_rate"] = 4.0
    update_payload["balance"] = 5500.0
    
    update_response = requests.put(update_url, json=update_payload, headers=auth_headers)
    assert update_response.status_code == 200
    
    # Verify the update is saved
    get_by_id_response2 = requests.get(get_by_id_url, headers=auth_headers)
    assert get_by_id_response2.status_code == 200
    updated_account = get_by_id_response2.json()
    assert updated_account["name"] == "Integration Savings Account Updated"
    assert updated_account["interest_rate"] == 4.0
    assert updated_account["balance"] == 5500.0

    # 5. Delete the savings account
    delete_url = f"{base_url}/savings_accounts/{account_id}"
    delete_response = requests.delete(delete_url, headers=auth_headers)
    assert delete_response.status_code == 200
    
    # Verify it is deleted (GET by ID returns 404)
    get_deleted_response = requests.get(get_by_id_url, headers=auth_headers)
    assert get_deleted_response.status_code == 404
