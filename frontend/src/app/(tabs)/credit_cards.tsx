import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Spacing, Shadows } from '../../constants/theme';
import { 
  CreditCard as CardIcon, 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardStatement {
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

export default function CreditCardsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

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
      // Fetch profile, expenses, and payments in parallel
      const [profileData, expensesData, paymentsData] = await Promise.all([
        apiService.getUserProfile().catch(() => null),
        apiService.getExpenses().catch(() => []),
        apiService.getCreditCardPayments().catch(() => [])
      ]);

      setProfile(profileData);
      setExpenses(expensesData || []);
      setPayments(paymentsData || []);

      // Extract credit cards (is_immediate === false)
      const creditCards = (profileData?.payment_methods || []).filter((pm: any) => !pm.is_immediate);
      if (creditCards.length > 0 && !activeCardId) {
        // Default to first card if no active card selected
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

  // Extract credit cards from profile
  const creditCards = (profile?.payment_methods || []).filter((pm: any) => !pm.is_immediate);
  
  // Find current active credit card
  const activeCard = creditCards.find((c: any) => (c.id || c.name) === activeCardId) || creditCards[0];

  // Helper to calculate statements for a card
  const getStatementsForCard = (card: any): CardStatement[] => {
    if (!card) return [];
    
    const cutDateDay = card.cut_date || 1;
    const daysToPay = card.days_to_pay || 0;
    const cardId = card.id;
    const cardNameLower = card.name.toLowerCase();

    const statements: CardStatement[] = [];
    const today = new Date();

    // Generate statements for the last 5 months and the next month (unbilled active expenses)
    for (let i = -4; i <= 1; i++) {
      const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth() + 1; // 1-indexed

      // Calculate end date (cutoff date of target month)
      const lastDayOfCutoffMonth = new Date(year, month, 0).getDate();
      const cutoffDay = Math.min(cutDateDay, lastDayOfCutoffMonth);
      const endDate = new Date(year, month - 1, cutoffDay, 23, 59, 59, 999);

      // Calculate start date (day after previous month's cutoff date)
      const prevMonthDate = new Date(year, month - 2, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth() + 1;
      const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      const prevCutoffDay = Math.min(cutDateDay, lastDayOfPrevMonth);
      const startDate = new Date(prevYear, prevMonth - 1, prevCutoffDay + 1, 0, 0, 0, 0);

      // Calculate due date (endDate + daysToPay)
      const dueDate = new Date(endDate.getTime());
      dueDate.setDate(dueDate.getDate() + daysToPay);
      dueDate.setHours(23, 59, 59, 999);

      const statementMonth = `${year}-${String(month).padStart(2, '0')}`;

      // Filter expenses belonging to this card and period
      const statementExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.expense_date);
        const isCardMatch = 
          (exp.payment_method_id && exp.payment_method_id === cardId) ||
          (exp.payment_method && exp.payment_method.toLowerCase() === cardNameLower);
        const isDateMatch = expDate >= startDate && expDate <= endDate;
        return isCardMatch && isDateMatch;
      });

      const totalSpent = statementExpenses.reduce((sum, exp) => sum + exp.expense, 0);

      // Filter payments belonging to this card and statement month
      const statementPayments = payments.filter(pay => {
        const isCardMatch = 
          (pay.payment_method_id && pay.payment_method_id === cardId) ||
          (pay.payment_method_id && pay.payment_method_id.toLowerCase() === cardNameLower);
        return isCardMatch && pay.statement_month === statementMonth;
      });

      const totalPaid = statementPayments.reduce((sum, pay) => sum + pay.amount_paid, 0);
      const remainingBalance = Math.max(0, totalSpent - totalPaid);

      // Calculate days remaining
      // Compare only the dates (ignoring time details)
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

    // Sort statements descending (newest first)
    return statements.sort((a, b) => b.statementMonth.localeCompare(a.statementMonth));
  };

  const statements = getStatementsForCard(activeCard);

  // Filter payments list for payment history log of active card
  const activeCardPayments = payments.filter(pay => {
    const isCardMatch = 
      (pay.payment_method_id && pay.payment_method_id === activeCard?.id) ||
      (pay.payment_method_id && pay.payment_method_id.toLowerCase() === activeCard?.name.toLowerCase());
    return isCardMatch;
  }).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  // Handle open log payment modal
  const openPaymentModal = (statement: CardStatement) => {
    setSelectedStatementMonth(statement.statementMonth);
    setPaymentAmount(statement.remainingBalance.toFixed(2));
    
    // Format today as YYYY-MM-DD
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setPaymentDate(formattedDate);
    
    setPaymentError('');
    setPaymentModalVisible(true);
  };

  // Submit payment log to backend
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
        payment_date: `${paymentDate} 12:00:00`, // Standard date format for backend
        amount_paid: parseFloat(paymentAmount)
      };

      await apiService.createCreditCardPayment(payload);
      
      setPaymentModalVisible(false);
      setLoading(true);
      await fetchData();
      Alert.alert('Success', 'Card statement payment logged successfully!');
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data || err.message || 'Failed to save card payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete payment record
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRawDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render loading screen
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render empty setup state if no credit cards
  if (creditCards.length === 0) {
    return (
      <View style={[styles.emptySetupContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptySetupIcon, { backgroundColor: colors.primaryLight }]}>
          <CardIcon size={44} color={colors.primary} />
        </View>
        <Text style={[styles.emptySetupTitle, { color: colors.text }]}>No Credit Cards Found</Text>
        <Text style={[styles.emptySetupSub, { color: colors.textSecondary }]}>
          Configure your credit cards (payment methods where immediate is set to False) in your profile settings.
        </Text>
        <TouchableOpacity
          style={[styles.setupButton, { backgroundColor: colors.primary }, Shadows.sm]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Sparkles size={16} color="#FFF" />
          <Text style={styles.setupButtonText}>Configure in Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Select card background gradient based on card name/index
  const getCardGradient = (index: number): readonly [string, string, ...string[]] => {
    const gradients: readonly [string, string, ...string[]][] = [
      ['#1E1B4B', '#312E81', '#4F46E5'], // Deep Blue
      ['#064E3B', '#065F46', '#10B981'], // Emerald Green
      ['#500724', '#831843', '#DB2777'], // Crimson Pink
      ['#78350F', '#92400E', '#D97706'], // Warm Amber
    ];
    return gradients[index % gradients.length];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Credit Cards</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Statement Tracker</Text>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Horizontal Cards Slider */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsSliderContent}
          snapToInterval={296 + Spacing.md}
          decelerationRate="fast"
        >
          {creditCards.map((card: any, idx: number) => {
            const isActive = (card.id || card.name) === activeCardId;
            const cardStatements = getStatementsForCard(card);
            // Check if there are unpaid statements
            const unpaidStmts = cardStatements.filter(s => s.remainingBalance > 0);
            const isAllPaid = unpaidStmts.length === 0;
            const latestUnpaid = unpaidStmts[0]; // Sorted newest first, so oldest unpaid would be last. Wait, we want closest due date.
            const urgentUnpaid = unpaidStmts.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

            return (
              <TouchableOpacity
                key={card.id || card.name}
                activeOpacity={0.9}
                onPress={() => setActiveCardId(card.id || card.name)}
                style={[
                  styles.cardWrapper,
                  isActive && { transform: [{ scale: 1.02 }] },
                  Shadows.md
                ]}
              >
                <LinearGradient
                  colors={getCardGradient(idx)}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                  style={[
                    styles.virtualCard,
                    isActive && { borderColor: '#FFF', borderWidth: 1 }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconBox}>
                      <CardIcon size={20} color="#FFF" />
                    </View>
                    <Text style={styles.cardLogo}>WALLET</Text>
                  </View>

                  <Text style={styles.cardName} numberOfLines={1}>
                    {card.name}
                  </Text>

                  <View style={styles.cardMetadata}>
                    <View>
                      <Text style={styles.cardMetaLabel}>STATEMENT CUT</Text>
                      <Text style={styles.cardMetaValue}>Day {card.cut_date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardMetaLabel}>DAYS TO PAY</Text>
                      <Text style={styles.cardMetaValue}>{card.days_to_pay} Days</Text>
                    </View>
                  </View>

                  {/* Card Status Indicator */}
                  <View style={[
                    styles.cardStatusBadge,
                    { backgroundColor: isAllPaid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)' }
                  ]}>
                    <View style={[
                      styles.statusIndicatorDot,
                      { backgroundColor: isAllPaid ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={styles.cardStatusText}>
                      {isAllPaid 
                        ? 'All Paid' 
                        : `Unpaid: ${formatCurrency(urgentUnpaid.remainingBalance)} (Due ${urgentUnpaid.dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})`
                      }
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Card Billing Statements List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Statements</Text>
          <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>
            Cut: Day {activeCard?.cut_date} • Due +{activeCard?.days_to_pay}d
          </Text>
        </View>

        {statements.map((stmt) => {
          const isExpanded = !!expandedStatements[stmt.statementMonth];
          
          // Determine status color/badges
          let badgeBg = colors.border;
          let badgeText = colors.textSecondary;
          let badgeIcon = <Clock size={12} color={badgeText} />;
          
          if (stmt.status === 'paid') {
            badgeBg = 'rgba(16, 185, 129, 0.15)';
            badgeText = colors.success;
            badgeIcon = <CheckCircle2 size={12} color={badgeText} />;
          } else if (stmt.status === 'overdue') {
            badgeBg = 'rgba(239, 68, 68, 0.15)';
            badgeText = colors.danger;
            badgeIcon = <AlertTriangle size={12} color={badgeText} />;
          } else if (stmt.status === 'due_soon') {
            badgeBg = 'rgba(245, 158, 11, 0.15)';
            badgeText = '#F59E0B'; // Amber
            badgeIcon = <AlertTriangle size={12} color={badgeText} />;
          }

          return (
            <View 
              key={stmt.statementMonth} 
              style={[
                styles.statementBox, 
                { backgroundColor: colors.card, borderColor: colors.border },
                Shadows.sm
              ]}
            >
              {/* Statement Header */}
              <View style={styles.statementHeader}>
                <View>
                  <Text style={[styles.stmtMonthName, { color: colors.text }]}>
                    {stmt.startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.stmtPeriodText, { color: colors.textSecondary }]}>
                    {formatDate(stmt.startDate)} - {formatDate(stmt.endDate)}
                  </Text>
                </View>
                <View style={[styles.stmtBadge, { backgroundColor: badgeBg }]}>
                  {badgeIcon}
                  <Text style={[styles.stmtBadgeText, { color: badgeText }]}>
                    {stmt.status === 'paid' && 'Paid'}
                    {stmt.status === 'overdue' && 'Overdue'}
                    {stmt.status === 'due_soon' && `Due in ${stmt.daysRemaining}d`}
                    {stmt.status === 'unpaid' && `Unpaid (Due in ${stmt.daysRemaining}d)`}
                  </Text>
                </View>
              </View>

              {/* Statement Finance summary */}
              <View style={[styles.stmtSummaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Statement Bal</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(stmt.totalSpent)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {formatCurrency(stmt.totalPaid)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Remaining</Text>
                  <Text style={[styles.summaryValue, { color: stmt.remainingBalance > 0 ? colors.danger : colors.text }]}>
                    {formatCurrency(stmt.remainingBalance)}
                  </Text>
                </View>
              </View>

              {/* Statement Footer Actions */}
              <View style={styles.stmtFooterRow}>
                <View style={styles.stmtDueDateContainer}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={[styles.stmtDueDateText, { color: colors.textSecondary }]}>
                    Due: {formatRawDate(stmt.dueDate.toISOString())}
                  </Text>
                </View>

                <View style={styles.footerActionButtons}>
                  {stmt.remainingBalance > 0 && (
                    <TouchableOpacity 
                      style={[styles.payButton, { backgroundColor: colors.primary }]}
                      onPress={() => openPaymentModal(stmt)}
                    >
                      <Text style={styles.payButtonText}>Log Payment</Text>
                    </TouchableOpacity>
                  )}
                  {stmt.expenses.length > 0 && (
                    <TouchableOpacity 
                      style={[styles.detailsToggleButton, { borderColor: colors.border }]}
                      onPress={() => toggleStatementExpanded(stmt.statementMonth)}
                    >
                      <Text style={[styles.detailsToggleText, { color: colors.text }]}>
                        {isExpanded ? 'Hide Items' : 'View Items'}
                      </Text>
                      {isExpanded ? <ChevronUp size={14} color={colors.text} /> : <ChevronDown size={14} color={colors.text} />}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Collapsible Expense Items */}
              {isExpanded && stmt.expenses.length > 0 && (
                <View style={[styles.expensesCollapseContainer, { borderTopColor: colors.border }]}>
                  {stmt.expenses.map((exp) => (
                    <View key={exp.id} style={styles.expenseCollapseItem}>
                      <View style={styles.expItemLeft}>
                        <ArrowDownRight size={14} color={colors.danger} />
                        <View style={{ marginLeft: Spacing.sm }}>
                          <Text style={[styles.expItemDesc, { color: colors.text }]} numberOfLines={1}>
                            {exp.expense_description}
                          </Text>
                          <Text style={[styles.expItemDate, { color: colors.textSecondary }]}>
                            {formatRawDate(exp.expense_date)} • {exp.expense_type}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.expItemAmount, { color: colors.text }]}>
                        -{formatCurrency(exp.expense)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Payment History Log Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Log</Text>
          <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>Historical Settlements</Text>
        </View>

        <View style={[styles.paymentsCardLog, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }, Shadows.sm]}>
          {activeCardPayments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No payments logged for this card</Text>
            </View>
          ) : (
            activeCardPayments.map((pay) => (
              <View 
                key={pay.id} 
                style={[styles.paymentLogItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.payLogLeft}>
                  <View style={[styles.payLogIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <CheckCircle2 size={16} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.payLogAmount, { color: colors.text }]}>
                      Settle Statement: {pay.statement_month}
                    </Text>
                    <Text style={[styles.payLogDate, { color: colors.textSecondary }]}>
                      Paid: {formatRawDate(pay.payment_date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.payLogRight}>
                  <Text style={[styles.payLogAmountValue, { color: colors.success }]}>
                    +{formatCurrency(pay.amount_paid)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.deletePaymentLogButton}
                    onPress={() => handleDeletePayment(pay.id)}
                  >
                    <Trash2 size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Log Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Log Card Payment</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {activeCard?.name} • Statement {selectedStatementMonth}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {paymentError ? <Text style={styles.formError}>{paymentError}</Text> : null}

            <View style={styles.formContent}>
              {/* Payment Amount Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount Paid (USD)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  autoFocus
                />
              </View>

              {/* Payment Date Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                />
              </View>

              {/* Save Payment Button */}
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleLogPayment}
                disabled={submittingPayment}
              >
                {submittingPayment ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  cardsSliderContent: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cardWrapper: {
    width: 296,
    borderRadius: 20,
    overflow: 'hidden',
  },
  virtualCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    height: 180,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLogo: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    opacity: 0.8,
  },
  cardName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  cardMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMetaLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardMetaValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardStatusText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDetail: {
    fontSize: 11,
    fontWeight: '600',
  },
  statementBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stmtMonthName: {
    fontSize: 15,
    fontWeight: '800',
  },
  stmtPeriodText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  stmtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stmtBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stmtSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  stmtFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stmtDueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stmtDueDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerActionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  payButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsToggleButton: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expensesCollapseContainer: {
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  expenseCollapseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  expItemDesc: {
    fontSize: 13,
    fontWeight: '700',
  },
  expItemDate: {
    fontSize: 10,
    marginTop: 2,
  },
  expItemAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  paymentsCardLog: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  paymentLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  payLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payLogIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  payLogAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  payLogDate: {
    fontSize: 11,
    marginTop: 2,
  },
  payLogRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  payLogAmountValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  deletePaymentLogButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptySetupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptySetupIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptySetupTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  emptySetupSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  setupButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  formError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});
