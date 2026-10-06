const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--disable-background-networking']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.hudText=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){if(window.hudText.length<20000){const t=this.getTransform();window.hudText.push({value:String(value),x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f});}return fill.call(this,value,x,y,...args);};});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.evaluate(()=>{
   AshGame.start(0,false,true);const r=AshGame.run,g=r.game;g.enemies=[];r.trainingPick('d320');r.effects.medusa.cooldown=6;r.effects.medusa.cooldownTotal=12;r.effects.medusa.goldCooldown=5;
   const specs=[['sword',120,500,false],['e51',320,510,true],['e72',550,570,false],['boss',860,540,false]];
   for(const [type,dx,y,gold] of specs){const e=g.spawn(type,g.p.x+dx,y);Object.assign(e,{face:-1,spawnDelay:0,maxHp:10000,hp:10000,maxPosture:10000,posture:10000});r.effects.petrify(e,{gold});}
   AshGame.pause();document.getElementById('pause-screen').classList.add('hidden');window.hudText=[];
  });
  await page.waitForTimeout(250);
  const rows=await page.evaluate(()=>AshGame.run.effects.cooldownRows());assert.deepEqual(rows.map(x=>x.id),['medusaEye']);
  const labels=await page.evaluate(()=>hudText);assert.ok(labels.some(t=>t.value==='美杜莎之眼'&&t.x<400),'Medusa cooldown belongs to the upper-left HUD');assert.ok(!labels.some(t=>t.value==='炼金术'),'Alchemy has no HUD row');
  await page.locator('#game').screenshot({path:'tests/preview-captures/medusa-stone-gold.png'});
  await page.evaluate(()=>{for(const e of AshGame.game.enemies){AshGame.game.kill(e,['slay','stoneShatter']);e.deathT=.5;}});
  await page.waitForTimeout(100);
  await page.locator('#game').screenshot({path:'tests/preview-captures/medusa-shatter.png'});
  await page.evaluate(()=>{
   const r=AshGame.run,g=r.game;g.enemies=[];const type=Object.keys(AshCombat.TYPES).find(t=>AshCombat.TYPES[t].final);const e=g.spawn(type,g.p.x+520,560);Object.assign(e,{spawnDelay:0,face:-1,hp:10000,maxHp:10000});r.effects.petrify(e);
  });
  await page.waitForTimeout(100);
  await page.locator('#game').screenshot({path:'tests/preview-captures/medusa-final-boss.png'});
  await page.locator('[data-language="en"]').click();await page.waitForTimeout(100);const english=await page.evaluate(()=>hudText);assert.ok(english.some(t=>t.value==="Medusa's Eye"));
  await page.evaluate(()=>AshGame.test.pick('d316'));await page.keyboard.press('Tab');
  assert.ok(!/[\u3400-\u9fff]/.test(await page.locator('#codex-screen').innerText()));
  assert.deepEqual(errors,[]);assert.ok(!(await page.evaluate(()=>window.AshLastError)));
  console.log('Browser: production stone/gold rendering, shatter frames, final boss, upper-left cooldown without alchemy, English codex and zero runtime errors passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
