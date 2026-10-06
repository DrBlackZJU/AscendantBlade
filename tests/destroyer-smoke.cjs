const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,name=>load(name.replace(/^\.\//,'')));return m.exports;}
const {AscensionEffects,DUAL_ASCENSIONS}=load('ascensions.js');
const c=DUAL_ASCENSIONS.find(c=>c.id==='d313');assert.equal(c.name,'摧破者');assert.deepEqual(c.parents,['meditation','breakMomentum']);assert.equal(c.maxLevel,1);assert.equal(c.dual,true);assert.equal(new Set(DUAL_ASCENSIONS.map(c=>c.id)).size,DUAL_ASCENSIONS.length);
const f=Object.create(AscensionEffects.prototype);let enabled=true,heal=0,momentum=0;
f.game={p:{state:'execute',vx:100,vy:100},heal(n){heal+=n;}};f.run={gainMomentum(n){momentum+=n;}};f.rank=()=>3;f.pair=(a,b)=>enabled&&a==='meditation'&&b==='breakMomentum';f.v11={meditation:{t:1,active:true,activeAge:1}};
f.updateMeditation(.2);assert.equal(f.v11.meditation.active,true);assert.ok(heal>0&&momentum>0);assert.ok(f.v11.meditation.activeAge>1);
enabled=false;f.updateMeditation(.2);assert.equal(f.v11.meditation.active,false);assert.equal(f.v11.meditation.t,0);
enabled=true;f.updateMeditation(.2);assert.equal(f.v11.meditation.active,false,'execution cannot start meditation');
f.v11.meditation={t:1,active:true,activeAge:1};f.game.p.state='attack';f.updateMeditation(.2);assert.equal(f.v11.meditation.active,false);
const source=fs.readFileSync('ascensions.js','utf8');const hook=source.split('\n').find(l=>l.includes("g.hooks.on('modify:guardPosture'"));let handler;const context={g:{hooks:{on(name,fn){handler=fn;}}},pair:f.pair,rank:()=>0};vm.runInNewContext('(function(){'+hook+'}).call(self)',{g:context.g,self:context});let e={value:100};handler(e);assert.equal(e.value,120);enabled=false;e={value:100};handler(e);assert.equal(e.value,100);
for(const file of ['ascensions.js','i18n-en.js'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('Destroyer: registration, +20% guard posture, execution retention and recovery, no execution activation, normal interruption and syntax passed.');
