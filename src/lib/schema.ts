/**
 * Motore di schema — parte generalista, non contiene nulla di specifico
 * al cliente. Per un nuovo progetto si riscrive solo `content-model.ts`.
 */

export type TipoCampo =
  | "testo"
  | "testoLungo"
  | "ricco"
  | "numero"
  | "booleano"
  | "data"
  | "scelta"
  | "immagine"
  | "gruppo"
  | "lista"
  | "blocchi";

export interface Campo {
  nome: string;
  etichetta: string;
  tipo: TipoCampo;
  /** Riga di aiuto mostrata sotto il campo nell'editor. */
  aiuto?: string;
  obbligatorio?: boolean;
  /** Limite di caratteri: serve a impedire che un titolo sfondi il layout. */
  max?: number;
  /** Solo per `scelta`. */
  opzioni?: { valore: string; etichetta: string }[];
  /** Solo per `gruppo` e `lista`. */
  campi?: Campo[];
  /** Solo per `lista`: campo usato come titolo della riga nell'elenco. */
  campoTitolo?: string;
  /** Solo per `lista`: numero massimo di elementi. */
  maxElementi?: number;
  predefinito?: unknown;

  /**
   * Mostra questo campo solo quando un altro campo vale una di queste cose.
   *
   * Serve alle pagine libere, dove `modo` decide se si compone a blocchi o a
   * testo libero: mostrare tutti e due i campi insieme farebbe compilare al
   * cliente quello che poi non viene usato — e non c'è modo di accorgersene,
   * perché il testo scritto rimane salvato e semplicemente non compare.
   */
  mostraSe?: { campo: string; valori: string[] };

  /**
   * Cambiando questo campo, il modulo si ridisegna.
   *
   * Va insieme a `mostraSe`: senza, scegliere un altro modo cambierebbe il
   * valore e lascerebbe a video i campi di prima.
   */
  ridisegnaAlCambio?: boolean;
}

export interface Collezione {
  /** `singolo` = una sola scheda (la home). `multiplo` = elenco (articoli). */
  tipo: "singolo" | "multiplo";
  etichetta: string;
  /** Descrizione mostrata in cima all'editor, scritta per il cliente. */
  descrizione?: string;
  /** Solo per `multiplo`: campo mostrato nell'elenco. */
  campoTitolo?: string;
  /** Percorso pubblico per l'anteprima, con :slug se collezione multipla. */
  anteprima?: string;
  /**
   * Si lavora in bozza: il salvataggio non tocca il sito, e c'è un pulsante
   * «Pubblica». Serve dove si compone per mezz'ora stando a metà; non dove si
   * corregge una parola in un testo già scritto, che è la maggioranza dei
   * casi e dove un passaggio in più sarebbe solo un passaggio da dimenticare.
   */
  bozza?: boolean;
  /**
   * Percorso dell'anteprima MODIFICABILE, quella della bozza: l'editor ci
   * apre dentro la modalità a schermo intero, dove le sezioni si spostano
   * direttamente sulla pagina. Deve stare sotto `/admin/`, o servirebbe a
   * chiunque il lavoro non pubblicato.
   */
  componi?: string;
  campi: Campo[];
}

export interface Schema {
  titoloSito: string;
  collezioni: Record<string, Collezione>;
}

/* ══════════════════════════════ i blocchi ══════════════════════════════
 *
 * Una pagina composta liberamente è un ELENCO ORDINATO di blocchi tipizzati.
 * Si aggiungono, si spostano, si tolgono; ma ognuno si disegna come è stato
 * disegnato qui, non come capita.
 *
 * È la via di mezzo fra due estremi, ed è il motivo per cui esiste: un campo
 * completamente libero — font, colori, allineamenti — dà al cliente la
 * sensazione di poter fare tutto e gli fa sfasciare l'impaginato al primo
 * incolla da Word; un modulo a campi fissi non gli lascia aggiungere una
 * sezione nemmeno quando servirebbe davvero. Coi blocchi la COMPOSIZIONE è
 * libera e l'ASPETTO resta garantito.
 *
 * Questo catalogo è l'unica definizione: l'editor lo riceve dal server per
 * disegnare i moduli, e `Blocchi.astro` lo segue per renderli. Aggiungere un
 * tipo di blocco è una voce qui più un caso nel componente — l'editor lo
 * mostra da solo, senza che il suo codice si tocchi.
 */

