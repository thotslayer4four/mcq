# OBGYN Board Prep

A board-style MCQ question bank for OBGYN exam prep, built with Next.js (App Router), Tailwind CSS, and Supabase.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   Fill in `.env.local` (already created from `.env.local.example`) with your Supabase project's values from **Project Settings → API**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=   # server-side only, used by the import script
   ```

3. **Run the migration**

   Using the Supabase CLI (recommended):

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   Or paste the contents of `supabase/migrations/20260814000000_init.sql` into the Supabase SQL editor.

4. **Import questions**

   ```bash
   npm run db:import -- questions_seed.json
   ```

   Re-running this is safe — questions are upserted by their `id` in the source JSON (`source_id` column), and subdivisions are upserted by name. To import additional question sets, point the command at another JSON file with the same shape.

5. **Enable email/password auth**

   In the Supabase dashboard under **Authentication → Providers**, confirm Email is enabled. For local testing without setting up an SMTP provider, you can disable "Confirm email" under **Authentication → Settings** so signups log in immediately.

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `supabase/migrations/` — SQL schema (subdivisions, questions, quiz_sessions, question_responses) and RLS policies.
- `supabase/seed/import.ts` — imports a question JSON file into the database.
- `src/lib/queries.ts` — server-side data-fetching functions.
- `src/app/actions/` — server actions for auth and quiz mutations.
- `src/app/quiz/[subdivision]` — per-subdivision quiz setup.
- `src/app/custom` — cross-subdivision custom quiz builder.
- `src/app/session/[id]` — the question player (quiz + timed modes) and results summary.
- `src/app/dashboard` — accuracy by subdivision and missed-question review.

## Deploy

Push to a Git repo and import it into [Vercel](https://vercel.com/new). Add the same three environment variables from `.env.local` in the Vercel project settings before the first deploy.
