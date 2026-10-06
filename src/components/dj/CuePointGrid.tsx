import { useState } from "react";
import { Deck } from "@/lib/dj/engine";
import { useDeck } from "@/lib/dj/useMixer";

// Cue point editor (djay-style): tab row on top, then a pad table where each
// saved cue shows its timestamp with a coloured triangle marker underneath.
// Empty slots show a "+" — tapping sets a cue at the current position.
const CUE_COLORS = ["#ff3b3b", "#ff8a3b", "#3bd2ff", "#3bff8a", "#c04dff", "#ff4dd2", "#ffd23b", "#ffffff"];
const TABS = ["Cue", "Pitch Cue", "Skip", "···"] as const;

export function CuePointGrid({ deck }: { deck: Deck }) {
  useDeck(deck);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Cue");

  const fmt = (t: number) =>
    `${Math.floor(t / 60).toString().padStart(2, "0")}:${Math.floor(t % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              tab === t
                ? "bg-primary/20 text-primary ring-1 ring-primary/60"
                : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-4 content-start gap-1.5 overflow-auto p-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const cue = deck.hotCues[i];
          const color = CUE_COLORS[i % CUE_COLORS.length];
          if (!cue) {
            return (
              <button
                key={i}
                onClick={() => deck.setHotCue(i)}
                onContextMenu={(e) => e.preventDefault()}
                className="grid aspect-[5/4] place-items-center rounded-md border border-border bg-secondary/40 text-lg text-muted-foreground"
                title="Set cue at current position"
              >
                +
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => {
                deck.seek(cue.time);
                deck.play();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                deck.clearHotCue(i);
              }}
              className="flex aspect-[5/4] flex-col items-center justify-center gap-1 rounded-md"
              style={{
                background: `${color}22`,
                border: `1px solid ${color}66`,
                boxShadow: `0 0 8px ${color}33`,
              }}
              title={`Seek to ${fmt(cue.time)} — right-click to clear`}
            >
              <span className="text-[10px] font-semibold tabular-nums">{fmt(cue.time)}</span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: color,
                  clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
