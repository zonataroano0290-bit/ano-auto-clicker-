import { Info } from 'lucide-react';
import { EngineStatus } from '../types/clicker';

interface HeaderProps {
  status: EngineStatus;
  pausedByBackground: boolean;
  onOpenScopeInfo: () => void;
}

export function Header({ status, pausedByBackground, onOpenScopeInfo }: HeaderProps) {
  const statusLabel =
    status === 'running'
      ? 'Running'
      : status === 'stopped'
        ? pausedByBackground
          ? 'Paused'
          : 'Stopped'
        : 'Ready';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-4">
      <div className="flex items-center gap-3 shrink-0">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="4"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <line x1="12" y1="5" x2="12" y2="8.5" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="12" y1="15.5" x2="12" y2="19" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="5" y1="12" x2="8.5" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="15.5" y1="12" x2="19" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="10.5" y="10.5" width="3" height="3" fill="#EF4444" />
        </svg>
        <span className="text-lg font-bold tracking-[0.16em] text-white whitespace-nowrap shrink-0">
          ANOCLIX
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            status === 'running' ? 'text-red-500' : 'text-zinc-400'
          }`}
        >
          {statusLabel}
        </span>

        <button
          type="button"
          onClick={onOpenScopeInfo}
          aria-label="Platform scope and iOS information"
          className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors duration-150"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
