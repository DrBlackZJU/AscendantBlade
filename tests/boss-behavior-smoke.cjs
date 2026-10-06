/* Run from project root: Get-Content -Raw tests/boss-behavior-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cache=new Map();
function load(name){const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Game,TYPES,MOVES}=load('combat.js'),Boss=load('boss.js');
function setup(kind,x=900,y=550){const g=new Game(717);g.enemies=[];g.loopWorld=true;const type=Object.keys(TYPES).find(id=>TYPES[id].bossKind===kind),e=g.spawn(type,x,y);e.spawnDelay=0;e.cd=1000;e.face=1;e.alerted=true;g.p.x=x+800;g.p.y=y;g.p.z=0;g.p.invuln=0;g.p.state='idle';return {g,e};}
function tick(g,e,dt=.01){g.time+=dt;g.enemyStep(e,dt);}
function move(e,action='melee'){return TYPES[e.type].moveKeys.find(key=>MOVES[key].action===action);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
for(const [kind,speed] of [['moth',150],['hell_hound',118],['twin_blade',140]]){const {e}=setup(kind);assert.equal(TYPES[e.type].speed,speed);}
for(const [kind,tempo] of [['champion',1.1],['twin_blade',1.12]]){
 const {g,e}=setup(kind),key=move(e);g.beginEnemyMove(e,key);
 near(e.attack.wind,MOVES[key].wind/tempo);near(e.attack.active,MOVES[key].active/tempo);near(e.attack.recovery,MOVES[key].recovery/tempo);
 assert.equal(e.attack.damage,MOVES[key].damage,'Tempo does not increase damage');
}
{
 const {g,e}=setup('mutant_blade'),key=move(e);const durations=[];
 for(const [ratio,arms,tempo] of [[1,2,1],[.75,3,1.06],[.5,4,1.12],[.4,4,1.2]]){
  e.hp=e.maxHp*ratio;e.state='idle';e.attack=null;tick(g,e);g.beginEnemyMove(e,key);
  assert.equal(e.bossState.arms,arms);near(e.bossMoveSpeed,tempo);near(e.bossActionSpeed,tempo);durations.push(e.attack.wind+e.attack.active+e.attack.recovery);
 }
 assert.ok(durations.every((v,i)=>!i||v<durations[i-1]));
}
{
 const {g,e}=setup('hell_hound');g.p.x=100000;
 for(let i=0;i<400;i++)tick(g,e);near(e.bossMoveSpeed,1.3);assert.equal(e.bossState.runTime,3);
 e.state='recovery';e.attack=null;e.t=1;tick(g,e);near(e.bossMoveSpeed,1);
 e.state='idle';for(let i=0;i<100;i++)tick(g,e);assert.ok(e.bossMoveSpeed>1.09);
 e.timeSealT=1;tick(g,e);near(e.bossMoveSpeed,1);e.timeSealT=0;
 g.p.x=e.x-80;e.face=1;g.damageEnemy(e,1,0,'normal',{flinch:false});
 assert.equal(e.face,-1);assert.ok(e.bossState.yellowRage>e.bossState.clock);assert.ok(g.drainEvents().some(v=>v.type==='houndAnger'));near(e.rageSpeed,1.5);
 g.damageEnemy(e,1,0,'normal',{periodic:true,flinch:false});assert.ok(!g.drainEvents().some(v=>v.type==='houndAnger'));
}
{
 const {g,e}=setup('moth');g.p.x=100000;const ys=[];
 for(let i=0;i<450;i++){tick(g,e);ys.push(e.y);}
 assert.ok(Math.max(...ys)-Math.min(...ys)>10,'Moth drifts along the arena Y axis');
 assert.ok(ys.every(y=>y>=415&&y<=680));const y=e.y;e.timeSealT=1;tick(g,e);assert.equal(e.y,y);
}
// Each roster leap can connect at descent start or later after initially missing.
for(const [type,base] of Object.entries(TYPES).filter(([,b])=>b.bossKind)){
 for(const key of base.moveKeys.filter(key=>MOVES[key].action==='leap')){
  for(const late of [false,true]){
   const g=new Game(717);g.enemies=[];g.loopWorld=true;const e=g.spawn(type,900,550);e.spawnDelay=0;e.face=1;e.cd=1000;
   g.p.x=1000;g.p.y=late?670:550;g.p.z=0;g.p.invuln=0;g.p.state='idle';
   g.beginEnemyMove(e,key);assert.equal(e.attack.contactFraction,.5);const a=e.attack;e.state='active';e.t=a.active*.5-.02;
   const hp=g.p.hp;tick(g,e,.01);assert.equal(g.p.hp,hp,'First half is safe');
   tick(g,e,.02);
   if(late){assert.equal(g.p.hp,hp);assert.equal(e.damageDone,false);g.p.y=550;tick(g,e,.01);}
   assert.ok(g.p.hp<hp,`${base.bossKind}/${a.name} descent hits`);assert.equal(e.damageDone,true);
   const remaining=g.p.hp;g.p.invuln=0;g.p.state='idle';tick(g,e,.01);assert.equal(g.p.hp,remaining,'No duplicate damage within a leap');
  }
 }
}
for(const guard of [false,true]){
 const {g,e}=setup('hell_hound'),key=move(e,'leap');g.p.x=e.x+80;g.beginEnemyMove(e,key);e.state='active';e.t=e.attack.active*.5-.01;
 g.p.state='guard';g.p.t=g.rules.guardStartup+(guard?.01:g.rules.perfectWindow+.01);const hp=g.p.hp;
  tick(g,e,.015);assert.equal(e.damageDone,true);if(guard)assert.equal(g.p.hp,hp);else assert.ok(g.p.grayHp>0&&g.p.hp<hp,'Leap still uses recoverable guard damage');
}
{
 const {g,e}=setup('claw_beast'),key=TYPES[e.type].moveKeys.find(key=>MOVES[key].jumpHeight===125);g.beginEnemyMove(e,key);g.p.x=3000;g.drainEvents();
 let cueAt=null;while(e.state==='windup'||e.state==='active'){const stage=e.state,t=e.t;tick(g,e,.005);if(g.drainEvents().some(v=>v.type==='warning')){cueAt=stage==='windup'?e.t:e.attack.wind+e.t;break;}}
 const contactAt=e.attack.wind+e.attack.active*.5;assert.ok(cueAt!==null);assert.ok(Math.abs(contactAt-cueAt-.17)<.015,'Red cue precedes descent by 170 ms');
 e.state='active';e.t=e.attack.active*.75;assert.ok(Boss.art.aberrant.leapHeight(e)>70,'Second half stays visibly airborne until landing');
}
{
 const {g,e}=setup('twin_blade');g.p.x=e.x+150;const key=move(e);g.beginEnemyMove(e,key);e.t=e.attack.wind*.36;g.random=()=>.1;
 tick(g,e);assert.equal(e.moveKey,key,'Never replace an ongoing windup');
 const chosen=new Set();for(let i=0;i<30;i++){e.state='idle';const next=g.chooseSequence(e)[0];assert.notEqual(next,e.moveKey,'Next attack differs');chosen.add(next);g.beginEnemyMove(e,next);}
 assert.ok(chosen.size>=2,'Multiple attacks rotate');
}
// Posed torso volumes stay valid for every boss; wing-only projectiles miss.
for(const [type,base] of Object.entries(TYPES).filter(([,b])=>b.boss)){
 const g=new Game(717),e=g.spawn(type,900,550);e.spawnDelay=0;
 for(const state of ['idle','windup','active','recovery','stunned']){
  e.state=state;e.attack={...(MOVES[base.moveKeys?.[0]]||MOVES.weakCut)};e.t=.1;
  const box=g.enemyHurtbox(e);assert.ok(Object.values(box).every(Number.isFinite),`${type}/${state}`);assert.ok(box.rx>0&&box.ry>0&&box.top>box.bottom);
 }
}
{
 const {g,e}=setup('moth');const box=g.enemyHurtbox(e);assert.ok(box.rx<36,'Moth torso excludes its wings');
 function shot(x,z){g.projectiles=[{x,y:e.y,z,vx:0,vy:0,vz:0,life:1,reflected:true,damage:1,flags:[]}];g.projectileStep(.01);}
 const hp=e.hp;shot(e.x+95,100);assert.equal(e.hp,hp,'Wing-only contact misses');shot(box.x,(box.top+box.bottom)/2);assert.equal(e.hp,hp-1,'Torso contact hits');
}
for(const contact of ['cut','plunge'])for(const inside of [false,true]){
 const {g,e}=setup('moth'),box=g.enemyHurtbox(e),p=g.p;const hp=e.hp;
 p.x=box.x+(inside?0:220);p.y=e.y;p.z=contact==='plunge'?box.top-5:0;p.vz=0;p.face=1;p.t=.6;
 if(contact==='cut'){p.state='attack';p.attack={wind:0,active:1,recovery:1,range:30,lane:30,damage:1,posture:0};p.hitIds=new Set();p.swingSound=true;}
 else p.state='plunge';
 g.updatePlayer(.001,{},{});assert.equal(e.hp<hp,inside,`${contact} uses the shared torso volume`);
}
{
 const source=fs.readFileSync('game.js','utf8'),start=source.indexOf("else if(fx.kind==='bossEnrage')"),end=source.indexOf("else if(fx.kind==='lightningTrail')",start),branch=source.slice(start+5,end);
 for(const yellow of [false,true]){const strokes=[],fogs=[],ctx={},scene={fx:{kind:'bossEnrage',yellow,t:.2,seed:1},q:.2,ease:.4,x:500,y:550,ctx,line(...args){strokes.push(args[4]);},fog(...args){fogs.push(args[4]);},Math};vm.runInNewContext(branch,scene);assert.equal(strokes.length,18);assert.equal(ctx.shadowColor,yellow?'#ffd447':'#ff392f');assert.ok(fogs[0].startsWith(yellow?'rgba(255,201,35,':'rgba(255,45,35,'));}
}
console.log('Boss behavior: speeds, phase tempo, 30% running cap/reset, rear-hit anger, moth Y drift, all leap windows, one-hit guard/parry, warning timing, attack rotation and posed body hitboxes passed.');
