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
export type VideoPool = {
  select(chapter: number, direction: Direction): HTMLVideoElement;
  all(): HTMLVideoElement[];
};
type FramePresentation = {
  hold(): void;
  prepare(start: number): void;
  reset(): void;
  destroy(): void;
  isShowing?(): boolean;
};
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
  private seekTarget = 0;
  private prepared: { chapter: number; direction: Direction } | undefined;
  private stopped = false;
  private listeners: Array<() => void> = [];
  private watchdog: ReturnType<typeof setInterval> | undefined;

  constructor(
    private video: HTMLVideoElement,
    private notify: (state: Snapshot) => void,
    private now = () => performance.now(),
    private frames?: FramePresentation,
    private pool?: VideoPool,
  ) {
    // Listen only to the currently selected native player. Completed films
    // stay mounted as frozen layers, but their late media events cannot
    // alter the active chapter.
    for (const element of pool?.all() ?? [video]) {
      const on = (event: string, callback: () => void) => {
        const guarded = () => {
          if (this.video === element) callback();
        };
        element.addEventListener(event, guarded);
        this.listeners.push(() => element.removeEventListener(event, guarded));
      };
      on('loadedmetadata', () => this.seekStart());
      on('loadeddata', () => { this.seekStart(); this.inspect(); });
      on('playing', () => {
        const hasFrame = this.frames?.isShowing?.() ?? element.readyState >= 2;
        if (this.active()) this.publish({ phase: hasFrame ? 'playing' : 'loading', hasFrame });
      });
      for (const event of ['timeupdate', 'pause', 'ended', 'seeked']) on(event, () => this.inspect());
      for (const event of ['waiting', 'stalled', 'error'])
        on(event, () => {
          this.inspect();
          if (this.active())
            this.publish({ phase: event === 'error' || this.progressed ? 'stalled' : 'loading' });
        });
    }
    this.reset();
  }
  private publish(patch: Partial<Snapshot>) {
    if (Object.entries(patch).every(([key, value]) => this.state[key as keyof Snapshot] === value))
      return;
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
    const target = this.seekTarget;
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
    // A delayed first-frame notification must not complete a film that has
    // advanced behind the outgoing canvas without ever becoming visible.
    if (this.frames?.isShowing && !this.frames.isShowing()) {
      if (v.paused || this.now() - this.lastProgressAt > 1800)
        this.publish({ phase: 'stalled', hasFrame: false });
      return;
    }
    const t = v.currentTime;
    if (Math.abs(t - this.lastTime) > 0.005) {
      this.progressed = true;
      this.lastTime = t;
      this.lastProgressAt = this.now();
    }
    const end = this.limit();
    const remaining = end - t;
    const frame = 1 / 24 + 0.005; // the actual originals are 24 fps
    const buffered = v.buffered;
    const bufferedToEnd = buffered.length > 0 && buffered.end(buffered.length - 1) >= end - frame;
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
      this.frames?.hold();
      this.publish({ phase: 'completed', progress: 1, hasFrame: true });
      v.pause();
      this.prepareNext();
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
  private load(chapter: number, direction: Direction, reset = false) {
    if (reset) this.frames?.reset();
    else this.frames?.hold();
    this.generation++;
    this.publish({ phase: 'transitioning' });
    this.video.pause();
    this.stopWatchdog();
    this.progressed = false;
    const warm = this.prepared?.chapter === chapter && this.prepared.direction === direction &&
      !this.video.error;
    this.lastTime = warm && Number.isFinite(this.video.currentTime) ? this.video.currentTime : 0;
    this.lastProgressAt = this.now();
    this.publish({ chapter, direction, phase: 'loading', progress: 0, hasFrame: false });
    if (!warm) this.prepareSource(chapter, direction);
    this.prepared = undefined;
    this.frames?.prepare(direction === 1 ? FILMS[chapter].start : 0);
  }
  private prepareSource(chapter: number, direction: Direction) {
    this.seekTarget = direction === 1 ? FILMS[chapter].start : 0;
    this.seekPending = this.seekTarget > 0;
    this.prepared = { chapter, direction };
    if (this.pool) {
      this.video = this.pool.select(chapter, direction);
      this.video.playbackRate = FILMS[chapter].rate;
      this.video.preload = 'auto';
      if (this.video.readyState === 0) this.video.load();
      else this.seekStart();
      return;
    }
    const file = FILMS[chapter].file;
    this.video.src = `/films/${file}${direction === -1 ? '-reverse' : ''}.mp4`;
    this.video.playbackRate = FILMS[chapter].rate;
    this.video.preload = 'auto';
    this.video.load();
  }
  private prepareNext() {
    // Reuse the same paused decoder while the completed frame stays on canvas.
    // Loading a future source never advances the public chapter or starts play.
    if (!this.frames || this.stopped) return;
    this.generation++;
    const { chapter, direction } = this.state;
    if (direction === 1) this.prepareSource(chapter < 2 ? chapter + 1 : 2, chapter < 2 ? 1 : -1);
    else this.prepareSource(chapter > 0 ? chapter - 1 : 0, chapter > 0 ? -1 : 1);
  }
  private play() {
    const generation = this.generation;
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
      if (this.state.phase === 'stalled') {
        // WebKit can report paused=false while its decoder is stationary.
        // play() alone is a no-op then. Re-arm playback in THIS user gesture.
        this.video.pause();
        this.lastProgressAt = this.now();
      }
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
      this.lastProgressAt = this.now();
      this.publish({ phase: 'loading' });
      this.play();
      return;
    }
    if (s.phase !== 'completed') return;
    if (direction === 1) {
      if (s.direction === -1) this.load(s.chapter, 1);
      else if (s.chapter < 2) this.load(s.chapter + 1, 1);
      else {
        this.frames?.hold();
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
    this.frames?.hold();
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
    this.frames?.hold();
    this.generation++;
    this.stopWatchdog();
    this.publish({ phase: 'released' });
    this.video.pause();
  }
  resume() {
    this.inspect();
    if (this.active()) {
      this.lastProgressAt = this.now();
      this.play();
    }
  }
  suspend() {
    if (this.active()) {
      this.video.pause();
      this.stopWatchdog();
    }
  }
  reset() {
    this.load(0, 1, true);
    this.video.preload = 'auto';
    this.publish({ phase: 'idle', hasFrame: false });
  }
  destroy() {
    this.stopped = true;
    this.generation++;
    this.stopWatchdog();
    this.listeners.forEach((f) => f());
    this.frames?.destroy();
    this.video.pause();
    if (!this.pool) {
      this.video.removeAttribute('src');
      this.video.load();
    }
  }
}
