# 📱 CasaLink Native Android Application Project

This directory contains the **complete, standalone native Android Studio project** for **CasaLink** (`com.casalink.app`).

It is built with **Kotlin**, **AndroidX Material 3**, **SwipeRefreshLayout**, **Native Android Splash Screen API**, **FileProvider**, **WebChromeClient for Camera & Gallery uploads**, **GPS Location Permissions**, and **Native JavaScript Bridge**.

---

## 🚀 Project Features

- **App Drawer Ready**: Appears as a native installed application with launcher icon and round adaptive icon.
- **Package Name**: `com.casalink.app`
- **Minimum SDK**: Android 7.0 (API Level 24)
- **Target SDK**: Android 14 / 15 (API Level 34/35)
- **Native Permissions**:
  - `INTERNET` & `ACCESS_NETWORK_STATE`
  - `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION` (House map search & directions)
  - `CAMERA` & `READ_MEDIA_IMAGES` (Landlord house uploads & tenant verification)
  - `CALL_PHONE` & `RECORD_AUDIO` (Direct landlord voice calls)
  - `POST_NOTIFICATIONS` (Instant house alerts)
- **Native JS Bridge (`window.CasaLinkNative`)**:
  - Direct WhatsApp launcher
  - Native phone dialer
  - Device haptic feedback
  - Android native share sheet
- **Production Build Targets**: Generates both signed `.apk` (direct phone installation) and `.aab` (Android App Bundle for Google Play Store upload).

---

## 🛠️ How to Open & Build in Android Studio

1. **Launch Android Studio** (Hedgehog, Iguana, Jellyfish, or newer).
2. Select **Open an Existing Project**.
3. Choose the `/android` folder from this repository.
4. Allow Gradle sync to complete automatically.
5. Connect your Android phone via USB (with Developer Mode & USB Debugging enabled) or start an Android Virtual Device (AVD Emulator).
6. Click **Run (`Shift + F10`)** to install and run CasaLink directly on your device!

---

## 📦 How to Build Signed APK & Android App Bundle (.aab)

### Option A: Via Command Line (Gradle Wrapper)

Navigate to the `android/` directory in your terminal:

```bash
# Generate Debug APK
./gradlew assembleDebug

# Generate Production Release APK
./gradlew assembleRelease

# Generate Android App Bundle (.aab) for Google Play Store
./gradlew bundleRelease
```

The output files will be generated at:
- **APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **App Bundle (.aab)**: `android/app/build/outputs/bundle/release/app-release.aab`

---

### Option B: Via Android Studio GUI

1. Go to **Build** → **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** (for Google Play) or **APK** (for direct phone install).
3. Select your `.jks` keystore file (or create a new release key).
4. Select `release` build variant and check `V1` & `V2` signature options.
5. Click **Create**!

---

## 🌐 Deploying to Google Play Console

1. Log into your [Google Play Console](https://play.google.com/console).
2. Create a new application named **CasaLink**.
3. Fill in store details:
   - **Category**: House & Home / Real Estate
   - **Privacy Policy**: `https://casalink.app/privacy`
4. Upload `app-release.aab` under **Production / App Releases**.
5. Submit for Google Play Store review!
