import pytest
import requests

def test_get_user_profile_unauthorized(base_url):
    url = f"{base_url}/user_profile"
    response = requests.get(url)
    assert response.status_code in [400, 401]

def test_create_and_manage_user_profile(base_url, auth_headers):
    # 1. Create a user profile
    create_url = f"{base_url}/user_profile"
    payload = {
        "user_name": "API Test User",
        "expense_types": ["food", "transport", "utilities"],
        "payment_methods": [
            {"name": "cc1", "cut_date": 16, "is_immediate": False, "days_to_pay": 20},
            {"name": "cc2", "cut_date": 25, "is_immediate": False, "days_to_pay": 10}
        ],
        "monthly_income": 6000.00
    }
    create_response = requests.post(create_url, json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    
    # Extract ID
    response_json = create_response.json()
    profile_id = response_json.get("id")
    assert profile_id is not None

    # 2. Get the user profile and verify
    get_url = f"{base_url}/user_profile"
    get_response = requests.get(get_url, headers=auth_headers)
    assert get_response.status_code == 200
    
    profile = get_response.json()
    assert profile["id"] == profile_id
    assert profile["user_name"] == "API Test User"
    assert len(profile["expense_types"]) == 3
    assert profile["monthly_income"] == 6000.00

    # 3. Update the user profile
    update_url = f"{base_url}/user_profile/{profile_id}"
    update_payload = payload.copy()
    update_payload["user_name"] = "API Test User Updated"
    update_payload["monthly_income"] = 7000.00
    
    update_response = requests.put(update_url, json=update_payload, headers=auth_headers)
    assert update_response.status_code == 200

    # 4. Verify the update
    get_response_updated = requests.get(get_url, headers=auth_headers)
    profile_updated = get_response_updated.json()
    assert profile_updated["user_name"] == "API Test User Updated"
    assert profile_updated["monthly_income"] == 7000.00

    # 5. Delete the user profile
    delete_url = f"{base_url}/user_profile/{profile_id}"
    delete_response = requests.delete(delete_url, headers=auth_headers)
    assert delete_response.status_code == 200
