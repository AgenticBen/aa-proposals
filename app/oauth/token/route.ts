import { verifyAuthCode, verifyPkce } from "@/lib/oauth/tokens";

export const dynamic = "force-dynamic";

/** Exchange an authorization code for an access token. */
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, string>;
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else {
    body = await request.json() as Record<string, string>;
  }

  const { grant_type, code, redirect_uri, code_verifier } = body;

  if (grant_type !== "authorization_code") {
    return tokenError("unsupported_grant_type", 400);
  }
  if (!code || !redirect_uri || !code_verifier) {
    return tokenError("invalid_request", 400);
  }

  const payload = verifyAuthCode(code);
  if (!payload) {
    return tokenError("invalid_grant", 400);
  }
  if (payload.redirect_uri !== redirect_uri) {
    return tokenError("invalid_grant", 400);
  }
  if (!verifyPkce(code_verifier, payload.code_challenge)) {
    return tokenError("invalid_grant", 400);
  }

  const secret = process.env.MCP_SECRET;
  if (!secret) {
    return tokenError("server_error", 500);
  }

  // The access token IS the MCP_SECRET so /api/mcp Bearer auth continues to work.
  return Response.json({
    access_token: secret,
    token_type: "Bearer",
    scope: "mcp",
  });
}

function tokenError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}
