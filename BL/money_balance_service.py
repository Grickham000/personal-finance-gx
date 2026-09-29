from datetime import datetime, timedelta
import calendar
import logging
from DL.user_profile_dao import UserProfileDAO
from DL.expense_dao import ExpenseDAO
from DL.fixed_expense_dao import FixedExpenseDAO
from DL.credit_card_payment_dao import CreditCardPaymentDAO

class MoneyBalanceService:
    def __init__(self):
        self.user_profile_dao = UserProfileDAO()
        self.expense_dao = ExpenseDAO()
        self.fixed_expense_dao = FixedExpenseDAO()
        self.credit_card_payment_dao = CreditCardPaymentDAO()

    def get_monthly_balance(self, user_id: str, target_month_str: str) -> dict:
        """
        Calculates the monthly balance by subtracting variable, fixed, and credit card payments
        from the monthly income. Respects the payment methods' cut date, days to pay, and settlement status.
        """
        try:
            target_date = datetime.strptime(target_month_str, "%Y-%m")
        except ValueError:
            raise ValueError("Target month must be in YYYY-MM format")

        target_year = target_date.year
        target_month = target_date.month

        # Retrieve user profile
        profile = self.user_profile_dao.get_profile(user_id)
        if not profile:
            raise ValueError("User profile not found")

        monthly_income = float(profile.monthly_income)
        payment_methods = profile.payment_methods or []

        # Create lookup maps for payment methods
        pm_by_id = {pm['id']: pm for pm in payment_methods if 'id' in pm}
        pm_by_name = {pm['name'].lower(): pm for pm in payment_methods}

        # Retrieve variable expenses
        expenses = self.expense_dao.get_expenses(user_id)

        # Retrieve credit card payments
        cc_payments = self.credit_card_payment_dao.get_payments(user_id)
        
        # Build lookup set of paid cycles: {(payment_method_id, statement_month), ...}
        # and {(payment_method_name, statement_month), ...}
        paid_cycles_by_id = set()
        paid_cycles_by_name = set()
        
        total_credit_payments_made = 0.0
        
        for pay in cc_payments:
            pay_date_str = pay.payment_date.replace('Z', '')
            try:
                pay_date = datetime.fromisoformat(pay_date_str)
            except Exception as e:
                logging.error(f"Error parsing payment date {pay.payment_date}: {e}")
                continue
                
            # If the payment was made in the target month, sum it
            if pay_date.year == target_year and pay_date.month == target_month:
                total_credit_payments_made += float(pay.amount_paid)
                
            # Keep track of paid cycles
            stmt_month = pay.statement_month # Format: YYYY-MM
            if pay.payment_method_id:
                paid_cycles_by_id.add((pay.payment_method_id, stmt_month))
            
            # Find the payment method name from profile to support name-based paid cycle tracking
            pm_config = pm_by_id.get(pay.payment_method_id)
            if pm_config:
                paid_cycles_by_name.add((pm_config['name'].lower(), stmt_month))
            else:
                # If payment_method_id is a name, track it as name-based
                paid_cycles_by_name.add((pay.payment_method_id.lower(), stmt_month))
        
        total_immediate_expenses = 0.0
        total_credit_expenses_due = 0.0
        
        for exp in expenses:
            exp_amount = float(exp.expense)
            exp_date_str = exp.expense_date.replace('Z', '')
            try:
                exp_date = datetime.fromisoformat(exp_date_str)
            except Exception as e:
                logging.error(f"Error parsing expense date {exp.expense_date}: {e}")
                continue

            # Resolve payment method config (ID match takes precedence, fallback to name)
            pm_config = None
            pm_id = getattr(exp, 'payment_method_id', None)
            if pm_id:
                pm_config = pm_by_id.get(pm_id)
            if not pm_config:
                pm_name = exp.payment_method.lower()
                pm_config = pm_by_name.get(pm_name)

            if not pm_config:
                # Fallback to immediate (realized in the month of the expense date)
                if exp_date.year == target_year and exp_date.month == target_month:
                    total_immediate_expenses += exp_amount
                continue

            if pm_config.get('is_immediate', False):
                # Immediate cashflow: count in the month the expense occurs
                if exp_date.year == target_year and exp_date.month == target_month:
                    total_immediate_expenses += exp_amount
            else:
                # Non-immediate cashflow (e.g. credit card)
                cut_date_day = pm_config.get('cut_date', 0)
                days_to_pay = pm_config.get('days_to_pay', 0)

                # Determine billing cycle end date (cutoff_date)
                if exp_date.day <= cut_date_day:
                    cutoff_year = exp_date.year
                    cutoff_month = exp_date.month
                else:
                    if exp_date.month == 12:
                        cutoff_year = exp_date.year + 1
                        cutoff_month = 1
                    else:
                        cutoff_year = exp_date.year
                        cutoff_month = exp_date.month + 1

                # Clamp cut_date to valid day of the cutoff month
                last_day = calendar.monthrange(cutoff_year, cutoff_month)[1]
                cutoff_day = min(cut_date_day, last_day)

                cutoff_date = datetime(cutoff_year, cutoff_month, cutoff_day)
                payment_due_date = cutoff_date + timedelta(days=days_to_pay)

                # Subtract in the month where payment_due_date falls
                if payment_due_date.year == target_year and payment_due_date.month == target_month:
                    # Check if the cycle is paid
                    stmt_month = f"{cutoff_year:04d}-{cutoff_month:02d}"
                    is_cycle_paid = False
                    
                    # Try matching by ID first
                    if pm_config.get('id') and (pm_config['id'], stmt_month) in paid_cycles_by_id:
                        is_cycle_paid = True
                    # Try matching by name
                    elif (pm_config['name'].lower(), stmt_month) in paid_cycles_by_name:
                        is_cycle_paid = True
                        
                    if not is_cycle_paid:
                        total_credit_expenses_due += exp_amount

        # Retrieve fixed expenses
        fixed_expenses = self.fixed_expense_dao.get_fixed_expenses(user_id)
        total_fixed_expenses = 0.0

        # Define target month boundaries
        target_start = datetime(target_year, target_month, 1)
        target_end = datetime(target_year, target_month, calendar.monthrange(target_year, target_month)[1], 23, 59, 59)

        for fe in fixed_expenses:
            fe_amount = float(fe.fixed_expense)
            fe_start_str = fe.fexpense_start_date.replace('Z', '') if isinstance(fe.fexpense_start_date, str) else fe.fexpense_start_date
            fe_end_str = fe.fexpense_end_date.replace('Z', '') if isinstance(fe.fexpense_end_date, str) else fe.fexpense_end_date
            
            try:
                fe_start = datetime.fromisoformat(fe_start_str) if isinstance(fe_start_str, str) else fe_start_str
                fe_end = datetime.fromisoformat(fe_end_str) if isinstance(fe_end_str, str) else fe_end_str
            except Exception as e:
                logging.error(f"Error parsing fixed expense dates: {e}")
                continue

            # Check if active in target month
            if fe_start <= target_end:
                if fe.expire:
                    if fe_end >= target_start:
                        total_fixed_expenses += fe_amount
                else:
                    # Does not expire
                    total_fixed_expenses += fe_amount

        total_expenses = total_immediate_expenses + total_credit_expenses_due + total_fixed_expenses + total_credit_payments_made
        remaining_balance = monthly_income - total_expenses

        # Compute total unpaid credit card debt across all cards and billing cycles
        cc_expenses_by_cycle = {}
        for exp in expenses:
            exp_amount = float(exp.expense)
            exp_date_str = str(exp.expense_date).replace('Z', '')
            try:
                exp_date = datetime.fromisoformat(exp_date_str)
            except Exception:
                continue

            pm_config = None
            pm_id = getattr(exp, 'payment_method_id', None)
            if pm_id:
                pm_config = pm_by_id.get(pm_id)
            if not pm_config and exp.payment_method:
                pm_config = pm_by_name.get(exp.payment_method.lower())

            if pm_config and not pm_config.get('is_immediate', False):
                cut_date_day = pm_config.get('cut_date', 0)
                if exp_date.day <= cut_date_day:
                    c_year, c_month = exp_date.year, exp_date.month
                else:
                    if exp_date.month == 12:
                        c_year, c_month = exp_date.year + 1, 1
                    else:
                        c_year, c_month = exp_date.year, exp_date.month + 1
                stmt_month = f"{c_year:04d}-{c_month:02d}"
                card_key = pm_config.get('id') or pm_config.get('name').lower()
                cc_expenses_by_cycle[(card_key, stmt_month)] = cc_expenses_by_cycle.get((card_key, stmt_month), 0.0) + exp_amount

        cc_payments_by_cycle = {}
        for pay in cc_payments:
            pay_card = pay.payment_method_id or ""
            stmt_month = pay.statement_month or ""
            pm_config = pm_by_id.get(pay_card)
            if pm_config:
                norm_key = pm_config.get('id') or pm_config.get('name').lower()
            else:
                norm_key = pay_card.lower() if pay_card else ""
            cc_payments_by_cycle[(norm_key, stmt_month)] = cc_payments_by_cycle.get((norm_key, stmt_month), 0.0) + float(pay.amount_paid)

        unpaid_credit_card_debt = 0.0
        for cycle_key, spent_amount in cc_expenses_by_cycle.items():
            paid_amount = cc_payments_by_cycle.get(cycle_key, 0.0)
            remaining = max(0.0, spent_amount - paid_amount)
            unpaid_credit_card_debt += remaining

        # Realized cash outflows leaving user accounts this month (cash + fixed + CC payments made)
        total_realized_outflows = total_immediate_expenses + total_fixed_expenses + total_credit_payments_made
        # Total committed spent: Realized out-of-pocket + All unpaid credit card debt
        total_spent_with_credit = total_realized_outflows + unpaid_credit_card_debt

        # Net cash flow = Monthly income minus realized outflows
        net_cash_flow = monthly_income - total_realized_outflows
        # Forecasted flow = Monthly income minus (realized outflows + credit debt due this month only)
        forecasted_flow = monthly_income - (total_realized_outflows + total_credit_expenses_due)

        return {
            "monthly_income": monthly_income,
            "total_income": monthly_income,
            "total_immediate_expenses": round(total_immediate_expenses, 2),
            "total_credit_expenses_due": round(total_credit_expenses_due, 2),
            "credit_debt_due_this_month": round(total_credit_expenses_due, 2),
            "total_fixed_expenses": round(total_fixed_expenses, 2),
            "total_credit_payments_made": round(total_credit_payments_made, 2),
            "total_realized_outflows": round(total_realized_outflows, 2),
            "total_expenses": total_expenses,
            "remaining_balance": remaining_balance,
            "cash_flow": round(net_cash_flow, 2),
            "net_cash_flow": round(net_cash_flow, 2),
            "forecasted_flow": round(forecasted_flow, 2),
            "target_month": target_month_str,
            "unpaid_credit_card_debt": round(unpaid_credit_card_debt, 2),
            "total_spent_with_credit": round(total_spent_with_credit, 2),
            "cash_flow_with_credit": round(monthly_income - total_spent_with_credit, 2)
        }
