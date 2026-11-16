/**
 * La LINGUA del sito: italiano (/…) e inglese (/en/…).
 *
 * Le pagine sono le stesse: il middleware riconosce il prefisso /en, lo
 * toglie, segna `locals.lingua = "en"` e serve la pagina italiana, che qui
 * prende i testi inglesi. I testi inglesi stanno nel codice (src/dati/en/):
 * l'editor modifica l'italiano; l'inglese si aggiorna a mano.
 */
import * as IT from "../dati/contenuti.mjs";
import * as EN from "../dati/en/contenuti.mjs";
import { studio as STUDIO_EN } from "../dati/en/studio.mjs";
import { pagine as PAGINE_EN, piePagina as PIE_EN, sottotitolo as SOTTOTITOLO_EN } from "../dati/en/pagine.mjs";

type Qualunque = any;

export const inglese = (Astro: Qualunque) => Astro.locals?.lingua === "en";

/** I testi di partenza delle pagine disegnate a mano, nella lingua giusta. */
export const testi = (Astro: Qualunque): typeof IT => (inglese(Astro) ? (EN as Qualunque) : IT);

/** Una scritta del modello: `L("Contatti", "Contacts")`. */
export const traduttore = (Astro: Qualunque) => (it: string, en: string) => (inglese(Astro) ? en : it);

/** I «Dati dello studio» che sono parole e non numeri: in inglese vincono
    sulla versione italiana del database. */
const DESCRITTIVI = ["sottotitolo", "orari", "metro", "treno", "autobus", "accesso", "invitoEtichetta", "invitoFrase", "invitoBottone"];
export const studioInglese = Object.fromEntries(
  DESCRITTIVI.filter((k) => (STUDIO_EN as Qualunque)[k] !== undefined).map((k) => [k, (STUDIO_EN as Qualunque)[k]]),
);

/** Titolo, descrizione e testi dei blocchi delle pagine, in inglese. */
export const paginaInglese = (percorso: string) => (PAGINE_EN as Qualunque)[percorso] ?? null;
export const piePaginaInglese: string = PIE_EN;
export const sottotitoloInglese: string = SOTTOTITOLO_EN;

/** Lo stesso indirizzo nell'altra lingua. `percorso` è quello italiano. */
export const inItaliano = (percorso: string) => percorso || "/";
export const inInglese = (percorso: string) => (percorso === "/" || !percorso ? "/en" : `/en${percorso}`);

/** Nell'HTML inglese i collegamenti interni prendono il prefisso /en. Restano
    come sono i file (foto, pdf…), le API, l'area di gestione e i collegamenti
    segnati hreflang="it" (il selettore di lingua). */
export function collegamentiInInglese(html: string) {
  return html.replace(/<a\b[^>]*>/g, (tag) => {
    if (/\bhreflang="it"/.test(tag)) return tag;
    return tag.replace(/\shref="\/(?!\/)([^"]*)"/, (intero, resto: string) => {
      if (/^(en(?=[/?#]|$)|api\/|admin|accesso|_astro\/|foto\/)/.test(resto)) return intero;
      if (/\.[a-z0-9]{2,4}(?=[?#]|$)/i.test(resto.split(/[?#]/)[0] ?? "")) return intero;
      if (resto === "") return ' href="/en"';
      if (/^[?#]/.test(resto)) return ` href="/en${resto}"`;
      return ` href="/en/${resto}"`;
    });
  });
}
