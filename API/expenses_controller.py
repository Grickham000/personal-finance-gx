import json
import azure.functions as func
import logging
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from BL.expense_service import ExpenseService
from API.expense_dto import ExpenseDTO
from Common.Models.expense_api_model import ExpenseApiModel

expense_service = ExpenseService()

def create_expense(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create expense request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = expense_service.verify_token(token)

        # Parse request data and transform to DTO
        req_body = req.get_json()
        expense_api_model = ExpenseApiModel(**req_body)
        expense_dto = ExpenseDTO.from_api_model(expense_api_model)
        expense_dto.user_id = user_id

        # Delegate to service to handle creation
        expense_id = expense_service.create_expense(expense_dto)

        return func.HttpResponse(f"Expense added successfully with ID: {expense_id}", status_code=201)
    except Exception as e:
        return func.HttpResponse(f"Failed to add expense: {str(e)}", status_code=400)

def get_expenses(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get expenses request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = expense_service.verify_token(token)

        # Delegate to service to retrieve expenses
        expenses_list = expense_service.get_expenses(user_id)
        # Convert each ExpenseDTO to a dictionary
        expenses_dict_list = [expense.to_dict() for expense in expenses_list]

        # Convert the list of dictionaries to JSON
        expenses_json = json.dumps(expenses_dict_list)

        return func.HttpResponse(
            body=expenses_json,
            status_code=200,
            mimetype='application/json'  # Ensure the response is recognized as JSON
        )
    except Exception as e:
        return func.HttpResponse(
            body=f"Failed to retrieve expenses: {str(e)}",
            status_code=400,
            mimetype='text/plain'  # Default content type for errors
        )

def update_expense(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing update expense request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = expense_service.verify_token(token)

        # Parse request data and transform to DTO
        req_body = req.get_json()
        id = req.route_params.get('id')
        expense_api_model = ExpenseApiModel(**req_body)
        expense_dto = ExpenseDTO.from_api_model(expense_api_model)
        expense_dto.user_id = user_id

        # Delegate to service to handle update
        expense_service.update_expense(expense_dto,id)

        return func.HttpResponse(f"Expense updated successfully", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Failed to update expense: {str(e)}", status_code=400)
