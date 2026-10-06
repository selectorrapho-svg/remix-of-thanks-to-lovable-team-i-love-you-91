import { Deck } from "@/lib/dj/engine";
import { useDeck } from "@/lib/dj/useMixer";
import { useEffect, useRef } from "react";

export function VideoPreview({ deck }: { deck: Deck }) {
  useDeck(deck);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !deck.videoEl) return;
    if (v.src !== deck.videoEl.src) {
      v.src = deck.videoEl.src;
      v.muted = true;
      v.playsInline = true;
    }
    const sync = () => {
      if (deck.scratchingVideo || !deck.buffer) return;
      if (!v.seeking && Math.abs(v.currentTime - deck.currentTime) > 0.35) v.currentTime = deck.currentTime;
      if (deck.playing && v.paused) v.play().catch(() => {});
      if (!deck.playing && !v.paused) v.pause();
    };
    const id = setInterval(sync, 300);
    return () => clearInterval(id);
  }, [deck, deck.videoEl]);

  if (!deck.videoEl) return null;
  return (
    <video
      ref={ref}
      className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
    />
  );
}
