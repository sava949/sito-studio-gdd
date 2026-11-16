/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /**
     * Vero quando la pagina è servita DENTRO l'editor, a una sessione
     * autenticata che ha chiesto `?componi=1`: i template aggiungono gli
     * attributi che rendono i testi scrivibili sul posto. Per chiunque
     * altro — visitatori compresi, anche con `?componi=1` a mano — resta
     * falso, e la pagina esce pulita, identica a sempre.
     */
    componi?: boolean;
    /** "en" per le pagine servite sotto /en (vedi src/lib/lingua.ts). */
    lingua?: "it" | "en";
  }
}
