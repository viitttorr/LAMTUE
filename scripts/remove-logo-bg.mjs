/**
 * Remove o fundo branco da logo (public/LOGO.JPG), preservando o emblema
 * vermelho e os detalhes brancos internos (texto, cobra, anéis). Usa
 * flood fill a partir dos quatro cantos, já que o fundo é uma região
 * branca contínua — diferente do branco "isolado" dentro do emblema.
 * Gera public/logo.png com transparência. Rode: node scripts/remove-logo-bg.mjs
 */
import { Jimp } from "jimp";
import path from "path";

const SRC = path.join(process.cwd(), "public", "LOGO.JPG");
const OUT = path.join(process.cwd(), "public", "logo.png");
const THRESHOLD = 18; // distância máx. de cada canal RGB até o branco puro

const image = await Jimp.read(SRC);
const { width, height } = image.bitmap;
const data = image.bitmap.data; // RGBA Uint8Array

const isBackgroundish = (idx) => {
  const r = data[idx], g = data[idx + 1], b = data[idx + 2];
  return r >= 255 - THRESHOLD && g >= 255 - THRESHOLD && b >= 255 - THRESHOLD;
};

const visited = new Uint8Array(width * height);
const stack = [];
const seed = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (visited[p]) return;
  visited[p] = 1;
  const idx = p * 4;
  if (isBackgroundish(idx)) stack.push(p);
};

// sementes: bordas inteiras (o fundo branco toca todas as bordas da imagem)
for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }

let removed = 0;
while (stack.length) {
  const p = stack.pop();
  const idx = p * 4;
  data[idx + 3] = 0; // alpha = 0
  removed++;
  const x = p % width, y = (p / width) | 0;
  const neighbors = [
    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const np = ny * width + nx;
    if (visited[np]) continue;
    visited[np] = 1;
    const nidx = np * 4;
    if (isBackgroundish(nidx)) stack.push(np);
  }
}

// suaviza a borda de corte: pixels próximos da transição ganham alpha parcial
for (let p = 0; p < width * height; p++) {
  const idx = p * 4;
  if (data[idx + 3] === 0) continue;
  const x = p % width, y = (p / width) | 0;
  let borda = false;
  for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (data[(ny * width + nx) * 4 + 3] === 0) { borda = true; break; }
  }
  if (borda) data[idx + 3] = 160;
}

await image.write(OUT);
console.log(`logo.png gerada — ${removed} pixels de fundo removidos (${width}x${height}).`);
