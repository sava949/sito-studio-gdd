import type { APIRoute } from "astro";
import { caricaImmagine, elencaMedia } from "../../../lib/media";
import { guasto, ok, provando } from "../../../lib/risposte";

export const prerender = false;

/** La libreria: le ultime immagini caricate. */
export const GET: APIRoute = () => provando(async () => ok({ media: await elencaMedia() }));

export const POST: APIRoute = ({ request }) =>
  provando(async () => {
    const modulo = await request.formData().catch(() => null);
    const file = modulo?.get("file");
    if (!(file instanceof File)) return guasto("Non è arrivato nessun file.");

    try {
      return ok(await caricaImmagine(file));
    } catch (e) {
      // I messaggi di `caricaImmagine` sono già scritti per essere letti
      // («Formato non supportato», «Immagine troppo grande»): si ripetono.
      return guasto(e instanceof Error ? e.message : "Caricamento non riuscito.");
    }
  });
