import { Deck, type StemKey } from "@/lib/dj/engine";
import { Drum, Guitar, Piano, Mic, X } from "lucide-react";

const STEMS: { key: StemKey; label: string; Icon: typeof Drum }[] = [
  { key: "drums", label: "Drums", Icon: Drum },
  { key: "bass", label: "Bass", Icon: Guitar },
  { key: "other", label: "Harmonic", Icon: Piano },
  { key: "vocals", label: "Vocals", Icon: Mic },
];

/** Four vertical stem faders (djay Neural Mix style). Tap an icon to mute/unmute. */
export function StemsPanel({ deck, accent, onClose }: { deck: Deck; accent: string; onClose: () => void }) {
  return (
    <div className="stems-panel dj-glass absolute inset-x-1 bottom-14 z-30 rounded-xl p-2">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Stems · Deck {deck.id}</span>
        <button onClick={onClose} aria-label="Close stems" className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STEMS.map(({ key, label, Icon }) => {
          const v = deck.stemLevels[key];
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <button
                onClick={() => deck.setStemLevel(key, v > 0.01 ? 0 : 1)}
                aria-label={`Toggle ${label}`}
                className={`grid h-7 w-full place-items-center rounded-md border border-border ${v > 0.01 ? "bg-muted" : "bg-background opacity-50"}`}
              >
                <Icon className="size-4" style={{ color: v > 0.01 ? accent : undefined }} />
              </button>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <input
                type="range" min={0} max={1} step={0.01} value={v}
                onChange={(e) => deck.setStemLevel(key, Number(e.target.value))}
                aria-label={`${label} level`}
                className="stem-slider"
                style={{ ["--stem-accent" as string]: accent }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
