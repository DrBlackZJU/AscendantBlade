/* Run from project root: Get-Content -Raw tests/boss-refinement-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cache=new Map();
function load(name){const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Game,TYPES,MOVES}=load('combat.js'),Boss=load('boss.js');
function setup(kind,gap=150){const g=new Game(717);g.enemies=[];g.loopWorld=true;const type=Object.keys(TYPES).find(id=>TYPES[id].bossKind===kind),e=g.spawn(type,900,550);e.spawnDelay=0;e.cd=1000;e.face=1;e.alerted=true;g.p.x=e.x+gap;g.p.y=e.y;g.p.z=0;g.p.invuln=0;g.p.face=-1;g.p.state='idle';return {g,e};}
function key(e,action='melee'){return TYPES[e.type].moveKeys.find(key=>MOVES[key].action===action);}
function tick(g,e,dt=.01){g.time+=dt;g.enemyStep(e,dt);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
function cast(g,e,action){g.beginEnemyMove(e,key(e,action));g.resolveEnemySpell(e,e.attack);}
for(const [kind,rate] of [['chewer',1.1],['nightmare',1.2],['spider_queen',1.1],['behemoth',1.1],['claw_beast',1.18],['bladder',1.1],['profane_obelisk',1.06],['explorer',1.08],['dying',1.1]]){
 const {g,e}=setup(kind);const k=key(e);g.beginEnemyMove(e,k);near(e.attack.wind,MOVES[k].wind/rate);near(e.attack.active,MOVES[k].active/rate);near(e.attack.recovery,MOVES[k].recovery/rate);
}
for(const [kind,speed] of [['plague',126],['nightmare',157.5],['general',115.5],['reaper',115.5]]){const {e}=setup(kind);near(TYPES[e.type].speed,speed);}
{
 const {g,e}=setup('dying');e.hp=e.maxHp*.49;tick(g,e);near(e.bossMoveSpeed,1.2);near(e.bossActionSpeed,1);
}
for(const gap of [150,400]){
 const {g,e}=setup('bottomless',gap),k=key(e);g.beginEnemyMove(e,k);near(e.attack.wind,MOVES[k].wind/(gap===150?1.25:1.1));
 const vacuum=key(e,'vacuum');assert.equal(g.bossMovePool(e).includes(vacuum),true);near(g.bossMoveWeight(e,vacuum),gap===150?.45:3.5);assert.ok(MOVES[vacuum].cooldown<9);
 if(gap===400){g.p.x=e.x+800;cast(g,e,'vacuum');const x=g.p.x;tick(g,e,.1);near(x-g.p.x,22);e.state='active';e.t=0;for(let i=0;i<26;i++)tick(g,e,.1);assert.notEqual(e.state,'active','Vacuum does not append an extra active period');}
}
for(const kind of ['chewer','claw_beast','plague']){
 const {g,e}=setup(kind),k=key(e,'leap');const close=g.bossMoveWeight(e,k);g.p.x=e.x+500;assert.ok(close<g.bossMoveWeight(e,k)*.3);
}
{
 const {g,e}=setup('great_bell',60);assert.ok(g.bossMovePool(e).includes(key(e,'soundTrack')),'Sound pursuit can be chosen up close');
}
{
 const {g,e}=setup('nightmare',500);e.enraged=true;cast(g,e,'nightmareHunt');assert.equal(e.bossState.hunting,true);
 const k=key(e,'nightmareHunt');assert.equal(g.bossMoveAllowed(e,MOVES[k]),false);e.bossState.clock=e.bossState.cd[k];assert.equal(g.bossMoveAllowed(e,MOVES[k]),true);near(g.bossMoveWeight(e,k),4);g.p.x=e.x+100;near(g.bossMoveWeight(e,k),1);
 const fills=[],c=new Proxy({canvas:{width:1200,height:800},globalAlpha:1,fillRect(){fills.push(this.fillStyle);},createRadialGradient(){return {addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});Boss.models.effects(c,g);assert.ok(fills.includes('#09061655'),'Pursuit dims the screen');
 e.state='recovery';e.t=.5;tick(g,e);assert.equal(e.bossState.hunting,false);
}
{
 const {g,e}=setup('claw_beast',600),burrow=key(e,'burrow');assert.ok(g.bossMovePool(e).includes(burrow));near(g.bossMoveWeight(e,burrow),3.5);assert.equal(MOVES[burrow].range,264);
 g.beginEnemyMove(e,burrow);assert.equal(e.state,'burrow');tick(g,e,.61);assert.equal(e.state,'windup');near(e.attack.wind,.55/1.18);
 const low=TYPES[e.type].moveKeys.map(k=>MOVES[k]).find(a=>a.action==='leap'&&!a.jumpHeight);assert.ok(low.active<.5&&low.lunge>=900);
 const close=setup('claw_beast');cast(close.g,close.e,'shortBackstep');const x=close.e.x;tick(close.g,close.e,.1);assert.ok(close.e.x<x-30);assert.ok(TYPES[e.type].moveKeys.some(k=>MOVES[k].pose==='bite'));
}
{
 const {g,e}=setup('reaper',1000);e.bossState={clock:0,cd:{},arrival:false};tick(g,e);near(e.moveBuff,1);cast(g,e,'markPrey');tick(g,e);near(e.moveBuff,1.2);e.bossState.clock=e.bossState.preyUntil;tick(g,e);near(e.moveBuff,1);
}
{
 const {g,e}=setup('demon_jelly',1000);cast(g,e,'phase');tick(g,e);near(e.bossMoveSpeed,1.2);e.bossState.clock=e.bossState.phase;tick(g,e);near(e.bossMoveSpeed,1);
}
{
 const {g,e}=setup('crystal_claw');const leap=key(e,'leap');g.beginEnemyMove(e,leap);e.state='idle';assert.ok(!g.bossMovePool(e).includes(leap));
 g.p.x=e.x+450;assert.deepEqual(g.chooseSequence(e),[],'Chase instead of repeating the only eligible leap');
 g.p.x=e.x+150;const used=new Set();for(let i=0;i<40;i++){const next=g.chooseSequence(e)[0];assert.notEqual(next,e.moveKey);used.add(next);g.beginEnemyMove(e,next);e.state='idle';}assert.ok(used.size>=3);
}
{
 const {g,e}=setup('profane_obelisk');cast(g,e,'summonObelisk');const child=g.enemies.find(o=>o.type==='boss_profane_obelisk');assert.ok(child);assert.equal(child.summoned,true);assert.equal(child.xpMultiplier,0);assert.equal(TYPES[child.type].boss,false);
 const k=key(e,'summonObelisk');e.bossState.clock=e.bossState.cd[k];assert.equal(g.bossMoveAllowed(e,MOVES[k]),false,'One summoned obelisk at a time');child.spawnDelay=0;assert.equal(g.bossMoveAllowed(e,MOVES[key(e,'detonateObelisk')]),true);cast(g,e,'detonateObelisk');assert.equal(child.dead,true);assert.equal(g.bossMoveAllowed(e,MOVES[k]),true);
}
for(const broken of [false,true]){
 const {g,e}=setup('fortress',330);if(broken)e.hp=e.maxHp*.2;const k=key(e,'bastionHop');g.beginEnemyMove(e,k);const x=e.x,target=e.bossState.hop.tx;assert.ok(target<g.p.x&&target>x);e.state='active';e.t=0;const hp=g.p.hp;
 tick(g,e,.19);assert.ok(e.x>x&&e.z>20);assert.equal(g.p.hp,hp,'First half of hop is safe');tick(g,e,.22);assert.ok(g.p.hp<hp,'Landing shock reaches player without landing on them');near(e.x,target);near(e.z,0);if(broken)assert.equal(e.moveBuff,0);
 assert.equal(g.bossMoveAllowed(e,MOVES[k]),false,'Hop has cooldown');g.p.invuln=0;g.p.state='idle';const paid=g.p.hp;tick(g,e,.01);assert.equal(g.p.hp,paid,'Shock hits once');
}
{
 const {g,e}=setup('war_hammer');const k=key(e);g.beginEnemyMove(e,k);e.state='active';e.t=e.attack.active*.35;e.bossState.charged=false;const h=Boss.models.hammerHead(e,g.time);g.p.x=h.x;g.p.y=h.y;g.p.z=Math.max(0,h.z-60);const hp=g.p.hp;g.resolveEnemySpell(e,e.attack);assert.ok(g.p.hp<hp,'Hammer head hits');
 g.p.invuln=0;g.p.state='idle';g.p.x=h.x+e.hammerContact.rx+15;const paid=g.p.hp;g.resolveEnemySpell(e,e.attack);assert.equal(g.p.hp,paid,'Outside hammer ellipse misses');
 const kick=TYPES[e.type].moveKeys.find(k=>MOVES[k].unarmed);assert.equal(MOVES[kick].range,145);g.beginEnemyMove(e,kick);g.p.x=e.x+80;g.p.z=0;g.resolveEnemySpell(e,e.attack);assert.ok(g.p.hp<paid,'Kick retains body-centered contact');
}
{
 const {g,e}=setup('plague',10000);const ranged=key(e,'lob'),summon=key(e,'plagueZombies');near(g.bossMoveWeight(e,ranged),3);near(g.bossMoveWeight(e,summon),3);
 g.beginEnemyMove(e,key(e));near(e.bossActionSpeed,1.14);g.beginEnemyMove(e,key(e,'leap'));near(e.bossActionSpeed,1);
 g.beginEnemyMove(e,ranged);const x=e.x;tick(g,e,.1);assert.ok(e.x>x,'Ranged windup continues approaching');
 cast(g,e,'plagueOrb');const orb=g.projectiles.find(b=>b.plagueOrb);assert.ok(orb);near(Math.hypot(orb.vx,orb.vy),85);
 let count=0;for(let i=0;i<230;i++){g.p.y=500+Math.sin(i*.02)*50;g.projectileStep(.01);count+=g.projectiles.filter(b=>b.plagueOrbChild).length;g.projectiles=g.projectiles.filter(b=>!b.plagueOrbChild);}
 assert.equal(count,3);assert.equal(orb.orbShots,3);assert.equal(g.projectiles.includes(orb),false);
}
for(const mode of ['hit','block','parry']){
 const {g,e}=setup('plague');cast(g,e,'plagueOrb');const b=g.projectiles[0];b.x=g.p.x-2;b.y=g.p.y;b.vx=85;b.vy=0;const hp=g.p.hp;
 if(mode!=='hit'){g.p.state='guard';g.p.t=g.rules.guardStartup+(mode==='parry'?.01:g.rules.perfectWindow+.01);}
 g.projectileStep(.01);
 if(mode==='hit'){assert.ok(g.p.hp<hp);assert.ok(!g.projectiles.includes(b));}
 if(mode==='block'){assert.ok(g.p.grayHp>0);assert.ok(!g.projectiles.includes(b));}
 if(mode==='parry'){assert.equal(g.p.hp,hp);assert.equal(b.reflected,true);b.x=5000;b.vx=85;for(let i=0;i<100;i++)g.projectileStep(.01);assert.equal(b.orbShots,0,'Reflected orb stops firing hostile bullets');}
}
console.log('Boss refinements: tempo, phase speeds, distance weights, attack diversity, burrow, summons, broken-leg hop, hammer head, vacuum, orb lifecycle, hit/block/reflection and pursuit dimming passed.');
