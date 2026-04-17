class UserProfileDTO:
    def __init__(self, user_id: str, user_name: str, expense_types: list, payment_methods: list, monthly_income: float, id: str = None):
        self.id = id
        self.user_id = user_id
        self.user_name = user_name
        self.expense_types = expense_types
        self.payment_methods = payment_methods
        self.monthly_income = monthly_income

    def to_dict(self):
        result = {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'expense_types': self.expense_types,
            'payment_methods': self.payment_methods,
            'monthly_income': self.monthly_income
        }
        if self.id:
            result['id'] = self.id
        return result
