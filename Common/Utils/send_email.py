import requests
import os
import logging

def send_verification_email(id_token):
    api_key = os.getenv('FIREBASE_API_KEY')
    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "requestType": "VERIFY_EMAIL",
        "idToken": id_token
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        logging.info('Verification email sent.')
    else:
        logging.error('Error sending verification email: ' + response.text)

def get_id_token(custom_token):
    import requests
    api_key = os.getenv('FIREBASE_API_KEY')
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "token": custom_token,
        "returnSecureToken": True
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()['idToken']
    else:
        logging.error('Error signing in with custom token: ' + response.text)
        raise Exception('Error signing in with custom token')