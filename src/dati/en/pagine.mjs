/**
 * La versione inglese delle pagine del database: titolo (menu), sottotitolo,
 * descrizione SEO e, per le pagine rese dai blocchi (Note legali, Privacy),
 * i testi dei blocchi. Ogni voce di `blocchi` si fonde sul blocco del
 * database con lo stesso indice: qui ci sono solo i testi, la posizione
 * resta quella del database. Anche il piè di pagina e il sottotitolo della
 * testata.
 */

const AREE = {
  penale: "Criminal law and criminal procedure",
  civile: "Civil and business law",
  famiglia: "Family, individuals and minors",
  danno: "Liability and compensation for damages",
};

export const pagine = {
  "/": {
    titolo: "Studio Legale G.D.D.",
    sottotitolo:
      "Founded on a passion for the profession and on the human and ethical values handed down by the Founder's grandfather, the Firm provides legal assistance that combines tradition and professional excellence.",
    seo: {
      descrizione:
        "Studio Legale G.D.D., a law firm in Rome (Balduina): criminal law and criminal procedure, corporate and tax crime, civil and company law, family and minors.",
    },
  },
  "/studio": {
    titolo: "The firm",
    sottotitolo: "About us",
    seo: {
      descrizione:
        "Studio Legale G.D.D. in Rome: its history, how it is organised, how it works and the premises at Via della Balduina 107.",
    },
  },
  "/professionisti": {
    titolo: "Our team",
    seo: {
      descrizione:
        "The lawyers of Studio Legale G.D.D. in Rome: profiles, curricula, fields of practice and Bar admissions.",
    },
  },
  "/aree": {
    titolo: "Practice areas",
    sottotitolo: "What the firm does",
    seo: {
      descrizione:
        "The firm's practice areas: criminal law and criminal procedure, civil and business law, family and minors, liability and compensation for damages.",
    },
  },
  "/aree/diritto-penale": {
    titolo: AREE.penale,
    sottotitolo:
      "Defence of suspects and defendants and assistance to victims, at every stage of the proceedings: corporate, tax, insolvency and juvenile criminal law; administrative liability of entities under Legislative Decree no. 231/2001.",
    seo: {
      descrizione:
        "Defence of suspects and defendants and assistance to victims, at every stage of the proceedings: corporate, tax, insolvency and juvenile criminal law; administrative liability of entities under Legislative Decree no. 231/2001.",
    },
  },
  "/aree/diritto-civile-e-impresa": {
    titolo: AREE.civile,
    sottotitolo:
      "Contracts and breach of contract, company law, business crisis and insolvency proceedings, inheritance and non-contentious proceedings.",
    seo: {
      descrizione:
        "Contracts and breach of contract, company law, business crisis and insolvency proceedings, inheritance and non-contentious proceedings.",
    },
  },
  "/aree/famiglia-persone-e-minori": {
    titolo: AREE.famiglia,
    sottotitolo:
      "Separation, divorce, custody and maintenance of children, protection of minors, civil unions and cohabitation, support administration.",
    seo: {
      descrizione:
        "Separation, divorce, custody and maintenance of children, protection of minors, civil unions and cohabitation, support administration.",
    },
  },
  "/aree/responsabilita-e-risarcimento": {
    titolo: AREE.danno,
    sottotitolo:
      "Medical malpractice, road traffic accidents, professional and contractual liability, dealings with insurance companies.",
    seo: {
      descrizione:
        "Medical malpractice, road traffic accidents, professional and contractual liability, dealings with insurance companies.",
    },
  },
  "/tommaso-novelli": {
    titolo: "Tommaso Novelli",
    sottotitolo: "First President Emeritus of the Supreme Court of Cassation",
    seo: {
      descrizione:
        "Studio Legale G.D.D. is dedicated to the memory of Dott. Tommaso Novelli, First President Emeritus of the Supreme Court of Cassation.",
    },
  },
  "/primo-colloquio": {
    titolo: "The consultation",
    seo: {
      descrizione: "How the first consultation with the firm works: from the first contact to the engagement.",
    },
  },
  "/domande-frequenti": {
    titolo: "FAQ",
    seo: { descrizione: "The questions most frequently asked of the firm." },
  },
  "/contatti": {
    titolo: "Contact",
    sottotitolo: "How to reach the firm",
    seo: {
      descrizione:
        "Contact details, address and opening hours of Studio Legale G.D.D., Via della Balduina 107, 00136 Rome. By appointment only.",
    },
  },
  "/note-legali": {
    titolo: "Legal notice",
    seo: {
      descrizione:
        "Identification details, Bar admissions, professional liability insurance and terms of use of the Studio Legale G.D.D. website.",
    },
    blocchi: [
      {
        dati: {
          html:
            "<h3>Website owner</h3><p>Studio Legale G.D.D. — Avv. Luca Giurato — Avv. Pierpaolo Doro<br>Via della Balduina 107, 00136 Rome (RM), Italy<br>VAT no. IT09810431008 — Tax code GRTLCU79H05H501C — Recipient code (SDI) W7YVJK9<br>Telephone +39 06 8891 7777 — Certified email (PEC) <a href=\"mailto:lucagiurato@ordineavvocatiroma.org\">lucagiurato@ordineavvocatiroma.org</a></p>" +
            "<h3>Bar admission</h3><p><strong>Avv. Luca Giurato</strong>, admitted to the Rome Bar Association (Ordine degli Avvocati di Roma) under no. A35823 since 11 October 2007; admitted to practise before the higher courts since 19 March 2021.</p><p><strong>Avv. Pierpaolo Doro</strong>, admitted to the Rome Bar Association under no. A53440 since 25 January 2023.</p><p><strong>Dott.ssa Maria Chiara Del Ninno</strong>, trainee lawyer, entered in the Register of Trainee Lawyers of the Rome Bar Association under no. P80855 since 29 December 2025.</p><p>Professional title obtained in Italy. Their practice is governed by the Italian law on the legal profession (Law no. 247/2012) and by the Italian Code of Conduct for Lawyers (Codice deontologico forense), available on the website of the National Bar Council (Consiglio Nazionale Forense).</p>" +
            "<h3>Professional liability insurance</h3><p>Pursuant to Article 12 of Law no. 247/2012, the firm's lawyers are insured with AIG Europe S.A. — General Representation for Italy, Piazza Vetra 17, 20123 Milan:</p><p>Avv. Luca Giurato: policy no. BLS3403316<br>Avv. Pierpaolo Doro: policy no. ICNF000002/023635</p>" +
            "<h3>Nature of the information published</h3><p>The contents of this website are for information purposes only, in accordance with Article 35 of the Code of Conduct for Lawyers. They are written in general terms and <strong>do not constitute legal advice</strong>: they do not take into account the circumstances of any specific case, which may radically alter their conclusions.</p><p>No information on this website constitutes an invitation to act or to refrain from acting. The firm accepts no liability for decisions taken solely on the basis of reading these pages.</p>" +
            "<h3>Professional relationship</h3><p>Browsing this website, sending communications and requesting an appointment do not create any lawyer-client relationship. That relationship arises only upon the written conferral of a mandate, accompanied by the information on fees required by Article 13 of Law no. 247/2012.</p>" +
            "<h3>Ownership of contents</h3><p>The texts, photographs, structure and graphics of this website belong to the firm. Quoting excerpts is permitted provided the source is stated and a link to the original page is given; reproduction in full for commercial purposes is not permitted.</p>" +
            "<h3>Links to external websites</h3><p>This website may contain links to resources managed by third parties. The firm has no control over their contents and accepts no liability for their accuracy or for the processing of data that takes place on them.</p>" +
            "<h3>Dispute resolution</h3><p>Complaints concerning the professional relationship may be addressed to the Council of the Rome Bar Association (Consiglio dell'Ordine degli Avvocati di Roma), which has jurisdiction over disciplinary matters and over attempts at conciliation on fee disputes.</p>" +
            "<h3>Governing law</h3><p>Use of this website is governed by Italian law. Disputes are subject to the rules on jurisdiction and venue laid down by law, including the mandatory rules protecting consumers.</p>",
        },
      },
    ],
  },
  "/privacy": {
    titolo: "Privacy",
    sottotitolo:
      "Information on the processing of personal data pursuant to Articles 13 and 14 of Regulation (EU) 2016/679 (GDPR).",
    seo: {
      descrizione:
        "Studio Legale G.D.D.'s information notice on the processing of personal data, pursuant to Articles 13 and 14 of Regulation (EU) 2016/679.",
    },
    blocchi: [
      {
        dati: {
          html:
            "<h3>Data controller</h3><p>Studio Legale G.D.D. — Avv. Luca Giurato — Avv. Pierpaolo Doro, Via della Balduina 107, 00136 Rome (RM), Italy. To exercise your rights: certified email (PEC) <a href=\"mailto:lucagiurato@ordineavvocatiroma.org\">lucagiurato@ordineavvocatiroma.org</a>, or by post to the firm's address.</p>" +
            "<h3>What data this website collects</h3><p>This website <strong>does not use profiling cookies and does not employ any analytics or advertising tools.</strong> No visitor profiles are created.</p><p>As with any website, the server hosting it records technical data about requests — IP address, date and time, page requested, browser type — in the system logs. These data are needed to ensure the operation and security of the service (legal basis: legitimate interest, Art. 6(1)(f) GDPR) and are kept for no longer than strictly necessary for that purpose.</p>" +
            "<h3>The contact form</h3><p>Anyone using the form on the Contact page provides their name, email address and the text of their message. These data are used solely to reply and to assess the possible conferral of a mandate (legal basis: pre-contractual measures, Art. 6(1)(b) GDPR), and are stored in the reserved area of the website, accessible only to members of the firm.</p><p>Where the communication concerns legal proceedings, it may contain special categories of data or data relating to criminal convictions and offences: their processing is permitted where it is necessary for the establishment, exercise or defence of legal claims (Arts. 9(2)(f) and 10 GDPR). For this reason, you are advised to limit your first message to what is needed for the firm to contact you.</p><p>If no mandate follows, messages are deleted within twelve months of receipt, except for what is needed to document the absence of conflicts of interest. If a mandate is conferred, the retention periods applicable to the professional file apply. The same applies to messages sent by email or certified email (PEC).</p>" +
            "<h3>The map</h3><p>The Contact page shows a Google Maps map (Google Ireland Limited). When that page is opened, the browser connects to Google's servers, which receive the visitor's IP address and may set their own cookies, in accordance with Google's privacy policy (policies.google.com/privacy). Anyone who prefers to avoid this may refrain from opening the Contact page: all of the firm's contact details are also shown at the bottom of every page.</p>" +
            "<h3>Fonts served by third parties</h3><p>The pages load their fonts from the Google Fonts service (Google Ireland Limited). To obtain them, the browser sends a request to the provider's servers, which therefore receive the visitor's IP address. This processing is necessary for the pages to be displayed correctly (legitimate interest).</p>" +
            "<h3>To whom data may be disclosed</h3><p>Data are neither disseminated nor sold. They may be disclosed only to parties acting on behalf of the firm (providers of hosting, database and email services, appointed as data processors) and, where necessary for the mandate, to judicial authorities, opposing parties, expert witnesses and local correspondent lawyers.</p>" +
            "<h3>Transfers outside the European Union</h3><p>Some providers (hosting, Google) may also process data outside the European Union: in that case the transfer takes place on the basis of the safeguards provided for by the GDPR, such as adequacy decisions of the European Commission or standard contractual clauses.</p>" +
            "<h3>Your rights</h3><p>Anyone may request access to their data, rectification, erasure, restriction of processing and data portability, and may object to processing based on legitimate interest (Arts. 15–22 GDPR). Requests should be sent to the contact details given above and will be answered within one month.</p><p>You also have the right to lodge a complaint at any time with the Garante per la protezione dei dati personali [Italian Data Protection Authority] (Piazza Venezia 11, 00187 Rome — garanteprivacy.it).</p>" +
            "<h3>Updates</h3><p>This notice may be amended to reflect changes in the law or in technology. The version published on this page is the one currently in force.</p>",
        },
      },
    ],
  },
};

