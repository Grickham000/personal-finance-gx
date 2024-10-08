from firebase_admin import auth
from DL.expense_toa import ExpenseTOA
from DL.expense_dao import ExpenseDAO
from API.expense_dto import ExpenseDTO
import logging

class ExpenseService:
    def __init__(self):
        self.expense_toa = ExpenseTOA()
        self.expense_dao = ExpenseDAO()

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
        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to save the entity
        return self.expense_dao.create_expense(expense_entity)

    def get_expenses(self, user_id: str) -> list:
        # Delegate to DAO to retrieve expenses
        expenses_entities = self.expense_dao.get_expenses(user_id)

        # Transform entities to DTOs
        return [self.expense_toa.entity_to_dto(expense) for expense in expenses_entities]

    def update_expense(self, expense_dto: ExpenseDTO,id):
        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to update the entity
        self.expense_dao.update_expense(expense_entity,id)

    def delete_expense(self,user_id,id):

        #Delegate to DAO to delete the entity 
        self.expense_dao.delete_expense(user_id,id)
