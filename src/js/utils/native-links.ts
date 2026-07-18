// External link handling for the Android build.
// By default the WebView navigates away to external sites with no way back,
// which strands the user outside the app. This intercepts taps on links that
// leave the app's own origin and opens them in an in-app browser sheet
// (Chrome Custom Tab) with a close button that returns to the app —
// the same dismissable-overlay pattern as the Info modal.
// On web builds this module is a no-op.

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

if (Capacitor.isNativePlatform()) {
  document.addEventListener(
    'click',
    (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      // Ignore in-page anchors, relative/internal links, and special schemes
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('blob:') ||
        href.startsWith('data:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Only intercept http(s) links that leave the app's own origin
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (url.origin === window.location.origin) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void Browser.open({ url: url.toString() });
    },
    true
  );
}
