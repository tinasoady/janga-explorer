import { proKindLabel, type ProRequestInput } from "./pro-request";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Prévient le superadmin par e-mail qu'une demande de compte pro est arrivée (via Resend, https://resend.com).
 * Variables : RESEND_API_KEY, SUPERADMIN_NOTIFY_EMAIL, et facultativement MAIL_FROM.
 * Sans configuration, ne fait rien : la demande reste visible dans /admin/demandes. Ne lève jamais d'erreur.
 */
export async function notifyNewProRequest(request: Omit<ProRequestInput, "password">, origin: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPERADMIN_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const from = process.env.MAIL_FROM || "Janga Explorer <onboarding@resend.dev>";
  const link = `${origin}/admin/demandes`;
  const rows: [string, string][] = [
    ["Nom", request.fullName],
    ["Entreprise", request.company],
    ["Activité", proKindLabel(request.kind)],
    ["Localité", request.locality],
    ["Capacité", String(request.capacity)],
    ["E-mail pro", request.email],
    ["Justificatif", request.justification],
  ];

  const text = [`Nouvelle demande de compte professionnel`, "", ...rows.map(([k, v]) => `${k} : ${v}`), "", `Examiner la demande : ${link}`].join("\n");
  const html = `<p><strong>Nouvelle demande de compte professionnel</strong></p>
<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><strong>${escape(k)}</strong></td><td>${escape(v)}</td></tr>`).join("")}</table>
<p><a href="${escape(link)}">Examiner la demande</a></p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `Demande de compte pro : ${request.company}`, html, text }),
    });
    if (!res.ok) console.error(`Notification e-mail refusée par Resend (HTTP ${res.status})`);
  } catch {
    console.error("Notification e-mail impossible : Resend injoignable");
  }
}
