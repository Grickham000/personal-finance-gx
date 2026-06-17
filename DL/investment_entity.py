class BaseInvestmentEntity:
    def __init__(self, user_id: str, name: str, interest_rate: float, amount: float, has_end_date: bool, end_date, is_released: bool, description: str):
        self.user_id = user_id
        self.name = name
        self.interest_rate = interest_rate
        self.amount = amount
        self.has_end_date = has_end_date
        self.end_date = end_date
        self.is_released = is_released
        self.description = description

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'interest_rate': self.interest_rate,
            'amount': self.amount,
            'has_end_date': self.has_end_date,
            'end_date': self.end_date,
            'is_released': self.is_released,
            'description': self.description
        }

    def __repr__(self):
        return (f"{self.__class__.__name__}(user_id={self.user_id}, name={self.name}, "
                f"interest_rate={self.interest_rate}, amount={self.amount}, "
                f"has_end_date={self.has_end_date}, end_date={self.end_date}, "
                f"is_released={self.is_released}, description={self.description})")

class InvestmentEntity(BaseInvestmentEntity):
    def __init__(self, user_id: str, name: str, interest_rate: float, amount: float, has_end_date: bool, end_date, is_released: bool, description: str, id: str = None):
        super().__init__(user_id, name, interest_rate, amount, has_end_date, end_date, is_released, description)
        self.id = id

    def to_dict(self):
        base_dict = super().to_dict()
        if self.id is not None:
            base_dict['id'] = self.id
        return base_dict

    @classmethod
    def from_dict(cls, data: dict, id: str = None):
        return cls(
            user_id=data.get('user_id'),
            name=data.get('name'),
            interest_rate=data.get('interest_rate', 0.0),
            amount=data.get('amount', 0.0),
            has_end_date=data.get('has_end_date', False),
            end_date=data.get('end_date'),
            is_released=data.get('is_released', False),
            description=data.get('description', ""),
            id=id
        )

    def __repr__(self):
        return super().__repr__() + f", id={self.id}"
