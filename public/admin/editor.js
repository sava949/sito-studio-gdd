/**
 * ─────────────────────────────────────────────────────────────────────────
 * Editor di siti — modello ad ALBERO.
 *
 * A sinistra la mappa del sito (l'albero delle pagine: crea, annida, metti nel
 * menu). Al centro un promemoria. Quando si apre una pagina, l'anteprima va a
 * schermo intero e si compone SUL POSTO, dentro l'iframe della pagina vera in
 * modalità `?componi=1`: le sezioni si prendono e si portano dove si vuole,
 * si ridimensionano, si scrive con la barretta ricca. «Pubblica» le manda
 * online.
 *
 * Il composer a foglio libero è portato dal motore d'origine (Sito Avvocato):
 * opera su `stato.dati.blocchi` e su coordinate in percentuale, quindi è
 * indipendente dal modello dati. Il resto — navigazione e albero — è nuovo,
 * costruito per le pagine ad albero (percorso, genitore, nel_menu, ordine).
 *
 * Nessuna dipendenza, nessun passaggio di build. ES module puro.
 * ─────────────────────────────────────────────────────────────────────────
 */

const API = "/api/admin";

const stato = {
  schema: null,
  percorso: null, // la pagina aperta in composizione
  dati: null, // il suo documento (bozza)
  percorsi: null, // l'elenco dei percorsi, per i collegamenti
  sporco: false,
  salvataggioInCorso: false,
  vista: "desktop", // l'anteprima: desktop / tablet / telefono
};

/* Lo stato della composizione sul posto: attiva o no, quale sezione è scelta,
   e dove il cliente ha lasciato la tavolozza. */
const componendo = { attivo: false, scelto: null, posTavolozza: null, disegnata: false };

let fotoInput = null;
let fotoDestinazione = null;
let scritturaSospesa = false;
let barraRicca = null;

/* ══════════════════════════ utilità ══════════════════════════ */

const el = (tag, attributi = {}, figli = []) => {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attributi)) {
    if (k === "class") nodo.className = v;
    else if (k === "html") nodo.innerHTML = v;
    else if (k.startsWith("on")) nodo.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) nodo.setAttribute(k, v);
  }
  for (const figlio of [].concat(figli)) {
    if (figlio == null) continue;
    nodo.append(typeof figlio === "string" ? document.createTextNode(figlio) : figlio);
  }
  return nodo;
};

async function api(percorso, opzioni = {}) {
  const risposta = await fetch(API + percorso, {
    headers: opzioni.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...opzioni,
  });
  if (risposta.status === 401) {
    avviso("La sessione è scaduta. Riapri il collegamento riservato.", "errore", 0);
    throw new Error("sessione scaduta");
  }
  /* Si legge come testo e poi si prova a interpretarlo: le risposte scritte da
     noi hanno un `errore` leggibile, ma quelle del framework e del proxy
     arrivano in testo semplice — e con `.json().catch(()=>({}))` finivano nel
     nulla, lasciando a schermo un «Errore» senza nome. */
  const grezzo = await risposta.text();
  let corpo = {};
  try {
    corpo = grezzo ? JSON.parse(grezzo) : {};
  } catch {
    corpo = {};
  }
  if (!risposta.ok) {
    const messaggio = corpo.errore ?? (grezzo.trim().slice(0, 200) || `Errore ${risposta.status}`);
    throw Object.assign(new Error(messaggio), { corpo, stato: risposta.status });
  }
  return corpo;
}

function messaggioErrore(e) {
  const errori = e?.corpo?.errori;
  if (Array.isArray(errori) && errori.length) return errori.map((x) => x.messaggio).join(" · ");
  return e?.message || "Qualcosa è andato storto.";
}

let timerAvviso;
/** Un avviso in basso. Con `azione` ({ etichetta, fai }) mostra un pulsante —
    è così che «Annulla» compare dopo un gesto che si può disfare. */
function avviso(testo, tipo = "ok", durata = 4000, azione = null) {
  const barra = document.getElementById("avviso");
  barra.replaceChildren(document.createTextNode(testo));
  if (azione) {
    barra.append(
      el("button", {
        class: "avviso__azione",
        onclick: () => {
          barra.classList.remove("visibile");
          azione.fai();
        },
      }, azione.etichetta),
    );
  }
  barra.className = `avviso avviso--${tipo} visibile`;
  clearTimeout(timerAvviso);
  if (durata) timerAvviso = setTimeout(() => barra.classList.remove("visibile"), durata);
}

/** Il percorso ("/servizi/consulenza") → la chiave di rotta ("_servizi_consulenza"):
    un solo segmento, perché un parametro di rotta non contiene barre. La
    barra diventa underscore, e gli slug non ne contengono mai (slugDaTitolo).
    Deve combaciare con `daChiave` in api/admin/pagine/[chiave].ts. */
const chiave = (percorso) => percorso.replace(/\//g, "_");

function segnaSporco() {
  stato.sporco = true;
  document.getElementById("stato-salvataggio").textContent = "modifiche non salvate";
  const salva = document.getElementById("tav-salva");
  if (salva) salva.disabled = false;
}

/** Accende o spegne il segno «modifiche non pubblicate», in testata e nella
    tavolozza: è uno stato della pagina, non l'esito di un gesto. */
function segnaBozza(mostra) {
  for (const id of ["stato-bozza", "tav-bozza"]) {
    const n = document.getElementById(id);
    if (n) n.hidden = !mostra;
  }
}

/** Valore vuoto per i campi di un tipo di blocco, coerente col tipo. */
function vuotoPerCampi(campi) {
  const o = {};
  for (const c of campi ?? []) {
    o[c.nome] =
      c.predefinito !== undefined
        ? c.predefinito
        : c.tipo === "immagine"
          ? { url: "", alt: "" }
          : c.tipo === "lista" || c.tipo === "blocchi"
            ? []
            : c.tipo === "booleano"
              ? false
              : "";
  }
  return o;
}

/* ══════════════════════════ i preset di sezione ══════════════════════════
 *
 * Gruppi di sezioni pronte da montare in fretta: un'intestazione, un blocco
 * contatti, una galleria. Sono coordinate sul foglio (x/y/w in percentuale),
 * come le sezioni singole — poi si spostano e si riempiono come tutto il resto. */
const PRESET = {
  intestazione: {
    etichetta: "Intestazione",
    // Sezioni già posizionate ma VUOTE: si compilano sul posto (in composizione
    // mostrano l'invito). Niente testi finti che, pubblicati per sbaglio,
    // farebbero sembrare il sito un template.
    blocchi: [
      { tipo: "titolo", dati: { testo: "" }, x: 8, y: 8, w: 70 },
      { tipo: "testo", dati: { html: "" }, x: 8, y: 24, w: 60 },
      { tipo: "collegamento", dati: { testo: "", url: "", aspetto: "pulsante" }, x: 8, y: 40, w: 30 },
    ],
  },
  contatti: {
    etichetta: "Contatti",
    blocchi: [
      { tipo: "titolo", dati: { testo: "" }, x: 8, y: 8, w: 60 },
      { tipo: "testo", dati: { html: "" }, x: 8, y: 24, w: 50 },
    ],
  },
  galleria: {
    etichetta: "Galleria",
    blocchi: [
      { tipo: "immagine", dati: { immagine: { url: "", alt: "" } }, x: 6, y: 10, w: 28 },
      { tipo: "immagine", dati: { immagine: { url: "", alt: "" } }, x: 37, y: 10, w: 28 },
      { tipo: "immagine", dati: { immagine: { url: "", alt: "" } }, x: 68, y: 10, w: 28 },
    ],
  },
};

async function aggiungiPreset(nome) {
  const p = PRESET[nome];
  if (!p) return;
  const massimo = stato.schema.maxBlocchi ?? 60;
  if (blocchiCorrenti().length + p.blocchi.length > massimo) {
    return avviso(`Massimo ${massimo} sezioni.`, "errore");
  }
  ricorda();
  const nuovi = p.blocchi.map((b) => ({ larghezza: 12, h: 0, ...b }));
  stato.dati.blocchi = [...blocchiCorrenti(), ...nuovi];
  segnaSporco();
  await salvaDocumento();
  ricaricaAnteprima();
  avviso(`Preset «${p.etichetta}» aggiunto: spostalo e riempilo dove vuoi.`);
}

/* ══════════════════════════ la mappa del sito ══════════════════════════ */

async function elencoPagine() {
  const voci = (await api("/pagine")).voci;
  stato.percorsi = voci.map((v) => v.percorso);
  return voci;
}

/* La colonna di sinistra: i SERVIZI del sito. «Pagine» riporta alla mappa
   (il foglio centrale), gli altri aprono le loro schermate. Qui in futuro si
   aggiungono le altre voci. */
function disegnaServizi() {
  const nav = document.getElementById("albero");
  const voce = (etichetta, fai, extra = null) =>
    el("button", { type: "button", class: "servizi__voce", onclick: fai }, [etichetta, extra].filter(Boolean));
  nav.replaceChildren(
    el("div", { class: "servizi__testa" }, "Il sito"),
    voce("Pagine", () => disegnaMappa()),
    voce("Aspetto e testo", () => apriSito()),
    voce("Dati dello studio", () => apriDatiStudio()),
    voce("Messaggi", () => apriMessaggi(), el("span", { class: "servizi__conteggio", id: "conteggio-messaggi", hidden: true })),
  );
  aggiornaConteggioMessaggi();
}

function segnaServizioAttivo(etichetta) {
  document.querySelectorAll(".servizi__voce").forEach((b) => {
    b.classList.toggle("attivo", b.textContent.startsWith(etichetta));
  });
}

/* La HOME dell'editor: la mappa del sito come ALBERO DI RIQUADRI nel foglio
   centrale. Ogni riquadro è una pagina; le sottopagine pendono dalla loro, coi
   collegamenti disegnati. Si clicca un riquadro per comporre quella pagina. */
async function disegnaMappa() {
  segnaServizioAttivo("Pagine");
  const cont = document.getElementById("contenuto");
  const titolo = document.getElementById("titolo-schermata");
  const descr = document.getElementById("descrizione-schermata");
  if (titolo) titolo.textContent = "Le pagine del sito";
  if (descr) descr.textContent = "Ogni riquadro è una pagina; le sottopagine pendono dalla loro. Clicca un riquadro per comporlo.";

  let voci;
  try {
    voci = await elencoPagine();
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 0);
    return;
  }

  const perGenitore = new Map();
  for (const v of voci) {
    const k = v.genitore ?? null;
    if (!perGenitore.has(k)) perGenitore.set(k, []);
    perGenitore.get(k).push(v);
  }
  /* Un GRAFO ad albero dall'alto in basso (org-chart): ogni pagina è un nodo,
     i figli scendono sotto il genitore, uniti da linee. `<li>` = un nodo col
     suo eventuale gruppo di figli (`<ul>`); i connettori li disegna il CSS. */
  const nodo = (v) => el("li", {}, [nodoPagina(v), figliDi(v.id)].filter(Boolean));
  const figliDi = (genitore) => {
    const figli = perGenitore.get(genitore) ?? [];
    return figli.length ? el("ul", {}, figli.map(nodo)) : null;
  };
  const radici = perGenitore.get(null) ?? [];

  cont.replaceChildren(
    el("div", { class: "mappa" }, [
      el("div", { class: "mappa__barra" }, [
        el("button", { type: "button", class: "mappa__nuova", onclick: () => nuovaPagina(null) }, "+ Nuova pagina"),
      ]),
      radici.length
        ? el("div", { class: "grafo" }, [el("ul", { class: "org" }, radici.map(nodo))])
        : el("p", { class: "mappa__vuoto" }, "Nessuna pagina. Comincia con «Nuova pagina»."),
    ]),
  );
  aggiornaConteggioMessaggi();
}

/* ══════════════════════════ la casella dei messaggi ══════════════════════════ */

async function aggiornaConteggioMessaggi() {
  try {
    const { nonLetti } = await api("/messaggi");
    const b = document.getElementById("conteggio-messaggi");
    if (b) {
      b.textContent = String(nonLetti);
      b.hidden = !nonLetti;
    }
  } catch {
    /* silenzioso: il conteggio è una comodità, non deve rompere l'albero. */
  }
}

async function apriMessaggi() {
  if (componendo.attivo) chiudiComponi();
  segnaServizioAttivo("Messaggi");
  const centro = document.getElementById("contenuto");
  const titolo = document.getElementById("titolo-schermata");
  const descr = document.getElementById("descrizione-schermata");
  if (titolo) titolo.textContent = "Messaggi";
  if (descr) descr.textContent = "I messaggi arrivati dai moduli di contatto del sito.";

  let dati;
  try {
    dati = await api("/messaggi");
  } catch (e) {
    return avviso(messaggioErrore(e), "errore", 8000);
  }
  const messaggi = dati.messaggi ?? [];
  centro.replaceChildren(
    messaggi.length
      ? el("ul", { class: "posta__lista" }, messaggi.map((m) => rigaMessaggio(m)))
      : el("p", { class: "posta__vuoto" }, "Ancora nessun messaggio. Quando qualcuno scrive dal modulo di contatto, arriva qui."),
  );
  aggiornaConteggioMessaggi();
}

function rigaMessaggio(m) {
  const li = el("li", { class: "posta__voce" + (m.letto ? "" : " nuovo") }, [
    el("div", { class: "posta__capo" }, [
      el("strong", {}, m.nome || "(senza nome)"),
      m.email ? el("a", { class: "posta__email", href: `mailto:${m.email}` }, m.email) : null,
      el("span", { class: "posta__quando" }, new Date(m.created_at).toLocaleString("it-IT")),
    ]),
    el("p", { class: "posta__testo" }, m.messaggio),
    el("div", { class: "posta__gesti" }, [
      m.pagina ? el("span", { class: "posta__pagina" }, `da ${m.pagina}`) : null,
      el(
        "button",
        {
          type: "button",
          onclick: async (e) => {
            const nuovo = !m.letto;
            try {
              await api(`/messaggi/${m.id}`, { method: "POST", body: JSON.stringify({ azione: nuovo ? "letto" : "nonletto" }) });
            } catch (err) {
              return avviso(messaggioErrore(err), "errore", 8000);
            }
            m.letto = nuovo;
            li.classList.toggle("nuovo", !nuovo);
            e.target.textContent = nuovo ? "Segna da leggere" : "Segna letto";
            aggiornaConteggioMessaggi();
          },
        },
        m.letto ? "Segna da leggere" : "Segna letto",
      ),
      el(
        "button",
        {
          type: "button",
          class: "pericolo",
          onclick: async () => {
            if (!confirm("Eliminare il messaggio?")) return;
            try {
              await api(`/messaggi/${m.id}`, { method: "DELETE" });
            } catch (err) {
              return avviso(messaggioErrore(err), "errore", 8000);
            }
            li.remove();
            aggiornaConteggioMessaggi();
          },
        },
        "Elimina",
      ),
    ]),
  ]);
  return li;
}

