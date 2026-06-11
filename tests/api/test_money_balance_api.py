import pytest
import requests

def test_money_balance_api_flow(base_url, auth_headers):
    # 1. Create a User Profile first
    profile_url = f"{base_url}/user_profile"
    profile_payload = {
        "user_name": "Balance Test User",
        "expense_types": ["food", "transport", "housing"],
        "payment_methods": [
            {"name": "debit", "is_immediate": True, "cut_date": 0, "days_to_pay": 0},
            {"name": "cc", "is_immediate": False, "cut_date": 16, "days_to_pay": 20}
        ],
        "monthly_income": 5000.00
    }
    
    # Clean up existing profile if any (e.g. from previous aborted test)
    # The create API will return 400 if it already exists, so we try to get it first
    get_profile_res = requests.get(profile_url, headers=auth_headers)
    if get_profile_res.status_code == 200:
        existing_profile = get_profile_res.json()
        requests.delete(f"{profile_url}/{existing_profile['id']}", headers=auth_headers)

    res_profile = requests.post(profile_url, json=profile_payload, headers=auth_headers)
    assert res_profile.status_code == 201
    profile_id = res_profile.json().get("id")
    assert profile_id is not None

    created_expense_ids = []
    created_fe_ids = []

    try:
        # 2. Create an immediate expense in June 2026: should count in June
        res_exp1 = requests.post(f"{base_url}/expenses", json={
            "expense": 150.00,
            "expense_type": "food",
            "payment_method": "debit",
            "expense_description": "Groceries",
            "expense_date": "2026-06-10T12:00:00Z"
        }, headers=auth_headers)
        assert res_exp1.status_code == 201
        exp1_id = res_exp1.text.split("ID: ")[1]
        created_expense_ids.append(exp1_id)

        # 3. Create a credit card expense in June before the cut date (June 10 <= June 16)
        # Cut-off: June 16. Due date: July 6. Should count in July, not June.
        res_exp2 = requests.post(f"{base_url}/expenses", json={
            "expense": 400.00,
            "expense_type": "transport",
            "payment_method": "cc",
            "expense_description": "Train Ticket",
            "expense_date": "2026-06-10T12:00:00Z"
        }, headers=auth_headers)
        assert res_exp2.status_code == 201
        exp2_id = res_exp2.text.split("ID: ")[1]
        created_expense_ids.append(exp2_id)

        # 4. Create a credit card expense in May before the cut date (May 10 <= May 16)
        # Cut-off: May 16. Due date: June 5. Should count in June!
        res_exp3 = requests.post(f"{base_url}/expenses", json={
            "expense": 250.00,
            "expense_type": "transport",
            "payment_method": "cc",
            "expense_description": "Gas",
            "expense_date": "2026-05-10T12:00:00Z"
        }, headers=auth_headers)
        assert res_exp3.status_code == 201
        exp3_id = res_exp3.text.split("ID: ")[1]
        created_expense_ids.append(exp3_id)

        # 5. Create a fixed expense active in June 2026
        res_fe = requests.post(f"{base_url}/fixed_expenses", json={
            "fixed_expense": 1100.00,
            "fexpense_type": "housing",
            "fexpense_start_date": "2026-01-01T00:00:00Z",
            "fexpense_end_date": "2026-12-31T00:00:00Z",
            "fexpense_description": "Rent",
            "expire": True
        }, headers=auth_headers)
        assert res_fe.status_code == 201
        fe_id = res_fe.text.split("ID: ")[1]
        created_fe_ids.append(fe_id)

        # 6. Call get money balance for June 2026
        # Expected:
        # monthly_income = 5000.0
        # total_immediate_expenses = 150.0 (debit exp1)
        # total_credit_expenses_due = 250.0 (cc exp3)
        # total_fixed_expenses = 1100.0 (rent fe)
        # total_expenses = 150.0 + 250.0 + 1100.0 = 1500.0
        # remaining_balance = 5000.0 - 1500.0 = 3500.0
        res_balance = requests.get(f"{base_url}/money_balance?month=2026-06", headers=auth_headers)
        assert res_balance.status_code == 200
        balance_data = res_balance.json()
        
        assert balance_data["monthly_income"] == 5000.0
        assert balance_data["total_immediate_expenses"] == 150.0
        assert balance_data["total_credit_expenses_due"] == 250.0
        assert balance_data["total_fixed_expenses"] == 1100.0
        assert balance_data["total_expenses"] == 1500.0
        assert balance_data["remaining_balance"] == 3500.0

    finally:
        # Clean up expenses
        for exp_id in created_expense_ids:
            requests.delete(f"{base_url}/expenses/{exp_id}", headers=auth_headers)
        # Clean up fixed expenses
        for fe_id in created_fe_ids:
            requests.delete(f"{base_url}/fixed_expenses/{fe_id}", headers=auth_headers)
        # Clean up profile
        requests.delete(f"{profile_url}/{profile_id}", headers=auth_headers)
