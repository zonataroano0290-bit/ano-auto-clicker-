import React, { useRef } from 'react';
import { MAX_CUSTOM_CPS, MIN_CUSTOM_CPS, SPEED_PRESETS } from '../types/clicker';

interface SpeedSelectorProps {
  targetCps: number;
  isCustomMode: boolean;
  customInputValue: string;
  onSelectPreset: (cps: number) => void;
  onSelectCustomMode: () => void;
  onCustomInputChange: (rawValue: string) => void;
  onCommitCustomInput: () => void;
}

export function SpeedSelector({
  targetCps,
  isCustomMode,
  customInputValue,
  onSelectPreset,
  onSelectCustomMode,
  onCustomInputChange,
  onCommitCustomInput,
}: SpeedSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCustomButtonClick = () => {
    onSelectCustomMode();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommitCustomInput();
      inputRef.current?.blur();
    }
  };

  return (
    <section aria-label="Speed Selection" className="py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-zinc-400">
          Speed Target
        </h2>
        <span className="text-xs text-zinc-400 font-mono-tabular">
          {MIN_CUSTOM_CPS.toLocaleString()}–{MAX_CUSTOM_CPS.toLocaleString()} CPS
        </span>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2">
        {SPEED_PRESETS.map((preset) => {
          const isActive = !isCustomMode && targetCps === preset.cps;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.cps)}
              aria-pressed={isActive}
              className={`min-h-[48px] px-2 py-2 rounded-lg border text-center flex flex-col items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${
                isActive
                  ? 'border-red-500 bg-red-950/30 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span className="text-sm font-semibold font-mono-tabular whitespace-nowrap">
                {preset.cps.toLocaleString()} CPS
              </span>
              {preset.isBenchmark && (
                <span
                  className={`text-[10px] tracking-wide whitespace-nowrap mt-0.5 ${
                    isActive ? 'text-red-400' : 'text-zinc-400'
                  }`}
                >
                  Benchmark
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Speed Row */}
      <div className="mt-2.5 flex items-stretch gap-2">
        <button
          type="button"
          onClick={handleCustomButtonClick}
          aria-pressed={isCustomMode}
          className={`min-h-[44px] px-3.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${
            isCustomMode
              ? 'border-red-500 bg-red-950/30 text-white'
              : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white'
          }`}
        >
          Custom
        </button>

        <div
          className={`flex-1 flex items-center rounded-lg border bg-zinc-950 px-3 transition-colors duration-150 ${
            isCustomMode
              ? 'border-red-500/80'
              : 'border-zinc-800 focus-within:border-zinc-600'
          }`}
        >
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={MIN_CUSTOM_CPS}
            max={MAX_CUSTOM_CPS}
            step={1}
            value={customInputValue}
            onFocus={onSelectCustomMode}
            onChange={(e) => onCustomInputChange(e.target.value)}
            onBlur={onCommitCustomInput}
            onKeyDown={handleKeyDown}
            placeholder="Enter CPS"
            aria-label="Custom CPS input"
            className="w-full min-h-[44px] bg-transparent text-base font-mono-tabular text-white placeholder:text-zinc-500 focus:outline-none"
          />
          <span className="ml-2 text-xs font-mono-tabular text-zinc-400 whitespace-nowrap shrink-0">
            CPS
          </span>
        </div>
      </div>
    </section>
  );
}
