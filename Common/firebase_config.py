import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin SDK
cred = credentials.Certificate('personalfinance-a0728-firebase-adminsdk-vr1aa-826b24ddc7.json')
firebase_app = firebase_admin.initialize_app(cred)