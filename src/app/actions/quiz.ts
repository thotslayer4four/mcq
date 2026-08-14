"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMissedQuestionIds,
  getQuestionIdsForSubdivisions,
  getQuestionsByIds,
} from "@/lib/queries";
import type { OptionKey, QuizMode } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function startSession(params: {
  subdivisionIds: string[];
  count: number;
  mode: QuizMode;
  timeLimitSeconds?: number;
}) {
  const userId = await requireUserId();
  const { subdivisionIds, count, mode, timeLimitSeconds } = params;

  const allIds = await getQuestionIdsForSubdivisions(subdivisionIds);
  if (allIds.length === 0) {
    throw new Error("No questions available for the selected subdivisions.");
  }
  const questionIds = shuffle(allIds).slice(0, Math.min(count, allIds.length));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: userId,
      mode,
      subdivision_ids: subdivisionIds,
      question_ids: questionIds,
      time_limit_seconds: mode === "timed" ? timeLimitSeconds ?? null : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/session/${data.id}`);
}

export async function startReviewSession() {
  const userId = await requireUserId();
  const missedIds = await getMissedQuestionIds(userId);
  if (missedIds.length === 0) {
    redirect("/dashboard");
  }

  const questions = await getQuestionsByIds(missedIds);
  const subdivisionIds = Array.from(new Set(questions.map((q) => q.subdivision_id)));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: userId,
      mode: "quiz",
      subdivision_ids: subdivisionIds,
      question_ids: missedIds,
      time_limit_seconds: null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/session/${data.id}`);
}

export async function submitAnswer(params: {
  sessionId: string;
  questionId: string;
  selectedAnswer: OptionKey;
  nextIndex: number;
  isLast: boolean;
}): Promise<{ isCorrect: boolean; correctAnswer: OptionKey }> {
  const userId = await requireUserId();
  const { sessionId, questionId, selectedAnswer, nextIndex, isLast } = params;

  const supabase = await createClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("correct_answer")
    .eq("id", questionId)
    .single();
  if (questionError) throw new Error(questionError.message);

  const isCorrect = question.correct_answer === selectedAnswer;

  const { error: responseError } = await supabase.from("question_responses").upsert(
    {
      session_id: sessionId,
      question_id: questionId,
      user_id: userId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    },
    { onConflict: "session_id,question_id" }
  );
  if (responseError) throw new Error(responseError.message);

  const { error: sessionError } = await supabase
    .from("quiz_sessions")
    .update({
      current_index: nextIndex,
      status: isLast ? "completed" : "in_progress",
      completed_at: isLast ? new Date().toISOString() : null,
    })
    .eq("id", sessionId);
  if (sessionError) throw new Error(sessionError.message);

  return { isCorrect, correctAnswer: question.correct_answer as OptionKey };
}

export async function completeSession(sessionId: string) {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}
