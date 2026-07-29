// Cloudflare Pages Function — receives the native patient-survey form submission
// and creates/updates the contact in GoHighLevel via their REST API.
//
// The GHL Private Integration Token is read from the GHL_API_KEY environment
// variable (set as a Secret in the Cloudflare Pages project settings — never
// committed to the repo, never sent to the browser). Runs server-side only.
//
// GHL_LOCATION_ID is not secret (it's just an identifier), so it's a constant here.
const GHL_LOCATION_ID = '5RSV9kpgbRBqjKQfOVjq';
const GHL_API_VERSION = '2021-07-28';

function splitName(fullName) {
  const trimmed = (fullName || '').trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

function toCustomField(key, value) {
  if (Array.isArray(value)) value = value.join(', ');
  return { key, field_value: value || '' };
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { full_name, email, phone, main_struggle, problem_cause, services_interested, contact_method, clinic_location } = body;

  if (!full_name || !email || !phone) {
    return Response.json({ ok: false, error: 'full_name, email, and phone are required' }, { status: 400 });
  }

  if (!env.GHL_API_KEY) {
    console.error('GHL_API_KEY is not set in the Cloudflare Pages environment');
    return Response.json({ ok: false, error: 'Server is not configured to submit leads yet' }, { status: 500 });
  }

  const { firstName, lastName } = splitName(full_name);

  const payload = {
    locationId: GHL_LOCATION_ID,
    firstName,
    lastName,
    email,
    phone,
    customFields: [
      toCustomField('main_struggle', main_struggle),
      toCustomField('problem_cause', problem_cause),
      toCustomField('services_interested', services_interested),
      toCustomField('contact_method', contact_method),
      toCustomField('clinic_location', clinic_location),
    ],
  };

  const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      'Content-Type': 'application/json',
      Version: GHL_API_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!ghlResponse.ok) {
    const errorText = await ghlResponse.text();
    console.error('GHL contact creation failed', ghlResponse.status, errorText);
    return Response.json({ ok: false, error: 'Failed to submit to GHL' }, { status: 502 });
  }

  return Response.json({ ok: true });
}