/* ══════════════════ aspetto e testo del sito (tema/layout) ══════════════════
 *
 * Le cose valide per TUTTE le pagine: colori e caratteri (il tema), il
 * sottotitolo della testata e il piè di pagina (il layout), il nome del sito
 * (le impostazioni). Si lavora in bozza e «Pubblica» le applica ovunque. La
 * schermata vive nella colonna centrale, con un'anteprima viva del tema. */
async function apriSito() {
  if (componendo.attivo) chiudiComponi();
  segnaServizioAttivo("Aspetto");
  const centro = document.getElementById("contenuto");
  const titolo = document.getElementById("titolo-schermata");
  const descr = document.getElementById("descrizione-schermata");
  if (titolo) titolo.textContent = "Aspetto e testo del sito";
  if (descr) descr.textContent = "Colori, caratteri, nome e piè di pagina. Vale per tutto il sito: «Pubblica» lo applica a ogni pagina.";

  let tema, layout, impostazioni;
  try {
    [tema, layout, impostazioni] = await Promise.all([
      api("/sito/tema"),
      api("/sito/layout"),
      api("/sito/impostazioni"),
    ]);
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
    return;
  }

  const T = tema.dati ?? {};
  const L = layout.dati ?? {};
  const I = impostazioni.dati ?? {};
  const caratteri = stato.schema.caratteri ?? [];

  /* L'anteprima viva: un pezzetto di sito coi valori scelti, aggiornato a ogni
     tocco senza passare dal server — un tema si sceglie a occhio. */
  const anteprima = el("div", { class: "aspetto__anteprima" });
  const sfondoAttuale = () =>
    sfondoTipo === "sfumatura"
      ? `linear-gradient(${campoAngolo.value}deg, ${campoSfDa.value}, ${campoSfA.value})`
      : campoCarta.value;
  const dipingi = () => {
    const pilaT = caratteri.find((c) => c.valore === campoFontTitoli.value)?.pila || "";
    const pilaC = caratteri.find((c) => c.valore === campoFontTesto.value)?.pila || "";
    anteprima.style.background = sfondoAttuale();
    anteprima.style.color = campoInchiostro.value;
    anteprima.style.setProperty("--x-accento", campoAccento.value);
    anteprima.style.fontFamily = pilaC;
    anteprima.querySelector(".aspetto__h").style.fontFamily = pilaT;
    anteprima.querySelector(".aspetto__h").style.color = campoInchiostro.value;
  };

  const colore = (etichetta, valore, predefinito) => {
    const inp = el("input", { type: "color", value: exaColore(valore) || predefinito });
    inp.addEventListener("input", dipingi);
    return { riga: el("label", { class: "aspetto__campo" }, [etichetta, inp]), inp };
  };
  const A = colore("Colore d'accento", T.accento, "#7c5c2b");
  const IN = colore("Colore del testo", T.inchiostro, "#17202e");
  const CA = colore("Tinta unita", T.carta, "#fcfbf9");
  const campoAccento = A.inp;
  const campoInchiostro = IN.inp;
  const campoCarta = CA.inp;

  // ── lo SFONDO: tinta unita oppure sfumatura fra due colori ──────────────
  let sfondoTipo = T.sfondoTipo === "sfumatura" ? "sfumatura" : "tinta";
  const SFDA = colore("Sfuma da", T.sfondoDa, "#fcfbf9");
  const SFA = colore("Sfuma a", T.sfondoA, "#e9e2d6");
  const campoSfDa = SFDA.inp;
  const campoSfA = SFA.inp;
  const campoAngolo = el("input", { type: "range", min: "0", max: "360", value: String(Number(T.sfondoAngolo) || 180) });
  campoAngolo.addEventListener("input", dipingi);
  const bloccoSfumatura = el("div", { class: "aspetto__sfumatura" }, [
    SFDA.riga,
    SFA.riga,
    el("label", { class: "aspetto__campo" }, ["Direzione", campoAngolo]),
  ]);
  const bloccoTinta = el("div", {}, [CA.riga]);
  const mostraSfondo = () => {
    bloccoTinta.hidden = sfondoTipo !== "tinta";
    bloccoSfumatura.hidden = sfondoTipo !== "sfumatura";
  };
  const sceltaSfondo = el("div", { class: "aspetto__segmento" },
    [["tinta", "Tinta unita"], ["sfumatura", "Sfumatura"]].map(([v, nome]) =>
      el("button", {
        type: "button",
        class: sfondoTipo === v ? "attivo" : null,
        onclick: (e) => {
          sfondoTipo = v;
          [...e.target.parentNode.children].forEach((b) => b.classList.toggle("attivo", b === e.target));
          mostraSfondo();
          dipingi();
        },
      }, nome),
    ),
  );

  // ── il menu (dashboard): allineamento, posizione, forma ─────────────────
  const tendina = (coppie, scelto) => {
    const s = el("select", {});
    for (const [v, nome] of coppie) {
      const o = el("option", { value: v }, nome);
      if (scelto === v) o.selected = true;
      s.append(o);
    }
    return s;
  };
  const campoMenu = tendina(
    [["sinistra", "A sinistra"], ["centro", "Al centro"], ["destra", "A destra"]],
    L.menuAllinea ?? "destra",
  );
  const campoMenuPosizione = tendina(
    [["affiancato", "Accanto al nome"], ["sotto", "Su una riga sotto il nome"]],
    L.menuPosizione ?? "affiancato",
  );
  const campoMenuForma = tendina(
    [["linee", "Linee"], ["pillole", "Pillole"], ["sottolineato", "Sottolineato"], ["semplice", "Semplice"]],
    L.menuForma ?? "linee",
  );

  const selFont = (etichetta, valore) => {
    const s = el("select", {});
    s.append(el("option", { value: "" }, "Come il sito"));
    for (const c of caratteri) {
      if (!c.valore) continue;
      const o = el("option", { value: c.valore }, c.etichetta);
      if (c.valore === valore) o.selected = true;
      s.append(o);
    }
    s.addEventListener("change", dipingi);
    return { riga: el("label", { class: "aspetto__campo" }, [etichetta, s]), sel: s };
  };
  const FT = selFont("Carattere dei titoli", T.fontTitoli);
  const FC = selFont("Carattere del testo", T.fontTesto);
  const campoFontTitoli = FT.sel;
  const campoFontTesto = FC.sel;

  const campoNome = el("input", { type: "text", value: String(I.nome ?? ""), placeholder: "Il nome del sito" });
  const campoSotto = el("input", { type: "text", value: String(L.testataSottotitolo ?? ""), placeholder: "Un sottotitolo sotto il nome (facoltativo)" });
  const campoPiede = el("textarea", { rows: "3", placeholder: "Il piè di pagina — anche HTML semplice" }, String(L.piePagina ?? ""));

  anteprima.append(
    el("div", { class: "aspetto__h" }, "Titolo di prova"),
    el("p", {}, "Un paragrafo di prova, per vedere il carattere del testo e il colore su questo sfondo."),
    el("a", { class: "aspetto__bottone" }, "Un pulsante"),
  );

  // ── Temi predefiniti: un clic imposta colori e caratteri nei campi qui sotto.
  const pila = (chiave) => caratteri.find((c) => c.valore === chiave)?.pila || "";
  /* I token secondari (per i temi scuri): non hanno un campo nel modulo, ma
     vanno conservati al salvataggio, o un tema scuro perderebbe testata/piè/
     bordi. Si impostano applicando un tema e si azzerano applicandone uno chiaro. */
  const CHIAVI_EXTRA = ["carta2", "cartaScura", "linea", "lineaForte", "inchiostro2", "tenue", "suScuro"];
  let extraTokens = {};
  for (const k of CHIAVI_EXTRA) extraTokens[k] = T[k] || "";
  const applicaTema = (t) => {
    campoAccento.value = t.accento;
    campoInchiostro.value = t.inchiostro;
    campoCarta.value = t.carta;
    campoFontTitoli.value = t.fontTitoli;
    campoFontTesto.value = t.fontTesto;
    for (const k of CHIAVI_EXTRA) extraTokens[k] = t[k] || ""; // "" per i temi chiari
    sfondoTipo = "tinta"; // i temi predefiniti usano una tinta unita
    [...sceltaSfondo.children].forEach((b) => b.classList.toggle("attivo", b.textContent === "Tinta unita"));
    mostraSfondo();
    dipingi();
  };
  const temi = stato.schema.temi ?? [];
  const sezioneTemi = el("div", { class: "aspetto__temi" }, [
    el("h2", { class: "aspetto__gruppo" }, "Temi predefiniti"),
    el("p", { class: "aspetto__aiutino" }, "Un clic imposta colori e caratteri; poi puoi ritoccare tutto. «Pubblica» per applicare."),
    el(
      "div",
      { class: "temi__griglia" },
      temi.map((t) =>
        el("button", { type: "button", class: "tema-carta", title: t.descrizione, onclick: () => applicaTema(t) }, [
          el("span", { class: "tema-carta__mostra", style: `background:${t.carta}` }, [
            el("span", { class: "tema-carta__aa", style: `color:${t.inchiostro};font-family:${pila(t.fontTitoli)}` }, "Aa"),
            el("span", { class: "tema-carta__punto", style: `background:${t.accento}` }),
          ]),
          el("span", { class: "tema-carta__nome" }, t.nome),
        ]),
      ),
    ),
  ]);

  const raccogli = () => ({
    tema: {
      accento: campoAccento.value,
      inchiostro: campoInchiostro.value,
      carta: campoCarta.value,
      fontTitoli: campoFontTitoli.value,
      fontTesto: campoFontTesto.value,
      sfondoTipo,
      sfondoDa: campoSfDa.value,
      sfondoA: campoSfA.value,
      sfondoAngolo: Number(campoAngolo.value),
      ...extraTokens,
    },
    layout: {
      testataSottotitolo: campoSotto.value.trim(),
      piePagina: campoPiede.value.trim(),
      menuAllinea: campoMenu.value,
      menuPosizione: campoMenuPosizione.value,
      menuForma: campoMenuForma.value,
    },
    impostazioni: { ...I, nome: campoNome.value.trim() || "Il mio sito" },
  });

  const statoSito = el("span", { class: "aspetto__stato" });
  const modulo = el("div", { class: "aspetto" }, [
    el("div", { class: "aspetto__colonne" }, [
      el("div", { class: "aspetto__campi" }, [
        sezioneTemi,
        el("h2", { class: "aspetto__gruppo" }, "Testo"),
        el("label", { class: "aspetto__campo" }, ["Nome del sito", campoNome]),
        el("label", { class: "aspetto__campo" }, ["Sottotitolo in testata", campoSotto]),
        el("label", { class: "aspetto__campo" }, ["Piè di pagina", campoPiede]),
        el("h2", { class: "aspetto__gruppo" }, "Tema"),
        A.riga, IN.riga, FT.riga, FC.riga,
        el("h2", { class: "aspetto__gruppo" }, "Sfondo"),
        sceltaSfondo, bloccoTinta, bloccoSfumatura,
        el("h2", { class: "aspetto__gruppo" }, "Menu (dashboard)"),
        el("label", { class: "aspetto__campo" }, ["Allineamento dei nomi", campoMenu]),
        el("label", { class: "aspetto__campo" }, ["Posizione", campoMenuPosizione]),
        el("label", { class: "aspetto__campo" }, ["Forma delle voci", campoMenuForma]),
      ]),
      el("div", { class: "aspetto__vetrina" }, [
        el("span", { class: "aspetto__etichetta" }, "Anteprima del tema"),
        anteprima,
      ]),
    ]),
    el("div", { class: "aspetto__azioni" }, [
      statoSito,
      el("button", { type: "button", onclick: async () => { await salvaAspetto(raccogli(), statoSito); } }, "Salva"),
      el("button", { type: "button", class: "principale", onclick: async () => { await pubblicaAspetto(raccogli(), statoSito); } }, "Pubblica su tutto il sito"),
    ]),
  ]);

  centro.replaceChildren(modulo);
  mostraSfondo();
  dipingi();
}

const exaColore = (v) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);

async function salvaAspetto(valori, statoEl) {
  if (statoEl) statoEl.textContent = "Salvataggio…";
  try {
    await Promise.all([
      api("/sito/tema", { method: "PUT", body: JSON.stringify({ dati: valori.tema }) }),
      api("/sito/layout", { method: "PUT", body: JSON.stringify({ dati: valori.layout }) }),
      api("/sito/impostazioni", { method: "PUT", body: JSON.stringify({ dati: valori.impostazioni }) }),
    ]);
    if (statoEl) statoEl.textContent = "Salvato in bozza";
    avviso("Aspetto salvato in bozza. «Pubblica» per applicarlo.");
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
    if (statoEl) statoEl.textContent = "Errore nel salvataggio";
  }
}

async function pubblicaAspetto(valori, statoEl) {
  await salvaAspetto(valori, statoEl);
  try {
    await Promise.all([
      api("/sito/tema", { method: "POST", body: JSON.stringify({ azione: "pubblica" }) }),
      api("/sito/layout", { method: "POST", body: JSON.stringify({ azione: "pubblica" }) }),
      api("/sito/impostazioni", { method: "POST", body: JSON.stringify({ azione: "pubblica" }) }),
    ]);
    if (statoEl) statoEl.textContent = "Pubblicato su tutto il sito";
    document.getElementById("nome-sito").textContent = valori.impostazioni.nome;
    avviso("Aspetto pubblicato: vale su tutte le pagine.");
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
  }
}

