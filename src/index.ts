/**
 * PHARAOH AUTO-DELIVERY WORKER
 * Mission 2 — Hermes-Toth Service Contract
 *
 * PURPOSE:
 *   Internal delivery execution layer for Hermes-Toth.
 *
 * RECEIVES:
 *   /internal/email
 *   /internal/notification
 *
 * SECURITY:
 *   - Internal shared secret required
 *   - No EINs
 *   - No tax IDs
 *   - No public firewall claims
 *   - Entity represented only as:
 *       commercial
 *       nonprofit
 *
 * EMAIL:
 *   - Adds visible tracking disclosure
 *   - Supports marketing classification
 *   - Supports unsubscribe/opt-out URL
 *
 * ENV SECRETS:
 *   INTERNAL_SHARED_SECRET
 *   RESEND_API_KEY
 */

type Env = {
  INTERNAL_SHARED_SECRET: string;
  RESEND_API_KEY: string;
};

type DeliveryData = {
  entity?: "commercial" | "nonprofit";
  campaign?: string;
  recipient?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  isMarketing?: boolean;
  unsubscribeUrl?: string;
  trackingDisclosure?: boolean;
};

// ---------------------------------------------------------
// JSON RESPONSE
// ---------------------------------------------------------

function json(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store"
      }
    }
  );
}

// ---------------------------------------------------------
// ENTITY
// ---------------------------------------------------------

function normalizeEntity(
  entity?: string
): "commercial" | "nonprofit" {
  return entity === "nonprofit"
    ? "nonprofit"
    : "commercial";
}

// ---------------------------------------------------------
// TRACKING DISCLOSURE
// ---------------------------------------------------------

function buildDisclosure(
  entity: "commercial" | "nonprofit",
  unsubscribeUrl: string
): string {

  return `
<hr>
<p style="font-size:12px;line-height:1.5;color:#666;">
<strong>Tracking Notice:</strong>
This message may include open and/or link tracking to help measure
delivery and campaign performance.
</p>

<p style="font-size:12px;line-height:1.5;color:#666;">
<strong>Entity:</strong> ${entity}
</p>

<p style="font-size:12px;line-height:1.5;color:#666;">
If this is a marketing message and you no longer wish to receive
these communications, you may
<a href="${unsubscribeUrl}">unsubscribe</a>.
</p>
`;
}

// ---------------------------------------------------------
// TEXT DISCLOSURE
// ---------------------------------------------------------

function buildTextDisclosure(
  entity: "commercial" | "nonprofit",
  unsubscribeUrl: string
): string {

  return `

---
TRACKING NOTICE:
This message may include open and/or link tracking to help measure
delivery and campaign performance.

ENTITY: ${entity}

If this is a marketing message and you no longer wish to receive
these communications, unsubscribe here:
${unsubscribeUrl}
`;
}

// ---------------------------------------------------------
// RECIPIENT
// ---------------------------------------------------------

function normalizeRecipient(
  data: DeliveryData
): string | string[] | null {

  if (data.to) {
    return data.to;
  }

  if (data.recipient) {
    return data.recipient;
  }

  return null;
}

// ---------------------------------------------------------
// RESEND DELIVERY
// ---------------------------------------------------------

