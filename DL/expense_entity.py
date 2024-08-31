#This is the Entity model for expenses
class BaseExpenseEntity:
    def __init__(self, user_id, expense, expense_type, payment_method, expense_description, expense_date):
        self.user_id = user_id
        self.expense = expense
        self.expense_type = expense_type
        self.payment_method = payment_method
        self.expense_description = expense_description
        self.expense_date = expense_date
#To dict function to help us return the data as dictionary
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'expense': self.expense,
            'expense_type': self.expense_type,
            'payment_method': self.payment_method,
            'expense_description': self.expense_description,
            'expense_date': self.expense_date
        }
#Help us to get the data in a printable format
    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, expense={self.expense}, "
                f"expense_type={self.expense_type}, payment_method={self.payment_method}, "
                f"expense_description={self.expense_description}, expense_date={self.expense_date})")

#Polimorfism to validate when we get an Id to delte or update
class ExpenseEntity(BaseExpenseEntity):
    def __init__(self, user_id, expense, expense_type, payment_method, expense_description, expense_date, id=None):
        super().__init__(user_id, expense, expense_type, payment_method, expense_description, expense_date)
        self.id = id

    def to_dict(self):
        base_dict = super().to_dict()  # Get the dictionary from the base class
        if self.id is not None:
            base_dict['id'] = self.id  # Add the ID if it exists
        return base_dict
#To dict function to help us return the data as dictionary
    @classmethod
    def from_dict(cls, data, id=None):
        return cls(
            user_id=data['user_id'],
            expense=data['expense'],
            expense_type=data['expense_type'],
            payment_method=data['payment_method'],
            expense_description=data['expense_description'],
            expense_date=data['expense_date'],
            id=id
        )
#Help us to get the data in a printable format
    def __repr__(self):
        return super().__repr__() + f", id={self.id}"  # Add the ID to the repr output