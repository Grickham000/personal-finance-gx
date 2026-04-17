from API.user_profile_dto import UserProfileDTO
from DL.user_profile_entity import UserProfileEntity

class UserProfileTOA:
    def dto_to_entity(self, dto: UserProfileDTO) -> UserProfileEntity:
        return UserProfileEntity(
            user_id=dto.user_id,
            user_name=dto.user_name,
            expense_types=dto.expense_types,
            payment_methods=dto.payment_methods,
            monthly_income=dto.monthly_income,
            id=dto.id
        )

    def entity_to_dto(self, entity: UserProfileEntity) -> UserProfileDTO:
        return UserProfileDTO(
            id=entity.id,
            user_id=entity.user_id,
            user_name=entity.user_name,
            expense_types=entity.expense_types,
            payment_methods=entity.payment_methods,
            monthly_income=entity.monthly_income
        )
