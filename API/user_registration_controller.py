import azure.functions as func
from firebase_admin import auth
from Common.firebase_config import firebase_app
import logging
from Common.Utils.send_email import send_verification_email,get_id_token

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

        # Generate a custom token for the user and decode it to a string
        custom_token = auth.create_custom_token(user.uid).decode('utf-8')

        # Use the custom token to sign in the user and get an ID token
        id_token = get_id_token(custom_token)

        # Send email verification
        send_verification_email(id_token)

        return func.HttpResponse(f"User {user.uid} created successfully. Verification email sent.", status_code=201)
    except Exception as e:
        return func.HttpResponse(f"User registration failed: {str(e)}", status_code=400)