import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { logoutUser } from '../../services/auth';
import { Spacing, Shadows } from '../../constants/theme';
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

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>({ cash_flow: 0, total_income: 0, total_expenses: 0 });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setProfileMissing(false);
      
      // 1. Fetch user profile
      let profileData = null;
      try {
        profileData = await apiService.getUserProfile();
        setProfile(profileData);
      } catch (err: any) {
        if (err.response?.status === 404 || (err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('not found'))) {
          setProfileMissing(true);
        } else {
          console.error('Error fetching profile:', err);
        }
      }

      // 2. Fetch money balance for current month
      try {
        const balanceData = await apiService.getMoneyBalance();
        setBalance(balanceData);
      } catch (err) {
        console.error('Error fetching balance:', err);
      }

      // 3. Fetch recent expenses
      try {
        const expensesData = await apiService.getExpenses();
        // Take the top 5 most recent expenses
        const sorted = (expensesData || []).sort(
          (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
        );
        setRecentExpenses(sorted.slice(0, 5));
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }

    } catch (err) {
      console.error('General error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
            {formatCurrency(balance.cash_flow)}
          </Text>
          <View style={styles.mainCardFooter}>
            <Text style={styles.mainCardFootnote}>
              Monthly Income: {formatCurrency(profile?.monthly_income || 0)}
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
              {formatCurrency(balance.total_income)}
            </Text>
          </View>

          {/* Expenses Stat */}
          <View style={[styles.statBox, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
              <TrendingDown size={18} color={colors.danger} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Outflows</Text>
            <Text style={[styles.statAmount, { color: colors.danger }]}>
              {formatCurrency(balance.total_expenses)}
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
                  -{formatCurrency(item.expense)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Platform.OS === 'android' ? Spacing.md : 0,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  warningButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainCard: {
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  mainCardBalance: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: Spacing.sm,
  },
  mainCardFooter: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: Spacing.sm,
  },
  mainCardFootnote: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.md,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionSection: {
    marginBottom: Spacing.xl,
  },
  quickAddButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: Spacing.xs,
  },
  quickAddText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCardList: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  txName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    maxWidth: 180,
  },
  txDate: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
