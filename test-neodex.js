// lancé par le test « local » de NeoDex : vérification interne, puis finit le niveau avec les indices (H) et regarde le bilan
module.exports = async ({ pj, sleep }) => {
  const key = k => pj(`document.dispatchEvent(new KeyboardEvent('keydown', {key: '${k}', bubbles: true})), 0`);
  const label = () => pj(`document.getElementById('miCanvas').getAttribute('aria-label')`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  await sleep(300); await key('ArrowRight'); await key('Enter');
  for (let i = 0; i < 20; i++) { await key('h'); await sleep(60); }
  await sleep(500);
  const l = await label();
  if (!/niveau fini/.test(l)) throw new Error('le niveau devait être fini : « ' + l + ' »');
  return l;
};
