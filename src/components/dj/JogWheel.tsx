import { useEffect, useRef, useState } from "react";
import { Deck } from "@/lib/dj/engine";
import { useDjSettings } from "@/hooks/useDjSettings";

interface Props {
  deck: Deck;
  size: number;
  accent: string;
}

// Bundled locally (not CDN) so the jog skins also work fully offline in the APK.
import jogPioneer from "@/assets/jogs/jog-pioneer.jpeg";
import jogNeonDisc from "@/assets/jogs/jog-neon-disc.webp";
import diamondArm from "@/assets/jogs/diamond_skin_tete_de_lecture_left.webp.asset.json";
import goldArm from "@/assets/jogs/gold_skin_tete_de_lecture.webp.asset.json";
import neonArm from "@/assets/jogs/neon_skin_tete_de_lecture.jpg.asset.json";
import unloadedJog from "@/assets/jogs/jog-unloaded.png.asset.json";
import loadedJog from "@/assets/jogs/jog-loaded.png.asset.json";

const JOG_BG: Record<string, string> = {
  silver: "#c8c8c8",
  black: "#111",
  neon: "#0a0a1a",
  pioneer: "#0c0c0c",
  pioneer3d: "#0c0c0c",
  neonDisc: "#08081a",
  neonDisc3d: "#08081a",
  vinyl: "#151515",
  chrome: "#d8dde2",
  army: "#3b4028",
  olive: "#4b5320",
  carbon: "#141416",
  gold: "#a8842c",
  diamondVinyl: "#092323",
  goldVinyl: "#292011",
  neonVinyl: "#101427",
};
const VINYL_ARM: Record<string, string> = { diamondVinyl: diamondArm.url, goldVinyl: goldArm.url, neonVinyl: neonArm.url };
const JOG_IMAGE: Record<string, string | undefined> = {
  pioneer: jogPioneer,
  pioneer3d: jogPioneer,
  neonDisc: jogNeonDisc,
  neonDisc3d: jogNeonDisc,
};
// 3D variants keep the same skin art but add sculpted gloss + depth shading.
const JOG_3D = new Set(["pioneer3d", "neonDisc3d"]);

// Used when a skin image is configured but fails to load (missing/blocked asset).
const JOG_IMAGE_FALLBACK = jogNeonDisc;


