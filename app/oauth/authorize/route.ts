import { createAuthCode } from "@/lib/oauth/tokens";

export const dynamic = "force-dynamic";

/** Show the approval page when Claude.ai redirects the user here. */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id") ?? "";
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const codeChallenge = searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") ?? "S256";

  if (!redirectUri || !codeChallenge) {
    return new Response("Missing required parameters.", { status: 400 });
  }
  if (codeChallengeMethod !== "S256") {
    return new Response("Only S256 code_challenge_method is supported.", { status: 400 });
  }

  // Encode params into the form action so POST can read them back
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, state, code_challenge: codeChallenge });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect Claude — Agentic Arc Proposals</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #002139;
      min-height: 100svh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 36px;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .logo {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #2CCBE6;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #002139;
      margin-bottom: 10px;
    }
    p {
      font-size: 14px;
      color: #495050;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .allow-btn {
      background: #002139;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 12px 32px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: background 0.15s;
    }
    .allow-btn:hover { background: #003557; }
    .scope {
      display: inline-block;
      background: #E6E3E2;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      color: #002139;
      font-weight: 600;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Agentic Arc Proposals</div>
    <h1>Connect Claude</h1>
    <p>Claude is requesting permission to create and edit proposals on your behalf.</p>
    <span class="scope">proposals: read + write</span>
    <form method="POST" action="/oauth/authorize?${params.toString()}">
      <button type="submit" class="allow-btn">Allow Access</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Issue an auth code and redirect back to Claude. */
export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id") ?? "";
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const codeChallenge = searchParams.get("code_challenge") ?? "";

  if (!redirectUri || !codeChallenge) {
    return new Response("Missing required parameters.", { status: 400 });
  }

  let code: string;
  try {
    code = createAuthCode({
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      exp: Date.now() + 2 * 60 * 1000, // 2-minute window
    });
  } catch {
    return new Response("Server configuration error.", { status: 500 });
  }

  const dest = new URL(redirectUri);
  dest.searchParams.set("code", code);
  if (state) dest.searchParams.set("state", state);

  return Response.redirect(dest.toString(), 302);
}
