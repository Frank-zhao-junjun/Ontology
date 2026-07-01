import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { allToolDefinitions, allToolHandlers } from './tools';
import { allResourceDefinitions, allResourceReaders } from './resources';
import { allPromptDefinitions, allPromptHandlers } from './prompts';

/**
 * Create an MCP Server instance with all tools, resources, and prompts.
 * Works with both Stdio and HTTP transports.
 */
export function createMcpServer(): Server {
  const server = new Server(
    { name: 'ontology-mcp', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  // ── Tools ────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allToolDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = allToolHandlers[name!];
    if (!handler) throw new Error(`Unknown tool: ${name}`);
    const result = await handler(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // ── Resources ────────────────────────────────────────────────────
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
    resourceTemplates: allResourceDefinitions,
  }));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: allResourceDefinitions,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    // Try exact match first, then pattern match
    let reader = allResourceReaders[uri];
    let text: string;
    if (reader) {
      text = await reader(uri);
    } else {
      // Pattern match for template URIs like ontology://project/{id}
      for (const [pattern, fn] of Object.entries(allResourceReaders)) {
        if (pattern.includes('{id}')) {
          const regex = new RegExp(
            pattern.replace(/\{id\}/g, '([^/]+)').replace(/[{}]/g, ''),
          );
          if (regex.test(uri)) {
            text = await fn(uri);
            reader = fn;
            break;
          }
        }
      }
      if (!reader) throw new Error(`Unknown resource: ${uri}`);
      text = await reader(uri);
    }
    return { contents: [{ uri, mimeType: 'application/json', text }] };
  });

  // ── Prompts ──────────────────────────────────────────────────────
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: allPromptDefinitions,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = allPromptHandlers[name!];
    if (!handler) throw new Error(`Unknown prompt: ${name}`);
    return handler(args || {});
  });

  return server;
}
