// TODO: Add Stripe + Email + Registry wiring here
// TODO: Add Stripe payment verification here
// TODO: Add Resend email sending here

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Expose-Headers": "Content-Length,ETag",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // GET /
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      return new Response("👑 Pharaoh Auto-Delivery Worker v1.0 ONLINE — POST /checkout to purchase", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    // GET /health
    if (request.method === "GET" && url.pathname === "/health") {
      const body = JSON.stringify({ status: "ok", version: "1.0" });
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    // POST /checkout
    if (request.method === "POST" && url.pathname === "/checkout") {
      type CheckoutRequest = {
        email: string;
        productId: string;
      };

      type CheckoutResponse = {
        success: boolean;
        downloadUrl?: string;
        message: string;
      };

      try {
        const contentType = request.headers.get("Content-Type") || "";
        if (!contentType.includes("application/json")) {
          const resp: CheckoutResponse = {
            success: false,
            message: "Content-Type must be application/json",
          };
          return new Response(JSON.stringify(resp), {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...corsHeaders,
            },
          });
        }

        const body = await request.json().catch(() => null);
        if (!body) {
          const resp: CheckoutResponse = {
            success: false,
            message: "Invalid JSON body",
          };
          return new Response(JSON.stringify(resp), {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...corsHeaders,
            },
          });
        }

        const { email, productId } = body as CheckoutRequest;

        if (typeof email !== "string" || !email.includes("@") || typeof productId !== "string" || productId.trim() === "") {
          const resp: CheckoutResponse = {
            success: false,
            message: "Missing or invalid 'email' or 'productId'",
          };
          return new Response(JSON.stringify(resp), {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...corsHeaders,
            },
          });
        }

        // TODO: Add Stripe payment verification here
