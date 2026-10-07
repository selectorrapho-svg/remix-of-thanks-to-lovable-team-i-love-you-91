import { useEffect, useRef, useState } from "react";
import { Deck, computeBandedPeaks, BandedPeaks } from "@/lib/dj/engine";
import { stemBands, smoothAt, BAND_STEM } from "@/lib/dj/wavedraw";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDjSettings } from "@/hooks/useDjSettings";
import { useWaveScratch } from "@/lib/dj/useWaveScratch";


interface Props {
  deck: Deck;
  color: string;
  index: 1 | 2;
}

// Horizontal scrolling stem waveform — smooth interpolated RGB envelopes.
export function HorizontalWaveform({ deck, color, index }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<BandedPeaks | null>(null);
  const rafRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [settings] = useDjSettings();

  useEffect(() => {
    if (!deck.buffer) {
      peaksRef.current = null;
      return;
    }
    peaksRef.current = computeBandedPeaks(deck.buffer, 16000);
  }, [deck.buffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const resize = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const draw = () => {
      resize();
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cy = H / 2;
      const secondsVisible = 8 / zoom;
      const pxPerSec = W / secondsVisible;
      const peaks = peaksRef.current;
      const dur = deck.duration;
      const t = deck.currentTime;

      if (!peaks || dur === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(0, cy - 1, W, 2);
        ctx.fillStyle = "#ff3b3b";
        ctx.fillRect(W / 2 - 1, 0, 2, H);
        return;
      }

      const samples = peaks.overall.length;
      const secsPerBin = dur / samples;
      const step = Math.max(1, Math.floor(dpr));

      ctx.globalCompositeOperation = "source-over";
      for (const [key, col, scale] of stemBands()) {
        if (!deck.stems[BAND_STEM[key as string]].on) continue;
        const arr = peaks[key] as Float32Array;
        // smooth filled envelope (mirrored) — silky at any zoom
        ctx.beginPath();
        ctx.moveTo(0, cy);
        for (let x = 0; x <= W; x += step) {
          const timeAt = t + (x - W / 2) / pxPerSec;
          const v = smoothAt(arr, timeAt / secsPerBin) * cy * scale;
          ctx.lineTo(x, cy - v);
        }
        for (let x = W; x >= 0; x -= step) {
          const timeAt = t + (x - W / 2) / pxPerSec;
          const v = smoothAt(arr, timeAt / secsPerBin) * cy * scale;
          ctx.lineTo(x, cy + v);
        }
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // dim the already-played half
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W / 2, H);

      // beat grid
      if (deck.bpm && deck.bpm > 40) {
        const secPerBeat = 60 / deck.bpm;
        const firstBeat = Math.floor((t - secondsVisible / 2) / secPerBeat);
        const lastBeat = Math.ceil((t + secondsVisible / 2) / secPerBeat);
        for (let bi = firstBeat; bi <= lastBeat; bi++) {
          const bx = W / 2 + (bi * secPerBeat - t) * pxPerSec;
          const isDown = bi % 4 === 0;
          ctx.fillStyle = isDown ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.09)";
          ctx.fillRect(bx, isDown ? 0 : H * 0.15, 1, isDown ? H : H * 0.7);
          if (isDown) {
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = `${10 * dpr}px ui-sans-serif`;
            ctx.fillText(String(Math.max(1, Math.floor(bi / 4) + 1)), bx + 3, 11 * dpr);
          }
        }
      }

      // playhead
      ctx.fillStyle = "#ff3b3b";
      ctx.fillRect(W / 2 - 1, 0, 2, H);

      // hot cues
      deck.hotCues.forEach((c, i) => {
        if (!c) return;
        const x = W / 2 + (c.time - t) * pxPerSec;
        if (x < -10 || x > W + 10) return;
        const cuc = ["#ff3b3b", "#ffcf3b", "#3bff8a", "#3bd2ff", "#a83bff", "#ff3bd2", "#ffffff", "#ff7a3b"][i];
        ctx.fillStyle = cuc;
        ctx.beginPath();
        ctx.moveTo(x - 6, 0);
        ctx.lineTo(x + 6, 0);
        ctx.lineTo(x, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x - 0.5, 0, 1, H);
      });

      // deck label
      ctx.fillStyle = color;
      ctx.font = `${12 * dpr}px ui-sans-serif`;
      ctx.fillText(String(index), 6, 14 * dpr);
    };

    let frame = 0;
    const loop = () => {
      // idle decks redraw ~10fps to keep phones cool and responsive
      if (deck.playing || deck.scratching || frame++ % 6 === 0) draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [deck, color, index, zoom]);

  const scratch = useWaveScratch(deck, "x", () => {
    const w = canvasRef.current?.clientWidth ?? 1;
    return w / (8 / zoom);
  });

  return (
    <div className={`relative w-full h-full bg-background ${settings.waveHighContrast ? "wave-high-contrast" : ""}`} style={{ touchAction: "none" }} {...(settings.waveScratch ? scratch : {})}>
      <canvas ref={canvasRef} className="w-full h-full block"  />

      <div className="absolute right-1 top-1 flex gap-1">
        <Button variant="ghost"
          onPointerDown={event => event.stopPropagation()}
          onClick={() => setZoom((z) => Math.min(4, z * 1.4))}
          className="dj-glass size-6 p-0 rounded-md text-muted-foreground"
        >
          <ZoomIn className="w-3 h-3" />
        </Button>
        <Button variant="ghost"
          onPointerDown={event => event.stopPropagation()}
          onClick={() => setZoom((z) => Math.max(0.25, z / 1.4))}
          className="dj-glass size-6 p-0 rounded-md text-muted-foreground"
        >
          <ZoomOut className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
