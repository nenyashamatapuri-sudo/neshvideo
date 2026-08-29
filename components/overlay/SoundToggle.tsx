"use client";

import { useEffect, useSyncExternalStore } from "react";

import { armAudio, isMuted, isMutedOnServer, play, setMuted, subscribeSound } from "@/lib/audio";

/**
 * The mute control, and the thing that arms audio in the first place.
 *
 * A site that makes noise has to say so and has to offer the off switch in the
 * same breath — so the control is always on screen rather than buried in a
 * menu. The preference is read through an external store so the very first
 * render is correct on both server and client instead of flipping after an
 * effect runs.
 */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeSound, isMuted, isMutedOnServer);

  useEffect(() => {
    // Browsers refuse to start an audio context before a real gesture, so the
    // graph is built on whichever one comes first and then reused.
    const arm = () => armAudio();
    const opts = { passive: true } as const;

    window.addEventListener("pointerdown", arm, opts);
    window.addEventListener("keydown", arm);
    window.addEventListener("wheel", arm, opts);
    window.addEventListener("touchstart", arm, opts);

    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchstart", arm);
    };
  }, []);

  return (
    <button
      type="button"
      className={`sound${muted ? " is-muted" : ""}`}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        // Unmuting should demonstrate what was just switched on.
        if (!next) play("tick");
      }}
      aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      title={muted ? "Sound off" : "Sound on"}
    >
      <span className="sound__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound__word">{muted ? "Sound off" : "Sound on"}</span>
    </button>
  );
}
