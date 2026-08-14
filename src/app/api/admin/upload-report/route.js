import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service-role key so we can bypass RLS for admin inserts
function getServiceClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  try {
    // ── 1. Auth check: caller must be admin ──────────────────────────────
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await anonClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 2. Parse body ────────────────────────────────────────────────────
    const { targetUserId, dateFrom, dateTo, fileBase64, fileName, reportName } = await req.json();

    if (!targetUserId || !dateFrom || !dateTo || !fileBase64 || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 3. Upload PDF to Supabase Storage ────────────────────────────────
    const svc = getServiceClient();

    // Decode base64 → Uint8Array
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const storagePath = `${targetUserId}/${dateFrom}_${fileName.replace(/[^a-zA-Z0-9._\-]/g, "_")}`;

    const { error: uploadErr } = await svc.storage
      .from("report-uploads")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return NextResponse.json({ error: "File upload failed: " + uploadErr.message }, { status: 500 });
    }

    // Get a signed URL (valid 10 years — effectively permanent for this use case)
    const { data: signedData, error: signErr } = await svc.storage
      .from("report-uploads")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

    if (signErr) {
      console.error("Signed URL error:", signErr);
      return NextResponse.json({ error: "Could not generate file URL" }, { status: 500 });
    }

    const fileUrl = signedData.signedUrl;

    // ── 4. Insert report row for target user ─────────────────────────────
    const { data: newReport, error: insertErr } = await svc
      .from("reports")
      .insert({
        user_id:  targetUserId,
        name:     reportName || "Uploaded Report",
        date_from: dateFrom,
        date_to:   dateTo,
        status:   "completed",
        source:   "uploaded",
        file_url:  fileUrl,
        // Set updated_at = date_from so it sorts chronologically in the dashboard
        updated_at: dateFrom,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Report insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save report: " + insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reportId: newReport.id });

  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
