export const dynamic = "force-dynamic";

/** Dynamic client registration — Claude.ai registers here before initiating OAuth. */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as Record<string, unknown>;
    // Accept any registration; return a stable client_id based on the redirect URIs.
    // We don't need to persist clients — the auth code carries what we need.
    return Response.json(
      {
        client_id: crypto.randomUUID(),
        client_id_issued_at: Math.floor(Date.now() / 1000),
        token_endpoint_auth_method: "none",
        // Echo back the fields Claude sent so it can verify them
        redirect_uris: body.redirect_uris ?? [],
        grant_types: ["authorization_code"],
        response_types: ["code"],
        ...(body.client_name ? { client_name: body.client_name } : {}),
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
}
