const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('ascensions.js','utf8');
const block=source.slice(source.indexOf('      const c=f.v11.consecration.field;'),source.indexOf("      if(pair('consecration','starBlessing')"));
const enemy={id:1,x:20,y:0},hits=[],events=[];
let roll=0;
const context={f:{v11:{consecration:{field:{x:0,y:0,radius:205}}}},s:{holySeen:new Set()},p:{x:0,y:0},dt:.01,
  dist:()=>0,pair:(a,b)=>a==='consecration'&&b==='doom',near:()=>[enemy],chance:n=>roll<n,
  hit:(e,hp,posture,tags)=>hits.push({e,hp,posture,tags}),g:{emit:(type,data)=>events.push({type,...data})},
  doom:()=>assert.fail('Holy punishment must not invoke doom')};
vm.createContext(context);
const tick=()=>vm.runInContext('{'+block+'}',context);
tick();assert.equal(hits.length,1);assert.equal(hits[0].hp,99);assert.equal(hits[0].posture,48);
assert.deepEqual(Array.from(hits[0].tags),['holy','holyPunishment']);assert.equal(events[0].type,'holyStrike');assert.equal(events[0].radius,32);
tick();assert.equal(hits.length,1,'Only one roll per enemy per field');
context.f.v11.consecration.field={x:0,y:0,radius:205};roll=.35;tick();assert.equal(hits.length,1,'35% boundary fails');
roll=0;tick();assert.equal(hits.length,1,'Failed roll is not retried');
context.f.v11.consecration.field={x:0,y:0,radius:205};roll=.349;tick();assert.equal(hits.length,2,'Fresh field permits another roll');
assert.ok(source.includes('有35%概率受到圣光天罚，造成99伤害与48架势伤害。'));
console.log('Holy punishment: damage, posture, holy tags, narrow FX, probability boundary and field reset passed.');