/* Le iconcine dei nodi: una casa per la home, un foglio per le altre. SVG in
   currentColor, così seguono il colore del testo del nodo. */
const ICONA_HOME =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v9h5v-5h4v5h5v-9"/></svg>';
const ICONA_PAGINA =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>';

/** Un NODO del grafo: icona, pallino di stato, titolo (apre la composizione) e
    una barretta di gesti che compare al passaggio (menu, posizione,
    sottopagina, elimina) — così il nodo resta pulito. */
function nodoPagina(v) {
  const attiva = v.percorso === stato.percorso;
  const home = v.percorso === "/";
  const [statoClasse, statoTesto] = !v.pubblicata
    ? ["nodo__stato--grigia", "non pubblicata"]
    : v.daPubblicare
      ? ["nodo__stato--ambra", "modifiche non pubblicate"]
      : ["nodo__stato--verde", "pubblicata"];
  return el("div", { class: "nodo" + (attiva ? " nodo--attiva" : "") + (home ? " nodo--home" : "") }, [
    el("span", { class: "nodo__stato " + statoClasse, title: statoTesto }),
    el(
      "button",
      { type: "button", class: "nodo__apri", title: `Componi ${v.percorso}`, onclick: () => apriPagina(v.percorso) },
      [
        el("span", { class: "nodo__cima" }, [
          el("span", { class: "nodo__icona", html: home ? ICONA_HOME : ICONA_PAGINA }),
          el("span", { class: "nodo__titolo" }, v.titolo || v.percorso),
        ]),
        el("span", { class: "nodo__percorso" }, v.percorso),
      ],
    ),
    el("div", { class: "nodo__barra" }, [
      el("label", { class: "nodo__spunta", title: "Mostra nel menu del sito" }, [
        el("input", {
          type: "checkbox",
          ...(v.nelMenu ? { checked: "" } : {}),
          onchange: (e) => metaPagina(v.percorso, { nelMenu: e.target.checked }),
        }),
      ]),
      el("input", {
        type: "number",
        class: "nodo__ordine",
        min: "0",
        value: v.ordine ?? 0,
        title: "Posizione fra le pagine sorelle (0 = prima)",
        onchange: (e) => metaPagina(v.percorso, { ordine: e.target.value === "" ? null : Number(e.target.value) }),
      }),
      el("button", { type: "button", class: "nodo__sotto", title: "Aggiungi una sottopagina", onclick: () => nuovaPagina(v.id) }, "+"),
      v.percorso !== "/"
        ? el("button", { type: "button", class: "pericolo nodo__elimina", title: "Elimina la pagina (e le sue sottopagine)", onclick: () => eliminaPagina(v) }, "✕")
        : null,
    ]),
  ]);
}

async function nuovaPagina(genitore) {
  const titolo = prompt(genitore ? "Titolo della sottopagina:" : "Titolo della pagina nuova:");
  if (!titolo) return;
  try {
    const esito = await api("/pagine", {
      method: "POST",
      body: JSON.stringify({ titolo, genitore }),
    });
    stato.percorsi = null;
    await apriPagina(esito.percorso);
    // «Annulla»: la pagina appena creata è ancora vuota, quindi disfarla è
    // solo cancellarla — e si torna alla mappa del sito.
    avviso("Pagina creata. Componila e poi premi «Pubblica».", "ok", 8000, {
      etichetta: "Annulla",
      fai: async () => {
        try {
          await api(`/pagine/${chiave(esito.percorso)}`, { method: "DELETE" });
          stato.percorsi = null;
          chiudiComponi();
          avviso("Creazione annullata.");
        } catch (e) {
          avviso(messaggioErrore(e), "errore", 8000);
        }
      },
    });
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
  }
}

async function metaPagina(percorso, campi) {
  try {
    await api(`/pagine/${chiave(percorso)}`, {
      method: "POST",
      body: JSON.stringify({ azione: "meta", ...campi }),
    });
    await disegnaMappa();
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
  }
}

async function eliminaPagina(v) {
  if (!confirm(`Eliminare «${v.titolo || v.percorso}»?\nLe sue sottopagine se ne vanno con lei.`))
    return;
  try {
    const esito = await api(`/pagine/${chiave(v.percorso)}`, { method: "DELETE" });
    stato.percorsi = null;
    if (stato.percorso === v.percorso) chiudiComponi();
    else await disegnaMappa();
    const quante = (esito.rimosse ?? []).length;
    // «Annulla»: rimette in vita la pagina e le sue sottopagine, com'erano.
    avviso(
      quante > 1 ? `Eliminata «${v.titolo || v.percorso}» e ${quante - 1} sottopagina/e.` : `Eliminata «${v.titolo || v.percorso}».`,
      "ok",
      10000,
      {
        etichetta: "Annulla",
        fai: async () => {
          try {
            await api("/pagine/ripristina", { method: "POST", body: JSON.stringify({ righe: esito.rimosse }) });
            stato.percorsi = null;
            await disegnaMappa();
            avviso("Ripristinata.");
          } catch (e) {
            avviso(messaggioErrore(e), "errore", 8000);
          }
        },
      },
    );
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
  }
}

/* ══════════════════════ aprire e comporre una pagina ══════════════════════ */

async function apriPagina(percorso) {
  if (stato.sporco) await salvaDocumento();
  let pagina;
  try {
    pagina = await api(`/pagine/${chiave(percorso)}`);
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
    return;
  }
  stato.percorso = percorso;
  stato.dati = pagina.dati ?? {};
  stato.sporco = false;
  storia.length = 0;
  componendo.scelto = null;
  aggiornaAnnulla();
  apriComponi();
  segnaBozza(Boolean(pagina.daPubblicare));
}

/** Il pulsante «‹ Mappa del sito» mentre si compone: la via di ritorno
    all'albero, indipendente dalla tavolozza. Si TRASCINA per spostarlo (e si
    ritrova dove lo si è lasciato); un clic senza trascinamento torna indietro. */
function mostraTornaMappa() {
  if (document.getElementById("torna-mappa")) return;
  const b = el(
    "button",
    {
      id: "torna-mappa",
      class: "torna-mappa",
      type: "button",
      title: "Trascina per spostarlo · clic per tornare alla mappa (Esc)",
    },
    "‹ Mappa del sito",
  );

  /* Trascinamento premi-e-muovi. `mosso` distingue lo spostamento dal clic:
     senza, ogni trascinamento finirebbe col tornare indietro. Mentre si
     trascina l'iframe sotto va spento (come per la tavolozza), o si mangia gli
     eventi del mouse e il gesto muore appena lo si attraversa. */
  let mosso = false;
  b.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    mosso = false;
    const r = b.getBoundingClientRect();
    const off = { x: e.clientX - r.left, y: e.clientY - r.top };
    document.body.classList.add("trascinando-tavolozza");
    const mv = (ev) => {
      mosso = true;
      const x = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - off.x));
      const y = Math.max(0, Math.min(innerHeight - r.height, ev.clientY - off.y));
      b.style.left = `${x}px`;
      b.style.top = `${y}px`;
      b.style.right = "auto";
      componendo.posTorna = { x, y };
    };
    const up = () => {
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
      document.body.classList.remove("trascinando-tavolozza");
    };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  });
  b.addEventListener("click", () => {
    if (mosso) { mosso = false; return; }
    chiudiComponi();
  });

  document.body.append(b);
  if (componendo.posTorna) {
    b.style.left = `${componendo.posTorna.x}px`;
    b.style.top = `${componendo.posTorna.y}px`;
    b.style.right = "auto";
  }
}

function apriComponi() {
  componendo.attivo = true;
  document.body.classList.add("componendo");
  mostraTornaMappa();
  /* La pagina in composizione vive anche nell'URL (#/percorso): così un
     ricaricamento del browser NON riporta all'albero — riapre questa stessa
     pagina dov'eri. `replaceState` per non riempire la cronologia. */
  try { history.replaceState(null, "", `#${stato.percorso}`); } catch {}
  const cornice = document.getElementById("anteprima");
  cornice.hidden = false;
  cornice.src = `${stato.percorso}?componi=1&r=${Date.now()}`;
  disegnaTavolozza();
}

function chiudiComponi() {
  if (stato.sporco && !confirm("Ci sono modifiche non salvate. Uscire lo stesso?")) return;
  componendo.attivo = false;
  componendo.scelto = null;
  chiudiBarraRicca();
  document.getElementById("tavolozza")?.remove();
  document.getElementById("torna-mappa")?.remove();
  document.body.classList.remove("componendo");
  const cornice = document.getElementById("anteprima");
  cornice.hidden = true;
  cornice.removeAttribute("src");
  stato.percorso = null;
  stato.dati = null;
  stato.sporco = false;
  document.getElementById("stato-salvataggio").textContent = "";
  segnaBozza(false);
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  disegnaMappa();
}

function ricaricaAnteprima() {
  const c = document.getElementById("anteprima");
  c.src = `${stato.percorso}?componi=1&r=${Date.now()}`;
}

/** L'anteprima a misura di dispositivo: restringe l'iframe a una larghezza
    tipica, per vedere come cade la composizione sul telefono senza uscire da
    qui. È una classe sul body — il CSS fa il resto (vedi editor.css). */
function impostaVista(v) {
  stato.vista = v;
  document.body.classList.remove("vista-tablet", "vista-telefono");
  if (v === "tablet") document.body.classList.add("vista-tablet");
  else if (v === "telefono") document.body.classList.add("vista-telefono");
  document.querySelectorAll(".tavolozza__vista button").forEach((b) => {
    b.classList.toggle("attivo", b.title === (v === "desktop" ? "Schermo intero" : v === "tablet" ? "Tablet" : "Telefono"));
  });
}

async function salvaDocumento() {
  if (!stato.percorso || stato.salvataggioInCorso) return;
  stato.salvataggioInCorso = true;
  const st = document.getElementById("stato-salvataggio");
  st.textContent = "Salvataggio…";
  try {
    await api(`/pagine/${chiave(stato.percorso)}`, {
      method: "PUT",
      body: JSON.stringify({ dati: stato.dati }),
    });
    stato.sporco = false;
    st.textContent = "Salvato in bozza";
    segnaBozza(true);
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
    st.textContent = "Errore nel salvataggio";
  } finally {
    stato.salvataggioInCorso = false;
  }
}

async function pubblicaPagina() {
  if (stato.sporco) await salvaDocumento();
  try {
    await api(`/pagine/${chiave(stato.percorso)}`, {
      method: "POST",
      body: JSON.stringify({ azione: "pubblica" }),
    });
    avviso("Pubblicata: è online.");
    segnaBozza(false);
    ricaricaAnteprima();
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
  }
}

/** Comporre segue la navigazione: un collegamento cliccato nell'anteprima
    porta a comporre la pagina d'arrivo, se è una delle nostre. */
async function seguiNavigazione(percorso) {
  const pulito = (percorso || "").split("?")[0].split("#")[0];
  if (!pulito.startsWith("/") || pulito.startsWith("/admin")) return;
  if (stato.sporco) await salvaDocumento();
  const percorsi = await slugsPagine();
  if (percorsi.includes(pulito)) {
    await apriPagina(pulito);
  } else {
    avviso("Quel collegamento porta fuori dal sito o a una pagina che non c'è ancora.", "ok", 5000);
  }
}

async function slugsPagine() {
  if (stato.percorsi) return stato.percorsi;
  await elencoPagine();
  return stato.percorsi ?? [];
}

/* ══════════════════════════ l'annulla ══════════════════════════
 *
 * Una pila di istantanee di `stato.dati`, scattate PRIMA di ogni mutazione del
 * compositore. «Annulla» rimette l'ultima, salva e ricarica l'anteprima — il
 * server ridisegna, quindi non c'è un secondo posto in cui lo stato diverge.
 */
const storia = [];

function ricorda() {
  if (!componendo.attivo) return;
  storia.push(JSON.stringify(stato.dati));
  if (storia.length > 50) storia.shift();
  aggiornaAnnulla();
}

async function annulla() {
  if (!componendo.attivo) return;
  if (!storia.length) return avviso("Non c'è niente da annullare.");
  stato.dati = JSON.parse(storia.pop());
  componendo.scelto = null;
  segnaSporco();
  aggiornaAnnulla();
  disegnaScelta();
  await salvaDocumento();
  ricaricaAnteprima();
}

function aggiornaAnnulla() {
  const b = document.getElementById("tav-annulla");
  if (b) b.disabled = storia.length === 0;
}

/* ══════════════════════════ la tavolozza ══════════════════════════ */

const blocchiCorrenti = () => (Array.isArray(stato.dati?.blocchi) ? stato.dati.blocchi : []);

