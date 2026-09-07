# GoHeet → iPhone (Xcode) setup

These steps take the GoHeet project from your GitHub repo and run it on your iPhone through Xcode. Do this once, then repeat the **Update** section whenever the app changes.

## One-time setup (on your Mac)

### 1. Install the tools

- **Xcode** — free from the Mac App Store (open it once after installing so it finishes setup).
- **Node.js 20+** — `brew install node`, or download from nodejs.org.
- **CocoaPods** — `sudo gem install cocoapods`.
- **Apple ID** — a free Apple Developer account works for testing on your own device. Sign in at Xcode → Settings → Accounts.

### 2. Clone the repo

```bash
git clone https://github.com/sirwanomar1997-arch/reelzymoment.git GoHeet
cd GoHeet
```

> If you renamed the repo to `GoHeet` on GitHub (Settings → Repository name), use `GoHeet` in the URL instead of `reelzymoment`.

### 3. Install and build

```bash
npm install
npm run build
```

### 4. Add the iOS platform (first time only)

```bash
npx cap add ios
```

This creates the `ios/` folder with the Xcode project.

### 5. Sync the web build into the native project

```bash
npx cap sync ios
```

### 6. Open in Xcode

```bash
npx cap open ios
```

## Run on your iPhone

1. Plug your iPhone into your Mac with a cable. Tap **Trust** on the phone when prompted.
2. In Xcode, select your iPhone from the device dropdown at the top (next to **GoHeet**).
3. Open the **Signing & Capabilities** tab in the left sidebar:
   - Under **Signing**, pick your team (your Apple ID).
   - **Bundle Identifier** is `app.goheet.mobile` — leave it as is.
4. Click the **Run** button (⌘R). Xcode builds and installs GoHeet on your iPhone.
5. On the iPhone: **Settings → General → VPN & Device Management → tap your Apple ID → Trust**. Then open GoHeet.

## Update after a change in Lovable

Each time the app is updated in Lovable, the changes sync to GitHub automatically. On your Mac:

```bash
cd GoHeet
git pull
npm install
npm run build
npx cap sync ios
```

Then re-run in Xcode (⌘R). You only run `npx cap add ios` once — never again.

## Notes

- The native shell loads the hosted build at `https://goheet.lovable.app`, so server functions (auth, feed, uploads) keep working during testing.
- Camera and push notifications are wired up via Capacitor plugins (`@capacitor/camera`, `@capacitor/push-notifications`).
- For App Store submission later, you'll need a paid Apple Developer account ($99/year) and App Store Connect setup. Free accounts are enough for device testing only.
