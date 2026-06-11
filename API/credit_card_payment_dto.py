from Common.Models.credit_card_payment_api_model import CreditCardPaymentApiModel

class CreditCardPaymentDTO:
    def __init__(self, user_id, payment_method_id, statement_month, payment_date, amount_paid, id=None):
        self.user_id = user_id
        self.payment_method_id = payment_method_id
        self.statement_month = statement_month
        self.payment_date = payment_date
        self.amount_paid = amount_paid
        self.id = id

    @classmethod
    def from_api_model(cls, api_model: CreditCardPaymentApiModel, id=None):
        return cls(
            user_id=api_model.user_id,
            payment_method_id=api_model.payment_method_id,
            statement_month=api_model.statement_month,
            payment_date=api_model.payment_date,
            amount_paid=api_model.amount_paid,
            id=id
        )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'payment_method_id': self.payment_method_id,
            'statement_month': self.statement_month,
            'payment_date': self.payment_date,
            'amount_paid': self.amount_paid
        }
