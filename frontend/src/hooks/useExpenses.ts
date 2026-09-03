import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

export type ExpenseTab = 'variable' | 'fixed';

export const useExpenses = () => {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('variable');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [variableExpenses, setVariableExpenses] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  // Filter & Date states (for variable expenses)
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'month' | 'week' | 'day' | 'range'>('month');
  
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getLocalDateString = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  // Form states (Variable Modal)
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isUnexpectedIncome, setIsUnexpectedIncome] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState('');

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

  // Fetch user profile and fixed expenses (once on mount or reload)
  const fetchProfileAndFixed = useCallback(async () => {
    try {
      const [profileData, fixedData] = await Promise.all([
        apiService.getUserProfile().catch(() => null),
        apiService.getFixedExpenses().catch(() => []),
      ]);

      setProfile(profileData);
      
      // Defaults for Variable/Fixed Modal
      if (profileData?.expense_types?.length > 0) {
        setCategory(profileData.expense_types[0]);
        setFixedCategory(profileData.expense_types[0]);
      }
      if (profileData?.payment_methods?.length > 0) {
        setPaymentMethodName(profileData.payment_methods[0].name);
      }

      // Fixed expenses (sorted by start date descending)
      const sortedFixed = (fixedData || []).sort(
        (a: any, b: any) => new Date(b.fexpense_start_date).getTime() - new Date(a.fexpense_start_date).getTime()
      );
      setFixedExpenses(sortedFixed);
    } catch (err) {
      console.error('Error fetching profile/fixed expenses:', err);
    }
  }, []);

  // Fetch variable expenses based on page and filters
  const fetchVariable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getExpensesPaginated({
        expense_type: selectedFilterCategory || undefined,
        filter_type: filterType,
        target_date: filterType === 'month' ? targetDate.substring(0, 7) : targetDate,
        start_date: filterType === 'range' && startDate ? `${startDate} 00:00:00` : undefined,
        end_date: filterType === 'range' && endDate ? `${endDate} 23:59:59` : undefined,
        page,
        per_page: perPage
      });

      setVariableExpenses(res.data);
      setPaginationInfo(res.pagination);
    } catch (err) {
      console.error('Error fetching variable expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFilterCategory, filterType, targetDate, startDate, endDate, page, perPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProfileAndFixed(),
        fetchVariable()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfileAndFixed, fetchVariable]);

  // Load initial static configuration
  useEffect(() => {
    fetchProfileAndFixed();
  }, [fetchProfileAndFixed]);

  // Load dynamic variable list when filters or page update
  useEffect(() => {
    fetchVariable();
  }, [fetchVariable]);

  // Reset page when any filter query changes
  useEffect(() => {
    setPage(1);
  }, [selectedFilterCategory, filterType, targetDate, startDate, endDate]);

  // Period navigation helpers
  const handlePrevPeriod = () => {
    const current = new Date(targetDate + 'T12:00:00');
    if (filterType === 'month') {
      current.setMonth(current.getMonth() - 1);
    } else if (filterType === 'week') {
      current.setDate(current.getDate() - 7);
    } else if (filterType === 'day') {
      current.setDate(current.getDate() - 1);
    }
    setTargetDate(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`);
  };

  const handleNextPeriod = () => {
    const current = new Date(targetDate + 'T12:00:00');
    if (filterType === 'month') {
      current.setMonth(current.getMonth() + 1);
    } else if (filterType === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (filterType === 'day') {
      current.setDate(current.getDate() + 1);
    }
    setTargetDate(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`);
  };

  // --- Variable Expenses Actions ---

  const openAddVariableModal = () => {
    setEditingVariableId(null);
    setAmount('');
    setDescription('');
    setIsUnexpectedIncome(false);
    setExpenseDate(getTodayString());
    if (profile?.expense_types?.length > 0) {
      setCategory(profile.expense_types[0]);
    }
    if (profile?.payment_methods?.length > 0) {
      setPaymentMethodName(profile.payment_methods[0].name);
    }
    setFormError('');
    setVariableModalVisible(true);
  };

  const openEditVariableModal = (item: any) => {
    setEditingVariableId(item.id);
    setAmount(String(Math.abs(item.expense)));
    setCategory(item.expense_type);
    setPaymentMethodName(item.payment_method);
    setDescription(item.expense_description);
    setIsUnexpectedIncome(item.expense < 0);
    const origDate = item.expense_date ? getLocalDateString(item.expense_date) : getTodayString();
    setExpenseDate(origDate);
    setFormError('');
    setVariableModalVisible(true);
  };

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

      // Construct a timezone-neutral ISO string using chosen expenseDate and current time
      const today = new Date();
      const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
      const expenseISO = `${expenseDate}T${timeStr}`;

      const expensePayload = {
        expense: finalAmount,
        expense_type: category,
        payment_method: paymentMethodName,
        expense_description: description.trim(),
        expense_date: expenseISO,
        payment_method_cut_date: selectedPM?.cut_date || 0,
        payment_method_id: selectedPM?.id || null,
      };

      if (editingVariableId) {
        await apiService.updateExpense(editingVariableId, expensePayload);
      } else {
        await apiService.createExpense(expensePayload);
      }
      
      setAmount('');
      setDescription('');
      setIsUnexpectedIncome(false);
      setVariableModalVisible(false);
      await fetchVariable();
    } catch (err: any) {
      console.error(err);
      setFormError(extractErrorMessage(err));
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
              await fetchVariable();
            } catch (err) {
              console.error('Failed to delete expense:', err);
              Alert.alert('Error', 'Failed to delete expense record.');
            }
          }
        }
      ]
    );
  };

  const filteredVariableExpenses = variableExpenses;

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
      await fetchProfileAndFixed();
      Alert.alert('Success', `Fixed expense ${editingFixedId ? 'updated' : 'created'} successfully!`);
    } catch (err: any) {
      console.error(err);
      setFixedError(extractErrorMessage(err));
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
              await fetchProfileAndFixed();
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
    refreshing,
    onRefresh,
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
    editingVariableId,
    expenseDate,
    setExpenseDate,
    openAddVariableModal,
    openEditVariableModal,
    handleAddVariableExpense,
    handleDeleteVariableExpense,

    // Date filters & Pagination
    filterType,
    setFilterType,
    targetDate,
    setTargetDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    paginationInfo,
    handlePrevPeriod,
    handleNextPeriod,

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
