from firebase_admin import firestore
from DL.investment_entity import InvestmentEntity
from datetime import datetime, date, timezone
import logging

class InvestmentDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_investment(self, investment_entity: InvestmentEntity) -> str:
        if investment_entity.end_date:
            investment_entity.end_date = datetime.fromisoformat(investment_entity.end_date.replace("Z", "+00:00"))
        
        # Initialize history with the initial amount
        date_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        investment_entity.history = [{'amount': float(investment_entity.amount), 'date': date_str}]
        
        ref = self.db.collection('investments').add(investment_entity.to_dict())
        return ref[1].id

    def get_investments(self, user_id: str) -> list:
        logging.info(f"Retrieving investments for user_id: {user_id}")
        stream = self.db.collection('investments').where('user_id', '==', user_id).stream()
        
        investments_list = []
        for doc in stream:
            data = doc.to_dict()
            doc_id = doc.id
            
            # Format date back to string if stored as timestamp/date
            if data.get('end_date') and isinstance(data.get('end_date'), (date, datetime)):
                data['end_date'] = data['end_date'].strftime("%Y-%m-%d %H:%M:%S")
                
            entity = InvestmentEntity.from_dict(data, id=doc_id)
            investments_list.append(entity)
        return investments_list

    def get_investment_by_id(self, user_id: str, id: str) -> InvestmentEntity:
        logging.info(f"Retrieving investment {id} for user_id: {user_id}")
        doc_ref = self.db.collection('investments').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == user_id:
                if data.get('end_date') and isinstance(data.get('end_date'), (date, datetime)):
                    data['end_date'] = data['end_date'].strftime("%Y-%m-%d %H:%M:%S")
                return InvestmentEntity.from_dict(data, id=id)
            else:
                logging.warning(f"Attempt to access investment {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to access this investment.")
        return None

    def update_investment(self, investment_entity: InvestmentEntity, id: str) -> bool:
        doc_ref = self.db.collection('investments').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == investment_entity.user_id:
                existing_history = data.get('history', [])
                current_amount = data.get('amount', 0.0)
                
                date_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                
                # Check if amount has changed
                if float(investment_entity.amount) != float(current_amount):
                    if not existing_history:
                        existing_history = [
                            {
                                'amount': float(current_amount),
                                'date': date_str
                            }
                        ]
                    existing_history.append({
                        'amount': float(investment_entity.amount),
                        'date': date_str
                    })
                elif not existing_history:
                    existing_history = [
                        {
                            'amount': float(current_amount),
                            'date': date_str
                        }
                    ]
                
                investment_entity.history = existing_history

                if investment_entity.end_date:
                    investment_entity.end_date = datetime.fromisoformat(investment_entity.end_date.replace("Z", "+00:00"))
                
                doc_ref.update(investment_entity.to_dict())
                logging.info(f"Investment {id} successfully updated.")
                return True
            else:
                logging.warning(f"Attempt to update investment {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to update this investment.")
        else:
            logging.warning(f"Investment {id} does not exist.")
            raise ValueError(f"Investment with ID {id} does not exist.")

    def delete_investment(self, user_id: str, id: str) -> bool:
        doc_ref = self.db.collection('investments').document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('user_id') == user_id:
                doc_ref.delete()
                logging.info(f"Investment {id} successfully deleted.")
                return True
            else:
                logging.warning(f"Attempt to delete investment {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to delete this investment.")
        else:
            logging.warning(f"Investment {id} does not exist.")
            raise ValueError(f"Investment with ID {id} does not exist.")
