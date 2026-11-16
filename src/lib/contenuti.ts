/**
 * I CONTENUTI delle pagine disegnate a mano (home, Lo studio, Aree, Contatti,
 * Tommaso Novelli, Il primo colloquio, Domande frequenti).
 *
 * Queste pagine hanno un impaginato fisso nel codice, ma i testi e le foto
 * vivono nel database, nella riga della pagina, sotto `dati.contenuto`: così
 * si modificano dall'editor con la stessa bozza, «Pubblica» e cronologia di
 * ogni altra pagina. Quello che manca nel database prende il valore di
 * partenza (src/dati/contenuti.mjs): una pagina mai toccata esce identica al
 * progetto.
 *
 * In composizione (`?componi=1` da una sessione valida) le pagine segnano con
 * attributi `data-*` ogni pezzo modificabile, e allegano il contenuto intero
 * in JSON: editor.js lo legge e scrive nei percorsi indicati.
 *   data-testo="a.b"   testo semplice (doppio clic)
 *   data-ricco="a.b"   testo con grassetto, corsivo, elenchi, collegamenti
 *   data-foto="a.b"    una fotografia (clic per sostituirla)
 *   data-lista="a.b"   un elenco: i figli `data-voce="i"` si aggiungono,
 *                      spostano e tolgono
 */
import { leggiPerComporre, leggiPubblicata, leggiSito, tuttePagine } from "./store";
import { studio as STUDIO } from "../dati/studio.mjs";
import { inglese, studioInglese } from "./lingua";

type Qualunque = any;

/** Fonde `sopra` su `base`: gli oggetti si fondono voce per voce, gli elenchi
    e i valori semplici di `sopra` sostituiscono quelli di `base`. */
export function unisci(base: Qualunque, sopra: Qualunque): Qualunque {
  if (sopra === undefined || sopra === null) return base;
  if (Array.isArray(base) || Array.isArray(sopra)) return sopra;
  if (typeof base === "object" && base && typeof sopra === "object") {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(sopra)) out[k] = unisci((base as any)[k], v);
    return out;
  }
  return sopra;
}

/** Il contenuto di una pagina: pubblicato per chi visita, bozza per chi
    compone, fuso sui valori di partenza. */
export async function contenutoDi(Astro: Qualunque, percorso: string, predefinito: Qualunque) {
  const componi = Boolean(Astro.locals?.componi);
  const pagina = componi ? await leggiPerComporre(percorso) : await leggiPubblicata(percorso);
  /* In inglese le modifiche italiane dell'editor non valgono: i testi sono
     quelli di src/dati/en/, più un eventuale `contenutoEn` nel database. */
  const campo = inglese(Astro) ? "contenutoEn" : "contenuto";
  const c = unisci(predefinito, (pagina?.dati as Qualunque)?.[campo]);
  return { c, componi, pagina };
}

/** I dati dello studio (recapiti, indirizzo, orari…): chiave di sito
    «studio», modificabile dall'editor in «Dati dello studio». */
export async function studioDi(Astro: Qualunque) {
  const componi = Boolean(Astro.locals?.componi);
  const base = unisci(STUDIO, await leggiSito("studio", componi));
  const s = inglese(Astro) ? unisci(base, studioInglese) : base;
  /* I collegamenti telefonici si ricavano dai numeri: si scrive il numero
     come lo si vuole vedere, il resto lo fa il sito. */
  const tel = (n: string) => "tel:" + String(n ?? "").replace(/[^\d+]/g, "");
  return { ...s, telefonoLink: tel(s.telefono), cellulareLink: tel(s.cellulare) };
}

/** Gli attributi che segnano un pezzo modificabile, solo in composizione. */
export function marcatori(componi: boolean) {
  const segno = (tipo: string) => (percorso: string) => (componi ? { [`data-${tipo}`]: percorso } : {});
  return {
    t: segno("testo"),
    r: segno("ricco"),
    f: segno("foto"),
    l: segno("lista"),
    v: (i: number) => (componi ? { "data-voce": String(i) } : {}),
  };
}

/** Il contenuto in JSON dentro la pagina, per l'editor. `<` diventa <:
    un testo con «</script>» non può chiudere il tag. */
export const perEditor = (c: Qualunque) => JSON.stringify(c).replace(/</g, "\\u003c");

/** L'ancora di una persona in «Lo studio» (/studio#luca-giurato). */
export const ancoraPersona = (nome: string) =>
  String(nome ?? "")
    .replace(/^(Avv\.|Dott\.ssa|Dott\.|Prof\.)\s+/i, "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

/** Le aree di attività: le sottopagine pubblicate di «/aree», nell'ordine
    dell'editor, ciascuna col suo contenuto (fuso sui valori di partenza). Chi
    compone vede anche le bozze. Le usano la home, l'indice e ogni area. */
export async function elencoAree(Astro: Qualunque, predefinitaDi: (slug: string, titolo: string) => Qualunque) {
  const componi = Boolean(Astro.locals?.componi);
  const tutte = await tuttePagine(componi);
  const padre = tutte.find((p) => p.percorso === "/aree");
  return tutte
    .filter((p) => padre && p.genitore === padre.id && (p.pubblicata || componi))
    .sort((a, b) => a.ordine - b.ordine || a.percorso.localeCompare(b.percorso))
    .map((p) => {
      const slug = p.percorso.split("/").pop()!;
      const d = p.dati as Qualunque;
      return { slug, href: p.percorso, ...unisci(predefinitaDi(slug, String(d?.titolo ?? "")), inglese(Astro) ? d?.contenutoEn : d?.contenuto) };
    });
}
