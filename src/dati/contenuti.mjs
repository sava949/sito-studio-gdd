/**
 * I testi e le foto di partenza delle pagine disegnate a mano.
 *
 * Sono i valori che una pagina mostra finché nessuno la modifica dall'editor:
 * le modifiche si salvano nel database (dati.contenuto della pagina) e si
 * fondono su questi (vedi src/lib/contenuti.ts). I campi `…Html` e quelli
 * segnati con data-ricco nelle pagine possono contenere grassetto, corsivo,
 * elenchi e collegamenti.
 *
 * I recapiti (telefoni, indirizzo, orari…) non stanno qui: sono i «Dati dello
 * studio» (src/dati/studio.mjs e la chiave di sito «studio»).
 */
import { persone as PERSONE, aree as AREE } from "./studio.mjs";

const R2 = "https://pub-aec503af2a3741499709da5839b4a6cb.r2.dev/immagini";

// ─────────────────────────────────────────────── la home (l'anticamera)
export const home = {
  occhiello: "Del Foro di Roma",
  studioLegale: "Studio Legale",
  sigla: "G.D.D.",
  frase: "Assistenza legale che coniuga tradizione e cura della persona, nel ricordo del Dott. Tommaso Novelli.",
  accedi: "Accedi allo studio",
  indirizzo: "Via della Balduina 107 · Roma",
  dedica: {
    etichetta: "La dedica",
    nome: "Dott. Tommaso Novelli",
    nota: "Primo Presidente Emerito della Suprema Corte di Cassazione, alla cui memoria lo studio è dedicato.",
    link: "Il ricordo del Dott. Novelli →",
  },
  tratti: [
    { titolo: "Un avvocato per ogni pratica", testo: "Chi prende in carico la questione resta l'interlocutore fino alla sua conclusione." },
    { titolo: "In sede o a distanza", testo: "Si riceve su appuntamento, in studio, in videochiamata o presso il cliente." },
    { titolo: "Dalla prevenzione al giudizio", testo: "Consulenza prima che il problema nasca, difesa in ogni grado quando serve." },
  ],
  aree: { etichetta: "Aree di attività", titolo: "Di cosa si occupa lo studio" },
  persone: {
    etichetta: "Le persone",
    titolo: "Chi lavora nello studio",
    foto: `${R2}/gdd-gruppo-img_9838.webp`,
    tutti: "I professionisti dello studio →",
  },
  luogo: {
    etichetta: "Dove siamo",
    riga1: "Via della Balduina 107",
    riga2: "00136 Roma",
    foto: "/foto/ingresso.webp",
  },
  chiusura: { titolo: "La porta è aperta.", accedi: "Accedi allo studio" },
};

