/**
 * V26.9 DUAL DASHBOARD - BUSINESSES vs AFFILIATES
 * POST /register-business -> KV BUSINESSES
 * GET /businesses/list -> list
 * POST /register-affiliate -> KV AFFILIATES
 * POST /track-click -> KV CLICKS
 * GET /dashboard?business=MAMA or ?affiliate=PHR123
 * GET /whatsapp-router?business=TECHBLESSING&ref=PHR...
 * GET /health
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (method === 'OPTIONS') return new Response(null, { headers: cors });
    if (path === '/health') {
      return new Response(JSON.stringify({ status:'ok', version:'V26.9 DUAL', checks: { BUSINESSES:!!env.BUSINESSES, AFFILIATES:!!env.AFFILIATES, CLICKS:!!env.CLICKS, ASSETS:!!env.ASSETS, HERMES_MEMORY:!!env.HERMES_MEMORY }, time:new Date().toISOString() }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } });
    }
    if (path === '/register-business' && method === 'POST') {
      let data = await request.json();
      if (!data.id) data.id = (data.name||'BUS').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,15);
      const id = data.id.toUpperCase(); data.id=id; data.updatedAt=new Date().toISOString();
      await env.BUSINESSES.put(`BUSINESS:${id}`, JSON.stringify(data));
      let idx = await env.BUSINESSES.get('BUSINESS:INDEX'); let list = idx?JSON.parse(idx):[];
      if (!list.includes(id)) { list.push(id); await env.BUSINESSES.put('BUSINESS:INDEX', JSON.stringify(list)); }
      return new Response(JSON.stringify({ success:true, business_id:id, dashboard_url:`https://registry.pharaoh-conglomerate.org/?business=${id}` }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } });
    }
    if ((path === '/register-affiliate' && method === 'POST') || (path === '/register-affiliate' && method === 'GET' && url.searchParams.get('name'))) {
      let data = method==='GET' ? Object.fromEntries(url.searchParams.entries()) : await request.json();
      if (!data.id) data.id='PHR'+Math.floor(100000+Math.random()*900000);
      const id=data.id.toUpperCase(); data.id=id; data.createdAt=new Date().toISOString(); data.clicks=0; data.score=0;
      await env.AFFILIATES.put(`AFFILIATE:${id}`, JSON.stringify(data));
      return new Response(JSON.stringify({ success:true, affiliate_id:id, ref_link:`https://registry.pharaoh-conglomerate.org/?ref=${id}` }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } });
    }
    if (path === '/businesses/list') {
      let idx = await env.BUSINESSES?.get('BUSINESS:INDEX'); let ids = idx?JSON.parse(idx):[];
      let businesses = [];
      if (ids.length===0) { businesses = [{ id:'TECHBLESSING', name:'Tech Blessing CEO', category:'Tech', whatsapp:'+17712238021', bio:'Liberian Tech Support' }, { id:'MAMA', name:"Mama's Mani/Pedi/Hair Fest", category:'Beauty', bio:'Monrovia Beauty Festival' }, { id:'MOSETTA', name:"Mosetta's Online Liberian Restaurant", category:'Food' }, { id:'YANCY', name:"Dr Yancy Drug Store", category:'Pharma' }, { id:'GABE', name:"Gabe's Landscaping", category:'Outdoor' }, { id:'V2', name:"V2's Business Center", category:'Business' }, { id:'DERRINA', name:'Derrina Evening Wear', category:'Fashion' }]; }
      else { for (let id of ids) { let b=await env.BUSINESSES.get(`BUSINESS:${id}`); if(b) businesses.push(JSON.parse(b)); } }
      return new Response(JSON.stringify({ businesses, count:businesses.length }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } });
    }
    if (path === '/track-click' && method === 'POST') {
      let data = await request.json(); const cid='CLK'+Date.now(); data.click_id=cid; data.timestamp=new Date().toISOString();
      await env.CLICKS?.put(cid, JSON.stringify(data));
      if (data.affiliate_id && env.AFFILIATES) { let aRaw=await env.AFFILIATES.get(`AFFILIATE:${data.affiliate_id}`); if(aRaw){ let a=JSON.parse(aRaw); a.clicks=(a.clicks||0)+1; a.score=(a.clicks*1.5)+((a.conversions||0)*10); await env.AFFILIATES.put(`AFFILIATE:${data.affiliate_id}`, JSON.stringify(a)); } }
      return new Response(JSON.stringify({ success:true, click_id:cid }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } });
    }
    if (path === '/whatsapp-router') {
      const biz = url.searchParams.get('business')?.toUpperCase(); const ref=url.searchParams.get('ref');
      let wa = '+17712238021'; if (biz && env.BUSINESSES) { let bRaw=await env.BUSINESSES.get(`BUSINESS:${biz}`); if(bRaw){ let b=JSON.parse(bRaw); if(b.whatsapp) wa=b.whatsapp; } }
      const waUrl = `https://wa.me/${wa.replace(/[^0-9]/g,'')}?text=Hello%20from%20Registry%20${biz||''}%20Ref:${ref||''}`;
      return Response.redirect(waUrl, 302);
    }
    if (path === '/dashboard') {
      const b = url.searchParams.get('business')?.toUpperCase(); const a = url.searchParams.get('affiliate')?.toUpperCase();
      if (b) { let raw=await env.BUSINESSES.get(`BUSINESS:${b}`); return new Response(JSON.stringify({ type:'business', business:raw?JSON.parse(raw):null }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } }); }
      if (a) { let raw=await env.AFFILIATES.get(`AFFILIATE:${a}`); return new Response(JSON.stringify({ type:'affiliate', affiliate:raw?JSON.parse(raw):null }, null, 2), { headers: { 'Content-Type':'application/json', ...cors } }); }
    }
    return new Response(JSON.stringify({ error:'not found' }, null, 2), { status:404, headers: { 'Content-Type':'application/json', ...cors } });
  }
};