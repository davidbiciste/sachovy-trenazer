/* Maia (CSSLab, GPL-3.0, https://github.com/CSSLab/maia-chess): neuronová síť naučená na milionech lidských partií
   z Lichess, zvlášť pro každou úroveň 1100–1900 Elo. Předpovídá tah, který by zahrál člověk na té úrovni.
   Váhy: engine/maia/maia-<elo>.bin (původní soubory maia-<elo>.pb.gz, formát sítě Lc0). Výpočet sítě je tady v čistém JS,
   bez dalších knihoven: vstup 112 rovin (8 posledních pozic), 6 reziduálních bloků se SE, 64 filtrů, konvoluční policy hlava. */

const NETS = new Map();
export let R50 = false; export const setR50 = v => { R50 = v; };

/* ---- čtení protobufu (jen to, co potřebujeme) ---- */
function fields(u8, s = 0, e = u8.length) {
  const out = new Map(); let i = s;
  const vint = () => { let r = 0, m = 1, x; do { x = u8[i++]; r += (x & 127) * m; m *= 128; } while (x & 128); return r; };
  while (i < e) {
    const k = vint(), f = Math.floor(k / 8), t = k & 7; let v;
    if (t === 0) v = vint();
    else if (t === 1) { v = [i, i + 8]; i += 8; }
    else if (t === 5) { v = [i, i + 4]; i += 4; }
    else if (t === 2) { const n = vint(); v = [i, i + n]; i += n; }
    else throw new Error('protobuf: neznámý typ ' + t);
    if (!out.has(f)) out.set(f, []);
    out.get(f).push(v);
  }
  return out;
}
function layer(u8, r) {
  if (!r) return null;
  const F = fields(u8, r[0], r[1]); const dv = new DataView(u8.buffer, u8.byteOffset);
  const mn = F.has(1) ? dv.getFloat32(F.get(1)[0][0], true) : 0, mx = F.has(2) ? dv.getFloat32(F.get(2)[0][0], true) : 0;
  if (!F.has(3)) return null;
  const [a, b] = F.get(3)[0]; const n = (b - a) / 2; const out = new Float32Array(n); const k = (mx - mn) / 65535;
  for (let j = 0; j < n; j++) out[j] = mn + dv.getUint16(a + 2 * j, true) * k;
  return out;
}
function convBlock(u8, r) {
  const F = fields(u8, r[0], r[1]); const g = f => F.has(f) ? layer(u8, F.get(f)[0]) : null;
  const w = g(1), bias = g(2), mean = g(3), vari = g(4), gam = g(5), bet = g(6);
  const C = (mean || bias).length; const sc = new Float32Array(C), sh = new Float32Array(C);
  for (let c = 0; c < C; c++) {
    if (mean) { const s = (gam ? gam[c] : 1) / Math.sqrt(vari[c] + 1e-5); sc[c] = s; sh[c] = ((bias ? bias[c] : 0) - mean[c]) * s + (bet ? bet[c] : 0); }
    else { sc[c] = 1; sh[c] = bias ? bias[c] : 0; }
  }
  return { w, C, Cin: w.length / C / 9, sc, sh };
}
function parseNet(u8) {
  const top = fields(u8); const W = top.get(10)[0]; const F = fields(u8, W[0], W[1]);
  const res = F.get(2).map(r => {
    const R = fields(u8, r[0], r[1]); const se = R.has(3) ? fields(u8, R.get(3)[0][0], R.get(3)[0][1]) : null;
    return { c1: convBlock(u8, R.get(1)[0]), c2: convBlock(u8, R.get(2)[0]),
      se: se && { w1: layer(u8, se.get(1)[0]), b1: layer(u8, se.get(2)[0]), w2: layer(u8, se.get(3)[0]), b2: layer(u8, se.get(4)[0]) } };
  });
  return { inp: convBlock(u8, F.get(1)[0]), res, pol1: convBlock(u8, F.get(11)[0]), pol: convBlock(u8, F.get(3)[0]) };
}

