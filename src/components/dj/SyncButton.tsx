// OS-style frosted glass hardware button with rounded caps (theme aware).
export function SyncButton({
  onClick,
  active,
  label = "SYNC",
  width = 62,
  height = 26,
  accent,
}: {
  onClick: () => void;
  active?: boolean;
  label?: string;
  width?: number;
  height?: number;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`grid place-items-center active:scale-[0.97] transition-transform ${
        active ? "dj-glass-on" : "dj-glass"
      }`}
      style={{
        width,
        height,
        borderRadius: 7,
        boxShadow: active && accent ? `0 0 12px ${accent}88, var(--glass-shadow)` : undefined,
      }}
    >
      <span
        className="font-semibold"
        style={{
          fontSize: Math.max(8, height * 0.38),
          letterSpacing: "0.12em",
          color: active && accent ? accent : "var(--foreground)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
