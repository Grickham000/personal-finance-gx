import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { logoutUser } from '../services/auth';

export const useDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>({ cash_flow: 0, total_income: 0, total_expenses: 0 });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [unpaidCreditDebt, setUnpaidCreditDebt] = useState<number>(0);
  const [totalSpentWithCredit, setTotalSpentWithCredit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setProfileMissing(false);
      
      // Parallel fetch of all required dashboard datasets
      const [profileData, balanceData, expensesData, paymentsData] = await Promise.all([
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

            const totalSpent = statementExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.expense) || 0), 0);

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

      const finalUnpaidCcDebt = balanceData?.unpaid_credit_card_debt !== undefined 
        ? balanceData.unpaid_credit_card_debt 
        : calculatedUnpaidCcDebt;

      const finalTotalSpentWithCredit = balanceData?.total_spent_with_credit !== undefined
        ? balanceData.total_spent_with_credit
        : (balanceData?.total_expenses || 0) + finalUnpaidCcDebt;

      setUnpaidCreditDebt(finalUnpaidCcDebt);
      setTotalSpentWithCredit(finalTotalSpentWithCredit);

    } catch (err) {
      console.error('General error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
