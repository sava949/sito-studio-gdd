# Studio Legale Ferrante — sito costruito con l'editor di siti

Il sito gira sul **motore di Editor-Siti** (Astro 5 SSR + Neon + R2): ogni
pagina è una riga della tabella `pagine`, composta a foglio libero
dall'editor in `/admin`. Il motore è descritto in `ARCHITETTURA.md`.

Prima era un sito disegnato a mano (una rotta per pagina, schede in
`documents`). Quella versione sta nella storia di git, prima del passaggio al
motore nuovo.

## Avvio

```bash
npm ci
cp .env.example .env     # DATABASE_URL, ADMIN_SECRET, R2_*, SITE_URL
npm run dev              # http://localhost:4321
npm run build && npm start
npm run check            # deve dire 0 errors
npm run chiave "Nome"    # una chiave di accesso all'editor (/accesso o /admin?t=…)
npm run semina           # riscrive le pagine dello studio (vedi sotto)
npm run esporta          # il sito come file statici, in esportato/
npm run espelli          # il sito come progetto Astro statico, in espulso/
```

## Da dove vengono le pagine

`strumenti/semina-avvocato.mjs` ricostruisce il sito dello studio come dati
dell'editor: home, lo studio, le aree (con le sottopagine), gli aggiornamenti
(con le note), contatti, note legali e privacy, più nome, testata, piè di
pagina e tema.

- I testi vengono da `db/contenuti-avvocato.json`, la fotografia del vecchio
  database, che a sua volta era nato dai Markdown in `db/contenuti-iniziali/`.
- I dati dello studio (indirizzo, P. IVA, albo, polizza) stanno in cima allo
  script.
- Le posizioni sul foglio si calcolano dalle altezze in
  `db/misure-avvocato.json`. Dopo aver cambiato un testo nello script:
  `npm run build && node strumenti/semina-avvocato.mjs --misura`, che apre le
  pagine in Chrome, le misura e le reimpagina.

**Attenzione:** rilanciare lo script **sovrascrive** le pagine che crea,
comprese le modifiche fatte dall'editor. Serve per l'installazione, non per il
lavoro di tutti i giorni.

Su un database nuovo: eseguire `db/schema.sql`, poi `npm run semina`, poi
`npm run chiave "Nome"`.

## Da sostituire prima della consegna

I contenuti sono verosimili ma **inventati**.

1. **I dati dello studio**: nel piè di pagina («Aspetto e testo»), in
   Contatti, Note legali e Privacy, oppure in cima allo script prima di
   seminare. Il **numero di polizza RC** è un obbligo di legge (art. 12 L.
   247/2012): finché resta segnaposto, le note legali sono incomplete.
2. **I testi** di aree, note e schede: vanno rivisti e approvati
   dall'avvocato, perché la responsabilità deontologica è sua.

## Vincoli deontologici

L'art. 35 del Codice deontologico forense ammette un'informazione veritiera,
non comparativa, non equivoca. Il sito quindi non contiene risultati, nomi di
clienti, superlativi né recensioni. La clausola «non costituisce parere
legale» sta nel piè di pagina di ogni pagina.

La pagina contatti **non ha un modulo**, per scelta: un form raccoglie dati su
vicende giudiziarie prima che esista un incarico, e l'informativa privacy
dice che il sito non ne ha. L'editor ha il blocco «Modulo di contatto»: se lo
si aggiunge, va rivista la privacy.

Le pagine caricano i caratteri da Google Fonts, e la privacy lo dichiara.

## Deploy (Render)

Web Service Node: build `npm ci && npm run build`, start `npm start`. Le
variabili sono quelle di `.env.example`. `SITE_URL` è l'indirizzo pubblico:
senza, i caricamenti di foto rispondono 403. `ADMIN_SECRET` deve essere
diversa da quella locale.

`Editor_Python/` è una proposta alternativa del vecchio pannello e non va
distribuita.

## Limite noto

Il foglio libero rimpicciolisce tutto in proporzione: sul telefono il testo
diventa piccolo. È il compromesso del motore, già accettato.
