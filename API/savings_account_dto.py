from Common.Models.savings_account_api_model import SavingsAccountApiModel

class SavingsAccountDTO:
    def __init__(self, user_id: str, name: str, interest_rate: float, balance: float = 0.0, description: str = "", id: str = None, history: list = None):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.interest_rate = interest_rate
        self.balance = balance
        self.description = description
        self.history = history if history is not None else []

    @classmethod
    def from_api_model(cls, api_model: SavingsAccountApiModel, user_id: str = None, id: str = None):
        return cls(
            user_id=user_id,
            name=api_model.name,
            interest_rate=api_model.interest_rate,
            balance=api_model.balance,
            description=api_model.description,
            id=id,
            history=getattr(api_model, 'history', [])
        )

    def to_dict(self):
        result = {
            'user_id': self.user_id,
            'name': self.name,
            'interest_rate': self.interest_rate,
            'balance': self.balance,
            'description': self.description,
            'history': self.history
        }
        if self.id:
            result['id'] = self.id
        return result
