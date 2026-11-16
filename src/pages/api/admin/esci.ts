import type { APIRoute } from "astro";
import { NOME_COOKIE } from "../../../lib/auth";

export const prerender = false;

/**
 * Chiude la sessione cancellando il cookie. Il TOKEN resta valido: uscire non
 * è revocare. Per revocare davvero si scrive `revocata_il` sulla riga in
 * `chiavi_accesso` — vedi lo schema.
 */
export const POST: APIRoute = ({ cookies }) => {
  cookies.delete(NOME_COOKIE, { path: "/" });
  return new Response(JSON.stringify({ uscito: true }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
