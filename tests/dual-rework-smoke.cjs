const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const cache=new Map();function load(file){file=file.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Run}=load('game.js'),{ASCENSIONS,DUAL_ASCENSIONS}=load('ascensions.js'),{TYPES,MOVES}=load('combat.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(id){const r=new Run({training:true,seed:61});r.game.enemies=[];Object.assign(r.game.p,{x:1000,y:550,face:1});if(id)assert.ok(r.trainingPick(id));return r;}
function enemy(r,type='sword',x=1140,y=550){const e=r.game.spawn(type,x,y);Object.assign(e,{spawnDelay:0,hp:1000,maxHp:1000,posture:1000,maxPosture:1000,face:-1,cd:99});return e;}
function tickStatuses(r,seconds){for(let t=0;t<seconds-1e-9;t+=.1)r.effects.updateStatuses(Math.min(.1,seconds-t));}
// Exact base drop boundaries for all three ranks, without chance modifiers.
for(const rank of [1,2,3])for(const delta of [-.001,.001]){const r=setup(),f=r.effects;r.upgrades.fieldRations=rank;r.game.random=()=>[0,.15,.18,.20][rank]+delta;f.newKillEffects(enemy(r),['normal']);assert.equal(f.fieldRations.length,delta<0?1:0);}
for(const size of [1,2,3]){const r=setup(),f=r.effects;r.upgrades.fieldRations=3;f.fieldRations.push({x:1000,y:550,size,life:8});f.update(0);close(r.game.p.attackSpeedMultiplier,size===3?1.15:1);const event={enemy:enemy(r),damage:100,posture:100,tags:['normal']};f.modifyNewAttack(event);assert.equal(event.damage,100,'food no longer boosts damage');f.update(5.1);assert.equal(f.foodBuff,0);}
// Wounds and every poison source stack as two categories, not once per poison source.
for(const type of ['sword','boss'])for(const statuses of [['serum'],['poison'],['serum','poison'],['serum','poison','virulentPoison']]){
 const r=setup('d125'),f=r.effects,e=enemy(r,type);for(const key of statuses)f.addStatus(e,key,key==='serum'?9:7,6,[key==='serum'?'antiRegen':'poison']);tickStatuses(r,1);
 const base=statuses.reduce((n,k)=>n+(k==='serum'?9:7),0),categories=Number(statuses.includes('serum'))+Number(statuses.some(k=>k!=='serum'));
 close(1000-e.hp,base+categories*(type==='boss'?2:10));
}
{const r=setup('d125'),f=r.effects,e=enemy(r);f.addStatus(e,'poison',0,.2,['reflect','poison']);f.updateStatuses(.3);close(1000-e.hp,2);f.updateStatuses(1);close(1000-e.hp,2);}
{const r=setup('d125'),f=r.effects,e=enemy(r);r.upgrades.catalyst=3;r.upgrades.cooldown=3;r.duals.d254=true;f.addStatus(e,'poison',0,6,['corpseBomb','poison']);tickStatuses(r,1);close(1000-e.hp,10,'erosion uses real seconds');}
// A baseline dash pauses recharge during movement; Triple Dash recovers during it.
for(const dual of [false,true]){const r=setup(dual?'d28':undefined),g=r.game,p=g.p;assert.equal(p.dashMaxCharges,dual?3:1);g.startDash({d:true});const before=p.dashRegen;g.updatePlayer(.05,{d:true},{});close(p.dashRegen,before-(dual?.05:0));}
// Marks apply regardless of current attack state, wait for the next attack, and trigger once.
for(const type of ['sword','boss']){
 const r=setup('d158'),g=r.game,f=r.effects,e=enemy(r,type);g.damageEnemy(e,0,0,['thrust']);assert.ok(e.frightfulThrustMark);assert.equal(e.hp,1000);
 g.beginEnemyMove(e,'cut');close(1000-e.hp,64);close(1000-e.posture,16);assert.equal(e.frightfulThrustMark,false);assert.equal(e.state,type==='boss'?'windup':'recovery');assert.equal(!!e.attack,type==='boss');
 g.beginEnemyMove(e,'cut');close(1000-e.hp,64);
}
{const r=setup('d158'),g=r.game,e=enemy(r);g.beginEnemyMove(e,'cut');g.damageEnemy(e,0,0,['thrust']);assert.equal(e.hp,1000);assert.ok(e.frightfulThrustMark);}
{const r=setup('d158'),g=r.game,e=enemy(r,'boss');e.posture=8;e.frightfulThrustMark=true;g.beginEnemyMove(e,'cut');assert.equal(e.posture,0);assert.equal(e.state,'stunned');assert.ok(e.stun>0);assert.equal(e.frightfulThrustMark,false);}
// Verify every production boss move path can trigger a marked attack without wrapper errors.
for(const type of Object.keys(TYPES).filter(t=>TYPES[t].boss)){
 const r=setup('d158'),g=r.game,e=enemy(r,type),key=TYPES[type].moveKeys?.find(k=>MOVES[k]?.damage>0&&!MOVES[k].reactiveOnly);
 if(!key)continue;e.frightfulThrustMark=true;g.beginEnemyMove(e,key);if(e.frightfulThrustMark)continue;assert.ok(e.hp<1000,type);assert.ok(e.attack,type);assert.notEqual(e.state,'recovery',type);
}
function peas(r,seconds){for(let t=0;t<seconds-1e-9;t+=.01)r.effects.updatePeaShooter(Math.min(.01,seconds-t));}
{const r=setup('d322'),f=r.effects,g=r.game,e=enemy(r,'sword',1260,568);const events=[];g.hooks.on('onEffectHit',x=>events.push(x));peas(r,1.39);assert.equal(f.peaShooter.shots.length,0);peas(r,.02);assert.equal(f.peaShooter.shots.length,1);peas(r,.6);close(1000-e.hp,30);close(1000-e.posture,20);assert.ok(events.some(x=>x.tags.includes('peaShooter')));assert.equal(f.v11SummonCount(),1);}
{const r=setup('d322'),f=r.effects,g=r.game,shots=[];g.emit=(type,data)=>{if(type==='peaShot')shots.push(data);};
 for(const size of [1,2,3,3]){f.fieldRations.push({x:1000,y:550,size,life:8});f.updateFood(0);}assert.equal(f.peaShooter.energy,9);assert.equal(f.peaShooter.queuedBursts,0);
 f.feedPeaShooter(3);assert.equal(f.peaShooter.energy,0);assert.equal(f.peaShooter.queuedBursts,1);peas(r,2.39);assert.equal(shots.length,19);peas(r,.01);assert.equal(shots.length,20);assert.ok(shots.every(s=>s.burst));
 for(const s of f.peaShooter.shots)assert.ok(Math.abs(Math.atan2(s.vy,s.vx))<=7.5*Math.PI/180+1e-9);assert.equal(f.peaShooter.burstTime,null);
}
{const r=setup('d322'),f=r.effects;f.feedPeaShooter(10);peas(r,.6);f.feedPeaShooter(10);peas(r,1.8);assert.equal(f.peaShooter.queuedBursts,1);peas(r,2.4);assert.equal(f.peaShooter.burstShots,20);assert.equal(f.peaShooter.queuedBursts,0);}
{const r=setup('d322'),g=r.game,f=r.effects;r.trainingPick('d225');g.random=()=>.99;peas(r,1);const e=enemy(r,'sword',1260,568);f.firePea(e);peas(r,.6);close(1000-e.hp,30*1.3*1.25*1.5);close(1000-e.posture,20*1.2*1.28);assert.ok(f.v11SummonSpeed()>1);}
{const r=setup('d322'),f=r.effects;f.firePea(enemy(r));const before=f.peaShooter.shots[0].x;r.shiftLoopWorld(100);close(f.peaShooter.shots[0].x,before+100);}
const pea=DUAL_ASCENSIONS.find(c=>c.id==='d322');assert.ok(!/2\.4|15度|20发|能量|10养料/.test(pea.description));assert.ok(pea.description.includes('叶绿素'));assert.equal(DUAL_ASCENSIONS.filter(c=>c.parents.includes('parasiticVines')&&c.parents.includes('fieldRations')).length,1);
vm.runInThisContext(fs.readFileSync('i18n-en.js','utf8'));for(const c of DUAL_ASCENSIONS)assert.ok(AshEnglish.duals[c.id],c.id);for(const c of ASCENSIONS)assert.ok(AshEnglish.cards[c.id],c.id);
console.log('Dual rework: food drop boundaries and large-food speed, independent wound/poison erosion and boss reduction, dash recovery, next-attack marks, summon damage/affinity, nutrition reset, 20-shot volleys, queued volleys, world wrap and player text passed.');
