import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "./db";

/**
 * Chi può entrare nell'area di gestione.
 *
 * IL MODELLO, in una riga: **il collegamento è la chiave, il cookie è la
 * sessione.**
 *
 * Niente email e password: l'utente è una persona sola che entra qui una
 * volta a settimana. Una password sarebbe una cosa in più da ricordare, da
 * recuperare quando si dimentica, e da difendere con un modulo di
 * reimpostazione, una casella di posta e un freno ai tentativi — tutta
 * infrastruttura per proteggere un sito vetrina.
 *
 * Del token si conserva solo l'impronta SHA-256. Non Argon2, e non è una
 * disattenzione: Argon2 serve contro i segreti scelti da una persona, che si
 * possono provare a indovinare. Questo lo generiamo noi con 256 bit di
 * casualità, e non c'è nessun dizionario che lo contenga.
 */

const env = (chiave: string) =>
  (import.meta.env as any)[chiave] ?? process.env[chiave] ?? "";

export const NOME_COOKIE = "admin_sessione";

/**
 * Trenta giorni: la CHIAVE non scade mai (vale finché non la si revoca in
 * `chiavi_accesso`); questa è solo la durata della SESSIONE, cioè ogni quanto
 * la chiave viene richiesta di nuovo. Un mese, così non la si ridigita di
 * continuo. Il prezzo è che un cookie rubato resta valido più a lungo: per
 * uscire subito da un computer altrui c'è «Esci», che cancella il cookie.
 */
const DURATA_MS = 30 * 24 * 60 * 60 * 1000;

const SEGRETO = env("ADMIN_SECRET");
if (!SEGRETO) {
  throw new Error(
    "ADMIN_SECRET non è impostata. Deve essere una stringa casuale, " +
      "DIVERSA fra locale e produzione: vedi .env.example.",
  );
}

export function impronta(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

// ─────────────────────────────────────────────── il freno ai tentativi

const MAX_TENTATIVI = 10;
const FINESTRA_MS = 15 * 60 * 1000;
const tentativi = new Map<string, number[]>();

/**
 * Vive in memoria e si azzera a ogni riavvio del servizio — su Render, a ogni
 * deploy. Contro un token da 256 bit è abbondantemente sufficiente: nessuno
 * lo indovina, e questo serve solo a non lasciare un endpoint che accetta
 * tentativi all'infinito. Se un giorno servisse di più, il conteggio si
 * sposta su una tabella.
 */
export function troppiTentativi(ip: string): boolean {
  const adesso = Date.now();
  const recenti = (tentativi.get(ip) ?? []).filter((t) => adesso - t < FINESTRA_MS);
  recenti.push(adesso);
  tentativi.set(ip, recenti);
  return recenti.length > MAX_TENTATIVI;
}

// ──────────────────────────────────────────────────────── i token

/**
 * Il token è valido? Torna l'id della riga, o null.
 *
 * Aggiorna anche `last_used_at`, che è l'unico modo per sapere se un
 * collegamento consegnato mesi fa è mai stato usato — e quindi se si può
 * revocare senza chiedere a nessuno.
 */
export async function verificaToken(token: string): Promise<number | null> {
  const righe = (await sql`
    select id from chiavi_accesso
    where hash = ${impronta(token)} and revocata_il is null
    limit 1
  `) as { id: number }[];

  if (righe.length === 0) return null;

  await sql`update chiavi_accesso set usata_il = now() where id = ${righe[0].id}`;
  return righe[0].id;
}

// ──────────────────────────────────────────────────────── la sessione

function firma(corpo: string): string {
  return createHmac("sha256", SEGRETO).update(corpo).digest("base64url");
}

/** Il valore del cookie: `id.scadenza.firma`. */
export function creaSessione(id: number): string {
  const corpo = `${id}.${Date.now() + DURATA_MS}`;
  return `${corpo}.${firma(corpo)}`;
}

export async function sessioneValida(valore: string | undefined): Promise<boolean> {
  if (!valore) return false;

  const pezzi = valore.split(".");
  if (pezzi.length !== 3) return false;
  const [id, scade, ricevuta] = pezzi;

  // Confronto a tempo costante: quello normale si ferma al primo carattere
  // diverso, e il tempo che ci mette dice quanti erano giusti.
  const attesa = Buffer.from(firma(`${id}.${scade}`));
  const arrivata = Buffer.from(ricevuta);
  if (attesa.length !== arrivata.length || !timingSafeEqual(attesa, arrivata)) return false;

  if (!Number.isFinite(Number(scade)) || Number(scade) < Date.now()) return false;

  /* E infine: quel token è ancora buono? È il controllo che rende la revoca
     IMMEDIATA. Senza, si toglierebbe un collegamento dal database e la
     sessione già aperta continuerebbe a funzionare fino alla sua scadenza —
     cioè proprio nel caso in cui si revoca perché qualcosa è andato storto. */
  const righe = (await sql`
    select 1 from chiavi_accesso where id = ${Number(id)} and revocata_il is null limit 1
  `) as unknown[];
  return righe.length > 0;
}

export function opzioniCookie(secure: boolean) {
  return {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: Math.floor(DURATA_MS / 1000),
  };
}
