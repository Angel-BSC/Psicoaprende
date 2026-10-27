import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capturePlan, createClawController, initialMotion, travelTime } from '../../src/lib/claw-controller.ts';
import { CLAW, createCapsules, nearestCapsule } from '../../src/lib/claw-machine.ts';

const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// No timers or UI dependencies: tests choose exactly which animation callback fires.
function fixture({ auto = false, settleOnStop = true, deferReads = false, capsules } = {}) {
  const values = { ...initialMotion }, plays = [], reads = [], stops = [], sets = [];
  const fake = { auto, deferReads };
  const finish = (entry, result = true) => {
    assert.ok(entry && !entry.done, 'expected an outstanding animation');
    entry.done = true;
    if (result && !entry.stopped) for (const track of entry.tracks) values[track.key] = track.frames.at(-1).value;
    entry.resolve(result);
  };
  const reject = (entry) => {
    assert.ok(entry && !entry.done, 'expected an outstanding animation');
    entry.done = true; entry.reject(new Error('synthetic animation failure'));
  };
  const motion = {
    readX() {
      const pending = deferred(); reads.push(pending);
      if (!fake.deferReads) pending.resolve(values.x);
      return pending.promise;
    },
    set(patch) { sets.push({ ...patch }); Object.assign(values, patch); },
    stop(keys) {
      stops.push(keys ? [...keys] : undefined);
      for (const entry of plays) {
        if (entry.done || (keys && !entry.tracks.some((track) => keys.includes(track.key)))) continue;
        entry.stopped = true;
        if (settleOnStop) finish(entry, false);
      }
    },
    play(tracks, reduced) {
      const pending = { ...deferred(), tracks: structuredClone(tracks), reduced, done: false, stopped: false };
      plays.push(pending);
      if (fake.auto) finish(pending);
      return pending.promise;
    },
  };
  const controller = createClawController(motion, capsules);
  controller.setActive(true);
  return { controller, fake, values, plays, reads, stops, sets, finish, reject,
    pending: () => plays.find((entry) => !entry.done && !entry.stopped) };
}

test('controller: capture locks synchronously, consumes once, opens and resets cleanly', async () => {
  const f = fixture(), before = f.controller.getSnapshot();
  const phases = [];
  const unsubscribe = f.controller.subscribe(() => phases.push(f.controller.getSnapshot().phase));
  const capture = f.controller.grab();
  assert.equal(f.controller.getSnapshot().phase, 'aligning');
  await f.controller.grab();
  await flush();
  assert.equal(f.reads.length, 1);
  for (let i = 0; i < 9; i++) { f.finish(f.pending()); await flush(); }
  await capture;
  const delivered = f.controller.getSnapshot();
  assert.equal(delivered.phase, 'delivered'); assert.equal(delivered.capsules.length, 10);
  assert.ok(delivered.selected); assert.ok(!delivered.capsules.some((c) => c.id === delivered.selected.id));
  assert.equal(before.capsules.length, 11, 'earlier snapshots remain immutable');
  assert.equal(f.values.capsuleY, CLAW.hatchY); assert.equal(f.values.capsuleScale, 0.75);
  assert.equal(f.values.y, CLAW.homeY);
  await f.controller.grab(); assert.equal(f.plays.length, 9);
  f.controller.open(); f.controller.open();
  assert.equal(f.controller.getSnapshot().phase, 'opened'); assert.equal(f.plays.length, 10);
  f.finish(f.pending()); await flush();
  assert.equal(f.values.reveal, 1); assert.equal(f.values.resultEntry, 1);
  f.controller.next(); assert.equal(f.controller.getSnapshot().phase, 'ready');
  assert.equal(f.controller.getSnapshot().selected, null); assert.deepEqual(f.values, initialMotion);
  unsubscribe();
  assert.ok(phases.includes('gripping') && phases.includes('returning'));
});

