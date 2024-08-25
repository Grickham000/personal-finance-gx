import datetime

def validate_date(date_str):
    """Validate date format."""
    try:
        datetime.datetime.fromisoformat(date_str)
        return True
    except ValueError:
        return False
