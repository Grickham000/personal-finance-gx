import pytest
import json
import azure.functions as func
from datetime import datetime, date
from unittest.mock import MagicMock, patch
from Common.Models.investment_api_model import InvestmentApiModel
from API.investment_dto import InvestmentDTO
from DL.investment_entity import InvestmentEntity
from DL.investment_toa import InvestmentTOA
from DL.investment_dao import InvestmentDAO
from BL.investment_service import InvestmentService
import API.investments_controller as investments_controller

# =========================================================
# 1. API Model Validation Tests
# =========================================================
def test_investment_model_success_with_end_date():
    data = {
        "name": "Treasury Bill",
        "interest_rate": 5.1,
        "amount": 1000.0,
        "has_end_date": True,
        "end_date": "2026-12-01T00:00:00Z",
        "is_released": False,
        "description": "6-Month Bond"
    }
    model = InvestmentApiModel.from_dict(data)
    assert model.name == "Treasury Bill"
    assert model.has_end_date is True
    assert model.end_date == "2026-12-01T00:00:00Z"

def test_investment_model_success_no_end_date():
    data = {
        "name": "S&P 500 ETF",
        "interest_rate": 8.0,
        "amount": 25000.0,
        "has_end_date": False,
        "end_date": None,
        "is_released": False,
        "description": "Stock market index"
    }
    model = InvestmentApiModel.from_dict(data)
    assert model.end_date is None
    assert model.has_end_date is False

def test_investment_model_invalid_missing_end_date():
    data = {
        "name": "Treasury Bill",
        "interest_rate": 5.1,
        "amount": 1000.0,
        "has_end_date": True,
        "end_date": None
    }
    with pytest.raises(ValueError, match="end_date is required when has_end_date is True"):
        InvestmentApiModel.from_dict(data)

def test_investment_model_invalid_has_end_date_false_with_date():
    data = {
        "name": "S&P 500 ETF",
        "interest_rate": 8.0,
        "amount": 25000.0,
        "has_end_date": False,
        "end_date": "2026-12-01T00:00:00Z"
    }
    with pytest.raises(ValueError, match="end_date must be None when has_end_date is False"):
        InvestmentApiModel.from_dict(data)

# =========================================================
# 2. DTO, Entity, and TOA Tests
# =========================================================
def test_investment_toa_mapping():
    dto = InvestmentDTO(
        user_id="user_1",
        name="CD 1 Year",
        interest_rate=4.75,
        amount=10000.0,
        has_end_date=True,
        end_date="2027-01-01T00:00:00Z",
        is_released=False,
        description="Certificate of Deposit",
        id="inv_id_1"
    )
    toa = InvestmentTOA()
    entity = toa.dto_to_entity(dto)
    assert entity.name == "CD 1 Year"
    assert entity.id == "inv_id_1"
    assert entity.end_date == "2027-01-01T00:00:00Z"

    mapped_dto = toa.entity_to_dto(entity)
    assert mapped_dto.name == "CD 1 Year"
    assert mapped_dto.id == "inv_id_1"

# =========================================================
# 3. DAO Tests
# =========================================================
@pytest.fixture
def mock_inv_dao():
    with patch("DL.investment_dao.firestore.client"):
        return InvestmentDAO()

def test_inv_dao_create(mock_inv_dao):
    mock_ref = MagicMock()
    mock_ref.id = "new_inv_id"
    mock_inv_dao.db.collection.return_value.add.return_value = (None, mock_ref)

    entity = InvestmentEntity("user_1", "CD", 5.0, 1000.0, True, "2026-12-01T00:00:00Z", False, "")
    res = mock_inv_dao.create_investment(entity)

    assert res == "new_inv_id"
    assert isinstance(entity.end_date, datetime) # DAO converts string to datetime

def test_inv_dao_get_converts_dates(mock_inv_dao):
    mock_doc = MagicMock()
    mock_doc.id = "inv_id_10"
    mock_doc.to_dict.return_value = {
        "user_id": "user_1",
        "name": "CD",
        "interest_rate": 5.0,
        "amount": 1000.0,
        "has_end_date": True,
        "end_date": datetime(2026, 12, 1, 10, 0, 0),
        "is_released": False,
        "description": ""
    }
    mock_inv_dao.db.collection.return_value.where.return_value.stream.return_value = [mock_doc]

    res = mock_inv_dao.get_investments("user_1")
    assert len(res) == 1
    assert res[0].end_date == "2026-12-01 10:00:00"

# =========================================================
# 4. Service Tests
# =========================================================
@pytest.fixture
def mock_inv_service():
    with patch("BL.investment_service.InvestmentDAO"):
        return InvestmentService()

def test_inv_service_get_with_filters(mock_inv_service):
    entity_released = InvestmentEntity("user_1", "InvA", 4.0, 100.0, True, "2026-06-01", True, "", "id1")
    entity_active = InvestmentEntity("user_1", "InvB", 4.0, 100.0, True, "2026-06-01", False, "", "id2")
    
    mock_inv_service.dao.get_investments.return_value = [entity_released, entity_active]

    res_released = mock_inv_service.get_investments("user_1", is_released=True)
    assert len(res_released) == 1
    assert res_released[0].id == "id1"

    res_active = mock_inv_service.get_investments("user_1", is_released=False)
    assert len(res_active) == 1
    assert res_active[0].id == "id2"

