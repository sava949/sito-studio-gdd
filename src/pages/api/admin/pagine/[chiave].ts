import type { APIRoute } from "astro";
import {
  dettaglioPagina,
  elimina,
  impostaMeta,
  pubblica,
  salvaBozza,
  scartaBozza,
  sottoalbero,
  versioni,
} from "../../../../lib/store";
import { guasto, nonValido, ok, provando } from "../../../../lib/risposte";
import { validaPagina } from "../../../../lib/schema";

export const prerender = false;

/*
 * L'indirizzo di una pagina è un ALBERO ("/servizi/consulenza"), ma un
 * parametro di rotta è un solo segmento. Il percorso viaggia quindi codificato
 * con l'underscore al posto della barra ("_servizi_consulenza"), e si decodifica
 * qui. Funziona perché gli slug non contengono mai underscore (vedi
 * `slugDaTitolo` in store.ts) — la corrispondenza è biunivoca. Meglio
 * dell'`%2F` codificato, che diversi proxy e adattatori rifiutano nei percorsi.
 */
const daChiave = (chiave: string) => "/" + chiave.replace(/^_+/, "").replace(/_/g, "/");

/** Una pagina (la bozza), coi suoi metadati. Con `?versioni` anche lo storico. */
export const GET: APIRoute = ({ params, url }) =>
  provando(async () => {
    const percorso = daChiave(params.chiave!);
    const pagina = await dettaglioPagina(percorso);
    if (!pagina) return guasto("La pagina non esiste.", 404);
    if (!url.searchParams.has("versioni")) return ok(pagina);
    return ok({ ...pagina, versioni: await versioni(percorso) });
  });

/** Salva il lavoro IN BOZZA. Il sito non cambia finché non si pubblica. */
export const PUT: APIRoute = ({ params, request }) =>
  provando(async () => {
    const percorso = daChiave(params.chiave!);
    const corpo = (await request.json().catch(() => null)) as
      | { dati?: Record<string, unknown> }
      | null;
    if (!corpo?.dati || typeof corpo.dati !== "object") {
      return guasto("Il salvataggio è arrivato senza dati.");
    }
    await salvaBozza(percorso, corpo.dati);
    return ok();
  });

/**
 * Le azioni sulla pagina che non cambiano il suo contenuto:
 * - `pubblica`: manda la bozza sul sito (reversibile con la cronologia);
 * - `scarta`: butta la bozza e torna al pubblicato;
 * - `meta`: menu (`nelMenu`) e posizione (`ordine`) — cose della riga.
 */
export const POST: APIRoute = ({ params, request }) =>
  provando(async () => {
    const percorso = daChiave(params.chiave!);
    const corpo = (await request.json().catch(() => null)) as
      | { azione?: string; nelMenu?: boolean; ordine?: number | null }
      | null;

    if (corpo?.azione === "scarta") {
      await scartaBozza(percorso);
      return ok();
    }
    if (corpo?.azione === "meta") {
      await impostaMeta(percorso, { nelMenu: corpo.nelMenu, ordine: corpo.ordine });
      return ok();
    }
    if (corpo?.azione !== "pubblica") {
      return guasto("Azione sconosciuta: attese «pubblica», «scarta» o «meta».");
    }
    /* Si valida QUI, alla pubblicazione: è il momento in cui il contenuto
       smette di essere una bozza e diventa la pagina che il mondo legge. */
    const pag = await dettaglioPagina(percorso);
    const errori = validaPagina(pag?.dati ?? {});
    if (errori.length) return nonValido(errori);
    await pubblica(percorso);
    return ok();
  });

/** Elimina la pagina (e, per l'albero, le sue sottopagine con lei). La home
    non si elimina: un sito senza radice non è un sito. */
export const DELETE: APIRoute = ({ params }) =>
  provando(async () => {
    const percorso = daChiave(params.chiave!);
    if (percorso === "/") return guasto("La pagina iniziale non si elimina.");
    // Si fotografa il sotto-albero PRIMA di cancellarlo, e lo si rimanda:
    // è ciò che permette l'«Annulla» dell'eliminazione (rotta /ripristina).
    const rimosse = await sottoalbero(percorso);
    await elimina(percorso);
    return ok({ rimosse });
  });
