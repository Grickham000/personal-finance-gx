import azure.functions as func
from firebase_admin import auth
from Common.firebase_config import firebase_app
import logging

def user_registration(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing user registration request.')

    try:
        # Parse request data
        req_body = req.get_json()
        email = req_body.get('email')
        password = req_body.get('password')

        # Create user in Firebase
        user = auth.create_user(
            email=email,
            password=password
        )

        return func.HttpResponse(f"User {user.uid} created successfully.", status_code=201)
    except Exception as e:
        return func.HttpResponse(f"User registration failed: {str(e)}", status_code=400)