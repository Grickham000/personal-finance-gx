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

        #Retrieve the document to check the user_id
        expense =expense_ref.get()

        if expense.exists:
            expense_data = expense.to_dict()
            if expense_data.get('user_id') == expense_entity.user_id:
                #ID match
                expense_ref.update(expense_entity.to_dict())
                logging.info(f"Expense with ID {id} for user_id {expense_entity.user_id} successfully updated.")
                return True
            else:
                #ID doesnt match
                logging.warning(f"Attempt to update expense with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to update this expense.")
        else:
            #Document doesnt exist
            logging.warning(f"Expense with ID {id} does not exist.")
            raise ValueError(f"Expense with ID {id} does not exist.")

    def delete_expense(self, user_id: str, id: str):
        expense_ref = self.db.collection('expense').document(id)
    
        # Retrieve the document to check the user_id
        expense = expense_ref.get()
        
        if expense.exists:
            expense_data = expense.to_dict()
            if expense_data.get('user_id') == user_id:
                # User ID matches, proceed to delete the document
                expense_ref.delete()
                logging.info(f"Expense with ID {id} for user_id {user_id} successfully deleted.")
                return True
            else:
                # User ID does not match, raise an error or return a response
                logging.warning(f"Attempt to delete expense with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to delete this expense.")
        else:
            # Document does not exist
            logging.warning(f"Expense with ID {id} does not exist.")
            raise ValueError(f"Expense with ID {id} does not exist.")

