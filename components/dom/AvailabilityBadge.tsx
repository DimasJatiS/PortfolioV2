import { cn } from "@/lib/utils";

/**
 * Presentational availability label. Pass `label={null}` when the flag is off:
 * the wrapper keeps its height so nothing around it moves.
 */
export function AvailabilityBadge({
  label,
  className,
}: {
  label: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-8 items-center", className)}>
      {label && (
        <p className="border-line text-fg inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 font-mono text-[0.75rem] leading-4 tracking-wide">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-orange-500"
          />
          {label}
        </p>
      )}
    </div>
  );
}
