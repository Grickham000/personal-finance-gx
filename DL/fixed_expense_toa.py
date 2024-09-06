from API.fixed_expense_dto import FixedExpenseDTO
from DL.fixed_expense_entity import FixedExpenseEntity

class FixedExpenseTOA:
    def dto_to_entity(self, dto: FixedExpenseDTO) -> FixedExpenseEntity:
        return FixedExpenseEntity(
            user_id=dto.user_id,
            fixed_expense=dto.fixed_expense,
            fexpense_type=dto.fexpense_type,
            fexpense_description=dto.fexpense_description,
            fexpense_start_date=dto.fexpense_start_date,
            fexpense_end_date=dto.fexpense_end_date,
            expire=dto.expire
        )

    def entity_to_dto(self, entity: FixedExpenseEntity) -> FixedExpenseDTO:
        return FixedExpenseDTO(
            id=entity.id,
            user_id=entity.user_id,
            fixed_expense=entity.fixed_expense,
            fexpense_type=entity.fexpense_type,
            fexpense_description=entity.fexpense_description,
            fexpense_start_date=entity.fexpense_start_date,
            fexpense_end_date=entity.fexpense_end_date,
            expire=entity.expire
        )