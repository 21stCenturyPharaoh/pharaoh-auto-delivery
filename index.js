// TODO: Add Stripe + Email + Registry wiring here
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Expose-Headers": "Content-Length,ETag",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("👑 Pharaoh Auto-Delivery Worker v1.0 ONLINE", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders },
      });
    }

    if (url.pathname === "/health") {
      const body = JSON.stringify({ status: "ok", version: "1.0" });
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders },
    });
  },
};