import { NextRequest, NextResponse } from "next/server";
import { createAccessLogEntry } from "@/lib/data/access-log";
import { getDocumentById } from "@/lib/data/documents";

/**
 * POST /api/client/visit
 * Logs a client visit to the access_log table.
 * Called on every page load: by VisitorPopup after name entry, and by AccessLogger for returning visitors.
 */
export async function POST(request: NextRequest) {
  let body: { document_id?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { document_id, name } = body;
  if (
    typeof document_id !== "string" ||
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    return NextResponse.json({ error: "document_id and name are required (name max 100 chars)" }, { status: 400 });
  }

  // Verify document exists and is accessible
  const doc = await getDocumentById(document_id);
  if (!doc || (doc.status !== "live" && doc.status !== "signed")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  await createAccessLogEntry(document_id, name.trim(), ip, userAgent);

  return NextResponse.json({ ok: true });
}