async function sendWithResend(
  data: DeliveryData,
  env: Env
): Promise<Response> {

  const entity =
    normalizeEntity(data.entity);

  const recipient =
    normalizeRecipient(data);

  if (!recipient) {
    return json(
      {
        error: "Missing recipient"
      },
      400
    );
  }

  if (!data.subject) {
    return json(
      {
        error: "Missing subject"
      },
      400
    );
  }

  if (!data.html && !data.text) {
    return json(
      {
        error: "Missing email content"
      },
      400
    );
  }

  const unsubscribeUrl =
    data.unsubscribeUrl ||
    "https://registry.pharaoh-conglomerate.org/unsubscribe";

  const includeDisclosure =
    data.trackingDisclosure !== false;

  const disclosureHtml =
    includeDisclosure
      ? buildDisclosure(
          entity,
          unsubscribeUrl
        )
      : "";

  const disclosureText =
    includeDisclosure
      ? buildTextDisclosure(
          entity,
          unsubscribeUrl
        )
      : "";

  const html =
    (data.html || "")
      + disclosureHtml;

  const text =
    (data.text || "")
      + disclosureText;

  /*
   * NOTE:
   * `from` should normally be supplied by the
   * configured sender identity for this Worker.
   */
  const from =
    data.from ||
    "Pharaoh Registry <onboarding@resend.dev>";

  const payload: Record<string, unknown> = {
    from,
    to: recipient,
    subject: data.subject,
    html,
    text
  };

  if (data.replyTo) {
    payload.reply_to = data.replyTo;
  }

  /*
   * Marketing messages receive an unsubscribe
   * header as an additional signal.
   */
  if (data.isMarketing) {

    payload.headers = {
      "List-Unsubscribe":
        `<${unsubscribeUrl}>`
    };
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${env.RESEND_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(payload)
      }
    );

  const result =
    await response.json().catch(
      () => ({})
    );

  if (!response.ok) {

    return json(
      {
        status: "delivery_failed",
        entity,
        campaign:
          data.campaign || null,
        error: result
      },
      response.status
    );
  }

  return json({
    status: "delivered_to_provider",

    entity,

    campaign:
      data.campaign || null,

    compliance: {
      disclosure_included:
        includeDisclosure,

      marketing_classified:
        !!data.isMarketing,

      unsubscribe_available:
        !!data.isMarketing
    },

    provider: {
      name: "Resend",
      accepted: true,
      id: result?.id || null
    }
  });
}

// ---------------------------------------------------------
// NOTIFICATION
// ---------------------------------------------------------

async function handleNotification(
  data: DeliveryData
): Promise<Response> {

  return json({
    status: "notification_received",

    entity:
      normalizeEntity(data.entity),

    campaign:
      data.campaign || null,

    message:
      "Notification accepted by Auto-Delivery."
  });
}

// ---------------------------------------------------------
// INTERNAL AUTHENTICATION
// ---------------------------------------------------------

function authorize(
  request: Request,
  env: Env
): boolean {

  const supplied =
    request.headers.get(
      "X-Internal-Secret"
    );

  if (!supplied) {
    return false;
  }

  if (!env.INTERNAL_SHARED_SECRET) {
    return false;
  }

  return supplied ===
    env.INTERNAL_SHARED_SECRET;
}

// ---------------------------------------------------------
// MAIN WORKER
// ---------------------------------------------------------

export default {

  async fetch(
    req: Request,
    env: Env
  ): Promise<Response> {

    const url =
      new URL(req.url);

    /*
     * EVERYTHING is internal.
     * Public browser requests are rejected.
     */

    if (!url.pathname.startsWith("/internal/")) {

      return json(
        {
          error: "Not found"
        },
        404
      );
    }

    /*
     * Hermes must authenticate before
     * anything reaches a delivery endpoint.
     */

    if (!authorize(req, env)) {

      return json(
        {
          error:
            "Unauthorized internal request"
        },
        401
      );
    }

    if (req.method !== "POST") {

      return json(
        {
          error:
            "POST required"
        },
        405
      );
    }

    const data:
      DeliveryData =
        await req.json()
          .catch(
            () => ({})
          );

    // -----------------------------------------------------
    // EMAIL
    // -----------------------------------------------------

    if (
      url.pathname ===
      "/internal/email"
    ) {

      return sendWithResend(
        data,
        env
      );
    }

    // -----------------------------------------------------
    // NOTIFICATION
    // -----------------------------------------------------

    if (
      url.pathname ===
      "/internal/notification"
    ) {

      return handleNotification(
        data
      );
    }

    return json(
      {
        error:
          "Unknown internal endpoint"
      },
      404
    );
  }
};
