import pytest
from unittest.mock import MagicMock, patch
from BL.user_profile_service import UserProfileService
from API.user_profile_dto import UserProfileDTO

@pytest.fixture
def service():
    with patch("BL.user_profile_service.UserProfileDAO"):
        return UserProfileService()

@pytest.fixture
def sample_dto():
    return UserProfileDTO(
        user_id="user_123",
        user_name="Test User",
        expense_types=["food"],
        payment_methods=[],
        monthly_income=5000.0
    )

def test_create_profile(service, sample_dto):
    service.user_profile_dao.create_profile.return_value = "profile_123"
    
    result = service.create_profile(sample_dto)
    
    assert result == "profile_123"
    service.user_profile_dao.create_profile.assert_called_once()

def test_get_profile(service):
    mock_entity = MagicMock()
    mock_entity.user_id = "user_123"
    mock_entity.user_name = "Test User"
    mock_entity.expense_types = []
    mock_entity.payment_methods = []
    mock_entity.monthly_income = 5000.0
    mock_entity.id = "profile_123"
    
    service.user_profile_dao.get_profile.return_value = mock_entity
    
    result = service.get_profile("user_123")
    
    assert result.id == "profile_123"
    assert result.user_name == "Test User"
    service.user_profile_dao.get_profile.assert_called_once_with("user_123")

def test_update_profile(service, sample_dto):
    service.user_profile_dao.update_profile.return_value = True
    
    result = service.update_profile(sample_dto, "profile_123")
    
    assert result is True
    service.user_profile_dao.update_profile.assert_called_once()

def test_delete_profile(service):
    service.user_profile_dao.delete_profile.return_value = True
    
    result = service.delete_profile("user_123", "profile_123")
    
    assert result is True
    service.user_profile_dao.delete_profile.assert_called_once_with("user_123", "profile_123")
