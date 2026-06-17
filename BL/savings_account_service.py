from firebase_admin import auth
from DL.savings_account_dao import SavingsAccountDAO
from DL.savings_account_toa import SavingsAccountTOA
from API.savings_account_dto import SavingsAccountDTO
import logging

class SavingsAccountService:
    def __init__(self):
        self.dao = SavingsAccountDAO()
        self.toa = SavingsAccountTOA()

    def verify_token(self, token: str) -> str:
        try:
            decoded_token = auth.verify_id_token(token)
            if not decoded_token.get('email_verified', False):
                raise ValueError("User's email is not verified.")
            return decoded_token['uid']
        except Exception as e:
            raise ValueError(f"Token verification failed: {str(e)}")

    def create_savings_account(self, dto: SavingsAccountDTO) -> str:
        entity = self.toa.dto_to_entity(dto)
        return self.dao.create_savings_account(entity)

    def get_savings_accounts(self, user_id: str) -> list:
        entities = self.dao.get_savings_accounts(user_id)
        return [self.toa.entity_to_dto(entity) for entity in entities]

    def get_savings_account_by_id(self, user_id: str, id: str) -> SavingsAccountDTO:
        entity = self.dao.get_savings_account_by_id(user_id, id)
        if entity:
            return self.toa.entity_to_dto(entity)
        return None

    def update_savings_account(self, dto: SavingsAccountDTO, id: str) -> bool:
        entity = self.toa.dto_to_entity(dto)
        return self.dao.update_savings_account(entity, id)

    def delete_savings_account(self, user_id: str, id: str) -> bool:
        return self.dao.delete_savings_account(user_id, id)
