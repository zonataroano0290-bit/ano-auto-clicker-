import { useCallback, useEffect, useRef, useState } from 'react';
import { ControlBar } from './components/ControlBar';
import { Header } from './components/Header';
import { MetricsDisplay } from './components/MetricsDisplay';
import { ScopeNoticeModal } from './components/ScopeNoticeModal';
import { SpeedSelector } from './components/SpeedSelector';
import { TargetPad } from './components/TargetPad';
import { ClickExecutionEngine } from './engine/clickEngine';
import { initNativeIosDisplay, subscribeAppLifecycle } from './native/iosBridge';
import {
  DEFAULT_TARGET_CPS,
  EngineMetrics,
  MAX_CUSTOM_CPS,
  MIN_CUSTOM_CPS,
} from './types/clicker';

const INITIAL_METRICS: EngineMetrics = {
  status: 'idle',
  pausedByBackground: false,
  targetCps: DEFAULT_TARGET_CPS,
  measuredCps: 0,
  averageCps: 0,
  peakCps: 0,
  totalOperations: 0,
  elapsedMs: 0,
  intervalMs: 1000 / DEFAULT_TARGET_CPS,
};

export default function App() {
  const engineRef = useRef<ClickExecutionEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new ClickExecutionEngine();
  }

  const [metrics, setMetrics] = useState<EngineMetrics>(INITIAL_METRICS);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('250');
  const [isScopeOpen, setIsScopeOpen] = useState(false);

  useEffect(() => {
    const engine = engineRef.current!;
    const unsubscribeMetrics = engine.subscribe(setMetrics);

    void initNativeIosDisplay();

    const unsubscribeLifecycle = subscribeAppLifecycle({
      onBackground: () => {
        engine.pauseForBackground();
      },
      onForeground: () => {
        // Session state, speed preset, operation count, and timer remain preserved
        // until the user explicitly taps Resume or Reset.
      },
    });

    return () => {
      unsubscribeLifecycle();
      unsubscribeMetrics();
      engine.destroy();
    };
  }, []);

  const handleSelectPreset = useCallback((cps: number) => {
    setIsCustomMode(false);
    engineRef.current?.setTargetCps(cps);
  }, []);

  const handleSelectCustomMode = useCallback(() => {
    setIsCustomMode(true);
    const parsed = Number.parseInt(customInputValue, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(MIN_CUSTOM_CPS, Math.min(MAX_CUSTOM_CPS, parsed));
      engineRef.current?.setTargetCps(clamped);
    }
  }, [customInputValue]);

  const handleCustomInputChange = useCallback((rawValue: string) => {
    setIsCustomMode(true);
    setCustomInputValue(rawValue);

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_CPS && parsed <= MAX_CUSTOM_CPS) {
      engineRef.current?.setTargetCps(parsed);
    }
  }, []);

  const handleCommitCustomInput = useCallback(() => {
    const parsed = Number.parseInt(customInputValue, 10);
    const fallback = engineRef.current?.getTargetCps() ?? DEFAULT_TARGET_CPS;
    const clamped = Number.isNaN(parsed)
      ? fallback
      : Math.max(MIN_CUSTOM_CPS, Math.min(MAX_CUSTOM_CPS, parsed));

    setCustomInputValue(String(clamped));
    engineRef.current?.setTargetCps(clamped);
  }, [customInputValue]);

  const handleStart = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const hasSessionData = metrics.totalOperations > 0 || metrics.elapsedMs > 0;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Header
          status={metrics.status}
          pausedByBackground={metrics.pausedByBackground}
          onOpenScopeInfo={() => setIsScopeOpen(true)}
        />

        <main className="flex-1 flex flex-col justify-between lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center lg:py-8">
          {/* Left / Center Telemetry Focal Column */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <MetricsDisplay metrics={metrics} />
            <TargetPad
              engine={engineRef.current}
              isRunning={metrics.status === 'running'}
              targetCps={metrics.targetCps}
            />
          </div>

          {/* Right / Bottom Thumb-Zone Controls Column */}
          <div className="lg:col-span-5 flex flex-col justify-end lg:justify-center lg:border lg:border-zinc-900 lg:rounded-2xl lg:p-6">
            <SpeedSelector
              targetCps={metrics.targetCps}
              isCustomMode={isCustomMode}
              customInputValue={customInputValue}
              onSelectPreset={handleSelectPreset}
              onSelectCustomMode={handleSelectCustomMode}
              onCustomInputChange={handleCustomInputChange}
              onCommitCustomInput={handleCommitCustomInput}
            />

            <div className="pt-2 pb-4 lg:pb-0">
              <ControlBar
                status={metrics.status}
                hasSessionData={hasSessionData}
                onStart={handleStart}
                onStop={handleStop}
                onReset={handleReset}
              />
            </div>
          </div>
        </main>

        <footer className="pt-3 border-t border-zinc-900 text-center lg:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-400">
          <p>
            In-app web execution only. Does not control TikTok or external iPhone apps.
          </p>
          <button
            type="button"
            onClick={() => setIsScopeOpen(true)}
            className="text-zinc-300 hover:text-white underline underline-offset-4 self-center sm:self-auto whitespace-nowrap py-1"
          >
            iOS Scope Details
          </button>
        </footer>
      </div>

      <ScopeNoticeModal
        isOpen={isScopeOpen}
        onClose={() => setIsScopeOpen(false)}
      />
    </div>
  );
}
