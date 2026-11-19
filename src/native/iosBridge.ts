import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface LifecycleHandlers {
  onBackground: () => void;
  onForeground: () => void;
}

/**
 * Configures native iOS status bar and splash screen presentation when running
 * inside Capacitor WKWebView. Safe no-op in standard web browsers.
 */
export async function initNativeIosDisplay(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Ignore on platforms or OS versions where StatusBar options are unsupported
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 150 });
  } catch {
    // SplashScreen may already be hidden
  }
}

/**
 * Subscribes to native Capacitor appStateChange events (when native) alongside
 * standard Web visibilitychange/pagehide events, deduplicating transitions so
 * background/foreground handlers never fire twice.
 */
export function subscribeAppLifecycle(handlers: LifecycleHandlers): () => void {
  let isCurrentlyActive = !document.hidden;
  let nativeHandle: PluginListenerHandle | null = null;
  let disposed = false;

  const notifyState = (nextActive: boolean) => {
    if (disposed || nextActive === isCurrentlyActive) {
      return;
    }
    isCurrentlyActive = nextActive;

    if (!nextActive) {
      handlers.onBackground();
    } else {
      if (Capacitor.isNativePlatform()) {
        void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      }
      handlers.onForeground();
    }
  };

  const handleVisibilityChange = () => {
    notifyState(!document.hidden);
  };

  const handlePageHide = () => {
    notifyState(false);
  };

  const handlePageShow = () => {
    notifyState(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);

  if (Capacitor.isNativePlatform()) {
    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      notifyState(isActive);
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          nativeHandle = handle;
        }
      })
      .catch(() => undefined);
  }

  return () => {
    disposed = true;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
    if (nativeHandle) {
      void nativeHandle.remove();
      nativeHandle = null;
    }
  };
}
