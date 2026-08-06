import pytest
from unittest.mock import MagicMock
from BL.expense_service import ExpenseService
from API.expense_dto import ExpenseDTO

@pytest.fixture
def expense_service(mocker):
    # Mock TOA, DAO, and UserProfileDAO
    mocker.patch('BL.expense_service.ExpenseTOA')
    mocker.patch('BL.expense_service.ExpenseDAO')
    mocker.patch('BL.expense_service.UserProfileDAO')
    return ExpenseService()

def test_verify_token_success(expense_service, mocker):
    # Mock firebase auth
    mock_auth = mocker.patch('BL.expense_service.auth')
    mock_auth.verify_id_token.return_value = {
        'email_verified': True,
        'uid': 'test_user_id'
    }

    uid = expense_service.verify_token("valid_token")
    assert uid == 'test_user_id'
    mock_auth.verify_id_token.assert_called_once_with("valid_token")

def test_verify_token_email_not_verified(expense_service, mocker):
    mock_auth = mocker.patch('BL.expense_service.auth')
    mock_auth.verify_id_token.return_value = {
        'email_verified': False,
        'uid': 'test_user_id'
    }

    with pytest.raises(ValueError, match="User's email is not verified."):
        expense_service.verify_token("token_unverified_email")

def test_create_expense(expense_service):
    # Setup mocks
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.payment_method_id = "cc1_id"
    mock_dto.payment_method = "credit card1"
    mock_dto.user_id = "test_user_id"
    
    mock_entity = MagicMock()
    expense_service.expense_toa.dto_to_entity.return_value = mock_entity
    expense_service.expense_dao.create_expense.return_value = "new_expense_id"

    # Call method
    result = expense_service.create_expense(mock_dto)

    # Assertions
    assert result == "new_expense_id"
    expense_service.expense_toa.dto_to_entity.assert_called_once_with(mock_dto)
    expense_service.expense_dao.create_expense.assert_called_once_with(mock_entity)

def test_create_expense_resolves_payment_method_id(expense_service):
    # Setup mock DTO with no payment_method_id
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.payment_method_id = None
    mock_dto.payment_method = "credit card1"
    mock_dto.user_id = "test_user_id"
    
    # Mock profile response
    mock_profile = MagicMock()
    mock_profile.payment_methods = [
        {"id": "cc1_id", "name": "credit card1", "is_immediate": False}
    ]
    expense_service.user_profile_dao.get_profile.return_value = mock_profile
    
    mock_entity = MagicMock()
    expense_service.expense_toa.dto_to_entity.return_value = mock_entity
    expense_service.expense_dao.create_expense.return_value = "new_expense_id"
    
    result = expense_service.create_expense(mock_dto)
    
    assert result == "new_expense_id"
    assert mock_dto.payment_method_id == "cc1_id"
    expense_service.user_profile_dao.get_profile.assert_called_once_with("test_user_id")

def test_get_expenses(expense_service):
    # Setup mocks
    mock_entity = MagicMock()
    mock_dto = MagicMock()
    expense_service.expense_dao.get_expenses.return_value = [mock_entity]
    expense_service.expense_toa.entity_to_dto.return_value = mock_dto

    # Call method
    result = expense_service.get_expenses("user_id")

    # Assertions
    assert result == [mock_dto]
    expense_service.expense_dao.get_expenses.assert_called_once_with("user_id")
    expense_service.expense_toa.entity_to_dto.assert_called_once_with(mock_entity)

def test_update_expense(expense_service):
    # Setup mocks
    mock_dto = MagicMock(spec=ExpenseDTO)
    mock_dto.payment_method_id = "cc1_id"
    mock_dto.payment_method = "credit card1"
    mock_dto.user_id = "test_user_id"
    
    mock_entity = MagicMock()
    expense_service.expense_toa.dto_to_entity.return_value = mock_entity

    # Call method
    expense_service.update_expense(mock_dto, "expense_id")

    # Assertions
    expense_service.expense_toa.dto_to_entity.assert_called_once_with(mock_dto)
    expense_service.expense_dao.update_expense.assert_called_once_with(mock_entity, "expense_id")

def test_delete_expense(expense_service):
    # Call method
    expense_service.delete_expense("user_id", "expense_id")

    # Assertions
    expense_service.expense_dao.delete_expense.assert_called_once_with("user_id", "expense_id")

def test_get_expenses_daily_filter(expense_service):
    # Setup mock entities
    ent1 = MagicMock(expense_date="2026-08-01T10:00:00Z", expense_type="food", payment_method="cash")
    ent2 = MagicMock(expense_date="2026-08-02T10:00:00Z", expense_type="food", payment_method="cash")
    expense_service.expense_dao.get_expenses.return_value = [ent1, ent2]
    
    # Target date: 2026-08-01
    results = expense_service.get_expenses("user_id", filter_type="day", target_date="2026-08-01")
    assert len(results) == 1

def test_get_expenses_weekly_filter(expense_service):
    # Setup mock entities
    # 2026-08-01 is Saturday. Monday is 2026-07-27. Sunday is 2026-08-02.
    ent1 = MagicMock(expense_date="2026-07-28T10:00:00Z", expense_type="food", payment_method="cash")
    ent2 = MagicMock(expense_date="2026-07-26T10:00:00Z", expense_type="food", payment_method="cash")
    expense_service.expense_dao.get_expenses.return_value = [ent1, ent2]

    results = expense_service.get_expenses("user_id", filter_type="week", target_date="2026-08-01")
    assert len(results) == 1

def test_get_expenses_monthly_cutoff_filter(expense_service):
    # Mock user profile with payment method cutoff
    mock_profile = MagicMock()
    mock_profile.payment_methods = [
        {"id": "cc1_id", "name": "credit card1", "is_immediate": False, "cut_date": 16}
    ]
    expense_service.user_profile_dao.get_profile.return_value = mock_profile

    # Mock entity 1: date is 2026-07-20 (> 16 cutoff, falls into August statement!)
    ent1 = MagicMock(expense_date="2026-07-20T10:00:00Z", expense_type="food", payment_method="credit card1", payment_method_id="cc1_id")
    # Mock entity 2: date is 2026-08-20 (> 16 cutoff, falls into September statement!)
    ent2 = MagicMock(expense_date="2026-08-20T10:00:00Z", expense_type="food", payment_method="credit card1", payment_method_id="cc1_id")
    # Mock entity 3: date is 2026-08-05 (<= 16 cutoff, falls into August statement!)
    ent3 = MagicMock(expense_date="2026-08-05T10:00:00Z", expense_type="food", payment_method="credit card1", payment_method_id="cc1_id")

    expense_service.expense_dao.get_expenses.return_value = [ent1, ent2, ent3]

    # Target month: 2026-08
    results = expense_service.get_expenses("user_id", filter_type="month", target_date="2026-08-01")
    assert len(results) == 2

