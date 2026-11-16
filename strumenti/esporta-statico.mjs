#!/usr/bin/env node
/**
 * ESPORTA SITO STATICO — dati → HTML.
 *
 *   npm run esporta
 *
 * Rende indipendente il SITO: produce in `esportato/` un sito fatto di soli
 * file — una pagina = una cartella con dentro `index.html` — più gli asset
 * (`/_astro`, il favicon). Nessun database, nessun server, nessuna
 * piattaforma: lo si carica su qualunque hosting statico così com'è.
 *
 * Come: fa la build di produzione, avvia il server node su una porta interna,
 * scarica ogni pagina PUBBLICATA (è la stessa resa che vede un visitatore), e
 * copia gli asset. Le immagini restano sui loro indirizzi (R2) e i font su
 * Google: sono CDN esterne, non «la piattaforma» — il sito non dipende da noi.
 *
 * Cosa NON esce: le pagine in bozza e non pubblicate (il sito è quello che il
 * mondo vede), e tutta l'area /admin.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

const RADICE = fileURLToPath(new URL("..", import.meta.url));
const USCITA = join(RADICE, "esportato");
const PORTA = 4399;

// ── env dal .env ────────────────────────────────────────────────────────────
const env = { ...process.env };
for (const r of readFileSync(join(RADICE, ".env"), "utf8").split(/\r?\n/)) {
  const m = r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
if (!env.DATABASE_URL) {
  console.error("Manca DATABASE_URL. Vedi .env.example.");
  process.exit(1);
}

// ── 1. build di produzione ───────────────────────────────────────────────────
console.log("1) Build di produzione…");
execSync("npm run build", { cwd: RADICE, stdio: "inherit" });
const ENTRY = join(RADICE, "dist", "server", "entry.mjs");
const CLIENT = join(RADICE, "dist", "client");
if (!existsSync(ENTRY)) {
  console.error("La build non ha prodotto dist/server/entry.mjs.");
  process.exit(1);
}

// ── 2. quali pagine sono pubblicate ──────────────────────────────────────────
const sql = neon(env.DATABASE_URL);
const pagine = (await sql`select percorso from pagine where pubblicata = true order by percorso`).map(
  (r) => r.percorso,
);
console.log(`2) ${pagine.length} pagine pubblicate da esportare.`);

// ── 3. avvia il server e aspetta che risponda ────────────────────────────────
console.log("3) Avvio il server interno…");
const server = spawn(process.execPath, [ENTRY], {
  cwd: RADICE,
  env: { ...env, HOST: "127.0.0.1", PORT: String(PORTA) },
  stdio: ["ignore", "ignore", "inherit"],
});
const BASE = `http://127.0.0.1:${PORTA}`;

async function aspettaSu() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/`, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

let esitoCodice = 0;
try {
  if (!(await aspettaSu())) throw new Error("Il server non ha risposto in tempo.");

  // ── 4. scarica ogni pagina ─────────────────────────────────────────────────
  if (existsSync(USCITA)) rmSync(USCITA, { recursive: true, force: true });
  mkdirSync(USCITA, { recursive: true });

  console.log("4) Scarico le pagine…");
  for (const percorso of pagine) {
    const risposta = await fetch(`${BASE}${percorso}`);
    if (!risposta.ok) {
      console.warn(`   ! ${percorso} → ${risposta.status}, salto`);
      continue;
    }
    const html = await risposta.text();
    // "/" → index.html; "/servizi/consulenza" → servizi/consulenza/index.html
    const cartella = percorso === "/" ? USCITA : join(USCITA, percorso);
    mkdirSync(cartella, { recursive: true });
    writeFileSync(join(cartella, "index.html"), html, "utf8");
    console.log(`   · ${percorso}`);
  }

  // La pagina «non trovato», utile a molti hosting statici come 404.html.
  try {
    const r404 = await fetch(`${BASE}/una-pagina-che-non-esiste-mai`);
    const html404 = await r404.text();
    if (html404) writeFileSync(join(USCITA, "404.html"), html404, "utf8");
  } catch {}

  // ── 5. copia gli asset (/_astro, favicon, robots…) ──────────────────────────
  console.log("5) Copio gli asset…");
  if (existsSync(CLIENT)) cpSync(CLIENT, USCITA, { recursive: true });
  /* I file dell'editor (public/admin/editor.js e .css) finiscono in
     dist/client: sono lo strumento, non il sito, e nell'esportato non ci
     devono stare — là non esiste nessuna pagina /admin che li usi. */
  rmSync(join(USCITA, "admin"), { recursive: true, force: true });

  console.log(`\n✓ Fatto. Sito statico in:\n    ${USCITA}\n`);
  console.log("Caricalo su qualunque hosting statico (Netlify, GitHub Pages, un");
  console.log("bucket…). Le immagini restano su R2 e i font su Google: non serve");
  console.log("il database né questo server.");
} catch (e) {
  console.error("\n✗ Esportazione non riuscita:", e.message);
  esitoCodice = 1;
} finally {
  server.kill();
}
process.exit(esitoCodice);
