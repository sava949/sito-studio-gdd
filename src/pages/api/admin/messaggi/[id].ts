import type { APIRoute } from "astro";
import { eliminaMessaggio, segnaMessaggioLetto } from "../../../../lib/store";
import { guasto, ok, provando } from "../../../../lib/risposte";

export const prerender = false;

/** `{ azione: "letto" | "nonletto" }` cambia lo stato di un messaggio. */
export const POST: APIRoute = ({ params, request }) =>
  provando(async () => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return guasto("Messaggio sconosciuto.", 404);
    const corpo = (await request.json().catch(() => null)) as { azione?: string } | null;
    if (corpo?.azione !== "letto" && corpo?.azione !== "nonletto") {
      return guasto("Azione sconosciuta: attese «letto» o «nonletto».");
    }
    await segnaMessaggioLetto(id, corpo.azione === "letto");
    return ok();
  });

export const DELETE: APIRoute = ({ params }) =>
  provando(async () => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return guasto("Messaggio sconosciuto.", 404);
    await eliminaMessaggio(id);
    return ok();
  });
