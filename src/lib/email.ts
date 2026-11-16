/**
 * Invio email — opzionale.
 *
 * Il modulo di contatto salva SEMPRE nel database; l'email è la notifica in
 * più. Se le credenziali non ci sono, `inviaEmail` non fallisce: torna
 * `{ inviata: false }` e il messaggio resta comunque nella casella dell'editor.
 * Così il sito funziona appena installato, e l'email si accende quando si
 * vogliono le chiavi — senza toccare il codice.
 *
 * Provider: Resend, via la sua API HTTP (nessuna dipendenza, solo `fetch`).
 * Le variabili stanno nel .env (vedi .env.example): RESEND_API_KEY, CONTACT_TO
 * (a chi arriva), CONTACT_FROM (mittente verificato; in prova va
 * `onboarding@resend.dev`, che consegna solo al proprietario dell'account).
 */
const env = (chiave: string) =>
  (import.meta.env as any)[chiave] ?? process.env[chiave] ?? "";

export interface EsitoEmail {
  inviata: boolean;
  motivo?: string;
}

export function emailConfigurata(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("CONTACT_TO"));
}

export async function inviaEmail(opts: {
  oggetto: string;
  testo: string;
  rispondiA?: string;
}): Promise<EsitoEmail> {
  const key = env("RESEND_API_KEY");
  const a = env("CONTACT_TO");
  const da = env("CONTACT_FROM") || "onboarding@resend.dev";
  if (!key || !a) return { inviata: false, motivo: "email non configurata" };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: da,
        to: [a],
        subject: opts.oggetto,
        text: opts.testo,
        ...(opts.rispondiA ? { reply_to: opts.rispondiA } : {}),
      }),
    });
    if (!r.ok) return { inviata: false, motivo: `invio non riuscito (${r.status})` };
    return { inviata: true };
  } catch (e) {
    return { inviata: false, motivo: e instanceof Error ? e.message : "errore di rete" };
  }
}
