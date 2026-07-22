import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';

export type ExpenseTab = 'variable' | 'fixed';

export const useExpenses = () => {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('variable');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [variableExpenses, setVariableExpenses] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  // Filter states (for variable expenses)
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');

  // Form states (Variable Modal)
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isUnexpectedIncome, setIsUnexpectedIncome] = useState(false);

  // Form states (Fixed Modal)
  const [fixedModalVisible, setFixedModalVisible] = useState(false);
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedCategory, setFixedCategory] = useState('');
  const [fixedDescription, setFixedDescription] = useState('');
  const [fixedStartDate, setFixedStartDate] = useState('');
  const [fixedEndDate, setFixedEndDate] = useState('');
  const [fixedExpire, setFixedExpire] = useState(false);
  const [fixedError, setFixedError] = useState('');
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, expensesData, fixedData] = await Promise.all([
        apiService.getUserProfile().catch(() => null),
        apiService.getExpenses().catch(() => []),
        apiService.getFixedExpenses().catch(() => []),
      ]);

      setProfile(profileData);
      
      // Defaults for Variable Modal
      if (profileData?.expense_types?.length > 0) {
        setCategory(profileData.expense_types[0]);
        setFixedCategory(profileData.expense_types[0]);
      }
      if (profileData?.payment_methods?.length > 0) {
        setPaymentMethodName(profileData.payment_methods[0].name);
      }

      // Variable expenses (sorted by date descending)
      const sortedVariable = (expensesData || []).sort(
        (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );
      setVariableExpenses(sortedVariable);

      // Fixed expenses (sorted by start date descending)
      const sortedFixed = (fixedData || []).sort(
        (a: any, b: any) => new Date(b.fexpense_start_date).getTime() - new Date(a.fexpense_start_date).getTime()
      );
      setFixedExpenses(sortedFixed);
    } catch (err) {
      console.error('Error fetching expenses data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Variable Expenses Actions ---

  const handleAddVariableExpense = async () => {
    const val = Number(amount);
    if (!amount || isNaN(val) || val === 0) {
      setFormError('Please enter a valid non-zero amount.');
      return;
    }
    if (!category) {
      setFormError('Please select a category.');
      return;
    }
    if (!paymentMethodName) {
      setFormError('Please select a payment method.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a description.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const selectedPM = profile?.payment_methods?.find((pm: any) => pm.name === paymentMethodName);

    try {
      const parsedAmount = parseFloat(amount);
      const finalAmount = isUnexpectedIncome ? -Math.abs(parsedAmount) : parsedAmount;

      const newExpense = {
        expense: finalAmount,
        expense_type: category,
        payment_method: paymentMethodName,
        expense_description: description.trim(),
        expense_date: new Date().toISOString(),
        payment_method_cut_date: selectedPM?.cut_date || 0,
        payment_method_id: selectedPM?.id || null,
      };

      await apiService.createExpense(newExpense);
      
      setAmount('');
      setDescription('');
      setIsUnexpectedIncome(false);
      setVariableModalVisible(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || err.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVariableExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteExpense(id);
              setVariableExpenses(prev => prev.filter(e => e.id !== id));
            } catch (err) {
              console.error('Failed to delete expense:', err);
              Alert.alert('Error', 'Failed to delete expense record.');
            }
          }
        }
      ]
    );
  };

  const filteredVariableExpenses = variableExpenses.filter(item => {
    return !selectedFilterCategory || item.expense_type === selectedFilterCategory;
  });

  // --- Fixed Expenses Actions ---

  const openAddFixedModal = () => {
    setEditingFixedId(null);
    setFixedAmount('');
    setFixedDescription('');
    setFixedExpire(false);
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setFixedStartDate(todayStr);

    const yearLater = new Date();
    yearLater.setFullYear(yearLater.getFullYear() + 1);
    const endStr = `${yearLater.getFullYear()}-${String(yearLater.getMonth() + 1).padStart(2, '0')}-${String(yearLater.getDate()).padStart(2, '0')}`;
    setFixedEndDate(endStr);
    
    if (profile?.expense_types?.length > 0) {
      setFixedCategory(profile.expense_types[0]);
    }
    setFixedError('');
    setFixedModalVisible(true);
  };

  const openEditFixedModal = (item: any) => {
    setEditingFixedId(item.id);
    setFixedAmount(String(item.fixed_expense));
    setFixedCategory(item.fexpense_type);
    setFixedDescription(item.fexpense_description);
    
    const startD = new Date(item.fexpense_start_date);
    const startStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
    setFixedStartDate(startStr);

    if (item.fexpense_end_date) {
      const endD = new Date(item.fexpense_end_date);
      const endStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
      setFixedEndDate(endStr);
    } else {
      setFixedEndDate('');
    }
    setFixedExpire(item.expire);
    setFixedError('');
    setFixedModalVisible(true);
  };

  const handleSaveFixedExpense = async () => {
    if (!fixedAmount || isNaN(Number(fixedAmount)) || Number(fixedAmount) <= 0) {
      setFixedError('Please enter a valid amount.');
      return;
    }
    if (!fixedCategory) {
      setFixedError('Please select a category.');
      return;
    }
    if (!fixedDescription.trim()) {
      setFixedError('Please enter a description.');
      return;
    }
    if (!fixedStartDate.trim()) {
      setFixedError('Please enter a start date.');
      return;
    }
    if (fixedExpire && !fixedEndDate.trim()) {
      setFixedError('Please enter an end date for expiration.');
      return;
    }

    setSubmitting(true);
    setFixedError('');

    try {
      const payload = {
        fixed_expense: parseFloat(fixedAmount),
        fexpense_type: fixedCategory,
        fexpense_description: fixedDescription.trim(),
        fexpense_start_date: `${fixedStartDate} 12:00:00`,
        fexpense_end_date: fixedExpire && fixedEndDate ? `${fixedEndDate} 12:00:00` : null,
        expire: fixedExpire,
      };

      if (editingFixedId) {
        await apiService.updateFixedExpense(editingFixedId, payload);
      } else {
        await apiService.createFixedExpense(payload);
      }

      setFixedModalVisible(false);
      setLoading(true);
      await fetchData();
      Alert.alert('Success', `Fixed expense ${editingFixedId ? 'updated' : 'created'} successfully!`);
    } catch (err: any) {
      console.error(err);
      setFixedError(err.response?.data || err.message || 'Failed to save fixed expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFixedExpense = (id: string, description: string) => {
    Alert.alert(
      'Delete Fixed Expense',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteFixedExpense(id);
              setFixedExpenses(prev => prev.filter(e => e.id !== id));
            } catch (err) {
              console.error('Failed to delete fixed expense:', err);
              Alert.alert('Error', 'Failed to delete fixed expense.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ongoing';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return {
    profile,
    activeTab,
    setActiveTab,
    loading,
    submitting,
    selectedFilterCategory,
    setSelectedFilterCategory,
    filteredVariableExpenses,
    fixedExpenses,

    // Variable Modal Form
    variableModalVisible,
    setVariableModalVisible,
    amount,
    setAmount,
    category,
    setCategory,
    paymentMethodName,
    setPaymentMethodName,
    description,
    setDescription,
    formError,
    isUnexpectedIncome,
    setIsUnexpectedIncome,
    handleAddVariableExpense,
    handleDeleteVariableExpense,

    // Fixed Modal Form
    fixedModalVisible,
    setFixedModalVisible,
    fixedAmount,
    setFixedAmount,
    fixedCategory,
    setFixedCategory,
    fixedDescription,
    setFixedDescription,
    fixedStartDate,
    setFixedStartDate,
    fixedEndDate,
    setFixedEndDate,
    fixedExpire,
    setFixedExpire,
    fixedError,
    editingFixedId,
    openAddFixedModal,
    openEditFixedModal,
    handleSaveFixedExpense,
    handleDeleteFixedExpense,
    formatDate,
  };
};
