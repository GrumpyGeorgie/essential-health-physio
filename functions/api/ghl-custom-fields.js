// Diagnostic-only endpoint: lists this GHL location's existing custom fields so we
// can check whether main_struggle/problem_cause/services_interested/contact_method/
// clinic_location already exist before wiring the survey form to them. Read-only —
// makes no changes in GHL. Remove once the custom-field setup is confirmed.
const GHL_LOCATION_ID = '5RSV9kpgbRBqjKQfOVjq';
const GHL_API_VERSION = '2021-07-28';

export async function onRequestGet({ env }) {
  if (!env.GHL_API_KEY) {
    return Response.json({ ok: false, error: 'GHL_API_KEY not set' }, { status: 500 });
  }

  const res = await fetch(`https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/customFields`, {
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      Version: GHL_API_VERSION,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    return Response.json({ ok: false, status: res.status, body: text }, { status: res.status });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, error: 'Non-JSON response', body: text }, { status: 502 });
  }

  const fields = (data.customFields || data.fields || []).map((f) => ({
    id: f.id,
    name: f.name,
    fieldKey: f.fieldKey,
    dataType: f.dataType,
  }));

  return Response.json({ ok: true, count: fields.length, fields });
}
