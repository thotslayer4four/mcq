import Link from "next/link";
import SubdivisionCard from "@/components/SubdivisionCard";
import {
  getCurrentUser,
  getDashboardStats,
  getInProgressSession,
  getQuestionCounts,
  getSubdivisions,
} from "@/lib/queries";

export default async function Home() {
  const [user, subdivisions, questionCounts] = await Promise.all([
    getCurrentUser(),
    getSubdivisions(),
    getQuestionCounts(),
  ]);

  const [inProgressSession, stats] = user
    ? await Promise.all([getInProgressSession(user.id), getDashboardStats(user.id)])
    : [null, null];

  const accuracyBySubdivision = new Map(
    (stats?.bySubdivision ?? []).map((s) => [s.subdivision.id, s])
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          OBGYN Board Exam Prep
        </h1>
        <p className="max-w-[65ch] text-base leading-relaxed text-muted">
          Board-style practice questions across every major OBGYN subdivision. Pick a
          subject to start a quiz, or build a custom mix across topics.
        </p>
      </section>

      {inProgressSession && (
        <section className="flex flex-col items-start gap-3 rounded-lg border border-primary/30 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Continue where you left off</p>
            <p className="text-sm text-muted">
              You have a quiz in progress — question{" "}
              {inProgressSession.current_index + 1} of {inProgressSession.question_ids.length}.
            </p>
          </div>
          <Link
            href={`/session/${inProgressSession.id}`}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Resume quiz
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Subdivisions</h2>
          <Link
            href="/custom"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Build a custom quiz
          </Link>
        </div>

        {subdivisions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            No questions have been imported yet. Run{" "}
            <code className="rounded bg-surface px-2 py-1 font-mono text-xs">
              npm run db:import
            </code>{" "}
            to load the question bank.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subdivisions.map((subdivision) => {
              const accuracy = accuracyBySubdivision.get(subdivision.id);
              return (
                <SubdivisionCard
                  key={subdivision.id}
                  subdivision={subdivision}
                  questionCount={questionCounts[subdivision.id] ?? 0}
                  accuracy={
                    accuracy && accuracy.total > 0
                      ? { correct: accuracy.correct, total: accuracy.total }
                      : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {(!user || user.is_anonymous) && (
        <section className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-foreground">
            No sign-up needed — jump into any subdivision above.{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create a free account
            </Link>{" "}
            if you want your progress to survive clearing cookies or switching devices.
          </p>
        </section>
      )}
    </div>
  );
}
