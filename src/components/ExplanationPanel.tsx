import type { OptionKey, Question } from "@/lib/types";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export default function ExplanationPanel({
  question,
  selectedAnswer,
}: {
  question: Question;
  selectedAnswer: OptionKey;
}) {
  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div
        className={`rounded-md border px-4 py-3 text-sm font-medium ${
          isCorrect
            ? "border-success-border bg-success-bg text-success"
            : "border-error-border bg-error-bg text-error"
        }`}
      >
        {isCorrect
          ? "Correct!"
          : `Incorrect — the correct answer is ${question.correct_answer}.`}
      </div>

      <div className="flex flex-col gap-4">
        {OPTION_KEYS.map((key) => {
          const isRight = key === question.correct_answer;
          const isChosen = key === selectedAnswer;
          return (
            <div key={key} className="flex gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isRight
                    ? "border-success bg-success text-white"
                    : isChosen
                      ? "border-error bg-error text-white"
                      : "border-border text-muted"
                }`}
              >
                {key}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  {question.options[key]}
                  {isChosen && <span className="ml-2 text-xs text-muted">(your answer)</span>}
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {question.explanations[key]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {question.reference_list.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            References
          </h4>
          <ul className="flex flex-col gap-1">
            {question.reference_list.map((ref, i) => (
              <li key={i} className="text-xs leading-relaxed text-muted">
                {ref}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
