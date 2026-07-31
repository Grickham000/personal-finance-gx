class BaseSavingsAccountEntity:
    def __init__(self, user_id: str, name: str, interest_rate: float, balance: float, description: str, history: list = None):
        self.user_id = user_id
        self.name = name
        self.interest_rate = interest_rate
        self.balance = balance
        self.description = description
        self.history = history if history is not None else []

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'interest_rate': self.interest_rate,
            'balance': self.balance,
            'description': self.description,
            'history': self.history
        }

    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, name={self.name}, "
                f"interest_rate={self.interest_rate}, balance={self.balance}, "
                f"description={self.description}, history={self.history})")

class SavingsAccountEntity(BaseSavingsAccountEntity):
    def __init__(self, user_id: str, name: str, interest_rate: float, balance: float, description: str, id: str = None, history: list = None):
        super().__init__(user_id, name, interest_rate, balance, description, history)
        self.id = id

    def to_dict(self):
        base_dict = super().to_dict()
        if self.id is not None:
            base_dict['id'] = self.id
        return base_dict

    @classmethod
    def from_dict(cls, data: dict, id: str = None):
        history = data.get('history', [])
        if isinstance(history, list):
            history = sorted(history, key=lambda x: x.get('date', ''), reverse=True)
        return cls(
            user_id=data.get('user_id'),
            name=data.get('name'),
            interest_rate=data.get('interest_rate', 0.0),
            balance=data.get('balance', 0.0),
            description=data.get('description', ""),
            id=id,
            history=history
        )

    def __repr__(self):
        return super().__repr__() + f", id={self.id}"
