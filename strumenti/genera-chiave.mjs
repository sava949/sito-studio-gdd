#!/usr/bin/env node
/**
 * Genera una chiave di accesso all'editor e la registra nel database.
 *
 *   node strumenti/genera-chiave.mjs "Etichetta (es. Marco)"
 *
 * Stampa il collegamento da aprire una volta (`/admin?t=…`): apre l'editor e
 * lo scambia con un cookie di sessione. La chiave in chiaro compare SOLO qui:
 * nel database resta solo l'impronta SHA-256. Se si perde, se ne genera
 * un'altra e si revoca la vecchia.
 */
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const env = { ...process.env };
try {
  for (const r of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

const etichetta = process.argv[2]?.trim();
if (!etichetta) {
  console.error('Uso: node strumenti/genera-chiave.mjs "Etichetta" [chiave-fissa]');
  console.error("  Senza il secondo argomento se ne genera una casuale (consigliato).");
  console.error('  Con il secondo argomento usi una chiave TUA, fissa e memorabile.');
  process.exit(1);
}
if (!env.DATABASE_URL) {
  console.error("Manca DATABASE_URL. Vedi .env.example.");
  process.exit(1);
}

/* Il secondo argomento, se c'è, è una chiave SCELTA da te (fissa e memorabile),
   quella che digiterai in /accesso. Senza, se ne genera una casuale da 256 bit.
   Una chiave scelta è comoda ma più debole: falla lunga — una frase, non una
   parola — perché nel database resta solo l'impronta SHA-256. */
const scelta = process.argv[3]?.trim();
if (scelta && scelta.length < 8) {
  console.error("La chiave scelta è troppo corta: usa almeno 8 caratteri (meglio una frase).");
  process.exit(1);
}
const chiave = scelta || randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(chiave).digest("hex");

const sql = neon(env.DATABASE_URL);
await sql`insert into chiavi_accesso (hash, etichetta) values (${hash}, ${etichetta})`;

const base = env.SITE_URL || "http://localhost:4321";
console.log("\nChiave creata per:", etichetta);
console.log("\nEntra dalla pagina di accesso e incolla/digita la chiave:");
console.log(`  ${base}/accesso`);
console.log(`  chiave: ${chiave}\n`);
console.log("In alternativa, il collegamento diretto (aprilo una volta):");
console.log(`  ${base}/admin?t=${chiave}\n`);
console.log("Per revocarla in seguito:");
console.log(`  update chiavi_accesso set revocata_il = now() where hash = '${hash}';\n`);
process.exit(0);
