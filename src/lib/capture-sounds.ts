/**
 * Short synthesized capture cues (no audio files, no network).
 * Countdown ticks, a rising start chime, and a soft falling stop chime.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, startAt: number, duration: number, gain = 0.16, type: OscillatorType = "sine") {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startAt;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Unlock audio on the first user gesture (iOS needs this). */
export function primeCaptureSounds() {
  audio();
}

/** One tick per countdown number. */
export function playCountdownTick(n: number) {
  tone(n <= 1 ? 880 : 620, 0, 0.12, 0.14, "triangle");
}

/** Rising two-note chime the instant filming begins. */
export function playRecordStart() {
  tone(740, 0, 0.14, 0.18, "triangle");
  tone(1108, 0.1, 0.22, 0.16, "triangle");
}

/** Soft falling chime when the take is finished. */
export function playRecordStop() {
  tone(660, 0, 0.16, 0.16, "sine");
  tone(440, 0.11, 0.26, 0.14, "sine");
}

/** Tiny blip for pause / resume. */
export function playPauseBlip(resuming: boolean) {
  tone(resuming ? 700 : 420, 0, 0.09, 0.12, "square");
}
