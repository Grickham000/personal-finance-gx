from API.savings_account_dto import SavingsAccountDTO
from DL.savings_account_entity import SavingsAccountEntity

class SavingsAccountTOA:
    def dto_to_entity(self, dto: SavingsAccountDTO) -> SavingsAccountEntity:
        return SavingsAccountEntity(
            user_id=dto.user_id,
            name=dto.name,
            interest_rate=dto.interest_rate,
            balance=dto.balance,
            description=dto.description,
            id=dto.id,
            history=dto.history
        )

    def entity_to_dto(self, entity: SavingsAccountEntity) -> SavingsAccountDTO:
        return SavingsAccountDTO(
            user_id=entity.user_id,
            name=entity.name,
            interest_rate=entity.interest_rate,
            balance=entity.balance,
            description=entity.description,
            id=entity.id,
            history=entity.history
        )
