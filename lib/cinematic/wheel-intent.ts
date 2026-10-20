import type { Direction } from './controller';

/** One discrete intent per wheel burst, including trackpads that start below threshold. */
export class WheelIntent {
  private lastAt = -Infinity;
  private magnitude = 0;
  private direction: Direction = 1;
  private total = 0;
  private committed = false;
  private acceptedAt = -Infinity;

  blockMomentum(now: number) {
    this.lastAt = now;
    this.total = 0;
    this.committed = true;
  }

  read(delta: number, now: number, gallery: boolean): Direction | null {
    if (!delta) return null;
    const direction = delta > 0 ? 1 : -1;
    const magnitude = Math.abs(delta);
    const fresh = now - this.lastAt > (gallery ? 80 : 180) || direction !== this.direction;
    const newPush = gallery && this.committed && now - this.acceptedAt > 140 &&
      magnitude > Math.max(24, this.magnitude * 2.5);
    if (fresh || newPush) {
      this.total = 0;
      this.committed = false;
    }
    this.lastAt = now;
    this.magnitude = magnitude;
    this.direction = direction;
    if (this.committed) return null;
    this.total += magnitude;
    if (this.total < 12) return null;
    this.committed = true;
    this.acceptedAt = now;
    return direction;
  }
}
