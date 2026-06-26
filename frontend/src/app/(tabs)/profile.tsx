import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Spacing, Shadows } from '../../constants/theme';
import { 
  User, 
  Plus, 
  X, 
  CreditCard, 
  Moon, 
  Sun, 
  Save,
  Trash2
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { colors, theme, toggleTheme, isDark } = useTheme();

  // Profile data states
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  
  // Category tags
  const [categories, setCategories] = useState<string[]>(['food', 'transport', 'housing', 'services', 'entertainment', 'other']);
  const [newCategory, setNewCategory] = useState('');

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [newPmName, setNewPmName] = useState('');
  const [newPmIsImmediate, setNewPmIsImmediate] = useState(true);
  const [newPmCutDate, setNewPmCutDate] = useState('0');
  const [newPmDaysToPay, setNewPmDaysToPay] = useState('0');
  const [pmModalVisible, setPmModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiService.getUserProfile();
      if (data) {
        setProfileId(data.id);
        setUserName(data.user_name || '');
        setMonthlyIncome(String(data.monthly_income || '0'));
        setCategories(data.expense_types || []);
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (err: any) {
      // 404 is fine, means no profile registered yet
      if (err.response?.status !== 404 && !(err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('not found'))) {
        console.error('Failed to load profile:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      Alert.alert('Validation Error', 'Please enter your display name.');
      return;
    }
    if (!monthlyIncome || isNaN(Number(monthlyIncome))) {
      Alert.alert('Validation Error', 'Please enter a valid monthly income.');
      return;
    }
    if (categories.length === 0) {
      Alert.alert('Validation Error', 'Please configure at least one category tag.');
      return;
    }
    if (paymentMethods.length === 0) {
      Alert.alert('Validation Error', 'Please configure at least one payment method.');
      return;
    }

    setSaving(true);
    
    const payload = {
      user_name: userName.trim(),
      expense_types: categories,
      payment_methods: paymentMethods,
      monthly_income: parseFloat(monthlyIncome),
    };

    try {
      if (profileId) {
        // Update existing profile
        await apiService.updateUserProfile(profileId, payload);
      } else {
        // Create new profile
        await apiService.createUserProfile(payload);
      }
      
      // Reload profile
      await fetchProfile();
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data || err.message || 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const cleanCat = newCategory.trim().toLowerCase();
    if (!cleanCat) return;
    if (categories.includes(cleanCat)) {
      Alert.alert('Exists', 'This category is already added.');
      return;
    }
    setCategories([...categories, cleanCat]);
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleAddPaymentMethod = () => {
    if (!newPmName.trim()) {
      Alert.alert('Required', 'Please specify a name.');
      return;
    }
    
    // Check uniqueness
    if (paymentMethods.some(pm => pm.name.toLowerCase() === newPmName.trim().toLowerCase())) {
      Alert.alert('Exists', 'A payment method with this name already exists.');
      return;
    }

    const nextPm = {
      id: Math.random().toString(36).substr(2, 9), // Temp client ID (backend handles stable ID)
      name: newPmName.trim(),
      is_immediate: newPmIsImmediate,
      cut_date: newPmIsImmediate ? 0 : parseInt(newPmCutDate) || 1,
      days_to_pay: newPmIsImmediate ? 0 : parseInt(newPmDaysToPay) || 0
    };

    setPaymentMethods([...paymentMethods, nextPm]);
    
    // Clear inputs and close modal
    setNewPmName('');
    setNewPmIsImmediate(true);
    setNewPmCutDate('0');
    setNewPmDaysToPay('0');
    setPmModalVisible(false);
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
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
        <Text style={[styles.title, { color: colors.text }]}>Settings Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButtonHeader, { backgroundColor: colors.primary }]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Save size={16} color="#FFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core Profile Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Configuration</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Display Name</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
              value={userName}
              onChangeText={setUserName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Monthly Income (USD)</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
            />
          </View>
        </View>

        {/* Categories Config */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Categories</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            These categories populate your expense logging selector.
          </Text>

          <View style={styles.addTagContainer}>
            <TextInput
              style={[styles.tagInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="New Category Tag"
              placeholderTextColor={colors.textMuted}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity style={[styles.tagAddButton, { backgroundColor: colors.primary }]} onPress={handleAddCategory}>
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.chipsContainer}>
            {categories.map((cat) => (
              <View 
                key={cat} 
                style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>{cat}</Text>
                <TouchableOpacity onPress={() => handleRemoveCategory(cat)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Methods Config */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Payment Methods</Text>
            <TouchableOpacity 
              style={[styles.addPmButton, { backgroundColor: colors.primary }]} 
              onPress={() => setPmModalVisible(true)}
            >
              <Plus size={14} color="#FFF" />
              <Text style={styles.addPmButtonText}>Add Method</Text>
            </TouchableOpacity>
          </View>

          {paymentMethods.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No payment methods configured yet.
            </Text>
          ) : (
            paymentMethods.map((pm) => (
              <View 
                key={pm.id || pm.name} 
                style={[styles.pmItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.pmLeft}>
                  <CreditCard size={18} color={colors.textSecondary} />
                  <View style={{ marginLeft: Spacing.sm }}>
                    <Text style={[styles.pmName, { color: colors.text }]}>{pm.name}</Text>
                    <Text style={[styles.pmType, { color: colors.textSecondary }]}>
                      {pm.is_immediate ? 'Debit (Immediate)' : `Credit Card (Cut: Day ${pm.cut_date}, Due +${pm.days_to_pay}d)`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemovePaymentMethod(pm.id)}>
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Appearance Theme Selector */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Appearance</Text>
          
          <View style={styles.themeToggleRow}>
            <View style={styles.themeToggleLabel}>
              {isDark ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
              <Text style={[styles.themeToggleText, { color: colors.text }]}>Dark Theme Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pmModalVisible}
        onRequestClose={() => setPmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Configure Payment Method</Text>
              <TouchableOpacity onPress={() => setPmModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Method Name</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Visa Credit Card, Cash Wallet"
                  placeholderTextColor={colors.textMuted}
                  value={newPmName}
                  onChangeText={setNewPmName}
                />
              </View>

              <View style={[styles.formGroup, styles.switchContainer]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>Is Immediate Payment?</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Debit cards and cash clear immediately. Credit cards clear on a statement date.</Text>
                </View>
                <Switch 
                  value={newPmIsImmediate}
                  onValueChange={setNewPmIsImmediate}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {!newPmIsImmediate && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Statement Cut-Off Day (1-31)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="e.g. 16"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={newPmCutDate}
                      onChangeText={setNewPmCutDate}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Days to Pay statement (after cut-off)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="e.g. 20"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={newPmDaysToPay}
                      onChangeText={setNewPmDaysToPay}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddPaymentMethod}
              >
                <Text style={styles.saveButtonText}>Add Method</Text>
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
  saveButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.md,
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
  addTagContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tagAddButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  addPmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  addPmButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  pmLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pmName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  pmType: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  themeToggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: '600',
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
});