function disegnaTavolozza() {
  document.getElementById("tavolozza")?.remove();

  const catalogo = stato.schema.blocchi ?? {};
  const avanzata = stato.dati?.modo === "avanzato";
  const disponibili = Object.entries(catalogo).filter(([, t]) => !t.avanzato || avanzata);

  const aggiunte = el(
    "div",
    { class: "tavolozza__griglia" },
    disponibili.map(([nome, t]) =>
      el(
        "button",
        { type: "button", title: t.descrizione ?? "", onclick: () => aggiungiSezione(nome, t) },
        t.etichetta,
      ),
    ),
  );

  const scelta = el("div", { class: "tavolozza__scelta", id: "tav-scelta" });

  fotoInput = creaFotoInput();

  const testa = el("div", { class: "tavolozza__testa", title: "Trascina per spostare" }, [
    el("strong", {}, "Componi"),
    el(
      "button",
      {
        type: "button",
        class: "tavolozza__chiudi",
        title: "Torna alla mappa del sito (Esc)",
        onclick: chiudiComponi,
      },
      "✕",
    ),
  ]);

  const tavolozza = el("div", { class: "tavolozza", id: "tavolozza" }, [
    testa,
    ...(componendo.disegnata
      ? [
          el(
            "p",
            { class: "tavolozza__aiuto" },
            "Questa pagina ha un impaginato fisso: si cambiano i contenuti. " +
              "Doppio clic su un testo per scriverlo (Invio o clic fuori per finire). " +
              "Clic su una foto per sostituirla. Passa sopra una voce di un elenco " +
              "per spostarla, aggiungerne una uguale o toglierla. Recapiti e orari " +
              "stanno in «Dati dello studio».",
          ),
          el("div", { hidden: true }, [scelta]),
        ]
      : [
          el(
            "p",
            { class: "tavolozza__aiuto" },
            "Prendi una sezione e portala dove vuoi: si aggancia al centro, ai bordi e " +
              "alle altre sezioni — con Alt premuto va al millimetro. L'angolo la " +
              "ridimensiona; la maniglia sotto il foglio lo allunga. Doppio clic per " +
              "scrivere, anche sul titolo. Se due sezioni si coprono, un altro clic " +
              "prende quella sotto.",
          ),
          el("span", { class: "tavolozza__etichetta", id: "tav-dove" }, "Aggiungi in fondo"),
          aggiunte,
          el("span", { class: "tavolozza__etichetta" }, "Preset pronti"),
          el(
            "div",
            { class: "tavolozza__griglia" },
            Object.entries(PRESET).map(([nome, p]) =>
              el(
                "button",
                { type: "button", title: "Monta un gruppo di sezioni pronte", onclick: () => aggiungiPreset(nome) },
                p.etichetta,
              ),
            ),
          ),
          scelta,
        ]),
    pannelloSeo(),
    el("div", { class: "tavolozza__riga" }, [
      el(
        "button",
        { type: "button", class: "tavolozza__cronologia", title: "Riporta la pagina a una versione precedente", onclick: () => apriCronologia() },
        "Cronologia…",
      ),
    ]),
    el("span", { class: "tavolozza__etichetta" }, "Anteprima"),
    el(
      "div",
      { class: "tavolozza__riga tavolozza__vista" },
      [
        ["desktop", "🖥", "Schermo intero"],
        ["tablet", "▭", "Tablet"],
        ["telefono", "📱", "Telefono"],
      ].map(([v, segno, titolo]) =>
        el(
          "button",
          {
            type: "button",
            title: titolo,
            class: stato.vista === v ? "attivo" : null,
            onclick: () => impostaVista(v),
          },
          segno,
        ),
      ),
    ),
    el("div", { class: "tavolozza__fondo" }, [
      el(
        "span",
        { class: "tavolozza__bozza", id: "tav-bozza", hidden: true },
        "modifiche non pubblicate",
      ),
      el(
        "button",
        {
          type: "button",
          id: "tav-annulla",
          disabled: true,
          title: "Un passo indietro (Ctrl+Z)",
          onclick: () => annulla(),
        },
        "Annulla",
      ),
      el(
        "button",
        { type: "button", id: "tav-salva", onclick: async () => { await salvaDocumento(); } },
        "Salva",
      ),
      el(
        "button",
        { type: "button", id: "tav-pubblica", class: "principale", onclick: () => pubblicaPagina() },
        "Pubblica",
      ),
    ]),
    fotoInput,
  ]);

  montaTavolozza(tavolozza, testa);
  disegnaScelta();
}

/**
 * Monta la tavolozza e la rende trascinabile dalla testata: sta SOPRA la
 * pagina, e una barra fissa prima o poi copre proprio il punto su cui si
 * lavora. Mentre la si trascina, l'iframe sotto va spento, o si mangia gli
 * eventi del mouse e il trascinamento muore appena lo si attraversa.
 */
function montaTavolozza(tavolozza, testa) {
  testa.addEventListener("mousedown", (ev) => {
    if (ev.target.closest("button")) return;
    ev.preventDefault();
    const r = tavolozza.getBoundingClientRect();
    const scarto = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    document.body.classList.add("trascinando-tavolozza");
    const muovi = (e) => {
      const x = Math.max(0, Math.min(innerWidth - r.width, e.clientX - scarto.x));
      const y = Math.max(0, Math.min(innerHeight - 60, e.clientY - scarto.y));
      tavolozza.style.left = `${x}px`;
      tavolozza.style.top = `${y}px`;
      tavolozza.style.right = "auto";
      componendo.posTavolozza = { x, y };
    };
    const su = () => {
      document.removeEventListener("mousemove", muovi);
      document.removeEventListener("mouseup", su);
      document.body.classList.remove("trascinando-tavolozza");
    };
    document.addEventListener("mousemove", muovi);
    document.addEventListener("mouseup", su);
  });

  document.body.append(tavolozza);
  if (componendo.posTavolozza) {
    tavolozza.style.left = `${componendo.posTavolozza.x}px`;
    tavolozza.style.top = `${componendo.posTavolozza.y}px`;
    tavolozza.style.right = "auto";
  }
}

/**
 * Il selettore di file: da qui una fotografia si inserisce SENZA uscire dalla
 * pagina. Le destinazioni: una sezione nuova (`nuovaDiTipo`), una che c'è già
 * (`indice`), o il punto in cui si sta scrivendo in un testo ricco (`dentroRicco`).
 */
function creaFotoInput() {
  return el("input", {
    type: "file",
    accept: "image/*",
    style: "display:none",
    oncancel: () => {
      scritturaSospesa = false;
    },
    onchange: async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      const dest = fotoDestinazione;
      fotoDestinazione = null;
      if (!file || !dest) {
        scritturaSospesa = false;
        return;
      }
      avviso("Caricamento della fotografia…", "ok", 0);
      try {
        const modulo = new FormData();
        modulo.append("file", file);
        const esito = await api("/media", { method: "POST", body: modulo });

        if (dest.dentroRicco) {
          scritturaSospesa = false;
          const { nodo, raggio } = dest.dentroRicco;
          const img = nodo.ownerDocument.createElement("img");
          img.src = esito.url;
          img.alt = "";
          if (raggio && nodo.contains(raggio.startContainer)) {
            raggio.collapse(false);
            raggio.insertNode(img);
          } else {
            nodo.append(img);
          }
          scriviCampoRicco(nodo);
          nodo.focus();
          avviso("Fotografia nel testo. Ricordati di salvare.");
          return;
        }

        if (dest.contenuto) {
          scriviContenuto(dest.contenuto, esito.url);
          await salvaDocumento();
          avviso("Fotografia sostituita. Ricordati di pubblicare.");
          ricaricaAnteprima();
          return;
        }

        if (dest.seoSocial) {
          stato.dati.seo = { ...(stato.dati.seo ?? {}), immagineSocial: esito.url };
          segnaSporco();
          await salvaDocumento();
          avviso("Immagine social impostata. Ricordati di pubblicare.");
          return;
        }

        if (dest.nuovaDiTipo) {
          const tipo = (stato.schema.blocchi ?? {})[dest.nuovaDiTipo];
          const campoFoto = tipo.campi.find((c) => c.tipo === "immagine").nome;
          const nuova = { tipo: dest.nuovaDiTipo, dati: vuotoPerCampi(tipo.campi), larghezza: 12 };
          nuova.dati[campoFoto] = { url: esito.url, alt: "" };
          inserisciBlocco(nuova);
        } else {
          const blocchi = [...blocchiCorrenti()];
          const b = blocchi[dest.indice];
          const tipo = (stato.schema.blocchi ?? {})[b?.tipo];
          const campoFoto = tipo?.campi.find((c) => c.tipo === "immagine")?.nome;
          if (!campoFoto) return;
          ricorda();
          blocchi[dest.indice] = {
            ...b,
            dati: { ...(b.dati ?? {}), [campoFoto]: { url: esito.url, alt: "" } },
          };
          stato.dati.blocchi = blocchi;
          segnaSporco();
        }
        await salvaDocumento();
        avviso("Fotografia inserita.");
        ricaricaAnteprima();
      } catch (err) {
        avviso(messaggioErrore(err), "errore", 8000);
      }
    },
  });
}

/** Il pannello «Dettagli pagina»: la descrizione per Google e le anteprime
    social, e l'immagine di condivisione. Vivono in `stato.dati.seo` e si
    salvano col documento. */
function pannelloSeo() {
  const seo = stato.dati?.seo ?? {};
  const descr = el(
    "textarea",
    { rows: "2", class: "tavolozza__seo", placeholder: "Una frase che riassume la pagina, per Google e i social" },
    String(seo.descrizione ?? ""),
  );
  descr.addEventListener("change", () => {
    stato.dati.seo = { ...(stato.dati.seo ?? {}), descrizione: descr.value.trim() };
    segnaSporco();
  });
  const social = el(
    "button",
    {
      type: "button",
      title: "L'immagine mostrata quando la pagina si condivide",
      onclick: () => {
        fotoDestinazione = { seoSocial: true };
        fotoInput?.click();
      },
    },
    seo.immagineSocial ? "Cambia immagine social…" : "Immagine social…",
  );
  return el("details", { class: "tavolozza__dettagli" }, [
    el("summary", {}, "Dettagli pagina (SEO)"),
    el("span", { class: "tavolozza__etichetta" }, "Descrizione"),
    descr,
    social,
  ]);
}

/* Lo storico: ogni pubblicazione salva com'era prima (vedi store.pubblica).
   «Riporta» rimette quella versione in bozza — non pubblica da solo: si
   controlla e poi si pubblica, come per ogni altra modifica. */
async function apriCronologia() {
  if (!stato.percorso) return;
  let dati;
  try {
    dati = await api(`/pagine/${chiave(stato.percorso)}?versioni`);
  } catch (e) {
    return avviso(messaggioErrore(e), "errore", 8000);
  }
  const versioni = dati.versioni ?? [];
  document.getElementById("cronologia-velo")?.remove();

  const lista = versioni.length
    ? el(
        "ul",
        { class: "cronologia__lista" },
        versioni.map((v) =>
          el("li", {}, [
            el("span", { class: "cronologia__quando" }, new Date(v.saved_at).toLocaleString("it-IT")),
            el("button", { type: "button", class: "principale", onclick: () => riporta(v) }, "Riporta a com'era"),
          ]),
        ),
      )
    : el("p", { class: "cronologia__vuoto" }, "Nessuna versione precedente: lo storico si riempie a ogni pubblicazione.");

  const velo = el(
    "div",
    {
      class: "cronologia__velo",
      id: "cronologia-velo",
      onclick: (e) => {
        if (e.target.id === "cronologia-velo") velo.remove();
      },
    },
    [
      el("div", { class: "cronologia" }, [
        el("div", { class: "cronologia__testa" }, [
          el("strong", {}, "Cronologia della pagina"),
          el("button", { type: "button", class: "tavolozza__chiudi", onclick: () => velo.remove() }, "✕"),
        ]),
        el("p", { class: "cronologia__aiuto" }, "«Riporta» rimette quella versione in bozza: controlla e poi pubblica."),
        lista,
      ]),
    ],
  );
  document.body.append(velo);
}

async function riporta(v) {
  stato.dati = JSON.parse(JSON.stringify(v.dati));
  componendo.scelto = null;
  storia.length = 0;
  aggiornaAnnulla();
  segnaSporco();
  await salvaDocumento();
  ricaricaAnteprima();
  disegnaScelta();
  document.getElementById("cronologia-velo")?.remove();
  avviso("Versione riportata in bozza. Controlla e pubblica.");
}

