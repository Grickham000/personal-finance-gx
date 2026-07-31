class SavingsAccountApiModel:
    def __init__(self, name: str, interest_rate: float, balance: float = 0.0, description: str = "", history: list = None):
        self.name = name
        self.interest_rate = interest_rate
        self.balance = balance
        self.description = description
        self.history = history if history is not None else []

    @classmethod
    def from_dict(cls, data: dict):
        if not data:
            raise ValueError("Data dictionary cannot be empty")

        name = data.get('name')
        interest_rate = data.get('interest_rate')
        balance = data.get('balance', 0.0)
        description = data.get('description', "")
        history = data.get('history', [])

        if not name:
            raise ValueError("name is required")
        if not isinstance(name, str) or not name.strip():
            raise ValueError("name must be a non-empty string")

        if interest_rate is None:
            raise ValueError("interest_rate is required")
        try:
            interest_rate = float(interest_rate)
        except (ValueError, TypeError):
            raise ValueError("interest_rate must be a valid number")
        if interest_rate < 0:
            raise ValueError("interest_rate must be non-negative")

        try:
            balance = float(balance)
        except (ValueError, TypeError):
            raise ValueError("balance must be a valid number")

        if not isinstance(description, str):
            raise ValueError("description must be a string")

        if not isinstance(history, list):
            raise ValueError("history must be a list")

        return cls(name=name.strip(), interest_rate=interest_rate, balance=balance, description=description.strip(), history=history)

    def to_dict(self):
        return {
            'name': self.name,
            'interest_rate': self.interest_rate,
            'balance': self.balance,
            'description': self.description,
            'history': self.history
        }
