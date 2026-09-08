# GoHeet — App Store & Google Play release guide

Everything below matches steps 1–9 we agreed on. Items marked **Done in the app**
need nothing more from you. Items marked **You** need your accounts or a Mac.

---

## 1. Turn the website into a real phone app — Done in the app

Native packaging is configured with Capacitor:

- `capacitor.config.ts` — app id `app.goheet.mobile`, name `GoHeet`, dark launch background.
- Plugins installed: camera, push notifications, splash screen, status bar.

On your own machine (Mac for iPhone, any computer for Android):

```bash
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios        # opens Xcode
npx cap open android    # opens Android Studio
```

### Permission texts to paste in Xcode (Info.plist)

| Key | Text |
| --- | --- |
| NSCameraUsageDescription | GoHeet needs your camera so you can record your own moments. Videos are only created inside GoHeet. |
| NSMicrophoneUsageDescription | GoHeet needs your microphone to record sound with your videos. |
| NSPhotoLibraryAddUsageDescription | GoHeet saves a copy of your own recording to your phone when you ask it to. |

Android (`android/app/src/main/AndroidManifest.xml`) needs `CAMERA`,
`RECORD_AUDIO`, `INTERNET`, and `POST_NOTIFICATIONS`.

## 2. Store accounts — You

- Apple Developer Program: $99/year, ID verification, allow up to a week.
- Google Play Console: $25 one time, ID + address verification.
- Register the app name **GoHeet** in both consoles as soon as the accounts are live.

## 3. Store assets — Icon and launch screen done in the app

Ready to use in `public/icons/`:

- `icon-1024.png` — App Store / Play Store listing icon
- `icon-512.png`, `icon-maskable-512.png`, `icon-192.png` — Android adaptive icons
- `apple-touch-icon.png` — iPhone home screen
- `splash-2732.png` — launch screen

Still yours to prepare: 5–8 screenshots per store (record them on a real phone:
feed, camera, editor, profile, messages), plus this listing text you can reuse:

- **Subtitle:** Real life. Real people. Real moments.
- **Description:** GoHeet is short video without the fake. Every clip is filmed
  inside the app — no camera roll uploads, no reposted internet clips. Record up
  to five minutes, add playful text, filters and music, then share it with the
  world. Heet the videos you love, follow real creators and keep your moments real.
- **Keywords:** video, short video, camera, moments, social, real, creators, clips

## 4. Legal pages — Done in the app

Live and publicly reachable:

- `/legal/terms`, `/legal/privacy`, `/legal/guidelines`, `/legal/safety`,
  `/legal/support`, `/legal/cookies`, `/legal/copyright`
- Support contact: handled in-app via Settings → Help & support (requests reach the support inbox privately; no personal address is shown to users)

Paste the `/legal/privacy` and `/legal/support` URLs into both store listings.

## 5. Safety requirements — Done in the app

- Report and block on every profile and every video.
- Automatic text filtering on captions, overlays, comments, names and bios.
- Published 24-hour removal promise in the guidelines, and the moderation queue
  shows the 24-hour deadline to staff.
- Deleted posts go to trash for 30 days, then delete themselves.

## 6. Age rating & data disclosure — You (answers prepared)

- Age rating: **17+ / Mature** (user-generated social content).
- Minimum age enforced in the app: 13, checked at sign-up by date of birth.

Answer the privacy forms with: email address, phone number (optional), name and
username, profile photo/avatar, videos and comments you post, messages you send,
and basic usage analytics. Nothing is sold; nothing is used for tracking ads.

## 7. Sign-in rules — You

Google sign-in is live. Apple requires **Sign in with Apple** next to it. The
button is already in the app; once your Apple Developer account exists, create a
Services ID + key and send me the details so I can switch it on.

## 8. Push notifications — Partly done

The push plugin is installed. To alert people when the app is closed you'll need:

- Apple: an APNs key from your developer account.
- Android: a Firebase project and its `google-services.json`.

Send those over and I'll wire the alerts to Heets, comments, follows and messages.

## 9. Final device testing — You and me

Test on a real iPhone and a real Android: sign-up, camera and 5-minute recording,
front/back switch while recording, editing, publishing, playback, messages, and
report/block. Tell me anything that misbehaves and I'll fix it before submission.