export interface TipoBlocco {
  etichetta: string;
  /** Una riga che dice a cosa serve, mostrata nel menu «aggiungi». */
  descrizione?: string;
  campi: Campo[];
  /** Fuori dal menu normale: si offre solo alle pagine in modo avanzato. */
  avanzato?: boolean;
}

/* La tavolozza di colori delle FORME (definita qui perché serve dentro BLOCCHI,
   che è valutato prima di COLORI). Vuoto = l'accento del sito. */
export const TINTE_FORMA: { valore: string; etichetta: string }[] = [
  { valore: "", etichetta: "Accento del sito" },
  { valore: "#2b2e33", etichetta: "Antracite" },
  { valore: "#c8101a", etichetta: "Rosso della porta" },
  { valore: "#2f4b7c", etichetta: "Blu" },
  { valore: "#7a2f2f", etichetta: "Bordeaux" },
  { valore: "#1f6b4a", etichetta: "Verde" },
  { valore: "#8a6d1a", etichetta: "Ocra" },
  { valore: "#17222a", etichetta: "Inchiostro" },
  { valore: "#e9e2d6", etichetta: "Sabbia" },
  { valore: "#ffffff", etichetta: "Bianco" },
];

export const BLOCCHI: Record<string, TipoBlocco> = {
  titolo: {
    etichetta: "Titolo di sezione",
    descrizione: "Divide la pagina in parti.",
    campi: [{ nome: "testo", etichetta: "Titolo", tipo: "testo", obbligatorio: true, max: 90 }],
  },
  testo: {
    etichetta: "Testo",
    descrizione: "Uno o più paragrafi.",
    campi: [{ nome: "html", etichetta: "Testo", tipo: "ricco", obbligatorio: true }],
  },
  immagine: {
    etichetta: "Immagine",
    descrizione: "Una fotografia a tutta larghezza.",
    campi: [
      { nome: "immagine", etichetta: "Fotografia", tipo: "immagine", obbligatorio: true },
      { nome: "didascalia", etichetta: "Didascalia", tipo: "testo", max: 140 },
    ],
  },
  immagineTesto: {
    etichetta: "Immagine e testo",
    descrizione: "Una fotografia accanto a un testo.",
    campi: [
      { nome: "immagine", etichetta: "Fotografia", tipo: "immagine", obbligatorio: true },
      { nome: "html", etichetta: "Testo a fianco", tipo: "ricco", obbligatorio: true },
      {
        nome: "lato",
        etichetta: "L'immagine sta a",
        tipo: "scelta",
        predefinito: "sinistra",
        opzioni: [
          { valore: "sinistra", etichetta: "sinistra" },
          { valore: "destra", etichetta: "destra" },
        ],
      },
    ],
  },
  elenco: {
    etichetta: "Elenco puntato",
    campi: [
      {
        nome: "voci",
        etichetta: "Voci",
        tipo: "lista",
        campoTitolo: "voce",
        maxElementi: 20,
        campi: [{ nome: "voce", etichetta: "Voce", tipo: "testo", max: 200 }],
      },
    ],
  },
  citazione: {
    etichetta: "Citazione",
    descrizione: "Un passaggio staccato dal resto, con la sua fonte.",
    campi: [
      { nome: "testo", etichetta: "Testo", tipo: "testoLungo", obbligatorio: true, max: 400 },
      { nome: "fonte", etichetta: "Fonte", tipo: "testo", max: 120 },
    ],
  },
  separatore: {
    etichetta: "Separatore",
    descrizione: "Una riga sottile fra due parti.",
    campi: [],
  },
  collegamento: {
    etichetta: "Collegamento",
    descrizione:
      "Un accesso a un'altra pagina del sito, o a un indirizzo esterno. " +
      "Si mette dove serve, come tutto il resto.",
    campi: [
      { nome: "testo", etichetta: "Testo del collegamento", tipo: "testo", obbligatorio: true, max: 80 },
      { nome: "url", etichetta: "Dove porta", tipo: "testo", obbligatorio: true, max: 300 },
      {
        nome: "aspetto",
        etichetta: "Aspetto",
        tipo: "scelta",
        predefinito: "pulsante",
        opzioni: [
          { valore: "pulsante", etichetta: "Un pulsante" },
          { valore: "riga", etichetta: "Una riga di testo" },
        ],
      },
    ],
  },
  modulo: {
    etichetta: "Modulo di contatto",
    descrizione:
      "Un form nome / email / messaggio. I messaggi arrivano nella casella " +
      "dell'editor, e per email se l'hai configurata.",
    campi: [
      { nome: "titolo", etichetta: "Titolo del modulo", tipo: "testo", max: 90 },
      { nome: "introduzione", etichetta: "Testo introduttivo", tipo: "ricco" },
    ],
  },
  forma: {
    etichetta: "Forma",
    descrizione: "Una figura decorativa da mettere dietro o accanto ai testi: cerchio, blob, banda, onda, puntini.",
    campi: [
      {
        nome: "forma",
        etichetta: "Figura",
        tipo: "scelta",
        predefinito: "cerchio",
        opzioni: [
          { valore: "cerchio", etichetta: "Cerchio" },
          { valore: "banda", etichetta: "Banda" },
        ],
      },
      { nome: "tinta", etichetta: "Colore", tipo: "scelta", opzioni: TINTE_FORMA },
      {
        nome: "tinta2",
        etichetta: "Secondo colore (sfumatura)",
        tipo: "scelta",
        opzioni: [{ valore: "", etichetta: "Nessuno" }, ...TINTE_FORMA.slice(1)],
      },
    ],
  },
  html: {
    etichetta: "HTML libero",
    descrizione: "Per chi sa cosa sta facendo: nessun controllo sull'aspetto.",
    avanzato: true,
    campi: [{ nome: "html", etichetta: "Codice HTML", tipo: "testoLungo" }],
  },
};

