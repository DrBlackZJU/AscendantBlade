const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const cache=new Map();function load(file){file=file.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Run}=load('game.js'),{ASCENSIONS,DUAL_ASCENSIONS}=load('ascensions.js'),{isBoss}=load('combat.js');
for(const [type,ratio,expected] of [['sword',.20,true],['sword',.2001,false],['axe',.20,true],['axe',.2001,false],['boss',.10,true],['boss',.1001,false]]){
 const r=new Run({training:true,seed:717});r.trainingPick('d01');const g=r.game,f=r.effects;g.enemies=[];const e=g.spawn(type,g.p.x+70,g.p.y);Object.assign(e,{hp:ratio*10000,maxHp:10000,spawnDelay:0});assert.equal(isBoss(e),type==='boss');f.v11.heat.set(e.id,{n:5,t:g.time});let slays=0,slashes=0;
 // Freeze damage to isolate the finisher's threshold after its three extra slashes.
 f.secondary=(enemy,damage,posture,tags)=>{if(tags.includes('flameBlade'))slashes++;};f.slay=(enemy,source)=>{assert.equal(enemy,e);assert.equal(source,'flameBlade');slays++;};
 f.v11AttackHit({enemy:e,tags:['normal'],damage:0,posture:0});assert.equal(slashes,3);assert.equal(slays,expected?1:0,`${type} ${ratio}`);
}
assert.ok(ASCENSIONS.find(c=>c.id==='swiftBlade').levels[2].includes('第四击可斩杀生命值不高于20%的敌人。'));
assert.ok(DUAL_ASCENSIONS.find(c=>c.id==='d01').description.includes('20%'));
vm.runInThisContext(fs.readFileSync('i18n-en.js','utf8'));assert.ok(AshEnglish.cards.swiftBlade[4].endsWith('Fourth hits kill enemies at or below 20% health.'));assert.ok(AshEnglish.duals.d01[1].includes('20%'));
const code=fs.readFileSync('ascensions.js','utf8');assert.ok(code.includes("const threshold=isBoss(enemy)?.10:.20"),'Swift Blade gameplay thresholds stay unchanged');
console.log('Flint: normal/elite 20% and boss 10% inclusive thresholds, 3 slashes, Chinese/English copy, unchanged Swift Blade thresholds passed.');
