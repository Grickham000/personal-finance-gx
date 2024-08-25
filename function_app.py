import azure.functions as func
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from API.expenses_controller import create_expense, get_expenses, update_expense
from API.user_registration_controller import user_registration

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