import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Switch,
  Modal
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows, Spacing } from '../../constants/theme';
import { 
  Plus, 
  X, 
  CreditCard, 
  Moon, 
  Sun, 
  Save,
  Trash2
} from 'lucide-react-native';
import { getStyles } from '../../styles/profile.styles';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const styles = getStyles(colors);

  const {
    userName,
    setUserName,
    monthlyIncome,
    setMonthlyIncome,
    currency,
    setCurrency,
    categories,
    newCategory,
    setNewCategory,
    paymentMethods,
    newPmName,
    setNewPmName,
    newPmIsImmediate,
    setNewPmIsImmediate,
    newPmCutDate,
    setNewPmCutDate,
    newPmDaysToPay,
    setNewPmDaysToPay,
    pmModalVisible,
    setPmModalVisible,
    loading,
    saving,
    handleSaveProfile,
    handleAddCategory,
    handleRemoveCategory,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
  } = useProfile();

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
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Monthly Income</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Currency Preference</Text>
            <View style={styles.currencySelector}>
              {['USD', 'MXN', 'EUR', 'GBP'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyOption,
                    {
                      borderColor: currency === curr ? colors.primary : colors.border,
                      backgroundColor: currency === curr ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setCurrency(curr)}
                >
                  <Text
                    style={[
                      styles.currencyOptionText,
                      { color: currency === curr ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
