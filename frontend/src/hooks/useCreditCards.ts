import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services/api';
import { extractErrorMessage } from '../utils/errors';

export interface CardStatement {
  statementMonth: string; // YYYY-MM
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  totalSpent: number;
  totalPaid: number;
  remainingBalance: number;
  status: 'paid' | 'unpaid' | 'due_soon' | 'overdue';
  daysRemaining: number;
  expenses: any[];
}

export const useCreditCards = () => {
  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI states
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [expandedStatements, setExpandedStatements] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStatementMonth, setSelectedStatementMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Fetch all credit cards data
  const fetchData = useCallback(async () => {
    try {
      const [profileData, expensesData, paymentsData] = await Promise.all([
        apiService.getUserProfile().catch(() => null),
        apiService.getExpenses().catch(() => []),
        apiService.getCreditCardPayments().catch(() => [])
      ]);

      setProfile(profileData);
      setExpenses(expensesData || []);
      setPayments(paymentsData || []);

      const creditCards = (profileData?.payment_methods || []).filter((pm: any) => !pm.is_immediate);
      if (creditCards.length > 0 && !activeCardId) {
        setActiveCardId(creditCards[0].id || creditCards[0].name);
      }
    } catch (err) {
      console.error('Error fetching credit cards data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const creditCards = (profile?.payment_methods || []).filter((pm: any) => !pm.is_immediate);
  const activeCard = creditCards.find((c: any) => (c.id || c.name) === activeCardId) || creditCards[0];

  const getStatementsForCard = useCallback((card: any): CardStatement[] => {
    if (!card) return [];
    
    const cutDateDay = card.cut_date || 1;
    const daysToPay = card.days_to_pay || 0;
    const cardId = card.id;
    const cardNameLower = card.name.toLowerCase();

    const statements: CardStatement[] = [];
    const today = new Date();

    for (let i = -4; i <= 1; i++) {
      const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth() + 1; // 1-indexed

      const lastDayOfCutoffMonth = new Date(year, month, 0).getDate();
      const cutoffDay = Math.min(cutDateDay, lastDayOfCutoffMonth);
      const endDate = new Date(year, month - 1, cutoffDay, 23, 59, 59, 999);

      const prevMonthDate = new Date(year, month - 2, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth() + 1;
      const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      const prevCutoffDay = Math.min(cutDateDay, lastDayOfPrevMonth);
      const startDate = new Date(prevYear, prevMonth - 1, prevCutoffDay + 1, 0, 0, 0, 0);

      const dueDate = new Date(endDate.getTime());
      dueDate.setDate(dueDate.getDate() + daysToPay);
      dueDate.setHours(23, 59, 59, 999);

      const statementMonth = `${year}-${String(month).padStart(2, '0')}`;

      const statementExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.expense_date);
        const isCardMatch = 
          (exp.payment_method_id && exp.payment_method_id === cardId) ||
          (exp.payment_method && exp.payment_method.toLowerCase() === cardNameLower);
        const isDateMatch = expDate >= startDate && expDate <= endDate;
        return isCardMatch && isDateMatch;
      });

      const totalSpent = statementExpenses.reduce((sum, exp) => sum + exp.expense, 0);

      const statementPayments = payments.filter(pay => {
        const isCardMatch = 
          (pay.payment_method_id && pay.payment_method_id === cardId) ||
          (pay.payment_method_id && pay.payment_method_id.toLowerCase() === cardNameLower);
        return isCardMatch && pay.statement_month === statementMonth;
      });

      const totalPaid = statementPayments.reduce((sum, pay) => sum + pay.amount_paid, 0);
      const remainingBalance = Math.max(0, totalSpent - totalPaid);

      const dateToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const timeDiff = dateDue.getTime() - dateToday.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let status: 'paid' | 'unpaid' | 'due_soon' | 'overdue' = 'unpaid';
      if (remainingBalance <= 0.01) {
        status = 'paid';
      } else if (daysRemaining < 0) {
        status = 'overdue';
      } else if (daysRemaining <= 5) {
        status = 'due_soon';
      } else {
        status = 'unpaid';
      }

      statements.push({
        statementMonth,
        startDate,
        endDate,
        dueDate,
        totalSpent,
        totalPaid,
        remainingBalance,
        status,
        daysRemaining,
        expenses: statementExpenses
      });
    }

    return statements.sort((a, b) => b.statementMonth.localeCompare(a.statementMonth));
  }, [expenses, payments]);

  const activeCardPayments = payments.filter(pay => {
    const isCardMatch = 
      (pay.payment_method_id && pay.payment_method_id === activeCard?.id) ||
      (pay.payment_method_id && pay.payment_method_id.toLowerCase() === activeCard?.name.toLowerCase());
    return isCardMatch;
  }).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const openPaymentModal = (statement: CardStatement) => {
    setSelectedStatementMonth(statement.statementMonth);
    setPaymentAmount(statement.remainingBalance.toFixed(2));
    
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setPaymentDate(formattedDate);
    
    setPaymentError('');
    setPaymentModalVisible(true);
  };

  const handleLogPayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }
    if (!paymentDate.trim()) {
      setPaymentError('Please enter a payment date.');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');

    try {
      const payload = {
        payment_method_id: activeCard.id || activeCard.name,
        statement_month: selectedStatementMonth,
        payment_date: `${paymentDate} 12:00:00`,
        amount_paid: parseFloat(paymentAmount)
      };

      await apiService.createCreditCardPayment(payload);
      
      setPaymentModalVisible(false);
      setLoading(true);
      await fetchData();
      Alert.alert('Success', 'Card statement payment logged successfully!');
    } catch (err: any) {
      console.error(err);
      setPaymentError(extractErrorMessage(err));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert(
      'Delete Payment Log',
      'Are you sure you want to delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteCreditCardPayment(id);
              setLoading(true);
              await fetchData();
            } catch (err) {
              console.error('Failed to delete payment record:', err);
              Alert.alert('Error', 'Failed to delete payment record.');
            }
          }
        }
      ]
    );
  };

  const toggleStatementExpanded = (month: string) => {
    setExpandedStatements(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRawDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return {
    profile,
    expenses,
    payments,
    loading,
    refreshing,
    onRefresh,
    creditCards,
    activeCardId,
    setActiveCardId,
    activeCard,
    activeCardPayments,
    getStatementsForCard,
    expandedStatements,
    toggleStatementExpanded,
    paymentModalVisible,
    setPaymentModalVisible,
    selectedStatementMonth,
    paymentAmount,
    setPaymentAmount,
    paymentDate,
    setPaymentDate,
    submittingPayment,
    paymentError,
    openPaymentModal,
    handleLogPayment,
    handleDeletePayment,
    formatDate,
    formatRawDate,
  };
};
