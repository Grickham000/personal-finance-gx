import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/theme';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  LogOut, 
  ArrowUpRight, 
  CreditCard,
  AlertCircle
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
            <TrendingUp size={22} color="#10B981" />
          </View>
          <Text style={styles.mainCardBalance}>
            {formatCurrency(balance.cash_flow, profile?.currency)}
          </Text>
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
            <Text style={[styles.statAmount, { color: colors.success }]}>
              {formatCurrency(balance.total_income, profile?.currency)}
            </Text>
          </View>

          {/* Expenses Stat */}
          <View style={[styles.statBox, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
              <TrendingDown size={18} color={colors.danger} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Outflows</Text>
            <Text style={[styles.statAmount, { color: colors.danger }]}>
              {formatCurrency(balance.total_expenses, profile?.currency)}
            </Text>
          </View>
        </View>

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
                <View style={styles.txLeft}>
                  <View style={[styles.txIconContainer, { backgroundColor: colors.primaryLight }]}>
                    <ArrowUpRight size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.txName, { color: colors.text }]} numberOfLines={1}>
                      {item.expense_description || item.expense_type}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                      {formatDate(item.expense_date)} • {item.payment_method}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: colors.danger }]}>
                  -{formatCurrency(item.expense, profile?.currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
