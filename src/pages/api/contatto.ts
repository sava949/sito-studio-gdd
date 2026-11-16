import type { APIRoute } from "astro";
import { salvaMessaggio } from "../../lib/store";
import { inviaEmail } from "../../lib/email";

export const prerender = false;

/*
 * Il modulo di contatto — un endpoint PUBBLICO (fuori da /api/admin, quindi
 * non protetto dal middleware): lo usa chi visita il sito. Salva SEMPRE nel
 * database; poi prova a mandare l'email, che è opzionale. Niente JSON per il
 * visitatore: si torna alla pagina con `?inviato=1` (o `?errore=…`), così il
 * modulo funziona anche senza JavaScript.
 */

const FINESTRA_MS = 10 * 60 * 1000;
const MAX = 8;
const tentativi = new Map<string, number[]>();
function troppi(ip: string): boolean {
  const ora = Date.now();
  const recenti = (tentativi.get(ip) ?? []).filter((t) => ora - t < FINESTRA_MS);
  recenti.push(ora);
  tentativi.set(ip, recenti);
  return recenti.length > MAX;
}

/** Solo un percorso interno: mai un indirizzo esterno o un doppio slash, o il
    redirect diventerebbe un trampolino verso un altro sito. */
function paginaSicura(v: unknown): string {
  const s = String(v ?? "/");
  return /^\/[^/]/.test(s) || s === "/" ? s : "/";
}

const vaiA = (percorso: string, params: string) =>
  new Response(null, { status: 303, headers: { Location: `${percorso}?${params}` } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const modulo = await request.formData().catch(() => null);
  const pagina = paginaSicura(modulo?.get("pagina"));

  if (!modulo) return vaiA(pagina, "errore=modulo");

  /* L'esca anti-spam: un campo nascosto che una persona non vede e non
     compila, ma un robot sì. Se è pieno, si fa finta di niente — niente
     salvataggio, ma nessun segnale che riveli il trucco. */
  if (String(modulo.get("azienda") ?? "").trim() !== "") return vaiA(pagina, "inviato=1");

  const ip = clientAddress ?? "sconosciuto";
  if (troppi(ip)) return vaiA(pagina, "errore=troppi");

  const nome = String(modulo.get("nome") ?? "").trim().slice(0, 120);
  const email = String(modulo.get("email") ?? "").trim().slice(0, 200);
  const messaggio = String(modulo.get("messaggio") ?? "").trim().slice(0, 5000);

  if (!messaggio) return vaiA(pagina, "errore=vuoto");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return vaiA(pagina, "errore=email");

  try {
    await salvaMessaggio({ pagina, nome, email, messaggio });
  } catch (e) {
    console.error("[contatto] salvataggio fallito", e);
    return vaiA(pagina, "errore=salvataggio");
  }

  /* L'email è la notifica in più: se non è configurata o fallisce, il
     messaggio è comunque salvato — non si perde niente e non si mente al
     visitatore, che ha davvero mandato il messaggio. */
  await inviaEmail({
    oggetto: `Nuovo messaggio dal sito${nome ? ` — ${nome}` : ""}`,
    testo: `Pagina: ${pagina}\nNome: ${nome || "—"}\nEmail: ${email || "—"}\n\n${messaggio}`,
    rispondiA: email || undefined,
  });

  return vaiA(pagina, "inviato=1");
};
