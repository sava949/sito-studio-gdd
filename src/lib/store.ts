import { sql } from "./db";

/**
 * Il data layer dell'editor di siti.
 *
 * Qui vive la differenza col motore d'origine: le pagine non sono una
 * collezione piatta, sono un ALBERO. Ogni pagina ha un `percorso` (l'indirizzo
 * pubblico), un `genitore` e un `ordine` (per le sottopagine e il menu), e i
 * suoi contenuti in `dati` — con `bozza` per il lavoro non pubblicato, come
 * nel motore d'origine.
 *
 * Tutto è dato: creare una pagina è inserire una riga, non scrivere un file.
 */

export interface Pagina {
  id: number;
  percorso: string;
  genitore: number | null;
  ordine: number;
  nel_menu: boolean;
  dati: Record<string, unknown>;
  bozza: Record<string, unknown> | null;
  pubblicata: boolean;
}

/* Una cache breve, come nel motore d'origine: le pagine leggono da Neon a
   ogni richiesta, e senza questa una home molto visitata farebbe una query a
   ogni colpo. 60 secondi è il compromesso fra «il cliente pubblica e lo vede
   subito» e «non un viaggio di rete per ogni visitatore». Ogni scrittura la
   svuota, quindi il cliente non aspetta mai davvero 60 secondi. */
const CACHE = new Map<string, { al: number; v: unknown }>();
const VITA = 60_000;
function daCache<T>(chiave: string): T | null {
  const c = CACHE.get(chiave);
  if (c && Date.now() - c.al < VITA) return c.v as T;
  return null;
}
function inCache<T>(chiave: string, v: T): T {
  CACHE.set(chiave, { al: Date.now(), v });
  return v;
}
export function scordaTutto() {
  CACHE.clear();
}

/** Normalizza un percorso: sempre con la barra davanti, mai in coda ("/" a
    parte). "servizi" → "/servizi"; "/servizi/" → "/servizi". */
export function normalizzaPercorso(p: string): string {
  let x = String(p ?? "").trim();
  if (!x.startsWith("/")) x = "/" + x;
  if (x.length > 1) x = x.replace(/\/+$/, "");
  return x || "/";
}

// ───────────────────────────────────────────────────── lettura

/** La pagina pubblicata a quel percorso, o null. È quella che vede il mondo:
    `pubblicata` è l'unico segnale che conta — una pagina appena creata, con
    `dati` ancora vuoto, non deve rispondere a chi ne indovina l'indirizzo. */
export async function leggiPubblicata(percorso: string): Promise<Pagina | null> {
  const p = normalizzaPercorso(percorso);
  const chiave = `pub:${p}`;
  const gia = daCache<Pagina | null>(chiave);
  if (gia !== null) return gia;
  const righe = (await sql`
    select id, percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata
    from pagine where percorso = ${p} and pubblicata = true limit 1
  `) as any[];
  return inCache(chiave, righe[0] ?? null);
}

/** La pagina a quel percorso per CHI COMPONE: torna la bozza se c'è, o i dati
    pubblicati, esista o meno sul sito. L'editor lavora su questa. */
export async function leggiPerComporre(percorso: string): Promise<Pagina | null> {
  const p = normalizzaPercorso(percorso);
  const righe = (await sql`
    select id, percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata
    from pagine where percorso = ${p} limit 1
  `) as any[];
  if (righe.length === 0) return null;
  const r = righe[0];
  return { ...r, dati: (r.bozza ?? r.dati) as Record<string, unknown> };
}

/** Tutte le pagine, grezze — per l'albero dell'editor e per costruire il menu. */
export async function tuttePagine(conBozza = false): Promise<Pagina[]> {
  const chiave = `tutte:${conBozza}`;
  const gia = daCache<Pagina[]>(chiave);
  if (gia) return gia;
  const righe = (await sql`
    select id, percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata
    from pagine order by ordine asc, percorso asc
  `) as any[];
  const v = righe.map((r) => ({
    ...r,
    dati: (conBozza && r.bozza ? r.bozza : r.dati) as Record<string, unknown>,
  }));
  return inCache(chiave, v);
}

export interface VoceMenu {
  percorso: string;
  titolo: string;
  figli: VoceMenu[];
}

/** Il menu, ad albero: le pagine pubblicate e «nel menu», annidate per
    genitore e ordinate. Lo usa la testata del sito. */
