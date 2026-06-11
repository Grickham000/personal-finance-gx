import pytest
import json
import azure.functions as func
from unittest.mock import MagicMock, patch
from API.expenses_controller import get_expenses, get_expense_by_id
from API.fixed_expenses_controller import get_fixed_expenses, get_fixed_expense_by_id
from API.expense_dto import ExpenseDTO
from API.fixed_expense_dto import FixedExpenseDTO

# --- Variable Expenses Tests ---

@patch('API.expenses_controller.expense_service')
def test_get_expenses_with_filters(mock_expense_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    # Set params
    req.params = {
        "expense_type": "food",
        "payment_method": "cc1",
        "start_date": "2023-11-01",
        "end_date": "2023-11-30"
    }

    mock_expense_service.verify_token.return_value = "user123"
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.to_dict.return_value = {"id": "exp1", "expense": 150.0}
    mock_expense_service.get_expenses.return_value = [mock_dto]

    response = get_expenses(req)

    assert response.status_code == 200
    mock_expense_service.get_expenses.assert_called_once_with(
        "user123",
        expense_type="food",
        payment_method="cc1",
        start_date="2023-11-01",
        end_date="2023-11-30"
    )

@patch('API.expenses_controller.expense_service')
def test_get_expense_by_id_success(mock_expense_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    req.route_params = {"id": "exp1"}

    mock_expense_service.verify_token.return_value = "user123"
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.to_dict.return_value = {"id": "exp1", "expense": 150.0}
    mock_expense_service.get_expense_by_id.return_value = mock_dto

    response = get_expense_by_id(req)

    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert body["id"] == "exp1"
    mock_expense_service.get_expense_by_id.assert_called_once_with("user123", "exp1")

@patch('API.expenses_controller.expense_service')
def test_get_expense_by_id_not_found(mock_expense_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    req.route_params = {"id": "exp_missing"}

    mock_expense_service.verify_token.return_value = "user123"
    mock_expense_service.get_expense_by_id.return_value = None

    response = get_expense_by_id(req)

    assert response.status_code == 404
    assert "Expense not found" in response.get_body().decode()


# --- Fixed Expenses Tests ---

@patch('API.fixed_expenses_controller.fixed_expense_service')
def test_get_fixed_expenses_with_filters(mock_fixed_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    req.params = {
        "fexpense_type": "housing",
        "expire": "false"
    }

    mock_fixed_service.verify_token.return_value = "user123"
    mock_dto = MagicMock(spec=FixedExpenseDTO)
    mock_dto.to_dict.return_value = {"id": "fe1", "fixed_expense": 1000.0}
    mock_fixed_service.get_fixed_expenses.return_value = [mock_dto]

    response = get_fixed_expenses(req)

    assert response.status_code == 200
    mock_fixed_service.get_fixed_expenses.assert_called_once_with(
        "user123",
        fexpense_type="housing",
        start_date=None,
        end_date=None,
        expire="false"
    )

@patch('API.fixed_expenses_controller.fixed_expense_service')
def test_get_fixed_expense_by_id_success(mock_fixed_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    req.route_params = {"id": "fe1"}

    mock_fixed_service.verify_token.return_value = "user123"
    mock_dto = MagicMock(spec=FixedExpenseDTO)
    mock_dto.to_dict.return_value = {"id": "fe1", "fixed_expense": 1000.0}
    mock_fixed_service.get_fixed_expense_by_id.return_value = mock_dto

    response = get_fixed_expense_by_id(req)

    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert body["id"] == "fe1"
    mock_fixed_service.get_fixed_expense_by_id.assert_called_once_with("user123", "fe1")
