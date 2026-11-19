# ANOCLIX

Minimal, precision JavaScript auto-clicker and CPS benchmark utility designed for iPhone and packaged for native iOS with Capacitor.

## Features

- **Real JavaScript Execution Engine**: Drift-compensated scheduling for low/medium rates (`<= 120 CPS`) and frame-budgeted fixed-timestep accumulation (`> 120 CPS` up to `10,000 CPS`), with single-instance run-token protection against duplicate loops.
- **Live Telemetry**: Real-time 1-second sliding-window measured CPS, total operations counter, session timer, average CPS, peak CPS, and target interval.
- **Speed Presets & Custom Input**: `10`, `50`, `100` (default), `500`, `1,000`, `5,000 CPS` benchmark, and custom speed (`1–10,000 CPS`).
- **Native iOS Lifecycle & Packaging**:
  - Capacitor iOS configuration (`com.anoclix.app`, `ANOCLIX`, version `1.0.0`) with `@capacitor/app`, `@capacitor/status-bar`, and `@capacitor/splash-screen` via Swift Package Manager.
  - Automatic pause on background / screen lock (`appStateChange` + `visibilitychange` fallback) preserving session counts, timer, and target CPS.
  - iPhone-targeted (`TARGETED_DEVICE_FAMILY = 1`), portrait-locked (`Info.plist`), pure black OLED launch storyboard, `1024×1024` opaque RGB App Icon, and `2732×2732` Splash assets.
  - Shared Xcode scheme (`App.xcscheme`) and export templates (`ios/ExportOptions.plist` and `ios/ExportOptions-AdHoc.plist`).

## Local Web Development

```bash
npm install
npm run dev
```

## Sync Web Assets to iOS

Whenever web source files or `capacitor.config.ts` change:

```bash
npm run ios:assets
npm run cap:sync
```

## Pre-Export Checklist

Before building an `.ipa` on macOS, verify:
- [ ] `npm run lint` and `npm run build` pass with zero errors.
- [ ] `npm run cap:sync` has synced `dist/` into `ios/App/App/public/`.
- [ ] `capacitor.config.ts` and `ios/App/App/capacitor.config.json` match `appId: "com.anoclix.app"` and `appName: "ANOCLIX"`.
- [ ] `ios/App/App/Info.plist` has `CFBundleDisplayName = ANOCLIX`, `UIInterfaceOrientationPortrait`, `UIRequiresFullScreen = true`, and `ITSAppUsesNonExemptEncryption = false`.
- [ ] `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (`1024×1024` RGB) and `Splash.imageset/splash-2732x2732*.png` (`2732×2732`) are present.
- [ ] No private `.p12` certificates or `.mobileprovision` keys are stored in the repository.

## Generating a Standard iOS `.ipa` (macOS + Xcode Required)

> Note: iOS `.ipa` binaries cannot be compiled on Linux. macOS with Xcode is required to compile the Swift/Capacitor binary for `arm64` iOS.

### Option A: Signed IPA via Xcode GUI

1. Open the project on macOS:
   ```bash
   npm run cap:open
   ```
2. Select **App** target → **Signing & Capabilities** and choose your Apple Developer Team.
3. Set the run destination to **Any iOS Device (arm64)**.
4. Choose **Product → Archive**.
5. In the Organizer window, click **Distribute App** → choose **Ad Hoc**, **Development**, or **App Store Connect** to export the `.ipa`.

### Option B: Signed IPA via CLI (`xcodebuild`)

1. Set your Apple Developer `teamID` in `ios/ExportOptions-AdHoc.plist` (or `ios/ExportOptions.plist` for App Store Connect).
2. Archive and export:
   ```bash
   xcodebuild \
     -project ios/App/App.xcodeproj \
     -scheme App \
     -configuration Release \
     -destination 'generic/platform=iOS' \
     -archivePath ios/App/build/ANOCLIX.xcarchive \
     archive

   xcodebuild -exportArchive \
     -archivePath ios/App/build/ANOCLIX.xcarchive \
     -exportPath ios/App/build/ipa \
     -exportOptionsPlist ios/ExportOptions-AdHoc.plist
   ```

### Option C: Unsigned `.ipa` Build (For On-Device ESign Signing)

If you want to compile an unsigned `arm64` `.ipa` in Xcode/macOS to sign later on iPhone with ESign:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath ios/App/build/derived \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  build

mkdir -p ios/App/build/Payload
cp -R ios/App/build/derived/Build/Products/Release-iphoneos/App.app ios/App/build/Payload/
(cd ios/App/build && zip -qr ANOCLIX-unsigned.ipa Payload)
```

## Signing & Installing on iPhone with ESign

ANOCLIX requests **no restricted Apple entitlements** (no Push Notifications, App Groups, iCloud, or private APIs), making it cleanly compatible with standard ESign re-signing.

### Certificate & Provisioning Profile Requirements

1. **Signing Certificate (`.p12`)**: A valid Apple Development, Ad-Hoc Distribution, or Enterprise Distribution `.p12` certificate plus its import password.
2. **Provisioning Profile (`.mobileprovision`)**: Must match the `.p12` certificate and either:
   - Use a wildcard App ID (`*`), or
   - Match `com.anoclix.app` (if your profile uses a different explicit Bundle ID, set that Bundle ID in ESign's signing options).
   - For Development/Ad-Hoc profiles, your iPhone's UDID must be registered in the `.mobileprovision` file.
3. **Device Trust / Developer Mode (iOS 16+)**:
   - **Developer Mode**: Enable in **Settings → Privacy & Security → Developer Mode** if using a development-signed build.
   - **Certificate Trust**: For Enterprise/Distribution profiles, trust the certificate profile in **Settings → General → VPN & Device Management**.

### ESign Signing Steps

1. Import your `.p12` certificate (enter its password) and `.mobileprovision` file into ESign.
2. Import the compiled `ANOCLIX` `.ipa` into ESign.
3. Select the `.ipa` → **Signature**:
   - Confirm **App Name** is `ANOCLIX`.
   - Confirm **Bundle ID** is `com.anoclix.app` (or match your explicit provisioning profile ID if required).
   - Select your imported `.p12` and `.mobileprovision`.
   - Leave extra dylib/tweak injection disabled.
4. Tap **Signature** to generate the signed `.ipa`, then tap **Install** and approve the iOS installation prompt.

## Important iOS Platform Restrictions

ANOCLIX executes operations and performance benchmarks strictly inside its own web/WKWebView sandbox. Even when signed and installed via ESign, it cannot inject taps into TikTok or other external iPhone applications, and cannot render a floating overlay above other iOS apps.
