import { useEffect, useState } from "react";
import { Settings, X, Music2, Video, Layers, Disc3, Circle, Gamepad2 } from "lucide-react";
import { getMixer } from "@/lib/dj/useMixer";
import { AppMode } from "@/hooks/useAppMode";
import { WAVE_COLORS } from "@/lib/dj/wavedraw";
import { useDjSettings, JOG_STYLES, VIDEO_FX, VIDEO_TRANSITIONS } from "@/hooks/useDjSettings";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { connectMidi, subscribeMidi, MidiInfo } from "@/lib/dj/midi";
import { Portal } from "./Portal";
import { Button } from "@/components/ui/button";
import settingsArtwork from "@/assets/djogwheels-splash-clean.jpg";
import brandLogo from "@/assets/djogwheels-user-logo-cropped.png";
import {
  notify,
  notificationState,
  requestMicrophone,
  requestNotifications,
  requestWakeLock,
  PermState,
} from "@/lib/dj/permissions";

export function SettingsPanel({
  mode,
  setMode,
}: {
  mode: AppMode;
  setMode: (m: AppMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<"decks" | "appearance" | "playback">("decks");
  const [s, setS] = useDjSettings();
  const { theme, setTheme } = useTheme();
  const [recording, setRecording] = useState(false);
  const [midi, setMidi] = useState<MidiInfo>({ supported: false, connected: [] });
  useEffect(() => {
    const un = subscribeMidi(setMidi);
    return () => {
      un();
    };
  }, []);
  const [, setTick] = useState(0);
  const [perms, setPerms] = useState<{ notif: PermState; mic: PermState; wake: PermState }>({
    notif: "prompt",
    mic: "prompt",
    wake: "prompt",
  });
  useEffect(() => {
    setPerms((p) => ({ ...p, notif: notificationState() }));
  }, [open]);

  const toggleRecord = async () => {
    const m = getMixer();
    if (!m) return;
    if (recording) {
      const blob = await m.stopRecord();
      setRecording(false);
      if (blob && blob.size) {
        const url = URL.createObjectURL(blob);
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const a = document.createElement("a");
        a.href = url;
        a.download = `mix-${Date.now()}.${ext}`;
        a.click();
        // Free the recording from memory once the download has started.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } else {
      m.resume();
      m.startRecord();
      setRecording(true);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon"
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center dj-glass"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-muted-foreground" />
      </Button>
      {open && (
        <Portal>
        <div
          className="fixed inset-0 z-[280] bg-background flex items-stretch justify-center p-0"
          onClick={() => setOpen(false)}
          style={{ height: "100dvh" }}
        >
          <div
            className="relative isolate dj-panel w-full max-w-[900px] rounded-none p-3 h-full overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <img src={settingsArtwork} alt="" className="h-full w-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-background/75" />
            </div>
            <div className="sticky top-0 z-10 -mx-3 mb-3 flex items-center justify-between border-b border-border bg-background/90 px-3 py-2 backdrop-blur">
              <div className="flex items-center gap-2 min-w-0"><img src={brandLogo} alt="djogwheels PRO" className="w-20 h-9 object-contain" /><h2 className="text-sm uppercase tracking-widest">Settings</h2></div>
              <Button variant="outline" size="icon" onClick={() => setOpen(false)} className="size-9 shrink-0" aria-label="Close settings">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="sticky top-[53px] z-10 mb-4 grid grid-cols-3 gap-1 border-b border-border bg-background/90 p-1 backdrop-blur" role="tablist" aria-label="Settings categories">
              {([ ["decks", "Decks"], ["appearance", "Appearance"], ["playback", "Audio & video"] ] as const).map(([key, label]) => (
                <Button key={key} role="tab" aria-selected={page === key} variant={page === key ? "default" : "ghost"} onClick={() => setPage(key)} className="h-10 min-w-0 px-1 text-[11px] sm:text-sm">{label}</Button>
              ))}
            </div>
            <div className="pb-8">
            {page === "decks" && <>
            <Section title="Modes & Decks">
              <div className="grid grid-cols-3 landscape:grid-cols-6 gap-2 landscape:gap-3">
                <Tile
                  label="Mix"
                  color="#2f6bff"
                  on={mode === "mix"}
                  icon={<Music2 className="w-5 h-5" />}
                  onClick={() => setMode("mix")}
                />
                <Tile
                  label="Video"
                  color="#d63bd2"
                  on={mode === "video"}
                  icon={<Video className="w-5 h-5" />}
                  onClick={() => setMode("video")}
                />
                <Tile
                  label="4 Decks"
                  color="#12b886"
                  on={!!getMixer()?.fourDeck}
                  icon={<Layers className="w-5 h-5" />}
                  onClick={() => {
                    const m = getMixer();
                    if (m) m.setFourDeck(!m.fourDeck);
                    setTick((t) => t + 1);
                  }}
                />
                <Tile
                  label="A · B"
                  color="#ff8a3b"
                  on={!getMixer()?.fourDeck && getMixer()?.activePair === "AB"}
                  icon={<Disc3 className="w-5 h-5" />}
                  onClick={() => {
                    const m = getMixer();
                    if (!m) return;
                    m.setFourDeck(false);
                    m.setActivePair("AB");
                    setTick((t) => t + 1);
                  }}
                />
                <Tile
                  label="C · D"
                  color="#3bd2ff"
                  on={!getMixer()?.fourDeck && getMixer()?.activePair === "CD"}
                  icon={<Disc3 className="w-5 h-5" />}
                  onClick={() => {
                    const m = getMixer();
                    if (!m) return;
                    m.setFourDeck(false);
                    m.setActivePair("CD");
                    setTick((t) => t + 1);
                  }}
                />
                <Tile
                  label={recording ? "Stop" : "Rec"}
                  color="#ff3b3b"
                  on={recording}
                  icon={<Circle className="w-5 h-5" fill={recording ? "#ff3b3b" : "transparent"} />}
                  onClick={toggleRecord}
                />
              </div>
            </Section>
            <Section title="DJ Controller (MIDI)">
              <Button variant="outline" onClick={() => { const m = getMixer(); if (m) void connectMidi(m); }} className="w-full flex items-center gap-2 text-xs uppercase">
                <Gamepad2 className="w-4 h-4" />{midi.connected.length ? "Rescan controllers" : "Connect controller"}
              </Button>
              <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                {!midi.supported ? "Web MIDI requires Chrome or Edge on a compatible device." : midi.connected.length ? `Connected: ${midi.connected.join(", ")}` : "No controller detected — connect via USB/OTG and tap rescan."}
              </div>
            </Section>
            </>}

            {page === "appearance" && <>
            <Section title="App Skin / Theme">
              <div className="grid grid-cols-3 landscape:grid-cols-7 gap-2">
                {THEMES.map((t) => (
                  <Pill key={t} on={theme === t} onClick={() => setTheme(t)}>
                    {t}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title="Jog Wheel Style">
              <div className="grid grid-cols-3 landscape:grid-cols-7 gap-2">
                {JOG_STYLES.map((j) => (
                  <Pill key={j.key} on={s.jogStyle === j.key} onClick={() => setS({ jogStyle: j.key })}>
                    {j.label}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title="Waveform">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Direction
                  <select value={s.waveOrientation} onChange={(e) => setS({ waveOrientation: e.target.value as typeof s.waveOrientation })} className="mt-1 w-full rounded-sm border border-border bg-secondary px-2 py-2 text-xs text-foreground">
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Colour
                  <select value={s.waveColor} onChange={(e) => setS({ waveColor: e.target.value })} className="mt-1 w-full rounded-sm border border-border bg-secondary px-2 py-2 text-xs text-foreground">
                    {WAVE_COLORS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WAVE_COLORS.map((c) => (
                  <button key={c.key} type="button" aria-label={c.label} onClick={() => setS({ waveColor: c.key })}
                    className={`h-6 w-6 rounded-full border-2 ${s.waveColor === c.key ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c.rgb ? `rgb(${c.rgb.join(",")})` : "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)" }} />
                ))}
              </div>
            </Section>
            </>}

            {page === "playback" && <>
            <Section title="Video">
              <label className="flex items-center justify-between text-xs text-muted-foreground">
                Floating video screens
                <input
                  type="checkbox"
                  checked={s.floatingVideo}
                  onChange={(e) => setS({ floatingVideo: e.target.checked })}
                />
              </label>
              <label className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                Follow crossfader
                <input type="checkbox" checked={s.videoFollowCrossfader} onChange={(e) => setS({ videoFollowCrossfader: e.target.checked })} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Transition
                  <select value={s.videoTransition} onChange={(e) => setS({ videoTransition: e.target.value as typeof s.videoTransition })} className="mt-1 w-full rounded-sm border border-border bg-secondary px-2 py-2 text-xs text-foreground">
                    {VIDEO_TRANSITIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Video FX
                  <select value={s.videoFx} onChange={(e) => setS({ videoFx: e.target.value as typeof s.videoFx })} className="mt-1 w-full rounded-sm border border-border bg-secondary px-2 py-2 text-xs text-foreground">
                    {VIDEO_FX.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                Use logo watermark
                <input
                  type="checkbox"
                  checked={s.watermarkLogo}
                  onChange={(e) => setS({ watermarkLogo: e.target.checked })}
                />
              </label>
            </Section>


            <Section title="Video Watermark (Pro)">
              <label className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                Show watermark
                <input
                  type="checkbox"
                  checked={s.showWatermark}
                  onChange={(e) => setS({ showWatermark: e.target.checked })}
                />
              </label>
              <input
                type="text"
                value={s.watermarkText}
                onChange={(e) => setS({ watermarkText: e.target.value })}
                placeholder="Custom watermark"
                className="w-full rounded-sm border border-border bg-secondary px-2 py-1.5 text-xs"
              />
            </Section>

            <Section title="Scratch">
              <label className="flex items-center justify-between text-xs text-muted-foreground">
                Key lock (preserve pitch)
                <input
                  type="checkbox"
                  checked={s.keyLock}
                  onChange={(e) => setS({ keyLock: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                Brake when pausing (turntable stop)
                <input
                  type="checkbox"
                  checked={s.brakeOnPause}
                  onChange={(e) => setS({ brakeOnPause: e.target.checked })}
                />
              </label>
            </Section>

            <Section title="Permissions & Notifications">
              <div className="grid grid-cols-2 gap-2">
                <PermButton
                  label={`Notifications${perms.notif === "granted" ? " ✓" : ""}`}
                  onClick={async () => {
                    const r = await requestNotifications();
                    setPerms((p) => ({ ...p, notif: r }));
                    if (r === "granted") notify("DjogPro", "Notifications are on. Mix alerts enabled.");
                  }}
                />
                <PermButton
                  label={`Microphone${perms.mic === "granted" ? " ✓" : ""}`}
                  onClick={async () => {
                    const mic = await requestMicrophone();
                    setPerms((p) => ({ ...p, mic }));
                  }}
                />
                <PermButton
                  label={`Keep screen on${perms.wake === "granted" ? " ✓" : ""}`}
                  onClick={async () => {
                    const wake = await requestWakeLock();
                    setPerms((p) => ({ ...p, wake }));
                  }}
                />
                <PermButton
                  label="Test notification"
                  onClick={() => notify("DjogPro", "This is how mix alerts will look.")}
                />
              </div>
              <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Music files are read straight from your device — no storage permission needed for the picker.
                Notifications and microphone are asked for only when you tap them.
              </div>
            </Section>
            </>}
            </div>

            <div className="text-[10px] text-muted-foreground mt-2">
              <span className="text-foreground font-bold">Djog</span>
              <span className="text-primary font-bold">Pro</span> — offline DJ mixer.
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 rounded-sm border text-[11px] uppercase tracking-widest"
      style={{
        borderColor: on ? "#ff8a3b" : "#222",
        background: on ? "#ff8a3b22" : "#0a0a0a",
        color: on ? "#ff8a3b" : "#888",
      }}
    >
      {children}
    </button>
  );
}

function Tile({
  label,
  color,
  on,
  icon,
  onClick,
}: {
  label: string;
  color: string;
  on: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl dj-glass"
      style={{
        background: `${color}${on ? "55" : "22"}`,
        boxShadow: on ? `0 0 14px ${color}88, var(--glass-shadow)` : "var(--glass-shadow)",
        color: on ? color : "var(--foreground)",
      }}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function PermButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl dj-glass px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest"
    >
      {label}
    </button>
  );
}
