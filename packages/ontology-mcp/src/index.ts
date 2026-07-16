/**
 * @ontology/mcp-server — Entry Point
 *
 * Creates an MCP Server over stdio transport and registers
 * all 9 Tools + 4 Resources + 2 Prompts.
 *
 * Uses lazy dynamic imports to resolve @ontology/core and @/*
 * tsconfig path aliases at runtime.
 */

// ========== Types exported for sub-modules ==========

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: { type: 'text'; text: string }[];
}>;

export interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export type ResourceReader = (uri: string) => Promise<{
  contents: { uri: string; mimeType?: string; text: string }[];
}>;

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
}

export type PromptHandler = (args: Record<string, string | undefined>) => Promise<{
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: { type: 'text'; text: string };
  }[];
}>;

// ========== Server Implementation ==========

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Tool modules
import { projectToolDefinitions, projectToolHandlers } from './tools/project-tools.js';
import { chainToolDefinitions, chainToolHandlers } from './tools/business-chain-tools.js';
import { analysisToolDefinitions, analysisToolHandlers } from './tools/analysis-tools.js';
import { exportToolDefinitions, exportToolHandlers } from './tools/export-tools.js';

// Resource modules
import { resourceDefinitions, resourceReaders } from './resources/project-resources.js';

// Prompt modules
import { promptDefinitions, promptHandlers } from './prompts/copilot-prompts.js';

// ----- Combine all registrations -----

const allToolDefs = [
  ...projectToolDefinitions,
  ...chainToolDefinitions,
  ...analysisToolDefinitions,
  ...exportToolDefinitions,
];

const allToolHandlers: Record<string, ToolHandler> = {
  ...projectToolHandlers,
  ...chainToolHandlers,
  ...analysisToolHandlers,
  ...exportToolHandlers,
};

const allResourceDefs = resourceDefinitions;

// Build a map: uri pattern -> reader
const resourceReaderMap = new Map<string, ResourceReader>();
for (const def of allResourceDefs) {
  resourceReaderMap.set(def.uri, resourceReaders[def.uri]);
}

const allPromptDefs = promptDefinitions;
const allPromptHandlers = promptHandlers;

// ----- Factory: create a configured MCP Server instance -----

/**
 * Create a new MCP Server instance with all tools/resources/prompts registered.
 * Each HTTP session gets its own server + transport pair for isolation.
 * Stdio mode uses a single instance.
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'ontology-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // ----- Register tool handlers -----

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allToolDefs.map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema as Record<string, unknown>,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = allToolHandlers[name as string];
    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `未知工具: ${name}`,
            }),
          },
        ],
        isError: true,
      };
    }
    try {
      return await handler(args as Record<string, unknown>);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  // ----- Register resource handlers -----

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: allResourceDefs.map((def) => ({
      uri: def.uri,
      name: def.name,
      description: def.description,
      mimeType: def.mimeType,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const entries = Array.from(resourceReaderMap.entries());
    for (const [pattern, reader] of entries) {
      const regex = new RegExp(
        '^' + pattern.replace(/\{[^}]+\}/g, '[^/]+') + '$',
      );
      if (regex.test(uri as string)) {
        return await reader(uri as string);
      }
    }
    throw new Error(`未知 resource URI: ${uri}`);
  });

  // ----- Register prompt handlers -----

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: allPromptDefs.map((def) => ({
      name: def.name,
      description: def.description,
      arguments: def.arguments?.map((a) => ({
        name: a.name,
        description: a.description,
        required: a.required,
      })),
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = allPromptHandlers[name as string];
    if (!handler) {
      throw new Error(`未知 prompt: ${name}`);
    }
    return await handler((args as Record<string, string | undefined>) ?? {});
  });

  return server;
}

// ----- Export combined metadata for HTTP route -----

export { allToolDefs, allResourceDefs, allPromptDefs };

// ----- Stdio entry point (default when run directly) -----

async function main() {
  const transportMode = process.env.MCP_TRANSPORT || 'stdio';

  if (transportMode === 'http') {
    // HTTP mode: start a standalone HTTP server (for local dev / testing)
    const http = await import('node:http');
    const { WebStandardStreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
    );

    const port = parseInt(process.env.MCP_HTTP_PORT || '3001', 10);
    const sessions = new Map<string, { server: Server; transport: InstanceType<typeof WebStandardStreamableHTTPServerTransport> }>();

    const httpServer = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://localhost:${port}`);
        if (url.pathname !== '/api/mcp') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found' }));
          return;
        }

        // Convert Node.js request to Web standard Request
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        const body = chunks.length > 0 ? Buffer.concat(chunks).toString() : undefined;
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') headers[key] = value;
        }
        const webRequest = new Request(`http://localhost:${port}${req.url}`, {
          method: req.method,
          headers,
          body: body || undefined,
        });

        const sessionId = headers['mcp-session-id'];

        if (req.method === 'DELETE') {
          if (sessionId && sessions.has(sessionId)) {
            const session = sessions.get(sessionId)!;
            await session.transport.close();
            await session.server.close();
            sessions.delete(sessionId);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        let session = sessionId ? sessions.get(sessionId) : undefined;

        if (!session) {
          // Create new session
          const newServer = createMcpServer();
          const newTransport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
            onsessioninitialized: (id) => {
              sessions.set(id, { server: newServer, transport: newTransport });
            },
            onsessionclosed: (id) => {
              sessions.delete(id);
            },
          });
          await newServer.connect(newTransport);
          session = { server: newServer, transport: newTransport };
        }

        const response = await session.transport.handleRequest(webRequest);
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        const responseBody = await response.text();
        res.end(responseBody);
      } catch (err) {
        console.error('HTTP request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });

    httpServer.listen(port, () => {
      console.error(`Ontology MCP Server running on HTTP at http://localhost:${port}/api/mcp`);
    });
  } else {
    // Stdio mode (default)
    const transport = new StdioServerTransport();
    const server = createMcpServer();
    await server.connect(transport);
    console.error('Ontology MCP Server running on stdio');
  }
}

// Only run main when executed directly (not when imported)
if (process.env.MCP_AUTO_START !== 'false') {
  main().catch((err) => {
    console.error('Fatal error starting MCP server:', err);
    process.exit(1);
  });
}
