# GoHeet

**Real life. Real people. Real moments.**

GoHeet is a mobile-first short-form social video platform where every moment is
captured **inside the app** — no camera-roll uploads, no reposted internet clips.
Record up to five minutes, add playful text, filters and music, then share it
with the world. Heet the videos you love, follow real creators, and keep your
moments real.

## What's inside

- **Auth & onboarding** — email / phone / Google / Apple sign-in, 13+ age gate.
- **Camera** — native-FOV capture, pinch zoom, torch, front/back swap mid-record,
  5-minute limit, cinematic filters, in-app music, playful text overlays.
- **Feed** — vertical full-screen "Out there" (global) and "Following" scopes,
  Heet (fire) reactions, comments, saves, reposts, in-app + external sharing.
- **Profiles** — avatar or personal photo, cumulative Heet total, Reelz / Views /
  Likes stats, social links (Instagram, TikTok, YouTube, X, Snapchat, WhatsApp,
  website with adult-link warning), reposts tab.
- **Avatars** — glossy semi-realistic 3D builder, picture-driven traits, gender,
  skin, eyes, hair, outfits, accessories.
- **Messages** — request-first DMs with accept/reject, read tracking, blocking.
- **Discovery, activity, saved, trash** — 30-day soft-delete trash, moderation
  queue with 24-hour SLA.
- **Legal & safety** — Terms, Privacy, Guidelines, Safety, Support, Cookies,
  Copyright pages; report/block everywhere; text-safety filtering.
- **Admin** — moderation queue, user management.

## Tech

- TanStack Start (React 19, SSR) + Vite + Tailwind CSS v4
- Supabase (auth, Postgres + RLS, private media storage)
- Capacitor for native iOS / Android packaging

## Native packaging

See [`STORE-RELEASE.md`](./STORE-RELEASE.md) for the full App Store / Google Play
launch guide.

```bash
npm install
npm run build
npx cap add ios && npx cap add android
npx cap sync
npx cap open ios      # or: npx cap open android
```

App ID: `app.goheet.mobile` · Launch screen: black · Icon: the G / fire / play mark.