for (let stageIndex = 0; stageIndex < 9; stageIndex++) {
  test(`controller: cancelling capture stage ${stageIndex + 1} preserves every capsule`, async () => {
    const f = fixture(), capture = f.controller.grab();
    await flush();
    for (let i = 0; i < stageIndex; i++) { f.finish(f.pending()); await flush(); }
    const target = nearestCapsule(createCapsules(), CLAW.homeX);
    assert.equal(f.controller.getSnapshot().phase, capturePlan(CLAW.homeX, target)[stageIndex].phase);
    f.controller.cancel(); await capture;
    assert.equal(f.controller.getSnapshot().phase, 'ready');
    assert.equal(f.controller.getSnapshot().interrupted, true);
    assert.equal(f.controller.getSnapshot().selected, null);
    assert.deepEqual(f.controller.getSnapshot().capsules, createCapsules());
    assert.deepEqual(f.values, initialMotion);
    assert.equal(f.plays.length, stageIndex + 1, 'cancelled run must not schedule another stage');
  });
}

test('controller: late completion from a cancelled run cannot touch its replacement', async () => {
  const f = fixture({ settleOnStop: false });
  const oldCapture = f.controller.grab(); await flush();
  const oldAnimation = f.pending();
  f.controller.cancel();
  const replacement = f.controller.grab(); await flush();
  const newAnimation = f.pending(), snapshot = f.controller.getSnapshot();
  f.finish(oldAnimation, true); await oldCapture;
  assert.equal(f.controller.getSnapshot(), snapshot);
  assert.equal(f.pending(), newAnimation);
  for (let i = 0; i < 9; i++) { f.finish(f.pending()); await flush(); }
  await replacement;
  assert.equal(f.controller.getSnapshot().phase, 'delivered');
  assert.equal(f.controller.getSnapshot().capsules.length, 10);
});

for (const failure of ['false', 'reject']) {
  test(`controller: capture adapter ${failure} restores a retryable state`, async () => {
    const f = fixture(), capture = f.controller.grab(); await flush();
    for (let i = 0; i < 3; i++) { f.finish(f.pending()); await flush(); }
    if (failure === 'false') f.finish(f.pending(), false); else f.reject(f.pending());
    await capture;
    assert.equal(f.controller.getSnapshot().phase, 'ready');
    assert.equal(f.controller.getSnapshot().interrupted, true);
    assert.equal(f.controller.getSnapshot().selected, null);
    assert.equal(f.controller.getSnapshot().capsules.length, 11);
    assert.deepEqual(f.values, initialMotion);
    f.fake.auto = true; await f.controller.grab();
    assert.equal(f.controller.getSnapshot().phase, 'delivered');
    assert.equal(f.controller.getSnapshot().capsules.length, 10);
  });
}

test('controller: failed position read recovers without consuming inventory', async () => {
  const f = fixture({ deferReads: true });
  const capture = f.controller.grab(); f.reads[0].reject(new Error('read failed')); await capture;
  assert.equal(f.controller.getSnapshot().phase, 'ready');
  assert.equal(f.controller.getSnapshot().capsules.length, 11);
  assert.equal(f.controller.getSnapshot().interrupted, true); assert.equal(f.plays.length, 0);
});

test('controller: reduced motion completes the same capture and opening without animated tracks', async () => {
  const f = fixture({ auto: true }); f.controller.setReducedMotion(true);
  await f.controller.grab(); f.controller.open(); await flush();
  assert.equal(f.controller.getSnapshot().phase, 'opened');
  assert.equal(f.controller.getSnapshot().capsules.length, 10);
  assert.ok(f.plays.every((play) => play.reduced));
  assert.equal(f.values.capsuleY, CLAW.hatchY); assert.equal(f.values.reveal, 1);
});

