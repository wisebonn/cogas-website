import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "COGAs Enquiries <onboarding@resend.dev>";
const REPLY_TO = "bonventurep@gmail.com";
const INTERNAL_EMAILS = ["bonventurep@gmail.com", "kagor2056@gmail.com"];
const WHATSAPP = "254722768745";
const PHONE_DISPLAY = "+254 722 768 745";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    // Accept either a DB trigger payload or a direct call
    const body = await req.json();
    const record = body.record || body;

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: "Missing enquiry record" }), {
        status: 400,
      });
    }

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY — emails skipped");
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
        { status: 200 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ────────────────────────────────────────────────
    // 1. INTERNAL EMAIL → chair + co-chair
    // ────────────────────────────────────────────────
    const internalHtml = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1a12;color:#e8ede9;border-radius:16px">
        <h2 style="color:#a3e635;font-family:Georgia,serif;margin:0 0 4px">COGAs Portal</h2>
        <p style="color:rgba(255,255,255,.6);margin:0 0 20px;font-size:13px">New enquiry received</p>

        <h3 style="color:#fff;margin:0 0 16px">🔔 ${record.name} — ${record.service_interest || "General enquiry"}</h3>

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5);width:120px">Name</td><td style="padding:8px 0;color:#fff">${record.name}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5)">Email</td><td style="padding:8px 0;color:#fff">${record.email || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5)">Phone</td><td style="padding:8px 0;color:#fff">${record.phone || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5)">Company</td><td style="padding:8px 0;color:#fff">${record.company || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5)">Service</td><td style="padding:8px 0;color:#fff">${record.service_interest || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,.5)">Source</td><td style="padding:8px 0;color:#fff">${record.source || "website"}</td></tr>
        </table>

        ${
          record.message
            ? `<div style="margin-top:20px;padding:16px;background:rgba(255,255,255,.06);border-radius:8px;color:rgba(255,255,255,.85);font-size:14px;line-height:1.6">
                <b style="color:#a3e635;display:block;margin-bottom:6px">Message</b>
                ${record.message.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}
              </div>`
            : ""
        }

        <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="https://cogas-website.vercel.app/team/enquiries" style="display:inline-block;background:#a3e635;color:#04170e;font-weight:700;padding:12px 22px;border-radius:99px;text-decoration:none;font-size:14px">Open pipeline →</a>
          ${
            record.phone
              ? `<a href="https://wa.me/${record.phone.replace(/\D/g, "").replace(/^0/, "254")}" style="display:inline-block;margin-left:8px;background:rgba(255,255,255,.1);color:#fff;font-weight:600;padding:12px 22px;border-radius:99px;text-decoration:none;font-size:14px;border:1px solid rgba(255,255,255,.2)">WhatsApp them</a>`
              : ""
          }
        </div>

        <p style="color:rgba(255,255,255,.4);font-size:12px;margin-top:28px">Sent automatically by the COGAs platform</p>
      </div>
    `;

    const internalRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: INTERNAL_EMAILS,
        reply_to: REPLY_TO,
        subject: `🔔 New enquiry: ${record.name}${record.service_interest ? ` — ${record.service_interest}` : ""}`,
        html: internalHtml,
      }),
    });

    if (!internalRes.ok) {
      console.error("Internal email error:", await internalRes.text());
    }

    // ────────────────────────────────────────────────
    // 2. AUTO-CONFIRMATION → the client
    // ────────────────────────────────────────────────
    if (record.email) {
      const clientHtml = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f4ec;color:#101511;border-radius:16px">
          <div style="text-align:center;padding:12px 0 20px">
            <h1 style="color:#04170e;font-family:Georgia,serif;margin:0;font-size:24px">COGAs Consultancy</h1>
            <p style="color:#5c665f;margin:6px 0 0;font-size:13px">Family-run · Science-led · Africa-focused</p>
          </div>

          <div style="background:#fff;padding:32px 28px;border-radius:12px;border:1px solid #e6e4da">
            <h2 style="color:#101511;margin:0 0 14px;font-size:20px">Thank you, ${record.name}.</h2>
            <p style="color:#5c665f;line-height:1.7;font-size:15px;margin:0 0 14px">
              We received your enquiry about <b>${record.service_interest || "our services"}</b>.
              A consultant will get back to you within <b>one business day</b>.
            </p>
            <p style="color:#5c665f;line-height:1.7;font-size:15px;margin:0 0 20px">
              In the meantime, if it's urgent, you can reach us directly:
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px;margin-bottom:20px">
              <p style="margin:0 0 12px;font-size:14px;color:#166534"><b>Direct contact</b></p>
              <p style="margin:0 0 8px;font-size:14px">
                📱 <a href="https://wa.me/${WHATSAPP}" style="color:#166534;text-decoration:none;font-weight:600">WhatsApp: ${PHONE_DISPLAY}</a>
              </p>
              <p style="margin:0;font-size:14px">
                ✉️ <a href="mailto:${REPLY_TO}" style="color:#166534;text-decoration:none;font-weight:600">${REPLY_TO}</a>
              </p>
            </div>

            <p style="color:#5c665f;line-height:1.7;font-size:14px;margin:0 0 8px">
              <b>What happens next:</b>
            </p>
            <ol style="color:#5c665f;line-height:1.9;font-size:14px;padding-left:20px;margin:0">
              <li>We review your enquiry</li>
              <li>A consultant calls or emails you (within 1 business day)</li>
              <li>We scope the project together</li>
              <li>You receive a transparent written proposal</li>
              <li>Work begins once you accept, tracked in your own client portal</li>
            </ol>
          </div>

          <p style="color:#5c665f;font-size:13px;text-align:center;margin:24px 0 0">
            COGAs Consultancy · A family business
          </p>
          <p style="color:#8a8f8c;font-size:11px;text-align:center;margin:8px 0 0">
            You're receiving this because you submitted a form on cogas-website.vercel.app
          </p>
        </div>
      `;

      const clientRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [record.email],
          reply_to: REPLY_TO,
          subject: "We received your enquiry — COGAs Consultancy",
          html: clientHtml,
        }),
      });

      if (!clientRes.ok) {
        console.error("Client email error:", await clientRes.text());
      }
    }

    // ────────────────────────────────────────────────
    // 3. Log the automated notification
    // ────────────────────────────────────────────────
    await supabase.from("audit_log").insert({
      actor_email: "system",
      action: "enquiry_notifications_sent",
      entity: "enquiry",
      entity_id: record.id,
      changes: {
        internal_sent: internalRes.ok,
        client_sent: !!record.email,
      },
    });

    return new Response(
      JSON.stringify({ ok: true, internal: internalRes.ok, client: !!record.email }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Notification error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});