import { useEffect, useState } from "react";

export type JogStyle =
  | "rane"
  | "silver"
  | "black"
  | "neon"
  | "pioneer"
  | "neonDisc"
  | "pioneer3d"
  | "neonDisc3d"
  | "vinyl"
  | "chrome"
  | "army"
  | "olive"
  | "carbon"
  | "gold"
  | "diamondVinyl"
  | "goldVinyl"
  | "neonVinyl";

export const JOG_STYLES: { key: JogStyle; label: string }[] = [
  { key: "rane", label: "Rane inspired" },
  { key: "silver", label: "Silver" },
  { key: "black", label: "Black" },
  { key: "neon", label: "Neon" },
  { key: "pioneer", label: "Pioneer 2D" },
  { key: "pioneer3d", label: "Pioneer 3D" },
  { key: "neonDisc", label: "Neon Disc" },
  { key: "neonDisc3d", label: "Neon 3D" },
  { key: "vinyl", label: "Vinyl" },
  { key: "chrome", label: "Chrome" },
  { key: "army", label: "Army" },
  { key: "olive", label: "Army Green" },
  { key: "carbon", label: "Carbon" },
  { key: "gold", label: "Gold" },
  { key: "diamondVinyl", label: "Diamond vinyl" },
  { key: "goldVinyl", label: "Gold vinyl" },
  { key: "neonVinyl", label: "Neon vinyl" },
];


export type VideoTransition = "cut" | "fade" | "dip" | "zoom" | "slide" | "flash";
export type VideoFx = "none" | "bw" | "invert" | "sepia" | "strobe" | "blur" | "rgb" | "hue";

export const VIDEO_TRANSITIONS: { key: VideoTransition; label: string }[] = [
  { key: "cut", label: "Cut" },
  { key: "fade", label: "Fade" },
  { key: "dip", label: "Dip to Black" },
  { key: "zoom", label: "Zoom" },
  { key: "slide", label: "Slide" },
  { key: "flash", label: "Flash" },
];

export const VIDEO_FX: { key: VideoFx; label: string }[] = [
  { key: "none", label: "None" },
  { key: "bw", label: "B/W" },
  { key: "invert", label: "Invert" },
  { key: "sepia", label: "Sepia" },
  { key: "strobe", label: "Strobe" },
  { key: "blur", label: "Blur" },
  { key: "rgb", label: "RGB Shift" },
  { key: "hue", label: "Hue Spin" },
];

export interface DjSettings {
  showWatermark: boolean;
  watermarkText: string;
  watermarkLogo: boolean;
  jogStyle: JogStyle;
  keyLock: boolean;
  floatingVideo: boolean;
  videoScale: number;
  videoTransition: VideoTransition;
  videoFx: VideoFx;
  videoFollowCrossfader: boolean;
  waveColor: string;
  waveOrientation: "vertical" | "horizontal";
  brakeOnPause: boolean;
  waveHighContrast: boolean;
  waveScratch: boolean;
}
const KEY = "mixrdjs.settings.v1";
const DEFAULT: DjSettings = {
  showWatermark: true,
  watermarkText: "DjogPro",
  watermarkLogo: true,
  jogStyle: "silver",
  keyLock: false,
  floatingVideo: false,
  videoScale: 1,
  videoTransition: "fade",
  videoFx: "none",
  videoFollowCrossfader: true,
  waveColor: "all",
  waveOrientation: "vertical",
  brakeOnPause: false,
  waveHighContrast: false,
  waveScratch: true,
};

const listeners = new Set<() => void>();
let current: DjSettings = DEFAULT;
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  (globalThis as { __djWaveColor?: string; __djBrake?: boolean }).__djWaveColor = current.waveColor;
  (globalThis as { __djBrake?: boolean }).__djBrake = current.brakeOnPause;
}


export function useDjSettings(): [DjSettings, (p: Partial<DjSettings>) => void] {
  const [, setT] = useState(0);
  useEffect(() => {
    const fn = () => setT((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const update = (p: Partial<DjSettings>) => {
    current = { ...current, ...p };
    (globalThis as { __djWaveColor?: string; __djBrake?: boolean }).__djWaveColor = current.waveColor;
  (globalThis as { __djBrake?: boolean }).__djBrake = current.brakeOnPause;
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {}
    listeners.forEach((l) => l());
  };

  return [current, update];
}