export const piePagina =
  "<div class=\"colonne\"><div><h2>Firm</h2><p><strong>Studio Legale G.D.D.</strong><br>Via della Balduina 107<br>00136 Rome (RM), Italy</p></div><div><h2>Contacts</h2><p><a href=\"tel:+390688917777\">+39 06 8891 7777</a><br><a href=\"tel:+393387119804\">+39 338 711 9804</a><br><a href=\"mailto:info@studiolegalegdd.com\">info@studiolegalegdd.com</a><br>PEC <a href=\"mailto:lucagiurato@ordineavvocatiroma.org\">lucagiurato@ordineavvocatiroma.org</a></p></div><div><h2>Details</h2><p>VAT no. IT09810431008<br>Tax code GRTLCU79H05H501C<br>Rome Bar Association</p></div><div><h2>This site</h2><p><a href=\"/note-legali\">Legal notice</a><br><a href=\"/privacy\">Privacy</a><br><a href=\"/aree\">Practice areas</a><br><a href=\"/primo-colloquio\">The first consultation</a><br><a href=\"/domande-frequenti\">Frequently asked questions</a></p></div></div>" +
  "<p class=\"clausola\">The information published on this website is for information purposes only: it does not constitute legal advice and is no substitute for professional advice on a specific case. Browsing this website and sending communications do not create any lawyer-client relationship, which arises only upon the written conferral of a mandate.</p>" +
  "<p class=\"clausola\">© 2026 Studio Legale G.D.D. — Avv. Luca Giurato — Avv. Pierpaolo Doro — Via della Balduina 107, 00136 Rome, Italy. All rights reserved.</p>";

export const sottotitolo = "Rome Bar";
