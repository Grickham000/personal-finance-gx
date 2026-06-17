from Common.Models.investment_api_model import InvestmentApiModel

class InvestmentDTO:
    def __init__(self, user_id: str, name: str, interest_rate: float, amount: float, has_end_date: bool, end_date: str = None, is_released: bool = False, description: str = "", id: str = None):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.interest_rate = interest_rate
        self.amount = amount
        self.has_end_date = has_end_date
        self.end_date = end_date
        self.is_released = is_released
        self.description = description

    @classmethod
    def from_api_model(cls, api_model: InvestmentApiModel, user_id: str = None, id: str = None):
        return cls(
            user_id=user_id,
            name=api_model.name,
            interest_rate=api_model.interest_rate,
            amount=api_model.amount,
            has_end_date=api_model.has_end_date,
            end_date=api_model.end_date,
            is_released=api_model.is_released,
            description=api_model.description,
            id=id
        )

    def to_dict(self):
        result = {
            'user_id': self.user_id,
            'name': self.name,
            'interest_rate': self.interest_rate,
            'amount': self.amount,
            'has_end_date': self.has_end_date,
            'end_date': self.end_date,
            'is_released': self.is_released,
            'description': self.description
        }
        if self.id:
            result['id'] = self.id
        return result
