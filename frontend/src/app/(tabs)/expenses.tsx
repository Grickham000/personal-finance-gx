import React from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  FlatList,
  Switch,
  Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Shadows } from '../../constants/theme';
import { Plus, Trash2, Pencil, X, Filter, Calendar, Receipt, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getStyles } from '../../styles/expenses.styles';
import { useExpenses } from '../../hooks/useExpenses';
import { formatCurrency } from '../../utils/currency';
import { DatePickerModal } from '../../components/DatePickerModal';

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    profile,
    activeTab,
    setActiveTab,
    loading,
    submitting,
    selectedFilterCategory,
    setSelectedFilterCategory,
    filteredVariableExpenses,
    fixedExpenses,

    // Variable Modal Form
    variableModalVisible,
    setVariableModalVisible,
    amount,
    setAmount,
    category,
    setCategory,
    paymentMethodName,
    setPaymentMethodName,
    description,
    setDescription,
    formError,
    isUnexpectedIncome,
    setIsUnexpectedIncome,
    editingVariableId,
    expenseDate,
    setExpenseDate,
    openAddVariableModal,
    openEditVariableModal,
    handleAddVariableExpense,
    handleDeleteVariableExpense,

    // Date Filters & Pagination
    filterType,
    setFilterType,
    targetDate,
    setTargetDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    paginationInfo,
    handlePrevPeriod,
    handleNextPeriod,

    // Fixed Modal Form
    fixedModalVisible,
    setFixedModalVisible,
    fixedAmount,
    setFixedAmount,
    fixedCategory,
    setFixedCategory,
    fixedDescription,
    setFixedDescription,
    fixedStartDate,
    setFixedStartDate,
    fixedEndDate,
    setFixedEndDate,
    fixedExpire,
    setFixedExpire,
    fixedError,
    editingFixedId,
    openAddFixedModal,
    openEditFixedModal,
    handleSaveFixedExpense,
    handleDeleteFixedExpense,
    formatDate,
  } = useExpenses();

  const [rangeStartPickerVisible, setRangeStartPickerVisible] = React.useState(false);
  const [rangeEndPickerVisible, setRangeEndPickerVisible] = React.useState(false);
  const [fixedStartDatePickerVisible, setFixedStartDatePickerVisible] = React.useState(false);
  const [fixedEndDatePickerVisible, setFixedEndDatePickerVisible] = React.useState(false);
  const [variableDatePickerVisible, setVariableDatePickerVisible] = React.useState(false);

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
            if (activeTab === 'variable') {
              openAddVariableModal();
            } else {
              openAddFixedModal();
            }
          }}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add Log</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'variable' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('variable')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'variable' && { color: '#FFF' }]}>
            Variable
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'fixed' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('fixed')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'fixed' && { color: '#FFF' }]}>
            Fixed Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'variable' ? (
        <>
          {/* Date Filter Type Switcher */}
          <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
            <Calendar size={16} color={colors.textSecondary} style={{ marginRight: Spacing.sm }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['month', 'week', 'day', 'range'] as const).map((type) => (
                <TouchableOpacity 
                  key={type}
                  style={[
                    styles.filterChip, 
                    { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
                    filterType === type && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[
                    styles.filterChipText, 
                    { color: colors.text, textTransform: 'capitalize' }, 
                    filterType === type && { color: '#FFF' }
                  ]}>
                    {type === 'range' ? 'Custom Range' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Period Navigation or Range Picker */}
          {filterType !== 'range' ? (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 10,
              backgroundColor: colors.card,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: Spacing.md
            }}>
              <TouchableOpacity onPress={handlePrevPeriod} style={{ padding: 6 }}>
                <ChevronLeft size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, minWidth: 160, textAlign: 'center' }}>
                {filterType === 'month' ? (
                  new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                ) : filterType === 'week' ? (
                  `Week of ${new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                ) : (
                  new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                )}
              </Text>

              <TouchableOpacity onPress={handleNextPeriod} style={{ padding: 6 }}>
                <ChevronRight size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: Spacing.lg,
              paddingVertical: 8,
              backgroundColor: colors.card,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: Spacing.sm
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 36,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}
                onPress={() => setRangeStartPickerVisible(true)}
              >
                <Text style={{ fontSize: 12, color: startDate ? colors.text : colors.textMuted }}>
                  {startDate || "Start (YYYY-MM-DD)"}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>to</Text>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 36,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}
                onPress={() => setRangeEndPickerVisible(true)}
              >
                <Text style={{ fontSize: 12, color: endDate ? colors.text : colors.textMuted }}>
                  {endDate || "End (YYYY-MM-DD)"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Variable Expenses Filter Bar */}
          {profile && (
            <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
              <Filter size={16} color={colors.textSecondary} style={{ marginRight: Spacing.sm }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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

          {/* Variable Expenses List */}
          <FlatList
            data={filteredVariableExpenses}
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
                <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                  {item.expense_description}
                </Text>
                
                <Text style={[styles.expenseAmountLarge, { color: item.expense < 0 ? colors.success : colors.danger }]}>
                  {item.expense < 0 ? '+' : '-'}{formatCurrency(Math.abs(item.expense), profile?.currency)}
                </Text>

                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.expenseFooterRow}>
                  <View style={styles.metaRowVertical}>
                    <Text style={[styles.categoryBadge, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
                      {item.expense_type}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {formatDate(item.expense_date)} • {item.payment_method}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openEditVariableModal(item)}
                    >
                      <Pencil size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteVariableExpense(item.id)}
                    >
                      <Trash2 size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Pagination Navigation Controls */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: Spacing.lg,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}>
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: paginationInfo.hasPrev ? colors.primary : colors.border,
                opacity: paginationInfo.hasPrev ? 1 : 0.5
              }}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={!paginationInfo.hasPrev}
            >
              <ChevronLeft size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Prev</Text>
            </TouchableOpacity>

            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Page {paginationInfo.page} of {paginationInfo.totalPages || 1}
            </Text>

            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: paginationInfo.hasNext ? colors.primary : colors.border,
                opacity: paginationInfo.hasNext ? 1 : 0.5
              }}
              onPress={() => setPage(p => p + 1)}
              disabled={!paginationInfo.hasNext}
            >
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', marginRight: 4 }}>Next</Text>
              <ChevronRight size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Fixed Expenses List */
        <FlatList
          data={fixedExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Receipt size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No fixed expenses set up yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
              <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                {item.fexpense_description}
              </Text>
              
              <Text style={[styles.expenseAmountLarge, { color: item.fixed_expense < 0 ? colors.success : colors.danger }]}>
                {item.fixed_expense < 0 ? '+' : '-'}{formatCurrency(Math.abs(item.fixed_expense), profile?.currency)}
              </Text>

              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

              <View style={styles.expenseFooterRow}>
                <View style={styles.metaRowVertical}>
                  <Text style={[styles.categoryBadge, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
                    {item.fexpense_type}
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Starts: {formatDate(item.fexpense_start_date)} • Ends: {formatDate(item.fexpense_end_date)}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => openEditFixedModal(item)}
                  >
                    <Pencil size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteFixedExpense(item.id, item.fexpense_description)}
                  >
                    <Trash2 size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Variable Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={variableModalVisible}
        onRequestClose={() => setVariableModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingVariableId ? 'Edit Variable Expense' : 'Log Expense'}
              </Text>
              <TouchableOpacity onPress={() => setVariableModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount ({profile?.currency || 'USD'})</Text>
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

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Transaction Date (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  style={[styles.formInput, { borderColor: colors.border, justifyContent: 'center' }]}
                  onPress={() => setVariableDatePickerVisible(true)}
                >
                  <Text style={{ color: expenseDate ? colors.text : colors.textMuted, fontSize: 15 }}>
                    {expenseDate || "YYYY-MM-DD"}
                  </Text>
                </TouchableOpacity>
              </View>

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

              <View style={[styles.formGroup, styles.switchContainer]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>Unexpected Income / Refund?</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Toggle if this transaction represents a refund or unexpected incoming funds.</Text>
                </View>
                <Switch 
                  value={isUnexpectedIncome}
                  onValueChange={setIsUnexpectedIncome}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddVariableExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingVariableId ? 'Save Changes' : 'Save Transaction'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Fixed Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={fixedModalVisible}
        onRequestClose={() => setFixedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingFixedId ? 'Edit Fixed Expense' : 'Log Fixed Expense'}
              </Text>
              <TouchableOpacity onPress={() => setFixedModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {fixedError ? <Text style={styles.formError}>{fixedError}</Text> : null}

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount ({profile?.currency || 'USD'})</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={fixedAmount}
                  onChangeText={setFixedAmount}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Netflix Subscription"
                  placeholderTextColor={colors.textMuted}
                  value={fixedDescription}
                  onChangeText={setFixedDescription}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.chipsContainer}>
                  {profile?.expense_types?.map((cat: string) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.formChip,
                        { borderColor: colors.border },
                        fixedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFixedCategory(cat)}
                    >
                      <Text style={[styles.formChipText, { color: colors.text }, fixedCategory === cat && { color: '#FFF' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fixedDateRow}>
                <View style={[styles.formGroup, styles.fixedDateItem]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Start Date</Text>
                  <TouchableOpacity
                    style={[styles.formInput, { borderColor: colors.border, justifyContent: 'center' }]}
                    onPress={() => setFixedStartDatePickerVisible(true)}
                  >
                    <Text style={{ color: fixedStartDate ? colors.text : colors.textMuted, fontSize: 15 }}>
                      {fixedStartDate || "YYYY-MM-DD"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {fixedExpire && (
                  <View style={[styles.formGroup, styles.fixedDateItem]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>End Date</Text>
                    <TouchableOpacity
                      style={[styles.formInput, { borderColor: colors.border, justifyContent: 'center' }]}
                      onPress={() => setFixedEndDatePickerVisible(true)}
                    >
                      <Text style={{ color: fixedEndDate ? colors.text : colors.textMuted, fontSize: 15 }}>
                        {fixedEndDate || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={[styles.formGroup, styles.switchContainer]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>Has Expiration Date?</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Toggle if this fixed expense expires or is ongoing indefinitely.</Text>
                </View>
                <Switch 
                  value={fixedExpire}
                  onValueChange={setFixedExpire}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveFixedExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingFixedId ? 'Save Changes' : 'Add Fixed Expense'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={rangeStartPickerVisible}
        onClose={() => setRangeStartPickerVisible(false)}
        onSelectDate={setStartDate}
        selectedDate={startDate}
        colors={colors}
      />
      <DatePickerModal
        visible={rangeEndPickerVisible}
        onClose={() => setRangeEndPickerVisible(false)}
        onSelectDate={setEndDate}
        selectedDate={endDate}
        colors={colors}
      />
      <DatePickerModal
        visible={fixedStartDatePickerVisible}
        onClose={() => setFixedStartDatePickerVisible(false)}
        onSelectDate={setFixedStartDate}
        selectedDate={fixedStartDate}
        colors={colors}
      />
      <DatePickerModal
        visible={fixedEndDatePickerVisible}
        onClose={() => setFixedEndDatePickerVisible(false)}
        onSelectDate={setFixedEndDate}
        selectedDate={fixedEndDate}
        colors={colors}
      />
      <DatePickerModal
        visible={variableDatePickerVisible}
        onClose={() => setVariableDatePickerVisible(false)}
        onSelectDate={setExpenseDate}
        selectedDate={expenseDate}
        colors={colors}
      />
    </View>
  );
}
