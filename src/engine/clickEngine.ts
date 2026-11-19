import { DEFAULT_TARGET_CPS, EngineMetrics, EngineStatus } from '../types/clicker';

const BUCKET_COUNT = 20;
const BUCKET_MS = 50; // 20 * 50ms = 1,000ms sliding measurement window
const MAX_CATCHUP_MS = 200;
const FRAME_BUDGET_MS = 10;

export type MetricsListener = (metrics: EngineMetrics) => void;
export type OperationCallback = (operationIndex: number, timestamp: number) => void;

/**
 * Precision JavaScript execution engine with single-instance run-token protection,
 * drift-compensated timer scheduling (<= 120 CPS), frame-budgeted accumulator
 * execution (> 120 CPS up to 10,000 CPS), and O(1) 1-second rolling CPS telemetry.
 */
export class ClickExecutionEngine {
  private status: EngineStatus = 'idle';
  private pausedByBackground = false;
  private targetCps: number = DEFAULT_TARGET_CPS;
  private runToken = 0;

  private totalOperations = 0;
  private accumulatedElapsedMs = 0;
  private activeSegmentStartMs = 0;
  private nextOpTimeMs = 0;
  private peakCps = 0;

  // 1-second sliding window ring buffer (20 x 50ms buckets)
  private buckets = new Int32Array(BUCKET_COUNT);
  private lastBucketIndex = 0;

  private timeoutId: number | null = null;
  private execRafId: number | null = null;
  private uiRafId: number | null = null;

  private listeners = new Set<MetricsListener>();
  private onOperation: OperationCallback | null = null;

  public subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setOperationCallback(cb: OperationCallback | null): void {
    this.onOperation = cb;
  }

  public getTargetCps(): number {
    return this.targetCps;
  }

  public setTargetCps(cps: number): void {
    const sanitized = Math.max(1, Math.min(10000, Math.round(cps)));
    if (sanitized === this.targetCps) {
      return;
    }

    this.targetCps = sanitized;

    if (this.status === 'running') {
      // Re-anchor scheduling cleanly without spawning a duplicate loop
      this.clearExecutionTimers();
      this.runToken += 1;
      const token = this.runToken;
      this.nextOpTimeMs = performance.now() + 1000 / this.targetCps;
      this.scheduleExecutionLoop(token);
    }

    this.emitMetrics();
  }

  public start(): void {
    // Prevent duplicate execution loops if already running
    if (this.status === 'running') {
      return;
    }

    const now = performance.now();
    this.status = 'running';
    this.pausedByBackground = false;
    this.runToken += 1;
    const token = this.runToken;

    this.activeSegmentStartMs = now;
    this.nextOpTimeMs = now;
    this.syncBucketCursor(now);

    this.scheduleExecutionLoop(token);
    this.startUiSyncLoop(token);
    this.emitMetrics();
  }

  public stop(): void {
    if (this.status !== 'running') {
      return;
    }

    const now = performance.now();
    this.accumulatedElapsedMs += Math.max(0, now - this.activeSegmentStartMs);
    this.status = 'stopped';
    this.pausedByBackground = false;
    this.runToken += 1;

    this.clearAllTimers();
    this.clearExpiredBuckets(now);
    this.emitMetrics();
  }

  public pauseForBackground(): void {
    if (this.status !== 'running') {
      return;
    }

    const now = performance.now();
    this.accumulatedElapsedMs += Math.max(0, now - this.activeSegmentStartMs);
    this.status = 'stopped';
    this.pausedByBackground = true;
    this.runToken += 1;

    this.clearAllTimers();
    this.clearExpiredBuckets(now);
    this.emitMetrics();
  }

  public reset(): void {
    this.status = 'idle';
    this.pausedByBackground = false;
    this.runToken += 1;
    this.clearAllTimers();

    this.totalOperations = 0;
    this.accumulatedElapsedMs = 0;
    this.activeSegmentStartMs = 0;
    this.nextOpTimeMs = 0;
    this.peakCps = 0;
    this.buckets.fill(0);
    this.lastBucketIndex = 0;

    this.emitMetrics();
  }

  public destroy(): void {
    this.runToken += 1;
    this.status = 'idle';
    this.clearAllTimers();
    this.listeners.clear();
    this.onOperation = null;
  }

  public getMetrics(): EngineMetrics {
    const now = performance.now();
    const elapsedMs =
      this.status === 'running'
        ? this.accumulatedElapsedMs + Math.max(0, now - this.activeSegmentStartMs)
        : this.accumulatedElapsedMs;

    const measuredCps =
      this.status === 'running' ? this.computeMeasuredCps(now, elapsedMs) : 0;

    if (measuredCps > this.peakCps) {
      this.peakCps = measuredCps;
    }

    const averageCps =
      elapsedMs > 20 ? Math.round((this.totalOperations / elapsedMs) * 1000) : 0;

    return {
      status: this.status,
      pausedByBackground: this.pausedByBackground,
      targetCps: this.targetCps,
      measuredCps,
      averageCps,
      peakCps: this.peakCps,
      totalOperations: this.totalOperations,
      elapsedMs,
      intervalMs: 1000 / this.targetCps,
    };
  }