/** La parte della tavolozza che riguarda la sezione presa in mano. */
function disegnaScelta() {
  const testata = componendo.scelto === "testata";

  const etichetta = document.getElementById("tav-dove");
  if (etichetta) {
    etichetta.textContent =
      typeof componendo.scelto === "number"
        ? "Aggiungi dopo la sezione scelta"
        : "Aggiungi in fondo";
  }

  const dove = document.getElementById("tav-scelta");
  if (!dove) return;
  dove.replaceChildren();
  if (componendo.scelto === null) return;

  const blocchi = blocchiCorrenti();
  const b = testata ? null : blocchi[componendo.scelto];
  if (!testata && !b) return;
  const tipo = testata ? null : (stato.schema.blocchi ?? {})[b.tipo];

  const vestitoDi = testata
    ? { colore: stato.dati?.titoloColore, font: stato.dati?.titoloFont, allinea: stato.dati?.titoloAllinea, dimensione: stato.dati?.titoloDimensione, anima: stato.dati?.titoloAnima }
    : b;

  const campoFoto = testata ? null : tipo?.campi.find((c) => c.tipo === "immagine");

  dove.append(
    el("span", { class: "tavolozza__etichetta" }, "Sezione scelta"),
    el("div", { class: "tavolozza__riga" }, [
      el("span", { class: "tavolozza__tipo" }, testata ? "Titolo della pagina" : tipo?.etichetta ?? b.tipo),
      campoFoto
        ? el(
            "button",
            {
              type: "button",
              title: "Scegli o cambia la fotografia",
              onclick: () => {
                fotoDestinazione = { indice: componendo.scelto };
                fotoInput?.click();
              },
            },
            b.dati?.[campoFoto.nome]?.url ? "Cambia foto…" : "Fotografia…",
          )
        : null,
      testata
        ? null
        : el(
            "button",
            { type: "button", class: "pericolo", title: "Togli questa sezione", onclick: () => togliSezione(componendo.scelto) },
            "Elimina",
          ),
    ]),
  );

  /* Testo alternativo della fotografia: chi non la vede (screen reader, o se
     l'immagine non carica) legge questo, e conta per la SEO. Va scritto,
     quindi c'è un campo: senza, tutte le foto restano senza descrizione. */
  if (campoFoto && b.dati?.[campoFoto.nome]?.url) {
    const indice = componendo.scelto;
    const attuale = b.dati[campoFoto.nome] ?? {};
    const alt = el("input", {
      type: "text",
      class: "tavolozza__font",
      placeholder: "Cosa mostra la foto (es. «Ingresso dello studio»)",
      value: attuale.alt ?? "",
      title: "Descrizione della fotografia, per chi non la vede e per Google",
    });
    alt.addEventListener("change", () =>
      impostaBloccoDati(indice, {
        [campoFoto.nome]: { ...(blocchiCorrenti()[indice]?.dati?.[campoFoto.nome] ?? {}), alt: alt.value.trim() },
      }));
    dove.append(el("span", { class: "tavolozza__etichetta" }, "Testo alternativo"), alt);
  }

  /* Il collegamento si governa da qui: dove porta, verso quale delle tue
     pagine, o verso una pagina NUOVA. */
  if (!testata && b.tipo === "collegamento") {
    const dati = b.dati ?? {};
    const indice = componendo.scelto;

    const parola = el("input", {
      type: "text",
      class: "tavolozza__font",
      placeholder: "La scritta sul collegamento",
      value: dati.testo ?? "",
      title: "Le parole che si leggono",
    });
    parola.addEventListener("change", () => impostaBloccoDati(indice, { testo: parola.value.trim() }));

    const indirizzo = el("input", {
      type: "text",
      class: "tavolozza__font",
      placeholder: "/pagina oppure https://…",
      value: dati.url ?? "",
      title: "L'indirizzo a cui porta il collegamento",
    });
    indirizzo.addEventListener("change", () => impostaBloccoDati(indice, { url: indirizzo.value.trim() }));

    const versoPagina = el("select", {
      class: "tavolozza__font",
      title: "Oppure scegli una delle tue pagine",
      onchange: (e) => {
        if (!e.target.value) return;
        impostaBloccoDati(indice, { url: e.target.value, testo: dati.testo || e.target.value });
      },
    });
    versoPagina.append(el("option", { value: "" }, "— le tue pagine —"));
    slugsPagine().then((percorsi) => {
      for (const p of percorsi) versoPagina.append(el("option", { value: p }, p));
    });

    dove.append(
      el("span", { class: "tavolozza__etichetta" }, "Collegamento"),
      parola,
      el("span", { class: "tavolozza__etichetta" }, "Dove porta"),
      indirizzo,
      versoPagina,
    );
  }

  /* La forma decorativa: figura e colori, dalle scelte dello schema. */
  if (!testata && b.tipo === "forma") {
    const dati = b.dati ?? {};
    const indice = componendo.scelto;
    const campi = stato.schema.blocchi?.forma?.campi ?? [];
    for (const campo of campi) {
      const sel = el("select", {
        class: "tavolozza__font",
        onchange: (e) => impostaBloccoDati(indice, { [campo.nome]: e.target.value }),
      });
      for (const o of campo.opzioni ?? []) {
        const opt = el("option", { value: o.valore }, o.etichetta);
        if ((dati[campo.nome] ?? campo.predefinito ?? "") === o.valore) opt.selected = true;
        sel.append(opt);
      }
      dove.append(el("span", { class: "tavolozza__etichetta" }, campo.etichetta), sel);
    }
  }

  /* Allineamento del testo: vale anche per il titolo della pagina. */
  dove.append(
    el("span", { class: "tavolozza__etichetta" }, "Allineamento"),
    el(
      "div",
      { class: "tavolozza__riga tavolozza__allinea" },
      [
        ["sinistra", "Sinistra"],
        ["centro", "Centro"],
        ["destra", "Destra"],
      ].map(([valore, nome]) =>
        el(
          "button",
          {
            type: "button",
            class: (vestitoDi?.allinea ?? "") === valore ? "attivo" : null,
            onclick: () => vesti(componendo.scelto, { allinea: valore }),
          },
          nome,
        ),
      ),
    ),
  );

  /* Grandezza del carattere: un fattore sul corpo del testo, per la sezione o
     il titolo. Si applica subito, come colore e carattere. (La grandezza della
     CASELLA si cambia trascinando i bordi della sezione sul foglio.) */
  const dimOra = Number(vestitoDi?.dimensione) || 1;
  dove.append(
    el("span", { class: "tavolozza__etichetta" }, "Grandezza del testo"),
    el(
      "div",
      { class: "tavolozza__riga tavolozza__grandezza" },
      [
        [0.8, "S", "Piccolo"],
        [1, "M", "Normale"],
        [1.35, "L", "Grande"],
        [1.8, "XL", "Molto grande"],
        [2.4, "XXL", "Enorme"],
      ].map(([valore, sigla, titolo]) =>
        el(
          "button",
          {
            type: "button",
            title: titolo,
            class: Math.abs(dimOra - valore) < 0.001 ? "attivo" : null,
            onclick: () => vesti(componendo.scelto, { dimensione: valore }),
          },
          sigla,
        ),
      ),
    ),
  );

  /* Colore e carattere: si applicano SUBITO, senza passare dal server — si
     sceglie a occhio, e ricaricare a ogni tentativo renderebbe cieca la scelta. */
  const colori = stato.schema.colori ?? [];
  if (colori.length) {
    dove.append(
      el("span", { class: "tavolozza__etichetta" }, "Colore del testo"),
      el(
        "div",
        { class: "tavolozza__colori" },
        colori.map((c) =>
          el(
            "button",
            {
              type: "button",
              class: "colore" + ((vestitoDi?.colore ?? "") === c.valore ? " attivo" : ""),
              title: c.etichetta,
              style: c.valore ? `background:${c.valore}` : null,
              onclick: () => vesti(componendo.scelto, { colore: c.valore }),
            },
            c.valore ? "" : "×",
          ),
        ),
      ),
    );
  }

  const caratteri = stato.schema.caratteri ?? [];
  if (caratteri.length) {
    const carattere = el("select", {
      class: "tavolozza__font",
      title: "Carattere di questa sezione",
      onchange: (e) => vesti(componendo.scelto, { font: e.target.value }),
    });
    for (const c of caratteri) {
      const o = el("option", { value: c.valore }, c.etichetta);
      if ((vestitoDi?.font ?? "") === c.valore) o.selected = true;
      carattere.append(o);
    }
    dove.append(el("span", { class: "tavolozza__etichetta" }, "Carattere"), carattere);
  }

  /* L'effetto d'ingresso: come la sezione (o il titolo) COMPARE quando la si
     raggiunge scorrendo. Si vede solo sul sito pubblicato. */
  const animazioni = stato.schema.animazioni ?? [];
  if (animazioni.length) {
    const anima = el("select", {
      class: "tavolozza__font",
      title: "Come compare scorrendo (solo sul sito pubblicato)",
      onchange: (e) => vesti(componendo.scelto, { anima: e.target.value }),
    });
    for (const a of animazioni) {
      const o = el("option", { value: a.valore }, a.etichetta);
      if ((vestitoDi?.anima ?? "") === a.valore) o.selected = true;
      anima.append(o);
    }
    dove.append(el("span", { class: "tavolozza__etichetta" }, "Effetto d'ingresso"), anima);
  }
}

/** Veste la sezione — colore, carattere, allineamento — e lo si vede subito. */
function vesti(indice, campi) {
  ricorda();
  let vestito;
  if (indice === "testata") {
    if (campi.colore !== undefined) stato.dati.titoloColore = campi.colore;
    if (campi.font !== undefined) stato.dati.titoloFont = campi.font;
    if (campi.allinea !== undefined) stato.dati.titoloAllinea = campi.allinea;
    if (campi.dimensione !== undefined) stato.dati.titoloDimensione = campi.dimensione;
    if (campi.anima !== undefined) stato.dati.titoloAnima = campi.anima;
    vestito = {
      colore: stato.dati.titoloColore,
      font: stato.dati.titoloFont,
      allinea: stato.dati.titoloAllinea,
      dimensione: stato.dati.titoloDimensione,
      anima: stato.dati.titoloAnima,
    };
  } else {
    const blocchi = [...blocchiCorrenti()];
    if (!blocchi[indice]) return;
    blocchi[indice] = { ...blocchi[indice], ...campi };
    stato.dati.blocchi = blocchi;
    vestito = blocchi[indice];
  }
  segnaSporco();

  const doc = document.getElementById("anteprima").contentDocument;
  const cella = doc?.querySelector(indice === "testata" ? "[data-testata]" : `[data-blocco="${indice}"]`);
  if (cella) {
    const pila = (stato.schema.caratteri ?? []).find((c) => c.valore === (vestito.font ?? ""))?.pila || "";
    cella.style.color = vestito.colore || "";
    cella.style.fontFamily = pila;
    cella.style.textAlign =
      vestito.allinea === "centro"
        ? "center"
        : vestito.allinea === "destra"
          ? "right"
          : vestito.allinea === "sinistra"
            ? "left"
            : "";
    if (vestito.colore || pila || vestito.allinea) cella.setAttribute("data-vestita", "");
    else cella.removeAttribute("data-vestita");
    const dim = Number(vestito.dimensione);
    if (Number.isFinite(dim) && dim !== 1 && dim >= 0.3 && dim <= 5) cella.style.setProperty("--scala", String(dim));
    else cella.style.removeProperty("--scala");
  }
  disegnaScelta();
}

/** Scrive nei dati di una sezione e fa il giro dal server: il markup nuovo lo
    sa costruire solo Blocchi.astro. */
async function impostaBloccoDati(indice, campi) {
  ricorda();
  const blocchi = [...blocchiCorrenti()];
  if (!blocchi[indice]) return;
  blocchi[indice] = { ...blocchi[indice], dati: { ...(blocchi[indice].dati ?? {}), ...campi } };
  stato.dati.blocchi = blocchi;
  segnaSporco();
  await salvaDocumento();
  ricaricaAnteprima();
}

/* Le sezioni si aggiungono dalla tavolozza, ma il risultato va COSTRUITO dal
   server: una sezione nuova è markup che questo file non sa produrre. Quindi
   si salva la bozza e si ricarica l'anteprima. */
async function aggiungiSezione(nome, tipo) {
  const massimo = stato.schema.maxBlocchi ?? 60;
  if (blocchiCorrenti().length >= massimo) return avviso(`Massimo ${massimo} sezioni.`, "errore");

  if (tipo.campi.some((c) => c.tipo === "immagine")) {
    fotoDestinazione = { nuovaDiTipo: nome };
    fotoInput?.click();
    return;
  }

  inserisciBlocco({ tipo: nome, dati: vuotoPerCampi(tipo.campi), larghezza: 12 });
  await salvaDocumento();
  ricaricaAnteprima();
}

/** Mette la sezione nuova al suo posto: dopo quella scelta, in fondo se non
    ce n'è. Sul foglio le dà anche un punto, scalato, così non si impilano. */
function inserisciBlocco(nuova) {
  ricorda();
  const blocchi = [...blocchiCorrenti()];

  if (stato.dati?.modo === "foglio") {
    const quante = blocchi.length;
    nuova.x = 6 + (quante % 6) * 3;
    nuova.y = 6 + (quante % 6) * 5;
    nuova.w = 40;
    nuova.h = 0;
  }

  const dove = typeof componendo.scelto === "number" ? componendo.scelto + 1 : blocchi.length;
  blocchi.splice(dove, 0, nuova);

  stato.dati.blocchi = blocchi;
  segnaSporco();
  componendo.scelto = dove;
  disegnaScelta();
}

function togliSezione(indice) {
  const blocchi = [...blocchiCorrenti()];
  const tipo = (stato.schema.blocchi ?? {})[blocchi[indice]?.tipo];
  if (!confirm(`Eliminare la sezione «${tipo?.etichetta ?? "senza nome"}»?`)) return;
  ricorda();
  blocchi.splice(indice, 1);
  stato.dati.blocchi = blocchi;
  segnaSporco();
  componendo.scelto = null;
  disegnaScelta();
  const doc = document.getElementById("anteprima").contentDocument;
  doc?.querySelector(`[data-blocco="${indice}"]`)?.remove();
  rinumera(doc);
}

/** Rimette i numeri d'ordine in fila dopo un'aggiunta o un'eliminazione. */
function rinumera(doc) {
  doc?.querySelectorAll("[data-blocco]").forEach((n, i) => {
    n.dataset.blocco = String(i);
  });
}

/* ══════════════════ la composizione dentro l'anteprima ══════════════════ */

const STILE_BARRA = `
  .barra-ricca {
    position: fixed; z-index: 99999; display: flex; gap: 2px;
    background: #17222a; padding: 4px; border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, .3);
  }
  .barra-ricca button {
    min-width: 30px; height: 30px; padding: 0 7px; border: 0;
    border-radius: 6px; background: transparent; color: #fff;
    cursor: pointer; font-size: 13px; line-height: 1;
  }
  .barra-ricca button:hover { background: #2f4b7c; }
  .barra-ricca .b-g { font-weight: 700; }
  .barra-ricca .b-c { font-style: italic; }
  @media (max-width: 700px) {
    .barra-ricca button { min-width: 40px; height: 40px; font-size: 15px; }
  }
`;

const STILE_COMPONIBILE =
  `
  .componibile { position: relative; outline: 1px dashed transparent; cursor: grab; }
  .componibile:hover { outline-color: #2f4b7c88; }
  .componibile.scelta-componi { outline: 2px solid #2f4b7c; outline-offset: 3px; }
  .componibile.in-viaggio { opacity: .4; }
  .componibile.bersaglio-prima { box-shadow: -4px 0 0 0 #2f4b7c; }
  .componibile.bersaglio-dopo  { box-shadow:  4px 0 0 0 #2f4b7c; }
  .presa-componi { position: absolute; z-index: 4; opacity: 0; }
  .componibile:hover .presa-componi { opacity: 1; }
  .presa--lato-destro { top: 0; right: -5px; width: 11px; height: 100%; cursor: ew-resize; }
  .presa--lato-basso  { left: 0; bottom: -5px; height: 11px; width: 100%; cursor: ns-resize; }
  .presa--angolo {
    right: -6px; bottom: -6px; width: 16px; height: 16px; z-index: 6;
    cursor: nwse-resize; border-radius: 3px;
    background: #2f4b7c; border: 2px solid #fff;
  }
  .presa--lato-destro::before {
    content: ""; position: absolute; top: 50%; right: 4px; width: 3px; height: 34px;
    margin-top: -17px; border-radius: 2px; background: #2f4b7c;
  }
  .presa--lato-basso::before {
    content: ""; position: absolute; left: 50%; bottom: 4px; height: 3px; width: 34px;
    margin-left: -17px; border-radius: 2px; background: #2f4b7c;
  }
  .componibile[data-misura]::after {
    content: attr(data-misura); position: absolute; top: 4px; right: 10px;
    background: #17222a; color: #fff; font-size: 12px; padding: 2px 6px;
    border-radius: 3px; z-index: 7;
  }
  .misurando { user-select: none; }
  .in-scrittura {
    outline: 2px solid #2f4b7c; outline-offset: 3px;
    cursor: text; background: #ffffff;
  }
  .componibile:has(.in-scrittura) { cursor: text; }
  [data-campo] { cursor: text; }
  [data-campo]:hover { outline: 1px dashed #2f4b7c88; outline-offset: 4px; }
  .invito { color: #8a97a1; font-style: italic; }
  .segnaposto-foto {
    display: flex; align-items: center; justify-content: center;
    min-height: 120px; height: 100%;
    border: 2px dashed #2f4b7c66; border-radius: 4px;
    color: #2f4b7c; font-size: 14px; background: #2f4b7c0d;
  }
` + STILE_BARRA;

