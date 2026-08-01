export default {
  async fetch(request, env) {
    const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"};
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: corsHeaders});
    if (new URL(request.url).pathname === "/") return new Response("👑 Pharaoh Auto-Delivery Worker v1.2 ONLINE", {headers: {"Content-Type":"text/plain",...corsHeaders}});
    
    if (request.method === "POST" && new URL(request.url).pathname === "/checkout") {
      try {
        const {email, productId} = await request.json();
        if (!email) return new Response(JSON.stringify({success:false,message:"Missing email"}), {status:400, headers: {"Content-Type":"application/json",...corsHeaders}});
        
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {"Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json"},
          body: JSON.stringify({
            from: "Pharaoh Angels <onboarding@resend.dev>",
            to: [email],
            subject: "Hello World - Your Download",
            html: "<p>Congrats on sending your <strong>first email</strong>!</p>"
          })
        });
        
        return new Response(JSON.stringify({success:true,message:`Email sent to ${email}`}), {headers: {"Content-Type":"application/json",...corsHeaders}});
      } catch(e) { 
        return new Response(JSON.stringify({success:false,message:e.message}), {status:500, headers: {"Content-Type":"application/json",...corsHeaders}}); 
      } 
    } 
    return new Response("Not Found", {status: 404}); 
  }
}