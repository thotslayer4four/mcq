import Link from "next/link";
import type { Subdivision } from "@/lib/types";

export default function SubdivisionCard({
  subdivision,
  questionCount,
  accuracy,
}: {
  subdivision: Subdivision;
  questionCount: number;
  accuracy: { correct: number; total: number } | null;
}) {
  const pct =
    accuracy && accuracy.total > 0 ? Math.round((accuracy.correct / accuracy.total) * 100) : null;

  return (
    <Link
      href={`/quiz/${subdivision.slug}`}
      className="group flex flex-col gap-4 rounded-lg border border-border bg-background p-6 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
          {subdivision.name}
        </h3>
        <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
      </div>

      {pct !== null ? (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-muted">
            {pct}% accuracy · {accuracy!.correct}/{accuracy!.total} answered
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Not started yet</p>
      )}
    </Link>
  );
}
