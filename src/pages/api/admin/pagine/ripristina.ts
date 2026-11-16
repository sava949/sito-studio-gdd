import type { APIRoute } from "astro";
import { ripristinaPagine, type RigaGrezza } from "../../../../lib/store";
import { guasto, ok, provando } from "../../../../lib/risposte";

export const prerender = false;

/*
 * L'«Annulla» dell'eliminazione: rimette in vita le righe che la DELETE ha
 * restituito. Sta in un file suo (non sotto [chiave]) perché il ripristino
 * riguarda un intero sotto-albero, non una pagina sola — e «ripristina», come
 * nome di rotta statica, vince sul parametro dinamico [chiave].
 */
export const POST: APIRoute = ({ request }) =>
  provando(async () => {
    const corpo = (await request.json().catch(() => null)) as { righe?: RigaGrezza[] } | null;
    if (!corpo?.righe || !Array.isArray(corpo.righe) || corpo.righe.length === 0) {
      return guasto("Niente da ripristinare.");
    }
    await ripristinaPagine(corpo.righe);
    return ok();
  });
