import test from 'node:test';
import assert from 'node:assert/strict';
import { WheelIntent } from '../lib/cinematic/wheel-intent.ts';

test('a trackpad starting with tiny deltas activates as soon as intent accumulates', () => {
  const wheel = new WheelIntent();
  assert.equal(wheel.read(2, 0, false), null);
  assert.equal(wheel.read(4, 16, false), null);
  assert.equal(wheel.read(7, 32, false), 1);
  assert.equal(wheel.read(40, 48, false), null);
});
test('continuous trackpad momentum produces one project move', () => {
  const wheel = new WheelIntent();
  const intents = [20, 40, 60, 45, 32, 20, 12, 6, 2].map((delta, i) => wheel.read(delta, i * 16, true));
  assert.deepEqual(intents.filter(Boolean), [1]);
});
test('separate mouse wheel notches respond without the old 180 ms dead period', () => {
  const wheel = new WheelIntent();
  assert.deepEqual([0, 100, 200].map((time) => wheel.read(100, time, true)), [1, 1, 1]);
});
test('a deliberate reverse responds immediately during the preceding burst', () => {
  const wheel = new WheelIntent();
  assert.equal(wheel.read(80, 0, true), 1);
  assert.equal(wheel.read(-80, 40, true), -1);
});
test('completion consumes remaining film momentum and accepts the next full gesture', () => {
  const wheel = new WheelIntent();
  wheel.read(80, 0, false);
  wheel.blockMomentum(100);
  assert.equal(wheel.read(40, 120, false), null);
  assert.equal(wheel.read(4, 300, false), null);
  assert.equal(wheel.read(4, 500, false), null);
  assert.equal(wheel.read(8, 516, false), 1);
});
test('a renewed project push can interrupt a decaying trackpad tail', () => {
  const wheel = new WheelIntent();
  wheel.read(40, 0, true);
  for (let time = 16; time < 192; time += 16) wheel.read(2, time, true);
  assert.equal(wheel.read(35, 192, true), 1);
});
