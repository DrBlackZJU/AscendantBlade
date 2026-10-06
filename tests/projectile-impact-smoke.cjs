/* Run from the project root: Get-Content -Raw tests/projectile-impact-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=file=>fs.readFileSync(file,'utf8');
function loadRun(legacy=false){
 const cache=new Map();
 function load(name){const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);let source=read(file);
  if(legacy&&file==='ascensions.js')source=source.replace("g.emit('projectileFireBurst',{x:c.x,y:c.y,radius:q.radius||50,rank:3,source:q.type});","g.emit('heatBurst',{x:c.x,y:c.y,radius:q.radius||50,rank:3});");
  vm.runInThisContext('(function(module,exports,require){'+source+'\n})',{filename:file})(module,module.exports,load);return module.exports;}
 return load('game.js').Run;
}
function simulate(Run,rank,slag=false){
 const run=new Run({training:true,seed:717});
 if(slag){const card=run.dualRegistry.find(a=>a.parents?.includes('furnace')&&a.parents.includes('corpseBomb'));assert.ok(card);run.trainingPick(card.id);run.effects.v11.furnace.cd=0;}
 else run.upgrades.airSupport=rank;
 const events=[];for(let i=0;i<600;i++){run.step(1/120,{},{});events.push(...run.game.events);run.game.events.length=0;}
 return {seed:run.game.seed,player:run.game.p.hp,enemies:run.game.enemies.map(e=>({id:e.id,hp:e.hp,posture:e.posture,dead:e.dead})),events};
}
const Current=loadRun(),Legacy=loadRun(true);
for(const [rank,slag,expected] of [[1,false,50],[2,false,50],[3,false,105],[3,true,165]]){
 const current=simulate(Current,rank,slag),legacy=simulate(Legacy,rank,slag),hits=current.events.filter(e=>e.type==='projectileFireBurst');
 assert.ok(hits.length>0,'projectile actually arrives');assert.ok(hits.every(e=>e.radius===expected));assert.ok(hits.every(e=>e.source===(slag?'slag':'dragon')));
 current.events=current.events.map(e=>{if(e.type!=='projectileFireBurst')return e;const {source,...rest}=e;return {...rest,type:'heatBurst'};});
 assert.deepEqual(current,legacy,'visual routing must preserve damage, posture, RNG and other events');
 console.log((slag?'slag':'dragon LV'+rank)+': actual arrival, radius and gameplay parity passed');
}
const art={};vm.createContext(art);vm.runInContext(read('combat_fx.js'),art);
const calls=[],routing={noise:()=>0,TAU:Math.PI*2,AshProjectileImpactFX:{life:art.AshProjectileImpactFX.life,draw:(...args)=>calls.push(args)}};
vm.createContext(routing);const gameSource=read('game.js');vm.runInContext(gameSource.slice(gameSource.indexOf('  const IMPACTS='),gameSource.indexOf('  function lightningMarks'))+'\nthis.Effects=Effects;',routing);
const fx=new routing.Effects();fx.ingest({type:'projectileFireBurst',x:800,y:500,radius:165});fx.ingest({type:'heatBurst',x:800,y:500,radius:120});
assert.equal(fx.items[0].life,.95);assert.equal(fx.items[1].kind,'fire');fx.items.pop();fx.draw({canvas:{width:1200}},300);assert.equal(calls.length,1);assert.equal(calls[0][2],300);fx.update(.94);assert.equal(fx.items.length,1);fx.update(.02);assert.equal(fx.items.length,0);
let depth=0,draws=0;const gradient={addColorStop(){}};
const canvas=new Proxy({globalAlpha:1,save(){depth++;},restore(){assert.ok(depth>0);depth--;},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(target,key){if(key in target)return target[key];return (...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),key+' finite coordinates');};}});
for(const radius of [50,105,165,198])for(let i=-1;i<=65;i++){art.AshProjectileImpactFX.draw(canvas,{x:850,y:500,z:40,t:i/60,radius},300);assert.equal(depth,0,'balanced Canvas stack');draws++;}
console.log('FX routing, .95s cleanup, camera offset and '+draws+' deterministic drawing frames passed');

// Exercise the real furnace -> slag shot -> area hit path, including a boss.
{
 const run=new Current({training:true,seed:717}),g=run.game,f=run.effects;
 const card=run.dualRegistry.find(a=>a.parents?.includes('furnace')&&a.parents.includes('corpseBomb'));run.trainingPick(card.id);
 f.v11.furnace.cd=0;f.updateFurnaceV16(0);f.updateFurnaceV16(.81);
 const shot=f.v16.shots.find(q=>q.type==='slag');assert.ok(shot,'furnace creates slag projectile');assert.equal(shot.damage,128);assert.equal(shot.posture,88);
 const target=shot.target,neighbor=g.spawn('sword',target.x+60,target.y),boss=g.spawn('boss',target.x-60,target.y),outside=g.spawn('sword',target.x+166,target.y);
 g.enemies=[target,neighbor,boss,outside];for(const e of g.enemies){e.hp=e.maxHp=10000;e.posture=e.maxPosture=10000;e.spawnDelay=0;}
 f.v11.furnace.cd=999;const hits=[],secondary=f.secondary.bind(f);
 f.secondary=(e,damage,posture,tags,options)=>{if(tags.includes('composition')&&tags.includes('fire'))hits.push({id:e.id,damage,posture});return secondary(e,damage,posture,tags,options);};
 f.update(shot.life+.01);
 assert.deepEqual(hits.map(h=>h.id).sort((a,b)=>a-b),[target.id,neighbor.id,boss.id].sort((a,b)=>a-b),'each enemy inside the radius is hit once; outside is excluded');
 for(const h of hits){assert.equal(h.damage,128);assert.equal(h.posture,88);}
 for(const e of [target,neighbor,boss]){assert.equal(e.effects.burn.dps,12);assert.equal(e.effects.burn.remaining,6);}
 assert.equal(outside.effects?.burn,undefined);
 console.log('slag: full 128/88 once on primary, nearby enemy and boss; all ignite; radius boundary passed');
}
