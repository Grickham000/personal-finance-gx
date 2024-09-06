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

    def get_fixed_expenses(self, user_id: str) -> list:
        # Delegate to DAO to retrieve expenses
        fixed_expenses_entities = self.fixed_expense_dao.get_fixed_expenses(user_id)

        # Transform entities to DTOs
        return [self.fixed_expense_toa.entity_to_dto(fexpense) for fexpense in fixed_expenses_entities]

    def update_fixed_expense(self, fixed_expense_dto: FixedExpenseDTO,id):
        # Transform DTO to entity
        fixed_expense_entity = self.fixed_expense_toa.dto_to_entity(fixed_expense_dto)

        # Delegate to DAO to update the entity
        self.fixed_expense_dao.update_fixed_expense(fixed_expense_entity,id)

    def delete_fixed_expense(self,user_id,id):

        #Delegate to DAO to delete the entity 
        self.fixed_expense_dao.delete_fixed_expense(user_id,id)