const STILE_FOGLIO = `
  .foglio { outline: 1px dashed #2f4b7c55; }
  .posata { outline: 1px dashed transparent; cursor: move; }
  .posata:hover { outline-color: #2f4b7c88; }
  .posata.scelta-componi { outline: 2px solid #2f4b7c; outline-offset: 3px; }
  .posata.in-viaggio { opacity: .75; }
  .presa-componi { position: absolute; z-index: 4; opacity: 0; }
  .posata:hover .presa-componi { opacity: 1; }
  .presa--lato-destro { top: 0; right: -5px; width: 11px; height: 100%; cursor: ew-resize; }
  .presa--lato-basso  { left: 0; bottom: -5px; height: 11px; width: 100%; cursor: ns-resize; }
  .presa--angolo {
    right: -6px; bottom: -6px; width: 16px; height: 16px; z-index: 6;
    cursor: nwse-resize; border-radius: 3px;
    background: #2f4b7c; border: 2px solid #fff;
  }
  .presa--lato-destro::before {
    content: ""; position: absolute; top: 50%; right: 4px; width: 3px; height: 30px;
    margin-top: -15px; border-radius: 2px; background: #2f4b7c;
  }
  .presa--lato-basso::before {
    content: ""; position: absolute; left: 50%; bottom: 4px; height: 3px; width: 30px;
    margin-left: -15px; border-radius: 2px; background: #2f4b7c;
  }
  [data-misura]::after {
    content: attr(data-misura); position: absolute; top: 4px; right: 8px; z-index: 7;
    background: #17222a; color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 3px;
  }
  .misurando { user-select: none; }
  .fondo-foglio {
    position: absolute; left: 0; bottom: -7px; width: 100%; height: 14px;
    cursor: ns-resize; z-index: 3;
  }
  .fondo-foglio::before {
    content: ""; position: absolute; left: 50%; top: 5px; width: 60px; height: 4px;
    margin-left: -30px; border-radius: 2px; background: #2f4b7c;
  }
  .in-scrittura {
    outline: 2px solid #2f4b7c; outline-offset: 3px; cursor: text; background: #fff;
  }
  .guida-allineamento {
    position: absolute; z-index: 9; display: none; pointer-events: none;
    background: #d6367a;
  }
  .guida--v { top: 0; width: 1px; height: 100%; }
  .guida--h { left: 0; height: 1px; width: 100%; }
`;

/** Attacca alla pagina dentro l'iframe tutto quello che la rende componibile.
    Gira a ogni caricamento dell'anteprima: il documento è nuovo ogni volta,
    quindi non c'è niente da staccare. */
function collegaAnteprima() {
  if (!componendo.attivo) return;
  const cornice = document.getElementById("anteprima");
  const doc = cornice.contentDocument;
  if (!doc) return;

  const stile = doc.createElement("style");
  stile.textContent = STILE_COMPONIBILE;
  doc.head.append(stile);

  /* Comporre segue la navigazione: un collegamento del telaio (menu, testata)
     porta a comporre la pagina d'arrivo. I collegamenti DENTRO le sezioni non
     navigano — lì il clic sceglie la sezione. */
  doc.querySelectorAll("a").forEach((a) => {
    if (a.closest("[data-blocco], [data-testata]")) return;
    /* Un collegamento che contiene (o sta dentro) un testo modificabile non
       porta via: il doppio clic serve a scriverlo. */
    if (a.closest("[data-testo], [data-ricco], [data-lista]") || a.querySelector("[data-testo], [data-ricco], [data-foto]")) {
      a.addEventListener("click", (ev) => ev.preventDefault());
      return;
    }
    if (!(a.getAttribute("href") ?? "").startsWith("/")) return;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      seguiNavigazione(a.getAttribute("href"));
    });
  });

  /* Ogni pagina è a foglio libero: si aggancia il composer del foglio e i
     campi (titolo/sottotitolo) scrivibili sul posto. */
  if (collegaContenuti(doc)) return;
  if (doc.querySelector(".foglio")) collegaFoglio(doc);
  collegaCampiPagina(doc);
}

/* Anche il titolo e il sottotitolo della pagina, che non sono sezioni ma campi
   del documento: per chi guarda sono testo sulla pagina come il resto. */
function collegaCampiPagina(doc) {
  doc.querySelectorAll("[data-campo]").forEach((nodo) => {
    nodo.addEventListener("dblclick", () => {
      apriScrittura(doc, nodo, false, (testo) => {
        ricorda();
        stato.dati[nodo.dataset.campo] = testo;
        segnaSporco();
      });
    });
  });
}


/* ══════════ le pagine disegnate: testi, foto ed elenchi sul posto ══════════
 *
 * Le pagine fatte a mano (home, Lo studio, Aree, Contatti…) non hanno sezioni
 * da spostare: hanno un impaginato fisso e un CONTENUTO (testi, foto, elenchi)
 * che vive in `stato.dati.contenuto`. In composizione la pagina segna ogni
 * pezzo con `data-testo` / `data-ricco` / `data-foto` / `data-lista` +
 * `data-voce` (percorsi come "persone.elenco.0.nome") e allega il contenuto
 * intero in JSON (#contenuto-pagina). Qui lo si legge e ci si scrive.
 */

const leggiIn = (o, percorso) => percorso.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

function scriviIn(o, percorso, valore) {
  const pezzi = percorso.split(".");
  let x = o;
  for (let i = 0; i < pezzi.length - 1; i++) {
    const k = pezzi[i];
    if (x[k] == null || typeof x[k] !== "object") x[k] = /^\d+$/.test(pezzi[i + 1]) ? [] : {};
    x = x[k];
  }
  x[pezzi[pezzi.length - 1]] = valore;
}

function scriviContenuto(percorso, valore) {
  ricorda();
  if (!stato.dati.contenuto) stato.dati.contenuto = {};
  scriviIn(stato.dati.contenuto, percorso, valore);
  segnaSporco();
}

const STILE_CONTENUTI = `
  [data-testo], [data-ricco] { cursor: text; }
  [data-testo]:hover, [data-ricco]:hover { outline: 1px dashed rgba(224, 38, 47, .75); outline-offset: 4px; }
  [data-foto] { cursor: pointer; }
  [data-foto]:hover { outline: 2px dashed rgba(224, 38, 47, .95); outline-offset: -3px; }
  .in-scrittura { outline: 2px solid #e0262f !important; outline-offset: 4px; }
  .gesti-voce {
    position: absolute; z-index: 90; display: flex; gap: 2px; padding: 3px;
    background: #1d2024; border: 1px solid #c8101a; border-radius: 5px; box-shadow: 0 8px 22px rgba(0, 0, 0, .55);
  }
  .gesti-voce button {
    font: 600 12px/1 system-ui, "Segoe UI", sans-serif; color: #fff; background: transparent;
    border: 0; padding: 7px 9px; border-radius: 3px; cursor: pointer; white-space: nowrap;
  }
  .gesti-voce button:hover { background: #c8101a; }
  .gesti-voce button:disabled { opacity: .3; cursor: default; background: transparent; }
  .aggiungi-voce {
    font: 600 12px/1 system-ui, sans-serif; color: #fff; background: #c8101a; border: 0;
    padding: 8px 12px; border-radius: 4px; cursor: pointer; margin: .5rem 0;
  }
`;

/** Aggancia il contenuto della pagina disegnata, se c'è. Torna vero se la
    pagina è disegnata (e allora il foglio libero non c'entra). */
function collegaContenuti(doc) {
  const json = doc.getElementById("contenuto-pagina");
  const prima = componendo.disegnata;
  componendo.disegnata = Boolean(json);
  if (prima !== componendo.disegnata) disegnaTavolozza();
  if (!json) return false;

  /* La prima volta la bozza non ha ancora un contenuto: si parte da quello
     che la pagina mostra (i valori di partenza). */
  if (!stato.dati.contenuto) {
    try { stato.dati.contenuto = JSON.parse(json.textContent); } catch { stato.dati.contenuto = {}; }
  }

  const stile = doc.createElement("style");
  stile.textContent = STILE_CONTENUTI;
  doc.head.append(stile);

  doc.querySelectorAll("[data-testo], [data-ricco]").forEach((nodo) => {
    nodo.addEventListener("dblclick", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const ricco = nodo.hasAttribute("data-ricco");
      const percorso = ricco ? nodo.dataset.ricco : nodo.dataset.testo;
      /* La sigla con i punti colorati (G<i>.</i>D<i>.</i>…) si scrive come
         testo semplice: «G.D.D.». */
      apriScrittura(doc, nodo, ricco, (valore) => {
        const prima = leggiIn(stato.dati.contenuto, percorso);
        if (valore === (ricco ? prima : String(prima ?? "").trim())) return;
        scriviContenuto(percorso, valore);
        salvaDocumento();
      });
    });
  });

  doc.querySelectorAll("[data-foto]").forEach((img) => {
    img.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      fotoDestinazione = { contenuto: img.dataset.foto };
      fotoInput?.click();
    });
  });

  collegaElenchi(doc);
  return true;
}

/** Gli elenchi: passando sopra una voce compare una barretta per spostarla,
    duplicarla (è il modo di aggiungerne una) o toglierla. */
function collegaElenchi(doc) {
  let gesti = null;
  let attiva = null;
  const chiudi = () => { gesti?.remove(); gesti = null; attiva = null; };

  const operazione = async (lista, i, cosa) => {
    const arr = leggiIn(stato.dati.contenuto, lista);
    if (!Array.isArray(arr)) return;
    if (cosa === "togli" && !confirm("Togliere questa voce? (Si può annullare.)")) return;
    const nuovo = arr.slice();
    if (cosa === "su" && i > 0) [nuovo[i - 1], nuovo[i]] = [nuovo[i], nuovo[i - 1]];
    else if (cosa === "giu" && i < nuovo.length - 1) [nuovo[i + 1], nuovo[i]] = [nuovo[i], nuovo[i + 1]];
    else if (cosa === "duplica") nuovo.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i])));
    else if (cosa === "togli") nuovo.splice(i, 1);
    else return;
    chiudi();
    scriviContenuto(lista, nuovo);
    await salvaDocumento();
    ricaricaAnteprima();
  };

  const mostra = (voce) => {
    const contenitore = voce.parentElement?.closest("[data-lista]");
    if (!contenitore) return;
    chiudi();
    attiva = voce;
    const lista = contenitore.dataset.lista;
    const i = Number(voce.dataset.voce);
    const quante = (leggiIn(stato.dati.contenuto, lista) ?? []).length;
    gesti = doc.createElement("div");
    gesti.className = "gesti-voce";
    const bottone = (segno, titolo, cosa, spento) => {
      const b = doc.createElement("button");
      b.type = "button";
      b.textContent = segno;
      b.title = titolo;
      b.disabled = Boolean(spento);
      b.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); operazione(lista, i, cosa); });
      gesti.append(b);
    };
    bottone("↑", "Sposta prima", "su", i === 0);
    bottone("↓", "Sposta dopo", "giu", i >= quante - 1);
    bottone("＋ Aggiungi", "Aggiunge una voce uguale subito dopo: poi la si riscrive", "duplica");
    bottone("✕", "Togli questa voce", "togli");
    doc.body.append(gesti);
    const r = voce.getBoundingClientRect();
    const w = gesti.offsetWidth;
    gesti.style.top = `${Math.max(4, r.top + doc.defaultView.scrollY - 18)}px`;
    gesti.style.left = `${Math.max(4, r.right + doc.defaultView.scrollX - w)}px`;
  };

  doc.addEventListener("mouseover", (ev) => {
    if (ev.target.closest?.(".gesti-voce")) return;
    const voce = ev.target.closest?.("[data-voce]");
    if (voce && voce !== attiva) mostra(voce);
  });
  doc.addEventListener("scroll", chiudi, { passive: true });

  /* Un elenco rimasto vuoto: un pulsante per rimettere la prima voce. */
  doc.querySelectorAll("[data-lista]").forEach((contenitore) => {
    const lista = contenitore.dataset.lista;
    const arr = leggiIn(stato.dati.contenuto, lista);
    if (Array.isArray(arr) && arr.length) return;
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "aggiungi-voce";
    b.textContent = "＋ Aggiungi una voce";
    b.addEventListener("click", async (ev) => {
      ev.preventDefault();
      scriviContenuto(lista, ["Nuova voce"]);
      await salvaDocumento();
      ricaricaAnteprima();
    });
    contenitore.after(b);
  });
}

/* ══════════════════ i dati dello studio (recapiti, orari…) ══════════════════ */

const CAMPI_STUDIO = [
  ["Lo studio", [
    ["nome", "Nome dello studio"],
    ["denominazione", "Denominazione completa (piè di pagina, note legali)"],
  ]],
  ["Indirizzo e orari", [
    ["via", "Via e numero civico"], ["cap", "CAP"], ["citta", "Città"], ["provincia", "Provincia"],
    ["orari", "Orari"],
  ]],
  ["Recapiti", [
    ["telefono", "Telefono"], ["cellulare", "Cellulare"], ["email", "Email (vuota = non mostrata)"],
    ["pec", "PEC"], ["pec2", "Seconda PEC"],
  ]],
  ["Come arrivare", [
    ["metro", "Metro"], ["treno", "Treno"], ["autobus", "Autobus"], ["accesso", "Accesso"],
  ]],
  ["Dati fiscali", [["partitaIva", "Partita IVA"], ["codiceFiscale", "Codice fiscale"]]],
  ["La fascia in fondo alle pagine", [
    ["invitoEtichetta", "Etichetta"], ["invitoFrase", "Frase"], ["invitoBottone", "Pulsante"],
  ]],
];

