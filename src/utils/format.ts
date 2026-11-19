export function formatTimer(ms: number): string {
  const totalCentiseconds = Math.floor(Math.max(0, ms) / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centiseconds).padStart(2, '0');

  return `${mm}:${ss}.${cc}`;
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatIntervalMs(cps: number): string {
  const ms = 1000 / Math.max(1, cps);
  if (ms >= 10) {
    return `${ms.toFixed(1)} ms`;
  }
  if (ms >= 1) {
    return `${ms.toFixed(2)} ms`;
  }
  return `${ms.toFixed(3)} ms`;
}
