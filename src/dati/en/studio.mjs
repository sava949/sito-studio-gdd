/**
 * I dati dello Studio Legale G.D.D. — versione INGLESE.
 *
 * Stessa forma di src/dati/studio.mjs (stesse chiavi, stessi elenchi nello
 * stesso ordine, stessi slug e recapiti): cambiano solo i testi. Se si
 * modifica la versione italiana, va aggiornata anche questa.
 */

// ─────────────────────────────────────────────── lo studio
export const studio = {
  nome: "Studio Legale G.D.D.",
  denominazione: "Studio Legale G.D.D. — Avv. Luca Giurato — Avv. Pierpaolo Doro",
  titolare: "Avv. Luca Giurato",
  sottotitolo: "Rome Bar",
  via: "Via della Balduina 107", cap: "00136", citta: "Rome", provincia: "RM",
  telefono: "+39 06 8891 7777", telefonoLink: "+390688917777",
  cellulare: "+39 338 711 9804", cellulareLink: "+393387119804",
  pec: "lucagiurato@ordineavvocatiroma.org",
  pec2: "pierpaolodoro@ordineavvocatiroma.org",
  partitaIva: "IT09810431008", codiceFiscale: "GRTLCU79H05H501C", sdi: "W7YVJK9",
  orari: "Monday–Friday, 9:00–13:00 and 15:00–19:30",
  email: "info@studiolegalegdd.com",
  // Come arrivare (Contatti e home).
  metro: "Line A, Cipro station",
  treno: "Regional train, Balduina station",
  autobus: "Bus 990 from Piazzale degli Eroi, stops along Via della Balduina",
  accesso: "Step-free access",
  // La fascia prima del piè di pagina, su ogni pagina interna.
  invitoEtichetta: "By appointment",
  invitoFrase: "Every matter begins with a conversation.",
  invitoBottone: "Book an appointment",
  polizze: [
    { intestatario: "Avv. Luca Giurato", numero: "BLS3403316" },
    { intestatario: "Avv. Pierpaolo Doro", numero: "ICNF000002/023635" },
  ],
  compagnia: "AIG Europe S.A. — General Representation for Italy, Piazza Vetra 17, 20123 Milan",
};

