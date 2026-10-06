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
const game=new Game(717);game.enemies=[];
const parent=game.spawn('e58',900,550);
game.damageEnemy(parent,parent.maxHp*.51,0,['test'],{secondary:true,flinch:false});
const children=game.enemies.filter(e=>e!==parent);
assert.equal(children.length,2);
assert.ok(children.every(e=>e.type==='fission_spawn'&&e.summoned&&e.summonerId===parent.id));
assert.ok(children.every(e=>e.scale<parent.scale&&e.maxHp<parent.maxHp));
assert.ok(!ENEMY_CATALOG.REGULAR.some(e=>e.id==='fission_spawn'));
assert.ok(!ENEMY_CATALOG.ALL.some(e=>e.id==='fission_spawn'));
assert.deepEqual(TYPES.fission_spawn.moveKeys.map(k=>MOVES[k].name),['撞击','滚压']);
assert.ok(TYPES.fission_spawn.moveKeys.every(k=>MOVES[k].damage>0&&MOVES[k].lunge>0));
game.damageEnemy(parent,1,0,['test'],{secondary:true,flinch:false});
game.damageEnemy(children[0],children[0].maxHp*.6,0,['test'],{secondary:true,flinch:false});
assert.equal(game.enemies.length,3,'neither repeated damage nor offspring can split again');
for(const key of TYPES.fission_spawn.moveKeys){
  const g=new Game(717);g.enemies=[];g.p.hp=g.p.maxHp=1000;
  const child=g.spawn('fission_spawn',g.p.x-65,g.p.y);child.face=1;child.alerted=true;
  g.beginEnemyMove(child,key);const start=g.p.hp;
  for(let i=0;i<180&&g.p.hp===start;i++)g.step(1/120,{},{});
  assert.ok(g.p.hp<start,MOVES[key].name+' must actually hit');
}
console.log('Fission offspring: dedicated summons, no natural spawns or recursive splitting, both attacks hit.');
