import { ArrowUpRight } from "lucide-react";
import { cn } from "../../utils/cn";

interface ArrowLinkProps {
  label: string;
  onClick?: () => void;
  href?: string;
  className?: string;
  /** Render the underline statically (for bordered CTA style). */
  bordered?: boolean;
}

/** Minimal editorial CTA — hairline underline + drifting arrow. */
export default function ArrowLink({
  label,
  onClick,
  href,
  className,
  bordered = false,
}: ArrowLinkProps) {
  const inner = (
    <>
      <span>{label}</span>
      <ArrowUpRight
        className="h-[1em] w-[1em] transition-transform duration-500 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px]"
        strokeWidth={1.5}
      />
    </>
  );

  const classes = cn(
    "group inline-flex cursor-pointer items-center gap-3 text-[0.6875rem] font-medium tracking-[0.32em] uppercase",
    bordered
      ? "border border-current/40 px-7 py-4 transition-colors duration-500 hover:border-champagne hover:text-champagne"
      : "u-link pb-1",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {inner}
    </button>
  );
}
