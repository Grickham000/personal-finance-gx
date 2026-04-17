import pytest
import azure.functions as func
import json
from unittest.mock import MagicMock, patch
from API.user_profile_controller import create_user_profile, get_user_profile, update_user_profile, delete_user_profile

@pytest.fixture
def mock_req():
    req = MagicMock(spec=func.HttpRequest)
    req.headers = {"Authorization": "Bearer fake_token"}
    return req

@pytest.fixture
def sample_profile_payload():
    return {
        "user_name": "Test User",
        "expense_types": ["food", "transport"],
        "payment_methods": [{"name": "card1", "cut_date": 16}],
        "monthly_income": 5000.0
    }

@patch("API.user_profile_controller.user_profile_service")
def test_create_user_profile_success(mock_service, mock_req, sample_profile_payload):
    mock_service.verify_token.return_value = "user_123"
    mock_service.create_profile.return_value = "profile_123"
    mock_req.get_json.return_value = sample_profile_payload

    res = create_user_profile(mock_req)

    assert res.status_code == 201
    assert json.loads(res.get_body().decode()) == {"id": "profile_123"}
    mock_service.create_profile.assert_called_once()

@patch("API.user_profile_controller.user_profile_service")
def test_create_user_profile_unauthorized(mock_service, mock_req):
    mock_service.verify_token.return_value = None

    res = create_user_profile(mock_req)

    assert res.status_code == 401

@patch("API.user_profile_controller.user_profile_service")
def test_get_user_profile_success(mock_service, mock_req):
    mock_service.verify_token.return_value = "user_123"
    
    # Mocking the returned DTO to_dict behavior
    mock_dto = MagicMock()
    mock_dto.to_dict.return_value = {"id": "profile_123", "user_name": "Test User"}
    mock_service.get_profile.return_value = mock_dto

    res = get_user_profile(mock_req)

    assert res.status_code == 200
    assert json.loads(res.get_body().decode()) == {"id": "profile_123", "user_name": "Test User"}
    mock_service.get_profile.assert_called_once_with("user_123")

@patch("API.user_profile_controller.user_profile_service")
def test_update_user_profile_success(mock_service, mock_req, sample_profile_payload):
    mock_service.verify_token.return_value = "user_123"
    mock_req.route_params = {"id": "profile_123"}
    mock_req.get_json.return_value = sample_profile_payload

    res = update_user_profile(mock_req)

    assert res.status_code == 200
    mock_service.update_profile.assert_called_once()

@patch("API.user_profile_controller.user_profile_service")
def test_delete_user_profile_success(mock_service, mock_req):
    mock_service.verify_token.return_value = "user_123"
    mock_req.route_params = {"id": "profile_123"}

    res = delete_user_profile(mock_req)

    assert res.status_code == 200
    mock_service.delete_profile.assert_called_once_with("user_123", "profile_123")
