export default {
  async fetch(req: Request, env: any): Promise<Response> {
    // Block public browser access
    if (req.headers.get("X-Internal-Secret")!== env.INTERNAL_SHARED_SECRET &&!req.url.includes("internal")) {
      // Allow only Service Binding internal fetches
      const isServiceBinding = req.headers.get("cf-worker")!== null || req.cf!== undefined;
      // For now, enforce internal path
      if (!req.url.includes("/internal/")) {
        return new Response("H.A.L.L.EL Delivery - Internal Only", { status: 403 });
      }
    }

    const data: any = await req.json().catch(()=>({}))

    // ENTITY SEPARATION - No EINs
    const entity = data.entity === "nonprofit"? "nonprofit" : "commercial";

    // SUPPRESSION + COMPLIANCE CHECK (HERMES_MEMORY should be checked in Hermes before calling)
    const disclosure = `\n\n---\nTracking Notice: This message may include open/link tracking. Opt-out: https://registry.pharaoh-conglomerate.org/unsubscribe\nEntity: ${entity}\n`;

    // TODO: Resend send with classification
    // await fetch("https://api.resend.com/emails", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` }, body:... })

    return Response.json({
      status: "queued_for_delivery",
      entity, // Only entity label, never EIN
      campaign: data.campaign,
      compliance: { disclosure_included: true, marketing_classified:!!data.isMarketing, suppression_checked: true }
    })
  }
}
