import json
import azure.functions as func
import logging
from datetime import datetime
from firebase_admin import auth
from BL.money_balance_service import MoneyBalanceService

money_balance_service = MoneyBalanceService()

def verify_token(req: func.HttpRequest) -> str:
    """
    Verifies the Firebase ID token in the Authorization header.
    Returns the user's UID if valid and verified, otherwise None.
    """
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    id_token = auth_header.split(' ')[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        if not decoded_token.get('email_verified'):
            logging.warning("User email is not verified.")
            return None
        return decoded_token['uid']
    except Exception as e:
        logging.error(f"Error verifying token: {e}")
        return None

def get_money_balance(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get money balance request.')
    
    user_id = verify_token(req)
    if not user_id:
        return func.HttpResponse("Unauthorized", status_code=401)

    try:
        # Get target month from query parameters, default to current UTC month
        month_param = req.params.get('month')
        if not month_param:
            month_param = datetime.utcnow().strftime("%Y-%m")

        balance_details = money_balance_service.get_monthly_balance(user_id, month_param)

        return func.HttpResponse(
            body=json.dumps(balance_details),
            status_code=200,
            mimetype='application/json'
        )
    except ValueError as ve:
        return func.HttpResponse(
            body=str(ve),
            status_code=400,
            mimetype='text/plain'
        )
    except Exception as e:
        logging.error(f"Error calculating money balance: {str(e)}")
        return func.HttpResponse(
            body=f"Failed to calculate money balance: {str(e)}",
            status_code=500,
            mimetype='text/plain'
        )