// ─────────────────────────────────────────────── le persone
export const persone = [
  {
    nome: "Avv. Luca Giurato",
    foto: "giurato",
    cv: "/cv/CV-Luca-Giurato.pdf",
    ruolo: "Principal and founder",
    bio:
      "<p>A dedicated practitioner, Avv. Luca Giurato has for more than twenty years been committed to protecting the interests of individuals and companies, both at the preventive stage and throughout any subsequent proceedings. His practice is guided by the principles of fairness, integrity and constant commitment and professional development, with the aim of offering the best possible service in every mandate.</p>" +
      "<p>He graduated in Law from Roma Tre University and completed his legal traineeship at Studio Casellato – Avvocati Penalisti, where he practised from 2007. In 2005/2006 he obtained the certificate of the 14th annual course preparing for the judiciary and the legal profession at the Istituto Regionale di Studi Giuridici del Lazio “Arturo Carlo Jemolo”. From 2009 he worked with the chambers of Avv. Giuseppe Bellomo, and since 2017 he has practised on his own account; in October 2025 he founded the firm in Via della Balduina.</p>" +
      "<p>Since 2011 he has been a teaching fellow (cultore della materia) in Criminal Law under Prof. Roberto Zannotti and, since 2018, in Economic Criminal Law under Prof. David Terracina, at LUMSA University in Rome. From 2014 to 2017 he taught criminal law and criminal procedure on several Bar examination preparation courses. From 2015 to 2017 he lectured on the Executive Master DRPI at Sapienza University of Rome, on the criminal liability of professionals. He has spoken at a number of conferences on criminal law and criminal procedure. Since 2024 he has lectured on the course organised by the Camera Civile di Roma for the training of support administrators (amministratori di sostegno), in a session on substantive and procedural criminal law issues.</p>" +
      "<p>He sat on the Bar examination board for the Rome District in the 2021 and 2025 sessions. He has served as sole member of the Supervisory Body (Organismo di Vigilanza) under Legislative Decree no. 231/2001, and has helped draft compliance and organisational models for a number of companies and organisations.</p>",
    albo: "Admitted to the Rome Bar Association in 2007. Qualified to appear before the higher courts since 2021.",
    lingue: "Italian, English",
    contatti: [
      { testo: "lucagiurato@ordineavvocatiroma.org", href: "mailto:lucagiurato@ordineavvocatiroma.org" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/luca-giurato-217739440" },
    ],
    materie: [
      "Criminal law and criminal procedure",
      "Tax crime",
      "Corporate and commercial law",
      "Family law",
      "Insolvency law",
    ],
  },
  {
    nome: "Avv. Pierpaolo Doro",
    foto: "doro",
    cv: "/cv/CV-Pierpaolo-Doro.pdf",
    ruolo: "Lawyer",
    bio:
      "<p>He graduated in Law from LUMSA University in Rome in 2019, with a thesis in criminal procedure on anti-mafia confiscation, and in 2025 obtained a Master's in Corporate Criminal Law from the same university.</p>" +
      "<p>He completed his traineeship at the Court of Rome and in the criminal division of the Rome Court of Appeal, and worked with other Rome law firms before joining the firm. He has also completed a notarial traineeship in contracts, succession and company law.</p>" +
      "<p>He is a teaching assistant in Criminal Law at LUMSA University and runs the legal outreach project «L'Ora Legale».</p>",
    albo: "Admitted to the Rome Bar Association in 2023.",
    lingue: "Italian, English, Spanish, French",
    contatti: [
      { testo: "pierpaolodoro22@gmail.com", href: "mailto:pierpaolodoro22@gmail.com" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/pierpaolo-doro-21b9261a6" },
    ],
    materie: [
      "Criminal law and criminal procedure",
      "Juvenile criminal law",
      "Tax crime",
      "Corporate and commercial law",
      "Insolvency law",
      "Civil law",
      "Family law",
      "Liability and compensation for damages",
      "Non-contentious proceedings",
    ],
  },
  {
    nome: "Dott.ssa Maria Chiara Del Ninno",
    foto: "delNinno",
    cv: "/cv/CV-Maria-Chiara-Del-Ninno.pdf",
    ruolo: "Trainee lawyer",
    bio:
      "<p>She graduated in Law from Roma Tre University in 2025, with a thesis in criminal law on artificial intelligence as a possible perpetrator of crime.</p>" +
      "<p>Since December 2025 she has been completing her legal traineeship at the firm in criminal matters: legal research, review of case files and drafting of pleadings. She works with the Chair of Criminal Law I and II at LUMSA University and attends the «Vittorio Emanuele Orlando» Law School in Rome.</p>",
    albo: "Registered as a trainee with the Rome Bar Association.",
    lingue: "Italian, English, French",
    contatti: [
      { testo: "mariachiara.delninno@gmail.com", href: "mailto:mariachiara.delninno@gmail.com" },
      { testo: "LinkedIn", href: "https://www.linkedin.com/in/maria-chiara-del-ninno-6a43a8391" },
    ],
    materie: [],
  },
];

// ─────────────────────────────────────────────── le aree di attività
export const aree = [
  {
    slug: "diritto-penale",
    titolo: "Criminal law and criminal procedure",
    sintesi: "Defence of suspects and defendants and assistance to victims of crime, at every stage of the proceedings: corporate, tax, insolvency and juvenile criminal law; administrative liability of companies under Legislative Decree no. 231/2001.",
    corpo:
      "<p>Criminal law is the firm's principal area of practice. We act both for those under investigation or on trial and for victims of crime, who may join the criminal proceedings as civil parties to claim compensation.</p>" +
      "<h3>From investigation to trial</h3><p>The most important decisions are often taken before the trial: during the preliminary investigation, at interview, when considering an alternative procedure. That is why it is best to consult a lawyer as soon as you receive a formal notice — an invitation to elect an address for service, a notice of conclusion of the investigation — rather than on the eve of a hearing.</p><p>The firm acts at every level of jurisdiction, including the Court of Cassation, and in precautionary and enforcement proceedings.</p>" +
      "<h3>Business, tax and insolvency</h3><p>Part of our work concerns offences arising in the life of a business: corporate and tax offences, fraudulent bankruptcy and insolvency offences, corporate liability. In these matters the defence requires the criminal, civil and accounting aspects to be read together, often with the support of expert consultants.</p>" +
      "<h3>Minors</h3><p>The firm also handles proceedings before the Juvenile Court, where the process has its own rules and aims, directed at the rehabilitation of the young person.</p>" +
      "<h3>At the first meeting</h3><p>Please bring every document you have received, together with the envelopes or certificates of service: the dates determine time limits that cannot be recovered.</p>",
    materie: [
      "Defence during the preliminary investigation and at trial",
      "Assistance to victims and civil party claims",
      "Precautionary measures and review",
      "Appeals and appeals to the Court of Cassation",
      "Tax offences",
      "Corporate and business offences",
      "Fraudulent bankruptcy and insolvency offences",
      "Corporate liability (Legislative Decree no. 231/2001)",
      "Juvenile criminal law",
      "Enforcement of sentences",
    ],
  },
  {
    slug: "diritto-civile-e-impresa",
    titolo: "Civil and business law",
    sintesi: "Contracts and breach, company law, business crisis and insolvency proceedings, succession and non-contentious proceedings.",
    corpo:
      "<p>The firm assists individuals and businesses both when a relationship is being built — drafting a contract, setting up a company — and when it breaks down. These are two different moments, and they call for different things: first you need to foresee in writing what may happen, then you need to read carefully what was written.</p>" +
      "<h3>Before signing</h3><p>Most disputes stem from clauses written in haste or copied from a template designed for a different deal. Reviewing a contract in advance costs a fraction of litigating over it, and makes it possible to decide knowingly where to accept a risk and where not to.</p>" +
      "<h3>Companies and business crisis</h3><p>For businesses, the firm handles company law matters — relations between shareholders, directors' liability, capital transactions — and situations of crisis, from restructuring tools to insolvency proceedings, acting for both the business and its creditors.</p>" +
      "<h3>When the relationship breaks down</h3><p>Before going to court there are almost always other routes: a formal demand, negotiation, mediation — which in several areas is a mandatory precondition for bringing a claim. The firm pursues them and reports on them, setting out from the start the likely timescales and costs of each.</p>" +
      "<h3>Non-contentious proceedings</h3><p>These are proceedings in which there is no opposing party but a court order is required: authorisations for acts concerning minors or persons lacking capacity, support administration (amministrazione di sostegno), acceptance of an inheritance with the benefit of inventory.</p>",
    materie: [
      "Drafting and review of contracts",
      "Breach and termination",
      "Debt recovery and oppositions",
      "Company law and shareholder relations",
      "Directors' liability",
      "Business crisis and insolvency proceedings",
      "Succession and division of estates",
      "Non-contentious proceedings",
    ],
  },
  {
    slug: "famiglia-persone-e-minori",
    titolo: "Family, individuals and minors",
    sintesi: "Separation, divorce, child custody and maintenance, protection of minors, civil unions and cohabitation, support administration.",
    corpo:
      "<p>This is the area in which the legal outcome and the human outcome almost never coincide. A decision can be flawless in law and yet impossible to live with for years — years that involve children.</p><p>That is why, before anything else, the firm explains the available options and what each one entails in terms of time, cost and the relationships that remain.</p>" +
      "<h3>Routes outside the courtroom</h3><p>Assisted negotiation and consensual separation are not second-best solutions: where agreement is possible, they are quicker, less costly and produce terms that the parties have written themselves rather than had imposed on them. The firm proposes them when the conditions exist, and says clearly when they do not.</p>" +
      "<h3>When a judge is needed</h3><p>Where there is violence, removal of assets or a disagreement that no negotiation can bridge, court proceedings are the right route and should be taken without delay. Even then, the arrangements can be changed: terms on custody and maintenance are reviewed when circumstances change.</p>" +
      "<h3>Minors and vulnerable people</h3><p>The firm acts in proceedings for the protection of minors and handles support administration proceedings, from the initial application to the annual accounts, assisting both the applicant and the administrator once appointed.</p>",
    materie: [
      "Separation and divorce, by consent and contested",
      "Child custody and maintenance",
      "Assisted negotiation",
      "Civil unions and cohabitation",
      "Protection of minors",
      "Support administration and guardianship",
      "Variation of existing arrangements",
    ],
  },
  {
    slug: "responsabilita-e-risarcimento",
    titolo: "Liability and compensation for damages",
    sintesi: "Medical malpractice, road traffic accidents, professional and contractual liability, dealings with insurance companies.",
    corpo:
      "<p>Compensation is an area in which evidence counts for more than argument. What can be documented in the first few weeks — medical reports, photographs, names of witnesses, expenses incurred — determines the outcome far more than the quality of the pleadings drafted months later.</p><p>That is why the firm's first step is to provide a precise list of what to gather and what not to do: signing a receipt in full settlement, accepting an advance payment, or signing a statement of events before understanding your own position are actions that carry weight until the very end.</p>" +
      "<h3>Medical malpractice</h3><p>It has its own rules, starting with the obligation to undergo a preliminary technical assessment or mediation before bringing a claim. It is also the area in which the opinion of a forensic medical expert must be sought <strong>before</strong> deciding whether to act: the firm works with external consultants and accounts for that cost from the outset.</p>" +
      "<h3>Dealing with the insurer</h3><p>The insurance company is obliged to make an offer within set time limits, and an offer that arrives is not necessarily a fair one. The gap between what is offered and what is owed is measured against the applicable compensation tables and the forensic medical evidence, not by negotiation.</p>",
    materie: [
      "Medical malpractice",
      "Road traffic accidents and personal injury",
      "Professional liability",
      "Damages for breach of contract",
      "Negotiation and settlement with insurers",
      "Preliminary technical assessment",
      "Damages arising from crime",
    ],
  },
];
