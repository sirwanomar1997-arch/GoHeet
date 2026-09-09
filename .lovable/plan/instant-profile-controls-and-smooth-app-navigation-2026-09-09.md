# Instant profile controls and smooth app navigation

## Goal
Make the profile Edit and Settings controls respond on the first tap, remove avoidable waiting during authenticated navigation, and verify the main sign-in, profile, settings, and swipe journeys feel immediate and stable.

## Changes
- Fix the profile header’s visual layer and touch stacking so decorative effects cannot intercept taps.
- Make Edit and Settings true high-priority links with route preloading before the user taps.
- Keep profile navigation mounted normally instead of hiding the bottom navigation and recreating it unnecessarily.
- Remove blocking waits after profile saves: show the saved state immediately, navigate at once, then refresh data in the background.
- Audit the authentication gate and shared profile lookup for duplicate network checks that delay every internal page change.
- Preserve the requested swipe rule: only Home and Profile swipe between each other; all other sections remain tap-only.

## Quality verification
- Test first-tap navigation from Profile to Edit and Settings on the mobile viewport.
- Test save-and-return behavior, Home/Profile swipes, sign-in redirect, and back navigation.
- Check for overlapping touch layers, console errors, failed requests, layout shifts, and repeated navigation calls.
- Run the focused automated checks after implementation.

## Technical details
- Use TanStack links and route preloading rather than history-based navigation.
- Keep cached profile/auth data visible while refreshing to avoid blank loading screens.
- Apply touch-action and stacking fixes only to the affected interactive areas.