// Vinyl-style jog wheel matching the reference (image 1):
// dark platter, thin red position marker, large blue BPM, +/- pitch above,
// elapsed + remaining time below. Rotates ONLY while a track is loaded AND playing.
export function JogWheel({ deck, size, accent }: Props) {
  const [s] = useDjSettings();
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const last = useRef({ angle: 0, t: 0, scratching: false });
  const rotRef = useRef(0);
  const lastFrame = useRef(performance.now());
  const [, tick] = useState(0);

  // Resolve the skin image with a graceful fallback: if the configured asset
  // fails to load, try a known-good skin, then fall back to the flat colour.
  const wanted = JOG_IMAGE[s.jogStyle];
  const [skin, setSkin] = useState<string | undefined>(wanted);
  useEffect(() => {
    setSkin(wanted);
    if (!wanted || typeof window === "undefined") return;
    let cancelled = false;
    const probe = (url: string, onFail: () => void) => {
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setSkin(url);
      };
      img.onerror = () => {
        if (!cancelled) onFail();
      };
      img.src = url;
    };
    probe(wanted, () => {
      if (wanted === JOG_IMAGE_FALLBACK) {
        setSkin(undefined);
        return;
      }
      probe(JOG_IMAGE_FALLBACK, () => setSkin(undefined));
    });
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  // Continuous rotation only when a track is loaded AND playing.
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = (now - lastFrame.current) / 1000;
      lastFrame.current = now;
      const canSpin = !!deck.buffer && deck.playing && !last.current.scratching;
      if (canSpin) {
        const rps = ((deck.bpm || 120) / 120) * (deck.rate || 1) * 0.55;
        rotRef.current = (rotRef.current + dt * rps * 360) % 360;
      }
      const r = `rotate(${rotRef.current}deg)`;
      if (markerRef.current) markerRef.current.style.transform = r;
      if (ringRef.current) ringRef.current.style.transform = r;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [deck]);

  useEffect(() => {
    const id = setInterval(() => tick((t) => (t + 1) % 1000), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let c = { x: 0, y: 0 };
    const ang = (x: number, y: number) => {
      return Math.atan2(y - c.y, x - c.x);
    };
    let pointerId = -1;
    let idleTimer = 0;
    let moved = false;
    const down = (e: PointerEvent) => {
      if (!deck.buffer || pointerId !== -1) return;
      const box = el.getBoundingClientRect();
      c = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      e.preventDefault();
      clearTimeout(idleTimer);
      pointerId = e.pointerId;
      el.setPointerCapture(pointerId);
      last.current = { angle: ang(e.clientX, e.clientY), t: e.timeStamp, scratching: true };
      moved = false;
      deck.scratchStart();
    };
    // Process every raw sample of the pointer stream (not just the throttled
    // one the browser delivers) so fast flares track 1:1 with the finger.
    const step = (x: number, y: number, now: number) => {
      const a = ang(x, y);
      let d = a - last.current.angle;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      const dt = Math.max((now - last.current.t) / 1000, 0.001);
      const revPerSec = d / (2 * Math.PI) / dt;
      // 1 platter revolution ≈ 1.8s of audio (33rpm vinyl feel), no tempo skew:
      // the rate must follow the hand, not the song.
      const target = Math.abs(d) < 0.001 ? 0 : Math.max(-10, Math.min(10, revPerSec * 1.8));
      deck.scratch(target);
      // Pointer events stop when the hand holds the platter still. Explicitly
      // stop the audio rather than leaving the last reverse/forward rate running.
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => deck.scratch(0), 32);
      rotRef.current = (rotRef.current + (d * 180) / Math.PI + 360) % 360;
      last.current.angle = a;
      last.current.t = now;
      if (Math.abs(d) > 0.002) moved = true;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId || !last.current.scratching) return;
      if (!deck.buffer) return;
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      if (events.length > 1) {
        for (const ce of events) step(ce.clientX, ce.clientY, ce.timeStamp || performance.now());
      } else {
        step(e.clientX, e.clientY, e.timeStamp);
      }
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      last.current.scratching = false;
      pointerId = -1;
      clearTimeout(idleTimer);
      deck.endScratch();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
    return () => {
      clearTimeout(idleTimer);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("lostpointercapture", up);
      if (last.current.scratching) deck.endScratch();
    };
  }, [deck]);

  const fmt = (sec: number) => {
    if (!isFinite(sec)) return "00:00.0";
    const sign = sec < 0 ? "-" : "";
    const abs = Math.abs(sec);
    const m = Math.floor(abs / 60);
    const s2 = (abs % 60).toFixed(1);
    return `${sign}${m.toString().padStart(2, "0")}:${s2.padStart(4, "0")}`;
  };

  const loaded = !!deck.buffer || !!deck.videoEl;
  const is3d = JOG_3D.has(s.jogStyle);
  const arm = VINYL_ARM[s.jogStyle];
  const isVinyl = !!arm;

  return (
    <div className="reference-jog" style={{ width: size, maxWidth: "100%" }}>
      <div ref={ref} data-loaded={loaded} role="slider" aria-label={`Scratch deck ${deck.id}`} aria-valuemin={0} aria-valuemax={deck.duration} aria-valuenow={deck.currentTime} className="relative aspect-square w-full touch-none select-none">
        <div ref={ringRef} className="absolute inset-0 pointer-events-none will-change-transform">
          <img src={loaded ? loadedJog.url : unloadedJog.url} alt={loaded ? "Loaded silver jogwheel" : "Empty dark jogwheel"} draggable={false} className="size-full rounded-full object-contain" />
          {loaded && deck.coverUrl && <img src={deck.coverUrl} alt="" draggable={false} className="jog-album-art" />}
        </div>
        <div ref={markerRef} className="absolute inset-0 pointer-events-none will-change-transform"><span className="jog-position-marker" /></div>
      </div>
    </div>
  );
}
