// SBI relay for Estate Ecology: a Cloudflare Worker.
// The RPA land parcel service does not let other websites read it from the browser.
// This worker fetches parcels for one SBI at a time and adds the header that lets the app read them.
// It only ever asks for parcels by SBI, so it cannot be used to reach anything else.
const SERVICE = 'https://gisrest.defra.gov.uk/server/rest/services/RPA/LandParcels/MapServer/0/query';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' };
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET') return new Response('Only GET', { status: 405, headers: CORS });
    const q = new URL(request.url).searchParams;
    if (!/^sbi='\d{6,12}'$/.test(q.get('where') || '')) return new Response(JSON.stringify({ error: { message: 'Ask for parcels by SBI only.' } }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    const out = new URLSearchParams();
    for (const k of ['where', 'outFields', 'returnGeometry', 'outSR', 'f', 'resultOffset', 'resultRecordCount', 'orderByFields']) if (q.has(k)) out.set(k, q.get(k));
    const r = await fetch(SERVICE + '?' + out.toString(), { headers: { 'Accept': 'application/json' } });
    return new Response(await r.text(), { status: r.status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  },
};