/* ---- výpočet sítě: roviny 8×8, index = řada*8 + sloupec ---- */
function conv(L, x, relu) {
  const { w, C, Cin, sc, sh } = L; const P = new Float32Array(Cin * 100);
  for (let i = 0; i < Cin; i++) for (let y = 0; y < 8; y++) for (let z = 0; z < 8; z++) P[i * 100 + (y + 1) * 10 + z + 1] = x[i * 64 + y * 8 + z];
  const out = new Float32Array(C * 64); const acc = new Float32Array(64);
  for (let o = 0; o < C; o++) {
    acc.fill(0);
    for (let i = 0; i < Cin; i++) {
      const wb = (o * Cin + i) * 9, pb = i * 100;
      for (let ky = 0; ky < 3; ky++) for (let kx = 0; kx < 3; kx++) {
        const wv = w[wb + ky * 3 + kx]; if (wv === 0) continue; const off = pb + ky * 10 + kx;
        for (let y = 0; y < 8; y++) { const pr = off + y * 10, ar = y * 8;
          acc[ar] += wv * P[pr]; acc[ar + 1] += wv * P[pr + 1]; acc[ar + 2] += wv * P[pr + 2]; acc[ar + 3] += wv * P[pr + 3];
          acc[ar + 4] += wv * P[pr + 4]; acc[ar + 5] += wv * P[pr + 5]; acc[ar + 6] += wv * P[pr + 6]; acc[ar + 7] += wv * P[pr + 7]; }
      }
    }
    const s = sc[o], h = sh[o];
    for (let q = 0; q < 64; q++) { let v = acc[q] * s + h; if (relu && v < 0) v = 0; out[o * 64 + q] = v; }
  }
  return out;
}
function forward(net, planes) {
  let x = conv(net.inp, planes, true);
  for (const b of net.res) {
    const y = conv(b.c1, x, true); const z = conv(b.c2, y, false); const C = b.c2.C;
    if (b.se) {
      const { w1, b1, w2, b2 } = b.se; const S = b1.length; const pool = new Float32Array(C);
      for (let c = 0; c < C; c++) { let s = 0; for (let q = 0; q < 64; q++) s += z[c * 64 + q]; pool[c] = s / 64; }
      const hdn = new Float32Array(S);
      for (let o = 0; o < S; o++) { let s = b1[o]; for (let c = 0; c < C; c++) s += w1[o * C + c] * pool[c]; hdn[o] = s > 0 ? s : 0; }
      for (let c = 0; c < C; c++) {
        let g = b2[c], bb = b2[C + c];
        for (let k = 0; k < S; k++) { g += w2[c * S + k] * hdn[k]; bb += w2[(C + c) * S + k] * hdn[k]; }
        const sg = 1 / (1 + Math.exp(-g));
        for (let q = 0; q < 64; q++) { const v = sg * z[c * 64 + q] + bb + x[c * 64 + q]; z[c * 64 + q] = v > 0 ? v : 0; }
      }
    } else for (let j = 0; j < z.length; j++) { const v = z[j] + x[j]; z[j] = v > 0 ? v : 0; }
    x = z;
  }
  return conv(net.pol, conv(net.pol1, x, true), false); // 80 rovin × 64 polí
}

/* ---- vstup: 8 posledních pozic z pohledu hráče na tahu ---- */
const PCS = 'pnbrqk';
function boardOf(fen) {
  const [pl, stm, cas, , r50] = fen.split(' '); const B = new Array(64).fill(null); let r = 7, f = 0;
  for (const ch of pl) { if (ch === '/') { r--; f = 0; } else if (ch >= '1' && ch <= '8') f += +ch; else { B[r * 8 + f] = ch; f++; } }
  return { B, stm, cas: cas || '-', r50: +(r50 || 0) };
}
const key = fen => fen.split(' ').slice(0, 4).join(' ');
function encode(fens) {
  const P = new Float32Array(112 * 64); const cur = boardOf(fens[fens.length - 1]); const black = cur.stm === 'b';
  const seen = new Map(); const reps = fens.map(f => { const k = key(f); const n = seen.get(k) || 0; seen.set(k, n + 1); return n; });
  for (let t = 0; t < 8; t++) {
    const idx = fens.length - 1 - t; if (idx < 0) break;
    const { B } = boardOf(fens[idx]); const base = t * 13 * 64;
    for (let s = 0; s < 64; s++) {
      const p = B[s]; if (!p) continue; const white = p === p.toUpperCase(); const k = PCS.indexOf(p.toLowerCase());
      const ours = white !== black; const sq = black ? (7 - (s >> 3)) * 8 + (s & 7) : s;
      P[base + (ours ? k : 6 + k) * 64 + sq] = 1;
    }
    if (reps[idx] >= 1) P.fill(1, base + 12 * 64, base + 13 * 64);
  }
  const c = cur.cas, us = black ? ['q', 'k'] : ['Q', 'K'], th = black ? ['Q', 'K'] : ['q', 'k'];
  const fill = (pl, v) => P.fill(v, pl * 64, pl * 64 + 64);
  if (c.includes(us[0])) fill(104, 1); if (c.includes(us[1])) fill(105, 1);
  if (c.includes(th[0])) fill(106, 1); if (c.includes(th[1])) fill(107, 1);
  if (black) fill(108, 1);
  fill(109, R50 ? cur.r50 / 99 : cur.r50); fill(111, 1);
  return { P, black };
}

