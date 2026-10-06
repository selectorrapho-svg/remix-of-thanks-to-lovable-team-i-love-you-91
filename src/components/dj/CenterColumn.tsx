import { useRef, useState } from "react";
import { Activity, Grid3x3, Sliders } from "lucide-react";
import { Deck, Mixer } from "@/lib/dj/engine";
import { useDeck } from "@/lib/dj/useMixer";
import { Waveform } from "./Waveform";
import { HorizontalWaveform } from "./HorizontalWaveform";
import { useDjSettings } from "@/hooks/useDjSettings";
import { Button } from "@/components/ui/button";
import { WaveformOptions } from "./WaveformOptions";
import { Crossfader } from "./Crossfader";
import { VideoMixStage } from "./VideoMixStage";
import { Knob } from "./Knob";
import { CuePointGrid } from "./CuePointGrid";
import { LevelMeter } from "./LevelMeter";
import { Minus, Maximize2 } from "lucide-react";

type CenterView = "mixer" | "wave" | "pads";

const EQ_BANDS = ["high", "mid", "low"] as const;

export function CenterColumn({ deckA, deckB, mixer, videoMode = false }: { deckA: Deck; deckB: Deck; mixer: Mixer; videoMode?: boolean }) {
  useDeck(deckA);
  useDeck(deckB);
  const hasVideo = !!deckA.videoEl || !!deckB.videoEl;
  const [view, setView] = useState<CenterView | null>(null);
  const [djs] = useDjSettings();
  const vertical = djs.waveOrientation !== "horizontal";

  return (
    <div className="flex flex-col h-full py-2 gap-2">
      {videoMode ? <div className="min-h-0 flex-1 flex items-center"><VideoMixStage deckA={deckA} deckB={deckB} embedded /></div> : hasVideo && <FloatingVideo deckA={deckA} deckB={deckB} />}

      {/* 3-button view switcher — Mixer / Waveform (default) / Pads */}
      <div className="flex items-center justify-center gap-2 py-0.5">
        <ViewButton active={view === "mixer"} onClick={() => setView(current => current === "mixer" ? null : "mixer")} label="Mixer">
          <Sliders className="w-4 h-4" />
        </ViewButton>
        <ViewButton active={view === "wave"} onClick={() => setView(current => current === "wave" ? null : "wave")} label="Waveforms">
          <Activity className="w-4 h-4" />
        </ViewButton>
        <ViewButton active={view === "pads"} onClick={() => setView(current => current === "pads" ? null : "pads")} label="Hot cues">
          <Grid3x3 className="w-4 h-4" />
        </ViewButton>
      </div>

      <div className={`${view ? "flex-1" : videoMode ? "hidden" : "flex-1"} min-h-0 border-b border-border`}>
        {view === "wave" && (
          <div className={`flex h-full min-h-0 gap-1 ${vertical ? "" : "flex-col"}`}>
            {!vertical && (<>
              <div className="flex-1 min-h-0"><HorizontalWaveform deck={deckA} color="#ff8a3b" index={1} /></div>
              <div className="flex-1 min-h-0"><HorizontalWaveform deck={deckB} color="#3bd2ff" index={2} /></div>
            </>)}
            {vertical && (<>
            <div className="relative flex-1 min-w-0">
              <div className="absolute top-0 left-0 z-20"><WaveformOptions /></div><Waveform deck={deckA} side="left" color="#ff8a3b" />
            </div>
            <div className="flex-1 min-w-0">
              <Waveform deck={deckB} side="right" color="#3bd2ff" />
            </div>
            </>)}
          </div>
        )}

        {view === "mixer" && <MixerView deckA={deckA} deckB={deckB} />}

        {view === "pads" && (
          <div className="flex h-full min-h-0 gap-1">
            <div className="flex-1 min-w-0">
              <CuePointGrid deck={deckA} />
            </div>
            <div className="flex-1 min-w-0">
              <CuePointGrid deck={deckB} />
            </div>
          </div>
        )}
      </div>

      <div className="px-2 border-t-2 border-border pt-2 relative before:absolute before:left-1/2 before:-translate-x-1/2 before:-top-4 before:h-4 before:w-px before:bg-border">
        <Crossfader value={mixer.lastCross} onChange={(v) => mixer.setCrossfade(v)} />
      </div>
    </div>
  );
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <Button variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`grid h-7 w-9 place-items-center rounded-md ${active ? "dj-glass-on text-primary" : "dj-glass text-muted-foreground"}`}
      style={active ? { boxShadow: "0 0 10px rgba(80,160,255,0.35), var(--glass-shadow)" } : undefined}
    >
      {children}
    </Button>
  );
}

