# GoHeet release stabilization

## Goal
Make the current hosted and testing app dependable for its essential store-review journeys, especially messaging and camera-only posting, then publish the verified update.

## Work
1. **Messaging reliability**
   - Keep both received and sent message requests visible.
   - Harden text and voice recording for browsers that lack a preferred recording format.
   - Preserve reactions, unsend, read status, and swipe-to-hide behavior.
   - Show useful recovery messages instead of blank or crashed conversation screens.

2. **Camera reliability**
   - Reduce recording memory and processor pressure on Android tablets such as Samsung Tab A9.
   - Add safe recording-format and canvas fallbacks for device differences.
   - Prevent duplicate recording starts, broken stop events, stale timers, and camera-stream leaks.
   - Keep still capture, camera switching, permissions, retake, and camera-only posting intact.

3. **Moment publishing**
   - Stop exhausted or unavailable AI checks from leaving every genuine camera post permanently invisible.
   - Continue rejecting proven synthetic or unsafe content when a valid check succeeds.
   - Publish camera-verified posts when automated review is unavailable while marking them for staff review.
   - Clean up uploaded files when publication fails before a post is created.

4. **Release verification**
   - Run focused automated checks and inspect runtime errors.
   - Test sign-in, messages, camera states, posting, feed, profile, and navigation at phone and tablet sizes.
   - Verify graceful permission-denied and unsupported-device states.
   - Publish only after the relevant checks pass.

## Technical details
- Keep the current TanStack Start and Lovable Cloud architecture.
- Preserve private media, authenticated server checks, camera-origin validation, rate limits, and moderation records.
- Prefer direct binary uploads and bounded media settings suitable for mobile memory limits.
- Add narrowly scoped tests for moderation fallback and recording capability selection where practical.

## Acceptance checks
- Sent requests appear and open; accepted chats can send text and supported voice notes.
- Camera opening cannot crash the page when recording support is missing or constrained.
- A valid camera capture can publish even when AI credits are unavailable.
- Known unsafe/synthetic verdicts remain blocked or held.
- Core screens render without uncaught errors on representative phone and tablet viewports.
