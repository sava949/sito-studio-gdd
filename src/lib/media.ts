import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { sql } from "./db";

const env = (chiave: string) =>
  (import.meta.env as any)[chiave] ?? process.env[chiave] ?? "";

const ACCOUNT = env("R2_ACCOUNT_ID");
const BUCKET = env("R2_BUCKET");
const BASE_PUBBLICA = env("R2_PUBLIC_URL").replace(/\/$/, "");
/* I bucket creati con una giurisdizione (EU, FedRAMP) rispondono SOLO al loro
   endpoint: `<account>.eu.r2.cloudflarestorage.com`. Su quello generico il
   token giusto riceve un 403 AccessDenied, che fa cercare un problema di
   permessi che non c'è. Vuoto = bucket senza giurisdizione. */
const GIURISDIZIONE = env("R2_JURISDICTION").trim().toLowerCase();
const HOST_R2 = `${ACCOUNT}.${GIURISDIZIONE ? GIURISDIZIONE + "." : ""}r2.cloudflarestorage.com`;

const client = new AwsClient({
  accessKeyId: env("R2_ACCESS_KEY_ID"),
  secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  service: "s3",
  region: "auto",
});

/** Larghezza massima servita: oltre non serve, e pesa. */
const LARGHEZZA_MAX = 1600;
const BYTE_MAX_INGRESSO = 25 * 1024 * 1024;

const TIPI_AMMESSI = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export interface RisultatoUpload {
  url: string;
  larghezza: number;
  altezza: number;
  byte: number;
}

/**
 * Riceve il file così com'è arrivato dal telefono del cliente — spesso 6 MB
 * di JPEG o un HEIC di iPhone — e ne pubblica una versione WebP ragionevole.
 */
export async function caricaImmagine(file: File): Promise<RisultatoUpload> {
  if (!TIPI_AMMESSI.has(file.type)) {
    throw new Error(`Formato non supportato: ${file.type || "sconosciuto"}`);
  }
  if (file.size > BYTE_MAX_INGRESSO) {
    throw new Error("Immagine troppo grande (limite 25 MB)");
  }

  const originale = Buffer.from(await file.arrayBuffer());

  const elaborata = await sharp(originale)
    .rotate() // rispetta l'orientamento EXIF: senza, le foto da telefono escono ruotate
    .resize({ width: LARGHEZZA_MAX, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const chiave = `immagini/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const endpoint = `https://${HOST_R2}/${BUCKET}/${chiave}`;

  /* Un `Buffer` di Node è già una `Uint8Array`, ma `fetch` non lo accetta:
     il suo `BodyInit` vuole una vista su un `ArrayBuffer` vero, e quella di
     un Buffer è su un `ArrayBufferLike`.
     Questa riga COPIA, ed è voluto. La versione senza copia
     (`new Uint8Array(data.buffer, data.byteOffset, data.byteLength)`) resta
     dello stesso tipo e non risolve niente; e passare `.buffer` da solo
     sarebbe un difetto vero, perché Node alloca i buffer piccoli dentro
     un'area condivisa — si caricherebbe su R2 un file pieno di byte di
     qualcun altro, e la fotografia arriverebbe rotta senza dare errore.
     Un WebP a 1600px pesa qualche centinaio di kilobyte: copiarlo una volta
     per caricamento non si misura. */
  const corpo = new Uint8Array(elaborata.data);

  const risposta = await client.fetch(endpoint, {
    method: "PUT",
    body: corpo,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!risposta.ok) {
    throw new Error(`Caricamento su R2 fallito (${risposta.status})`);
  }

  const url = `${BASE_PUBBLICA}/${chiave}`;

  await sql`
    insert into media (chiave, url, larghezza, altezza, byte)
    values (${chiave}, ${url}, ${elaborata.info.width}, ${elaborata.info.height}, ${elaborata.info.size})
  `;

  return {
    url,
    larghezza: elaborata.info.width,
    altezza: elaborata.info.height,
    byte: elaborata.info.size,
  };
}

export async function elencaMedia(limite = 60) {
  return (await sql`
    select url, larghezza, altezza, alt from media
    order by created_at desc limit ${limite}
  `) as { url: string; larghezza: number; altezza: number; alt: string }[];
}
