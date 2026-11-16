-- Editor di siti — schema Neon (Postgres). Eseguire una volta dalla console
-- SQL di Neon (o dal DB di prova). Erede dello schema del motore d'origine,
-- generalizzato: le pagine sono un ALBERO con un percorso, non una collezione
-- piatta, perché un costruttore di siti ha bisogno di sottopagine e di menu.

-- ─────────────────────────────────────────────────────────────────────────
-- Le PAGINE del sito, ad albero.
--
-- `percorso` è l'indirizzo pubblico completo ("/", "/servizi",
-- "/servizi/consulenza"): è la chiave con cui la rotta acchiappatutto trova
-- la pagina da disegnare, quindi è unico e indicizzato.
--
-- `genitore` + `ordine` fanno l'albero: una pagina annidata sotto un'altra è
-- una sottopagina, e l'ordine decide la posizione fra i fratelli e nel menu.
-- Cancellando una pagina, l'albero sotto di lei se ne va con lei (cascade):
-- una sottopagina senza genitore non avrebbe indirizzo.
--
-- `dati` è quello che il sito mostra: titolo, i blocchi della pagina, i campi
-- SEO, il modo di composizione. `bozza` è il lavoro in corso — si salva lì, e
-- solo «Pubblica» la travasa in `dati`. `pubblicata` è l'unico segnale che
-- dice se il mondo la può vedere: una pagina appena creata nasce falsa.
create table if not exists pagine (
  id          bigserial   primary key,
  percorso    text        not null unique,
  genitore    bigint      references pagine(id) on delete cascade,
  ordine      integer     not null default 0,
  nel_menu    boolean     not null default true,
  dati        jsonb       not null default '{}'::jsonb,
  bozza       jsonb,
  pubblicata  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pagine_genitore_idx on pagine (genitore, ordine);
create index if not exists pagine_menu_idx on pagine (nel_menu, ordine) where pubblicata;

-- ─────────────────────────────────────────────────────────────────────────
-- Le cose valide per TUTTO il sito, una riga per chiave: 'tema' (colori,
-- font, stile pulsanti), 'layout' (testata, piè di pagina, logo),
-- 'impostazioni' (nome del sito, lingua, dominio). Anche queste con una
-- bozza, così un cambio di tema si prova prima di pubblicarlo su ogni pagina.
create table if not exists sito (
  chiave      text        primary key,
  dati        jsonb       not null default '{}'::jsonb,
  bozza       jsonb,
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Storico: una riga per ogni salvataggio, con il contenuto PRECEDENTE, per
-- «riporta a com'era». `tipo`+`riferimento` dicono a cosa appartiene: una
-- pagina (tipo 'pagina', riferimento = percorso) o una chiave di sito.
create table if not exists versioni (
  id           bigserial   primary key,
  tipo         text        not null,
  riferimento  text        not null,
  dati         jsonb       not null,
  saved_at     timestamptz not null default now()
);

create index if not exists versioni_idx on versioni (tipo, riferimento, saved_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Libreria immagini su R2. Si tiene la chiave (per cancellarle dal bucket) e
-- l'url pubblico (per mostrarle).
create table if not exists media (
  id          bigserial   primary key,
  chiave      text        not null unique,
  url         text        not null,
  larghezza   integer,
  altezza     integer,
  byte        integer,
  alt         text        not null default '',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- I MESSAGGI dei moduli di contatto. Il primo «servizio»: il form del sito
-- scrive qui (sempre), e se le credenziali email sono configurate manda anche
-- una notifica. `pagina` è il percorso da cui è arrivato; `letto` distingue i
-- nuovi dalla posta già vista, per la casella nell'editor.
create table if not exists messaggi (
  id          bigserial   primary key,
  pagina      text        not null default '',
  nome        text        not null default '',
  email       text        not null default '',
  messaggio   text        not null default '',
  letto       boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messaggi_idx on messaggi (letto, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Chiavi di accesso all'editor. Si salva SOLO l'hash SHA-256, mai la chiave
-- in chiaro: se il database trapela, le chiavi non sono dentro.
create table if not exists chiavi_accesso (
  id           bigserial   primary key,
  hash         text        not null unique,
  etichetta    text        not null,
  created_at   timestamptz not null default now(),
  usata_il     timestamptz,
  revocata_il  timestamptz
);

-- La home ('/') esiste sempre: un sito senza radice non è un sito. Nasce
-- vuota e pubblicata, così appena installato l'editor ha già un foglio bianco
-- su cui aprire. `on conflict do nothing`: rieseguire lo schema non la tocca.
insert into pagine (percorso, ordine, nel_menu, dati, pubblicata)
values ('/', 0, false, '{"titolo":"Home","modo":"foglio","blocchi":[]}'::jsonb, true)
on conflict (percorso) do nothing;
