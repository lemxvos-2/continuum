import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalizedDate } from "@/lib/date-format";

/** Date picker whose visible text follows the app language, not the OS locale. */
export function LocalizedDateInput({ value, onChange, max, className, ariaLabel }: {
  value: string; onChange: (v: string) => void; max?: string; className?: string; ariaLabel?: string;
}) {
  const { language } = useLanguage();
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    try { el?.showPicker?.(); } catch { el?.focus(); }
  };
  return (
    <div className={cn("relative flex items-center", className)}>
      <button type="button" onClick={open} aria-label={ariaLabel}
        className="flex h-full w-full items-center justify-between gap-2 rounded-[inherit] px-3 text-left text-sm text-foreground">
        <span>{value ? formatLocalizedDate(value, language) : "—"}</span>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </button>
      <input ref={ref} type="date" value={value} max={max} tabIndex={-1} aria-hidden
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
    </div>
  );
}
