from firebase_admin import auth
from DL.investment_dao import InvestmentDAO
from DL.investment_toa import InvestmentTOA
from API.investment_dto import InvestmentDTO
import logging

class InvestmentService:
    def __init__(self):
        self.dao = InvestmentDAO()
        self.toa = InvestmentTOA()

    def verify_token(self, token: str) -> str:
        try:
            decoded_token = auth.verify_id_token(token)
            if not decoded_token.get('email_verified', False):
                raise ValueError("User's email is not verified.")
            return decoded_token['uid']
        except Exception as e:
            raise ValueError(f"Token verification failed: {str(e)}")

    def create_investment(self, dto: InvestmentDTO) -> str:
        entity = self.toa.dto_to_entity(dto)
        return self.dao.create_investment(entity)

    def get_investments(self, user_id: str, is_released: bool = None, has_end_date: bool = None) -> list:
        entities = self.dao.get_investments(user_id)
        
        filtered_entities = []
        for entity in entities:
            if is_released is not None and entity.is_released != is_released:
                continue
            if has_end_date is not None and entity.has_end_date != has_end_date:
                continue
            filtered_entities.append(entity)
            
        return [self.toa.entity_to_dto(entity) for entity in filtered_entities]

    def get_investment_by_id(self, user_id: str, id: str) -> InvestmentDTO:
        entity = self.dao.get_investment_by_id(user_id, id)
        if entity:
            return self.toa.entity_to_dto(entity)
        return None

    def update_investment(self, dto: InvestmentDTO, id: str) -> bool:
        entity = self.toa.dto_to_entity(dto)
        return self.dao.update_investment(entity, id)

    def delete_investment(self, user_id: str, id: str) -> bool:
        return self.dao.delete_investment(user_id, id)
