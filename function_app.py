import azure.functions as func
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
#expenses
from API.expenses_controller import create_expense, get_expenses, update_expense, delete_expense, get_expense_by_id
#registration
from API.user_registration_controller import user_registration
#fixed expenses
from API.fixed_expenses_controller import create_fixed_expense, get_fixed_expenses, update_fixed_expense, delete_fixed_expense, get_fixed_expense_by_id
#user profile
from API.user_profile_controller import create_user_profile, get_user_profile, update_user_profile, delete_user_profile
#money balance
from API.money_balance_controller import get_money_balance
#credit card payments
from API.credit_card_payments_controller import create_credit_card_payment, get_credit_card_payments, delete_credit_card_payment
#savings accounts
from API.savings_accounts_controller import create_savings_account, get_savings_accounts, get_savings_account_by_id, update_savings_account, delete_savings_account
#investments
from API.investments_controller import create_investment, get_investments, get_investment_by_id, update_investment, delete_investment


app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

""" app.route(route="expenses", methods=["POST"])(create_expense)
app.route(route="expenses", methods=["GET"])(get_expenses)
app.route(route="expenses/{expenseId}", methods=["PUT"])(update_expense)
 """

@app.route(route="expenses", methods=["POST"])
def create_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_expense(req)

@app.route(route="expenses", methods=["GET"])
def get_expenses_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_expenses(req)

@app.route(route="expenses/{id}", methods=["PUT"])
def update_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return update_expense(req)

@app.route(route="user_registration", methods=["POST"])
def create_user_registration(req: func.HttpRequest) -> func.HttpResponse:
    return user_registration(req)

@app.route(route="expenses/{id}", methods=["DELETE"])
def delete_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_expense(req)

@app.route(route="fixed_expenses", methods=["POST"])
def create_fixed_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_fixed_expense(req)

@app.route(route="fixed_expenses", methods=["GET"])
def get_fixed_expenses_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_fixed_expenses(req)

@app.route(route="fixed_expenses/{id}", methods=["PUT"])
def update_fixed_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return update_fixed_expense(req)

@app.route(route="fixed_expenses/{id}", methods=["DELETE"])
def delete_fixed_expense_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_fixed_expense(req)

@app.route(route="user_profile", methods=["POST"])
def create_user_profile_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_user_profile(req)

@app.route(route="user_profile", methods=["GET"])
def get_user_profile_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_user_profile(req)

@app.route(route="user_profile/{id}", methods=["PUT"])
def update_user_profile_route(req: func.HttpRequest) -> func.HttpResponse:
    return update_user_profile(req)

@app.route(route="user_profile/{id}", methods=["DELETE"])
def delete_user_profile_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_user_profile(req)

@app.route(route="expenses/{id}", methods=["GET"])
def get_expense_by_id_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_expense_by_id(req)

@app.route(route="fixed_expenses/{id}", methods=["GET"])
def get_fixed_expense_by_id_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_fixed_expense_by_id(req)

@app.route(route="money_balance", methods=["GET"])
def get_money_balance_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_money_balance(req)

@app.route(route="credit_card_payments", methods=["POST"])
def create_credit_card_payment_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_credit_card_payment(req)

@app.route(route="credit_card_payments", methods=["GET"])
def get_credit_card_payments_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_credit_card_payments(req)

@app.route(route="credit_card_payments/{id}", methods=["DELETE"])
def delete_credit_card_payment_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_credit_card_payment(req)

# Savings Accounts Routes
@app.route(route="savings_accounts", methods=["POST"])
def create_savings_account_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_savings_account(req)

@app.route(route="savings_accounts", methods=["GET"])
def get_savings_accounts_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_savings_accounts(req)

@app.route(route="savings_accounts/{id}", methods=["GET"])
def get_savings_account_by_id_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_savings_account_by_id(req)

@app.route(route="savings_accounts/{id}", methods=["PUT"])
def update_savings_account_route(req: func.HttpRequest) -> func.HttpResponse:
    return update_savings_account(req)

@app.route(route="savings_accounts/{id}", methods=["DELETE"])
def delete_savings_account_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_savings_account(req)

# Investments Routes
@app.route(route="investments", methods=["POST"])
def create_investment_route(req: func.HttpRequest) -> func.HttpResponse:
    return create_investment(req)

@app.route(route="investments", methods=["GET"])
def get_investments_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_investments(req)

@app.route(route="investments/{id}", methods=["GET"])
def get_investment_by_id_route(req: func.HttpRequest) -> func.HttpResponse:
    return get_investment_by_id(req)

@app.route(route="investments/{id}", methods=["PUT"])
def update_investment_route(req: func.HttpRequest) -> func.HttpResponse:
    return update_investment(req)

@app.route(route="investments/{id}", methods=["DELETE"])
def delete_investment_route(req: func.HttpRequest) -> func.HttpResponse:
    return delete_investment(req)