export type OptionKey = "A" | "B" | "C" | "D";

export type QuizMode = "quiz" | "timed";

export interface Subdivision {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Question {
  id: string;
  source_id: number | null;
  subdivision_id: string;
  topic: string;
  question: string;
  options: Record<OptionKey, string>;
  correct_answer: OptionKey;
  explanations: Record<OptionKey, string>;
  reference_list: string[];
}

export interface QuizSession {
  id: string;
  user_id: string;
  mode: QuizMode;
  subdivision_ids: string[];
  question_ids: string[];
  current_index: number;
  status: "in_progress" | "completed";
  time_limit_seconds: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface QuestionResponse {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  selected_answer: OptionKey | null;
  is_correct: boolean;
  answered_at: string;
}

export interface SubdivisionAccuracy {
  subdivision: Subdivision;
  total: number;
  correct: number;
}