/** Quanti blocchi al massimo in una pagina. Un freno, non una regola. */
export const MAX_BLOCCHI = 60;

/* ══════════ i colori e i caratteri che una sezione può vestire ══════════
 *
 * Cataloghi chiusi, come per i blocchi: la tavolozza li riceve dal server e
 * il salvataggio li pretende. Un colore libero sembrerebbe più generoso, ma è
 * la strada per la pagina-campionario — e qui il cliente è uno studio legale,
 * dove otto colori sono già tanti.
 *
 * I caratteri: il cliente ne sceglie uno per sezione, coi loro nomi veri —
 * non «con le grazie / senza grazie», che non dice niente a chi non fa questo
 * mestiere. Alcuni sono di sistema (non si scaricano), altri sono i font web
 * che il sito già carica dal suo `<head>` (vedi Base.astro): il sito ha già
 * scelto di usarne di Google, e allargare quella scelta è coerente. Il file
 * di un font web scende solo quando una pagina lo usa davvero.
 *
 * Nel blocco si salva la CHIAVE («serif»), mai la pila: così la pila si può
 * correggere qui senza toccare le pagine già salvate — ed è per questo che le
 * chiavi storiche (serif, sans, mono, corsivo) restano, con l'etichetta
 * rifatta: le pagine salvate con quelle continuano a rendersi.
 */
export const COLORI: { valore: string; etichetta: string }[] = [
  { valore: "", etichetta: "Come il sito" },
  { valore: "#2b2e33", etichetta: "Antracite" },
  { valore: "#c8101a", etichetta: "Rosso della porta" },
  { valore: "#17222a", etichetta: "Inchiostro" },
  { valore: "#2f4b7c", etichetta: "Blu dello studio" },
  { valore: "#5f6f7a", etichetta: "Grigio" },
  { valore: "#7a2f2f", etichetta: "Bordeaux" },
  { valore: "#1f6b4a", etichetta: "Verde scuro" },
  { valore: "#8a6d1a", etichetta: "Ocra" },
  // Bianco: sul fondo bianco sparisce, ma sul foglio libero una scritta può
  // stare sopra una fotografia — ed è lì che serve.
  { valore: "#ffffff", etichetta: "Bianco" },
];

/* Gli effetti d'ingresso: come una sezione COMPARE quando la si raggiunge
   scorrendo. Catalogo chiuso, come colori e caratteri; il render mette
   `data-anima`, e un piccolo script nella pagina pubblica la rivela. */
