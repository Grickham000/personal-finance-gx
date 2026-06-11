import pytest
import json
import azure.functions as func
from unittest.mock import MagicMock, patch
from BL.money_balance_service import MoneyBalanceService
from DL.user_profile_entity import UserProfileEntity
from DL.expense_entity import ExpenseEntity
from DL.fixed_expense_entity import FixedExpenseEntity
from DL.credit_card_payment_entity import CreditCardPaymentEntity
from API.money_balance_controller import get_money_balance

@pytest.fixture
def mock_daos():
    with patch("BL.money_balance_service.UserProfileDAO") as mock_profile_dao_cls, \
         patch("BL.money_balance_service.ExpenseDAO") as mock_expense_dao_cls, \
         patch("BL.money_balance_service.FixedExpenseDAO") as mock_fixed_dao_cls, \
         patch("BL.money_balance_service.CreditCardPaymentDAO") as mock_payment_dao_cls:
        
        profile_dao = mock_profile_dao_cls.return_value
        expense_dao = mock_expense_dao_cls.return_value
        fixed_dao = mock_fixed_dao_cls.return_value
        payment_dao = mock_payment_dao_cls.return_value
        
        yield profile_dao, expense_dao, fixed_dao, payment_dao

def test_get_monthly_balance_calculations(mock_daos):
    profile_dao, expense_dao, fixed_dao, payment_dao = mock_daos
    payment_dao.get_payments.return_value = []
    
    # 1. Setup User Profile
    profile_dao.get_profile.return_value = UserProfileEntity(
        user_id="user_123",
        user_name="John Doe",
        expense_types=["food", "transport"],
        payment_methods=[
            {"id": "debit_id", "name": "debit", "is_immediate": True, "cut_date": 0, "days_to_pay": 0},
            {"id": "cc1_id", "name": "credit_card1", "is_immediate": False, "cut_date": 16, "days_to_pay": 20}
        ],
        monthly_income=5000.0,
        id="profile_123"
    )
    
    # 2. Setup Variable Expenses
    expense_dao.get_expenses.return_value = [
        ExpenseEntity(
            user_id="user_123",
            expense=100.0,
            expense_type="food",
            payment_method="debit",
            payment_method_id="debit_id",
            expense_description="groceries",
            expense_date="2026-06-10T12:00:00Z"
        ),
        ExpenseEntity(
            user_id="user_123",
            expense=250.0,
            expense_type="shopping",
            payment_method="credit_card1",
            payment_method_id="cc1_id",
            expense_description="clothes",
            expense_date="2026-05-10T12:00:00Z"
        )
    ]
    
    # 3. Setup Fixed Expenses
    fixed_dao.get_fixed_expenses.return_value = [
        FixedExpenseEntity(
            user_id="user_123",
            fixed_expense=1000.0,
            fexpense_type="housing",
            fexpense_description="rent",
            fexpense_start_date="2026-01-01T00:00:00Z",
            fexpense_end_date="2026-12-31T00:00:00Z",
            expire=True
        )
    ]
    
    service = MoneyBalanceService()
    result = service.get_monthly_balance("user_123", "2026-06")
    
    assert result["monthly_income"] == 5000.0
    assert result["total_immediate_expenses"] == 100.0
    assert result["total_credit_expenses_due"] == 250.0
    assert result["total_fixed_expenses"] == 1000.0
    assert result["total_expenses"] == 1350.0
    assert result["remaining_balance"] == 3650.0

def test_get_monthly_balance_with_settled_credit_card(mock_daos):
    profile_dao, expense_dao, fixed_dao, payment_dao = mock_daos
    
    # 1. Setup User Profile
    profile_dao.get_profile.return_value = UserProfileEntity(
        user_id="user_123",
        user_name="John Doe",
        expense_types=["food", "transport"],
        payment_methods=[
            {"id": "debit_id", "name": "debit", "is_immediate": True, "cut_date": 0, "days_to_pay": 0},
            {"id": "cc1_id", "name": "credit_card1", "is_immediate": False, "cut_date": 16, "days_to_pay": 20}
        ],
        monthly_income=5000.0,
        id="profile_123"
    )
    
    # 2. Setup Variable Expenses (May 10 expense, due June 5)
    expense_dao.get_expenses.return_value = [
        ExpenseEntity(
            user_id="user_123",
            expense=250.0,
            expense_type="shopping",
            payment_method="credit_card1",
            payment_method_id="cc1_id",
            expense_description="clothes",
            expense_date="2026-05-10T12:00:00Z"
        )
    ]
    
    # 3. Setup Credit Card Payment (settling May 2026 statement cycle, paid in June 2026)
    payment_dao.get_payments.return_value = [
        CreditCardPaymentEntity(
            user_id="user_123",
            payment_method_id="cc1_id",
            statement_month="2026-05",  # May cycle (cut date May 16)
            payment_date="2026-06-04T10:00:00Z",  # Paid in June
            amount_paid=250.0,
            id="pay_123"
        )
    ]
    
    fixed_dao.get_fixed_expenses.return_value = []
    
    service = MoneyBalanceService()
    result = service.get_monthly_balance("user_123", "2026-06")
    
    # Verify results:
    # monthly_income = 5000.0
    # total_immediate_expenses = 0.0
    # total_credit_expenses_due = 0.0 (Released because cycle 2026-05 is paid)
    # total_credit_payments_made = 250.0 (Paid in June 2026)
    # total_fixed_expenses = 0.0
    # total_expenses = 250.0
    # remaining_balance = 4750.0
    
    assert result["total_credit_expenses_due"] == 0.0
    assert result["total_credit_payments_made"] == 250.0
    assert result["total_expenses"] == 250.0
    assert result["remaining_balance"] == 4750.0

@patch("API.money_balance_controller.auth.verify_id_token")
@patch("API.money_balance_controller.money_balance_service")
def test_get_money_balance_endpoint(mock_service, mock_verify_token):
    mock_verify_token.return_value = {"uid": "user_123", "email_verified": True}
    
    mock_service.get_monthly_balance.return_value = {
        "monthly_income": 5000.0,
        "total_expenses": 1350.0,
        "remaining_balance": 3650.0,
        "target_month": "2026-06"
    }
    
    req = MagicMock(spec=func.HttpRequest)
    req.headers = {"Authorization": "Bearer some_token"}
    req.params = {"month": "2026-06"}
    
    response = get_money_balance(req)
    
    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert body["remaining_balance"] == 3650.0
    mock_service.get_monthly_balance.assert_called_once_with("user_123", "2026-06")
