import Link from "next/link";
import { startReviewSession } from "@/app/actions/quiz";
import { getCurrentUser, getDashboardStats, getMissedQuestionIds } from "@/lib/queries";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">Your accuracy across all attempted questions.</p>
        </div>
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          You haven&apos;t answered any questions yet.{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Start a quiz
          </Link>{" "}
          to see your stats here.
        </p>
      </div>
    );
  }

  const [{ bySubdivision, overall }, missedQuestionIds] = await Promise.all([
    getDashboardStats(user.id),
    getMissedQuestionIds(user.id),
  ]);

  const overallPct =
    overall.total > 0 ? Math.round((overall.correct / overall.total) * 100) : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Your accuracy across all attempted questions.</p>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-6">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Overall accuracy
          </span>
          <span className="text-3xl font-bold text-foreground">
            {overallPct !== null ? `${overallPct}%` : "—"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-6">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Questions answered
          </span>
          <span className="text-3xl font-bold text-foreground">{overall.total}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-6">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Missed questions
          </span>
          <span className="text-3xl font-bold text-foreground">{missedQuestionIds.length}</span>
        </div>
      </section>

      {missedQuestionIds.length > 0 && (
        <form action={startReviewSession}>
          <button
            type="submit"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Review missed questions ({missedQuestionIds.length})
          </button>
        </form>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">Accuracy by subdivision</h2>
        {bySubdivision.every((s) => s.total === 0) ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            You haven&apos;t answered any questions yet.{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Start a quiz
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {bySubdivision.map(({ subdivision, correct, total }) => {
              const pct = total > 0 ? Math.round((correct / total) * 100) : null;
              return (
                <div
                  key={subdivision.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={`/quiz/${subdivision.slug}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {subdivision.name}
                    </Link>
                    <span className="text-sm text-muted">
                      {pct !== null ? `${pct}% · ${correct}/${total}` : "Not started"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
