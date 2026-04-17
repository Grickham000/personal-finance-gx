import azure.functions as func
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
#expenses
from API.expenses_controller import create_expense, get_expenses, update_expense, delete_expense
#registration
from API.user_registration_controller import user_registration
#fixed expenses
from API.fixed_expenses_controller import create_fixed_expense, get_fixed_expenses, update_fixed_expense, delete_fixed_expense
#user profile
from API.user_profile_controller import create_user_profile, get_user_profile, update_user_profile, delete_user_profile

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