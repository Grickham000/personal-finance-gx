import pytest
import requests

def test_get_expense_by_id_and_filters(base_url, auth_headers):
    # 1. Create a variable expense
    create_url = f"{base_url}/expenses"
    payload = {
        "expense": 120.00,
        "expense_type": "groceries",
        "payment_method": "cash",
        "expense_description": "Weekly Food",
        "expense_date": "2026-06-10T12:00:00Z"
    }
    res = requests.post(create_url, json=payload, headers=auth_headers)
    assert res.status_code == 201
    expense_id = res.text.split("ID: ")[1] if "ID: " in res.text else None
    assert expense_id is not None

    try:
        # 2. Get the expense by ID
        get_id_url = f"{base_url}/expenses/{expense_id}"
        res_id = requests.get(get_id_url, headers=auth_headers)
        assert res_id.status_code == 200
        data_id = res_id.json()
        assert data_id["id"] == expense_id
        assert data_id["expense"] == 120.00
        assert data_id["expense_type"] == "groceries"

        # 3. Get expenses with filter match
        get_filter_url = f"{base_url}/expenses?expense_type=groceries&payment_method=cash"
        res_filter = requests.get(get_filter_url, headers=auth_headers)
        assert res_filter.status_code == 200
        data_filter = res_filter.json()
        assert isinstance(data_filter, list)
        matching = [e for e in data_filter if e["id"] == expense_id]
        assert len(matching) == 1

        # 4. Get expenses with filter mismatch
        get_no_match_url = f"{base_url}/expenses?expense_type=housing"
        res_no_match = requests.get(get_no_match_url, headers=auth_headers)
        assert res_no_match.status_code == 200
        data_no_match = res_no_match.json()
        matching_no = [e for e in data_no_match if e["id"] == expense_id]
        assert len(matching_no) == 0

    finally:
        # Cleanup
        requests.delete(f"{base_url}/expenses/{expense_id}", headers=auth_headers)


def test_get_fixed_expense_by_id_and_filters(base_url, auth_headers):
    # 1. Create a fixed expense
    create_url = f"{base_url}/fixed_expenses"
    payload = {
        "fixed_expense": 1200.00,
        "fexpense_type": "housing",
        "fexpense_start_date": "2026-01-01T00:00:00Z",
        "fexpense_end_date": "2026-12-31T00:00:00Z",
        "fexpense_description": "Rent 2026",
        "expire": True
    }
    res = requests.post(create_url, json=payload, headers=auth_headers)
    assert res.status_code == 201
    fe_id = res.text.split("ID: ")[1] if "ID: " in res.text else None
    assert fe_id is not None

    try:
        # 2. Get the fixed expense by ID
        get_id_url = f"{base_url}/fixed_expenses/{fe_id}"
        res_id = requests.get(get_id_url, headers=auth_headers)
        assert res_id.status_code == 200
        data_id = res_id.json()
        assert data_id["id"] == fe_id
        assert data_id["fixed_expense"] == 1200.00

        # 3. Get fixed expenses with filter match
        get_filter_url = f"{base_url}/fixed_expenses?fexpense_type=housing&expire=true"
        res_filter = requests.get(get_filter_url, headers=auth_headers)
        assert res_filter.status_code == 200
        data_filter = res_filter.json()
        assert isinstance(data_filter, list)
        matching = [fe for fe in data_filter if fe["id"] == fe_id]
        assert len(matching) == 1

        # 4. Get fixed expenses with filter mismatch
        get_no_match_url = f"{base_url}/fixed_expenses?fexpense_type=housing&expire=false"
        res_no_match = requests.get(get_no_match_url, headers=auth_headers)
        assert res_no_match.status_code == 200
        data_no_match = res_no_match.json()
        matching_no = [fe for fe in data_no_match if fe["id"] == fe_id]
        assert len(matching_no) == 0

    finally:
        # Cleanup
        requests.delete(f"{base_url}/fixed_expenses/{fe_id}", headers=auth_headers)
