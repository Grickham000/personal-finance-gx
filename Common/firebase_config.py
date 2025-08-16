import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin SDK
cred = credentials.Certificate('personalfinance-a0728-firebase-adminsdk-vr1aa-1b8d2c9ed3.json')
firebase_app = firebase_admin.initialize_app(cred)