// ─────────────────────────────────────────────── Tommaso Novelli
export const novelli = {
  occhio: "In memoria",
  nome1: "Dott. Tommaso",
  nome2: "Novelli",
  carica1: "Primo Presidente Emerito",
  carica2: "della Suprema Corte di Cassazione",
  foto: "/foto/novelli.webp",
  citazione: "«A mio nonno, guida costante e inesauribile fonte di ispirazione.»",
  autore: "Avv. Luca Giurato",
  colonne: [
    {
      etichetta: "Una vita per la giustizia",
      testo: "Magistrato per quasi cinquant'anni, il Dott. Tommaso Novelli ha lavorato alla Corte di Cassazione come giudice, consigliere e presidente di sezione, e al Ministero della Giustizia; dal 1978 al 1981 è stato Primo Presidente della Suprema Corte. Del suo magistero restano il rigore del giudizio e il rispetto per chi alla giustizia si rivolge.",
    },
    {
      etichetta: "Lo studio che porta il suo ricordo",
      testo: "Lo Studio Legale G.D.D. è fondato sulla passione per la professione e sui valori umani ed etici che il Dott. Novelli ha trasmesso al nipote, l'Avv. Luca Giurato. In sua memoria, la struttura è dedicata a lui.",
    },
  ],
  /* Dalle fonti ufficiali: Corte Suprema di Cassazione, «Primi Presidenti»
     (cortedicassazione.it). Da far confermare alla famiglia. */
  cronologia: {
    occhio: "La vita",
    titolo: "Una vita nella magistratura",
    tappe: [
      { anno: "1911", testo: "Nasce il 4 aprile a Formicola, in provincia di Caserta." },
      { anno: "1933", testo: "Entra in magistratura, a ventidue anni." },
      { anno: "1956", testo: "Cura con Mario Battaglini il «Codice di procedura civile annotato con la giurisprudenza della Cassazione» (Giuffrè), che aggiornerà fino all'edizione del 1990." },
      { anno: "Anni '60", testo: "Al Ministero della Giustizia è vice capo di gabinetto del Ministro, poi direttore generale degli Affari civili e delle Libere professioni." },
      { anno: "1978", testo: "Il 20 luglio è nominato Primo Presidente della Corte Suprema di Cassazione, dopo esserne stato giudice, consigliere e presidente di sezione." },
      { anno: "1981", testo: "Il 23 aprile lascia la Presidenza e la magistratura." },
      { anno: "1986", testo: "Conclude la presidenza di sezione della Commissione tributaria centrale, tenuta per decenni." },
      { anno: "2014", testo: "Muore a Roma il 26 settembre, a centotré anni." },
    ],
  },
  valori: [
    { titolo: "Correttezza", testo: "Dire con chiarezza cosa è ragionevole aspettarsi, e comportarsi di conseguenza." },
    { titolo: "Probità", testo: "La fiducia di chi si rivolge allo studio è il primo dovere del mandato." },
    { titolo: "Impegno", testo: "Studio e aggiornamento costanti, perché ogni difesa merita la stessa cura." },
  ],
  oltre: { occhio: "Lo studio", titolo: "Chi lavora oggi nel suo ricordo", bottone: "Entra nello studio", link: "Aree di attività →" },
};

