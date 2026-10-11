import { useEffect } from "react";
import { sound } from "./manager.ts";

/** Unlocks the audio context on mount and on the first real gesture, on every page. */
export function useAudioUnlock(): void {
  useEffect(() => {
    void sound.unlock();
    const onGesture = (): void => {
      void sound.unlock();
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, []);
}
