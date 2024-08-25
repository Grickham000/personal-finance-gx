class ExpenseEntity:
    def __init__(self, user_id, expense, expense_type, payment_method, expense_description, expense_date,id=None):
        self.id = id
        self.user_id = user_id
        self.expense = expense
        self.expense_type = expense_type
        self.payment_method = payment_method
        self.expense_description = expense_description
        self.expense_date = expense_date

    def to_dict(self):
        return {
            'id':self.id,
            'user_id': self.user_id,
            'expense': self.expense,
            'expense_type': self.expense_type,
            'payment_method': self.payment_method,
            'expense_description': self.expense_description,
            'expense_date': self.expense_date
        }
    
    def __repr__(self):
        return (f"ExpenseEntity(user_id={self.user_id}, expense={self.expense}, "
                f"expense_type={self.expense_type}, payment_method={self.payment_method}, "
                f"expense_description={self.expense_description}, expense_date={self.expense_date})")

    @classmethod
    def from_dict(cls, data, id):
        return cls(
            id=id,
            user_id=data['user_id'],
            expense=data['expense'],
            expense_type=data['expense_type'],
            payment_method=data['payment_method'],
            expense_description=data['expense_description'],
            expense_date=data['expense_date']
        )