# =========================================================
# 5. Controller Tests
# =========================================================
@pytest.fixture
def mock_controller_inv_service(mocker):
    return mocker.patch('API.investments_controller.investment_service')

def test_controller_create_inv_success(mock_controller_inv_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer mock_token"
    req.get_json.return_value = {
        "name": "T-Bill",
        "interest_rate": 5.2,
        "amount": 2000.0,
        "has_end_date": True,
        "end_date": "2026-10-10T00:00:00Z"
    }

    mock_controller_inv_service.verify_token.return_value = "user_1"
    mock_controller_inv_service.create_investment.return_value = "doc_inv_id"

    response = investments_controller.create_investment(req)
    assert response.status_code == 201
    body = json.loads(response.get_body().decode())
    assert body["id"] == "doc_inv_id"

def test_controller_get_inv_filtered(mock_controller_inv_service):
    req = MagicMock(spec=func.HttpRequest)
    req.headers.get.return_value = "Bearer mock_token"
    req.params = {"is_released": "true", "has_end_date": "true"}

    mock_controller_inv_service.verify_token.return_value = "user_1"
    mock_dto = InvestmentDTO("user_1", "CD", 5.0, 1000.0, True, "2026-10-10", True, "", "id_99")
    mock_controller_inv_service.get_investments.return_value = [mock_dto]

    response = investments_controller.get_investments(req)
    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert len(body) == 1
    assert body[0]["id"] == "id_99"
    mock_controller_inv_service.get_investments.assert_called_once_with("user_1", is_released=True, has_end_date=True)


# =========================================================
# 6. History Integration Tests
# =========================================================
def test_investment_history_toa_mapping():
    history_data = [{"amount": 1000.0, "date": "2026-07-31T02:00:00Z"}]
    dto = InvestmentDTO(
        user_id="user_1",
        name="Stock",
        interest_rate=10.0,
        amount=1000.0,
        has_end_date=False,
        id="inv_id_2",
        history=history_data
    )
    toa = InvestmentTOA()
    entity = toa.dto_to_entity(dto)
    assert entity.history == history_data

    mapped_dto = toa.entity_to_dto(entity)
    assert mapped_dto.history == history_data

def test_inv_dao_create_initializes_history(mock_inv_dao):
    mock_ref = MagicMock()
    mock_ref.id = "new_inv_id_history"
    mock_inv_dao.db.collection.return_value.add.return_value = (None, mock_ref)

    entity = InvestmentEntity("user_1", "Stock", 10.0, 1000.0, False, None, False, "")
    mock_inv_dao.create_investment(entity)

    # Assert history was auto-initialized
    assert len(entity.history) == 1
    assert entity.history[0]["amount"] == 1000.0
    assert "date" in entity.history[0]

def test_inv_dao_update_history_amount_changed(mock_inv_dao):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "user_id": "user_1",
        "name": "Stock",
        "interest_rate": 10.0,
        "amount": 1000.0,
        "has_end_date": False,
        "history": [{"amount": 1000.0, "date": "2026-07-31T01:00:00Z"}]
    }
    mock_inv_dao.db.collection.return_value.document.return_value.get.return_value = mock_doc

    # Update with new amount: 1200.0
    updated_entity = InvestmentEntity("user_1", "Stock", 10.0, 1200.0, False, None, False, "", history=[])
    res = mock_inv_dao.update_investment(updated_entity, "inv_id_1")

    assert res is True
    # Should have old history + new entry
    assert len(updated_entity.history) == 2
    assert updated_entity.history[0]["amount"] == 1000.0
    assert updated_entity.history[1]["amount"] == 1200.0

def test_inv_dao_update_history_amount_same(mock_inv_dao):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "user_id": "user_1",
        "name": "Stock",
        "interest_rate": 10.0,
        "amount": 1000.0,
        "has_end_date": False,
        "history": [{"amount": 1000.0, "date": "2026-07-31T01:00:00Z"}]
    }
    mock_inv_dao.db.collection.return_value.document.return_value.get.return_value = mock_doc

    # Update with same amount: 1000.0 (change interest_rate to 12.0)
    updated_entity = InvestmentEntity("user_1", "Stock", 12.0, 1000.0, False, None, False, "", history=[])
    res = mock_inv_dao.update_investment(updated_entity, "inv_id_1")

    assert res is True
    # History should remain unchanged
    assert len(updated_entity.history) == 1
    assert updated_entity.history[0]["amount"] == 1000.0


def test_investment_from_dict_sorts_history_descending():
    data = {
        "user_id": "user_1",
        "name": "Stock",
        "interest_rate": 10.0,
        "amount": 1000.0,
        "has_end_date": False,
        "history": [
            {"amount": 1000.0, "date": "2026-07-30T10:00:00Z"},
            {"amount": 1200.0, "date": "2026-07-31T12:00:00Z"},
            {"amount": 1100.0, "date": "2026-07-31T02:00:00Z"}
        ]
    }
    entity = InvestmentEntity.from_dict(data)
    assert len(entity.history) == 3
    # Newest should be index 0
    assert entity.history[0]["date"] == "2026-07-31T12:00:00Z"
    assert entity.history[0]["amount"] == 1200.0
    # Middle should be index 1
    assert entity.history[1]["date"] == "2026-07-31T02:00:00Z"
    assert entity.history[1]["amount"] == 1100.0
    # Oldest should be index 2
    assert entity.history[2]["date"] == "2026-07-30T10:00:00Z"
    assert entity.history[2]["amount"] == 1000.0
