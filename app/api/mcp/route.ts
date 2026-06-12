import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createProposalMcpServer } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

async function handler(request: Request): Promise<Response> {
  const secret = process.env.MCP_SECRET;
  if (secret) {
    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${secret}`) return unauthorized();
  }

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const server = createProposalMcpServer(appUrl);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — required for serverless/Vercel
  });

  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handler as GET, handler as POST, handler as DELETE };
