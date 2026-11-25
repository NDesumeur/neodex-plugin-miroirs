// Miroirs : tourne les miroirs pour guider le laser jusqu'à tous les cristaux.
// Jeu NeoDex en pixel art dessiné à la main. Chaque niveau est construit à partir du trajet du laser, donc toujours faisable. Il tourne dans le bac à sable de NeoDex.
const HTML = `<div class="appWrap wide">
  <div class="agHead"><span class="label">Miroirs</span><span class="hint">Clic sur un miroir pour le tourner · flèches et Entrée au clavier · H : indice · R : recommencer</span></div>
  <div class="gMain"><div class="gameBox"><canvas id="miCanvas" width="240" height="136" role="img" aria-label="Miroirs"></canvas></div>
    <div class="gSide">
      <div class="sysCard"><b>RECORDS</b><div class="gStats" id="miStats"></div></div>
      <div class="row"><button class="btn main" id="miNew">RECOMMENCER</button><button class="btn" id="miPrev">◀</button><button class="btn" id="miNext">▶</button><button class="btn" id="miFs">PLEIN ÉCRAN</button></div>
      <div class="row"><button class="btn" id="miDaily">NIVEAU DU JOUR</button></div>
      <div class="hint">Le canon tire un laser. Chaque miroir le renvoie à angle droit ; un clic le fait pivoter. Allume tous les cristaux en même temps pour finir le niveau. Les murs arrêtent le laser, les cristaux le laissent passer. Trois étoiles en peu de coups ; un indice remet un miroir dans le bon sens, mais le niveau ne vaut plus qu'une étoile.</div>
      <div class="hint">À partir du niveau 41 : les filtres de couleur teignent le laser, les cristaux de couleur ne s'allument qu'avec un laser de leur couleur (le cristal blanc prend toutes les couleurs), et à partir du niveau 45 le prisme sépare le laser en deux, à gauche et à droite.</div>
    </div></div>
</div>`;
const CSS = `.gMain{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap}
.gameBox{display:grid;place-items:center;padding:10px;background:#05010b;flex:2 1 560px;min-width:min(100%,560px);position:relative}
.gameBox canvas{width:min(100%,max(320px,calc((100vh - 190px) * 240 / 136)));height:auto;aspect-ratio:240/136;image-rendering:pixelated;cursor:var(--cp,pointer);touch-action:none}
.gameBox:fullscreen{padding:0}
.gameBox:fullscreen canvas{width:min(100vw,calc(100vh * 240 / 136))}
.gSide{display:flex;flex-direction:column;gap:14px;flex:1;min-width:250px;max-width:420px}
.gSide .sysCard{display:flex;flex-direction:column}
.gStats{display:grid;grid-template-columns:1fr auto;gap:4px 14px}
.gStats b{text-align:right}`;
const MI_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
/* ---------- l'habillage pixel art, dessiné à la main : police bitmap (accents compris), cadres, boutons, icônes ----------
   Tout est en pixels pleins, agrandis par 2 sans lissage : aucun dégradé, aucune ombre floue. */
