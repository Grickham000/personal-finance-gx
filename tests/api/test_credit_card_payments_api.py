import pytest
import requests

def test_credit_card_payments_api_flow(base_url, auth_headers):
    # 1. Create a User Profile first
    profile_url = f"{base_url}/user_profile"
    profile_payload = {
        "user_name": "CC Payments API Test User",
        "expense_types": ["shopping"],
        "payment_methods": [
            {"name": "credit_card_api", "is_immediate": False, "cut_date": 16, "days_to_pay": 20}
        ],
        "monthly_income": 5000.00
    }
    
    # Clean up existing profile if any
    get_profile_res = requests.get(profile_url, headers=auth_headers)
    if get_profile_res.status_code == 200:
        existing_profile = get_profile_res.json()
        requests.delete(f"{profile_url}/{existing_profile['id']}", headers=auth_headers)

    res_profile = requests.post(profile_url, json=profile_payload, headers=auth_headers)
    assert res_profile.status_code == 201
    profile_data = requests.get(profile_url, headers=auth_headers).json()
    profile_id = profile_data.get("id")
    
    payment_methods = profile_data.get("payment_methods", [])
    assert len(payment_methods) == 1
    cc_pm = payment_methods[0]
    cc_pm_id = cc_pm.get("id")
    assert cc_pm_id is not None
    
    created_expense_ids = []
    created_payment_ids = []

    try:
        # 2. Create a credit card expense in May before the cut date (May 10 <= May 16)
        # Due date: June 5. Should count in June.
        res_exp = requests.post(f"{base_url}/expenses", json={
            "expense": 350.00,
            "expense_type": "shopping",
            "payment_method": "credit_card_api",
            "payment_method_id": cc_pm_id,
            "expense_description": "API Test Clothes",
            "expense_date": "2026-05-10T12:00:00Z"
        }, headers=auth_headers)
        assert res_exp.status_code == 201
        exp_id = res_exp.text.split("ID: ")[1]
        created_expense_ids.append(exp_id)

        # 3. Check June money balance before payment: should show due amount
        res_balance_before = requests.get(f"{base_url}/money_balance?month=2026-06", headers=auth_headers)
        assert res_balance_before.status_code == 200
        balance_before = res_balance_before.json()
        assert balance_before["total_credit_expenses_due"] == 350.00
        assert balance_before["total_credit_payments_made"] == 0.00

        # 4. Record a credit card payment for the May cycle in June
        res_pay = requests.post(f"{base_url}/credit_card_payments", json={
            "payment_method_id": cc_pm_id,
            "statement_month": "2026-05",
            "payment_date": "2026-06-04T10:00:00Z",
            "amount_paid": 350.00
        }, headers=auth_headers)
        assert res_pay.status_code == 201
        pay_id = res_pay.json().get("id")
        assert pay_id is not None
        created_payment_ids.append(pay_id)

        # 5. Check June money balance after payment: due is released, payment is recorded
        res_balance_after = requests.get(f"{base_url}/money_balance?month=2026-06", headers=auth_headers)
        assert res_balance_after.status_code == 200
        balance_after = res_balance_after.json()
        assert balance_after["total_credit_expenses_due"] == 0.00
        assert balance_after["total_credit_payments_made"] == 350.00
        assert balance_after["total_expenses"] == 350.00
        assert balance_after["remaining_balance"] == 4650.00

        # 6. Retrieve credit card payments and verify
        res_get_pays = requests.get(f"{base_url}/credit_card_payments", headers=auth_headers)
        assert res_get_pays.status_code == 200
        pays = res_get_pays.json()
        assert len(pays) == 1
        assert pays[0]["id"] == pay_id
        assert pays[0]["statement_month"] == "2026-05"

    finally:
        # Clean up payments
        for pay_id in created_payment_ids:
            requests.delete(f"{base_url}/credit_card_payments/{pay_id}", headers=auth_headers)
        # Clean up expenses
        for exp_id in created_expense_ids:
            requests.delete(f"{base_url}/expenses/{exp_id}", headers=auth_headers)
        # Clean up profile
        if profile_id:
            requests.delete(f"{profile_url}/{profile_id}", headers=auth_headers)
