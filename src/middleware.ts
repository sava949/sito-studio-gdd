import { defineMiddleware } from "astro:middleware";
import { NOME_COOKIE, sessioneValida, verificaToken, creaSessione, opzioniCookie, troppiTentativi } from "./lib/auth";
import { collegamentiInInglese } from "./lib/lingua";

const protetto = (percorso: string) =>
  percorso === "/admin" || percorso.startsWith("/admin/") || percorso.startsWith("/api/admin/");

export const onRequest = defineMiddleware(async (context, next) => {
  const percorso = context.url.pathname;

  /* Un indirizzo solo per Google: chi arriva da *.onrender.com viene mandato
     (301) sul dominio di SITE_URL, se è un dominio vero. Solo GET e HEAD e
     mai le API, che l'editor chiama dalla pagina in cui si trova. */
  const host = (context.request.headers.get("x-forwarded-host") ?? context.request.headers.get("host") ?? "").split(":")[0];
  const sito = context.site;
  if (
    sito && host.endsWith(".onrender.com") && !sito.hostname.endsWith(".onrender.com") &&
    ["GET", "HEAD"].includes(context.request.method) && !percorso.startsWith("/api/")
  ) {
    return context.redirect(new URL(percorso + context.url.search, sito).href, 301);
  }

  /* La versione inglese: /en/… è la stessa pagina di /…, servita con
     `locals.lingua = "en"`, e i collegamenti interni dell'HTML restano in
     inglese. Solo le pagine pubbliche, e mai in composizione. */
  const en = percorso.match(/^\/en(\/.*)?$/);
  if (en) {
    const destinazione = en[1] && en[1] !== "/" ? en[1].replace(/\/$/, "") : "/";
    if (protetto(destinazione) || destinazione === "/accesso") return context.redirect(destinazione, 302);
    context.locals.lingua = "en";
    const risposta = await next(destinazione + context.url.search);
    if (!(risposta.headers.get("content-type") ?? "").includes("text/html")) return risposta;
    const html = collegamentiInInglese(await risposta.text()).replace(/<html lang="it"/, '<html lang="en"');
    const intestazioni = new Headers(risposta.headers);
    intestazioni.delete("content-length");
    return new Response(html, { status: risposta.status, statusText: risposta.statusText, headers: intestazioni });
  }

  if (!protetto(percorso)) {
    /* Una pagina pubblica chiesta con `?componi=1` DA UNA SESSIONE VALIDA si
       serve in versione componibile: i template aggiungono gli attributi che
       la rendono scrivibile sul posto. La verifica della sessione è la parte
       che conta — chiunque può scrivere `?componi=1` nella barra, e deve
       ricevere la pagina normale, identica a sempre, senza nemmeno capire
       che il parametro esiste. */
    if (context.url.searchParams.has("componi")) {
      const valida = await sessioneValida(context.cookies.get(NOME_COOKIE)?.value);
      if (valida) {
        context.locals.componi = true;
        const risposta = await next();
        risposta.headers.set("X-Robots-Tag", "noindex, nofollow");
        return risposta;
      }
    }
    return next();
  }

  const secure = context.url.protocol === "https:";

  /* Ingresso con token nell'URL: si verifica, si scambia con un cookie e si
     reindirizza subito su /admin pulito. Il token non deve restare
     nell'URL, altrimenti finisce in cronologia, nei log e nel Referer. */
  const token = context.url.searchParams.get("t");
  if (token) {
    const ip = context.clientAddress ?? "sconosciuto";
    if (troppiTentativi(ip)) {
      return new Response("Troppi tentativi. Riprovare fra un quarto d'ora.", { status: 429 });
    }

    const id = await verificaToken(token);
    if (id !== null) {
      context.cookies.set(NOME_COOKIE, creaSessione(id), opzioniCookie(secure));
      return context.redirect("/admin", 302);
    }
    return new Response("Collegamento non valido o revocato.", { status: 401 });
  }

  const ok = await sessioneValida(context.cookies.get(NOME_COOKIE)?.value);
  if (!ok) {
    /* Le API rispondono con un 401 secco: se le chiama editor.js senza
       sessione, deve vedere l'errore, non una pagina HTML. */
    if (percorso.startsWith("/api/")) {
      return new Response(JSON.stringify({ errore: "Sessione scaduta" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    /* Le pagine (es. /admin) mandano alla pagina di ACCESSO, dove si inserisce
       la chiave. Il collegamento riservato `?t=…` resta valido: lo gestisce il
       blocco qui sopra, prima di arrivare qui. */
    return context.redirect("/accesso", 302);
  }

  const risposta = await next();
  /* L'area admin non deve essere indicizzata né perdere il Referer. */
  risposta.headers.set("X-Robots-Tag", "noindex, nofollow");
  risposta.headers.set("Referrer-Policy", "no-referrer");
  return risposta;
});
