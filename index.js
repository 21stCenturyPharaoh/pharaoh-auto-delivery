export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. HEALTH CHECK
    if (pathname === '/health') {
      return new Response(JSON.stringify({
        status: "ONLINE",
        worker: "Pharaoh Auto-Delivery v1.3",
        time: new Date().toISOString(),
        kv: env.AFFILIATE_KV ? "BOUND" : "NOT_BOUND"
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 2. REGISTER AFFILIATE - FOR STRATEGY #2
    if (pathname === '/register-affiliate' && request.method === 'POST') {
      try {
        const data = await request.json();
        
        // Generate ref code: CAPTAIN01_LANE_COUNTRY
        const count = Math.floor(Math.random() * 1000) + 1;
        const refCode = `CAPTAIN${String(count).padStart(3, '0')}_${data.lane}_${data.country}`;
        
        // Save to KV
        await env.AFFILIATE_KV.put(refCode