import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReminderController, validReminderTime } from '../../src/lib/reminder-controller.ts';
function setup() {
  const state = { entries: [], allowed: true, requested: 0, failed: false };
  const controller = createReminderController({
    list: async () => [...state.entries], cancel: async (id) => { state.entries = state.entries.filter((item) => item.id !== id); },
    permitted: async (request) => { if (request) state.requested++; return state.allowed; },
    schedule: async (owner, hour, minute) => { if (state.failed) throw new Error('OS unavailable'); state.entries.push({ id: 'daily', owner, hour, minute }); },
  });
  return { state, controller };
}
test('recordatorios: horas y minutos válidos solamente', () => {
  assert.ok(validReminderTime(0, 0)); assert.ok(validReminderTime(23, 59));
  for (const [hour, minute] of [[24, 0], [19, 60], [-1, 0], [NaN, 0], [1.5, 10]]) assert.equal(validReminderTime(hour, minute), false);
});
test('recordatorios: consultar no pide permisos; activar sí', async () => {
  const { state, controller } = setup(); await controller.bind('alice');
  assert.equal((await controller.read('alice')).enabled, false); assert.equal(state.requested, 0);
  assert.equal((await controller.save('alice', true, 20, 15)).enabled, true);
  assert.equal(state.requested, 1); assert.equal(state.entries.length, 1);
});
test('recordatorios: actualizaciones concurrentes no duplican avisos y desactivar cancela', async () => {
  const { state, controller } = setup(); await controller.bind('alice');
  await Promise.all([controller.save('alice', true, 20, 15), controller.save('alice', true, 21, 30)]);
  assert.equal(state.entries.length, 1); assert.equal(state.entries[0].hour, 21);
  assert.equal((await controller.save('alice', false, 21, 30)).enabled, false); assert.equal(state.entries.length, 0);
});
test('recordatorios: permiso denegado no programa ni muestra activado', async () => {
  const { state, controller } = setup(); await controller.bind('alice'); state.allowed = false;
  await assert.rejects(controller.save('alice', true, 20, 15), /permiso/);
  assert.equal((await controller.read('alice')).enabled, false); assert.equal(state.entries.length, 0);
});
test('recordatorios: se detectan permisos revocados y fallo del sistema', async () => {
  const { state, controller } = setup(); await controller.bind('alice'); await controller.save('alice', true, 20, 15);
  state.allowed = false; assert.equal((await controller.read('alice')).blocked, true);
  state.allowed = true; state.failed = true;
  await assert.rejects(controller.save('alice', true, 22, 0), /OS unavailable/);
  assert.equal((await controller.read('alice')).enabled, false);
});
test('recordatorios: cambiar de cuenta y cerrar sesión cancelan los avisos anteriores', async () => {
  const { state, controller } = setup(); await controller.bind('alice'); await controller.save('alice', true, 20, 15);
  await controller.bind('bob'); assert.equal(state.entries.length, 0);
  await assert.rejects(controller.save('alice', true, 20, 15), /sesión cambió/);
  await controller.save('bob', true, 19, 0); await controller.bind(null); assert.equal(state.entries.length, 0);
});
test('recordatorios: cerrar sesión mientras se pide permiso impide programar', async () => {
  let resolvePermission, prompted;
  const asking = new Promise((resolve) => { prompted = resolve; });
  let scheduled = false;
  const controller = createReminderController({ list: async () => [], cancel: async () => {},
    permitted: async () => { prompted(); return new Promise((resolve) => { resolvePermission = resolve; }); },
    schedule: async () => { scheduled = true; },
  });
  await controller.bind('alice'); const saving = controller.save('alice', true, 19, 0);
  await asking; const exiting = controller.bind(null); resolvePermission(true);
  await assert.rejects(saving, /sesión cambió/); await exiting; assert.equal(scheduled, false);
});
