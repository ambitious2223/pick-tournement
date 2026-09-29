import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { MatchStage } from "../bracket/MatchStage.tsx";

export function Overlay({ state }: { state: SessionState | null }): ReactNode {
  if (!state) return null;

  return (
    <div className="overlay-root relative min-h-screen">
      <MatchStage state={state} variant="overlay" />
    </div>
  );
}
