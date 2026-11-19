import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ClickExecutionEngine } from '../engine/clickEngine';
import { formatCount } from '../utils/format';

interface TargetPadProps {
  engine: ClickExecutionEngine;
  isRunning: boolean;
  targetCps: number;
}

export function TargetPad({ engine, isRunning, targetCps }: TargetPadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetHits, setTargetHits] = useState(0);
  const [manualTaps, setManualTaps] = useState(0);

  const targetButtonRef = useRef<HTMLButtonElement>(null);
  const engineHitsRef = useRef(0);
  const lastDomDispatchRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      engine.setOperationCallback(null);
      return;
    }

    engine.setOperationCallback((_opIndex, timestamp) => {
      engineHitsRef.current += 1;

      // Dispatch a genuine DOM click event onto the target element.
      // At very high benchmark rates (> 250 CPS), cap DOM event allocation to ~60Hz
      // while counting 100% of executed JS operations.
      const shouldDispatchDom =
        targetCps <= 250 || timestamp - lastDomDispatchRef.current >= 16;

      if (shouldDispatchDom && targetButtonRef.current) {
        lastDomDispatchRef.current = timestamp;
        targetButtonRef.current.dispatchEvent(
          new MouseEvent('click', { bubbles: false, cancelable: true })
        );
      }
    });

    return () => {
      engine.setOperationCallback(null);
    };
  }, [engine, isOpen, targetCps]);

  // Sync displayed engine hits at display refresh rate while open & running
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let rafId: number | null = null;
    const sync = () => {
      setTargetHits(engineHitsRef.current);
      if (isRunning) {
        rafId = window.requestAnimationFrame(sync);
      }
    };

    sync();
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isOpen, isRunning]);

  const handleTargetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.isTrusted) {
      setManualTaps((prev) => prev + 1);
      engineHitsRef.current += 1;
      setTargetHits(engineHitsRef.current);
    }
  };

  const handleClearTarget = () => {
    engineHitsRef.current = 0;
    setTargetHits(0);
    setManualTaps(0);
  };

  return (
    <section aria-label="In-App Target Pad" className="border-t border-zinc-900 pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full min-h-[44px] flex items-center justify-between text-left text-xs text-zinc-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-lg px-1"
      >
        <span className="font-medium tracking-[0.08em] uppercase">
          In-App Test Target
        </span>
        <span className="flex items-center gap-1.5 font-mono-tabular text-zinc-400">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2.5 pb-1 flex flex-col gap-2">
          <button
            ref={targetButtonRef}
            type="button"
            onClick={handleTargetClick}
            className={`min-h-[84px] w-full rounded-xl border px-4 py-3 flex items-center justify-between text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${
              isRunning
                ? 'border-red-500/70 bg-red-950/15 active:bg-red-950/30'
                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 active:bg-zinc-900'
            }`}
          >
            <div>
              <div className="text-xs font-medium text-zinc-300">
                Tap Target Surface
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Receives engine clicks &amp; manual taps
              </div>
            </div>

            <div className="text-right font-mono-tabular">
              <div className="text-xl font-semibold text-white">
                {formatCount(targetHits)}
              </div>
              <div className="text-[11px] text-zinc-400">
                Manual: {formatCount(manualTaps)}
              </div>
            </div>
          </button>

          {(targetHits > 0 || manualTaps > 0) && (
            <button
              type="button"
              onClick={handleClearTarget}
              className="self-end min-h-[36px] px-2 text-xs text-zinc-400 hover:text-white transition-colors duration-150"
            >
              Clear Target Count
            </button>
          )}
        </div>
      )}
    </section>
  );
}
