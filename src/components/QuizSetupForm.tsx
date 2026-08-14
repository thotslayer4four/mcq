"use client";

import { useMemo, useState, useTransition } from "react";
import { startSession } from "@/app/actions/quiz";
import type { Subdivision } from "@/lib/types";

const COUNT_OPTIONS = [5, 10, 20, 40];

export default function QuizSetupForm({
  subdivisions,
  questionCounts,
  lockedSubdivisionId,
}: {
  subdivisions: Subdivision[];
  questionCounts: Record<string, number>;
  lockedSubdivisionId?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(lockedSubdivisionId ? [lockedSubdivisionId] : subdivisions.map((s) => s.id))
  );
  const [mode, setMode] = useState<"quiz" | "timed">("quiz");
  const [minutesPerQuestion, setMinutesPerQuestion] = useState(1.5);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      Array.from(selectedIds).reduce((sum, id) => sum + (questionCounts[id] ?? 0), 0),
    [selectedIds, questionCounts]
  );

  const countOptions = useMemo(
    () => COUNT_OPTIONS.filter((c) => c <= available).concat(available > 0 ? [available] : []),
    [available]
  );
  const uniqueCountOptions = Array.from(new Set(countOptions)).sort((a, b) => a - b);

  const [count, setCount] = useState(10);
  const effectiveCount = Math.min(count, available || count);

  function toggleSubdivision(id: string) {
    if (lockedSubdivisionId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    setError(null);
    if (selectedIds.size === 0) {
      setError("Select at least one subdivision.");
      return;
    }
    if (available === 0) {
      setError("No questions available for the selected subdivisions.");
      return;
    }
    startTransition(async () => {
      try {
        await startSession({
          subdivisionIds: Array.from(selectedIds),
          count: effectiveCount,
          mode,
          timeLimitSeconds:
            mode === "timed" ? Math.round(effectiveCount * minutesPerQuestion * 60) : undefined,
        });
      } catch (err) {
        // Thrown server errors are redacted to a generic message in
        // production, so show fixed copy rather than err.message.
        if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
          setError("Something went wrong starting the quiz. Please try again.");
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {!lockedSubdivisionId && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Subdivisions</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {subdivisions.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-surface"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSubdivision(s.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  {s.name}
                </span>
                <span className="text-xs text-muted">{questionCounts[s.id] ?? 0}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Number of questions</h2>
        <div className="flex flex-wrap gap-2">
          {uniqueCountOptions.length === 0 && (
            <p className="text-sm text-muted">No questions available.</p>
          )}
          {uniqueCountOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCount(c)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                effectiveCount === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-surface"
              }`}
            >
              {c === available ? `All (${c})` : c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Mode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("quiz")}
            className={`flex flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors ${
              mode === "quiz" ? "border-primary bg-surface" : "border-border hover:bg-surface"
            }`}
          >
            <span className="text-sm font-medium text-foreground">Quiz mode</span>
            <span className="text-xs text-muted">
              Untimed. See the explanation after each question.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("timed")}
            className={`flex flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors ${
              mode === "timed" ? "border-primary bg-surface" : "border-border hover:bg-surface"
            }`}
          >
            <span className="text-sm font-medium text-foreground">Timed exam</span>
            <span className="text-xs text-muted">
              Explanations withheld until you submit the exam.
            </span>
          </button>
        </div>

        {mode === "timed" && (
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Minutes per question</span>
            <input
              type="number"
              min={0.5}
              max={5}
              step={0.5}
              value={minutesPerQuestion}
              onChange={(e) => setMinutesPerQuestion(Number(e.target.value))}
              className="w-32 rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <span className="text-xs text-muted">
              Total time: {Math.round(effectiveCount * minutesPerQuestion)} minutes for{" "}
              {effectiveCount} questions.
            </span>
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || available === 0}
        className="self-start rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Starting…" : "Start"}
      </button>
    </div>
  );
}
