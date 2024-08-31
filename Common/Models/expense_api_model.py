#This is the API validation model to check if we are getting the response as expected.
class ExpenseApiModel:
    def __init__(self,  expense, expense_type, payment_method, expense_description, expense_date,user_id=None):
        self.user_id = user_id
        self.expense = expense
        self.expense_type = expense_type
        self.payment_method = payment_method
        self.expense_description = expense_description
        self.expense_date = expense_date