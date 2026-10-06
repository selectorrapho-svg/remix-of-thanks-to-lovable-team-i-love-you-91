import { useCallback, useEffect, useRef, useState } from "react";
import { getMixer } from "@/lib/dj/useMixer";

export function Crossfader({ onChange, value: externalValue }: { onChange: (v: number) => void; value?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(externalValue ?? 0.5);
  useEffect(() => {
    const id = window.setInterval(() => setValue(getMixer()?.lastCross ?? externalValue ?? 0.5), 50);
    return () => window.clearInterval(id);
  }, [externalValue]);
  const update = useCallback((cx: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (cx - r.left - 14) / Math.max(1, r.width - 28)));
    setValue(p); onChange(p);
  }, [onChange]);
  return <div ref={ref} role="slider" tabIndex={0} aria-label="Crossfader" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} className="hardware-crossfader"
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX); }}
    onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX); }}
    onKeyDown={e => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); const v = e.key === "Home" ? 0 : e.key === "End" ? 1 : Math.max(0, Math.min(1, value + (e.key === "ArrowRight" ? 0.05 : -0.05))); setValue(v); onChange(v); } }}
    onDoubleClick={() => { setValue(0.5); onChange(0.5); }}>
    <div className="crossfader-rail" /><span className="crossfader-cap" style={{ left: `calc(14px + (100% - 28px) * ${value})` }}><i /></span>
  </div>;
}
