import type { APIRoute } from "astro";
import { ANIMAZIONI, BLOCCHI, CARATTERI, COLORI, MAX_BLOCCHI, TEMI_PREDEFINITI } from "../../../lib/schema";
import { leggiSito } from "../../../lib/store";

/* Le rotte dell'area di gestione non si prerenderizzano MAI: durante la build
   il database non è raggiungibile e nessuno ha una sessione. */
export const prerender = false;

/**
 * Lo schema che l'editor chiede all'avvio: da qui disegna la tavolozza. Il
 * catalogo dei blocchi, i colori e i caratteri viaggiano INSIEME — la
 * tavolozza li disegna, la validazione li pretende, la fonte è una sola
 * (`src/lib/schema.ts`). Il titolo del sito viene dai dati (tabella `sito`),
 * non è cablato: è la differenza fra un sito e un editor di siti.
 *
 * Non è protetto da un controllo suo: ci pensa il middleware, che copre
 * `/api/admin/*` per intero.
 */
export const GET: APIRoute = async () => {
  const impostazioni = await leggiSito("impostazioni");
  return new Response(
    JSON.stringify({
      titoloSito: String(impostazioni.nome ?? "Il mio sito"),
      blocchi: BLOCCHI,
      maxBlocchi: MAX_BLOCCHI,
      colori: COLORI,
      caratteri: CARATTERI,
      animazioni: ANIMAZIONI,
      temi: TEMI_PREDEFINITI,
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
};
