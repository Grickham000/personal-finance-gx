import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';

export type AlarmTriggerType = 'cutoff' | 'due_date';

export interface CardAlarmConfig {
  cardId: string;
  enabled: boolean;
  triggerType: AlarmTriggerType;
  notifyHour: number; // 0 - 23
  notifyMinute: number; // 0 - 59
  notificationId?: string;
  lastScheduledDate?: string;
}

export interface BusinessDayResult {
  date: Date;
  wasAdjusted: boolean;
  originalDayName?: string;
  originalDate: Date;
}

// Cached notifications module reference
let _notificationsModule: any = undefined;

/**
 * Safely access expo-notifications.
 * In Expo Go on Android (SDK 53+), expo-notifications throws an error on import.
 * This helper avoids loading it in Expo Go or Web, preventing app crashes.
 */
export function getNotifications(): any {
  if (_notificationsModule !== undefined) {
    return _notificationsModule;
  }

  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    _notificationsModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _notificationsModule = require('expo-notifications');
    if (_notificationsModule?.setNotificationHandler) {
      _notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err);
    _notificationsModule = null;
  }

  return _notificationsModule;
}

/**
 * Adjusts a given date so that it falls strictly on a business day (Monday - Friday).
 * If the date is Saturday (6), it shifts back 1 day to Friday (5).
 * If the date is Sunday (0), it shifts back 2 days to Friday (5).
 * If the date is Monday-Friday (1-5), it remains unchanged.
 */
export function adjustToBusinessDay(inputDate: Date): BusinessDayResult {
  const adjusted = new Date(inputDate.getTime());
  const day = adjusted.getDay();
  let wasAdjusted = false;
  let originalDayName: string | undefined = undefined;

  if (day === 6) {
    // Saturday -> Friday
    adjusted.setDate(adjusted.getDate() - 1);
    wasAdjusted = true;
    originalDayName = 'Saturday';
  } else if (day === 0) {
    // Sunday -> Friday
    adjusted.setDate(adjusted.getDate() - 2);
    wasAdjusted = true;
    originalDayName = 'Sunday';
  }

  return {
    date: adjusted,
    wasAdjusted,
    originalDayName,
    originalDate: new Date(inputDate.getTime()),
  };
}

/**
 * Calculates the next upcoming alarm date and time for a given card and trigger configuration.
 * Always shifts weekend triggers back to Friday to ensure the payment/review happens on a business day.
 */
export function getNextAlarmDate(
  card: { cut_date?: number; days_to_pay?: number },
  triggerType: AlarmTriggerType,
  hour: number,
  minute: number = 0,
  referenceNow: Date = new Date()
): BusinessDayResult {
  const cutDateDay = card?.cut_date || 1;
  const daysToPay = card?.days_to_pay || 0;

  // Search upcoming statement cycles (offset 0 to 12 months)
  for (let offset = 0; offset <= 12; offset++) {
    const targetMonthDate = new Date(
      referenceNow.getFullYear(),
      referenceNow.getMonth() + offset,
      1
    );
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth(); // 0-indexed

    // Last day of target month (handles February, 30 vs 31 days)
    const lastDayOfCutoffMonth = new Date(year, month + 1, 0).getDate();
    const cutoffDay = Math.min(cutDateDay, lastDayOfCutoffMonth);
    const cutoffDate = new Date(year, month, cutoffDay, hour, minute, 0, 0);

    let rawTargetDate: Date;
    if (triggerType === 'cutoff') {
      rawTargetDate = cutoffDate;
    } else {
      // Due date is statement cutoff date + daysToPay
      rawTargetDate = new Date(cutoffDate.getTime());
      rawTargetDate.setDate(rawTargetDate.getDate() + daysToPay);
      rawTargetDate.setHours(hour, minute, 0, 0);
    }

    const businessDayResult = adjustToBusinessDay(rawTargetDate);

    // If the adjusted alarm is in the future relative to referenceNow, this is our next alarm
    if (businessDayResult.date.getTime() > referenceNow.getTime()) {
      return businessDayResult;
    }
  }

  // Fallback to tomorrow as a business day
  const fallback = new Date(referenceNow.getTime() + 86400000);
  fallback.setHours(hour, minute, 0, 0);
  return adjustToBusinessDay(fallback);
}