test('controller: switching reduced motion during pickup cancels safely and applies to retry', async () => {
  const f = fixture(), capture = f.controller.grab(); await flush();
  for (let i = 0; i < 3; i++) { f.finish(f.pending()); await flush(); }
  assert.ok(f.controller.getSnapshot().selected);
  f.controller.setReducedMotion(true); await capture;
  assert.equal(f.controller.getSnapshot().phase, 'ready');
  assert.equal(f.controller.getSnapshot().capsules.length, 11);
  assert.deepEqual(f.values, initialMotion);
  const previous = f.plays.length; f.fake.auto = true; await f.controller.grab();
  assert.ok(f.plays.slice(previous).every((play) => play.reduced));
  f.controller.open(); await flush();
  f.controller.setReducedMotion(false);
  assert.equal(f.controller.getSnapshot().phase, 'opened');
  assert.equal(f.values.reveal, 1); assert.equal(f.values.resultEntry, 1);
});

test('controller: stale movement reads cannot override a newer direction', async () => {
  const f = fixture({ deferReads: true });
  const left = f.controller.move(-1, true), right = f.controller.move(1, false);
  f.reads[0].resolve(160); await left;
  assert.equal(f.plays.length, 0);
  f.reads[1].resolve(160); await flush();
  assert.equal(f.plays.length, 1);
  assert.equal(f.pending().tracks.find((track) => track.key === 'x').frames.at(-1).value, 160 + CLAW.step);
  f.finish(f.pending()); await right;
});

test('controller: releasing input invalidates its read and applies only bounded braking', async () => {
  const f = fixture({ deferReads: true });
  const move = f.controller.move(1, true), release = f.controller.stopMove(1);
  f.reads[0].resolve(CLAW.maxX - 1); await move;
  assert.equal(f.plays.length, 0);
  f.reads[1].resolve(CLAW.maxX - 1); await flush();
  assert.equal(f.pending().tracks.find((track) => track.key === 'x').frames.at(-1).value, CLAW.maxX);
  f.finish(f.pending()); await release;
  assert.ok(f.values.x <= CLAW.maxX);
});

test('controller: capture invalidates pending manual input', async () => {
  const f = fixture({ deferReads: true, auto: true });
  const move = f.controller.move(-1, true), capture = f.controller.grab();
  f.reads[0].resolve(160); await move;
  assert.equal(f.plays.length, 0);
  f.reads[1].resolve(160); await capture;
  assert.equal(f.plays.length, 9); assert.equal(f.controller.getSnapshot().phase, 'delivered');
});

test('controller: inactive state rejects input, cancels in-flight reads and resumes safely', async () => {
  const f = fixture({ deferReads: true });
  const move = f.controller.move(1, true);
  f.controller.setActive(false); f.reads[0].resolve(160); await move;
  await f.controller.move(-1, false); await f.controller.grab();
  f.controller.open(); f.controller.next(); f.controller.refill();
  assert.equal(f.plays.length, 0); assert.equal(f.reads.length, 1);
  assert.equal(f.controller.getSnapshot().phase, 'ready');
  assert.equal(f.controller.getSnapshot().capsules.length, 11);
  f.controller.setActive(true); f.fake.deferReads = false; f.fake.auto = true;
  await f.controller.grab(); assert.equal(f.controller.getSnapshot().phase, 'delivered');
  f.controller.setActive(false); f.controller.open();
  assert.equal(f.controller.getSnapshot().phase, 'delivered');
});

test('controller: eleven unique captures exhaust inventory and refill starts another cycle', async () => {
  const f = fixture({ auto: true }), captured = new Set();
  f.controller.refill(); assert.equal(f.controller.getSnapshot().capsules.length, 11);
  for (let i = 0; i < 11; i++) {
    await f.controller.grab();
    const state = f.controller.getSnapshot();
    assert.equal(state.phase, 'delivered'); assert.equal(state.capsules.length, 10 - i);
    assert.ok(!captured.has(state.selected.id)); captured.add(state.selected.id);
    f.controller.refill(); assert.equal(f.controller.getSnapshot().capsules.length, 10 - i);
    f.controller.open(); f.controller.next();
  }
  assert.equal(captured.size, 11);
  const playCount = f.plays.length;
  await f.controller.grab(); await f.controller.move(1, true);
  assert.equal(f.plays.length, playCount); assert.equal(f.controller.getSnapshot().phase, 'ready');
  f.controller.refill();
  assert.deepEqual(f.controller.getSnapshot().capsules, createCapsules()); assert.deepEqual(f.values, initialMotion);
  await f.controller.grab(); assert.equal(f.controller.getSnapshot().capsules.length, 10);
});

