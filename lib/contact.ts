// ═══════════════════════════════════════════════════════════════
// Central contact configuration
// Change these and every reference updates (footer, contact page, emails)
// ═══════════════════════════════════════════════════════════════

export const CONTACT = {
  // Emails
  primaryEmail: "bonventurep@gmail.com",
  secondaryEmail: "kagor2056@gmail.com",
  allEmails: ["bonventurep@gmail.com", "kagor2056@gmail.com"],
  replyTo: "bonventurep@gmail.com",

  // Phones — display format
  primaryPhoneDisplay: "0722 768 745",
  secondaryPhoneDisplay: "0708 546 254",

  // Phones — international / WhatsApp format
  primaryPhoneIntl: "+254722768745",
  secondaryPhoneIntl: "+254708546254",

  // WhatsApp — first number is the default target
  whatsappNumber: "254722768745",
  whatsappNumberAlt: "254708546254",

  // Company
  companyName: "COGAs Consultancy",

  // Prefilled WhatsApp message for contact page
  whatsappPrefill:
    "Hi COGAs, I'd like to discuss a project. Could you help me?",

  // Prefilled email subject
  emailSubject: "Enquiry from COGAs website",
} as const;

// ────────────────────────────────────────────────────────────
// Helper builders — used by contact page, footer, emails
// ────────────────────────────────────────────────────────────

export function whatsappUrl(
  message = CONTACT.whatsappPrefill,
  number = CONTACT.whatsappNumber
) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function telUrl(number = CONTACT.primaryPhoneIntl) {
  return `tel:${number}`;
}

export function mailtoUrl(
  to = CONTACT.primaryEmail,
  subject = CONTACT.emailSubject,
  body = ""
) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${to}${qs ? `?${qs}` : ""}`;
}