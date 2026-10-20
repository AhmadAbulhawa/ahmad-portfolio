export type Phase =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'stalled'
  | 'completed'
  | 'transitioning'
  | 'gallery'
  | 'released';
export type Direction = 1 | -1;
export type Snapshot = {
  chapter: number;
  direction: Direction;
  phase: Phase;
  progress: number;
  hasFrame: boolean;
};
export const FILMS = [
  { file: '01-goggles-on', start: 0, rate: 1 },
  // A short breath before the first visible disappearance; no hidden playback.
  { file: '02-dissolve', start: 1.5, rate: 1 },
  { file: '03-shatter', start: 0, rate: 1.5 },
] as const;

/** Owns the only cinematic decoder. Events are hints; media time is authority. */
export class CinematicController {
  state: Snapshot = { chapter: 0, direction: 1, phase: 'idle', progress: 0, hasFrame: false };
  private generation = 0;
  private lastTime = 0;
  private lastProgressAt = 0;
  private progressed = false;
  private seekPending = false;
  private stopped = false;
  private listeners: Array<() => void> = [];
  private watchdog: ReturnType<typeof setInterval> | undefined;

  constructor(
    private video: HTMLVideoElement,
    private notify: (state: Snapshot) => void,
    private now = () => performance.now(),
  ) {
    const on = (event: string, callback: () => void) => {
      video.addEventListener(event, callback);
      this.listeners.push(() => video.removeEventListener(event, callback));
    };
    on('loadedmetadata', () => this.seekStart());
    on('loadeddata', () => {
      this.seekStart();
      this.inspect();
    });
    on('playing', () => {
      if (this.active()) this.publish({ phase: 'playing', hasFrame: video.readyState >= 2 });
    });
    for (const event of ['timeupdate', 'pause', 'ended', 'seeked']) on(event, () => this.inspect());
    for (const event of ['waiting', 'stalled', 'error'])
      on(event, () => {
        this.inspect();
        if (this.active()) this.publish({ phase: 'stalled' });
      });
    this.reset();
  }
  private publish(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch };
    this.notify(this.state);
  }
  private active() {
    return ['loading', 'playing', 'stalled'].includes(this.state.phase);
  }
  private stopWatchdog() {
    clearInterval(this.watchdog);
    this.watchdog = undefined;
  }
  private startWatchdog() {
    this.stopWatchdog();
    this.watchdog = setInterval(() => this.inspect(), 180);
  }
  private limit() {
    // Reverse assets are already trimmed before reversal by the media script.
    return this.video.duration;
  }
  private seekStart() {
    if (!this.seekPending || this.video.readyState < 1) return;
    this.seekPending = false;
    const target = this.state.direction === 1 ? FILMS[this.state.chapter].start : 0;
    if (target > 0) {
      try {
        this.video.currentTime = target;
        this.lastTime = target;
      } catch {
        this.seekPending = true;
      }
    }
  }
  /** Polls only during active playback; also called synchronously by every gesture. */
  inspect() {
    if (this.stopped || !this.active()) return;
    const v = this.video;
    this.seekStart();
    if (v.seeking || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const t = v.currentTime;
    if (t > this.lastTime + 0.005) {
      this.progressed = true;
      this.lastTime = t;
      this.lastProgressAt = this.now();
    }
    const end = this.limit();
    const remaining = end - t;
    const frame = 1 / 24 + 0.005; // the actual originals are 24 fps
    const bufferedToEnd =
      v.buffered.length > 0 && v.buffered.end(v.buffered.length - 1) >= end - frame;
    // A paused final sample is safe. A still-running decoder must either reach
    // its duration or hold a fully buffered FINAL sample; no elapsed-time skip.
    const finalSample =
      this.progressed &&
      remaining <= frame &&
      (v.ended ||
        v.paused ||
        remaining <= 0.006 ||
        (bufferedToEnd && v.readyState >= 2 && this.now() - this.lastProgressAt > 400));
    if (finalSample) {
      this.stopWatchdog();
      this.publish({ phase: 'completed', progress: 1, hasFrame: true });
      v.pause();
      return;
    }
    const start = this.state.direction === 1 ? FILMS[this.state.chapter].start : 0;
    const progress = Math.max(0, Math.min(1, (t - start) / (end - start)));
    const stalled = v.paused || (this.now() - this.lastProgressAt > 1800 && !v.seeking);
    this.publish({
      progress,
      hasFrame: v.readyState >= 2,
      phase: stalled ? 'stalled' : this.progressed ? 'playing' : 'loading',
    });
  }
  private load(chapter: number, direction: Direction) {
    this.generation++;
    this.publish({ phase: 'transitioning' });
    this.video.pause();
    this.stopWatchdog();
    this.progressed = false;
    this.lastTime = 0;
    this.lastProgressAt = this.now();
    this.seekPending = direction === 1 && FILMS[chapter].start > 0;
    this.publish({ chapter, direction, phase: 'loading', progress: 0, hasFrame: false });
    const file = FILMS[chapter].file;
    this.video.poster = `/films/${file}${direction === -1 ? '-end' : '-poster'}.jpg`;
    this.video.src = `/films/${file}${direction === -1 ? '-reverse' : ''}.mp4`;
    this.video.playbackRate = FILMS[chapter].rate;
    this.video.preload = 'auto';
    this.video.load();
  }
  private play() {
    const generation = this.generation;
    this.lastProgressAt = this.now();
    this.startWatchdog();
    // Never await metadata/canplay/seeked: play remains inside user activation.
    void this.video.play().catch(() => {
      if (!this.stopped && generation === this.generation && this.active())
        this.publish({ phase: 'stalled' });
    });
  }
  gesture(direction: Direction) {
    if (this.stopped || ['released', 'transitioning', 'gallery'].includes(this.state.phase)) return;
    this.inspect();
    if (this.active()) {
      if (this.video.error) {
        const time = this.video.currentTime;
        this.video.load();
        if (Number.isFinite(time)) {
          try {
            this.video.currentTime = time;
          } catch {
            /* metadata pending */
          }
        }
      }
      // Retry the SAME unfinished film; never queue a future chapter.
      this.play();
      return;
    }
    const s = this.state;
    if (s.phase === 'idle') {
      if (direction < 0) return;
      this.publish({ phase: 'loading' });
      this.play();
      return;
    }
    if (s.phase !== 'completed') return;
    if (direction === 1) {
      if (s.direction === -1) this.load(s.chapter, 1);
      else if (s.chapter < 2) this.load(s.chapter + 1, 1);
      else {
        this.publish({ phase: 'gallery', chapter: 3 });
        return;
      }
    } else {
      if (s.direction === 1) this.load(s.chapter, -1);
      else if (s.chapter > 0) this.load(s.chapter - 1, -1);
      else {
        this.reset();
        return;
      }
    }
    this.play();
  }
  returnToGallery() {
    this.generation++;
    this.stopWatchdog();
    this.publish({ chapter: 3, phase: 'gallery', direction: 1, progress: 1 });
    this.video.pause();
  }
  reverseFromGallery() {
    this.load(2, -1);
    this.play();
  }
  release() {
    this.generation++;
    this.stopWatchdog();
    this.publish({ phase: 'released' });
    this.video.pause();
  }
  resume() {
    this.inspect();
    if (this.active()) this.play();
  }
  suspend() {
    if (this.active()) {
      this.video.pause();
      this.stopWatchdog();
    }
  }
  reset() {
    this.load(0, 1);
    this.video.preload = 'metadata';
    this.publish({ phase: 'idle', hasFrame: false });
  }
  destroy() {
    this.stopped = true;
    this.generation++;
    this.stopWatchdog();
    this.listeners.forEach((f) => f());
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
  }
}
