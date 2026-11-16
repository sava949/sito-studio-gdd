#!/usr/bin/env node
/**
 * Il sito dello Studio Legale G.D.D., scritto come DATI dell'editor.
 *
 *   node strumenti/semina-avvocato.mjs            scrive pagine, impostazioni e foto
 *   node strumenti/semina-avvocato.mjs --misura   in più misura le sezioni nel
 *                                                 browser e le reimpagina
 *
 * I testi e i dati vengono dal questionario compilato dallo studio (settembre
 * 2026) e dai curricula: stanno tutti qui sotto. Le fotografie vengono dalla
 * cartella consegnata dallo studio (vedi FOTO): si caricano su R2 una volta
 * sola, con una chiave fissa, e ai giri successivi si riusano.
 *
 * L'IMPAGINAZIONE. Sul foglio ogni sezione ha una posizione fissa (x, y in
 * percentuale), mentre l'altezza di un testo dipende da quanto è lungo. Le
 * pagine quindi si descrivono come RIGHE che si succedono, e le y si
 * calcolano dalle altezze. Le altezze vengono da db/misure-avvocato.json,
 * che `--misura` produce aprendo le pagine in Chrome e misurando ogni
 * sezione; senza quel file si usa una stima.
 *
 * I testi e le foto delle pagine disegnate (dati.contenuto) e i «Dati dello
 * studio» NON si toccano: sono dello studio, che li cambia dall'editor.
 *
 * ⚠ Rilanciarlo SOVRASCRIVE le pagine che crea (e cancella quelle della demo
 * che il sito non ha più): va fatto prima che lo studio lavori dall'editor.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { studio, persone, aree } from "../src/dati/studio.mjs";

const RADICE = fileURLToPath(new URL("..", import.meta.url));
const FILE_MISURE = join(RADICE, "db", "misure-avvocato.json");
const CARTELLA_FOTO = join(RADICE, "docs", "questionario", "wetransfer_img_9838-jpeg_2026-09-23_1457");

const env = { ...process.env };
try {
  for (const r of readFileSync(join(RADICE, ".env"), "utf8").split(/\r?\n/)) {
    const m = r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}
if (!env.DATABASE_URL) {
  console.error("Manca DATABASE_URL. Vedi .env.example.");
  process.exit(1);
}
const sql = neon(env.DATABASE_URL);

// ─────────────────────────────────────────────── i dati dello studio
// studio, persone e aree stanno in src/dati/studio.mjs (li leggono anche le
// pagine disegnate a mano).
const indirizzoBreve = `${studio.via}, ${studio.cap} ${studio.citta}`;
const link = (href, t) => `<a href="${href}">${t}</a>`;
const tel = link(`tel:${studio.telefonoLink}`, studio.telefono);
const cell = link(`tel:${studio.cellulareLink}`, studio.cellulare);
const pec = link(`mailto:${studio.pec}`, studio.pec);
const pec2 = link(`mailto:${studio.pec2}`, studio.pec2);
const MAPPA_ESTERNA = "https://www.google.com/maps/search/?api=1&query=Via+della+Balduina+107%2C+00136+Roma";

// ─────────────────────────────────────────────── le fotografie
// Ritagliate su proporzioni fisse, così l'altezza sul foglio si conosce
// prima di misurare. I ritratti vanno confermati dallo studio (chi è chi).
const FOTO = {
  porta:    { file: "IMG_9926.jpeg", rapporto: 4 / 3, alt: "Il portone rosso dello studio, in Via della Balduina 107" },
  gruppo:   { file: "IMG_9838.jpeg", rapporto: 5 / 4, alt: "Luca Giurato, Pierpaolo Doro e Maria Chiara Del Ninno nello studio" },
  salotto:  { file: "IMG_9874.jpeg", rapporto: 2 / 3, alt: "La sala d'attesa dello studio" },
  ufficio:  { file: "IMG_9903.jpeg", rapporto: 2 / 3, alt: "Una delle stanze dello studio" },
  giurato:  { file: "IMG_9857.jpeg", rapporto: 5 / 4, alt: "Ritratto dell'Avv. Luca Giurato" },
  doro:     { file: "IMG_9862.jpeg", rapporto: 5 / 4, alt: "Ritratto dell'Avv. Pierpaolo Doro" },
  delNinno: { file: "IMG_9864.jpeg", rapporto: 5 / 4, alt: "Ritratto della Dott.ssa Maria Chiara Del Ninno" },
};

const HOST_R2 = `${env.R2_ACCOUNT_ID}.${env.R2_JURISDICTION ? env.R2_JURISDICTION.toLowerCase() + "." : ""}r2.cloudflarestorage.com`;
const r2 = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
  secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
  service: "s3",
  region: "auto",
});

/** La chiave su R2 e l'url pubblico di una foto: fissi, così le pagine li
    conoscono prima ancora che la foto sia caricata. */
const dove = (nome) => {
  const chiave = `immagini/gdd-${nome}-${FOTO[nome].file.replace(/\.\w+$/, "").toLowerCase()}.webp`;
  return { chiave, url: `${(env.R2_PUBLIC_URL ?? "").replace(/\/$/, "")}/${chiave}` };
};

