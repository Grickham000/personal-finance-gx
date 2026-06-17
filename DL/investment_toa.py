from API.investment_dto import InvestmentDTO
from DL.investment_entity import InvestmentEntity

class InvestmentTOA:
    def dto_to_entity(self, dto: InvestmentDTO) -> InvestmentEntity:
        return InvestmentEntity(
            user_id=dto.user_id,
            name=dto.name,
            interest_rate=dto.interest_rate,
            amount=dto.amount,
            has_end_date=dto.has_end_date,
            end_date=dto.end_date,
            is_released=dto.is_released,
            description=dto.description,
            id=dto.id
        )

    def entity_to_dto(self, entity: InvestmentEntity) -> InvestmentDTO:
        return InvestmentDTO(
            user_id=entity.user_id,
            name=entity.name,
            interest_rate=entity.interest_rate,
            amount=entity.amount,
            has_end_date=entity.has_end_date,
            end_date=entity.end_date,
            is_released=entity.is_released,
            description=entity.description,
            id=entity.id
        )
