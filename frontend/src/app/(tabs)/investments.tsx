import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Switch,
  RefreshControl
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows, Spacing } from '../../constants/theme';
import { Plus, Trash2, X, Landmark, PiggyBank, Percent, Edit2, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { getStyles } from '../../styles/investments.styles';
import { useInvestments } from '../../hooks/useInvestments';
import { formatCurrency } from '../../utils/currency';
import { DatePickerModal } from '../../components/DatePickerModal';

export default function InvestmentsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [invEndDatePickerVisible, setInvEndDatePickerVisible] = React.useState(false);

  const {
    profile,
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    onRefresh,
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
    editingInvestment,
    viewingInvestment,
    detailsModalVisible,
    handleEditInvestmentPress,
    handleCloseInvestmentModal,
    handleDetailsPress,
    handleCloseDetailsModal,
    editingSavings,
    setEditingSavings,
    viewingSavings,
    setViewingSavings,
    savingsDetailsModalVisible,
    setSavingsDetailsModalVisible,
    handleEditSavingsPress,
    handleCloseSavingsModal,
    handleSavingsDetailsPress,
    handleCloseSavingsDetailsModal,
  } = useInvestments();

  if (loading && !refreshing) {
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
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
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.assetItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}
                  activeOpacity={0.7}
                  onPress={() => handleSavingsDetailsPress(item)}
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
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSavings(item.id, item.name);
                      }}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
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
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.assetItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}
                  activeOpacity={0.7}
                  onPress={() => handleDetailsPress(item)}
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
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteInvestment(item.id, item.name);
                      }}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Savings Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={savingsModalVisible}
        onRequestClose={handleCloseSavingsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingSavings ? 'Edit Savings Account' : 'Add Savings Account'}
              </Text>
              <TouchableOpacity onPress={handleCloseSavingsModal}>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {editingSavings ? 'Current Balance' : 'Starting Balance'} ({profile?.currency || 'USD'})
                </Text>
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
                  <Text style={styles.saveButtonText}>
                    {editingSavings ? 'Save Changes' : 'Add Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Savings Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={savingsDetailsModalVisible}
        onRequestClose={handleCloseSavingsDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Savings Account Details</Text>
              <TouchableOpacity onPress={handleCloseSavingsDetailsModal}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {viewingSavings && (
              <ScrollView contentContainerStyle={styles.detailsContent}>
                {/* Header Info */}
                <View style={styles.detailsHeader}>
                  <Text style={[styles.detailsName, { color: colors.text }]}>{viewingSavings.name}</Text>
                  <Text style={[styles.detailsAmount, { color: colors.text }]}>
                    {formatCurrency(viewingSavings.balance, profile?.currency)}
                  </Text>
                  {viewingSavings.description ? (
                    <Text style={[styles.detailsDesc, { color: colors.textSecondary }]}>
                      {viewingSavings.description}
                    </Text>
                  ) : null}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Percent size={18} color={colors.success} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interest Rate</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{viewingSavings.interest_rate}% APY</Text>
                  </View>
                </View>

                {/* History Section */}
                <View style={styles.historySection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Balance History</Text>
                  
                  {(!viewingSavings.history || viewingSavings.history.length === 0) ? (
                    <View style={styles.emptyHistory}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No balance data available</Text>
                    </View>
                  ) : (
                    <View style={styles.timelineContainer}>
                      {/* Timeline vertical line */}
                      <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                      
                      {(viewingSavings.history || [])
                        .map((histItem: any, index: number, arr: any[]) => {
                          let changeInfo = null;
                          if (index < arr.length - 1) {
                            const prevBalance = arr[index + 1].balance;
                            const diff = histItem.balance - prevBalance;
                            const pct = prevBalance > 0 ? (diff / prevBalance) * 100 : 0;
                            const isGrowth = diff > 0;
                            const isDecrease = diff < 0;
                            const sign = diff >= 0 ? '+' : '';
                            
                            changeInfo = {
                              text: `${sign}${formatCurrency(diff, profile?.currency)} (${sign}${pct.toFixed(1)}%)`,
                              isGrowth,
                              isDecrease,
                              color: isGrowth ? colors.success : isDecrease ? colors.danger : colors.textSecondary
                            };
                          }
                          
                          return (
                            <View key={index} style={styles.timelineItem}>
                              {/* Left dot */}
                              <View style={[
                                styles.timelineDot, 
                                { 
                                  backgroundColor: colors.card,
                                  borderColor: changeInfo?.isGrowth ? colors.success : changeInfo?.isDecrease ? colors.danger : colors.primary
                                }
                              ]} />
                              
                              {/* Right Content card */}
                              <View style={[styles.timelineCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <View style={styles.timelineCardHeader}>
                                  <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                                    {new Date(histItem.date).toLocaleDateString()}
                                  </Text>
                                  {changeInfo && (
                                    <View style={[
                                      styles.changeBadge, 
                                      { backgroundColor: changeInfo.isGrowth ? 'rgba(52, 211, 153, 0.1)' : changeInfo.isDecrease ? 'rgba(251, 113, 133, 0.1)' : 'rgba(148, 163, 184, 0.1)' }
                                    ]}>
                                      {changeInfo.isGrowth ? (
                                        <ArrowUpRight size={12} color={colors.success} style={{ marginRight: 2 }} />
                                      ) : changeInfo.isDecrease ? (
                                        <ArrowDownRight size={12} color={colors.danger} style={{ marginRight: 2 }} />
                                      ) : null}
                                      <Text style={[styles.changeText, { color: changeInfo.color }]}>
                                        {changeInfo.text}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.timelineAmount, { color: colors.text }]}>
                                  {formatCurrency(histItem.balance, profile?.currency)}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </View>

                {/* Details actions */}
                <View style={styles.detailsActions}>
                  <TouchableOpacity 
                    style={[styles.editButtonAction, { borderColor: colors.primary }]}
                    onPress={() => {
                      handleCloseSavingsDetailsModal();
                      handleEditSavingsPress(viewingSavings);
                    }}
                  >
                    <Edit2 size={16} color={colors.primary} />
                    <Text style={[styles.editButtonTextAction, { color: colors.primary }]}>Edit Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.deleteButtonAction, { borderColor: colors.danger }]}
                    onPress={() => {
                      handleDeleteSavings(viewingSavings.id, viewingSavings.name);
                    }}
                  >
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={[styles.deleteButtonTextAction, { color: colors.danger }]}>Remove Account</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Investment Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={handleCloseDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Asset Details</Text>
              <TouchableOpacity onPress={handleCloseDetailsModal}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {viewingInvestment && (
              <ScrollView contentContainerStyle={styles.detailsContent}>
                {/* Header Info */}
                <View style={styles.detailsHeader}>
                  <Text style={[styles.detailsName, { color: colors.text }]}>{viewingInvestment.name}</Text>
                  <Text style={[styles.detailsAmount, { color: colors.text }]}>
                    {formatCurrency(viewingInvestment.amount, profile?.currency)}
                  </Text>
                  {viewingInvestment.description ? (
                    <Text style={[styles.detailsDesc, { color: colors.textSecondary }]}>
                      {viewingInvestment.description}
                    </Text>
                  ) : null}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Percent size={18} color={colors.success} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expected Yield</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{viewingInvestment.interest_rate}% APY</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Calendar size={18} color={colors.info} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Maturity Date</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {viewingInvestment.has_end_date && viewingInvestment.end_date
                        ? new Date(viewingInvestment.end_date).toLocaleDateString()
                        : 'No Maturity'}
                    </Text>
                  </View>
                </View>

                {/* History Section */}
                <View style={styles.historySection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance History</Text>
                  
                  {(!viewingInvestment.history || viewingInvestment.history.length === 0) ? (
                    <View style={styles.emptyHistory}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No performance data available</Text>
                    </View>
                  ) : (
                    <View style={styles.timelineContainer}>
                      {/* Timeline vertical line */}
                      <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                      
                      {(viewingInvestment.history || [])
                        .map((histItem: any, index: number, arr: any[]) => {
                          let changeInfo = null;
                          if (index < arr.length - 1) {
                            const prevAmount = arr[index + 1].amount;
                            const diff = histItem.amount - prevAmount;
                            const pct = prevAmount > 0 ? (diff / prevAmount) * 100 : 0;
                            const isGrowth = diff > 0;
                            const isDecrease = diff < 0;
                            const sign = diff >= 0 ? '+' : '';
                            
                            changeInfo = {
                              text: `${sign}${formatCurrency(diff, profile?.currency)} (${sign}${pct.toFixed(1)}%)`,
                              isGrowth,
                              isDecrease,
                              color: isGrowth ? colors.success : isDecrease ? colors.danger : colors.textSecondary
                            };
                          }
                          
                          return (
                            <View key={index} style={styles.timelineItem}>
                              {/* Left dot */}
                              <View style={[
                                styles.timelineDot, 
                                { 
                                  backgroundColor: colors.card,
                                  borderColor: changeInfo?.isGrowth ? colors.success : changeInfo?.isDecrease ? colors.danger : colors.primary
                                }
                              ]} />
                              
                              {/* Right Content card */}
                              <View style={[styles.timelineCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <View style={styles.timelineCardHeader}>
                                  <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                                    {new Date(histItem.date).toLocaleDateString()}
                                  </Text>
                                  {changeInfo && (
                                    <View style={[
                                      styles.changeBadge, 
                                      { backgroundColor: changeInfo.isGrowth ? 'rgba(52, 211, 153, 0.1)' : changeInfo.isDecrease ? 'rgba(251, 113, 133, 0.1)' : 'rgba(148, 163, 184, 0.1)' }
                                    ]}>
                                      {changeInfo.isGrowth ? (
                                        <ArrowUpRight size={12} color={colors.success} style={{ marginRight: 2 }} />
                                      ) : changeInfo.isDecrease ? (
                                        <ArrowDownRight size={12} color={colors.danger} style={{ marginRight: 2 }} />
                                      ) : null}
                                      <Text style={[styles.changeText, { color: changeInfo.color }]}>
                                        {changeInfo.text}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.timelineAmount, { color: colors.text }]}>
                                  {formatCurrency(histItem.amount, profile?.currency)}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </View>

                {/* Details actions */}
                <View style={styles.detailsActions}>
                  <TouchableOpacity 
                    style={[styles.editButtonAction, { borderColor: colors.primary }]}
                    onPress={() => {
                      handleCloseDetailsModal();
                      handleEditInvestmentPress(viewingInvestment);
                    }}
                  >
                    <Edit2 size={16} color={colors.primary} />
                    <Text style={[styles.editButtonTextAction, { color: colors.primary }]}>Edit Asset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.deleteButtonAction, { borderColor: colors.danger }]}
                    onPress={() => {
                      handleDeleteInvestment(viewingInvestment.id, viewingInvestment.name);
                    }}
                  >
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={[styles.deleteButtonTextAction, { color: colors.danger }]}>Delete Asset</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Investment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={investmentModalVisible}
        onRequestClose={handleCloseInvestmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingInvestment ? 'Edit Investment Asset' : 'Add Investment Asset'}
              </Text>
              <TouchableOpacity onPress={handleCloseInvestmentModal}>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {editingInvestment ? 'Current Value' : 'Principal Invested Amount'} ({profile?.currency || 'USD'})
                </Text>
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
                  <TouchableOpacity
                    style={[styles.formInput, { borderColor: colors.border, justifyContent: 'center' }]}
                    onPress={() => setInvEndDatePickerVisible(true)}
                  >
                    <Text style={{ color: invEndDate ? colors.text : colors.textMuted, fontSize: 15 }}>
                      {invEndDate || "YYYY-MM-DD"}
                    </Text>
                  </TouchableOpacity>
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
                  <Text style={styles.saveButtonText}>
                    {editingInvestment ? 'Save Changes' : 'Add Investment'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={invEndDatePickerVisible}
        onClose={() => setInvEndDatePickerVisible(false)}
        onSelectDate={setInvEndDate}
        selectedDate={invEndDate}
        colors={colors}
      />
    </View>
  );
}
