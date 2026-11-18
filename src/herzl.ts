// Herzl 34, drawn from street photos: a teal Tel Aviv apartment block over two shops.
// The left wing has a recessed grey balcony with potted plants and a roof terrace under
// a corrugated canopy; the middle has two arched, barred windows and an air conditioner
// under a window; the right wing has another recessed balcony and terrace. Down below,
// the DIVANI furniture shop in its yellow frame and PhoneMobile under a black awning,
// then the graffitied entrance with its blue "34" plate. Next door: a grey block with
// the importer's shop on the left, an old beige block with dark shutters on the right.
// In front, a thin airy street tree and a street lamp with a dove on it.
import { el, limb, paint, f, type Vec } from '../lib/ink.ts';
import { toRGB } from '../lib/daynight.ts';
import { seeded, wobble } from '../lib/motion.ts';
import type { Drop } from './falls.ts';
import { birds } from './birds.ts';
import { TEL_AVIV } from './places.ts';
import { type Ctx, type Clump, type LotDef, type Lot, C, GROUND, H, SP, P, S, at, box, clump, surface, tint, win } from './kit.ts';

// The drawing spans 0..1104; the lot is one desktop card (1280) wide, walls carried on through the PAD.
const WIDTH = 1280, PAD = 88, L = -PAD, R1 = WIDTH - PAD;
const K = {
  TEAL: '#5e9a9b', RECESS: '#8f9493', YELLOW: '#d6a52a', BLACK: '#2a292c', GOLD: '#e0b65a', SIGN: '#3a3127',
  GREEN: '#4e9a4a', RED: '#c8432f', ORANGE: '#d9692e', CANOPY: '#d5dad7', SHUTTER: '#4b4f52',
  PLATE: '#2f62b0', AC: '#e4e4de', POLE: '#8b8f8c',
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
  // only the teal building is in colour: the shops under it and everything around it are drawn in greys
  let bw = false;
  const grey = (c: string) => { if (!bw) return c; const v = Math.round(toRGB(c).reduce((a, x, i) => a + x * [0.3, 0.59, 0.11][i], 0)); return '#' + v.toString(16).padStart(2, '0').repeat(3); };
  const fill = (g: Element, d: string, colour: string, w = SP * 0.8) => surface(ctx, paint(g, grey(colour), w), grey(colour)).setAttribute('d', d);
  const accent = (g: Element, d: string, colour: string, w = SP * 0.5) => tint(ctx, paint(g, grey(colour), w), grey(colour)).setAttribute('d', d);
  const text = (g: Element, x: number, y: number, s: string, size: number, colour: string, font: string, anchor = 'middle') => {
    const n = el('text', { x, y, 'font-size': size, 'font-family': font, 'font-weight': 700, 'text-anchor': anchor, stroke: 'none' }, g);
    n.textContent = s;
    tint(ctx, n, grey(colour));
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

  // The building is 360..780: left wing 360..480, the middle 480..620, right wing 620..780.
  bw = true;
  // ---------- next door on the left: a grey block with balconies over the importer's shop and a kiosk
  const nb = lay('back');
  fill(nb, box(L - 4, 60, 364 + PAD, GROUND - 60, 0.4), '#f6f5f1'); // down to the pavement, or the sky shows round the shopfronts
  for (const [y, h] of [[92, 74], [196, 72]]) {
    fill(nb, box(L + 8, y, 340 + PAD - 20, h - 18, 0.3), '#dcdcd8');
    sash(nb, L + 30, y + 10, 46, h - 30, lit());
    for (const x of [120, 270]) {
      win(ctx, nb, glowG, x, y + 10, 34, h - 34, lit());
      P(nb, Array.from({ length: 5 }, (_, i) => `M${x} ${y + 14 + i * 5} l34 0`).join(' '), SP * 0.4);
    }
    sash(nb, 190, y + 10, 46, h - 30, lit());
    railing(nb, L + 4, 354, y + h - 26, y + h - 4, 8);
    S(nb, box(L - 6, y + h - 4, 368 + PAD, 8, 0.2), SP * 0.8);
  }
  ac(nb, 30, 100, 40, 26);
  ac(nb, 316, 204, 34, 22);
  // the importer's shop: a green sign over shelves of goods
  fill(nb, box(L + 6, 300, 238 + PAD - 6, 26, 0.3), '#7cae55');
  text(nb, 120, 318, 'חנות היבואן', 14, '#fdfcf8', 'Arial, sans-serif');
  text(nb, 120, 324, 'כל המותגים במקום אחד', 6, '#fdfcf8', 'Arial, sans-serif');
  win(ctx, nb, glowG, L + 10, 332, 226 + PAD - 10, 72, 0.7, false);
  P(nb, [346, 362, 378, 394].map((y) => `M${L + 10} ${y} L236 ${y}`).join(' '), SP * 0.4);
  accent(nb, Array.from({ length: 70 }, () => box(R(L + 14, 230), [338, 354, 370, 386][Math.floor(R(0, 4))], R(3, 6), 6, 0.1)).join(' '), K.PLATE, SP * 0.2);
  // a kiosk: a blue sign, a fridge of drinks behind the glass
  fill(nb, box(248, 300, 106, 26, 0.3), K.PLATE);
  text(nb, 301, 318, 'קיוסק', 14, '#fdfcf8', 'Arial, sans-serif');
  win(ctx, nb, glowG, 252, 332, 98, 72, 0.7, false);
  P(nb, 'M300 332 l0 72 M256 340 l38 0 l0 60 l-38 0Z M256 360 l38 0 M256 380 l38 0', SP * 0.5);
  accent(nb, Array.from({ length: 18 }, (_, i) => box(259 + (i % 6) * 6, 344 + Math.floor(i / 6) * 20, 3, 12, 0.1)).join(' '), K.RED, SP * 0.2);

  // ---------- next door on the right: an old beige block with dark shutters
  const nr = lay('back');
  fill(nr, box(780, 70, R1 - 776, 334, 0.4), '#f6f5f1');
  for (const y of [96, 196]) {
    S(nr, box(784, y, R1 - 790, 8, 0.2), SP * 0.8);
    for (const x of [800, 890, 980, 1070]) {
      win(ctx, nr, glowG, x, y + 18, 70, 60, lit(), true);
      fill(nr, box(x + 2, y + 20, 66, 34, 0.2), K.SHUTTER, SP * 0.4); // shutters half down
      P(nr, Array.from({ length: 7 }, (_, i) => `M${x + 3} ${y + 24 + i * 4.6} l64 0`).join(' '), SP * 0.3).setAttribute('opacity', '0.6');
    }
    S(nr, box(784, y + 84, R1 - 790, 10, 0.2), SP * 0.8);
  }
  ac(nr, 1000, 300, 44, 30);
  // its ground floor: a grey roller shutter with "32" sprayed above, and graffiti
  fill(nr, box(906, 310, 80, 94, 0.3), '#a3a6a5');
  P(nr, Array.from({ length: 13 }, (_, i) => `M908 ${316 + i * 7} l76 0`).join(' '), SP * 0.35);
  fill(nr, box(920, 292, 40, 16, 0.2), '#ecebe6', SP * 0.5);
  text(nr, 940, 305, '32', 12, K.RED, 'Arial, sans-serif');
  P(nr, 'M916 340 q6 -10 12 0 t12 -2 q4 8 10 0 M930 356 l6 -8 l4 10 l6 -9 M1060 350 q8 -12 14 0 t10 4', SP * 0.5).setAttribute('opacity', '0.55');

  bw = false;
  // ---------- the building
  const h = lay('house');
  // the teal body: wings up to the terrace parapets, the middle tower stepping up a little higher
  fill(h, 'M360 300 L360 96 L480 96 L480 60 L560 60 L560 50 L620 50 L620 96 L780 96 L780 300Z', K.TEAL, SP);
  // recessed balconies and terraces, grey inside
  for (const [x, w] of [[370, 102], [630, 140]]) {
    fill(h, box(x, 102, w, 74, 0.3), K.RECESS);
    fill(h, box(x, 196, w, 64, 0.3), K.RECESS);
  }
  // left wing, roof terrace: a shuttered window, an air conditioner, the railing, planters on the parapet
  sash(h, 380, 116, 34, 44, lit());
  ac(h, 424, 122, 40, 26);
  railing(h, 370, 472, 156, 176, 9);
  accent(h, `${box(374, 166, 26, 10, 0.2)} ${box(404, 168, 16, 8, 0.2)}`, K.ORANGE);
  accent(h, box(424, 168, 20, 8, 0.2), '#3fa39a');
  // left wing, first floor: a shuttered window, a sliding window, pots on the railing
  sash(h, 378, 206, 34, 46, lit());
  fill(h, box(380, 208, 30, 18, 0.2), K.SHUTTER, SP * 0.4);
  sash(h, 422, 206, 42, 46, lit());
  railing(h, 370, 472, 244, 260, 9);
  const pots: Clump[] = [];
  for (const [x, colour] of [[451, K.RED], [464, K.GREEN], [438, '#ecebe6']] as [number, string][]) {
    accent(h, `M${x - 5} 236 L${x + 5} 236 L${x + 4} 244 L${x - 4} 244Z`, colour);
    pots.push(clump(ctx, h, x, 230, 7, 'ivy', 18, C.IVY, 0.7));
  }
  // middle: a window with a curtain and an air conditioner under it, its hose looping up the wall
  sash(h, 530, 108, 40, 46, lit());
  P(h, 'M554 110 q-4 20 2 42', SP * 0.4).setAttribute('opacity', '0.6');
  ac(h, 522, 160, 48, 30);
  el('path', { d: 'M572 172 Q584 160 582 132 Q580 98 600 94 Q612 92 618 98', fill: 'none', style: 'stroke: var(--paper)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, h);
  P(h, 'M572 170 Q586 158 583 132 Q581 99 600 92 Q612 90 618 96', SP * 0.4);
  P(h, 'M586 174 l26 5 M604 174 l4 9', SP * 0.9); // an old bracket sticking out of the wall
  // middle, first floor: two tall arched windows with grilles
  for (const x of [500, 580]) {
    const w = 34, top = 206, r = w / 2;
    win(ctx, h, glowG, x, top, w, 66, lit(), false);
    // teal corners turn the pane's square top into an arch
    fill(h, `M${x - 1} ${top - 1} L${x + r} ${top - 1} A${r} ${r} 0 0 0 ${x - 1} ${top + r}Z M${x + w + 1} ${top - 1} L${x + r} ${top - 1} A${r} ${r} 0 0 1 ${x + w + 1} ${top + r}Z`, K.TEAL, 0);
    P(h, `M${x} ${top + 66} L${x} ${top + r} A${r} ${r} 0 0 1 ${x + w} ${top + r} L${x + w} ${top + 66}`, SP * 1.1);
    P(h, `${[0.2, 0.4, 0.6, 0.8].map((u) => `M${f(x + u * w)} ${f(top + 4 + Math.abs(u * w - r) * 0.6)} L${f(x + u * w)} ${top + 66}`).join(' ')} M${x} ${top + 30} l${w} 0 M${x} ${top + 48} l${w} 0`, SP * 0.5);
    P(h, `M${x - 3} ${top + 69} l${w + 6} 0`, SP);
  }
  // right wing, roof terrace: a small window, the railing, a satellite dish on the corner
  sash(h, 650, 114, 30, 40, lit());
  railing(h, 630, 770, 156, 176, 9);
  // fairy lights draped along the top rail: barely there by day, warm little bulbs that twinkle at night
  const swag = 20, sagF = 4, bulbs: { c: SVGCircleElement; g: SVGCircleElement; ph: number }[] = [];
  let string = 'M632 156';
  for (let x = 632; x < 768; x += swag) string += ` Q${x + swag / 2} ${156 + sagF * 2} ${x + swag} 156`;
  P(h, string, SP * 0.3).setAttribute('opacity', '0.5');
  for (let x = 632; x <= 768; x += swag / 4) {
    const u = ((x - 632) % swag) / swag, y = 156 + sagF * 4 * u * (1 - u) + 1.4;
    bulbs.push({ c: el('circle', { cx: f(x), cy: f(y), r: 1.1 }, h), g: el('circle', { cx: f(x), cy: f(y), r: 7, fill: 'url(#h-glow)', opacity: 0 }, glowG), ph: R(0, 6.3) });
  }
  let lamp = 0;
  ctx.add({
    paint: (pal) => { lamp = pal.lamp; for (const b of bulbs) b.c.setAttribute('fill', lamp > 0.5 ? '#ffe2a8' : '#d8d6cc'); },
    step: ({ t }) => { if (lamp > 0.05) for (const b of bulbs) b.g.setAttribute('opacity', f(lamp * (0.55 + 0.45 * Math.sin(t * 1.3 + b.ph)))); },
  });
  S(h, 'M766 96 a10 12 -20 1 0 4 -22Z', SP * 0.8);
  P(h, 'M766 86 l-8 -4', SP * 0.6);
  // right wing, first floor: an air conditioner up high, a big window, a small one, a rail
  ac(h, 640, 202, 46, 32);
  sash(h, 712, 204, 52, 50, lit());
  win(ctx, h, glowG, 688, 238, 20, 16, lit());
  P(h, 'M632 246 L768 244 M648 246 l0 14 M700 246 l0 14 M740 245 l0 14 M768 244 l0 16', SP * 0.9);
  // corrugated canopies over both terraces, the slab edges and a drainpipe down the right edge
  canopy(h, [354, 92], [486, 84], [366, 472], 156);
  canopy(h, [614, 82], [788, 92], [626, 776], 156);
  for (const y of [176, 260, 284]) P(h, `M358 ${y} L782 ${y}`, SP * 0.6).setAttribute('opacity', '0.7');
  tube(h, [[782, 92], [782, 300]], 4, '#c9ccca');

  // ---------- the shops (in greys too: only the teal building above them is in colour)
  bw = true;
  const shop = lay('house');
  fill(shop, box(358, 300, 424, GROUND - 300, 0.3), '#f6f5f1'); // the ground-floor wall behind the shopfronts
  // DIVANI: a yellow frame, a black inner frame, a second yellow frame and the glass
  fill(shop, box(362, 300, 196, 104, 0.3), K.YELLOW);
  fill(shop, box(374, 314, 172, 90, 0.3), K.BLACK);
  fill(shop, box(384, 324, 152, 80, 0.3), K.YELLOW);
  win(ctx, shop, glowG, 392, 332, 136, 72, 0.75, false);
  P(shop, 'M460 332 l0 72', SP * 0.6);
  fill(shop, box(402, 340, 116, 26, 0.2), '#f4f2ec', SP * 0.6);
  accent(shop, `${box(404, 342, 3, 22, 0)} ${box(512, 342, 3, 22, 0)}`, K.GREEN, 0);
  accent(shop, `${box(409, 342, 3, 22, 0)} ${box(507, 342, 3, 22, 0)}`, K.RED, 0);
  text(shop, 460, 358, 'DIVANI', 15, '#2f7a3a', 'Arial Black, Arial, sans-serif');
  text(shop, 492, 363.5, 'Living', 5.5, K.RED, 'Arial, sans-serif');
  P(shop, 'M396 382 l30 -7 l24 5 M470 378 l50 -2', SP * 0.4).setAttribute('opacity', '0.4'); // a sofa's back through the glass
  P(shop, 'M530 360 l0 10 M535 360 l0 10', SP * 1.2);
  text(shop, 541, 358, '34', 5, K.BLACK, 'Arial, sans-serif');
  S(shop, box(449, 302, 22, 8, 0.2), SP * 0.6); // the light over the door
  // PhoneMobile: a slanting black awning, the gold-lettered sign, shelves of accessories
  fill(shop, 'M556 300 L736 300 L732 318 L562 324Z', K.BLACK, SP);
  fill(shop, box(564, 318, 166, 32, 0.3), K.SIGN, SP);
  P(shop, box(566, 320, 162, 28, 0.2), SP * 0.4);
  text(shop, 647, 336, 'PhoneMobile', 16, K.GOLD, 'Georgia, serif');
  text(shop, 647, 345.5, 'יבוא ושיווק אביזרי סלולר | הרצל 34 | טל׳ 050-3508333', 4.2, K.GOLD, 'Arial, sans-serif');
  win(ctx, shop, glowG, 568, 352, 160, 52, 0.8, false);
  P(shop, `M568 352 L728 352 M640 352 L640 404 ${[364, 376, 388].map((y) => `M572 ${y} L636 ${y}`).join(' ')} M572 352 l0 52 M636 352 l0 52`, SP * 0.6);
  const goods = ['#d14b4b', '#3f78c4', '#e0b65a', '#4e9a4a', '#ecebe6'];
  goods.forEach((c, i) => accent(shop, Array.from({ length: 14 }, (_, k) => box(574 + ((k * 37 + i * 13) % 58), 355 + 12 * ((k + i) % 4), 4, 7, 0.1)).filter((_, k) => (k + i) % 3).join(' '), c, SP * 0.2));
  P(shop, 'M648 404 l0 -30 l36 0 l0 30 M692 404 l0 -22 l24 0 l0 22', SP * 0.5).setAttribute('opacity', '0.6'); // boxes inside
  // the building's entrance: a white graffitied pier with the blue "34" plate, an AC unit, a dark door
  S(shop, box(736, 300, 44, 104, 0.3));
  ac(shop, 738, 302, 40, 26);
  accent(shop, box(749, 334, 18, 12, 0.2), K.PLATE, SP * 0.4);
  text(shop, 758, 343.5, '34', 8, '#fdfcf8', 'Arial, sans-serif');
  accent(shop, box(747, 348, 22, 6, 0.2), K.PLATE, SP * 0.3);
  P(shop, 'M740 366 q4 -8 8 0 q4 8 8 0 M760 362 l0 10 M766 362 q6 0 4 5 q-4 5 -4 5 M742 384 q5 -6 10 2 t10 -2 M744 396 l8 -6 l4 6', SP * 0.6);
  fill(shop, box(782, 300, 42, 104, 0.3), '#4a4a48');
  P(shop, 'M788 310 l30 0 l0 90 l-30 0Z', SP * 0.4);
  accent(shop, box(800, 334, 8, 8, 0.1), K.RED, SP * 0.3);
  P(shop, 'M790 360 q6 -8 12 0 t12 -2', SP * 0.4).setAttribute('opacity', '0.5');

  // ---------- electricity: junction boxes, a meter cabinet, cable bundles down the walls
  const el2 = lay('house');
  for (const [x, y, w, hh] of [[784, 226, 22, 28], [340, 270, 16, 20], [1150, 200, 18, 24]]) {
    fill(el2, box(x, y, w, hh, 0.2), '#b9bcb8', SP * 0.6);
    P(el2, `M${x + 3} ${y + 4} l${w - 6} 0`, SP * 0.3);
  }
  // the meter cabinet by the shutter, with its yellow high-voltage sticker
  fill(el2, box(1100, 318, 52, 64, 0.3), '#b9bcb8', SP * 0.8);
  P(el2, 'M1126 320 l0 60 M1104 326 l18 0 M1130 326 l18 0', SP * 0.4);
  accent(el2, 'M1112 340 l10 0 l-5 9Z', K.YELLOW, SP * 0.3);
  P(el2, 'M1117 342 l-2 3 l3 0 l-2 3', SP * 0.3);
  // bundles of cable running down the corners, held by clips
  const bundle = (x: number, y0: number, y1: number, n: number) =>
    P(el2, Array.from({ length: n }, (_, i) => `M${x + i * 1.6} ${y0} Q${f(x + i * 1.6 + R(-2, 2))} ${(y0 + y1) / 2} ${f(x + i * 1.6 + R(-1, 1))} ${y1}`).join(' ') + Array.from({ length: Math.floor((y1 - y0) / 30) }, (_, i) => ` M${x - 1} ${y0 + 15 + i * 30} l${n * 1.6 + 2} 0`).join(''), SP * 0.4);
  bundle(788, 80, 226, 4);
  bundle(792, 254, 300, 3);
  bundle(346, 120, 270, 3);
  bundle(1154, 90, 200, 3);
  bundle(1158, 224, 318, 2);

  bw = false;
  // ---------- cables strung across the street front, swaying a little in the wind
  const wires = lay('front');
  const spans: [number, number, number, number, number][] = [ // x1, y1, x2, y2, sag
    [L - 4, 120, 340, 126, 40], [346, 120, 788, 82, 70], [788, 82, 1010, 126, 40], [1010, 126, R1 + 4, 110, 30],
    [L - 4, 150, 346, 150, 50], [790, 230, 1010, 140, 50], [1010, 140, R1 + 4, 150, 46],
    [794, 120, 1150, 200, 80], [794, 140, R1 + 4, 70, 60], [340, 270, 788, 240, 46], [1158, 224, R1 + 4, 260, 30],
  ];
  const cables = spans.map(() => el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.55 }, wires));
  ctx.add({
    step({ t, wind }) {
      spans.forEach(([x1, y1, x2, y2, sag], i) => {
        const k = sag / 50, s = sag + wind * 3 * k + wobble(t * 0.5 + i * 1.7) * 1.2 * k;
        cables[i].setAttribute('d', `M${x1} ${y1} Q${f((x1 + x2) / 2)} ${f((y1 + y2) / 2 + s * 2)} ${x2} ${y2}`);
      });
    },
  });


  // ---------- the pavement here is grey concrete slabs
  const pv = lay('wall');
  surface(ctx, el('path', { d: box(L, GROUND + 0.6, WIDTH, H - GROUND - 0.6, 0), opacity: 0.6 }, pv), '#9a9c9b');
  P(pv, Array.from({ length: Math.ceil(WIDTH / 28) }, (_, i) => `M${L + i * 28} ${GROUND} l-2 ${H - GROUND}`).join(' ') + ` M${L} ${GROUND + 18} L${R1} ${GROUND + 18}`, SP * 0.35).setAttribute('opacity', '0.5');

  // ---------- benches outside the shops: dark metal frames, brown wooden slats
  const bench = (x: number, w: number) => {
    const g = lay('front'), y = GROUND + 18;
    fill(g, [y - 40, y - 33, y - 26].map((sy) => box(x + 4, sy, w - 8, 5, 0.2)).join(' ') + ' ' + box(x + 2, y - 20, w - 4, 5, 0.2), '#5b4636', SP * 0.6);
    const frame = [x + 6, x + w - 6].map((lx) => `M${lx - 3} ${y} L${lx} ${y - 18} L${lx + 1} ${y - 44}`).concat([x + 14, x + w - 14].map((lx) => `M${lx + 3} ${y + 3} L${lx} ${y - 16}`)).join(' ') + ` M${x + 3} ${y - 16} L${x + w - 3} ${y - 16}`;
    tint(ctx, el('path', { d: frame, fill: 'none', stroke: K.BLACK, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g), K.BLACK, 'stroke');
  };
  bench(574, 74);
  bench(250, 64);

  // ---------- the street tree: a slim trunk and an airy crown in front of the arched windows
  const tree = el('g', { transform: 'translate(24 16)' }, lay('front')); // planted out on the pavement, level with the benches (front layer, so the paving doesn't hide its foot)
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

