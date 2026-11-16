import type { APIRoute } from "astro";
import { contaMessaggiNonLetti, elencaMessaggi } from "../../../../lib/store";
import { ok, provando } from "../../../../lib/risposte";

export const prerender = false;

/** La casella: i messaggi arrivati dai moduli di contatto, coi non letti. */
export const GET: APIRoute = () =>
  provando(async () => ok({ messaggi: await elencaMessaggi(), nonLetti: await contaMessaggiNonLetti() }));
