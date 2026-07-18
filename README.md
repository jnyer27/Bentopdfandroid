# BentoPDF Android

Android wrapper for [BentoPDF](https://github.com/alam00000/bentopdf), the privacy-first, client-side PDF toolkit. The web app is packaged into a native Android APK using [Capacitor](https://capacitorjs.com/). All PDF processing still happens locally on-device inside the WebView. Nothing is uploaded to a server.

Upstream project documentation: see [README.bentopdf.md](README.bentopdf.md). License: AGPL-3.0 (inherited from upstream).

## Get the APK (no local setup needed)

This repo builds the APK automatically with GitHub Actions on every push to `main`.

1. Go to the **Actions** tab of this repository
2. Open the latest **Build Android APK** run
3. Download the `bentopdf-debug-apk` artifact
4. Unzip it and install `app-debug.apk` on your device (you may need to allow "Install unknown apps")

Pushing a git tag (e.g. `v1.0.0`) also attaches the APK to a GitHub Release.

## Build locally

Requirements: Node.js 18+, JDK 17+, Android SDK (or Android Studio).

```bash
npm install
npm run android:apk          # builds web app, syncs, compiles debug APK
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

Or open the project in Android Studio:

```bash
npm run android:sync
npm run android:open
```

## Notes & known limitations

- The debug APK is signed with a debug key and is fine for personal/sideload use. For Play Store distribution you must configure a release keystore and build `assembleRelease`.
- Advanced tools powered by large WASM modules (PyMuPDF, Ghostscript, CoherentPDF, LibreOffice conversions) are loaded from the jsDelivr CDN at runtime, so those features need an internet connection on first use. Core pdf-lib/pdf.js tools work fully offline.
- Office-format conversion relies on `SharedArrayBuffer`, which is not guaranteed to be available in the Android System WebView; those specific tools may not function on all devices.
- App ID: `com.bentopdf.app`
