/**
 * I testi e le foto di partenza delle pagine disegnate a mano, IN INGLESE.
 *
 * Stessa forma di src/dati/contenuti.mjs, voce per voce: la versione /en del
 * sito li legge al posto di quelli italiani. I recapiti stanno nei «Dati dello
 * studio» (src/dati/en/studio.mjs per i testi tradotti).
 */
import { persone as PERSONE, aree as AREE } from "./studio.mjs";

const R2 = "https://pub-aec503af2a3741499709da5839b4a6cb.r2.dev/immagini";

// ─────────────────────────────────────────────── la home (l'anticamera)
export const home = {
  occhiello: "Rome Bar",
  studioLegale: "Studio Legale",
  sigla: "G.D.D.",
  frase: "Legal counsel that combines tradition with care for the individual, in memory of Dott. Tommaso Novelli.",
  accedi: "Enter the practice",
  indirizzo: "Via della Balduina 107 · Rome",
  dedica: {
    etichetta: "The dedication",
    nome: "Dott. Tommaso Novelli",
    nota: "First President Emeritus of the Supreme Court of Cassation, to whose memory the practice is dedicated.",
    link: "In memory of Dott. Novelli →",
  },
  tratti: [
    { titolo: "One lawyer for each matter", testo: "Whoever takes on your case remains your point of contact until it is concluded." },
    { titolo: "In person or remotely", testo: "Meetings by appointment, at our offices, by video call or at the client's premises." },
    { titolo: "From prevention to trial", testo: "Advice before a problem arises, and representation at every level of proceedings when needed." },
  ],
  aree: { etichetta: "Practice areas", titolo: "What the practice does" },
  persone: {
    etichetta: "Our people",
    titolo: "Who works at the practice",
    foto: `${R2}/gdd-gruppo-img_9838.webp`,
    tutti: "The practice's team →",
  },
  luogo: {
    etichetta: "Where we are",
    riga1: "Via della Balduina 107",
    riga2: "00136 Rome",
    foto: "/foto/ingresso.webp",
  },
  chiusura: { titolo: "The door is open.", accedi: "Enter the practice" },
};

// ─────────────────────────────────────────────── Tommaso Novelli
export const novelli = {
  occhio: "In memoriam",
  nome1: "Dott. Tommaso",
  nome2: "Novelli",
  carica1: "First President Emeritus",
  carica2: "of the Supreme Court of Cassation",
  foto: "/foto/novelli.webp",
  citazione: "“To my grandfather, a constant guide and an inexhaustible source of inspiration.”",
  autore: "Avv. Luca Giurato",
  colonne: [
    {
      etichetta: "A life devoted to justice",
      testo: "A judge for almost fifty years, Dott. Tommaso Novelli served at the Court of Cassation as judge, counsellor and president of division, and at the Ministry of Justice; from 1978 to 1981 he was First President of the Supreme Court. His legacy lives on in the rigour of his judgement and in his respect for all those who turn to the law.",
    },
    {
      etichetta: "A practice that carries his memory",
      testo: "Studio Legale G.D.D. is founded on a passion for the profession and on the human and ethical values that Dott. Novelli passed on to his grandson, Avv. Luca Giurato. The practice is dedicated to his memory.",
    },
  ],
  /* Dalle fonti ufficiali: Corte Suprema di Cassazione, «Primi Presidenti»
     (cortedicassazione.it). Da far confermare alla famiglia. */
  cronologia: {
    occhio: "His life",
    titolo: "A life in the judiciary",
    tappe: [
      { anno: "1911", testo: "Born on 4 April in Formicola, in the province of Caserta." },
      { anno: "1933", testo: "Joins the judiciary at the age of twenty-two." },
      { anno: "1956", testo: "With Mario Battaglini, edits the “Code of Civil Procedure annotated with the case law of the Court of Cassation” (Giuffrè), which he will keep updating until the 1990 edition." },
      { anno: "1960s", testo: "At the Ministry of Justice he serves as deputy head of the Minister's cabinet, then as director general of Civil Affairs and the Liberal Professions." },
      { anno: "1978", testo: "On 20 July he is appointed First President of the Supreme Court of Cassation, having previously served there as judge, counsellor and president of division." },
      { anno: "1981", testo: "On 23 April he leaves the Presidency and the judiciary." },
      { anno: "1986", testo: "Concludes his presidency of a division of the Central Tax Commission, a position he held for decades." },
      { anno: "2014", testo: "Dies in Rome on 26 September, at the age of one hundred and three." },
    ],
  },
  valori: [
    { titolo: "Integrity", testo: "Saying clearly what can reasonably be expected, and acting accordingly." },
    { titolo: "Probity", testo: "The trust of those who turn to the practice is the first duty of every mandate." },
    { titolo: "Commitment", testo: "Constant study and professional development, because every defence deserves the same care." },
  ],
  oltre: { occhio: "The practice", titolo: "Who works in his memory today", bottone: "Enter the practice", link: "Practice areas →" },
};

