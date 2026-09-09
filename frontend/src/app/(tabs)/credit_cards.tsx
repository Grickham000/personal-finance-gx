import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Shadows } from '../../constants/theme';
import { 
  CreditCard as CardIcon, 
  Calendar, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Palette,
  Bell
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getStyles } from '../../styles/credit_cards.styles';
import { useCreditCards } from '../../hooks/useCreditCards';
import { formatCurrency } from '../../utils/currency';
import { DatePickerModal } from '../../components/DatePickerModal';
import { CardAlarmModal } from '../../components/CardAlarmModal';
import { CardAlarmConfig, getCardAlarms, getNextAlarmDate } from '../../services/alarmService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 291;
const cardSpacing = 16; // Spacing.md

const CARD_PALETTES = [
  { id: 'indigo', name: 'Indigo Night', colors: ['#1E1B4B', '#312E81', '#4F46E5'] },
  { id: 'emerald', name: 'Emerald Forest', colors: ['#064E3B', '#065F46', '#10B981'] },
  { id: 'pink', name: 'Rose Petal', colors: ['#500724', '#831843', '#DB2777'] },
  { id: 'amber', name: 'Amber Sunset', colors: ['#78350F', '#92400E', '#D97706'] },
  { id: 'cyan', name: 'Ocean Breeze', colors: ['#083344', '#155E75', '#06B6D4'] },
  { id: 'slate', name: 'Dark Slate', colors: ['#0F172A', '#1E293B', '#475569'] },
  { id: 'purple', name: 'Royal Violet', colors: ['#3B0764', '#581C87', '#7C3AED'] },
];

