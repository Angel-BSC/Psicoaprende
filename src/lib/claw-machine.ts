export type Capsule = { id: string; x: number; y: number; color: 0 | 1 | 2 };
export type ClawPhase = 'ready' | 'aligning' | 'lowering' | 'gripping' | 'lifting' | 'transporting' | 'dropping' | 'returning' | 'delivered' | 'opened';
export const CLAW = { size: 320, minX: 45, maxX: 275, homeX: 160, homeY: 65, gripOffset: 60, deliveryX: 160, deliveryY: 190, hatchY: 296, speed: 110, step: 24 } as const;
export const clampClawX = (value: number) => Number.isFinite(value) ? Math.max(CLAW.minX, Math.min(CLAW.maxX, value)) : CLAW.homeX;
export const isClawBusy = (phase: ClawPhase) => !['ready', 'delivered', 'opened'].includes(phase);
export function createCapsules(): Capsule[] {
  return [[65, 214], [128, 209], [192, 214], [255, 211], [50, 244], [105, 244], [160, 243], [215, 244], [270, 244], [70, 270], [250, 270]]
    .map(([x, y], i) => ({ id: `capsule-${i + 1}`, x, y, color: (i % 3) as Capsule['color'] }));
}
export function nearestCapsule(capsules: readonly Capsule[], x: number): Capsule | null {
  const position = clampClawX(x);
  // Prefer the upper capsule when horizontal distances tie. This is an assisted grab, not physics.
  return [...capsules].sort((a, b) => Math.abs(a.x - position) - Math.abs(b.x - position) || a.y - b.y)[0] ?? null;
}
export function removeCaptured(capsules: readonly Capsule[], id: string): Capsule[] {
  return capsules.filter((capsule) => capsule.id !== id);
}
export const clawMessages: Record<ClawPhase, string> = {
  ready: 'Mueve la garra y elige dónde bajar.', aligning: 'Ajustando el agarre…', lowering: 'Bajando…',
  gripping: 'Sujetando la cápsula…', lifting: 'Subiendo…', transporting: 'Llevando la cápsula a la salida…',
  dropping: 'Soltando la cápsula…', returning: 'Volviendo al riel…', delivered: '¡Cápsula lista! Tócala para abrirla.', opened: 'Cápsula abierta. ¡La recogida está completa!',
};
