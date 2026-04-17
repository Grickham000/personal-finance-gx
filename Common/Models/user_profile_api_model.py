class UserProfileApiModel:
    def __init__(self, user_name: str, expense_types: list, payment_methods: list, monthly_income: float):
        self.user_name = user_name
        self.expense_types = expense_types
        self.payment_methods = payment_methods
        self.monthly_income = monthly_income

    @classmethod
    def from_dict(cls, data: dict):
        if not data:
            raise ValueError("Data dictionary cannot be empty")
        
        user_name = data.get('user_name')
        expense_types = data.get('expense_types', [])
        payment_methods = data.get('payment_methods', [])
        monthly_income = data.get('monthly_income')
        
        if not user_name:
            raise ValueError("user_name is required")
            
        if not isinstance(expense_types, list):
            raise ValueError("expense_types must be a list")
            
        if not isinstance(payment_methods, list):
            raise ValueError("payment_methods must be a list")
            
        if monthly_income is None:
            raise ValueError("monthly_income is required")
            
        try:
            monthly_income = float(monthly_income)
        except ValueError:
            raise ValueError("monthly_income must be a valid number")

        return cls(user_name, expense_types, payment_methods, monthly_income)

    def to_dict(self):
        return {
            'user_name': self.user_name,
            'expense_types': self.expense_types,
            'payment_methods': self.payment_methods,
            'monthly_income': self.monthly_income
        }
