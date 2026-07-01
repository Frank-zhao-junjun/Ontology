/**
 * @ontology/mcp-server — Entry Point
 *
 * Creates an MCP Server over stdio transport and registers
 * all 8 Tools + 4 Resources + 2 Prompts.
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

// Resource modules
import { resourceDefinitions, resourceReaders } from './resources/project-resources.js';

// Prompt modules
import { promptDefinitions, promptHandlers } from './prompts/copilot-prompts.js';

// ----- Combine all registrations -----

const allToolDefs = [
  ...projectToolDefinitions,
  ...chainToolDefinitions,
  ...analysisToolDefinitions,
];

const allToolHandlers: Record<string, ToolHandler> = {
  ...projectToolHandlers,
  ...chainToolHandlers,
  ...analysisToolHandlers,
};

const allResourceDefs = resourceDefinitions;

// Build a map: uri pattern -> reader
const resourceReaderMap = new Map<string, ResourceReader>();
for (const def of allResourceDefs) {
  resourceReaderMap.set(def.uri, resourceReaders[def.uri]);
}

const allPromptDefs = promptDefinitions;
const allPromptHandlers = promptHandlers;

// ----- Create and configure the server -----

const server = new Server(
  {
    name: 'ontology-mcp-server',
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
  // Match URI against patterns
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

// ----- Start the server -----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ontology MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err);
  process.exit(1);
});

export default server;
