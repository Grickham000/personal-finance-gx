from firebase_admin import auth
from DL.credit_card_payment_toa import CreditCardPaymentTOA
from DL.credit_card_payment_dao import CreditCardPaymentDAO
from API.credit_card_payment_dto import CreditCardPaymentDTO
import logging

class CreditCardPaymentService:
    def __init__(self):
        self.payment_toa = CreditCardPaymentTOA()
        self.payment_dao = CreditCardPaymentDAO()

    def verify_token(self, token: str) -> str:
        try:
            decoded_token = auth.verify_id_token(token)
            if not decoded_token.get('email_verified', False):
                raise ValueError("User's email is not verified.")
            return decoded_token['uid']
        except Exception as e:
            raise ValueError(f"Token verification failed: {str(e)}")

    def create_payment(self, dto: CreditCardPaymentDTO) -> str:
        entity = self.payment_toa.dto_to_entity(dto)
        return self.payment_dao.create_payment(entity)

    def get_payments(self, user_id: str) -> list:
        entities = self.payment_dao.get_payments(user_id)
        return [self.payment_toa.entity_to_dto(e) for e in entities]

    def get_payment_by_id(self, user_id: str, id: str) -> CreditCardPaymentDTO:
        entity = self.payment_dao.get_payment_by_id(user_id, id)
        if entity:
            return self.payment_toa.entity_to_dto(entity)
        return None

    def delete_payment(self, user_id: str, id: str):
        self.payment_dao.delete_payment(user_id, id)
