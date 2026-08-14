import { extractText } from "@/lib/documents/extract-text";
import type { createClient } from "@/lib/supabase/server";

const BUCKET = "base-documents";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Write-through cache for the plain-text extraction of a student's base CV
// -- the download + PDF parse is the expensive part of the match score
// (this can run for every vacancy a free-tier user sees), so it only
// happens once per CV. base_cv_extracted_text is nulled out in
// documents-actions.ts whenever a new CV is uploaded, which is what
// invalidates this cache -- base_cv_storage_path itself is a stable path
// that doesn't change on re-upload.
export async function getBaseCvText(
  supabase: SupabaseServerClient,
  userId: string,
  baseCvStoragePath: string | null,
  cachedText: string | null
): Promise<string | null> {
  if (!baseCvStoragePath) return null;
  if (cachedText != null) return cachedText;

  const { data, error } = await supabase.storage.from(BUCKET).download(baseCvStoragePath);
  if (error || !data) return null;

  const text = await extractText(await data.arrayBuffer(), baseCvStoragePath);

  // Best-effort write-back -- if it fails, the next request just re-extracts
  // rather than ever showing a stale/wrong score.
  await supabase.from("profiles").update({ base_cv_extracted_text: text }).eq("user_id", userId);

  return text;
}
