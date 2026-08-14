"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AnswerOption from "@/components/AnswerOption";
import ExplanationPanel from "@/components/ExplanationPanel";
import ProgressBar from "@/components/ProgressBar";
import { completeSession, submitAnswer } from "@/app/actions/quiz";
import type { OptionKey, Question, QuizMode } from "@/lib/types";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function QuestionPlayer({
  sessionId,
  mode,
  questions,
  startIndex,
  timeLimitSeconds,
  startedAt,
}: {
  sessionId: string;
  mode: QuizMode;
  questions: Question[];
  startIndex: number;
  timeLimitSeconds: number | null;
  startedAt: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(startIndex);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const deadline = useMemo(
    () => (timeLimitSeconds ? new Date(startedAt).getTime() + timeLimitSeconds * 1000 : null),
    [startedAt, timeLimitSeconds]
  );
  const [remainingMs, setRemainingMs] = useState(() =>
    deadline ? deadline - Date.now() : null
  );

  const question = questions[index];
  const isLast = index === questions.length - 1;

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      setRemainingMs(deadline - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0) {
      startTransition(async () => {
        await completeSession(sessionId);
        router.push(`/session/${sessionId}/summary`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs !== null && remainingMs <= 0]);

  function handleSubmit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await submitAnswer({
          sessionId,
          questionId: question.id,
          selectedAnswer: selected,
          nextIndex: index + 1,
          isLast,
        });
        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleNext() {
    if (isLast) {
      router.push(`/session/${sessionId}/summary`);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  }

  function handleEndExamEarly() {
    startTransition(async () => {
      await completeSession(sessionId);
      router.push(`/session/${sessionId}/summary`);
    });
  }

  if (!question) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <ProgressBar current={index} total={questions.length} />
          {timeLimitSeconds !== null && remainingMs !== null && (
            <span
              className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium tabular-nums ${
                remainingMs < 60_000
                  ? "border-error-border bg-error-bg text-error"
                  : "border-border text-foreground"
              }`}
            >
              {formatTime(remainingMs / 1000)}
            </span>
          )}
        </div>
        {mode === "timed" && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Timed exam
            </span>
            <button
              type="button"
              onClick={handleEndExamEarly}
              className="text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              End exam early
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {question.topic}
          </span>
          <p className="text-lg leading-relaxed text-foreground">{question.question}</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTION_KEYS.map((key) => {
            let status: "idle" | "selected" | "correct" | "incorrect" | "reveal-correct" = "idle";
            if (mode === "quiz" && submitted) {
              if (key === question.correct_answer) status = "reveal-correct";
              else if (key === selected) status = "incorrect";
            } else if (key === selected) {
              status = "selected";
            }
            return (
              <AnswerOption
                key={key}
                optionKey={key}
                text={question.options[key]}
                status={status}
                disabled={submitted}
                onSelect={() => !submitted && setSelected(key)}
              />
            );
          })}
        </div>

        {error && (
          <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        {mode === "quiz" && submitted && (
          <ExplanationPanel question={question} selectedAnswer={selected!} />
        )}

        {mode === "timed" && submitted && (
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
            Answer recorded. Explanations will be available after you submit the exam.
          </p>
        )}

        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || isPending}
            className="self-start rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit answer"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="self-start rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLast ? (mode === "timed" ? "Submit exam" : "Finish quiz") : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
