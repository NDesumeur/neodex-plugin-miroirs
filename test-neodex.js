// lancé par le test « local » de NeoDex : vérification interne, puis finit le niveau avec les indices (H) et regarde le bilan ;
// les niveaux avancés (filtres, cristaux de couleur, prisme), le plein écran et la place prise (avec NEO_SHOTS : garde des images du jeu)
module.exports = async ({ pj, sleep }) => {
  const key = k => pj(`document.dispatchEvent(new KeyboardEvent('keydown', {key: '${k}', bubbles: true})), 0`);
  const label = () => pj(`document.getElementById('miCanvas').getAttribute('aria-label')`);
  const C = code => pj(`(() => { const T = document.getElementById('miCanvas').__mi, st = T.st(); ${code} })()`);
  const shot = async n => { if (!process.env.NEO_SHOTS) return; const d = await pj(`document.getElementById('miCanvas').toDataURL()`); require('fs').writeFileSync(require('path').join(process.env.NEO_SHOTS, 'miroirs-' + n + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  await pj(`window.__e = []; addEventListener('error', e => __e.push(e.message)); 0`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  const keepN = await C('return st.n;');
  await sleep(300); await key('ArrowRight'); await key('Enter');
  for (let i = 0; i < 20; i++) { await key('h'); await sleep(60); }
  await sleep(500);
  const l = await label();
  if (!/niveau fini/.test(l)) throw new Error('le niveau devait être fini : « ' + l + ' »');
  // les niveaux avancés : un filtre et un cristal de couleur au 42, un prisme au 47 ; on les règle à moitié avec les indices pour voir le laser coloré
  for (const n of [42, 47, 71]) {
    await C(`T.start(${n}); return 0;`); await sleep(200);
    const has = await C(`const s = st.L.g.flat().join(''); return [/[RGB]/.test(s), /[rgb]/.test(s), s.includes('p')].join(',');`);
    if (!has.startsWith('true,true') || (n !== 42 && !has.endsWith('true'))) throw new Error('niveau ' + n + ' : filtre, cristal de couleur ou prisme manquant (' + has + ')');
    await C(`for (let i = 0; i < 3; i++) T.hint(); return 0;`); await sleep(400); await shot(n + '-moitie');
    await C(`for (let i = 0; i < 60 && st.mode === 'play'; i++) T.hint(); return 0;`); await sleep(300);
    if (await C('return st.mode;') !== 'won') throw new Error('niveau ' + n + ' : les indices devaient le finir');
    await shot(n + '-fini');
  }
  const cols = await C('const s = Array.from({length: 40}, (_, i) => T.make(41 + i).sol.flat().join("")).join(""); return [..."RGBrgb"].map(k => s.split(k).length - 1).join(",");');
  if (cols.split(',').some(v => +v === 0)) throw new Error('les trois couleurs devaient servir (filtres R G B, cristaux r g b) : ' + cols);
  // le niveau du jour : le même à chaque départ, avec prisme ; les indices le finissent
  const dl = []; for (let k = 0; k < 2; k++) { await pj(`document.getElementById('miDaily').click(), 0`); await sleep(200); dl.push(await C('return st.daily + ":" + JSON.stringify(st.L.sol);')); }
  if (dl[0] !== dl[1] || !dl[0].startsWith('true') || !dl[0].includes('"p"')) throw new Error('niveau du jour');
  await sleep(200); await shot('niveau-du-jour');
  await C('for (let i = 0; i < 60 && st.mode === "play"; i++) T.hint(); return 0;'); if (await C('return st.mode;') !== 'won') throw new Error('le niveau du jour devait se finir');
  await C(`T.start(${keepN}); return 0;`);
  const errs = await pj(`window.__e.join(' | ')`); if (errs) throw new Error('erreur : ' + errs);
  // plein écran, et la zone de jeu qui tient dans la fenêtre
  await pj(`document.getElementById('miFs').click(), 0`); await sleep(700);
  const fs = await pj(`(() => { const c = document.getElementById('miCanvas'), r = c.getBoundingClientRect(); return document.fullscreenElement === c.parentElement && (Math.abs(r.height - innerHeight) < 3 || Math.abs(r.width - innerWidth) < 3); })()`);
  await pj(`document.fullscreenElement && document.exitFullscreen(), 0`); await sleep(300);
  if (!fs) throw new Error('le plein écran ne remplit pas l\'écran');
  const L = await pj(`(() => { const r = document.getElementById('miCanvas').getBoundingClientRect(); let s = 0; for (let e = document.getElementById('miCanvas').parentElement; e; e = e.parentElement) s += e.scrollTop; return { bottom: Math.round(r.bottom + s), h: Math.round(r.height), wh: innerHeight, ww: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  if (process.env.NEO_FIT_LOG) console.log('FIT', JSON.stringify(L));
  if (L.bottom > L.wh + 1 || L.sw > L.ww + 1 || L.h < 250) throw new Error('la zone de jeu dépasse la fenêtre ou reste petite : ' + JSON.stringify(L));
  return l + ' · niveaux 42, 47 et 71 (filtres, couleurs, prisme) finis · plein écran · ' + L.h + ' px dans ' + L.ww + '×' + L.wh;
};
