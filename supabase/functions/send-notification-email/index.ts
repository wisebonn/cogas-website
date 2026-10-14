import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "COGAs Portal <noreply@cogas.co.ke>";

serve(async (req) => {
  try {
    const { to, subject, message, taskId } = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Missing to/subject" }), { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY — email skipped");
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0d1a12;color:#e8ede9;border-radius:16px">
        <h2 style="color:#a3e635;font-family:Georgia,serif;margin:0 0 8px">COGAs Portal</h2>
        <h3 style="color:#fff;margin:0 0 12px">${subject}</h3>
        <p style="color:rgba(255,255,255,.75);line-height:1.6">${message}</p>
        <a href="https://cogas.vercel.app/team" style="display:inline-block;margin-top:20px;background:#a3e635;color:#04170e;font-weight:700;padding:12px 22px;border-radius:99px;text-decoration:none">Open Portal →</a>
        <p style="color:rgba(255,255,255,.4);font-size:12px;margin-top:28px">COGAs Consultancy · A family business</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});