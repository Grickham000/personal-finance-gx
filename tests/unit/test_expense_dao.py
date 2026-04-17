import pytest
from unittest.mock import MagicMock
from DL.expense_dao import ExpenseDAO
from DL.expense_entity import ExpenseEntity
from datetime import datetime

@pytest.fixture
def mock_firestore(mocker):
    return mocker.patch('DL.expense_dao.firestore')

@pytest.fixture
def expense_dao(mock_firestore):
    return ExpenseDAO()

def test_create_expense(expense_dao, mock_firestore):
    # Setup mock entity
    mock_entity = MagicMock(spec=ExpenseEntity)
    mock_entity.expense_date = "2023-10-01T10:00:00Z"
    mock_entity.payment_method_cut_date = "2023-10-15T10:00:00Z"
    mock_entity.to_dict.return_value = {"amount": 100}

    # Setup firestore mock
    mock_collection = mock_firestore.client().collection.return_value
    mock_ref = MagicMock()
    mock_ref.id = "doc_id_123"
    mock_collection.add.return_value = (None, mock_ref)

    # Call method
    result = expense_dao.create_expense(mock_entity)

    # Assertions
    assert result == "doc_id_123"
    mock_collection.add.assert_called_once_with({"amount": 100})

def test_update_expense_success(expense_dao, mock_firestore):
    mock_entity = MagicMock(spec=ExpenseEntity)
    mock_entity.user_id = "user123"
    mock_entity.to_dict.return_value = {"amount": 200}

    mock_doc = mock_firestore.client().collection().document()
    mock_snapshot = MagicMock()
    mock_snapshot.exists = True
    mock_snapshot.to_dict.return_value = {"user_id": "user123"}
    mock_doc.get.return_value = mock_snapshot

    result = expense_dao.update_expense(mock_entity, "expense_id")

    assert result is True
    mock_doc.update.assert_called_once_with({"amount": 200})

def test_update_expense_permission_error(expense_dao, mock_firestore):
    mock_entity = MagicMock(spec=ExpenseEntity)
    mock_entity.user_id = "user123"

    mock_doc = mock_firestore.client().collection().document()
    mock_snapshot = MagicMock()
    mock_snapshot.exists = True
    mock_snapshot.to_dict.return_value = {"user_id": "other_user"}
    mock_doc.get.return_value = mock_snapshot

    with pytest.raises(PermissionError, match="You do not have permission to update this expense."):
        expense_dao.update_expense(mock_entity, "expense_id")

def test_delete_expense_success(expense_dao, mock_firestore):
    mock_doc = mock_firestore.client().collection().document()
    mock_snapshot = MagicMock()
    mock_snapshot.exists = True
    mock_snapshot.to_dict.return_value = {"user_id": "user123"}
    mock_doc.get.return_value = mock_snapshot

    result = expense_dao.delete_expense("user123", "expense_id")

    assert result is True
    mock_doc.delete.assert_called_once()
