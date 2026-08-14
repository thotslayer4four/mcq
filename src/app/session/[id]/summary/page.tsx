import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExplanationPanel from "@/components/ExplanationPanel";
import {
  getCurrentUser,
  getQuestionsByIds,
  getResponsesForSession,
  getSession,
} from "@/lib/queries";

export default async function SessionSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const session = await getSession(id);
  if (!session) notFound();
  if (session.user_id !== user.id) notFound();
  if (session.status !== "completed") redirect(`/session/${id}`);

  const [questions, responses] = await Promise.all([
    getQuestionsByIds(session.question_ids),
    getResponsesForSession(id),
  ]);

  const responseByQuestion = new Map(responses.map((r) => [r.question_id, r]));
  const answered = responses.length;
  const correct = responses.filter((r) => r.is_correct).length;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-12 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted">
          {session.mode === "timed" ? "Timed exam complete" : "Quiz complete"}
        </p>
        <p className="text-5xl font-bold tracking-tight text-foreground">{pct}%</p>
        <p className="text-sm text-muted">
          {correct} of {answered} correct
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            View dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Back home
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-semibold text-foreground">Review</h2>
        {questions.map((q, i) => {
          const response = responseByQuestion.get(q.id);
          if (!response?.selected_answer) return null;
          return (
            <div key={q.id} className="flex flex-col gap-3">
              <p className="text-sm font-medium text-muted">Question {i + 1}</p>
              <p className="text-base leading-relaxed text-foreground">{q.question}</p>
              <ExplanationPanel question={q} selectedAnswer={response.selected_answer} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
