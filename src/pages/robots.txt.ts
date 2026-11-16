/**
 * robots.txt: tutto il sito è indicizzabile tranne l'area di gestione. La
 * sitemap si indica con l'indirizzo di SITE_URL, così segue il dominio da sé.
 */
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const sitemap = new URL("/sitemap.xml", site ?? url.origin).href;
  const testo = [
    "User-agent: *",
    "Allow: /",
    "",
    "# L'area di gestione non deve finire negli indici. È già protetta dal",
    "# middleware, ma un indirizzo indicizzato è comunque un invito.",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /accesso",
    "",
    `Sitemap: ${sitemap}`,
    "",
  ].join("\n");
  return new Response(testo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
