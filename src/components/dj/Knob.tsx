import { useCallback, useRef } from "react";

interface KnobProps {
  value: number; // 0..1 or min..max
  min?: number;
  max?: number;
  size?: number;
  label?: string;
  onChange: (v: number) => void;
  onDoubleClick?: () => void;
  color?: string;
  showTicks?: boolean;
}

// Metallic mixer knob: brushed cap, ring of ticks, coloured value arc.
export function Knob({
  value,
  min = 0,
  max = 1,
  size = 44,
  label,
  onChange,
  onDoubleClick,
  color = "var(--knob-accent)",
  showTicks = true,
}: KnobProps) {
  const startY = useRef(0);
  const startV = useRef(0);
  const range = max - min;
  const norm = Math.max(0, Math.min(1, (value - min) / range));
  const angle = -135 + norm * 270;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startY.current = e.clientY;
      startV.current = value;
    },
    [value],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!(e.buttons & 1)) return;
      const dy = startY.current - e.clientY;
      const next = Math.max(min, Math.min(max, startV.current + (dy / 140) * range));
      onChange(next);
    },
    [min, max, range, onChange],
  );

  const r = size / 2;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* tick ring */}
        {showTicks && <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (-135 + (i / 10) * 270) * (Math.PI / 180);
            const x1 = r + Math.sin(a) * (r - 1.5);
            const y1 = r - Math.cos(a) * (r - 1.5);
            const x2 = r + Math.sin(a) * (r - 4.5);
            const y2 = r - Math.cos(a) * (r - 4.5);
            const on = i / 10 <= norm;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={on ? color : "rgba(255,255,255,0.22)"}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            );
          })}
        </svg>}
        {/* cap */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 6,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onDoubleClick={onDoubleClick}
        >
          <div
            className="absolute left-1/2"
            style={{
              width: 2.5,
              height: (size - 12) * 0.42,
              marginLeft: -1.25,
              top: 3,
              background: color,
              borderRadius: 2,
              transformOrigin: `50% ${(size - 12) / 2 - 3}px`,
              transform: `rotate(${angle}deg)`,
              boxShadow: `0 0 5px ${color}`,
            }}
          />
        </div>
      </div>
      {label && <span className="text-[9px] tracking-wider text-muted-foreground uppercase">{label}</span>}
    </div>
  );
}
