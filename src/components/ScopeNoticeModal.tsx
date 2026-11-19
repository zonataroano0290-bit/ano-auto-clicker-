import { X } from 'lucide-react';

interface ScopeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScopeNoticeModal({ isOpen, onClose }: ScopeNoticeModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scope-dialog-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-900">
          <h2 id="scope-dialog-title" className="text-sm font-semibold tracking-wide text-white">
            iOS Execution Scope &amp; Engine
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close information dialog"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
          <p>
            ANOCLIX runs a real JavaScript fixed-timestep execution engine inside this
            application and its Capacitor iOS WebView, measuring live rolling 1-second
            CPS, average CPS, peak CPS, and total operations.
          </p>
          <p className="text-zinc-200">
            <span className="text-red-500 font-semibold">iOS Sandbox Boundary:</span>{' '}
            ANOCLIX cannot inject taps into TikTok or other external iPhone applications,
            and cannot display a floating overlay above other iOS apps. It operates
            strictly within Apple&apos;s supported app capabilities.
          </p>
          <p className="text-xs text-zinc-400">
            If the app moves to the background or the iPhone locks during a run,
            execution pauses automatically and preserves your session count and timer
            until you resume.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-[46px] w-full rounded-xl bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-colors duration-150"
        >
          Close
        </button>
      </div>
    </div>
  );
}
