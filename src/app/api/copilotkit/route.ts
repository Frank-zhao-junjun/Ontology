import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { NextRequest } from 'next/server';
import { createCozeServiceAdapter } from '@/lib/copilot/coze-service-adapter';

const ENDPOINT = '/api/copilotkit';

function createHandler(req: NextRequest) {
  const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(),
    serviceAdapter: createCozeServiceAdapter({ customHeaders }),
    endpoint: ENDPOINT,
  }).handleRequest;
}

export async function POST(req: NextRequest) {
  return createHandler(req)(req);
}

export async function GET(req: NextRequest) {
  return createHandler(req)(req);
}
