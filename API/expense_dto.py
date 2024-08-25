from Common.Models.expense_api_model import ExpenseApiModel

class ExpenseDTO:
    def __init__(self, user_id, expense, expense_type, payment_method, expense_description, expense_date,id):
        self.user_id = user_id
        self.expense = expense
        self.expense_type = expense_type
        self.payment_method = payment_method
        self.expense_description = expense_description
        self.expense_date = expense_date
        self.id = id

    @classmethod
    def from_api_model(cls, api_model: ExpenseApiModel,id=None):
        return cls(
            user_id=api_model.user_id,
            expense=api_model.expense,
            expense_type=api_model.expense_type,
            payment_method=api_model.payment_method,
            expense_description=api_model.expense_description,
            expense_date=api_model.expense_date,
            id =id
        )

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