const PXK = (() => {
  // chaque lettre : ses lignes, de haut en bas, à partir de la ligne 2 de la case (0-1 : accents des majuscules, 9-10 : jambages)
  const S = {
    A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.', C: '.###. #...# #.... #.... #.... #...# .###.',
    D: '####. #...# #...# #...# #...# #...# ####.', E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
    G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#', I: '### .#. .#. .#. .#. .#. ###',
    J: '..### ...#. ...#. ...#. #..#. #..#. .##..', K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
    M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# ##..# #.#.# #..## #...# #...# #...#', O: '.###. #...# #...# #...# #...# #...# .###.',
    P: '####. #...# #...# ####. #.... #.... #....', Q: '.###. #...# #...# #...# #.#.# #..#. .##.#', R: '####. #...# #...# ####. #.#.. #..#. #...#',
    S: '.#### #.... #.... .###. ....# ....# ####.', T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', U: '#...# #...# #...# #...# #...# #...# .###.',
    V: '#...# #...# #...# #...# #...# .#.#. ..#..', W: '#...# #...# #...# #.#.# #.#.# ##.## #...#', X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
    Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####',
    a: '..... ..... .###. ....# .#### #...# .####', b: '#.... #.... ####. #...# #...# #...# ####.', c: '..... ..... .###. #.... #.... #.... .###.',
    d: '....# ....# .#### #...# #...# #...# .####', e: '..... ..... .###. #...# ##### #.... .###.', f: '..## .#.. #### .#.. .#.. .#.. .#..',
    g: '..... ..... .#### #...# #...# #...# .#### ....# .###.', h: '#.... #.... ####. #...# #...# #...# #...#', i: '.#. ... ##. .#. .#. .#. ###',
    'ı': '... ... ##. .#. .#. .#. ###', j: '...# .... ..## ...# ...# ...# ...# #..# .##.', k: '#... #... #..# #.#. ##.. #.#. #..#',
    l: '##. .#. .#. .#. .#. .#. ###', m: '..... ..... ##.#. #.#.# #.#.# #.#.# #...#', n: '..... ..... ####. #...# #...# #...# #...#',
    o: '..... ..... .###. #...# #...# #...# .###.', p: '..... ..... ####. #...# #...# #...# ####. #.... #....', q: '..... ..... .#### #...# #...# #...# .#### ....# ....#',
    r: '.... .... #.## ##.. #... #... #...', s: '..... ..... .#### #.... .###. ....# ####.', t: '.#.. .#.. #### .#.. .#.. .#.. ..##',
    u: '..... ..... #...# #...# #...# #..## .##.#', v: '..... ..... #...# #...# #...# .#.#. ..#..', w: '..... ..... #...# #...# #.#.# #.#.# .#.#.',
    x: '..... ..... #...# .#.#. ..#.. .#.#. #...#', y: '..... ..... #...# #...# #...# #...# .#### ....# .###.', z: '..... ..... ##### ...#. ..#.. .#... #####',
    0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', 2: '.###. #...# ....# ...#. ..#.. .#... #####',
    3: '####. ....# ....# .###. ....# ....# ####.', 4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
    6: '.###. #.... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...', 8: '.###. #...# #...# .###. #...# #...# .###.',
    9: '.###. #...# #...# .#### ....# ....# .###.',
    '.': '. . . . . . #', ',': '.. .. .. .. .. .# .# #.', ':': '. . # . . . #', ';': '.. .. .# .. .. .# .# #.', '!': '# # # # # . #',
    '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', "'": '# # . . . . .', '"': '#.# #.# ... ... ... ... ...', '-': '... ... ... ### ... ... ...',
    '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....', '/': '....# ...#. ...#. ..#.. .#... .#... #....', '(': '.# #. #. #. #. #. .#', ')': '#. .# .# .# .# .# #.',
    '%': '##..# ##.#. ...#. ..#.. .#... .#.## #..##', '·': '. . . # . . .', '×': '..... ..... #...# .#.#. ..#.. .#.#. #...#',
    '<': '...# ..#. .#.. #... .#.. ..#. ...#', '>': '#... .#.. ..#. ...# ..#. .#.. #...', '=': '.... .... #### .... #### .... ....',
    '_': '..... ..... ..... ..... ..... ..... #####', '#': '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#',
    '…': '..... ..... ..... ..... ..... ..... #.#.#', '«': '..... ..#.# .#.#. #.#.. .#.#. ..#.# .....', '»': '..... #.#.. .#.#. ..#.# .#.#. #.#.. .....',
    '◀': '...# ..## .### #### .### ..## ...#', '▶': '#... ##.. ###. #### ###. ##.. #...', '→': '..... ..#.. ...#. ##### ...#. ..#.. .....',
    '←': '..... ..#.. .#... ##### .#... ..#.. .....', '↑': '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..', '↓': '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..',
    '*': '..... #.#.# .###. ##### .###. #.#.# .....', '[': '## #. #. #. #. #. ##', ']': '## .# .# .# .# .# ##', '|': '# # # # # # #',
    '@': '.###. #...# #.### #.#.# #.### #.... .###.', '€': '..### .#... ####. .#... ####. .#... ..###', '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
    '°': '.#. #.# .#. ... ... ... ...', '~': '..... ..... .#..# #.##. ..... ..... .....', '♪': '..##. ..#.# ..#.. ..#.. .##.. ###.. .#...',
  };
  const ACC = { a: ['..#', '.#.'], g: ['#..', '.#.'], c: ['.#.', '#.#'], d: ['...', '#.#'], t: ['.#.#', '#.#.'], z: ['.#.', '##.'] };  // aigu, grave, circonflexe, tréma, tilde, cédille
  const COMP = { é: 'ea', è: 'eg', ê: 'ec', ë: 'ed', á: 'aa', à: 'ag', â: 'ac', ä: 'ad', í: 'ıa', ì: 'ıg', î: 'ıc', ï: 'ıd', ó: 'oa', ò: 'og', ô: 'oc', ö: 'od',
    ú: 'ua', ù: 'ug', û: 'uc', ü: 'ud', ÿ: 'yd', ñ: 'nt', ç: 'cz', É: 'Ea', È: 'Eg', Ê: 'Ec', Ë: 'Ed', Á: 'Aa', À: 'Ag', Â: 'Ac', Ä: 'Ad', Í: 'Ia', Î: 'Ic', Ï: 'Id',
    Ó: 'Oa', Ô: 'Oc', Ö: 'Od', Ú: 'Ua', Ù: 'Ug', Û: 'Uc', Ü: 'Ud', Ñ: 'Nt', Ç: 'Cz' };
  const SUB = { 'œ': 'oe', 'Œ': 'OE', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', ' ': ' ', ' ': ' ', '•': '·', '✓': 'v', 'ᐸ': '<', 'ᐳ': '>', '＜': '<', '＞': '>', '｜': '|', '／': '/', '！': '!', '？': '?', '（': '(', '）': ')', '：': ':', '　': ' ' };  // ᐸ ᐳ : les < > des titres YouTube
  const H = 11, glyphs = new Map(); let raster;
  function glyph(ch) {
    let g = glyphs.get(ch); if (g) return g;
    const px = [], add = (rows, ox, oy) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([ox + x, oy + y]); });
    const c = COMP[ch], src = S[c ? c[0] : ch]; let w = 3;
    if (src) {
      const rows = src.split(' '); w = Math.max(...rows.map(r => r.length)); add(rows, 0, 2);
      if (c) { const a = ACC[c[1]]; add(a, Math.floor((w - a[0].length) / 2), c[1] === 'z' ? 9 : /[A-Z]/.test(c[0]) ? 0 : 1); }
    } else if (ch !== ' ') {  // japonais, emoji… : la lettre du système, réduite à des pixels nets (sans lissage) sur la même hauteur que la police
      const q = (raster ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })), RW = 16;
      q.canvas.width = RW; q.canvas.height = H; q.font = '11px "MS Gothic", "Yu Gothic UI", Meiryo, "Segoe UI Symbol", sans-serif'; q.fillStyle = '#000'; q.fillText(ch, 0, 10);
      const d = q.getImageData(0, 0, RW, H).data; let mx = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < RW; x++) if (d[(y * RW + x) * 4 + 3] > 110) { px.push([x, y]); mx = Math.max(mx, x + 1); }
      w = mx || 3;
      if (!px.length) { w = 5; add(['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'], 0, 2); }  // vraiment inconnue : une petite case
    }
    g = { w, px }; glyphs.set(ch, g); return g;
  }
  function layout(text) {
    let x = 0; const items = [];
    for (const ch of String(text)) for (const c of SUB[ch] ?? ch) { const g = glyph(c); items.push([g, x]); x += g.w + 1; }
    return { w: Math.max(0, x - 1), items };
  }
  function draw(g, text, x, y, color, s = 1) {  // (x, y) : coin haut gauche de la case
    const L = layout(text); g.fillStyle = color;
    for (const [gl, ox] of L.items) for (const [px, py] of gl.px) g.fillRect(x + (ox + px) * s, y + py * s, s, s);
    return L.w * s;
  }
  const bmp = new Map();
  function sprite(text, color, s = 1) {  // le texte tout prêt, gardé pour les images suivantes du jeu
    const k = text + '|' + color + '|' + s; let c = bmp.get(k); if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, layout(text).w * s); c.height = H * s; draw(c.getContext('2d'), text, 0, 0, color, s);
    if (bmp.size > 400) bmp.delete(bmp.keys().next().value);
    bmp.set(k, c); return c;
  }
  // comme fillText : (x, y) sur la ligne de base, aligné à gauche, au centre ou à droite
  function fill(g, text, x, y, color, s = 1, align = 'left') {
    const c = sprite(String(text), color, s), dx = align === 'center' ? -c.width / 2 : align === 'right' ? -c.width : 0;
    g.drawImage(c, Math.round(x + dx), Math.round(y - 9 * s));
  }
  const scale = size => Math.max(1, Math.round((size || 8) / 8));
  function art(rows, pal, s = 1) {  // un dessin en lignes de caractères, chaque caractère une couleur de la palette (« . » : transparent)
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)) * s; c.height = rows.length * s;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x * s, y * s, s, s); } } });
    return c;
  }
  return { H, layout, draw, sprite, fill, scale, art };
})();

// les pièces de l'interface, pixel par pixel (K : contour, les autres lettres : la palette du jeu)
const PX_PANEL = ['..KKKKKKKKKKKK..', '.KAAAAAAAAAAAAK.', 'KALAAAAAAAAAALSK', 'KAAKKKKKKKKKKSSK', 'KAAKHHHHHHHHKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK',
  'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKKKKKKKKKKSSK', 'KALSSSSSSSSSSLSK', '.KSSSSSSSSSSSSK.', '..KKKKKKKKKKKK..'];
