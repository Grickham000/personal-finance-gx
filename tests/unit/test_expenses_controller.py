import pytest
import json
import azure.functions as func
from unittest.mock import MagicMock
import API.expenses_controller as expenses_controller
from API.expense_dto import ExpenseDTO

@pytest.fixture
def mock_expense_service(mocker):
    return mocker.patch('API.expenses_controller.expense_service')

def test_create_expense_success(mock_expense_service):
    # Setup mock request
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"
    req.get_json.return_value = {
        "expense": 100,
        "expense_type": "cat1",
        "payment_method": "pm1",
        "expense_description": "Groceries",
        "expense_date": "2023-10-01T10:00:00Z"
    }

    # Setup mock service
    mock_expense_service.verify_token.return_value = "user123"
    mock_expense_service.create_expense.return_value = "expense123"

    # Call method
    response = expenses_controller.create_expense(req)

    # Assertions
    assert response.status_code == 201
    assert "expense123" in response.get_body().decode()
    mock_expense_service.verify_token.assert_called_once_with("valid_token")
    mock_expense_service.create_expense.assert_called_once()

def test_get_expenses_success(mock_expense_service):
    # Setup mock request
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer valid_token"

    # Setup mock service
    mock_expense_service.verify_token.return_value = "user123"
    
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.to_dict.return_value = {"id": "exp1", "amount": 100}
    mock_expense_service.get_expenses.return_value = [mock_dto]

    # Call method
    response = expenses_controller.get_expenses(req)

    # Assertions
    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert len(body) == 1
    assert body[0]["id"] == "exp1"
    mock_expense_service.get_expenses.assert_called_once_with("user123")

def test_create_expense_unauthorized(mock_expense_service):
    # Setup mock request
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer invalid_token"

    # Setup mock service
    mock_expense_service.verify_token.side_effect = ValueError("Invalid token")

    # Call method
    response = expenses_controller.create_expense(req)

    # Assertions
    assert response.status_code == 400
    assert "Invalid token" in response.get_body().decode()
