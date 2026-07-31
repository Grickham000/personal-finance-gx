import pytest
import json
import azure.functions as func
from unittest.mock import MagicMock, patch
from Common.Models.savings_account_api_model import SavingsAccountApiModel
from API.savings_account_dto import SavingsAccountDTO
from DL.savings_account_entity import SavingsAccountEntity
from DL.savings_account_toa import SavingsAccountTOA
from DL.savings_account_dao import SavingsAccountDAO
from BL.savings_account_service import SavingsAccountService
import API.savings_accounts_controller as savings_controller

# =========================================================
# 1. API Model Validation Tests
# =========================================================
def test_api_model_validation_success():
    data = {
        "name": "High Yield Savings",
        "interest_rate": 4.5,
        "balance": 1000.0,
        "description": "My emergency fund"
    }
    model = SavingsAccountApiModel.from_dict(data)
    assert model.name == "High Yield Savings"
    assert model.interest_rate == 4.5
    assert model.balance == 1000.0
    assert model.description == "My emergency fund"

def test_api_model_validation_missing_name():
    data = {"interest_rate": 4.5}
    with pytest.raises(ValueError, match="name is required"):
        SavingsAccountApiModel.from_dict(data)

def test_api_model_validation_negative_rate():
    data = {"name": "Test", "interest_rate": -1.0}
    with pytest.raises(ValueError, match="interest_rate must be non-negative"):
        SavingsAccountApiModel.from_dict(data)

# =========================================================
# 2. DTO, Entity, and TOA Tests
# =========================================================
def test_toa_dto_entity_mapping():
    dto = SavingsAccountDTO(
        user_id="user_123",
        name="Savings Account A",
        interest_rate=3.5,
        balance=500.0,
        description="Fund A",
        id="account_id_999"
    )
    toa = SavingsAccountTOA()
    entity = toa.dto_to_entity(dto)
    
    assert entity.user_id == "user_123"
    assert entity.name == "Savings Account A"
    assert entity.interest_rate == 3.5
    assert entity.balance == 500.0
    assert entity.description == "Fund A"
    assert entity.id == "account_id_999"

    mapped_dto = toa.entity_to_dto(entity)
    assert mapped_dto.user_id == "user_123"
    assert mapped_dto.id == "account_id_999"

# =========================================================
# 3. DAO Tests
# =========================================================
@pytest.fixture
def mock_dao():
    with patch("DL.savings_account_dao.firestore.client"):
        return SavingsAccountDAO()

def test_dao_create_account(mock_dao):
    mock_ref = MagicMock()
    mock_ref.id = "doc_123"
    mock_dao.db.collection.return_value.add.return_value = (None, mock_ref)
    
    entity = SavingsAccountEntity("user_123", "Ally", 4.0, 100.0, "Desc")
    res = mock_dao.create_savings_account(entity)
    
    assert res == "doc_123"
    mock_dao.db.collection.assert_called_once_with("savings_accounts")

def test_dao_get_accounts(mock_dao):
    mock_doc1 = MagicMock()
    mock_doc1.id = "acc1"
    mock_doc1.to_dict.return_value = {
        "user_id": "user_123",
        "name": "Ally",
        "interest_rate": 4.0,
        "balance": 100.0,
        "description": "Desc"
    }
    
    mock_dao.db.collection.return_value.where.return_value.stream.return_value = [mock_doc1]
    res = mock_dao.get_savings_accounts("user_123")
    
    assert len(res) == 1
    assert res[0].name == "Ally"
    assert res[0].id == "acc1"

# =========================================================
# 4. Service Tests
# =========================================================
@pytest.fixture
def mock_service():
    with patch("BL.savings_account_service.SavingsAccountDAO"):
        return SavingsAccountService()

def test_service_create_account(mock_service):
    mock_service.dao.create_savings_account.return_value = "new_id"
    dto = SavingsAccountDTO("user123", "Account", 2.0, 50.0, "")
    res = mock_service.create_savings_account(dto)
    assert res == "new_id"
    mock_service.dao.create_savings_account.assert_called_once()

# =========================================================
# 5. Controller Tests
# =========================================================
@pytest.fixture
def mock_controller_service(mocker):
    return mocker.patch('API.savings_accounts_controller.savings_account_service')

