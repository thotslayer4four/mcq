import Link from "next/link";
import QuizSetupForm from "@/components/QuizSetupForm";
import { getCurrentUser, getQuestionCounts, getSubdivisions } from "@/lib/queries";

export default async function CustomQuizPage() {
  const [user, subdivisions, questionCounts] = await Promise.all([
    getCurrentUser(),
    getSubdivisions(),
    getQuestionCounts(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Build a custom quiz
        </h1>
        <p className="text-sm text-muted">
          Mix questions from multiple subdivisions into a single quiz or timed exam.
        </p>
      </div>

      {user ? (
        <QuizSetupForm subdivisions={subdivisions} questionCounts={questionCounts} />
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
            to build a custom quiz.
          </p>
        </div>
      )}
    </div>
  );
}
