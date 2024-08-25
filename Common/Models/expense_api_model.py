class ExpenseApiModel:
    def __init__(self, user_id, expense, expense_type, payment_method, expense_description, expense_date):
        self.user_id = user_id
        self.expense = expense
        self.expense_type = expense_type
        self.payment_method = payment_method
        self.expense_description = expense_description
        self.expense_date = expense_date