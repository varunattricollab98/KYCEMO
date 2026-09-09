import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/cases";
import { json, unauthorized } from "@/lib/api";

// Data retention cleanup.
// Deletes stored documents + video files and their DB rows for cases older than
// the retention window. Runs on a schedule via Vercel Cron (see vercel.json),
// authorised by CRON_SECRET.
//
// Retention window (days) — override with RETENTION_DAYS.
const DEFAULT_RETENTION_DAYS = 180;

export async function GET(req: NextRequest) {
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  const qsSecret = new URL(req.url).searchParams.get("secret") ?? "";
  const ok =
    (secret && auth === `Bearer ${secret}`) ||
    (secret && qsSecret === secret);
  if (!ok) return unauthorized("Invalid cron secret");

  const days = Number(process.env.RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();

  // Find cases past the retention window.
  const { data: oldCases, error } = await supabase
    .from("kyc_cases")
    .select("id, order_id, created_at")
    .lt("created_at", cutoff)
    .limit(500);

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!oldCases || oldCases.length === 0) {
    return json({ ok: true, purged: 0, cutoff });
  }

  let purged = 0;
  for (const c of oldCases) {
    // Gather the file paths for this case.
    const { data: docs } = await supabase
      .from("documents")
      .select("doc_type, storage_path")
      .eq("case_id", c.id);

    const docPaths: string[] = [];
    const videoPaths: string[] = [];
    (docs ?? []).forEach((d) => {
      if (!d.storage_path) return;
      if (d.doc_type === "kyc_video") videoPaths.push(d.storage_path);
      else docPaths.push(d.storage_path);
    });

    // Delete the objects from the private buckets.
    if (docPaths.length) {
      await supabase.storage.from("kyc-documents").remove(docPaths);
    }
    if (videoPaths.length) {
      await supabase.storage.from("kyc-video").remove(videoPaths);
    }

    // Delete the case row (cascade removes documents/steps/flags/geo).
    await supabase.from("kyc_cases").delete().eq("id", c.id);

    await audit({
      actor_type: "system",
      actor_id: "retention-cron",
      action: "case.purged",
      after: {
        order_id: c.order_id,
        created_at: c.created_at,
        files_removed: docPaths.length + videoPaths.length,
      },
    });
    purged++;
  }

  return json({ ok: true, purged, retention_days: days, cutoff });
}
