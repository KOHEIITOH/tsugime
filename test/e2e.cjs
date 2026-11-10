const { chromium } = require('playwright');
const OUT = '/workspace/tsugime-shots';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, acceptDownloads: true, locale: 'ja-JP', hasTouch: name === 'mobile', isMobile: name === 'mobile' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('dialog', (d) => d.accept());
    const reqs = []; page.on('request', (r) => { if (!r.url().startsWith('http://localhost:8765') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
    await page.goto('http://localhost:8765/');
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `${OUT}/${name}-01-intro.png`, fullPage: true });
    await page.click('#btnStart');
    await page.waitForTimeout(400);
    // next without title -> error
    await page.click('#btnNext');
    if (!(await page.isVisible('#eTitle'))) errors.push('title error not shown');
    await page.click('label:has(input[value=together])');
    await page.click('label:has(input[value=chawan])');
    await page.click('label:has(input[value=seiji])');
    await page.fill('#fTitle', '妹と言い合いになった夜');
    await page.fill('#fWhen', '2021年の12月');
    await page.fill('#fWhere', '実家の台所');
    await page.screenshot({ path: `${OUT}/${name}-02-step0.png`, fullPage: true });
    await page.click('#btnNext');
    await page.waitForTimeout(300);
    await page.fill('#s0', '年末に帰省したとき、進路のことで妹と大声で言い合いになった。');
    await page.waitForTimeout(900);
    await page.fill('#s1', '言いすぎたと思いながら、謝れなかった。');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}-03-crack-mid.png` });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${name}-03-shards.png`, fullPage: true });
    const cracks = await page.$$eval('#preview .crack', (e) => e.length);
    if (cracks !== 2) errors.push('expected 2 cracks, got ' + cracks);
    await page.click('#btnNext');
    await page.waitForTimeout(300);
    await page.fill('#g0', '小さいころ、ふたりで台所に立ってホットケーキを焦がしたこと。');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}-04-gold-mid.png` });
    await page.fill('#g1', 'あの日は言いすぎた。応援してるよ。');
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${OUT}/${name}-04-golds.png`, fullPage: true });
    const golds = await page.$$eval('#preview path.gold[data-i]', (e) => e.length);
    if (golds !== 2) errors.push('expected 2 golds, got ' + golds);
    // reload persistence
    await page.reload(); await page.waitForTimeout(800);
    await page.goto('http://localhost:8765/'); await page.waitForTimeout(600);
    if (!(await page.isVisible('#btnResume'))) errors.push('resume not visible after reload');
    await page.screenshot({ path: `${OUT}/${name}-04b-resume.png` });
    await page.click('#btnResume'); await page.waitForTimeout(400);
    const g0 = await page.inputValue('#g0'); if (!g0.includes('ホットケーキ')) errors.push('draft not restored');
    await page.click('#btnNext'); await page.waitForTimeout(300);
    await page.click('#btnNext'); // start kiln
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}-05-kiln.png`, fullPage: true });
    await page.click('#btnNext'); // 途中で出す
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}-06-mei.png`, fullPage: true });
    const mei = await page.inputValue('#fMei'); if (!mei) errors.push('mei empty');
    await page.click('#meiChips .chip >> nth=1'); await page.waitForTimeout(100);
    await page.click('#btnNext'); await page.waitForTimeout(4200);
    await page.screenshot({ path: `${OUT}/${name}-07-done.png`, fullPage: true });
    await page.click('#btnDoneShare'); await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-08-share.png` });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
    await dl.saveAs(`${OUT}/${name}-share.png`);
    await page.check('#oWords'); await page.waitForTimeout(800);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
    await dl2.saveAs(`${OUT}/${name}-share-words.png`);
    await page.click('#btnClose');
    await page.click('.shelf-link'); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}-09-shelf.png`, fullPage: true });
    await page.click('#shelfList a'); await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}-10-piece.png`, fullPage: true });
    // export
    await page.click('.shelf-link'); await page.waitForTimeout(300);
    await page.click('.backup summary');
    const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
    await dl3.saveAs(`${OUT}/${name}-backup.json`);
    // delete then import
    await page.click('#shelfList a'); await page.waitForTimeout(300);
    await page.click('#btnDelete'); await page.click('#btnDelete'); await page.waitForTimeout(500);
    if (!(await page.isVisible('#shelfEmpty'))) errors.push('empty state not shown after delete');
    await page.click('.backup summary').catch(()=>{});
    await page.setInputFiles('#fImport', `${OUT}/${name}-backup.json`); await page.waitForTimeout(500);
    const n = await page.$$eval('#shelfList li', (e) => e.length); if (n !== 1) errors.push('import failed ' + n);
    // horizontal overflow check
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (ov > 0) errors.push('h-overflow ' + ov);
    console.log(name, 'errors:', JSON.stringify(errors), 'external requests:', JSON.stringify(reqs));
    await ctx.close();
  }
  await browser.close();
})();
