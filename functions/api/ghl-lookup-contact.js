// Diagnostic-only endpoint: looks up a GHL contact by email so we can verify a test
// submission actually landed with the right custom field values. Read-only against
// GHL (a GET search call) — remove once the integration is confirmed working.
const GHL_LOCATION_ID = '5RSV9kpgbRBqjKQfOVjq';
const GHL_API_VERSION = '2021-07-28';

export async function onRequestGet({ request, env }) {
  if (!env.GHL_API_KEY) {
    return Response.json({ ok: false, error: 'GHL_API_KEY not set' }, { status: 500 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) {
    return Response.json({ ok: false, error: 'email query param required' }, { status: 400 });
  }

  const searchUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`;
  const res = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      Version: GHL_API_VERSION,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    return Response.json({ ok: false, status: res.status, body: text }, { status: res.status });
  }

  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
