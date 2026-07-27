# 📱 CapacitorJS Native Integration Guide

This guide details the integration of **CapacitorJS** into the SiriThai React/Vite application to build and run native iOS and Android versions.

---

## 📦 1. Installation

To integrate Capacitor, install the core runtime and CLI tool along with the native platform targets.

### Standard Commands
```bash
# Install core package
npm install @capacitor/core

# Install developer tools and platform SDK bindings
npm install -D @capacitor/cli @capacitor/ios @capacitor/android
```

*Note: These packages have already been installed in this project and added to [package.json](file:///Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/package.json).*

---

## ⚙️ 2. Configuration

The configuration is defined in [capacitor.config.ts](file:///Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/capacitor.config.ts):

- **`appId`**: Configured as `com.thaimmsiri.languageapp` (Reverse Domain standard).
- **`appName`**: Configured as `SiriThai`.
- **`webDir`**: Points to `dist`, matching the default production build output folder of Vite.

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thaimmsiri.languageapp',
  appName: 'SiriThai',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

---

## 🚀 3. Initializing Native Platforms

Before you can build or run the native apps, you must generate the platform-specific native projects (`ios/` and `android/` folders):

```bash
# Add iOS Platform
npx cap add ios

# Add Android Platform
npx cap add android
```

---

## 🔄 4. Building & Syncing Workflow

Capacitor relies on syncing your compiled web build (`dist/`) into the native projects. Whenever you modify your React code, follow this flow:

### Step A: Build the web production assets
Compile the React/Vite frontend into HTML, JS, CSS, and asset files.
```bash
npm run build
```

### Step B: Sync the build output to native spaces
Copy the contents of the `dist/` folder and update Capacitor plugin configurations in the native iOS and Android projects.
```bash
npx cap sync
```
*Alternatively, you can run the helper script:*
```bash
npm run cap:sync
```

---

## 🛠️ 5. Running and Opening Projects

To compile the native binaries and run them on simulators, emulators, or connected physical devices, use the native IDE tools:

### iOS Deployment
Open the Xcode workspace (`ios/App/App.xcworkspace`):
```bash
npx cap open ios
# OR using the package script:
npm run cap:open:ios
```
Inside Xcode, select your target simulator or device and click the **Run** button (or press `Cmd + R`).

### Android Deployment
Open the project folder (`android/`) in Android Studio:
```bash
npx cap open android
# OR using the package script:
npm run cap:open:android
```
Once Android Studio finishes indexing, click the **Run** button to launch on an Android Virtual Device (AVD) or physical device.

---

## 💡 Quick Tips
* **Checking Status**: Run `npx cap doctor` to check for missing dependencies, configuration issues, or platform-specific environment errors.
* **Auto-update configuration**: If you only install/update Capacitor plugins (and haven't modified the web build), you can run `npx cap update` to refresh the native plugin bindings without copying web assets.
