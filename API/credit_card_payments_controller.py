import json
import azure.functions as func
import logging
from BL.credit_card_payment_service import CreditCardPaymentService
from API.credit_card_payment_dto import CreditCardPaymentDTO
from Common.Models.credit_card_payment_api_model import CreditCardPaymentApiModel

payment_service = CreditCardPaymentService()

def create_credit_card_payment(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create credit card payment request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized", status_code=401)
        token = auth_header.split('Bearer ')[1]
        user_id = payment_service.verify_token(token)

        req_body = req.get_json()
        api_model = CreditCardPaymentApiModel.from_dict(req_body)
        api_model.user_id = user_id

        dto = CreditCardPaymentDTO.from_api_model(api_model)
        payment_id = payment_service.create_payment(dto)

        return func.HttpResponse(
            body=json.dumps({"id": payment_id, "message": "Credit card payment added successfully"}),
            status_code=201,
            mimetype="application/json"
        )
    except Exception as e:
        return func.HttpResponse(f"Failed to add credit card payment: {str(e)}", status_code=400)

def get_credit_card_payments(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get credit card payments request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized", status_code=401)
        token = auth_header.split('Bearer ')[1]
        user_id = payment_service.verify_token(token)

        payments = payment_service.get_payments(user_id)
        payments_dict_list = [p.to_dict() for p in payments]

        return func.HttpResponse(
            body=json.dumps(payments_dict_list),
            status_code=200,
            mimetype='application/json'
        )
    except Exception as e:
        return func.HttpResponse(f"Failed to retrieve credit card payments: {str(e)}", status_code=400)

def delete_credit_card_payment(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing delete credit card payment request.')
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return func.HttpResponse("Unauthorized", status_code=401)
        token = auth_header.split('Bearer ')[1]
        user_id = payment_service.verify_token(token)

        id = req.route_params.get('id')
        if not id:
            return func.HttpResponse("Payment ID is required", status_code=400)

        payment_service.delete_payment(user_id, id)
        return func.HttpResponse("Credit card payment deleted successfully", status_code=200)
    except PermissionError as pe:
        return func.HttpResponse(str(pe), status_code=403)
    except ValueError as ve:
        return func.HttpResponse(str(ve), status_code=404)
    except Exception as e:
        return func.HttpResponse(f"Failed to delete credit card payment: {str(e)}", status_code=400)
