import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { PDFDocument }   from "pdf-lib";
import { createHash }    from "crypto";

// ── Supabase service-role client (bypasses RLS) ───────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── PDF compression via pdf-lib re-serialization ──────────────────────────
// pdf-lib loads and re-saves the PDF, stripping redundant cross-reference
// tables and normalising the object graph — typically 15–40% smaller.
async function compressPdf(bytes) {
  try {
    const doc        = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const compressed = await doc.save({ useObjectStreams: true });
    // Only use compressed version if it's actually smaller
    return compressed.length < bytes.length ? compressed : bytes;
  } catch {
    // If pdf-lib can't parse it (e.g. password-protected), return original
    return bytes;
  }
}

// ── SHA-256 fingerprint for deduplication ────────────────────────────────
function sha256hex(bytes) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    // ── 1. Verify JWT and check admin role ─────────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Service-role bypasses RLS — no recursion issue
    const svc = getServiceClient();
    const { data: callerProfile } = await svc
      .from("profiles").select("role").eq("id", user.id).single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    // ── 2. Parse body ──────────────────────────────────────────────────
    const { targetUserId, dateFrom, dateTo, fileBase64, fileName, reportName } = await req.json();

    if (!targetUserId || !dateFrom || !dateTo || !fileBase64 || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 3. Decode base64 → bytes ───────────────────────────────────────
    const binaryStr = atob(fileBase64);
    const rawBytes  = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) rawBytes[i] = binaryStr.charCodeAt(i);

    // ── 4. Size guard (5 MB max on raw upload) ─────────────────────────
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
    if (rawBytes.length > MAX_BYTES) {
      return NextResponse.json({
        error: `File too large (${(rawBytes.length / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 5 MB.`
      }, { status: 413 });
    }

    // ── 5. Compress PDF ────────────────────────────────────────────────
    const compressed   = await compressPdf(rawBytes);
    const savedKB      = Math.round((rawBytes.length - compressed.length) / 1024);
    const finalSizeMB  = (compressed.length / 1024 / 1024).toFixed(2);

    console.log(
      `PDF: raw=${(rawBytes.length/1024).toFixed(0)}KB → ` +
      `compressed=${(compressed.length/1024).toFixed(0)}KB (saved ${savedKB}KB)`
    );

    // ── 6. Deduplication — same bytes? reuse existing URL ─────────────
    const hash        = sha256hex(compressed);
    const safeName    = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Store under hash-named path so identical files share one object
    const storagePath = `${targetUserId}/${hash}_${safeName}`;

    // Check if this exact file already exists in storage
    const { data: existingFiles } = await svc.storage
      .from("report-uploads")
      .list(targetUserId, { search: `${hash}_` });

    let fileUrl;

    if (existingFiles && existingFiles.some(f => f.name.startsWith(hash))) {
      // File already stored — just generate a fresh signed URL
      console.log("Dedup hit — reusing existing file:", storagePath);
      const { data: signedData } = await svc.storage
        .from("report-uploads")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
      fileUrl = signedData?.signedUrl;
    } else {
      // New file — upload the compressed bytes
      const { error: uploadErr } = await svc.storage
        .from("report-uploads")
        .upload(storagePath, compressed, { contentType: "application/pdf", upsert: false });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        return NextResponse.json({ error: "File upload failed: " + uploadErr.message }, { status: 500 });
      }

      const { data: signedData, error: signErr } = await svc.storage
        .from("report-uploads")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

      if (signErr) {
        return NextResponse.json({ error: "Could not generate file URL" }, { status: 500 });
      }
      fileUrl = signedData.signedUrl;
    }

    // ── 7. Insert report row ───────────────────────────────────────────
    const { data: newReport, error: insertErr } = await svc
      .from("reports")
      .insert({
        user_id:    targetUserId,
        name:       reportName || fileName.replace(/\.pdf$/i, ""),
        date_from:  dateFrom,
        date_to:    dateTo,
        status:     "completed",
        source:     "uploaded",
        file_url:   fileUrl,
        updated_at: dateFrom,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Report insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save report: " + insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success:     true,
      reportId:    newReport.id,
      originalKB:  Math.round(rawBytes.length  / 1024),
      storedKB:    Math.round(compressed.length / 1024),
      savedKB,
    });

  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
