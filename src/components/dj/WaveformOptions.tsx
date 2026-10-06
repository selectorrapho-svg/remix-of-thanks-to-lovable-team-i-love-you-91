import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useDjSettings } from "@/hooks/useDjSettings";

export function WaveformOptions() {
  const [settings, update] = useDjSettings();
  return <Popover>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="dj-glass size-7 rounded-md" aria-label="Waveform settings"><ChevronDown /></Button></PopoverTrigger>
    <PopoverContent className="wave-options w-64 rounded-lg p-4" side="bottom" align="start">
      <h2 className="mb-4 text-base font-semibold">Waveforms</h2>
      <div className="space-y-4">
        <label className="flex items-center justify-between text-sm">Scratch<Switch checked={settings.waveScratch} onCheckedChange={waveScratch => update({ waveScratch })} /></label>
        <label className="flex items-center justify-between text-sm">High contrast<Switch checked={settings.waveHighContrast} onCheckedChange={waveHighContrast => update({ waveHighContrast })} /></label>
        <label className="block text-sm">Direction<select className="mt-2 w-full rounded-md border border-border bg-secondary p-2" value={settings.waveOrientation} onChange={event => update({ waveOrientation: event.target.value === "horizontal" ? "horizontal" : "vertical" })}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></label>
        <Button variant="ghost" className="dj-glass w-full" aria-pressed={settings.waveColor === "all"} onClick={() => update({ waveColor: "all" })}>RGB frequency spectrum</Button>
      </div>
    </PopoverContent>
  </Popover>;
}