import { cn } from "../../utils/cn";

interface EyebrowProps {
  index: string;
  label: string;
  /** dark = rendered on a light background */
  dark?: boolean;
  className?: string;
}

/** Section kicker — index, hairline, label. */
export default function Eyebrow({ index, label, dark = false, className }: EyebrowProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} data-fade>
      <span className="eyebrow text-champagne">{index}</span>
      <span
        className={cn("h-px w-12 origin-left", dark ? "bg-ink/25" : "bg-ivory/25")}
        data-grow
      />
      <span className={cn("eyebrow", dark ? "text-smoke" : "text-ivory/50")}>{label}</span>
    </div>
  );
}
