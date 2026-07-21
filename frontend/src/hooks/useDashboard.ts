import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { logoutUser } from '../services/auth';

export const useDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>({ cash_flow: 0, total_income: 0, total_expenses: 0 });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setProfileMissing(false);
      
      // 1. Fetch user profile
      let profileData = null;
      try {
        profileData = await apiService.getUserProfile();
        setProfile(profileData);
      } catch (err: any) {
        if (err.response?.status === 404 || (err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('not found'))) {
          setProfileMissing(true);
        } else {
          console.error('Error fetching profile:', err);
        }
      }

      // 2. Fetch money balance for current month
      try {
        const balanceData = await apiService.getMoneyBalance();
        setBalance(balanceData);
      } catch (err) {
        console.error('Error fetching balance:', err);
      }

      // 3. Fetch recent expenses
      try {
        const expensesData = await apiService.getExpenses();
        const sorted = (expensesData || []).sort(
          (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
        );
        setRecentExpenses(sorted.slice(0, 5));
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }

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
    recentExpenses,
    loading,
    refreshing,
    profileMissing,
    onRefresh,
    handleLogout,
    formatDate,
  };
};
