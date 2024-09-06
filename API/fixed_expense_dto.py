from Common.Models.fiexd_expense_api_model import FixedExpenseApiModel

#This is the model the Business layer will use to executie the business logic.
class FixedExpenseDTO:
    def __init__(self, user_id, fixed_expense, fexpense_type, fexpense_description, fexpense_start_date,fexpense_end_date, expire,id):
        self.user_id = user_id
        self.fixed_expense = fixed_expense
        self.fexpense_type = fexpense_type
        self.fexpense_description = fexpense_description
        self.fexpense_start_date = fexpense_start_date
        self.fexpense_end_date = fexpense_end_date
        self.expire = expire
        self.id = id

# This transform the API validation model to the DTO model
    @classmethod
    def from_api_model(cls, api_model: FixedExpenseApiModel,id=None):
        return cls(
            user_id=api_model.user_id,
            fixed_expense=api_model.fixed_expense,
            fexpense_type=api_model.fexpense_type,
            fexpense_description=api_model.fexpense_description,
            fexpense_start_date=api_model.fexpense_start_date,
            fexpense_end_date=api_model.fexpense_end_date,
            expire=api_model.expire,
            id =id
        )
#This help us to convert the model to a dictionary to send it out as response.
    def to_dict(self):
        return {
            'id':self.id,
            'user_id': self.user_id,
            'fixed_expense': self.fixed_expense,
            'fexpense_type': self.fexpense_type,
            'fexpense_description': self.fexpense_description,
            'fexpense_start_date': self.fexpense_start_date,
            'fexpense_end_date': self.fexpense_end_date,
            'expire': self.expire
        }