/**
 * Request notification permissions from the OS (iOS / Android).
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Could not request notification permissions:', err);
    return false;
  }
}

/**
 * Schedules a local device notification for the card's upcoming business-day alarm.
 */
export async function scheduleCardNotification(
  card: any,
  config: CardAlarmConfig
): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !config.enabled) {
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    if (config.notificationId) {
      await cancelCardNotification(config.notificationId);
    }

    const nextAlarm = getNextAlarmDate(
      card,
      config.triggerType,
      config.notifyHour,
      config.notifyMinute
    );

    const triggerLabel = config.triggerType === 'cutoff' 
      ? 'Statement Cutoff' 
      : 'Last Day to Pay (Due Date)';

    const body = nextAlarm.wasAdjusted
      ? `Payment reminder for ${card.name}: scheduled for today (business day, moved from ${nextAlarm.originalDayName}).`
      : `Payment reminder for ${card.name} on ${triggerLabel}.`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💳 Payment Alarm: ${card.name}`,
        body,
        sound: true,
        data: {
          cardId: card.id || card.name,
          triggerType: config.triggerType,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
        date: nextAlarm.date,
      },
    });

    return notificationId;
  } catch (err) {
    console.warn('Error scheduling card notification:', err);
    return null;
  }
}

/**
 * Cancels a previously scheduled notification by ID.
 */
export async function cancelCardNotification(notificationId?: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('Error cancelling notification:', err);
  }
}

const getStorageKey = (userId?: string) => `card_alarms_${userId || 'guest'}`;

/**
 * Loads all saved card alarms for the user.
 */
export async function getCardAlarms(userId?: string): Promise<Record<string, CardAlarmConfig>> {
  try {
    const json = await AsyncStorage.getItem(getStorageKey(userId));
    return json ? JSON.parse(json) : {};
  } catch (err) {
    console.error('Failed to get card alarms:', err);
    return {};
  }
}

/**
 * Saves alarm configuration for a card and reschedules device notifications.
 */
export async function saveCardAlarm(
  userId: string | undefined,
  card: any,
  config: CardAlarmConfig
): Promise<CardAlarmConfig> {
  const cardId = card.id || card.name;
  const currentAlarms = await getCardAlarms(userId);

  if (currentAlarms[cardId]?.notificationId) {
    await cancelCardNotification(currentAlarms[cardId].notificationId);
  }

  let notificationId: string | undefined = undefined;
  if (config.enabled) {
    const scheduledId = await scheduleCardNotification(card, config);
    if (scheduledId) {
      notificationId = scheduledId;
    }
  }

  const updatedConfig: CardAlarmConfig = {
    ...config,
    cardId,
    notificationId,
    lastScheduledDate: new Date().toISOString(),
  };

  const newAlarms = {
    ...currentAlarms,
    [cardId]: updatedConfig,
  };

  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(newAlarms));
  return updatedConfig;
}

/**
 * Deletes / disables alarm for a card.
 */
export async function deleteCardAlarm(userId: string | undefined, cardId: string): Promise<void> {
  const currentAlarms = await getCardAlarms(userId);
  if (currentAlarms[cardId]?.notificationId) {
    await cancelCardNotification(currentAlarms[cardId].notificationId);
  }
  delete currentAlarms[cardId];
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(currentAlarms));
}

/**
 * Schedules a test notification to fire in 5 seconds.
 */
export async function scheduleTestNotification(cardName: string): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    return false;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💳 Test Payment Alarm: ${cardName}`,
        body: `Test reminder for ${cardName}: Business day payment alarm is working!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
        seconds: 5,
      },
    });
    return true;
  } catch (err) {
    console.warn('Error scheduling test notification:', err);
    return false;
  }
}
