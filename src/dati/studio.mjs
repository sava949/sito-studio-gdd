/**
 * I dati dello Studio Legale G.D.D., in un posto solo.
 *
 * Li leggono le pagine disegnate a mano (home, Lo studio, Aree, Contatti,
 * Tommaso Novelli) e lo script strumenti/semina-avvocato.mjs, che ne ricava
 * le pagine del database (menu, SEO, note legali, privacy). Vengono dal
 * questionario compilato dallo studio (settembre 2026) e dai curricula.
 * I testi delle aree sono da far rivedere allo studio.
 */

// ─────────────────────────────────────────────── lo studio
// Mancano ancora: i massimali delle polizze.
export const studio = {
  nome: "Studio Legale G.D.D.",
  denominazione: "Studio Legale G.D.D. — Avv. Luca Giurato — Avv. Pierpaolo Doro",
  titolare: "Avv. Luca Giurato",
  sottotitolo: "Del Foro di Roma",
  via: "Via della Balduina 107", cap: "00136", citta: "Roma", provincia: "RM",
  telefono: "+39 06 8891 7777", telefonoLink: "+390688917777",
  cellulare: "+39 338 711 9804", cellulareLink: "+393387119804",
  pec: "lucagiurato@ordineavvocatiroma.org",
  pec2: "pierpaolodoro@ordineavvocatiroma.org",
  partitaIva: "IT09810431008", codiceFiscale: "GRTLCU79H05H501C", sdi: "W7YVJK9",
  orari: "Lunedì–venerdì, 9:00–13:00 e 15:00–19:30",
  email: "info@studiolegalegdd.com",
  // Come arrivare (Contatti e home).
  metro: "Linea A, fermata Cipro",
  treno: "Regionale, stazione Balduina",
  autobus: "Linea 990 da piazzale degli Eroi, fermate lungo via della Balduina",
  accesso: "Senza barriere architettoniche",
  // La fascia prima del piè di pagina, su ogni pagina interna.
  invitoEtichetta: "Su appuntamento",
  invitoFrase: "Ogni questione comincia da un colloquio.",
  invitoBottone: "Fissare un appuntamento",
  polizze: [
    { intestatario: "Avv. Luca Giurato", numero: "BLS3403316" },
    { intestatario: "Avv. Pierpaolo Doro", numero: "ICNF000002/023635" },
  ],
  compagnia: "AIG Europe S.A. — Rappresentanza Generale per l'Italia, Piazza Vetra 17, 20123 Milano",
};

