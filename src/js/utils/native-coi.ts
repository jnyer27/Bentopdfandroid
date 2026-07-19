// Cross-origin isolation bootstrap for the Android (Capacitor) build.
// Registers the header-injecting service worker and reloads the page once
// so SharedArrayBuffer becomes available (required by LibreOffice WASM
// office conversions). No-op on web builds and once isolation is active.

import { Capacitor } from '@capacitor/core';

const RELOAD_GUARD = 'coi-sw-reloaded';

if (
  Capacitor.isNativePlatform() &&
  !window.crossOriginIsolated &&
  'serviceWorker' in navigator
) {
  void (async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}coi-serviceworker.js`,
        { scope: import.meta.env.BASE_URL }
      );
      await navigator.serviceWorker.ready;

      // If the SW isn't controlling this page yet (first ever launch),
      // one reload is needed for the headers to take effect. Guard with
      // sessionStorage so a misbehaving environment can't reload-loop.
      if (
        !navigator.serviceWorker.controller &&
        !sessionStorage.getItem(RELOAD_GUARD)
      ) {
        sessionStorage.setItem(RELOAD_GUARD, '1');
        window.location.reload();
        return;
      }

      if (registration.active && !window.crossOriginIsolated) {
        console.warn(
          '[coi] Service worker active but page not isolated; ' +
            'office conversions may not work on this WebView.'
        );
      }
    } catch (e) {
      console.error('[coi] Failed to register isolation service worker', e);
    }
  })();
}
