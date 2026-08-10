"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "base-documents";
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
};
const MAX_BYTES = 5 * 1024 * 1024;

// file.type and file.name are both attacker-controlled -- resolveExtension
// only decides which check below to run, it doesn't grant trust by itself
// (OVERNIGHT_SECURITY_REVIEW.md #4: a renamed executable labelled cv.pdf
// used to sail straight through on filename alone).
function resolveExtension(file: File): string | null {
  if (file.type in ALLOWED_EXTENSIONS) return ALLOWED_EXTENSIONS[file.type];
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

// Only two formats are supported, so a hand-rolled sniff covers it without
// pulling in a MIME-detection dependency: PDF has a real, well-known magic
// number to check against regardless of claimed type/filename; plain text
// has no magic number by definition, so instead we verify the bytes are
// actually clean UTF-8 text with no embedded nulls, which is enough to
// catch a renamed binary/executable.
async function hasGenuineContent(file: File, extension: string): Promise<boolean> {
  if (extension === "pdf") {
    const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());
    return PDF_MAGIC.every((byte, i) => head[i] === byte);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  return true;
}

async function uploadDocument(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File,
  kind: "cv" | "cover-letter"
): Promise<{ path: string } | { error: string }> {
  const extension = resolveExtension(file);
  if (!extension) {
    return { error: `${kind}: only PDF or plain text files are accepted` };
  }
  if (file.size > MAX_BYTES) {
    return { error: `${kind}: file is larger than 5MB` };
  }
  if (!(await hasGenuineContent(file, extension))) {
    return {
      error: `${kind}: file content doesn't match a genuine ${extension === "pdf" ? "PDF" : "plain text"} file`,
    };
  }

  // Drop any previous file for this doc kind so a format change (pdf -> txt)
  // doesn't leave an orphaned, unreferenced object behind.
  const { data: existing } = await supabase.storage.from(BUCKET).list(userId, {
    search: kind,
  });
  const toRemove = (existing ?? [])
    .filter((f) => f.name.startsWith(kind))
    .map((f) => `${userId}/${f.name}`);
  if (toRemove.length > 0) {
    await supabase.storage.from(BUCKET).remove(toRemove);
  }

  const path = `${userId}/${kind}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || (extension === "pdf" ? "application/pdf" : "text/plain"),
  });

  if (error) return { error: `${kind}: ${error.message}` };
  return { path };
}

export async function uploadBaseDocuments(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cvFile = formData.get("cv_file");
  const coverLetterFile = formData.get("cover_letter_file");

  const errors: string[] = [];
  const updates: Record<string, string> = {};

  if (cvFile instanceof File && cvFile.size > 0) {
    const result = await uploadDocument(supabase, user.id, cvFile, "cv");
    if ("error" in result) errors.push(result.error);
    else updates.base_cv_storage_path = result.path;
  }

  if (coverLetterFile instanceof File && coverLetterFile.size > 0) {
    const result = await uploadDocument(supabase, user.id, coverLetterFile, "cover-letter");
    if ("error" in result) errors.push(result.error);
    else updates.base_cover_letter_storage_path = result.path;
  }

  if (Object.keys(updates).length === 0 && errors.length === 0) {
    redirect("/onboarding?error=Choose a file to upload");
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) errors.push(error.message);
  }

  if (errors.length > 0) {
    redirect(`/onboarding?error=${encodeURIComponent(errors.join("; "))}`);
  }

  redirect("/onboarding?uploaded=1");
}
