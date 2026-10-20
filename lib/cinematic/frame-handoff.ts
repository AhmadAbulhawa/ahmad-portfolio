/** Keeps the outgoing decoded frame above the single decoder while its source changes. */
export class FrameHandoff {
  private frame: number | undefined;
  private paint = 0;
  private generation = 0;
  private visible = false;
  private removeFallback: (() => void) | undefined;

  constructor(
    private video: HTMLVideoElement,
    private canvas: HTMLCanvasElement,
  ) {}

  private cancel() {
    this.generation++;
    if (this.frame !== undefined) this.video.cancelVideoFrameCallback(this.frame);
    this.frame = undefined;
    cancelAnimationFrame(this.paint);
    this.removeFallback?.();
    this.removeFallback = undefined;
  }

  hold() {
    this.cancel();
    // A gallery return or repeated loading gesture must keep the existing hold,
    // rather than capture an empty or stale decoder after load().
    if (this.visible && this.video.readyState >= 2 && this.video.videoWidth) {
      const context = this.canvas.getContext('2d', { alpha: false });
      if (context) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);
        this.canvas.dataset.frame = 'held';
        this.canvas.style.opacity = '1';
      }
    }
    this.visible = false;
    this.video.style.opacity = '0';
  }

  prepare(start: number) {
    const generation = this.generation;
    const source = this.video.src;
    const ready = (time: number) =>
      generation === this.generation &&
      this.video.currentSrc === source &&
      this.video.readyState >= 2 &&
      !this.video.seeking &&
      time >= start - 1 / 48;
    const reveal = () => {
      this.visible = true;
      this.video.style.opacity = '1';
      this.canvas.dataset.frame = 'live';
      this.canvas.style.opacity = '0';
    };
    if (typeof this.video.requestVideoFrameCallback === 'function') {
      const presented: VideoFrameRequestCallback = (_now, metadata) => {
        this.frame = undefined;
        if (generation !== this.generation) return;
        // loadeddata/playing can precede the seek and the first compositor frame.
        if (ready(metadata.mediaTime)) reveal();
        else this.frame = this.video.requestVideoFrameCallback(presented);
      };
      this.frame = this.video.requestVideoFrameCallback(presented);
    } else {
      // Older Safari: wait through a paint after decoded data and the start seek.
      const inspect = () => {
        if (!ready(this.video.currentTime)) return;
        cancelAnimationFrame(this.paint);
        this.paint = requestAnimationFrame(() => {
          this.paint = requestAnimationFrame(() => {
            if (!ready(this.video.currentTime)) return;
            reveal();
            this.removeFallback?.();
            this.removeFallback = undefined;
          });
        });
      };
      const events = ['loadeddata', 'seeked', 'playing', 'timeupdate'];
      events.forEach((event) => this.video.addEventListener(event, inspect));
      this.removeFallback = () =>
        events.forEach((event) => this.video.removeEventListener(event, inspect));
      inspect();
    }
  }

  reset() {
    this.cancel();
    this.visible = false;
    this.video.style.opacity = '0';
    this.canvas.dataset.frame = 'initial';
    this.canvas.style.opacity = '0';
  }

  destroy() {
    this.cancel();
    this.canvas.width = this.canvas.height = 1;
  }
}
