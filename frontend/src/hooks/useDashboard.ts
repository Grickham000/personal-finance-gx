import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiService } from '../services/api';
import { logoutUser } from '../services/auth';

export const useDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>({ cash_flow: 0, total_income: 0, total_expenses: 0 });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [unpaidCreditDebt, setUnpaidCreditDebt] = useState<number>(0);
  const [totalSpentWithCredit, setTotalSpentWithCredit] = useState<number>(0);
  const [netCashFlow, setNetCashFlow] = useState<number>(0);
  const [forecastedFlow, setForecastedFlow] = useState<number>(0);
  const [creditDebtDueThisMonth, setCreditDebtDueThisMonth] = useState<number>(0);
  const [realizedOutflows, setRealizedOutflows] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setProfileMissing(false);
      
      // Parallel fetch of all required dashboard datasets
      const [profileData, balanceData, expensesData, paymentsData, fixedExpensesData] = await Promise.all([
        apiService.getUserProfile().catch((err: any) => {
          if (err.response?.status === 404 || (err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('not found'))) {
            setProfileMissing(true);
          } else {
            console.error('Error fetching profile:', err);
          }
          return null;
        }),
        apiService.getMoneyBalance().catch((err) => {
          console.error('Error fetching balance:', err);
          return null;
        }),
        apiService.getExpenses().catch((err) => {
          console.error('Error fetching expenses:', err);
          return [];
        }),
        apiService.getCreditCardPayments().catch((err) => {
          console.error('Error fetching cc payments:', err);
          return [];
        }),
        apiService.getFixedExpenses().catch((err) => {
          console.error('Error fetching fixed expenses:', err);
          return [];
        })
      ]);

      if (profileData) setProfile(profileData);
      if (balanceData) setBalance(balanceData);

      // Recent expenses sorted chronologically (newest first)
      const sorted = (expensesData || []).sort(
        (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );
      setRecentExpenses(sorted.slice(0, 5));

      // Calculate unpaid credit card debt across all cards and billing cycles
      const creditCards = (profileData?.payment_methods || []).filter((pm: any) => !pm.is_immediate);
      let calculatedUnpaidCcDebt = 0;

      if (creditCards.length > 0 && expensesData && paymentsData) {
        creditCards.forEach((card: any) => {
          const cutDateDay = card.cut_date || 1;
          const cardId = card.id;
          const cardNameLower = (card.name || '').toLowerCase();
          const today = new Date();

          // Evaluate statement cycles (from 6 months ago up to 1 month ahead)
          for (let i = -6; i <= 1; i++) {
            const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const year = targetMonthDate.getFullYear();
            const month = targetMonthDate.getMonth() + 1;

            const lastDayOfCutoffMonth = new Date(year, month, 0).getDate();
            const cutoffDay = Math.min(cutDateDay, lastDayOfCutoffMonth);
            const endDate = new Date(year, month - 1, cutoffDay, 23, 59, 59, 999);

            const prevMonthDate = new Date(year, month - 2, 1);
            const prevYear = prevMonthDate.getFullYear();
            const prevMonth = prevMonthDate.getMonth() + 1;
            const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
            const prevCutoffDay = Math.min(cutDateDay, lastDayOfPrevMonth);
            const startDate = new Date(prevYear, prevMonth - 1, prevCutoffDay + 1, 0, 0, 0, 0);

            const statementMonth = `${year}-${String(month).padStart(2, '0')}`;

            const statementExpenses = (expensesData || []).filter((exp: any) => {
              const expDate = new Date(exp.expense_date);
              const isCardMatch = 
                (exp.payment_method_id && exp.payment_method_id === cardId) ||
                (exp.payment_method && exp.payment_method.toLowerCase() === cardNameLower);
              return isCardMatch && expDate >= startDate && expDate <= endDate;
            });

            const isCycleStarted = startDate <= today;
            const statementFixedSpent = isCycleStarted
              ? (fixedExpensesData || [])
                  .filter((fe: any) => {
                    const isCardMatch =
                      (fe.payment_method_id && cardId && fe.payment_method_id === cardId) ||
                      (fe.payment_method && fe.payment_method.toLowerCase() === cardNameLower);
                    if (!isCardMatch) return false;
                    const feStart = new Date(fe.fexpense_start_date);
                    const feEnd = fe.expire && fe.fexpense_end_date ? new Date(fe.fexpense_end_date) : null;
                    if (isNaN(feStart.getTime())) return false;
                    return feStart <= endDate && (!fe.expire || !feEnd || feEnd >= startDate);
                  })
                  .reduce((sum: number, fe: any) => sum + (Number(fe.fixed_expense) || 0), 0)
              : 0;

            const totalSpent = statementExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.expense) || 0), 0) + statementFixedSpent;

            const statementPayments = (paymentsData || []).filter((pay: any) => {
              const isCardMatch = 
                (pay.payment_method_id && pay.payment_method_id === cardId) ||
                (pay.payment_method_id && pay.payment_method_id.toLowerCase() === cardNameLower);
              return isCardMatch && pay.statement_month === statementMonth;
            });

            const totalPaid = statementPayments.reduce((sum: number, pay: any) => sum + (Number(pay.amount_paid) || 0), 0);
            const remainingBalance = Math.max(0, totalSpent - totalPaid);
            calculatedUnpaidCcDebt += remainingBalance;
          }
        });
      }

      // Calculate credit card debt that has to be paid in current month only (client fallback)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const paidCycles = new Set<string>();
      (paymentsData || []).forEach((pay: any) => {
        if (pay.statement_month) {
          if (pay.payment_method_id) {
            paidCycles.add(`${pay.payment_method_id}#${pay.statement_month}`);
            paidCycles.add(`${pay.payment_method_id.toLowerCase()}#${pay.statement_month}`);
          }
        }
      });

      let calculatedDebtDueThisMonth = 0;
      (expensesData || []).forEach((exp: any) => {
        const expAmount = Number(exp.expense) || 0;
        const expDate = new Date(exp.expense_date);
        
        const pm = (profileData?.payment_methods || []).find((p: any) => 
          (exp.payment_method_id && p.id === exp.payment_method_id) ||
          (p.name && p.name.toLowerCase() === (exp.payment_method || '').toLowerCase())
        );

        if (!pm || pm.is_immediate) {
          return;
        }

        const cutDateDay = pm.cut_date || 1;
        const daysToPay = pm.days_to_pay || 0;

        let cutoffYear = expDate.getFullYear();
        let cutoffMonth = expDate.getMonth() + 1;
        if (expDate.getDate() > cutDateDay) {
          if (cutoffMonth === 12) {
            cutoffYear += 1;
            cutoffMonth = 1;
          } else {
            cutoffMonth += 1;
          }
        }

        const lastDayOfCutoff = new Date(cutoffYear, cutoffMonth, 0).getDate();
        const cutoffDay = Math.min(cutDateDay, lastDayOfCutoff);
        const cutoffDate = new Date(cutoffYear, cutoffMonth - 1, cutoffDay);
        
        const paymentDueDate = new Date(cutoffDate.getTime() + daysToPay * 24 * 60 * 60 * 1000);

        if (paymentDueDate.getFullYear() === currentYear && (paymentDueDate.getMonth() + 1) === currentMonth) {
          const stmtMonth = `${cutoffYear}-${String(cutoffMonth).padStart(2, '0')}`;
          const isPaid = (pm.id && paidCycles.has(`${pm.id}#${stmtMonth}`)) ||
                         paidCycles.has(`${(pm.name || '').toLowerCase()}#${stmtMonth}`);
          if (!isPaid) {
            calculatedDebtDueThisMonth += expAmount;
          }
        }
      });

      (fixedExpensesData || []).forEach((fe: any) => {
        const feAmount = Number(fe.fixed_expense) || 0;
        const pm = (profileData?.payment_methods || []).find((p: any) =>
          (fe.payment_method_id && p.id === fe.payment_method_id) ||
          (p.name && p.name.toLowerCase() === (fe.payment_method || '').toLowerCase())
        );

        if (!pm || pm.is_immediate) {
          return;
        }

        const cutDateDay = pm.cut_date || 1;
        const daysToPay = pm.days_to_pay || 0;
        const feStart = new Date(fe.fexpense_start_date);
        const feEnd = fe.expire && fe.fexpense_end_date ? new Date(fe.fexpense_end_date) : null;
        if (isNaN(feStart.getTime())) return;

        for (let offset = -2; offset <= 1; offset++) {
          const targetCycleDate = new Date(currentYear, currentMonth - 1 + offset, 1);
          const cYear = targetCycleDate.getFullYear();
          const cMonth = targetCycleDate.getMonth() + 1;

          const lastDayOfCutoff = new Date(cYear, cMonth, 0).getDate();
          const cutoffDay = Math.min(cutDateDay, lastDayOfCutoff);
          const cutoffDate = new Date(cYear, cMonth - 1, cutoffDay);
          const cycleEndDate = new Date(cYear, cMonth - 1, cutoffDay, 23, 59, 59, 999);

          const prevMonthDate = new Date(cYear, cMonth - 2, 1);
          const pYear = prevMonthDate.getFullYear();
          const pMonth = prevMonthDate.getMonth() + 1;
          const lastDayOfPrev = new Date(pYear, pMonth, 0).getDate();
          const prevCutoffDay = Math.min(cutDateDay, lastDayOfPrev);
          const cycleStartDate = new Date(pYear, pMonth - 1, prevCutoffDay + 1, 0, 0, 0, 0);

          const paymentDueDate = new Date(cutoffDate.getTime() + daysToPay * 24 * 60 * 60 * 1000);
          if (paymentDueDate.getFullYear() === currentYear && (paymentDueDate.getMonth() + 1) === currentMonth) {
            const isActive = feStart <= cycleEndDate && (!fe.expire || !feEnd || feEnd >= cycleStartDate);
            if (isActive) {
              const stmtMonth = `${cYear}-${String(cMonth).padStart(2, '0')}`;
              const isPaid = (pm.id && paidCycles.has(`${pm.id}#${stmtMonth}`)) ||
                             paidCycles.has(`${(pm.name || '').toLowerCase()}#${stmtMonth}`);
              if (!isPaid) {
                calculatedDebtDueThisMonth += feAmount;
              }
            }
          }
        }
      });

      const backendDebtDue = balanceData?.credit_debt_due_this_month !== undefined
        ? Number(balanceData.credit_debt_due_this_month)
        : (balanceData?.total_credit_expenses_due !== undefined
            ? Number(balanceData.total_credit_expenses_due)
            : 0);
      const finalCreditDebtDueThisMonth = Math.max(backendDebtDue, calculatedDebtDueThisMonth);

      const finalRealizedOutflows = balanceData?.total_realized_outflows !== undefined
        ? Number(balanceData.total_realized_outflows)
        : (balanceData?.total_expenses !== undefined
            ? Math.max(0, Number(balanceData.total_expenses) - (Number(balanceData?.total_credit_expenses_due) || 0))
            : 0);

      const monthlyIncome = Number(profileData?.monthly_income) || Number(balanceData?.monthly_income) || Number(balanceData?.total_income) || 0;

      const finalNetCashFlow = balanceData?.net_cash_flow !== undefined
        ? Number(balanceData.net_cash_flow)
        : (balanceData?.cash_flow !== undefined && balanceData?.forecasted_flow !== undefined
            ? Number(balanceData.cash_flow)
            : monthlyIncome - finalRealizedOutflows);

      const finalForecastedFlow = finalNetCashFlow - finalCreditDebtDueThisMonth;

      const backendUnpaidCcDebt = balanceData?.unpaid_credit_card_debt !== undefined
        ? Number(balanceData.unpaid_credit_card_debt)
        : 0;
      const finalUnpaidCcDebt = Math.max(backendUnpaidCcDebt, calculatedUnpaidCcDebt);

      const finalTotalSpentWithCredit = finalRealizedOutflows + finalUnpaidCcDebt;

      setCreditDebtDueThisMonth(finalCreditDebtDueThisMonth);
      setRealizedOutflows(finalRealizedOutflows);
      setNetCashFlow(finalNetCashFlow);
      setForecastedFlow(finalForecastedFlow);
      setUnpaidCreditDebt(finalUnpaidCcDebt);
      setTotalSpentWithCredit(finalTotalSpentWithCredit);

    } catch (err) {
      console.error('General error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return {
    profile,
    balance,
    netCashFlow,
    forecastedFlow,
    creditDebtDueThisMonth,
    realizedOutflows,
    unpaidCreditDebt,
    totalSpentWithCredit,
    recentExpenses,
    loading,
    refreshing,
    profileMissing,
    onRefresh,
    handleLogout,
    formatDate,
  };
};