// ─────────────────────────────────────────────── Lo studio
export const studio = {
  occhio: "Lo studio",
  titolo: "Uno studio a Roma, <em>dalla parte</em> della persona.",
  lead: "Uno studio di esperienza: oltre vent'anni di professione del suo fondatore, e il ricordo di chi gliel'ha trasmessa.",
  colonne: [
    {
      etichetta: "La storia",
      testo: "Lo Studio Legale G.D.D. è nato a Roma nell'ottobre 2025, in Via della Balduina, dall'esperienza del suo fondatore, l'Avv. Luca Giurato, e dai valori umani ed etici che gli ha trasmesso il nonno, il Dott. Tommaso Novelli, Primo Presidente Emerito della Suprema Corte di Cassazione, alla cui memoria lo studio è dedicato.",
    },
    {
      etichetta: "Di cosa si occupa",
      testo: "Lo studio assiste persone fisiche e giuridiche soprattutto in materia penale — compreso il penale d'impresa e tributario — e in materia civile, societaria e di famiglia, sia nella fase preventiva e di consulenza sia in giudizio, in ogni grado.",
    },
    {
      etichetta: "Come è organizzato",
      testo: "Lo studio fa capo all'Avv. Luca Giurato, che ne è il titolare. Con lui lavorano l'Avv. Pierpaolo Doro e la Dott.ssa Maria Chiara Del Ninno, praticante. Le pratiche sono seguite personalmente dagli avvocati; per gli atti di competenza notarile lo studio collabora con il Notaio Dott.ssa Giuditta Lombardo, in Roma. Con riferimento ai consulenti, lo studio interagisce e vanta collaborazioni decennali con professionisti di primo ordine, per ogni materia connessa all'esercizio della difesa: urbanistica, medico-legale, ingegneria della ricostruzione degli incidenti stradali, materia ambientale, tributaria e di esercizio d'impresa. Lo studio collabora, altresì, con affermati investigatori privati.",
    },
    {
      etichetta: "Dove",
      testo: "In Via della Balduina 107, dietro il portone rosso: una sala d'attesa e stanze separate per i colloqui, perché ciò che si dice in studio resti in studio. La sede è senza barriere architettoniche.",
    },
  ],
  ambienti: {
    occhio: "Gli ambienti",
    titolo: "Dentro lo studio",
    foto: [
      { url: "/foto/ambiente-scrivania.webp", alt: "La stanza del titolare", largo: true },
      { url: "/foto/ambiente-libreria.webp", alt: "La biblioteca", largo: false },
      { url: "/foto/ambiente-vetrate.webp", alt: "Le stanze, divise dal vetro", largo: true },
      { url: "/foto/ambiente-quadri.webp", alt: "Le vedute alle pareti", largo: false },
      { url: "/foto/ambiente-toga.webp", alt: "La toga", largo: true },
      { url: "/foto/ambiente-stanza.webp", alt: "Una stanza per i colloqui riservati", largo: true },
    ],
  },
  metodo: {
    occhio: "Il metodo",
    titolo: "Come lavora lo studio",
    voci: [
      { titolo: "Un solo interlocutore", testo: "Ogni pratica è seguita personalmente da un avvocato, che resta l'interlocutore del cliente dal primo incontro alla sua conclusione." },
      { titolo: "Chiarezza fin dall'inizio", testo: "Al primo colloquio si spiegano le strade possibili, compresa quella di non agire, con i tempi prevedibili di ciascuna. L'incarico si conferisce per iscritto." },
      { titolo: "Riservatezza", testo: "Quanto viene riferito all'avvocato è coperto dal segreto professionale, anche se all'incarico non si dà seguito. I colloqui si tengono in stanze separate." },
    ],
  },
  /* «In sintesi»: sede, orari, come arrivare e accesso vengono dai «Dati dello
     studio»; qui le etichette e le voci che sono solo testo. */
  breve: {
    occhio: "In sintesi",
    titolo: "Lo studio, in breve",
    nota: "Recapiti e modulo per scrivere allo studio sono nella pagina Contatti.",
    etichette: { sede: "Sede", riceve: "Si riceve", orari: "Orari", lingue: "Lingue", arrivare: "Come arrivare", accesso: "Accesso", albo: "Albo", assicurazione: "Assicurazione" },
    riceve: "Su appuntamento: in sede, in videochiamata oppure, quando serve, a domicilio o presso l'azienda del cliente.",
    lingue: "Italiano, inglese, francese e spagnolo.",
    albo: "Gli avvocati dello studio sono iscritti all'Ordine degli Avvocati di Roma.",
    assicurazione: "Polizza per la responsabilità professionale, ai sensi dell'art. 12 della L. 247/2012: gli estremi sono nelle <a href=\"/note-legali\">note legali</a>.",
  },
  professionisti: { occhio: "I professionisti", titolo: "Chi segue le vostre pratiche", bottone: "Conosci i professionisti" },
};

// ─────────────────────────────────────────────── I professionisti
export const professionisti = {
  occhio: "I professionisti",
  titolo: "Chi segue <em>le vostre</em> pratiche.",
  lead: "Una squadra di professionisti al lavoro su ogni pratica.",
  etichetteDati: { albo: "Albo", lingue: "Lingue", contatti: "Contatti", materie: "Materie", curriculum: "Curriculum" },
  elenco: PERSONE.map((p) => ({
    nome: p.nome,
    ruolo: p.ruolo,
    foto: `/foto/${p.foto}.webp`,
    bio: p.bio,
    cv: p.cv ?? "",
    albo: p.albo,
    lingue: p.lingue,
    contatti: p.contatti.map((c) => `<a href="${c.href}">${c.testo}</a>`).join(" · "),
    materie: p.materie,
  })),
};

// ─────────────────────────────────────────────── Aree di attività
export const areeIndice = {
  occhio: "Aree di attività",
  titolo: "Le materie, <em>seguite</em> da vicino.",
  lead: "Sono le materie di cui lo studio si occupa abitualmente. Per una questione che non rientra fra queste, lo studio lo dice subito e, dove può, indica un collega che se ne occupa.",
  vai: "Approfondisci",
};

