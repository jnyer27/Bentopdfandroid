/*
 * Cross-origin isolation service worker.
 *
 * The Android (Capacitor) build serves the app from a local scheme handler
 * that cannot attach HTTP response headers. LibreOffice WASM is a pthreads
 * build and requires SharedArrayBuffer, which browsers only enable when the
 * page is cross-origin isolated (COOP + COEP headers present).
 *
 * This service worker re-serves every same-origin response with those
 * headers attached, making the page crossOriginIsolated after one reload.
 * COEP "credentialless" is used so cross-origin CDN resources (PyMuPDF,
 * Ghostscript, Tesseract WASM) keep loading without CORP headers.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const response = await fetch(request);
      // Opaque or error responses can't be re-wrapped meaningfully
      if (response.status === 0) return response;

      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    })()
  );
});