const PX_CARD = ['.KKKKKKKKKK.', 'KFFFFFFFFFFK', 'KFHHHHHHHHFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFSSSSSSSSFK', 'KFFFFFFFFFFK', '.KKKKKKKKKK.'];
const PX_BTN = ['.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KBBBBBBBBBBK', 'KKKKKKKKKKKK', 'KDDDDDDDDDDK', '.KKKKKKKKKK.'];
const PX_BTN_DOWN = ['............', '............', '.KKKKKKKKKK.', 'KBBBBBBBBBBK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KWWWWWWWWWWK', '.KKKKKKKKKK.'];
const PX_TRACK = ['.KKKKKKKKKK.', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KHHHHHHHHHHK', '.KKKKKKKKKK.'];
const PX_KNOB = ['.KKKKK.', 'KWWWWWK', 'KWAAABK', 'KWAAABK', 'KKKKKKK', 'KWAAABK', 'KWAAABK', 'KBBBBBK', 'KDDDDDK', '.KKKKK.'];
const PX_RAIL = ['KDDDDDDK', 'KDDDDDDK', 'KDDDDDDK', 'KDDHHDDK'];
const PX_ICONS = {
  play: ['kk......', 'kakk....', 'kaaakk..', 'kaaaaakk', 'kaaaaaak', 'kaaaaakk', 'kaaakk..', 'kakk....', 'kk......'],
  full: ['www...www', 'w.......w', 'w.......w', '.........', '....a....', '.........', 'w.......w', 'w.......w', 'www...www'],
  note: ['...aaaaaa', '...aaaaaa', '...a....a', '...a....a', '...a....a', '.aaa..aaa', 'aaaa.aaaa', 'aaaa.aaaa', '.aa...aa.'],
  star: ['....g....', '....g....', '...ggg...', 'ggggwgggg', '.ggwwwgg.', '..ggggg..', '..oo.oo..', '.oo...oo.', '.o.....o.'],
  crown: ['g...g...g', 'gg.ggg.gg', 'ggggggggg', 'grgggggrg', 'ggggggggg', 'ooooooooo'],
  folder: ['oooo.....', 'oggoooooo', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ooooooooo'],
  vol: ['....w....', '...ww..b.', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', '...ww..b.', '....w....'],
  clock: ['..wwwww..', '.w.....w.', 'w...a...w', 'w...a...w', 'w...aaa.w', 'w.......w', 'w.......w', '.w.....w.', '..wwwww..'],
  cursor: ['....a....', '..aaaaa..', '.a..a..a.', '.a.....a.', 'aaa.w.aaa', '.a.....a.', '.a..a..a.', '..aaaaa..', '....a....'],
  plus: ['...b...', '...b...', '...b...', 'bbbbbbb', '...b...', '...b...', '...b...'],
  down: ['wwwwwww', '.wwwww.', '..www..', '...w...'],
};

/* habille la page du jeu : root = son conteneur, T = sa palette, icons = [motif du texte, icône] pour les boutons et libellés */
function pxSkin(root, { T, icons = [], emblem, title }) {
  root.classList.add('pxk'); const s = 2, url = c => c.toDataURL();
  const btnPal = (M, W, B, D) => ({ K: T.k, W, M, B, D });
  const BN = btnPal(T.btn, T.btnHi, T.btnLo, T.k2), BH = btnPal(T.btnHov, T.btnHovHi, T.btnLo, T.k2);
  const BA = btnPal(T.acc, T.accL, T.accS, T.accD), BAH = btnPal(T.accL, '#ffffff', T.acc, T.accD);
  const img = { panel: PXK.art(PX_PANEL, { K: T.k, A: T.acc, S: T.accS, L: T.rivet, H: T.hl, D: T.fill }, s),
    card: PXK.art(PX_CARD, { K: T.k, F: T.line, H: T.hl, D: T.fill, S: T.k2 }, s), cardOn: PXK.art(PX_CARD, { K: T.k, F: T.acc, H: T.accS, D: T.fillOn, S: T.accD }, s),
    btn: PXK.art(PX_BTN, BN, s), btnH: PXK.art(PX_BTN, BH, s), btnD: PXK.art(PX_BTN_DOWN, BH, s),
    main: PXK.art(PX_BTN, BA, s), mainH: PXK.art(PX_BTN, BAH, s), mainD: PXK.art(PX_BTN_DOWN, BA, s),
    track: PXK.art(PX_TRACK, { K: T.k, D: T.k2, H: T.line }, s), knob: PXK.art(PX_KNOB, { K: T.k, W: T.accL, A: T.acc, B: T.accS, D: T.accD }, s),
    rail: PXK.art(PX_RAIL, { K: T.k, D: T.k2, H: T.line }, s), tile: PXK.art(T.tile, { x: T.bgDot, ':': T.bgDot2, '+': T.spark, '*': T.spark2 }, s) };
  const u = Object.fromEntries(Object.entries(img).map(([k, c]) => [k, url(c)]));
  const nine = (k, sl) => `border-style:solid;border-width:${sl * s}px;border-image:url(${u[k]}) ${sl * s} fill / ${sl * s}px stretch`;
  const IP = { k: T.k, w: T.text, a: T.acc, b: T.acc2, g: T.gold, o: T.orange, r: T.red, n: T.green, N: T.green2, m: T.muted, s: T.accS };
  const iconUrl = new Map(), icon = name => {
    let v = iconUrl.get(name); if (!v) { const c = PXK.art(PX_ICONS[name] || emblem, IP, s); v = { u: url(c), w: c.width, h: c.height }; iconUrl.set(name, v); }
    const b = document.createElement('b'); b.className = 'pxI'; b.setAttribute('aria-hidden', 'true'); b.style.cssText = `width:${v.w}px;height:${v.h}px;background-image:url(${v.u})`; return b;
  };
  const R = '.pxk.pxk';
  const css = document.createElement('style');
  css.textContent = `html,html body{background:${T.bg} url(${u.tile}) 0 0/${img.tile.width}px ${img.tile.height}px repeat!important}
::-webkit-scrollbar{width:16px;height:16px} ::-webkit-scrollbar-track{background:url(${u.rail}) 0 0/16px 8px repeat-y} ::-webkit-scrollbar-thumb{${nine('main', 4)}} ::-webkit-scrollbar-corner{background:none}
${R}{color:${T.text}}
${R} .px{box-shadow:none;background:none}
${R} .agHead{gap:18px;margin:0}
${R} .agHead .label{display:flex;align-items:center;gap:12px}
${R} .btn,${R} .tab{${nine('btn', 4)};height:auto;min-height:0;padding:0 6px 4px;margin:0;color:${T.text};font:12px/1 monospace;display:inline-flex;align-items:center;gap:6px;filter:none;text-shadow:none;letter-spacing:0;cursor:var(--cp,pointer)}
${R} .btn:hover,${R} .tab:hover{border-image-source:url(${u.btnH})}
${R} .btn:active,${R} .tab:active{border-image-source:url(${u.btnD});padding:4px 6px 0}
${R} .btn.main,${R} .tab.on{border-image-source:url(${u.main});color:${T.k}}
${R} .btn.main:hover,${R} .tab.on:hover{border-image-source:url(${u.mainH})}
${R} .btn.main:active,${R} .tab.on:active{border-image-source:url(${u.mainD})}
${R} .btn:focus-visible,${R} .tab:focus-visible{outline:2px dashed ${T.acc2};outline-offset:2px}
${R} .btn .pxV,${R} .tab .pxV{white-space:nowrap}
${R} .sysCard{${nine('card', 4)};padding:4px 6px;gap:8px;background:none}
${R} .sysCard.on{border-image-source:url(${u.cardOn})}
${R} .sysCard.on>b{color:${T.acc}}
${R} .sysCard>b{color:${T.text}}
${R} .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
${R} .gameBox,${R} .thBox{${nine('panel', 5)};box-shadow:none;background:none;padding:2px;gap:8px;grid-template-rows:auto auto}
${R} .gameBox canvas,${R} .thBox canvas{display:block;background:#05010b}
${R} .gameBox:fullscreen,${R} .thBox:fullscreen{border:0;padding:0;background:#000}
${R} .rhFs{position:static;opacity:1;justify-self:end;margin:0 6px 6px 0}
${R} .rhTabs{gap:8px;flex-wrap:wrap}
${R} .hint{color:${T.muted};line-height:24px}
${R} label{color:${T.muted};display:inline-flex;align-items:center;gap:8px}
${R} .rhDel{color:${T.red};top:6px;right:8px}
${R} input[type=range]{-webkit-appearance:none;appearance:none;background:none;height:20px;width:150px}
${R} input[type=range]::-webkit-slider-runnable-track{height:12px;${nine('track', 2)}}
${R} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:20px;border:0;background:url(${u.knob}) 0 0/100% 100%;margin-top:-8px;cursor:var(--cp,pointer)}
${R} .pxSel{justify-content:space-between;gap:10px;max-width:100%;overflow:hidden}
${R} .rhImport .pxSel{flex:1;min-width:0}
.pxMenu{position:fixed;z-index:50;${nine('card', 4)};padding:2px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;color:${T.text}}
.pxMenu button{all:unset;padding:3px 8px;cursor:var(--cp,pointer);white-space:nowrap}
.pxMenu button:hover,.pxMenu button:focus-visible,.pxMenu button.on{background:${T.btnHov};color:${T.text}}
.pxMenu button.on{color:${T.acc}}
.pxT{position:relative;white-space:normal;font:12px/1 monospace;letter-spacing:0;text-transform:none}
.pxT i{display:inline-block;vertical-align:middle;background:currentColor;-webkit-mask:var(--m) 0 0/100% 100% no-repeat;mask:var(--m) 0 0/100% 100% no-repeat;image-rendering:pixelated}
.pxI{display:inline-block;vertical-align:middle;background:0 0/100% 100% no-repeat;image-rendering:pixelated;margin-right:6px}
.pxV>.pxI+.pxI{margin-left:-4px}
.pxSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;
  document.head.append(css);
  // un mot = une image (en masque : sa couleur suit celle du texte), une règle par mot pour ne pas répéter l'image
  const words = new Map(), sheet = document.head.appendChild(document.createElement('style')).sheet;
  const word = w => {
    let k = words.get(w);
    if (!k) { const c = PXK.sprite(w, '#fff', s); k = 'pw' + words.size; words.set(w, k); sheet.insertRule(`.${k}{--m:url(${c.toDataURL()});width:${c.width}px;height:${c.height}px}`, sheet.cssRules.length); }
    const i = document.createElement('i'); i.className = k; return i;
  };
  function render(vis, text, lead) {
    const parts = [], ic = lead && icons.find(([re]) => re.test(text.trim()));
    if (ic) parts.push(icon(ic[1]));
    for (const m of text.matchAll(/(★+)|(\s+)|([^\s★]+)/g)) {
      if (m[1]) for (const _ of m[1]) parts.push(icon('star'));
      else if (m[2]) parts.push(document.createTextNode(' '));
      else parts.push(word(m[3]));
    }
    vis.replaceChildren(...parts);
  }
  const lead = node => node.parentElement?.matches('button,label,.tab,.btn') && !node.previousSibling;
  function pixText(node) {  // le texte reste dans la page (lecteur d'écran, copier) ; on voit ses lettres en pixels
    const wrap = document.createElement('span'), sr = document.createElement('span'), vis = document.createElement('span');
    wrap.className = 'pxT'; sr.className = 'pxSr'; vis.className = 'pxV'; vis.setAttribute('aria-hidden', 'true');
    const first = lead(node); node.replaceWith(wrap); sr.append(node); wrap.append(sr, vis); render(vis, node.data, first);
  }
  function pxSelect(sel) {  // une liste déroulante en pixels ; la vraie reste cachée et garde sa valeur et ses événements
    sel.dataset.px = '1'; sel.style.display = 'none';
    const b = document.createElement('button'), lab = document.createElement('span'); b.type = 'button'; b.className = 'btn pxSel'; b.append(lab, icon('down')); sel.after(b);
    const sync = () => { const t = sel.selectedOptions[0]?.textContent || '—'; if (lab.dataset.t !== t) { lab.dataset.t = t; lab.textContent = t; } };
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); sync(); } });
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true });
    sel.addEventListener('change', sync);
    b.onclick = () => {
      document.querySelector('.pxMenu')?.remove();
      const m = document.createElement('div'), r = b.getBoundingClientRect(); m.className = 'pxMenu'; m.setAttribute('role', 'listbox');
      for (const o of sel.options) {
        const it = document.createElement('button'); it.type = 'button'; it.textContent = o.textContent; it.className = o.selected ? 'on' : ''; it.setAttribute('role', 'option');
        it.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); close(); b.focus(); };
        m.append(it);
      }
      root.append(m);
      const below = innerHeight - r.bottom; m.style.minWidth = r.width + 'px'; m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 4) + 'px';
      m.style.top = (below > m.offsetHeight + 8 || below > r.top ? r.bottom + 2 : r.top - m.offsetHeight - 2) + 'px';
      const close = () => { m.remove(); removeEventListener('pointerdown', out, true); removeEventListener('keydown', key, true); removeEventListener('blur', close); };
      const out = e => { if (!m.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
      const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); b.focus(); } };
      addEventListener('pointerdown', out, true); addEventListener('keydown', key, true); addEventListener('blur', close);
      (m.querySelector('.on') || m.firstChild)?.focus();
    };
    sync();
  }
  const SKIP = 'select,option,textarea,script,style,canvas,.pxT,[data-pxskip]';
  let queued = false;
  function pass() {
    queued = false;
    root.querySelectorAll('select.gSel:not([data-px])').forEach(pxSelect);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), todo = [];
    for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement && !n.parentElement.closest(SKIP)) todo.push(n);
    todo.forEach(pixText);
  }
  new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'characterData') { const wrap = m.target.parentNode?.closest?.('.pxT'); if (wrap) render(wrap.lastChild, m.target.data, false); }
    if (!queued) { queued = true; queueMicrotask(pass); }
  }).observe(root, { childList: true, subtree: true, characterData: true });
  // le titre : grosses lettres à contour, trois tons, et l'emblème du jeu
  const lab = root.querySelector('.agHead .label');
  if (lab) {
    const L = PXK.layout(title), c = document.createElement('canvas'), g = c.getContext('2d'), on = [];
    c.width = L.w + 3; c.height = PXK.H + 3;
    for (const [gl, ox] of L.items) for (const [x, y] of gl.px) on.push([ox + x + 1, y + 1]);
    g.fillStyle = T.k; for (const [x, y] of on) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [2, 2], [1, 2], [2, 1]]) g.fillRect(x + dx, y + dy, 1, 1);
    for (const [x, y] of on) { g.fillStyle = y <= 5 ? T.accL : y <= 7 ? T.acc : T.accS; g.fillRect(x, y, 1, 1); }
    const big = document.createElement('canvas'), z = 4; big.width = c.width * z; big.height = c.height * z;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
    const t = document.createElement('b'); t.className = 'pxI'; t.style.cssText = `width:${big.width}px;height:${big.height}px;background-image:url(${big.toDataURL()})`;
    const e = PXK.art(emblem, IP, 3), em = document.createElement('b'); em.className = 'pxI'; em.style.cssText = `width:${e.width}px;height:${e.height}px;background-image:url(${e.toDataURL()})`;
    const sr = document.createElement('span'); sr.className = 'pxSr'; sr.textContent = lab.textContent;
    lab.dataset.pxskip = '1'; lab.replaceChildren(em, t, sr);
  }
  pass();
}



export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast } = host;
  const folder = ctx.folder;
  host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => view.querySelector('#' + id) || document.getElementById(id);
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const sprite = (g, rows, x, y, pal) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } });
  const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pxFont = (g, text, x, y, color, size = 8, align = 'left') => { const s = PXK.scale(size); PXK.fill(g, text, x + s, y + s, '#05010b', s, align); PXK.fill(g, text, x, y, color, s, align); };
  const gameText = (g, w, lines, y0) => {  // lignes centrées en police pixel, sur une bande sombre
    g.fillStyle = 'rgba(11,3,28,.78)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
    lines.forEach(([text, color, size], i) => PXK.fill(g, text, w / 2, y0 + i * 14, color, PXK.scale(size), 'center'));
  };
  const theme = (acc, accL, accS, accD, acc2, base = ['#0c0a12', '#16121e', '#221c2c', '#2e263a', '#3a3046', '#62566e']) => {
    const [k, k2, fill, fillOn, hl, line] = base;
    return { k, k2, fill, fillOn, hl, line, acc, accL, accS, accD, rivet: '#f0f0f8', btn: hl, btnHi: line, btnLo: k2, btnHov: '#443852', btnHovHi: '#82768e', text: '#f4f0f8', muted: '#c0b8cc',
      acc2, gold: '#ffd84a', orange: '#ff8a3a', red: '#ff4a3a', green: '#7ee07a', green2: '#2f8a3a', bg: '#100c16', bgDot: fill, bgDot2: k2, spark: accD, spark2: acc,
      tile: ['................', '...:............', '................', '..........+.....', '................', '................', '.....:..........', '................', '................', '.............:..', '................', '..+.............', '................', '.........:......', '................', '................'] };
  };
  let ac = null, mute = false;
  const beep = (f, d, type = 'square', slide = 0, vol = .03, at = 0) => { if (mute) return; try { ac ??= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at; o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); } catch {} };
  const on = () => view.classList.contains('on');
  // la manette : croix et stick gauche = flèches, A = Entrée, B = Échap, X = Retour arrière, Y = H, Start = P ; envoyées comme des touches du clavier
  const padKeys = (map = {}) => {
    const KEY = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 2: 'Backspace', 3: 'h', 9: 'p', ...map };
    const held = new Map(), send = (k, type) => document.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    const loop = () => {
      requestAnimationFrame(loop);
      if (!on() || !navigator.getGamepads) return;
      const p = [...navigator.getGamepads()].find(Boolean); if (!p) return;
      const now = performance.now(), down = new Set();
      for (const [i, k] of Object.entries(KEY)) if (p.buttons[i]?.pressed) down.add(k);
      const [ax = 0, ay = 0] = p.axes;
      if (ax < -.5) down.add('ArrowLeft'); if (ax > .5) down.add('ArrowRight'); if (ay < -.5) down.add('ArrowUp'); if (ay > .5) down.add('ArrowDown');
      for (const k of down) { const t = held.get(k); if (t === undefined) { held.set(k, now + 260); send(k, 'keydown'); } else if (/^Arrow/.test(k) && now > t) { held.set(k, now + 110); send(k, 'keydown'); } }
      for (const k of [...held.keys()]) if (!down.has(k)) { held.delete(k); send(k, 'keyup'); }
    };
    requestAnimationFrame(loop);
  };
  pxSkin(view.querySelector('.appWrap'), { title: 'MIROIRS', T: theme('#ff5a7a', '#ffd0dc', '#c02a4a', '#2a0812', '#5ae0ff'),
    emblem: ['............', 'kk..........', 'kakkkkkk....', 'kk.....wk...', '......wbk...', '.....wbk....', '....kkk.....', '.....r......', '.....r......', '.....r...bb.', '.....rrrrbwb', '.........bb.'],
    icons: [[/^RECOMMENCER/, 'play'], [/^RECORDS/, 'crown']] });
  const W = 240, H = 136, T = 16, MAXL = 80, ADV = 41, PRISM = 45;
  const save = { level: 1, stars: {}, turns: 0, ...(await doc('records')) };
  const keep = () => folder.write('records', save).catch(() => {});
  // les trophées de NeoDex (3.4.8 et plus) : succès et records déclarés dans plugin.json ; sur un NeoDex plus ancien, rien ne se passe
  const trophy = id => { ctx.games?.unlock(id).catch(() => {}); };
  const trophyRecord = (id, v) => { if (v != null && Number.isFinite(+v)) ctx.games?.record(id, +v).catch(() => {}); };
  // une cellule : '' vide, '#' mur, 'c' cristal (toutes couleurs), '/' ou '\\' miroir ; niveaux avancés : 'R' 'G' 'B' filtre, 'r' 'g' 'b' cristal de couleur, 'p' prisme
  const BEAM = { w: ['#ff5a9a', '#ffd0e4'], r: ['#ff2a2a', '#ffb0a0'], g: ['#2ae04a', '#c0ffb0'], b: ['#3a7aff', '#b8d8ff'] };
  const reflect = (m, [dx, dy]) => m === '/' ? [-dy, -dx] : [dy, dx];
  // le trajet du laser : les cellules traversées, les cristaux allumés
  function trace(L, g = L.g) {  // segs : les morceaux de laser, chacun avec sa couleur ; hits : les miroirs et prismes touchés (pour les étincelles)
    const segs = [], lit = new Set(), seen = new Set(), hits = [], beams = [[L.ex, L.ey, L.ed, 'w', [L.ex - L.ed[0] * .5, L.ey - L.ed[1] * .5]]];
    while (beams.length && segs.length < 60) {
      let [x, y, d, col, s0] = beams.shift(), seg = [s0];
      for (let n = 0; n < 400; n++) {
        if (x < 0 || y < 0 || x >= L.w || y >= L.h) { seg.push([x - d[0] * .5, y - d[1] * .5]); break; }
        const c = g[y][x], k = x + ',' + y + ',' + d + col;
        if (seen.has(k)) { seg.push([x - d[0] * .5, y - d[1] * .5]); break; } seen.add(k);
        if (c === '#') { seg.push([x - d[0] * .5, y - d[1] * .5]); break; }
        if (c === 'c' || c === col && 'rgb'.includes(c)) lit.add(x + ',' + y);
        if ('RGB'.includes(c) && c && c.toLowerCase() !== col) { seg.push([x, y]); segs.push({ pts: seg, col }); col = c.toLowerCase(); seg = [[x, y]]; }
        if (c === '/' || c === '\\') { seg.push([x, y]); d = reflect(c, d); hits.push([x, y, col]); }
        if (c === 'p') {  // le prisme : le laser repart à gauche et à droite, plus tout droit
          seg.push([x, y]); hits.push([x, y, col]);
          for (const nd of [[d[1], d[0]], [-d[1], -d[0]]]) beams.push([x + nd[0], y + nd[1], nd, col, [x, y]]);
          break;
        }
        x += d[0]; y += d[1];
      }
      segs.push({ pts: seg, col });
    }
    return { segs, lit, hits, won: lit.size === L.crystals };
  }
  // le niveau n : on fait marcher le laser avec des virages, on pose les cristaux sur son chemin, puis on mélange les miroirs
  function makeLevel(n) {
    if (n >= ADV) return makeLevel2(n);
    const r = seeded(n * 104729 + 3), w = Math.min(12, 5 + Math.floor(n / 3)), h = Math.min(7, 4 + Math.floor(n / 6));
    const turns = Math.min(9, 2 + Math.floor(n / 3)), nCry = Math.min(5, 1 + Math.floor(n / 5));
    for (let tries = 0; tries < 400; tries++) {
      const g = Array.from({ length: h }, () => Array(w).fill('')), ey = Math.floor(r() * h);
      let x = 0, y = ey, d = [1, 0], made = 0; const path = [], mirrors = [], used = new Set();
      while (x >= 0 && y >= 0 && x < w && y < h && path.length < w * h) {
        if (g[y][x] !== '') break;
        const k = x + ',' + y;
        if (made < turns && !used.has(k) && path.length > 0 && r() < .45) {
          const opts = [[d[1], d[0]], [-d[1], -d[0]]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < w && ny < h && g[ny][nx] === '' && !used.has(nx + ',' + ny); });
          if (opts.length) { const nd = opts[Math.floor(r() * opts.length)], m = reflect('/', d)[0] === nd[0] && reflect('/', d)[1] === nd[1] ? '/' : '\\'; g[y][x] = m; mirrors.push([x, y, m, path.length]); made++; d = nd; used.add(k); x += d[0]; y += d[1]; continue; }
        }
        used.add(k); path.push([x, y]); x += d[0]; y += d[1];
      }
      if (made < turns || path.length < nCry + 2) continue;
      const after = path.slice(mirrors[mirrors.length - 1][3]);  // après le dernier miroir : un cristal là oblige à tous les régler
      const free = path.slice(1); if (!after.length) continue;
      const cry = [after[after.length - 1]];
      while (cry.length < nCry) { const p = free[Math.floor(r() * free.length)]; if (!cry.includes(p)) cry.push(p); }
      for (const [cx, cy] of cry) g[cy][cx] = 'c';
      // les murs et les miroirs pièges, hors du chemin
      const off = []; for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (g[yy][xx] === '' && !used.has(xx + ',' + yy)) off.push([xx, yy]);
      for (let i = 0; i < Math.min(off.length, Math.floor(w * h * .08)); i++) { const [a, b] = off.splice(Math.floor(r() * off.length), 1)[0]; g[b][a] = '#'; }
      for (let i = 0; i < Math.min(off.length, Math.floor(n / 3)); i++) { const [a, b] = off.splice(Math.floor(r() * off.length), 1)[0]; g[b][a] = r() < .5 ? '/' : '\\'; }
      const L = { w, h, ex: 0, ey, ed: [1, 0], crystals: nCry, sol: g.map(row => row.slice()) };
      if (!trace(L, L.sol).won) continue;
      // mélange : au moins la moitié des miroirs du chemin à l'envers, et pas déjà gagné
      const flip = c => c === '/' ? '\\' : '/';
      let wrong = 0; const play = L.sol.map(row => row.slice());
      mirrors.forEach(([mx, my], i) => { if (r() < .6 || i === mirrors.length - 1) { play[my][mx] = flip(play[my][mx]); wrong++; } });
      L.g = play; L.min = wrong;
      if (trace(L).won) continue;
      return L;
    }
    return null;
  }
  // les niveaux avancés (41 et plus) : le même principe (on fait marcher le laser, on pose ce qu'il traverse), avec des filtres, des cristaux de couleur et un prisme
  function walk(g, used, x, y, d, turns, r, w, h) {  // le laser avance en tournant parfois sur un miroir ; il s'arrête au bord ou sur une case déjà prise
    let made = 0; const path = [], mirrors = [];
    while (x >= 0 && y >= 0 && x < w && y < h && path.length < w * h) {
      const k = x + ',' + y; if (g[y][x] !== '' || used.has(k)) break;
      if (made < turns && path.length > 0 && r() < .45) {
        const opts = [[d[1], d[0]], [-d[1], -d[0]]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < w && ny < h && g[ny][nx] === '' && !used.has(nx + ',' + ny); });
        if (opts.length) { const nd = opts[Math.floor(r() * opts.length)], rf = reflect('/', d), m = rf[0] === nd[0] && rf[1] === nd[1] ? '/' : '\\'; g[y][x] = m; mirrors.push([x, y, path.length]); made++; d = nd; used.add(k); x += d[0]; y += d[1]; continue; }
      }
      used.add(k); path.push([x, y, d]); x += d[0]; y += d[1];
    }
    return { path, mirrors, made };
  }
  function makeLevel2(n, seed) {
    const r = seeded(seed ?? n * 7919 + 11), w = 12, h = 7, prism = n >= PRISM && n % 3 !== 0, nFil = n >= 55 ? 2 : 1, nCry = Math.min(6, 3 + Math.floor((n - ADV) / 10));
    for (let tries = 0; tries < 600; tries++) {
      const g = Array.from({ length: h }, () => Array(w).fill('')), used = new Set(), ey = Math.floor(r() * h);
      const main = walk(g, used, 0, ey, [1, 0], prism ? 2 + Math.floor(r() * 2) : Math.min(8, 4 + Math.floor((n - ADV) / 6)), r, w, h);
      if (main.made < 2 || main.path.length < 5) continue;
      let branches = [main];
      if (prism) {  // le prisme sur une case droite du chemin ; on oublie la suite, deux branches repartent sur les côtés
        const cand = main.path.map((c, i) => [c, i]).filter(([[x, y, d], i]) => i >= 2 && i < main.path.length - 1 && [[d[1], d[0]], [-d[1], -d[0]]].every(([dx, dy]) => g[y + dy]?.[x + dx] === '' && !used.has((x + dx) + ',' + (y + dy))));
        if (!cand.length) continue;
        const [[px0, py0, pd], pi] = cand[Math.floor(r() * cand.length)];
        for (const [x, y] of main.path.slice(pi + 1)) used.delete(x + ',' + y);
        main.path = main.path.slice(0, pi);
        for (const [mx, my, mi] of main.mirrors) if (mi > pi) { g[my][mx] = ''; used.delete(mx + ',' + my); }  // les miroirs d'après le prisme disparaissent avec la suite du chemin
        main.mirrors = main.mirrors.filter(m => m[2] <= pi);
        g[py0][px0] = 'p';
        const b1 = walk(g, used, px0 + pd[1], py0 + pd[0], [pd[1], pd[0]], 1 + Math.floor(r() * 2), r, w, h), b2 = walk(g, used, px0 - pd[1], py0 - pd[0], [-pd[1], -pd[0]], 1 + Math.floor(r() * 2), r, w, h);
        if (b1.path.length < 2 || b2.path.length < 2) continue;
        branches = [main, b1, b2];
      }
      // les filtres : sur un chemin, une case ; tout ce qui suit prend leur couleur
      const colOf = new Map(); let colAt = 'w';
      const paint = (br, start) => { let col = start; for (const [x, y] of br.path) { if (g[y][x] !== '' && 'RGB'.includes(g[y][x])) col = g[y][x].toLowerCase(); colOf.set(x + ',' + y, col); } return col; };
      for (let f = 0; f < nFil; f++) { const br = branches[f === 0 ? 0 : 1 + Math.floor(r() * (branches.length - 1))] || branches[0], i = 1 + Math.floor(r() * Math.max(1, br.path.length - 3)), [x, y] = br.path[i] || []; if (x !== undefined && g[y][x] === '') g[y][x] = 'RGB'[Math.floor(r() * 3)]; }
      colAt = paint(branches[0], 'w'); for (const br of branches.slice(1)) paint(br, colAt);
      // les cristaux : au bout de chaque chemin (il faut tout régler), puis ailleurs ; en couleur là où le laser est teint
      const cells = branches.flatMap(br => br.path.slice(1)).filter(([x, y]) => g[y][x] === ''), cry = [];
      for (const br of branches) { const e = br.path[br.path.length - 1]; if (e && g[e[1]][e[0]] === '') cry.push(e); }
      while (cry.length < nCry && cells.length) { const c = cells.splice(Math.floor(r() * cells.length), 1)[0]; if (!cry.includes(c)) cry.push(c); }
      for (const [x, y] of cry) { const col = colOf.get(x + ',' + y) || 'w'; g[y][x] = col !== 'w' && r() < .75 ? col : 'c'; }
      if (!cry.some(([x, y]) => 'rgb'.includes(g[y][x]))) continue;  // au moins un cristal de couleur
      const off = []; for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (g[yy][xx] === '' && !used.has(xx + ',' + yy)) off.push([xx, yy]);
      for (let i = 0; i < Math.min(off.length, 6); i++) { const [a, bb] = off.splice(Math.floor(r() * off.length), 1)[0]; g[bb][a] = '#'; }
      for (let i = 0; i < Math.min(off.length, Math.floor(n / 4)); i++) { const [a, bb] = off.splice(Math.floor(r() * off.length), 1)[0]; g[bb][a] = r() < .5 ? '/' : '\\'; }
      const L = { w, h, ex: 0, ey, ed: [1, 0], crystals: cry.length, sol: g.map(row => row.slice()) };
      if (!trace(L, L.sol).won) continue;
      const flip = c => c === '/' ? '\\' : '/', play = L.sol.map(row => row.slice()), mir = branches.flatMap(br => br.mirrors).filter(([x, y]) => '/\\'.includes(L.sol[y][x]));
      let wrong = 0; mir.forEach(([mx, my], i) => { if (r() < .6 || i === mir.length - 1) { play[my][mx] = flip(play[my][mx]); wrong++; } });
      L.g = play; L.min = wrong;
      if (trace(L).won) continue;
      return L;
    }
    return null;
  }
  let g = null, st = null;
  // le niveau du jour : un niveau avec prisme et couleurs, tiré d'après la date (le même pour tout le monde), et une série de jours
  const day = (k = 0) => { const d = new Date(Date.now() - k * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  save.daily ??= { last: '', streak: 0, best: 0 };
  const start = (n, daily = false) => { const L = (daily && makeLevel2(50, +day().replace(/-/g, ''))) || makeLevel(n); st = { n, L, cur: [0, L.ey], turns: 0, hint: false, mode: 'play', tick: 0, dead: 0, beam: trace(L), daily }; info(); };
  const ox = () => Math.floor((W - st.L.w * T) / 2) + 6, oy = () => 18 + Math.floor((H - 18 - st.L.h * T) / 2);
  function turn(x, y) {
    if (st.mode !== 'play') return; const c = st.L.g[y]?.[x];
    if (c !== '/' && c !== '\\') { beep(140, .05); return; }
    st.L.g[y][x] = c === '/' ? '\\' : '/'; st.turns++; save.turns++; beep(900, .04, 'square', 600, .025);
    st.beam = trace(st.L); if (st.beam.won) win();
  }
  function win() {
    st.mode = 'won'; st.dead = 0; const s = st.hint ? 1 : st.turns <= st.L.min + 2 ? 3 : st.turns <= st.L.min + 6 ? 2 : 1; st.stars = s;
    if (st.daily) { const d = save.daily; if (d.last !== day()) { d.streak = d.last === day(1) ? d.streak + 1 : 1; d.best = Math.max(d.best, d.streak); d.last = day(); } }
    else { if (s > (save.stars[st.n] || 0)) save.stars[st.n] = s; if (st.n === save.level && st.n < MAXL) save.level = st.n + 1; }
    keep(); info(); [784, 988, 1175, 1568].forEach((f, i) => beep(f, .14, 'square', 0, .03, i * .08));
  }
  function hint() {  // remet dans le bon sens un miroir du chemin qui ne l'est pas
    if (st.mode !== 'play') return;
    for (let y = 0; y < st.L.h; y++) for (let x = 0; x < st.L.w; x++) { const c = st.L.g[y][x], s = st.L.sol[y][x]; if ((c === '/' || c === '\\') && c !== s) { st.hint = true; st.cur = [x, y]; turn(x, y); return; } }
  }
  function drawMirror(X, Y, m, on) {
    px(g, '#2a2236', X + 2, Y + 2, T - 4, T - 4); px(g, '#3a3046', X + 3, Y + 3, T - 6, T - 6);
    for (let i = 0; i < 12; i++) { const a = X + 2 + i, b = m === '/' ? Y + 13 - i : Y + 2 + i; px(g, '#e8f4ff', a, b, 1, 1); px(g, on ? '#ffb0c0' : '#8ab0d0', a + (m === '/' ? 1 : -1), b, 1, 1); px(g, '#5a7a9a', a + (m === '/' ? 1 : -1), b + 1, 1, 1); }
    px(g, '#8a7a5a', X + 2, Y + 2, 2, 2); px(g, '#8a7a5a', X + T - 4, Y + T - 4, 2, 2);
  }
  function draw() {
    g.imageSmoothingEnabled = false; const L = st.L, X0 = ox(), Y0 = oy();
    px(g, '#140e1c', 0, 0, W, H);
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const X = X0 + x * T, Y = Y0 + y * T; px(g, (x + y) % 2 ? '#1e1628' : '#221a2e', X, Y, T, T); px(g, '#2a2236', X, Y, T, 1); }
    // le canon
    { const X = X0 - T, Y = Y0 + L.ey * T; px(g, '#3a3046', X + 2, Y + 3, 12, 10); px(g, '#62566e', X + 3, Y + 4, 10, 2); px(g, '#16121e', X + 10, Y + 6, 6, 4); px(g, '#ff5a7a', X + 14, Y + 7, 2, 2); }
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const c = L.g[y][x], X = X0 + x * T, Y = Y0 + y * T;
      if (c === '#') { px(g, '#4a3e5a', X + 1, Y + 1, T - 2, T - 2); px(g, '#62566e', X + 1, Y + 1, T - 2, 2); px(g, '#2a2236', X + 1, Y + 8, T - 2, 1); px(g, '#2a2236', X + 8, Y + 3, 1, 5); px(g, '#2a2236', X + 4, Y + 9, 1, 6); }
      if (c === '/' || c === '\\') drawMirror(X, Y, c, st.beam.hits.some(([a, b]) => a === x && b === y));
      if ('RGB'.includes(c) && c) { const [c1, c2] = BEAM[c.toLowerCase()]; px(g, '#05010b', X + 2, Y + 1, 12, 14); px(g, '#8a7a5a', X + 3, Y + 2, 10, 12); px(g, c1, X + 4, Y + 3, 8, 10); px(g, c2, X + 5, Y + 4, 2, 6); px(g, c2, X + 8, Y + 9, 1, 2); }
      if (c === 'p') { for (let i = 0; i < 11; i++) { const w2 = Math.floor(i / 2) * 2 + 1; px(g, '#05010b', X + 8 - (w2 >> 1) - 1, Y + 3 + i, w2 + 2, 1); px(g, ['#d8f0ff', '#b8e0ff', '#ffffff'][i % 3], X + 8 - (w2 >> 1), Y + 3 + i, w2, 1); } px(g, '#ff5a5a', X + 4, Y + 13, 3, 1); px(g, '#5aff6a', X + 7, Y + 13, 2, 1); px(g, '#5a8aff', X + 9, Y + 13, 3, 1); }
    }
    // le laser
    const pulse = st.tick % 20 < 10;
    for (const { pts: s, col } of st.beam.segs) { const [c1, c2] = BEAM[col];  // un halo, le rayon, un cœur blanc : plus lumineux qu'avant
      for (let i = 1; i < s.length; i++) { const [a, b] = s[i - 1], [c, d] = s[i], x1 = X0 + a * T + 7, y1 = Y0 + b * T + 7, x2 = X0 + c * T + 7, y2 = Y0 + d * T + 7;
        const lx = Math.min(x1, x2), ly = Math.min(y1, y2), lw = Math.abs(x2 - x1) + 2, lh = Math.abs(y2 - y1) + 2, vert = lh > lw;
        g.globalAlpha = pulse ? .32 : .22; px(g, c1, lx - (vert ? 2 : 0), ly - (vert ? 0 : 2), lw + (vert ? 4 : 0), lh + (vert ? 0 : 4)); g.globalAlpha = 1;
        px(g, c1, lx, ly, lw, lh); px(g, c2, lx + (vert ? 0 : 0), ly, vert ? 1 : lw, vert ? lh : 1); px(g, '#ffffff', vert ? lx + 1 : lx, vert ? ly : ly + 1, vert ? 1 : lw, vert ? lh : 1); } }
    for (const [hx, hy, col] of st.beam.hits) {  // les étincelles : de petits éclats qui jaillissent du miroir touché
      const X = X0 + hx * T + 7, Y = Y0 + hy * T + 7, [c1, c2] = BEAM[col];
      for (let k = 0; k < 5; k++) { const ph = (st.tick + k * 7 + hx * 13 + hy * 5) % 18, a = (k * 2.4 + hx + hy * 3 + Math.floor((st.tick + k * 7) / 18) * 1.7) % (Math.PI * 2), dd = 2 + ph * .45;
        if (ph < 12) px(g, ph < 4 ? '#ffffff' : ph < 8 ? c2 : c1, X + Math.cos(a) * dd, Y + Math.sin(a) * dd, 1, 1); }
      if (pulse) { px(g, '#ffffff', X - 1, Y, 3, 1); px(g, '#ffffff', X, Y - 1, 1, 3); }
    }
    const CRY = { c: ['#5ae0ff', '#d0f8ff', '#2a5a6e', '#3a7a8e'], r: ['#ff4a4a', '#ffc0b0', '#6a1e1e', '#8a3a3a'], g: ['#4ae05a', '#c8ffc0', '#1e5a28', '#3a7a40'], b: ['#4a8aff', '#c0d8ff', '#1e2e6a', '#3a4a8a'] };
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if ('crgb'.includes(L.g[y][x]) && L.g[y][x]) { const X = X0 + x * T, Y = Y0 + y * T, on = st.beam.lit.has(x + ',' + y), K = CRY[L.g[y][x]], c1 = on ? K[0] : K[2], c2 = on ? K[1] : K[3];
      if (on) { g.globalAlpha = .3; px(g, K[0], X + 1, Y + 1, T - 2, T - 2); g.globalAlpha = 1; }
      px(g, c1, X + 6, Y + 2, 4, 12); px(g, c1, X + 4, Y + 5, 8, 6); px(g, c2, X + 7, Y + 3, 1, 9); px(g, c2, X + 5, Y + 6, 1, 3); if (on && st.tick % 40 < 8) px(g, '#ffffff', X + 11, Y + 3, 1, 1); }
    if (st.mode === 'play') { const [cx, cy] = st.cur, X = X0 + cx * T, Y = Y0 + cy * T, c = st.tick % 30 < 20 ? '#ffd84a' : '#a08020';
      px(g, c, X, Y, 4, 1); px(g, c, X, Y, 1, 4); px(g, c, X + T - 4, Y, 4, 1); px(g, c, X + T - 1, Y, 1, 4); px(g, c, X, Y + T - 1, 4, 1); px(g, c, X, Y + T - 4, 1, 4); px(g, c, X + T - 4, Y + T - 1, 4, 1); px(g, c, X + T - 1, Y + T - 4, 1, 4); }
    px(g, '#0a0610', 0, 0, W, 14);
    pxFont(g, st.daily ? 'Niveau du jour' : 'Niveau ' + st.n, 4, 11, st.daily ? '#ffd84a' : '#ffffff');
    pxFont(g, st.beam.lit.size + ' / ' + L.crystals + ' cristaux · ' + st.turns + ' coups', W - 4, 11, '#5ae0ff', 8, 'right');
    if (st.mode === 'won' && st.dead > 20) gameText(g, W, [['TOUT BRILLE !', '#7ae05a', 12], ['★'.repeat(st.stars) + '☆'.repeat(3 - st.stars), '#ffd84a', 12], [st.turns + ' coups', '#ffffff'], [st.dead > 40 ? (st.n < MAXL ? 'Entrée : niveau suivant' : 'Tu as fini les ' + MAXL + ' niveaux !') : '', '#b8b0c8']], 48);
    if (st.tick % 15 === 0) g.canvas.setAttribute('aria-label', 'Miroirs, niveau ' + st.n + ' : ' + st.beam.lit.size + ' cristaux allumés sur ' + L.crystals + ', ' + st.turns + ' coups, case ' + (st.cur[0] + 1) + ', ' + (st.cur[1] + 1) + (st.mode === 'won' ? ', niveau fini' : '') + '.');
  }
  function info() {
    setTimeout(miTrophies);
    const stars = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('miStats').replaceChildren(...[['Niveau atteint', save.level], ['Étoiles', stars + ' / ' + MAXL * 3], ['Miroirs tournés', save.turns], ['Niveau du jour', save.daily.last === day() ? 'fait ✓' : 'à faire'], ['Série de jours', (save.daily.last === day() || save.daily.last === day(1) ? save.daily.streak : 0) + ' (record ' + save.daily.best + ')']].flatMap(([a, c]) => [el('span', '', a), el('b', '', String(c))]));
  }
  const go = n => { if (n >= 1 && n <= Math.min(save.level, MAXL)) start(n); };
  document.addEventListener('keydown', e => {
    if (!on() || !st || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key;
    if (st.mode === 'won') { if ((k === 'Enter' || k === ' ') && st.dead > 40) { e.preventDefault(); st.daily ? start(Math.min(save.level, MAXL)) : go(Math.min(MAXL, st.n + 1)); } return; }
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (mv) { e.preventDefault(); st.cur = [Math.max(0, Math.min(st.L.w - 1, st.cur[0] + mv[0])), Math.max(0, Math.min(st.L.h - 1, st.cur[1] + mv[1]))]; return; }
    if (k === 'Enter' || k === ' ') { e.preventDefault(); turn(...st.cur); return; }
    if (k === 'r' || k === 'R') { start(st.n, st.daily); return; }
    if (k === 'h' || k === 'H') hint();
  });
  { const cv = $('miCanvas');
    const cell = e => { const b = cv.getBoundingClientRect(), x = Math.floor(((e.clientX - b.left) / b.width * W - ox()) / T), y = Math.floor(((e.clientY - b.top) / b.height * H - oy()) / T); return x >= 0 && y >= 0 && x < st.L.w && y < st.L.h ? [x, y] : null; };
    cv.onpointermove = e => { if (st?.mode === 'play') { const c = cell(e); if (c) st.cur = c; } };
    cv.onpointerdown = e => { e.preventDefault(); if (!st) return; if (st.mode === 'won') { if (st.dead > 40) st.daily ? start(Math.min(save.level, MAXL)) : go(Math.min(MAXL, st.n + 1)); return; } const c = cell(e); if (c) { st.cur = c; turn(...c); } };
  }
  $('miNew').onclick = () => { start(st.n, st.daily); $('miNew').blur(); };
  $('miDaily').onclick = () => { start(st.n, true); $('miDaily').blur(); };
  $('miPrev').onclick = () => go(st.n - 1); $('miNext').onclick = () => go(st.n + 1);
  $('miFs').onclick = () => { $('miFs').blur(); try { if (document.fullscreenElement) document.exitFullscreen(); else $('miCanvas').parentElement.requestFullscreen?.().catch(() => {}); } catch {} };
  padKeys({ 3: 'h', 4: 'r' });
  {  // vérification : les 80 niveaux existent, ne sont pas gagnés d'avance, leur solution allume tout, et les indices finissent le niveau
    const bad = [], keepS = JSON.stringify(save); mute = true;
    for (let n = 1; n <= MAXL; n++) { const L = makeLevel(n); if (!L) { bad.push(n + ' : pas de niveau'); continue; } if (trace(L).won) bad.push(n + ' : déjà gagné'); if (!trace(L, L.sol).won) bad.push(n + ' : solution fausse'); }
    start(8); for (let i = 0; i < 40 && st.mode === 'play'; i++) hint();
    if (st.mode !== 'won') bad.push('les indices ne finissent pas le niveau');
    start(50); for (let i = 0; i < 60 && st.mode === 'play'; i++) hint();
    if (st.mode !== 'won') bad.push('les indices ne finissent pas le niveau 50');
    const all = Array.from({ length: MAXL - ADV + 1 }, (_, i) => makeLevel(ADV + i)?.sol.flat().join('') || '');
    if (!all.every(s => /[RGB]/.test(s) && /[rgb]/.test(s))) bad.push('filtres ou cristaux de couleur manquants');
    if (all.filter(s => s.includes('p')).length < 15) bad.push('pas assez de prismes');
    { const L = { w: 5, h: 3, ex: 0, ey: 1, ed: [1, 0], crystals: 2, g: [['', '', 'r', '', ''], ['', 'R', 'p', '', ''], ['', '', 'b', '', '']] };  // le prisme sépare, le filtre teint, le cristal bleu reste éteint au rouge
      const t = trace(L); if (t.segs.length !== 4 || !t.lit.has('2,0') || t.lit.has('2,2')) bad.push('prisme ou couleurs'); }
    for (let k = 0; k < 60; k++) { const L = makeLevel2(50, 20261100 + k * 37); if (!L || trace(L).won || !trace(L, L.sol).won) { bad.push('niveau du jour ' + k); break; } }
    console.assert(!bad.length, 'miroirs', bad); view.dataset.selfcheck = bad.join(' | ') || 'ok';
    Object.keys(save).forEach(k => delete save[k]); Object.assign(save, JSON.parse(keepS)); mute = false;
  }
  $('miCanvas').__mi = { st: () => st, start, hint, make: makeLevel };
  start(Math.min(save.level, MAXL));
  const STEP = 1000 / 60; let acc = 0, last = performance.now(), raf = 0;
  const frame = t => { if (!on()) { raf = 0; return; } raf = requestAnimationFrame(frame); acc += Math.min(200, t - last); last = t; while (acc >= STEP) { st.tick++; if (st.mode === 'won') st.dead++; acc -= STEP; } draw(); };
  // les trophées, tirés des statistiques et des records gardés (aussi à l'ouverture : ce qui a été fait avant compte)
  function miTrophies() {
    const v = Object.values(save.stars), done = v.filter(Boolean).length, st = v.reduce((a, b) => a + b, 0), sig = [done, st, save.daily.best].join(); if (sig === miTrophies.sig) return; miTrophies.sig = sig;
    trophyRecord('etoiles', st || null);
    if (done >= 1) trophy('premier'); if (done >= 20) trophy('n20'); if (save.stars[PRISM]) trophy('prisme'); if (done >= MAXL) trophy('n80'); if (st >= MAXL * 3) trophy('etoiles');
    if (save.daily.best >= 7) trophy('jour7');
  }
  ctx.onOpen(() => { g ??= $('miCanvas').getContext('2d'); info(); last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); });
}
