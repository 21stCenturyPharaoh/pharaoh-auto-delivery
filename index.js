export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/") {
      return new Response('👑 Pharaoh Auto-Delivery Worker v1.0 ONLINE', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Endpoint ready. Connect to Registry next.', { status: 200 });
  },
};