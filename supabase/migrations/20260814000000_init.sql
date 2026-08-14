-- MCQ question bank schema: subdivisions, questions, quiz sessions, per-question responses.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- subdivisions
-- ---------------------------------------------------------------------------
create table if not exists subdivisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------------
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  source_id int unique, -- id from the source JSON, used for idempotent re-import
  subdivision_id uuid not null references subdivisions(id) on delete restrict,
  topic text not null,
  question text not null,
  options jsonb not null, -- { "A": "...", "B": "...", "C": "...", "D": "..." }
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanations jsonb not null, -- { "A": "...", "B": "...", "C": "...", "D": "..." }
  reference_list text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists questions_subdivision_id_idx on questions(subdivision_id);

-- ---------------------------------------------------------------------------
-- quiz_sessions: one row per quiz/timed-exam run
-- ---------------------------------------------------------------------------
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('quiz', 'timed')),
  subdivision_ids uuid[] not null,
  question_ids uuid[] not null,
  current_index int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  time_limit_seconds int,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists quiz_sessions_user_id_idx on quiz_sessions(user_id);
create index if not exists quiz_sessions_user_status_idx on quiz_sessions(user_id, status);

-- ---------------------------------------------------------------------------
-- question_responses: one row per (session, question) answer
-- ---------------------------------------------------------------------------
create table if not exists question_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quiz_sessions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_answer text check (selected_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create index if not exists question_responses_user_id_idx on question_responses(user_id);
create index if not exists question_responses_question_id_idx on question_responses(question_id);
create index if not exists question_responses_user_question_idx on question_responses(user_id, question_id, answered_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table subdivisions enable row level security;
alter table questions enable row level security;
alter table quiz_sessions enable row level security;
alter table question_responses enable row level security;

-- subdivisions & questions: publicly readable, writes only via service role (import script)
create policy "subdivisions are publicly readable"
  on subdivisions for select
  using (true);

create policy "questions are publicly readable"
  on questions for select
  using (true);

-- quiz_sessions: users can only see/modify their own sessions
create policy "users can view own quiz sessions"
  on quiz_sessions for select
  using (auth.uid() = user_id);

create policy "users can create own quiz sessions"
  on quiz_sessions for insert
  with check (auth.uid() = user_id);

create policy "users can update own quiz sessions"
  on quiz_sessions for update
  using (auth.uid() = user_id);

-- question_responses: users can only see/modify their own responses
create policy "users can view own question responses"
  on question_responses for select
  using (auth.uid() = user_id);

create policy "users can create own question responses"
  on question_responses for insert
  with check (auth.uid() = user_id);

create policy "users can update own question responses"
  on question_responses for update
  using (auth.uid() = user_id);
