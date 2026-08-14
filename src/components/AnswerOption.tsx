import type { OptionKey } from "@/lib/types";

type Status = "idle" | "selected" | "correct" | "incorrect" | "reveal-correct";

export default function AnswerOption({
  optionKey,
  text,
  status,
  disabled,
  onSelect,
}: {
  optionKey: OptionKey;
  text: string;
  status: Status;
  disabled: boolean;
  onSelect: () => void;
}) {
  const styles: Record<Status, string> = {
    idle: "border-border hover:border-primary hover:bg-surface",
    selected: "border-primary bg-surface",
    correct: "border-success bg-success-bg",
    incorrect: "border-error bg-error-bg",
    "reveal-correct": "border-success bg-success-bg",
  };

  const badgeStyles: Record<Status, string> = {
    idle: "border-border text-muted",
    selected: "border-primary bg-primary text-primary-foreground",
    correct: "border-success bg-success text-white",
    incorrect: "border-error bg-error text-white",
    "reveal-correct": "border-success bg-success text-white",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${styles[status]}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${badgeStyles[status]}`}
      >
        {optionKey}
      </span>
      <span className="text-foreground leading-relaxed">{text}</span>
    </button>
  );
}
