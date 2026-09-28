import { Check, X, Minus, Hand, Ban } from "lucide-react";

export type ChipStatus = "ok" | "failed" | "blocked" | "skipped" | "stopped" | "pending" | "running";

const STYLE: Record<ChipStatus, string> = {
  ok: "border-ok/30 bg-ok-soft text-ok",
  failed: "border-fail/40 bg-fail-soft text-fail",
  blocked: "border-fail/40 bg-fail-soft text-fail",
  skipped: "border-line bg-skip-soft text-skip",
  stopped: "border-warn/40 bg-warn-soft text-warn",
  pending: "border-dashed border-line-strong bg-transparent text-faint",
  running: "border-accent/40 bg-accent-soft text-accent",
};

function Icon({ status }: { status: ChipStatus }) {
  const c = "size-3.5 shrink-0";
  switch (status) {
    case "ok":
      return <Check className={c} strokeWidth={2.5} aria-hidden />;
    case "failed":
      return <X className={c} strokeWidth={2.5} aria-hidden />;
    case "blocked":
      return <Ban className={c} strokeWidth={2.25} aria-hidden />;
    case "stopped":
      return <Hand className={c} strokeWidth={2.25} aria-hidden />;
    case "skipped":
      return <Minus className={c} strokeWidth={2.5} aria-hidden />;
    case "running":
      return <span className={`${c} rounded-full bg-accent animate-[pulse-soft_1.2s_ease-in-out_infinite]`} aria-hidden />;
    default:
      return <span className={`${c} rounded-full border border-current opacity-50`} aria-hidden />;
  }
}

const STATUS_TEXT: Record<ChipStatus, string> = {
  ok: "passed",
  failed: "failed",
  blocked: "blocked",
  skipped: "skipped",
  stopped: "stopped",
  pending: "pending",
  running: "running",
};

export function StepChip({
  label,
  status,
  detail,
  highlight,
  selected,
  onClick,
}: {
  label: string;
  status: ChipStatus;
  detail?: string;
  highlight?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const base = `inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-[13px] font-medium leading-none whitespace-nowrap ${STYLE[status]}`;
  const ring = highlight ? " ring-2 ring-fail/40 ring-offset-1 ring-offset-bg" : "";
  const sel = selected ? " outline outline-2 outline-accent outline-offset-1" : "";
  const inner = (
    <>
      <Icon status={status} />
      <span className="truncate">{label}</span>
      {detail && <span className="opacity-80 font-normal">{detail}</span>}
    </>
  );
  if (!onClick) {
    return (
      <span className={base + ring + sel} title={`${label}: ${STATUS_TEXT[status]}`}>
        {inner}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base}${ring}${sel} cursor-pointer transition-[filter] hover:brightness-95 dark:hover:brightness-125`}
      aria-label={`${label}: ${STATUS_TEXT[status]}${detail ? `, ${detail}` : ""}. Show details`}
      aria-pressed={selected}
    >
      {inner}
    </button>
  );
}

export function StepConnector({ tone = "line" }: { tone?: "line" | "fail" }) {
  return <span className={`h-px w-3 shrink-0 ${tone === "fail" ? "bg-fail/50" : "bg-line-strong"}`} aria-hidden />;
}
