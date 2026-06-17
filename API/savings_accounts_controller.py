import json
import azure.functions as func
import logging
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from BL.savings_account_service import SavingsAccountService
from API.savings_account_dto import SavingsAccountDTO
from Common.Models.savings_account_api_model import SavingsAccountApiModel

savings_account_service = SavingsAccountService()

def create_savings_account(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create savings account request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = savings_account_service.verify_token(token)

        req_body = req.get_json()
        api_model = SavingsAccountApiModel.from_dict(req_body)
        dto = SavingsAccountDTO.from_api_model(api_model, user_id=user_id)

        account_id = savings_account_service.create_savings_account(dto)
        return func.HttpResponse(
            body=json.dumps({"id": account_id, "message": "Savings account created successfully"}),
            status_code=201,
            mimetype="application/json"
        )
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error creating savings account: {e}")
        return func.HttpResponse(body=f"Failed to create savings account: {str(e)}", status_code=400)

def get_savings_accounts(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get savings accounts request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = savings_account_service.verify_token(token)

        accounts = savings_account_service.get_savings_accounts(user_id)
        accounts_dict = [account.to_dict() for account in accounts]
        return func.HttpResponse(
            body=json.dumps(accounts_dict),
            status_code=200,
            mimetype="application/json"
        )
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except Exception as e:
        logging.error(f"Error retrieving savings accounts: {e}")
        return func.HttpResponse(body=f"Failed to retrieve savings accounts: {str(e)}", status_code=400)

def get_savings_account_by_id(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get savings account by ID request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = savings_account_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Savings account ID is required", status_code=400)

        dto = savings_account_service.get_savings_account_by_id(user_id, id)
        if dto:
            return func.HttpResponse(
                body=json.dumps(dto.to_dict()),
                status_code=200,
                mimetype="application/json"
            )
        else:
            return func.HttpResponse("Savings account not found", status_code=404)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error retrieving savings account: {e}")
        return func.HttpResponse(body=f"Failed to retrieve savings account: {str(e)}", status_code=400)

def update_savings_account(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing update savings account request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = savings_account_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Savings account ID is required", status_code=400)

        req_body = req.get_json()
        api_model = SavingsAccountApiModel.from_dict(req_body)
        dto = SavingsAccountDTO.from_api_model(api_model, user_id=user_id, id=id)

        savings_account_service.update_savings_account(dto, id)
        return func.HttpResponse("Savings account updated successfully", status_code=200)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error updating savings account: {e}")
        return func.HttpResponse(body=f"Failed to update savings account: {str(e)}", status_code=400)

def delete_savings_account(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing delete savings account request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = savings_account_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Savings account ID is required", status_code=400)

        savings_account_service.delete_savings_account(user_id, id)
        return func.HttpResponse("Savings account deleted successfully", status_code=200)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error deleting savings account: {e}")
        return func.HttpResponse(body=f"Failed to delete savings account: {str(e)}", status_code=400)
