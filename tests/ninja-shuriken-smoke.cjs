/* Run from the project root: Get-Content -Raw tests/fission-spawn-smoke.cjs | node */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cache=new Map();
function load(name){
  const file=name.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(module,module.exports,load);
  return module.exports;
}
const {Game,TYPES,MOVES,ENEMY_CATALOG}=load('combat.js');

function setup(dist){const g=new Game(717);g.enemies=[];g.p.x=500;g.p.y=550;const e=g.spawn('ninja',500+dist,550);e.spawnDelay=0;e.state='idle';e.cd=0;e.alerted=true;return {g,e};}
for(const dist of [200,350,480]){const {g,e}=setup(dist);g.enemyStep(e,0);assert.equal(e.state,'windup');assert(e.attack.flags.includes('shuriken'));}
for(const dist of [120,500]){const {g,e}=setup(dist);assert(!g.ninjaThrowReady(e,dist));}
const {g,e}=setup(350);assert.equal(e.ammo,3);for(let i=0;i<3;i++){e.x=850;e.y=550;e.state='idle';e.cd=0;e.shurikenCd=0;g.enemyStep(e,0);assert(e.attack.flags.includes('shuriken'));g.enemyStep(e,e.attack.wind+.01);g.enemyStep(e,e.attack.active*.35+.01);assert.equal(e.ammo,2-i);assert.equal(e.shurikenCd,5);assert(!g.ninjaThrowReady(e,350));}assert.equal(g.projectiles.filter(p=>p.flags.includes('shuriken')).length,3);e.state='idle';e.cd=0;e.shurikenCd=0;g.enemyStep(e,0);assert.equal(e.state,'idle');assert(!g.ninjaThrowReady(e,350));console.log('Ninja mid/far throws, range, cooldown and three-projectile ammo cap passed');
