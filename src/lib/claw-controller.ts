import { CLAW, clampClawX, createCapsules, isClawBusy, nearestCapsule, removeCaptured } from './claw-machine.ts';
import type { Capsule, ClawPhase } from './claw-machine.ts';

export const initialMotion = {
  x: CLAW.homeX as number, y: CLAW.homeY as number, grip: 0, sway: 0,
  capsuleX: CLAW.homeX as number, capsuleY: 0, capsuleScale: 1, capsuleTilt: 0,
  arrival: 0, reveal: 0, resultEntry: 0,
};
export type MotionKey = keyof typeof initialMotion;
export type MotionFrame = { value: number; ms: number; ease?: 'motor' | 'out' | 'fall' | 'linear' };
export type MotionTrack = { key: MotionKey; frames: MotionFrame[] };
export type ClawMotion = {
  readX(): Promise<number>;
  set(values: Partial<typeof initialMotion>): void;
  stop(keys?: MotionKey[]): void;
  play(tracks: MotionTrack[], reduced: boolean): Promise<boolean>;
};
export type ClawSnapshot = { phase: ClawPhase; capsules: Capsule[]; selected: Capsule | null; interrupted: boolean };
export const track = (key: MotionKey, value: number, ms: number, ease: MotionFrame['ease'] = 'motor'): MotionTrack => ({ key, frames: [{ value, ms, ease }] });
export const travelTime = (distance: number, speed = 180) => Math.abs(distance) < 0.5 ? 0 : Math.max(140, Math.min(1000, Math.abs(distance) / speed * 1000));

// A single world-space capsule stays mounted from pickup through landing.
export function capturePlan(fromX: number, target: Capsule): { phase: ClawPhase; tracks: MotionTrack[] }[] {
  const lift = target.y - CLAW.gripOffset;
  const transportMs = travelTime(CLAW.deliveryX - target.x);
  const lean = Math.sign(CLAW.deliveryX - target.x) * -2.5;
  return [
    { phase: 'aligning', tracks: [track('x', target.x, travelTime(target.x - fromX)), track('sway', 0, 160)] },
    { phase: 'lowering', tracks: [{ key: 'y', frames: [{ value: lift - 7, ms: travelTime(lift - CLAW.homeY, 200) }, { value: lift, ms: 150, ease: 'out' }] }] },
    { phase: 'gripping', tracks: [track('grip', 1, 280)] },
    { phase: 'lifting', tracks: [track('y', CLAW.homeY, 620), track('capsuleY', CLAW.homeY + CLAW.gripOffset, 620)] },
    { phase: 'transporting', tracks: [track('x', CLAW.deliveryX, transportMs), track('capsuleX', CLAW.deliveryX, transportMs),
      { key: 'sway', frames: [{ value: lean, ms: transportMs * 0.35 }, { value: 0, ms: transportMs * 0.65 }] },
      { key: 'capsuleTilt', frames: [{ value: lean, ms: transportMs * 0.35 }, { value: 0, ms: transportMs * 0.65 }] }] },
    { phase: 'transporting', tracks: [track('y', CLAW.deliveryY, 540), track('capsuleY', CLAW.deliveryY + CLAW.gripOffset, 540)] },
    { phase: 'dropping', tracks: [track('grip', 0, 220)] },
    { phase: 'dropping', tracks: [track('capsuleY', CLAW.hatchY, 260, 'fall'), track('capsuleScale', 0.75, 260), track('capsuleTilt', 5, 260)] },
    { phase: 'returning', tracks: [track('y', CLAW.homeY, 620),
      { key: 'capsuleY', frames: [{ value: CLAW.hatchY - 7, ms: 110, ease: 'out' }, { value: CLAW.hatchY, ms: 160, ease: 'fall' }] },
      { key: 'capsuleTilt', frames: [{ value: -3, ms: 130 }, { value: 0, ms: 220 }] }, track('arrival', 1, 500, 'out')] },
  ];
}