// ─────────────────────────────────────────────── le persone
// `foto`: il ritratto in public/foto/. `bio` è HTML. `cv`: il curriculum in
// PDF, in public/cv/, così come l'ha consegnato la persona.
export const persone = [
  {
    nome: "Avv. Luca Giurato",
    foto: "giurato",
    cv: "/cv/CV-Luca-Giurato.pdf",
    ruolo: "Titolare e fondatore",
    bio:
      "<p>L'Avv. Luca Giurato, dedito professionista, è da oltre venti anni impegnato nella tutela della persona fisica e giuridica, sia nella fase preventiva che nei successivi sviluppi processuali. Lo svolgimento dell'attività forense è ispirato ai principi della correttezza, della probità e del costante impegno e aggiornamento, volto a offrire il miglior servizio nello svolgimento del mandato.</p>" +
      // Dal curriculum (settembre 2026).
      "<p>Laureato in Giurisprudenza all'Università degli Studi Roma Tre, ha svolto la pratica forense presso lo Studio Casellato – Avvocati Penalisti, dove ha esercitato la professione dal 2007. Nel 2005/2006 ha conseguito l'attestato del XIV Corso annuale di preparazione alla carriera giudiziaria e alla professione forense presso l'Istituto Regionale di Studi Giuridici del Lazio «Arturo Carlo Jemolo». Dal 2009 ha collaborato con lo studio dell'Avv. Giuseppe Bellomo e dal 2017 esercita in proprio; nell'ottobre 2025 ha fondato lo studio di Via della Balduina.</p>" +
      "<p>Dal 2011 è cultore della materia presso la cattedra di Diritto Penale del Prof. Roberto Zannotti e, dal 2018, presso quella di Diritto Penale dell'Economia del Prof. David Terracina, all'Università LUMSA di Roma. Ha insegnato diritto penale e procedura penale in alcuni corsi di preparazione all'esame di avvocato, dal 2014 al 2017. Dal 2015 al 2017 è stato docente nel Master Executive DRPI della Sapienza, sulla responsabilità penale del professionista. Ha partecipato, quale relatore, a diversi convegni sulle materie di diritto penale e processuale penale. Dal 2024 ha partecipato, nella qualità di docente, al Corso indetto dalla Camera Civile di Roma per la formazione degli Amministratori di Sostegno, nell'ambito di una sessione sulle tematiche inerenti i profili sostanziali e di procedura penale.</p>" +
      "<p>È stato componente della commissione per l'esame di avvocato del Distretto di Roma nelle sessioni 2021 e 2025. Ha svolto la funzione di Organismo di Vigilanza monocratico, ai sensi del d.lgs. 231/2001, e ha partecipato alla redazione di modelli organizzativi per diversi enti.</p>",
    albo: "Iscritto all'Ordine degli Avvocati di Roma dal 2007. Abilitato al patrocinio davanti alle giurisdizioni superiori dal 2021.",
    lingue: "Italiano, inglese",
    contatti: [
      { testo: "lucagiurato@ordineavvocatiroma.org", href: "mailto:lucagiurato@ordineavvocatiroma.org" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/luca-giurato-217739440" },
    ],
    materie: [
      "Diritto penale e processuale penale",
      "Diritto penale tributario",
      "Diritto d'impresa e societario",
      "Diritto di famiglia",
      "Diritto fallimentare",
    ],
  },
  {
    nome: "Avv. Pierpaolo Doro",
    foto: "doro",
    cv: "/cv/CV-Pierpaolo-Doro.pdf",
    ruolo: "Avvocato",
    bio:
      "<p>Si è laureato in Giurisprudenza presso la LUMSA di Roma nel 2019, con una tesi in diritto processuale penale sulla confisca antimafia, e presso la stessa università ha conseguito nel 2025 il Master in Diritto Penale d'Impresa.</p>" +
      "<p>Ha svolto il tirocinio presso il Tribunale di Roma e la Corte d'Appello di Roma, sezione penale, e ha collaborato con altri studi legali romani prima di entrare nello studio. Ha svolto pratica notarile in materia di contratti, successioni e diritto societario.</p>" +
      "<p>È assistente alla cattedra di Diritto Penale della LUMSA e cura il progetto di divulgazione giuridica «L'Ora Legale».</p>",
    albo: "Iscritto all'Ordine degli Avvocati di Roma dal 2023.",
    lingue: "Italiano, inglese, spagnolo, francese",
    contatti: [
      { testo: "pierpaolodoro22@gmail.com", href: "mailto:pierpaolodoro22@gmail.com" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/pierpaolo-doro-21b9261a6" },
    ],
    materie: [
      "Diritto penale e processuale penale",
      "Diritto penale minorile",
      "Diritto penale tributario",
      "Diritto d'impresa e societario",
      "Diritto fallimentare",
      "Diritto civile",
      "Diritto di famiglia",
      "Responsabilità e risarcimento del danno",
      "Volontaria giurisdizione",
    ],
  },
  {
    nome: "Dott.ssa Maria Chiara Del Ninno",
    foto: "delNinno",
    cv: "/cv/CV-Maria-Chiara-Del-Ninno.pdf",
    ruolo: "Praticante avvocato",
    bio:
      "<p>Si è laureata in Giurisprudenza presso l'Università degli Studi Roma Tre nel 2025, con una tesi in diritto penale sull'intelligenza artificiale come possibile autore del reato.</p>" +
      "<p>Dal dicembre 2025 svolge la pratica forense presso lo studio, in ambito penale: ricerca giuridica, studio degli atti processuali e predisposizione degli atti. Collabora con la cattedra di Diritto Penale I e II dell'Università LUMSA e frequenta la Scuola Forense «Vittorio Emanuele Orlando» di Roma.</p>",
    albo: "Iscritta al Registro dei praticanti dell'Ordine degli Avvocati di Roma.",
    lingue: "Italiano, inglese, francese",
    contatti: [
      { testo: "mariachiara.delninno@gmail.com", href: "mailto:mariachiara.delninno@gmail.com" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/maria-chiara-del-ninno-6a43a8391" },
    ],
    materie: [],
  },
];

// ─────────────────────────────────────────────── le aree di attività
// Dal questionario, sezione 4: tolta «Lavoro», aggiunta l'area penale (la
// principale), civile allargata a impresa e volontaria giurisdizione,
// famiglia allargata ai minori.
export const aree = [
  {
    slug: "diritto-penale",
    titolo: "Diritto penale e processuale penale",
    sintesi: "Difesa di indagati e imputati e assistenza alla persona offesa, in ogni fase del procedimento: penale d'impresa, tributario, fallimentare e minorile; responsabilità amministrativa degli enti, ai sensi del D.L.vo n. 231/2001.",
    corpo:
      "<p>Il diritto penale è la materia principale dello studio. L'assistenza riguarda sia chi è sottoposto a indagini o imputato, sia la persona offesa dal reato, che può costituirsi parte civile nel processo per ottenere il risarcimento del danno.</p>" +
      "<h3>Dalle indagini al giudizio</h3><p>Le scelte più importanti si fanno spesso prima del processo: durante le indagini preliminari, all'interrogatorio, nella valutazione di un rito alternativo. Per questo conviene rivolgersi a un avvocato appena si riceve un atto — un invito a eleggere domicilio, l'avviso di conclusione delle indagini — e non a ridosso dell'udienza.</p><p>Lo studio assiste in tutti i gradi di giudizio, compresa la Cassazione, e nei procedimenti cautelari e di esecuzione.</p>" +
      "<h3>Impresa, fisco e crisi d'impresa</h3><p>Una parte dell'attività riguarda i reati che nascono nella vita dell'impresa: reati societari e tributari, bancarotta e reati fallimentari, responsabilità degli enti. In queste materie la difesa richiede di leggere insieme il profilo penale, quello civilistico e quello contabile, spesso con l'aiuto di consulenti.</p>" +
      "<h3>I minori</h3><p>Lo studio segue anche i procedimenti davanti al Tribunale per i minorenni, dove il processo ha regole e finalità proprie, orientate al recupero del minore.</p>" +
      "<h3>Al primo incontro</h3><p>È utile portare tutti gli atti ricevuti, con le buste o le relate di notifica: dalle date dipendono termini che non si possono recuperare.</p>",
    materie: [
      "Difesa nelle indagini preliminari e nel processo",
      "Assistenza alla persona offesa e costituzione di parte civile",
      "Misure cautelari e riesame",
      "Impugnazioni e ricorso per Cassazione",
      "Reati tributari",
      "Reati societari e d'impresa",
      "Bancarotta e reati fallimentari",
      "Responsabilità degli enti (d.lgs. 231/2001)",
      "Diritto penale minorile",
      "Esecuzione penale",
    ],
  },
  {
    slug: "diritto-civile-e-impresa",
    titolo: "Diritto civile e d'impresa",
    sintesi: "Contratti e inadempimenti, diritto societario, crisi d'impresa e procedure concorsuali, successioni e volontaria giurisdizione.",
    corpo:
      "<p>Lo studio assiste privati e imprese nella fase in cui un rapporto si costruisce — la redazione di un contratto, la costituzione di una società — e in quella in cui si guasta. Sono due momenti diversi, e chiedono cose diverse: prima serve prevedere per iscritto ciò che potrà accadere, poi serve leggere quello che è stato scritto.</p>" +
      "<h3>Prima della firma</h3><p>La maggior parte delle controversie nasce da clausole scritte in fretta o copiate da un modello pensato per un altro affare. La revisione preventiva di un contratto costa una frazione di quanto costa una causa sullo stesso contratto, e permette di decidere consapevolmente dove assumersi un rischio e dove no.</p>" +
      "<h3>Società e crisi d'impresa</h3><p>Per le imprese lo studio segue gli aspetti societari — rapporti fra soci, responsabilità degli amministratori, operazioni sul capitale — e le situazioni di crisi, dagli strumenti di composizione alle procedure concorsuali, assistendo sia l'impresa sia i creditori.</p>" +
      "<h3>Quando il rapporto si guasta</h3><p>Prima di una causa vengono quasi sempre altre strade: una diffida, una trattativa, la mediazione — che in diverse materie è condizione di procedibilità della domanda. Lo studio le percorre e ne dà conto, indicando fin dall'inizio tempi e costi prevedibili di ciascuna.</p>" +
      "<h3>Volontaria giurisdizione</h3><p>Sono i procedimenti in cui non c'è una controparte ma serve un provvedimento del giudice: le autorizzazioni per gli atti che riguardano minori o persone incapaci, l'amministrazione di sostegno, l'accettazione dell'eredità con beneficio d'inventario.</p>",
    materie: [
      "Redazione e revisione di contratti",
      "Inadempimento e risoluzione",
      "Recupero del credito e opposizioni",
      "Diritto societario e rapporti fra soci",
      "Responsabilità degli amministratori",
      "Crisi d'impresa e procedure concorsuali",
      "Successioni e divisioni ereditarie",
      "Volontaria giurisdizione",
    ],
  },
  {
    slug: "famiglia-persone-e-minori",
    titolo: "Famiglia, persone e minori",
    sintesi: "Separazione, divorzio, affidamento e mantenimento dei figli, tutela dei minori, unioni civili e convivenze, amministrazione di sostegno.",
    corpo:
      "<p>È la materia in cui il risultato tecnico e il risultato umano non coincidono quasi mai. Una decisione può essere ineccepibile in diritto e insostenibile da vivere per anni, e sono anni che riguardano dei figli.</p><p>Per questo lo studio spiega, prima di ogni altra cosa, quali sono le strade disponibili e cosa comporta ciascuna in termini di tempo, di costo e di rapporti che restano.</p>" +
      "<h3>Le strade fuori dal tribunale</h3><p>La negoziazione assistita e la separazione consensuale non sono ripieghi: dove c'è un accordo possibile, sono più rapide, meno costose e producono condizioni che le parti hanno scritto invece di subire. Lo studio le propone quando ci sono le condizioni, e dice con chiarezza quando non ci sono.</p>" +
      "<h3>Quando serve il giudice</h3><p>In presenza di violenza, di sottrazione di beni o di un disaccordo che nessuna trattativa può colmare, la via giudiziale è quella giusta e va percorsa subito. Anche in quel caso la strada resta modificabile: le condizioni su affidamento e mantenimento si rivedono quando cambiano i presupposti.</p>" +
      "<h3>I minori e le persone fragili</h3><p>Lo studio assiste nei procedimenti a tutela dei minori e segue quelli di amministrazione di sostegno, dalla richiesta alla rendicontazione annuale, assistendo sia chi promuove il ricorso sia l'amministratore già nominato.</p>",
    materie: [
      "Separazione e divorzio, consensuali e giudiziali",
      "Affidamento e mantenimento dei figli",
      "Negoziazione assistita",
      "Unioni civili e convivenze di fatto",
      "Tutela dei minori",
      "Amministrazione di sostegno e tutele",
      "Modifica delle condizioni già stabilite",
    ],
  },
  {
    slug: "responsabilita-e-risarcimento",
    titolo: "Responsabilità e risarcimento del danno",
    sintesi: "Colpa professionale medica, sinistri stradali, responsabilità professionale e contrattuale, rapporti con le compagnie assicurative.",
    corpo:
      "<p>Il risarcimento è una materia in cui la prova conta più dell'argomento. Quello che si riesce a documentare nelle prime settimane — referti, fotografie, nomi dei testimoni, spese sostenute — decide l'esito molto più della qualità degli atti che verranno scritti mesi dopo.</p><p>Per questo lo studio dà per primo un elenco preciso di cosa raccogliere e di cosa non fare: sottoscrivere una quietanza, accettare un acconto, o firmare una dichiarazione ricostruttiva prima di aver capito la propria posizione sono gesti che pesano fino alla fine.</p>" +
      "<h3>La colpa professionale medica</h3><p>Ha regole proprie, a partire dall'obbligo di esperire un accertamento tecnico preventivo o la mediazione prima della causa. È anche la materia in cui il parere di un medico legale va chiesto <strong>prima</strong> di decidere se agire: lo studio lavora con consulenti esterni e mette in conto quel costo fin dall'inizio.</p>" +
      "<h3>Il rapporto con la compagnia</h3><p>La compagnia assicurativa ha un obbligo di offerta entro termini stabiliti, e un'offerta che arriva non è necessariamente un'offerta congrua. La differenza fra quanto viene proposto e quanto è dovuto si misura sulle tabelle in uso e sulla documentazione medico-legale, non sulla trattativa.</p>",
    materie: [
      "Colpa professionale medica",
      "Sinistri stradali e danno alla persona",
      "Responsabilità professionale",
      "Danno da inadempimento contrattuale",
      "Trattativa e transazione con l'assicuratore",
      "Accertamento tecnico preventivo",
      "Danno derivante da reato",
    ],
  },
];
