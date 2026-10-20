/**
 * Stable cinematic media deck. Keeps the ORIGINAL forward video elements
 * mounted, so switching chapters never reassigns an existing decoder's src.
 * A completed scene holds its actual last decoded frame directly in its own
 * video element; no canvas, bitmap scaling, or re-seek-to-start flash.
 *
 * Reverse videos are not given an src until a reverse chapter is requested,
 * keeping iOS decoder/memory pressure similar to a single player.
 */
export class StableFilmDeck {
  private selected: HTMLVideoElement;
  private visible: HTMLVideoElement | null = null;
  private clearReady: (() => void) | null = null;
  private ready = false;
  private generation = 0;

  constructor(
    private readonly videos: HTMLVideoElement[],
    private readonly poster?: HTMLImageElement,
  ) {
    if (videos.length !== 6) throw Error('Expected three original and three reverse films');
    this.selected = videos[0];
    this.videos.forEach((v, i) => {
      v.style.opacity = '0';
      v.style.zIndex = '1';
      v.style.pointerEvents = 'none';
      v.classList.toggle('film-video', i === 0);
    });
  }
  all() { return this.videos; }
  select(chapter: number, direction: 1 | -1) {
    const v = this.videos[chapter + (direction === -1 ? 3 : 0)];
    if (!v) throw Error('Unsupported cinematic chapter');
    if (!v.getAttribute('src') && v.dataset.src) {
      // Lazy source binding ONLY for reverse playback.
      v.src = v.dataset.src;
    }
    this.selected = v;
    this.ready = v === this.visible && v.readyState >= 2;
    this.videos.forEach(clip => clip.classList.toggle('film-video', clip === v));
    return v;
  }
  private cancel() {
    this.generation++;
    this.clearReady?.();
    this.clearReady = null;
  }
  isShowing() { return this.ready && this.selected === this.visible; }
  hold() {
    this.cancel();
    this.ready = false;
    // Current visible native video remains frozen and pixel-aligned.
    // Do not draw a 1080p snapshot into a differently-sized canvas.
  }
  prepare(start: number) {
    this.cancel();
    const generation = this.generation;
    const incoming = this.selected;
    const show = () => {
      if (generation !== this.generation) return;
      if (incoming.readyState < 2 || incoming.seeking ||
          !Number.isFinite(incoming.currentTime) ||
          incoming.currentTime + 1 / 24 < start) return;
      this.cancel();
      // Every layer shares EXACTLY the same CSS geometry / object-position.
      // Replacing the source of a live compositor surface is never necessary.
      for (const v of this.videos) {
        v.style.opacity = v === incoming ? '1' : '0';
        v.style.zIndex = v === incoming ? '2' : '1';
      }
      this.visible = incoming;
      this.ready = true;
      if (this.poster) this.poster.style.opacity = '0';
    };
    const events = ['loadeddata', 'seeked', 'playing', 'timeupdate'] as const;
    for (const event of events) incoming.addEventListener(event, show);
    this.clearReady = () => {
      for (const event of events) incoming.removeEventListener(event, show);
    };
    show();
  }
  reset() {
    this.cancel();
    this.ready = false;
    this.visible = null;
    this.videos.forEach(v => { v.style.opacity = '0'; v.style.zIndex = '1'; });
    if (this.poster) this.poster.style.opacity = '1';
  }
  destroy() {
    this.cancel();
    this.videos.forEach(v => {
      v.pause();
      v.style.opacity = '0';
    });
  }
}
