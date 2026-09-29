import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, Shadows } from '../../constants/theme';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  LogOut, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getStyles } from '../../styles/index.styles';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/currency';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors);
  
  const {
    profile,
    balance,
    netCashFlow,
    forecastedFlow,
    creditDebtDueThisMonth,
    realizedOutflows,
    unpaidCreditDebt,
    totalSpentWithCredit,
    recentExpenses,
    loading,
    refreshing,
    profileMissing,
    onRefresh,
    handleLogout,
    formatDate,
  } = useDashboard();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.user_name || user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            style={[styles.iconButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}
          >
            <LogOut size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Profile Missing Warning Banner */}
        {profileMissing && (
          <View style={[styles.warningBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <AlertCircle size={22} color={colors.primary} />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>Profile Setup Required</Text>
              <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>
                Complete your profile configuration to start logging transactions properly.
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.warningButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.warningButtonText}>Set Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Card Total Cash Flow / Balance */}
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : [colors.primary, '#4F46E5']}
          style={[styles.mainCard, Shadows.md]}
        >
          <View style={styles.mainCardHeader}>
            <Text style={styles.mainCardLabel}>Net Cash Flow (This Month)</Text>
            {netCashFlow >= 0 ? (
              <TrendingUp size={22} color="#10B981" />
            ) : (
              <TrendingDown size={22} color="#F43F5E" />
            )}
          </View>
          <Text 
            style={styles.mainCardBalance}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(netCashFlow, profile?.currency)}
          </Text>

          {/* Forecasted Flow (Just below Net Cash Flow) */}
          <View style={styles.forecastedContainer}>
            <View style={styles.forecastedRow}>
              <View style={styles.forecastedLabelRow}>
                <View style={[styles.forecastedIconBadge, { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255, 255, 255, 0.2)' }]}>
                  <Sparkles size={13} color={isDark ? '#C4B5FD' : '#FFF'} />
                </View>
                <Text style={styles.forecastedLabel}>Forecasted Flow</Text>
              </View>
              <Text 
                style={[
                  styles.forecastedAmount,
                  { color: forecastedFlow >= 0 ? '#6EE7B7' : '#FDA4AF' }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(forecastedFlow, profile?.currency)}
              </Text>
            </View>

            <Text style={styles.forecastedSubtext}>
              {creditDebtDueThisMonth > 0 
                ? `Includes -${formatCurrency(creditDebtDueThisMonth, profile?.currency)} CC debt due this month` 
                : 'Income − (Outcome + Debt due this month)'}
            </Text>
          </View>

          <View style={styles.mainCardFooter}>
            <Text style={styles.mainCardFootnote}>
              Monthly Income: {formatCurrency(profile?.monthly_income || 0, profile?.currency)}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Income Stat */}
          <View style={[styles.statBox, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <TrendingUp size={18} color={colors.success} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Inflows</Text>
            <Text 
              style={[styles.statAmount, { color: colors.success }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(balance.total_income, profile?.currency)}
            </Text>
          </View>

          {/* Expenses Stat */}
          <View style={[styles.statBox, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
              <TrendingDown size={18} color={colors.danger} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Outflows</Text>
            <Text 
              style={[styles.statAmount, { color: colors.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(realizedOutflows, profile?.currency)}
            </Text>
          </View>
        </View>

        {/* Total Committed Spending Card (Adding Credit Card Debt) */}
        <TouchableOpacity 
          style={[styles.creditDebtCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }, Shadows.sm]}
          onPress={() => router.push('/(tabs)/credit_cards')}
          activeOpacity={0.8}
        >
          {/* Header Row */}
          <View style={styles.creditDebtHeader}>
            <View style={styles.creditDebtHeaderLeft}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(234, 88, 12, 0.12)', marginBottom: 0 }]}>
                <CreditCard size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.creditDebtTitle, { color: colors.text }]}>Total Spent (incl. CC Debt)</Text>
                <Text style={[styles.creditDebtSubtitle, { color: colors.textSecondary }]}>
                  Committed outflows + unpaid credit debt
                </Text>
              </View>
            </View>
            <View style={[styles.creditDebtBadge, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.1)' }]}>
              <Text style={[styles.creditDebtBadgeText, { color: '#EA580C' }]}>Cards</Text>
              <ChevronRight size={13} color="#EA580C" />
            </View>
          </View>

          {/* Vertical Main Amount Display (Full width, avoids crowding) */}
          <View style={styles.creditDebtAmountContainer}>
            <Text style={[styles.creditDebtAmountLabel, { color: colors.textMuted }]}>
              Total Committed Outflows
            </Text>
            <Text 
              style={[styles.creditDebtTotalAmount, { color: colors.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(totalSpentWithCredit, profile?.currency)}
            </Text>
          </View>

          <View style={[styles.creditDebtDivider, { backgroundColor: colors.border }]} />

          {/* Vertical Breakdown Rows: Each item gets its own full-width line */}
          <View style={styles.creditDebtBreakdownList}>
            <View style={styles.creditDebtBreakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Realized Outflows (Paid):</Text>
              </View>
              <Text 
                style={[styles.breakdownValue, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(realizedOutflows, profile?.currency)}
              </Text>
            </View>

            <View style={styles.creditDebtBreakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <View style={[styles.breakdownDot, { backgroundColor: '#EA580C' }]} />
                <Text style={[styles.breakdownLabel, { color: '#EA580C', fontWeight: '600' }]}>Unpaid CC Debt:</Text>
              </View>
              <Text 
                style={[styles.breakdownValue, { color: '#EA580C' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                +{formatCurrency(unpaidCreditDebt, profile?.currency)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Button Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: colors.primary }, Shadows.sm]}
            onPress={() => router.push('/(tabs)/expenses')}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.quickAddText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
            <Text style={[styles.seeAllLink, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.transactionCardList, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CreditCard size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses logged yet</Text>
            </View>
          ) : (
            recentExpenses.map((item) => (
              <View 
                key={item.id} 
                style={[styles.transactionItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.txName, { color: colors.text }]} numberOfLines={1}>
                  {item.expense_description || item.expense_type}
                </Text>
                
                <Text 
                  style={[styles.txAmountLarge, { color: item.expense < 0 ? colors.success : colors.danger }]}
                >
                  {item.expense < 0 ? '+' : '-'}{formatCurrency(Math.abs(item.expense), profile?.currency)}
                </Text>
                
                <View style={styles.txMetaRow}>
                  <View style={[styles.txIconContainer, { backgroundColor: item.expense < 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    {item.expense < 0 ? (
                      <ArrowDownRight size={12} color={colors.success} />
                    ) : (
                      <ArrowUpRight size={12} color={colors.danger} />
                    )}
                  </View>
                  <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                    {formatDate(item.expense_date)} • {item.payment_method}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
