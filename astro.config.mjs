import { defineConfig } from "astro/config";
import node from "@astrojs/node";

/*
 * L'indirizzo del sito lo decide CHI installa il modello, non è cablato qui:
 * lo si mette in SITE_URL (nel .env in locale, fra le variabili di Render in
 * produzione). Da lì si costruiscono i link canonici e gli og:url, e da lì
 * si ricava l'host di cui Astro deve fidarsi per accettare i caricamenti di
 * file (vedi `security.allowedDomains`). Con SITE_URL sbagliato il sito
 * funziona ma si indicizza sotto un dominio che non esiste, e le fotografie
 * non si caricano in produzione: sono i due difetti invisibili imparati a
 * caro prezzo nel motore d'origine, qui resi un solo valore da impostare.
 */
const SITO = process.env.SITE_URL || "http://localhost:4321";
const host = (() => {
  try { return new URL(SITO).hostname; } catch { return "localhost"; }
})();

export default defineConfig({
  site: SITO,
  trailingSlash: "ignore",
  build: { format: "directory" },

  /*
   * Web Service, non sito statico: l'editor legge e scrive su Postgres,
   * verifica un cookie, riceve fotografie — cose che un Static Site non fa.
   * Le pagine pubbliche le serve la rotta acchiappatutto, che è `prerender
   * = false` perché ogni pagina vive nel database.
   */
  adapter: node({ mode: "standalone" }),

  /*
   * In ascolto su 0.0.0.0 (host: true), o su Render il controllo delle porte
   * non trova nessuno in ascolto e dichiara il deploy fallito. In locale
   * rende `astro dev` raggiungibile anche dal telefono sulla stessa rete.
   */
  server: { host: true },

  /*
   * Gli host di cui fidarsi per gli invii di moduli (Astro checkOrigin).
   * Dietro il proxy di Render la richiesta arriva con un host interno: senza
   * l'host pubblico qui, Astro ripiega su localhost, non combacia, e i
   * caricamenti di file (multipart) rispondono 403 — mentre il resto
   * funziona. localhost serve allo sviluppo e a `npm run preview`.
   */
  security: {
    allowedDomains: [{ hostname: host }, { hostname: "localhost" }],
  },
});
