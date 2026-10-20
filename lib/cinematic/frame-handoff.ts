/** Keeps the outgoing decoded frame above the single decoder while its source changes. */
export class FrameHandoff {
  private frame: number | undefined;
  private paint = 0;
  private generation = 0;
  private visible = false;
  private blend: Animation | undefined;
  private removeFallback: (() => void) | undefined;

  constructor(
    private video: HTMLVideoElement,
    private canvas: HTMLCanvasElement,
    private poster?: HTMLImageElement,
    private incoming?: HTMLCanvasElement,
  ) {}

  private cancel() {
    this.generation++;
    if (this.frame !== undefined) this.video.cancelVideoFrameCallback(this.frame);
    this.frame = undefined;
    cancelAnimationFrame(this.paint);
    this.blend?.cancel();
    this.blend = undefined;
    if (this.incoming) this.incoming.style.opacity = '0';
    this.removeFallback?.();
    this.removeFallback = undefined;
  }

  private capture(target = this.canvas) {
    if (this.video.readyState < 2 || !this.video.videoWidth) return false;
    const context = target.getContext('2d', { alpha: false });
    if (!context) return false;
    if (target.width !== this.video.videoWidth) target.width = this.video.videoWidth;
    if (target.height !== this.video.videoHeight) target.height = this.video.videoHeight;
    context.drawImage(this.video, 0, 0);
    return true;
  }

  isShowing() {
    return this.visible;
  }

  hold() {
    this.cancel();
    // A gallery return or repeated loading gesture must keep the existing hold,
    // rather than capture an empty or stale decoder after load().
    if (this.visible && this.capture()) {
      this.canvas.dataset.frame = 'held';
      this.canvas.style.opacity = '1';
      if (this.poster) this.poster.style.opacity = '0';
    }
    this.visible = false;
    // Keep the decoder paintable. Opacity zero can defer video-frame callbacks
    // on mobile compositors; the opaque held canvas covers it during loading.
    this.video.style.opacity = '1';
  }

  prepare(start: number, blend = false) {
    const generation = this.generation;
    const source = this.video.src;
    const ready = () =>
      generation === this.generation &&
      this.video.currentSrc === source &&
      this.video.readyState >= 2 &&
      !this.video.seeking &&
      this.video.currentTime >= start - 1 / 48;
    let realigned = false;
    const reveal = () => {
      if (this.visible || !ready()) return;
      // If a browser delivers its first data/paint notification late, rewind
      // only the footage that was still covered, before exposing the decoder.
      if (!realigned && this.video.currentTime > start + 1 / 12) {
        realigned = true;
        this.video.currentTime = start;
        return;
      }
      this.cancel();
      this.visible = true;
      this.video.style.opacity = '1';
      if (this.poster) this.poster.style.opacity = '0';
      // Preserve the outgoing pixels until the incoming decoder is paintable.
      // Overwriting this hold with the next source caused the recorded pose jump.
      const dissolve = blend && this.canvas.dataset.frame === 'held' && this.incoming &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches;
      const surface = dissolve ? this.incoming! : this.canvas;
      // Paint the verified incoming first frame once before exposing the native
      // surface, whose compositor may still contain the pre-seek image.
      if (this.capture(surface)) {
        this.canvas.dataset.frame = 'presenting';
        surface.style.opacity = '1';
        const presentation = this.generation;
        this.paint = requestAnimationFrame(() => {
          this.paint = requestAnimationFrame(() => {
            if (presentation !== this.generation) return;
            if (dissolve) {
              surface.style.opacity = '0';
              // Use a half-second opacity transition only where
              // the source poses differ. No video transform or re-encoding.
              this.canvas.dataset.frame = 'blending';
              this.blend = this.canvas.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: 500, easing: 'ease', fill: 'forwards',
              });
              this.blend.onfinish = () => {
                if (presentation !== this.generation) return;
                this.canvas.style.opacity = '0';
                this.blend?.cancel();
                this.blend = undefined;
                this.canvas.dataset.frame = 'live';
                // Release the temporary full-resolution first-frame surface.
                surface.width = surface.height = 1;
              };
            } else {
              this.canvas.dataset.frame = 'live';
              this.canvas.style.opacity = '0';
            }
          });
        });
      } else {
        this.canvas.dataset.frame = 'live';
        this.canvas.style.opacity = '0';
      }
    };
    // Decoded data at the completed start seek is sufficient. Do not let a
    // delayed compositor callback hide an already-running part of the film.
    const events = ['loadeddata', 'seeked', 'playing', 'timeupdate'];
    events.forEach((event) => this.video.addEventListener(event, reveal));
    this.removeFallback = () =>
      events.forEach((event) => this.video.removeEventListener(event, reveal));
    reveal();
    if (this.visible) return;
    const inspectPaint = () => {
      this.paint = 0;
      if (generation !== this.generation) return;
      reveal();
      if (!this.visible) this.paint = requestAnimationFrame(inspectPaint);
    };
    this.paint = requestAnimationFrame(inspectPaint);
    if (typeof this.video.requestVideoFrameCallback === 'function') {
      const presented: VideoFrameRequestCallback = () => {
        this.frame = undefined;
        if (generation !== this.generation) return;
        reveal();
        if (!this.visible) this.frame = this.video.requestVideoFrameCallback(presented);
      };
      this.frame = this.video.requestVideoFrameCallback(presented);
    }
  }

  reset() {
    this.cancel();
    this.visible = false;
    this.video.style.opacity = '1';
    if (this.poster) this.poster.style.opacity = '1';
    this.canvas.dataset.frame = 'initial';
    this.canvas.style.opacity = '0';
  }

  destroy() {
    this.cancel();
    this.canvas.width = this.canvas.height = 1;
    if (this.incoming) this.incoming.width = this.incoming.height = 1;
  }
}
