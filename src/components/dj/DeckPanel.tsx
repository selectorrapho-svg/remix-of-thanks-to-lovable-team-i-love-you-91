import { Deck } from "@/lib/dj/engine";
import { useDeck, getMixer } from "@/lib/dj/useMixer";
import { JogWheel } from "./JogWheel";
import { Fader } from "./Fader";
import { DeckTools } from "./DeckTools";
import { DeckFxPanel } from "./DeckFxPanel";
import { SyncButton } from "./SyncButton";

import { Play, ChevronLeft, ChevronRight, ChevronDown, Repeat, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LOOP_LENGTHS = ["1/32", "1/16", "1/8", "1/4", "1/2", "1", "2", "4", "8", "16", "32"];
const LOOP_BEATS = [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32];
const LOOP_MODES = ["Auto / In-Out", "Manual / Skip", "Auto (1-32)"];

interface Props {
  deck: Deck;
  side: "left" | "right";
  compact?: boolean;
}

export function DeckPanel({ deck, side, compact }: Props) {
  useDeck(deck);
  const accent = side === "left" ? "#ff8a3b" : "#3bd2ff";
  const [loopIdx, setLoopIdx] = useState(7); // default "4"
  const [loopMenuOpen, setLoopMenuOpen] = useState(false);
  const [loopMode, setLoopMode] = useState(LOOP_MODES[0]);

  return (
    <div className={`flex gap-2 h-full min-h-0 overflow-hidden ${compact ? "px-1 py-1" : "px-2 py-2"}`}>
      {side === "left" && !compact && <SideStrip deck={deck} accent={accent} side={side} compact={compact} />}

      <div className="flex-1 flex flex-col items-center justify-between min-w-0">
        {/* top row */}
        <div className="w-full flex items-center justify-between gap-1 text-[10px] uppercase tracking-widest">
          {/* djay-style loop group: ‹ | ↻ beats | › + mode dropdown */}
          <div className="relative flex items-center gap-0.5">
            <div
              className="flex items-stretch h-7 rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--glass-border)", background: "var(--glass)" }}
            >
              <button
                onClick={() => {
                  const nextIdx = Math.max(0, loopIdx - 1);
                  setLoopIdx(nextIdx);
                  if (deck.loopActive) deck.setLoopBeats(LOOP_BEATS[nextIdx]);
                }}
                className="w-6 grid place-items-center text-muted-foreground"
                aria-label="Halve loop length"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deck.toggleLoop(LOOP_BEATS[loopIdx])}
                className="px-2 grid place-items-center tabular-nums min-w-[46px] font-semibold text-[11px]"
                style={{
                  borderLeft: "1px solid var(--glass-border)",
                  borderRight: "1px solid var(--glass-border)",
                  color: deck.loopActive ? "#f0a02a" : "var(--foreground)",
                  background: deck.loopActive ? "rgba(240,160,42,0.16)" : "transparent",
                }}
                title={deck.loopActive ? "Loop ON — tap to exit" : "Tap to set loop"}
              >
                <span className="flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {LOOP_LENGTHS[loopIdx]}
                </span>
              </button>
              <button
                onClick={() => {
                  const nextIdx = Math.min(LOOP_LENGTHS.length - 1, loopIdx + 1);
                  setLoopIdx(nextIdx);
                  if (deck.loopActive) deck.setLoopBeats(LOOP_BEATS[nextIdx]);
                }}
                className="w-6 grid place-items-center text-muted-foreground"
                aria-label="Double loop length"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* loop mode dropdown */}
            <button
              onClick={() => setLoopMenuOpen((o) => !o)}
              className="grid h-7 w-6 place-items-center rounded-lg text-muted-foreground"
              style={{ border: "1px solid var(--glass-border)", background: "var(--glass)" }}
              aria-label="Loop mode"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {loopMenuOpen && (
              <div
                className="absolute left-0 top-8 z-40 min-w-[130px] overflow-hidden rounded-md py-1"
                style={{ border: "1px solid var(--glass-border)", background: "var(--glass)", backdropFilter: "blur(12px)" }}
              >
                {LOOP_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setLoopMode(m);
                      setLoopMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] normal-case tracking-normal text-foreground hover:bg-secondary"
                  >
                    {m}
                    {loopMode === m && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <SyncButton
            onClick={() => {
              const m = getMixer();
              if (!m) return;
              const other = side === "left" ? m.decks.B : m.decks.A;
              deck.toggleSync(other);
            }}
            active={deck.syncLocked}
            accent={accent}
            width={compact ? 48 : 58}
            height={24}
          />
        </div>

        {/* jog — hidden in 4-deck mode so waveforms get the room */}
        {compact ? (
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-1">
            <div className="text-[10px] text-muted-foreground truncate max-w-full px-1">
              {deck.trackName || "No track"}
            </div>
            <div className="text-lg tabular-nums font-light" style={{ color: accent }}>
              {deck.bpm ? deck.bpm.toFixed(1) : "—"}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center w-full py-1 landscape-jog-slot">
            <JogWheel deck={deck} size={232} accent={accent} />
          </div>
        )}

        {/* transport — stays inside the panel on small landscape screens */}
        <div className="w-full shrink-0 grid grid-cols-4 items-center gap-1 text-[10px] landscape-transport">
          <Button variant="ghost"
            onClick={() => deck.toggle()}
            className={`shrink-0 rounded-xl flex items-center justify-center ${compact ? "h-10" : "h-11"} ${deck.playing ? "dj-glass-on" : "dj-glass"}`}
            style={{ boxShadow: deck.playing ? "0 0 14px #3bff8a99, var(--glass-shadow)" : undefined }}
            title="Play / Pause"
          >
            <Play className={compact ? "w-5 h-5" : "w-6 h-6"} fill={deck.playing ? "#3bff8a" : "currentColor"} stroke="none" />
          </Button>
          <Button variant="ghost"
            onClick={() => deck.setCue()}
            className={`shrink-0 rounded-xl dj-glass uppercase tracking-widest font-bold ${compact ? "px-1 h-10 text-[10px]" : "px-1 h-11 text-[11px]"}`}
            title="Set cue point at current position"
          >
            Set
          </Button>
          <Button variant="ghost"
            onPointerDown={() => {
              deck.seek(deck.cuePoint);
              deck.play();
            }}
            onPointerUp={() => {
              deck.pause();
              deck.seek(deck.cuePoint);
            }}
            onPointerCancel={() => { deck.pause(); deck.seek(deck.cuePoint); }}
            className={`shrink-0 rounded-xl dj-glass flex items-center justify-center ${compact ? "h-10" : "h-11"}`}
            title="Hold to preview from cue"
          >
            <Repeat className="w-4 h-4" style={{ color: accent }} />
          </Button>
          <Button variant="ghost"
            onClick={() => deck.toggleStem("vocals")}
            className={`shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${compact ? "h-10" : "h-11"} ${
              deck.stems.vocals.on ? "dj-glass" : "dj-glass-on"
            }`}
            style={{ color: accent }}
            title="Stems — toggle vocals"
          >
            S
          </Button>
        </div>


        {/* hot cues live in the per-deck Cues drawer (side strip) */}

      </div>

      {side === "right" && <SideStrip deck={deck} accent={accent} side={side} compact={compact} />}
    </div>

  );
}

function SideStrip({ deck, accent, side, compact }: { deck: Deck; accent: string; side: "left" | "right"; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center min-h-0 overflow-hidden ${compact ? "gap-1" : "gap-2"} ${
        side === "left" ? "order-first" : "order-last"
      }`}
    >
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">BPM</div>
      <div className={`${compact ? "text-[11px]" : "text-sm"} font-medium`} style={{ color: accent }}>
        {deck.bpm ? deck.bpm.toFixed(1) : "—"}
      </div>
      <Fader
        value={1 - (deck.pitch + 25) / 50}
        onChange={(v) => deck.setPitch((1 - v) * 50 - 25)}
        height={compact ? 56 : 90}
        knobColor={accent}
        marks
      />
      <Fader value={deck.volume} onChange={(v) => deck.setVolume(v)} height={compact ? 46 : 70} knobColor={accent} />
      <DeckFxPanel deck={deck} accent={accent} side={side} compact={compact} />
      <div className="flex flex-col items-center gap-1">
        <DeckTools deck={deck} accent={accent} side={side} />
      </div>



    </div>
  );
}
