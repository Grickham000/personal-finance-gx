import azure.functions as func
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from API.fastapi_app import fastapi_app

# Expose the FastAPI app through Azure Functions ASGI wrapper
app = func.AsgiFunctionApp(app=fastapi_app, http_auth_level=func.AuthLevel.ANONYMOUS)