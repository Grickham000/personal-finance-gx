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
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Shadows } from '../../constants/theme';
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
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getStyles } from '../../styles/credit_cards.styles';
import { useCreditCards } from '../../hooks/useCreditCards';
import { formatCurrency } from '../../utils/currency';
import { DatePickerModal } from '../../components/DatePickerModal';

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

  const handleSelectPalette = async (paletteId: string) => {
    if (!activeCardId) return;
    const newColors = {
      ...cardColors,
      [activeCardId]: paletteId,
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
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Card Personalization */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Card Personalization</Text>
          <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>Select a gradient style</Text>
        </View>

        <View style={[styles.personalizeContainer, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
            {CARD_PALETTES.map((palette) => {
              const cardColorsMap = cardColors || {};
              const currentPaletteId = cardColorsMap[activeCardId || ''] || CARD_PALETTES[creditCards.findIndex((c: any) => (c.id || c.name) === activeCardId) % CARD_PALETTES.length]?.id;
              const isSelected = currentPaletteId === palette.id;
              return (
                <TouchableOpacity
                  key={palette.id}
                  activeOpacity={0.7}
                  style={[
                    styles.paletteOption,
                    { borderColor: isSelected ? colors.primary : colors.border }
                  ]}
                  onPress={() => handleSelectPalette(palette.id)}
                >
                  <LinearGradient
                    colors={palette.colors as any}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 0.9, y: 0.9 }}
                    style={styles.paletteColorPreview}
                  />
                  <Text style={[styles.paletteName, { color: colors.text }]}>{palette.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Statements</Text>
          <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>
            Cut: Day {activeCard?.cut_date} • Due +{activeCard?.days_to_pay}d
          </Text>
        </View>

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
                { backgroundColor: colors.card, borderColor: colors.border },
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
                        <ArrowDownRight size={12} color={colors.danger} />
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
    </View>
  );
}
