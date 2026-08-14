// Imports questions from a JSON file into the questions/subdivisions tables.
// Usage: npm run db:import -- ./questions_seed.json
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

interface SeedQuestion {
  id: number;
  subdivision: string;
  topic: string;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_answer: "A" | "B" | "C" | "D";
  explanations: Record<"A" | "B" | "C" | "D", string>;
  references: string[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  const filePath = resolve(process.cwd(), process.argv[2] ?? "questions_seed.json");
  console.log(`Reading questions from ${filePath}`);
  const raw = readFileSync(filePath, "utf-8");
  const seedQuestions: SeedQuestion[] = JSON.parse(raw);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1. Upsert subdivisions (distinct names found in the file).
  const subdivisionNames = Array.from(
    new Set(seedQuestions.map((q) => q.subdivision))
  );
  const subdivisionRows = subdivisionNames.map((name, index) => ({
    name,
    slug: slugify(name),
    sort_order: index,
  }));

  const { data: upsertedSubdivisions, error: subdivisionError } = await supabase
    .from("subdivisions")
    .upsert(subdivisionRows, { onConflict: "name", ignoreDuplicates: false })
    .select("id, name");

  if (subdivisionError) {
    throw new Error(`Failed to upsert subdivisions: ${subdivisionError.message}`);
  }

  const subdivisionIdByName = new Map(
    (upsertedSubdivisions ?? []).map((s) => [s.name, s.id as string])
  );

  // Some Postgres upsert responses omit rows that already existed unchanged;
  // fetch the full set back to be safe.
  const { data: allSubdivisions, error: fetchError } = await supabase
    .from("subdivisions")
    .select("id, name");
  if (fetchError) throw new Error(fetchError.message);
  for (const s of allSubdivisions ?? []) {
    subdivisionIdByName.set(s.name, s.id as string);
  }

  // 2. Upsert questions, keyed on source_id for idempotent re-imports.
  const questionRows = seedQuestions.map((q) => {
    const subdivisionId = subdivisionIdByName.get(q.subdivision);
    if (!subdivisionId) {
      throw new Error(`No subdivision id resolved for "${q.subdivision}" (question ${q.id})`);
    }
    return {
      source_id: q.id,
      subdivision_id: subdivisionId,
      topic: q.topic,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanations: q.explanations,
      reference_list: q.references ?? [],
    };
  });

  const { data: upsertedQuestions, error: questionError } = await supabase
    .from("questions")
    .upsert(questionRows, { onConflict: "source_id", ignoreDuplicates: false })
    .select("id");

  if (questionError) {
    throw new Error(`Failed to upsert questions: ${questionError.message}`);
  }

  console.log(
    `Imported ${upsertedQuestions?.length ?? 0} questions across ${subdivisionRows.length} subdivisions.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
