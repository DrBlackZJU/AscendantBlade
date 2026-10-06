/* Run from project root: Get-Content -Raw tests/quake-stomp-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cache=new Map();
function load(name){
 const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);
 vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);
 return m.exports;
}
const {Run}=load('game.js'),{TYPES,isBoss}=load('combat.js');
function setup(rank=2,dual=false){
 const run=new Run({training:true,seed:717});
 assert(run.trainingPick('quakeStomp'));run.upgrades.quakeStomp=rank;
 if(dual)assert(run.trainingPick('d151'));
 const g=run.game,f=run.effects;g.enemies=[];g.p.x=1000;g.p.y=530;f.quake.bigCd=8;
 function spawn(type='sword',x=1040){
  const e=g.spawn(type,x,530);e.hp=e.maxHp=10000;e.posture=e.maxPosture=10000;
  e.spawnDelay=0;e.state='idle';e.queue=['test'];e.knockX=e.knockY=0;return e;
 }
 return {run,g,f,spawn};
}
for(const rank of [1,2,3]){
 const {g,spawn}=setup(rank),e=spawn(),outside=spawn('sword',1400);
 g.trigger('onDownStrikeLand',{});
 assert.equal(e.state,'flinch');assert.equal(e.t,.14);assert.deepEqual(e.queue,[]);
 assert.equal(10000-e.hp,[0,45,60,75][rank]);assert.equal(10000-e.posture,[0,20,30,45][rank]);
 assert.equal(outside.hp,10000);assert.equal(outside.state,'idle');
 g.enemyStep(e,.15);assert.notEqual(e.state,'flinch','short flinch expires');
}
for(const rank of [2,3]){
 const {g,spawn}=setup(rank),center=spawn('sword',1000),e=spawn(),outside=spawn('sword',1400);
 g.p.attackSerial=7;g.trigger('onDownStrikeHit',{enemy:center,count:1});
 assert.equal(center.hp,10000,'base bounce excludes directly hit target');
 assert.equal(e.state,'flinch');assert.equal(e.t,.14);
 assert.equal(10000-e.hp,rank===2?20:30);assert.equal(10000-e.posture,rank===2?15:25);
 assert.equal(outside.hp,10000);
 const hp=e.hp;g.trigger('onDownStrikeHit',{enemy:center,count:1});assert.equal(e.hp,hp,'same bounce settles once');
}
const armorType=Object.keys(TYPES).find(type=>TYPES[type].armor&&!TYPES[type].boss);
assert(armorType);
for(const state of ['boss','armor','active','airborne','stunned','longFlinch']){
 const {g,spawn}=setup(),e=spawn(state==='boss'?'boss':state==='armor'?armorType:'sword');
 if(state==='boss')assert(isBoss(e));
 if(state==='armor'){e.state='windup';e.attack={flags:[]};}
 if(state==='active')e.state='active';
 if(state==='airborne'){e.state='knockdown';e.z=80;e.knockVz=120;}
 if(state==='stunned'){e.state='stunned';e.stun=2;}
 if(state==='longFlinch'){e.state='flinch';e.t=.55;}
 const previous=e.state;g.trigger('onDownStrikeLand',{});
 assert.equal(e.state,previous,state+' state preserved');
 if(state==='boss')assert.equal(e.knockX,0,'boss resists light-hit knockback');
 if(state==='longFlinch')assert.equal(e.t,.55,'short quake never shortens an existing flinch');
 if(state==='airborne'){assert.equal(e.z,80);assert.equal(e.knockVz,120);}
}
{
 const {g,spawn}=setup(),e=spawn();e.posture=10;g.trigger('onDownStrikeLand',{});
 assert.equal(e.state,'stunned','posture break takes priority over short flinch');
}
{
 const {g,f,spawn}=setup(),e=spawn();f.secondary(e,20,15,['meteor']);
 assert.equal(e.state,'idle','unrelated secondary damage does not gain flinch');
 f.secondary(e,20,15,['quakeStomp'],{flinch:false});assert.equal(e.state,'idle','explicit flinch override respected');
}
{
 const {g,f,spawn}=setup(3),e=spawn();f.quake.bigCd=0;g.trigger('onDownStrikeLand',{});
 assert.equal(e.state,'knockdown');assert(e.knockVz>0);assert.equal(10000-e.hp,120);assert.equal(10000-e.posture,80);
}
for(const count of [1,2,3,4,5]){
 const {g,spawn}=setup(3,true),center=spawn('sword',1000);g.p.attackSerial=count;
 g.trigger('onDownStrikeHit',{enemy:center,count});
 if(count<5){assert.equal(center.state,'flinch');assert.equal(center.t,.14);assert.equal(10000-center.hp,18);}
 else {assert.equal(center.state,'knockdown');assert(center.knockVz>0);assert.equal(10000-center.hp,150);}
}
console.log('Quake Stomp: landing LV1–3, bounce LV2–3, d151 small/big quakes, .14s cleanup, deduplication, damage/ranges and immunity/state priorities passed.');
