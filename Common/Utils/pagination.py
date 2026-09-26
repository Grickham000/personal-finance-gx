import math
from typing import List, TypeVar, Generic

T = TypeVar('T')

class Pagination(Generic[T]):
    def __init__(self, items: List[T], page: int = 1, per_page: int = 20, total_amount: float = None):
        self.total_count = len(items)
        self.page = max(1, page)
        self.per_page = max(1, per_page)
        self.total_pages = math.ceil(self.total_count / self.per_page) if self.total_count > 0 else 1
        self.total_amount = total_amount
        
        # Slice items for the current page
        start_idx = (self.page - 1) * self.per_page
        end_idx = start_idx + self.per_page
        self.page_items = items[start_idx:end_idx]
        
        self.has_next = self.page < self.total_pages
        self.has_prev = self.page > 1

    def get_headers(self) -> dict:
        headers = {
            "X-Page": str(self.page),
            "X-Per-Page": str(self.per_page),
            "X-Total-Count": str(self.total_count),
            "X-Total-Pages": str(self.total_pages),
            "X-Has-Next": "true" if self.has_next else "false",
            "X-Has-Prev": "true" if self.has_prev else "false",
            "Access-Control-Expose-Headers": "X-Page, X-Per-Page, X-Total-Count, X-Total-Pages, X-Has-Next, X-Has-Prev, X-Total-Amount"
        }
        if self.total_amount is not None:
            headers["X-Total-Amount"] = str(round(self.total_amount, 2))
        return headers
