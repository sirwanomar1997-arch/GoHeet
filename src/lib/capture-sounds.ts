/**
 * Capture cues are intentionally silent.
 *
 * Recording must never add a chime, tick or blip to the room the camera is
 * filming — the take should only ever carry real sound. These exports stay so
 * the camera screen keeps one call site, but every one of them is a no-op.
 */

/** Kept for call-site compatibility. Does nothing. */
export function primeCaptureSounds() {}

/** Kept for call-site compatibility. Does nothing. */
export function playCountdownTick(_n: number) {}

/** Kept for call-site compatibility. Does nothing. */
export function playRecordStart() {}

/** Kept for call-site compatibility. Does nothing. */
export function playRecordStop() {}

/** Kept for call-site compatibility. Does nothing. */
export function playPauseBlip(_resuming: boolean) {}
