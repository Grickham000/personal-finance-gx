from firebase_admin import auth
from DL.expense_toa import ExpenseTOA
from DL.expense_dao import ExpenseDAO
from DL.user_profile_dao import UserProfileDAO
from API.expense_dto import ExpenseDTO
import logging

class ExpenseService:
    def __init__(self):
        self.expense_toa = ExpenseTOA()
        self.expense_dao = ExpenseDAO()
        self.user_profile_dao = UserProfileDAO()

    def verify_token(self, token: str) -> str:
        try:
        # Decode and verify the ID token
            decoded_token = auth.verify_id_token(token)
            
            # Check if the email is verified
            if not decoded_token.get('email_verified', False):
                raise ValueError("User's email is not verified.")

            # Return the user's UID if the email is verified
            return decoded_token['uid']
        except Exception as e:
            # Handle exceptions (e.g., token verification failure)
            raise ValueError(f"Token verification failed: {str(e)}")

    def create_expense(self, expense_dto: ExpenseDTO) -> str:
        # Resolve payment_method_id by name if not provided
        if not expense_dto.payment_method_id and expense_dto.payment_method:
            profile = self.user_profile_dao.get_profile(expense_dto.user_id)
            if profile:
                pm_name_lower = expense_dto.payment_method.lower()
                for pm in (profile.payment_methods or []):
                    if pm.get('name', '').lower() == pm_name_lower:
                        expense_dto.payment_method_id = pm.get('id')
                        break

        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to save the entity
        return self.expense_dao.create_expense(expense_entity)

    def get_expenses(self, user_id: str, expense_type=None, payment_method=None, 
                     filter_type=None, target_date=None, start_date=None, end_date=None) -> list:
        # Delegate to DAO to retrieve expenses
        expenses_entities = self.expense_dao.get_expenses(user_id)

        from datetime import datetime, timedelta
        import calendar

        # Resolve target date or fallback to current local/system time
        now = datetime.now()
        parsed_target = None
        if target_date:
            try:
                if len(target_date) == 7: # YYYY-MM
                    parsed_target = datetime.strptime(target_date, "%Y-%m")
                else:
                    parsed_target = datetime.fromisoformat(target_date.replace('Z', ''))
            except Exception as e:
                logging.warning(f"Error parsing target_date {target_date}: {e}")
                parsed_target = now
        else:
            parsed_target = now

        # Get profile for cutoff details if monthly filter is requested
        profile = None
        if filter_type == "month":
            profile = self.user_profile_dao.get_profile(user_id)
        
        payment_methods = profile.payment_methods if profile else []
        pm_by_id = {pm['id']: pm for pm in payment_methods if 'id' in pm}
        pm_by_name = {pm['name'].lower(): pm for pm in payment_methods}

        filtered_entities = []
        for entity in expenses_entities:
            if expense_type and entity.expense_type.lower() != expense_type.lower():
                continue
            if payment_method and entity.payment_method.lower() != payment_method.lower():
                continue

            # Date parsing only if filtering is requested
            if filter_type or start_date or end_date:
                try:
                    ent_date_str = entity.expense_date.replace('Z', '')
                    ent_date = datetime.fromisoformat(ent_date_str)
                except Exception as e:
                    logging.warning(f"Error parsing expense date {entity.expense_date}: {e}")
                    continue

                if filter_type == "day":
                    # Filter by specific calendar day
                    if ent_date.date() != parsed_target.date():
                        continue

                elif filter_type == "week":
                    # Filter by week containing target date (Monday to Sunday)
                    start_of_week = parsed_target - timedelta(days=parsed_target.weekday())
                    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
                    if not (start_of_week <= ent_date <= end_of_week):
                        continue

                elif filter_type == "range":
                    # Filter by explicit date range (inclusive)
                    if start_date:
                        s_date = datetime.fromisoformat(start_date.replace('Z', ''))
                        if ent_date < s_date:
                            continue
                    if end_date:
                        e_date = datetime.fromisoformat(end_date.replace('Z', ''))
                        if ent_date > e_date:
                            continue

                elif filter_type == "month":
                    # Monthly filter using cut-off dates
                    target_year = parsed_target.year
                    target_month = parsed_target.month

                    # Resolve payment method config
                    pm_config = None
                    pm_id = getattr(entity, 'payment_method_id', None)
                    if pm_id:
                        pm_config = pm_by_id.get(pm_id)
                    if not pm_config and entity.payment_method:
                        pm_name = entity.payment_method.lower()
                        pm_config = pm_by_name.get(pm_name)

                    if pm_config and not pm_config.get('is_immediate', False):
                        # Non-immediate card billing cycle
                        cut_date_day = pm_config.get('cut_date', 0)
                        if ent_date.day <= cut_date_day:
                            cycle_year = ent_date.year
                            cycle_month = ent_date.month
                        else:
                            if ent_date.month == 12:
                                cycle_year = ent_date.year + 1
                                cycle_month = 1
                            else:
                                cycle_year = ent_date.year
                                cycle_month = ent_date.month + 1
                    else:
                        # Cash / immediate: calendar month
                        cycle_year = ent_date.year
                        cycle_month = ent_date.month

                    if cycle_year != target_year or cycle_month != target_month:
                        continue
                
                else:
                    # Legacy direct date range filtering (if filter_type is None)
                    if start_date or end_date:
                        if start_date:
                            s_date = datetime.fromisoformat(start_date.replace('Z', ''))
                            if ent_date < s_date:
                                continue
                        if end_date:
                            e_date = datetime.fromisoformat(end_date.replace('Z', ''))
                            if ent_date > e_date:
                                continue

            filtered_entities.append(entity)

        # Transform entities to DTOs
        return [self.expense_toa.entity_to_dto(expense) for expense in filtered_entities]

    def get_expense_by_id(self, user_id: str, id: str) -> ExpenseDTO:
        entity = self.expense_dao.get_expense_by_id(user_id, id)
        if entity:
            return self.expense_toa.entity_to_dto(entity)
        return None

    def update_expense(self, expense_dto: ExpenseDTO, id):
        # Resolve payment_method_id by name if not provided
        if not expense_dto.payment_method_id and expense_dto.payment_method:
            profile = self.user_profile_dao.get_profile(expense_dto.user_id)
            if profile:
                pm_name_lower = expense_dto.payment_method.lower()
                for pm in (profile.payment_methods or []):
                    if pm.get('name', '').lower() == pm_name_lower:
                        expense_dto.payment_method_id = pm.get('id')
                        break

        # Transform DTO to entity
        expense_entity = self.expense_toa.dto_to_entity(expense_dto)

        # Delegate to DAO to update the entity
        self.expense_dao.update_expense(expense_entity, id)

    def delete_expense(self,user_id,id):

        #Delegate to DAO to delete the entity 
        self.expense_dao.delete_expense(user_id,id)