export async function menu(): Promise<VoceMenu[]> {
  const chiave = "menu";
  const gia = daCache<VoceMenu[]>(chiave);
  if (gia) return gia;
  const righe = (await sql`
    select id, genitore, percorso, ordine, dati->>'titolo' as titolo
    from pagine where pubblicata = true and nel_menu = true
    order by ordine asc, percorso asc
  `) as { id: number; genitore: number | null; percorso: string; ordine: number; titolo: string }[];

  const perGenitore = new Map<number | null, typeof righe>();
  for (const r of righe) {
    const k = r.genitore;
    if (!perGenitore.has(k)) perGenitore.set(k, []);
    perGenitore.get(k)!.push(r);
  }
  const costruisci = (genitore: number | null): VoceMenu[] =>
    (perGenitore.get(genitore) ?? []).map((r) => ({
      percorso: r.percorso,
      titolo: r.titolo || r.percorso,
      figli: costruisci(r.id),
    }));
  return inCache(chiave, costruisci(null));
}

/** Le cose valide per tutto il sito: 'tema', 'layout', 'impostazioni'. */
export async function leggiSito(chiave: string, conBozza = false): Promise<Record<string, unknown>> {
  const ck = `sito:${chiave}:${conBozza}`;
  const gia = daCache<Record<string, unknown>>(ck);
  if (gia) return gia;
  const righe = (await sql`select dati, bozza from sito where chiave = ${chiave} limit 1`) as any[];
  const r = righe[0];
  const v = (r ? (conBozza && r.bozza ? r.bozza : r.dati) : {}) as Record<string, unknown>;
  return inCache(ck, v);
}

/** Una chiave di sito per l'editor: la bozza se c'è, col segno «da pubblicare». */
export async function dettaglioSito(
  chiave: string,
): Promise<{ dati: Record<string, unknown>; daPubblicare: boolean }> {
  const righe = (await sql`select dati, bozza from sito where chiave = ${chiave} limit 1`) as any[];
  const r = righe[0];
  return {
    dati: (r ? (r.bozza ?? r.dati) : {}) as Record<string, unknown>,
    daPubblicare: Boolean(r?.bozza),
  };
}

// ───────────────────────────────────────────────────── scrittura

/** Crea una pagina nuova a un percorso libero. Nasce NASCOSTA (pubblicata =
    false): appena creata non è ancora niente per il mondo. Torna la pagina. */
export async function creaPagina(opts: {
  percorso: string;
  titolo: string;
  genitore?: number | null;
  nelMenu?: boolean;
}): Promise<Pagina> {
  const percorso = normalizzaPercorso(opts.percorso);
  const dati = { titolo: opts.titolo, modo: "foglio", blocchi: [] as unknown[] };
  const righe = (await sql`
    insert into pagine (percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata)
    values (
      ${percorso}, ${opts.genitore ?? null},
      ${await prossimoOrdine(opts.genitore ?? null)},
      ${opts.nelMenu ?? true},
      '{}'::jsonb, ${JSON.stringify(dati)}::jsonb, false
    )
    returning id, percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata
  `) as any[];
  scordaTutto();
  return righe[0];
}

async function prossimoOrdine(genitore: number | null): Promise<number> {
  const righe = (await sql`
    select coalesce(max(ordine), 0) + 1 as p from pagine
    where genitore is not distinct from ${genitore}
  `) as { p: number }[];
  return righe[0].p;
}

/** Un titolo → uno slug di un solo segmento: minuscolo, senza accenti, coi
    trattini al posto degli spazi. Mai underscore (li usa la rotta admin per
    codificare il percorso: vedi src/pages/api/admin/pagine/[chiave].ts). */