// ─────────────────────────────────────────────── Lo studio
export const studio = {
  occhio: "The practice",
  titolo: "A practice in Rome, <em>on the side</em> of the individual.",
  lead: "An experienced practice: over twenty years in the profession for its founder, and the memory of the man who passed it on to him.",
  colonne: [
    {
      etichetta: "Our history",
      testo: "Studio Legale G.D.D. was founded in Rome in October 2025, in Via della Balduina, out of the experience of its founder, Avv. Luca Giurato, and the human and ethical values passed on to him by his grandfather, Dott. Tommaso Novelli, First President Emeritus of the Supreme Court of Cassation, to whose memory the practice is dedicated.",
    },
    {
      etichetta: "What we do",
      testo: "The practice acts for individuals and companies, chiefly in criminal matters — including corporate and tax crime — and in civil, company and family matters, both at the preventive and advisory stage and in court, at every level of proceedings.",
    },
    {
      etichetta: "How it is organised",
      testo: "The practice is headed by Avv. Luca Giurato, its principal. He works alongside Avv. Pierpaolo Doro and Dott.ssa Maria Chiara Del Ninno, trainee lawyer. Every matter is handled personally by the lawyers; for deeds that fall within a notary's remit, the practice works with Notary Dott.ssa Giuditta Lombardo, in Rome. As regards expert consultants, the practice has worked for over a decade with leading professionals in every field connected with the conduct of a defence: town planning, forensic medicine, road accident reconstruction engineering, environmental matters, tax and business operations. The practice also works with established private investigators.",
    },
    {
      etichetta: "Where",
      testo: "At Via della Balduina 107, behind the red door: a waiting room and separate rooms for meetings, so that what is said in the office stays in the office. The premises are fully accessible, with no architectural barriers.",
    },
  ],
  ambienti: {
    occhio: "The premises",
    titolo: "Inside the practice",
    foto: [
      { url: "/foto/ambiente-scrivania.webp", alt: "The principal's office", largo: true },
      { url: "/foto/ambiente-libreria.webp", alt: "The library", largo: false },
      { url: "/foto/ambiente-vetrate.webp", alt: "The rooms, divided by glass", largo: true },
      { url: "/foto/ambiente-quadri.webp", alt: "The views on the walls", largo: false },
      { url: "/foto/ambiente-toga.webp", alt: "The lawyer's gown", largo: true },
      { url: "/foto/ambiente-stanza.webp", alt: "A room for confidential meetings", largo: true },
    ],
  },
  metodo: {
    occhio: "Our approach",
    titolo: "How the practice works",
    voci: [
      { titolo: "One point of contact", testo: "Every matter is handled personally by a lawyer, who remains the client's point of contact from the first meeting to its conclusion." },
      { titolo: "Clarity from the outset", testo: "At the first consultation we explain the available options, including that of taking no action, and the likely timescale of each. Mandates are conferred in writing." },
      { titolo: "Confidentiality", testo: "Whatever is said to the lawyer is covered by professional secrecy, even if no mandate follows. Meetings are held in separate rooms." },
    ],
  },
  /* «In sintesi»: sede, orari, come arrivare e accesso vengono dai «Dati dello
     studio»; qui le etichette e le voci che sono solo testo. */
  breve: {
    occhio: "At a glance",
    titolo: "The practice, in brief",
    nota: "Contact details and the form for writing to the practice are on the Contact page.",
    etichette: { sede: "Office", riceve: "Meetings", orari: "Hours", lingue: "Languages", arrivare: "Getting here", accesso: "Access", albo: "Bar", assicurazione: "Insurance" },
    riceve: "By appointment: at our offices, by video call or, where needed, at the client's home or business premises.",
    lingue: "Italian, English, French and Spanish.",
    albo: "The practice's lawyers are members of the Rome Bar Association.",
    assicurazione: "Professional liability insurance pursuant to Article 12 of Law no. 247/2012: the details are in the <a href=\"/note-legali\">legal notice</a>.",
  },
  professionisti: { occhio: "Our team", titolo: "Who handles your matters", bottone: "Meet the team" },
};

