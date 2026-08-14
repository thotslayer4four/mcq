import Link from "next/link";
import { notFound } from "next/navigation";
import QuizSetupForm from "@/components/QuizSetupForm";
import {
  getCurrentUser,
  getQuestionCounts,
  getSubdivisionBySlug,
  getSubdivisions,
} from "@/lib/queries";

export default async function QuizSetupPage({
  params,
}: {
  params: Promise<{ subdivision: string }>;
}) {
  const { subdivision: slug } = await params;
  const subdivision = await getSubdivisionBySlug(slug);
  if (!subdivision) notFound();

  const [user, subdivisions, questionCounts] = await Promise.all([
    getCurrentUser(),
    getSubdivisions(),
    getQuestionCounts(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">{subdivision.name}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Set up your quiz
        </h1>
        <p className="text-sm text-muted">
          {questionCounts[subdivision.id] ?? 0} questions available in this subdivision.
        </p>
      </div>

      {user ? (
        <QuizSetupForm
          subdivisions={subdivisions}
          questionCounts={questionCounts}
          lockedSubdivisionId={subdivision.id}
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              sign up
            </Link>{" "}
            to start a quiz and save your progress.
          </p>
        </div>
      )}
    </div>
  );
}
