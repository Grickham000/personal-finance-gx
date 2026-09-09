import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import {
  Bell,
  BellOff,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Spacing, Shadows } from '../constants/theme';
import {
  AlarmTriggerType,
  CardAlarmConfig,
  getNextAlarmDate,
  saveCardAlarm,
  deleteCardAlarm,
  scheduleTestNotification,
} from '../services/alarmService';

interface CardAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  card: any;
  userId?: string;
  initialConfig?: CardAlarmConfig;
  onAlarmSaved: (updatedConfig: CardAlarmConfig | null) => void;
  colors: any;
}

const QUICK_HOURS = [
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '12:00 PM', hour: 12 },
  { label: '2:00 PM', hour: 14 },
  { label: '6:00 PM', hour: 18 },
  { label: '8:00 PM', hour: 20 },
];

export const CardAlarmModal: React.FC<CardAlarmModalProps> = ({
  visible,
  onClose,
  card,
  userId,
  initialConfig,
  onAlarmSaved,
  colors,
}) => {
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [triggerType, setTriggerType] = useState<AlarmTriggerType>(
    initialConfig?.triggerType || 'due_date'
  );
  const [notifyHour, setNotifyHour] = useState(initialConfig?.notifyHour ?? 9);
  const [notifyMinute] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  const handleSendTest = async () => {
    setTestingNotification(true);
    try {
      const scheduled = await scheduleTestNotification(card.name);
      if (scheduled) {
        Alert.alert(
          'Test Notification Scheduled',
          'You will receive a notification in 5 seconds!'
        );
      } else {
        Alert.alert(
          'In-App Notification Mode',
          `Payment alarm for ${card.name} is active in-app!\n\nTo test device lock-screen push notifications on Android, install the standalone APK build.`
        );
      }
    } catch (err) {
      console.warn('Error sending test notification:', err);
    } finally {
      setTestingNotification(false);
    }
  };

  if (!card) return null;

  // Calculate live next alarm preview
  const nextAlarm = getNextAlarmDate(
    card,
    triggerType,
    notifyHour,
    notifyMinute
  );

  const formatHourLabel = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  const handleHourStep = (delta: number) => {
    setNotifyHour((prev) => {
      const next = (prev + delta + 24) % 24;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!enabled) {
        await deleteCardAlarm(userId, card.id || card.name);
        onAlarmSaved(null);
      } else {
        const config: CardAlarmConfig = {
          cardId: card.id || card.name,
          enabled: true,
          triggerType,
          notifyHour,
          notifyMinute,
        };
        const updated = await saveCardAlarm(userId, card, config);
        onAlarmSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Error saving alarm configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  const formattedAlarmDate = nextAlarm.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedOriginalDate = nextAlarm.originalDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: colors.border }]}>
            <View style={modalStyles.headerTitleBox}>
              <View style={[modalStyles.headerIcon, { backgroundColor: colors.primaryLight || 'rgba(32, 138, 239, 0.15)' }]}>
                <Bell size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[modalStyles.title, { color: colors.text }]}>Payment Alarm</Text>
                <Text style={[modalStyles.subtitle, { color: colors.textSecondary }]}>
                  {card.name} • Cut Day {card.cut_date} • Due +{card.days_to_pay}d
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body} contentContainerStyle={modalStyles.bodyContent}>
            {/* Enabled Toggle Card */}
            <View
              style={[
                modalStyles.toggleRow,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={modalStyles.toggleInfo}>
                <View style={modalStyles.toggleTitleRow}>
                  {enabled ? (
                    <Bell size={18} color={colors.primary} />
                  ) : (
                    <BellOff size={18} color={colors.textMuted} />
                  )}
                  <Text style={[modalStyles.toggleLabel, { color: colors.text }]}>
                    Enable Payment Alarm
                  </Text>
                </View>
                <Text style={[modalStyles.toggleSubtext, { color: colors.textSecondary }]}>
                  Receive notifications before your card payment is due
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {enabled ? (
              <>
                {/* Trigger Selector */}
                <View style={modalStyles.section}>
                  <Text style={[modalStyles.sectionTitle, { color: colors.text }]}>
                    Notify On
                  </Text>
                  <Text style={[modalStyles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Select whether to be reminded on cutoff or last day to pay
                  </Text>

                  <View style={modalStyles.triggerGrid}>
                    {/* Option 1: Cutoff Date */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setTriggerType('cutoff')}
                      style={[
                        modalStyles.triggerCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: triggerType === 'cutoff' ? colors.primary : colors.border,
                          borderWidth: triggerType === 'cutoff' ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={modalStyles.triggerCardHeader}>
                        <Calendar
                          size={18}
                          color={triggerType === 'cutoff' ? colors.primary : colors.textSecondary}
                        />
                        {triggerType === 'cutoff' && (
                          <CheckCircle2 size={16} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[modalStyles.triggerCardTitle, { color: colors.text }]}>
                        Cutoff Date
                      </Text>
                      <Text style={[modalStyles.triggerCardBadge, { color: colors.primary }]}>
                        Day {card.cut_date}
                      </Text>
                      <Text style={[modalStyles.triggerCardDesc, { color: colors.textSecondary }]}>
                        When billing cycle closes and statement is generated.
                      </Text>
                    </TouchableOpacity>

                    {/* Option 2: Last Day to Pay */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setTriggerType('due_date')}
                      style={[
                        modalStyles.triggerCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: triggerType === 'due_date' ? colors.primary : colors.border,
                          borderWidth: triggerType === 'due_date' ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={modalStyles.triggerCardHeader}>
                        <Clock
                          size={18}
                          color={triggerType === 'due_date' ? colors.primary : colors.textSecondary}
                        />
                        {triggerType === 'due_date' && (
                          <CheckCircle2 size={16} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[modalStyles.triggerCardTitle, { color: colors.text }]}>
                        Last Day to Pay
                      </Text>
                      <Text style={[modalStyles.triggerCardBadge, { color: colors.primary }]}>
                        +{card.days_to_pay} Days
                      </Text>
                      <Text style={[modalStyles.triggerCardDesc, { color: colors.textSecondary }]}>
                        Due date deadline to avoid late interest or penalties.
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Alarm Hour Selector */}
                <View style={modalStyles.section}>
                  <Text style={[modalStyles.sectionTitle, { color: colors.text }]}>
                    Notification Hour
                  </Text>
                  <Text style={[modalStyles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Choose what time of day the alarm should sound
                  </Text>

                  {/* Stepper / Display */}
                  <View
                    style={[
                      modalStyles.timeDisplayCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={[modalStyles.stepperButton, { borderColor: colors.border }]}
                      onPress={() => handleHourStep(-1)}
                    >
                      <ChevronLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={modalStyles.timeCenter}>
                      <Clock size={20} color={colors.primary} />
                      <Text style={[modalStyles.timeMainText, { color: colors.text }]}>
                        {formatHourLabel(notifyHour)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[modalStyles.stepperButton, { borderColor: colors.border }]}
                      onPress={() => handleHourStep(1)}
                    >
                      <ChevronRight size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Hour Chips */}
                  <View style={modalStyles.quickChipsRow}>
                    {QUICK_HOURS.map((qh) => {
                      const isSelected = notifyHour === qh.hour;
                      return (
                        <TouchableOpacity
                          key={qh.hour}
                          onPress={() => setNotifyHour(qh.hour)}
                          style={[
                            modalStyles.quickChip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              modalStyles.quickChipText,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {qh.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Business Day Guarantee Box */}
                <View
                  style={[
                    modalStyles.businessDayBanner,
                    {
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderColor: 'rgba(16, 185, 129, 0.25)',
                    },
                  ]}
                >
                  <ShieldCheck size={20} color="#10B981" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[modalStyles.businessDayTitle, { color: '#10B981' }]}>
                      Business Day Guarantee
                    </Text>
                    <Text style={[modalStyles.businessDayText, { color: colors.textSecondary }]}>
                      Payments must never happen on weekends. If the payment or cutoff date lands
                      on a Saturday or Sunday, the alarm automatically fires on the preceding Friday.
                    </Text>
                  </View>
                </View>

                {/* Next Alarm Live Preview */}
                <View
                  style={[
                    modalStyles.previewCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    Shadows.sm,
                  ]}
                >
                  <View style={modalStyles.previewHeader}>
                    <Bell size={16} color={colors.primary} />
                    <Text style={[modalStyles.previewTitle, { color: colors.text }]}>
                      Next Scheduled Alarm
                    </Text>
                  </View>

                  <Text style={[modalStyles.previewDate, { color: colors.text }]}>
                    {formattedAlarmDate} at {formatHourLabel(notifyHour)}
                  </Text>

                  {nextAlarm.wasAdjusted && (
                    <View style={modalStyles.adjustmentAlert}>
                      <AlertTriangle size={14} color="#F59E0B" />
                      <Text style={modalStyles.adjustmentAlertText}>
                        Shifted from {formattedOriginalDate} ({nextAlarm.originalDayName}) to Friday business day
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[modalStyles.testNotificationButton, { borderColor: colors.primary }]}
                    onPress={handleSendTest}
                    disabled={testingNotification}
                  >
                    {testingNotification ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Bell size={13} color={colors.primary} />
                        <Text style={[modalStyles.testNotificationButtonText, { color: colors.primary }]}>
                          Send Test Notification (5s)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={[modalStyles.disabledNotice, { backgroundColor: colors.background }]}>
                <BellOff size={36} color={colors.textMuted} />
                <Text style={[modalStyles.disabledTitle, { color: colors.text }]}>
                  Alarm Is Currently Off
                </Text>
                <Text style={[modalStyles.disabledSub, { color: colors.textSecondary }]}>
                  Turn on the switch above to schedule automated payment reminders on business days.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[modalStyles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[modalStyles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[modalStyles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={modalStyles.saveButtonText}>
                  {enabled ? 'Save Alarm' : 'Save & Disable'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  body: {
    maxHeight: 480,
  },
  bodyContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  triggerGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  triggerCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 14,
    gap: 6,
  },
  triggerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  triggerCardBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  triggerCardDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  timeDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeMainText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  businessDayBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  businessDayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  businessDayText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  previewCard: {
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  adjustmentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adjustmentAlertText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  testNotificationButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: 16,
    gap: 8,
  },
  disabledTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
