// Herzl 34, drawn from street photos: a teal Tel Aviv apartment block over two shops.
// The left wing has a recessed grey balcony with potted plants and a roof terrace under
// a corrugated canopy; the middle has two arched, barred windows and an air conditioner
// under a window; the right wing has another recessed balcony and terrace. Down below,
// the DIVANI furniture shop in its yellow frame and PhoneMobile under a black awning,
// then the graffitied entrance with its blue "34" plate. Next door: a grey block with
// the importer's shop on the left, an old beige block with dark shutters on the right.
// In front, a thin airy street tree and a street lamp with a dove on it.
import { el, limb, paint, f, type Vec } from '../lib/ink.ts';
import { seeded, wobble } from '../lib/motion.ts';
import type { Drop } from './falls.ts';
import { birds } from './birds.ts';
import { TEL_AVIV } from './places.ts';
import { type Ctx, type Clump, type LotDef, type Lot, C, SP, P, S, at, box, clump, surface, tint, win } from './kit.ts';

// The drawing spans 0..1104; the lot is one desktop card (1280) wide, walls carried on through the PAD.
const WIDTH = 1280, PAD = 88, L = -PAD, R1 = WIDTH - PAD;
const K = {
  TEAL: '#5e9a9b', RECESS: '#8f9493', YELLOW: '#d6a52a', BLACK: '#2a292c', GOLD: '#e0b65a', SIGN: '#3a3127',
  GREEN: '#4e9a4a', RED: '#c8432f', ORANGE: '#d9692e', CANOPY: '#d5dad7', BEIGE: '#d8ccb0', SHUTTER: '#4b4f52',
  PLATE: '#2f62b0', NEIGHBOUR: '#c9cbc8', AC: '#e4e4de', POLE: '#8b8f8c',
} as const;

export const herzlLot: LotDef = {
  name: 'Herzl 34',
  width: WIDTH,
  place: TEL_AVIV,
  build: (ctx, x0, drop) => build({ ...ctx, rand: seeded(434) }, x0, drop),
};

