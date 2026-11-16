/**
 * La SITEMAP per i motori di ricerca: ogni pagina pubblicata, in italiano e in
 * inglese (/en/…), con i collegamenti fra le due lingue (hreflang). Si
 * costruisce dal database a ogni richiesta, quindi una pagina nuova ci entra
 * appena la si pubblica. L'indirizzo base è SITE_URL (astro.config.mjs).
 */
import type { APIRoute } from "astro";
import { tuttePagine } from "../lib/store";
import { inInglese } from "../lib/lingua";

export const prerender = false;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? new URL(url.origin);
  const assoluto = (p: string) => esc(new URL(p, base).href);
  const pagine = (await tuttePagine()).filter((p) => p.pubblicata && p.percorso !== "/en" && !p.percorso.startsWith("/en/"));

  const voci = pagine.flatMap((p) => {
    const it = assoluto(p.percorso);
    const en = assoluto(inInglese(p.percorso));
    const lingue =
      `    <xhtml:link rel="alternate" hreflang="it" href="${it}"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${it}"/>\n`;
    return [`  <url>\n    <loc>${it}</loc>\n${lingue}  </url>`, `  <url>\n    <loc>${en}</loc>\n${lingue}  </url>`];
  });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${voci.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
