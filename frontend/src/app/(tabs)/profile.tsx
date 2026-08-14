import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Switch,
  Modal,
  Alert
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
  Trash2,
  KeyRound,
  LogOut,
  Mail,
  Send
} from 'lucide-react-native';
import { getStyles } from '../../styles/profile.styles';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { logoutUser, sendResetPasswordEmail } from '../../services/auth';

export default function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
            } catch (err: any) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetPassword = async () => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Error', 'Unable to retrieve your email address.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Would you like to send a password reset link to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await sendResetPasswordEmail(email);
              Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
            } catch (err: any) {
              console.error('Password reset settings error:', err);
              Alert.alert('Error', err.message || 'Failed to send password reset email.');
            }
          }
        }
      ]
    );
  };

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
    isDirty,
    handleDiscardChanges,
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.title, { color: colors.text }]}>Settings Profile</Text>
          {isDirty && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isDirty && (
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: Spacing.md,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.danger,
                marginRight: Spacing.sm
              }}
              onPress={handleDiscardChanges}
              disabled={saving}
            >
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
                Discard
              </Text>
            </TouchableOpacity>
          )}

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
              <Send size={18} color="#FFF" />
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

        {/* Account & Security */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account & Security</Text>
          
          <View style={styles.accountInfoRow}>
            <Mail size={18} color={colors.textSecondary} />
            <Text style={[styles.accountEmailText, { color: colors.textSecondary }]}>
              Logged in as:{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {user?.email || 'Unknown User'}
              </Text>
            </Text>
          </View>

          <View style={styles.accountButtonsContainer}>
            <TouchableOpacity 
              style={[styles.resetButton, { borderColor: colors.primary }]}
              onPress={handleResetPassword}
              activeOpacity={0.7}
            >
              <KeyRound size={16} color={colors.primary} />
              <Text style={[styles.resetButtonText, { color: colors.primary }]}>
                Reset Password via Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: colors.danger }]}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <LogOut size={16} color="#FFF" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
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

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Type</Text>
                <View style={styles.currencySelector}>
                  <TouchableOpacity
                    style={[
                      styles.currencyOption,
                      {
                        borderColor: newPmIsImmediate ? colors.primary : colors.border,
                        backgroundColor: newPmIsImmediate ? colors.primaryLight : 'transparent',
                      },
                    ]}
                    onPress={() => setNewPmIsImmediate(true)}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        { color: newPmIsImmediate ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      Debit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.currencyOption,
                      {
                        borderColor: !newPmIsImmediate ? colors.primary : colors.border,
                        backgroundColor: !newPmIsImmediate ? colors.primaryLight : 'transparent',
                      },
                    ]}
                    onPress={() => setNewPmIsImmediate(false)}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        { color: !newPmIsImmediate ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      Credit
                    </Text>
                  </TouchableOpacity>
                </View>
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
