import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

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

  // Editing and Details viewing states for Investments
  const [editingInvestment, setEditingInvestment] = useState<any | null>(null);
  const [viewingInvestment, setViewingInvestment] = useState<any | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Editing and Details viewing states for Savings
  const [editingSavings, setEditingSavings] = useState<any | null>(null);
  const [viewingSavings, setViewingSavings] = useState<any | null>(null);
  const [savingsDetailsModalVisible, setSavingsDetailsModalVisible] = useState(false);

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
      return { savingsData, investmentsData };
    } catch (err) {
      console.error('Error fetching savings/investments:', err);
      return null;
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
      const payload = {
        name: savingsName.trim(),
        interest_rate: parseFloat(savingsRate),
        balance: parseFloat(savingsBalance),
        description: savingsDesc.trim()
      };

      const prevEditingId = editingSavings?.id;

      if (editingSavings) {
        await apiService.updateSavingsAccount(editingSavings.id, payload);
      } else {
        await apiService.createSavingsAccount(payload);
      }

      setSavingsName('');
      setSavingsRate('');
      setSavingsBalance('');
      setSavingsDesc('');
      setEditingSavings(null);
      setSavingsModalVisible(false);
      setLoading(true);
      const data = await fetchData();

      // If we just edited the viewed savings account, refresh its data in the details view
      if (prevEditingId && data) {
        const refreshedSav = data.savingsData?.find((s: any) => s.id === prevEditingId);
        if (refreshedSav) {
          setViewingSavings(refreshedSav);
        }
      }
    } catch (err: any) {
      console.error(err);
      setSavingsError(extractErrorMessage(err));
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
      const payload = {
        name: invName.trim(),
        interest_rate: parseFloat(invRate),
        amount: parseFloat(invAmount),
        has_end_date: invHasEndDate,
        end_date: invHasEndDate && invEndDate ? new Date(invEndDate).toISOString() : null,
        is_released: editingInvestment ? editingInvestment.is_released : false,
        description: invDesc.trim()
      };

      const prevEditingId = editingInvestment?.id;

      if (editingInvestment) {
        await apiService.updateInvestment(editingInvestment.id, payload);
      } else {
        await apiService.createInvestment(payload);
      }

      setInvName('');
      setInvRate('');
      setInvAmount('');
      setInvHasEndDate(false);
      setInvEndDate('');
      setInvDesc('');
      setEditingInvestment(null);
      setInvestmentModalVisible(false);
      setLoading(true);
      const data = await fetchData();

      // If we just edited the viewed asset, refresh its data in the details view
      if (prevEditingId && data) {
        const refreshedInv = data.investmentsData?.find((i: any) => i.id === prevEditingId);
        if (refreshedInv) {
          setViewingInvestment(refreshedInv);
        }
      }
    } catch (err: any) {
      console.error(err);
      setInvError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSavingsPress = (item: any) => {
    setEditingSavings(item);
    setSavingsName(item.name);
    setSavingsRate(item.interest_rate.toString());
    setSavingsBalance(item.balance.toString());
    setSavingsDesc(item.description || '');
    setSavingsError('');
    setSavingsModalVisible(true);
  };

  const handleCloseSavingsModal = () => {
    setSavingsName('');
    setSavingsRate('');
    setSavingsBalance('');
    setSavingsDesc('');
    setSavingsError('');
    setEditingSavings(null);
    setSavingsModalVisible(false);
  };

  const handleSavingsDetailsPress = (item: any) => {
    setViewingSavings(item);
    setSavingsDetailsModalVisible(true);
  };

  const handleCloseSavingsDetailsModal = () => {
    setViewingSavings(null);
    setSavingsDetailsModalVisible(false);
  };

  const handleEditInvestmentPress = (item: any) => {
    setEditingInvestment(item);
    setInvName(item.name);
    setInvRate(item.interest_rate.toString());
    setInvAmount(item.amount.toString());
    setInvHasEndDate(item.has_end_date);
    setInvEndDate(item.end_date ? item.end_date.split(' ')[0] : '');
    setInvDesc(item.description || '');
    setInvError('');
    setInvestmentModalVisible(true);
  };

  const handleCloseInvestmentModal = () => {
    setInvName('');
    setInvRate('');
    setInvAmount('');
    setInvHasEndDate(false);
    setInvEndDate('');
    setInvDesc('');
    setInvError('');
    setEditingInvestment(null);
    setInvestmentModalVisible(false);
  };

  const handleDetailsPress = (item: any) => {
    setViewingInvestment(item);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setViewingInvestment(null);
    setDetailsModalVisible(false);
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
              if (viewingSavings && viewingSavings.id === id) {
                setSavingsDetailsModalVisible(false);
                setViewingSavings(null);
              }
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
              if (viewingInvestment && viewingInvestment.id === id) {
                setDetailsModalVisible(false);
                setViewingInvestment(null);
              }
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
    editingInvestment,
    setEditingInvestment,
    viewingInvestment,
    setViewingInvestment,
    detailsModalVisible,
    setDetailsModalVisible,
    handleEditInvestmentPress,
    handleCloseInvestmentModal,
    handleDetailsPress,
    handleCloseDetailsModal,
    editingSavings,
    setEditingSavings,
    viewingSavings,
    setViewingSavings,
    savingsDetailsModalVisible,
    setSavingsDetailsModalVisible,
    handleEditSavingsPress,
    handleCloseSavingsModal,
    handleSavingsDetailsPress,
    handleCloseSavingsDetailsModal,
  };
};