/* ---- tah (uci) → index ve výstupu 80×64 ---- */
const QD = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const ND = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
function moveIndex(u, black) {
  const sq = s => { const f = s.charCodeAt(0) - 97, r = +s[1] - 1; return [f, black ? 7 - r : r]; };
  const [ff, fr] = sq(u.slice(0, 2)), [tf, tr] = sq(u.slice(2, 4)); const dx = tf - ff, dy = tr - fr; const from = fr * 8 + ff; const pr = u[4];
  if (pr && pr !== 'n') { const pl = 64 + (dx + 1) * 3 + 'rbq'.indexOf(pr); return pl * 64 + from; }
  for (let d = 0; d < 8; d++) {
    const [a, b] = QD[d]; const st = Math.max(Math.abs(dx), Math.abs(dy));
    if (st >= 1 && st <= 7 && dx === a * st && dy === b * st) return (d * 7 + st - 1) * 64 + from;
  }
  for (let d = 0; d < 8; d++) if (dx === ND[d][0] && dy === ND[d][1]) return (56 + d) * 64 + from;
  return -1;
}

/* Elo → nejbližší síť 1100…1900 */
export const maiaLevel = elo => Math.min(1900, Math.max(1100, Math.round((elo || 1100) / 100) * 100));

export async function maiaLoad(elo, base = './engine/maia/') {
  const lv = maiaLevel(elo);
  if (!NETS.has(lv)) NETS.set(lv, (async () => {
    const res = await fetch(`${base}maia-${lv}.bin`); if (!res.ok) throw new Error('Maia: soubor nejde stáhnout');
    let buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] === 0x1f && buf[1] === 0x8b) { // gzip (server ho sám nerozbalil)
      if (typeof DecompressionStream === 'undefined') throw new Error('Maia: prohlížeč neumí rozbalit gzip');
      buf = new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    return parseNet(buf);
  })().catch(e => { NETS.delete(lv); throw e; }));
  return NETS.get(lv);
}
export function maiaFromBytes(lv, u8) { NETS.set(lv, Promise.resolve(parseNet(u8))); }

/* fens: pozice od začátku partie po aktuální (nejstarší první), legal: legální tahy v uci.
   Vrátí [{u, p}] seřazené od nejpravděpodobnějšího (p = pravděpodobnost, že tak zahraje člověk na té úrovni). */
export async function maiaPolicy(elo, fens, legal) {
  const net = await maiaLoad(elo); const { P, black } = encode(fens); const out = forward(net, P);
  const { B } = boardOf(fens[fens.length - 1]);
  const nn = u => { // rošáda: síť ji zná jako „král bere věž“ (e1h1, e1a1)
    const p = B[(+u[1] - 1) * 8 + u.charCodeAt(0) - 97];
    if (p && p.toLowerCase() === 'k' && u[0] === 'e' && (u[2] === 'g' || u[2] === 'c') && u[1] === u[3]) return u.slice(0, 2) + (u[2] === 'g' ? 'h' : 'a') + u[3];
    return u;
  };
  const L = legal.map(u => { const i = moveIndex(nn(u), black); return { u, z: i >= 0 ? out[i] : -1e9 }; });
  const m = Math.max(...L.map(x => x.z)); let T = 0; for (const x of L) { x.p = Math.exp(x.z - m); T += x.p; }
  for (const x of L) { x.p /= T; delete x.z; }
  return L.sort((a, b) => b.p - a.p);
}
