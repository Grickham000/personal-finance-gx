from fastapi import FastAPI, APIRouter, Request, Response, Query, Header, status
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
import azure.functions as func
import json

from fastapi.responses import HTMLResponse

# Initialize FastAPI App to handle Azure Function HTTP routes
fastapi_app = FastAPI(
    title="Personal Finance API",
    description="A robust backend API for personal finance management using Azure Functions, Firebase, and Firestore.",
    version="1.0.0",
    docs_url=None,       # Disable default docs route to use custom route below
    redoc_url=None,      # Disable default redoc route to use custom route below
    openapi_url="/api/openapi.json"
)

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS FOR AUTO-DOCUMENTATION
# -----------------------------------------------------------------------------

class UserRegistrationSchema(BaseModel):
    email: EmailStr = Field(..., description="User email address", example="testmail@gmail.com")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)", example="testpass123")

class ExpenseCreateSchema(BaseModel):
    expense: float = Field(..., description="Amount spent", example=1050.50)
    expense_type: str = Field(..., description="Expense category", example="food")
    payment_method: str = Field(..., description="Payment method used", example="credit card1")
    expense_description: str = Field(..., description="Description of the expense", example="Manual Test Groceries")
    expense_date: str = Field(..., description="Expense date (ISO 8601 or YYYY-MM-DD)", example="2026-05-16T09:15:00Z")
    payment_method_cut_date: Optional[int] = Field(None, description="Billing cut-off date", example=16)
    payment_method_id: Optional[str] = Field(None, description="Payment method stable ID", example="pm_123")

class FixedExpenseCreateSchema(BaseModel):
    fixed_expense: float = Field(..., description="Fixed recurring expense amount", example=1000.00)
    fexpense_type: str = Field(..., description="Fixed expense category", example="housing")
    fexpense_start_date: str = Field(..., description="Start date of the fixed expense", example="2023-01-01T00:00:00Z")
    fexpense_end_date: str = Field(..., description="End date of the fixed expense", example="2023-12-31T00:00:00Z")
    fexpense_description: str = Field(..., description="Description", example="Rent")
    expire: bool = Field(..., description="Whether this fixed expense has expired", example=False)

class PaymentMethodSchema(BaseModel):
    id: Optional[str] = Field(None, description="Optional stable payment method ID", example="debit_123")
    name: str = Field(..., description="Payment method name", example="debit card")
    is_immediate: bool = Field(..., description="Immediate or credit payment", example=True)
    cut_date: Optional[int] = Field(0, description="Billing cut-off date (1-31) for credit cards, 0 for immediate", example=0)
    days_to_pay: Optional[int] = Field(0, description="Days to pay after cut-off date", example=0)

class UserProfileCreateSchema(BaseModel):
    user_name: str = Field(..., description="User display name", example="John Doe")
    expense_types: List[str] = Field(..., description="Supported expense categories", example=["food", "transport"])
    payment_methods: List[PaymentMethodSchema] = Field(..., description="Configured payment methods")
    monthly_income: float = Field(..., description="User's monthly income", example=5000.00)

class CreditCardPaymentCreateSchema(BaseModel):
    payment_method_id: str = Field(..., description="ID of the credit card payment method", example="508cd0b2c6e84cbe84190f6d7a54bbea")
    statement_month: str = Field(..., description="Statement billing month (YYYY-MM)", example="2026-05")
    payment_date: str = Field(..., description="Payment timestamp (YYYY-MM-DD HH:MM:SS)", example="2026-06-04 10:00:00")
    amount_paid: float = Field(..., description="Amount paid to clear the statement", example=1050.5)

class SavingsAccountCreateSchema(BaseModel):
    name: str = Field(..., description="Name of the savings account", example="Ally Savings Account")
    interest_rate: float = Field(..., description="Annual Interest Rate percentage", example=4.25)
    balance: float = Field(..., description="Current balance in the account", example=10000.0)
    description: Optional[str] = Field("", description="Description of the account savings purpose", example="Emergency Fund")

