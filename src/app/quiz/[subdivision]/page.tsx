import { notFound } from "next/navigation";
import QuizSetupForm from "@/components/QuizSetupForm";
import { getQuestionCounts, getSubdivisionBySlug, getSubdivisions } from "@/lib/queries";

export default async function QuizSetupPage({
  params,
}: {
  params: Promise<{ subdivision: string }>;
}) {
  const { subdivision: slug } = await params;
  const subdivision = await getSubdivisionBySlug(slug);
  if (!subdivision) notFound();

  const [subdivisions, questionCounts] = await Promise.all([
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

      <QuizSetupForm
        subdivisions={subdivisions}
        questionCounts={questionCounts}
        lockedSubdivisionId={subdivision.id}
      />
    </div>
  );
}
