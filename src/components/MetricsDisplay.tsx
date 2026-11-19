import { EngineMetrics } from '../types/clicker';
import { formatCount, formatIntervalMs, formatTimer } from '../utils/format';

interface MetricsDisplayProps {
  metrics: EngineMetrics;
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const isRunning = metrics.status === 'running';
  const displayedCps = isRunning ? metrics.measuredCps : 0;

  return (
    <section aria-label="Performance Telemetry" className="flex flex-col">
      {/* Primary Center CPS Readout */}
      <div className="py-6 sm:py-8 lg:py-10 flex flex-col items-center justify-center text-center border-b border-zinc-900">
        <span className="text-xs font-medium tracking-[0.12em] uppercase text-zinc-400">
          Measured CPS
        </span>

        <div
          className={`mt-2 font-mono-tabular font-bold leading-none tracking-tight text-[clamp(3.75rem,17vw,6.25rem)] transition-colors duration-150 ${
            isRunning ? 'text-white' : 'text-zinc-200'
          }`}
        >
          {formatCount(displayedCps)}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-400 font-mono-tabular">
          <span>
            Target <span className="text-white">{formatCount(metrics.targetCps)} CPS</span>
          </span>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <span>{formatIntervalMs(metrics.targetCps)} interval</span>
          {metrics.targetCps >= 5000 && (
            <>
              <span aria-hidden="true" className="text-zinc-600">
                ·
              </span>
              <span className="text-red-500">Benchmark</span>
            </>
          )}
        </div>
      </div>

      {/* Primary Session Counters */}
      <div className="grid grid-cols-2 border-b border-zinc-900">
        <div className="py-4 pr-3 border-r border-zinc-900">
          <div className="text-xs text-zinc-400">Total Operations</div>
          <div className="mt-1 text-2xl sm:text-[1.75rem] font-semibold font-mono-tabular text-white truncate">
            {formatCount(metrics.totalOperations)}
          </div>
        </div>

        <div className="py-4 pl-4">
          <div className="text-xs text-zinc-400">Session Timer</div>
          <div className="mt-1 text-2xl sm:text-[1.75rem] font-semibold font-mono-tabular text-white">
            {formatTimer(metrics.elapsedMs)}
          </div>
        </div>
      </div>

      {/* Secondary Measured Telemetry */}
      <div className="grid grid-cols-2 border-b border-zinc-900">
        <div className="py-3.5 pr-3 border-r border-zinc-900">
          <div className="text-xs text-zinc-400">Average CPS</div>
          <div className="mt-0.5 text-base font-medium font-mono-tabular text-zinc-200">
            {formatCount(metrics.averageCps)}
          </div>
        </div>

        <div className="py-3.5 pl-4">
          <div className="text-xs text-zinc-400">Peak CPS</div>
          <div className="mt-0.5 text-base font-medium font-mono-tabular text-zinc-200">
            {formatCount(metrics.peakCps)}
          </div>
        </div>
      </div>
    </section>
  );
}
