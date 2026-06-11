import pytest
import json
import azure.functions as func
from unittest.mock import MagicMock, patch
from DL.credit_card_payment_dao import CreditCardPaymentDAO
from DL.credit_card_payment_entity import CreditCardPaymentEntity
from BL.credit_card_payment_service import CreditCardPaymentService
from API.credit_card_payment_dto import CreditCardPaymentDTO
from Common.Models.credit_card_payment_api_model import CreditCardPaymentApiModel
from API.credit_card_payments_controller import (
    create_credit_card_payment,
    get_credit_card_payments,
    delete_credit_card_payment
)

# --- DAO Tests ---
@pytest.fixture
def dao():
    with patch("DL.credit_card_payment_dao.firestore.client"):
        return CreditCardPaymentDAO()

@pytest.fixture
def sample_entity():
    return CreditCardPaymentEntity(
        user_id="user_123",
        payment_method_id="cc1_id",
        statement_month="2026-06",
        payment_date="2026-07-05T10:00:00Z",
        amount_paid=250.0,
        id="pay_123"
    )

def test_dao_create_payment(dao, sample_entity):
    mock_ref = MagicMock()
    mock_ref.id = "pay_123"
    dao.db.collection.return_value.add.return_value = (None, mock_ref)
    
    result = dao.create_payment(sample_entity)
    assert result == "pay_123"
    dao.db.collection.return_value.add.assert_called_once()

def test_dao_get_payments(dao):
    mock_doc = MagicMock()
    mock_doc.id = "pay_123"
    mock_doc.to_dict.return_value = {
        "user_id": "user_123",
        "payment_method_id": "cc1_id",
        "statement_month": "2026-06",
        "payment_date": "2026-07-05T10:00:00Z",
        "amount_paid": 250.0
    }
    dao.db.collection.return_value.where.return_value.stream.return_value = [mock_doc]
    
    result = dao.get_payments("user_123")
    assert len(result) == 1
    assert result[0].id == "pay_123"

def test_dao_delete_payment_success(dao):
    mock_doc_ref = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"user_id": "user_123"}
    mock_doc_ref.get.return_value = mock_doc
    dao.db.collection.return_value.document.return_value = mock_doc_ref
    
    result = dao.delete_payment("user_123", "pay_123")
    assert result is True
    mock_doc_ref.delete.assert_called_once()


# --- Service Tests ---
@pytest.fixture
def service(mocker):
    mocker.patch("BL.credit_card_payment_service.CreditCardPaymentTOA")
    mocker.patch("BL.credit_card_payment_service.CreditCardPaymentDAO")
    return CreditCardPaymentService()

def test_service_create_payment(service):
    mock_dto = MagicMock(spec=CreditCardPaymentDTO)
    mock_entity = MagicMock()
    service.payment_toa.dto_to_entity.return_value = mock_entity
    service.payment_dao.create_payment.return_value = "pay_123"
    
    result = service.create_payment(mock_dto)
    assert result == "pay_123"
    service.payment_toa.dto_to_entity.assert_called_once_with(mock_dto)
    service.payment_dao.create_payment.assert_called_once_with(mock_entity)

def test_service_get_payments(service):
    mock_entity = MagicMock()
    mock_dto = MagicMock()
    service.payment_dao.get_payments.return_value = [mock_entity]
    service.payment_toa.entity_to_dto.return_value = mock_dto
    
    result = service.get_payments("user_123")
    assert result == [mock_dto]
    service.payment_dao.get_payments.assert_called_once_with("user_123")
    service.payment_toa.entity_to_dto.assert_called_once_with(mock_entity)


# --- Controller Tests ---
@patch("API.credit_card_payments_controller.payment_service")
def test_controller_create_payment_success(mock_service):
    mock_service.verify_token.return_value = "user_123"
    mock_service.create_payment.return_value = "pay_123"
    
    req = MagicMock(spec=func.HttpRequest)
    req.headers = {"Authorization": "Bearer valid_token"}
    req.get_json.return_value = {
        "payment_method_id": "cc1_id",
        "statement_month": "2026-06",
        "payment_date": "2026-07-05T10:00:00Z",
        "amount_paid": 250.0
    }
    
    response = create_credit_card_payment(req)
    assert response.status_code == 201
    body = json.loads(response.get_body().decode())
    assert body["id"] == "pay_123"
    assert "successfully" in body["message"]

@patch("API.credit_card_payments_controller.payment_service")
def test_controller_get_payments_success(mock_service):
    mock_service.verify_token.return_value = "user_123"
    
    mock_dto = MagicMock(spec=CreditCardPaymentDTO)
    mock_dto.to_dict.return_value = {
        "id": "pay_123",
        "user_id": "user_123",
        "payment_method_id": "cc1_id",
        "statement_month": "2026-06",
        "payment_date": "2026-07-05T10:00:00Z",
        "amount_paid": 250.0
    }
    mock_service.get_payments.return_value = [mock_dto]
    
    req = MagicMock(spec=func.HttpRequest)
    req.headers = {"Authorization": "Bearer valid_token"}
    
    response = get_credit_card_payments(req)
    assert response.status_code == 200
    body = json.loads(response.get_body().decode())
    assert len(body) == 1
    assert body[0]["id"] == "pay_123"
