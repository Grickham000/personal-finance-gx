import pytest
import os
from firebase_admin import auth
from Common.firebase_config import firebase_app  # Ensure Firebase is initialized
from Common.Utils.send_email import get_id_token

def pytest_addoption(parser):
    parser.addoption(
        "--env", action="store", default="local", help="Environment to run tests against: local or online"
    )

@pytest.fixture(scope="session")
def base_url(request):
    env = request.config.getoption("--env")
    if env == "online":
        return "https://personalfinancegx-cgctcugsgtfgfpew.eastus2-01.azurewebsites.net/api"
    else:
        return "http://localhost:7071/api"

@pytest.fixture(scope="session")
def auth_headers():
    api_key = os.getenv('FIREBASE_API_KEY')
    if not api_key:
        pytest.skip("FIREBASE_API_KEY environment variable is not set. Cannot run API tests.")
    
    test_email = "guru.aalfa+test001@gmail.com"
    test_password = "TestPassword123!"
    
    # Validation: Check if the user already exists, and if so, delete it to ensure a clean state
    try:
        existing_user = auth.get_user_by_email(test_email)
        auth.delete_user(existing_user.uid)
    except auth.UserNotFoundError:
        pass  # User doesn't exist, which is fine
        
    # Create the testing user
    user = auth.create_user(
        email=test_email,
        password=test_password,
        email_verified=True  # Important: The backend verify_token function requires the email to be verified
    )
    
    try:
        # Generate a custom token for the user and decode it
        custom_token = auth.create_custom_token(user.uid).decode('utf-8')
        
        # Use the custom token to get an ID token via the utility function
        id_token = get_id_token(custom_token)
        
        headers = {"Authorization": f"Bearer {id_token}", "Content-Type": "application/json"}
        
        # Add Azure Function Key if provided (required for AuthLevel.FUNCTION in cloud)
        azure_key = os.getenv('AZURE_FUNCTION_KEY')
        if azure_key:
            headers["x-functions-key"] = azure_key
            
        print("\n\n[PAUSED] Test user created! You can now verify the backend state if you wish.")
        # Non-interactive execution, skipping manual pause
        
        yield headers
        
    finally:
        # At the end of the routine, delete the user
        try:
            auth.delete_user(user.uid)
        except Exception as e:
            print(f"Failed to clean up test user {user.uid}: {e}")
