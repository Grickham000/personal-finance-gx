from firebase_admin import firestore
from DL.credit_card_payment_entity import CreditCardPaymentEntity
from datetime import datetime, date
import logging

class CreditCardPaymentDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_payment(self, payment_entity: CreditCardPaymentEntity) -> str:
        if isinstance(payment_entity.payment_date, str):
            payment_entity.payment_date = datetime.fromisoformat(payment_entity.payment_date.replace("Z", "+00:00"))
        
        ref = self.db.collection('credit_card_payment').add(payment_entity.to_dict())
        return ref[1].id

    def get_payments(self, user_id: str) -> list:
        logging.info(f"Retrieving credit card payments for user_id: {user_id}")
        payments_stream = self.db.collection('credit_card_payment').where('user_id', '==', user_id).stream()
        
        payments_list = []
        for p in payments_stream:
            p_dict = p.to_dict()
            doc_id = p.id
            
            if isinstance(p_dict.get('payment_date'), date):
                p_dict['payment_date'] = p_dict['payment_date'].strftime("%Y-%m-%d %H:%M:%S")
                
            logging.info(f"Credit card payment data: {p_dict}, Document ID: {doc_id}")
            entity = CreditCardPaymentEntity.from_dict(p_dict, id=doc_id)
            payments_list.append(entity)
            
        return payments_list

    def delete_payment(self, user_id: str, id: str) -> bool:
        ref = self.db.collection('credit_card_payment').document(id)
        p = ref.get()
        if p.exists:
            p_data = p.to_dict()
            if p_data.get('user_id') == user_id:
                ref.delete()
                logging.info(f"Credit card payment {id} successfully deleted.")
                return True
            else:
                raise PermissionError("You do not have permission to delete this payment.")
        else:
            raise ValueError(f"Credit card payment with ID {id} does not exist.")

    def get_payment_by_id(self, user_id: str, id: str) -> CreditCardPaymentEntity:
        ref = self.db.collection('credit_card_payment').document(id)
        p = ref.get()
        if p.exists:
            p_dict = p.to_dict()
            if p_dict.get('user_id') == user_id:
                if isinstance(p_dict.get('payment_date'), date):
                    p_dict['payment_date'] = p_dict['payment_date'].strftime("%Y-%m-%d %H:%M:%S")
                return CreditCardPaymentEntity.from_dict(p_dict, id=id)
            else:
                raise PermissionError("You do not have permission to access this payment.")
        return None
