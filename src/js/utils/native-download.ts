// Android (Capacitor) download bridge.
// The Android WebView ignores the standard `<a download>` + blob URL pattern,
// so on native builds we hand the bytes to the Downloader plugin, which writes
// them into the device's Downloads folder via MediaStore.
// On web builds this module is a no-op.

import { Capacitor, registerPlugin } from '@capacitor/core';

interface DownloaderPlugin {
  save(options: {
    filename: string;
    mimeType: string;
    data: string;
  }): Promise<{ saved: boolean; filename: string }>;
}

const isNative = Capacitor.isNativePlatform();
const Downloader = isNative
  ? registerPlugin<DownloaderPlugin>('Downloader')
  : null;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Save a blob through the native Downloader plugin.
 * Returns true if the native path handled it (or is handling it),
 * false when running on the web (caller should fall back to anchor download).
 */
export function nativeDownload(blob: Blob, filename: string): boolean {
  if (!isNative || !Downloader) return false;
  void (async () => {
    try {
      const data = await blobToBase64(blob);
      await Downloader.save({
        filename,
        mimeType: blob.type || 'application/octet-stream',
        data,
      });
    } catch (e) {
      console.error('[native-download] save failed', e);
    }
  })();
  return true;
}

// Read a blob: or data: URL synchronously so we can grab the bytes before the
// calling code revokes the object URL (many tools revoke immediately after
// anchor.click()). Sync XHR is deprecated but is the only reliable way to do
// this from inside a click handler.
function readUrlBytesSync(url: string): { bytes: Uint8Array; mime: string } | null {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send(null);
    if (xhr.status !== 200 && xhr.status !== 0) return null;
    const text = xhr.response as string;
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
    const mime =
      xhr.getResponseHeader('Content-Type') || 'application/octet-stream';
    return { bytes, mime };
  } catch {
    return null;
  }
}

// Safety net: intercept clicks on any <a download> pointing at a blob:/data:
// URL. This catches tools that build their own anchors instead of using the
// shared downloadFile() helper.
if (isNative) {
  document.addEventListener(
    'click',
    (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[download]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.href || '';
      if (!href.startsWith('blob:') && !href.startsWith('data:')) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const filename = anchor.getAttribute('download') || 'download.bin';
      const result = readUrlBytesSync(href);
      if (!result) {
        console.error('[native-download] could not read', href.slice(0, 40));
        return;
      }
      const blob = new Blob([result.bytes], { type: result.mime });
      nativeDownload(blob, filename);
    },
    true
  );
}
