"use client";

/**
 * The sound of the book.
 *
 * Every noise here is synthesised from filtered noise and a couple of
 * oscillators, so nothing is downloaded and there are no files to keep in sync
 * with the design. A page turn really is a burst of noise swept through a
 * band-pass filter — that is what paper is, acoustically — which gets closer
 * than most sample libraries and costs nothing.
 *
 * Three rules, because sound on a website is a liability if it ignores them:
 *
 *  - **Nothing plays before the visitor has touched the page.** Browsers block
 *    it anyway, but the rule matters beyond the policy: no one should be
 *    ambushed by audio from a tab they just opened.
 *  - **The choice is remembered.** Muting on one page stays muted everywhere,
 *    across visits.
 *  - **It is tied to events, not to frames.** Firing on every scroll tick
 *    would be a mess of noise; a page turn is a page turn.
 */

export type Cue = "turn" | "tick" | "open" | "close" | "swipe";

const STORE_KEY = "nesh:sound";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let armed = false;
let muted = readMuted();

const listeners = new Set<() => void>();

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORE_KEY) === "off";
  } catch {
    return false;
  }
}

export function subscribeSound(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const isMuted = () => muted;
/** The server has no opinion and must not disagree with the first client render. */
export const isMutedOnServer = () => false;

export function setMuted(next: boolean) {
  muted = next;
  try {
    window.localStorage.setItem(STORE_KEY, next ? "off" : "on");
  } catch {
    /* private mode — the choice just does not survive the session */
  }
  if (master && context) {
    master.gain.setTargetAtTime(next ? 0 : 1, context.currentTime, 0.02);
  }
  for (const fn of listeners) fn();
}

/**
 * Builds the graph on the first real gesture.
 *
 * Autoplay policy will not let a context start before then, and a suspended
 * context that is never resumed leaks a little audio thread for the life of
 * the page.
 */
function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  if (!armed) return null;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  context = new Ctor();
  master = context.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(context.destination);
  return context;
}

/** Call from a real user gesture. Safe to call repeatedly. */
export function armAudio() {
  armed = true;
  const ctx = ensure();
  if (ctx?.state === "suspended") void ctx.resume();
}

/** One short burst of noise, which is most of what paper sounds like. */
function noiseBurst(
  ctx: AudioContext,
  out: GainNode,
  {
    duration,
    frequency,
    q,
    gain,
    sweep = 1,
  }: { duration: number; frequency: number; q: number; gain: number; sweep?: number }
) {
  const frames = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(frequency, ctx.currentTime);
  // Sweeping the band is what turns a hiss into a movement.
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(80, frequency * sweep),
    ctx.currentTime + duration
  );

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(gain, ctx.currentTime + duration * 0.14);
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  source.connect(filter).connect(env).connect(out);
  source.start();
  source.stop(ctx.currentTime + duration);
}

/** A soft pitched blip, for anything that is a state change rather than paper. */
function blip(
  ctx: AudioContext,
  out: GainNode,
  { frequency, duration, gain, to }: { frequency: number; duration: number; gain: number; to?: number }
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(env).connect(out);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Two of the same cue inside this window is a double-fire, not a rhythm.
const lastPlayed = new Map<Cue, number>();
const THROTTLE: Record<Cue, number> = {
  turn: 180,
  tick: 45,
  open: 120,
  close: 120,
  swipe: 90,
};

export function play(cue: Cue) {
  if (muted) return;
  const ctx = ensure();
  if (!ctx || !master) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = performance.now();
  const previous = lastPlayed.get(cue) ?? -Infinity;
  if (now - previous < THROTTLE[cue]) return;
  lastPlayed.set(cue, now);

  switch (cue) {
    case "turn":
      // Paper: a wide band sweeping down as the sheet passes the spine.
      noiseBurst(ctx, master, {
        duration: 0.34,
        frequency: 2600,
        q: 0.7,
        gain: 0.085,
        sweep: 0.32,
      });
      break;

    case "tick":
      // The smallest thing that still reads as feedback.
      blip(ctx, master, { frequency: 2100, duration: 0.035, gain: 0.022 });
      break;

    case "open":
      blip(ctx, master, { frequency: 320, to: 620, duration: 0.14, gain: 0.05 });
      noiseBurst(ctx, master, { duration: 0.16, frequency: 1600, q: 1.1, gain: 0.03, sweep: 1.6 });
      break;

    case "close":
      blip(ctx, master, { frequency: 520, to: 240, duration: 0.13, gain: 0.045 });
      break;

    case "swipe":
      noiseBurst(ctx, master, { duration: 0.16, frequency: 1500, q: 1.4, gain: 0.04, sweep: 0.55 });
      break;
  }
}
