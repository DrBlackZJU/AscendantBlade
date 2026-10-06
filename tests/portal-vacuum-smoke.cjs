/* Run from the project root: Get-Content -Raw tests/portal-vacuum-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cache=new Map();
function load(name){
  const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(module,module.exports,load);
  return module.exports;
}
const {Game,TYPES,MOVES}=load('combat.js'),boss=load('boss.js');
const type=Object.keys(TYPES).find(k=>TYPES[k].bossKind==='bottomless');
function setup(gap=80){
  const g=new Game(717);g.enemies=[];
  const e=g.spawn(type,900,550);e.spawnDelay=0;e.face=1;
  g.p.x=900+gap;g.p.y=550;g.p.z=0;g.p.invuln=0;g.p.state='idle';
  const a=MOVES[TYPES[type].moveKeys.find(k=>MOVES[k].action==='vacuum')];
  g.beginEnemyMove(e,a.key);g.resolveEnemySpell(e,a);
  return {g,e,a};
}
{
  const {g,e,a}=setup(),hp=g.p.hp;
  g.enemyStep(e,.016);
  assert.equal(g.p.hp,hp-32);assert.ok(g.p.x>1070,'Contact pushes away from the portal');
  assert.equal(e.bossState.vacuumHit,true);assert.equal(e.attack.action,a.action,'No extra attack action');
  g.p.x=980;g.p.invuln=0;g.enemyStep(e,.016);
  assert.equal(g.p.hp,hp-32,'Only one contact per cast');
  g.resolveEnemySpell(e,a);assert.equal(e.bossState.vacuumHit,false,'Fresh cast resets contact');
}
for(const perfect of [false,true]){
  const {g,e}=setup(),hp=g.p.hp;
  g.p.state='guard';g.p.t=g.rules.guardStartup+(perfect?.01:g.rules.perfectWindow+.01);
  g.enemyStep(e,.016);
  assert.ok(g.p.x>1040,'Guard also releases the player outward');
  assert.equal(e.bossState.vacuumHit,true);
  if(perfect)assert.equal(g.p.hp,hp,'Perfect guard prevents damage');
  else assert.ok(g.p.grayHp>0,'Normal guard uses recoverable damage');
}
for(const state of ['dash','invulnerable','airborne']){
  const {g,e}=setup(),hp=g.p.hp;
  if(state==='dash')g.p.state='dash';
  if(state==='invulnerable')g.p.invuln=1;
  if(state==='airborne')g.p.z=150;
  g.enemyStep(e,.016);assert.equal(g.p.hp,hp);assert.equal(e.bossState.vacuumHit,false);
}
{
  const {g,e}=setup(300),ellipses=[],colors=[];
  const c=new Proxy({globalAlpha:1,canvas:{width:1200,height:800},ellipse(...args){ellipses.push(args);},stroke(){colors.push(this.strokeStyle);},createRadialGradient(){return {addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});
  boss.models.effects(c,g,0);
  const center=boss.art.abyss.anchor(e,'bottomless',g.time,'portal');
  assert.equal(colors.length,8);assert.ok(center[1]<e.y-100);
  assert.ok(ellipses.slice(0,8).every(v=>Math.abs(v[0]-center[0])<.001&&Math.abs(v[1]-center[1])<.001&&v[3]>v[2]),'Upright concentric waves use the portal mouth');
  assert.ok(colors.every(v=>v==='#d99aff'));
  g.p.x=e.x+120;ellipses.length=0;colors.length=0;
  boss.models.effects(c,g,0);assert.ok(colors.every(v=>v==='#ff485b'),'Near contact, portal waves turn red');
  const before=ellipses[0][2];e.bossState.clock+=.03;ellipses.length=0;
  boss.models.effects(c,g,0);assert.ok(ellipses[0][2]<before,'Waves shrink inward');
}
console.log('Portal vacuum: contact, knockback, one hit per cast, block/parry, immunity, portal anchor, upright inward waves and red warning passed.');
