#This is the API validation model to check if we are getting the response as expected.
class FixedExpenseApiModel:
    def __init__(self, fixed_expense, fexpense_type, fexpense_start_date, fexpense_end_date, fexpense_description, expire, user_id=None, payment_method=None, payment_method_id=None):
        self.user_id = user_id
        self.fixed_expense = fixed_expense
        self.fexpense_type = fexpense_type
        self.fexpense_start_date = fexpense_start_date
        self.fexpense_end_date = fexpense_end_date
        self.fexpense_description = fexpense_description
        self.expire = expire
        self.payment_method = payment_method
        self.payment_method_id = payment_method_id