export const ANIMAZIONI: { valore: string; etichetta: string }[] = [
  { valore: "", etichetta: "Nessuno" },
  { valore: "sali", etichetta: "Sale dal basso" },
];

/* Una selezione curata, non un campionario: poche famiglie che si tengono,
   con le grazie per l'autorità e due sans puliti. Times New Roman e «Sistema»
   non si scaricano (ci sono ovunque). Le chiavi storiche restano quelle: una
   pagina salvata con «lora» continua a rendersi. */
export const CARATTERI: { valore: string; etichetta: string; pila: string }[] = [
  { valore: "", etichetta: "Come il sito", pila: "" },

  // Con le grazie.
  { valore: "source-serif", etichetta: "Source Serif", pila: "'Source Serif 4', Georgia, serif" },
  { valore: "playfair", etichetta: "Playfair Display", pila: "'Playfair Display', Georgia, serif" },
  { valore: "lora", etichetta: "Lora", pila: "Lora, Georgia, serif" },
  { valore: "merriweather", etichetta: "Merriweather", pila: "Merriweather, Georgia, serif" },
  { valore: "garamond", etichetta: "EB Garamond", pila: "'EB Garamond', Georgia, serif" },
  { valore: "cormorant", etichetta: "Cormorant Garamond", pila: "'Cormorant Garamond', Georgia, serif" },
  { valore: "times", etichetta: "Times New Roman", pila: "'Times New Roman', Times, serif" },

  // Senza grazie.
  { valore: "inter", etichetta: "Inter", pila: "Inter, system-ui, 'Segoe UI', Arial, sans-serif" },
  { valore: "montserrat", etichetta: "Montserrat", pila: "Montserrat, system-ui, sans-serif" },
  { valore: "worksans", etichetta: "Work Sans", pila: "'Work Sans', system-ui, sans-serif" },
  { valore: "sans", etichetta: "Sistema", pila: "system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" },
];

/* ══════════════════════════ i temi predefiniti ══════════════════════════
 *
 * Accostamenti pronti di colori e caratteri, scelti perché "funzionano"
 * insieme: un clic imposta accento, colore del testo, sfondo e le due
 * famiglie di caratteri. Poi si può ritoccare tutto a mano. Le chiavi dei
 * font sono quelle di CARATTERI; i colori sono valori CSS. */
export interface TemaPredefinito {
  nome: string;
  descrizione: string;
  scuro?: boolean;
  accento: string;
  inchiostro: string;
  carta: string;
  fontTitoli: string;
  fontTesto: string;
  /* Token secondari: normalmente si lasciano ai default di global.css (temi
     chiari). I temi SCURI li devono impostare, o testata, piè, bordi e
     pulsanti resterebbero chiari su fondo scuro. */
  carta2?: string;
  cartaScura?: string;
  linea?: string;
  lineaForte?: string;
  inchiostro2?: string;
  tenue?: string;
  suScuro?: string;
}

/* Palette scelte a mano, con colori smorzati (niente primari accesi) e
   accostamenti di caratteri che si tengono: l'obiettivo è che sembrino decise
   da qualcuno, non generate. Quattro chiare e due scure. */
