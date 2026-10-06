import { useCallback, useRef, useState } from "react";

export function Crossfader({ onChange }: { onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0.5);
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
    onKeyDown={e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home") { e.preventDefault(); const v = e.key === "Home" ? 0.5 : Math.max(0, Math.min(1, value + (e.key === "ArrowRight" ? 0.05 : -0.05))); setValue(v); onChange(v); } }}
    onDoubleClick={() => { setValue(0.5); onChange(0.5); }}>
    <div className="crossfader-rail" /><span className="crossfader-cap" style={{ left: `calc(14px + (100% - 28px) * ${value})` }}><i /></span>
  </div>;
}