  private scheduleExecutionLoop(token: number): void {
    if (this.status !== 'running' || token !== this.runToken) {
      return;
    }

    if (this.targetCps <= 120) {
      this.runTimerTick(token);
    } else {
      this.runFrameAccumulator(token);
    }
  }

  private runTimerTick = (token: number): void => {
    if (this.status !== 'running' || token !== this.runToken) {
      return;
    }

    const now = performance.now();
    const intervalMs = 1000 / this.targetCps;

    // Prevent large runaway catch-up bursts after tab suspension
    if (now - this.nextOpTimeMs > MAX_CATCHUP_MS) {
      this.nextOpTimeMs = now;
    }

    let executed = 0;
    while (this.nextOpTimeMs <= now && executed < 64) {
      this.executeSingleOperation(now);
      this.nextOpTimeMs += intervalMs;
      executed += 1;
    }

    const delay = Math.max(0, this.nextOpTimeMs - performance.now());
    this.timeoutId = window.setTimeout(() => this.runTimerTick(token), delay);
  };

  private runFrameAccumulator = (token: number): void => {
    if (this.status !== 'running' || token !== this.runToken) {
      return;
    }

    const frameStart = performance.now();
    const intervalMs = 1000 / this.targetCps;

    if (frameStart - this.nextOpTimeMs > MAX_CATCHUP_MS) {
      this.nextOpTimeMs = frameStart;
    }

    let opsInFrame = 0;
    while (this.nextOpTimeMs <= frameStart) {
      this.executeSingleOperation(frameStart);
      this.nextOpTimeMs += intervalMs;
      opsInFrame += 1;

      if ((opsInFrame & 63) === 0 && performance.now() - frameStart >= FRAME_BUDGET_MS) {
        this.nextOpTimeMs = performance.now() + intervalMs;
        break;
      }
    }

    this.execRafId = window.requestAnimationFrame(() => this.runFrameAccumulator(token));
  };

  private startUiSyncLoop(token: number): void {
    const sync = () => {
      if (this.status !== 'running' || token !== this.runToken) {
        return;
      }
      this.emitMetrics();
      this.uiRafId = window.requestAnimationFrame(sync);
    };
    this.uiRafId = window.requestAnimationFrame(sync);
  }

  private executeSingleOperation(timestamp: number): void {
    this.totalOperations += 1;
    this.recordBucketOperation(timestamp);
    if (this.onOperation) {
      this.onOperation(this.totalOperations, timestamp);
    }
  }

  private syncBucketCursor(now: number): void {
    const currentIndex = Math.floor(now / BUCKET_MS);
    this.buckets.fill(0);
    this.lastBucketIndex = currentIndex;
  }

  private clearExpiredBuckets(now: number): void {
    const currentIndex = Math.floor(now / BUCKET_MS);
    const diff = currentIndex - this.lastBucketIndex;
    if (diff <= 0) {
      return;
    }

    if (diff >= BUCKET_COUNT) {
      this.buckets.fill(0);
    } else {
      for (let i = 1; i <= diff; i += 1) {
        this.buckets[(this.lastBucketIndex + i) % BUCKET_COUNT] = 0;
      }
    }
    this.lastBucketIndex = currentIndex;
  }

  private recordBucketOperation(now: number): void {
    this.clearExpiredBuckets(now);
    this.buckets[this.lastBucketIndex % BUCKET_COUNT] += 1;
  }

  private computeMeasuredCps(now: number, _elapsedMs: number): number {
    this.clearExpiredBuckets(now);

    let sum = 0;
    for (let i = 0; i < BUCKET_COUNT; i += 1) {
      sum += this.buckets[i];
    }

    const segmentElapsedMs = Math.max(0, now - this.activeSegmentStartMs);
    if (segmentElapsedMs < 1000) {
      const windowSec = Math.max(0.1, segmentElapsedMs / 1000);
      return Math.round(sum / windowSec);
    }

    return sum;
  }

  private clearExecutionTimers(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.execRafId !== null) {
      window.cancelAnimationFrame(this.execRafId);
      this.execRafId = null;
    }
  }

  private clearAllTimers(): void {
    this.clearExecutionTimers();
    if (this.uiRafId !== null) {
      window.cancelAnimationFrame(this.uiRafId);
      this.uiRafId = null;
    }
  }

  private emitMetrics(): void {
    const snapshot = this.getMetrics();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
