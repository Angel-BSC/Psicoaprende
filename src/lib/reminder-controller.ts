export type ReminderState = { enabled: boolean; hour: number; minute: number; blocked: boolean };
export type PendingReminder = { id: string; owner: string; hour: number; minute: number };
export type ReminderAdapter = {
  list: () => Promise<PendingReminder[]>; cancel: (id: string) => Promise<void>;
  permitted: (request: boolean) => Promise<boolean>; schedule: (owner: string, hour: number, minute: number) => Promise<void>;
};
export const emptyReminder: ReminderState = { enabled: false, hour: 19, minute: 0, blocked: false };
export function validReminderTime(hour: number, minute: number) {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 && Number.isInteger(minute) && minute >= 0 && minute <= 59;
}
export function createReminderController(adapter: ReminderAdapter) {
  let owner: string | null = null;
  let chain: Promise<unknown> = Promise.resolve();
  function queue<T>(work: () => Promise<T>): Promise<T> {
    const result = chain.then(work); chain = result.catch(() => undefined); return result;
  }
  const ensureOwner = (id: string) => { if (owner !== id) throw new Error('La sesión cambió. Vuelve a abrir tu perfil.'); };
  const clear = async () => { for (const item of await adapter.list()) await adapter.cancel(item.id); };
  const read = async (id: string): Promise<ReminderState> => {
    ensureOwner(id);
    const item = (await adapter.list()).find((item) => item.owner === id);
    if (!item) return { ...emptyReminder };
    const permitted = await adapter.permitted(false);
    return { enabled: permitted, hour: item.hour, minute: item.minute, blocked: !permitted };
  };
  return {
    bind(id: string | null) {
      owner = id; // Invalidate an in-flight permission prompt immediately.
      return queue(async () => {
        for (const item of await adapter.list()) if (item.owner !== owner) await adapter.cancel(item.id);
      });
    },
    read: (id: string) => queue(() => read(id)),
    cancel: () => queue(clear),
    save: (id: string, enabled: boolean, hour: number, minute: number) => queue(async () => {
      ensureOwner(id);
      if (!validReminderTime(hour, minute)) throw new Error('Usa una hora de 00 a 23 y minutos de 00 a 59.');
      if (enabled && !await adapter.permitted(true)) throw new Error('No se concedió permiso. Puedes habilitar las notificaciones en los ajustes del teléfono.');
      ensureOwner(id);
      await clear();
      if (enabled) { ensureOwner(id); await adapter.schedule(id, hour, minute); }
      return read(id);
    }),
  };
}
