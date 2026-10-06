/* Run: node --preserve-symlinks tests/language-smoke.cjs
 * Set PLAYWRIGHT_MODULE / BROWSER_EXECUTABLE when using a bundled runtime. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const cache=new Map();
function load(file){
  file=file.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);
  return m.exports;
}
const cards=load('ascensions.js'),combat=load('combat.js');
vm.runInThisContext(fs.readFileSync('i18n-en.js','utf8'));
for(const a of cards.ASCENSIONS){
  const en=AshEnglish.cards[a.id];assert.ok(en,'Missing base '+a.id);assert.equal(en.length,5);
  assert.ok(en.every(t=>typeof t==='string'&&t.length&&!/[\u3400-\u9fff]/.test(t)),a.id);
}
for(const a of cards.DUAL_ASCENSIONS){
  const en=AshEnglish.duals[a.id];assert.ok(en,'Missing dual '+a.id);assert.equal(en.length,2);
  assert.ok(en.every(t=>typeof t==='string'&&t.length&&!/[\u3400-\u9fff]/.test(t)),a.id);
}
for(const id of Object.keys(combat.TYPES))assert.ok(AshEnglish.enemies[id],'Missing enemy '+id);
console.log('English catalogue coverage: 142 base ascensions, 312 dual ascensions, all enemy names.');
async function main(){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--disable-background-networking']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Record the actual canvas strings as well as the DOM presentation.
    await page.addInitScript(()=>{
      window.drawnText=[];
      const fill=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(window.drawnText.length<5000)window.drawnText.push(String(text));return fill.call(this,text,...args);};
    });
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    const english=page.locator('[data-language="en"]'),chinese=page.locator('[data-language="zh"]');
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
    assert.equal(await chinese.getAttribute('aria-pressed'),'true');
    const original=await page.locator('#title-screen').innerText();
    await english.click();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.match(await page.locator('#start').innerText(),/Face the Horde/);
    assert.equal(await page.locator('#sound').getAttribute('aria-label'),'Toggle sound effects (N)');
    assert.equal(await page.title(),'Ascendant Blade');
    await page.screenshot({path:'tests/language-title.png',fullPage:true});
    await page.locator('#sound').click();
    assert.match(await page.locator('#sound').innerText(),/SFX.*Off/);
    await page.locator('#manual-open').click();
    assert.match(await page.locator('#manual-content').innerText(),/Basic Controls/);
    await chinese.click();
    assert.match(await page.locator('#manual-content').innerText(),/基础操作/);
    await page.locator('#manual-close').click();
    assert.equal(await page.locator('#title-screen').innerText(),original);
    assert.match(await page.locator('#sound').innerText(),/音效.*关/);
    await english.click();
    await page.locator('#challenge').click();
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(()=>AshGame.mode),'upgrade');
    const offers=await page.evaluate(()=>AshGame.run.offers.map(a=>a.id));
    assert.equal(offers.length,3);
    assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#upgrade-screen').innerText()));
    await page.screenshot({path:'tests/language-upgrades.png',fullPage:true});
    await chinese.click();
    assert.deepEqual(await page.evaluate(()=>AshGame.run.offers.map(a=>a.id)),offers);
    assert.match(await page.locator('#upgrade-summary').innerText(),/剩余 3 次擢升机会/);
    await english.click();
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await page.keyboard.press('Tab');
    assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#codex-screen').innerText()));
    await page.locator('[data-codex]').first().hover();
    assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#codex-tooltip').innerText()));
    await chinese.click();
    assert.match(await page.locator('#codex-tooltip').innerText(),/[\u3400-\u9fff]/);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>AshGame.returnTitle());
    await page.keyboard.press('F8');
    await page.keyboard.press('e');
    await english.click();
    await page.locator('#training-search').fill('Void Hunger');
    assert.equal(await page.locator('[data-training]').count(),1);
    assert.equal(await page.locator('[data-training] h3').innerText(),'Void Hunger');
    await page.locator('#training-search').fill('');
    assert.equal(await page.locator('[data-training]').count(),454);
    assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#upgrade-screen').innerText()));
    await page.locator('[data-training="d312"]').click();
    assert.equal(await page.evaluate(()=>AshGame.mode),'playing');
    await page.evaluate(()=>{window.drawnText=[];});
    await page.waitForFunction(()=>window.drawnText.includes('Spirit'));
    assert.ok(!(await page.evaluate(()=>window.drawnText)).some(t=>/[\u3400-\u9fff]/.test(t)));
    await page.screenshot({path:'tests/language-hud.png',fullPage:true});
    await page.locator('#pause').click();
    const before=await page.evaluate(()=>({time:AshGame.run.time,hp:AshGame.game.p.hp,duals:{...AshGame.run.duals},music:AshGame.music}));
    await chinese.click();await english.click();
    const after=await page.evaluate(()=>({time:AshGame.run.time,hp:AshGame.game.p.hp,duals:{...AshGame.run.duals},music:AshGame.music}));
    assert.deepEqual(after,before,'Switching changed paused run state');
    assert.equal(await page.evaluate(()=>AshGame.mode),'paused');
    await page.screenshot({path:'tests/language-english.png',fullPage:true});
    await page.locator('#resume').click();
    await page.evaluate(()=>AshGame.test.suicide());
    await page.waitForFunction(()=>AshGame.mode==='dead');
    assert.match(await page.locator('#end-screen').innerText(),/Defeat/);
    assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#end-screen').innerText()));
    await page.locator('#back-title').click();
    await page.setViewportSize({width:390,height:844});
    assert.ok(await english.isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
    await page.screenshot({path:'tests/language-mobile.png',fullPage:true});
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN','Fresh load must default to Chinese');
    assert.deepEqual(errors,[]);
    console.log('Language smoke passed: defaults, live DOM/canvas updates, all training cards, search, manual/codex, rewards, state preservation, defeat, mobile layout.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