export function slugDaTitolo(testo: string): string {
  return (
    String(testo ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "senza-titolo"
  );
}

/**
 * Un percorso libero per una pagina nuova, dato l'eventuale genitore e il
 * titolo. Sotto il genitore, così l'albero e gli indirizzi combaciano:
 * genitore `/servizi` + «Consulenza» → `/servizi/consulenza`. Se è già preso,
 * si aggiunge un suffisso numerico — mai due pagine allo stesso indirizzo.
 */
export async function percorsoLibero(
  genitore: number | null,
  titolo: string,
): Promise<string> {
  let radice = "";
  if (genitore) {
    const g = (await sql`select percorso from pagine where id = ${genitore} limit 1`) as {
      percorso: string;
    }[];
    radice = g[0]?.percorso === "/" ? "" : g[0]?.percorso ?? "";
  }
  const base = `${radice}/${slugDaTitolo(titolo)}`;
  const presi = (await sql`
    select percorso from pagine where percorso like ${base + "%"}
  `) as { percorso: string }[];
  const insieme = new Set(presi.map((r) => r.percorso));
  if (!insieme.has(base)) return base;
  let n = 2;
  while (insieme.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export interface VocePagina {
  id: number;
  percorso: string;
  genitore: number | null;
  ordine: number;
  nelMenu: boolean;
  pubblicata: boolean;
  titolo: string;
  daPubblicare: boolean;
}

/** L'elenco completo delle pagine per l'albero dell'editor: col titolo della
    bozza (chi rinomina senza pubblicare deve ritrovare il nome nuovo) e il
    segno «ha modifiche non pubblicate». Non passa dalla cache di lettura:
    è l'editor, e deve vedere l'ultimo salvataggio, non una foto di 60 secondi fa. */
export async function elencoAlbero(): Promise<VocePagina[]> {
  return (await sql`
    select
      id, percorso, genitore, ordine,
      nel_menu as "nelMenu", pubblicata,
      coalesce(bozza->>'titolo', dati->>'titolo', percorso) as titolo,
      (bozza is not null) as "daPubblicare"
    from pagine
    order by ordine asc, percorso asc
  `) as VocePagina[];
}

/** Una pagina per l'editor: la bozza se c'è, coi suoi metadati di riga. */
export async function dettaglioPagina(percorso: string): Promise<
  | (Omit<VocePagina, "titolo" | "id"> & { dati: Record<string, unknown> })
  | null
> {
  const p = normalizzaPercorso(percorso);
  const righe = (await sql`
    select percorso, genitore, ordine, nel_menu as "nelMenu",
           pubblicata, dati, bozza
    from pagine where percorso = ${p} limit 1
  `) as any[];
  const r = righe[0];
  if (!r) return null;
  return {
    percorso: r.percorso,
    genitore: r.genitore,
    ordine: r.ordine,
    nelMenu: r.nelMenu,
    pubblicata: r.pubblicata,
    daPubblicare: r.bozza != null,
    dati: (r.bozza ?? r.dati) as Record<string, unknown>,
  };
}

/** Salva il lavoro in BOZZA. Il sito non cambia finché non si pubblica. */
export async function salvaBozza(percorso: string, dati: Record<string, unknown>) {
  const p = normalizzaPercorso(percorso);
  await sql`update pagine set bozza = ${JSON.stringify(dati)}::jsonb, updated_at = now() where percorso = ${p}`;
  scordaTutto();
}

/** Menu e annidamento (cose della riga, non del contenuto). */
export async function impostaMeta(percorso: string, meta: {
  nelMenu?: boolean; ordine?: number | null; genitore?: number | null;
}) {
  const p = normalizzaPercorso(percorso);
  if (meta.nelMenu !== undefined) await sql`update pagine set nel_menu = ${meta.nelMenu} where percorso = ${p}`;
  if (meta.ordine !== undefined && meta.ordine !== null) await sql`update pagine set ordine = ${meta.ordine} where percorso = ${p}`;
  if (meta.genitore !== undefined) await sql`update pagine set genitore = ${meta.genitore} where percorso = ${p}`;
  scordaTutto();
}

/** Pubblica: la bozza diventa quello che il sito mostra, e la versione
    precedente va nello storico. Reversibile con «riporta a com'era». */
export async function pubblica(percorso: string) {
  const p = normalizzaPercorso(percorso);
  const righe = (await sql`select dati, bozza from pagine where percorso = ${p} limit 1`) as any[];
  if (righe.length === 0) return;
  const r = righe[0];
  if (r.dati && Object.keys(r.dati).length > 0) {
    await sql`insert into versioni (tipo, riferimento, dati) values ('pagina', ${p}, ${JSON.stringify(r.dati)}::jsonb)`;
  }
  const nuovo = r.bozza ?? r.dati ?? {};
  await sql`update pagine set dati = ${JSON.stringify(nuovo)}::jsonb, bozza = null, pubblicata = true, updated_at = now() where percorso = ${p}`;
  scordaTutto();
}

/** Butta via la bozza e torna a quello che è pubblicato. */
export async function scartaBozza(percorso: string) {
  const p = normalizzaPercorso(percorso);
  await sql`update pagine set bozza = null, updated_at = now() where percorso = ${p}`;
  scordaTutto();
}

/** Una pagina e TUTTE le sue sottopagine, grezze — la fotografia da cui un
    «Annulla» può ricostruire ciò che un'eliminazione porta via. Ordinate dai
    percorsi più corti ai più lunghi: ripristinando in quest'ordine, il
    genitore c'è già quando tocca al figlio. */
export interface RigaGrezza {
  percorso: string;
  ordine: number;
  nelMenu: boolean;
  dati: Record<string, unknown>;
  bozza: Record<string, unknown> | null;
  pubblicata: boolean;
}
export async function sottoalbero(percorso: string): Promise<RigaGrezza[]> {
  const p = normalizzaPercorso(percorso);
  return (await sql`
    select percorso, ordine, nel_menu as "nelMenu", dati, bozza, pubblicata
    from pagine
    where percorso = ${p} or percorso like ${p + "/%"}
    order by length(percorso) asc, percorso asc
  `) as RigaGrezza[];
}

/** Elimina una pagina (e, per l'albero, le sue sottopagine con lei). */
export async function elimina(percorso: string) {
  const p = normalizzaPercorso(percorso);
  await sql`delete from pagine where percorso = ${p}`;
  scordaTutto();
}

/** Rimette in vita un sotto-albero eliminato (l'«Annulla» dell'eliminazione).
    Il genitore si ricava dal percorso — il pezzo prima dell'ultima barra —
    così non dipende da id vecchi che non esistono più. */
export async function ripristinaPagine(righe: RigaGrezza[]) {
  for (const r of righe) {
    const percorso = normalizzaPercorso(r.percorso);
    const percorsoGenitore = percorso.replace(/\/[^/]+$/, "");
    let genitore: number | null = null;
    if (percorsoGenitore) {
      const g = (await sql`select id from pagine where percorso = ${percorsoGenitore} limit 1`) as {
        id: number;
      }[];
      genitore = g[0]?.id ?? null;
    }
    await sql`
      insert into pagine (percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata)
      values (
        ${percorso}, ${genitore}, ${r.ordine ?? 0}, ${r.nelMenu ?? true},
        ${JSON.stringify(r.dati ?? {})}::jsonb,
        ${r.bozza ? JSON.stringify(r.bozza) : null}::jsonb,
        ${r.pubblicata ?? false}
      )
      on conflict (percorso) do nothing
    `;
  }
  scordaTutto();
}

export async function versioni(percorso: string) {
  const p = normalizzaPercorso(percorso);
  return (await sql`
    select id, dati, saved_at from versioni
    where tipo = 'pagina' and riferimento = ${p} order by saved_at desc limit 20
  `) as { id: number; dati: Record<string, unknown>; saved_at: string }[];
}

// ───────────────────────────────── le cose di tutto il sito (tema, layout…)

/** Salva in BOZZA una chiave di sito. Il sito non cambia finché non si
    pubblica: un cambio di tema si prova prima di imporlo su ogni pagina. */
export async function salvaBozzaSito(chiave: string, dati: Record<string, unknown>) {
  await sql`
    insert into sito (chiave, dati, bozza, updated_at)
    values (${chiave}, '{}'::jsonb, ${JSON.stringify(dati)}::jsonb, now())
    on conflict (chiave) do update set bozza = excluded.bozza, updated_at = now()
  `;
  scordaTutto();
}

/** Pubblica una chiave di sito: la bozza diventa quello che il sito usa. La
    versione precedente va nello storico (tipo 'sito', riferimento = chiave). */
export async function pubblicaSito(chiave: string) {
  const righe = (await sql`select dati, bozza from sito where chiave = ${chiave} limit 1`) as any[];
  if (righe.length === 0) return;
  const r = righe[0];
  if (r.dati && Object.keys(r.dati).length > 0) {
    await sql`insert into versioni (tipo, riferimento, dati) values ('sito', ${chiave}, ${JSON.stringify(r.dati)}::jsonb)`;
  }
  const nuovo = r.bozza ?? r.dati ?? {};
  await sql`update sito set dati = ${JSON.stringify(nuovo)}::jsonb, bozza = null, updated_at = now() where chiave = ${chiave}`;
  scordaTutto();
}

export async function scartaBozzaSito(chiave: string) {
  await sql`update sito set bozza = null, updated_at = now() where chiave = ${chiave}`;
  scordaTutto();
}

// ───────────────────────────────── i messaggi dei moduli di contatto

export interface Messaggio {
  id: number;
  pagina: string;
  nome: string;
  email: string;
  messaggio: string;
  letto: boolean;
  created_at: string;
}

/* Non passa dalla cache di lettura: i messaggi sono pochi, si scrivono da
   fuori (il pubblico) e si leggono da dentro (l'editor) — una foto di 60
   secondi qui sarebbe solo un modo per non vedere l'ultimo arrivato. */
export async function salvaMessaggio(m: {
  pagina: string;
  nome: string;
  email: string;
  messaggio: string;
}) {
  await sql`
    insert into messaggi (pagina, nome, email, messaggio)
    values (${m.pagina}, ${m.nome}, ${m.email}, ${m.messaggio})
  `;
}

export async function elencaMessaggi(): Promise<Messaggio[]> {
  return (await sql`
    select id, pagina, nome, email, messaggio, letto, created_at
    from messaggi order by created_at desc limit 200
  `) as Messaggio[];
}

export async function contaMessaggiNonLetti(): Promise<number> {
  const r = (await sql`select count(*)::int as n from messaggi where letto = false`) as { n: number }[];
  return r[0]?.n ?? 0;
}

export async function segnaMessaggioLetto(id: number, letto = true) {
  await sql`update messaggi set letto = ${letto} where id = ${id}`;
}

export async function eliminaMessaggio(id: number) {
  await sql`delete from messaggi where id = ${id}`;
}
