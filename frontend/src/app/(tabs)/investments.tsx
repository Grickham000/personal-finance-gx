import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Switch
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows, Spacing } from '../../constants/theme';
import { Plus, Trash2, X, Landmark, PiggyBank, Percent } from 'lucide-react-native';
import { getStyles } from '../../styles/investments.styles';
import { useInvestments } from '../../hooks/useInvestments';
import { formatCurrency } from '../../utils/currency';

export default function InvestmentsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    profile,
    activeTab,
    setActiveTab,
    loading,
    savings,
    investments,
    savingsModalVisible,
    setSavingsModalVisible,
    savingsName,
    setSavingsName,
    savingsRate,
    setSavingsRate,
    savingsBalance,
    setSavingsBalance,
    savingsDesc,
    setSavingsDesc,
    savingsError,
    investmentModalVisible,
    setInvestmentModalVisible,
    invName,
    setInvName,
    invRate,
    setInvRate,
    invAmount,
    setInvAmount,
    invHasEndDate,
    setInvHasEndDate,
    invEndDate,
    setInvEndDate,
    invDesc,
    setInvDesc,
    invError,
    submitting,
    handleAddSavings,
    handleAddInvestment,
    handleDeleteSavings,
    handleDeleteInvestment,
    totalSavings,
    totalInvestments,
  } = useInvestments();

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
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(totalSavings, profile?.currency)}
                </Text>
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
                  <Text style={[styles.assetName, { color: colors.text }]}>{item.name}</Text>
                  
                  <Text style={[styles.assetAmountLarge, { color: colors.text }]}>
                    {formatCurrency(item.balance, profile?.currency)}
                  </Text>

                  <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.assetFooterRow}>
                    <View style={styles.assetMetaVertical}>
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
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(totalInvestments, profile?.currency)}
                </Text>
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
                  <Text style={[styles.assetName, { color: colors.text }]}>{item.name}</Text>
                  
                  <Text style={[styles.assetAmountLarge, { color: colors.text }]}>
                    {formatCurrency(item.amount, profile?.currency)}
                  </Text>

                  <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.assetFooterRow}>
                    <View style={styles.assetMetaVertical}>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Current Balance ({profile?.currency || 'USD'})</Text>
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
                  placeholder="Additional notes"
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Investment Name</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. S&P 500 ETF, Government Bond"
                  placeholderTextColor={colors.textMuted}
                  value={invName}
                  onChangeText={setInvName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Expected Interest/Yield (% APY)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. 8.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={invRate}
                  onChangeText={setInvRate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Principal Invested Amount ({profile?.currency || 'USD'})</Text>
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
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Specify if the investment matures on a specific date (e.g. CD or Bond).</Text>
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
                    placeholder="YYYY-MM-DD"
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