export const TEMI_PREDEFINITI: TemaPredefinito[] = [
  {
    nome: "Carta antica",
    descrizione: "Avorio caldo e terra bruciata: sobrio, un po' letterario.",
    accento: "#8a4b39", inchiostro: "#26221e", carta: "#f4efe6",
    fontTitoli: "lora", fontTesto: "inter",
  },
  {
    nome: "Verde bosco",
    descrizione: "Pino profondo su carta fredda: pacato e naturale.",
    accento: "#385a45", inchiostro: "#1b2620", carta: "#eef0ea",
    fontTitoli: "cormorant", fontTesto: "worksans",
  },
  {
    nome: "Navy e ottone",
    descrizione: "Blu notte e ottone spento: autorità senza sfarzo.",
    accento: "#9a7b3c", inchiostro: "#152439", carta: "#f5f3ee",
    fontTitoli: "playfair", fontTesto: "inter",
  },
  {
    nome: "Grigio nebbia",
    descrizione: "Grigi tersi e ardesia: essenziale, contemporaneo.",
    accento: "#50646f", inchiostro: "#242a30", carta: "#edeef0",
    fontTitoli: "montserrat", fontTesto: "inter",
  },
  {
    nome: "Notte",
    descrizione: "Fondo blu-nero e ottone caldo: scuro, elegante.",
    scuro: true,
    accento: "#c6a35a", inchiostro: "#e7ecf1", carta: "#12161c",
    fontTitoli: "playfair", fontTesto: "inter",
    carta2: "#1a2029", cartaScura: "#0d1116", linea: "#2a333e",
    lineaForte: "#3b4855", inchiostro2: "#aab6c2", tenue: "#7f8b98", suScuro: "#dcc79b",
  },
  {
    nome: "Antracite",
    descrizione: "Grafite calda e salvia: scuro ma morbido.",
    scuro: true,
    accento: "#9db0a2", inchiostro: "#e9e7e2", carta: "#17191d",
    fontTitoli: "cormorant", fontTesto: "worksans",
    carta2: "#1f2226", cartaScura: "#0f1113", linea: "#2d3138",
    lineaForte: "#3d434c", inchiostro2: "#b6b3ac", tenue: "#8b8880", suScuro: "#c9cabf",
  },
];

/** Valore iniziale di un campo vuoto, coerente con il tipo. */
export function valorePredefinito(campo: Campo): unknown {
  if (campo.predefinito !== undefined) return campo.predefinito;
  switch (campo.tipo) {
    case "booleano":
      return false;
    case "numero":
      return null;
    case "lista":
    case "blocchi":
      return [];
    case "gruppo":
      return Object.fromEntries(
        (campo.campi ?? []).map((c) => [c.nome, valorePredefinito(c)]),
      );
    case "immagine":
      return { url: "", alt: "" };
    default:
      return "";
  }
}

/** Documento vuoto costruito dallo schema. */
export function documentoVuoto(collezione: Collezione): Record<string, unknown> {
  return Object.fromEntries(
    collezione.campi.map((c) => [c.nome, valorePredefinito(c)]),
  );
}

/**
 * Riempie i campi mancanti di un documento salvato in precedenza.
 * Serve quando si aggiunge un campo allo schema dopo che il cliente
 * ha già salvato: senza questo, l'editor mostrerebbe campi indefiniti.
 */
export function conValoriPredefiniti(
  collezione: Collezione,
  dati: Record<string, unknown> | null,
): Record<string, unknown> {
  const base = documentoVuoto(collezione);
  if (!dati) return base;
  return { ...base, ...dati };
}

export interface ErroreValidazione {
  campo: string;
  messaggio: string;
}