def test_controller_create_success(mock_controller_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer my_valid_token"
    req.get_json.return_value = {
        "name": "Savings Account",
        "interest_rate": 2.5,
        "balance": 200.0,
        "description": "Short term"
    }

    mock_controller_service.verify_token.return_value = "user_abc"
    mock_controller_service.create_savings_account.return_value = "id_abc"

    response = savings_controller.create_savings_account(req)
    assert response.status_code == 201
    body = json.loads(response.get_body().decode())
    assert body["id"] == "id_abc"

def test_controller_get_all_success(mock_controller_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer my_valid_token"

    mock_controller_service.verify_token.return_value = "user_abc"
    mock_dto = SavingsAccountDTO("user_abc", "Savings", 1.5, 100.0, "", "id123")
    mock_controller_service.get_savings_accounts.return_value = [mock_dto]

    response = savings_controller.get_savings_accounts(req)
    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert len(body) == 1
    assert body[0]["id"] == "id123"


# =========================================================
# 6. Savings History Integration Tests
# =========================================================
def test_savings_history_toa_mapping():
    history_data = [{"balance": 5000.0, "date": "2026-07-31T02:00:00Z"}]
    dto = SavingsAccountDTO(
        user_id="user_123",
        name="Savings Account A",
        interest_rate=3.5,
        balance=5000.0,
        description="Fund A",
        id="account_id_999",
        history=history_data
    )
    toa = SavingsAccountTOA()
    entity = toa.dto_to_entity(dto)
    assert entity.history == history_data

    mapped_dto = toa.entity_to_dto(entity)
    assert mapped_dto.history == history_data

def test_savings_dao_create_initializes_history(mock_dao):
    mock_ref = MagicMock()
    mock_ref.id = "new_doc_id_history"
    mock_dao.db.collection.return_value.add.return_value = (None, mock_ref)

    entity = SavingsAccountEntity("user_123", "Ally", 4.0, 100.0, "Desc")
    mock_dao.create_savings_account(entity)

    # Assert history was auto-initialized
    assert len(entity.history) == 1
    assert entity.history[0]["balance"] == 100.0
    assert "date" in entity.history[0]

def test_savings_dao_update_history_balance_changed(mock_dao):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "user_id": "user_123",
        "name": "Ally",
        "interest_rate": 4.0,
        "balance": 100.0,
        "history": [{"balance": 100.0, "date": "2026-07-31T01:00:00Z"}]
    }
    mock_dao.db.collection.return_value.document.return_value.get.return_value = mock_doc

    # Update with new balance: 120.0
    updated_entity = SavingsAccountEntity("user_123", "Ally", 4.0, 120.0, "Desc", history=[])
    res = mock_dao.update_savings_account(updated_entity, "doc_123")

    assert res is True
    # Should have old history + new entry
    assert len(updated_entity.history) == 2
    assert updated_entity.history[0]["balance"] == 100.0
    assert updated_entity.history[1]["balance"] == 120.0

def test_savings_dao_update_history_balance_same(mock_dao):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "user_id": "user_123",
        "name": "Ally",
        "interest_rate": 4.0,
        "balance": 100.0,
        "history": [{"balance": 100.0, "date": "2026-07-31T01:00:00Z"}]
    }
    mock_dao.db.collection.return_value.document.return_value.get.return_value = mock_doc

    # Update with same balance: 100.0 (change interest_rate to 4.5)
    updated_entity = SavingsAccountEntity("user_123", "Ally", 4.5, 100.0, "Desc", history=[])
    res = mock_dao.update_savings_account(updated_entity, "doc_123")

    assert res is True
    # History should remain unchanged
    assert len(updated_entity.history) == 1
    assert updated_entity.history[0]["balance"] == 100.0


def test_savings_from_dict_sorts_history_descending():
    data = {
        "user_id": "user_123",
        "name": "Ally",
        "interest_rate": 4.0,
        "balance": 100.0,
        "history": [
            {"balance": 100.0, "date": "2026-07-30T10:00:00Z"},
            {"balance": 120.0, "date": "2026-07-31T12:00:00Z"},
            {"balance": 110.0, "date": "2026-07-31T02:00:00Z"}
        ]
    }
    entity = SavingsAccountEntity.from_dict(data)
    assert len(entity.history) == 3
    # Newest should be index 0
    assert entity.history[0]["date"] == "2026-07-31T12:00:00Z"
    assert entity.history[0]["balance"] == 120.0
    # Middle should be index 1
    assert entity.history[1]["date"] == "2026-07-31T02:00:00Z"
    assert entity.history[1]["balance"] == 110.0
    # Oldest should be index 2
    assert entity.history[2]["date"] == "2026-07-30T10:00:00Z"
    assert entity.history[2]["balance"] == 100.0
