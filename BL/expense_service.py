from firebase_admin import auth
from DL.expense_toa import ExpenseTOA
from DL.expense_dao import ExpenseDAO
from DL.user_profile_dao import UserProfileDAO
from API.expense_dto import ExpenseDTO
import logging

class ExpenseService:
    def __init__(self):
        self.expense_toa = ExpenseTOA()
        self.expense_dao = ExpenseDAO()
        self.user_profile_dao = UserProfileDAO()

    def verify_token(self, token: str) -> str:
        try:
        # Decode and verify the ID token
            decoded_token = auth.verify_id_token(token)
            
            # Check if the email is verified
            if not decoded_token.get('email_verified', False):
                raise ValueError("User's email is not verified.")

            # Return the user's UID if the email is verified
            return decoded_token['uid']
        except Exception as e:
            # Handle exceptions (e.g., token verification failure)
            raise ValueError(f"Token verification failed: {str(e)}")

    def create_expense(self, expense_dto: ExpenseDTO) -> str:
        # Resolve payment_method_id by name if not provided
        if not expense_dto.payment_method_id and expense_dto.payment_method:
            profile = self.user_profile_dao.get_profile(expense_dto.user_id)
            if profile:
                pm_name_lower = expense_dto.payment_method.lower()
                for pm in (profile.payment_methods or []):
                    if pm.get('name', '').lower() == pm_name_lower:
                        expense_dto.payment_method_id = pm.get('id')
                        break

        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to save the entity
        return self.expense_dao.create_expense(expense_entity)

    def get_expenses(self, user_id: str, expense_type=None, payment_method=None, start_date=None, end_date=None) -> list:
        # Delegate to DAO to retrieve expenses
        expenses_entities = self.expense_dao.get_expenses(user_id)

        from datetime import datetime
        filtered_entities = []
        for entity in expenses_entities:
            if expense_type and entity.expense_type.lower() != expense_type.lower():
                continue
            if payment_method and entity.payment_method.lower() != payment_method.lower():
                continue
            if start_date or end_date:
                try:
                    # Clean Z suffix if present
                    ent_date_str = entity.expense_date.replace('Z', '')
                    ent_date = datetime.fromisoformat(ent_date_str)
                    
                    if start_date:
                        s_date = datetime.fromisoformat(start_date.replace('Z', ''))
                        if ent_date < s_date:
                            continue
                    if end_date:
                        e_date = datetime.fromisoformat(end_date.replace('Z', ''))
                        if ent_date > e_date:
                            continue
                except Exception as e:
                    logging.warning(f"Error filtering expense by date: {e}")
            filtered_entities.append(entity)

        # Transform entities to DTOs
        return [self.expense_toa.entity_to_dto(expense) for expense in filtered_entities]

    def get_expense_by_id(self, user_id: str, id: str) -> ExpenseDTO:
        entity = self.expense_dao.get_expense_by_id(user_id, id)
        if entity:
            return self.expense_toa.entity_to_dto(entity)
        return None

    def update_expense(self, expense_dto: ExpenseDTO, id):
        # Resolve payment_method_id by name if not provided
        if not expense_dto.payment_method_id and expense_dto.payment_method:
            profile = self.user_profile_dao.get_profile(expense_dto.user_id)
            if profile:
                pm_name_lower = expense_dto.payment_method.lower()
                for pm in (profile.payment_methods or []):
                    if pm.get('name', '').lower() == pm_name_lower:
                        expense_dto.payment_method_id = pm.get('id')
                        break

        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to update the entity
        self.expense_dao.update_expense(expense_entity, id)

    def delete_expense(self,user_id,id):

        #Delegate to DAO to delete the entity 
        self.expense_dao.delete_expense(user_id,id)