class InvestmentCreateSchema(BaseModel):
    name: str = Field(..., description="Investment product name", example="Treasury Bill 6-Month")
    interest_rate: float = Field(..., description="Interest Rate percentage", example=5.2)
    amount: float = Field(..., description="Principal amount invested", example=5000.0)
    has_end_date: bool = Field(..., description="Whether this investment has a maturity date", example=True)
    end_date: Optional[str] = Field(None, description="Maturity date if applicable", example="2026-12-16T12:00:00Z")
    is_released: bool = Field(..., description="Whether the investment has matured and funds are released", example=False)
    description: Optional[str] = Field("", description="Description of the investment", example="Short term government bond")

# Helper to translate FastAPI request context to Azure Functions HTTP request object
def adapt_request(request: Request, body_bytes: bytes = b"", route_params: dict = None, query_params: dict = None) -> func.HttpRequest:
    # Convert query parameters to flat string dictionary
    params = {}
    if query_params:
        for k, v in query_params.items():
            if v is not None:
                params[k] = str(v)
                
    headers = {}
    for k, v in request.headers.items():
        headers[k] = v
        # Also map standard Title-Case headers (e.g., 'authorization' -> 'Authorization')
        parts = [p.capitalize() for p in k.split('-')]
        headers['-'.join(parts)] = v
    
    return func.HttpRequest(
        method=request.method,
        url=str(request.url),
        headers=headers,
        params=params,
        route_params=route_params or {},
        body=body_bytes
    )

# Helper to convert Azure Functions response to FastAPI response
def adapt_response(res: func.HttpResponse) -> Response:
    return Response(
        content=res.get_body(),
        status_code=res.status_code,
        headers=dict(res.headers)
    )

# -----------------------------------------------------------------------------
# ROUTER DEFINITIONS
# -----------------------------------------------------------------------------

router = APIRouter()

# --- USER REGISTRATION ---
from API.user_registration_controller import user_registration

