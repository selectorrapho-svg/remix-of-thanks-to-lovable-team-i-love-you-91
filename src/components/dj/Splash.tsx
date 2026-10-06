import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import splash from "@/assets/djogwheels-splash-clean.jpg";

const PLANS = [
  { id: "year", title: "Pro Yearly", price: "$39.99 / year", note: "Best value · 2 months free", badge: "SAVE 40%" },
  { id: "month", title: "Pro Monthly", price: "$4.99 / month", note: "Cancel anytime" },
  { id: "life", title: "Lifetime", price: "$79.99 once", note: "All future updates" },
];

/**
 * Original artwork → optional pricing. Pricing is opened only by Next.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"splash" | "offer">("splash");
  const [plan, setPlan] = useState("year");

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
      <img
        src={splash}
        alt="djogwheels PRO, designed by Vdj Raph"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {phase === "splash" && <Button onClick={() => setPhase("offer")} className="absolute bottom-[15%] right-[7%] min-w-28 border border-border bg-background/85 text-foreground shadow-lg backdrop-blur-md hover:bg-background" aria-label="Next to pricing">Next</Button>}

      {phase === "offer" && (
        <div className="absolute inset-0 flex justify-center overflow-y-auto bg-background/75 p-3 backdrop-blur-md">
          <div className="relative my-auto w-full max-w-[420px] rounded-md border border-border bg-background/90 p-4 shadow-xl">
            <Button variant="ghost" size="icon"
              onClick={onDone}
              aria-label="Continue without subscribing"
              className="absolute top-2 right-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-sm font-semibold">Unlock djogwheels PRO</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Real stems separation · 100+ FX packs · video mixing · no watermark · controller mapping
            </div>

            <div className="mt-3 space-y-2">
              {PLANS.map((p) => (
                <Button variant="outline"
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`h-auto w-full flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors ${
                    plan === p.id
                      ? "border-primary/70 bg-primary/15"
                      : "border-border bg-secondary/40 hover:bg-secondary"
                  }`}
                >
                  <span>
                    <span className="block text-[12px] font-semibold">{p.title}</span>
                    <span className="block text-[10px] text-muted-foreground">{p.note}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {p.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/25 text-primary">
                        {p.badge}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold">{p.price}</span>
                  </span>
                </Button>
              ))}
            </div>

            <Button
              onClick={onDone}
              className="mt-3 w-full h-11 text-sm font-semibold"
            >
              Start 7-day free trial
            </Button>
            <Button variant="ghost" onClick={onDone} className="mt-2 w-full text-[11px] text-muted-foreground">
              Continue with the free version
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