// Async callbacks must own the current ticket before changing state.
// A renderer-independent controller lets tests interrupt every stage deterministically.
export function createClawController(motion: ClawMotion, capsules: Capsule[] = createCapsules()) {
  let snapshot: ClawSnapshot = { phase: 'ready', capsules: capsules.map((item) => ({ ...item })), selected: null, interrupted: false };
  let active = false, reduced = false, generation = 0, inputVersion = 0, direction = 0;
  const listeners = new Set<() => void>();
  const update = (changes: Partial<ClawSnapshot>) => { snapshot = { ...snapshot, ...changes }; listeners.forEach((fn) => fn()); };
  const cancel = (notify = true) => {
    generation++; inputVersion++; direction = 0; motion.stop();
    if (isClawBusy(snapshot.phase)) {
      motion.set(initialMotion);
      update({ phase: 'ready', selected: null, interrupted: notify });
    } else {
      motion.set({ sway: 0 });
      if (snapshot.phase === 'opened') motion.set({ reveal: 1, resultEntry: 1 });
    }
  };
  const move = async (dir: -1 | 1, continuous: boolean) => {
    if (!active || snapshot.phase !== 'ready' || !snapshot.capsules.length) return;
    direction = dir;
    const ticket = ++inputVersion;
    const valid = () => active && inputVersion === ticket && snapshot.phase === 'ready';
    try {
      const position = await motion.readX();
      if (!valid()) return;
      const target = continuous && !reduced ? (dir < 0 ? CLAW.minX : CLAW.maxX) : clampClawX(position + dir * CLAW.step);
      const duration = travelTime(target - position, continuous ? CLAW.speed : 150);
      await motion.play([track('x', target, duration, continuous ? 'linear' : 'motor'),
        { key: 'sway', frames: [{ value: reduced ? 0 : -dir * 2, ms: duration * 0.3 }, { value: 0, ms: duration * 0.7 }] }], reduced);
      if (valid()) direction = 0;
    } catch { if (valid()) cancel(); }
  };
  const stopMove = async (dir: number) => {
    if (direction !== dir || snapshot.phase !== 'ready') return;
    direction = 0;
    const ticket = ++inputVersion;
    motion.stop(['x', 'sway']);
    try {
      const position = await motion.readX();
      if (!active || inputVersion !== ticket || snapshot.phase !== 'ready') return;
      await motion.play([track('x', clampClawX(position + (reduced ? 0 : dir * 5)), 120, 'out'), track('sway', 0, 220, 'out')], reduced);
    } catch { if (inputVersion === ticket) cancel(); }
  };
  const grab = async () => {
    if (!active || snapshot.phase !== 'ready' || !snapshot.capsules.length) return;
    const run = ++generation;
    inputVersion++; direction = 0; motion.stop(['x', 'sway']);
    update({ phase: 'aligning', interrupted: false }); // Synchronous lock before the first await.
    const valid = () => active && generation === run;
    try {
      const position = await motion.readX();
      if (!valid()) return;
      const target = nearestCapsule(snapshot.capsules, position);
      if (!target) { cancel(false); return; }
      for (const stage of capturePlan(position, target)) {
        if (!valid()) return;
        if (stage.phase === 'gripping') {
          motion.set({ capsuleX: target.x, capsuleY: target.y, capsuleScale: 1, capsuleTilt: 0, arrival: 0 });
          update({ selected: target });
        }
        update({ phase: stage.phase });
        const finished = await motion.play(stage.tracks, reduced);
        if (!valid()) return;
        if (!finished) { cancel(); return; }
      }
      update({ capsules: removeCaptured(snapshot.capsules, target.id), phase: 'delivered' });
    } catch { if (valid()) cancel(); }
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    setActive(value: boolean) { active = value; if (!value) cancel(); },
    setReducedMotion(value: boolean) {
      if (value === reduced) return;
      reduced = value;
      // Immediately stop motion; a partially collected capsule is never consumed.
      cancel();
    },
    cancel, move, stopMove, grab,
    open() {
      if (!active || snapshot.phase !== 'delivered') return;
      const run = ++generation;
      const finishReveal = () => {
        if (generation === run && snapshot.phase === 'opened') motion.set({ reveal: 1, resultEntry: 1 });
      };
      motion.set({ reveal: 0, resultEntry: 0 });
      update({ phase: 'opened' });
      void motion.play([track('resultEntry', 1, 200, 'out'), { key: 'reveal', frames: [{ value: 0, ms: 160 }, { value: 1, ms: 460, ease: 'out' }] }], reduced)
        .then((finished) => { if (!finished) finishReveal(); }).catch(finishReveal);
    },
    next() {
      if (!active || snapshot.phase !== 'opened') return;
      generation++; motion.stop(); motion.set(initialMotion);
      update({ selected: null, phase: 'ready', interrupted: false });
    },
    refill() {
      if (!active || snapshot.phase !== 'ready' || snapshot.capsules.length) return;
      motion.set(initialMotion); update({ capsules: createCapsules(), interrupted: false });
    },
  };
}
