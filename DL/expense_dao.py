from firebase_admin import firestore
from DL.expense_entity import ExpenseEntity
import logging
from datetime import datetime,date

class ExpenseDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_expense(self, expense_entity: ExpenseEntity) -> str:
        # Parse the string to a datetime object
        expense_entity.expense_date = datetime.fromisoformat(expense_entity.expense_date.replace("Z", "+00:00"))

        expense_ref = self.db.collection('expense').add(expense_entity.to_dict())
        return expense_ref[1].id

    def get_expenses(self, user_id: str) -> list:
        logging.info(f"Retrieving expenses for user_id: {user_id}")
        
        # Fetch documents
        expenses_stream = self.db.collection('expense').where('user_id', '==', user_id).stream()
        
        # Convert Firestore documents to a list of ExpenseEntities
        expenses_list = []
        for expense in expenses_stream:
            expense_dict = expense.to_dict()  # Convert document snapshot to dictionary
            doc_id = expense.id  # Get the document ID

            # Check if the object is of date type
            if isinstance(expense_dict['expense_date'], date):
                # Convert datetime to string
                expense_dict['expense_date'] = expense_dict['expense_date'].strftime("%Y-%m-%d %H:%M:%S")

            logging.info(f"Expense data: {expense_dict}, Document ID: {doc_id}")  # Log the data and document ID
            expense_entity = ExpenseEntity.from_dict(expense_dict, id=doc_id)  # Create ExpenseEntity with ID
            expenses_list.append(expense_entity)  # Add to the list
        
        # Log the complete list of expenses
        logging.info(f"Retrieved expenses list: {expenses_list}")

        return expenses_list


    def update_expense(self, expense_entity: ExpenseEntity,id):

        expense_ref = self.db.collection('expense').document(id)
        expense_ref.update(expense_entity.to_dict())