/** Validazione lato server: l'editor la ripete lato client, ma non ci si fida. */
export function valida(
  collezione: Collezione,
  dati: Record<string, unknown>,
): ErroreValidazione[] {
  const errori: ErroreValidazione[] = [];

  const controlla = (campi: Campo[], valori: any, prefisso = "") => {
    for (const campo of campi) {
      const valore = valori?.[campo.nome];
      const percorso = prefisso ? `${prefisso}.${campo.nome}` : campo.nome;

      if (campo.obbligatorio) {
        const vuoto =
          valore === undefined ||
          valore === null ||
          valore === "" ||
          (campo.tipo === "immagine" && !(valore as any)?.url);
        if (vuoto) {
          errori.push({ campo: percorso, messaggio: `${campo.etichetta}: campo obbligatorio` });
          continue;
        }
      }

      if (campo.max && typeof valore === "string" && valore.length > campo.max) {
        errori.push({
          campo: percorso,
          messaggio: `${campo.etichetta}: massimo ${campo.max} caratteri`,
        });
      }

      if (campo.tipo === "gruppo" && campo.campi) {
        controlla(campo.campi, valore, percorso);
      }

      /* I blocchi si controllano UNO PER UNO, ciascuno con i campi del suo
         tipo. Senza, il campo passerebbe qualunque cosa fosse un array — e
         una pagina con dentro un blocco di tipo inventato, o un titolo di
         quattromila caratteri, arriverebbe fino al rendering. */
      if (campo.tipo === "blocchi" && Array.isArray(valore)) {
        if (valore.length > MAX_BLOCCHI) {
          errori.push({
            campo: percorso,
            messaggio: `${campo.etichetta}: al massimo ${MAX_BLOCCHI} blocchi`,
          });
        }
        valore.forEach((blocco: any, i) => {
          const tipo = BLOCCHI[blocco?.tipo];
          if (!tipo) {
            errori.push({
              campo: `${percorso}[${i}]`,
              messaggio: `Blocco ${i + 1}: tipo «${blocco?.tipo ?? "assente"}» sconosciuto`,
            });
            return;
          }
          /* La larghezza sulla griglia: da 1 a 12 colonne, o assente (che
             vale la riga intera). Un valore fuori scala non romperebbe la
             pagina — `grid-column: span 40` si limita da solo — ma il
             pannello e il sito la mostrerebbero diversa, e la sezione
             risulterebbe larga in un posto e no nell'altro. */
          if (blocco.larghezza !== undefined && blocco.larghezza !== null) {
            const n = Number(blocco.larghezza);
            if (!Number.isInteger(n) || n < 1 || n > 12) {
              errori.push({
                campo: `${percorso}[${i}]`,
                messaggio: `Blocco ${i + 1}: larghezza «${blocco.larghezza}» fuori dalle 12 colonne`,
              });
            }
          }
          /* L'altezza minima, in pixel. Il tetto non è per proteggere il
             rendering — un `min-height` enorme non rompe niente — ma per
             evitare la pagina fatta di quattro schermate vuote, che è la cosa
             che si ottiene trascinando distrattamente e non ci si accorge
             finché non la si guarda da un altro dispositivo. */
          if (blocco.altezza !== undefined && blocco.altezza !== null) {
            const n = Number(blocco.altezza);
            if (!Number.isInteger(n) || n < 0 || n > 2000) {
              errori.push({
                campo: `${percorso}[${i}]`,
                messaggio: `Blocco ${i + 1}: altezza «${blocco.altezza}» fuori da 0–2000 px`,
              });
            }
          }
          /* Il posto sul foglio libero, tutto in percentuale della larghezza.
             I limiti sono larghi di proposito — si può uscire dal foglio, e
             una parte fuori dal bordo è una scelta legittima — ma non
             illimitati: un numero fuori scala non romperebbe il rendering, e
             proprio per questo passerebbe inosservato finché qualcuno non
             cerca la sezione che «è sparita» a tremila per cento da qui. */
          for (const [nome, min, max] of [
            ["x", -50, 200], ["y", -50, 400], ["w", 1, 200], ["h", 0, 400],
          ] as const) {
            const v = (blocco as any)[nome];
            if (v === undefined || v === null) continue;
            const n = Number(v);
            if (!Number.isFinite(n) || n < min || n > max) {
              errori.push({
                campo: `${percorso}[${i}]`,
                messaggio: `Blocco ${i + 1}: ${nome} «${v}» fuori da ${min}–${max}`,
              });
            }
          }
          /* Colore e carattere: solo dal catalogo. Un valore inventato non
             romperebbe il rendering — verrebbe ignorato — e proprio per
             questo passerebbe zitto fino a chi si chiede perché la sua
             sezione non cambia. */
          if (blocco.colore != null && blocco.colore !== "" &&
              !COLORI.some((c) => c.valore === blocco.colore)) {
            errori.push({
              campo: `${percorso}[${i}]`,
              messaggio: `Blocco ${i + 1}: colore «${blocco.colore}» fuori tavolozza`,
            });
          }
          if (blocco.font != null && blocco.font !== "" &&
              !CARATTERI.some((c) => c.valore === blocco.font)) {
            errori.push({
              campo: `${percorso}[${i}]`,
              messaggio: `Blocco ${i + 1}: carattere «${blocco.font}» sconosciuto`,
            });
          }
          if (blocco.allinea != null && blocco.allinea !== "" &&
              !["sinistra", "centro", "destra"].includes(blocco.allinea)) {
            errori.push({
              campo: `${percorso}[${i}]`,
              messaggio: `Blocco ${i + 1}: allineamento «${blocco.allinea}» sconosciuto`,
            });
          }
          if (blocco.anima != null && blocco.anima !== "" &&
              !ANIMAZIONI.some((x) => x.valore === blocco.anima)) {
            errori.push({
              campo: `${percorso}[${i}]`,
              messaggio: `Blocco ${i + 1}: effetto «${blocco.anima}» sconosciuto`,
            });
          }
          controlla(tipo.campi, blocco.dati ?? {}, `${percorso}[${i}]`);
        });
      }

      if (campo.tipo === "lista" && campo.campi && Array.isArray(valore)) {
        if (campo.maxElementi && valore.length > campo.maxElementi) {
          errori.push({
            campo: percorso,
            messaggio: `${campo.etichetta}: massimo ${campo.maxElementi} elementi`,
          });
        }
        valore.forEach((riga, i) => controlla(campo.campi!, riga, `${percorso}[${i}]`));
      }
    }
  };

  controlla(collezione.campi, dati);
  return errori;
}

