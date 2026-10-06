/* Run from project root: Get-Content -Raw tests/boss-reflection-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cache=new Map();
function load(name){const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Game,TYPES,MOVES}=load('combat.js');
function setup(type,face=1,gap=350){const g=new Game(717);g.enemies=[];g.loopWorld=true;const e=g.spawn(type,900,550);e.spawnDelay=0;e.face=face;e.cd=1000;e.alerted=true;g.p.x=e.x+face*gap;g.p.y=e.y;g.p.z=0;g.p.invuln=0;g.p.face=-face;g.p.state='guard';g.p.t=g.rules.guardStartup+.01;return {g,e};}
function finish(g,b,dt,advance=false){for(let i=0;i<Math.ceil(2.1/dt)&&b.life>0;i++){g.time+=dt;if(advance)for(const e of g.enemies)g.enemyStep(e,dt);g.projectileStep(dt);}}
const hunter=Object.keys(TYPES).find(id=>TYPES[id].bossKind==='hunter');
// Actual authored hunter bolt -> manual perfect block -> actual reflected collision.
for(const face of [-1,1])for(const dt of [.005,1/60,1/30])for(const advance of [false,true]){
 const {g,e}=setup(hunter,face),key=TYPES[hunter].moveKeys.find(k=>MOVES[k].action==='aimShot');g.beginEnemyMove(e,key);e.state='active';e.t=e.attack.active*.35;g.resolveEnemySpell(e,e.attack);const b=g.projectiles[0],hp=e.hp,playerHp=g.p.hp;
 assert.ok(g.enemyHurtbox(e).bottom>46,'Reproduce the old foot-level aim below the torso');
 for(let i=0;i<200&&!b.reflected&&b.life>0;i++)g.projectileStep(dt);
 assert.equal(b.reflected,true,'Bolt is actually perfectly blocked');assert.equal(g.stats.parries,1);assert.equal(g.p.hp,playerHp);
 finish(g,b,dt,advance);assert.ok(e.hp<hp,`Hunter is hit from face ${face}, dt ${dt}, movement ${advance}`);assert.equal(g.projectiles.includes(b),false);
}
// Every boss torso can receive a returned projectile across poses and elevated states.
for(const [type,base] of Object.entries(TYPES).filter(([,b])=>b.boss))for(const state of ['idle','windup','active','recovery']){
 const {g,e}=setup(type);e.state=state;e.attack={...(MOVES[base.moveKeys?.[0]]||MOVES.weakCut)};e.t=.1;e.z=state==='active'?80:0;
 const b={x:g.p.x,y:g.p.y,z:48,vx:-650,vy:0,vz:0,owner:e.id,life:2,damage:20,flags:[]};g.projectiles=[b];const hp=e.hp;g.resolvePerfectBlock(e,b);finish(g,b,.01);
 assert.ok(e.hp<hp,`${base.name}/${state} reflected arrow reaches torso`);
}
// Normal reflection and protected rapid-block reflection share the same body target.
for(const protectedBlock of [false,true])for(const rank of [1,2,3]){
 const {g,e}=setup(hunter);g.p.swallowReturnRank=rank;g.p.blockMultiGuard=protectedBlock?.1:0;g.p.t=g.rules.guardStartup+g.rules.perfectWindow+.01;
 const b={x:g.p.x-5,y:g.p.y,z:48,vx:-650,vy:0,vz:0,owner:e.id,life:2,damage:20,flags:[]};g.projectiles=[b];const hp=e.hp;assert.equal(g.blockHit(20,e,b),'block-reflect');finish(g,b,.01);assert.ok(e.hp<hp,`Normal rank ${rank}, protected ${protectedBlock}`);
}
// Chain returns must also reach the next boss's torso rather than its feet.
{
 const {g,e}=setup(hunter),otherType=Object.keys(TYPES).find(id=>TYPES[id].bossKind==='general'),other=g.spawn(otherType,650,550);other.spawnDelay=0;other.z=80;
 const b={x:g.p.x,y:g.p.y,z:48,vx:-650,vy:0,vz:0,owner:e.id,life:2,damage:20,flags:[],chainRemaining:1};g.projectiles=[b];const hp=other.hp;g.resolvePerfectBlock(e,b);finish(g,b,.01);assert.ok(other.hp<hp,'Chain reflection also aims at the next boss torso');
}
// Keep the narrowed wing exclusion; reflection does not enlarge body hurtboxes.
{
 const type=Object.keys(TYPES).find(id=>TYPES[id].bossKind==='moth'),{g,e}=setup(type);const hp=e.hp;g.projectiles=[{x:e.x+95,y:e.y,z:100,vx:0,vy:0,vz:0,life:1,reflected:true,damage:35,flags:[]}];g.projectileStep(.01);assert.equal(e.hp,hp);
}
console.log('Boss reflection: actual hunter bolts, both directions, 30/60/200 Hz, moving shooter, all boss poses/heights, normal/protected/chain reflection and wing exclusion passed.');
