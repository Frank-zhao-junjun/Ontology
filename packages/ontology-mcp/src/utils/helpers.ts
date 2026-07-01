/**
 * Shared utilities for ontology MCP server.
 */

import { z } from 'zod';

/** Wrap an error into structured JSON for MCP text response. */
export function errorResponse(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return JSON.stringify({ success: false, error: message });
}

/** Wrap a success payload into structured JSON for MCP text response. */
export function successResponse<T>(data: T): string {
  return JSON.stringify({ success: true, data });
}

/** Common schema for project ID parameter. */
export const ProjectIdSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
});

/** Business chain node type discriminator. */
export const NodeKindSchema = z.enum(['A', 'B', 'C', 'EPC']);

/** Common input for adding a business chain node. */
export const NodeInputSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});
