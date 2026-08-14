import QuizSetupForm from "@/components/QuizSetupForm";
import { getQuestionCounts, getSubdivisions } from "@/lib/queries";

export default async function CustomQuizPage() {
  const [subdivisions, questionCounts] = await Promise.all([
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

      <QuizSetupForm subdivisions={subdivisions} questionCounts={questionCounts} />
    </div>
  );
}
