import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createReminderController, validReminderTime } from './reminder-controller';

export const remindersSupported = true;
const identifier = 'psico-study-daily';
const channelId = 'study-reminders';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true,
  shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
export const studyReminders = createReminderController({
  list: async () => (await Notifications.getAllScheduledNotificationsAsync()).filter((item) => item.identifier === identifier)
    .map((item) => ({ id: item.identifier, owner: String(item.content.data?.owner ?? ''),
      hour: Number(item.content.data?.hour), minute: Number(item.content.data?.minute) }))
    .map((item) => validReminderTime(item.hour, item.minute) ? item : { ...item, hour: 19, minute: 0 }),
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
  permitted: async (request) => {
    if (Platform.OS === 'android' && request) await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Hora de estudiar', importance: Notifications.AndroidImportance.DEFAULT, sound: null,
    });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain && request) permission = await Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      const channel = await Notifications.getNotificationChannelAsync(channelId);
      if (channel?.importance === Notifications.AndroidImportance.NONE) return false;
    }
    return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  },
  schedule: async (owner, hour, minute) => {
    await Notifications.scheduleNotificationAsync({ identifier,
      content: { title: 'Tu momento de estudio', body: 'Unos minutos para comprender una idea más. Continúa tu ruta en PsicoAprende.',
        data: { owner, hour, minute } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
    });
  },
});