/**
 * Validazione di una PAGINA a blocchi, per il momento della pubblicazione.
 *
 * Controlla la STRUTTURA (tipo di blocco noto, coordinate/larghezze in scala,
 * colore/carattere/effetto dal catalogo, lunghezze massime): così non finisce
 * online una pagina con dati rotti. NON pretende i campi «obbligatori»: una
 * pagina a foglio libero può avere sezioni ancora vuote in modo legittimo, e
 * la resa le gestisce già. È il controllo che il modello ad albero usa davvero
 * (`valida` sopra è del vecchio modello a collezioni).
 */
export function validaPagina(dati: Record<string, unknown>): ErroreValidazione[] {
  const errori: ErroreValidazione[] = [];
  const blocchi = (dati as any)?.blocchi;
  if (blocchi === undefined || blocchi === null) return errori;
  if (!Array.isArray(blocchi)) {
    return [{ campo: "blocchi", messaggio: "I blocchi non sono una lista." }];
  }
  if (blocchi.length > MAX_BLOCCHI) {
    errori.push({ campo: "blocchi", messaggio: `Al massimo ${MAX_BLOCCHI} sezioni.` });
  }
  const fuori = (v: unknown, min: number, max: number, intero = false) => {
    const n = Number(v);
    return !Number.isFinite(n) || n < min || n > max || (intero && !Number.isInteger(n));
  };
  blocchi.forEach((b: any, i) => {
    const et = (m: string) => errori.push({ campo: `blocchi[${i}]`, messaggio: `Sezione ${i + 1}: ${m}` });
    const tipo = BLOCCHI[b?.tipo];
    if (!tipo) return et(`tipo «${b?.tipo ?? "assente"}» sconosciuto`);
    if (b.larghezza != null && fuori(b.larghezza, 1, 12, true)) et(`larghezza «${b.larghezza}» fuori dalle 12 colonne`);
    if (b.altezza != null && fuori(b.altezza, 0, 2000, true)) et(`altezza «${b.altezza}» fuori da 0–2000 px`);
    for (const [nome, min, max] of [["x", -50, 200], ["y", -50, 400], ["w", 1, 200], ["h", 0, 400]] as const) {
      if (b[nome] != null && fuori(b[nome], min, max)) et(`${nome} «${b[nome]}» fuori da ${min}–${max}`);
    }
    if (b.colore != null && b.colore !== "" && !COLORI.some((c) => c.valore === b.colore)) et(`colore «${b.colore}» fuori tavolozza`);
    if (b.font != null && b.font !== "" && !CARATTERI.some((c) => c.valore === b.font)) et(`carattere «${b.font}» sconosciuto`);
    if (b.allinea != null && b.allinea !== "" && !["sinistra", "centro", "destra"].includes(b.allinea)) et(`allineamento «${b.allinea}» sconosciuto`);
    if (b.anima != null && b.anima !== "" && !ANIMAZIONI.some((x) => x.valore === b.anima)) et(`effetto «${b.anima}» sconosciuto`);
    if (b.dimensione != null && fuori(b.dimensione, 0.3, 5)) et(`grandezza «${b.dimensione}» fuori scala`);
    // Le lunghezze massime dei campi di testo (non l'obbligatorietà).
    for (const campo of tipo.campi) {
      const v = b.dati?.[campo.nome];
      if (campo.max && typeof v === "string" && v.length > campo.max) {
        et(`${campo.etichetta}: massimo ${campo.max} caratteri`);
      }
    }
  });
  return errori;
}
