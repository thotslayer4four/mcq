import Link from "next/link";
import { getCurrentUser } from "@/lib/queries";
import { logout } from "@/app/actions/auth";

export default async function Navbar() {
  const user = await getCurrentUser();
  const account = user && !user.is_anonymous ? user : null;

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          OBGYN Board Prep
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/" className="text-muted transition-colors hover:text-foreground">
            Subdivisions
          </Link>
          <Link href="/custom" className="text-muted transition-colors hover:text-foreground">
            Custom Quiz
          </Link>
          <Link href="/dashboard" className="text-muted transition-colors hover:text-foreground">
            Dashboard
          </Link>

          {account ? (
            <form action={logout} className="flex items-center gap-3">
              <span className="hidden max-w-[160px] truncate text-muted sm:inline">
                {account.email}
              </span>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Log out
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
