export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (url.pathname.includes("/health") || url.pathname.includes("/v27") || url.pathname.includes("/register")) {
      if (url.pathname.includes("/health") || url.pathname.includes("/v27")) {
        return new Response(JSON.stringify({
          status: "alive",
          version: "27.5",
          worker: "pharaoh-auto-delivery",
          bridge: "HALLEL-API-ONLY",
          asia_gate: "亚洲之门",
          chinese: "慈悲令 守护令 希望令 光明令 人道天使 亚洲之门",
          mode: "IRS-SAFE-NON-REDUNDANT",
          frontend: "https://hermes-toth-agent.pages.dev/",
          timestamp: new Date().toISOString()
        }), {headers: {...cors, 'Content-Type': 'application/json'}});
      }
      const teams = ["Aleph 侦察","Bet 医疗","Gimel 后勤","Dalet 工程","He 社区","Vav 支持","Zayin 通讯"];
      const body = await request.json().catch(()=>({}));
      return new Response(JSON.stringify({
        success: true,
        captain_id: "CAPT"+Math.floor(1000+Math.random()*9000),
        team: teams[Math.floor(Math.random()*7)],
        message: "Council assigned 亚洲之门",
        frontend: "https://hermes-toth-agent.pages.dev/"
      }), {headers: {...cors, 'Content-Type': 'application/json'}});
    }
    return Response.redirect("https://hermes-toth-agent.pages.dev/?v=27.5", 302);
  }
}
