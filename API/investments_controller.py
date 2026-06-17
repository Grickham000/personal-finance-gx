import json
import azure.functions as func
import logging
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from BL.investment_service import InvestmentService
from API.investment_dto import InvestmentDTO
from Common.Models.investment_api_model import InvestmentApiModel

investment_service = InvestmentService()

def create_investment(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create investment request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = investment_service.verify_token(token)

        req_body = req.get_json()
        api_model = InvestmentApiModel.from_dict(req_body)
        dto = InvestmentDTO.from_api_model(api_model, user_id=user_id)

        investment_id = investment_service.create_investment(dto)
        return func.HttpResponse(
            body=json.dumps({"id": investment_id, "message": "Investment created successfully"}),
            status_code=201,
            mimetype="application/json"
        )
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error creating investment: {e}")
        return func.HttpResponse(body=f"Failed to create investment: {str(e)}", status_code=400)

def get_investments(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get investments request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = investment_service.verify_token(token)

        # Parse optional filters
        is_released_param = req.params.get('is_released')
        is_released = None
        if is_released_param is not None:
            is_released = is_released_param.lower() == 'true'

        has_end_date_param = req.params.get('has_end_date')
        has_end_date = None
        if has_end_date_param is not None:
            has_end_date = has_end_date_param.lower() == 'true'

        investments = investment_service.get_investments(user_id, is_released=is_released, has_end_date=has_end_date)
        investments_dict = [inv.to_dict() for inv in investments]
        return func.HttpResponse(
            body=json.dumps(investments_dict),
            status_code=200,
            mimetype="application/json"
        )
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except Exception as e:
        logging.error(f"Error retrieving investments: {e}")
        return func.HttpResponse(body=f"Failed to retrieve investments: {str(e)}", status_code=400)

def get_investment_by_id(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get investment by ID request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = investment_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Investment ID is required", status_code=400)

        dto = investment_service.get_investment_by_id(user_id, id)
        if dto:
            return func.HttpResponse(
                body=json.dumps(dto.to_dict()),
                status_code=200,
                mimetype="application/json"
            )
        else:
            return func.HttpResponse("Investment not found", status_code=404)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error retrieving investment: {e}")
        return func.HttpResponse(body=f"Failed to retrieve investment: {str(e)}", status_code=400)

def update_investment(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing update investment request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = investment_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Investment ID is required", status_code=400)

        req_body = req.get_json()
        api_model = InvestmentApiModel.from_dict(req_body)
        dto = InvestmentDTO.from_api_model(api_model, user_id=user_id, id=id)

        investment_service.update_investment(dto, id)
        return func.HttpResponse("Investment updated successfully", status_code=200)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error updating investment: {e}")
        return func.HttpResponse(body=f"Failed to update investment: {str(e)}", status_code=400)

def delete_investment(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing delete investment request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized: Missing or invalid token format", status_code=401)
        
        token = auth_header.split('Bearer ')[1]
        user_id = investment_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Investment ID is required", status_code=400)

        investment_service.delete_investment(user_id, id)
        return func.HttpResponse("Investment deleted successfully", status_code=200)
    except ValueError as ve:
        return func.HttpResponse(body=str(ve), status_code=400)
    except PermissionError as pe:
        return func.HttpResponse(body=str(pe), status_code=403)
    except Exception as e:
        logging.error(f"Error deleting investment: {e}")
        return func.HttpResponse(body=f"Failed to delete investment: {str(e)}", status_code=400)
