import { useRef, useState } from "react";
import { Deck } from "@/lib/dj/engine";
import { useDeck } from "@/lib/dj/useMixer";
import { Grid2x2, X, ChevronLeft, ChevronRight } from "lucide-react";

const CUE_COLORS = ["#ff3b3b", "#ffcf3b", "#3bff8a", "#3bd2ff", "#a83bff", "#ff3bd2", "#ffffff", "#ff7a3b"];
const LOOP_LENGTHS = ["1/32", "1/16", "1/8", "1/4", "1/2", "1", "2", "4", "8", "16", "32"];
const LOOP_BEATS = [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32];

/** Compact frosted side drawer with hot cues + loop sizes (djay-style pads). */
export function HotCuePanel({
  deck,
  accent,
  side = "left",
}: {
  deck: Deck;
  accent: string;
  side?: "left" | "right";
}) {
  useDeck(deck);
  const [open, setOpen] = useState(false);
  const [loopIdx, setLoopIdx] = useState(7);
  const hasAny = deck.hotCues.some(Boolean);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-9 h-9 rounded-full flex items-center justify-center ${open ? "dj-glass-on" : "dj-glass"}`}
        style={{ boxShadow: hasAny ? `0 0 10px ${accent}66, var(--glass-shadow)` : undefined }}
        title="Hot cues & loops"
      >
        <Grid2x2 className="w-4 h-4" style={{ color: hasAny ? accent : "var(--muted-foreground)" }} />
      </button>

      {open && (
        <div
          className={`fixed top-[52px] bottom-[52px] z-[62] w-[200px] max-w-[52vw] p-2.5 overflow-y-auto dj-panel rounded-2xl ${
            side === "left" ? "left-1.5" : "right-1.5"
          }`}
          style={{ boxShadow: "0 0 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)" }}
        >

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] uppercase tracking-widest" style={{ color: accent }}>
              Deck {deck.id} Cues
            </h2>
            <button onClick={() => setOpen(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <HotCuePad key={i} deck={deck} index={i} color={CUE_COLORS[i]} hasCue={!!deck.hotCues[i]} />
            ))}
          </div>

          <div className="mt-3 text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Loop</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const n = Math.max(0, loopIdx - 1);
                setLoopIdx(n);
                if (deck.loopActive) deck.setLoopBeats(LOOP_BEATS[n]);
              }}
              className="w-7 h-7 grid place-items-center rounded-full dj-glass"
              aria-label="Halve loop"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => deck.toggleLoop(LOOP_BEATS[loopIdx])}
              className={`flex-1 h-7 rounded-full text-[10px] font-bold tabular-nums ${
                deck.loopActive ? "dj-glass-on" : "dj-glass"
              }`}
              style={{ color: deck.loopActive ? "#3bff8a" : accent }}
            >
              ↻ {LOOP_LENGTHS[loopIdx]}
            </button>
            <button
              onClick={() => {
                const n = Math.min(LOOP_LENGTHS.length - 1, loopIdx + 1);
                setLoopIdx(n);
                if (deck.loopActive) deck.setLoopBeats(LOOP_BEATS[n]);
              }}
              className="w-7 h-7 grid place-items-center rounded-full dj-glass"
              aria-label="Double loop"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2 text-[8px] text-muted-foreground leading-tight">
            Tap empty pad to set · hold to play momentary · long-press (right-click) to clear.
          </div>
        </div>
      )}
    </>
  );
}

function HotCuePad({ deck, index, color, hasCue }: { deck: Deck; index: number; color: string; hasCue: boolean }) {
  const heldRef = useRef<{ wasPlaying: boolean; t: number } | null>(null);
  return (
    <button
      onPointerDown={() => {
        if (!hasCue) {
          deck.setHotCue(index);
          return;
        }
        heldRef.current = { wasPlaying: deck.playing, t: performance.now() };
        deck.seek(deck.hotCues[index]!.time);
        deck.play();
      }}
      onPointerUp={() => {
        const h = heldRef.current;
        heldRef.current = null;
        if (!h) return;
        if (performance.now() - h.t > 200) {
          const cue = deck.hotCues[index];
          if (cue) deck.seek(cue.time);
          if (!h.wasPlaying) deck.pause();
        }
      }}
      onPointerCancel={() => (heldRef.current = null)}
      onContextMenu={(e) => {
        e.preventDefault();
        deck.clearHotCue(index);
      }}
      className="h-9 rounded-lg text-[10px] font-bold grid place-items-center dj-glass"
      style={{
        background: hasCue ? `${color}33` : undefined,
        color: hasCue ? color : "var(--muted-foreground)",
        boxShadow: hasCue ? `0 0 10px ${color}55, var(--glass-shadow)` : undefined,
      }}
    >
      {index + 1}
    </button>
  );
}