@router.post(
    "/user_registration", 
    status_code=status.HTTP_201_CREATED,
    tags=["User Registration"],
    description="Registers a new user inside Firebase Authentication and triggers verification email."
)
async def register_user(
    payload: UserRegistrationSchema, 
    request: Request,
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = user_registration(req)
    return adapt_response(res)


# --- EXPENSES (VARIABLE) ---
from API.expenses_controller import (
    create_expense, get_expenses, get_expense_by_id, update_expense, delete_expense
)

@router.post("/expenses", status_code=status.HTTP_201_CREATED, tags=["Expenses"], description="Create a new variable expense.")
async def create_expense_endpoint(
    payload: ExpenseCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token (format: 'Bearer <token>')"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_expense(req)
    return adapt_response(res)

@router.get("/expenses", tags=["Expenses"], description="Retrieve variable expenses with filters.")
async def get_expenses_endpoint(
    request: Request,
    expense_type: Optional[str] = Query(None, description="Filter by expense category"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    start_date: Optional[str] = Query(None, description="Filter by start date"),
    end_date: Optional[str] = Query(None, description="Filter by end date"),
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    qp = {
        "expense_type": expense_type,
        "payment_method": payment_method,
        "start_date": start_date,
        "end_date": end_date,
        "code": code
    }
    req = adapt_request(request, query_params=qp)
    res = get_expenses(req)
    return adapt_response(res)

@router.get("/expenses/{id}", tags=["Expenses"], description="Get details of a single variable expense.")
async def get_expense_by_id_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = get_expense_by_id(req)
    return adapt_response(res)

@router.put("/expenses/{id}", tags=["Expenses"], description="Update details of a variable expense.")
async def update_expense_endpoint(
    id: str,
    payload: ExpenseCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, route_params={"id": id}, query_params={"code": code})
    res = update_expense(req)
    return adapt_response(res)

@router.delete("/expenses/{id}", tags=["Expenses"], description="Delete a variable expense.")
async def delete_expense_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_expense(req)
    return adapt_response(res)


# --- FIXED EXPENSES ---
from API.fixed_expenses_controller import (
    create_fixed_expense, get_fixed_expenses, get_fixed_expense_by_id, update_fixed_expense, delete_fixed_expense
)

@router.post("/fixed_expenses", status_code=status.HTTP_201_CREATED, tags=["Fixed Expenses"], description="Create a new fixed recurring expense.")
async def create_fixed_expense_endpoint(
    payload: FixedExpenseCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_fixed_expense(req)
    return adapt_response(res)

@router.get("/fixed_expenses", tags=["Fixed Expenses"], description="Retrieve fixed expenses with optional filters.")
async def get_fixed_expenses_endpoint(
    request: Request,
    fexpense_type: Optional[str] = Query(None, description="Filter by category"),
    expire: Optional[bool] = Query(None, description="Filter by expiration status"),
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    qp = {"fexpense_type": fexpense_type, "expire": expire, "code": code}
    req = adapt_request(request, query_params=qp)
    res = get_fixed_expenses(req)
    return adapt_response(res)

@router.get("/fixed_expenses/{id}", tags=["Fixed Expenses"], description="Get details of a single fixed expense.")
async def get_fixed_expense_by_id_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = get_fixed_expense_by_id(req)
    return adapt_response(res)

@router.put("/fixed_expenses/{id}", tags=["Fixed Expenses"], description="Update details of a fixed expense.")
async def update_fixed_expense_endpoint(
    id: str,
    payload: FixedExpenseCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, route_params={"id": id}, query_params={"code": code})
    res = update_fixed_expense(req)
    return adapt_response(res)

@router.delete("/fixed_expenses/{id}", tags=["Fixed Expenses"], description="Delete a fixed expense.")
async def delete_fixed_expense_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_fixed_expense(req)
    return adapt_response(res)


# --- USER PROFILE ---
from API.user_profile_controller import (
    create_user_profile, get_user_profile, update_user_profile, delete_user_profile
)

@router.post("/user_profile", status_code=status.HTTP_201_CREATED, tags=["User Profile"], description="Create a new user profile specifying payment methods.")
async def create_user_profile_endpoint(
    payload: UserProfileCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_user_profile(req)
    return adapt_response(res)

@router.get("/user_profile", tags=["User Profile"], description="Get the user profile configuration.")
async def get_user_profile_endpoint(
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, query_params={"code": code})
    res = get_user_profile(req)
    return adapt_response(res)

@router.put("/user_profile/{id}", tags=["User Profile"], description="Update the user profile configuration.")
async def update_user_profile_endpoint(
    id: str,
    payload: UserProfileCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, route_params={"id": id}, query_params={"code": code})
    res = update_user_profile(req)
    return adapt_response(res)

@router.delete("/user_profile/{id}", tags=["User Profile"], description="Delete the user profile.")
async def delete_user_profile_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_user_profile(req)
    return adapt_response(res)


# --- MONEY BALANCE ---
from API.money_balance_controller import get_money_balance

@router.get("/money_balance", tags=["Money Balance"], description="Retrieve calculated cash flow/balance for a specific month.")
async def get_money_balance_endpoint(
    request: Request,
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format"),
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    qp = {"month": month, "code": code}
    req = adapt_request(request, query_params=qp)
    res = get_money_balance(req)
    return adapt_response(res)


# --- CREDIT CARD PAYMENTS ---
from API.credit_card_payments_controller import (
    create_credit_card_payment, get_credit_card_payments, delete_credit_card_payment
)

@router.post("/credit_card_payments", status_code=status.HTTP_201_CREATED, tags=["Credit Card Payments"], description="Log a payment made to settle a credit card statement.")
async def create_credit_card_payment_endpoint(
    payload: CreditCardPaymentCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_credit_card_payment(req)
    return adapt_response(res)

@router.get("/credit_card_payments", tags=["Credit Card Payments"], description="Get list of credit card payments.")
async def get_credit_card_payments_endpoint(
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, query_params={"code": code})
    res = get_credit_card_payments(req)
    return adapt_response(res)

@router.delete("/credit_card_payments/{id}", tags=["Credit Card Payments"], description="Delete a logged credit card payment.")
async def delete_credit_card_payment_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_credit_card_payment(req)
    return adapt_response(res)


# --- SAVINGS ACCOUNTS ---
from API.savings_accounts_controller import (
    create_savings_account, get_savings_accounts, get_savings_account_by_id, update_savings_account, delete_savings_account
)

@router.post("/savings_accounts", status_code=status.HTTP_201_CREATED, tags=["Savings Accounts"], description="Register a new savings account.")
async def create_savings_account_endpoint(
    payload: SavingsAccountCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_savings_account(req)
    return adapt_response(res)

@router.get("/savings_accounts", tags=["Savings Accounts"], description="Retrieve all savings accounts.")
async def get_savings_accounts_endpoint(
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, query_params={"code": code})
    res = get_savings_accounts(req)
    return adapt_response(res)

@router.get("/savings_accounts/{id}", tags=["Savings Accounts"], description="Get details of a single savings account.")
async def get_savings_account_by_id_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = get_savings_account_by_id(req)
    return adapt_response(res)

@router.put("/savings_accounts/{id}", tags=["Savings Accounts"], description="Update savings account details.")
async def update_savings_account_endpoint(
    id: str,
    payload: SavingsAccountCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, route_params={"id": id}, query_params={"code": code})
    res = update_savings_account(req)
    return adapt_response(res)

@router.delete("/savings_accounts/{id}", tags=["Savings Accounts"], description="Remove a savings account.")
async def delete_savings_account_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_savings_account(req)
    return adapt_response(res)


# --- INVESTMENTS ---
from API.investments_controller import (
    create_investment, get_investments, get_investment_by_id, update_investment, delete_investment
)

@router.post("/investments", status_code=status.HTTP_201_CREATED, tags=["Investments"], description="Create a new investment entry.")
async def create_investment_endpoint(
    payload: InvestmentCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, query_params={"code": code})
    res = create_investment(req)
    return adapt_response(res)

@router.get("/investments", tags=["Investments"], description="Retrieve investments with optional filters.")
async def get_investments_endpoint(
    request: Request,
    has_end_date: Optional[bool] = Query(None, description="Filter by whether investment has end date"),
    is_released: Optional[bool] = Query(None, description="Filter by whether investment was released"),
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    qp = {"has_end_date": has_end_date, "is_released": is_released, "code": code}
    req = adapt_request(request, query_params=qp)
    res = get_investments(req)
    return adapt_response(res)

@router.get("/investments/{id}", tags=["Investments"], description="Get details of a single investment.")
async def get_investment_by_id_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = get_investment_by_id(req)
    return adapt_response(res)

@router.put("/investments/{id}", tags=["Investments"], description="Update details of an investment.")
async def update_investment_endpoint(
    id: str,
    payload: InvestmentCreateSchema,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    body_bytes = payload.model_dump_json().encode('utf-8')
    req = adapt_request(request, body_bytes, route_params={"id": id}, query_params={"code": code})
    res = update_investment(req)
    return adapt_response(res)

@router.delete("/investments/{id}", tags=["Investments"], description="Delete an investment.")
async def delete_investment_endpoint(
    id: str,
    request: Request,
    authorization: str = Header(..., description="Firebase Bearer Token"),
    code: Optional[str] = Query(None, description="Azure Functions host code")
):
    req = adapt_request(request, route_params={"id": id}, query_params={"code": code})
    res = delete_investment(req)
    return adapt_response(res)


# Register all routes to the main app instance under /api prefix
fastapi_app.include_router(router, prefix="/api")

# Custom Swagger UI route to pass the Azure Function key (code) parameter to openapi.json request
@fastapi_app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
    <title>Personal Finance API - Swagger UI</title>
    </head>
    <body>
    <div id="swagger-ui">
    </div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    let openapiurl = '/api/openapi.json';
    if (code) {
        openapiurl += '?code=' + encodeURIComponent(code);
    }
    const ui = SwaggerUIBundle({
        url: openapiurl,
        "dom_id": "#swagger-ui",
        "layout": "BaseLayout",
        "deepLinking": true,
        "showExtensions": true,
        "showCommonExtensions": true,
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
    })
    </script>
    </body>
    </html>
    """
    return HTMLResponse(html_content)

# Custom ReDoc route to pass the Azure Function key (code) parameter to openapi.json request
@fastapi_app.get("/api/redoc", include_in_schema=False)
async def custom_redoc_ui():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
    <title>Personal Finance API - ReDoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
    </head>
    <body>
    <redoc id="redoc-container"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"> </script>
    <script>
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    let openapiurl = '/api/openapi.json';
    if (code) {
        openapiurl += '?code=' + encodeURIComponent(code);
    }
    Redoc.init(openapiurl, {}, document.getElementById('redoc-container'));
    </script>
    </body>
    </html>
    """
    return HTMLResponse(html_content)
