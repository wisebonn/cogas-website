// ═══════════════════════════════════════════════════════════════
// Integration stubs — all functions exist, return placeholder results
// until real credentials are set. No UI breaks when they're disabled.
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

export const INTEGRATION_STATUS = {
  mpesa: {
    enabled: !!process.env.NEXT_PUBLIC_MPESA_ENABLED,
    label: "M-Pesa (Daraja)",
    description: "STK push payments for invoices",
  },
  stripe: {
    enabled: !!process.env.NEXT_PUBLIC_STRIPE_ENABLED,
    label: "Stripe",
    description: "Card payments for international clients",
  },
  resend: {
    enabled: true, // Edge function handles gracefully if no key
    label: "Resend email",
    description: "Transactional notifications",
  },
  openai: {
    enabled: !!process.env.NEXT_PUBLIC_OPENAI_ENABLED,
    label: "OpenAI (AgriMind RAG)",
    description: "AI embeddings and question answering",
  },
} as const;

// ─────── M-PESA ───────
export async function initiateMpesaPayment(params: {
  invoiceId: string;
  phoneNumber: string;
  amount: number;
}) {
  if (!INTEGRATION_STATUS.mpesa.enabled) {
    return {
      ok: false,
      notConfigured: true,
      message:
        "M-Pesa payments are being set up. Your consultant will send payment instructions directly. Contact us to pay now.",
    };
  }
  // Real implementation would:
  // 1. Get OAuth token from Daraja
  // 2. POST to /mpesa/stkpush/v1/processrequest
  // 3. Store CheckoutRequestID
  // 4. Handle callback in a separate edge function
  const { data, error } = await supabase.functions.invoke("mpesa-stkpush", {
    body: params,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, data };
}

// ─────── STRIPE ───────
export async function createStripeCheckout(params: {
  invoiceId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!INTEGRATION_STATUS.stripe.enabled) {
    return {
      ok: false,
      notConfigured: true,
      message:
        "Card payments are being set up. Your consultant will send payment instructions directly.",
    };
  }
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: params,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, url: data.url };
}

// ─────── EMAIL ───────
export async function sendEmail(params: {
  to: string;
  subject: string;
  message: string;
  taskId?: string;
}) {
  const { data, error } = await supabase.functions.invoke(
    "send-notification-email",
    { body: params }
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true, data };
}

// ─────── AGRIMIND ───────
export async function agrimindQuery(question: string) {
  const { data, error } = await supabase.functions.invoke("agrimind-query", {
    body: { question },
  });
  if (error) {
    return {
      ok: false,
      answer:
        "I couldn't reach the knowledge engine. Try again in a moment.",
      citations: [],
    };
  }
  return data;
}

export async function agrimindEmbed(documentId: string) {
  const { data, error } = await supabase.functions.invoke("agrimind-embed", {
    body: { documentId },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, data };
}