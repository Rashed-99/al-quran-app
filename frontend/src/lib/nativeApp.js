import { Capacitor } from '@capacitor/core';

// Everything here is guarded by isNativePlatform() so this file is a
// complete no-op when the app runs as a normal website (Vercel) - only
// active inside the Capacitor-wrapped iOS app.
export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ]);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#121212' });
  } catch (err) {
    // StatusBar plugin can throw on unsupported platforms/simulators -
    // never let a cosmetic failure block app startup.
    console.warn('StatusBar init failed:', err);
  }

  // Hide the splash screen once React has mounted and the first paint is
  // ready, rather than on a fixed timer - avoids a flash of blank screen
  // if the JS bundle takes longer to parse on an older device.
  requestAnimationFrame(() => {
    SplashScreen.hide().catch((err) => console.warn('SplashScreen hide failed:', err));
  });

  // Android hardware back button: mirror typical app behavior (go back
  // in history, or exit at the root). Harmless no-op registration on iOS.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}

export default initNativeApp;
