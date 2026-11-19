import { EngineStatus } from '../types/clicker';

interface ControlBarProps {
  status: EngineStatus;
  hasSessionData: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ControlBar({
  status,
  hasSessionData,
  onStart,
  onStop,
  onReset,
}: ControlBarProps) {
  const isRunning = status === 'running';
  const canReset = hasSessionData || status !== 'idle';

  return (
    <section aria-label="Execution Controls" className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onStart}
          disabled={isRunning}
          className={`min-h-[54px] rounded-xl text-sm font-semibold tracking-wider uppercase whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isRunning
              ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-200 active:bg-zinc-300'
          }`}
        >
          {status === 'stopped' ? 'Resume' : 'Start'}
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={!isRunning}
          className={`min-h-[54px] rounded-xl text-sm font-semibold tracking-wider uppercase whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            isRunning
              ? 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700'
              : 'bg-zinc-950 text-zinc-500 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          Stop
        </button>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        className={`min-h-[48px] w-full rounded-xl border text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
          canReset
            ? 'border-zinc-800 bg-black text-zinc-200 hover:border-zinc-600 hover:text-white active:bg-zinc-900'
            : 'border-zinc-900 bg-black text-zinc-600 cursor-not-allowed'
        }`}
      >
        Reset
      </button>
    </section>
  );
}
