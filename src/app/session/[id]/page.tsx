import { notFound, redirect } from "next/navigation";
import QuestionPlayer from "@/components/QuestionPlayer";
import { getCurrentUser, getQuestionsByIds, getSession } from "@/lib/queries";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await getSession(id);
  if (!session) notFound();
  if (session.user_id !== user.id) notFound();

  if (session.status === "completed") {
    redirect(`/session/${id}/summary`);
  }

  const questions = await getQuestionsByIds(session.question_ids);

  if (session.current_index >= questions.length) {
    redirect(`/session/${id}/summary`);
  }

  return (
    <QuestionPlayer
      sessionId={session.id}
      mode={session.mode}
      questions={questions}
      startIndex={session.current_index}
      timeLimitSeconds={session.time_limit_seconds}
      startedAt={session.started_at}
    />
  );
}
