/* Run from project root: Get-Content -Raw tests/overkill-bladeshock-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=file=>fs.readFileSync(file,'utf8');
function loadRun(legacy=false){const cache=new Map();function load(name){const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);let s=read(file).replace(/\r\n/g,'\n');
 if(legacy&&file==='ascensions.js')s=s
  .replace("const source=arrow?this.game.p:enemy;\n      this.game.emit('posturePulse',{x:source.x,y:source.y,z:source.z||0,scale:source.scale||1,radius,amount,rank:r});","this.game.emit('posturePulse',{x:arrow?this.game.p.x:enemy.x,y:arrow?this.game.p.y:enemy.y,radius,amount});")
  .replace("g.emit('overkill',{x:enemy.x,y:enemy.y,z:enemy.z||0,scale:enemy.scale||1,radius:210,damage:out,rank:ov});","g.emit('overkill',{x:enemy.x,y:enemy.y,damage:out,rank:ov});")
  .replace('z:(enemy.z||0)+45*enemy.scale,toX:target.x,toY:target.y,toZ:(target.z||0)+50*target.scale','z:45*enemy.scale,toX:target.x,toY:target.y,toZ:50*target.scale');
 vm.runInThisContext('(function(module,exports,require){'+s+'\n})',{filename:file})(m,m.exports,load);return m.exports;}return load('game.js').Run;}
const Current=loadRun(),Legacy=loadRun(true);
function setup(Run){const run=new Run({training:true,seed:717}),g=run.game,f=run.effects;g.enemies=[];const enemy=g.spawn('sword',800,530),near=g.spawn('sword',890,530),outside=g.spawn('sword',1030,530);for(const e of g.enemies){e.hp=e.maxHp=10000;e.posture=e.maxPosture=10000;e.spawnDelay=0;e.state='idle';e.z=65;}g.p.x=750;g.p.y=530;g.p.z=35;g.events.length=0;return {run,g,f,enemy,near,outside};}
function normalize(events){return events.map(e=>{e={...e};if(e.type==='posturePulse'){delete e.z;delete e.scale;delete e.rank;}if(e.type==='overkill'){delete e.z;delete e.scale;delete e.radius;}if(e.type==='overkillLaser'){delete e.z;delete e.toZ;}return e;});}
function result(s){return {seed:s.g.seed,parries:s.g.stats.parries,player:s.g.p.hp,enemies:s.g.enemies.map(e=>({id:e.id,hp:e.hp,posture:e.posture,dead:e.dead,state:e.state})),events:normalize(s.g.events)};}
for(const rank of [1,2,3])for(const arrow of [false,true]){
 const samples=[Current,Legacy].map(Run=>{const s=setup(Run);s.run.upgrades.bladeShock=rank;const projectile=arrow?{x:s.g.p.x,y:s.g.p.y,z:40,damage:10}:null;s.g.resolvePerfectBlock(s.enemy,projectile);return s;});
 const [now,old]=samples,ev=now.g.events.find(e=>e.type==='posturePulse');assert.ok(ev);assert.equal(ev.radius,[0,115,165,225][rank]);assert.equal(ev.z,arrow?35:65);assert.equal(ev.x,arrow?750:800);assert.deepEqual(result(now),result(old),'perfect block gameplay parity');
 const inside=now.f.near(arrow?now.g.p:now.enemy,ev.radius,new Set([now.enemy.id])).some(e=>e.id===now.near.id);assert.equal(now.near.posture,10000-(inside?[0,16,28,45][rank]:0),'one rank-appropriate splash');assert.equal(now.outside.posture,10000,'outside splash remains excluded');
 console.log('bladeShock LV'+rank+(arrow?' projectile':' melee')+': real perfect-block trigger, position and gameplay parity passed');
}
for(const rank of [1,2,3]){
 const samples=[Current,Legacy].map(Run=>{const s=setup(Run);s.run.upgrades.overkill=rank;s.enemy.hp=20;s.enemy.maxHp=400;s.g.damageEnemy(s.enemy,120,0,'normal');return s;});
 const [now,old]=samples,ev=now.g.events.find(e=>e.type==='overkill');assert.ok(ev,'direct kill triggers overkill');assert.equal(ev.radius,210);assert.equal(ev.z,65);assert.equal(ev.scale,now.enemy.scale);assert.equal(ev.damage,(now.enemy.lastDamageRecord.amount-now.enemy.lastDamageRecord.preHp)*[0,.35,.55,.75][rank]);assert.equal(now.near.hp,10000-ev.damage*(rank===3?2:1),'splash once plus LV3 laser');assert.equal(now.outside.hp,10000);assert.deepEqual(result(now),result(old),'overkill gameplay parity');
 if(rank===3){const beam=now.g.events.find(e=>e.type==='overkillLaser');assert.ok(beam);assert.equal(beam.z,65+45*now.enemy.scale);assert.equal(beam.toZ,65+50*now.near.scale);}else assert(!now.g.events.some(e=>e.type==='overkillLaser'));
 console.log('overkill LV'+rank+': real direct kill, radius, damage parity and laser passed');
}
for(const options of [{secondary:true},{secondary:true,periodic:true}]){const s=setup(Current);s.run.upgrades.overkill=3;s.enemy.hp=20;s.g.damageEnemy(s.enemy,120,0,['burn'],options);assert(!s.g.events.some(e=>e.type==='overkill'),'secondary/periodic kills cannot create overkill');}
for(const rank of [1,2,3])for(const excess of [19,20,21]){const s=setup(Current);s.run.upgrades.overkill=rank;s.enemy.hp=20;s.enemy.maxHp=100;s.g.damageEnemy(s.enemy,20+excess,0,'normal',{ignoreDamageBonuses:true});const actual=s.enemy.lastDamageRecord.amount-s.enemy.lastDamageRecord.preHp;assert.equal(s.g.events.some(e=>e.type==='overkill'),actual>=20,'20% threshold for LV'+rank);}
for(const excess of [29,30,31]){const s=setup(Current);s.run.upgrades.overkill=3;s.run.upgrades.bowling=3;s.run.hasDual=(a,b)=>[a,b].includes("overkill")&&[a,b].includes("bowling");s.g.random=()=>1;s.enemy.hp=20;s.enemy.maxHp=100;s.g.damageEnemy(s.enemy,20+excess,0,'normal',{ignoreDamageBonuses:true});const actual=s.enemy.lastDamageRecord.amount-s.enemy.lastDamageRecord.preHp;assert.equal(!!s.enemy._bowlingProjectile,actual>=30,'30% corpse threshold');if(actual>=30)assert.equal(s.enemy._bowlingProjectile.overkill,actual*.35,'35% extra collision damage');}
const art={};vm.createContext(art);vm.runInContext(read('combat_fx.js'),art);
const calls=[],routing={noise:()=>0,TAU:Math.PI*2,AshOverkillBladeShockFX:{life:art.AshOverkillBladeShockFX.life,overkill:(...a)=>calls.push(['overkill',...a]),bladeShock:(...a)=>calls.push(['bladeShock',...a])}};vm.createContext(routing);
const source=read('game.js');vm.runInContext(source.slice(source.indexOf('  const IMPACTS='),source.indexOf('  function lightningMarks'))+'\nthis.Effects=Effects;',routing);
const fx=new routing.Effects();fx.ingest({type:'overkill',x:800,y:530,z:65});fx.ingest({type:'posturePulse',x:850,y:530,z:65,radius:225});assert.equal(fx.items[0].kind,'overkillRupture');assert.equal(fx.items[0].radius,210);assert.equal(fx.items[0].life,.82);assert.equal(fx.items[1].life,.62);fx.draw({canvas:{width:1440}},300);assert.equal(calls.length,2);assert(calls.every(a=>a[3]===300));fx.update(.63);assert.equal(fx.items.length,1);fx.update(.20);assert.equal(fx.items.length,0);
fx.ingest({type:'overkill',x:-1000,y:530},{left:0,right:1440});assert.equal(fx.items.length,0);for(let i=0;i<100;i++)fx.ingest({type:'overkill',x:i,y:530});assert.equal(fx.items.length,90);fx.clear();assert.equal(fx.items.length,0);
assert(!source.includes("if(e.type==='posturePulse')ring"));assert(!source.includes("if(e.type==='overkill'){ring"));assert(source.includes("corpseBomb:'blood'"));assert(source.includes("quake:'stone'"));
let depth=0,frames=0;const translations=[],gradient={addColorStop(){}};
const c=new Proxy({canvas:{width:1440,height:810},save(){depth++},restore(){assert(depth>0);depth--},translate(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));translations.push([x,y]);},createLinearGradient(){return gradient},createRadialGradient(){return gradient}},{get(o,k){if(k in o)return o[k];return (...a)=>{for(const v of a)if(typeof v==='number')assert(Number.isFinite(v),k+' finite');if(k==='ellipse')assert(a[2]>=0&&a[3]>=0);};}});
for(const radius of [115,165,210,225])for(const scale of [1,1.7])for(const z of [0,65])for(let i=-1;i<=100;i++)for(const kind of ['overkill','bladeShock']){art.AshOverkillBladeShockFX[kind](c,{x:850,y:530,z,scale,radius,t:i/120},300);assert.equal(depth,0);frames++;}
translations.length=0;art.AshOverkillBladeShockFX.overkill(c,{x:850,y:530,z:65,scale:1.7,t:.1},300);assert.deepEqual(translations[0],[550,530-65-48*1.7]);
console.log('routing, cleanup, view culling, 90-item cap, old-effect removal and '+frames+' bounded drawing frames passed');
