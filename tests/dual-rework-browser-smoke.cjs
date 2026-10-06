const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--disable-background-networking']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const timer=window.setTimeout;window.setTimeout=(callback,delay,...args)=>{if(delay===14500)window.cgCompletion=callback;return timer(callback,delay,...args);};});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.evaluate(()=>{
   AshGame.start(0,false,true);const r=AshGame.run,g=r.game;g.enemies=[];r.trainingPick('d322');r.trainingPick('d158');r.trainingPick('d225');
   g.p.y=568;const e=g.spawn('sword',g.p.x+350,568);Object.assign(e,{spawnDelay:0,maxHp:10000,hp:10000,maxPosture:10000,posture:10000,cd:99});
   g.damageEnemy(e,0,0,['thrust']);r.effects.updatePeaShooter(.1);r.effects.feedPeaShooter(10);r.effects.updatePeaShooter(.61);r.effects.updatePeaShooter(.2);
   AshGame.pause();document.getElementById('pause-screen').classList.add('hidden');
  });
  await page.waitForTimeout(100);await page.locator('#game').screenshot({path:'tests/preview-captures/pea-shooter-integrated.png'});
  await page.keyboard.press('Tab');await page.waitForTimeout(50);assert.ok((await page.locator('#codex-screen').innerText()).includes('豌豆射手'));await page.locator('[data-codex="d322"]').hover();assert.ok(!(await page.locator('#codex-tooltip').innerText()).includes('20发'));
  await page.locator('[data-language="en"]').click();await page.locator('[data-codex="d322"]').hover();await page.waitForTimeout(50);const text=await page.locator('#codex-tooltip').innerText();assert.ok(text.includes('Peashooter'));assert.ok(text.includes('Chlorophyll'));assert.ok(!/[\u3400-\u9fff]/.test(text));assert.ok(!text.includes('20 peas'));
  // Campaign and boss rush both jump to the fully painted dawn frame immediately.
  for(const rush of [false,true]){
   await page.evaluate(rush=>{AshGame.start(0,false,false);AshGame.run.challenge=rush;const g=AshGame.game;g.status='victory';g.emit('victory');window.cgPaints=[];const paint=AshBossArt.cinematic;AshBossArt.cinematic=function(c,index,time){window.cgPaints.push({index,time});return paint.call(this,c,index,time);};},rush);
   await page.waitForFunction(()=>AshGame.mode==='victory');assert.ok(!(await page.locator('#end-screen').getAttribute('class')).includes('cg-finished'));
   await page.keyboard.press('Escape');
   const state=await page.evaluate(()=>({end:document.getElementById('end-screen').className,panel:getComputedStyle(document.getElementById('end-panel')).opacity,canvases:[...document.querySelectorAll('#victory-cg canvas')].map(c=>({opacity:getComputedStyle(c).opacity,animation:getComputedStyle(c).animationName})),dawn:window.cgPaints.filter(p=>p.index===3).at(-1).time}));
   assert.ok(state.end.includes('cg-finished'));assert.ok(state.end.includes('cg-skipped'));assert.equal(state.panel,'1');assert.ok(state.canvases.every(c=>c.opacity==='1'&&c.animation==='none'));assert.equal(state.dawn,5);
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>AshGame.mode),'victory');
   await page.locator('#end-screen').screenshot({path:`tests/preview-captures/cg-esc-${rush?'rush':'campaign'}.png`});
  }
  await page.evaluate(()=>{AshGame.start(0,false,false);AshGame.game.status='victory';AshGame.game.emit('victory');});await page.waitForFunction(()=>AshGame.mode==='victory');await page.evaluate(()=>window.cgCompletion());
  assert.ok((await page.locator('#end-screen').getAttribute('class')).includes('cg-finished'));assert.ok(!(await page.locator('#end-screen').getAttribute('class')).includes('cg-skipped'));
  await page.evaluate(()=>AshGame.returnTitle());assert.ok(!(await page.locator('#end-screen').getAttribute('class')).includes('cg-skipped'));
  assert.deepEqual(errors,[]);assert.ok(!(await page.evaluate(()=>window.AshLastError)));
  console.log('Browser: peashooter/peas/marks render, Chinese and English codex copy, campaign and rush ESC final dawn, instant panel reveal, repeat ESC, natural completion and reset passed without runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
