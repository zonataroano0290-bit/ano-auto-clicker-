export type EngineStatus = 'idle' | 'running' | 'stopped';

export interface SpeedPreset {
  id: string;
  label: string;
  cps: number;
  isBenchmark?: boolean;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { id: '10', label: '10 CPS', cps: 10 },
  { id: '50', label: '50 CPS', cps: 50 },
  { id: '100', label: '100 CPS', cps: 100 },
  { id: '500', label: '500 CPS', cps: 500 },
  { id: '1000', label: '1,000 CPS', cps: 1000 },
  { id: '5000', label: '5,000 CPS', cps: 5000, isBenchmark: true },
];

export const DEFAULT_TARGET_CPS = 100;
export const MIN_CUSTOM_CPS = 1;
export const MAX_CUSTOM_CPS = 10000;

export interface EngineMetrics {
  status: EngineStatus;
  pausedByBackground: boolean;
  targetCps: number;
  measuredCps: number;
  averageCps: number;
  peakCps: number;
  totalOperations: number;
  elapsedMs: number;
  intervalMs: number;
}
