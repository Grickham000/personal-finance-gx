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
  FlatList,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Spacing, Shadows } from '../../constants/theme';
import { Plus, Trash2, X, Filter, Calendar, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExpensesScreen() {
  const { colors } = useTheme();

  // Data states
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [selectedFilterPayment, setSelectedFilterPayment] = useState('');

  // Form states (Modal)
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const fetchExpensesAndProfile = useCallback(async () => {
    try {
      // Fetch profile first (to get categories and payment methods)
      let profileData = null;
      try {
        profileData = await apiService.getUserProfile();
        setProfile(profileData);
        if (profileData?.expense_types?.length > 0) setCategory(profileData.expense_types[0]);
        if (profileData?.payment_methods?.length > 0) setPaymentMethodName(profileData.payment_methods[0].name);
      } catch (err: any) {
        console.warn('Profile not configured or failed to load:', err);
      }

      // Fetch expenses
      const expensesData = await apiService.getExpenses();
      // Sort expenses by date descending
      const sorted = (expensesData || []).sort(
        (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );
      setExpenses(sorted);
    } catch (err) {
      console.error('Error fetching expenses data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpensesAndProfile();
  }, [fetchExpensesAndProfile]);

  const handleAddExpense = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('Please enter a valid amount.');
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

    // Find the full payment method details from profile
    const selectedPM = profile?.payment_methods?.find((pm: any) => pm.name === paymentMethodName);

    try {
      const newExpense = {
        expense: parseFloat(amount),
        expense_type: category,
        payment_method: paymentMethodName,
        expense_description: description.trim(),
        expense_date: new Date().toISOString(), // Use current timestamp
        payment_method_cut_date: selectedPM?.cut_date || 0,
        payment_method_id: selectedPM?.id || null,
      };

      await apiService.createExpense(newExpense);
      
      // Reset form and close modal
      setAmount('');
      setDescription('');
      setModalVisible(false);
      
      // Reload list
      setLoading(true);
      await fetchExpensesAndProfile();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || err.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
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
              setExpenses(expenses.filter(e => e.id !== id));
            } catch (err) {
              console.error('Failed to delete expense:', err);
              Alert.alert('Error', 'Failed to delete expense record.');
            }
          }
        }
      ]
    );
  };

  // Filtered list
  const filteredExpenses = expenses.filter(item => {
    const categoryMatch = !selectedFilterCategory || item.expense_type === selectedFilterCategory;
    const paymentMatch = !selectedFilterPayment || item.payment_method === selectedFilterPayment;
    return categoryMatch && paymentMatch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Expenses</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (!profile) {
              Alert.alert('Profile Needed', 'Please set up your profile and payment methods first in the Profile tab.');
              return;
            }
            setModalVisible(true);
          }}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add Log</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      {profile && (
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          <Filter size={16} color={colors.textSecondary} style={{ marginRight: Spacing.sm }} />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Category Filter */}
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
                selectedFilterCategory === '' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSelectedFilterCategory('')}
            >
              <Text style={[styles.filterChipText, { color: colors.text }, selectedFilterCategory === '' && { color: '#FFF' }]}>All Categories</Text>
            </TouchableOpacity>

            {profile.expense_types.map((cat: string) => (
              <TouchableOpacity 
                key={cat}
                style={[
                  styles.filterChip, 
                  { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
                  selectedFilterCategory === cat && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedFilterCategory(cat)}
              >
                <Text style={[styles.filterChipText, { color: colors.text }, selectedFilterCategory === cat && { color: '#FFF' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses matching filters</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <View style={styles.expenseInfo}>
              <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                {item.expense_description}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.categoryBadge, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
                  {item.expense_type}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {formatDate(item.expense_date)} • {item.payment_method}
                </Text>
              </View>
            </View>
            <View style={styles.expenseRight}>
              <Text style={[styles.expenseAmount, { color: colors.danger }]}>
                -{formatCurrency(item.expense)}
              </Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteExpense(item.id)}
              >
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Log Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <ScrollView contentContainerStyle={styles.formContent}>
              {/* Amount Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount (USD)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              {/* Description Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Weekly Groceries"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Category Picker (horizontal selection chips) */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.chipsContainer}>
                  {profile?.expense_types?.map((cat: string) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.formChip,
                        { borderColor: colors.border },
                        category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.formChipText, { color: colors.text }, category === cat && { color: '#FFF' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Method Picker (horizontal selection chips) */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Method</Text>
                <View style={styles.chipsContainer}>
                  {profile?.payment_methods?.map((pm: any) => (
                    <TouchableOpacity
                      key={pm.name}
                      style={[
                        styles.formChip,
                        { borderColor: colors.border },
                        paymentMethodName === pm.name && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setPaymentMethodName(pm.name)}
                    >
                      <Text style={[styles.formChipText, { color: colors.text }, paymentMethodName === pm.name && { color: '#FFF' }]}>
                        {pm.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Transaction</Text>
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
  filterBar: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.lg,
  },
  filterScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  expenseItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 11,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  expenseAmount: {
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  formChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  formChipText: {
    fontSize: 12,
    fontWeight: '600',
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
