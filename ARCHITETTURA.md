# Editor di siti — architettura e roadmap

Un **editor di siti** scaricabile. Lo si installa su un progetto Astro vuoto,
si apre `/admin`, e si costruisce un sito intero dal foglio bianco: pagine,
sottopagine, menu, testi, immagini, tema — tutto dal vivo, con una tavolozza
semplice. Poi, passo passo, servizi (moduli, backend).

Nasce dal motore già collaudato del "Sito Avvocato" (`D:\Sito Avvocato`), che
teniamo come riferimento da cui portare il codice finché il motore generico
non cammina da solo, e poi si archivia.

## Il principio, in una riga

**Il motore è codice. I tuoi siti sono dati. L'espulsione ritrasforma i dati
in codice.**

- **Motore = codice fisso**: il compositore, i blocchi, il renderer, l'editor.
  È quello che scarichi una volta col modello e non cambia mentre costruisci.
- **Sito = dati**: ogni pagina è una **riga** nel database; i suoi blocchi
  (titolo, testo, immagine…) sono dati dentro quella riga; il menu,
  l'annidamento, il tema sono altre righe. Nessun file `.astro` per pagina —
  è questo che permette di creare pagine all'infinito senza toccare il codice
  e di vedere le modifiche dal vivo, senza ricompilare.
- **Espulsione (eject) = dati → codice**, quando ci si vuole sganciare:
  1. **Esporta sito statico** — HTML/CSS/JS pronti per qualunque hosting,
     senza database e senza la piattaforma. Rende indipendente il *sito*.
  2. **Espelli in progetto Astro** — genera i veri file `.astro` (una pagina
     = un file, i blocchi = componenti) + i contenuti: un normale progetto
     Astro che possiedi e che un programmatore può modificare a mano. Rende
     indipendente il *codice*.

  L'esportabilità è progettata dall'inizio, non aggiunta dopo: i blocchi e il
  renderer restano semplici da tradurre in file statici o in componenti.

## Il modello dati (dove vive tutto)

Postgres su Neon, immagini su Cloudflare R2, come nel motore collaudato.
Quattro tabelle portano l'intero sito (vedi `db/schema.sql`):

- **`pagine`** — una riga per pagina. `percorso` (`/`, `/servizi`,
  `/servizi/consulenza`) per il routing; `genitore` + `ordine` per l'**albero**
  (sottopagine e ordine nel menu); `nel_menu`; `dati` (JSONB: titolo, i
  blocchi della pagina, i campi SEO, il modo di composizione); `bozza` per il
  lavoro non pubblicato; `pubblicata`.
- **`sito`** — le cose valide per tutto il sito, una riga per chiave:
  `tema` (colori, font, stile pulsanti), `layout` (testata, piè di pagina,
  logo), `impostazioni` (nome del sito, lingua, dominio…). Anche queste con
  `bozza`.
- **`media`** — la libreria delle immagini caricate su R2.
- **`versioni`** — lo storico: una riga per ogni salvataggio, col contenuto
  precedente, per «riporta a com'era».
- **`chiavi_accesso`** — i token di accesso all'editor (solo l'hash).

Una pagina, dentro `dati`, è press'a poco:

```json
{
  "titolo": "Servizi",
  "modo": "foglio",
  "blocchi": [
    { "tipo": "titolo", "dati": { "testo": "Cosa facciamo" }, "x": 8, "y": 6, "w": 84 },
    { "tipo": "testo",  "dati": { "html": "<p>…</p>" }, "x": 8, "y": 20, "w": 60 },
    { "tipo": "immagine", "dati": { "url": "…", "alt": "…" }, "x": 70, "y": 20, "w": 22 }
  ],
  "seo": { "descrizione": "…", "immagineSocial": "…" }
}
```

## Come si costruisce (l'esperienza)

- **Dashboard**: una tavolozza sempre a portata (spostabile, agganciabile),
  come quella di adesso ma generalizzata. Da lì si governa tutto.
- **Mappa del sito**: l'elenco ad **albero** delle pagine. Trascini per
  riordinare e per **annidare** (una pagina sotto un'altra → sottopagina).
  Il menu del sito si costruisce da qui.
- **Comporre una pagina**: il **foglio libero** che già esiste — metti
  titolo, testi, immagini dove vuoi, ridimensiona, aggancia alla griglia,
  scrivi sul posto con la barretta ricca (grassetto, elenchi, link, foto).
- **Preset di sezione**: "intestazione", "contatti", "galleria" — blocchi
  pronti da montare in fretta.
- **Tema globale**: colori, font, stile dei pulsanti, decisi una volta.
- **Testata e piè di pagina**: regioni editabili condivise da tutte le pagine.
- **Anteprima responsive**: desktop / tablet / telefono.
- **SEO** per pagina; sitemap generata.
- **Pubblica**: per pagina o tutto il sito. Finché non pubblichi, i visitatori
  non vedono.

## Le rotte

Nessun file per pagina: una **rotta acchiappatutto** `src/pages/[...percorso].astro`
cerca la pagina per il suo percorso e la disegna con il renderer generico
(erede di `PaginaComposta.astro`). `/admin` e `/api/admin/*` restano le uniche
rotte "server" per l'editor. Stack Astro SSR + adattatore Node standalone, su
Render come Web Service — la configurazione (checkOrigin, host, prerender) è
quella già capita a caro prezzo nel motore d'origine.

## Roadmap a traguardi

- **M1 — la fetta verticale.** Sito vuoto → aggiungo una pagina → titolo,
  testo, immagine → una seconda pagina → menu + una sottopagina annidata →
  pubblico → è online. Prova che l'intero meccanismo regge.
- **M2 — tema e layout.** Colori/font globali, testata e piè di pagina
  editabili, anteprima responsive.
- **M3 — comodità.** Preset di sezione, SEO, storico con pulsante, dashboard
  rifinita, uso da telefono.
- **M4 — espulsione.** Esporta sito statico; poi espelli in progetto Astro.
- **M5 — servizi.** Modulo di contatto (form → email/DB) come primo servizio;
  poi il gancio per un backend (anche Python) per i servizi che lo richiedono.
- **M6 — impacchettamento.** Repo-modello da clonare: imposti database,
  immagini e chiave, lo metti su Render, apri `/admin`, costruisci.

## Cosa portiamo dal motore d'origine (già fatto, da generalizzare)

Compositore a foglio libero; catalogo blocchi; barretta di scrittura ricca;
pagine con bozza/pubblica/storico; caricamento immagini su R2; colori e font;
accesso con chiave; il principio "l'editor legge lo schema dal server".

## Decisioni bloccate (8/9/2026)

Greenfield (sito nuovo da zero) come primo percorso; repo nuovo e pulito;
motore = codice, siti = dati; **espulsione** funzione di primo livello;
l'avvocato resta riferimento e poi si archivia. L'adattamento di siti già
esistenti ("il modellino che gira una volta") è una fase successiva, dopo che
il greenfield cammina.
