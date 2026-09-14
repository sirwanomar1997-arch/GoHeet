# Restore Follow and recording button designs

## Changes
- Restore the Follow button to its original red appearance while keeping the instant Follow/Following behavior unchanged.
- Restore the earlier recording control with its distinct outer ring, inner capture face, and recording-state animation.
- Keep the shared GoHeet colors used elsewhere unchanged so this correction does not alter other screens.

## Verification
- Check both controls at phone size in the testing preview.
- Confirm Follow still changes immediately to Following and the recording control remains fully tappable.
- Publish the corrected testing version after verification.

## Technical details
- Give Follow and camera recording their own semantic styles instead of both inheriting the generic ember fill.
- Reuse the previous camera control treatment already present in project history.
