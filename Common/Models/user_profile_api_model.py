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
            
        validated_payment_methods = []
        for pm in payment_methods:
            if not isinstance(pm, dict):
                raise ValueError("Each payment method must be a dictionary")
            if 'name' not in pm or not pm['name']:
                raise ValueError("Each payment method must have a non-empty name")
            if 'is_immediate' not in pm:
                raise ValueError("Each payment method must specify whether it is immediate (is_immediate)")
            if not isinstance(pm['is_immediate'], bool):
                raise ValueError("is_immediate must be a boolean")
            
            import uuid
            pm_id = pm.get('id') or pm.get('id')  # Fallback if None
            if not pm_id:
                pm_id = uuid.uuid4().hex
            
            validated_pm = {
                'id': pm_id,
                'name': pm['name'],
                'is_immediate': pm['is_immediate']
            }
            
            if pm['is_immediate']:
                if 'cut_date' in pm and pm['cut_date'] != 0:
                    raise ValueError(f"For immediate payment methods like '{pm['name']}', cut_date must be 0")
                validated_pm['cut_date'] = 0
                validated_pm['days_to_pay'] = 0
            else:
                if 'cut_date' not in pm:
                    raise ValueError(f"For non-immediate payment methods like '{pm['name']}', cut_date is required")
                try:
                    cut_date = int(pm['cut_date'])
                    if not (1 <= cut_date <= 31):
                        raise ValueError()
                except ValueError:
                    raise ValueError(f"For non-immediate payment methods like '{pm['name']}', cut_date must be an integer between 1 and 31")
                validated_pm['cut_date'] = cut_date
                
                if 'days_to_pay' not in pm:
                    raise ValueError(f"For non-immediate payment methods like '{pm['name']}', days_to_pay is required")
                try:
                    days_to_pay = int(pm['days_to_pay'])
                    if days_to_pay < 0:
                        raise ValueError()
                except ValueError:
                    raise ValueError(f"For non-immediate payment methods like '{pm['name']}', days_to_pay must be a non-negative integer")
                validated_pm['days_to_pay'] = days_to_pay
            validated_payment_methods.append(validated_pm)
        payment_methods = validated_payment_methods
            
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
