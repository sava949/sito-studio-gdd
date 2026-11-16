#!/usr/bin/env node
/**
 * ESPELLI IN PROGETTO ASTRO — dati → codice.
 *
 *   npm run espelli
 *
 * Il secondo passo dell'espulsione: rende indipendente il CODICE. Genera in
 * `espulso/` un normale progetto Astro STATICO, che si possiede e che un
 * programmatore modifica a mano — nessun database, nessun adattatore server,
 * nessuna piattaforma.
 *
 * La forma, come da architettura: una pagina = un file `.astro` (in
 * `src/pages/<percorso>/index.astro`), i blocchi resi dal componente
 * `Blocchi.astro` (lo stesso, portato di peso), i contenuti scritti inline
 * come dati letterali. Tema, menu, testata e piè di pagina sono «cotti» dentro
 * `Base.astro`: non si leggono più da un database, sono nel codice.
 *
 * Cosa NON esce: pagine in bozza/non pubblicate, e tutto ciò che riguarda
 * l'editing (editor, API, auth, media, connessione a Neon).
 */
import { readFileSync, existsSync, rmSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const RADICE = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(RADICE, "src");
const USCITA = join(RADICE, "espulso");

// ── env ──────────────────────────────────────────────────────────────────
const env = { ...process.env };
for (const r of readFileSync(join(RADICE, ".env"), "utf8").split(/\r?\n/)) {
  const m = r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
if (!env.DATABASE_URL) { console.error("Manca DATABASE_URL."); process.exit(1); }
const sql = neon(env.DATABASE_URL);

// ── legge il sito PUBBLICATO ────────────────────────────────────────────────
const pagine = await sql`
  select id, percorso, genitore, ordine, nel_menu as "nelMenu", dati
  from pagine where pubblicata = true order by ordine asc, percorso asc`;
const chiaveSito = async (k) => (await sql`select dati from sito where chiave = ${k} limit 1`)[0]?.dati ?? {};
const tema = await chiaveSito("tema");
const layout = await chiaveSito("layout");
const impostazioni = await chiaveSito("impostazioni");
console.log(`Espello ${pagine.length} pagine pubblicate.`);

// ── il menu, ad albero (come store.menu) ────────────────────────────────────
const perGen = new Map();
for (const p of pagine.filter((x) => x.nelMenu)) {
  const k = p.genitore ?? null;
  if (!perGen.has(k)) perGen.set(k, []);
  perGen.get(k).push(p);
}
const menuDa = (gen) =>
  (perGen.get(gen) ?? []).map((p) => ({
    percorso: p.percorso,
    titolo: String(p.dati?.titolo ?? p.percorso),
    figli: menuDa(p.id),
  }));
const voci = menuDa(null);

// ── scaffold ─────────────────────────────────────────────────────────────
if (existsSync(USCITA)) rmSync(USCITA, { recursive: true, force: true });
mkdirSync(join(USCITA, "src", "pages"), { recursive: true });
mkdirSync(join(USCITA, "src", "components"), { recursive: true });
mkdirSync(join(USCITA, "src", "layouts"), { recursive: true });
mkdirSync(join(USCITA, "src", "lib"), { recursive: true });
mkdirSync(join(USCITA, "src", "styles"), { recursive: true });
mkdirSync(join(USCITA, "public"), { recursive: true });

// File portati di peso: si rendono da soli, senza database.
cpSync(join(SRC, "components", "Blocchi.astro"), join(USCITA, "src", "components", "Blocchi.astro"));
cpSync(join(SRC, "components", "Pagina.astro"), join(USCITA, "src", "components", "Pagina.astro"));
cpSync(join(SRC, "lib", "schema.ts"), join(USCITA, "src", "lib", "schema.ts"));
cpSync(join(SRC, "styles", "global.css"), join(USCITA, "src", "styles", "global.css"));
cpSync(join(RADICE, "tsconfig.json"), join(USCITA, "tsconfig.json"));
if (existsSync(join(RADICE, "public", "favicon.svg")))
  cpSync(join(RADICE, "public", "favicon.svg"), join(USCITA, "public", "favicon.svg"));

// ── Menu.astro: come l'originale, ma col tipo inline (niente lib/store) ──────
writeFileSync(
  join(USCITA, "src", "components", "Menu.astro"),
  `---
export interface VoceMenu { percorso: string; titolo: string; figli: VoceMenu[]; }
interface Props { voci: VoceMenu[]; attivo?: string; livello?: number; }
const { voci, attivo, livello = 0 } = Astro.props;
---

{voci.length > 0 && (
  <ul class:list={["menu", livello > 0 && "menu--sotto"]}>
    {voci.map((v) => (
      <li>
        <a href={v.percorso} aria-current={attivo === v.percorso ? "page" : undefined}>
          {v.titolo}
        </a>
        {v.figli.length > 0 && <Astro.self voci={v.figli} attivo={attivo} livello={livello + 1} />}
      </li>
    ))}
  </ul>
)}
`,
);

// ── Base.astro: come l'originale, ma coi dati COTTI (niente lib/store) ───────
const J = (v) => JSON.stringify(v ?? null);
writeFileSync(
  join(USCITA, "src", "layouts", "Base.astro"),
  `---
/*
 * Il guscio del sito espulso. Come nel motore, ma senza database: il nome, il
 * menu, il tema e il piè di pagina sono scritti qui come dati letterali —
 * cotti al momento dell'espulsione. Da qui in poi si modificano a mano.
 */
import Menu from "../components/Menu.astro";
import { CARATTERI } from "../lib/schema";
import "../styles/global.css";

interface Props { titolo: string; descrizione?: string; immagineSocial?: string; }
const { titolo, descrizione = "", immagineSocial = "" } = Astro.props;

const nomeSito = ${J(String(impostazioni.nome ?? "Il mio sito"))};
const voci = ${J(voci)};
const sottotitolo = ${J(String(layout.testataSottotitolo ?? "").trim())};
const piePagina = ${J(String(layout.piePagina ?? "").trim())};
const tema: Record<string, any> = ${J(tema)};

const exa = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
const pila = (chiave: unknown) => CARATTERI.find((c) => c.valore === chiave && c.pila)?.pila ?? null;
const variabiliTema = Object.entries({
  "--accento": exa(tema.accento),
  "--accento-viva": exa(tema.accento),
  "--inchiostro": exa(tema.inchiostro),
  "--carta": exa(tema.carta),
  "--serif": pila(tema.fontTitoli),
  "--sans": pila(tema.fontTesto),
}).filter(([, v]) => v).map(([k, v]) => \`\${k}:\${v}\`).join(";");

const titoloCompleto = titolo === nomeSito ? titolo : \`\${titolo} — \${nomeSito}\`;
const canonico = Astro.site ? new URL(Astro.url.pathname, Astro.site).href : undefined;
const social = immagineSocial && Astro.site ? new URL(immagineSocial, Astro.site).href : immagineSocial;
const annoOra = new Date().getFullYear();
---

<!doctype html>
<html lang="it" style={variabiliTema || undefined}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titoloCompleto}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    {descrizione && <meta name="description" content={descrizione} />}
    {canonico && <link rel="canonical" href={canonico} />}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={nomeSito} />
    <meta property="og:title" content={titoloCompleto} />
    {descrizione && <meta property="og:description" content={descrizione} />}
    {canonico && <meta property="og:url" content={canonico} />}
    {social && <meta property="og:image" content={social} />}
    {social && <meta name="twitter:card" content="summary_large_image" />}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Playfair+Display:wght@400;600;700&family=Lora:wght@400;600&family=Merriweather:wght@400;700&family=EB+Garamond:wght@400;600&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;600&family=Poppins:wght@400;600&family=Roboto:wght@400;500&family=Work+Sans:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Dancing+Script:wght@600&display=swap"
    />
  </head>
  <body>
    <a class="salta" href="#contenuto">Salta al contenuto</a>
    <header class="testata">
      <div class="contenitore testata__riga">
        <div class="testata__marchio">
          <a class="testata__nome" href="/">{nomeSito}</a>
          {sottotitolo && <span class="testata__sottotitolo">{sottotitolo}</span>}
        </div>
        <nav class="navigazione" aria-label="Menu del sito">
          <Menu voci={voci} attivo={Astro.url.pathname} />
        </nav>
      </div>
    </header>
    <main id="contenuto">
      <slot />
    </main>
    <footer class="piede">
      <div class="contenitore">
        {piePagina ? (
          <div class="prosa" set:html={piePagina} />
        ) : (
          <p>© {annoOra} {nomeSito}</p>
        )}
      </div>
    </footer>
  </body>
</html>
`,
);

// ── una pagina = un file .astro ──────────────────────────────────────────
const segmenti = (p) => p.split("/").filter(Boolean).length;
for (const p of pagine) {
  const cartella = p.percorso === "/" ? join(USCITA, "src", "pages") : join(USCITA, "src", "pages", p.percorso);
  mkdirSync(cartella, { recursive: true });
  const rel = "../".repeat(segmenti(p.percorso) + 1);
  writeFileSync(
    join(cartella, "index.astro"),
    `---
// ${p.percorso} — pagina generata dall'espulsione. I contenuti sono qui, inline.
import Pagina from "${rel}components/Pagina.astro";
const dati = ${JSON.stringify(p.dati)};
---
<Pagina dati={dati} />
`,
  );
  console.log(`  · ${p.percorso}`);
}

// ── config e package del progetto espulso ────────────────────────────────
const sito = env.SITE_URL && !env.SITE_URL.includes("localhost") ? env.SITE_URL : "";
writeFileSync(
  join(USCITA, "astro.config.mjs"),
  `import { defineConfig } from "astro/config";

// Sito STATICO: nessun adattatore, nessun server. \`astro build\` produce file
// pronti da caricare su qualunque hosting.
export default defineConfig({
${sito ? `  site: ${JSON.stringify(sito)},\n` : ""}  trailingSlash: "ignore",
  build: { format: "directory" },
});
`,
);
writeFileSync(
  join(USCITA, "package.json"),
  JSON.stringify(
    {
      name: "sito-espulso",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: { dev: "astro dev", build: "astro build", preview: "astro preview" },
      dependencies: { astro: "^5.0.0" },
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(join(USCITA, ".gitignore"), "node_modules/\ndist/\n.astro/\n");
writeFileSync(
  join(USCITA, "LEGGIMI.md"),
  `# Sito espulso\n\nUn normale progetto Astro statico, generato dall'editor di siti.\nUna pagina = un file in \`src/pages\`; i blocchi li rende \`src/components/Blocchi.astro\`.\nNon serve nessun database.\n\n    npm install\n    npm run build     # produce dist/, da caricare su qualunque hosting\n    npm run dev       # per lavorarci in locale\n`,
);

console.log(`\n✓ Progetto Astro in:\n    ${USCITA}\n`);
console.log("Da lì:  npm install  &&  npm run build");
process.exit(0);
