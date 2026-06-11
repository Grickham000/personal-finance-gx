from firebase_admin import auth
from DL.fixed_expense_toa import FixedExpenseTOA
from DL.fixed_expense_dao import FixedExpenseDAO
from API.fixed_expense_dto import FixedExpenseDTO

class FixedExpenseService:
    def __init__(self):
        self.fixed_expense_toa = FixedExpenseTOA()
        self.fixed_expense_dao = FixedExpenseDAO()

    def verify_token(self, token: str) -> str:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']

    def create_fixed_expense(self, fixed_expense_dto: FixedExpenseDTO) -> str:
        # Transform DTO to entity
        fixed_expense_entity = self.fixed_expense_toa.dto_to_entity(fixed_expense_dto)

        # Delegate to DAO to save the entity
        return self.fixed_expense_dao.create_fixed_expense(fixed_expense_entity)

    def get_fixed_expenses(self, user_id: str, fexpense_type=None, start_date=None, end_date=None, expire=None) -> list:
        # Delegate to DAO to retrieve expenses
        fixed_expenses_entities = self.fixed_expense_dao.get_fixed_expenses(user_id)

        from datetime import datetime
        import logging
        filtered_entities = []
        for entity in fixed_expenses_entities:
            if fexpense_type and entity.fexpense_type.lower() != fexpense_type.lower():
                continue
            if expire is not None:
                # Convert expire string/boolean parameter to bool
                expire_bool = str(expire).lower() in ('true', '1')
                if entity.expire != expire_bool:
                    continue
            if start_date or end_date:
                try:
                    # Clean Z suffix if present
                    ent_start_str = entity.fexpense_start_date.replace('Z', '')
                    ent_end_str = entity.fexpense_end_date.replace('Z', '')
                    ent_start = datetime.fromisoformat(ent_start_str)
                    ent_end = datetime.fromisoformat(ent_end_str)
                    
                    if start_date:
                        s_date = datetime.fromisoformat(start_date.replace('Z', ''))
                        if ent_start < s_date:
                            continue
                    if end_date:
                        e_date = datetime.fromisoformat(end_date.replace('Z', ''))
                        if ent_end > e_date:
                            continue
                except Exception as e:
                    logging.warning(f"Error filtering fixed expense by date: {e}")
            filtered_entities.append(entity)

        # Transform entities to DTOs
        return [self.fixed_expense_toa.entity_to_dto(fexpense) for fexpense in filtered_entities]

    def get_fixed_expense_by_id(self, user_id: str, id: str) -> FixedExpenseDTO:
        entity = self.fixed_expense_dao.get_fixed_expense_by_id(user_id, id)
        if entity:
            return self.fixed_expense_toa.entity_to_dto(entity)
        return None

    def update_fixed_expense(self, fixed_expense_dto: FixedExpenseDTO,id):
        # Transform DTO to entity
        fixed_expense_entity = self.fixed_expense_toa.dto_to_entity(fixed_expense_dto)

        # Delegate to DAO to update the entity
        self.fixed_expense_dao.update_fixed_expense(fixed_expense_entity,id)

    def delete_fixed_expense(self,user_id,id):

        #Delegate to DAO to delete the entity 
        self.fixed_expense_dao.delete_fixed_expense(user_id,id)
