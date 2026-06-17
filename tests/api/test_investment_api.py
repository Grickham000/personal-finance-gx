import pytest
import requests
import json

def test_get_investments_unauthorized(base_url):
    url = f"{base_url}/investments"
    response = requests.get(url)
    assert response.status_code in [400, 401]

def test_create_get_update_delete_investments(base_url, auth_headers):
    # 1. Create an investment
    create_url = f"{base_url}/investments"
    payload = {
        "name": "Integration T-Bill",
        "interest_rate": 5.25,
        "amount": 10000.0,
        "has_end_date": True,
        "end_date": "2026-12-01T12:00:00Z",
        "is_released": False,
        "description": "Government bonds"
    }
    create_response = requests.post(create_url, json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    
    res_data = create_response.json()
    investment_id = res_data.get("id")
    assert investment_id is not None
    assert "Investment created successfully" in res_data.get("message", "")

    # 2. Get the investments and verify the new one is listed
    get_url = f"{base_url}/investments"
    get_response = requests.get(get_url, headers=auth_headers)
    assert get_response.status_code == 200
    
    investments = get_response.json()
    assert isinstance(investments, list)
    
    created_inv = next((i for i in investments if i.get("id") == investment_id), None)
    assert created_inv is not None
    assert created_inv["name"] == "Integration T-Bill"
    assert created_inv["interest_rate"] == 5.25
    assert created_inv["amount"] == 10000.0
    assert created_inv["has_end_date"] is True
    # The return format of the date string matches the DAO formatting pattern
    assert "2026-12-01" in created_inv["end_date"]

    # 3. Get the investment by ID
    get_by_id_url = f"{base_url}/investments/{investment_id}"
    get_by_id_response = requests.get(get_by_id_url, headers=auth_headers)
    assert get_by_id_response.status_code == 200
    inv_by_id = get_by_id_response.json()
    assert inv_by_id["name"] == "Integration T-Bill"

    # 4. Get investments with filters
    # First, test filter matching our investment (has_end_date=true & is_released=false)
    filtered_get_url1 = f"{base_url}/investments?has_end_date=true&is_released=false"
    filtered_get_response1 = requests.get(filtered_get_url1, headers=auth_headers)
    assert filtered_get_response1.status_code == 200
    res_list1 = filtered_get_response1.json()
    assert any(i.get("id") == investment_id for i in res_list1)

    # Next, test filter excluding our investment (has_end_date=true & is_released=true)
    filtered_get_url2 = f"{base_url}/investments?has_end_date=true&is_released=true"
    filtered_get_response2 = requests.get(filtered_get_url2, headers=auth_headers)
    assert filtered_get_response2.status_code == 200
    res_list2 = filtered_get_response2.json()
    assert not any(i.get("id") == investment_id for i in res_list2)

    # 5. Update the investment
    update_url = f"{base_url}/investments/{investment_id}"
    update_payload = payload.copy()
    update_payload["name"] = "Integration T-Bill Updated"
    update_payload["interest_rate"] = 5.30
    update_payload["is_released"] = True
    
    update_response = requests.put(update_url, json=update_payload, headers=auth_headers)
    assert update_response.status_code == 200
    
    # Verify the update is saved
    get_by_id_response2 = requests.get(get_by_id_url, headers=auth_headers)
    assert get_by_id_response2.status_code == 200
    updated_inv = get_by_id_response2.json()
    assert updated_inv["name"] == "Integration T-Bill Updated"
    assert updated_inv["interest_rate"] == 5.30
    assert updated_inv["is_released"] is True

    # 6. Delete the investment
    delete_url = f"{base_url}/investments/{investment_id}"
    delete_response = requests.delete(delete_url, headers=auth_headers)
    assert delete_response.status_code == 200
    
    # Verify it is deleted (GET by ID returns 404)
    get_deleted_response = requests.get(get_by_id_url, headers=auth_headers)
    assert get_deleted_response.status_code == 404