export default function CreditCardsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [paymentDatePickerVisible, setPaymentDatePickerVisible] = React.useState(false);

  const {
    profile,
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
  } = useCreditCards();

  const { user } = useAuth();
  const [cardColors, setCardColors] = React.useState<Record<string, string>>({});
  const scrollRef = React.useRef<ScrollView>(null);
  const [personalizeModalVisible, setPersonalizeModalVisible] = React.useState(false);
  const [personalizingCardId, setPersonalizingCardId] = React.useState<string | null>(null);

  const [cardAlarms, setCardAlarms] = React.useState<Record<string, CardAlarmConfig>>({});
  const [alarmModalVisible, setAlarmModalVisible] = React.useState(false);
  const [alarmModalCard, setAlarmModalCard] = React.useState<any>(null);

  const openAlarmModal = (card: any) => {
    setAlarmModalCard(card);
    setAlarmModalVisible(true);
  };

  const handleAlarmSaved = (updatedConfig: CardAlarmConfig | null) => {
    if (!alarmModalCard) return;
    const cardId = alarmModalCard.id || alarmModalCard.name;
    setCardAlarms((prev) => {
      const next = { ...prev };
      if (updatedConfig) {
        next[cardId] = updatedConfig;
      } else {
        delete next[cardId];
      }
      return next;
    });
  };

  const openPersonalizeModal = (cardId: string) => {
    setPersonalizingCardId(cardId);
    setPersonalizeModalVisible(true);
  };

  React.useEffect(() => {
    const loadCardColors = async () => {
      try {
        const storedColors = await AsyncStorage.getItem(`card_colors_${user?.uid}`);
        if (storedColors) {
          setCardColors(JSON.parse(storedColors));
        }
      } catch (err) {
        console.error('Failed to load card colors:', err);
      }
    };
    if (user?.uid) {
      loadCardColors();
    }
  }, [user?.uid]);

  React.useEffect(() => {
    const loadAlarms = async () => {
      try {
        const alarms = await getCardAlarms(user?.uid);
        setCardAlarms(alarms);
      } catch (err) {
        console.error('Failed to load card alarms:', err);
      }
    };
    if (user?.uid) {
      loadAlarms();
    }
  }, [user?.uid, refreshing]);

  const handleSelectPalette = async (paletteId: string, cardId?: string) => {
    const targetCardId = cardId || activeCardId;
    if (!targetCardId) return;
    const newColors = {
      ...cardColors,
      [targetCardId]: paletteId,
    };
    setCardColors(newColors);
    try {
      await AsyncStorage.setItem(`card_colors_${user?.uid}`, JSON.stringify(newColors));
    } catch (err) {
      console.error('Failed to save card colors:', err);
    }
  };

  const getCardGradient = (cardId: string, index: number): readonly [string, string, ...string[]] => {
    const paletteId = cardColors[cardId];
    const palette = CARD_PALETTES.find(p => p.id === paletteId) || CARD_PALETTES[index % CARD_PALETTES.length];
    return palette.colors as any;
  };

  // Scroll to active card when activeCardId changes (if triggered by click, etc.)
  React.useEffect(() => {
    if (activeCardId && creditCards.length > 0) {
      const index = creditCards.findIndex((c: any) => (c.id || c.name) === activeCardId);
      if (index !== -1 && scrollRef.current) {
        scrollRef.current.scrollTo({
          x: index * (cardWidth + cardSpacing),
          animated: true,
        });
      }
    }
  }, [activeCardId, creditCards.length]);

  const statements = getStatementsForCard(activeCard);
  const activeCardIndex = creditCards.findIndex((c: any) => (c.id || c.name) === activeCardId);
  const activeCardGradient = getCardGradient(activeCardId || '', activeCardIndex !== -1 ? activeCardIndex : 0);
  const activeCardAccentColor = activeCardGradient[activeCardGradient.length - 1];

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <ScrollView 
          ref={scrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.cardsSliderContent,
            { 
              paddingHorizontal: (screenWidth - cardWidth) / 2,
              gap: cardSpacing
            }
          ]}
          snapToInterval={cardWidth + cardSpacing}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (cardWidth + cardSpacing));
            if (index >= 0 && index < creditCards.length) {
              const card = creditCards[index];
              setActiveCardId(card.id || card.name);
            }
          }}
        >
          {creditCards.map((card: any, idx: number) => {
            const isActive = (card.id || card.name) === activeCardId;
            const cardStatements = getStatementsForCard(card);
            const unpaidStmts = cardStatements.filter(s => s.remainingBalance > 0);
            const isAllPaid = unpaidStmts.length === 0;
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
                  colors={getCardGradient(card.id || card.name, idx)}
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
                        : `Unpaid: ${formatCurrency(urgentUnpaid.remainingBalance, profile?.currency)} (Due ${urgentUnpaid.dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})`
                      }
                    </Text>
                  </View>

                  <View style={styles.cardActionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.cardActionButton,
                        cardAlarms[card.id || card.name]?.enabled && styles.cardActionButtonActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openAlarmModal(card);
                      }}
                    >
                      <Bell size={15} color="#FFF" />
                      {cardAlarms[card.id || card.name]?.enabled && (
                        <View style={styles.alarmActiveDot} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openPersonalizeModal(card.id || card.name);
                      }}
                    >
                      <Palette size={15} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.bodyContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Statements</Text>
            <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>
              Cut: Day {activeCard?.cut_date} • Due +{activeCard?.days_to_pay}d
            </Text>
          </View>

          {(() => {
            const activeCardAlarm = cardAlarms[activeCard?.id || activeCard?.name];
            if (!activeCardAlarm?.enabled) return null;
            const nextAlarm = getNextAlarmDate(
              activeCard,
              activeCardAlarm.triggerType,
              activeCardAlarm.notifyHour,
              activeCardAlarm.notifyMinute
            );
            const triggerLabel =
              activeCardAlarm.triggerType === 'cutoff'
                ? 'Cutoff Date'
                : 'Last Day to Pay (Due Date)';
            const formattedDate = nextAlarm.date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const period = activeCardAlarm.notifyHour >= 12 ? 'PM' : 'AM';
            const displayHour =
              activeCardAlarm.notifyHour % 12 === 0
                ? 12
                : activeCardAlarm.notifyHour % 12;
            const formattedTime = `${displayHour}:00 ${period}`;

            return (
              <View
                style={[
                  styles.alarmBanner,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  Shadows.sm,
                ]}
              >
                <View
                  style={[
                    styles.alarmBannerIconBox,
                    { backgroundColor: 'rgba(32, 138, 239, 0.15)' },
                  ]}
                >
                  <Bell size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alarmBannerTitle, { color: colors.text }]}>
                    Alarm Set: {triggerLabel} ({formattedTime})
                  </Text>
                  <Text style={[styles.alarmBannerSubtitle, { color: colors.textSecondary }]}>
                    Next: {formattedDate}
                    {nextAlarm.wasAdjusted ? ' • Business day adjusted (Friday)' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.alarmBannerEditBtn,
                    { backgroundColor: colors.primaryLight || 'rgba(32, 138, 239, 0.15)' },
                  ]}
                  onPress={() => openAlarmModal(activeCard)}
                >
                  <Text style={[styles.alarmBannerEditText, { color: colors.primary }]}>
                    Configure
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}


        {statements.map((stmt) => {
          const isExpanded = !!expandedStatements[stmt.statementMonth];
          
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
            badgeText = '#F59E0B';
            badgeIcon = <AlertTriangle size={12} color={badgeText} />;
          }

          return (
            <View 
              key={stmt.statementMonth} 
              style={[
                styles.statementBox, 
                { 
                  backgroundColor: colors.card, 
                  borderColor: activeCardAccentColor,
                  borderWidth: 1.5
                },
                Shadows.sm
              ]}
            >
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

              <View style={[styles.stmtVerticalDetails, { borderColor: colors.border }]}>
                <View style={styles.stmtDetailRow}>
                  <Text style={[styles.stmtDetailLabel, { color: colors.textMuted }]}>Statement Balance</Text>
                  <Text style={[styles.stmtDetailValue, { color: colors.text }]}>
                    {formatCurrency(stmt.totalSpent, profile?.currency)}
                  </Text>
                </View>
                
                <View style={[styles.stmtDetailRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.stmtDetailLabel, { color: colors.textMuted }]}>Amount Paid</Text>
                  <Text style={[styles.stmtDetailValue, { color: colors.success }]}>
                    {formatCurrency(stmt.totalPaid, profile?.currency)}
                  </Text>
                </View>
                
                <View style={[styles.stmtDetailRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.stmtDetailLabel, { color: colors.textMuted }]}>Remaining Balance</Text>
                  <Text style={[styles.stmtDetailValue, { color: stmt.remainingBalance > 0 ? colors.danger : colors.text }]}>
                    {formatCurrency(stmt.remainingBalance, profile?.currency)}
                  </Text>
                </View>
              </View>

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

              {isExpanded && stmt.expenses.length > 0 && (
                <View style={[styles.expensesCollapseContainer, { borderTopColor: colors.border }]}>
                  {stmt.expenses.map((exp) => (
                    <View key={exp.id} style={styles.expenseCollapseItem}>
                      <Text style={[styles.expItemDesc, { color: colors.text }]} numberOfLines={1}>
                        {exp.expense_description}
                      </Text>
                      
                      <Text 
                        style={[styles.expItemAmountLarge, { color: exp.expense < 0 ? colors.success : colors.text }]}
                      >
                        {exp.expense < 0 ? '+' : '-'}{formatCurrency(Math.abs(exp.expense), profile?.currency)}
                      </Text>
                      
                      <View style={styles.expItemMetaRow}>
                        {exp.expense < 0 ? (
                          <ArrowDownRight size={12} color={colors.success} />
                        ) : (
                          <ArrowUpRight size={12} color={colors.danger} />
                        )}
                        <Text style={[styles.expItemDate, { color: colors.textSecondary }]}>
                          {formatRawDate(exp.expense_date)} • {exp.expense_type}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Log</Text>
          <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>Historical Settlements</Text>
        </View>

        <View style={[styles.paymentsCardLog, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
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
                    +{formatCurrency(pay.amount_paid, profile?.currency)}
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
      </View>
    </ScrollView>

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
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount Paid ({profile?.currency || 'USD'})</Text>
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

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Date (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  style={[styles.formInput, { borderColor: colors.border, justifyContent: 'center' }]}
                  onPress={() => setPaymentDatePickerVisible(true)}
                >
                  <Text style={{ color: paymentDate ? colors.text : colors.textMuted, fontSize: 15 }}>
                    {paymentDate || "YYYY-MM-DD"}
                  </Text>
                </TouchableOpacity>
              </View>

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

      <DatePickerModal
        visible={paymentDatePickerVisible}
        onClose={() => setPaymentDatePickerVisible(false)}
        onSelectDate={setPaymentDate}
        selectedDate={paymentDate}
        colors={colors}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={personalizeModalVisible}
        onRequestClose={() => setPersonalizeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Personalize Card</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Select a gradient theme for this card
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPersonalizeModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              {/* Live Preview Card */}
              {(() => {
                const personalizingCard = creditCards.find(
                  (c: any) => (c.id || c.name) === personalizingCardId
                );
                if (!personalizingCard) return null;
                const idx = creditCards.indexOf(personalizingCard);
                return (
                  <View style={styles.modalPreviewContainer}>
                    <LinearGradient
                      colors={getCardGradient(personalizingCardId || '', idx)}
                      start={{ x: 0.1, y: 0.1 }}
                      end={{ x: 0.9, y: 0.9 }}
                      style={styles.modalVirtualCard}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIconBox}>
                          <CardIcon size={18} color="#FFF" />
                        </View>
                        <Text style={styles.cardLogo}>PREVIEW</Text>
                      </View>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {personalizingCard.name}
                      </Text>
                      <View style={styles.cardMetadata}>
                        <View>
                          <Text style={styles.cardMetaLabel}>STATEMENT CUT</Text>
                          <Text style={styles.cardMetaValue}>Day {personalizingCard.cut_date}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.cardMetaLabel}>DAYS TO PAY</Text>
                          <Text style={styles.cardMetaValue}>{personalizingCard.days_to_pay} Days</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })()}

              {/* Scrollable list of gradients */}
              <ScrollView style={styles.modalPaletteList} contentContainerStyle={styles.modalPaletteListContent}>
                {CARD_PALETTES.map((palette) => {
                  const cardColorsMap = cardColors || {};
                  const currentPaletteId = cardColorsMap[personalizingCardId || ''] || 
                    CARD_PALETTES[creditCards.findIndex((c: any) => (c.id || c.name) === personalizingCardId) % CARD_PALETTES.length]?.id;
                  const isSelected = currentPaletteId === palette.id;

                  return (
                    <TouchableOpacity
                      key={palette.id}
                      activeOpacity={0.7}
                      style={[
                        styles.modalPaletteRow,
                        { 
                          backgroundColor: colors.background,
                          borderColor: isSelected ? colors.primary : colors.border
                        }
                      ]}
                      onPress={() => handleSelectPalette(palette.id, personalizingCardId || undefined)}
                    >
                      <LinearGradient
                        colors={palette.colors as any}
                        start={{ x: 0.1, y: 0.1 }}
                        end={{ x: 0.9, y: 0.9 }}
                        style={styles.modalPaletteColorPreview}
                      />
                      <View style={styles.modalPaletteTextContainer}>
                        <Text style={[styles.modalPaletteName, { color: colors.text }]}>{palette.name}</Text>
                        <Text style={[styles.modalPaletteColorsText, { color: colors.textSecondary }]}>
                          {palette.colors.join(' → ')}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.modalSelectionIndicator, { backgroundColor: colors.primary }]}>
                          <CheckCircle2 size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity 
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={() => setPersonalizeModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {alarmModalCard && (
        <CardAlarmModal
          key={`${alarmModalCard.id || alarmModalCard.name}_${alarmModalVisible}`}
          visible={alarmModalVisible}
          onClose={() => setAlarmModalVisible(false)}
          card={alarmModalCard}
          userId={user?.uid}
          initialConfig={
            cardAlarms[alarmModalCard.id || alarmModalCard.name]
          }
          onAlarmSaved={handleAlarmSaved}
          colors={colors}
        />
      )}
    </View>
  );
}
