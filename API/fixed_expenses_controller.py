import json
import azure.functions as func
import logging
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from BL.fixed_expense_service import FixedExpenseService
from API.fixed_expense_dto import FixedExpenseDTO
from Common.Models.fiexd_expense_api_model import FixedExpenseApiModel

fixed_expense_service = FixedExpenseService()

def create_fixed_expense(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create fixed expense request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = fixed_expense_service.verify_token(token)

        # Parse request data and transform to DTO
        req_body = req.get_json()
        fixed_expense_api_model = FixedExpenseApiModel(**req_body)
        fixed_expense_dto = FixedExpenseDTO.from_api_model(fixed_expense_api_model)
        fixed_expense_dto.user_id = user_id

        # Delegate to service to handle creation
        fixed_expense_id = fixed_expense_service.create_fixed_expense(fixed_expense_dto)

        return func.HttpResponse(f"Fixed Expense added successfully with ID: {fixed_expense_id}", status_code=201)
    except Exception as e:
        return func.HttpResponse(f"Failed to add fixed expense: {str(e)}", status_code=400)

def get_fixed_expenses(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get fixed expenses request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = fixed_expense_service.verify_token(token)

        # Delegate to service to retrieve expenses
        fixed_expenses_list = fixed_expense_service.get_fixed_expenses(user_id)
        # Convert each ExpenseDTO to a dictionary
        fixed_expenses_dict_list = [fexpense.to_dict() for fexpense in fixed_expenses_list]

        # Convert the list of dictionaries to JSON
        fixed_expenses_json = json.dumps(fixed_expenses_dict_list)

        return func.HttpResponse(
            body=fixed_expenses_json,
            status_code=200,
            mimetype='application/json'  # Ensure the response is recognized as JSON
        )
    except Exception as e:
        return func.HttpResponse(
            body=f"Failed to retrieve fixed expenses: {str(e)}",
            status_code=400,
            mimetype='text/plain'  # Default content type for errors
        )

def update_fixed_expense(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing update fixed expense request.')

    try:
        # Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = fixed_expense_service.verify_token(token)

        # Parse request data and transform to DTO
        req_body = req.get_json()
        id = req.route_params.get('id')
        fixed_expense_api_model = FixedExpenseApiModel(**req_body)
        fixed_expense_dto = FixedExpenseDTO.from_api_model(fixed_expense_api_model)
        fixed_expense_dto.user_id = user_id

        # Delegate to service to handle update
        fixed_expense_service.update_fixed_expense(fixed_expense_dto,id)

        return func.HttpResponse(f"Fixed Expense updated successfully", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Failed to update fixed expense: {str(e)}", status_code=400)

def delete_fixed_expense(req : func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing delete fixed expense request')
    try:
        #Authenticate user
        token = req.headers.get('Authorization').split('Bearer ')[1]
        user_id = fixed_expense_service.verify_token(token)

        if(user_id):
            #Parse request data and transform to DTO 
            id = req.route_params.get('id')
            #Delegate to service to handle delete
            fixed_expense_service.delete_fixed_expense(user_id,id)
        else:
            return func.HttpResponse(f"Not authorized",status_code=401)

        return func.HttpResponse(f"Fixed Expense deleted successfully",status_code=404)
    except Exception as e:
        return func.HttpResponse(f"Failed to update fixed expense: {str(e)}",status_code=400)