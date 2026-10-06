import { useEffect, useRef } from "react";
import { Deck } from "@/lib/dj/engine";

export function LevelMeter({ deck, label }: { deck: Deck; label: string }) {
  const bar = useRef<HTMLDivElement>(null);
  const peak = useRef(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const level = deck.getLevel();
      peak.current = Math.max(level, peak.current * 0.94);
      if (bar.current) bar.current.style.height = `${Math.max(2, peak.current * 100)}%`;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [deck]);
  return (
    <div className="flex h-full min-h-20 items-center gap-1" aria-label={`${label} level meter`}>
      <div className="relative h-full w-2 overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
        <div ref={bar} className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,var(--meter-low)_0_68%,var(--meter-mid)_68_86%,var(--meter-high)_86_100%)]" />
      </div>
      <span className="text-[8px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}