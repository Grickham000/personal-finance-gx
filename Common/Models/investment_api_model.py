from datetime import datetime

class InvestmentApiModel:
    def __init__(self, name: str, interest_rate: float, amount: float, has_end_date: bool, end_date: str = None, is_released: bool = False, description: str = "", history: list = None):
        self.name = name
        self.interest_rate = interest_rate
        self.amount = amount
        self.has_end_date = has_end_date
        self.end_date = end_date
        self.is_released = is_released
        self.description = description
        self.history = history if history is not None else []

    @classmethod
    def from_dict(cls, data: dict):
        if not data:
            raise ValueError("Data dictionary cannot be empty")

        name = data.get('name')
        interest_rate = data.get('interest_rate')
        amount = data.get('amount')
        has_end_date = data.get('has_end_date')
        end_date = data.get('end_date')
        is_released = data.get('is_released', False)
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

        if amount is None:
            raise ValueError("amount is required")
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            raise ValueError("amount must be a valid number")
        if amount < 0:
            raise ValueError("amount must be non-negative")

        if has_end_date is None:
            raise ValueError("has_end_date is required")
        if not isinstance(has_end_date, bool):
            raise ValueError("has_end_date must be a boolean")

        if has_end_date:
            if not end_date:
                raise ValueError("end_date is required when has_end_date is True")
            try:
                # Try parsing end_date to ensure it's valid ISO-8601
                cleaned_date = end_date.replace("Z", "+00:00")
                datetime.fromisoformat(cleaned_date)
            except (ValueError, TypeError):
                raise ValueError("end_date must be a valid ISO-8601 date string")
        else:
            if end_date is not None:
                raise ValueError("end_date must be None when has_end_date is False")

        if not isinstance(is_released, bool):
            raise ValueError("is_released must be a boolean")

        if not isinstance(description, str):
            raise ValueError("description must be a string")

        if not isinstance(history, list):
            raise ValueError("history must be a list")

        return cls(
            name=name.strip(),
            interest_rate=interest_rate,
            amount=amount,
            has_end_date=has_end_date,
            end_date=end_date,
            is_released=is_released,
            description=description.strip(),
            history=history
        )

    def to_dict(self):
        return {
            'name': self.name,
            'interest_rate': self.interest_rate,
            'amount': self.amount,
            'has_end_date': self.has_end_date,
            'end_date': self.end_date,
            'is_released': self.is_released,
            'description': self.description,
            'history': self.history
        }