async function apriDatiStudio() {
  if (componendo.attivo) chiudiComponi();
  segnaServizioAttivo("Dati dello studio");
  const centro = document.getElementById("contenuto");
  const titolo = document.getElementById("titolo-schermata");
  const descr = document.getElementById("descrizione-schermata");
  if (titolo) titolo.textContent = "Dati dello studio";
  if (descr) descr.textContent = "Recapiti, indirizzo, orari e dati fiscali: compaiono in più pagine (home, Contatti, menu, piè di pagina). Si scrivono una volta qui.";

  let studio;
  try {
    studio = await api("/sito/studio");
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 8000);
    return;
  }
  const D = studio.dati ?? {};
  const campi = {};
  const gruppi = CAMPI_STUDIO.map(([nome, voci]) =>
    el("fieldset", { class: "aspetto__gruppo" }, [
      el("legend", { class: "aspetto__etichetta" }, nome),
      ...voci.map(([k, etichetta]) => {
        const inp = el("input", { type: "text", value: String(D[k] ?? "") });
        campi[k] = inp;
        return el("label", { class: "aspetto__campo" }, [etichetta, inp]);
      }),
    ]),
  );
  const statoEl = el("span", { class: "aspetto__stato" }, studio.daPubblicare ? "Modifiche non pubblicate" : "");
  const raccogli = () => {
    const dati = { ...D };
    for (const [k, inp] of Object.entries(campi)) dati[k] = inp.value.trim();
    return dati;
  };
  const salva = async () => {
    statoEl.textContent = "Salvataggio…";
    await api("/sito/studio", { method: "PUT", body: JSON.stringify({ dati: raccogli() }) });
    statoEl.textContent = "Salvato in bozza";
  };
  centro.replaceChildren(
    el("div", { class: "aspetto" }, [
      el("div", { class: "aspetto__campi" }, gruppi),
      el("div", { class: "aspetto__azioni" }, [
        statoEl,
        el("button", { type: "button", onclick: async () => {
          try { await salva(); avviso("Dati salvati in bozza. «Pubblica» per metterli online."); } catch (e) { avviso(messaggioErrore(e), "errore", 8000); }
        } }, "Salva"),
        el("button", { type: "button", class: "principale", onclick: async () => {
          try {
            await salva();
            await api("/sito/studio", { method: "POST", body: JSON.stringify({ azione: "pubblica" }) });
            statoEl.textContent = "Pubblicato";
            avviso("Dati dello studio pubblicati: valgono su tutto il sito.");
          } catch (e) { avviso(messaggioErrore(e), "errore", 8000); }
        } }, "Pubblica"),
      ]),
    ]),
  );
}

/* ══════════════════ il foglio libero, dentro l'anteprima ══════════════════ */

function collegaFoglio(doc) {
  const foglio = doc.querySelector(".foglio");

  const stile = doc.createElement("style");
  stile.textContent = STILE_FOGLIO;
  doc.head.append(stile);

  const inCento = (px) => (px / foglio.getBoundingClientRect().width) * 100;
  const inCentoY = (px) => (px / foglio.getBoundingClientRect().height) * 100;

  const lineeDiAggancio = (esclusa) => {
    const f = foglio.getBoundingClientRect();
    const X = [0, 50, 100];
    const Y = [0, 50, 100];
    doc.querySelectorAll("[data-blocco], [data-testata]").forEach((c) => {
      if (c === esclusa) return;
      const r = c.getBoundingClientRect();
      const sx = ((r.left - f.left) / f.width) * 100;
      const dx = ((r.right - f.left) / f.width) * 100;
      const sy = ((r.top - f.top) / f.height) * 100;
      const gy = ((r.bottom - f.top) / f.height) * 100;
      X.push(sx, (sx + dx) / 2, dx);
      Y.push(sy, (sy + gy) / 2, gy);
    });
    return { X, Y };
  };

  const aggancia = (ancore, linee, tolleranza) => {
    let migliore = null;
    for (const a of ancore) {
      for (const l of linee) {
        const d = Math.abs(a - l);
        if (d <= tolleranza && (!migliore || d < migliore.d)) {
          migliore = { d, linea: l, scarto: l - a };
        }
      }
    }
    return migliore;
  };

  const guidaV = doc.createElement("span");
  guidaV.className = "guida-allineamento guida--v";
  const guidaH = doc.createElement("span");
  guidaH.className = "guida-allineamento guida--h";
  foglio.append(guidaV, guidaH);

  const scrivi = (cella, campi) => {
    ricorda();
    if (cella.hasAttribute("data-testata")) {
      if (campi.x !== undefined) stato.dati.titoloX = campi.x;
      if (campi.y !== undefined) stato.dati.titoloY = campi.y;
      if (campi.w !== undefined) stato.dati.titoloW = campi.w;
      segnaSporco();
      return;
    }
    const blocchi = [...blocchiCorrenti()];
    const i = Number(cella.dataset.blocco);
    if (!blocchi[i]) return;
    blocchi[i] = { ...blocchi[i], ...campi };
    stato.dati.blocchi = blocchi;
    segnaSporco();
  };

  const trascina = (cella, ev) => {
    const r = cella.getBoundingClientRect();
    const scarto = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    const f = foglio.getBoundingClientRect();
    const wPct = (r.width / f.width) * 100;
    const hPct = (r.height / f.height) * 100;
    const linee = lineeDiAggancio(cella);
    const tolX = (8 / f.width) * 100;
    const tolY = (8 / f.height) * 100;
    cella.classList.add("in-viaggio");

    let mosso = false;

    const muovi = (e) => {
      mosso = true;
      let x = inCento(e.clientX - scarto.x - f.left);
      let y = inCentoY(e.clientY - scarto.y - f.top);

      guidaV.style.display = guidaH.style.display = "none";
      if (!e.altKey) {
        const ax = aggancia([x, x + wPct / 2, x + wPct], linee.X, tolX);
        if (ax) {
          x += ax.scarto;
          guidaV.style.left = `${ax.linea}%`;
          guidaV.style.display = "block";
        }
        const ay = aggancia([y, y + hPct / 2, y + hPct], linee.Y, tolY);
        if (ay) {
          y += ay.scarto;
          guidaH.style.top = `${ay.linea}%`;
          guidaH.style.display = "block";
        }
      }

      cella.style.setProperty("--x", x.toFixed(2));
      cella.style.setProperty("--y", y.toFixed(2));
      cella.dataset.misura = `${Math.round(x)} , ${Math.round(y)}`;
    };
    const su = () => {
      doc.removeEventListener("mousemove", muovi);
      doc.removeEventListener("mouseup", su);
      cella.classList.remove("in-viaggio");
      guidaV.style.display = guidaH.style.display = "none";
      delete cella.dataset.misura;
      if (!mosso) return;
      scrivi(cella, {
        x: Number(cella.style.getPropertyValue("--x")) || 0,
        y: Number(cella.style.getPropertyValue("--y")) || 0,
      });
    };
    doc.addEventListener("mousemove", muovi);
    doc.addEventListener("mouseup", su);
  };

  const indiceDi = (c) => (c.hasAttribute("data-testata") ? "testata" : Number(c.dataset.blocco));

  doc.querySelectorAll("[data-blocco], [data-testata]").forEach((cella) => {
    cella.classList.add("posata");
    const eTestata = cella.hasAttribute("data-testata");

    cella.addEventListener("click", (ev) => {
      ev.preventDefault();

      const pila = [...doc.querySelectorAll("[data-blocco], [data-testata]")]
        .filter((c) => {
          const r = c.getBoundingClientRect();
          return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        })
        .reverse();
      const giaScelta = pila.findIndex((c) => c.classList.contains("scelta-componi"));
      const prossima = pila[(giaScelta + 1) % pila.length] ?? cella;

      doc.querySelectorAll(".scelta-componi").forEach((n) => n.classList.remove("scelta-componi"));
      prossima.classList.add("scelta-componi");
      componendo.scelto = indiceDi(prossima);
      disegnaScelta();
    });

    if (!eTestata) {
      cella.addEventListener("dblclick", (ev) => {
        const scelta = doc.querySelector(".scelta-componi");
        if (scelta && scelta !== cella) {
          const r = scelta.getBoundingClientRect();
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
            if (scelta.hasAttribute("data-testata")) {
              const campo = scelta.querySelector('[data-campo="titolo"]');
              if (campo) {
                apriScrittura(doc, campo, false, (testo) => {
                  ricorda();
                  stato.dati[campo.dataset.campo] = testo;
                  segnaSporco();
                });
              }
              return;
            }
            return scriviDentro(ev, doc, scelta);
          }
        }
        scriviDentro(ev, doc, cella);
      });
    }

    cella.addEventListener("mousedown", (ev) => {
      if (ev.detail > 1 || ev.target.closest(".presa-componi")) return;
      if (ev.target.isContentEditable) return;
      // I campi di un modulo di contatto restano usabili: premerci sopra non
      // deve trascinare la sezione (e preventDefault gli toglierebbe il fuoco).
      if (ev.target.closest("input, textarea, select, button")) return;
      ev.preventDefault();

      let bersaglio = cella;
      const sceltaOra = doc.querySelector(".scelta-componi");
      if (sceltaOra && sceltaOra !== cella) {
        const rs = sceltaOra.getBoundingClientRect();
        if (ev.clientX >= rs.left && ev.clientX <= rs.right && ev.clientY >= rs.top && ev.clientY <= rs.bottom) {
          bersaglio = sceltaOra;
        }
      }
      trascina(bersaglio, ev);
    });

    for (const [classe, titolo, tocca] of eTestata
      ? [["lato-destro", "Trascina per la larghezza", { x: true, y: false }]]
      : [
          ["lato-destro", "Trascina per la larghezza", { x: true, y: false }],
          ["lato-basso", "Trascina per l'altezza", { x: false, y: true }],
          ["angolo", "Trascina in diagonale", { x: true, y: true }],
        ]) {
      const presa = doc.createElement("span");
      presa.className = `presa-componi presa--${classe}`;
      presa.title = titolo;
      cella.append(presa);

      presa.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const r = cella.getBoundingClientRect();
        const f = foglio.getBoundingClientRect();
        const xSin = Number(cella.style.getPropertyValue("--x")) || 0;
        const linee = lineeDiAggancio(cella);
        const tolX = (8 / f.width) * 100;
        cella.classList.add("misurando");

        const muovi = (e) => {
          if (tocca.x) {
            let w = Math.max(3, inCento(e.clientX - r.left));
            guidaV.style.display = "none";
            if (!e.altKey) {
              const a = aggancia([xSin + w], linee.X, tolX);
              if (a) {
                w = Math.max(3, w + a.scarto);
                guidaV.style.left = `${a.linea}%`;
                guidaV.style.display = "block";
              }
            }
            cella.style.setProperty("--w", w.toFixed(2));
          }
          if (tocca.y) {
            const h = inCento(e.clientY - r.top);
            cella.style.setProperty("--h", h < 3 ? "0" : h.toFixed(2));
          }
          cella.dataset.misura = `${Math.round(Number(cella.style.getPropertyValue("--w")) || 0)} di larghezza`;
        };
        const su = () => {
          doc.removeEventListener("mousemove", muovi);
          doc.removeEventListener("mouseup", su);
          cella.classList.remove("misurando");
          guidaV.style.display = "none";
          delete cella.dataset.misura;
          scrivi(cella, {
            w: Number(cella.style.getPropertyValue("--w")) || 40,
            h: Number(cella.style.getPropertyValue("--h")) || 0,
          });
        };
        doc.addEventListener("mousemove", muovi);
        doc.addEventListener("mouseup", su);
      });
    }
  });

  const fondo = doc.createElement("span");
  fondo.className = "fondo-foglio";
  fondo.title = "Trascina per allungare o accorciare il foglio";
  foglio.append(fondo);

  fondo.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const f = foglio.getBoundingClientRect();
    foglio.classList.add("misurando");

    const muovi = (e) => {
      const rap = Math.max(20, Math.min(400, inCento(e.clientY - f.top)));
      foglio.style.setProperty("--rap", rap.toFixed(1));
      foglio.dataset.misura = `altezza ${Math.round(rap)}`;
    };
    const su = () => {
      doc.removeEventListener("mousemove", muovi);
      doc.removeEventListener("mouseup", su);
      foglio.classList.remove("misurando");
      delete foglio.dataset.misura;
      ricorda();
      stato.dati.altezzaFoglio = Math.round(Number(foglio.style.getPropertyValue("--rap")) || 70);
      segnaSporco();
    };
    doc.addEventListener("mousemove", muovi);
    doc.addEventListener("mouseup", su);
  });

  ripristinaScelta(doc);
}

/* Dopo ogni ricarica dell'anteprima la sezione scelta perde il contorno:
   `componendo.scelto` resta in memoria, ma il documento è nuovo. Le si rimette
   il segno, così un colore cambiato non fa «saltare via» la selezione. */
function ripristinaScelta(doc) {
  if (componendo.scelto === null || componendo.scelto === undefined) return;
  const nodo =
    componendo.scelto === "testata"
      ? doc.querySelector("[data-testata]")
      : doc.querySelector(`[data-blocco="${componendo.scelto}"]`);
  if (nodo) nodo.classList.add("scelta-componi");
}

/* ─────────────────── scrivere sul foglio, non nel modulo ────────────────── */

const TESTI = {
  titolo: [{ sel: "h2", campo: "testo", ricco: false }],
  collegamento: [{ sel: "a", campo: "testo", ricco: false }],
  testo: [{ sel: ".prosa", campo: "html", ricco: true }],
  immagine: [{ sel: "figcaption", campo: "didascalia", ricco: false }],
  immagineTesto: [{ sel: ".prosa", campo: "html", ricco: true }],
  citazione: [
    { sel: "blockquote", campo: "testo", ricco: false },
    { sel: "figcaption", campo: "fonte", ricco: false },
  ],
  modulo: [
    { sel: ".modulo__titolo", campo: "titolo", ricco: false },
    { sel: ".modulo__intro", campo: "introduzione", ricco: true },
  ],
};

