import type { APIRoute } from "astro";
import { NOME_COOKIE, creaSessione, opzioniCookie, troppiTentativi, verificaToken } from "../../lib/auth";

export const prerender = false;

/*
 * Scambia la chiave digitata in /accesso con un cookie di sessione. Pubblico
 * (fuori da /api/admin) perché serve PRIMA di avere una sessione. Stessa
 * verifica del collegamento `?t=…` del middleware — solo che qui la chiave
 * arriva da un campo, non dall'URL. Freno ai tentativi per IP.
 */
export const POST: APIRoute = async ({ request, cookies, clientAddress, url }) => {
  const vai = (dove: string) => new Response(null, { status: 303, headers: { Location: dove } });
  const modulo = await request.formData().catch(() => null);
  const token = String(modulo?.get("token") ?? "").trim();
  if (!token) return vai("/accesso?errore=1");

  const ip = clientAddress ?? "sconosciuto";
  if (troppiTentativi(ip)) return vai("/accesso?errore=1");

  const id = await verificaToken(token);
  if (id === null) return vai("/accesso?errore=1");

  cookies.set(NOME_COOKIE, creaSessione(id), opzioniCookie(url.protocol === "https:"));
  return vai("/admin");
};
