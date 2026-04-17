import pytest
from unittest.mock import MagicMock, patch
from DL.user_profile_dao import UserProfileDAO
from DL.user_profile_entity import UserProfileEntity

@pytest.fixture
def dao():
    with patch("DL.user_profile_dao.firestore.client"):
        return UserProfileDAO()

@pytest.fixture
def sample_entity():
    return UserProfileEntity(
        user_id="user_123",
        user_name="Test User",
        expense_types=["food"],
        payment_methods=[],
        monthly_income=5000.0,
        id="profile_123"
    )

def test_create_profile_success(dao, sample_entity):
    # Mocking that no existing profile exists
    mock_query = MagicMock()
    mock_query.limit.return_value.get.return_value = []
    dao.db.collection.return_value.where.return_value = mock_query
    
    # Mocking the add return value
    mock_ref = MagicMock()
    mock_ref.id = "profile_123"
    dao.db.collection.return_value.add.return_value = (None, mock_ref)
    
    result = dao.create_profile(sample_entity)
    
    assert result == "profile_123"
    dao.db.collection.return_value.add.assert_called_once()

def test_create_profile_already_exists(dao, sample_entity):
    # Mocking that an existing profile exists
    mock_query = MagicMock()
    mock_query.limit.return_value.get.return_value = [MagicMock()]
    dao.db.collection.return_value.where.return_value = mock_query
    
    with pytest.raises(ValueError):
        dao.create_profile(sample_entity)

def test_get_profile_success(dao):
    mock_doc = MagicMock()
    mock_doc.id = "profile_123"
    mock_doc.to_dict.return_value = {
        "user_id": "user_123",
        "user_name": "Test User",
        "expense_types": [],
        "payment_methods": [],
        "monthly_income": 5000.0
    }
    
    mock_query = MagicMock()
    mock_query.limit.return_value.get.return_value = [mock_doc]
    dao.db.collection.return_value.where.return_value = mock_query
    
    result = dao.get_profile("user_123")
    
    assert result.id == "profile_123"
    assert result.user_id == "user_123"
    assert result.monthly_income == 5000.0

def test_update_profile_success(dao, sample_entity):
    mock_doc_ref = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"user_id": "user_123"}
    mock_doc_ref.get.return_value = mock_doc
    
    dao.db.collection.return_value.document.return_value = mock_doc_ref
    
    result = dao.update_profile(sample_entity, "profile_123")
    
    assert result is True
    mock_doc_ref.update.assert_called_once()

def test_delete_profile_success(dao):
    mock_doc_ref = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"user_id": "user_123"}
    mock_doc_ref.get.return_value = mock_doc
    
    dao.db.collection.return_value.document.return_value = mock_doc_ref
    
    result = dao.delete_profile("user_123", "profile_123")
    
    assert result is True
    mock_doc_ref.delete.assert_called_once()