/* Chi se ne occupa: dal questionario (materie dei professionisti). */
const REFERENTI = {
  "diritto-penale": ["Avv. Luca Giurato", "Avv. Pierpaolo Doro"],
  "diritto-civile-e-impresa": ["Avv. Pierpaolo Doro", "Avv. Luca Giurato"],
  "famiglia-persone-e-minori": ["Avv. Luca Giurato", "Avv. Pierpaolo Doro"],
  "responsabilita-e-risarcimento": ["Avv. Pierpaolo Doro"],
};
/* Le domande frequenti della stessa materia, dove ci sono. */
const DOMANDE = {
  "diritto-penale": "/domande-frequenti#penale",
  "famiglia-persone-e-minori": "/domande-frequenti#famiglia",
  "responsabilita-e-risarcimento": "/domande-frequenti#danno",
};

/** Il contenuto di partenza di un'area: quelle del progetto dai dati dello
    studio, una nuova (creata dall'editor) da riempire. */
export function area(slug, titolo = "Nuova area") {
  const a = AREE.find((x) => x.slug === slug);
  return {
    titolo: a?.titolo ?? titolo,
    sintesi: a?.sintesi ?? "Una o due righe che riassumono la materia.",
    corpo: a?.corpo ?? "<p>Il testo dell'area: come lavora lo studio in questa materia, cosa conviene sapere, cosa portare al primo incontro.</p>",
    etichettaMaterie: "In particolare",
    materie: a?.materie ?? ["Una voce"],
    etichettaChi: "Se ne occupano",
    referenti: REFERENTI[slug] ?? [],
    domande: DOMANDE[slug] ?? "",
    linkDomande: "Domande frequenti su questa materia →",
  };
}

// ─────────────────────────────────────────────── Contatti
export const contatti = {
  occhio: "Contatti",
  titolo: "Via della Balduina <em>107</em>, Roma.",
  lead: "Si riceve su appuntamento: in sede, in videochiamata oppure, quando serve, a domicilio o presso l'azienda. Per fissarlo basta una telefonata o un messaggio.",
  telefonoNota: "Lunedì–venerdì, 9–13 e 15–19:30",
  cellulareNota: "Per fissare un appuntamento",
  arrivare: { occhio: "Arrivando", titolo: "Cercate il portone <em>rosso</em>.", foto: "/foto/portone.webp" },
  modi: ["In sede", "In videochiamata", "A domicilio o in azienda"],
  mappa: { indicazioni: "Indicazioni stradali ↗" },
  scrivere: { occhio: "Scrivere allo studio", titolo: "Poche righe bastano.", bottone: "Invia il messaggio" },
  grazie: "Grazie: il messaggio è arrivato allo studio. Sarete ricontattati.",
  avvertenze: {
    etichetta: "Prima di scrivere",
    testo:
      "<p>Conviene indicare la questione, chi sono le altre persone coinvolte e se ci sono termini in scadenza: una notifica, una lettera ricevuta, un'udienza già fissata.</p>" +
      "<p><strong>L'invio di un messaggio non instaura un rapporto professionale</strong> e non interrompe alcun termine. Fino al conferimento scritto dell'incarico lo studio non è tenuto ad alcuna attività di difesa.</p>" +
      "<p>Per la stessa ragione è meglio non allegare documenti né dettagli riservati: si valutano in appuntamento.</p>",
    link: "Come funziona il primo colloquio →",
  },
};