test('capture plan: capsule follows the claw continuously, then lands at a stable size and position', () => {
  for (const target of createCapsules()) {
    const plan = capturePlan(CLAW.homeX, target);
    const position = { ...initialMotion, capsuleX: target.x, capsuleY: target.y };
    for (const stage of plan) {
      const byKey = Object.fromEntries(stage.tracks.map((track) => [track.key, track]));
      if (byKey.y && byKey.capsuleY && stage.phase !== 'returning') {
        assert.equal(position.capsuleY - position.y, CLAW.gripOffset);
        assert.equal(byKey.capsuleY.frames.at(-1).value - byKey.y.frames.at(-1).value, CLAW.gripOffset);
        assert.deepEqual(byKey.capsuleY.frames.map((frame) => frame.ms), byKey.y.frames.map((frame) => frame.ms));
      }
      if (byKey.x && byKey.capsuleX) assert.deepEqual(byKey.x.frames, byKey.capsuleX.frames);
      if (stage.phase === 'dropping' && byKey.capsuleY) {
        assert.equal(position.capsuleY, CLAW.deliveryY + CLAW.gripOffset);
        assert.ok(byKey.capsuleY.frames[0].value > position.capsuleY);
        assert.equal(byKey.capsuleY.frames[0].ease, 'fall');
        assert.equal(byKey.capsuleScale.frames.at(-1).value, 0.75);
      }
      for (const track of stage.tracks) {
        assert.ok(track.frames.every((frame) => Number.isFinite(frame.value) && frame.ms >= 0));
        position[track.key] = track.frames.at(-1).value;
      }
    }
    assert.equal(position.capsuleX, CLAW.deliveryX); assert.equal(position.capsuleY, CLAW.hatchY);
    assert.equal(position.capsuleScale, 0.75); assert.equal(position.capsuleTilt, 0);
    assert.equal(position.y, CLAW.homeY);
  }
});

test('travel timing: stationary tracks take no time and larger distances remain bounded', () => {
  assert.equal(travelTime(0), 0); assert.equal(travelTime(0.1), 0);
  assert.equal(travelTime(1), 140); assert.equal(travelTime(-80), travelTime(80));
  assert.ok(travelTime(80) > travelTime(30)); assert.equal(travelTime(10000), 1000);
});

test('controller: opening animation failure still exposes its completed result', async () => {
  const f = fixture({ auto: true }); await f.controller.grab();
  f.fake.auto = false; f.controller.open(); f.finish(f.pending(), false); await flush();
  assert.equal(f.controller.getSnapshot().phase, 'opened');
  assert.equal(f.values.reveal, 1); assert.equal(f.values.resultEntry, 1);
});

test('controller: old opening rejection cannot reveal a newer capsule early', async () => {
  const f = fixture({ auto: true, settleOnStop: false }); await f.controller.grab();
  f.fake.auto = false; f.controller.open(); const previousOpening = f.pending();
  f.controller.next(); f.fake.auto = true; await f.controller.grab();
  f.fake.auto = false; f.controller.open();
  const newOpening = f.pending();
  f.reject(previousOpening); await flush();
  assert.equal(f.values.reveal, 0); assert.equal(f.values.resultEntry, 0);
  assert.equal(f.pending(), newOpening);
  f.finish(newOpening); await flush();
  assert.equal(f.values.reveal, 1);
});

test('controller: uses server inventory IDs, positions and colors without mutating its input', async () => {
  const capsules = [{ id: 'server-capsule', x: 70, y: 214, color: 2, rarity: 'legendaria' }];
  const f = fixture({ auto: true, capsules });
  assert.deepEqual(f.controller.getSnapshot().capsules, capsules);
  await f.controller.grab();
  assert.deepEqual(f.controller.getSnapshot().selected, capsules[0]);
  assert.equal(f.controller.getSnapshot().capsules.length, 0); assert.equal(capsules.length, 1);
});