// Compact dual-channel mixer. The deck volume controls remain on the decks;
// this overview is reserved for shaping the sound.
function MixerView({ deckA, deckB }: { deckA: Deck; deckB: Deck }) {
  const [knobs, setKnobs] = useState<Record<"A" | "B", number[]>>({ A: [0, 0, 0], B: [0, 0, 0] });
  const [filter, setFilter] = useState<Record<"A" | "B", number>>({ A: 0, B: 0 });
  const [eqOn, setEqOn] = useState(true);
  const saved = useRef<Record<"A" | "B", number[]>>({ A: [0, 0, 0], B: [0, 0, 0] });

  const setBand = (id: "A" | "B", deck: Deck, band: (typeof EQ_BANDS)[number], v: number) => {
    deck.setEq(band, v);
    const idx = EQ_BANDS.indexOf(band);
    setKnobs((k) => ({ ...k, [id]: k[id].map((x, i) => (i === idx ? v : x)) }));
  };

  const toggleEq = () => {
    if (eqOn) {
      saved.current = { A: [...knobs.A], B: [...knobs.B] };
      for (const [id, deck] of [["A", deckA], ["B", deckB]] as const) {
        EQ_BANDS.forEach((band) => {
          deck.setEq(band, 0);
          const idx = EQ_BANDS.indexOf(band);
          setKnobs((k) => ({ ...k, [id]: k[id].map((x, i) => (i === idx ? 0 : x)) }));
        });
      }
      setEqOn(false);
    } else {
      (["A", "B"] as const).forEach((id) => {
        const deck = id === "A" ? deckA : deckB;
        EQ_BANDS.forEach((band, i) => deck.setEq(band, saved.current[id][i]));
      });
      setKnobs({ A: [...saved.current.A], B: [...saved.current.B] });
      setEqOn(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 min-h-0 items-center justify-center gap-1 px-1">
        <ChannelStrip id="A" accent="#ff8a3b" filter={filter.A} eq={knobs.A}
          onFilter={(v) => { setFilter((f) => ({ ...f, A: v })); deckA.setFilter(v); }}
          onBand={(band, v) => setBand("A", deckA, band, v)} />
        <div className="flex h-full max-h-56 items-stretch gap-1 py-2"><LevelMeter deck={deckA} label="A" /><LevelMeter deck={deckB} label="B" /></div>
        <ChannelStrip id="B" accent="#3bd2ff" filter={filter.B} eq={knobs.B}
          onFilter={(v) => { setFilter((f) => ({ ...f, B: v })); deckB.setFilter(v); }}
          onBand={(band, v) => setBand("B", deckB, band, v)} />
      </div>
      <div className="flex justify-center pb-1">
        <button
          onClick={toggleEq}
          aria-label="EQ on/off"
          className={`grid size-10 place-items-center rounded-full text-[10px] font-bold tracking-widest ${eqOn ? "dj-glass-on text-primary" : "dj-glass text-muted-foreground"}`}
          style={eqOn ? { boxShadow: "0 0 12px rgba(80,160,255,0.35), var(--glass-shadow)" } : undefined}
        >
          EQ
        </button>
      </div>
    </div>
  );
}

function ChannelStrip({
  id, accent, filter, eq, onFilter, onBand,
}: {
  id: "A" | "B";
  accent: string;
  filter: number;
  eq: number[];
  onFilter: (v: number) => void;
  onBand: (band: (typeof EQ_BANDS)[number], v: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 max-w-[110px] flex-col items-center justify-between gap-1 py-1 h-full max-h-64">
      <div className="text-[9px] font-bold uppercase text-muted-foreground">CH <span style={{ color: accent }}>{id}</span></div>
      <Knob value={filter} min={-1} max={1} size={30} label="FILTER" color={accent} showTicks={false} onChange={onFilter} />
      <Knob value={eq[0]} min={-1} max={1} size={28} label="HI" color={accent} showTicks={false} onChange={(v) => onBand("high", v)} />
      <Knob value={eq[1]} min={-1} max={1} size={28} label="MID" color={accent} showTicks={false} onChange={(v) => onBand("mid", v)} />
      <Knob value={eq[2]} min={-1} max={1} size={28} label="LOW" color={accent} showTicks={false} onChange={(v) => onBand("low", v)} />
    </div>
  );
}

// Floating, draggable video window so the waveforms keep their full height.
function FloatingVideo({ deckA, deckB }: { deckA: Deck; deckB: Deck }) {
  const [pos, setPos] = useState({ x: 12, y: 56 });
  const [mini, setMini] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  return (
    <div
      className="fixed z-[60] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: mini ? 120 : "min(300px, 38vw)" }}
    >
      <div
        className="flex items-center justify-between bg-secondary px-2 py-1 text-[9px] uppercase tracking-widest text-muted-foreground"
        style={{ touchAction: "none", cursor: "move" }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPos({ x: Math.max(0, Math.min(window.innerWidth - 120, e.clientX - drag.current.dx)), y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.current.dy)) });
        }}
        onPointerUp={() => { drag.current = null; }}
      >
        <span>Video</span>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setMini((m) => !m)} aria-label={mini ? "Enlarge video" : "Shrink video"}>
          {mini ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
      </div>
      <VideoMixStage deckA={deckA} deckB={deckB} />
    </div>
  );
}
