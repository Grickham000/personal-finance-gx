class BaseCreditCardPaymentEntity:
    def __init__(self, user_id, payment_method_id, statement_month, payment_date, amount_paid):
        self.user_id = user_id
        self.payment_method_id = payment_method_id
        self.statement_month = statement_month
        self.payment_date = payment_date
        self.amount_paid = amount_paid

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'payment_method_id': self.payment_method_id,
            'statement_month': self.statement_month,
            'payment_date': self.payment_date,
            'amount_paid': self.amount_paid
        }

    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, payment_method_id={self.payment_method_id}, "
                f"statement_month={self.statement_month}, payment_date={self.payment_date}, amount_paid={self.amount_paid})")

class CreditCardPaymentEntity(BaseCreditCardPaymentEntity):
    def __init__(self, user_id, payment_method_id, statement_month, payment_date, amount_paid, id=None):
        super().__init__(user_id, payment_method_id, statement_month, payment_date, amount_paid)
        self.id = id

    def to_dict(self):
        base_dict = super().to_dict()
        if self.id is not None:
            base_dict['id'] = self.id
        return base_dict

    @classmethod
    def from_dict(cls, data, id=None):
        return cls(
            user_id=data['user_id'],
            payment_method_id=data['payment_method_id'],
            statement_month=data['statement_month'],
            payment_date=data['payment_date'],
            amount_paid=data['amount_paid'],
            id=id
        )

    def __repr__(self):
        return super().__repr__() + f", id={self.id}"
