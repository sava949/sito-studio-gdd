#!/usr/bin/env node
/**
 * Ritaglia dalla fotografia del portone (IMG_9926) le superfici vere usate
 * dal disegno della home: l'anta rossa e le due vetrate laterali con le
 * sbarre. Ogni pezzo è un quadrilatero sulla foto (lo scatto non è perfetto
 * frontale): qui lo si raddrizza riga per riga e lo si salva in public/porta/.
 *
 *   node strumenti/ritaglia-porta.mjs
 *
 * Le foto consegnate dallo studio non sono nel repository: i file prodotti sì.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const RADICE = fileURLToPath(new URL("..", import.meta.url));
const FOTO = join(RADICE, "docs/questionario/wetransfer_img_9838-jpeg_2026-09-23_1457/IMG_9926.jpeg");
const USCITA = join(RADICE, "public/porta");
mkdirSync(USCITA, { recursive: true });

/* Gli angoli sono misurati su un ritaglio largo 900 px della zona della
   porta (origine 942,2171 della foto, scala 0,3622): si riportano qui alla
   foto intera. */
const Z = (x, y) => [942 + x / 0.3622, 2171 + y / 0.3622];
const PEZZI = {
  anta:   { a: [Z(284, 70), Z(613, 70), Z(279, 1018), Z(622, 1018)], w: 880, h: 1800 },
  sinistra: { a: [Z(74, 48), Z(240, 48), Z(60, 965), Z(232, 965)], w: 216, h: 916 },
  destra: { a: [Z(664, 48), Z(832, 48), Z(672, 965), Z(852, 965)], w: 216, h: 916 },
};

const { data, info } = await sharp(FOTO).rotate().raw().toBuffer({ resolveWithObject: true });
const C = info.channels;
const pixel = (x, y, k) => {
  // bilineare
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const p = (xx, yy) => data[(Math.min(info.height - 1, yy) * info.width + Math.min(info.width - 1, xx)) * C + k];
  return (p(x0, y0) * (1 - fx) + p(x0 + 1, y0) * fx) * (1 - fy) + (p(x0, y0 + 1) * (1 - fx) + p(x0 + 1, y0 + 1) * fx) * fy;
};

for (const [nome, { a: [tl, tr, bl, br], w, h }] of Object.entries(PEZZI)) {
  const out = Buffer.alloc(w * h * 3);
  for (let j = 0; j < h; j++) {
    const v = j / (h - 1);
    const sx = tl[0] + (bl[0] - tl[0]) * v, sy = tl[1] + (bl[1] - tl[1]) * v;
    const ex = tr[0] + (br[0] - tr[0]) * v, ey = tr[1] + (br[1] - tr[1]) * v;
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1);
      const x = sx + (ex - sx) * u, y = sy + (ey - sy) * u;
      for (let k = 0; k < 3; k++) out[(j * w + i) * 3 + k] = pixel(x, y, k);
    }
  }
  if (nome === "anta") {
    /* Pomolo e serratura si tolgono: la porta disegnata è più larga di quella
       vera, e stirati diventerebbero ovali. Li ridisegna la pagina, tondi.
       Al loro posto, colonna per colonna, si sfuma fra la vernice appena
       sopra e appena sotto, con un po' della grana originale. [x, y, w, h] */
    for (const [x0, y0, pw, ph] of [[368, 804, 136, 116], [778, 876, 102, 104]]) {
      for (let i = 0; i < pw; i++) {
        for (let k = 0; k < 3; k++) {
          const sopra = out[((y0 - 1) * w + x0 + i) * 3 + k], sotto = out[((y0 + ph) * w + x0 + i) * 3 + k];
          for (let j = 0; j < ph; j++) {
            const grana = out[((y0 + j - ph - 20) * w + x0 + i) * 3 + k] - out[((y0 - ph - 20) * w + x0 + i) * 3 + k];
            out[((y0 + j) * w + x0 + i) * 3 + k] = Math.max(0, Math.min(255, sopra + (sotto - sopra) * (j / ph) + grana * 0.5));
          }
        }
      }
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .modulate({ brightness: nome === "anta" ? 0.92 : 0.8, saturation: nome === "anta" ? 1 : 0.85 })
    .linear(nome === "anta" ? 1.08 : 1, nome === "anta" ? -8 : 0)
    .sharpen({ sigma: nome === "anta" ? 1.1 : 0.6 })
    .webp({ quality: nome === "anta" ? 86 : 80 })
    .toFile(join(USCITA, `${nome}.webp`));
  console.log(`  public/porta/${nome}.webp`);
}
