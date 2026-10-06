import { useState } from "react";
import { Sliders, X } from "lucide-react";
import { Deck } from "@/lib/dj/engine";
import { getMixer } from "@/lib/dj/useMixer";
import { DeckFxPanel } from "./DeckFxPanel";
import { SamplerPanel } from "./SamplerPanel";
import { HotCuePanel } from "./HotCuePanel";

/** One performance-tools entry point per deck, instead of three adjacent buttons. */
export function DeckTools({ deck, accent, side }: { deck: Deck; accent: string; side: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return <>
    <button aria-label={`Deck ${deck.id} tools`} title="Loops, cues, FX and samples" onClick={() => setOpen((value) => !value)} className={`grid size-9 place-items-center rounded-full ${open ? "dj-glass-on" : "dj-glass"}`}>
      <Sliders className="size-4" />
    </button>
    {open && <div className={`fixed z-[60] top-14 ${side === "left" ? "left-2" : "right-2"} w-[230px] max-w-[70vw] rounded-md border border-border bg-popover p-3 shadow-lg`}>
      <div className="flex items-center justify-between text-xs font-semibold mb-3">Deck {deck.id} tools <button aria-label="Close tools" onClick={() => setOpen(false)}><X className="size-4" /></button></div>
      <div className="flex items-center justify-around gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1"><HotCuePanel deck={deck} accent={accent} side={side} /><span>Cues · loops</span></div>
        <div className="flex flex-col items-center gap-1"><DeckFxPanel deck={deck} accent={accent} side={side} compact /><span>FX</span></div>
        <div className="flex flex-col items-center gap-1"><SamplerPanel mixer={getMixer()} side={side} /><span>Samples</span></div>
      </div>
    </div>}
  </>;
}