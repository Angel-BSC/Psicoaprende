export const dailyGoals = [30, 50, 100, 150] as const;
export type ReadingSize = 'normal' | 'large' | 'extra';
export const readingSizes: { id: ReadingSize; label: string; scale: number }[] = [
  { id: 'normal', label: 'Normal', scale: 1 }, { id: 'large', label: 'Grande', scale: 1.15 },
  { id: 'extra', label: 'Muy grande', scale: 1.3 },
];
// Fixed, server-authoritative catalogue. No real-money purchases or random items.
export const profileItems = [
  { id: 'classic', name: 'Clásico', price: 0, background: '#ECE6F1', border: '#D3C9DF', ink: '#75618E', symbol: '' },
  { id: 'sage', name: 'Jardín de ideas', price: 30, background: '#E2EEE4', border: '#5F8067', ink: '#365745', symbol: '❧' },
  { id: 'lavender', name: 'Mente curiosa', price: 60, background: '#EEE7F4', border: '#8C70A6', ink: '#62487D', symbol: '✧' },
  { id: 'amber', name: 'Luz del conocimiento', price: 100, background: '#FFF1CE', border: '#B5842D', ink: '#79521D', symbol: '✦' },
] as const;
export type ProfileItemId = typeof profileItems[number]['id'];
export type ProfileData = {
  name: string; dailyGoal: number; readingSize: ReadingSize; roomyReading: boolean;
  equippedItem: ProfileItemId; ownedItems: string[]; coins: number;
};
export type ProfileChanges = Partial<Pick<ProfileData, 'name' | 'dailyGoal' | 'readingSize' | 'roomyReading'>>;
export const defaultProfile: ProfileData = { name: '', dailyGoal: 50, readingSize: 'normal', roomyReading: false, equippedItem: 'classic', ownedItems: ['classic'], coins: 0 };
export function validProfileChanges(value: unknown): value is ProfileChanges {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const keys = Object.keys(v);
  if (!keys.length || keys.some((key) => !['name', 'dailyGoal', 'readingSize', 'roomyReading'].includes(key))) return false;
  return (!('name' in v) || (typeof v.name === 'string' && v.name.trim().length >= 2 && v.name.trim().length <= 80 && !/[\u0000-\u001f\u007f]/.test(v.name))) &&
    (!('dailyGoal' in v) || dailyGoals.some((goal) => goal === v.dailyGoal)) &&
    (!('readingSize' in v) || readingSizes.some((size) => size.id === v.readingSize)) &&
    (!('roomyReading' in v) || typeof v.roomyReading === 'boolean');
}
export function readingMetrics(size: ReadingSize, roomy: boolean, fontSize = 16, lineHeight = fontSize * 1.5) {
  const scale = readingSizes.find((item) => item.id === size)?.scale ?? 1;
  return { fontSize: fontSize * scale, lineHeight: Math.max(lineHeight, fontSize * (roomy ? 1.8 : 1.2)) * scale,
    ...(roomy ? { letterSpacing: 0.35 } : {}) };
}
