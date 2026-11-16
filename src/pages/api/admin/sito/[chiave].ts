import type { APIRoute } from "astro";
import {
  dettaglioSito,
  pubblicaSito,
  salvaBozzaSito,
  scartaBozzaSito,
} from "../../../../lib/store";
import { guasto, ok, provando } from "../../../../lib/risposte";

export const prerender = false;

/* Le sole chiavi valide: un catalogo chiuso, così un errore di battitura non
   crea una riga fantasma che non verrà mai letta da nessuna pagina. */
const CHIAVI = new Set(["tema", "layout", "impostazioni", "studio"]);

/** Una chiave di sito (la bozza), col segno «da pubblicare». */
export const GET: APIRoute = ({ params }) =>
  provando(async () => {
    const chiave = params.chiave!;
    if (!CHIAVI.has(chiave)) return guasto("Chiave di sito sconosciuta.", 404);
    return ok(await dettaglioSito(chiave));
  });

/** Salva in BOZZA. Il sito cambia solo con «pubblica». */
export const PUT: APIRoute = ({ params, request }) =>
  provando(async () => {
    const chiave = params.chiave!;
    if (!CHIAVI.has(chiave)) return guasto("Chiave di sito sconosciuta.", 404);
    const corpo = (await request.json().catch(() => null)) as { dati?: Record<string, unknown> } | null;
    if (!corpo?.dati || typeof corpo.dati !== "object") {
      return guasto("Il salvataggio è arrivato senza dati.");
    }
    await salvaBozzaSito(chiave, corpo.dati);
    return ok();
  });

/** `{ azione: "pubblica" }` applica il tema/layout a tutto il sito;
    `{ azione: "scarta" }` butta la bozza. */
export const POST: APIRoute = ({ params, request }) =>
  provando(async () => {
    const chiave = params.chiave!;
    if (!CHIAVI.has(chiave)) return guasto("Chiave di sito sconosciuta.", 404);
    const corpo = (await request.json().catch(() => null)) as { azione?: string } | null;
    if (corpo?.azione === "scarta") {
      await scartaBozzaSito(chiave);
      return ok();
    }
    if (corpo?.azione !== "pubblica") {
      return guasto("Azione sconosciuta: attese «pubblica» o «scarta».");
    }
    await pubblicaSito(chiave);
    return ok();
  });
