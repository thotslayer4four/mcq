import { createClient } from "@/lib/supabase/server";
import type {
  Question,
  QuestionResponse,
  QuizSession,
  Subdivision,
  SubdivisionAccuracy,
} from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSubdivisions(): Promise<Subdivision[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subdivisions")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSubdivisionBySlug(slug: string): Promise<Subdivision | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subdivisions")
    .select("id, name, slug, sort_order")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getQuestionCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("subdivision_id");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.subdivision_id] = (counts[row.subdivision_id] ?? 0) + 1;
  }
  return counts;
}

export async function getQuestionIdsForSubdivisions(
  subdivisionIds: string[]
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("subdivision_id", subdivisionIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map((q) => q.id as string);
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((q) => [q.id as string, q as Question]));
  return ids.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
}

export async function getSession(sessionId: string): Promise<QuizSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getResponsesForSession(
  sessionId: string
): Promise<QuestionResponse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_responses")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInProgressSession(userId: string): Promise<QuizSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Dedupes question_responses to the latest response per question, then
 * aggregates correct/total counts by subdivision.
 */
export async function getDashboardStats(userId: string): Promise<{
  bySubdivision: SubdivisionAccuracy[];
  overall: { correct: number; total: number };
}> {
  const supabase = await createClient();
  const [{ data: responses, error: responsesError }, subdivisions] = await Promise.all([
    supabase
      .from("question_responses")
      .select("question_id, is_correct, answered_at, questions(subdivision_id)")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false }),
    getSubdivisions(),
  ]);
  if (responsesError) throw new Error(responsesError.message);

  const latestByQuestion = new Map<
    string,
    { is_correct: boolean; subdivision_id: string }
  >();
  for (const row of responses ?? []) {
    if (latestByQuestion.has(row.question_id as string)) continue;
    const subdivisionId = (row.questions as unknown as { subdivision_id: string } | null)
      ?.subdivision_id;
    if (!subdivisionId) continue;
    latestByQuestion.set(row.question_id as string, {
      is_correct: row.is_correct as boolean,
      subdivision_id: subdivisionId,
    });
  }

  const countsBySubdivision = new Map<string, { correct: number; total: number }>();
  let overallCorrect = 0;
  let overallTotal = 0;
  for (const { is_correct, subdivision_id } of latestByQuestion.values()) {
    const current = countsBySubdivision.get(subdivision_id) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (is_correct) current.correct += 1;
    countsBySubdivision.set(subdivision_id, current);
    overallTotal += 1;
    if (is_correct) overallCorrect += 1;
  }

  const bySubdivision: SubdivisionAccuracy[] = subdivisions.map((subdivision) => {
    const counts = countsBySubdivision.get(subdivision.id) ?? { correct: 0, total: 0 };
    return { subdivision, total: counts.total, correct: counts.correct };
  });

  return { bySubdivision, overall: { correct: overallCorrect, total: overallTotal } };
}

export async function getMissedQuestionIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_responses")
    .select("question_id, is_correct, answered_at")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false });
  if (error) throw new Error(error.message);

  const latestByQuestion = new Map<string, boolean>();
  for (const row of data ?? []) {
    if (latestByQuestion.has(row.question_id as string)) continue;
    latestByQuestion.set(row.question_id as string, row.is_correct as boolean);
  }

  return Array.from(latestByQuestion.entries())
    .filter(([, isCorrect]) => !isCorrect)
    .map(([questionId]) => questionId);
}