// ─────────────────────────────────────────────── Il primo colloquio
export const colloquio = {
  occhio: "Il primo colloquio",
  titolo: "Dal primo contatto <em>all'incarico</em>.",
  lead: "Rivolgersi a un avvocato, soprattutto la prima volta, porta con sé molte domande. Ecco come si svolge, passo per passo, il primo incontro con lo studio.",
  passi: [
    { titolo: "Il primo contatto", testo: "Si telefona allo studio o si scrive con il modulo della pagina Contatti. Bastano poche righe: di che cosa si tratta, chi sono le altre persone coinvolte e se ci sono date vicine — una notifica, un'udienza, un termine che scade." },
    { titolo: "L'appuntamento", testo: "Lo studio fissa il colloquio in sede, in videochiamata oppure, quando serve, a domicilio o presso l'azienda. Prima di riceverlo verifica che non ci siano conflitti di interesse con altri assistiti." },
    { titolo: "Il colloquio", testo: "Si ascolta la vicenda, si leggono insieme i documenti e si spiegano le strade possibili, compresa quella di non agire, con i tempi prevedibili di ciascuna. Tutto ciò che viene detto è coperto dal segreto professionale." },
    { titolo: "Se si decide di procedere", testo: "L'incarico si conferisce per iscritto. Da quel momento l'avvocato che lo riceve segue personalmente la pratica e resta l'interlocutore fino alla sua conclusione." },
  ],
  portare: {
    occhio: "Da preparare",
    titolo: "Cosa portare al colloquio",
    nota: "Non serve avere tutto: si parte da ciò che c'è, il resto si recupera dopo.",
    voci: [
      "Un documento d'identità",
      "Tutti gli atti ricevuti, con le buste o le relate di notifica: dalle date dipendono i termini",
      "Contratti, lettere, email e messaggi che riguardano la vicenda",
      "Eventuali provvedimenti già emessi (sentenze, decreti, verbali)",
      "Un breve promemoria con le date principali, anche scritto a mano",
      "I nomi e i recapiti delle altre persone coinvolte, se li si conosce",
    ],
  },
  riservatezza: {
    etichetta: "Riservatezza",
    testo: "Quanto viene riferito all'avvocato è coperto dal segreto professionale, anche se all'incarico non si dà seguito. Per questo è meglio non anticipare dettagli riservati per email o con il modulo: si raccontano di persona.",
  },
  urgenza: {
    etichetta: "Se c'è urgenza",
    testo: "Un atto appena notificato, un'udienza vicina, un termine che sta per scadere: conviene telefonare subito allo studio e dirlo fin dalle prime parole.",
  },
  avvertenza:
    "L'invio di un messaggio o la richiesta di un appuntamento non instaurano un rapporto professionale e non interrompono alcun termine: il rapporto sorge con il conferimento scritto dell'incarico. Le informazioni di questa pagina sono generali. Altre risposte nelle <a href=\"/domande-frequenti\">domande frequenti</a>.",
};