function build(ctx: Ctx, x0: number, drop: Drop): Lot {
  // about a third of the flats stay dark at night
  const lit = () => (ctx.rand() < 0.35 ? 2 : ctx.rand(0.4, 0.7));
  const R = ctx.rand, lay = (name: keyof Ctx['layers']) => at(ctx.layers[name], x0 + PAD), glowG = at(ctx.glow, x0 + PAD);
  const fill = (g: Element, d: string, colour: string, w = SP * 0.8) => surface(ctx, paint(g, colour, w), colour).setAttribute('d', d);
  const accent = (g: Element, d: string, colour: string, w = SP * 0.5) => tint(ctx, paint(g, colour, w), colour).setAttribute('d', d);
  const text = (g: Element, x: number, y: number, s: string, size: number, colour: string, font: string, anchor = 'middle') => {
    const n = el('text', { x, y, 'font-size': size, 'font-family': font, 'font-weight': 700, 'text-anchor': anchor, stroke: 'none' }, g);
    n.textContent = s;
    tint(ctx, n, colour);
  };
  const tube = (g: Element, pts: Vec[], w: number, colour: string) => {
    const l = limb(g, w, SP * 0.55);
    l.draw(pts, [0, 0]);
    surface(ctx, l.g.querySelector('path')!, colour);
  };
  // a white railing: a top rail and thin balusters
  const railing = (g: Element, x0r: number, x1r: number, top: number, bottom: number, step = 10) =>
    P(g, `M${x0r} ${top} L${x1r} ${top} ${Array.from({ length: Math.floor((x1r - x0r) / step) + 1 }, (_, i) => `M${f(x0r + i * step)} ${top} L${f(x0r + i * step)} ${bottom}`).join(' ')}`, SP * 0.6);
  // corrugated canopy: a pale sloping sheet with ribs, on thin posts
  const canopy = (g: Element, a: Vec, b: Vec, posts: number[], foot: number) => {
    fill(g, `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${b[0]} ${b[1] + 7} L${a[0]} ${a[1] + 7}Z`, K.CANOPY);
    const n = Math.floor((b[0] - a[0]) / 5);
    P(g, Array.from({ length: n }, (_, i) => { const x = a[0] + (i + 0.5) * 5, y = a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]); return `M${f(x)} ${f(y)} l0 7`; }).join(' '), SP * 0.3);
    for (const x of posts) { const y = a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]) + 7; P(g, `M${x} ${f(y)} L${x} ${foot}`, SP * 0.7); }
  };
  // an outdoor air-conditioning unit whose fan turns
  const fans: { g: SVGGElement; cx: number; cy: number; speed: number }[] = [];
  const ac = (g: Element, x: number, y: number, w: number, h: number) => {
    fill(g, box(x, y, w, h, 0.3), K.AC);
    const r = h * 0.36, cx = x + w * 0.38, cy = y + h / 2;
    P(g, `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 M${f(x + w * 0.78)} ${f(y + 4)} l0 ${f(h - 8)} M${f(x + w * 0.86)} ${f(y + 4)} l0 ${f(h - 8)}`, SP * 0.5);
    const blades = el('g', {}, g);
    P(blades, [0, 1, 2].map((i) => { const a = (i * 2 * Math.PI) / 3; return `M0 0 Q${f(Math.cos(a + 0.5) * r * 0.7)} ${f(Math.sin(a + 0.5) * r * 0.7)} ${f(Math.cos(a) * r * 0.9)} ${f(Math.sin(a) * r * 0.9)}`; }).join(' '), SP * 0.6);
    P(g, `M${f(x + 3)} ${y + h} l0 4 M${f(x + w - 3)} ${y + h} l0 4`, SP * 0.6);
    fans.push({ g: blades, cx, cy, speed: R(4, 9) });
  };
  // a window with a white frame and a vertical sash bar
  const sash = (g: Element, x: number, y: number, w: number, h: number, on: number) => {
    win(ctx, g, glowG, x, y, w, h, on);
    P(g, `M${f(x + w / 2)} ${y} l0 ${h}`, SP * 0.8);
  };

  // ---------- next door on the left: a grey block with balconies over the importer's shop
  const nb = lay('back');
  fill(nb, box(L - 4, 60, 254 + PAD, 244, 0.4), K.NEIGHBOUR);
  for (const [y, h] of [[92, 74], [196, 72]]) {
    fill(nb, box(L + 8, y, 230 + PAD - 20, h - 18, 0.3), K.RECESS);
    sash(nb, L + 30, y + 10, 46, h - 30, lit());
    win(ctx, nb, glowG, 120, y + 10, 34, h - 34, lit());
    P(nb, Array.from({ length: 5 }, (_, i) => `M120 ${y + 14 + i * 5} l34 0`).join(' '), SP * 0.4);
    railing(nb, L + 4, 244, y + h - 26, y + h - 4, 8);
    S(nb, box(L - 6, y + h - 4, 258 + PAD, 8, 0.2), SP * 0.8);
  }
  ac(nb, 30, 100, 40, 26);
  // the importer's shop: a green sign over shelves of goods
  fill(nb, box(L + 6, 300, 238 + PAD - 6, 26, 0.3), '#7cae55');
  text(nb, 120, 318, 'חנות היבואן', 14, '#fdfcf8', 'Arial, sans-serif');
  text(nb, 120, 324, 'כל המותגים במקום אחד', 6, '#fdfcf8', 'Arial, sans-serif');
  win(ctx, nb, glowG, L + 10, 332, 226 + PAD - 10, 72, 0.7, false);
  P(nb, [346, 362, 378, 394].map((y) => `M${L + 10} ${y} L236 ${y}`).join(' '), SP * 0.4);
  accent(nb, Array.from({ length: 70 }, () => box(R(L + 14, 230), [338, 354, 370, 386][Math.floor(R(0, 4))], R(3, 6), 6, 0.1)).join(' '), K.PLATE, SP * 0.2);

  // ---------- next door on the right: an old beige block with dark shutters, cables everywhere
  const nr = lay('back');
  fill(nr, box(860, 70, R1 - 856, 334, 0.4), K.BEIGE);
  for (const y of [96, 196]) {
    S(nr, box(866, y, R1 - 872, 8, 0.2), SP * 0.8);
    for (const x of [890, 980, 1070]) {
      win(ctx, nr, glowG, x, y + 18, 70, 60, lit(), true);
      fill(nr, box(x + 2, y + 20, 66, 34, 0.2), K.SHUTTER, SP * 0.4); // shutters half down
      P(nr, Array.from({ length: 7 }, (_, i) => `M${x + 3} ${y + 24 + i * 4.6} l64 0`).join(' '), SP * 0.3).setAttribute('opacity', '0.6');
    }
    S(nr, box(866, y + 84, R1 - 872, 10, 0.2), SP * 0.8);
  }
  ac(nr, 1000, 300, 44, 30);
  // its ground floor: a grey roller shutter with "32" sprayed above, and graffiti
  fill(nr, box(906, 310, 80, 94, 0.3), '#a3a6a5');
  P(nr, Array.from({ length: 13 }, (_, i) => `M908 ${316 + i * 7} l76 0`).join(' '), SP * 0.35);
  fill(nr, box(920, 292, 40, 16, 0.2), '#ecebe6', SP * 0.5);
  text(nr, 940, 305, '32', 12, K.RED, 'Arial, sans-serif');
  P(nr, 'M916 340 q6 -10 12 0 t12 -2 q4 8 10 0 M930 356 l6 -8 l4 10 l6 -9 M1060 350 q8 -12 14 0 t10 4', SP * 0.5).setAttribute('opacity', '0.55');

  // ---------- the building
  const h = lay('house');
  // the teal body: wings up to the terrace parapets, the middle tower stepping up a little higher
  fill(h, 'M250 300 L250 96 L440 96 L440 60 L560 60 L560 50 L650 50 L650 96 L860 96 L860 300Z', K.TEAL, SP);
  // recessed balconies and terraces, grey inside
  for (const [x, w] of [[262, 168], [662, 186]]) {
    fill(h, box(x, 102, w, 74, 0.3), K.RECESS);
    fill(h, box(x, 196, w, 64, 0.3), K.RECESS);
  }
  // left wing, roof terrace: a shuttered window, an air conditioner, the railing, planters on the parapet
  sash(h, 290, 116, 40, 48, lit());
  ac(h, 352, 122, 44, 30);
  railing(h, 262, 430, 156, 176, 9);
  accent(h, `${box(268, 166, 30, 10, 0.2)} ${box(304, 168, 18, 8, 0.2)}`, K.ORANGE);
  accent(h, box(326, 168, 22, 8, 0.2), '#3fa39a');
  // left wing, first floor: a shuttered window, a sliding window, pots on the railing
  sash(h, 292, 206, 40, 46, lit());
  fill(h, box(294, 208, 36, 18, 0.2), K.SHUTTER, SP * 0.4);
  sash(h, 350, 206, 52, 46, lit());
  railing(h, 262, 430, 244, 260, 9);
  const pots: Clump[] = [];
  for (const [x, colour] of [[392, K.RED], [408, K.GREEN], [376, '#ecebe6']] as [number, string][]) {
    accent(h, `M${x - 5} 236 L${x + 5} 236 L${x + 4} 244 L${x - 4} 244Z`, colour);
    pots.push(clump(ctx, h, x, 230, 7, 'ivy', 18, C.IVY, 0.7));
  }
  // middle: a window with a curtain and an air conditioner under it, its hose looping up the wall
  sash(h, 500, 108, 40, 46, lit());
  P(h, 'M524 110 q-4 20 2 42', SP * 0.4).setAttribute('opacity', '0.6');
  ac(h, 492, 160, 48, 30);
  el('path', { d: 'M542 172 Q556 160 552 132 Q548 96 576 92 Q600 90 640 98', fill: 'none', style: 'stroke: var(--paper)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, h);
  P(h, 'M542 170 Q558 158 553 132 Q549 97 576 90 Q600 88 640 96', SP * 0.4);
  P(h, 'M590 170 l34 6 M612 170 l4 10', SP * 0.9); // an old bracket sticking out of the wall
  // middle, first floor: two tall arched windows with grilles
  for (const x of [470, 566]) {
    const w = 36, top = 206, r = w / 2;
    win(ctx, h, glowG, x, top, w, 66, lit(), false);
    // teal corners turn the pane's square top into an arch
    fill(h, `M${x - 1} ${top - 1} L${x + r} ${top - 1} A${r} ${r} 0 0 0 ${x - 1} ${top + r}Z M${x + w + 1} ${top - 1} L${x + r} ${top - 1} A${r} ${r} 0 0 1 ${x + w + 1} ${top + r}Z`, K.TEAL, 0);
    P(h, `M${x} ${top + 66} L${x} ${top + r} A${r} ${r} 0 0 1 ${x + w} ${top + r} L${x + w} ${top + 66}`, SP * 1.1);
    P(h, `${[7, 14, 22, 29].map((dx) => `M${x + dx} ${top + 4 + Math.abs(dx - r) * 0.6} L${x + dx} ${top + 66}`).join(' ')} M${x} ${top + 30} l${w} 0 M${x} ${top + 48} l${w} 0`, SP * 0.5);
    P(h, `M${x - 3} ${top + 69} l${w + 6} 0`, SP);
  }
  // right wing, roof terrace: a small window, the railing, a satellite dish on the corner
  sash(h, 690, 114, 34, 40, lit());
  railing(h, 662, 848, 156, 176, 9);
  S(h, 'M846 96 a10 12 -20 1 0 4 -22Z', SP * 0.8);
  P(h, 'M846 86 l-8 -4', SP * 0.6);
  // right wing, first floor: an air conditioner up high, a big window, a small one, a rail
  ac(h, 680, 202, 54, 36);
  sash(h, 770, 204, 64, 50, lit());
  win(ctx, h, glowG, 726, 240, 30, 18, lit());
  P(h, 'M664 246 L846 244 M680 246 l0 14 M740 246 l0 14 M800 245 l0 14 M846 244 l0 16', SP * 0.9);
  // corrugated canopies over both terraces, the slab edges and a drainpipe down the right edge
  canopy(h, [244, 92], [444, 82], [256, 432], 156);
  canopy(h, [644, 82], [870, 92], [656, 858], 156);
  for (const y of [176, 260, 284]) P(h, `M248 ${y} L862 ${y}`, SP * 0.6).setAttribute('opacity', '0.7');
  tube(h, [[862, 92], [862, 300]], 4, '#c9ccca');

  // ---------- the shops
  const shop = lay('house');
  // DIVANI: a yellow frame, a black inner frame, a second yellow frame and the glass
  fill(shop, box(258, 300, 266, 104, 0.3), K.YELLOW);
  fill(shop, box(274, 314, 234, 90, 0.3), K.BLACK);
  fill(shop, box(286, 324, 210, 80, 0.3), K.YELLOW);
  win(ctx, shop, glowG, 296, 332, 190, 72, 0.75, false);
  P(shop, 'M391 332 l0 72', SP * 0.6);
  fill(shop, box(318, 340, 146, 28, 0.2), '#f4f2ec', SP * 0.6);
  accent(shop, `${box(320, 342, 3, 24, 0)} ${box(458, 342, 3, 24, 0)}`, K.GREEN, 0);
  accent(shop, `${box(326, 342, 3, 24, 0)} ${box(452, 342, 3, 24, 0)}`, K.RED, 0);
  text(shop, 391, 360, 'DIVANI', 17, '#2f7a3a', 'Arial Black, Arial, sans-serif');
  text(shop, 430, 366, 'Living', 6, K.RED, 'Arial, sans-serif');
  P(shop, 'M300 380 l40 -8 l30 6 M410 376 l60 -2', SP * 0.4).setAttribute('opacity', '0.4'); // a sofa's back through the glass
  P(shop, 'M486 360 l0 10 M492 360 l0 10', SP * 1.2);
  text(shop, 500, 358, '34', 6, K.BLACK, 'Arial, sans-serif');
  S(shop, box(378, 302, 22, 8, 0.2), SP * 0.6); // the light over the door
  // PhoneMobile: a slanting black awning, the gold-lettered sign, shelves of accessories
  fill(shop, 'M524 300 L770 300 L766 318 L530 324Z', K.BLACK, SP);
  fill(shop, box(536, 318, 220, 32, 0.3), K.SIGN, SP);
  P(shop, box(538, 320, 216, 28, 0.2), SP * 0.4);
  text(shop, 646, 336, 'PhoneMobile', 18, K.GOLD, 'Georgia, serif');
  text(shop, 646, 346, 'יבוא ושיווק אביזרי סלולר | הרצל 34 | טל׳ 050-3508333', 5.4, K.GOLD, 'Arial, sans-serif');
  win(ctx, shop, glowG, 540, 352, 212, 52, 0.8, false);
  P(shop, `M540 352 L752 352 M630 352 L630 404 ${[364, 376, 388].map((y) => `M544 ${y} L626 ${y}`).join(' ')} M544 352 l0 52 M626 352 l0 52`, SP * 0.6);
  const goods = ['#d14b4b', '#3f78c4', '#e0b65a', '#4e9a4a', '#ecebe6'];
  goods.forEach((c, i) => accent(shop, Array.from({ length: 14 }, (_, k) => box(546 + ((k * 37 + i * 13) % 76), 355 + 12 * ((k + i) % 4), 4, 7, 0.1)).filter((_, k) => (k + i) % 3).join(' '), c, SP * 0.2));
  P(shop, 'M640 404 l0 -30 l40 0 l0 30 M690 404 l0 -22 l24 0 l0 22', SP * 0.5).setAttribute('opacity', '0.6'); // boxes inside
  // the building's entrance: a white graffitied pier with the blue "34" plate, an AC unit, a dark door
  S(shop, box(770, 300, 46, 104, 0.3));
  ac(shop, 772, 302, 40, 26);
  accent(shop, box(788, 334, 18, 12, 0.2), K.PLATE, SP * 0.4);
  text(shop, 797, 343.5, '34', 8, '#fdfcf8', 'Arial, sans-serif');
  accent(shop, box(786, 348, 22, 6, 0.2), K.PLATE, SP * 0.3);
  P(shop, 'M776 366 q4 -8 8 0 q4 8 8 0 M796 362 l0 10 M802 362 q6 0 4 5 q-4 5 -4 5 M778 384 q5 -6 10 2 t10 -2 M780 396 l8 -6 l4 6', SP * 0.6);
  fill(shop, box(818, 300, 42, 104, 0.3), '#4a4a48');
  P(shop, 'M824 310 l30 0 l0 90 l-30 0Z', SP * 0.4);
  accent(shop, box(836, 334, 8, 8, 0.1), K.RED, SP * 0.3);
  P(shop, 'M826 360 q6 -8 12 0 t12 -2', SP * 0.4).setAttribute('opacity', '0.5');

  // ---------- cables strung across the right-hand building, swaying a little in the wind
  const cables = [0, 1, 2].map(() => el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.6 }, nr));
  ctx.add({
    step({ t, wind }) {
      const sag = (base: number, k: number) => f(base + wind * 3 * k + wobble(t * 0.5 + k * 2) * 1.2);
      cables[0].setAttribute('d', `M864 120 Q960 ${sag(190, 1)} ${R1 + 4} 150`);
      cables[1].setAttribute('d', `M864 240 Q920 ${sag(300, 1.3)} 1000 300`);
      cables[2].setAttribute('d', `M900 70 Q980 ${sag(150, 0.8)} ${R1 + 4} 80`);
    },
  });

  // ---------- the street tree: a slim trunk and an airy crown in front of the arched windows
  const tree = lay('bigTree');
  limb(tree, 7, SP).draw([[468, 406], [470, 300], [462, 190]], [0, 0]);
  P(tree, 'M466 240 Q440 200 420 150 M470 220 Q500 180 530 130 M464 196 Q470 140 480 90 M430 180 Q410 160 392 140 M520 150 Q540 120 560 100', SP * 0.8);
  const crown: Clump[] = [];
  for (const [x, y, r] of [[470, 70, 44], [410, 110, 40], [530, 100, 44], [380, 170, 34], [570, 160, 36], [460, 150, 46], [430, 230, 30], [510, 220, 32], [470, 270, 22]])
    crown.push(clump(ctx, tree, x, y, r, 'leaf', r * 2.6, C.IVY, 0.55));
  for (const c of crown) (c.g.firstElementChild as SVGElement).style.fillOpacity = '0.3'; // an airy crown: the building shows through
  tree.style.cursor = 'pointer';
  tree.addEventListener('pointerdown', (e) => { crown.forEach((c) => c.shake()); drop(e, 8, [C.IVY, C.FROND]); });

  // ---------- the street lamp, lit at night, with a dove on its head
  const fr = lay('front');
  tube(fr, [[1010, 406], [1010, 160], [1008, 120]], 6, K.POLE);
  fill(fr, box(986, 112, 44, 16, 0.3), '#d9dad6', SP);
  const bulb = el('path', { d: box(990, 128, 36, 4, 0.1) }, fr);
  const halo = el('circle', { cx: 1008, cy: 150, r: 70, fill: 'url(#h-glow)', opacity: 0 }, glowG);
  ctx.add({ paint: (pal) => { bulb.setAttribute('fill', pal.lamp > 0.5 ? '#ffd69a' : '#9c9e9b'); halo.setAttribute('opacity', f(pal.lamp)); } });
  const dove = birds(ctx, fr, [{ kind: 'dove', s: 0.5, dir: -1 }], () => [1004, 112]);
  fr.style.cursor = 'pointer';
  fr.addEventListener('pointerdown', () => dove.startle());

  // the air conditioners hum along
  ctx.add({ step: ({ t }) => { for (const a of fans) a.g.setAttribute('transform', `translate(${f(a.cx)} ${f(a.cy)}) rotate(${f((t * a.speed * 60) % 360)})`); } });

  return { sniffAt: x0 + PAD + 1010 };
}

