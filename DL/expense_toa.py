from API.expense_dto import ExpenseDTO
from DL.expense_entity import ExpenseEntity

class ExpenseTOA:
    def dto_to_entity(self, dto: ExpenseDTO) -> ExpenseEntity:
        return ExpenseEntity(
            user_id=dto.user_id,
            expense=dto.expense,
            expense_type=dto.expense_type,
            payment_method=dto.payment_method,
            expense_description=dto.expense_description,
            expense_date=dto.expense_date
        )

    def entity_to_dto(self, entity: ExpenseEntity) -> ExpenseDTO:
        return ExpenseDTO(
            id=entity.id,
            user_id=entity.user_id,
            expense=entity.expense,
            expense_type=entity.expense_type,
            payment_method=entity.payment_method,
            expense_description=entity.expense_description,
            expense_date=entity.expense_date
        )