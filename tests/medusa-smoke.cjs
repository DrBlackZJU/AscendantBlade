const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const cache=new Map();function load(file){file=file.replace(/^\.\//,'');if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInThisContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file})(m,m.exports,load);return m.exports;}
const {Run}=load('game.js'),{ASCENSIONS,DUAL_ASCENSIONS}=load('ascensions.js'),{TYPES,isBoss}=load('combat.js');
function setup(rank=3){const r=new Run({training:true,seed:71});r.game.enemies=[];Object.assign(r.game.p,{x:1000,y:550,face:1});r.upgrades.medusaEye=rank;return r;}
function enemy(r,type='sword',x=1100,y=550){const e=r.game.spawn(type,x,y);Object.assign(e,{spawnDelay:0,face:-1,hp:10000,maxHp:10000,posture:10000,maxPosture:10000});return e;}
function dual(r,id){assert.ok(r.trainingPick(id));}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const rank of [1,2,3]){
 const r=setup(rank),f=r.effects,g=r.game,e=enemy(r),away=enemy(r,'sword',1200),behind=enemy(r,'sword',900),outside=enemy(r,'sword',1100,680),far=enemy(r,'sword',1600),boss=enemy(r,'boss',1300);away.face=1;
 f.medusa.cooldown=0;f.updateMedusa(.01);
 close(e.medusaUntil,[0,4,5,5][rank]);close(boss.medusaUntil,[0,1,1.25,1.25][rank]);
 close(10000-e.hp,[0,22,33,44][rank]);close(10000-e.posture,[0,44,66,88][rank]);
 for(const q of [away,behind,outside,far])assert.ok(!f.isPetrified(q));
 close(f.medusa.cooldown,rank===3?12:15);
 const x=e.x;g.enemyStep(e,.3);close(e.x,x);assert.ok(!e.walking);
 g.time=e.medusaUntil+.01;g.enemyStep(e,.01);assert.ok(!f.isPetrified(e));assert.ok(!e.medusaPose);
}
{const r=setup(),f=r.effects;f.medusa.cooldown=.1;f.updateMedusa(.2);assert.equal(f.medusa.cooldown,0);f.updateMedusa(5);assert.equal(f.medusa.cooldown,0);enemy(r);f.updateMedusa(.01);assert.equal(f.medusa.cooldown,12);}
for(const rank of [1,2,3]){const r=setup(),f=r.effects;r.upgrades.medusaEye=0;r.upgrades.lullaby=rank;for(let i=0;i<6;i++)enemy(r,'sword',1100+i*30);const b=enemy(r,'boss');f.v11.lullaby.cd=0;f.updateV11(.01);const asleep=r.game.enemies.filter(e=>e.sleepT>0);assert.equal(asleep.length,rank===1?3:4);assert.ok(!b.sleepT);for(const e of asleep){assert.equal(e.sleepT,rank+5);close(10000-e.posture,[0,30,40,50][rank]);}}
// The final, resolved damage amount determines shatter; exactly 30% does not.
for(const type of ['sword','boss'])for(const amount of [3000,3001]){const r=setup(),e=enemy(r,type);r.effects.petrify(e);r.effects.secondary(e,amount,0,['test']);assert.equal(e.dead,!isBoss(e)&&amount>3000);if(e.dead)assert.equal(e.deathFlavor,'stone');}
{const r=setup();dual(r,'d315');const g=r.game,p=g.p,a=enemy(r),b=enemy(r,'sword',1160);r.effects.petrify(a);r.effects.petrify(b);p.rockThrustFull=true;p.attackSerial=12;g.damageEnemy(a,1,1,['thrust','rockThrust','heavy','fullCharge']);assert.ok(a.dead);assert.ok(b.dead,'shockwave still fires when the thrust shatters its primary target');assert.ok(g.events.some(e=>e.type==='rockShockwave'));}
{const r=setup();dual(r,'d315');const e=enemy(r);r.effects.petrify(e);r.effects.secondary(e,1,1,['rockThrust','shockwave']);assert.ok(!e.dead,'partial-charge shock does not shatter');}
for(const type of ['sword','boss']){
 const r=setup();dual(r,'d316');const e=enemy(r,type),boss=isBoss(e),event={enemy:e,damage:0,posture:0,tags:['comboFinisher'],direct:true};r.effects.petrify(e);r.effects.globalTargetDamage(event);close(event.damage,e.maxHp*(boss?.05:.10));close(event.posture,e.maxPosture*(boss?.10:.20));
 e.hp=e.maxHp*(boss?.20:.45);r.game.random=()=>.99;r.game.damageEnemy(e,0,0,'comboFinisher');assert.ok(e.dead,'fourth strike executes using the reduced boss threshold');assert.equal(e.deathFlavor,'stone');
}
for(const charge of [.82,.83]){const r=setup();dual(r,'d317');const e=enemy(r),other=enemy(r,'sword',1190);r.effects.petrify(e);r.effects.secondary(e,1,1,['bullRush'],{medusaBullCharge:charge});assert.ok(e.dead);assert.equal(r.game.events.some(e=>e.type==='heavyRecoil'),charge>.82);close(10000-other.hp,charge>.82?36:0);if(charge>.82)assert.ok(other.state==='knockdown');}
for(const charge of [.6,.9]){
 const r=setup();dual(r,'d317');const e=enemy(r,'boss'),other=enemy(r);r.effects.petrify(e);r.effects.secondary(e,1,1,['bullRush'],{medusaBullCharge:charge});
 close(e.hp,8999);assert.ok(!e.dead);assert.ok(!r.effects.isPetrified(e));assert.ok(!e.medusaPose);assert.ok(!r.game.events.some(e=>e.type==='heavyRecoil'));close(other.hp,10000);
 r.effects.secondary(e,1,1,['bullRush'],{medusaBullCharge:charge});close(e.hp,8998,'a second hit without petrification gets no percentage bonus');
}
{const r=setup();dual(r,'d320');const f=r.effects,b=enemy(r,'boss');f.medusa.cooldown=999;f.medusa.goldCooldown=0;f.updateMedusa(1);assert.equal(f.medusa.goldCooldown,0);assert.ok(!b.medusaGold);f.petrify(b,{gold:true});assert.ok(!b.medusaGold);const e=enemy(r);f.updateMedusa(.01);assert.ok(e.medusaGold);assert.ok(!b.medusaGold);assert.equal(f.medusa.goldCooldown,9);}
{const r=setup();dual(r,'d318');const e=enemy(r);r.effects.petrify(e);r.effects.medusa.cooldown=999;r.effects.updateMedusa(.5);close(e.posture,10000);r.effects.updateMedusa(.5);close(10000-e.posture,513);}
{const r=setup();dual(r,'d319');const e=enemy(r),b=enemy(r,'boss');r.effects.petrify(e);r.effects.petrify(b);close(e.medusaUntil,7);close(b.medusaUntil,1.75);r.game.kill(e);assert.equal(r.game.p.superArmor,2);const event={value:100,preview:true};r.effects.modifyRealDamage(event);r.game.time=2.01;const after={value:100,preview:true};r.effects.modifyRealDamage(after);close(event.value,after.value*.9);}
{const r=setup();dual(r,'d320');const f=r.effects;f.medusa.goldCooldown=0;f.medusa.cooldown=999;f.updateMedusa(1);assert.equal(f.medusa.goldCooldown,0);const e=enemy(r);f.updateMedusa(.01);assert.ok(e.medusaGold);assert.deepEqual(f.cooldownRows().map(x=>x.id),['medusaEye']);assert.equal(f.medusa.goldCooldown,9);r.game.time=1000;const x=e.x;r.game.enemyStep(e,1);assert.equal(e.x,x);assert.ok(f.isPetrified(e));const normal={value:100,enemy:enemy(r),tags:[]},gold={value:100,enemy:e,tags:[]};f.modifyKillXP(normal);f.modifyKillXP(gold);close(gold.value,normal.value*3);f.secondary(e,10001,0,['test']);assert.ok(e.dead);assert.equal(e.deathFlavor,'goldStone');assert.ok(e.corpseLocked);}
{const r=setup();dual(r,'d321');r.effects.medusa.cooldown=0;const e=enemy(r);r.effects.updateMedusa(.01);assert.equal(r.effects.medusa.cooldown,9);close(10000-e.hp,44*1.4);for(const name of ['不洁石碑','亵渎石碑','堡垒','活体雕像','血晶塔','暗晶塔','不洁巨像']){const type=Object.keys(TYPES).find(t=>TYPES[t].name===name);assert.ok(type,name);assert.ok(r.effects.isRockEnemy({type}),name);}const ev={enemy:e,damage:100,posture:100,tags:[],direct:false};r.effects.globalTargetDamage(ev);close(ev.damage,140);close(ev.posture,140);}
// Rock and petrification are alternate qualifiers for one Sculptor bonus.
for(const name of ['不洁石碑','亵渎石碑','堡垒','活体雕像','血晶塔','暗晶塔','不洁巨像','洪钟']){
 const r=setup();dual(r,'d321');const type=Object.keys(TYPES).find(t=>TYPES[t].name===name),e=enemy(r,type);assert.ok(type,name);assert.ok(r.effects.isRockEnemy(e),name);
 function hit(){const event={enemy:e,damage:100,posture:100,tags:[],direct:false};r.effects.globalTargetDamage(event);return event;}
 r.duals.d321=false;const baseline=hit();r.duals.d321=true;const rock=hit();close(rock.damage,baseline.damage*1.4);close(rock.posture,baseline.posture*1.4);
 r.effects.petrify(e);assert.ok(r.effects.isPetrified(e),name);const stone=hit();close(stone.damage,rock.damage);close(stone.posture,rock.posture);
 r.effects.petrify(e,{gold:true});const gold=hit();close(gold.damage,rock.damage);close(gold.posture,rock.posture);
}
// Boss wrappers must stop their own timers, not just the base AI step.
for(const type of Object.keys(TYPES).filter(t=>TYPES[t].boss&&!TYPES[t].bossProxy)){
 const r=setup(),e=enemy(r,type);r.effects.petrify(e);const before={x:e.x,y:e.y,hp:r.game.p.hp,shots:r.game.projectiles.length};for(let i=0;i<10;i++)r.game.enemyStep(e,.02);assert.equal(e.x,before.x,type);assert.equal(e.y,before.y,type);assert.equal(r.game.p.hp,before.hp,type);assert.equal(r.game.projectiles.length,before.shots,type);
}
assert.equal(new Set(DUAL_ASCENSIONS.map(c=>c.id)).size,DUAL_ASCENSIONS.length);
assert.deepEqual(ASCENSIONS.find(c=>c.id==='medusaEye').levels,[
 '每15秒，使自己面前锥形范围内面朝自己的目标石化4秒，并受到22生命伤害与44架势伤害。',
 '造成5秒石化，33生命伤害与66架势伤害。',
 '间隔缩短至12秒，伤害提升至44生命伤害与88架势伤害，石化目标一次受到超过最大生命值30%的伤害会直接破碎。'
]);
const dualCopy=[
 '满蓄力的岩石突刺或其冲击波会直接击碎石化的敌人。',
 '第四击对石化的敌人额外造成10%最大生命值的伤害与20%最大架势值的架势伤害，并斩杀生命值不高于40%的石化敌人。',
 '狂牛冲撞会直接撞碎石化的敌人。如果使用接近满蓄的冲撞撞碎敌人，产生震波对周围敌人造成36伤害与80架势伤害，并击飞小型敌人。',
 '石化的敌人每秒损失13外加5%最大架势值。',
 '石化时间延长2s，击杀石化敌人提供2秒霸体与10%减伤效果。',
 '每9秒，随机将一个敌人永久变为黄金。将其击碎可获得3倍经验奖励。',
 '美杜莎之眼的冷却缩短至9秒。对石化的敌人以及岩石类敌人生命与架势伤害+40%。'
];
dualCopy.forEach((text,i)=>{const c=DUAL_ASCENSIONS.find(c=>c.id==='d'+(315+i));assert.equal(c.description,text);assert.equal(c.detail,text);});
{const r=setup(),e=enemy(r);e.bossProxy={};r.effects.medusa.cooldown=0;r.effects.updateMedusa(1);assert.equal(r.effects.medusa.cooldown,0);assert.ok(!r.effects.isPetrified(e),'boss hit proxies are not independent targets');}
{const r=setup(),e=enemy(r);r.effects.petrify(e,{gold:true});r.training=false;r.time=100;r.game.p.x=10000;const x=e.x;r.updateLoopWorld();assert.equal(e.x,x,'permanent statues must not teleport with ordinary distant enemies');}
vm.runInThisContext(fs.readFileSync('i18n-en.js','utf8'));for(const c of ASCENSIONS)assert.ok(AshEnglish.cards[c.id],c.id);for(const c of DUAL_ASCENSIONS)assert.ok(AshEnglish.duals[c.id],c.id);
for(const file of ['ascensions.js','combat.js','boss.js','game.js','i18n-en.js'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('Medusa: ranks, cone/facing, ready hold, lullaby, single-hit/BOSS shatter, charged shock, fourth strike, bull shock, drain, armor, gold/XP, rock catalogue, all boss AI, localization and syntax passed.');
