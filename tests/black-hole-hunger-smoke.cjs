const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const cache=new Map();function load(file){file=file.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {AscensionEffects,DUAL_ASCENSIONS}=load('ascensions.js');
const card=DUAL_ASCENSIONS.find(c=>c.id==='d312');assert.equal(card.name,'虚空饥渴');assert.deepEqual(card.parents,['blackHole','devourer']);
const f=Object.create(AscensionEffects.prototype);f.pair=(a,b)=>a==='blackHole'&&b==='devourer';f.blackHole={field:{x:0,y:0,radius:285,baseRadius:285,life:4,tick:0,growth:1,devoured:0}};
const dead={x:100,y:0,dead:true};f.growBlackHole(dead);assert.equal(f.blackHole.field.growth,1.1);f.growBlackHole(dead);assert.equal(f.blackHole.field.devoured,1);
f.growBlackHole({x:1000,y:0,dead:true});assert.equal(f.blackHole.field.devoured,1);
for(let i=2;i<=12;i++){f.growBlackHole({x:0,y:0,dead:true});assert.equal(f.blackHole.field.growth,1+Math.min(10,i)*.1);}
assert.equal(f.blackHole.field.radius,570);
f.rank=()=>3;const e={x:100,y:0,hp:100,maxHp:100,posture:100,maxPosture:100,type:'test'};f.near=()=>[e];f.game={emit(){}};let hit;f.secondary=(enemy,damage,posture)=>{hit=[damage,posture];};f.updateBlackHole(.01);assert.deepEqual(hit,[18,18]);assert.ok(e.x<99,'pull grows with black hole');
f.blackHole.field=null;f.blackHole.cooldown=0;f.visibleEnemies=()=>[e];f.game.random=()=>0;f.updateBlackHole(0);assert.equal(f.blackHole.field.growth,1);assert.equal(f.blackHole.field.devoured,0);assert.equal(f.blackHole.field.radius,285);
f.pair=()=>false;f.growBlackHole({x:e.x,y:e.y,dead:true});assert.equal(f.blackHole.field.growth,1);
console.log('Void hunger: registration, linear growth, cap, duplicate/outside rejection, both damage channels, pull, fresh-field reset passed.');
