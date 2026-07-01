import { NextRequest } from 'next/server';
import {
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/mcp/server';

// ── Session Management ────────────────────────────────────────────
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

type SessionEntry = {
  transport: WebStandardStreamableHTTPServerTransport;
  lastActivity: number;
};

const sessions = new Map<string, SessionEntry>();

// Periodic cleanup (every 60s, remove expired sessions)
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.lastActivity > SESSION_TTL) {
      try {
        entry.transport.close();
      } catch {
        // ignore
      }
      sessions.delete(id);
    }
  }
}, 60_000).unref?.();

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  };
}

// ── OPTIONS: CORS Preflight ───────────────────────────────────────
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// ── POST: MCP JSON-RPC over HTTP+SSE ──────────────────────────────
export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders();
  const sessionId = req.headers.get('mcp-session-id') || undefined;

  // Check for existing session
  if (sessionId && sessions.has(sessionId)) {
    const entry = sessions.get(sessionId)!;
    entry.lastActivity = Date.now();

    try {
      const response = await entry.transport.handleRequest(req);
      // Add CORS headers
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      return Response.json(
        { error: 'Request failed', detail: String(err) },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // New session: must be an initialize request
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () =>
      `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    onsessioninitialized: (id: string) => {
      sessions.set(id, { transport, lastActivity: Date.now() });
    },
  });

  const server = createMcpServer();
  await server.connect(transport);

  try {
    const response = await transport.handleRequest(req);

    // Add CORS + session headers
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return Response.json(
      { error: 'Initialize failed', detail: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
}

// ── DELETE: Close session ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const corsHeaders = getCorsHeaders();
  const sessionId = req.headers.get('mcp-session-id');

  if (sessionId && sessions.has(sessionId)) {
    const entry = sessions.get(sessionId)!;
    try {
      await entry.transport.close();
    } catch {
      // ignore
    }
    sessions.delete(sessionId);
  }

  return Response.json(
    { success: true, message: 'Session closed' },
    { headers: corsHeaders },
  );
}

// ── GET: SSE stream (for server-initiated messages) ───────────────
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders();
  const sessionId = req.headers.get('mcp-session-id');

  if (!sessionId || !sessions.has(sessionId)) {
    return Response.json(
      { error: 'Invalid or missing session' },
      { status: 400, headers: corsHeaders },
    );
  }

  const entry = sessions.get(sessionId)!;
  entry.lastActivity = Date.now();

  try {
    const response = await entry.transport.handleRequest(req);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return Response.json(
      { error: 'SSE stream failed', detail: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
}