// ─────────────────────────────────────────────── Domande frequenti
export const domande = {
  occhio: "Domande frequenti",
  titolo: "Le domande <em>di tutti</em>, prima del colloquio.",
  lead: "Le risposte sono generali e non tengono conto del caso concreto, che può cambiarle del tutto: servono a orientarsi, non a decidere.",
  linkArea: "L'area di attività →",
  gruppi: [
    {
      id: "penale",
      titolo: "Diritto penale",
      area: "/aree/diritto-penale",
      voci: [
        { d: "Ho ricevuto un'informazione di garanzia: che cosa significa?", r: "<p>Significa che nei suoi confronti sono in corso indagini preliminari: non è un'accusa definitiva né una condanna. L'atto serve a informarla e a invitarla a nominare un difensore di fiducia; se non lo fa, gliene viene assegnato uno d'ufficio.</p><p>È il momento giusto per rivolgersi a un avvocato: nella fase delle indagini si compiono scelte che possono pesare su tutto il procedimento.</p>" },
        { d: "Sono stato convocato per un interrogatorio: devo rispondere?", r: "<p>La persona indagata ha la facoltà di non rispondere, e l'esercizio di questa facoltà non può essere usato contro di lei. Se e come rispondere è una scelta da fare con il proprio difensore, dopo aver valutato gli atti: per questo conviene contattare lo studio prima della data fissata.</p>" },
        { d: "Mi è stato notificato l'avviso di conclusione delle indagini. Cosa posso fare?", r: "<p>Dalla notifica decorrono <strong>venti giorni</strong> in cui è possibile prendere visione degli atti, presentare memorie e documenti, chiedere nuove indagini o di essere interrogati. È una finestra breve e spesso decisiva: conviene muoversi subito.</p>" },
        { d: "Ho ricevuto un decreto penale di condanna: è definitivo?", r: "<p>No, se si propone <strong>opposizione entro quindici giorni</strong> dalla notifica. Scaduto il termine, il decreto diventa esecutivo. Vale la pena farlo esaminare immediatamente, portando con sé la busta o la relata di notifica.</p>" },
        { d: "Ho subito un reato: entro quando posso sporgere querela?", r: "<p>Di regola la querela si presenta <strong>entro tre mesi</strong> dal giorno in cui si è avuta notizia del fatto; per alcuni reati la legge prevede termini più lunghi, e molti reati si perseguono comunque d'ufficio. La persona offesa può poi costituirsi parte civile nel processo per chiedere il risarcimento del danno.</p>" },
      ],
    },
    {
      id: "famiglia",
      titolo: "Famiglia e minori",
      area: "/aree/famiglia-persone-e-minori",
      voci: [
        { d: "Che differenza c'è fra separazione consensuale e giudiziale?", r: "<p>Nella <strong>consensuale</strong> i coniugi raggiungono un accordo su figli, casa e mantenimento, che il giudice verifica; è di solito più rapida e meno onerosa. Nella <strong>giudiziale</strong> le condizioni le decide il giudice, perché un accordo non c'è. Esiste anche la negoziazione assistita dagli avvocati, senza passare dal tribunale.</p>" },
        { d: "Dopo quanto tempo dalla separazione si può chiedere il divorzio?", r: "<p>Dopo <strong>sei mesi</strong> se la separazione è consensuale e dopo <strong>dodici mesi</strong> se è giudiziale, calcolati dalla comparizione dei coniugi davanti al presidente del tribunale o dalla data dell'accordo.</p>" },
        { d: "Le condizioni già stabilite su figli e mantenimento si possono cambiare?", r: "<p>Sì, quando cambiano le circostanze: un nuovo lavoro, un trasferimento, le esigenze dei figli che crescono. La modifica si chiede al giudice, oppure si concorda fra le parti con l'assistenza degli avvocati.</p>" },
      ],
    },
    {
      id: "danno",
      titolo: "Risarcimento del danno",
      area: "/aree/responsabilita-e-risarcimento",
      voci: [
        { d: "Dopo un incidente stradale, entro quando si chiede il risarcimento?", r: "<p>Il diritto al risarcimento dei danni da circolazione si prescrive di regola in <strong>due anni</strong>. La compagnia, ricevuta una richiesta completa, deve formulare un'offerta o motivare il rifiuto entro termini fissati dalla legge. Prima di firmare quietanze o accettare acconti conviene far valutare l'offerta.</p>" },
        { d: "Che cosa conviene conservare dopo un sinistro?", r: "<p>Referti e certificati medici, fotografie dei luoghi e dei danni, il modulo di constatazione amichevole se compilato, i nomi dei testimoni, le ricevute delle spese sostenute. Quello che si documenta nelle prime settimane pesa molto sull'esito.</p>" },
      ],
    },
    {
      id: "studio",
      titolo: "Lo studio",
      area: "",
      voci: [
        { d: "Si può avere un colloquio senza andare in studio?", r: "<p>Sì. Oltre che in sede, in Via della Balduina 107, lo studio riceve in videochiamata e, quando serve, a domicilio o presso l'azienda. Come funziona è spiegato nella pagina <a href=\"/primo-colloquio\">Il primo colloquio</a>.</p>" },
        { d: "Scrivere allo studio vuol dire avergli affidato la pratica?", r: "<p>No. L'invio di un messaggio o la richiesta di un appuntamento non instaurano un rapporto professionale e non interrompono alcun termine: il rapporto sorge solo con il conferimento scritto dell'incarico. Se ci sono scadenze vicine, è bene telefonare.</p>" },
        { d: "In che lingue si può parlare con lo studio?", r: "<p>Oltre all'italiano, in inglese e in francese; l'Avv. Pierpaolo Doro anche in spagnolo.</p>" },
      ],
    },
  ],
  avvertenza:
    "Le informazioni di questa pagina hanno finalità esclusivamente informativa e non costituiscono parere legale. I termini indicati sono quelli generali previsti dalla legge e possono variare nel caso concreto: per una valutazione è necessario un <a href=\"/primo-colloquio\">colloquio</a>.",
};
