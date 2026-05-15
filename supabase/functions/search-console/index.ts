import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

const BodySchema = z.object({
  action: z.enum(['list_sites', 'search_analytics', 'sitemaps', 'inspect_url']),
  siteUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dimensions: z.array(z.enum(['date', 'query', 'page', 'country', 'device'])).optional(),
  rowLimit: z.number().int().min(1).max(25000).optional(),
  inspectionUrl: z.string().optional(),
});

async function gw(path: string, init: RequestInit = {}) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GSC_KEY = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
  if (!GSC_KEY) throw new Error('GOOGLE_SEARCH_CONSOLE_API_KEY not configured');

  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GSC_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`GSC ${res.status}: ${text.slice(0, 500)}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { action, siteUrl, startDate, endDate, dimensions, rowLimit, inspectionUrl } = parsed.data;

    let data: unknown;

    if (action === 'list_sites') {
      data = await gw('/webmasters/v3/sites');
    } else if (action === 'search_analytics') {
      if (!siteUrl || !startDate || !endDate) throw new Error('siteUrl, startDate, endDate required');
      data = await gw(
        `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          body: JSON.stringify({
            startDate, endDate,
            dimensions: dimensions ?? ['date'],
            rowLimit: rowLimit ?? 1000,
          }),
        }
      );
    } else if (action === 'sitemaps') {
      if (!siteUrl) throw new Error('siteUrl required');
      data = await gw(`/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`);
    } else if (action === 'inspect_url') {
      if (!siteUrl || !inspectionUrl) throw new Error('siteUrl and inspectionUrl required');
      data = await gw('/v1/urlInspection/index:inspect', {
        method: 'POST',
        body: JSON.stringify({ siteUrl, inspectionUrl }),
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('search-console error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
