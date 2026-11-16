/**
 * Le risposte JSON, scritte una volta sola.
 *
 * `editor.js` legge `corpo.errore` per il messaggio e `corpo.errori` per
 * l'elenco per campo: sono due forme precise, e ogni rotta che se le
 * inventasse di nuovo rischierebbe di scriverne una terza che l'editor
 * mostrerebbe come «Errore» e basta.
 */

import type { ErroreValidazione } from "./schema";

const JSONH = { "Content-Type": "application/json; charset=utf-8" };

export const ok = (corpo: unknown = { ok: true }) =>
  new Response(JSON.stringify(corpo), { headers: JSONH });

export const guasto = (messaggio: string, stato = 400) =>
  new Response(JSON.stringify({ errore: messaggio }), { status: stato, headers: JSONH });

export const nonValido = (errori: ErroreValidazione[]) =>
  new Response(
    JSON.stringify({ errore: "Ci sono campi da correggere.", errori }),
    { status: 422, headers: JSONH },
  );

/**
 * Esegue e traduce ciò che va storto. Un guasto del database deve arrivare
 * all'editor come una frase, non come una pagina di errore di Astro: `api()`
 * in editor.js fa `risposta.json()`, e su una pagina HTML otterrebbe un
 * oggetto vuoto e mostrerebbe «Errore» senza dire altro.
 */
export async function provando(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    const messaggio = e instanceof Error ? e.message : String(e);
    // In coda al log resta l'errore intero; a chi guarda lo schermo va una
    // frase. Sono due pubblici diversi.
    console.error("[admin]", e);
    return guasto(
      messaggio.includes("Collezione sconosciuta")
        ? messaggio
        : "Il database non ha risposto. Riprova fra un momento.",
      messaggio.includes("Collezione sconosciuta") ? 404 : 503,
    );
  }
}
