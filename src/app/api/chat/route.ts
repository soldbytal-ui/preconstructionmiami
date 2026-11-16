import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// Override with ANTHROPIC_MODEL in Vercel if this model is ever retired.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chat is not configured. Please add ANTHROPIC_API_KEY to environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Server-side limits: the browser's own counter can be bypassed.
  const ip = clientIp(req);
  if (!rateLimit(`chat:${ip}`, 30, 60 * 60_000) || !rateLimit(`chat-burst:${ip}`, 6, 60_000)) {
    return new Response(
      JSON.stringify({ error: 'Message limit reached. Please submit your info for personalized help from a licensed agent.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json().catch(() => null);
  const raw = body?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 41) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
  const messages = raw
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }));
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  if (messages.filter((m) => m.role === 'user').length > 20) {
    return new Response(
      JSON.stringify({ error: 'Message limit reached. Please submit your info for personalized help from a licensed agent.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch project catalog for context
  const { data: projects } = await supabase
    .from('projects')
    .select('name, slug, status, category, priceMin, priceMax, floors, estCompletion, address, neighborhoodId, neighborhood:neighborhoods(name, slug), developer:developers(name)')
    .order('name')
    .limit(200);

  const projectSummary = (projects || []).map((p: any) =>
    `- ${p.name} | ${p.neighborhood?.name || 'Miami'} | ${p.status} | ${p.priceMin ? `$${(p.priceMin/1000000).toFixed(1)}M` : 'TBD'}-${p.priceMax ? `$${(p.priceMax/1000000).toFixed(1)}M` : 'TBD'} | ${p.floors || '?'} floors | ${p.estCompletion || 'TBD'} | ${p.developer?.name || 'TBD'} | /properties/${p.slug}`
  ).join('\n');

  const systemPrompt = `You are the PreConstructionMiami AI assistant. You help users find pre-construction condos, townhomes, and homes in South Florida.

AVAILABLE PROJECTS (${(projects || []).length} total):
${projectSummary}

RULES:
- When recommending projects, ALWAYS include: project name, neighborhood, price range, estimated completion, and a link formatted as [Project Name](/properties/slug)
- Be concise, friendly, and helpful. Use short paragraphs.
- You are NOT a licensed real estate agent. If users ask for investment advice, buying recommendations, or legal guidance, remind them to consult with a licensed real estate professional.
- Never guarantee returns, appreciation, or investment outcomes.
- If asked about a project not on the list, say you don't have information on it and suggest they submit the inquiry form so a licensed local agent can follow up.
- When comparing projects, use a brief table or bullet format.
- For neighborhood questions, mention the relevant neighborhood page: /new-condos-[slug]
- Keep responses under 300 words unless the user asks for detailed comparisons.
- Always end recommendations with: "Would you like me to help you narrow down your search?"
- Never refer to "our team", "our agents" or "our experts". The platform has no sales team; it connects users with independent licensed local agents.
- Today's date is ${new Date().toISOString().slice(0, 10)}. Treat a project whose estimated completion year has passed as likely delivered and say the date should be verified.
- You represent PreConstructionMiami.net, an informational platform that partners with licensed local real estate professionals.`;

  // Call Anthropic API with streaming
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Anthropic API error:', error);
    return new Response(
      JSON.stringify({ error: 'Sorry, I encountered an error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) { controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
              }
            } catch {}
          }
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