// ─────────────────────────────────────────────── I professionisti
export const professionisti = {
  occhio: "Our team",
  titolo: "Who handles <em>your</em> matters.",
  lead: "A team of professionals at work on every matter.",
  etichetteDati: { albo: "Bar admission", lingue: "Languages", contatti: "Contacts", materie: "Fields", curriculum: "Curriculum vitae" },
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
  occhio: "Practice areas",
  titolo: "Our fields, <em>followed</em> closely.",
  lead: "These are the fields the practice regularly deals with. For a matter that falls outside them, the practice will say so straight away and, where possible, refer you to a colleague who handles it.",
  vai: "Find out more",
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
export function area(slug, titolo = "New area") {
  const a = AREE.find((x) => x.slug === slug);
  return {
    titolo: a?.titolo ?? titolo,
    sintesi: a?.sintesi ?? "One or two lines summarising the field.",
    corpo: a?.corpo ?? "<p>The text of the area: how the practice works in this field, what is worth knowing, what to bring to the first meeting.</p>",
    etichettaMaterie: "In particular",
    materie: a?.materie ?? ["An item"],
    etichettaChi: "Handled by",
    referenti: REFERENTI[slug] ?? [],
    domande: DOMANDE[slug] ?? "",
    linkDomande: "Frequently asked questions on this field →",
  };
}

// ─────────────────────────────────────────────── Contatti
export const contatti = {
  occhio: "Contact",
  titolo: "Via della Balduina <em>107</em>, Rome.",
  lead: "Meetings are by appointment: at our offices, by video call or, when needed, at your home or business. To arrange one, a phone call or a message is all it takes.",
  telefonoNota: "Monday–Friday, 9:00–13:00 and 15:00–19:30",
  cellulareNota: "To book an appointment",
  arrivare: { occhio: "Getting here", titolo: "Look for the <em>red</em> door.", foto: "/foto/portone.webp" },
  modi: ["At our offices", "By video call", "At your home or business"],
  mappa: { indicazioni: "Directions ↗" },
  scrivere: { occhio: "Write to the practice", titolo: "A few lines are enough.", bottone: "Send message" },
  grazie: "Thank you: your message has reached the practice. We will get back to you.",
  avvertenze: {
    etichetta: "Before you write",
    testo:
      "<p>It helps to describe the matter, who the other people involved are, and whether any deadlines are approaching: a notice served, a letter received, a hearing already scheduled.</p>" +
      "<p><strong>Sending a message does not establish a professional relationship</strong> and does not interrupt any time limit. Until a written mandate is conferred, the practice is under no obligation to take any action in your defence.</p>" +
      "<p>For the same reason, it is best not to attach documents or confidential details: these are reviewed at the appointment.</p>",
    link: "How the first meeting works →",
  },
};

// ─────────────────────────────────────────────── Il primo colloquio
export const colloquio = {
  occhio: "The first meeting",
  titolo: "From first contact <em>to engagement</em>.",
  lead: "Turning to a lawyer, especially for the first time, raises many questions. Here is how the first meeting with the practice works, step by step.",
  passi: [
    { titolo: "First contact", testo: "Call the practice or write using the form on the Contact page. A few lines are enough: what the matter is about, who the other people involved are, and whether any dates are close — a notice served, a hearing, a time limit about to expire." },
    { titolo: "The appointment", testo: "The practice arranges the meeting at its offices, by video call or, when needed, at your home or business. Before meeting you, it checks that there is no conflict of interest with other clients." },
    { titolo: "The meeting", testo: "We listen to your account, go through the documents together and explain the possible courses of action — including that of taking no action — with the likely timeframe of each. Everything you say is covered by professional secrecy." },
    { titolo: "If you decide to proceed", testo: "The mandate is conferred in writing. From that moment, the lawyer who receives it handles the matter personally and remains your point of contact until it is concluded." },
  ],
  portare: {
    occhio: "What to prepare",
    titolo: "What to bring to the meeting",
    nota: "You don't need to have everything: we start from what there is, and the rest can be gathered later.",
    voci: [
      "An identity document",
      "All documents received, with their envelopes or certificates of service: time limits depend on the dates",
      "Contracts, letters, emails and messages relating to the matter",
      "Any decisions already issued (judgments, decrees, official records)",
      "A short note of the main dates, even handwritten",
      "The names and contact details of the other people involved, if known",
    ],
  },
  riservatezza: {
    etichetta: "Confidentiality",
    testo: "What you tell your lawyer is covered by professional secrecy, even if no mandate follows. For this reason it is best not to share confidential details by email or through the form: they are discussed in person.",
  },
  urgenza: {
    etichetta: "If it is urgent",
    testo: "A document just served, a hearing coming up, a time limit about to expire: call the practice straight away and say so from the very first words.",
  },
  avvertenza:
    "Sending a message or requesting an appointment does not establish a professional relationship and does not interrupt any time limit: the relationship begins with the written conferral of the mandate. The information on this page is general. More answers in the <a href=\"/domande-frequenti\">frequently asked questions</a>.",
};

// ─────────────────────────────────────────────── Domande frequenti
export const domande = {
  occhio: "Frequently asked questions",
  titolo: "The questions <em>everyone</em> asks before the first meeting.",
  lead: "The answers are general and do not take the specific case into account, which may change them entirely: they are meant to help you find your bearings, not to make decisions.",
  linkArea: "The practice area →",
  gruppi: [
    {
      id: "penale",
      titolo: "Criminal law",
      area: "/aree/diritto-penale",
      voci: [
        { d: "I have received a notice of investigation (informazione di garanzia): what does it mean?", r: "<p>It means that a preliminary investigation is under way concerning you: it is neither a final charge nor a conviction. The notice serves to inform you and to invite you to appoint a defence lawyer of your choice; if you do not, a court-appointed lawyer will be assigned to you.</p><p>This is the right time to consult a lawyer: choices made during the investigation stage can weigh on the entire proceedings.</p>" },
        { d: "I have been summoned for questioning: do I have to answer?", r: "<p>A person under investigation has the right to remain silent, and exercising this right cannot be used against them. Whether and how to answer is a decision to be made with your defence lawyer, after reviewing the file: that is why you should contact the practice before the scheduled date.</p>" },
        { d: "I have been served with a notice of conclusion of the investigation. What can I do?", r: "<p>From the date of service you have <strong>twenty days</strong> to inspect the file, submit briefs and documents, request further investigation or ask to be questioned. It is a short and often decisive window: act immediately.</p>" },
        { d: "I have received a criminal conviction by decree (decreto penale di condanna): is it final?", r: "<p>No, provided you lodge an <strong>objection within fifteen days</strong> of service. Once that time limit has passed, the decree becomes enforceable. Have it reviewed immediately, bringing the envelope or the certificate of service with you.</p>" },
        { d: "I have been the victim of an offence: how long do I have to file a criminal complaint?", r: "<p>As a rule, a complaint (querela) must be filed <strong>within three months</strong> of the day you became aware of the offence; for some offences the law provides longer time limits, and many offences are prosecuted ex officio in any case. The victim may then join the criminal proceedings as a civil party to claim compensation for damages.</p>" },
      ],
    },
    {
      id: "famiglia",
      titolo: "Family and minors",
      area: "/aree/famiglia-persone-e-minori",
      voci: [
        { d: "What is the difference between consensual and judicial separation?", r: "<p>In a <strong>consensual</strong> separation the spouses reach an agreement on children, the family home and maintenance, which the court reviews; it is usually quicker and less costly. In a <strong>judicial</strong> separation the terms are decided by the court, because no agreement has been reached. There is also negotiation assisted by lawyers, without going to court.</p>" },
        { d: "How long after separation can one apply for divorce?", r: "<p>After <strong>six months</strong> if the separation was consensual and after <strong>twelve months</strong> if it was judicial, counted from the spouses' appearance before the president of the court or from the date of the agreement.</p>" },
        { d: "Can terms already set for children and maintenance be changed?", r: "<p>Yes, when circumstances change: a new job, a move, the needs of growing children. The change is requested from the court, or agreed between the parties with the assistance of their lawyers.</p>" },
      ],
    },
    {
      id: "danno",
      titolo: "Compensation for damages",
      area: "/aree/responsabilita-e-risarcimento",
      voci: [
        { d: "After a road accident, how long do I have to claim compensation?", r: "<p>The right to compensation for damage caused by road traffic is, as a rule, time-barred after <strong>two years</strong>. Once it receives a complete claim, the insurance company must make an offer or give reasons for refusing it within time limits set by law. Before signing any release or accepting any advance payment, have the offer assessed.</p>" },
        { d: "What should I keep after an accident?", r: "<p>Medical reports and certificates, photographs of the scene and of the damage, the joint accident report form if completed, the names of witnesses, and receipts for expenses incurred. What is documented in the first few weeks weighs heavily on the outcome.</p>" },
      ],
    },
    {
      id: "studio",
      titolo: "The practice",
      area: "",
      voci: [
        { d: "Can I have a meeting without coming to the office?", r: "<p>Yes. As well as at its offices in Via della Balduina 107, the practice meets clients by video call and, when needed, at their home or business. How it works is explained on the page <a href=\"/primo-colloquio\">The first meeting</a>.</p>" },
        { d: "Does writing to the practice mean I have entrusted it with my matter?", r: "<p>No. Sending a message or requesting an appointment does not establish a professional relationship and does not interrupt any time limit: the relationship arises only with the written conferral of the mandate. If deadlines are close, it is best to phone.</p>" },
        { d: "In which languages can I speak with the practice?", r: "<p>Besides Italian, in English and French; Avv. Pierpaolo Doro also speaks Spanish.</p>" },
      ],
    },
  ],
  avvertenza:
    "The information on this page is provided for information purposes only and does not constitute legal advice. The time limits indicated are the general ones provided by law and may vary in the specific case: an assessment requires a <a href=\"/primo-colloquio\">meeting</a>.",
};
