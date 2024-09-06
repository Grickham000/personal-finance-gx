from firebase_admin import firestore
from DL.fixed_expense_entity import FixedExpenseEntity
import logging
from datetime import datetime,date

class FixedExpenseDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_fixed_expense(self, fixed_expense_entity: FixedExpenseEntity) -> str:
        # Parse the string to a datetime object
        fixed_expense_entity.fexpense_start_date = datetime.fromisoformat(fixed_expense_entity.fexpense_start_date.replace("Z", "+00:00"))
        fixed_expense_entity.fexpense_end_date = datetime.fromisoformat(fixed_expense_entity.fexpense_end_date.replace("Z", "+00:00"))

        expense_ref = self.db.collection('fixed_expenses').add(fixed_expense_entity.to_dict())
        return expense_ref[1].id

    def get_fixed_expenses(self, user_id: str) -> list:
        logging.info(f"Retrieving expenses for user_id: {user_id}")
        
        # Fetch documents
        expenses_stream = self.db.collection('fixed_expenses').where('user_id', '==', user_id).stream()
        
        # Convert Firestore documents to a list of ExpenseEntities
        fixed_expenses_list = []
        for expense in expenses_stream:
            expense_dict = expense.to_dict()  # Convert document snapshot to dictionary
            doc_id = expense.id  # Get the document ID

            # Check if the object is of date type
            if isinstance(expense_dict['fexpense_start_date'], date):
                # Convert datetime to string
                expense_dict['fexpense_start_date'] = expense_dict['fexpense_start_date'].strftime("%Y-%m-%d %H:%M:%S")
                 # Check if the object is of date type
            if isinstance(expense_dict['fexpense_end_date'], date):
                # Convert datetime to string
                expense_dict['fexpense_end_date'] = expense_dict['fexpense_end_date'].strftime("%Y-%m-%d %H:%M:%S")
                

            logging.info(f"Fixed Expense data: {expense_dict}, Document ID: {doc_id}")  # Log the data and document ID
            fixed_expense_entity = FixedExpenseEntity.from_dict(expense_dict, id=doc_id)  # Create ExpenseEntity with ID
            fixed_expenses_list.append(fixed_expense_entity)  # Add to the list
        
        # Log the complete list of expenses
        logging.info(f"Retrieved fixed expenses list: {fixed_expenses_list}")

        return fixed_expenses_list


    def update_fixed_expense(self, fixed_expense_entity: FixedExpenseEntity,id):

        expense_ref = self.db.collection('fixed_expenses').document(id)

        #Retrieve the document to check the user_id
        expense =expense_ref.get()

        if expense.exists:
            expense_data = expense.to_dict()
            if expense_data.get('user_id') == fixed_expense_entity.user_id:
                #ID match
                expense_ref.update(fixed_expense_entity.to_dict())
                logging.info(f"Fixed Expense with ID {id} for user_id {fixed_expense_entity.user_id} successfully updated.")
                return True
            else:
                #ID doesnt match
                logging.warning(f"Attempt to update fixed expense with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to update this fixed expense.")
        else:
            #Document doesnt exist
            logging.warning(f"Fixed Expense with ID {id} does not exist.")
            raise ValueError(f"Fixed Expense with ID {id} does not exist.")

    def delete_fixed_expense(self, user_id: str, id: str):
        expense_ref = self.db.collection('fixed_expenses').document(id)
    
        # Retrieve the document to check the user_id
        expense = expense_ref.get()
        
        if expense.exists:
            expense_data = expense.to_dict()
            if expense_data.get('user_id') == user_id:
                # User ID matches, proceed to delete the document
                expense_ref.delete()
                logging.info(f"Fixed Expense with ID {id} for user_id {user_id} successfully deleted.")
                return True
            else:
                # User ID does not match, raise an error or return a response
                logging.warning(f"Attempt to delete fixed expense with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to delete this fixed expense.")
        else:
            # Document does not exist
            logging.warning(f"Fixed Expense with ID {id} does not exist.")
            raise ValueError(f"Fixed Expense with ID {id} does not exist.")

