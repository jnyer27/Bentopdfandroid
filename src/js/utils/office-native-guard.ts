// Office-conversion capability guard for the Android build.
//
// LibreOffice WASM is a pthreads build and requires SharedArrayBuffer.
// Android's WebView does not support SharedArrayBuffer at all (it lacks
// the process-level site isolation that cross-origin isolation requires),
// so these conversions cannot run inside the APK on any device or Android
// version. Chrome itself does support it, so the same tool works in the
// browser — still fully client-side.
//
// This module: (1) detects the limitation and reports it instantly instead
// of letting WASM init hang for two minutes, (2) offers to open the current
// tool in the browser, and (3) unregisters the now-unnecessary isolation
// service worker left behind by a previous app version.

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const HOSTED_ORIGIN = 'https://www.bentopdf.com';

export function officeConversionSupported(): boolean {
  if (!Capacitor.isNativePlatform()) return true;
  return typeof SharedArrayBuffer !== 'undefined';
}

/** Show a modal explaining the limitation, with an open-in-browser action. */
export function showOfficeUnsupportedModal(): void {
  if (document.getElementById('office-unsupported-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'office-unsupported-modal';
  modal.className =
    'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700 shadow-xl max-w-md w-full p-6">
      <h3 class="text-lg font-bold text-white mb-3">Not available in the Android app</h3>
      <p class="text-sm text-gray-300 mb-3">
        Office document conversion runs LibreOffice in your browser, which needs a
        feature (SharedArrayBuffer) that Android's built-in WebView doesn't provide.
      </p>
      <p class="text-sm text-gray-300 mb-5">
        The same tool works in Chrome — your file still never leaves your device.
      </p>
      <div class="flex gap-3">
        <button id="office-unsupported-open" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">
          Open in browser
        </button>
        <button id="office-unsupported-close" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition">
          Close
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document
    .getElementById('office-unsupported-open')
    ?.addEventListener('click', () => {
      void Browser.open({
        url: `${HOSTED_ORIGIN}${window.location.pathname}`,
      });
      modal.remove();
    });
  document
    .getElementById('office-unsupported-close')
    ?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Cleanup: a previous app version registered a cross-origin isolation
// service worker that cannot help on WebView. Remove it so first-launch
// reloads stop happening.
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      if (reg.active?.scriptURL.includes('coi-serviceworker')) {
        void reg.unregister();
      }
    }
  });
}
