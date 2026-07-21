import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';

export type SubTab = 'savings' | 'investments';

export const useInvestments = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('savings');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [savings, setSavings] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  // Modal forms states
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [savingsName, setSavingsName] = useState('');
  const [savingsRate, setSavingsRate] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
  const [savingsDesc, setSavingsDesc] = useState('');
  const [savingsError, setSavingsError] = useState('');

  const [investmentModalVisible, setInvestmentModalVisible] = useState(false);
  const [invName, setInvName] = useState('');
  const [invRate, setInvRate] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invHasEndDate, setInvHasEndDate] = useState(false);
  const [invEndDate, setInvEndDate] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invError, setInvError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [profileData, savingsData, investmentsData] = await Promise.all([
        apiService.getUserProfile().catch(() => null),
        apiService.getSavingsAccounts().catch(() => []),
        apiService.getInvestments().catch(() => []),
      ]);
      setProfile(profileData);
      setSavings(savingsData || []);
      setInvestments(investmentsData || []);
    } catch (err) {
      console.error('Error fetching savings/investments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSavings = async () => {
    if (!savingsName || !savingsRate || !savingsBalance) {
      setSavingsError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setSavingsError('');
    try {
      await apiService.createSavingsAccount({
        name: savingsName.trim(),
        interest_rate: parseFloat(savingsRate),
        balance: parseFloat(savingsBalance),
        description: savingsDesc.trim()
      });
      setSavingsName('');
      setSavingsRate('');
      setSavingsBalance('');
      setSavingsDesc('');
      setSavingsModalVisible(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSavingsError(err.response?.data || err.message || 'Failed to add savings account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!invName || !invRate || !invAmount) {
      setInvError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setInvError('');
    try {
      await apiService.createInvestment({
        name: invName.trim(),
        interest_rate: parseFloat(invRate),
        amount: parseFloat(invAmount),
        has_end_date: invHasEndDate,
        end_date: invHasEndDate && invEndDate ? new Date(invEndDate).toISOString() : null,
        is_released: false,
        description: invDesc.trim()
      });
      setInvName('');
      setInvRate('');
      setInvAmount('');
      setInvHasEndDate(false);
      setInvEndDate('');
      setInvDesc('');
      setInvestmentModalVisible(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setInvError(err.response?.data || err.message || 'Failed to add investment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSavings = (id: string, name: string) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteSavingsAccount(id);
              setSavings(prev => prev.filter(s => s.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to remove account.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteInvestment = (id: string, name: string) => {
    Alert.alert(
      'Delete Investment',
      `Are you sure you want to delete investment: ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteInvestment(id);
              setInvestments(prev => prev.filter(i => i.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete investment.');
            }
          }
        }
      ]
    );
  };

  const totalSavings = savings.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const totalInvestments = investments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return {
    profile,
    activeTab,
    setActiveTab,
    loading,
    savings,
    investments,
    savingsModalVisible,
    setSavingsModalVisible,
    savingsName,
    setSavingsName,
    savingsRate,
    setSavingsRate,
    savingsBalance,
    setSavingsBalance,
    savingsDesc,
    setSavingsDesc,
    savingsError,
    investmentModalVisible,
    setInvestmentModalVisible,
    invName,
    setInvName,
    invRate,
    setInvRate,
    invAmount,
    setInvAmount,
    invHasEndDate,
    setInvHasEndDate,
    invEndDate,
    setInvEndDate,
    invDesc,
    setInvDesc,
    invError,
    submitting,
    handleAddSavings,
    handleAddInvestment,
    handleDeleteSavings,
    handleDeleteInvestment,
    totalSavings,
    totalInvestments,
  };
};
