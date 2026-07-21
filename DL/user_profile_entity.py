class BaseUserProfileEntity:
    def __init__(self, user_id: str, user_name: str, expense_types: list, payment_methods: list, monthly_income: float, currency: str = 'USD'):
        self.user_id = user_id
        self.user_name = user_name
        self.expense_types = expense_types
        self.payment_methods = payment_methods
        self.monthly_income = monthly_income
        self.currency = currency

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'expense_types': self.expense_types,
            'payment_methods': self.payment_methods,
            'monthly_income': self.monthly_income,
            'currency': self.currency
        }

    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, user_name={self.user_name}, "
                f"expense_types={self.expense_types}, payment_methods={self.payment_methods}, "
                f"monthly_income={self.monthly_income}, currency={self.currency})")

class UserProfileEntity(BaseUserProfileEntity):
    def __init__(self, user_id: str, user_name: str, expense_types: list, payment_methods: list, monthly_income: float, currency: str = 'USD', id: str = None):
        super().__init__(user_id, user_name, expense_types, payment_methods, monthly_income, currency)
        self.id = id

    def to_dict(self):
        base_dict = super().to_dict()
        if self.id is not None:
            base_dict['id'] = self.id
        return base_dict

    @classmethod
    def from_dict(cls, data: dict, id: str = None):
        return cls(
            user_id=data.get('user_id'),
            user_name=data.get('user_name'),
            expense_types=data.get('expense_types', []),
            payment_methods=data.get('payment_methods', []),
            monthly_income=data.get('monthly_income', 0.0),
            currency=data.get('currency', 'USD'),
            id=id
        )

    def __repr__(self):
        return super().__repr__() + f", id={self.id}"