function scriviDentro(ev, doc, cella) {
  if (ev.target.closest(".segnaposto-foto")) {
    fotoDestinazione = { indice: Number(cella.dataset.blocco) };
    fotoInput?.click();
    return;
  }

  const pezzi = TESTI[cella.dataset.tipo];
  if (!pezzi) return avviso("Questa sezione si scrive dalla tavolozza.", "ok", 5000);

  const scelto = pezzi.find((p) => ev.target.closest(p.sel));
  const pezzo = scelto ?? pezzi[0];
  const nodo = ev.target.closest(pezzo.sel) ?? cella.querySelector(pezzo.sel);
  if (!nodo) return;

  apriScrittura(doc, nodo, pezzo.ricco, (valore) => {
    ricorda();
    const blocchi = [...blocchiCorrenti()];
    const i = Number(cella.dataset.blocco);
    if (!blocchi[i]) return;
    blocchi[i] = { ...blocchi[i], dati: { ...(blocchi[i].dati ?? {}), [pezzo.campo]: valore } };
    stato.dati.blocchi = blocchi;
    segnaSporco();
  });
}

function apriScrittura(doc, nodo, ricco, salva) {
  const celle = [...doc.querySelectorAll("[data-blocco]")];
  celle.forEach((c) => {
    c.draggable = false;
  });

  nodo.querySelectorAll(".invito").forEach((n) => n.remove());

  nodo.contentEditable = "true";
  nodo.classList.add("in-scrittura");
  nodo.focus();

  const chiudi = () => {
    if (scritturaSospesa) return;
    chiudiBarraRicca();
    nodo.contentEditable = "false";
    nodo.classList.remove("in-scrittura");
    nodo.removeEventListener("blur", chiudi);
    nodo.removeEventListener("keydown", tasti);
    celle.forEach((c) => {
      c.draggable = true;
    });
    salva(ricco ? nodo.innerHTML : nodo.textContent.trim());
  };
  const tasti = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      nodo.blur();
    }
    if (e.key === "Enter" && !ricco) {
      e.preventDefault();
      nodo.blur();
    }
  };
  nodo.addEventListener("blur", chiudi);
  nodo.addEventListener("keydown", tasti);
  if (ricco) apriBarraRicca(doc, nodo);
}

/* ═══════════════════ la barretta della scrittura ricca ═══════════════════ */

function chiudiBarraRicca() {
  barraRicca?.remove();
  barraRicca = null;
}

function apriBarraRicca(doc, nodo) {
  chiudiBarraRicca();
  const barra = doc.createElement("div");
  barra.className = "barra-ricca";

  const bottone = (segno, classe, titolo, fai) => {
    const b = doc.createElement("button");
    b.type = "button";
    b.textContent = segno;
    if (classe) b.className = classe;
    b.title = titolo;
    b.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      fai();
    });
    barra.append(b);
  };

  bottone("G", "b-g", "Grassetto", () => doc.execCommand("bold"));
  bottone("C", "b-c", "Corsivo", () => doc.execCommand("italic"));
  bottone("•", "", "Elenco puntato", () => doc.execCommand("insertUnorderedList"));
  bottone("1.", "", "Elenco numerato", () => doc.execCommand("insertOrderedList"));
  bottone("Link", "", "Collegamento sulle parole selezionate (svuota l'indirizzo per toglierlo)", () => {
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      return avviso("Seleziona prima le parole da trasformare in collegamento.");
    }
    const raggio = sel.getRangeAt(0).cloneRange();
    const dentro = (sel.anchorNode?.parentElement ?? null)?.closest?.("a");
    scritturaSospesa = true;
    const url = prompt("Dove porta il collegamento? (/pagina oppure https://…)", dentro?.getAttribute("href") ?? "");
    scritturaSospesa = false;
    nodo.focus();
    sel.removeAllRanges();
    sel.addRange(raggio);
    if (url === null) return;
    const u = url.trim();
    if (u === "") { doc.execCommand("unlink"); return; }
    /* Solo indirizzi sicuri: http(s)/mailto/tel o percorsi interni. Uno schema
       come javascript: resterebbe nell'HTML e si eseguirebbe nel browser di
       chi visita il sito. */
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(https?:|mailto:|tel:)/i.test(u)) {
      return avviso("Indirizzo non ammesso: usa http(s), mailto:, tel: o /una-pagina.", "errore");
    }
    doc.execCommand("createLink", false, u);
  });
  bottone("Foto", "", "Inserisci una fotografia nel punto in cui stai scrivendo", () => {
    const sel = doc.getSelection();
    const raggio = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    scritturaSospesa = true;
    fotoDestinazione = { dentroRicco: { nodo, raggio } };
    fotoInput?.click();
  });

  doc.body.append(barra);
  const posiziona = () => {
    const r = nodo.getBoundingClientRect();
    barra.style.top = Math.max(8, r.top - 42) + "px";
    barra.style.left = Math.max(8, r.left) + "px";
  };
  posiziona();
  doc.addEventListener("scroll", posiziona, { passive: true });
  barraRicca = barra;
}

/** Scrive il campo ricco a cui `nodo` appartiene, nei dati della sua sezione. */
function scriviCampoRicco(nodo) {
  const ricco = nodo.closest("[data-ricco]");
  if (ricco && !nodo.closest("[data-blocco]")) {
    scriviContenuto(ricco.dataset.ricco, ricco.innerHTML);
    return;
  }
  const cella = nodo.closest("[data-blocco]");
  if (!cella) return;
  const pezzo = (TESTI[cella.dataset.tipo] ?? []).find((x) => x.ricco && nodo.matches(x.sel));
  if (!pezzo) return;
  ricorda();
  const blocchi = [...blocchiCorrenti()];
  const i = Number(cella.dataset.blocco);
  if (!blocchi[i]) return;
  blocchi[i] = { ...blocchi[i], dati: { ...(blocchi[i].dati ?? {}), [pezzo.campo]: nodo.innerHTML } };
  stato.dati.blocchi = blocchi;
  segnaSporco();
}

/* ══════════════════════════ avvio ══════════════════════════ */

window.addEventListener("beforeunload", (e) => {
  if (stato.sporco) {
    e.preventDefault();
    e.returnValue = "";
  }
});

function tastiGlobali(e) {
  if (!componendo.attivo) return;
  if ((e.metaKey || e.ctrlKey) && e.key === "z") {
    if (e.target?.isContentEditable) return;
    e.preventDefault();
    annulla();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    if (stato.sporco) salvaDocumento();
  }
  if (e.key === "Escape") chiudiComponi();
}
document.addEventListener("keydown", tastiGlobali);

/* Al caricamento dell'anteprima: la si rende componibile, e le scorciatoie
   valgono anche DENTRO l'iframe — chi compone ha il puntatore là. */
document.getElementById("anteprima").addEventListener("load", () => {
  collegaAnteprima();
  const doc = document.getElementById("anteprima").contentDocument;
  doc?.addEventListener("keydown", tastiGlobali);
});

/* ══════════════════════════ la procedura guidata ══════════════════════════
 *
 * Solo al primo avvio di un sito nuovo: pochi passi necessari — aspetto, nome,
 * allineamento del menu — poi si entra nell'editor. Tutto qui è già scelto in
 * «Aspetto e testo»: la guida è solo un percorso ordinato per chi comincia. */
const CHIAVI_EXTRA_TEMA = ["carta2", "cartaScura", "linea", "lineaForte", "inchiostro2", "tenue", "suScuro"];

function avviaProcedura() {
  const temi = stato.schema.temi ?? [];
  const caratteri = stato.schema.caratteri ?? [];
  const pila = (k) => caratteri.find((c) => c.valore === k)?.pila || "";
  let temaScelto = temi[0] ?? null;
  let menuAllinea = "destra";

  const campoNome = el("input", { type: "text", class: "proc__campo", placeholder: "Es. Studio Legale Bianchi" });
  const campoSotto = el("input", { type: "text", class: "proc__campo", placeholder: "Es. Diritto civile e del lavoro (facoltativo)" });

  // Passo 1 — l'aspetto (le carte-tema)
  const grigliaTemi = el(
    "div",
    { class: "temi__griglia" },
    temi.map((t) =>
      el(
        "button",
        {
          type: "button",
          class: "tema-carta" + (t === temaScelto ? " tema-carta--scelto" : ""),
          title: t.descrizione,
          onclick: (e) => {
            temaScelto = t;
            grigliaTemi.querySelectorAll(".tema-carta").forEach((c) => c.classList.remove("tema-carta--scelto"));
            e.currentTarget.classList.add("tema-carta--scelto");
          },
        },
        [
          el("span", { class: "tema-carta__mostra", style: `background:${t.carta}` }, [
            el("span", { class: "tema-carta__aa", style: `color:${t.inchiostro};font-family:${pila(t.fontTitoli)}` }, "Aa"),
            el("span", { class: "tema-carta__punto", style: `background:${t.accento}` }),
          ]),
          el("span", { class: "tema-carta__nome" }, t.nome),
        ],
      ),
    ),
  );
  const passo1 = el("div", { class: "proc__passo" }, [
    el("h2", {}, "Scegli un aspetto"),
    el("p", { class: "proc__aiuto" }, "Colori e caratteri coordinati. Potrai cambiarli quando vuoi."),
    grigliaTemi,
  ]);

  // Passo 2 — nome, sottotitolo, allineamento menu
  const sceltaMenu = el(
    "div",
    { class: "proc__segmento" },
    [
      ["sinistra", "A sinistra"],
      ["centro", "Al centro"],
      ["destra", "A destra"],
    ].map(([v, nome]) =>
      el(
        "button",
        {
          type: "button",
          class: v === menuAllinea ? "attivo" : null,
          onclick: (e) => {
            menuAllinea = v;
            [...e.currentTarget.parentNode.children].forEach((b) => b.classList.toggle("attivo", b === e.currentTarget));
          },
        },
        nome,
      ),
    ),
  );
  const passo2 = el("div", { class: "proc__passo", hidden: true }, [
    el("h2", {}, "Il tuo sito"),
    el("label", { class: "proc__riga" }, ["Nome del sito", campoNome]),
    el("label", { class: "proc__riga" }, ["Sottotitolo in testata", campoSotto]),
    el("div", { class: "proc__riga" }, ["Menu del sito allineato…", sceltaMenu]),
  ]);

  const indicatore = el("div", { class: "proc__passi" }, [
    el("span", { class: "attivo" }),
    el("span", {}),
  ]);

  let passo = 1;
  const mostra = () => {
    passo1.hidden = passo !== 1;
    passo2.hidden = passo !== 2;
    [...indicatore.children].forEach((p, i) => p.classList.toggle("attivo", i === passo - 1));
    btnIndietro.hidden = passo === 1;
    btnAvanti.hidden = passo === 2;
    btnCrea.hidden = passo !== 2;
  };

  const chiudi = () => velo.remove();

  const finisci = async (conTema) => {
    const t = temaScelto;
    const valori = {
      tema: conTema && t
        ? {
            accento: t.accento, inchiostro: t.inchiostro, carta: t.carta,
            fontTitoli: t.fontTitoli, fontTesto: t.fontTesto, sfondoTipo: "tinta",
            ...Object.fromEntries(CHIAVI_EXTRA_TEMA.map((k) => [k, t[k] || ""])),
          }
        : {},
      layout: { menuAllinea, testataSottotitolo: campoSotto.value.trim(), piePagina: "" },
      impostazioni: { nome: campoNome.value.trim() || "Il mio sito", configurato: true },
    };
    btnCrea.disabled = true;
    btnCrea.textContent = "Creo il sito…";
    try {
      await pubblicaAspetto(valori, null);
      document.getElementById("nome-sito").textContent = valori.impostazioni.nome;
      chiudi();
      disegnaServizi();
      await disegnaMappa();
      avviso("Sito pronto. Ora aggiungi le pagine e componile.");
    } catch (e) {
      btnCrea.disabled = false;
      btnCrea.textContent = "Crea il sito";
      avviso(messaggioErrore(e), "errore", 8000);
    }
  };

  const btnSalta = el("button", { type: "button", class: "proc__salta", onclick: () => finisci(false) }, "Salta");
  const btnIndietro = el("button", { type: "button", class: "proc__indietro", hidden: true, onclick: () => { passo = 1; mostra(); } }, "‹ Indietro");
  const btnAvanti = el("button", { type: "button", class: "proc__avanti principale", onclick: () => { passo = 2; mostra(); } }, "Avanti ›");
  const btnCrea = el("button", { type: "button", class: "proc__crea principale", hidden: true, onclick: () => finisci(true) }, "Crea il sito");

  const velo = el("div", { class: "proc__velo" }, [
    el("div", { class: "proc" }, [
      el("div", { class: "proc__testa" }, [
        el("strong", {}, "Diamo forma al tuo sito"),
        indicatore,
      ]),
      passo1,
      passo2,
      el("div", { class: "proc__azioni" }, [btnSalta, el("span", { class: "proc__spazio" }), btnIndietro, btnAvanti, btnCrea]),
    ]),
  ]);
  document.body.append(velo);
  mostra();
  setTimeout(() => campoNome.focus?.(), 50);
}

document.getElementById("esci").addEventListener("click", async () => {
  await fetch(API + "/esci", { method: "POST" });
  location.href = "/";
});

(async function avvia() {
  try {
    stato.schema = await api("/schema");
    document.getElementById("nome-sito").textContent = stato.schema.titoloSito;
    disegnaServizi();
    await disegnaMappa();
    /* Se l'URL nomina una pagina (#/percorso) — un ricaricamento mentre si
       componeva — la si riapre dov'era, invece di restare sull'albero. */
    const inUrl = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (inUrl.startsWith("/") && (stato.percorsi ?? []).includes(inUrl)) {
      await apriPagina(inUrl);
    } else {
      /* Sito NUOVO (mai configurato e con la sola home): si offre la procedura
         guidata. Un sito già avviato — con più pagine o già configurato — non
         la vede mai. */
      try {
        const imp = await api("/sito/impostazioni");
        const configurato = Boolean(imp.dati && imp.dati.configurato);
        if (!configurato && (stato.percorsi?.length ?? 0) <= 1) avviaProcedura();
      } catch {
        /* silenzioso: se non si riesce a capire, non si disturba con la guida. */
      }
    }
  } catch (e) {
    avviso(messaggioErrore(e), "errore", 0);
  }
})();