/** Carica su R2 ogni foto che non c'è ancora. */
async function caricaFoto() {
  for (const [nome, f] of Object.entries(FOTO)) {
    const { chiave, url } = dove(nome);
    const [giàCaricata] = await sql`select 1 from media where chiave = ${chiave}`;
    if (!giàCaricata) {
      const larghezza = f.rapporto > 1 ? 1000 : 1600;
      const { data, info } = await sharp(join(CARTELLA_FOTO, f.file))
        .rotate()
        .resize({ width: larghezza, height: Math.round(larghezza * f.rapporto), fit: "cover", position: "attention" })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const r = await r2.fetch(`https://${HOST_R2}/${env.R2_BUCKET}/${chiave}`, {
        method: "PUT",
        body: new Uint8Array(data),
        headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
      });
      if (!r.ok) throw new Error(`Caricamento di ${f.file} su R2 fallito (${r.status})`);
      await sql`
        insert into media (chiave, url, larghezza, altezza, byte, alt)
        values (${chiave}, ${url}, ${info.width}, ${info.height}, ${info.size}, ${f.alt})`;
      console.log(`  caricata ${f.file} → ${chiave}`);
    }
  }
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─────────────────────────────────────────────── i colori
// Grigio antracite e il rosso del portone (campionato dalle foto: #d20012,
// scurito appena perché regga come colore dei collegamenti su bianco).
const ANTRACITE = "#2b2e33";
const ROSSO = "#c8101a";

// ─────────────────────────────────────────────── i mattoni di una pagina
const X = 4;         // margine sinistro del foglio
const LARGO = 92;    // una riga intera
const MISURA = 66;   // la colonna di lettura: ~68 caratteri
const SPAZIO = 3.2;  // fra una riga e l'altra, in centesimi della larghezza
const TITOLI = "times";

const titolo = (testo, extra = {}) => ({ tipo: "titolo", dati: { testo }, ...extra });
const testo = (html, extra = {}) => ({ tipo: "testo", dati: { html }, ...extra });
const elenco = (voci) => ({ tipo: "elenco", dati: { voci: voci.map((voce) => ({ voce })) } });
const separatore = () => ({ tipo: "separatore", dati: {} });
const pulsante = (t, url) => ({ tipo: "collegamento", dati: { testo: t, url, aspetto: "pulsante" } });
const banda = (tinta) => ({ tipo: "forma", dati: { forma: "banda", tinta, tinta2: "" } });
const citazione = (t, fonte) => ({ tipo: "citazione", dati: { testo: t, fonte } });
const html = (codice) => ({ tipo: "html", dati: { html: codice } });
const foto = (nome, didascalia = "") => ({
  tipo: "immagine",
  dati: { immagine: { url: dove(nome).url, alt: FOTO[nome].alt }, didascalia },
  _rapporto: FOTO[nome].rapporto,
});

/** Una riga: le sezioni una a fianco all'altra, con x e w. */
const riga = (...celle) => ({ celle });
const colonna = (b, x = X, w = MISURA) => riga({ ...b, x, w });
/** Più sezioni impilate nella stessa cella di una riga. */
const pila = (x, w, ...blocchi) => ({ pila: blocchi, x, w });
/** Righe su una banda colorata che le contiene tutte. */
const suBanda = (tinta, righe) => ({ banda: tinta, righe });

/** Stima dell'altezza (in centesimi della larghezza) quando manca la misura. */
function stima(b) {
  const w = b.w ?? LARGO;
  const car = (s) => String(s ?? "").replace(/<[^>]+>/g, "").length;
  const righe = (n, corpo) => Math.max(1, Math.ceil((n * corpo * 0.5) / w));
  switch (b.tipo) {
    case "titolo": return righe(car(b.dati.testo), 2.6) * 3.1;
    case "testo": {
      const blocchi = (b.dati.html.match(/<(p|h3|li)\b/g) ?? []).length;
      return righe(car(b.dati.html), 1.5) * 2.55 + blocchi * 1.8;
    }
    case "elenco": return b.dati.voci.length * 2.9;
    case "immagine": return w * (b._rapporto ?? 0.66) + (b.dati.didascalia ? 3 : 0);
    case "citazione": return righe(car(b.dati.testo), 1.9) * 3 + 3;
    case "collegamento": return 4;
    case "separatore": return 2;
    case "modulo": return 40;
    case "html": return w * 0.75;
    default: return 5;
  }
}

/**
 * Da righe a coordinate. Le altezze misurate (in centesimi della larghezza)
 * arrivano per indice di sezione; la y si scrive in percentuale dell'ALTEZZA
 * del foglio, che è come la legge il CSS (`top: y%`).
 */
function impagina(percorso, spec, misure) {
  const m = misure?.[percorso];
  const blocchi = [];
  const posti = []; // [indice, yInCqw]
  let cursore = 4;

  const hTestata = m?.testata ?? (spec.sottotitolo ? 14 : 7);
  const testata = { y: cursore, w: spec.titoloW ?? 80 };
  cursore += hTestata + SPAZIO * 1.4;

  const metti = (r) => {
    let alta = 0;
    for (const c of r.celle) {
      const pezzi = c.pila ? c.pila.map((b) => ({ ...b, x: c.x, w: c.w })) : [c];
      let scarto = 0;
      pezzi.forEach((p, k) => {
        const i = blocchi.length;
        blocchi.push(p);
        posti.push([i, cursore + scarto]);
        scarto += (m?.blocchi?.[i] ?? stima(p)) + (k < pezzi.length - 1 ? SPAZIO * 0.7 : 0);
      });
      alta = Math.max(alta, scarto);
    }
    cursore += alta + SPAZIO;
  };

  for (const voce of spec.righe) {
    if (voce.banda) {
      const i = blocchi.length;
      blocchi.push({ ...banda(voce.banda), x: -2, w: 104 });
      const inizio = cursore;
      cursore += 5;
      voce.righe.forEach(metti);
      cursore += 5 - SPAZIO;
      blocchi[i].h = +(cursore - inizio).toFixed(1);
      posti.push([i, inizio]);
      cursore += SPAZIO * 1.5;
    } else {
      metti(voce);
    }
  }

  const rap = Math.ceil(cursore + 2);
  for (const [i, y] of posti) blocchi[i].y = +((y / rap) * 100).toFixed(2);
  for (const b of blocchi) delete b._rapporto;
  return {
    titolo: spec.titolo,
    sottotitolo: spec.sottotitolo ?? "",
    modo: "foglio",
    altezzaFoglio: rap,
    titoloX: X,
    titoloY: +((testata.y / rap) * 100).toFixed(2),
    titoloW: testata.w,
    titoloAllinea: "sinistra",
    // Un titolo «vestito» (allineamento, colore) eredita il carattere della
    // cella: senza dirlo, perderebbe le grazie.
    titoloFont: TITOLI,
    seo: { descrizione: spec.descrizione ?? "" },
    blocchi,
  };
}

// ─────────────────────────────────────────────── le pagine
const schedaArea = (a) =>
  testo(
    `<h3><a href="/aree/${a.slug}">${esc(a.titolo)}</a></h3>` +
      `<p>${esc(a.sintesi)}</p>` +
      `<p><a href="/aree/${a.slug}">Vedi l'area →</a></p>`,
  );
/** Le aree a due a due. */
const grigliaAree = (xs) => {
  const righe = [];
  for (let i = 0; i < xs.length; i += 2) {
    righe.push(riga(
      { ...schedaArea(xs[i]), x: X, w: 43 },
      ...(xs[i + 1] ? [{ ...schedaArea(xs[i + 1]), x: 53, w: 43 }] : []),
    ));
  }
  return righe;
};
const bianco = (b) => ({ ...b, colore: "#ffffff", ...(b.tipo === "titolo" ? { font: TITOLI } : {}) });

const PAGINE = [];
const pagina = (percorso, genitore, ordine, nelMenu, spec) =>
  PAGINE.push({ percorso, genitore, ordine, nelMenu, spec });

pagina("/", null, 0, false, {
  titolo: studio.nome,
  sottotitolo:
    "Fondato sulla passione per la professione e sui valori umani ed etici trasmessi dal nonno del Fondatore, lo Studio offre assistenza legale coniugando tradizione ed eccellenza professionale.",
  titoloW: 76,
  descrizione: `${studio.nome}, studio legale a Roma (Balduina): diritto penale e processuale penale, penale d'impresa e tributario, diritto civile e societario, famiglia e minori.`,
  righe: [
    riga(
      { ...foto("porta"), x: X, w: 30 },
      pila(40, 56,
        testo(
          "<p>In sua memoria, la struttura è dedicata al <strong>Dott. Tommaso Novelli</strong>, Primo Presidente Emerito della Suprema Corte di Cassazione.</p>",
        ),
        citazione("A mio nonno, guida costante e inesauribile fonte di ispirazione.", "Avv. Luca Giurato"),
        testo(
          `<p>${indirizzoBreve}<br>${tel} · ${cell}</p>` +
          "<p>Si riceve su appuntamento, in sede o in videochiamata.</p>",
        ),
        { ...pulsante("Fissare un appuntamento", "/contatti"), w: 30 },
      ),
    ),
    colonna(separatore(), X, LARGO),
    colonna(titolo("Aree di attività")),
    ...grigliaAree(aree),
    suBanda(ANTRACITE, [
      riga(
        pila(6, 46,
          bianco(titolo("Lo studio")),
          bianco(testo(
            "<p>Lo studio ha sede a Roma, nel quartiere Balduina. Gli avvocati dello studio seguono direttamente ogni pratica dal primo incontro alla sua conclusione.</p>" +
            "<p>Si riceve su appuntamento in sede, in videochiamata oppure, quando serve, a domicilio o presso l'azienda del cliente.</p>",
          )),
          { ...pulsante("Chi siamo", "/studio"), w: 24 },
        ),
        { ...foto("gruppo"), x: 58, w: 36 },
      ),
    ]),
  ],
});

/* La pagina in onore del Dott. Novelli è fatta a mano
   (src/pages/tommaso-novelli.astro): questa riga le dà solo la voce di menu,
   la prima, e un testo di riserva per l'editor. */
pagina("/tommaso-novelli", null, 0, true, {
  titolo: "Tommaso Novelli",
  sottotitolo: "Primo Presidente Emerito della Suprema Corte di Cassazione",
  descrizione: `Lo ${studio.nome} è dedicato alla memoria del Dott. Tommaso Novelli, Primo Presidente Emerito della Suprema Corte di Cassazione.`,
  righe: [colonna(testo("<p>Questa pagina è disegnata a parte (src/pages/tommaso-novelli.astro): i testi si cambiano lì.</p>"))],
});

/* «Il primo colloquio» e «Domande frequenti» sono disegnate a mano
   (src/pages/): queste righe danno solo la voce di menu e un testo di
   riserva per l'editor. */
pagina("/primo-colloquio", null, 4, true, {
  titolo: "Il colloquio",
  descrizione: "Come funziona il primo colloquio con lo studio: dal primo contatto all'incarico.",
  righe: [colonna(testo("<p>Questa pagina è disegnata a parte (src/pages/primo-colloquio.astro): i testi si cambiano lì.</p>"))],
});
pagina("/domande-frequenti", null, 5, true, {
  titolo: "Domande",
  descrizione: "Le domande più frequenti rivolte allo studio.",
  righe: [colonna(testo("<p>Questa pagina è disegnata a parte (src/pages/domande-frequenti.astro): i testi si cambiano lì.</p>"))],
});

pagina("/studio", null, 1, true, {
  titolo: "Lo studio",
  sottotitolo: "Chi siamo",
  descrizione: `Chi lavora presso lo ${studio.nome} a Roma: professionisti, materie seguite e iscrizione all'albo.`,
  righe: [
    colonna(testo(
      "<p>Lo Studio Legale G.D.D. è nato nel 2025 a Roma, in Via della Balduina, dall'esperienza del suo fondatore, l'Avv. Luca Giurato, e dai valori umani ed etici che gli ha trasmesso il nonno, il Dott. Tommaso Novelli, Primo Presidente Emerito della Suprema Corte di Cassazione, alla cui memoria lo studio è dedicato.</p>" +
      "<p>Lo studio assiste persone fisiche e giuridiche soprattutto in materia penale — compreso il penale d'impresa e tributario — e in materia civile, societaria e di famiglia, sia nella fase preventiva e di consulenza sia in giudizio. Ogni pratica è seguita direttamente da un avvocato, che resta l'interlocutore del cliente fino alla sua conclusione.</p>" +
      "<p>Si riceve su appuntamento in sede, in videochiamata oppure, quando serve, a domicilio o presso l'azienda del cliente.</p>",
    )),
    riga({ ...foto("salotto"), x: X, w: 44 }, { ...foto("ufficio"), x: 52, w: 44 }),
    ...persone.flatMap((p) => [
      colonna(separatore(), X, LARGO),
      riga(
        { ...foto(p.foto), x: X, w: 24 },
        pila(32, 64,
          titolo(p.nome),
          testo(
            `<p><strong>${esc(p.ruolo)}</strong></p>` + p.bio +
            `<p>${esc(p.albo)}<br>Lingue di lavoro: ${esc(p.lingue)}` +
            (p.contatti.length ? `<br>${p.contatti.map((c) => link(c.href, c.testo)).join(" · ")}` : "") + `</p>`,
          ),
          ...(p.materie.length ? [elenco(p.materie)] : []),
        ),
      ),
    ]),
    colonna(separatore(), X, LARGO),
    colonna(titolo("Collaborazioni")),
    colonna(testo(
      "<p>Per gli atti e le questioni di competenza notarile lo studio collabora con il Notaio Dott.ssa Giuditta Lombardo, in Roma, Via Ovidio 32.</p>",
    )),
  ],
});

/* «I professionisti» è disegnata a mano (src/pages/professionisti.astro):
   questa riga le dà la voce di menu, accanto a «Lo studio», e un testo di
   riserva per l'editor. */
pagina("/professionisti", null, 2, true, {
  titolo: "I Professionisti",
  descrizione: `I professionisti dello ${studio.nome} a Roma: profilo, curriculum, materie seguite e iscrizione all'albo.`,
  righe: [colonna(testo("<p>Questa pagina è disegnata a parte (src/pages/professionisti.astro): i testi si cambiano lì.</p>"))],
});

pagina("/aree", null, 3, true, {
  titolo: "Aree di attività",
  sottotitolo: "Di cosa si occupa lo studio",
  descrizione: "Le materie di cui si occupa lo studio: diritto penale e processuale penale, diritto civile e d'impresa, famiglia e minori, responsabilità e risarcimento del danno.",
  righe: [
    colonna(testo("<p>Le materie qui elencate sono quelle seguite abitualmente. Per una questione che non rientra fra queste, lo studio lo dice e, dove può, indica un collega che se ne occupa.</p>")),
    ...grigliaAree(aree),
  ],
});

aree.forEach((a, i) => {
  pagina(`/aree/${a.slug}`, "/aree", i, false, {
    titolo: a.titolo,
    sottotitolo: a.sintesi,
    descrizione: a.sintesi,
    righe: [
      colonna(testo(a.corpo)),
      colonna(titolo("In particolare")),
      colonna(elenco(a.materie)),
      colonna(pulsante("Fissare un appuntamento", "/contatti"), X, 40),
      colonna(separatore(), X, LARGO),
      colonna(testo(`<p><a href="/aree">← Tutte le aree di attività</a></p>`)),
    ],
  });
});

/* La mappa di Google si carica SOLO se il visitatore la chiede: finché non
   clicca, nessun dato va a Google (l'informativa lo dice). Il riquadro ha
   proporzioni fisse, così la mappa prende il suo posto senza spostare niente
   sul foglio. */
const IFRAME_MAPPA =
  "<iframe src=&quot;https://www.google.com/maps?q=Via+della+Balduina+107,+00136+Roma&amp;output=embed&quot; " +
  "title=&quot;Mappa: Via della Balduina 107, Roma&quot; style=&quot;border:0;width:100%;height:100%&quot; allowfullscreen></iframe>";
const mappa = html(
  `<div style="aspect-ratio:4/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1em;` +
  `padding:1.5em;text-align:center;background:var(--carta-2);border:1px solid var(--linea);border-radius:3px">` +
  `<p style="margin:0">La mappa è fornita da Google Maps: mostrandola, il browser invia dati a Google (vedi la <a href="/privacy">privacy</a>).</p>` +
  `<button type="button" class="bottone" onclick="var d=this.parentNode;d.style.padding='0';d.innerHTML='${IFRAME_MAPPA}'">Mostra la mappa</button>` +
  `<a href="${MAPPA_ESTERNA}" target="_blank" rel="noopener">Apri in Google Maps ↗</a>` +
  `</div>`,
);

pagina("/contatti", null, 6, true, {
  titolo: "Contatti",
  sottotitolo: "Come raggiungere lo studio",
  descrizione: `Recapiti, indirizzo e orari dello ${studio.nome}. ${indirizzoBreve}. Si riceve su appuntamento.`,
  righe: [
    colonna(testo(
      "<p>Lo studio riceve su appuntamento, in sede oppure in videochiamata; quando serve, anche a domicilio o presso l'azienda del cliente. Per fissarlo è sufficiente telefonare o scrivere con il modulo qui sotto.</p>",
    )),
    riga(
      {
        ...testo(
          `<h3>Indirizzo</h3><p>${studio.via}<br>${studio.cap} ${studio.citta} (${studio.provincia})</p>` +
          `<h3>Telefono</h3><p>${tel}<br>Cellulare ${cell}</p>` +
          `<h3>Posta elettronica certificata</h3><p>${pec}<br>${pec2}</p>` +
          `<h3>Orari</h3><p>${studio.orari}. Si riceve su appuntamento.</p>`,
        ),
        x: X, w: 40,
      },
      pila(50, 46,
        mappa,
        testo(
          "<h3>Come arrivare</h3>" +
          "<p>Metropolitana A, fermata Cipro; treno regionale, stazione Balduina; autobus 990 da piazzale degli Eroi.</p>" +
          "<p>Lo studio è accessibile alle persone con disabilità, senza barriere architettoniche.</p>",
        ),
      ),
    ),
    colonna(separatore(), X, LARGO),
    riga(
      {
        tipo: "modulo",
        dati: {
          titolo: "Scrivere allo studio",
          introduzione:
            "<p>Bastano poche righe sulla questione e un recapito per essere ricontattati. Il trattamento dei dati è descritto nell'<a href=\"/privacy\">informativa privacy</a>.</p>",
        },
        x: X, w: 50,
      },
      {
        ...testo(
          "<h3>Prima di scrivere</h3>" +
          "<p>Nel messaggio conviene indicare la questione, chi sono le altre persone coinvolte e se esistono termini in scadenza — una data di notifica, una lettera ricevuta, un'udienza già fissata. Serve a capire subito se c'è urgenza.</p>" +
          "<p><strong>L'invio di un messaggio non instaura un rapporto professionale</strong> e non interrompe alcun termine. Fino al conferimento scritto dell'incarico lo studio non è tenuto ad alcuna attività di difesa.</p>" +
          "<p>Per la stessa ragione è meglio non allegare documenti né dettagli riservati al primo messaggio: si valutano in appuntamento.</p>",
        ),
        x: 58, w: 38,
      },
    ),
  ],
});

const alboRighe =
  "<p><strong>Avv. Luca Giurato</strong>, iscritto all'Ordine degli Avvocati di Roma al n. A35823 dall'11 ottobre 2007; abilitato al patrocinio davanti alle giurisdizioni superiori dal 19 marzo 2021.</p>" +
  "<p><strong>Avv. Pierpaolo Doro</strong>, iscritto all'Ordine degli Avvocati di Roma al n. A53440 dal 25 gennaio 2023.</p>" +
  "<p><strong>Dott.ssa Maria Chiara Del Ninno</strong>, praticante avvocato, iscritta al Registro dei praticanti dell'Ordine degli Avvocati di Roma al n. P80855 dal 29 dicembre 2025.</p>" +
  "<p>Titolo professionale conseguito in Italia. L'attività è soggetta alla legge professionale forense (L. 247/2012) e al Codice deontologico forense, consultabile sul sito del Consiglio Nazionale Forense.</p>";

pagina("/note-legali", null, 7, false, {
  titolo: "Note legali",
  descrizione: `Dati identificativi, iscrizione all'albo, polizze di responsabilità professionale e condizioni d'uso del sito dello ${studio.nome}.`,
  righe: [colonna(testo(
    `<h3>Titolare del sito</h3><p>${studio.denominazione}<br>${indirizzoBreve} (${studio.provincia})<br>Partita IVA ${studio.partitaIva} — Codice fiscale ${studio.codiceFiscale} — Codice destinatario ${studio.sdi}<br>Telefono ${studio.telefono} — PEC ${pec}</p>` +
    `<h3>Iscrizione all'albo</h3>${alboRighe}` +
    `<h3>Assicurazione per la responsabilità professionale</h3><p>Ai sensi dell'art. 12 della L. 247/2012, gli avvocati dello studio sono assicurati con ${studio.compagnia}:</p><p>` +
      studio.polizze.map((p) => `${p.intestatario}: polizza n. ${p.numero}`).join("<br>") + `</p>` +
    `<h3>Natura delle informazioni pubblicate</h3><p>I contenuti di questo sito hanno finalità esclusivamente informativa, in conformità all'art. 35 del Codice deontologico forense. Sono redatti in termini generali e <strong>non costituiscono parere legale</strong>: non tengono conto delle circostanze del caso concreto, che possono modificarne radicalmente le conclusioni.</p><p>Nessuna informazione contenuta nel sito costituisce sollecitazione ad agire o a non agire. Lo studio non risponde delle decisioni assunte sulla base della sola lettura di queste pagine.</p>` +
    `<h3>Rapporto professionale</h3><p>La consultazione del sito, l'invio di comunicazioni e la richiesta di un appuntamento non instaurano alcun rapporto di patrocinio. Il rapporto sorge unicamente con il conferimento scritto dell'incarico, accompagnato dalle informazioni sul compenso previste dall'art. 13 della L. 247/2012.</p>` +
    `<h3>Proprietà dei contenuti</h3><p>Testi, fotografie, struttura e grafica del sito sono di titolarità dello studio. È consentita la citazione di brani con indicazione della fonte e del collegamento alla pagina di origine; non è consentita la riproduzione integrale a fini commerciali.</p>` +
    `<h3>Collegamenti a siti esterni</h3><p>Il sito può contenere collegamenti a risorse gestite da terzi. Lo studio non ha controllo su quei contenuti e non risponde della loro esattezza né del trattamento dei dati che vi avviene.</p>` +
    `<h3>Risoluzione delle controversie</h3><p>Per le contestazioni relative al rapporto professionale è possibile rivolgersi al Consiglio dell'Ordine degli Avvocati di Roma, competente in materia disciplinare e per il tentativo di conciliazione sulle questioni di onorari.</p>` +
    `<h3>Legge applicabile</h3><p>L'uso del sito è regolato dalla legge italiana. Per le controversie si applicano i criteri di competenza previsti dalla legge, compresi quelli inderogabili a tutela del consumatore.</p>`,
  ))],
});

pagina("/privacy", null, 8, false, {
  titolo: "Privacy",
  sottotitolo: "Informativa sul trattamento dei dati personali, ai sensi degli articoli 13 e 14 del Regolamento UE 2016/679 (GDPR).",
  descrizione: `Informativa sul trattamento dei dati personali dello ${studio.nome}, ai sensi degli articoli 13 e 14 del Regolamento UE 2016/679.`,
  righe: [colonna(testo(
    `<h3>Titolare del trattamento</h3><p>${studio.denominazione}, ${indirizzoBreve} (${studio.provincia}). Per l'esercizio dei diritti: PEC ${pec}, oppure per posta all'indirizzo dello studio.</p>` +
    `<h3>Quali dati raccoglie questo sito</h3><p>Il sito <strong>non usa cookie di profilazione e non impiega strumenti di statistica o pubblicità.</strong> Non viene creato alcun profilo dei visitatori.</p><p>Come ogni sito, il server che lo ospita registra i dati tecnici delle richieste — indirizzo IP, data e ora, pagina richiesta, tipo di browser — nei log di sistema. Servono a garantire il funzionamento e la sicurezza del servizio (base giuridica: legittimo interesse, art. 6.1.f GDPR) e sono conservati per il tempo strettamente necessario a tale scopo.</p>` +
    `<h3>Il modulo di contatto</h3><p>Chi usa il modulo della pagina Contatti comunica il proprio nome, l'indirizzo email e il testo del messaggio. Questi dati sono usati solo per rispondere e per valutare l'eventuale conferimento di un incarico (base giuridica: misure precontrattuali, art. 6.1.b GDPR), e sono conservati nell'area riservata del sito, accessibile ai soli componenti dello studio.</p><p>Se la comunicazione riguarda una vicenda giudiziaria può contenere categorie particolari di dati o dati relativi a condanne e reati: il loro trattamento è consentito quando è necessario ad accertare, esercitare o difendere un diritto in sede giudiziaria (artt. 9.2.f e 10 GDPR). Per questo si raccomanda di limitare il primo messaggio a quanto serve per essere ricontattati.</p><p>Se all'incarico non si dà seguito, i messaggi sono cancellati entro dodici mesi dalla ricezione, salvo quanto serve a documentare l'assenza di conflitti di interesse. Se l'incarico è conferito, si applicano i termini di conservazione previsti per il fascicolo professionale. Lo stesso vale per i messaggi inviati per email o PEC.</p>` +
    `<h3>La mappa</h3><p>La pagina Contatti mostra una mappa di Google Maps (Google Ireland Limited). Aprendo quella pagina il browser si collega ai server di Google, che riceve l'indirizzo IP del visitatore e può impostare propri cookie, secondo la sua informativa (policies.google.com/privacy). Chi preferisce evitarlo può non aprire la pagina Contatti: tutti i recapiti dello studio sono riportati anche in fondo a ogni pagina.</p>` +
    `<h3>Caratteri tipografici serviti da terzi</h3><p>Le pagine caricano i caratteri tipografici dal servizio Google Fonts (Google Ireland Limited). Per ottenerli, il browser effettua una richiesta ai server del fornitore, al quale viene quindi comunicato l'indirizzo IP del visitatore. Il trattamento è necessario alla resa grafica delle pagine (legittimo interesse).</p>` +
    `<h3>A chi possono essere comunicati</h3><p>I dati non sono diffusi né ceduti. Possono essere comunicati esclusivamente a soggetti che operano per conto dello studio (fornitori dei servizi di hosting, di database e di posta elettronica, designati responsabili del trattamento) e, quando necessario all'incarico, ad autorità giudiziarie, controparti, consulenti tecnici e domiciliatari.</p>` +
    `<h3>Trasferimenti fuori dall'Unione europea</h3><p>Alcuni fornitori (hosting, Google) possono trattare dati anche fuori dall'Unione europea: in tal caso il trasferimento avviene sulla base delle garanzie previste dal GDPR, come le decisioni di adeguatezza della Commissione europea o le clausole contrattuali standard.</p>` +
    `<h3>I suoi diritti</h3><p>Chiunque può chiedere l'accesso ai propri dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità, e può opporsi al trattamento fondato sul legittimo interesse (artt. 15–22 GDPR). La richiesta si invia ai recapiti indicati sopra e riceve riscontro entro un mese.</p><p>È inoltre sempre possibile proporre reclamo al Garante per la protezione dei dati personali (Piazza Venezia 11, 00187 Roma — garanteprivacy.it).</p>` +
    `<h3>Aggiornamenti</h3><p>Questa informativa può essere modificata per adeguarla a variazioni normative o tecniche. La versione pubblicata su questa pagina è quella vigente.</p>`,
  ))],
});

/* Pagine che il sito dello studio non ha più: gli aggiornamenti della demo
   (lo studio non li vuole, per ora), le aree cambiate, una pagina di prova e
   la versione inglese (tolta su richiesta). */
const DA_TOGLIERE = (percorso) =>
  !PAGINE.some((p) => p.percorso === percorso) &&
  (percorso === "/aggiornamenti" || percorso.startsWith("/aggiornamenti/") ||
   percorso.startsWith("/aree/") || percorso === "/luca-giurato" || percorso === "/en");

// ─────────────────────────────────────────────── testata e piè di pagina
const piePagina =
  `<div class="colonne">` +
  `<div><h2>Studio</h2><p><strong>${studio.nome}</strong><br>${studio.via}<br>${studio.cap} ${studio.citta} (${studio.provincia})</p></div>` +
  `<div><h2>Recapiti</h2><p>${tel}<br>${cell}<br>PEC ${pec}</p></div>` +
  `<div><h2>Dati</h2><p>P. IVA ${studio.partitaIva}<br>C.F. ${studio.codiceFiscale}<br>Ordine degli Avvocati di Roma</p></div>` +
  `<div><h2>Il sito</h2><p><a href="/note-legali">Note legali</a><br><a href="/privacy">Privacy</a><br><a href="/aree">Aree di attività</a><br><a href="/primo-colloquio">Il primo colloquio</a><br><a href="/domande-frequenti">Domande frequenti</a></p></div>` +
  `</div>` +
  `<p class="clausola">Le informazioni pubblicate su questo sito hanno finalità esclusivamente informativa: non costituiscono parere legale né sostituiscono la consulenza professionale su un caso concreto. La consultazione del sito e l'invio di comunicazioni non instaurano alcun rapporto di patrocinio, che sorge unicamente con il conferimento scritto dell'incarico.</p>` +
  `<p class="clausola">© ${new Date().getFullYear()} ${studio.denominazione} — ${indirizzoBreve}. Tutti i diritti riservati.</p>`;

const SITO = {
  impostazioni: { nome: studio.nome, configurato: true },
  layout: {
    testataSottotitolo: studio.sottotitolo,
    piePagina,
    menuAllinea: "destra",
    menuPosizione: "affiancato",
    menuForma: "linee",
  },
  // Lo stesso linguaggio dell'anticamera: fondo antracite, il rosso del
  // portone sui dettagli, titoli in Times New Roman, testo in Inter.
  tema: {
    accento: ROSSO, accentoViva: "#e0262f", inchiostro: "#eeeeec", carta: ANTRACITE,
    sfondoTipo: "sfumatura", sfondoDa: "#24272b", sfondoA: ANTRACITE, sfondoAngolo: 180,
    fontTitoli: TITOLI, fontTesto: "inter",
    carta2: "#34383e", cartaScura: "#1f2226", linea: "#3d4147", lineaForte: "#52575e",
    inchiostro2: "#c9ccd0", tenue: "#a4a8ae", suScuro: "#eeeeec",
  },
};

// ─────────────────────────────────────────────── scrittura
async function scrivi(misure) {
  for (const [chiave, dati] of Object.entries(SITO)) {
    await sql`
      insert into sito (chiave, dati, bozza, updated_at)
      values (${chiave}, ${JSON.stringify(dati)}::jsonb, null, now())
      on conflict (chiave) do update set dati = excluded.dati, bozza = null, updated_at = now()`;
  }
  /* I «Dati dello studio» si scrivono solo se mancano: dopo, sono dello
     studio, che li cambia dall'editor. */
  const { polizze, compagnia, ...recapiti } = studio;
  await sql`
    insert into sito (chiave, dati, bozza, updated_at)
    values ('studio', ${JSON.stringify(recapiti)}::jsonb, null, now())
    on conflict (chiave) do nothing`;
  const esistenti = await sql`select percorso from pagine`;
  const via = esistenti.map((r) => r.percorso).filter(DA_TOGLIERE);
  for (const percorso of via) await sql`delete from pagine where percorso = ${percorso}`;
  if (via.length) console.log(`  tolte: ${via.join(", ")}`);

  const ids = new Map();
  for (const p of PAGINE) {
    const dati = impagina(p.percorso, p.spec, misure);
    const genitore = p.genitore ? ids.get(p.genitore) : null;
    const [r] = await sql`
      insert into pagine (percorso, genitore, ordine, nel_menu, dati, bozza, pubblicata)
      values (${p.percorso}, ${genitore}, ${p.ordine}, ${p.nelMenu}, ${JSON.stringify(dati)}::jsonb, null, true)
      on conflict (percorso) do update
        set genitore = excluded.genitore, ordine = excluded.ordine, nel_menu = excluded.nel_menu,
            /* Il contenuto delle pagine disegnate (testi e foto cambiati
               dall'editor) sopravvive a una nuova semina. */
            dati = case when pagine.dati ? 'contenuto'
                        then excluded.dati || jsonb_build_object('contenuto', pagine.dati->'contenuto')
                        else excluded.dati end,
            bozza = null, pubblicata = true, updated_at = now()
      returning id`;
    ids.set(p.percorso, r.id);
  }
  console.log(`  ${PAGINE.length} pagine scritte${misure ? " (con le misure)" : " (altezze stimate)"}.`);
}

/** Apre ogni pagina nel browser e misura testata e sezioni, in centesimi
    della larghezza del foglio. Serve la build (`npm run build`). */
async function misura() {
  const ENTRY = join(RADICE, "dist", "server", "entry.mjs");
  if (!existsSync(ENTRY)) throw new Error("Manca dist/: lancia prima `npm run build`.");
  const CHROME = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  if (!CHROME) throw new Error("Nessun Chrome o Edge trovato.");
  const PORTA = 4398;
  const server = spawn(process.execPath, [ENTRY], {
    cwd: RADICE,
    env: { ...env, HOST: "127.0.0.1", PORT: String(PORTA) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const BASE = `http://127.0.0.1:${PORTA}`;
  const puppeteer = (await import("puppeteer-core")).default;
  let browser;
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(BASE + "/")).status < 500) break; } catch {}
      if (i > 60) throw new Error("Il server non risponde.");
      await new Promise((r) => setTimeout(r, 300));
    }
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1280, height: 900 });
    const misure = {};
    for (const p of PAGINE) {
      await tab.goto(BASE + p.percorso, { waitUntil: "networkidle0" });
      // Le foto sono `loading="lazy"`: sotto la piega avrebbero altezza zero.
      await tab.evaluate(async () => {
        const imgs = [...document.querySelectorAll(".foglio img")];
        imgs.forEach((img) => (img.loading = "eager"));
        await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
        await document.fonts.ready;
      });
      misure[p.percorso] = await tab.evaluate(() => {
        const f = document.querySelector(".foglio");
        // «/» è l'anticamera (src/pages/index.astro): niente foglio da misurare.
        if (!f) return null;
        const W = f.getBoundingClientRect().width;
        const h = (n) => +((n.getBoundingClientRect().height / W) * 100).toFixed(2);
        const t = f.querySelector(":scope > .testata-composta");
        const celle = [...f.querySelectorAll(":scope > .cella:not(.testata-composta)")];
        return { testata: t ? h(t) : 0, blocchi: celle.map(h) };
      });
    }
    return misure;
  } finally {
    await browser?.close();
    server.kill();
  }
}

try {
  await caricaFoto();
  let misure = existsSync(FILE_MISURE) ? JSON.parse(readFileSync(FILE_MISURE, "utf8")) : null;
  if (process.argv.includes("--misura")) {
    await scrivi(null);
    misure = await misura();
    writeFileSync(FILE_MISURE, JSON.stringify(misure, null, 2) + "\n");
    console.log("  Misure salvate in db/misure-avvocato.json.");
  }
  await scrivi(misure);
  process.exit(0);
} catch (e) {
  console.error("Errore:", e.message);
  process.exit(1);
}
