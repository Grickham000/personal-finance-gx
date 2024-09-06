#This is the Entity model for expenses
class BaseExpenseEntity:
    def __init__(self, user_id, fixed_expense, fexpense_type, fexpense_description, fexpense_start_date, fexpense_end_date,expire):
        self.user_id = user_id
        self.fixed_expense = fixed_expense
        self.fexpense_type = fexpense_type
        self.fexpense_description = fexpense_description
        self.fexpense_start_date = fexpense_start_date
        self.fexpense_end_date = fexpense_end_date
        self.expire = expire
#To dict function to help us return the data as dictionary
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'fixed_expense': self.fixed_expense,
            'fexpense_type': self.fexpense_type,
            'fexpense_description': self.fexpense_description,
            'fexpense_start_date': self.fexpense_start_date,
            'fexpense_end_date': self.fexpense_end_date,
            'expire':self.expire
        }
#Help us to get the data in a printable format
    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, fixed_expense={self.fixed_expense}, "
                f"fexpense_type={self.fexpense_type}, fexpense_description={self.fexpense_description}, "
                f"fexpense_start_date={self.fexpense_start_date}, fexpense_end_date={self.fexpense_end_date},"
                f"expire={self.expire})")

#Polimorfism to validate when we get an Id to delte or update
class FixedExpenseEntity(BaseExpenseEntity):
    def __init__(self, user_id, fixed_expense, fexpense_type, fexpense_description, fexpense_start_date, fexpense_end_date, expire, id=None):
        super().__init__(user_id, fixed_expense, fexpense_type, fexpense_description, fexpense_start_date, fexpense_end_date, expire)
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
            fixed_expense=data['fixed_expense'],
            fexpense_type=data['fexpense_type'],
            fexpense_description=data['fexpense_description'],
            fexpense_start_date=data['fexpense_start_date'],
            fexpense_end_date=data['fexpense_end_date'],
            expire=data['expire'],
            id=id
        )
#Help us to get the data in a printable format
    def __repr__(self):
        return super().__repr__() + f", id={self.id}"  # Add the ID to the repr output