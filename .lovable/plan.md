# Lock swipe navigation to Home and Profile

## Goal
Ensure iPhone edge swipes and in-app horizontal swipes can only move between Home and the signed-in user's Profile. Discover and Notice remain tap-only and can never reappear from profile history.

## Changes
- Treat every profile screen as protected from browser back-swipe history, not only the signed-in user's profile.
- When an iPhone back gesture starts from any profile, cancel the historical destination and send the user to Home.
- Open profiles from Discover, Notice, messages, and feed using replacement navigation so those sections are not left underneath the profile.
- Keep the custom in-app swipe enabled only for Home → own Profile and own Profile → Home.
- Verify navigation behavior and type safety after the change.
