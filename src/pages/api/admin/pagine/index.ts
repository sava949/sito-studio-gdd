import type { APIRoute } from "astro";
import { creaPagina, elencoAlbero, percorsoLibero } from "../../../../lib/store";
import { guasto, ok, provando } from "../../../../lib/risposte";

export const prerender = false;

/** L'albero completo delle pagine, per la mappa del sito dell'editor. */
export const GET: APIRoute = () =>
  provando(async () => ok({ voci: await elencoAlbero() }));

/**
 * Crea una pagina nuova e torna il suo `percorso`.
 *
 * Il percorso lo decide il SERVER a partire dal titolo (e dall'eventuale
 * genitore): due pagine con lo stesso titolo devono ottenere indirizzi diversi
 * (`/nota`, `/nota-2`), e quella decisione richiede di sapere cosa c'è già —
 * cioè il database. Nasce NASCOSTA: appena creata non è ancora niente per il
 * mondo, e va online solo con «Pubblica».
 */
export const POST: APIRoute = ({ request }) =>
  provando(async () => {
    const corpo = (await request.json().catch(() => ({}))) as {
      titolo?: string;
      genitore?: number | null;
    };
    const titolo = String(corpo.titolo ?? "").trim();
    if (!titolo) return guasto("Serve un titolo per creare la pagina.");

    const genitore = corpo.genitore ? Number(corpo.genitore) : null;
    const percorso = await percorsoLibero(genitore, titolo);
    const pagina = await creaPagina({ percorso, titolo, genitore, nelMenu: true });
    return ok({ percorso: pagina.percorso });
  });
