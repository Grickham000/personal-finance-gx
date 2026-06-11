import re
from datetime import datetime

class CreditCardPaymentApiModel:
    def __init__(self, payment_method_id: str, statement_month: str, payment_date: str, amount_paid: float, user_id: str = None):
        self.user_id = user_id
        self.payment_method_id = payment_method_id
        self.statement_month = statement_month
        self.payment_date = payment_date
        self.amount_paid = amount_paid

    @classmethod
    def from_dict(cls, data: dict):
        if not data:
            raise ValueError("Data dictionary cannot be empty")

        payment_method_id = data.get('payment_method_id')
        statement_month = data.get('statement_month')
        payment_date = data.get('payment_date')
        amount_paid = data.get('amount_paid')

        if not payment_method_id or not isinstance(payment_method_id, str):
            raise ValueError("payment_method_id is required and must be a string")

        if not statement_month or not isinstance(statement_month, str):
            raise ValueError("statement_month is required")
        if not re.match(r"^\d{4}-\d{2}$", statement_month):
            raise ValueError("statement_month must be in YYYY-MM format")

        if not payment_date or not isinstance(payment_date, str):
            raise ValueError("payment_date is required")
        try:
            # Clean Z suffix and try parsing
            clean_date = payment_date.replace('Z', '+00:00')
            datetime.fromisoformat(clean_date)
        except Exception:
            raise ValueError("payment_date must be a valid ISO datetime string")

        if amount_paid is None:
            raise ValueError("amount_paid is required")
        try:
            amount_paid = float(amount_paid)
            if amount_paid <= 0:
                raise ValueError()
        except ValueError:
            raise ValueError("amount_paid must be a positive number")

        return cls(
            payment_method_id=payment_method_id,
            statement_month=statement_month,
            payment_date=payment_date,
            amount_paid=amount_paid
        )

    def to_dict(self):
        return {
            'payment_method_id': self.payment_method_id,
            'statement_month': self.statement_month,
            'payment_date': self.payment_date,
            'amount_paid': self.amount_paid
        }
