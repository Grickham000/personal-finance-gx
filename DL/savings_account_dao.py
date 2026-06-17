from firebase_admin import firestore
from DL.savings_account_entity import SavingsAccountEntity
import logging

class SavingsAccountDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_savings_account(self, savings_account_entity: SavingsAccountEntity) -> str:
        ref = self.db.collection('savings_accounts').add(savings_account_entity.to_dict())
        return ref[1].id

    def get_savings_accounts(self, user_id: str) -> list:
        logging.info(f"Retrieving savings accounts for user_id: {user_id}")
        stream = self.db.collection('savings_accounts').where('user_id', '==', user_id).stream()
        
        accounts_list = []
        for doc in stream:
            data = doc.to_dict()
            doc_id = doc.id
            entity = SavingsAccountEntity.from_dict(data, id=doc_id)
            accounts_list.append(entity)
        return accounts_list

    def get_savings_account_by_id(self, user_id: str, id: str) -> SavingsAccountEntity:
        logging.info(f"Retrieving savings account {id} for user_id: {user_id}")
        doc_ref = self.db.collection('savings_accounts').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == user_id:
                return SavingsAccountEntity.from_dict(data, id=id)
            else:
                logging.warning(f"Attempt to access savings account {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to access this savings account.")
        return None

    def update_savings_account(self, savings_account_entity: SavingsAccountEntity, id: str) -> bool:
        doc_ref = self.db.collection('savings_accounts').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == savings_account_entity.user_id:
                doc_ref.update(savings_account_entity.to_dict())
                logging.info(f"Savings account {id} successfully updated.")
                return True
            else:
                logging.warning(f"Attempt to update savings account {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to update this savings account.")
        else:
            logging.warning(f"Savings account {id} does not exist.")
            raise ValueError(f"Savings account with ID {id} does not exist.")

    def delete_savings_account(self, user_id: str, id: str) -> bool:
        doc_ref = self.db.collection('savings_accounts').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == user_id:
                doc_ref.delete()
                logging.info(f"Savings account {id} successfully deleted.")
                return True
            else:
                logging.warning(f"Attempt to delete savings account {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to delete this savings account.")
        else:
            logging.warning(f"Savings account {id} does not exist.")
            raise ValueError(f"Savings account with ID {id} does not exist.")
