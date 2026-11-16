import { neon } from "@neondatabase/serverless";

/**
 * La connessione a Neon, in un posto solo.
 *
 * `neon()` non apre una connessione: manda ogni query come una richiesta HTTP
 * al bordo di Neon. È la ragione per cui questo progetto non ha un pool da
 * gestire, e soprattutto per cui sopravvive bene a un servizio che si spegne
 * e si riaccende — su Render il processo riparte a ogni deploy, e un pool
 * andrebbe riaperto ogni volta.
 *
 * Il prezzo è che ogni query è un viaggio di rete a sé: qui va benissimo,
 * perché le pagine fanno una o due letture. Il giorno che una pagina ne
 * facesse venti in fila, si passerebbe a una connessione vera.
 */

const url =
  (import.meta.env as any).DATABASE_URL ?? process.env.DATABASE_URL ?? "";

/*
 * Si controlla all'IMPORT e non alla prima query, di proposito: un servizio
 * che parte e poi cade sulla prima cosa che gli si chiede sembra rotto in modo
 * misterioso. Uno che non parte, dicendo quale variabile manca, si aggiusta in
 * trenta secondi.
 *
 * Si controlla anche la FORMA, e non solo che ci sia qualcosa. Con una
 * stringa malformata `neon()` solleva dentro il worker della build, e su
 * Windows quell'eccezione esce come «Assertion failed: !(handle->flags &
 * UV_HANDLE_CLOSING)» — un messaggio che non nomina il database, non nomina
 * la variabile, e manda a cercare un difetto che non esiste. Trovato
 * lanciando una build con un valore finto.
 */
if (!url) {
  throw new Error(
    "DATABASE_URL non è impostata. È la stringa di connessione di Neon: " +
      "vedi .env.example e ADMIN.md.",
  );
}
if (!/^postgres(ql)?:\/\/[^@]+@[^/]+\/.+/.test(url)) {
  throw new Error(
    "DATABASE_URL non sembra una stringa di connessione Postgres. " +
      "Dev'essere nella forma postgresql://utente:password@host/database — " +
      "la trovi nella sezione «Connect» del progetto Neon.",
  );
}

export const sql = neon(url);
