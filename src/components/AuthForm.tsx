"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

export default function AuthForm({
  action,
  title,
  submitLabel,
  footer,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  footer: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {state.error && state.error !== "CONFIRM_EMAIL" && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error"
          >
            {state.error}
          </p>
        )}
        {state.error === "CONFIRM_EMAIL" && (
          <p
            role="status"
            className="rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm text-success"
          >
            Check your inbox to confirm your email before logging in.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Please wait…" : submitLabel}
        </button>
      </form>

      <p className="text-sm text-muted">{footer}</p>
    </div>
  );
}
