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
  Alert,
  Switch,
  Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Spacing, Shadows } from '../../constants/theme';
import { Plus, Trash2, X, Landmark, PiggyBank, Percent, Calendar } from 'lucide-react-native';

type SubTab = 'savings' | 'investments';

export default function InvestmentsScreen() {
  const { colors } = useTheme();

  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<SubTab>('savings');
  const [loading, setLoading] = useState(true);

  // Data states
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

  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch Savings
      const savingsData = await apiService.getSavingsAccounts();
      setSavings(savingsData || []);

      // Fetch Investments
      const investmentsData = await apiService.getInvestments();
      setInvestments(investmentsData || []);
    } catch (err) {
      console.error('Error fetching savings/investments:', err);
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
      await apiService.createSavingsAccount({
        name: savingsName.trim(),
        interest_rate: parseFloat(savingsRate),
        balance: parseFloat(savingsBalance),
        description: savingsDesc.trim()
      });
      setSavingsName('');
      setSavingsRate('');
      setSavingsBalance('');
      setSavingsDesc('');
      setSavingsModalVisible(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSavingsError(err.response?.data || err.message || 'Failed to add savings account.');
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
      await apiService.createInvestment({
        name: invName.trim(),
        interest_rate: parseFloat(invRate),
        amount: parseFloat(invAmount),
        has_end_date: invHasEndDate,
        end_date: invHasEndDate && invEndDate ? new Date(invEndDate).toISOString() : null,
        is_released: false,
        description: invDesc.trim()
      });
      setInvName('');
      setInvRate('');
      setInvAmount('');
      setInvHasEndDate(false);
      setInvEndDate('');
      setInvDesc('');
      setInvestmentModalVisible(false);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setInvError(err.response?.data || err.message || 'Failed to add investment.');
    } finally {
      setSubmitting(false);
    }
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
              setSavings(savings.filter(s => s.id !== id));
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
              setInvestments(investments.filter(i => i.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete investment.');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const totalSavings = savings.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const totalInvestments = investments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Wealth Assets</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (activeTab === 'savings') setSavingsModalVisible(true);
            else setInvestmentModalVisible(true);
          }}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add Asset</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'savings' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('savings')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'savings' && { color: '#FFF' }]}>
            Savings ({savings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'investments' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('investments')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'investments' && { color: '#FFF' }]}>
            Investments ({investments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'savings' ? (
          <>
            {/* Savings Hero Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight }]}>
              <PiggyBank size={32} color={colors.primary} />
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Savings Portfolio</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalSavings)}</Text>
              </View>
            </View>

            {/* Savings List */}
            {savings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Landmark size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No savings accounts configured</Text>
              </View>
            ) : (
              savings.map((item) => (
                <View 
                  key={item.id} 
                  style={[styles.assetItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}
                >
                  <View style={styles.assetLeft}>
                    <Text style={[styles.assetName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.assetMeta}>
                      <Percent size={12} color={colors.success} />
                      <Text style={[styles.assetMetaText, { color: colors.success }]}>
                        {item.interest_rate}% APY
                      </Text>
                      {item.description ? (
                        <Text style={[styles.assetDesc, { color: colors.textSecondary }]}>
                          • {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={[styles.assetAmount, { color: colors.text }]}>
                      {formatCurrency(item.balance)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => handleDeleteSavings(item.id, item.name)}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* Investments Hero Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight }]}>
              <Landmark size={32} color={colors.primary} />
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active Capital Invested</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalInvestments)}</Text>
              </View>
            </View>

            {/* Investments List */}
            {investments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Landmark size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active investments logged</Text>
              </View>
            ) : (
              investments.map((item) => (
                <View 
                  key={item.id} 
                  style={[styles.assetItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}
                >
                  <View style={styles.assetLeft}>
                    <Text style={[styles.assetName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.assetMeta}>
                      <Percent size={12} color={colors.success} />
                      <Text style={[styles.assetMetaText, { color: colors.success }]}>
                        {item.interest_rate}% Yield
                      </Text>
                      {item.has_end_date && item.end_date && (
                        <Text style={[styles.assetDesc, { color: colors.textSecondary }]}>
                          • Matures {new Date(item.end_date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={[styles.assetAmount, { color: colors.text }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => handleDeleteInvestment(item.id, item.name)}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add Savings Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={savingsModalVisible}
        onRequestClose={() => setSavingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Savings Account</Text>
              <TouchableOpacity onPress={() => setSavingsModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {savingsError ? <Text style={styles.formError}>{savingsError}</Text> : null}

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Account Name</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. High Yield Savings"
                  placeholderTextColor={colors.textMuted}
                  value={savingsName}
                  onChangeText={setSavingsName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Interest Rate (% APY)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. 4.25"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={savingsRate}
                  onChangeText={setSavingsRate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Current Balance (USD)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={savingsBalance}
                  onChangeText={setSavingsBalance}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Emergency fund, vacation savings, etc."
                  placeholderTextColor={colors.textMuted}
                  value={savingsDesc}
                  onChangeText={setSavingsDesc}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddSavings}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Investment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={investmentModalVisible}
        onRequestClose={() => setInvestmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Investment Asset</Text>
              <TouchableOpacity onPress={() => setInvestmentModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {invError ? <Text style={styles.formError}>{invError}</Text> : null}

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Product / Investment Name</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Treasury Bill 6-Month"
                  placeholderTextColor={colors.textMuted}
                  value={invName}
                  onChangeText={setInvName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Interest Rate (%)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. 5.15"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={invRate}
                  onChangeText={setInvRate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Principal Amount (USD)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={invAmount}
                  onChangeText={setInvAmount}
                />
              </View>

              <View style={[styles.formGroup, styles.switchContainer]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>Has Maturity Date?</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Specify if this is a fixed-term asset</Text>
                </View>
                <Switch 
                  value={invHasEndDate}
                  onValueChange={setInvHasEndDate}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {invHasEndDate && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Maturity Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="2026-12-31"
                    placeholderTextColor={colors.textMuted}
                    value={invEndDate}
                    onChangeText={setInvEndDate}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Details, purchase notes, etc."
                  placeholderTextColor={colors.textMuted}
                  value={invDesc}
                  onChangeText={setInvDesc}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddInvestment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Investment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  summaryCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  assetItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assetMetaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assetDesc: {
    fontSize: 11,
  },
  assetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
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
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formError: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});
