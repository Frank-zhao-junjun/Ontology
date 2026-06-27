import { NextRequest } from 'next/server';

// CopilotKit 标准 Runtime Endpoint
// 参照 https://docs.copilotkit.ai 的 Next.js App Router 接入方式

const COPILOTKIT_RUNTIME = process.env.COPILOTKIT_RUNTIME || 'https://api.copilotkit.ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${COPILOTKIT_RUNTIME}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return new Response(res.body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return Response.json({ error: 'CopilotKit runtime error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', service: 'copilotkit' });
}
