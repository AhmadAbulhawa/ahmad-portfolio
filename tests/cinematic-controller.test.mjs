import test from 'node:test';
import assert from 'node:assert/strict';
import { CinematicController } from '../lib/cinematic/controller.ts';
class Media extends EventTarget {
  duration = 8;
  currentTime = 0;
  paused = true;
  ended = false;
  seeking = false;
  readyState = 4;
  error = null;
  buffered = { length: 1, end: () => 8 };
  calls = 0;
  loads = 0;
  pauses = 0;
  reject = false;
  play() {
    this.calls++;
    if (this.reject) return Promise.reject(Error('gesture required'));
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
  pause() {
    this.pauses++;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
  load() {
    this.loads++;
    this.duration = this.src?.includes('02-dissolve-reverse') ? 6.5 : 8;
    this.currentTime = 0;
    this.paused = true;
    this.ended = false;
    this.dispatchEvent(new Event('loadedmetadata'));
  }
  removeAttribute() {}
}
function setup() {
  let time = 0;
  const media = new Media();
  const c = new CinematicController(
    media,
    () => {},
    () => time,
  );
  return {
    c,
    media,
    tick(ms = 200) {
      time += ms;
      c.inspect();
    },
    close() {
      c.destroy();
    },
  };
}
function finish(s) {
  s.media.currentTime = 7.98;
  s.media.paused = true;
  s.tick();
  assert.equal(s.c.state.phase, 'completed');
}
test('starts at frame zero and never autoplays; repeated input cannot skip unfinished footage', () => {
  const s = setup();
  try {
    assert.equal(s.c.state.phase, 'idle');
    assert.equal(s.media.calls, 0);
    s.c.gesture(1);
    for (let i = 0; i < 10; i++) s.c.gesture(1);
    assert.equal(s.c.state.chapter, 0);
    assert.notEqual(s.c.state.phase, 'completed');
  } finally {
    s.close();
  }
});
test('missing ended/timeupdate/pause events recover on the same intentional gesture', () => {
  const s = setup();
  try {
    s.c.gesture(1);
    finish(s);
    s.c.gesture(1);
    assert.equal(s.c.state.chapter, 1);
    s.media.currentTime = 7.98;
    s.media.paused = true;
    s.c.gesture(1);
    assert.equal(s.c.state.chapter, 2);
    assert.equal(s.media.playbackRate, 1.5);
  } finally {
    s.close();
  }
});
test('buffering, an early ended event, or elapsed wall time never complete unfinished film', () => {
  const s = setup();
  try {
    s.c.gesture(1);
    s.media.currentTime = 4;
    s.media.readyState = 2;
    s.media.paused = true;
    s.media.dispatchEvent(new Event('ended'));
    s.tick(60000);
    assert.equal(s.c.state.chapter, 0);
    assert.notEqual(s.c.state.phase, 'completed');
    s.c.gesture(1);
    assert.equal(s.c.state.chapter, 0);
    assert.ok(s.media.calls >= 2);
  } finally {
    s.close();
  }
});
test('seeking near duration is not completion until an actual final sample is available', () => {
  const s = setup();
  try {
    s.c.gesture(1);
    s.media.currentTime = 7.98;
    s.media.seeking = true;
    s.tick();
    assert.notEqual(s.c.state.phase, 'completed');
    s.media.seeking = false;
    s.media.paused = true;
    s.tick();
    assert.equal(s.c.state.phase, 'completed');
  } finally {
    s.close();
  }
});
test('fully buffered last sample recovers when decoder remains unpaused and omits ended', () => {
  const s = setup();
  try {
    s.c.gesture(1);
    s.media.currentTime = 7.97;
    s.tick();
    assert.notEqual(s.c.state.phase, 'completed');
    s.tick(450);
    assert.equal(s.c.state.phase, 'completed');
  } finally {
    s.close();
  }
});
test('rejected play retries same source, even without metadata events', async () => {
  const s = setup();
  try {
    s.media.reject = true;
    s.c.gesture(1);
    await Promise.resolve();
    assert.equal(s.c.state.phase, 'stalled');
    const src = s.media.src;
    s.media.reject = false;
    s.media.readyState = 0;
    s.c.gesture(1);
    assert.equal(s.media.src, src);
    assert.equal(s.c.state.chapter, 0);
    assert.ok(s.media.calls === 2);
  } finally {
    s.close();
  }
});
test('late rejected play cannot overwrite reset or released state', async () => {
  const s = setup();
  try {
    s.media.reject = true;
    s.c.gesture(1);
    s.c.reset();
    await Promise.resolve();
    assert.equal(s.c.state.phase, 'idle');
    s.c.gesture(1);
    s.c.release();
    await Promise.resolve();
    assert.equal(s.c.state.phase, 'released');
  } finally {
    s.close();
  }
});
test('forward and reverse journey uses real reverse footage and deterministic boundaries', () => {
  const s = setup();
  try {
    for (let i = 0; i < 3; i++) {
      s.c.gesture(1);
      assert.equal(s.c.state.chapter, i);
      finish(s);
    }
    s.c.gesture(1);
    assert.equal(s.c.state.phase, 'gallery');
    s.c.reverseFromGallery();
    assert.match(s.media.src, /03-shatter-reverse/);
    for (let i = 2; i >= 0; i--) {
      assert.equal(s.c.state.chapter, i);
      s.media.currentTime = i === 1 ? 6.49 : 7.98;
      s.media.paused = true;
      s.tick();
      assert.equal(s.c.state.phase, 'completed');
      s.c.gesture(-1);
    }
    assert.equal(s.c.state.phase, 'idle');
    assert.equal(s.c.state.chapter, 0);
    assert.equal(s.media.paused, true);
  } finally {
    s.close();
  }
});
test('background and foreground preserve chapter; destroy removes observers and retries', () => {
  const s = setup();
  s.c.gesture(1);
  s.media.currentTime = 3;
  s.c.suspend();
  s.c.resume();
  assert.equal(s.c.state.chapter, 0);
  assert.equal(s.media.paused, false);
  s.close();
  const before = { ...s.c.state };
  s.media.dispatchEvent(new Event('ended'));
  s.c.gesture(1);
  assert.deepEqual(s.c.state, before);
});
test('reverse dissolve plays the entire already-trimmed asset, without a second trim', () => {
  const s = setup();
  try {
    s.c.reverseFromGallery();
    finish(s);
    s.c.gesture(-1);
    assert.equal(s.media.duration, 6.5);
    s.media.currentTime = 5.1;
    s.media.paused = true;
    s.tick();
    assert.notEqual(s.c.state.phase, 'completed');
    s.media.currentTime = 6.49;
    s.tick();
    assert.equal(s.c.state.phase, 'completed');
  } finally {
    s.close();
  }
});

test('a gesture re-arms a stationary WebKit decoder even when paused stays false', () => {
  const s = setup();
  try {
    s.c.gesture(1);
    s.media.currentTime = 3;
    s.tick();
    s.tick(1000);
    s.c.gesture(1); // ordinary gestures must not conceal missing playback progress
    s.tick(1000);
    assert.equal(s.c.state.phase, 'stalled');
    assert.equal(s.media.paused, false);
    const pauses = s.media.pauses,
      src = s.media.src;
    s.c.gesture(1);
    assert.equal(s.media.pauses, pauses + 1);
    assert.equal(s.media.currentTime, 3);
    assert.equal(s.media.src, src);
    assert.equal(s.c.state.chapter, 0);
    assert.equal(s.c.state.phase, 'playing');
  } finally {
    s.close();
  }
});
