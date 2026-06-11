from API.credit_card_payment_dto import CreditCardPaymentDTO
from DL.credit_card_payment_entity import CreditCardPaymentEntity

class CreditCardPaymentTOA:
    def dto_to_entity(self, dto: CreditCardPaymentDTO) -> CreditCardPaymentEntity:
        return CreditCardPaymentEntity(
            user_id=dto.user_id,
            payment_method_id=dto.payment_method_id,
            statement_month=dto.statement_month,
            payment_date=dto.payment_date,
            amount_paid=dto.amount_paid,
            id=dto.id
        )

    def entity_to_dto(self, entity: CreditCardPaymentEntity) -> CreditCardPaymentDTO:
        return CreditCardPaymentDTO(
            id=entity.id,
            user_id=entity.user_id,
            payment_method_id=entity.payment_method_id,
            statement_month=entity.statement_month,
            payment_date=entity.payment_date,
            amount_paid=entity.amount_paid
        )
