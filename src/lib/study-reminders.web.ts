import { emptyReminder, ReminderState } from './reminder-controller';
export const remindersSupported = false;
export const studyReminders = {
  bind: async (_id: string | null) => {}, cancel: async () => {},
  read: async (_id: string) => ({ ...emptyReminder }),
  save: async (_id: string, _enabled: boolean, _hour: number, _minute: number): Promise<ReminderState> => {
    throw new Error('Los recordatorios locales se configuran desde la app móvil.');
  },
};
