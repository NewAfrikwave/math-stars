# Math Stars Android package

Math Stars is installable directly from Chrome today as a Progressive Web App. This directory defines the Trusted Web Activity wrapper for a future Play Store or direct APK distribution.

The wrapper must be signed by the Math Stars release owner. After the signing certificate is created, publish its SHA-256 fingerprint in `/.well-known/assetlinks.json`, build the Android App Bundle, and retain the keystore outside this repository. Never commit signing keys or passwords.

Offline lessons live in the web app's service worker and IndexedDB, so the Android wrapper uses the same grade packs and safe synchronization engine as tablets, Chromebooks, and desktop computers.
