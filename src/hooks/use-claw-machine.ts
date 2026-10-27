import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, AppState, Easing, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createClawController, initialMotion } from '@/lib/claw-controller';
import type { ClawMotion, MotionKey } from '@/lib/claw-controller';
import { isClawBusy } from '@/lib/claw-machine';
import type { Capsule } from '@/lib/claw-machine';

function createAnimatedMotion(capsules?: Capsule[]) {
  const values = Object.fromEntries(Object.entries(initialMotion).map(([key, value]) => [key, new Animated.Value(value)])) as Record<MotionKey, Animated.Value>;
  const pending = new Set<Animated.CompositeAnimation>();
  const easing = { motor: Easing.inOut(Easing.cubic), out: Easing.out(Easing.cubic), fall: Easing.in(Easing.quad), linear: Easing.bezier(0.2, 0, 0.75, 1) };
  const adapter: ClawMotion = {
    readX: () => new Promise((resolve) => values.x.stopAnimation(resolve)),
    set: (next) => { for (const key of Object.keys(next) as MotionKey[]) values[key].setValue(next[key]!); },
    stop: (keys) => {
      if (!keys) { pending.forEach((animation) => animation.stop()); pending.clear(); }
      (keys ?? Object.keys(values) as MotionKey[]).forEach((key) => values[key].stopAnimation());
    },
    play: (tracks, reduced) => {
      if (reduced) {
        for (const { key, frames } of tracks) values[key].setValue(frames[frames.length - 1].value);
        return Promise.resolve(true);
      }
      return new Promise((resolve) => {
        const animation = Animated.parallel(tracks.map(({ key, frames }) => Animated.sequence(frames.map((frame) => Animated.timing(values[key], {
          toValue: frame.value, duration: frame.ms, easing: easing[frame.ease ?? 'motor'], useNativeDriver: Platform.OS !== 'web', isInteraction: false,
        })))));
        pending.add(animation);
        animation.start(({ finished }) => { pending.delete(animation); resolve(finished); });
      });
    },
  };
  return { values, controller: createClawController(adapter, capsules) };
}

export function useClawMachine(reducedMotion: boolean, capsules?: Capsule[]) {
  const [{ values, controller }] = useState(() => createAnimatedMotion(capsules));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.setReducedMotion(reducedMotion); }, [controller, reducedMotion]);
  useFocusEffect(useCallback(() => {
    let windowFocused = true;
    const syncActive = () => controller.setActive(Platform.OS === 'web'
      ? windowFocused && document.visibilityState !== 'hidden'
      : windowFocused && (AppState.currentState == null || AppState.currentState === 'active'));
    syncActive();
    const subscription = AppState.addEventListener('change', syncActive);
    const blur = () => { windowFocused = false; syncActive(); };
    const focus = () => { windowFocused = true; syncActive(); };
    // Android Modal takes Activity window focus while the app stays active.
    // Do not disable its own close/retry controls; real backgrounding still uses AppState change.
    const androidBlur = Platform.OS === 'android' ? AppState.addEventListener('blur', () => {
      if (controller.getSnapshot().phase !== 'opened') blur();
    }) : null;
    const androidFocus = Platform.OS === 'android' ? AppState.addEventListener('focus', focus) : null;
    if (Platform.OS === 'web') {
      window.addEventListener('blur', blur); window.addEventListener('focus', focus);
      document.addEventListener('visibilitychange', syncActive);
    }
    return () => {
      controller.setActive(false); subscription.remove(); androidBlur?.remove(); androidFocus?.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
        document.removeEventListener('visibilitychange', syncActive);
      }
    };
  }, [controller]));
  return { ...values, ...snapshot, move: controller.move, stopMove: controller.stopMove, grab: controller.grab,
    open: controller.open, next: controller.next, refill: controller.refill, busy: isClawBusy(snapshot.phase) };
}
