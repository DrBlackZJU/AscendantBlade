/* All boss definitions, encounters, artwork and models.
 * Sections keep private helpers; encounter installation remains explicit. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./motion.js'):root.AshMotion,()=>typeof module==='object'&&module.exports?require('./game.js').VictoryArt:root.AshVictoryArt);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else Object.assign(root,{
  AshBoss:api,AshBossRoster:api.roster,AshFinalBoss:api.final,
  AshBossEncounters:api.encounters,AshBossArt:api.art,AshBossModels:api.models,
  AshHumanBossArt:api.art.human,AshMutantBossArt:api.art.mutant,
  AshAberrantBossArt:api.art.aberrant,AshAbyssBossArt:api.art.abyss
 });
})(globalThis,function(Motion,getVictoryArt){
 'use strict';
const PRIEST_HAND_TIMING={windup:.7,strike:.26,recovery:.5};
const BEHEMOTH_SPIKE_TIMING={windup:.6,warning:.17,emerge:.055,hold:.17,life:.4};
const VACUUM={range:850,contact:85,warning:185,damage:32,pullX:220,pullY:105,cooldown:7};
/* Authored encounter roster. Stable IDs preserve campaign and rush scheduling. */
const Roster=(function(){
 'use strict';
 const m=(name,action,range=180,options={})=>({name,action,range,damage:24,posture:38,wind:.68,active:.28,recovery:.55,pose:'sweep',flags:[],...options});
 const shot=(name,action='shot',options={})=>m(name,action,760,{ranged:true,pose:'bow',wind:.85,...options});
 const skill=(name,action,options={})=>m(name,action,0,{damage:0,posture:0,pose:'cast',cooldown:9,...options});
 const slam=(name,action='melee',options={})=>m(name,action,220,{pose:'overhead',wind:.95,damage:32,...options});
 const charge=(name,action='charge',options={})=>m(name,action,190,{pose:action==='leap'?'leap':'thrust',lunge:680,active:action==='leap'?.58:.48,contactFraction:action==='leap'?.5:.35,wind:.8,...options});
 const guard=(counter=false)=>skill('格挡'+(counter?'反击':''),'guard',{pose:'guard',wind:1.05,cooldown:7,weight:.3,flags:[counter?'parryStance':'guardStance']});
 const rows=[
  ['铁卫','iron_guard','swordShield','fall',[m('军剑挥击','melee'),m('盾面撞击','melee',125,{pose:'shield',posture:55}),guard(true),m('格挡反斩','melee',185,{reactiveOnly:true,wind:.25,flags:['counter']})]],
  ['猎手','hunter','axeCrossbow','fall',[m('短斧斩','melee',150),shot('锁定弩矢','aimShot',{ammoCost:1,speed:1350,wind:1.05}),skill('荒野虚步','cloak',{cooldown:10,minRange:270})],{ammo:3}],
  ['双刃','twin_blade','dual','fall',[m('左刃横斩','melee',175),m('右刃逆切','melee',185,{pose:'reverse',weight:1.5}),charge('掠空跳斩','leap',{pose:'leap',minRange:160})],{speed:140}],
  ['焰刃','flame_blade','flameSword','fall',[m('炎剑挥击','melee'),slam('炎剑劈砍'),m('炎剑突刺','melee',240,{pose:'thrust'}),skill('抚刃燃火','ignite',{wind:1.1,cooldown:12})]],
  ['重锤','war_hammer','hammer','fall',[slam('重锤砸击'),m('横锤挥击','melee',240),charge('负锤冲撞'),m('锤头顶击','melee',160,{pose:'thrust'})]],
  ['屠夫','butcher','hookCleaver','fall',[shot('钩索捕捉','hook',{range:510,damage:0,flags:['bleed'],speed:1120}),m('回身甩钩','hookArc',340,{minRadius:195,lane:160,wind:1.15,pose:'reverse',flags:['bleed']}),m('菜刀剁击','melee',135,{flags:['bleed'],pose:'overhead'})]],
  ['大法师','archmage','archStaff','fall',[m('法杖挥击','melee',175),m('赤焰喷射','flameJet',330,{pose:'thrust',wind:1.05,flags:['burn'],lane:90}),slam('大地震击','quake',{both:true}),shot('奥术三散弹','shot',{shots:3}),shot('空间三断','spaceSlashes',{cooldown:8,wind:1.2}),skill('空间瞬移','blink',{rageOnly:true,cooldown:7})]],
  ['将军','general','sabreMusket','fall',[m('军刀斩','melee',180),shot('火枪射击','aimShot',{range:530,ammoCost:1,speed:1100}),skill('召集部下','soldier',{cooldown:14}),skill('鼓舞','inspire',{cooldown:10})],{ammo:6}],
  ['收尸人','reaper','scythe','fall',[m('死镰大回斩','melee',280,{both:true,flags:['bleed'],wind:.9}),slam('收割劈击','melee',{range:250,flags:['bleed']}),charge('穿身收尸','reaperDash',{flags:['bleed'],cooldown:7}),m('迎魂斩','arrival',245,{reactiveOnly:true,flags:['bleed'],wind:.65})]],
  ['献祭侍从','sacrifice','burningClaws','ashes',[m('燃烧抓击','melee',165,{flags:['burn']}),slam('周身爆燃','quake',{range:240,both:true,flags:['burn']}),slam('最后的献祭','suicide',{range:350,damage:48,hpBelow:.1,flags:['burn'],wind:1.2,pose:'cast'})]],
  ['巨人僵尸','giant_zombie','trunk','stagger',[m('空手拳击','melee',155,{pose:'punch'}),m('树干横扫','melee',300),slam('树干砸击','melee',{range:270}),charge('腐躯冲撞'),m('树干上挥','melee',260,{pose:'uppercut'})]],
  ['探险家','explorer','reliquary','corrupt',[m('法器砸击','melee',155,{pose:'overhead'}),slam('法器震击','quake'),skill('晶匣治疗','heal'),shot('失控晶弹','randomOrb'),skill('升空轰炸','bombard',{cooldown:18,wind:1.1,active:2.8})]],
  ['畸变刀锋','mutant_blade','armBlades','sever',[m('异刃横斩','melee',215),slam('异刃劈砍'),charge('裂肉突进'),m('多臂乱斩','multiArm',220,{wind:.85,active:1.1})],{rageAt:.4}],
  ['穿刺者','impaler','backSpines','fall',[m('爬行撕咬','melee',165),shot('单发骨刺','spineShot'),shot('背刺八方','spineVolley',{wind:1.1,cooldown:4})]],
  ['晶化利爪','crystal_claw','crystalClaws','crystal',[m('晶爪钩击','melee',205),slam('晶爪重劈'),charge('碎晶扑杀','leap')]],
  ['冠军','champion','greatsword','defiant',[m('踢击','melee',135,{pose:'kick'}),slam('巨剑劈斩','melee',{range:270}),m('巨剑挥斩','melee',290),m('旋风斩','quake',280,{both:true,pose:'spin',wind:1}),slam('巨剑重斩','melee',{damage:42,wind:1.3,range:310}),guard()]],
  ['垂死者','dying','chestSword','impale',[m('直拳','melee',180,{pose:'punch',beforeRage:true}),m('上勾拳','melee',160,{pose:'uppercut',beforeRage:true}),m('巨掌扇击','melee',220,{beforeRage:true}),slam('双拳砸击','melee',{beforeRage:true}),charge('身体撞击','charge',{beforeRage:true}),m('拔剑挥击','melee',260,{rageOnly:true}),slam('垂死劈斩','melee',{rageOnly:true,range:290}),shot('贯胸飞剑','returnSword',{rageOnly:true,cooldown:10,range:620,wind:1.1})]],
  ['瘟疫使者','plague','plagueClaws','fall',[m('疫爪挥击','melee',190,{flags:['poison']}),slam('疫爪劈击','melee',{flags:['poison']}),charge('疫躯扑击','leap',{flags:['poison'],weight:.7}),shot('中毒炮弹','lob',{flags:['poison']}),skill('召唤自爆僵尸','plagueZombies',{cooldown:12}),shot('瘟疫毒球','plagueOrb',{flags:['poison'],speed:85,damage:22,cooldown:9,projectile:'plagueOrb'})],{speed:126}],
  ['飞蛾','moth','shadowWings','moths',[m('暗翼切割','melee',200),charge('暗蛾突进'),skill('掠影','sidestep',{cooldown:6}),shot('鳞粉暗弹'),skill('双蛾离析','split',{cooldown:19,wind:1})],{speed:150}],
  ['巨大浮囊','bladder','plagueSac','burst',[shot('毒素子弹','shot',{flags:['poison']}),shot('毒爆炮弹','lob',{flags:['poison']}),m('囊体撞击','melee',180),slam('毒素爆发','quake',{flags:['poison']})],{speed:43}],
  ['利爪兽','claw_beast','hookBeast','beast',[m('钩爪撕击','melee',205),m('钩爪拉扯','melee',245,{flags:['pull']}),charge('低伏扑击','leap',{wind:.7,active:.46,recovery:.43,lunge:950}),skill('贴地疾走','sidestep',{cooldown:5}),slam('遁地破土','burrow',{cooldown:10,engageRange:850,flags:['burrowStrike']})]],
  ['堡垒','fortress','fourLegBastion','collapse',[slam('前足践踏','quake'),m('石臂横扫','melee',260),slam('双臂砸击','melee',{range:240}),charge('堡垒冲撞','charge',{active:.65})],{speed:62}],
  ['蜘蛛女皇','spider_queen','royalSpider','spider',[m('毒牙刺击','melee',190,{flags:['poison']}),charge('毒躯扑击','leap',{flags:['poison'],wind:.68,active:.46,recovery:.44,lunge:950}),shot('女皇毒弹','shot',{flags:['poison']}),shot('铺网','web'),skill('孵化蛛群','spiders',{cooldown:13}),skill('蛛丝天降','spiderDrop',{rageOnly:true,cooldown:13,active:2.2})]],
  ['洪钟','great_bell','cathedralBell','bell',[charge('钟体撞击'),m('沉钟晃击','melee',240,{both:true}),shot('追魂连鸣','soundTrack',{cooldown:7,wind:1.1})]],
  ['嚼食者','chewer','spineMaw','fall',[slam('嚼骨重压','melee',{damage:40,range:290,wind:1.25}),m('巨口横噬','melee',280,{wind:1.1,damage:36}),charge('巨躯冲撞'),m('长舌牵引','tongue',480,{flags:['pull']}),skill('吞食濒死同伴','eatAlly',{cooldown:6})],{speed:48}],
  ['怨念','resentment','spectralHeap','void',[m('残肢拍击','melee',220),slam('念力爆发','quake',{range:270}),shot('念力炮弹'),skill('深渊双触','tentacles',{cooldown:5}),shot('念力投掷','throwAlly',{cooldown:9})]],
  ['受印祭司','marked_priest','ghostPriest','voidFire',[m('祭杖敲击','melee',180),skill('邪印治疗','heal'),shot('毒素炮弹','lob',{flags:['poison']}),skill('邪印瞬移','blink',{cooldown:8})]],
  ['恶魔水母','demon_jelly','spikedJelly','tentacles',[m('近身触须','melee',180),m('伸展触须','melee',355,{pose:'thrust',flags:['pull']}),slam('八方触手','eightPull',{range:400}),shot('恶魔暗弹'),skill('虚化','phase',{cooldown:13})]],
  ['梦魇','nightmare','spectralClaws','dissolve',[m('暗灵爪击','melee',195),charge('背影爪袭','backDash'),skill('梦境闪现','blink',{cooldown:4,instant:true,wind:0,active:0,recovery:0}),charge('噩梦追魂','nightmareHunt',{rageOnly:true,cooldown:12,active:1.1,wind:1.25})],{speed:157.5}],
  ['地狱犬','hell_hound','threeHounds','beast',[m('左首撕咬','melee',190),m('右首噬咬','melee',210,{pose:'reverse'}),slam('中首重噬','melee'),charge('三首扑击','leap'),m('甩尾','melee',210,{both:true}),shot('三首炎弹','shot',{shots:3,flags:['burn']})],{speed:118}],
  ['亵渎石碑','profane_obelisk','hexMonolith','stones',[m('环石抽击','melee',235),slam('环石砸击'),shot('虚空光束轰地','groundBeam'),shot('层叠虚空炮','voidWaves'),shot('锁定虚空射线','ray',{wind:1.2}),skill('引爆不洁石碑','detonateObelisk',{cooldown:14})],{speed:48}],
  ['无底坑','bottomless','portalBody','swallow',[m('深渊肢击','melee',220),shot('虚空三散射','shot',{shots:3}),skill('门中蝗群','locusts',{cooldown:13}),m('传送门吸引','vacuum',VACUUM.range,{wind:1,active:2.4,contactFraction:0,cooldown:VACUUM.cooldown,pose:'cast'})]],
  ['贝希摩斯','behemoth','abyssLeviathan','beast',[m('巨刺贯穿','melee',320,{pose:'thrust'}),m('触手横鞭','melee',340,{flags:['pull']}),slam('深渊重压','quake',{range:300}),shot('虚空炸弹','lob',{projectile:'voidBomb'})],{speed:57}]
 ];
 const combo=(name,second='thrust',options={})=>m(name,'combo',200,{active:.95,contactFraction:.15,secondPose:second,secondAt:.48,...options});
 const extra={
 iron_guard:[m('军剑刺击','melee',235,{pose:'thrust'}),combo('军剑二连击')],
 hunter:[m('弩重击','melee',145,{pose:'offhand',weapon:'crossbow'}),m('斧横挥','melee',190),combo('斧头二连击','overhead')],
 twin_blade:[m('单次旋风斩','quake',230,{pose:'spin',both:true,weight:1.5}),m('上挑切击','melee',200,{pose:'uppercut',weight:1.5})],
 flame_blade:[slam('蓄力斩','melee',{wind:1.45,damage:32,range:275,fireballs:3})],
 war_hammer:[m('脚踢','melee',145,{pose:'kick',unarmed:true})],
 butcher:[m('近身钩击','melee',165,{weapon:'hook',flags:['bleed']}),slam('菜刀猛剁','melee',{wind:1.25,active:.4,damage:40,range:175})],
 general:[m('军刀刺','melee',230,{pose:'thrust'}),charge('军刀突刺'),m('匆忙挥击后撤','retreatSlash',185,{wind:.35,pose:'sweep'})],
 reaper:[m('镰刀上挑','melee',255,{pose:'uppercut'}),skill('标记猎物','markPrey',{wind:.85,cooldown:12,pose:'point'})],
 sacrifice:[m('背后喷焰','rearFlame',330,{behindOnly:true,cooldown:5,wind:.9,flags:['burn'],pose:'rear'}),m('爪刺','melee',210,{pose:'thrust',flags:['burn']}),combo('双重爪击','uppercut',{flags:['burn']})],
 mutant_blade:[m('异刃刺击','melee',260,{pose:'thrust'})],
 impaler:[slam('起身砸击'),charge('扑咬','leap',{pose:'bite'}),m('爪击','melee',190)],
 crystal_claw:[combo('双重爪击','reverse',{range:235}),m('旋风爪击','quake',260,{pose:'spin',both:true})],
 bladder:[m('触手鞭击','melee',310,{pose:'whip'})],
 claw_beast:[charge('高跳扑击','leap',{wind:1.1,active:.65,recovery:.46,lunge:950,jumpHeight:125}),skill('短步后撤','shortBackstep',{wind:.22,active:.16,recovery:.28,cooldown:4,maxRange:260,pose:'retreat'}),m('近身撕咬','melee',160,{pose:'bite',wind:.4,active:.18,recovery:.35,damage:22})],
 fortress:[slam('重踏','quake',{pose:'stomp',range:280,wind:1.2}),slam('短跃震击','bastionHop',{pose:'leap',range:250,engageRange:650,wind:.65,active:.5,recovery:.55,contactFraction:.8,cooldown:6})],
 great_bell:[charge('短距漂移','charge',{lunge:260,active:.4,pose:'sweep'}),slam('震地','quake',{range:270})],
 chewer:[charge('小跳踏地','leap',{lunge:180,active:.55,jumpHeight:28,pose:'stomp'})],
 resentment:[combo('残肢挥击接冲撞','thrust',{secondLunge:150})],
 demon_jelly:[m('触手电击','melee',320,{pose:'electric',flags:['slow']})],
 nightmare:[m('爪刺','melee',235,{pose:'thrust'}),m('上挑','melee',210,{pose:'uppercut'})],
 bottomless:[charge('短距冲撞','charge',{lunge:330,active:.4}),slam('践踏','quake',{pose:'stomp'})],
 behemoth:[m('深渊撕咬','melee',260,{pose:'bite',damage:38})]
 };
 for(const row of rows){row[4].push(...(extra[row[1]]||[]));if(['general','reaper'].includes(row[1]))row[5]={...row[5],speed:115.5};if(row[1]==='claw_beast')row[4].find(a=>a.action==='burrow').range=264;if(row[1]==='profane_obelisk')row[4].push(skill('召唤亵渎石碑','summonObelisk',{cooldown:15,wind:1.05}));if(row[1]==='twin_blade')Object.assign(row[4][2],{action:'jumpThrust',lunge:0,active:.8,contactFraction:.72,pose:'dualThrust'});if(row[1]==='war_hammer')for(const a of row[4])if(!a.unarmed&&a.damage>0){a.range*=1.2;a.lane=100;}}
 function apply(bosses){rows.forEach((r,i)=>{const group=Math.floor(i/9),j=i%9,tier=Math.floor(j/3),slot=j%3,e=bosses.find(b=>b.group===group&&b.tier===tier&&b.slot===slot);if(!e)throw Error('Missing boss slot '+i);const [name,bossKind,weapon,deathStyle,moves,opts={}]=r;Object.assign(e,{name,bossKind,weapon,deathStyle,art:'boss_'+bossKind,bodyPlan:'boss',humanoid:group===0||[9,10,11,12,14,15,16,17,26].includes(i),scale:1.4,reach:260,speed:105,ammo:Infinity,mana:null,hybrid:true,ranged:moves.some(m=>m.ranged),armor:true,flags:['armor'],revives:false,rageAt:.5,core:moves.map(m=>m.name).join('、'),...opts});e.morphology=e.humanoid?'humanoid':'nonhumanoid';e.moves=moves.map((a,k)=>({...a,key:e.id+'_m'+(k+1),bossMove:true,lane:a.lane||75,flags:[...a.flags],damage:a.damage?(a.damage+group*3+tier*2):0}));});}
 return {apply,rows};
})();

/* Four-arm encounter timelines. Shared by campaign and Boss Rush; simulation only. */
const FinalBoss=(function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const bow=[
  ['近身弓刃二连','sweep',.62,.94,210,26],['紫狱刃环','spin',.65,.3,255,32],
  ['散矢遁影','bow',.5,.35,850,25],['错拍连珠','bow',.45,1.65,1000,25],
  ['灭星炮','bow',.65,.28,1600,45],['天坠魔雨','bow',.85,.6,1100,32],
  ['追魂冥矢','bow',.55,.3,1100,32],['空间断章','spell',.9,.3,1600,34]
 ];
 const master=[
  ['剑斧交织','sweep',.65,1.98,245,28],['蓄斧镇杀','overhead',.4,.25,270,46],
  ['裂隙枪突','thrust',.75,.45,410,35],['背影双刃','dagger',.65,.78,180,27],
  ['十方旋风','spin',.85,2.5,285,24],['陨斧震地','leap',.42,.8,300,42],
  ['三枚飞刃','throw',.65,.55,950,25],['长剑斩刺','sword',.65,.96,275,31],
  ['三叠贯星','spear',.75,1.54,400,32]
 ];
 function moves(slot,id){return (slot?master:bow).map((m,i)=>({key:id+'_m'+(i+1),name:m[0],pose:m[1],wind:m[2],active:m[3],range:m[4],damage:m[5],posture:38,recovery:.55,lane:65,both:m[1]==='spin',flags:[],finalIndex:i+1}));}
 // One source of truth for bone poses, warnings, VFX and damage contacts.
 const CONTACTS={bow:{1:[.04,.62],2:[.04],3:[.02],5:[.01],6:[.02],7:[.02],8:[.01]},master:{1:[.04,.60,1.16,1.72],3:[.09],4:[.04,.49],5:Array.from({length:10},(_,i)=>.02+i*.25),6:[.53],7:[.02,.18,.34],8:[.04,.65],9:[.06,.58,1.22]}};
 function contacts(slot,n){return (slot?CONTACTS.master:CONTACTS.bow)[n]||[];}
 function cue(e,slot){
  const a=e?.attack;if(!a||!['windup','active'].includes(e.state))return null;
  const n=a.finalIndex,t=e.state==='windup'?e.t-(a.wind||.6):e.t,times=contacts(slot,n);
  let i=times.findIndex((v,j)=>t<Math.min(v+.16,(times[j+1]??Infinity)-.17));if(i<0)return null;
  const until=times[i]-t,kind=!slot?(n===1?'claw':n===2?'ring':n===5?'laser':'cast'):n===1?(i%2?'axe':'sword'):n===3||n===9?'spear':n===4?'dagger':n===5?'spin':n===6?'leap':n===8?(i?'swordThrust':'sword'):'cast';
  const start=i?times[i-1]+.18:-(a.wind||.6),raise=clamp((t-start)/Math.max(.01,times[i]-.07-start),0,1),swing=clamp((.07-until)/.07,0,1);
  return {kind,index:i,until,raise,swing,red:until>0&&until<=.17,strike:until<=0&&until>-.16};
 }
 function install(C){
  const P=C.Game.prototype,oldStep=P.enemyStep,oldBegin=P.beginEnemyMove,oldPick=P.chooseSequence,oldProjectile=P.projectileStep,oldPerfect=P.resolvePerfectBlock,oldKill=P.kill;
  for(const spec of C.ENEMY_CATALOG.BOSSES.filter(s=>s.final)){
   const t=C.TYPES[spec.id];t.slot=spec.slot;t.reach=spec.slot?490:1100;spec.moves=moves(spec.slot,spec.id);t.moveKeys=spec.moves.map(m=>m.key);for(const m of spec.moves)C.MOVES[m.key]=m;
   spec.core=t.core=spec.slot?'四臂武器大师；左上长剑、左下长枪、右上巨斧、右下短剑。':'四臂冥弓；下双手共持巨弓，上双手拉弦。';
  }
  function updateEnrage(g,e){
   if(e.dead||e.enraged)return;
   if(e.hp<=e.maxHp*.5||g.enemies.some(other=>other!==e&&C.TYPES[other.type]?.final&&C.TYPES[other.type].slot!==C.TYPES[e.type].slot&&other.dead)){
    e.enraged=true;g.emit('enrage',{x:e.x,y:e.y,type:e.type});
   }
  }
  P.kill=function(e,kind){oldKill.call(this,e,kind);if(e.dead&&C.TYPES[e.type]?.final)for(const other of this.enemies)if(C.TYPES[other.type]?.final)updateEnrage(this,other);};
  P.chooseSequence=function(e){
   if(!C.TYPES[e.type]?.final)return oldPick.call(this,e);
   updateEnrage(this,e);
   const slot=C.TYPES[e.type].slot,near=Math.hypot(e.x-this.p.x,(e.y-this.p.y)*1.5)<260;
   let i;
   if(!slot&&near){i=1+((e.nearCycle||0)%3);e.nearCycle=(e.nearCycle||0)+1;}
   else {const pool=slot?(e.enraged?[1,2,3,4,5,6,7,8,9]:[2,3,4,6,7,8,9]):(e.enraged?[4,5,6,7,8]:[4,6,7]);i=pool[e.cycle++%pool.length];}
   return [e.type+'_m'+i];
  };
  P.beginEnemyMove=function(e,key){if(C.TYPES[e.type]?.final){updateEnrage(this,e);const slot=C.TYPES[e.type].slot,n=C.MOVES[key]?.finalIndex;if(!e.enraged&&(slot?[1,5].includes(n):[5,8].includes(n)))key=e.type+'_m'+(slot?8:4);}oldBegin.call(this,e,key);if(!C.TYPES[e.type]?.final)return;e.attack.wind=C.MOVES[key].wind;e.attack.active=C.MOVES[key].active;e.finalClock=0;e.finalHits=0;e.finalWarnHit=-1;e.finalLines=[];e.finalVFX=[];e.finalBursts=3+Math.floor(this.random()*3);e.finalShotTimes=Array.from({length:e.finalBursts},(_,i)=>i===0?0:.19+this.random()*.16);for(let i=1;i<e.finalShotTimes.length;i++)e.finalShotTimes[i]+=e.finalShotTimes[i-1];e.finalOrigin={x:e.x,y:e.y};const n=e.attack.finalIndex;if(C.TYPES[e.type].slot&&(n===3||n===4)){e.blinkFrom={x:e.x,y:e.y,t:this.time};e.x=this.p.x+(n===4?-this.p.face:Math.sign(e.x-this.p.x)||1)*(n===4?115:350);e.y=this.p.y;e.face=Math.sign(this.p.x-e.x)||1;this.emit('finalAttackCue',{x:e.x,y:e.y,z:90,name:n===4?'背后 · 双刃':'同列 · 枪突'});}if(C.TYPES[e.type].slot&&n===2)e.axeCharge={t:1.65,duration:1.65,damage:e.attack.damage};};
  function strikeFX(g,e,kind,index){
   const fx={kind,index,x:e.x,y:e.y,face:e.face,at:g.time,radius:e.attack?.range||270};
   (e.finalVFX||(e.finalVFX=[])).push(fx);e.finalVFX=e.finalVFX.filter(v=>g.time-v.at<.7);
   g.emit('finalStrike',{...fx,slot:C.TYPES[e.type].slot});
  }
  function hit(g,e,range,lane=68,both=false,damage=e.attack.damage){const p=g.p,extra=g.guardActive()?g.rules.guardReachX:0,dx=(p.x-e.x)*e.face;if((both?Math.abs(dx)<=range+extra:dx>=-35-extra&&dx<=range+extra)&&Math.abs(p.y-e.y)<=lane+(g.guardActive()?g.rules.guardReachY:0)&&p.z<140)return g.receiveHit(damage,e,null);return 'miss';}
  function arrow(g,e,angle=0,speed=730,extra={}){const master=C.TYPES[e.type].slot===1,sx=e.x+e.face*(master?95:145),sz=master?182:265,dx=g.p.x-sx,dy=g.p.y-e.y,a=Math.atan2(dy,dx)+angle,flight=Math.max(.15,Math.hypot(dx,dy)/speed);g.projectiles.push({x:sx,y:e.y,z:sz,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,vz:(g.p.z+45-sz)/flight,life:4,owner:e.id,reflected:false,damage:e.attack.damage,moveKey:e.moveKey,finalArrow:true,trail:[],...extra});g.emit('arrow',{x:sx,y:e.y});}
  function lineHit(g,e,line,width=24){const p=g.p,dx=p.x-line.x,dy=p.y-line.y,along=dx*Math.cos(line.a)+dy*Math.sin(line.a),cross=Math.abs(-dx*Math.sin(line.a)+dy*Math.cos(line.a));if(Math.abs(along)<1800&&cross<width+(g.guardActive()?20:0)&&p.z<150)g.receiveHit(e.attack.damage,e,null);}
  P.enemyStep=function(e,dt){
   if(!e.dead&&(e.medusaGold||e.medusaUntil>this.time))return oldStep.call(this,e,dt);
   if(!C.TYPES[e.type]?.final)return oldStep.call(this,e,dt);
   updateEnrage(this,e);
   if(e.dead){e.axeCharge=null;e.finalLines=[];e.finalRain=[];return oldStep.call(this,e,dt);}
   if(e.axeCharge&&!['stunned','active'].includes(e.state)&&!e.timeSealT){e.x+=Math.sign(this.p.x-e.x)*55*dt;e.y+=clamp(this.p.y-e.y,-35,35)*dt;}
   // Persistent secondary axe timer runs alongside locomotion and other moves.
   if(e.axeCharge&&e.state!=='stunned'&&!(e.spawnDelay>0)&&!e.timeSealT){e.axeCharge.t-=dt;if(e.axeCharge.t<=0){strikeFX(this,e,'axe',1);const saved=e.attack;e.attack={...saved,posture:52};hit(this,e,275,90,true,e.axeCharge.damage);e.attack=saved;e.axeImpact=this.time;this.emit('finalImpact',{x:e.x,y:e.y,radius:180,color:'#dc65ff'});e.axeCharge=null;}}
   if(e.finalRain){for(const b of e.finalRain){b.t-=dt;if(b.t<=0&&!b.done){b.done=true;if(Math.hypot(this.p.x-b.x,(this.p.y-b.y)*1.8)<b.r&&this.p.z<110)this.receiveHit(b.damage,e,null);this.emit('finalHoly',{x:b.x,y:b.y,radius:b.r,color:'#b76cff'});}}e.finalRain=e.finalRain.filter(b=>b.t>-.3);}
   if(e.state!=='windup'&&e.state!=='active')return oldStep.call(this,e,dt);
   if(e.timeSealT>0||e.sleepT>0)return;
   e.knockX*=Math.exp(-7*dt);e.x+=e.knockX*dt;e.flash=Math.max(0,e.flash-dt);e.red=Math.max(0,e.red-dt);e.sinceHit+=dt;
   const a=e.attack,n=a.finalIndex,slot=C.TYPES[e.type].slot,p=this.p;e.finalClock+=dt;e.t+=dt;
   if(e.state==='windup'){
    if((!slot&&[4,5,7,8].includes(n))||(slot&&n===6)){const gap=Math.abs(p.x-e.x);e.moving=gap>620;if(e.moving){e.x+=Math.sign(p.x-e.x)*100*dt;e.y+=clamp(p.y-e.y,-50,50)*dt;e.walkDistance=(e.walkDistance||0)+100*dt;}}
    if(e.t<a.wind-.17&&(!slot||n!==8)){e.targetX=p.x;e.targetY=p.y;e.face=Math.sign(p.x-e.x)||1;}
    if(!slot&&n===8){while(e.finalLines.length<6&&e.t>=e.finalLines.length*.13){e.finalLines.push({x:p.x,y:p.y,a:this.random()*Math.PI});}}
    if(a.wind+(contacts(slot,n)[0]||0)-e.t<=.17&&!e.redDone&&!(slot&&[2,6].includes(n))){e.redDone=true;e.red=.17;this.emit('warning',{x:e.x,y:e.y,z:110});}
    if(e.t>=a.wind){e.state='active';e.t=0;e.finalHits=0;}return;
   }
   const t=e.t,once=(times,fn)=>{const next=times[e.finalHits];if(next>t&&next-t<=.17&&e.finalWarnHit!==e.finalHits){e.finalWarnHit=e.finalHits;e.red=.17;this.emit('warning',{x:e.x,y:e.y,z:110});}while(e.finalHits<times.length&&t>=times[e.finalHits]){const k=e.finalHits++;e.finalStrikeAt=this.time;fn(k);}};
   if(!slot){
    if(n===1)once(contacts(slot,n),k=>{strikeFX(this,e,'claw',k);hit(this,e,210);});
    if(n===2)once(contacts(slot,n),()=>{strikeFX(this,e,'ring',0);const r=hit(this,e,255,105,true);if(['hit','block','block-reflect'].includes(r)){p.x+=Math.sign(p.x-e.x||e.face)*30;if(r==='hit')p.knock=Math.sign(p.x-e.x||e.face)*230;}});
    if(n===3)once([.02],()=>{[-.16,0,.16].forEach(v=>arrow(this,e,v));e.blinkFrom={x:e.x,y:e.y,t:this.time};e.x-=e.face*360;e.blinkFrom.toX=e.x;e.blinkFrom.toY=e.y;this.emit('dash',{x:e.x,y:e.y,z:0});});
    if(n===4)once(e.finalShotTimes,()=>arrow(this,e,(this.random()-.5)*.07));
    if(n===5)once([.01],()=>{const l={x:e.x,y:e.y,a:Math.atan2(e.targetY-e.y,e.targetX-e.x)};e.laser=l;lineHit(this,e,l,25);});
    if(n===6)once([.02],()=>{e.finalRain=Array.from({length:12},(_,i)=>({x:p.x+(this.random()-.5)*850,y:clamp(p.y+(this.random()-.5)*270,415,685),r:66,t:.85+this.random()*1.5,damage:a.damage}));});
    if(n===7)once([.02],()=>arrow(this,e,0,282,{homing:true,life:5}));
    if(n===8)once([.01],()=>{for(const l of e.finalLines)lineHit(this,e,l,19);});
   }else{
    if(n===1)once(contacts(slot,n),k=>{strikeFX(this,e,k%2?'axe':'sword',k);hit(this,e,245);});
    if(n===2)once([.02],()=>{});
    if(n===3){e.x+=e.face*620*dt;once(contacts(slot,n),k=>{strikeFX(this,e,'spear',k);hit(this,e,410);});}
    if(n===4)once(contacts(slot,n),k=>{strikeFX(this,e,'dagger',k);hit(this,e,180);});
    if(n===5){e.x+=Math.sign(p.x-e.x)*80*dt;once(contacts(slot,n),k=>{strikeFX(this,e,'spin',k);hit(this,e,285,105,true);});}
    if(n===6){const q=clamp(t/.52,0,1);e.x=e.finalOrigin.x+(e.targetX-e.finalOrigin.x)*q;e.y=e.finalOrigin.y+(e.targetY-e.finalOrigin.y)*q;e.z=Math.sin(q*Math.PI)*185;once(contacts(slot,n),()=>{e.z=0;strikeFX(this,e,'axe',0);hit(this,e,300,115,true);e.shockAt=this.time;this.emit('finalImpact',{x:e.x,y:e.y,radius:300,color:'#ff3e58'});});}
    if(n===7)once([.02,.18,.34],()=>arrow(this,e,0,830,{dagger:true}));
    if(n===8){if(t>.58&&t<.8)e.x+=e.face*250*dt;once(contacts(slot,n),k=>{strikeFX(this,e,k?'swordThrust':'sword',k);hit(this,e,k?275:220);});}
    if(n===9){if(t>1.14&&t<1.42)e.x+=e.face*750*dt;once(contacts(slot,n),k=>{strikeFX(this,e,'spear',k);hit(this,e,400,58);});}
   }
   if(!this.loopWorld)e.x=clamp(e.x,this.bounds.left+20,this.bounds.right-20);e.y=clamp(e.y,410,685);
   if(e.state==='active'&&t>=a.active){e.z=0;if(e.finalBreakPending){e.finalBreakPending=false;e.state='stunned';e.stun=e.stunMax=this.postureBreakDuration(e);e.t=0;}else this.recoverEnemy(e,a.recovery);e.cd=.24;}
  };
  P.resolvePerfectBlock=function(e,arrow,options){const final=e&&!e.dead&&C.TYPES[e.type]?.final&&e.state==='active',spinning=final&&C.TYPES[e.type].slot===1&&e.attack?.finalIndex===5,saved=final?{state:e.state,t:e.t,attack:e.attack,finalHits:e.finalHits,queue:e.queue.slice()}:null;const result=oldPerfect.call(this,e,arrow,options);if(saved&&!e.dead&&(spinning||e.state!=='stunned')){if(spinning&&e.state==='stunned')e.finalBreakPending=true;Object.assign(e,saved);if(spinning)e.knockX=Math.sign(e.x-this.p.x||-this.p.face)*650;}return result;};
  P.projectileStep=function(dt){for(const b of this.projectiles){if(!b.finalArrow||b.life<=0)continue;b.trail.push({x:b.x,y:b.y,z:b.z});if(b.trail.length>(b.homing?42:18))b.trail.shift();if(b.homing&&!b.reflected){const a=Math.atan2(this.p.y-b.y,this.p.x-b.x),old=Math.atan2(b.vy,b.vx),delta=Math.atan2(Math.sin(a-old),Math.cos(a-old)),next=old+clamp(delta,-1.7*dt,1.7*dt);b.vx=Math.cos(next)*282;b.vy=Math.sin(next)*282;b.vz=(this.p.z+45-b.z)*5;if(b.life<=dt)this.emit('finalImpact',{x:b.x,y:b.y,radius:38,color:'#ad68ff'});}}return oldProjectile.call(this,dt);};
 }
 return {install,moves,contacts,cue};
})();

/* Ordinary bosses own their actions, phase state and independently timed hazards. */
const Encounters=(function(){
 'use strict';
 function install({Game,TYPES,MOVES,distance,clamp}){
 const P=Game.prototype,wrap=(key,fn)=>{const old=P[key];P[key]=function(...args){return fn.call(this,old,...args);};};
 const kind=e=>TYPES[e?.type]?.bossKind,controlled=e=>e.timeSealT>0||e.sleepT>0||e.furnaceCapture||e.mindControlT>0||['stunned','knockdown','flinch'].includes(e.state);
 const blocked=r=>['block','parry','block-reflect','immune','evade'].includes(r);
 function init(e){e.bossKind=kind(e);if(e.bossState)return e.bossState;return e.bossState={clock:0,cd:{},spines:8,regrow:0,armor:true,armorLoss:0,damage:0,rageDamage:0,sacLoss:0,cloud:2,rocket:3,hammer:4,spikes:3,ghost:3,arms:2,arrival:kind(e)==='reaper',spawned:0};}
 function tempo(g,e,a=e.attack){
  const k=kind(e),s=init(e),raged=e.enraged||e.hp<=e.maxHp*(TYPES[e.type].rageAt??.5);
  const rates={champion:1.1,twin_blade:1.12,chewer:1.1,nightmare:1.2,spider_queen:1.1,behemoth:1.1,claw_beast:1.18,bladder:1.1,profane_obelisk:1.06,explorer:1.08};
  e.bossActionSpeed=rates[k]||1;
  if(k==='mutant_blade'){s.arms=e.hp/e.maxHp<=.5?4:e.hp/e.maxHp<=.75?3:2;e.bossActionSpeed=1+(s.arms-2)*.06+(raged?.08:0);e.bossMoveSpeed=e.bossActionSpeed;}
  if(k==='dying'){e.bossActionSpeed=raged?1:1.1;e.bossMoveSpeed=raged?1.2:1;}
  if(k==='bottomless')e.bossActionSpeed=distance(e,g.p)<=250?1.25:1.1;
  if(k==='plague'&&a?.action==='melee')e.bossActionSpeed=1.14;
 }
 function fx(g,e,type,props={}){g.bossEffects??=[];const f={type,owner:e,x:e.x,y:e.y,delay:.65,life:.35,age:0,radius:190,damage:24,flags:[],...props};g.bossEffects.push(f);return f;}
 function hit(g,e,a,shape={}){if(!(a.damage>0))return 'miss';const p=g.p,guard=g.guardActive(),dx=(p.x-(shape.x??e.x))*e.face,dy=p.y-(shape.y??e.y),r=shape.radius??a.range,radial=Math.hypot(dx,dy*1.6);let inside=shape.radial?radial<r+(guard?18:0):(a.both?Math.abs(dx)<r:dx>-(guard?45:30)&&dx<r+(guard?g.rules.guardReachX:0))&&Math.abs(dy)<(a.lane||75)+(guard?g.rules.guardReachY:0),heightOK=p.z<(shape.height||135);if(shape.minRadius&&radial<shape.minRadius)inside=false;if(shape.arc&&dx<0)inside=false;
  if(kind(e)==='war_hammer'&&!a.unarmed&&!shape.radial){const h=hammerHead(e,g.time),rx=(e.scale||1)*85*(a.hammerRadiusScale||1),ry=a.lane||100,rz=(e.scale||1)*45;e.hammerContact={...h,rx,ry,rz};inside=((p.x-h.x)/(rx+(guard?g.rules.guardReachX:0)))**2+((p.y-h.y)/(ry+(guard?g.rules.guardReachY:0)))**2<1;heightOK=p.z<h.z+rz&&p.z+100>h.z-rz;}
  if(!inside||!heightOK){if(!shape.quietMiss)g.trigger('onEnemyAttackMiss',{enemy:e,move:a});return 'miss';}
  const result=g.receiveHit(a.damage,e,null);g.resolveEnemyMoveSpecial(e,a,result);return result;
 }
 function shoot(g,e,a,angle=0,opts={}){const x=opts.x??e.x+e.face*40,y=opts.y??e.y,tx=opts.tx??g.p.x,ty=opts.ty??g.p.y,speed=a.speed||650,t=Math.atan2(ty-y,tx-x)+angle;
  const b={bossProjectile:true,bossStage:TYPES[e.type].stage,originX:e.x,originY:e.y,x,y,z:48,vx:Math.cos(t)*speed,vy:Math.sin(t)*speed,vz:0,life:2.5,owner:e.id,reflected:false,damage:a.damage,flags:a.flags||[],moveKey:a.key||e.moveKey,projectile:a.projectile||'bossOrb',...opts};g.projectiles.push(b);return b;
 }
 function volley(g,e,a,count=a.shots||1){for(let i=0;i<count;i++)shoot(g,e,a,(i-(count-1)/2)*.19);}
 function lob(g,e,a,x=g.p.x,y=g.p.y){return shoot(g,e,a,0,{bomb:true,sx:e.x,sy:e.y,x:e.x,y:e.y,tx:x,ty:y,flight:.9,age:0,startZ:65,z:65,radius:76,poison:a.flags?.includes('poison'),life:3,vx:0,vy:0});}
 function children(g,e){return g.enemies.filter(o=>o!==e&&!o.dead&&o.summonerId===e.id);}
 function summon(g,e,type,count=1,cap=6){const made=[];for(let i=0;i<count&&children(g,e).length<cap;i++){const c=g.spawnEnemyMinion(e,type,e.x+(i%2?-1:1)*(85+30*i),e.y+(i%2?25:-25));made.push(c);}return made;}
 function friends(g,e){return g.enemies.filter(o=>o!==e&&!o.dead&&!o.spawnDelay&&!o.bossProxy);}
 function edibleAllies(g,e,hpBelow=.5){return friends(g,e).filter(o=>!TYPES[o.type].boss&&o.hp<o.maxHp*hpBelow&&distance(e,o)<500);}
 function blink(g,e,near=170){e.bossBlink={x:e.x,y:e.y,at:g.time};const side=g.random()<.5?-1:1;e.x=g.p.x+side*(near*.65+g.random()*near*.55);e.y=clamp(g.p.y+(g.random()-.5)*90,415,680);if(!g.loopWorld)e.x=clamp(e.x,g.bounds.left+35,g.bounds.right-35);e.face=Math.sign(g.p.x-e.x)||1;fx(g,e,'portal',{delay:0,damage:0,life:.5});}
 function nightmareBlink(g,e,a){
  if(e.dead||e.spawnDelay>0||controlled(e)||g.p.stealth||distance(e,g.p)>=700||!g.bossMoveAllowed(e,a))return false;
  const s=init(e);blink(g,e);s.cd[a.key]=s.clock+a.cooldown;return true;
 }
 function action(g,e,a){const s=init(e),k=kind(e),p=g.p;let f=a.flags||[];
  if(k==='flame_blade'&&s.lit>s.clock&&['melee','charge'].includes(a.action)){a={...a,flags:[...f,'burn']};volley(g,e,{...a,speed:480,projectile:'fireball'},a.fireballs||(e.enraged?2:1));}
  if(k==='war_hammer'&&s.charged&&a.damage>0&&!a.unarmed){s.charged=false;s.hammer=s.clock+(e.enraged?4:8);a={...a,damage:a.damage*1.45,range:a.range*1.35,hammerRadiusScale:1.35};const h=hammerHead(e,g.time);fx(g,e,'ring',{x:h.x,y:h.y,delay:.12,radius:a.range+70,damage:a.damage*.5});}
  switch(a.action){
   case 'melee': case 'charge': case 'leap':case 'backDash':hit(g,e,a);break;
   case 'arrival':hit(g,e,a);break;
   case 'combo':hit(g,e,a);s.combo={at:s.clock+a.secondAt,move:a};break;
   case 'jumpThrust':hit(g,e,a);break;
   case 'retreatSlash':hit(g,e,a);s.retreat=s.clock+.28;break;
   case 'markPrey':s.preyUntil=s.clock+5;break;
   case 'rearFlame':{const face=e.face;e.face=-face;hit(g,e,a);fx(g,e,'flame',{delay:0,life:.4,damage:0,face:e.face,radius:a.range});e.face=face;break;}

   case 'guard':break;
   case 'aimShot':shoot(g,e,a,0,{tx:e.targetX,ty:e.targetY,projectile:k==='general'?'musket':'bolt'});break;
   case 'shot':volley(g,e,a);break;
   case 'plagueOrb':shoot(g,e,a,0,{plagueOrb:true,orbAge:0,orbShots:0,nextOrbShot:.65,orbInterval:.8,orbShotDamage:14,hitRadiusX:24,hitRadiusY:22,life:3.2});break;
   case 'randomOrb':shoot(g,e,{...a,flags:[['burn','poison','slow'][Math.floor(g.random()*3)]]});break;
   case 'lob':lob(g,e,a);break;
   case 'hook':fx(g,e,'chainHook',{delay:0,life:.55,tx:e.targetX,ty:e.targetY,damage:a.damage,flags:['bossHook','bleed']});break;
   case 'hookArc':hit(g,e,a,{minRadius:a.minRadius,arc:true,radial:true});break;
   case 'cloak':s.cloak=s.clock+3.5;break;
   case 'phase':s.phase=s.clock+2.4;break;
   case 'ignite':s.lit=s.clock+8;break;
   case 'flameJet':hit(g,e,a);fx(g,e,'flame',{delay:0,life:.65,damage:0,radius:a.range,face:e.face});break;
   case 'quake':case 'burrow':hit(g,e,a,{radial:true});fx(g,e,'ring',{delay:0,damage:0,radius:a.range});break;
   case 'bastionHop':e.z=0;hit(g,e,a,{radial:true});fx(g,e,'ring',{delay:0,damage:0,radius:a.range});g.emit('enemyExplosion',{x:e.x,y:e.y,radius:a.range});break;
   case 'spaceSlashes':for(let i=0;i<3;i++)fx(g,e,'line',{x:p.x,y:p.y,angle:(g.random()-.5)*Math.PI,delay:.4+i*.23,damage:a.damage,length:390});break;
   case 'blink':blink(g,e);break;
   case 'sidestep':s.slide=s.clock+.36;s.slideDir=g.random()<.5?-1:1;break;
   case 'shortBackstep':s.backstep=s.clock+.2;break;
   case 'soldier':summon(g,e,['sword','spear','bow'][Math.floor(g.random()*3)],1,3);break;
   case 'inspire':case 'heal':{const pool=friends(g,e).filter(o=>o.hp<o.maxHp),t=pool[Math.floor(g.random()*pool.length)];if(t){g.healEnemy(t,t.maxHp*.22,{source:'bossHeal',healerType:e.type});if(a.action==='inspire'){t.tempoT=7;t.moveBuff=1.35;t.actionSpeedMultiplier=1.25;}}break;}
   case 'reaperDash':{const x=e.x,y=e.y,toX=p.x+e.face*120,toY=p.y;if(g.segmentContact(x,y,toX,toY,p,55,60))hit(g,e,{...a,range:distance(e,p)+80,lane:100});e.x=toX;e.y=toY;if(e.enraged)fx(g,e,'reverse',{delay:.62,damage:a.damage,flags:['bleed'],radius:270});break;}
   case 'suicide':hit(g,e,a,{radial:true});s.selfDestruct=true;g.tarZones.push({x:e.x,y:e.y,radius:180,life:4.5,maxLife:4.5,burning:true,fireOnly:true,poison:false,friendly:false,owner:e.id});fx(g,e,'suicideBurst',{delay:0,life:.45,damage:0,radius:a.range,allowDead:true});g.emit('enemyExplosion',{x:e.x,y:e.y,radius:a.range});g.emit('sacrificialFlash',{x:e.x,y:e.y,z:70*e.scale,scale:2.25,seed:g.random()*Math.PI*2});g.kill(e,['selfDestruct']);break;
   case 'bombard':s.airStart=s.clock;s.air=s.clock+2.3;for(let i=0;i<6;i++)fx(g,e,'bombardShot',{x:p.x+(g.random()-.5)*450,y:clamp(p.y+(g.random()-.5)*190,415,680),delay:.15+i*.25,damage:22,radius:76});fx(g,e,'dive',{delay:2.1,damage:34,x:e.x,y:e.y,radius:150});break;
   case 'multiArm':hit(g,e,a);for(let i=1;i<s.arms;i++)fx(g,e,'swipe',{delay:i*.23/(e.bossActionSpeed||1),damage:a.damage,flags:a.flags,radius:a.range});break;
   case 'spineShot':shoot(g,e,a,0,{projectile:'boneSpine'});s.spines--;if(!s.spines)s.regrow=s.clock+(e.enraged?4:8);break;
   case 'spineVolley':for(let i=0;i<s.spines;i++)shoot(g,e,a,i*Math.PI*2/s.spines,{projectile:'boneSpine'});s.spines=0;s.regrow=s.clock+(e.enraged?4:8);break;
   case 'returnSword':{const angle=Math.atan2(e.targetY-e.y,e.targetX-e.x),tx=e.x+Math.cos(angle)*620,ty=e.y+Math.sin(angle)*620;s.swordOut=true;fx(g,e,'swordFlight',{delay:0,life:.55,damage:a.damage,sx:e.x,sy:e.y,tx,ty,returning:false});break;}
   case 'plagueZombies':summon(g,e,'explosive_zombie',2,4);break;
   case 'split':{s.split=s.clock+6.5;s.swarmClock=0;s.swarmBeam=0;s.proxies=[-1,1].map(sign=>{const c=g.spawn(e.type,e.x+sign*130,e.y+sign*32);c.hp=c.maxHp=e.hp;c.bossProxy=e;c.summoned=true;c.xpMultiplier=0;c.spawnDelay=0;c.scale=e.scale*.72;return c;});break;}
   case 'web':g.lateZones.push({x:e.targetX,y:e.targetY,life:5,radius:135,kind:'web'});break;
   case 'spiders':summon(g,e,['web_spider','venom_spider','boss_spiderling'][Math.floor(g.random()*3)],2,6);break;
   case 'spiderDrop':s.air=s.clock+1.8;s.dropKids=[];for(let i=0;i<2;i++){const [child]=summon(g,e,g.random()<.5?'web_spider':'venom_spider',1,Infinity);child.bossDropOwner=e;child.dropSide=i?1:-1;child.spawnDelay=0;child.z=160;s.dropKids.push(child);}fx(g,e,'spiderLand',{x:p.x,y:p.y,delay:1.65,damage:38,radius:150,flags:['poison']});break;
   case 'soundTrack':for(let i=0,n=3+Math.floor(g.random()*3);i<n;i++)fx(g,e,'trackSound',{delay:i*.65,damage:a.damage});break;
   case 'tongue':hit(g,e,a);break;
   case 'eatAlly':{const targets=edibleAllies(g,e),t=targets.find(o=>o.hp<o.maxHp*.3)||targets[0];if(t){s.tongueTarget={x:t.x,y:t.y,until:s.clock+.5};g.kill(t,['devour','noDeathrattle']);for(let i=0;i<5;i++)lob(g,e,{...a,damage:30,flags:['poison']},p.x+(i-2)*95,p.y+Math.sin(i*2.4)*48);}break;}
   case 'tentacles':{const n=children(g,e).filter(o=>o.type==='abyss_tentacle').length;summon(g,e,'abyss_tentacle',Math.max(0,2-n),2);break;}
   case 'throwAlly':{let t=g.enemies.find(o=>o.id===s.throwTargetId&&!o.dead&&!TYPES[o.type].boss&&!o.bossThrown);if(!t){const stale=g.enemies.find(o=>o.id===s.throwTargetId);if(stale)stale.bossThrowWarning=false;t=friends(g,e).filter(o=>!TYPES[o.type].boss&&!o.bossThrown).sort((a,b)=>distance(a,e)-distance(b,e))[0];}s.throwTargetId=null;if(t){t.bossThrowWarning=true;t.bossThrown=true;fx(g,e,'thrownAlly',{delay:.45,life:.55,damage:a.damage,sx:t.x,sy:t.y,tx:p.x,ty:p.y,target:t});}break;}
   case 'eightPull':{const dx=p.x-e.x,dy=(p.y-e.y)*1.6,theta=Math.atan2(dy,dx),d=Math.hypot(dx,dy),cross=Math.abs(Math.sin(theta-Math.round(theta/(Math.PI/4))*Math.PI/4)*d);if(cross<35&&d<a.range){const result=hit(g,e,{...a,both:true,flags:['pull']},{radial:true});if(result==='hit'&&s.spiked&&distance(e,p)<110)g.damagePlayerDot(9,'jellySpike');}fx(g,e,'eight',{delay:0,damage:0,radius:a.range});break;}
   case 'nightmareHunt':hit(g,e,a);break;
   case 'groundBeam':fx(g,e,'ring',{x:e.targetX,y:e.targetY,delay:.6,radius:100,damage:a.damage,profaneHoly:true});break;
   case 'voidWaves':for(let i=0;i<(e.enraged?3:2);i++)fx(g,e,'wave',{delay:i*.42,count:i+1,damage:a.damage});break;
   case 'ray':{const angle=Math.atan2(e.targetY-e.y,e.targetX-e.x);fx(g,e,'ray',{angle,delay:0,damage:a.damage,length:1100});break;}
   case 'summonObelisk':summon(g,e,'boss_profane_obelisk',1,1);break;
   case 'detonateObelisk':{const t=friends(g,e).find(o=>['unclean_obelisk','boss_profane_obelisk'].includes(o.type));if(t){for(const o of friends(g,t).sort((a,b)=>distance(t,a)-distance(t,b)).slice(0,10)){g.healEnemy(o,o.maxHp*.2,{source:'obelisk'});o.tempoT=5;o.moveBuff=1.25;o.actionSpeedMultiplier=1.25;}g.kill(t,['sacrifice']);}break;}
   case 'locusts':summon(g,e,'locust',2,10);break;
   case 'vacuum':s.vacuum=s.clock+a.active;s.vacuumHit=false;break;
  }
  if(a.damage>0&&['melee','charge','leap','backDash','arrival','reaperDash','hookArc','tongue','nightmareHunt','multiArm'].includes(a.action))fx(g,e,'meleeTrail',{delay:0,life:.22,damage:0,radius:a.range,pose:a.pose,face:e.face});
 }
 P.bossMoveAllowed=function(e,a){const s=init(e),k=kind(e);if(a?.behindOnly&&(this.p.x-e.x)*e.face>=0)return false;if(!a||a.reactiveOnly||a.rageOnly&&!e.enraged||a.beforeRage&&e.enraged||(s.cd[a.key]||0)>s.clock)return false;if(a.ammoCost&&e.ammo<a.ammoCost||a.hpBelow!==undefined&&e.hp/e.maxHp>=a.hpBelow||a.minRange&&distance(e,this.p)<a.minRange)return false;if(a.action==='guard'&&(e.guardCd||0)>0)return false;if(a.action==='guard'&&e.enraged&&k==='champion')return false;if(a.action==='ignite'&&(s.lit>s.clock||e.enraged))return false;if(['spineShot','spineVolley'].includes(a.action)&&s.spines<=0)return false;if(['heal','inspire'].includes(a.action)&&!friends(this,e).some(o=>o.hp<o.maxHp))return false;if(a.action==='eatAlly'&&!edibleAllies(this,e).length)return false;if(a.action==='throwAlly'&&!friends(this,e).some(o=>!TYPES[o.type].boss&&!o.bossThrown))return false;if(a.action==='tentacles'&&children(this,e).filter(o=>o.type==='abyss_tentacle').length>=2)return false;if(a.action==='detonateObelisk'&&!friends(this,e).some(o=>['unclean_obelisk','boss_profane_obelisk'].includes(o.type)))return false;return true;};
 wrap('bossMoveAllowed',function(old,e,a){if(a?.maxRange&&distance(e,this.p)>a.maxRange)return false;if(kind(e)==='crystal_claw'&&a?.action==='leap'&&MOVES[e.moveKey]?.action==='leap')return false;if(a?.action==='summonObelisk'&&children(this,e).some(o=>o.type==='boss_profane_obelisk'))return false;if(a?.action==='plagueZombies'&&children(this,e).length>=4)return false;return old.call(this,e,a);});
 P.bossMovePool=function(e){
  const d=distance(e,this.p);return TYPES[e.type].moveKeys.filter(key=>{const a=MOVES[key];if(a.instant||!this.bossMoveAllowed(e,a))return false;if(a.action==='vacuum')return d<VACUUM.range;if(a.engageRange)return d<a.engageRange;if(a.ranged)return d>(a.action==='soundTrack'?0:130)&&d<a.range;if(!a.damage)return d<700;return d<a.range+(a.lunge||0)*a.active+45&&Math.abs(e.y-this.p.y)<(a.lane||75)+35;});
 };
 P.bossMoveWeight=function(e,key){
  const a=MOVES[key],k=kind(e),d=distance(e,this.p),near=d<=240;let weight=a.weight||1;
  if(['twin_blade','crystal_claw'].includes(k)&&init(e).recentMoves?.includes(key))weight*=.45;
  if(k==='nightmare'&&a.action==='nightmareHunt'&&d>240)weight*=4;
  if(k==='fortress'&&a.action==='bastionHop'&&d>240)weight*=init(e).brokenLegs?4:2;
  if(k==='archmage'&&e.enraged&&!a.ranged&&a.damage)weight*=3;
  if(k==='chewer'&&a.action==='eatAlly'&&d>=350&&edibleAllies(this,e,.3).length)weight*=4;
  if(['chewer','claw_beast','plague'].includes(k)&&a.action==='leap'&&near)weight*=.22;
  if(k==='claw_beast'&&a.action==='burrow'&&d>300)weight*=3.5;
  if(k==='claw_beast'&&a.action==='shortBackstep'&&near)weight*=1.35;
  if(k==='bottomless'&&a.action==='vacuum')weight*=d>250?3.5:.45;
  if(k==='plague'&&d>300&&(a.ranged||a.action==='plagueZombies'))weight*=3;
  return weight;
 };
 P.bossHasMove=function(e){return this.bossMovePool(e).length>0;};
 wrap('chooseSequence',function(old,e){
  if(!kind(e))return old.call(this,e);let pool=this.bossMovePool(e);const suicide=pool.find(k=>MOVES[k].action==='suicide');if(suicide)return [suicide];if(!pool.length)return [];
  // Vary the next completed attack, without replacing an attack that has already begun.
  if(['twin_blade','crystal_claw'].includes(kind(e))&&pool.length>1)pool=pool.filter(key=>key!==e.moveKey);
  const weights=pool.map(key=>this.bossMoveWeight(e,key));
  let roll=this.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<=0)return [pool[i]];}return [pool[0]];
 });
 wrap('beginEnemyMove',function(old,e,key){if(!kind(e))return old.call(this,e,key);const a=MOVES[key];if(kind(e)==='nightmare'&&a?.instant&&a.action==='blink')return nightmareBlink(this,e,a);if(!a||!a.reactiveOnly&&!this.bossMoveAllowed(e,a)){e.queue=[];this.recoverEnemy(e,.2);return;}tempo(this,e,a);const oldFace=e.face;old.call(this,e,key);if(a.behindOnly)e.face=oldFace;const s=init(e);if(['twin_blade','crystal_claw'].includes(kind(e))){s.recentMoves??=[];s.recentMoves.push(key);s.recentMoves=s.recentMoves.slice(-3);}if(kind(e)==='claw_beast'&&a.action==='burrow')e.burrowT=.6;e.bossContactPaid=false;if(a.action==='aimShot'||a.action==='returnSword'||a.action==='ray')e.bossAim={x:this.p.x,y:this.p.y};if(a.action==='throwAlly'){const oldTarget=this.enemies.find(o=>o.id===s.throwTargetId);if(oldTarget)oldTarget.bossThrowWarning=false;const target=friends(this,e).filter(o=>!TYPES[o.type].boss&&!o.bossThrown).sort((x,y)=>distance(x,e)-distance(y,e))[0];s.throwTargetId=target?.id??null;if(target)target.bossThrowWarning=true;}if(a.action==='arrival'){blink(this,e,115);s.arrival=false;}if(a.action==='backDash'){e.x=this.p.x-this.p.face*110;e.y=this.p.y;e.face=this.p.face;}
  if(a.action==='guard'&&kind(e)==='champion'&&e.enraged){e.attack=null;e.state='idle';}
  if(a.action==='bombard'||a.action==='spiderDrop')e.attack.contactFraction=0;
  if(a.action==='nightmareHunt')s.hunting=true;
  if(a.action==='bastionHop'){const dx=this.p.x-e.x,dy=this.p.y-e.y,d=Math.hypot(dx,dy)||1,step=Math.min(190,Math.max(0,d-170));s.hop={x:e.x,y:e.y,tx:e.x+dx/d*step,ty:clamp(e.y+dy/d*step,415,680)};}
  if(kind(e)==='nightmare'&&e.attack.lunge)e.attack.lunge*=1.25;
 });
 wrap('resolveEnemySpell',function(old,e,a){
  if(!a.bossMove)return old.call(this,e,a);const s=init(e);
  if(!e.bossContactPaid){e.bossContactPaid=true;if(a.ammoCost)e.ammo=Math.max(0,e.ammo-a.ammoCost);if(a.cooldown)s.cd[a.key]=s.clock+a.cooldown;}
  // Every frame of the descent can make contact, but each leap resolves at most once.
  if(a.action==='leap'){const result=hit(this,e,a,{quietMiss:true});e.damageDone=result!=='miss';if(e.damageDone)fx(this,e,'meleeTrail',{delay:0,life:.22,damage:0,radius:a.range,pose:a.pose,face:e.face});return true;}
  e.damageDone=true;action(this,e,a);return true;
 });
 wrap('resolveEnemyMoveSpecial',function(old,e,a,result){old.call(this,e,a,result);if(result==='hit'&&a.flags?.includes('bossHook')&&e&&!e.dead){this.p.x=e.x+e.face*65;this.p.y=e.y;}});
 wrap('kill',function(old,e,tags='normal'){
  if(e.bossProxy)return this.kill(e.bossProxy,tags);
  const k=kind(e),s=k?init(e):null;if(k==='champion'&&!s.revived){s.revived=true;s.reviveUntil=s.clock+1.15;e.revived=true;e.hp=e.maxHp*(e.antiRegen?.10:.40);e.posture=e.maxPosture;e.enraged=true;e.rageSpeed=1.5;e.state='recovery';e.t=1.15;e.queue=[];e.attack=null;e.pendingStun=false;this.emit('enemyRevive',{x:e.x,y:e.y,type:e.type});return;}
  const was=e.dead,result=old.call(this,e,tags);if(!was&&e.dead){if(k||TYPES[e.type]?.final){e.bossDeathAt=this.time;e.attack=null;e.walking=e.moving=false;}if(s){const throwTarget=this.enemies.find(o=>o.id===s.throwTargetId);if(throwTarget&&!throwTarget.bossThrown)throwTarget.bossThrowWarning=false;s.throwTargetId=null;s.hunting=false;s.air=0;s.vacuum=0;for(const c of s.proxies||[]){c.dead=true;c.state='dead';c.deathT=0;c.bossDeathAt=this.time;c.attack=null;c.bossDeath='moths';}e.bossDeath=TYPES[e.type].deathStyle;}e.bossFinalDeath=TYPES[e.type]?.final?true:undefined;}return result;
 });
 wrap('damageEnemy',function(old,e,damage,posture,tags='normal',options={}){
  if(e.bossProxy){const owner=e.bossProxy;return this.damageEnemy(owner,damage,posture,tags,{...options,bossProxyHit:true});}
  const k=kind(e);if(!k)return old.call(this,e,damage,posture,tags,options);const s=init(e),before=e.hp,ps=e.posture;
  if(s.split>s.clock&&!options.bossProxyHit&&!options.periodic)return;
  if(k==='demon_jelly'&&s.phase>s.clock)damage*=.18;
  if(k==='crystal_claw'&&(s.armor||s.armorWarning>s.clock))damage*=.82;
  const result=old.call(this,e,damage,posture,tags,options),loss=Math.max(0,before-e.hp);if(e.dead)return result;
  if(k==='hunter'&&(loss>0||e.posture<ps)){s.cloak=0;e.moveBuff=1;}s.damage+=loss;s.armorLoss+=loss;if(e.enraged)s.rageDamage+=loss;
  if(k==='demon_jelly'&&s.spiked&&!(s.spikeWarning>s.clock)&&loss>0&&!options.periodic&&!options.secondary&&(s.spikeHit||0)<=s.clock){s.spikeHit=s.clock+.18;const p=this.p,n=Math.min(p.hp-1,Math.max(0,this.hooks.modify('grayConversion',6,{enemy:e,source:'jellySpines'})));if(n>0){p.hp-=n;p.grayHp+=n;this.trigger('onRecoverableDamageTaken',{amount:n,enemy:e,source:'jellySpines'});}}
  if(k==='hell_hound'&&loss>0&&(this.p.x-e.x)*e.face<0&&!options.periodic){e.face*=-1;s.yellowRage=s.clock+2.3;e.rageSpeed=1.5;this.emit('houndAnger',{x:e.x,y:e.y,type:e.type});}
  if(k==='crystal_claw'&&s.armor&&(s.armorLoss>=e.maxHp*.15||ps>0&&e.posture<=0)){s.armor=false;s.armorWarning=s.clock+.55;s.regrow=s.clock+7;s.armorLoss=0;fx(this,e,'crystalBurst',{delay:.55,radius:245,damage:30});}
  if(k==='great_bell'){const n=Math.floor(s.damage/(e.maxHp*.12));while((s.bells||0)<n){s.bells=(s.bells||0)+1;fx(this,e,'ring',{delay:.55+(n-s.bells)*.45,radius:265,damage:28});}}
  if(k==='demon_jelly'&&ps>0&&e.posture<=0){s.spiked=false;s.spikes=s.clock+5;}
  if(k==='giant_zombie'&&e.enraged){while(s.rageDamage>=e.maxHp*.08){s.rageDamage-=e.maxHp*.08;lob(this,e,{damage:24,flags:['poison']});}}
  if(k==='bladder'){const n=Math.floor(s.damage/(e.maxHp*.19));while(s.spawned<n){s.spawned++;summon(this,e,'boss_mist_sac',1,8);}}
  return result;
 });
 function rage(g,e,s){const k=kind(e);s.raged=true;if(k==='hunter')e.ammo=3;if(k==='general')e.ammo=6;if(k==='flame_blade')s.lit=Infinity;if(k==='impaler'){s.spines=8;s.regrow=0;}if(k==='reaper')s.arrival=true;if(k==='dying')s.forceSword=true;if(k==='claw_beast'){s.rageBurrow=true;e.posture=e.maxPosture;e.stun=0;e.pendingStun=false;if(e.state==='stunned'){e.state='idle';e.cd=0;}}if(k==='profane_obelisk')for(const t of friends(g,e).sort((a,b)=>distance(e,a)-distance(e,b)).slice(0,10)){g.healEnemy(t,t.maxHp*.12,{source:'bossEnrage'});if(t.posture<=0||t.state==='stunned'){t.posture=t.maxPosture;t.stun=0;t.pendingStun=false;t.state='recovery';t.t=.35;}}}
 wrap('enemyStep',function(old,e,dt){
  if(!e.dead&&(e.medusaGold||e.medusaUntil>this.time))return old.call(this,e,dt);
  if(e.bossThrown)return;
  if(e.bossDropOwner){const owner=e.bossDropOwner;if(owner.dead){e.bossDropOwner=null;e.z=0;}else{e.x=owner.x+e.dropSide*75;e.y=owner.y;e.z=Math.max(80,owner.z||150);return;}}
  if(e.bossProxy){if(e.dead){e.deathT+=dt;return;}const owner=e.bossProxy;if(owner.dead||init(owner).split<=init(owner).clock){e.dead=true;e.deathT=2;return;}e.hp=owner.hp;e.maxHp=owner.maxHp;return;}
  const k=kind(e);if(!k)return old.call(this,e,dt);
  const s=init(e);if(e.dead){const r=old.call(this,e,dt);if(k==='bladder'&&!s.deathSpawned&&e.deathT>=.32){s.deathSpawned=true;summon(this,e,'boss_mist_sac',3,99);}return r;}if(e.spawnDelay>0)return old.call(this,e,dt);s.clock+=dt;const startX=e.x,startY=e.y;
  if(!e.enraged&&e.hp<=e.maxHp*(TYPES[e.type].rageAt??.5)){e.enraged=true;this.emit('enrage',{x:e.x,y:e.y,type:e.type});}if(e.enraged&&!s.raged)rage(this,e,s);
  tempo(this,e);
  if(k==='hell_hound'){if(controlled(e)||!(e.state==='idle'||e.attack?.ranged||e.state==='active'&&e.attack?.lunge))s.runTime=0;e.bossMoveSpeed=1+Math.min(.3,(s.runTime||0)*.1);}

  if(k==='reaper')e.moveBuff=s.preyUntil>s.clock?1.2:1;
  if(k==='demon_jelly')e.bossMoveSpeed=s.phase>s.clock?1.2:1;
  if(k==='nightmare'){
   const key=TYPES[e.type].moveKeys.find(key=>MOVES[key].action==='blink');
   s.cd[key]??=MOVES[key].cooldown;
   nightmareBlink(this,e,MOVES[key]);
  }
  if(s.combo){if(controlled(e)){s.combo=null;}else if(s.clock>=s.combo.at){const a=s.combo.move;e.attack={...e.attack,pose:a.secondPose};if(a.secondLunge)e.x+=e.face*a.secondLunge;hit(this,e,a);s.combo=null;}}
  if(s.retreat>s.clock&&!controlled(e))e.x-=e.face*500*dt;
  if(e.state==='active'&&e.attack?.action==='jumpThrust'){const u=e.t/e.attack.active;e.z=Math.sin(Math.min(1,u/.62)*Math.PI)*55;if(u>.58&&u<.85){e.face=Math.sign(e.targetX-e.x)||e.face;e.x+=e.face*Math.min(1050*dt,Math.max(0,Math.abs(e.targetX-e.x)-65));}}
  if(k==='champion'){e.rageSpeed=s.revived?1.5:e.enraged?1.25:1;e.offensive=e.enraged;if(s.revived){e.hp-=e.maxHp*.04*dt;if(e.hp<=0){this.kill(e,['lastLife']);return;}}}
  if(k==='crystal_claw'){if(!s.armor&&s.clock>=s.regrow){s.armor=true;s.armorLoss=0;}e.rageSpeed=s.armor||s.armorWarning>s.clock?1:1.45;}
  if(k==='impaler'){if(!s.spines&&s.clock>=s.regrow)s.spines=8;e.moveBuff=s.spines?1:1.65;}
  if(k==='hunter')e.moveBuff=s.cloak>s.clock?1.65:1;
  if(k==='hell_hound')e.rageSpeed=s.yellowRage>s.clock?1.5:e.enraged?1.18:1;
  if(k==='war_hammer'&&s.clock>=s.hammer&&!s.charged)s.charged=true;
  if(k==='demon_jelly'&&s.clock>=s.spikes&&!controlled(e)){s.spiked=!s.spiked;if(s.spiked)s.spikeWarning=s.clock+.65;s.spikes=s.clock+(s.spiked?5:4);}
  if(['plague','bladder'].includes(k)&&s.clock>=s.cloud){s.cloud=s.clock+(k==='bladder'?2.2+5.5*e.hp/e.maxHp:7);fx(this,e,'plagueCloud',{delay:0,life:5,radius:k==='bladder'?240:210,damage:0});}
  if(k==='bottomless'&&children(this,e).length<10){const c=this.enemyCorpses.find(c=>!c.used&&c.life>0&&!['locust','abaddon'].includes(c.type)&&distance(c,e)<170);if(c){const kids=summon(this,e,'locust',1,10);if(kids.length)c.used=true;}}
  if(k==='fortress'){s.brokenLegs=e.hp<e.maxHp*.25;e.moveBuff=s.brokenLegs?0:1;if(s.brokenLegs)e.vx=e.vy=0;if(s.clock>=s.rocket){s.rocket=s.clock+(s.brokenLegs?1.4:5);fx(this,e,'rocket',{delay:.7,damage:28});}}
  if(k==='marked_priest'&&!s.hand){s.hand=fx(this,e,'priestHand',{x:e.x+e.face*95,y:e.y,delay:0,life:Infinity,phase:'seek',cooldown:1,damage:26,radius:85,handMode:0});}
  if(k==='resentment'&&!controlled(e)&&children(this,e).filter(o=>o.type==='abyss_tentacle').length<2&&s.clock>=(s.tentacleNext||2)){s.tentacleNext=s.clock+5;summon(this,e,'abyss_tentacle',2-children(this,e).filter(o=>o.type==='abyss_tentacle').length,2);}
  if(k==='behemoth'){const n=e.hp<e.maxHp*.2?3:e.enraged?2:1;s.seekers=(s.seekers||[]).filter(f=>!f.done);for(let i=s.seekers.length;i<n;i++){s.seekers??=[];s.seekers.push(fx(this,e,'seeker',{x:this.p.x+(this.random()-.5)*650,y:clamp(this.p.y+(this.random()-.5)*220,415,680),delay:0,life:999,damage:32,radius:80,seed:i*2.7}));}}
  if(s.proxies&&controlled(e))s.split=0;
  if(s.split>s.clock){for(const [i,c] of (s.proxies||[]).entries()){const tx=this.p.x+(i?1:-1)*110,ty=clamp(this.p.y+(i?1:-1)*40,415,680);c.x+=clamp(tx-c.x,-150*dt,150*dt);c.y+=clamp(ty-c.y,-65*dt,65*dt);c.face=Math.sign(this.p.x-c.x)||1;c.state='active';c.t=(s.clock%1);c.attack={pose:'sweep',active:1};}if(s.clock>=s.swarmClock){s.swarmClock=s.clock+1.5;for(const c of s.proxies){fx(this,e,'proxyStrike',{x:c.x,y:c.y,delay:.5,radius:150,damage:23,proxy:c});}}if(s.clock>=s.swarmBeam){s.swarmBeam=s.clock+2.6;const [a,b]=s.proxies;fx(this,e,'link',{x:a.x,y:a.y,tx:b.x,ty:b.y,delay:.7,damage:25,proxies:s.proxies});}return;}
  if(s.proxies){e.x=(s.proxies[0].x+s.proxies[1].x)/2;e.y=(s.proxies[0].y+s.proxies[1].y)/2;for(const c of s.proxies){c.dead=true;c.deathT=2;}s.proxies=null;if(!controlled(e)){e.state='recovery';e.t=.6;}}
  if(!controlled(e)){
   if(s.arrival&&['idle','recovery'].includes(e.state)){this.beginEnemyMove(e,TYPES[e.type].moveKeys.find(k=>MOVES[k].action==='arrival'));return;}
   if(s.forceSword&&['idle','recovery'].includes(e.state)){s.forceSword=false;const key=TYPES[e.type].moveKeys.find(k=>MOVES[k].action==='returnSword');s.cd[key]=0;this.beginEnemyMove(e,key);return;}
   if(s.rageBurrow){s.rageBurrow=false;const key=TYPES[e.type].moveKeys.find(k=>MOVES[k].action==='burrow');s.cd[key]=0;this.beginEnemyMove(e,key);e.attack.range=396;e.attack.damage*=1.5;return;}
   if(s.slide>s.clock){e.x+=s.slideDir*650*dt;e.y+=Math.sin(s.clock*4)*130*dt;}
   if(s.backstep>s.clock&&!e.vineRoot){const step=380*(e.frostSlow||1)*this.iceFlameMoveMultiplier(e)*(e.tarSlow||1)*dt;e.x-=e.face*step;if(!this.loopWorld)e.x=clamp(e.x,this.bounds.left+10,this.bounds.right-15);e.walkDistance+=step;}
   if(s.vacuum>s.clock){
    const p=this.p;e.vx=0;
    if(!s.vacuumHit){
     e.y+=clamp(p.y-e.y,-85*dt,85*dt);
     const d=Math.hypot(p.x-e.x,(p.y-e.y)*1.6);
     if(d<VACUUM.range&&p.state!=='dash'&&(p.invuln<=0||this.guardActive())){
      p.x+=clamp(e.x-p.x,-VACUUM.pullX*dt,VACUUM.pullX*dt);p.y+=clamp(e.y-p.y,-VACUUM.pullY*dt,VACUUM.pullY*dt);
      if(Math.hypot(p.x-e.x,(p.y-e.y)*1.6)<VACUUM.contact&&p.z<135){
       // Contact is the attack: use normal guard/parry resolution without another move.
       const result=this.receiveHit(VACUUM.damage,e,null);
       if(['hit','block','parry','block-reflect','block-protected','dead'].includes(result)){
        s.vacuumHit=true;
        const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1,nx=dx||dy?dx/len:e.face,ny=dy/len;
        const push=result==='hit'?110:75;
        p.x+=nx*push;p.y=clamp(p.y+ny*push,415,680);
        if(result==='hit'&&p.state==='hurt')p.knock=nx*340;
       }
      }
     }
    }
    if(e.state==='active'&&e.attack?.action==='vacuum')e.t=Math.min(e.attack.active,e.t+dt);
    return;
   }else s.vacuumHit=false;
   if(s.air>s.clock){e.z=k==='explorer'?130*Math.sin(Math.PI*clamp((s.clock-s.airStart)/2.3,0,1)):110+Math.sin((s.air-s.clock)*2)*30;return;}if(!['jumpThrust','bastionHop'].includes(e.attack?.action)||!['windup','active'].includes(e.state))e.z=0;
   if(e.state==='active'&&e.attack?.action==='bastionHop'&&s.hop){const u=clamp((e.t+dt)/(e.attack.active*.8),0,1);if(!e.vineRoot){e.x=s.hop.x+(s.hop.tx-s.hop.x)*u;e.y=s.hop.y+(s.hop.ty-s.hop.y)*u;}e.z=Math.sin(u*Math.PI)*65;}
   // Ranged casts no longer pin a boss in place for the entire attack cycle.
   if(TYPES[e.type].ranged&&e.attack?.ranged&&['windup','active','recovery'].includes(e.state)&&!(e.z>0)&&!(s.slide>s.clock)){
    const dx=this.p.x-e.x,dy=this.p.y-e.y,d=Math.hypot(dx,dy),gap=175;
    if(d>gap&&!e.vineRoot){const pace=e.state==='active'?.4:.7,speed=TYPES[e.type].speed*(e.bossMoveSpeed||1)*(e.rageSpeed||1)*(e.speedMultiplier||1)*(e.moveBuff||1)*Math.min(e.frostSlow||1,e.frostTraceBossSlowUntil>this.time?.28:1)*this.iceFlameMoveMultiplier(e)*(e.tarSlow||1)*pace,step=Math.min(d-gap,speed*dt);e.x+=dx/d*step;e.y=clamp(e.y+dy/d*step,415,680);e.walkDistance+=step;e.walking=step>0;}
   }
   if(e.state==='active'&&e.attack?.action==='nightmareHunt'){const dx=this.p.x-e.x,dy=this.p.y-e.y,len=Math.hypot(dx,dy)||1;e.face=Math.sign(dx)||e.face;e.x+=dx/len*800*dt;e.y+=dy/len*800*dt;e.attack.lunge=0;if(distance(e,this.p)<90&&!e.damageDone){action(this,e,e.attack);e.damageDone=true;}if(e.t+dt<e.attack.active)e.attack.contactFraction=1;}
  }
  if(e.state==='windup'&&e.bossAim){if(e.attack.wind-e.t>.28){e.targetX=this.p.x;e.targetY=this.p.y;}e.bossAim.x=e.targetX;e.bossAim.y=e.targetY;}
  const wasRunning=!controlled(e)&&(e.state==='idle'||e.attack?.ranged&&['windup','active','recovery'].includes(e.state)||e.state==='active'&&e.attack?.lunge);
  const result=old.call(this,e,dt);
  if(k==='moth'&&!controlled(e)&&!e.vineRoot&&(e.state==='idle'||e.attack?.ranged&&['windup','active','recovery'].includes(e.state))){const drift=Math.sin(s.clock*2.7+e.aiPhase)+.55*Math.sin(s.clock*4.9+e.aiPhase*1.7),amplitude=distance(e,this.p)>220?34:14;e.y=clamp(e.y+drift*amplitude*(e.frostSlow||1)*this.iceFlameMoveMultiplier(e)*(e.tarSlow||1)*dt,415,680);}
  if(k==='hell_hound'){s.runTime=wasRunning&&!controlled(e)&&Math.hypot(e.x-startX,e.y-startY)>8*dt?Math.min(3,(s.runTime||0)+dt):0;e.bossMoveSpeed=1+s.runTime*.1;}
  if(s.throwTargetId&&!(e.attack?.action==='throwAlly'&&['windup','active'].includes(e.state))){const target=this.enemies.find(o=>o.id===s.throwTargetId);if(target&&!target.bossThrown)target.bossThrowWarning=false;s.throwTargetId=null;}if(!['windup','active'].includes(e.state)){e.bossAim=null;s.hunting=false;}return result;
 });
 wrap('receiveHit',function(old,damage,e,arrow){const s=e?.bossState,marked=!!s&&s.preyUntil>s.clock;const result=old.call(this,marked?damage+24:damage,e,arrow);if(marked&&result==='hit')s.preyUntil=0;return result;});
 wrap('blockHit',function(old,damage,e,arrow,opts){return old.call(this,this.p.bossPlague?damage*1.5:damage,e,arrow,opts);});
 // Effects are advanced once per simulation tick, independently of an actor's action.
 wrap('updateEnemyFields',function(old,dt){old.call(this,dt);const g=this,p=this.p;p.bossPlague=false;
  for(const t of this.enemies){const v=t.corpseVenom;if(!v||t.dead)continue;v.remaining-=dt;if(t.hp<t.maxHp*.2&&v.warning===null)v.warning=.75;this.damageEnemy(t,Math.min(t.maxHp*.018*dt,v.warning!==null?Math.max(0,t.hp-1):Infinity),0,['corpseVenom'],{secondary:true,periodic:true,quiet:true,flinch:false});if(t.dead)continue;if(t.hp<t.maxHp*.2&&v.warning===null)v.warning=.75;if(v.warning!==null){v.warning-=dt;t.red=.15;if(v.warning<=0){hit(this,v.owner,{damage:30,range:180,flags:['poison']},{x:t.x,y:t.y,radial:true});this.kill(t,['corpseVenom','selfDestruct']);}}if(v.remaining<=0)delete t.corpseVenom;}
  for(const f of this.bossEffects||[]){if(f.done)continue;const e=f.owner,s=init(e);if(e.dead&&!f.allowDead){if(f.target){f.target.bossThrown=false;f.target.bossThrowWarning=false;}f.done=true;continue;}if(f.type==='priestHand'&&e.state==='stunned'){f.stunned=true;f.cooldown=Math.max(f.cooldown||0,.25);continue;}if(f.type==='priestHand')f.stunned=false;f.age+=dt;const q=f.age-f.delay;if(f.type==='swordFlight'&&f.returning){f.tx=e.x;f.ty=e.y;}if(f.type==='link'&&f.proxies){if(f.proxies.some(c=>c.dead)||!(s.split>s.clock)){f.done=true;continue;}const [a,b]=f.proxies;f.x=a.x;f.y=a.y;f.tx=b.x;f.ty=b.y;}
   if(f.type==='priestHand'){
     f.cooldown-=dt;
     if(f.phase==='seek'){const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy)||1;f.x+=dx/d*Math.min(165*dt,Math.max(0,d-75));f.y+=dy/d*Math.min(165*dt,Math.max(0,d-75));if(d<185&&f.cooldown<=0){f.phase='windup';f.timer=PRIEST_HAND_TIMING.windup;f.tx=p.x;f.ty=p.y;f.sx=f.x;f.sy=f.y;g.emit('warning',{x:f.x,y:f.y,z:70});}}
     else {f.timer-=dt;if(f.phase==='windup'&&f.timer<=0){f.phase='strike';f.timer=PRIEST_HAND_TIMING.strike;f.hit=false;}
       if(f.phase==='strike'){const u=clamp(1-f.timer/PRIEST_HAND_TIMING.strike,0,1);f.x=f.sx+(f.tx-f.sx)*u;f.y=f.sy+(f.ty-f.sy)*u;if(u>=.65&&!f.hit){f.hit=true;const result=hit(g,e,{damage:f.damage,range:f.radius,flags:[]},{x:f.tx,y:f.ty,radial:true});if(result==='block')g.damageEnemy(e,0,25,['block'],{secondary:true});}if(f.timer<=0){f.phase='recovery';f.timer=PRIEST_HAND_TIMING.recovery;f.cooldown=1.5;}}
       else if(f.phase==='recovery'&&f.timer<=0){f.phase='seek';f.handMode=(f.handMode+1)%4;}
     }
   }
   else if(f.type==='chainHook'){const u=clamp(q/.28,0,1),oldX=f.hookX??e.x,oldY=f.hookY??e.y;f.hookX=e.x+(f.tx-e.x)*u;f.hookY=e.y+(f.ty-e.y)*u;if(!f.fired&&g.segmentContact(oldX,oldY,f.hookX,f.hookY,p,28,38)&&p.z<115){f.fired=true;if(p.invuln<=0&&p.state!=='dash'){const result=g.receiveHit(f.damage,e,null);g.resolveEnemyMoveSpecial(e,{flags:f.flags},result);}}}
   else if(f.type==='plagueCloud'){if(q>=0&&distance(f,p)<f.radius)p.bossPlague=true;}
   else if(f.type==='seeker'){
    if(!f.locked){f.x+=(Math.sin(f.age*1.6+f.seed)*65+Math.sign(p.x-f.x)*35)*dt;f.y=clamp(f.y+Math.cos(f.age*1.2+f.seed)*60*dt,415,680);if(distance(f,p)<55){f.locked=true;f.delay=f.age+BEHEMOTH_SPIKE_TIMING.windup;}}
    else {
     // The red cue belongs to contact, not the start of the circle's target lock.
     if(!f.warned&&q>=-BEHEMOTH_SPIKE_TIMING.warning){f.warned=true;g.emit('warning',{x:f.x,y:f.y,z:30});}
     if(q>=0){f.fired=true;hit(g,e,{damage:f.damage,range:f.radius,flags:[]},{x:f.x,y:f.y,radial:true});f.type='spike';f.life=BEHEMOTH_SPIKE_TIMING.life;}
    }
   }
   else if(['swordFlight','thrownAlly'].includes(f.type)&&q>=0){const u=Math.min(1,q/f.life),x=f.sx+(f.tx-f.sx)*u,y=f.sy+(f.ty-f.sy)*u;if(!f.hit&&g.segmentContact(f.x,f.y,x,y,p,35,38)&&p.z<130){f.hit=true;const result=g.receiveHit(f.damage,e,null);if(f.target&&blocked(result)){g.damageEnemy(f.target,0,75,['parry']);f.target.bossThrown=false;f.target.bossThrowWarning=false;f.done=true;}}
    f.x=x;f.y=y;if(f.target&&!f.target.dead){f.target.x=x;f.target.y=y;f.target.z=Math.sin(u*Math.PI)*90;}if(u>=1){if(f.target){f.target.bossThrown=false;f.target.bossThrowWarning=false;f.target.z=0;}if(f.type==='swordFlight'){if(!f.returning)fx(g,e,'swordFlight',{x,y,sx:x,sy:y,tx:e.x,ty:e.y,delay:.5,life:.55,age:-dt,damage:f.damage,returning:true,holdAngle:Math.atan2(f.ty-f.sy,f.tx-f.sx)+Math.PI/2});else s.swordOut=false;}f.done=true;}}
   else if(q>=0&&!f.fired){f.fired=true;switch(f.type){
    case 'deathBurst':case 'portal':case 'flame':case 'eight':case 'meleeTrail':break;
    case 'rocket':shoot(g,e,{damage:f.damage,speed:240},0,{bossRocket:true,projectile:'rocket',rocketSpeed:240,life:4});if(s.brokenLegs){e.hp-=e.maxHp*.008;if(e.hp<=0)g.kill(e,['rocketCost']);}break;
    case 'bombardShot':lob(g,e,{damage:f.damage,projectile:'arcaneBomb',flags:[]},f.x,f.y);break;
    case 'wave':volley(g,e,{damage:f.damage},f.count);break;
    case 'trackSound':fx(g,e,'soundImpact',{x:p.x,y:p.y,delay:.62,radius:100,damage:f.damage});break;
    case 'proxyStrike':{if(f.proxy&&!f.proxy.dead){f.proxy.x+=Math.sign(p.x-f.proxy.x)*65;hit(g,e,{damage:f.damage,range:f.radius,flags:[]},{x:f.proxy.x,y:f.proxy.y,radial:true});}break;}
    case 'line':case 'ray':{const dx=p.x-f.x,dy=p.y-f.y,along=dx*Math.cos(f.angle)+dy*Math.sin(f.angle),cross=Math.abs(-dx*Math.sin(f.angle)+dy*Math.cos(f.angle));if(cross<26+(g.guardActive()?18:0)&&Math.abs(along)<f.length&&(f.type!=='ray'||along>=0)&&p.z<150)g.receiveHit(f.damage,e,null);break;}
    case 'link':if(g.segmentContact(f.x,f.y,f.tx,f.ty,p,32,32)&&p.z<140)g.receiveHit(f.damage,e,null);break;
    case 'reverse':e.face=Math.sign(p.x-e.x)||-e.face;hit(g,e,{damage:f.damage,range:f.radius,flags:f.flags});break;
    case 'swipe':hit(g,e,{damage:f.damage,range:f.radius,flags:f.flags});break;
    case 'ghostHand':{hit(g,e,{damage:f.damage,range:f.radius,flags:[]},{x:f.tx,y:f.ty,radial:true});break;}
    case 'spiderLand':e.x=f.x;e.y=f.y;e.z=0;s.air=0;for(const child of s.dropKids||[]){child.bossDropOwner=null;child.x=e.x+child.dropSide*75;child.y=e.y;child.z=0;child.cd=.4;}s.dropKids=[];hit(g,e,{damage:f.damage,range:f.radius,flags:f.flags},{radial:true});break;
    case 'dive':{e.z=0;hit(g,e,{damage:f.damage,range:f.radius,both:true,flags:[]},{radial:true});break;}
    default:hit(g,e,{damage:f.damage,range:f.radius,flags:f.flags},{x:f.x,y:f.y,radial:true});break;
   }}
   if(!['seeker','priestHand'].includes(f.type)&&q>=f.life)f.done=true;
  }this.bossEffects=(this.bossEffects||[]).filter(f=>!f.done);
 });
 wrap('projectileStep',function(old,dt){
  for(const b of [...this.projectiles]){
   if(b.life<=0||b.reflected)continue;
   if(b.bossRocket){const desired=Math.atan2(this.p.y-b.y,this.p.x-b.x),angle=Math.atan2(b.vy,b.vx),diff=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle)),next=angle+clamp(diff,-.5*dt,.5*dt);b.rocketSpeed=Math.min(1300,b.rocketSpeed+250*dt);b.vx=Math.cos(next)*b.rocketSpeed;b.vy=Math.sin(next)*b.rocketSpeed;}
   if(!b.plagueOrb)continue;
   const e=this.enemies.find(e=>e.id===b.owner);if(!e||e.dead){b.life=0;continue;}
   b.orbAge+=dt;
   while(b.orbShots<3&&b.orbAge>=b.nextOrbShot){
    shoot(this,e,{key:b.moveKey,damage:b.orbShotDamage,speed:420,flags:['poison'],projectile:'plagueBullet'},0,{x:b.x,y:b.y,z:b.z,plagueOrbChild:true,life:3});
    b.orbShots++;b.nextOrbShot+=b.orbInterval;
   }
   if(b.orbShots===3)b.orbFinished=true;
  }
  const result=old.call(this,dt);
  for(const b of this.projectiles)if(b.plagueOrb&&b.orbFinished&&!b.reflected)b.life=0;
  this.projectiles=this.projectiles.filter(b=>b.life>0);return result;
 });
 wrap('reset',function(old,...args){const r=old.apply(this,args);this.bossEffects=[];return r;});
 // Dedicated summons use regular AI, never additional boss rewards or rush slots.
 for(const [id,source,name] of [['boss_spiderling','abyss_spiderling','自爆幼蛛'],['boss_mist_sac','e67','瘴雾囊'],['boss_small_bladder','e67','小浮囊'],['boss_profane_obelisk','unclean_obelisk','亵渎石碑']]){if(!TYPES[source])throw Error('Missing summon '+source);TYPES[id]={...TYPES[source],name,boss:false,elite:false,scale:id==='boss_spiderling'?.5:.85};if(id==='boss_profane_obelisk')TYPES[id].bossModel='profane_obelisk';}
 }
 return {install};
})();

const Art=(function(Motion){
 'use strict';
/* Resolution-independent armor, four-arm IK, spell tells and cinematic plates. */
const FinalArt=(function(){
 'use strict';
 const PI=Math.PI,TAU=PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const ink='#090914',violet='#ad61ff',white='#f3dbff';
 function poly(c,p,fill,edge='#746389',w=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
 function line(c,p,col,w=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}
 function ellipse(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=col;c.fill();}
 function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function plate(c,p,dim=false){const ys=p.map(v=>v[1]),g=c.createLinearGradient(-45,Math.min(...ys),60,Math.max(...ys));g.addColorStop(0,dim?'#10101b':'#453b51');g.addColorStop(.28,dim?'#13111f':'#211c2c');g.addColorStop(.65,'#11121e');g.addColorStop(1,dim?'#0d0b16':'#33293e');poly(c,p,g,dim?'#1e1527':'#47344f',.55);const center=p.reduce((a,b)=>[a[0]+b[0]/p.length,a[1]+b[1]/p.length],[0,0]);line(c,[p[0],center,p[2]],dim?'#15101d':'#241b2d',.5);}
 function flame(c,x,y,size,t,seed,dim=false){c.save();c.globalCompositeOperation='lighter';const s=Math.sin(t*5+seed),s2=Math.sin(t*7+seed*2);glow(c,x,y-size*.3,size*.9,dim?'#852aff20':'#9744ff35');c.beginPath();c.moveTo(x-size*.22,y);c.bezierCurveTo(x-size*.7,y-size*.42,x+size*.4*s,y-size*.53,x+size*.18*s2,y-size*(1.15+.2*s));c.bezierCurveTo(x+size*.58,y-size*.62,x+size*.12,y-size*.36,x+size*.22,y);c.closePath();c.fillStyle=dim?'#8742d560':'#8e37e8b0';c.fill();c.beginPath();c.moveTo(x-size*.10,y);c.bezierCurveTo(x-size*.2,y-size*.36,x+size*.16*s,y-size*.4,x+size*.12*s,y-size*.78);c.bezierCurveTo(x+size*.30,y-size*.45,x+size*.1,y-size*.18,x+size*.12,y);c.closePath();c.fillStyle=dim?'#a459d970':'#d092ffbb';c.fill();c.restore();}
 function segment(c,a,b,r,dim){c.save();c.translate(...a);c.rotate(Math.atan2(b[1]-a[1],b[0]-a[0])-PI/2);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);plate(c,[[-r,2],[-r*1.2,len*.30],[-r*.66,len],[r*.65,len],[r,len*.28],[r,1]],dim);line(c,[[0,8],[-r*.32,len*.46],[0,len-4]],dim?'#7c429b':'#c18aff',1.4);for(let i=1;i<4;i++)line(c,[[-r*.8,len*i/4],[r*.7,len*i/4-2]],'#171524',1.5);c.restore();}
 function arm(c,s,h,bend,dim){const dx=h[0]-s[0],dy=h[1]-s[1],d=Math.min(86,Math.hypot(dx,dy)),a=Math.atan2(dy,dx),off=Math.acos(clamp(d/90,-1,1)),el=[s[0]+Math.cos(a+bend*off)*45,s[1]+Math.sin(a+bend*off)*45];ellipse(c,...s,11,11,ink);segment(c,s,el,9,dim);ellipse(c,...el,8,8,'#231d32');ellipse(c,...el,3,3,violet);segment(c,el,h,10,dim);plate(c,[[h[0]-8,h[1]-8],[h[0]+7,h[1]-8],[h[0]+9,h[1]+4],[h[0]-4,h[1]+9]],dim);for(let i=0;i<3;i++)line(c,[[h[0]-5+i*4,h[1]-3],[h[0]-3+i*4,h[1]+5]],'#a68dad',1);}
 // The final BOSS and ordinary axe soldiers draw from this ONE weapon silhouette.
 // Palette only changes materials: no separate simplified axe geometry is maintained.
 function weapon(c,h,angle,kind,dim=false,palette='boss'){
  c.save();c.translate(...h);c.rotate(angle);
  const len={sword:96,spear:153,axe:85,dagger:48}[kind];
  const ordinary=kind==='axe'&&palette==='ordinary';
  line(c,[[0,12],[0,-len]],ordinary?'#392d24':'#100d18',7);
  line(c,[[-1,9],[-1,-len]],ordinary?'#ad8860':'#968291',2);
  for(let i=0;i<5;i++)line(c,[[-3,i*3-4],[3,i*3-6]],ordinary?'#76573e':'#72536e',1);
  if(kind==='axe'){
   // A single broad blade, flared cutting edge, narrow socket and blunt poll.
   const head=[[-15,-91],[7,-91],[22,-98],[36,-108],[42,-99],[46,-85],[46,-72],[42,-58],[35,-49],[23,-61],[8,-70],[-15,-70]];
   if(ordinary){
    const steel=c.createLinearGradient(-12,-96,42,-31);
    steel.addColorStop(0,'#a7b7b5');steel.addColorStop(.36,'#657877');steel.addColorStop(.7,'#414f51');steel.addColorStop(1,'#819392');
    poly(c,head,steel,'#273b3c',.9);
    poly(c,[[36,-108],[42,-99],[46,-85],[46,-72],[42,-58],[35,-49],[37,-63],[40,-75],[40,-86],[37,-98]],'#dce6df',null);
    poly(c,[[-5,-93],[6,-93],[6,-67],[-5,-67]],'#9ba9a5','#485b59');
   }else{
    plate(c,head,dim);
    poly(c,[[36,-108],[42,-99],[46,-85],[46,-72],[42,-58],[35,-49],[37,-63],[40,-75],[40,-86],[37,-98]],dim?'#71627e':'#efc9ff',null);
    line(c,[[12,-82],[30,-82]],violet,2);
    poly(c,[[-5,-93],[6,-93],[6,-67],[-5,-67]],'#ada0b9');
   }
  }else{
   const base=kind==='spear'?-108:-13;
   plate(c,[[-5,base],[-8,base-12],[0,-len-18],[8,base-12],[5,base]],dim);
   line(c,[[0,base-3],[0,-len-12]],dim?'#6c4180':white,1.2);
   line(c,[[-13,base+3],[0,base-2],[13,base+3]],'#ae87b4',3);
   for(let i=0;i<3;i++)poly(c,[[2,base-17-i*12],[5,base-21-i*12],[2,base-24-i*12]],violet,null);
  }
  c.restore();
 }
 // Boss grip points upward in its own space. Rotate a miniature copy toward
 // the right for the ordinary horizontal weapon; ordinary fighters mirror it.
 function axe(c,{scale=1,palette='ordinary'}={}){
  c.save();c.scale(scale,scale);weapon(c,[0,0],Math.PI/2,'axe',false,palette);c.restore();
 }

 function warning(c,x,y,color='#ff3657',r=25){c.save();c.globalCompositeOperation='lighter';glow(c,x,y,r*1.8,color+'66');ellipse(c,x,y,4,4,'#fff1ee');line(c,[[x-r,y],[x+r,y]],color,2.2);line(c,[[x,y-r],[x,y+r]],color,2.2);c.restore();}
 function combatRig(e,slot,time){
  const cue=FinalBoss.cue(e,slot),hands=slot?[[-64,-163],[67,-162],[-63,-97],[65,-86]]:[[-43,-146],[-37,-126],[63,-115],[63,-91]],angles=[-.45,.65,-.35,1.05];
  const set=(i,ready,end,a0,a1)=>{const rest=hands[i],r=cue?.raise||0,k=cue?.swing||0;hands[i]=[mix(mix(rest[0],ready[0],r),end[0],k),mix(mix(rest[1],ready[1],r),end[1],k)];angles[i]=mix(a0,a1,k);};
  if(!slot&&e&&e.attack?.finalIndex>=3){const pull=e.state==='windup'?clamp(e.t/e.attack.wind):e.state==='active'?Math.max(0,1-e.t/.14):.3;hands[0][0]=-37-pull*21;hands[1][0]=-31-pull*20;}
  if(cue){const k=cue.kind;if(k==='leap')cue.raise=e.state==='windup'?clamp(e.t/e.attack.wind):1;
   if(k==='claw'){set(0,[-52,-216],[55,-99],-.6,1.9);set(1,[52,-213],[102,-112],.4,1.9);}
   if(k==='sword')set(0,[-46,-218],[65,-109],-.7,1.85);
   if(k==='axe'||k==='leap')set(1,[42,-219],[84,-100],-.5,2.1);
   if(k==='spear')set(2,[-78,-113],[64,-113],Math.PI/2,Math.PI/2);
   if(k==='dagger')set(3,[38,-97],[109,-97],Math.PI/2,Math.PI/2);
   if(k==='swordThrust')set(0,[-68,-145],[62,-140],Math.PI/2,Math.PI/2);
   if(k==='spin'){for(let i=0;i<4;i++){const phase=(e.t||0)*Math.PI*8+i*Math.PI/2;hands[i]=[(i%2?1:-1)*(65+Math.sin(phase)*24),(i<2?-155:-99)+Math.cos(phase)*35];angles[i]=Math.sin(phase)*1.9+(i%2?.4:-.4);}}
   if(k==='ring'){hands[0]=[-62,-141];hands[1]=[65,-140];}
  }
  if(!slot&&e?.attack?.finalIndex===6&&['windup','active'].includes(e.state)){hands[0]=[-15,-212];hands[1]=[32,-210];hands[2]=[57,-163];hands[3]=[61,-137];}
  let axeCue=null;
  if(slot&&e?.axeCharge){hands[1]=[42,-219];angles[1]=-.5;axeCue={red:e.axeCharge.t<=.17,color:e.axeCharge.t<=.17?'#ff3657':'#ffd052'};}
  else if(slot&&e?.axeImpact!==undefined&&time-e.axeImpact<.2){const k=clamp((time-e.axeImpact+.05)/.2);hands[1]=[mix(42,84,k),mix(-219,-100,k)];angles[1]=mix(-.5,2.1,k);}
  if(!slot){const aiming=e&&['windup','active'].includes(e.state)&&[3,4,5,6,7].includes(e.attack?.finalIndex);if(!aiming)for(let i=0;i<4;i++){hands[i][1]+=20+Math.sin(time*2+i)*3;hands[i][0]-=i>=2?13:0;if(i<2)hands[i][0]=30+i*8;}else if(e.state==='active'){const recoil=Math.exp(-((e.t||0)% .26)*18)*12;for(const h of hands)h[0]-=recoil;}}
  return {hands,angles,cue,axeCue};
 }
 function draw(c,{x=0,y=0,scale=1,slot=0,time=0,alpha=1,silhouette=false,face=1,entity=null,dead=false}={}){
  c.save();c.translate(x,y);c.scale(scale*face,scale);c.globalAlpha*=alpha;c.lineJoin='round';if(dead)c.filter='grayscale(1) brightness(.65)';
  const e=dead?{...entity,state:'dead',attack:null,axeCharge:null,axeImpact:undefined}:entity,active=e?.state==='active',wind=e?.state==='windup',n=e?.attack?.finalIndex||0,q=clamp((e?.t||0)/(active?e.attack.active:wind?e.attack.wind:1)),moving=!dead&&(e?.moving||Math.abs(e?.vx||0)>8),walk=dead?0:moving?Math.sin((e?.walkDistance||time*90)*.065)*21:Math.sin(time*1.8)*2,breath=dead?0:Math.sin(time*2)*1.3,dim=silhouette||dead;
  const pose=combatRig(e,slot,time);if(!dead&&!slot&&n===5&&wind){c.save();c.globalCompositeOperation='lighter';glow(c,0,-150,130,(pose.cue?.red?'#ff3657':'#ffd052')+'55');c.restore();}
  if(!dead){for(const side of [-1,1]){flame(c,side*29,-36,35,time,side+6,dim);flame(c,side*33,-99,33,time,side+9,dim);}for(let i=0;i<10;i++){const side=i%2?1:-1;flame(c,side*(19+i%3*11),-120-i%5*22,28+i%3*12,time,i*1.7,dim);}for(let i=0;i<14;i++){const age=(time*.5+i*.173)%1,xx=Math.sin(i*2.3+time*.5)*55;ellipse(c,xx,-80-age*190,1.1,2.5,`rgba(190,114,255,${(1-age)*.65})`);}}
  // Leg armor is layered around hip, knee and ankle joints.
  for(const sign of [-1,1]){const hip=[sign*16,-109],knee=[sign*(27+walk*.25),-57-sign*walk*.4],foot=[sign*30+sign*walk*.45,-3];segment(c,hip,knee,12,dim);plate(c,[[knee[0]-12,knee[1]-7],[knee[0],knee[1]-15],[knee[0]+12,knee[1]-6],[knee[0]+8,knee[1]+9],[knee[0],knee[1]+17],[knee[0]-8,knee[1]+9]],dim);segment(c,knee,foot,10,dim);plate(c,[[foot[0]-12,-13],[foot[0]+9,-14],[foot[0]+17,1],[foot[0]-18,1]],dim);}
  c.translate(dead?0:moving?Math.sin(time*7)*3:Math.sin(time*1.6)*1.5,breath-40+(moving?Math.abs(walk)*.18:0));c.rotate(dead?0:active?Math.sin((e?.t||0)*12)*.035:wind?-.035:Math.sin(time*1.7)*.012);
  plate(c,[[-27,-155],[0,-169],[29,-155],[35,-124],[24,-78],[0,-65],[-25,-79],[-34,-122]],dim);
  for(const sign of [-1,1]){plate(c,[[0,-153],[sign*27,-157],[sign*33,-132],[sign*9,-117],[0,-131]],dim);line(c,[[sign*24,-146],[sign*13,-136],[sign*6,-133]],dead?'#332b3c':violet,2);for(let i=0;i<4;i++){const yy=-119+i*11;plate(c,[[sign*3,yy],[sign*24,yy-7],[sign*22,yy+6],[sign*4,yy+12]],dim);}plate(c,[[sign*5,-82],[sign*24,-91],[sign*37,-48],[sign*13,-58]],dim);}
  for(let i=0;i<5;i++){const yy=-141+i*13,span=23-i*2;line(c,[[-span,yy],[0,yy+8],[span,yy]],dead?'#28202e':silhouette?'#9650b5':'#d173ff',silhouette?1:1.6);}plate(c,[[-12,-77],[-20,-34],[0,8],[20,-34],[12,-77]],dim);line(c,[[0,-69],[0,-11]],dead?'#2a2131':violet,1.2);ellipse(c,0,-66,8,8,dead?'#24202a':violet);ellipse(c,0,-66,5.5,5.5,ink);for(const sign of [-1,1]){plate(c,[[sign*21,-81],[sign*45,-60],[sign*54,-21],[sign*23,-46]],dim);plate(c,[[sign*29,-64],[sign*53,-41],[sign*47,-7],[sign*18,-26]],dim);}
  if(!dead){glow(c,0,-136,22,'#bb55ff55');poly(c,[[0,-155],[4,-148],[0,-141],[-4,-148]],'#d89cff','#f8d8ff');}
  c.save();c.translate(0,-185);c.rotate(dead?0:(wind?-.045:Math.sin(time*2.3)*.025));c.translate(0,185);
  // Helmet: hollow visor and swept horns, never a solid head blob.
  plate(c,[[-18,-184],[-14,-209],[0,-219],[15,-208],[19,-184],[10,-169],[0,-161],[-10,-171]],dim);
  for(const sign of [-1,1]){plate(c,[[sign*10,-199],[sign*23,-220],[sign*26,-241],[sign*34,-218],[sign*26,-193],[sign*14,-185]],dim);poly(c,[[sign*2,-188],[sign*15,-194],[sign*12,-184],[sign*3,-181]],dead?'#08070c':'#c87aff',null);line(c,[[sign*6,-178],[sign*12,-183]],dead?'#292231':violet,1.6);}
  poly(c,[[-4,-181],[0,-195],[4,-181],[0,-165]],dead?'#15101b':'#bf71f4',dead?'#33253c':'#e4a7ff',.6);
  c.restore();
  let hands;
  if(!slot){const drawBack=wind?q:active?Math.exp(-((e.t||0)% .26)*18):0,bowX=63;
   hands=pose.hands;
   [[-27,-149],[27,-149],[-27,-117],[27,-117]].forEach((s,i)=>arm(c,s,hands[i],i%2?1:-1,dim));
   if(pose.cue?.kind==='claw'){for(let i=0;i<2;i++){weapon(c,hands[i],pose.angles[i],'dagger',dim);if(pose.cue.red)warning(c,hands[i][0],hands[i][1]-22,'#ff3657',25);}}
   if(pose.cue?.kind==='ring'&&pose.cue.red)warning(c,0,-77,'#ff3657',37);
   const bx=(hands[2][0]+hands[3][0])/2,by=(hands[2][1]+hands[3][1])/2;c.save();c.translate(bx,by);if(n===6)c.rotate(-.75);c.scale(1,1.32);const shape=[[-2,-91],[17,-75],[29,-43],[23,-16],[10,0],[23,17],[29,43],[17,76],[-2,91],[4,65],[9,42],[1,15],[-5,0],[1,-15],[9,-42],[4,-65]];plate(c,shape,dim);line(c,[[1,-83],[17,-51],[17,-29],[6,0],[17,30],[17,51],[1,83]],dead?'#352a40':violet,2.5);for(const sign of [-1,1])poly(c,[[15,sign*53],[39,sign*70],[22,sign*40]],'#393043','#c59bd6');const aiming=['windup','active'].includes(e?.state)&&[3,4,5,6,7].includes(n),pull=dead?0:aiming?100+drawBack*21:18;line(c,[[0,-89],[-pull,-33],[0,89]],dead?'#38313f':'#e2b2ff',1);if(aiming){line(c,[[-pull,-33],[44,-33]],dead?'#393240':'#f8e5ff',1.8);poly(c,[[43,-38],[57,-33],[43,-28]],violet,null);}c.restore();
  }else{
   hands=pose.hands;const angles=pose.angles;
   [[-28,-149],[28,-149],[-28,-116],[28,-116]].forEach((s,i)=>{arm(c,s,hands[i],i%2?1:-1,dim);weapon(c,hands[i],angles[i],['sword','axe','spear','dagger'][i],dim);});
   const kind=pose.cue?.kind,armIndex=['sword','swordThrust'].includes(kind)?0:['axe','leap'].includes(kind)?1:kind==='spear'?2:kind==='dagger'?3:-1;
   if(armIndex>=0&&pose.cue.red){const h=hands[armIndex],len=[100,85,150,45][armIndex],ang=angles[armIndex];warning(c,h[0]+Math.sin(ang)*len,h[1]-Math.cos(ang)*len,'#ff3657',29);warning(c,...h,'#ff3657',15);}
   if(pose.axeCue){const h=hands[1],ang=angles[1];warning(c,h[0]+Math.sin(ang)*85,h[1]-Math.cos(ang)*85,pose.axeCue.color,pose.axeCue.red?35:24);}
   if(kind==='spin'&&pose.cue.red)warning(c,0,-99,'#ff3657',35);
  }
  for(const sign of [-1,1]){plate(c,[[sign*21,-159],[sign*38,-174],[sign*58,-157],[sign*49,-136],[sign*28,-140]],dim);for(let i=0;i<3;i++)plate(c,[[sign*(30+i*8),-164+i*3],[sign*(29+i*15),-193+i*5],[sign*(39+i*8),-157+i*3]],dim);}
  c.restore();
 }
 // Driven by corpse time so bursts also progress during the final victory wait.
 function deathEffects(c,e,camera=0){const time=e.deathT||0,fade=1-clamp(time/.8);if(!e.dead||fade<=0)return;c.save();c.globalAlpha*=fade;c.globalCompositeOperation='lighter';
  const u=clamp(time/.4),fall=u*u*(3-2*u),angle=1.52*fall;
  for(let i=0;i<4;i++){const age=time-[.07,.23,.39,.55][i];if(age<0||age>=.23)continue;const q=age/.23,height=[190,245,315,145][i],x=e.x-camera+(e.face||1)*height*Math.sin(angle),y=e.y-4*fall-height*Math.cos(angle);c.save();c.globalAlpha*=1-q;glow(c,x,y,28+q*70,'#aa42fabb');ellipse(c,x,y,Math.max(.1,17*(1-q)),Math.max(.1,12*(1-q)),'#eed2ff');for(let j=0;j<9;j++){const a=j*2.399+i,rr=18+q*68;poly(c,[[x+Math.cos(a-.12)*rr*.45,y+Math.sin(a-.12)*rr*.45],[x+Math.cos(a)*rr,y+Math.sin(a)*rr],[x+Math.cos(a+.12)*rr*.35,y+Math.sin(a+.12)*rr*.35]],j%3?'#9b4fdf':'#d496ff',null);line(c,[[x+Math.cos(a)*rr*.6,y+Math.sin(a)*rr*.6],[x+Math.cos(a)*rr*1.2,y+Math.sin(a)*rr*1.2]],'#dfb0ff',2*(1-q)+.5);}c.beginPath();c.ellipse(x,y,12+q*48,8+q*32,0,0,TAU);c.strokeStyle='#c38bfa';c.lineWidth=3*(1-q)+.5;c.stroke();c.restore();}
  c.restore();
 }
 function effects(c,e,camera,time){
  const a=e.attack;if(!a)return;const n=a.finalIndex,slot=e.finalArtSlot||0,active=e.state==='active',wind=e.state==='windup',x=e.x-camera,y=e.y,pose=combatRig(e,slot,time),red=pose.cue?.red,col=red?'#ff3657':'#ad72ff';
  c.save();c.globalCompositeOperation='lighter';
  // Player-style dodge ghosts use the boss's own complete silhouette.
  if(e.blinkFrom&&time-e.blinkFrom.t<.32){const q=clamp((time-e.blinkFrom.t)/.32),from=e.blinkFrom;for(let i=0;i<6;i++){const k=i/6;draw(c,{x:mix(from.x,e.x,k)-camera,y:mix(from.y,e.y,k),scale:1.45,slot,time,face:e.face,alpha:(1-q)*(1-k)*.23,silhouette:true});line(c,[[mix(from.x,e.x,k)-camera-55,e.y-110-i*13],[mix(from.x,e.x,k)-camera+55,e.y-110-i*13]],'#ce8fff55',2);}}
  for(const b of e.finalRain||[]){if(b.t<=0)continue;const bx=b.x-camera,hot=b.t<=.17;c.strokeStyle=hot?'#ff3657':'#a55df0';c.lineWidth=hot?3:1.4;c.beginPath();c.ellipse(bx,b.y,b.r,b.r/1.8,0,0,TAU);c.stroke();line(c,[[bx-10,b.y],[bx+10,b.y]],c.strokeStyle,1.3);if(hot)glow(c,bx,b.y,35,'#ff365744');}
  // A VFX packet is emitted at every real contact, including misses.
  for(const fx of e.finalVFX||[]){const age=time-fx.at;if(age<0||age>.36)continue;const xx=fx.x-camera,yy=fx.y;
   if(fx.kind==='ring'||fx.kind==='spin'){AshCombatFX.ring(c,{x:xx,y:yy-100,radius:fx.radius,t:age,life:.25,seed:fx.index*.8,demon:true});if(fx.kind==='spin')for(let j=0;j<3;j++)AshCombatFX.ribbon(c,xx,yy-90+j*18,fx.radius-j*15,age*28+j*TAU/3,'#e75abe',(1-age/.36)*.65,.34);}
   else AshCombatFX.slash(c,{x:xx+fx.face*15,y:yy-(fx.kind==='spear'?205:fx.kind==='dagger'?194:175),face:fx.face,kind:fx.kind,index:fx.index,radius:fx.kind==='claw'?200:fx.radius*.85,t:age});
  }
  if(slot&&n===6&&(wind||active&&e.t<.53)){const tx=e.targetX-camera,ty=e.targetY,hot=active&&.53-e.t<=.17;c.strokeStyle='#ff3657';c.lineWidth=hot?4:2;c.fillStyle=hot?'#ff36572b':'#ff365711';c.beginPath();c.ellipse(tx,ty,300,115,0,0,TAU);c.fill();c.stroke();for(let i=0;i<4;i++){const ang=i*Math.PI/2;line(c,[[tx+Math.cos(ang)*280,ty+Math.sin(ang)*105],[tx+Math.cos(ang)*310,ty+Math.sin(ang)*123]],'#ff6378',3);}}
  if(!active&&!wind){c.restore();return;}
  const q=clamp(e.t/(active?a.active:a.wind));
  if(!slot&&n===5){
   const sx=x+e.face*145,sy=y-265,tx=e.targetX-camera,ty=e.targetY-45,dx=tx-sx,dy=ty-sy,len=Math.hypot(dx,dy)||1,end=[sx+dx/len*1800,sy+dy/len*1800],color=active?'#fff1ff':red?'#ff3657':'#ffd052';
   line(c,[[sx,sy],end],active?'#9b40ff77':color,active?36:red?3:1.5);if(active){line(c,[[sx,sy],end],'#ecd3ff',10);line(c,[[sx,sy],end],'#ffffff',3);AshCombatFX.electricity(c,[sx,sy],end,time,'#bc6fff',2.1);for(let i=0;i<36;i++){const k=((time*2+i*.071)%1),px=mix(sx,end[0],k),py=mix(sy,end[1],k),off=Math.sin(i*7+time*40)*20;line(c,[[px-dy/len*off,py+dx/len*off],[px+dx/len*14,py+dy/len*14]],i%2?'#c478ff':'#ffe9ff',2);}}
   else {glow(c,x,y-170,150,color+'33');for(let i=0;i<12;i++){const ang=time*2+i*TAU/12;ellipse(c,x+Math.cos(ang)*65,y-175+Math.sin(ang)*110,2,5,color);}}glow(c,sx,sy,active?60:32,color+'88');
  }else if(!slot&&n===8){for(const l of e.finalLines||[]){const xx=l.x-camera,yy=l.y-50,dx=Math.cos(l.a)*1800,dy=Math.sin(l.a)*1800,color=active?'#fff1ff':red?'#ff3657':'#60bcff';line(c,[[xx-dx,yy-dy],[xx+dx,yy+dy]],active?'#9944ff65':color,active?24:red?2.5:1);if(active)line(c,[[xx-dx,yy-dy],[xx+dx,yy+dy]],color,4);}}
  else if(!slot&&n===6){for(let i=0;i<7;i++){const xx=x+(i-3)*16,top=y-260-q*300;line(c,[[xx,y-230],[xx,top]],'#b56cff',1+q*2);poly(c,[[xx-5,top+12],[xx,top],[xx+5,top+12]],'#e2b2ff',null);}}
  else if(!slot&&[3,4,7].includes(n)&&wind){glow(c,x+e.face*130,y-260,25+q*20,n===7?'#ce58ff66':'#aa66ff55');}
  c.restore();
 }
 function projectile(c,b,camera){
  c.save();c.globalCompositeOperation='lighter';const color=b.reflected?'#8dffe2':'#c276ff',trail=b.trail||[],missile=b.homing;
  for(let i=1;i<trail.length;i++){const k=i/trail.length,prev=trail[i-1],p=trail[i],xx=p.x-camera,yy=p.y-(p.z??b.z);line(c,[[prev.x-camera,prev.y-(prev.z??b.z)],[xx,yy]],color+Math.floor(k*150).toString(16).padStart(2,'0'),missile?2+k*12:1+i/5);if(missile){const drift=(1-k)*18,j=Math.sin(i*13.7+(b.life||0)*9);ellipse(c,xx+j*drift,yy+Math.cos(i*7.1)*drift,1+k*2,1+k*2,color+Math.floor(k*190).toString(16).padStart(2,'0'));}}
  c.translate(b.x-camera,b.y-b.z);c.rotate(Math.atan2(b.vy,b.vx));if(missile){glow(c,0,0,48,color+'88');poly(c,[[40,0],[5,-13],[-34,-9],[-50,-19],[-44,0],[-50,19],[-34,9],[5,13]],'#7335be','#e5b2ff',1.5);poly(c,[[40,0],[-16,-4],[-27,0],[-16,4]],'#fff1ff',null);poly(c,[[-35,-7],[-78-Math.sin(b.life*32)*9,0],[-35,7]],'#d28affaa',null);line(c,[[-54,0],[-90,0]],'#f9d8ff',3);}
  else {glow(c,0,0,23,'#a954ff55');poly(c,[[15,0],[-4,-6],[-1,0],[-4,6]],white,violet);line(c,[[-34,0],[7,0]],color,2);if(b.dagger)poly(c,[[16,0],[-13,-4],[-8,0],[-13,4]],'#ddd0ef',violet);}c.restore();
 }
 function cinematic(c,index,time=0){getVictoryArt().draw(c,index,time,draw);}
 return {draw,effects,deathEffects,projectile,cinematic,combatRig,axe};
})();

/* Human chapter: authored skins and contact-timed clips on fixed-length anatomy. */
const HumanArt=(function(Motion){
 'use strict';
 const kinds=new Set(['iron_guard','hunter','flame_blade','war_hammer','butcher','archmage','general','reaper']);
 const S=1.68,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const mix=(a,b,t)=>t<=0?{...a}:t>=1?{...b}:Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
 const at=(frames,t)=>{for(let i=1;i<frames.length;i++)if(t<=frames[i][0])return mix(frames[i-1][1],frames[i][1],smooth((t-frames[i-1][0])/(frames[i][0]-frames[i-1][0])));return frames.at(-1)[1];};
 const defaults={hipX:0,hipY:-35,lean:0,head:0,hx:26,hy:-51,bx:-17,by:-46,angle:.5,backAngle:-.35,fx:20,fy:0,rx:-19,ry:0,bodyLift:0,rotation:0,bowPull:0,yaw:0};
 function rest(k){return {...defaults,...({
  iron_guard:{hx:29,hy:-51,bx:-19,by:-48,angle:.6,backAngle:.08},
  hunter:{lean:.10,hx:-24,hy:-45,bx:33,by:-53,angle:-2.05,backAngle:.85},
  flame_blade:{lean:.09,hx:29,hy:-51,bx:9,by:-47,angle:.68},
  war_hammer:{hx:36,hy:-52,bx:19,by:-39,angle:.68},
  butcher:{lean:.08,hx:-25,hy:-39,bx:34,by:-51,angle:-2.25,backAngle:.15},
  archmage:{hipY:-38,hx:30,hy:-50,bx:-19,by:-49,angle:.28,backAngle:-.4,fx:17,rx:-16},
  general:{lean:.06,hx:-22,hy:-47,bx:34,by:-54,angle:-.72,backAngle:1.03},
  reaper:{lean:.08,hx:29,hy:-50,bx:3,by:-45,angle:-.06,fx:22,rx:-20}
 })[k]};}
 function keys(k,a,style){
  const r=rest(k),p=v=>({...r,...v});let wind,hit,follow;
  if(style==='thrust'){
   wind=p({hipX:-5,lean:-.14,hx:-8,hy:-52,angle:1.47});hit=p({hipX:9,lean:.29,hx:48,hy:-57,angle:Math.PI/2,fx:31,rx:-24});follow=p({hipX:11,lean:.31,hx:46,hy:-55,angle:1.7,fx:33,rx:-24});
  }else if(style==='overhead'){
   wind=p({hipX:-4,lean:-.16,hx:-7,hy:a.name==='菜刀猛剁'?-105:-95,angle:-.65,fx:23,rx:-23});hit=p({hipX:8,hipY:-31,lean:.26,hx:39,hy:-46,angle:1.95,fx:30,rx:-24});follow=p({hipX:10,hipY:-28,lean:.32,hx:25,hy:-25,angle:2.75,fx:32,rx:-24});
  }else if(style==='uppercut'){
   wind=p({hipX:-5,hipY:-30,lean:-.16,hx:3,hy:-24,angle:2.8});hit=p({hipX:7,lean:.22,hx:43,hy:-56,angle:1.1,fx:29,rx:-23});follow=p({hipX:9,lean:.15,hx:25,hy:-89,angle:-.5,fx:30,rx:-23});
  }else if(style==='shield'||style==='guard'){
   wind=p({hipX:-3,lean:-.1,bx:22,by:-53,backAngle:0,hx:13,hy:-60,angle:.15});hit=p({hipX:8,lean:.2,bx:44,by:-52,backAngle:-.1,hx:15,hy:-59,angle:.4,fx:29,rx:-22});follow=p({hipX:9,lean:.22,bx:39,by:-49,hx:19,hy:-57,fx:30,rx:-22});
   if(style==='guard')hit=follow=wind;
  }else if(style==='offhand'){
   wind=p({hipX:-4,lean:-.12,bx:-13,by:-88,backAngle:-.85});hit=p({hipX:7,lean:.2,bx:44,by:-54,backAngle:1.55,fx:29,rx:-23});follow=p({hipX:9,lean:.23,bx:34,by:-30,backAngle:2.3,fx:30,rx:-23});
  }else if(style==='hook'){
   wind=p({hipX:-5,lean:-.18,bx:-24,by:-74,backAngle:-1.7});hit=p({hipX:8,lean:.25,bx:46,by:-57,backAngle:1.55,fx:30,rx:-23});follow=p({hipX:10,lean:.2,bx:31,by:-40,backAngle:2.2,fx:31,rx:-23});
  }else if(style==='shoot'){
   wind=p({lean:-.05,bx:38,by:-61,backAngle:Math.PI/2});hit=p({lean:-.1,bx:34,by:-61,backAngle:1.49});follow=p({lean:-.06,bx:37,by:-59,backAngle:1.56});
  }else if(style==='point'){
   wind=p({bx:15,by:-63,backAngle:1.2,lean:-.04});hit=p({bx:46,by:-65,backAngle:Math.PI/2,lean:.10});follow=hit;
  }else if(style==='kick'){
   wind=p({hipX:-4,hipY:-38,lean:-.12,fx:17,fy:-22,rx:-15});hit=p({hipX:-2,hipY:-36,lean:-.22,fx:45,fy:-30,rx:-16});follow=p({hipX:1,hipY:-34,lean:-.08,fx:31,fy:-13,rx:-17});
  }else if(style==='ignite'){
   wind=p({hx:23,hy:-61,angle:.38,bx:25,by:-69});hit=p({hx:25,hy:-58,angle:.48,bx:41,by:-86});follow=p({hx:28,hy:-53,angle:.6,bx:27,by:-59});
  }else if(style==='cast'){
   wind=p({lean:-.06,hx:21,hy:-67,angle:-.15,bx:4,by:-72});hit=p({lean:.12,hx:31,hy:-57,angle:.5,bx:44,by:-65,backAngle:1.6});follow=p({lean:.08,hx:29,hy:-55,angle:.4,bx:37,by:-58});
  }else{
   wind=p({hipX:-6,lean:-.20,hx:-22,hy:-73,angle:-1.3,fx:23,rx:-23});hit=p({hipX:7,lean:.20,hx:43,hy:-55,angle:1.5,fx:30,rx:-24});follow=p({hipX:10,lean:.26,hx:25,hy:-32,angle:2.8,fx:32,rx:-24});
  }
  return {r,wind,hit,follow};
 }
 function styleFor(k,a){
  if(a.action==='markPrey')return 'point';if(a.action==='ignite')return 'ignite';
  if(k==='butcher'&&(a.weapon==='hook'||['hook','hookArc'].includes(a.action)))return 'hook';
  if(['hunter','general'].includes(k)&&a.ranged)return 'shoot';
  if(k==='archmage'&&(a.ranged||['flameJet','blink'].includes(a.action)))return 'cast';
  if(['soldier','inspire','cloak'].includes(a.action))return 'point';
  return a.pose==='reverse'?'uppercut':a.pose;
 }
 function sample(e,k,t){
  const a=e.attack,r=rest(k);if(e.dead||['hurt','flinch','stunned','knockdown'].includes(e.state)){const p=Motion.samplePose(e,false,t);return {...p,angle:p.angle+Math.PI/2,backAngle:p.backAngle+Math.PI/2};}
  if(a&&['windup','active','recovery'].includes(e.state)){
   const style=a.action==='combo'?'sweep':styleFor(k,a),v=keys(k,a,style),contact=clamp(a.contactFraction??.35,.02,.95);
   let frames=[[0,v.wind],[contact,v.hit],[Math.max(contact+.02,.82),v.follow],[1,v.follow]],end=v.follow;
   if(a.action==='combo'){
    const second=keys(k,a,a.secondPose),time2=clamp(contact+(a.secondAt||.48)/a.active,contact+.08,.96);
    frames=[[0,v.wind],[contact,v.hit],[contact+(time2-contact)*.25,v.follow],[time2-(time2-contact)*.25,second.wind],[time2,second.hit],[1,second.follow]];end=second.follow;
   }
   if(e.state==='windup')return at([[0,r],[.82,v.wind],[1,v.wind]],clamp(e.t/a.wind));
   if(e.state==='active')return at(frames,clamp(e.t/a.active));
   return mix(end,r,smooth(1-e.t/(e.recoveryTotal||a.recovery||.5)));
  }
  const p=Motion.samplePose(e,false,t);return {...r,hipY:r.hipY+p.hipY-defaults.hipY,fx:p.fx,fy:p.fy,rx:p.rx,ry:p.ry,hx:r.hx+(p.hx-23)*.35,bx:r.bx+(p.bx+15)*.35};
 }
 function chain(start,target,a,b,bend){const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy),d=clamp(raw,Math.abs(a-b)+.001,a+b-.001),end=[start[0]+(raw?dx/raw:0)*d,start[1]+(raw?dy/raw:1)*d];return {end,joint:Motion.ik(start,end,a,b,bend)};}
 function rig(e,k,t){
  const p=sample(e,k,t),j=Motion.joints(p),scale=v=>v.map(n=>n*S),hip=scale(j.hip),chest=scale(j.chest),head=scale(j.head),shoulders=[-7,7].map(x=>[chest[0]+x,chest[1]+2]);
  let targets=[scale(j.back),scale(j.hand)];
  // Both hands grip one rigid shaft. Project the primary grip into the intersection
  // of both reach discs before solving either elbow, so neither hand slips off.
  const twoHand=k==='war_hammer',grip=24,offset=[-Math.sin(p.angle)*grip,Math.cos(p.angle)*grip];
  if(twoHand){for(let i=0;i<12;i++){targets[1]=chain(shoulders[1],targets[1],23*S,24*S,1).end;const off=chain(shoulders[0],[targets[1][0]+offset[0],targets[1][1]+offset[1]],23*S,24*S,-1).end;targets[1]=[off[0]-offset[0],off[1]-offset[1]];}targets[0]=[targets[1][0]+offset[0],targets[1][1]+offset[1]];}
  const arms=targets.map((v,i)=>chain(shoulders[i],v,23*S,24*S,i||['hunter','general','butcher','reaper','archmage'].includes(k)?1:-1)),legs=[j.rear,j.front].map((v,i)=>chain(hip,scale(v),24*S,25*S,i?-1:1));
  return {hip,chest,head,shoulders,hands:arms.map(v=>v.end),elbows:arms.map(v=>v.joint),feet:legs.map(v=>v.end),knees:legs.map(v=>v.joint),angle:p.angle,backAngle:p.backAngle,factor:S,pose:p,twoHand};
 }
 const colors={
  iron_guard:{body:'#697779',shade:'#455459',light:'#98a4a0',cloth:'#813b40',skin:'#d4d3bb',trim:'#d8bd78'},
  hunter:{body:'#51483f',shade:'#343634',light:'#706353',cloth:'#824b39',skin:'#d5cdb1',trim:'#bd9e6c'},
  flame_blade:{body:'#343b44',shade:'#252d35',light:'#5b6870',cloth:'#a0463e',skin:'#d5d4bd',trim:'#c9aa6c'},
  war_hammer:{body:'#687476',shade:'#414d54',light:'#96a19b',cloth:'#673740',skin:'#d0ceb5',trim:'#e0bf6d'},
  butcher:{body:'#a29178',shade:'#786957',light:'#b7a58b',cloth:'#893e3f',skin:'#bbaa8e',trim:'#d4c9a9'},
  archmage:{body:'#51465f',shade:'#332e44',light:'#796486',cloth:'#744154',skin:'#d0cec6',trim:'#d9b77c'},
  general:{body:'#455259',shade:'#2c383e',light:'#718083',cloth:'#893e37',skin:'#d7d2b7',trim:'#dfbe70'},
  reaper:{body:'#373641',shade:'#242732',light:'#555161',cloth:'#665172',skin:'#c0becb',trim:'#b080d2'}
 };
 function polygon(c,p,col){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();}
 function line(c,p,col,w){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.stroke();}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 function segment(c,a,b,wa,wb,col,shade){const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,n=[-(b[1]-a[1])/d,(b[0]-a[0])/d],pt=(v,w)=>[v[0]+n[0]*w,v[1]+n[1]*w];polygon(c,[pt(a,wa),pt(b,wb),pt(b,-wb),pt(a,-wa)],col);if(shade)polygon(c,[pt(a,-wa),pt(b,-wb),pt(b,0),pt(a,0)],shade);}
 function diamond(c,x,y,size,col){polygon(c,[[x,y-size],[x+size*.46,y],[x,y+size],[x-size*.46,y]],col);}
 function blade(c,length,width,trim,curved=false){
  polygon(c,[[-3,12],[3,12],[3,-13],[-3,-13]],'#796049');polygon(c,[[-12,-9],[12,-9],[13,-14],[-12,-14]],trim);
  polygon(c,[[-width,-16],[-width,-length+17],[curved?8:1,-length],[width,-length+19],[width,-16]],'#cbd1c7');polygon(c,[[1,-length],[width,-length+19],[width,-16],[0,-18]],'#98a6a3');polygon(c,[[-width,-16],[-width,-length+17],[curved?8:1,-length],[0,-length+19],[0,-18]],'#e2e2cc');
 }
 function fire(c,t){
  for(let layer=0;layer<3;layer++){const edge=[[-3,-17]];for(let i=0;i<6;i++){const y=-25-i*14,w=(12-layer*3)*(1+.25*Math.sin(t*9+i*2));edge.push([-w,y],[-w-5+layer*2,y-17],[-3,y-9]);}edge.push([7,-139+layer*11]);for(let i=5;i>=0;i--){const y=-25-i*14,w=12-layer*3+Math.sin(t*7+i)*3;edge.push([w,y-24],[w*.6,y-5],[w,y]);}edge.push([3,-17]);polygon(c,edge,['#ec572c','#ffa740','#ffda79'][layer]);}
 }
 // Weapon geometry is also used for death drops; no fallback to the old prop set.
 function weapon(c,type,h,angle,e,t){
  c.save();c.translate(...h);c.rotate(angle);const p=colors[type]||colors.iron_guard,fill=(pts,col)=>polygon(c,pts,col),s=e.bossState||{};
  if(['iron_guard','flame_blade','general'].includes(type)){if(type==='flame_blade'&&(s.lit>s.clock||e.enraged)&&!e.dead)fire(c,t);blade(c,type==='flame_blade'?106:type==='general'?85:93,type==='flame_blade'?5:4,p.trim,type==='general');}
  if(type==='shield'){
   fill([[-28,-55],[14,-61],[28,-48],[24,39],[-1,57],[-29,39]],'#b9c2b6');fill([[-23,-49],[12,-54],[22,-44],[18,35],[-1,48],[-23,33]],'#667879');fill([[-23,-49],[-10,-51],[-11,39],[-1,48],[-23,33]],'#43565b');fill([[8,-52],[17,-46],[13,35],[-1,48],[5,31]],'#7f9190');line(c,[[0,-44],[-4,35]],'#d9bd76',5);oval(c,-2,-8,9,10,'#d9bd76');
  }
  if(type==='hunter'){
   line(c,[[0,14],[0,-65]],'#986b45',5);fill([[-3,-69],[10,-76],[19,-66],[36,-60],[32,-39],[23,-29],[13,-31],[5,-43],[-3,-45]],'#a8b6b1');fill([[19,-66],[36,-60],[32,-39],[23,-29],[13,-31],[26,-42]],'#d9ded0');fill([[-5,-70],[4,-70],[5,-44],[-4,-44]],'#6e7e7c');
  }
  if(type==='crossbow'){
   line(c,[[0,17],[0,-58]],'#a77b51',6);line(c,[[0,-15],[0,-64]],'#bcc1ae',2);c.beginPath();c.moveTo(-29,-23);c.quadraticCurveTo(-24,-65,0,-53);c.quadraticCurveTo(24,-65,29,-23);c.strokeStyle='#bd8561';c.lineWidth=4;c.stroke();line(c,[[-29,-23],[0,-5],[29,-23]],'#d1cfb9',1.2);fill([[-3,-59],[0,-68],[3,-59]],'#dddcc8');
  }
  if(type==='war_hammer'){
   line(c,[[0,35],[0,-102]],'#ab7953',7);line(c,[[-2,29],[-2,-93]],'#d09b63',2);fill([[-39,-121],[27,-121],[40,-108],[40,-67],[-27,-67],[-39,-80]],'#737c7a');fill([[-39,-121],[27,-121],[40,-108],[-25,-108]],'#a3aaa0');fill([[-39,-121],[-25,-108],[-25,-67],[-39,-80]],'#505e60');fill([[27,-121],[40,-108],[40,-67],[27,-76]],'#536266');for(const x of [-19,21])fill([[x-4,-109],[x+4,-109],[x+4,-68],[x-4,-68]],'#e4c16c');diamond(c,0,-88,5,'#efcd7c');if(s.charged&&!e.dead){line(c,[[-30,-107],[-15,-98],[-22,-83],[-7,-77]],'#ffe6a1',2);for(let i=0;i<3;i++)diamond(c,Math.sin(t*4+i*2)*46,-93+Math.cos(t*3+i)*30,3,'#f1d276');}
  }
  if(type==='butcher'){
   line(c,[[0,12],[0,-44]],'#665246',7);fill([[-8,-51],[39,-54],[43,-16],[-6,-12]],'#aeb6af');fill([[-6,-12],[43,-16],[43,-23],[-7,-19]],'#d8d7c2');fill([[8,-47],[22,-43],[25,-32],[38,-31],[40,-18],[25,-19],[16,-27],[4,-22],[0,-35]],'#945253');oval(c,31,-44,3,3,'#697772');
  }
  if(type==='hook'){
   const moving=e.state==='active'&&['hook','hookArc','melee'].includes(e.attack?.action),reach=moving?18:0;
   for(let i=0;i<8;i++){const x=Math.sin(i*.37+t*2)*5,y=6+i*7+reach*i/8;c.beginPath();c.ellipse(x,y,i%2?2:4,5,0,0,Math.PI*2);c.strokeStyle=i%2?'#a5acab':'#78858b';c.lineWidth=2;c.stroke();}
   const y=62+reach;fill([[-4,y-8],[-9,y+9],[-4,y+19],[10,y+22],[20,y+12],[15,y-5],[12,y+9],[6,y+13],[0,y+11],[2,y-7]],'#bfc6c3');
  }
  if(type==='archmage'){
   line(c,[[0,46],[0,-91]],'#a87e51',5);line(c,[[0,-85],[-17,-103],[-17,-124]],'#d4ae71',5);line(c,[[0,-85],[19,-106],[17,-121]],'#d4ae71',5);diamond(c,0,-122,21,'#a763c7');oval(c,0,-121,10,12,'#d998ed');oval(c,0,-122,6,7,'#f5d8ee');for(let i=0;i<3&&!e.dead;i++)diamond(c,Math.sin(t*1.5+i*2.1)*29,-124+Math.cos(t*1.5+i*2.1)*29,5,'#c17fdf');fill([[-7,-73],[7,-73],[7,-80],[-7,-80]],'#e1bc79');
  }
  if(type==='pistol'){
   fill([[-5,13],[4,15],[8,-7],[3,-18],[-7,-12]],'#585b59');fill([[-4,-15],[-5,-49],[5,-49],[7,-15],[3,-8]],'#adb4b0');fill([[-5,-49],[5,-49],[5,-44],[-5,-44]],'#6b7a7d');line(c,[[2,-40],[2,-19]],'#d2d2bd',2);line(c,[[6,-11],[13,-8],[12,-1],[7,0]],'#939d96',2);
  }
  if(type==='reaper'){
   line(c,[[0,61],[0,-129]],'#8d6c51',6);fill([[-17,-133],[-4,-144],[23,-146],[53,-136],[77,-113],[88,-78],[92,-36],[84,-61],[73,-88],[55,-107],[30,-121],[4,-125]],'#565365');fill([[4,-125],[30,-121],[55,-107],[73,-88],[84,-61],[92,-36],[83,-78],[65,-106],[43,-123],[17,-135],[3,-136]],'#b37dcf');fill([[3,-136],[17,-135],[43,-123],[65,-106],[83,-78],[74,-91],[57,-109],[35,-123],[10,-130]],'#d3a0e8');fill([[-17,-133],[-31,-129],[-17,-124],[-6,-128]],'#858a90');
  }
  c.restore();
 }
 function head(c,k,r,p){
  const [x,y]=r.head,fill=(pts,col)=>polygon(c,pts.map(([a,b])=>[a+x,b+y]),col);
  oval(c,x,y,16,17,p.skin);
  if(k==='iron_guard'||k==='war_hammer'){
   fill([[-17,-19],[7,-23],[19,-15],[18,17],[-13,18],[-19,5]],p.body);fill([[-17,-19],[7,-23],[19,-15],[-6,-14]],p.light);fill([[-17,-19],[-6,-14],[-5,17],[-13,18],[-19,5]],p.shade);fill([[-3,-5],[17,-7],[16,13],[-2,13]],'#253339');for(let i=0;i<(k==='war_hammer'?3:2);i++)fill([[i*6,-5],[3+i*6,-6],[2+i*6,13],[-1+i*6,13]],k==='war_hammer'?p.trim:'#b8c4bc');
  }else if(k==='butcher'){
   fill([[-16,-11],[-15,-19],[4,-22],[16,-12],[14,11],[-6,19],[-16,7]],'#454742');fill([[-7,-16],[9,-20],[20,-10],[20,7],[10,22],[-5,17],[-10,3]],'#d6d0b6');fill([[1,-13],[11,-12],[15,-5],[9,2],[6,-5]],'#915550');oval(c,x+2,y+5,2.3,3.4,'#30383a');oval(c,x+14,y+4,2.3,3.4,'#30383a');for(let i=0;i<3;i++)oval(c,x+2+i*5,y+13+i%2,1.4,2,'#30383a');
  }else if(k==='general'){
   oval(c,x+5,y+2,10,9,'#202c32');fill([[-21,-15],[17,-20],[22,-8],[-15,-4]],p.cloth);fill([[-17,-7],[20,-12],[24,-6],[-14,0]],'#472f32');fill([[-17,-9],[20,-14],[19,-10],[-16,-5]],p.trim);fill([[14,-6],[30,-2],[19,3],[-5,0]],p.shade);diamond(c,x+10,y-11,3,p.trim);
  }else if(k==='archmage'){
   oval(c,x+5,y+2,10,11,'#222934');fill([[-21,-15],[-11,-43],[-17,-64],[3,-54],[17,-16]],'#645077');fill([[-17,-64],[3,-54],[9,-37],[-7,-43]],'#9572a0');fill([[-39,-8],[5,-23],[36,-13],[2,-5]],'#826791');fill([[-39,-8],[2,-5],[36,-13],[9,-9],[-9,-3]],'#45374f');
  }else{
   const hood=k==='hunter'?p.cloth:p.body;
   fill([[-19,8],[-21,-10],[-8,-26],[8,-24],[21,-6],[15,18],[2,23],[-13,16]],hood);fill([[-21,-10],[-8,-26],[8,-24],[0,-9],[-11,9]],k==='hunter'?'#a06449':p.light);
   if(k==='reaper'){
    fill([[-6,-8],[7,-12],[17,0],[11,16],[-1,20],[-10,7]],'#171b27');fill([[-5,2],[3,5],[1,10],[-4,8]],'#c985e7');fill([[6,5],[14,1],[12,8],[7,10]],'#c985e7');
   }else{
    fill([[-4,-6],[13,-8],[18,-1],[13,13],[4,17],[-3,8]],p.skin);oval(c,x+7,y+3,8,8,'#273238');fill([[-4,-6],[13,-8],[18,-1],[9,-1]],'#e0dac0');
   }
  }
 }
 function draw(c,e,k,t){
  const r=rig(e,k,t),p=colors[k],{hip,chest,head:hd,shoulders,elbows,hands,knees,feet}=r,[hx,hy]=hip,[cx,cy]=chest,fill=(pts,col)=>polygon(c,pts,col),w=k==='butcher'?23:k==='war_hammer'?23:17,flutter=Math.sin(t*3+(e.id||0))*3;
  // Torso-relative cloth anchors keep cloaks attached through recoil and stagger.
  if(['hunter','war_hammer','general','archmage','reaper'].includes(k)){
   const long=k==='reaper'||k==='archmage',tail=long?73:58;
   fill([[cx-12,cy-8],[cx-28,cy+10],[hx-42-flutter,hy+tail],[hx-25,hy+tail-13],[hx-22,hy+tail-1],[hx+3,hy+30],[hx+16,hy+40],[hx+10,hy-10]],p.cloth);
   fill([[cx-12,cy-8],[cx-28,cy+10],[hx-42-flutter,hy+tail],[hx-32,hy+tail-12],[hx-20,hy+3]],k==='general'?'#65322f':k==='war_hammer'?'#502e3a':p.shade);
   if(k==='reaper')for(let i=0;i<4;i++)fill([[cx-18-i*3,cy+9+i*9],[hx-8-i*5,hy+12+i*7],[hx-37-i*7,hy+65-i*9],[hx-30-i*5,hy+39-i*5],[hx-45-i*6,hy+46-i*6]],i%2?p.body:p.cloth);
  }
  if(k==='hunter')for(let i=0;i<3;i++){const x=cx-19+i*6;line(c,[[x+5,cy+27],[x-14,cy-40-i*2]],'#ae9870',2);fill([[x-14,cy-40-i*2],[x-21,cy-43-i*2],[x-18,cy-34-i*2],[x-12,cy-31-i*2]],'#d3cfb3');}
  const arm=(i)=>{segment(c,shoulders[i],elbows[i],k==='butcher'?8:6,4.5,k==='butcher'?p.skin:p.body,p.shade);segment(c,elbows[i],hands[i],k==='butcher'?6:3.8,3,k==='iron_guard'||k==='war_hammer'?p.light:p.skin,k==='butcher'?p.shade:'#899491');};
  arm(0);
  const off={iron_guard:'shield',hunter:'crossbow',butcher:'hook',general:'pistol'}[k];
  if(off&&k!=='iron_guard'&&!e.dead&&!hookFlying(e))weapon(c,off,hands[0],r.backAngle,e,t);
  for(let i=0;i<2;i++){
   segment(c,hip,knees[i],k==='butcher'?7:7.5,5,p.body,p.shade);segment(c,knees[i],feet[i],4.8,3.3,k==='butcher'?p.skin:k==='archmage'||k==='reaper'?p.light:'#b5bcad',p.shade);
   const [x,y]=feet[i];fill([[x-5,y-3],[x+4,y-3],[x+9,y],[x+10,y+4],[x-8,y+4],[x-8,y]],k==='archmage'?p.light:p.skin);
  }
  fill([[cx-w,cy-3],[cx-9,cy-10],[cx+12,cy-8],[cx+w,cy+3],[hx+13,hy+4],[hx-13,hy+6],[cx-w,cy+22]],p.body);
  fill([[cx-w,cy-3],[cx-9,cy-10],[cx-8,cy+20],[hx-13,hy+6],[cx-w,cy+22]],p.shade);
  fill([[cx+2,cy-8],[cx+12,cy-8],[cx+w,cy+3],[hx+13,hy+4],[hx+5,hy],[cx+9,cy+17]],p.light);
  segment(c,[cx+4,cy-5],[hd[0],hd[1]+12],4.5,4,p.skin);
  if(k==='iron_guard'||k==='war_hammer'){
   fill([[cx-12,cy+8],[cx+17,cy+9],[hx+12,hy-7],[hx-11,hy-6]],p.body);line(c,[[cx+7,cy+11],[hx+7,hy-8],[hx-9,hy-5]],k==='war_hammer'?p.trim:p.light,4);
   fill([[hx-8,hy+4],[hx+7,hy+2],[hx+13,hy+34],[hx+1,hy+29],[hx-7,hy+35],[hx-11,hy+14]],p.cloth);
  }
  if(k==='hunter'){line(c,[[cx+7,cy-4],[hx-8,hy-4]],'#b6aa8a',5);fill([[cx-22,cy-7],[cx+2,cy-10],[cx+15,cy+12],[cx-5,cy+8],[cx-26,cy+10]],p.cloth);fill([[hx-13,hy+3],[hx+12,hy+3],[hx+4,hy+23],[hx-11,hy+18],[hx-21,hy+29]],'#5f5146');}
  if(k==='butcher'){
   line(c,[[cx-14,cy-5],[hx-11,hy+3]],'#3d4241',7);line(c,[[cx+15,cy-3],[hx+13,hy+3]],'#3d4241',7);
   fill([[cx-10,cy+20],[cx+17,cy+21],[hx+17,hy+38],[hx+7,hy+30],[hx+2,hy+38],[hx-16,hy+30],[hx-15,hy-4]],p.cloth);fill([[cx-2,cy+30],[cx+8,cy+29],[cx+8,cy+42],[hx+5,hy+8],[hx+10,hy+16],[hx-1,hy+19],[hx-7,hy+5]],'#a0514a');
  }
  if(k==='archmage'){
   fill([[cx-12,cy+1],[hx-13,hy],[hx-22,hy+59],[hx-4,hy+63],[hx+4,hy+14],[hx+16,hy+64],[hx+29,hy+57],[hx+13,hy-2],[cx+15,cy]],p.body);line(c,[[cx-10,cy+3],[hx-7,hy],[hx-13,hy+58]],p.trim,3);line(c,[[cx+9,cy+4],[hx+9,hy],[hx+23,hy+58]],p.trim,3);fill([[cx-17,cy-9],[cx+4,cy-5],[cx+19,cy+9],[cx+5,cy+14],[cx-17,cy+2],[cx-25,cy+9],[cx-28,cy+3]],p.light);line(c,[[cx-28,cy+3],[cx-17,cy+7],[cx-12,cy+2]],p.trim,3);
  }
  if(k==='general'){
   fill([[cx-16,cy-9],[cx-2,cy-5],[cx+4,cy+15],[cx-9,cy+6]],p.cloth);fill([[cx+6,cy-6],[cx+18,cy],[cx+9,cy+17],[cx+5,cy+2]],p.cloth);line(c,[[cx+6,cy+19],[hx+6,hy-6]],p.trim,3);oval(c,cx+10,cy+15,3,4,p.trim);
  }
  if(k==='reaper'){
   fill([[cx-19,cy-9],[cx+10,cy-11],[cx+21,cy+5],[hx+9,hy+28],[hx-6,hy+17],[hx-22,hy+44],[hx-24,hy+9],[cx-29,cy+21]],p.body);fill([[cx-19,cy-9],[cx-7,cy+10],[hx-6,hy+17],[hx-22,hy+44],[hx-13,hy+12],[cx-20,cy+28]],p.cloth);
  }
  if(k!=='reaper'&&k!=='butcher'){line(c,[[hx-13,hy],[hx+13,hy-2]],k==='flame_blade'?p.cloth:p.trim,5);}
  head(c,k,r,p);
  if(k==='flame_blade'){
   fill([[hd[0]-14,hd[1]+12],[hd[0]+10,hd[1]+17],[cx+9,cy+7],[cx-9,cy]],p.cloth);fill([[hd[0]-11,hd[1]+13],[cx-34,cy-7],[cx-59-flutter,cy+3],[cx-48,cy-12],[cx-62,cy-17],[cx-28,cy-16]],p.cloth);fill([[hx-11,hy+3],[hx-16,hy+30],[hx-25,hy+42],[hx-20,hy+11]],p.cloth);
  }
  arm(1);
  if(['iron_guard','war_hammer','general'].includes(k)){
   const [x,y]=shoulders[1];fill([[x-10,y-7],[x+6,y-12],[x+18,y-2],[x+11,y+13],[x-6,y+10]],p.body);fill([[x-10,y-7],[x+6,y-12],[x+18,y-2],[x+2,y+2]],p.light);if(k!=='iron_guard')line(c,[[x-8,y+8],[x+8,y+11],[x+17,y-1]],p.trim,4);
   if(k==='general')for(let i=0;i<4;i++)line(c,[[x-8+i*5,y+8],[x-9+i*5,y+17]],p.trim,3);
  }
  if(!e.dead)weapon(c,k,hands[1],r.angle,e,t);
  if(off==='shield'&&!e.dead)weapon(c,off,hands[0],r.backAngle,e,t);
  for(const h of hands)oval(c,h[0],h[1],4,4.5,p.skin);
  if(k==='reaper'&&e.attack?.pose==='point'&&['windup','active','recovery'].includes(e.state))line(c,[hands[0],[hands[0][0]+12,hands[0][1]-1]],p.skin,2.5);
  if(k==='archmage'&&!e.dead)for(let i=0;i<3;i++)diamond(c,cx-43+Math.sin(t+i*2)*13,cy+15+i*25,7,'#b676d2');
  return r;
 }
 function drops(c,e,k,t,d){const off={iron_guard:'shield',hunter:'crossbow',butcher:'hook',general:'pistol'}[k],r=rig({...e,dead:true,deathT:0,attack:null},k,t);for(const [i,type] of [k,off].filter(Boolean).entries()){const u=clamp(d*2.5),sign=i?-1:1,start=r.hands[i?0:1],height=type==='shield'?28:type==='war_hammer'?40:15;weapon(c,type,[start[0]+sign*u*42,start[1]*(1-u*u)-height*u*u],-.4+(-Math.PI/2+.4)*u,e,t);}}
 function hookFlying(e){const a=e.attack;if(a?.action!=='hook')return false;const elapsed=e.state==='active'?e.t-a.active*(a.contactFraction??.35):e.state==='recovery'?a.active*(1-(a.contactFraction??.35))+(e.recoveryTotal||a.recovery)-e.t:-1;return elapsed>=0&&elapsed<.55;}
 function anchor(e,k,t,part='hand'){const r=rig(e,k,t),v=part==='foot'?r.feet[1]:r.hands[0],s=e.scale||1;return [e.x+(e.face||1)*v[0]*s,e.y-(e.z||0)+v[1]*s];}
 function hookTip(c,x,y,angle,scale){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);polygon(c,[[-4,-8],[-9,9],[-4,19],[10,22],[20,12],[15,-5],[12,9],[6,13],[0,11],[2,-7]],'#bfc6c3');c.restore();}
 return {kinds,rig,sample,draw,drops,anchor,hookTip,hookFlying};
})(Motion);

/* Mutated chapter: distinct anatomy, attached props and combat-timed skeletal clips. */
const MutantArt=(function(Motion){
 'use strict';
 const kinds=new Set(['sacrifice','giant_zombie','explorer','mutant_blade','impaler','crystal_claw','champion','dying','plague']);
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const mix=(a,b,t)=>t<=0?{...a}:t>=1?{...b}:Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
 const curve=(frames,t)=>{for(let i=1;i<frames.length;i++)if(t<=frames[i][0])return mix(frames[i-1][1],frames[i][1],smooth((t-frames[i-1][0])/(frames[i][0]-frames[i-1][0])));return {...frames.at(-1)[1]};};
 const anatomy={
  sacrifice:{factor:1.65,shoulder:23,upper:27,lower:28,width:35},
  giant_zombie:{factor:1.90,shoulder:25,upper:25,lower:26,width:42},
  explorer:{factor:1.68,shoulder:7,upper:23,lower:24,width:16},
  mutant_blade:{factor:1.65,shoulder:12,upper:25,lower:27,width:19},
  crystal_claw:{factor:1.68,shoulder:14,upper:25,lower:26,width:22},
  champion:{factor:1.76,shoulder:19,upper:23,lower:24,width:30},
  dying:{factor:1.80,shoulder:27,upper:26,lower:27,width:45},
  plague:{factor:1.65,shoulder:12,upper:26,lower:28,width:20}
 };
 const base={hipX:0,hipY:-35,lean:0,head:0,hx:30,hy:-45,bx:-28,by:-43,angle:2.6,backAngle:3.5,fx:22,fy:0,rx:-22,ry:0,bodyLift:0,rotation:0,bowPull:0,yaw:0};
 function rest(k){return {...base,...({
  sacrifice:{hipY:-30,lean:.33,hx:39,hy:-25,bx:-26,by:-23,angle:2.75,backAngle:3.05,fx:26,rx:-25},
  giant_zombie:{hipY:-36,lean:.24,hx:39,hy:-28,bx:-28,by:-24,angle:.65,backAngle:3.05},
  explorer:{lean:.24,hx:34,hy:-51,bx:-23,by:-31,angle:.18,backAngle:3.3},
  mutant_blade:{hipY:-32,lean:.25,hx:40,hy:-28,bx:-34,by:-30,angle:2.9,backAngle:3.45},
  crystal_claw:{hipY:-32,lean:.2,hx:39,hy:-34,bx:-24,by:-26,angle:2.7,backAngle:3.05},
  champion:{hipY:-40,lean:.12,head:-.08,hx:19,hy:-32,bx:-19,by:-30,angle:1.97,backAngle:3.05,fx:26,rx:-25},
  dying:{hipY:-33,lean:.34,head:.15,hx:40,hy:-23,bx:-28,by:-21,angle:3,backAngle:3.05},
  plague:{hipY:-32,lean:.37,hx:42,hy:-35,bx:-24,by:-25,angle:2.75,backAngle:3.0}
 })[k]};}
 function keys(k,a,style){
  const r=rest(k),p=v=>({...r,...v});let wind,hit,follow;
  if(style==='thrust'||style==='punch'){
   wind=p({hipX:-6,lean:-.05,hx:3,hy:-54,angle:1.2});hit=p({hipX:9,lean:.35,hx:54,hy:-56,angle:Math.PI/2,fx:33,rx:-24});follow=p({hipX:11,lean:.4,hx:51,hy:-48,angle:1.9,fx:34,rx:-24});
  }else if(style==='overhead'||style==='leap'){
   const heavy=a.name==='巨剑重斩';wind=p({hipX:-4,hipY:-33,lean:-.16,hx:heavy?-12:-5,hy:heavy?-105:-95,angle:heavy?-1.05:-.7,fx:24,rx:-23});hit=p({hipX:8,hipY:-29,lean:.32,hx:41,hy:-43,angle:2,fx:32,rx:-25});follow=p({hipX:10,hipY:-27,lean:.4,hx:29,hy:-25,angle:2.8,fx:34,rx:-24});
  }else if(style==='uppercut'||style==='reverse'){
   wind=p({hipX:-5,hipY:-29,lean:.08,hx:9,hy:-21,angle:3});hit=p({hipX:7,lean:.24,hx:46,hy:-56,angle:1.15,fx:30,rx:-24});follow=p({hipX:9,lean:.14,hx:24,hy:-91,angle:-.35,fx:31,rx:-24});
  }else if(style==='kick'){
   wind=p({hipX:-4,hipY:-37,lean:-.1,fx:18,fy:-22,rx:-17});hit=p({hipX:-1,hipY:-35,lean:-.23,fx:44,fy:-28,rx:-17});follow=p({hipX:1,lean:-.04,fx:31,fy:-12,rx:-18});
  }else if(style==='guard'){
   wind=p({hipX:-3,lean:-.12,hx:24,hy:-59,angle:.35,bx:17,by:-53});hit=follow=wind;
  }else if(style==='rear'){
   wind=p({lean:.55,hipY:-29,hx:33,hy:-27,bx:-31,by:-64,backAngle:4.1});hit=p({lean:.24,hipX:6,hx:45,hy:-43,bx:-47,by:-58,backAngle:4.7,fx:29,rx:-25});follow=p({lean:.35,bx:-39,by:-39,backAngle:3.8});
  }else if(style==='suicide'){
   wind=hit=follow=p({hipY:-31,lean:.08,hx:33,hy:-108,bx:-31,by:-107,angle:-.35,backAngle:.35,fx:27,rx:-26});
  }else if(style==='burst'){
   wind=p({hipY:-24,lean:.5,hx:15,hy:-44,bx:4,by:-47,angle:.3,backAngle:-.3,fx:25,rx:-25});hit=p({hipY:-34,lean:.06,hx:46,hy:-65,bx:-41,by:-68,angle:1.3,backAngle:-1.3,fx:28,rx:-26});follow=p({hipY:-30,lean:.25,hx:42,hy:-33,bx:-38,by:-37,angle:2.7,backAngle:3.5,fx:28,rx:-26});
  }else if(style==='cast'||style==='hover'){
   wind=p({lean:.1,hx:20,hy:-78,angle:-.1,bx:-16,by:-48});hit=p({lean:.14,hx:44,hy:-67,angle:.15,bx:12,by:-60,backAngle:.6});follow=p({lean:.18,hx:37,hy:-59,angle:.2,bx:6,by:-51});
   if(style==='hover'){wind=p({hipY:-28,lean:.34,hx:27,hy:-62});hit=p({hipY:-36,lean:.1,hx:37,hy:-68,bx:-32,by:-61,angle:.1,fx:23,fy:0,rx:-23,ry:0});follow=hit;}
  }else if(style==='throw'){
   wind=p({hipX:-5,lean:-.05,hx:-13,hy:-89,angle:-.8});hit=p({hipX:9,lean:.33,hx:52,hy:-60,angle:Math.PI/2,fx:31,rx:-24});follow=p({hipX:10,lean:.3,hx:42,hy:-39,angle:2.1,fx:32,rx:-24});
  }else{
   wind=p({hipX:-6,lean:-.12,hx:-24,hy:-70,angle:-1.4,fx:24,rx:-24});hit=p({hipX:8,lean:.28,hx:48,hy:-52,angle:1.5,fx:32,rx:-25});follow=p({hipX:11,lean:.37,hx:25,hy:-31,angle:2.85,fx:34,rx:-25});
  }
  // The supporting hand recoils and guards with the torso instead of freezing behind it.
  if(['sacrifice','giant_zombie','crystal_claw','dying','plague','champion'].includes(k)&&!['rear','burst','cast','hover','suicide'].includes(style)){
   Object.assign(wind,{bx:r.bx-9,by:r.by-12,backAngle:r.backAngle+.2});
   Object.assign(hit,{bx:r.bx+10,by:r.by+3,backAngle:r.backAngle-.3});
   Object.assign(follow,{bx:r.bx+15,by:r.by-5,backAngle:r.backAngle-.15});
  }
  if(k==='giant_zombie'&&style==='punch')for(const v of [wind,hit,follow]){v.bx=v.hx;v.by=v.hy;v.backAngle=v.angle;v.hx=r.hx;v.hy=r.hy;v.angle=r.angle;}
  if(k==='dying'&&a.beforeRage&&style==='overhead')for(const v of [wind,hit,follow]){v.bx=v.hx-14;v.by=v.hy-4;v.backAngle=v.angle-.15;}
  return {r,wind,hit,follow};
 }
 function styleFor(k,a){if(k==='sacrifice'&&a.action==='suicide')return 'suicide';if(k==='sacrifice'&&a.action==='quake')return 'burst';if(a.action==='bombard')return 'hover';if(a.action==='returnSword'||a.action==='lob')return 'throw';if(['heal','randomOrb','plagueZombies','plagueOrb'].includes(a.action))return 'cast';return a.pose;}
 function timeline(e,k){const a=e.attack,style=a.action==='combo'?'sweep':styleFor(k,a),v=keys(k,a,style),contact=clamp(a.contactFraction??.35,0,.95);let wind=v.wind,end=v.follow,frames;
  if(contact===0){wind=v.hit;frames=[[0,v.hit],[1,v.follow]];}else frames=[[0,v.wind],[contact,v.hit],[Math.max(contact+.02,.83),v.follow],[1,v.follow]];
  if(a.action==='combo'){const b=keys(k,a,a.secondPose),second=clamp(contact+(a.secondAt||.48)/a.active,contact+.08,.96);
   if(k==='crystal_claw')for(const q of [b.wind,b.hit,b.follow]){const x=q.hx,y=q.hy,angle=q.angle;q.hx=q.bx+20;q.hy=q.by-7;q.angle=q.backAngle;q.bx=x;q.by=y;q.backAngle=angle;}
   frames=[[0,v.wind],[contact,v.hit],[contact+(second-contact)*.25,v.follow],[second-(second-contact)*.25,b.wind],[second,b.hit],[1,b.follow]];end=b.follow;}
  if(style==='spin'){
   const spin=q=>({...v.hit,hipX:Math.sin(q*Math.PI*2)*5,lean:Math.sin(q*Math.PI*2)*.2,hx:Math.cos(q*Math.PI*2)*42,hy:-53+Math.sin(q*Math.PI*2)*10,bx:-Math.cos(q*Math.PI*2)*37,by:-48-Math.sin(q*Math.PI*2)*8,angle:1.5+q*Math.PI*2,backAngle:-1.5+q*Math.PI*2,yaw:q*Math.PI*2});
   wind=spin(0);end=spin(1);if(e.state==='active')return spin(clamp(e.t/a.active));
  }
  if(e.state==='windup')return curve([[0,v.r],[.82,wind],[1,wind]],clamp(e.t/a.wind));
  if(e.state==='active')return curve(frames,clamp(e.t/a.active));
  const near=(from,to)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from)),settle=style==='spin'?{...v.r,angle:near(end.angle,v.r.angle),backAngle:near(end.backAngle,v.r.backAngle)}:v.r;return mix(end,settle,smooth(1-e.t/(e.recoveryTotal||a.recovery||.5)));
 }
function sample(e,k,t){
  const r=rest(k);let p={...r};
  if(k==='champion'&&e.bossState?.reviveUntil>e.bossState?.clock){
   const q=clamp(1-(e.bossState.reviveUntil-e.bossState.clock)/1.15);
   const kneel={...r,hipY:-20,lean:.49,head:.24,hx:24,hy:-22,bx:-10,by:-24,angle:2.5,backAngle:3.2,fx:44,fy:0,rx:22,ry:0};
   return q<.24?mix(r,kneel,smooth(q/.24)):q<.62?kneel:mix(kneel,r,smooth((q-.62)/.38));
  }
  if(e.dead||['hurt','flinch','stunned','knockdown'].includes(e.state)){const q=Motion.samplePose(e,false,t);return {...q,angle:q.angle+Math.PI/2,backAngle:q.backAngle+Math.PI/2};}
  if(e.attack&&['windup','active','recovery'].includes(e.state))p=timeline(e,k);
  else{const q=Motion.samplePose(e,false,t);p.hipY+=q.hipY+35;if(e.walking){p.fx=q.fx;p.fy=q.fy;p.rx=q.rx;p.ry=q.ry;p.hx+=(q.hx-23)*.4;p.bx+=(q.bx+15)*.4;}}
  if(['sacrifice','giant_zombie','crystal_claw','dying','plague'].includes(k)){p.bx+=Math.sin(t*1.8)*1.3;p.by+=Math.cos(t*1.8)*1.1;p.backAngle+=Math.sin(t*1.8)*.035;}
  if(k==='dying'&&e.enraged){const a=e.attack,settle=a&&e.state==='windup'?1-smooth(clamp(e.t/a.wind)/.82):a&&e.state==='active'?0:a&&e.state==='recovery'?smooth(1-e.t/(e.recoveryTotal||a.recovery)):1;p.angle-=.95*settle;}
  // Flight height comes exclusively from the encounter. Only tuck the limbs here.
  if(e.z>4){const u=smooth(clamp(e.z/75));p.fx+=(18-p.fx)*u;p.fy-=u*12;p.rx+=(-20-p.rx)*u;p.ry-=u*17;}
  return p;
 }
 function chain(start,target,a,b,bend){const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy),d=clamp(raw,Math.abs(a-b)+.001,a+b-.001),end=[start[0]+(raw?dx/raw:0)*d,start[1]+(raw?dy/raw:1)*d];return {start,end,joint:Motion.ik(start,end,a,b,bend),upper:a,lower:b};}
 function rig(e,k,t){
  if(k==='impaler')return impalerRig(e,t);
  const spec=anatomy[k],s=spec.factor,p=sample(e,k,t),j=Motion.joints(p),scale=v=>v.map(x=>x*s),hip=scale(j.hip),chest=scale(j.chest),head=scale(j.head),shoulders=[-spec.shoulder,spec.shoulder].map(x=>[chest[0]+x,chest[1]+3]);
  const targets=[scale(j.back),scale(j.hand)],angles=[p.backAngle,p.angle];
  const count=k==='mutant_blade'?clamp(Math.floor(e.bossState?.arms||2),2,4):2;
  for(let i=2;i<count;i++){const sign=i%2?1:-1;shoulders.push([chest[0]+sign*spec.shoulder,chest[1]-9]);targets.push([chest[0]+sign*58,chest[1]-42]);angles.push(sign*.8);}
  if(k==='mutant_blade'&&e.attack&&['windup','active','recovery'].includes(e.state)){
   const a=e.attack,blend=e.state==='windup'?smooth(e.t/a.wind):e.state==='recovery'?1-smooth(1-e.t/(e.recoveryTotal||a.recovery)):1;
   // All blades share the attack beat. Upper arms retain a higher striking lane.
   // This is visual only: encounter hit counts and damage stay untouched.
   for(let i=0;i<count;i++){if(i===1)continue;const upper=i>=2,goal=[targets[1][0]+(i%2?13:-21),targets[1][1]-(upper?52:5)];targets[i]=targets[i].map((v,n)=>v+(goal[n]-v)*blend);angles[i]+=(p.angle+(upper?-.35:.18)-angles[i])*blend;}
  }
  const naturalBack=['sacrifice','giant_zombie','crystal_claw','dying','plague','champion'].includes(k);
  const arms=targets.map((v,i)=>chain(shoulders[i],v,spec.upper*s,spec.lower*s,naturalBack||i%2?1:-1)),legs=[j.rear,j.front].map((v,i)=>chain(hip,scale(v),24*s,25*s,i?-1:1));
  return {hip,chest,head,shoulders,hands:arms.map(v=>v.end),elbows:arms.map(v=>v.joint),feet:legs.map(v=>v.end),knees:legs.map(v=>v.joint),arms,legs,angle:p.angle,backAngle:p.backAngle,angles,factor:s,pose:p,anatomy:spec};
 }
 function impalerRig(e,t){
  const r={x:0,y:-45,pitch:.25,flex:.27,head:0,jaw:.15,lift:0,reach:0,coil:0},a=e.attack;
  let p={...r};
  if(a&&['windup','active','recovery'].includes(e.state)){
   const spine=a.action==='spineShot'||a.action==='spineVolley',slam=a.pose==='overhead',claw=a.name==='爪击';
   const wind={...r,x:-6,y:slam?-50:-42,pitch:slam?.72:spine?.40:.30,flex:slam?.52:spine?.3:.42,head:slam?-.3:.1,jaw:.08,lift:slam?45:claw?30:0,reach:-8,coil:1};
   const hit={...r,x:11,y:slam?-34:-43,pitch:slam?.08:.19,flex:slam?-.18:.08,head:.1,jaw:spine?.1:1,lift:0,reach:slam?16:claw?35:18,coil:0};
   const follow={...hit,x:13,jaw:.35,reach:8};
   if(e.state==='windup')p=mix(r,wind,smooth(e.t/a.wind));else if(e.state==='active')p=curve([[0,wind],[a.contactFraction??.35,hit],[.85,follow],[1,follow]],clamp(e.t/a.active));else p=mix(follow,r,smooth(1-e.t/(e.recoveryTotal||a.recovery)));
  }else if(e.walking){p.x=Math.sin((e.walkDistance||0)/24)*2;p.y-=Math.cos((e.walkDistance||0)/12);}
  if(['flinch','hurt'].includes(e.state)){p.x=-7;p.pitch=.5;p.jaw=.6;}if(e.state==='stunned'){p.y=-25;p.pitch=.1;p.jaw=.7;}if(e.dead){p.y=-33;p.pitch=.15;p.jaw=.5;}
  const hip=[-35+p.x,p.y],abdomen=[hip[0]+Math.cos(p.pitch)*30,hip[1]-Math.sin(p.pitch)*30],chest=[abdomen[0]+Math.cos(p.pitch+p.flex)*34,abdomen[1]-Math.sin(p.pitch+p.flex)*34],head=[chest[0]+Math.cos(p.head)*29,chest[1]+Math.sin(p.head)*29-3];
  const starts=[[hip[0]-7,hip[1]+3],[hip[0]+7,hip[1]+6],[chest[0]-8,chest[1]+13],[chest[0]+8,chest[1]+10]],feet=[[-74,0],[-35,2],[42+p.reach,-p.lift],[80+p.reach,-p.lift*.7]],walk=e.walking&&!['windup','active','recovery'].includes(e.state)?Math.sin((e.walkDistance||0)/23):0;
  const legs=feet.map((v,i)=>chain(starts[i],[v[0]+walk*(i%2?9:-9),v[1]-Math.max(0,walk*(i%2?1:-1))*6],i<2?32:38,i<2?35:40,i<2?1:-1));
  return {hip,abdomen,chest,head,spine:[{start:hip,end:abdomen,length:30},{start:abdomen,end:chest,length:34}],hips:starts,shoulders:[],hands:[],elbows:[],arms:[],legs,feet:legs.map(v=>v.end),knees:legs.map(v=>v.joint),factor:1,pose:p,angle:0,backAngle:0,angles:[]};
 }
 const palettes={
  sacrifice:{skin:'#98695c',shade:'#674e51',light:'#b58068',cloth:'#683b3b',bone:'#d6cfb4'},
  giant_zombie:{skin:'#9da68b',shade:'#737f70',light:'#bac1a5',cloth:'#654a3e',bone:'#e0d7b6'},
  explorer:{skin:'#c7c9ad',shade:'#909e89',light:'#ddd9bd',cloth:'#76533d',bone:'#dad3b5'},
  mutant_blade:{skin:'#b3a991',shade:'#786f6b',light:'#ded6bc',cloth:'#813f43',bone:'#e8e1c5'},
  crystal_claw:{skin:'#a6b0b2',shade:'#606e7c',light:'#cdd3c9',cloth:'#333d4c',bone:'#d7d6c1'},
  champion:{skin:'#536672',shade:'#293b48',light:'#93a6ad',cloth:'#6d2936',bone:'#d9b67b'},
  dying:{skin:'#b29a8d',shade:'#83746e',light:'#ccb4a0',cloth:'#793f39',bone:'#d4c7af'},
  plague:{skin:'#a3ad6a',shade:'#657b4e',light:'#c5c888',cloth:'#633d36',bone:'#ded9ae'},
  impaler:{skin:'#bca293',shade:'#8a706b',light:'#d2b8a3',cloth:'#944b4e',bone:'#e6dec3'}
 };
 function poly(c,pts,col){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();}
 function line(c,pts,col,w=2){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 function segment(c,a,b,wa,wb,col,shade){const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,n=[-(b[1]-a[1])/d,(b[0]-a[0])/d],pt=(v,w)=>[v[0]+n[0]*w,v[1]+n[1]*w];poly(c,[pt(a,wa),pt(b,wb),pt(b,-wb),pt(a,-wa)],col);if(shade)poly(c,[pt(a,-wa),pt(b,-wb),pt(b,0),pt(a,0)],shade);}
 function crystal(c,x,y,len,angle,col='#71c5ed'){c.save();c.translate(x,y);c.rotate(angle);poly(c,[[-7,3],[-11,-len*.45],[0,-len],[10,-len*.28],[7,3]],col);poly(c,[[0,-len],[10,-len*.28],[7,3],[0,-4]],col==='#71c5ed'?'#4196c6':'#a54c76');poly(c,[[0,-len],[-11,-len*.45],[0,-4]],col==='#71c5ed'?'#b0e8fb':'#f6a5ba');c.restore();}
 function scar(c,x,y,size=1){line(c,[[x-11*size,y-5*size],[x+12*size,y+4*size]],'#885452',3*size);for(let i=-1;i<2;i++)line(c,[[x+i*7*size,y-6*size+i*2],[x+(i*7-2)*size,y+4*size+i*2]],'#a27867',2.5*size);}
 function flame(c,x,y,n,t){c.save();c.translate(x,y);c.scale(.65,1);x=y=0;const f=Math.sin(t*7)*4;poly(c,[[x-n*.4,y],[x-n*.58,y-n*.27],[x-n*.2,y-n*.65],[x-n*.3,y-n*.46],[x+f,y-n],[x+n*.12,y-n*.57],[x+n*.35,y-n*.78],[x+n*.25,y-n*.24],[x+n*.45,y-n*.4],[x+n*.28,y]],'#ee5c2e');poly(c,[[x-n*.22,y],[x-n*.3,y-n*.22],[x+n*.08,y-n*.7],[x+n*.04,y-n*.37],[x+n*.22,y-n*.45],[x+n*.1,y]],'#ffa943');poly(c,[[x-n*.1,y],[x+n*.08,y-n*.4],[x+n*.18,y-n*.2],[x+n*.12,y]],'#ffdb78');c.restore();}
 function fist(c,h,angle,p,big=13){c.save();c.translate(...h);c.rotate(angle-Math.PI);poly(c,[[-big,-8],[-big-3,6],[-big*.5,17],[big*.6,18],[big+3,5],[big,-9]],p.skin);poly(c,[[-big,-8],[-big-3,6],[-big*.5,17],[0,12],[0,-8]],p.shade);line(c,[[-big*.4,7],[-big*.4,13]],p.light,1.5);line(c,[[big*.2,8],[big*.2,14]],p.light,1.5);c.restore();}
 function claws(c,h,angle,k,p,armored=true){c.save();c.translate(...h);c.rotate(angle-Math.PI);const burning=k==='sacrifice',icy=k==='crystal_claw',n=burning?2:3;
  poly(c,[[-14,-8],[10,-12],[19,1],[11,15],[-13,12],[-20,1]],burning?'#4b414b':icy?'#5d8098':p.shade);
  for(let i=0;i<n;i++){const x=(i-(n-1)/2)*12,len=burning?29:icy?43:37;poly(c,[[x-5,6],[x+5,5],[x+13,18],[x+15,len-2],[x+10,len+13],[x+8,22],[x-2,16]],burning?'#4e414c':icy?'#9adcf5':p.bone);if(icy)poly(c,[[x+5,5],[x+13,18],[x+15,len-2],[x+10,len+13],[x+11,19]],'#52a4d5');}
  if(icy&&armored)for(let i=0;i<4;i++)crystal(c,-13+i*9,2,22+i%2*14,(i-1.5)*.3);
  c.restore();
 }
 function armBlade(c,h,angle,p,extra=false){c.save();c.translate(...h);c.rotate(angle-Math.PI);if(extra)c.scale(.82,.82);poly(c,[[-8,-16],[10,-11],[21,14],[25,47],[19,68],[14,29],[3,9],[-10,2]],p.bone);poly(c,[[10,-11],[21,14],[25,47],[19,68],[20,29],[10,10]],'#a2a697');poly(c,[[-8,-16],[10,-11],[13,3],[3,-2],[-4,13],[-10,2]],'#994a4f');c.restore();}
 function greatsword(c,h,angle,dying=false){c.save();c.translate(...h);c.rotate(angle);line(c,[[0,20],[0,-17]],dying?'#643d3d':'#625449',7);poly(c,[[-20,-13],[20,-13],[21,-20],[-20,-20]],'#c7ae84');const len=dying?101:123,w=dying?9:18;poly(c,[[-w,-22],[-w,-len+13],[w-3,-len],[w+4,-len+13],[w,-22]],'#acb4b3');poly(c,[[-w,-22],[-w,-len+13],[-w+6,-len+10],[-w+6,-25],[w,-25],[w,-22]],'#d9ddca');poly(c,[[0,-26],[w,-25],[w+4,-len+13],[w-3,-len],[2,-len+8]],'#7b8b91');if(!dying){line(c,[[-2,-35],[-2,-105]],'#d2b575',4);oval(c,-2,-66,7,8,'#d2b575');}c.restore();}
 function trunk(c,h,angle){c.save();c.translate(...h);c.rotate(angle);poly(c,[[-6,20],[6,20],[12,-42],[24,-93],[10,-106],[-9,-83],[-18,-105],[-29,-109],[-24,-71],[-35,-83],[-26,-42],[-11,-26]],'#705547');poly(c,[[-6,20],[1,19],[6,-40],[11,-86],[24,-93],[10,-106],[-1,-60],[-11,-25]],'#92735a');poly(c,[[-12,-35],[-6,-87],[-18,-105],[-29,-109],[-23,-75]],'#493e3b');poly(c,[[9,-48],[27,-71],[39,-78],[31,-58],[19,-34]],'#ae9472');poly(c,[[-17,-55],[-34,-74],[-39,-97],[-28,-84],[-12,-63]],'#ad9474');line(c,[[-3,15],[3,-39]],'#b79c75',2);c.restore();}
 function embeddedSword(c,chest){
  // The visible blade ends at the chest wound; its buried tip is occluded by flesh.
  c.save();c.translate(chest[0]+7,chest[1]+17);c.rotate(.62);
  poly(c,[[-7,3],[-9,-47],[8,-47],[6,1],[0,9]],'#a8b2b6');
  poly(c,[[-7,3],[-9,-47],[-3,-47],[0,4]],'#e0dfcb');
  poly(c,[[0,4],[-3,-47],[8,-47],[6,1]],'#74858c');
  poly(c,[[-21,-47],[-22,-55],[-8,-52],[8,-52],[22,-55],[20,-47],[7,-45],[-8,-45]],'#c7af87');
  segment(c,[0,-53],[0,-81],4,5,'#653d3d','#422f36');
  poly(c,[[-6,-80],[0,-88],[7,-82],[5,-75],[-4,-75]],'#86625b');
  poly(c,[[-8,1],[-3,-7],[1,1],[7,-2],[8,9],[0,7],[-5,12]],'#7d3335');c.restore();
 }
 function lantern(c,h,angle,t,small=false,dead=false){c.save();c.translate(...h);c.rotate(angle);if(small){line(c,[[0,0],[0,17],[-12,24],[-13,47],[0,59],[13,46],[12,24],[0,17]],'#a59b80',3);c.save();if(dead)c.filter='grayscale(1) brightness(.22)';crystal(c,0,46,26,0,'#e17b98');c.restore();}else{
  poly(c,[[-22,-49],[22,-49],[24,37],[-25,37]],'#383e3e');poly(c,[[-22,-49],[0,-61],[23,-50],[6,-45]],'#83745e');line(c,[[-22,-49],[-25,37],[24,37],[22,-49],[-22,-49]],'#968a71',5);line(c,[[0,-60],[0,-72]],'#725a44',6);line(c,[[-25,37],[24,37]],'#b1a489',7);c.save();if(dead)c.filter='grayscale(1) brightness(.22)';crystal(c,0,17,47,0,'#d66b8e');poly(c,[[0,-30],[9,-3],[0,17],[-8,-1]],'#fa9fb1');c.restore();line(c,[[-5,-45],[-10,33]],'#b2a489',4);
  if(!dead){c.globalAlpha*=.25+.12*Math.sin(t*3);oval(c,0,-4,17,27,'#de80b2');}
 }c.restore();}
 function mask(c,x,y,p,kind){
  oval(c,x,y,15,17,p.shade);poly(c,[[x-8,y-15],[x+7,y-17],[x+17,y-7],[x+17,y+5],[x+7,y+17],[x-7,y+10]],p.bone);
  if(kind==='sacrifice'){poly(c,[[x-4,y-4],[x+3,y-6],[x+2,y+2],[x-5,y+3]],'#212b2d');poly(c,[[x+8,y-7],[x+15,y-6],[x+12,y+2],[x+7,y+1]],'#212b2d');for(let i=0;i<3;i++)line(c,[[x+i*5,y+10],[x-1+i*5,y+17]],'#53524a',2.5);}
  else oval(c,x+8,y,6.5,8,'#162a30');
 }
 function face(c,e,k,r,p){const [x,y]=r.head;
  if(k==='giant_zombie'){
   poly(c,[[x-18,y-19],[x-5,y-28],[x+19,y-17],[x+25,y+1],[x+14,y+19],[x-13,y+14],[x-21,y-1]],p.skin);poly(c,[[x-18,y-19],[x-5,y-28],[x+19,y-17],[x-3,y-16],[x-10,y+5]],p.light);poly(c,[[x+2,y-4],[x+27,y-3],[x+23,y+16],[x-1,y+12]],'#243530');for(let i=0;i<4;i++)poly(c,[[x+i*6,y-4],[x+5+i*6,y-3],[x+3+i*6,y+5]],p.bone);for(let i=0;i<3;i++)poly(c,[[x+3+i*7,y+13],[x+9+i*7,y+13],[x+6+i*7,y+6]],p.bone);line(c,[[x+7,y-12],[x+20,y-10]],'#5f6250',3);oval(c,x+16,y-11,1.5,1.2,'#c2925d');
  }else if(k==='champion'){
   if(e.bossState?.revived){oval(c,x,y,16,17,'#8b9181');poly(c,[[x-15,y-9],[x-6,y-19],[x+10,y-15],[x+15,y-3],[x+3,y-7],[x-6,y+9]],'#656e68');line(c,[[x+3,y-1],[x+12,y-3]],'#e4adad',3);scar(c,x-3,y+8,.65);}
   else{
    poly(c,[[x-17,y-15],[x-8,y-30],[x+2,y-36],[x+19,y-19],[x+23,y-5],[x+15,y+18],[x-5,y+22],[x-18,y+9]],'#526772');
    poly(c,[[x-17,y-15],[x-8,y-30],[x+2,y-36],[x+5,y-15],[x-3,y-6]],'#a3b4b8');
    poly(c,[[x+2,y-36],[x+19,y-19],[x+23,y-5],[x+5,y-15]],'#778e98');
    poly(c,[[x-7,y-9],[x+21,y-6],[x+19,y+1],[x-5,y-2]],'#172b34');
    line(c,[[x-8,y-11],[x+6,y-10],[x+22,y-6]],p.bone,3);
    poly(c,[[x+7,y],[x+20,y+2],[x+15,y+18],[x+4,y+22],[x-2,y+13]],'#748d97');
    line(c,[[x+7,y+2],[x+4,y+17]],'#c8c9ad',2);for(let i=0;i<3;i++)line(c,[[x+10+i*3,y+5],[x+8+i*3,y+12]],'#263c46',1.6);
    line(c,[[x-14,y+10],[x-3,y+20],[x+13,y+18]],p.bone,3);
   }
  }else if(k==='dying'){
   poly(c,[[x-15,y-13],[x+8,y-19],[x+18,y-6],[x+10,y+15],[x-9,y+8]],p.shade);poly(c,[[x-15,y-13],[x+8,y-19],[x+13,y-11],[x-4,y-6]],p.skin);line(c,[[x+5,y-5],[x+12,y-3]],'#a47e72',2);
  }else{
   if(k==='mutant_blade')poly(c,[[x-20,y+10],[x-22,y-9],[x-4,y-28],[x+14,y-23],[x+22,y-7],[x+7,y+5]],'#50515a');
   if(k==='plague')poly(c,[[x-21,y+8],[x-17,y-24],[x+9,y-21],[x+20,y-2],[x-1,y+7],[x-12,y+37],[x-25,y+23]],p.cloth);
   if(k==='plague'){
    poly(c,[[x-9,y-17],[x+9,y-20],[x+21,y-8],[x+19,y+4],[x+34,y+13],[x+41,y+25],[x+22,y+20],[x+8,y+12],[x-8,y+15],[x-14,y+1]],'#d4cfad');
    poly(c,[[x+13,y+1],[x+22,y+3],[x+34,y+13],[x+41,y+25],[x+22,y+16]],'#a7ad83');
    poly(c,[[x+19,y+4],[x+34,y+13],[x+41,y+25],[x+32,y+18]],'#ede4bc');
    oval(c,x+8,y-3,8,8,'#647450');oval(c,x+9,y-4,5.5,5.5,'#142b2c');oval(c,x+10,y-6,1.5,1.5,'#a8ba75');
    for(let i=0;i<3;i++)oval(c,x+22+i*4,y+10+i*3,1.2,1.5,'#67764f');
    line(c,[[x-12,y-5],[x-3,y-5]],'#4b5140',4);
   }else mask(c,x,y,p,k);
   if(k==='explorer'){poly(c,[[x-17,y-13],[x-9,y-29],[x+3,y-23],[x+12,y-28],[x+19,y-14]],'#795d40');poly(c,[[x-29,y-11],[x-7,y-18],[x+28,y-10],[x+15,y-5],[x-19,y-7]],'#a3875d');}
  }
 }
 function impaler(c,e,t){
  const r=rig(e,'impaler',t),p=palettes.impaler,{hip,abdomen,chest,head,legs}=r,fill=(pts,col)=>poly(c,pts,col),q=r.pose;
  const tail=[[hip[0]-13,hip[1]+4],[hip[0]-39,hip[1]+20],[hip[0]-47,hip[1]+41],[hip[0]-30,hip[1]+49]];line(c,tail,'#79494d',7);
  for(const i of [0,2]){const l=legs[i];segment(c,l.start,l.joint,7,5,p.shade,'#785e60');segment(c,l.joint,l.end,5,3,p.skin,p.shade);}
  segment(c,hip,abdomen,18,16,p.skin,p.shade);
  segment(c,abdomen,chest,20,26,p.skin,p.shade);
  fill([[hip[0]-13,hip[1]-10],[hip[0]-3,hip[1]-22],[abdomen[0]+3,abdomen[1]-17],[abdomen[0]-3,abdomen[1]-4],[hip[0]+3,hip[1]-1]],p.light);
  fill([[abdomen[0]-8,abdomen[1]-10],[abdomen[0]+2,abdomen[1]-25],[chest[0]+7,chest[1]-24],[chest[0]+19,chest[1]-7],[chest[0]+3,chest[1]+6],[abdomen[0]+1,abdomen[1]+2]],p.light);
  line(c,[[abdomen[0]-5,abdomen[1]-11],[abdomen[0]+1,abdomen[1]+1],[abdomen[0]-1,abdomen[1]+14]],'#8d7168',3);
  const count=clamp(e.bossState?.spines??8,0,8);for(let i=0;i<count;i++){const rear=i<4,u=(i%4)/4,a=rear?hip:abdomen,b=rear?abdomen:chest,x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u-(rear?15:21),len=34+(i%3)*12,dx=-19+(i-3)*3;fill([[x-9,y+12],[x-11,y-4],[x-4,y-18],[x+4,y-4],[x+8,y+8]],p.cloth);fill([[x-5,y],[x+dx-5,y-len*.6],[x+dx-20,y-len],[x+dx-4,y-len+6],[x+5,y-7],[x+7,y]],p.bone);}
  scar(c,chest[0]-13,chest[1]+2,.8);
  segment(c,chest,head,14,12,p.skin,p.shade);
  const [x,y]=head,open=5+q.jaw*12;fill([[x-13,y-18],[x+6,y-23],[x+22,y-13],[x+24,y+8],[x+10,y+18],[x-12,y+10]],p.skin);fill([[x-13,y-18],[x+6,y-23],[x+22,y-13],[x+7,y-9]],p.light);fill([[x-2,y+1],[x+24,y-2],[x+22,y+open],[x+4,y+open+4]],'#1e2b2b');for(let i=0;i<4;i++)fill([[x+i*6,y],[x+5+i*6,y],[x+3+i*6,y+7]],p.bone);for(let i=0;i<3;i++)fill([[x+4+i*6,y+open+2],[x+10+i*6,y+open+1],[x+7+i*6,y+open-5]],p.bone);line(c,[[x+6,y-11],[x+11,y-11]],'#89554b',2);line(c,[[x+17,y-10],[x+20,y-10]],'#89554b',2);
  for(const i of [1,3]){const l=legs[i];segment(c,l.start,l.joint,8,5,p.skin,p.shade);segment(c,l.joint,l.end,5,3,p.light,p.shade);}
  for(const l of legs){const [x,y]=l.end;fill([[x-5,y-3],[x+7,y-4],[x+15,y+3],[x+5,y+1],[x+5,y+5],[x-1,y+2],[x-6,y+3]],p.bone);}
  return r;
 }
 function draw(c,e,k,t){
  if(k==='impaler')return impaler(c,e,t);
  const r=rig(e,k,t),s=e.bossState||{},p={...palettes[k]},broken=k==='champion'&&s.revived,armored=s.armor!==false&&!e.dead,{hip,chest,head,shoulders,elbows,hands,feet,knees}=r,[hx,hy]=hip,[cx,cy]=chest,w=r.anatomy.width,fill=(pts,col)=>poly(c,pts,col);
  if(broken){p.skin='#829575';p.shade='#4e6856';p.light='#afba95';}
  if(['champion','explorer'].includes(k)){fill([[cx-17,cy-10],[cx-28,cy+6],[hx-43,hy+49],[hx-29,hy+38],[hx-25,hy+56],[hx-5,hy+18],[hx+10,hy+28],[hx+13,hy-6]],p.cloth);if(broken)fill([[cx-25,cy+8],[hx-26,hy+21],[hx-39,hy+26],[hx-33,hy+36],[hx-47,hy+39],[hx-37,hy+16]],'#402f36');}
  if(k==='champion'){
   const sway=Math.sin(t*2)*3+r.pose.lean*15;
   fill([[cx-24,cy-14],[cx-39,cy+3],[hx-55-sway,hy+39],[hx-45-sway,hy+34],[hx-42-sway,hy+58],[hx-29,hy+47],[hx-21,hy+55],[hx-13,hy+19],[cx-4,cy+5]],'#742b3a');
   fill([[cx-24,cy-9],[cx-29,cy+24],[hx-42-sway,hy+48],[hx-34,hy+15]],'#9a4146');
   fill([[cx-17,cy-4],[hx-19,hy+36],[hx-31,hy+43],[cx-25,cy+19]],'#472b38');
  }
  // Back attachments are in chest space: no floating cages or stationary spines.
  if(k==='sacrifice'){
   for(let i=0;i<6&&!e.dead;i++)flame(c,cx-32+i*12,cy+25-i%2*13,45+i%3*13,t+i);
   line(c,[[cx-25,cy+30],[cx-35,cy-62],[cx-27,cy-74]],'#775b41',7);line(c,[[cx+6,cy+17],[cx+10,cy-78]],'#846143',7);line(c,[[cx-50,cy-54],[cx+29,cy-65]],'#826044',9);line(c,[[cx-47,cy-57],[cx+27,cy-68]],'#b08455',2);
   for(const [x,y] of [[cx+27,cy-63],[hx-28,hy+3]]){line(c,[[x,y],[x,y+12]],'#c3b797',1.5);fill([[x-6,y+12],[x+7,y+12],[x+8,y+45],[x-7,y+44]],'#ddd1a6');if(!e.dead)flame(c,x,y+38,22,t);}
  }
  if(k==='explorer'){lantern(c,[cx-29,cy-2],-.12,t,false,e.dead&&(e.deathT||0)>.30);line(c,[[cx-39,cy+32],[hx-19,hy+11]],'#73634d',5);}
  if(k==='mutant_blade')for(let i=0;i<5;i++){const x=cx-23+i*9,y=cy-9-i%2*5;fill([[x-5,y+7],[x-14,y-17],[x-27,y-26],[x-10,y-23],[x+7,y+1]],p.bone);}
  if(k==='crystal_claw'&&armored)for(let i=0;i<8;i++)crystal(c,cx-30+i*8,cy-7,32+i%3*14,(i-4)*.18);
  if(k==='plague')for(let i=0;i<10;i++){const x=cx-24+Math.sin(i*2.4)*20,y=cy-13+i*6;oval(c,x,y,9+i%3*3,10+i%2*3,i%2?'#729044':'#8fac51');oval(c,x-3,y-4,3+i%2,3+i%2,'#bddb78');if(i%3===0)line(c,[[x-9,y+4],[x-17,y+17]],'#5f7440',3);}
  // Extra mutant arms are layered behind the torso, still with two fixed bones each.
  const arm=(i)=>{const broad=['sacrifice','giant_zombie','dying'].includes(k),wa=broad?19:k==='champion'?12:k==='crystal_claw'?10:6,wb=broad?14:k==='champion'?9:4.5;segment(c,shoulders[i],elbows[i],wa,wb,p.skin,p.shade);segment(c,elbows[i],hands[i],wb+1,broad?12:k==='champion'?8:4,p.light,p.shade);if(['giant_zombie','dying'].includes(k))scar(c,elbows[i][0],elbows[i][1],.75);if(k==='champion'){const el=elbows[i],h=hands[i];poly(c,[[el[0]-11,el[1]-8],[el[0]+10,el[1]-11],[el[0]+15,el[1]+1],[el[0]+3,el[1]+11],[el[0]-13,el[1]+5]],'#445c6a');segment(c,[el[0]+(h[0]-el[0])*.55,el[1]+(h[1]-el[1])*.55],h,11,9,'#617d8b','#334a59');segment(c,[el[0]+(h[0]-el[0])*.52,el[1]+(h[1]-el[1])*.52],[el[0]+(h[0]-el[0])*.63,el[1]+(h[1]-el[1])*.63],11,11,p.bone);}};
  const hand=(i)=>{if(k==='mutant_blade'&&e.dead){oval(c,...hands[i],5,4,'#8d4149');line(c,[[hands[i][0]-3,hands[i][1]],[hands[i][0]+3,hands[i][1]+1]],'#b97570',2);}else if(k==='crystal_claw'&&e.dead)fist(c,hands[i],r.angles[i],p,10);else if(['sacrifice','plague','crystal_claw'].includes(k))claws(c,hands[i],r.angles[i],k,p,armored);else if(k==='mutant_blade')armBlade(c,hands[i],r.angles[i],p,i>=2);else if(k==='giant_zombie'&&i===0||k==='dying'&&(!e.enraged||s.swordOut||i===0)||k==='champion'&&i===0)fist(c,hands[i],r.angles[i],p,k==='dying'?18:k==='giant_zombie'?17:11);else oval(c,...hands[i],4.5,5,p.skin);};
  for(let i=2;i<hands.length;i++){arm(i);hand(i);}arm(0);hand(0);
  for(let i=0;i<2;i++){
   const broad=['sacrifice','giant_zombie','dying'].includes(k),legColor=k==='champion'&&!broken?'#4e5b63':p.skin;
   segment(c,hip,knees[i],broad?11:k==='champion'?12:8,broad?8:k==='champion'?8:5,legColor,p.shade);segment(c,knees[i],feet[i],broad?8:k==='champion'?9:5,broad?6:k==='champion'?6:3.5,p.light,p.shade);
   const [x,y]=feet[i];fill([[x-7,y-4],[x+5,y-4],[x+13,y+3],[x+5,y+4],[x+2,y+2],[x-1,y+4],[x-9,y+3]],p.bone);
   if(k==='giant_zombie'&&i===0)fill([[knees[i][0]-7,knees[i][1]-10],[knees[i][0]+8,knees[i][1]-14],[knees[i][0]+12,knees[i][1]],[knees[i][0]-2,knees[i][1]+15],[knees[i][0]-8,knees[i][1]+10]],p.bone);
   if(k==='dying')scar(c,knees[i][0],knees[i][1],.8);
   if(k==='champion'){const [kx,ky]=knees[i];fill([[kx-10,ky-9],[kx+3,ky-15],[kx+12,ky-3],[kx+5,ky+13],[kx-9,ky+7]],'#647f8b');line(c,[[kx-9,ky-6],[kx+3,ky-11],[kx+10,ky-3]],p.bone,3);fill([[x-8,y-11],[x+5,y-13],[x+18,y-1],[x+19,y+4],[x-10,y+4]],'#405765');line(c,[[x-7,y],[x+14,y]],'#98a9a8',2);}
   if(k==='mutant_blade')fill([[knees[i][0]-7,knees[i][1]-7],[knees[i][0]+8,knees[i][1]-2],[feet[i][0]+10,feet[i][1]-4],[feet[i][0]-1,feet[i][1]-12]],p.cloth);
  }
  fill([[cx-w,cy-5],[cx-12,cy-15],[cx+14,cy-12],[cx+w+3,cy+3],[hx+18,hy+3],[hx-18,hy+7],[cx-w-4,cy+15]],p.skin);
  fill([[cx-w,cy-5],[cx-12,cy-15],[cx-13,cy+13],[hx-18,hy+7],[cx-w-4,cy+15]],p.shade);
  fill([[cx-12,cy-15],[cx+14,cy-12],[cx+w+3,cy+3],[cx+6,cy+10],[cx-9,cy+8]],p.light);
  fill([[cx+6,cy+12],[cx+20,cy+12],[hx+18,hy+3],[hx+5,hy-5]],p.shade);
  segment(c,[cx+6,cy-9],[head[0]-4,head[1]+12],8,6,p.skin,p.shade);
  if(['giant_zombie','dying','sacrifice'].includes(k)){scar(c,cx-11,cy+2,.9);scar(c,cx+7,cy+28,.9);}
  if(k==='explorer'){
   fill([[cx-15,cy-10],[cx-7,cy-5],[hx-8,hy-3],[hx-17,hy+20],[hx-25,hy+16],[cx-22,cy+20]],'#8e7a58');fill([[cx+11,cy-8],[cx+22,cy+4],[hx+16,hy+3],[hx+8,hy+19],[hx+6,hy-4]],'#a29067');line(c,[[cx-11,cy-7],[hx+10,hy-4]],'#594c3e',5);
  }
  if(k==='champion'){
   if(!broken){
    fill([[cx-25,cy-10],[cx-9,cy-19],[cx+21,cy-13],[cx+31,cy+7],[cx+15,cy+28],[hx+16,hy-5],[hx-17,hy-3],[cx-28,cy+13]],'#4c6575');
    fill([[cx-9,cy-19],[cx+21,cy-13],[cx+27,cy+4],[cx+4,cy+17],[cx-9,cy+5]],'#8399a1');
    fill([[cx-25,cy-10],[cx-9,cy-19],[cx-9,cy+5],[cx+4,cy+17],[hx-17,hy-3],[cx-28,cy+13]],'#354c5b');
    line(c,[[cx-20,cy-12],[cx-7,cy+3],[cx+5,cy+8],[cx+24,cy-1]],p.bone,5);
    fill([[cx+3,cy+8],[cx+11,cy+13],[cx+6,cy+24],[cx-1,cy+16]],'#e0be79');
    for(let j=0;j<3;j++)line(c,[[hx-15,hy-17+j*7],[hx+1,hy-12+j*7],[hx+15,hy-17+j*7]],'#263c4a',3);
   }
   else{fill([[cx-21,cy-3],[cx-8,cy-8],[cx-2,cy+7],[cx-11,cy+10],[cx-5,cy+22],[hx-15,hy-2],[cx-23,cy+16]],'#51616a');fill([[cx+16,cy+8],[cx+22,cy+14],[hx+14,hy],[hx+2,hy-4],[cx+11,cy+24]],'#6f7c7d');scar(c,cx+5,cy+12,1.1);}
  }
  if(k==='crystal_claw')for(let i=0;i<3;i++)fill([[cx-18+i*11,cy-8+i*10],[cx-3+i*11,cy-13+i*10],[cx+6+i*9,cy+i*10],[cx-6+i*10,cy+12+i*10],[cx-20+i*10,cy+8+i*10]],armored?'#6c8495':'#56606c');
  if(k==='mutant_blade'){fill([[cx-24,cy-8],[cx-6,cy-15],[cx+13,cy-3],[cx+8,cy+16],[cx-2,cy+3],[cx-16,cy+9],[cx-22,cy+24],[cx-33,cy+18]],p.cloth);fill([[cx-13,cy-5],[cx+3,cy-7],[cx+9,cy+5],[cx-4,cy+10]],'#9b6456');}
  if(k==='sacrifice'){line(c,[[cx-17,cy-7],[hx+6,hy]],'#8f7650',6);line(c,[[cx+12,cy-4],[hx-12,hy+2]],'#ae8c5f',5);}
  if(k==='plague'){fill([[cx-14,cy-11],[cx+8,cy-9],[cx+20,cy+11],[hx+7,hy+8],[hx+2,hy+23],[hx-5,hy+11],[cx-2,cy+16],[cx-17,cy+7]],'#8e9754');fill([[cx-18,cy+7],[cx-9,cy+25],[hx-18,hy+29],[hx-21,hy+6]],'#536540');}
  line(c,[[hx-18,hy],[hx+18,hy-3]],k==='champion'?p.bone:'#705542',5);
  fill([[hx-15,hy+2],[hx+15,hy-1],[hx+18,hy+29],[hx+8,hy+21],[hx+4,hy+37],[hx-5,hy+29],[hx-12,hy+37],[hx-16,hy+19]],p.cloth);
  if(k==='champion')for(const sign of [-1,1]){fill([[hx+sign*7,hy+2],[hx+sign*23,hy-1],[hx+sign*30,hy+21],[hx+sign*14,hy+28],[hx+sign*7,hy+19]],'#425d6d');line(c,[[hx+sign*9,hy+5],[hx+sign*21,hy+3],[hx+sign*26,hy+19]],p.bone,3);}
  if(k==='dying'){
   fill([[cx+4,cy-18],[cx+22,cy-11],[cx+15,cy+2],[cx+24,cy+11],[cx+7,cy+8],[cx+11,cy+29],[cx+2,cy+34],[cx-3,cy+9],[cx-12,cy-1]],'#8d3e3d');
  }
  arm(1);
  if(['giant_zombie','dying','sacrifice'].includes(k))for(const sh of shoulders){const [x,y]=sh;fill([[x-15,y-9],[x-4,y-22],[x+18,y-14],[x+25,y+7],[x+7,y+16],[x-15,y+8]],p.skin);fill([[x-15,y-9],[x-4,y-22],[x+18,y-14],[x+5,y+2]],p.light);if(k==='giant_zombie'){scar(c,x,y-3,.8);fill([[x-12,y-14],[x-21,y-33],[x-13,y-29],[x-7,y-11]],p.bone);}}
  if(k==='champion')for(const i of [0,1]){if(broken&&i===1)continue;const [x,y]=shoulders[i];fill([[x-18,y-7],[x-9,y-23],[x+8,y-26],[x+23,y-10],[x+25,y+8],[x+8,y+16],[x-19,y+6]],'#4d6574');fill([[x-18,y-7],[x-9,y-23],[x+8,y-26],[x+23,y-10],[x+6,y-3]],'#a0aeb0');line(c,[[x-18,y-8],[x+6,y+4],[x+24,y-5]],'#e0bd7d',5);fill([[x-18,y+5],[x+7,y+14],[x+21,y+7],[x+18,y+20],[x+4,y+24],[x-17,y+13]],'#354d5d');line(c,[[x-17,y+12],[x+4,y+22],[x+18,y+18]],'#b79666',3);}
  // Shoulder masses and proximal arms sit behind the head in this three-quarter view.
  face(c,e,k,r,p);
  if(k==='dying'&&(e.dead?(e.deathT||0)>=.22:!e.enraged))embeddedSword(c,chest);
  if(k==='explorer')fill([[head[0]-14,head[1]+10],[head[0]+8,head[1]+16],[cx+11,cy+17],[cx+1,cy+8],[cx-6,cy+22],[cx-13,cy+4]],'#a66a43');
  if(k==='sacrifice')for(const i of [0,1]){const h=hands[i],el=elbows[i];fill([[el[0]-12,el[1]-9],[el[0]+10,el[1]-5],[h[0]+8,h[1]-4],[h[0]-12,h[1]+7]],'#a85a4d');if(!e.dead)flame(c,el[0],el[1],27,t+i);}
  if(k==='giant_zombie'&&!e.dead)trunk(c,hands[1],r.angle);
  if(k==='champion'&&!e.dead)greatsword(c,hands[1],r.angle);
  if(k==='dying'&&e.enraged&&!s.swordOut&&!e.dead)greatsword(c,hands[1],r.angle,true);
  if(k==='explorer'&&!e.dead){line(c,[hands[1],[hands[1][0]+5,hands[1][1]-15],[hands[1][0]+13,hands[1][1]-20]],'#90734e',4);lantern(c,[hands[1][0]+13,hands[1][1]-20],r.angle*.3+Math.sin(t*3)*.04,t,true);}
  hand(1);
  return r;
 }
 function drops(c,e,k,t,d){const u=clamp(d*2.5),r=rig({...e,dead:true,deathT:0,attack:null},k,t),start=r.hands?.[1]||[25,-65],h=[start[0]+u*35,start[1]*(1-u*u)-16*u*u],angle=.4+(-Math.PI/2-.4)*u;
  if(k==='giant_zombie')trunk(c,h,angle);
  if(k==='champion')greatsword(c,h,angle);
  if(k==='explorer')lantern(c,h,angle,t,true,(e.deathT||0)>.30);
  if(k==='mutant_blade')for(let i=0;i<r.hands.length;i++){const q=clamp(((e.deathT||0)-i*.025)/.32),v=r.hands[i],sign=i%2?1:-1;armBlade(c,[v[0]+sign*q*40,v[1]*(1-q*q)-20*q*q],r.angles[i]+q*(i%2?-1.6:1.4),palettes[k],i>=2);}
 }
 function anchor(e,k,t,part='foot'){const r=rig(e,k,t),v=part==='foot'?r.feet[1]:[r.chest[0]-27,r.chest[1]-9],s=e.scale||1;return [e.x+(e.face||1)*v[0]*s,e.y-(e.z||0)+v[1]*s];}
 return {kinds,anatomy,rig,sample,draw,drops,anchor,greatsword,embeddedSword};
})(Motion);

/* Chapter III. Flat cut-paper silhouettes with species-specific articulated anatomy.
 * Clips only drive art; encounter timing, movement and damage remain authoritative. */
const AberrantArt=(function(Motion){
 'use strict';
 const kinds=new Set(['moth','bladder','claw_beast','fortress','spider_queen','great_bell','chewer','resentment','marked_priest']);
 // Same idle-render height as the mean of the nine chapter-I bosses (259.667 / 248 px).
 // Art-only multiplier: encounter ranges, actor scale and the independent priestHand stay unchanged.
 const MODEL_SCALE=259.6666666666667/248;
 const modelScale=k=>MODEL_SCALE*(k==='spider_queen'?1.2:k==='bladder'?1.15:k==='great_bell'?1.05:(k==='resentment'||k==='marked_priest')?1.1:1);
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const mix=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
 const rest={x:0,y:0,tilt:0,reach:0,lift:0,spread:0,jaw:0,tongue:0,cast:0,staff:0,fold:0};
 function keyframes(k,a){
  const p=v=>({...rest,...v});let wind=p({x:-7,y:5,tilt:-.08,reach:-.8,lift:.35,jaw:.5,spread:-.3}),hit=p({x:14,y:1,tilt:.09,reach:1,lift:-.15,jaw:-.15,spread:.5}),end=p({x:7,y:3,tilt:.05,reach:.5,spread:.2});
  if(['overhead','stomp','leap'].includes(a.pose)||a.action==='burrow'){
   wind=p({x:-5,y:-9,tilt:-.13,lift:1,reach:-.25,jaw:.8,spread:.3,staff:-1});hit=p({x:9,y:12,tilt:.15,lift:-.35,reach:.65,jaw:-.25,spread:.7,staff:1});end=p({x:7,y:7,tilt:.07,reach:.3,spread:.2,staff:.5});
   if(a.pose==='leap'||a.action==='leap')wind=p({x:-9,y:12,tilt:-.1,fold:.65,lift:-.2,spread:-.35,jaw:.45});
  }else if(a.pose==='thrust'||a.action==='charge'){wind=p({x:-10,y:6,tilt:-.1,reach:-.6,fold:.3});hit=p({x:17,y:-1,tilt:.15,reach:1.15,fold:.2,jaw:.25,spread:-.35});end=p({x:12,y:3,tilt:.08,reach:.7});}
  if(a.ranged||['cast','bow'].includes(a.pose)||['split','spiders','tentacles','heal','blink','eatAlly','spiderDrop'].includes(a.action)){
   wind=p({y:3,lift:.4,spread:-.4,cast:.6,jaw:.4,staff:-.25});hit=p({x:3,y:-6,lift:.8,spread:1,cast:1,jaw:.8,staff:.3});end=p({x:1,y:-2,lift:.4,spread:.6,cast:.65,staff:.2});
  }
  if(a.pose==='whip'){wind=p({y:-6,reach:-1,lift:.8,spread:-.2});hit=p({x:8,tilt:.08,reach:1.5,spread:.4});end=p({x:5,reach:.65,spread:.8});}
  if(a.action==='tongue'){wind=p({x:-5,jaw:1,tongue:-.2});hit=p({x:8,jaw:.6,tongue:1});end=p({x:3,jaw:.8,tongue:.35});}
  if(a.action==='shortBackstep'){wind=p({x:4,y:9,fold:.5,reach:-.3});hit=p({x:-12,y:-7,tilt:-.13,fold:.3,reach:-.8});end=p({x:-5,y:3,fold:.2,reach:-.3});}
  if(k==='claw_beast'&&a.pose==='bite'){wind=p({x:-6,jaw:1,fold:.2});hit=p({x:19,reach:.9,jaw:-.65,tilt:.07});end=p({x:7,reach:.3,jaw:-.2});}
  if(k==='marked_priest'&&a.action==='melee'){wind=p({x:-4,staff:-1,lift:.65,reach:-.4});hit=p({x:10,staff:1,reach:1});end=p({x:6,staff:.6,reach:.4});}
  return {wind,hit,end};
 }
 function curve(frames,t){for(let i=1;i<frames.length;i++)if(t<=frames[i][0])return mix(frames[i-1][1],frames[i][1],smooth((t-frames[i-1][0])/(frames[i][0]-frames[i-1][0])));return {...frames.at(-1)[1]};}
 function sample(e,k,t){
  let p={...rest};const a=e.attack;
  if(e.dead)return {...p,fold:clamp((e.deathT||0)/.65),jaw:.3,spread:-.5};
  if(['hurt','flinch','stunned','knockdown'].includes(e.state))return {...p,x:-5,y:9,tilt:-.12,fold:.45,spread:-.45,lift:-.3};
  if(a&&['windup','active','recovery'].includes(e.state)){
   const v=keyframes(k,a.action==='combo'?{...a,pose:'sweep'}:a),cf=clamp(a.contactFraction??.35,0,.95),wind=cf===0?v.hit:v.wind;let frames=cf===0?[[0,v.hit],[1,v.end]]:[[0,wind],[cf,v.hit],[Math.max(.85,cf+.01),v.end],[1,v.end]],end=v.end;
   if(a.action==='combo'){
    const b=keyframes(k,{...a,action:'charge',pose:a.secondPose}),second=clamp(cf+(a.secondAt??.48)/(a.active||1),cf+.04,.98);
    frames=[[0,wind],[cf,v.hit],[cf+(second-cf)*.3,v.end],[second-(second-cf)*.28,b.wind],[second,b.hit],[1,b.end]];end=b.end;
   }
   p=e.state==='windup'?mix(rest,wind,smooth(e.t/(a.wind||1))):e.state==='active'?curve(frames,clamp(e.t/(a.active||1))):mix(end,rest,smooth(1-e.t/(e.recoveryTotal||a.recovery||.5)));
  }
  return p;
 }
 function chain(start,target,upper,lower,bend=1){const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy),d=clamp(raw,Math.abs(upper-lower)+.001,upper+lower-.001),end=[start[0]+(raw?dx/raw:0)*d,start[1]+(raw?dy/raw:1)*d];return {start,end,joint:Motion.ik(start,end,upper,lower,bend),upper,lower};}
 function strand(start,count,len,angle){const points=[start];for(let j=0;j<count;j++){const a=angle(j);points.push([points[j][0]+Math.cos(a)*len,points[j][1]+Math.sin(a)*len]);}return {points,length:len};}
 const localPoint=(part,v)=>[part.center[0]+v[0]*Math.cos(part.angle)-v[1]*Math.sin(part.angle),part.center[1]+v[0]*Math.sin(part.angle)+v[1]*Math.cos(part.angle)];
 function torsoRig(k,p){
  const chewing=k==='chewer',abdomen={center:[chewing?-72:-65,chewing?-57:-62],angle:.04+p.fold*.18-p.reach*.045};
  const joint=localPoint(abdomen,[chewing?34:33,0]),angle=(chewing?-.13:-.24)-p.lift*.3+p.reach*.16+p.fold*.22;
  const chest={center:localPoint({center:joint,angle},[chewing?39:37,0]),angle};
  return {abdomen,chest,joint,spine:[{start:abdomen.center,end:joint,length:chewing?34:33},{start:joint,end:chest.center,length:chewing?39:37}]};
 }
 function articulatedRig(e,k,t,p,root,gait){
  const torso=torsoRig(k,p),{abdomen,chest}=torso,arms=[],legs=[],strands=[],chewing=k==='chewer';
  const addLeg=(part,offset,target,i)=>{
   const start=localPoint(part,offset),lift=p.fold*19+p.lift*(i%2?15:7)+(e.walking?Math.max(0,Math.sin((e.walkDistance||t*40)*.045+i*Math.PI))*8:0);
   const tx=target+gait*(i%2?8:-8)+p.reach*4,ty=-root.y-lift,ca=Math.cos(root.angle),sa=Math.sin(root.angle);
   const l=chain(start,[tx*ca+ty*sa,-tx*sa+ty*ca],chewing?34:37,chewing?36:40,part===chest?-1:1);
   l.mount=part===chest?'chest':'abdomen';l.offset=offset;legs.push(l);
  };
  if(chewing){
   addLeg(abdomen,[-9,16],-91,0);addLeg(chest,[-1,31],37,1);
   addLeg(abdomen,[5,21],-62,2);addLeg(chest,[13,36],64,3);
   const tongue= strand([48,28],7,15,j=>.06+(1-clamp(p.tongue))*(.29+Math.sin(j*.85+t*1.5)*.9));tongue.points=tongue.points.map(v=>localPoint(chest,v));strands.push(tongue);
  }else{
   addLeg(abdomen,[-12,9],-87,0);addLeg(abdomen,[8,15],-41,1);
   for(let i=0;i<2;i++){
    const offset=[i?16:4,i?9:2],start=localPoint(chest,offset);
    const l=chain(start,[60+i*20+p.reach*39,-64+i*22-p.lift*51],36,41,i?1:-1);l.mount='chest';l.offset=offset;arms.push(l);
   }
  }
  const head={center:localPoint(chest,[39,-10]),angle:chest.angle+.24-p.jaw*.1};
  return {pose:p,root,arms,legs,strands,torso,head,mouth:localPoint(chewing?chest:head,chewing?[61,2]:[28,13])};
 }
 function rig(e,k,t=0){
  const p=sample(e,k,t),arms=[],legs=[],strands=[],floating=['moth','bladder','great_bell','resentment'].includes(k),bob=e.dead?0:Math.sin(t*2.3)*2;
  const root={x:p.x,y:p.y+(floating?bob:0),angle:p.tilt};
  const gait=e.walking&&!e.dead?Math.sin((e.walkDistance||t*40)*.045):0;
  if(k==='claw_beast'||k==='chewer')return articulatedRig(e,k,t,p,root,gait);
  const leg=(x,y,tx,i,w=32,h=37)=>{const lift=(Math.max(0,Math.sin((e.walkDistance||t*40)*.045+i*Math.PI))*(e.walking?8:0))+p.lift*(i%2?18:8)+p.fold*20;legs.push(chain([x,y],[tx+gait*(i%2?9:-9)+p.reach*5,-root.y-lift],w,h,x<0?1:-1));};
  if(k==='fortress'){
   if(!e.bossState?.brokenLegs)for(let i=0;i<4;i++)leg(-34+(i%2)*65,-48+(i<2?-7:0),-70+(i%2)*132+(i<2?13:0),i,36,39);
   for(let i=0;i<2;i++)arms.push(chain([i?27:-26,-108],[i?65+p.reach*34:-56+p.reach*30,-58-p.lift*65],36,39,i?1:-1));
   if(e.bossState?.brokenLegs)root.y+=27;
  }else if(k==='spider_queen'){
   for(let i=0;i<8;i++){const side=i<4?-1:1,j=i%4;const start=[side*(28-j*7),-79+j*8],target=[side*(106-j*24)+p.reach*(j===3?28:4),-root.y-j*2-p.fold*32-p.lift*(j===3?28:5)+(e.walking?Math.sin(t*6+j*1.6+side)*5:0)];legs.push(chain(start,target,60-j*6,112-j*10,-side));}
  }else if(k==='marked_priest'){
   leg(-8,-51,-16,0,26,29);leg(9,-51,23,1,26,29);
   arms.push(chain([-11,-110],[-29+p.reach*18,-64-p.lift*22],27,28,-1));
   arms.push(chain([12,-110],[32+p.reach*24,-79-p.lift*29],27,28,1));
  }else if(k==='resentment'){
   for(let i=0;i<6;i++){const side=i<3?-1:1,j=i%3;arms.push(chain([side*27,-98+j*24],[side*(64+j*10)+p.reach*(side>0?36:17),-139+j*49-p.lift*32-p.cast*15],35,39,side));}
  }else if(k==='moth'){
   for(let i=0;i<6;i++){const side=i<3?-1:1,j=i%3;arms.push(chain([side*10,-66+j*12],[side*(24+j*15)+p.reach*20,-12-j*7-p.lift*24],29,32,side));}
  }else if(k==='bladder'){
   for(let i=0;i<8;i++)strands.push(strand([-39+i*11,-76],6,13,j=>Math.PI/2+Math.sin(t*2+i*.8+j*.7)*.11+(j>2?Math.sin(i*2)*.24:0)-p.reach*(i>3?1.05:.3)+p.lift*Math.sin(j*.7+i)*.6));
  }
  if(k==='great_bell')for(const side of [-1,1])strands.push(strand([side*15,-145],10,14,j=>Math.PI/2-side*(.65+Math.sin(j*.24+t*2)*.1+p.spread*.16)));
  const mouth=[50,-79];
  return {pose:p,root,arms,legs,strands,mouth};
 }
 function poly(c,pts,col){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill();}
 function line(c,pts,col,w=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='miter';c.lineCap='butt';c.stroke();}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 function gem(c,x,y,r,col){poly(c,[[x-r,y],[x-r*.55,y-r*.8],[x+r*.3,y-r],[x+r,y-r*.15],[x+r*.65,y+r*.65],[x-r*.25,y+r]],col);}
 function segment(c,a,b,w,col,shade){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,n=[-dy/d*w,dx/d*w],pts=[[a[0]+n[0],a[1]+n[1]],[b[0]+n[0]*.65,b[1]+n[1]*.65],[b[0]-n[0]*.65,b[1]-n[1]*.65],[a[0]-n[0],a[1]-n[1]]];poly(c,pts,col);if(shade)poly(c,[a,b,pts[2],pts[3]],shade);}
 function limb(c,l,w,col,shade){segment(c,l.start,l.joint,w,col,shade);segment(c,l.joint,l.end,w*.75,col,shade);}
 function foot(c,p,w,col){poly(c,[[p[0]-w,p[1]-6],[p[0]+w*.5,p[1]-6],[p[0]+w+7,p[1]+1],[p[0]-w-3,p[1]+1]],col);}
 function claw(c,h,angle,size,col){c.save();c.translate(...h);c.rotate(angle);for(let i=0;i<3;i++)poly(c,[[i*9-12,0],[i*9-6,0],[i*10+4,size*.45],[i*10+2,size],[i*10-3,size*.44]],col);c.restore();}
 const C={bone:'#e0d7b6',dark:'#263c3d',green:'#a7bb99',greenShade:'#687f70',purple:'#867092',purpleShade:'#534661',lime:'#b2d477',pink:'#d39cce'};
 function moth(c,e,r,t){
  const p=r.pose,beat=e.dead?.55:.87+Math.sin(t*6)*.08-p.spread*.14;
  r.arms.forEach((a,i)=>limb(c,a,2.7,i<3?'#706583':'#c3b5a5'));
  for(const side of [-1,1]){c.save();c.translate(side*9,-85);c.rotate(side*(p.reach*.35+p.lift*.16));c.scale(side*beat,1);
   poly(c,[[0,1],[27,-44],[83,-78],[72,-20],[52,5],[20,12]],'#637383');poly(c,[[0,1],[27,-44],[83,-78],[43,-34],[52,5]],'#778596');
   poly(c,[[10,13],[51,10],[62,28],[44,64],[19,37]],'#83979f');poly(c,[[10,13],[51,10],[19,37]],'#61777f');
   for(let j=0;j<3;j++)poly(c,[[53+j*4,-20-j*14],[59+j*4,-22-j*14],[58+j*4,-15-j*14],[52+j*4,-13-j*14]],'#c9d7c3');line(c,[[25,26],[45,42]],'#d6dbc6',4);c.restore();}
  poly(c,[[-17,-103],[1,-115],[18,-101],[22,-80],[10,-47],[0,-34],[-16,-56],[-22,-83]],'#4b465d');poly(c,[[1,-115],[18,-101],[22,-80],[10,-47],[2,-63]],'#61566e');
  for(const s of [-1,1])line(c,[[s*5,-110],[s*12,-131],[s*20,-147]],'#c392c3',3);
  oval(c,5,-88,13,15,'#db9bdc');oval(c,8,-88,7,8,'#b665c7');oval(c,10,-92,3,3,'#efd6e9');
 }
 function bladder(c,e,r){
  r.strands.forEach((s,i)=>{line(c,s.points,i%2?'#b4cf7f':'#7e9a59',i%3?2.8:3.6);});
  poly(c,[[-49,-80],[-42,-117],[-21,-149],[5,-160],[32,-143],[45,-111],[48,-79],[21,-66],[-18,-68]],'#788557');
  poly(c,[[-49,-80],[-42,-117],[-21,-149],[5,-160],[-1,-133],[-27,-113],[-30,-79]],'#596b49');
  poly(c,[[-30,-79],[-27,-113],[-1,-133],[28,-136],[39,-106],[21,-73]],'#92a66c');
  for(const [x,y,s] of [[15,-130,13],[-8,-108,10],[22,-91,12]]){gem(c,x,y,s+4,'#819350');gem(c,x,y,s,'#b4d870');gem(c,x+3,y-4,s*.35,'#e0ed9a');}
  for(const [x,y] of [[-28,-126],[30,-117],[-8,-143],[34,-82]])poly(c,[[x-3,y-6],[x+5,y-9],[x+7,y],[x,y+5]],'#978569');
 }
 function bodySpace(c,part,paint){c.save();c.translate(...part.center);c.rotate(part.angle);paint();c.restore();}
 function torsoJoint(c,r,col,shade){
  const {abdomen,chest,joint}=r.torso;segment(c,localPoint(abdomen,[19,0]),joint,14,col,shade);segment(c,joint,localPoint(chest,[-17,0]),13,col,shade);
  const angle=Math.atan2(chest.center[1]-abdomen.center[1],chest.center[0]-abdomen.center[0]);
  bodySpace(c,{center:joint,angle},()=>{for(let i=-1;i<=1;i++)poly(c,[[i*6-4,-12],[i*6+2,-10],[i*6+4,10],[i*6-2,13]],i===0?col:shade);});
 }
 function beast(c,e,r){
  const {abdomen,chest}=r.torso;
  const hind=(l,near)=>{limb(c,l,near?10:8,near?'#8fa48c':'#617b6d','#50695c');gem(c,...l.joint,near?9:7,near?'#b1bda0':'#809581');foot(c,l.end,8,near?'#a2b093':'#748d79');for(let j=0;j<2;j++)poly(c,[[l.end[0]+5+j*7,l.end[1]-4],[l.end[0]+10+j*7,l.end[1]-3],[l.end[0]+15+j*7,l.end[1]+2]],'#d0c9aa');};
  const fore=(l,near)=>{
   limb(c,l,near?13:10,near?'#a1b398':'#6d8976','#59705f');
   const m=[l.start[0]*.4+l.joint[0]*.6,l.start[1]*.4+l.joint[1]*.6];line(c,[m,l.joint,l.end],near?'#c1c9ac':'#94a78e',2);
   gem(c,...l.joint,near?10:8,near?'#91a487':'#617967');
   c.save();c.translate(...l.end);c.rotate(-.42-r.pose.reach*.92);
   poly(c,[[-16,-9],[10,-13],[23,-2],[21,12],[4,17],[-14,10]],near?'#9eaf91':'#728872');
   for(let j=0;j<3;j++){const x=-13+j*12,len=43+(j===1?8:0);poly(c,[[x,5],[x+8,4],[x+18,25],[x+19,len],[x+11,33],[x+5,19]],near?'#e3d9b7':'#b6bfa3');poly(c,[[x+8,4],[x+18,25],[x+19,len],[x+13,28]],near?'#b8bfa4':'#899d86');}
   c.restore();
  };
  hind(r.legs[0],false);fore(r.arms[0],false);
  bodySpace(c,abdomen,()=>{
   poly(c,[[-35,-6],[-25,-28],[1,-33],[26,-18],[29,5],[13,25],[-16,23],[-33,10]],'#829a80');poly(c,[[-35,-6],[-25,-28],[1,-33],[19,-23],[-9,-18],[-16,23],[-33,10]],'#a3b296');poly(c,[[4,-16],[26,-18],[29,5],[13,25],[-5,17]],'#5f7864');
   for(let j=0;j<3;j++)line(c,[[-5+j*8,-10],[j*8,3],[-5+j*8,12]],'#a8b397',2.5);
   poly(c,[[-27,-20],[-48,-43],[-25,-32],[-11,-27]],'#526959');
  });
  torsoJoint(c,r,'#9ca88e','#526b5c');
  bodySpace(c,chest,()=>{
   // Broad scapula and a hanging rib cage. The narrow waist remains exposed behind it.
   poly(c,[[-31,-18],[-26,-42],[-4,-49],[22,-40],[38,-17],[29,12],[12,32],[-14,24],[-30,7]],'#99ae92');
   poly(c,[[-31,-18],[-26,-42],[-4,-49],[22,-40],[2,-25],[-9,7],[-30,7]],'#bac5a7');
   poly(c,[[2,-25],[22,-40],[38,-17],[29,12],[12,32],[-7,16]],'#738e77');
   poly(c,[[-18,-28],[-5,-34],[9,-17],[3,1],[-10,10],[-23,-3]],'#aab99b');
   for(let i=0;i<3;i++)line(c,[[10+i*3,-12+i*10],[22+i*2,-8+i*10],[27+i,-13+i*10]],'#4d6b5b',3);
   poly(c,[[-22,-39],[-43,-69],[-15,-48],[-3,-42]],'#546c5d');poly(c,[[0,-47],[-12,-73],[10,-49],[17,-39]],'#657e6a');
   line(c,[[-8,-23],[-13,-12],[-5,-4]],'#637e67',2);line(c,[[19,-27],[24,-21]],'#bdc7a5',3);
  });
  hind(r.legs[1],true);fore(r.arms[1],true);
  bodySpace(c,r.head,()=>{
   poly(c,[[-19,-19],[-9,-28],[12,-24],[24,-12],[40,-3],[32,9],[8,10],[-10,22],[-24,4]],'#a4b899');
   poly(c,[[-19,-19],[-9,-28],[12,-24],[24,-12],[7,-14],[-8,-6],[-24,4]],'#c0cbae');
   poly(c,[[0,2],[34,2],[28,26+r.pose.jaw*8],[10,30+r.pose.jaw*7],[-8,18]],'#422e40');
   for(let i=0;i<5;i++)poly(c,[[2+i*6,3],[7+i*6,3],[5+i*6,13+(i%2)*4]],'#e7dcba');
   for(let i=0;i<4;i++)poly(c,[[2+i*7,21+r.pose.jaw*6],[8+i*7,23+r.pose.jaw*6],[7+i*7,15+r.pose.jaw*6]],'#d6d0af');
   poly(c,[[-10,18],[7,30+r.pose.jaw*7],[28,26+r.pose.jaw*8],[35,16],[29,35+r.pose.jaw*7],[5,38+r.pose.jaw*7],[-13,26]],'#819b7f');
   poly(c,[[-13,-20],[-25,-58],[-5,-35],[1,-20]],'#536b5a');poly(c,[[2,-23],[1,-52],[13,-32],[13,-19]],'#6a826d');poly(c,[[18,-15],[23,-36],[27,-11]],'#536b5a');
   poly(c,[[1,-10],[16,-6],[13,1],[4,-1]],'#623455');poly(c,[[7,-8],[14,-6],[12,-1],[8,-2]],'#c285b1');line(c,[[-2,-13],[17,-8]],'#586f5c',3);
   poly(c,[[30,-4],[38,-2],[35,2],[29,0]],'#526657');line(c,[[-17,-4],[-11,5],[-18,11]],'#647d68',2);
  });
 }
 function fortress(c,e,r){
  const broken=e.bossState?.brokenLegs;
  const crack=(x,y,s=1)=>line(c,[[x,y],[x-3*s,y+7*s],[x+3*s,y+12*s],[x,y+20*s]],'#5b6357',1.6);
  const plateBone=(a,b,w,near)=>{segment(c,a,b,w,near?'#a3a38c':'#7e8572','#626e5e');const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)-Math.PI/2;bodySpace(c,{center:a,angle:ang},()=>{poly(c,[[-w,-2],[w-3,-5],[w+2,9],[w*.7,len-5],[0,len+2],[-w*.65,len-4]],near?'#b4b098':'#8e937e');poly(c,[[-w,-2],[w-3,-5],[w+2,9],[-w+4,9]],near?'#d0c5a5':'#a5a68c');line(c,[[-w+5,13],[-w*.5,len-9]],'#777f6a',2);line(c,[[w-4,12],[w*.55,len-9]],'#d0c2a0',1.5);});};
  const drawLeg=(l,i)=>{const near=i>=2;plateBone(l.start,l.joint,15,near);plateBone(l.joint,l.end,12,near);gem(c,...l.joint,12,near?'#c0b99d':'#8e927a');gem(c,...l.joint,6,'#6c7660');foot(c,l.end,18,near?'#b5ad91':'#838c75');line(c,[[l.end[0]-15,l.end[1]-3],[l.end[0]+19,l.end[1]-3]],'#d2c6a6',2);for(let j=0;j<3;j++)line(c,[[l.end[0]+j*7-7,l.end[1]-6],[l.end[0]+j*7-4,l.end[1]]],'#68745e',1.5);};r.legs.slice(0,2).forEach(drawLeg);
  const arm=(l,near)=>{plateBone(l.start,l.joint,15,near);plateBone(l.joint,l.end,12,near);gem(c,...l.joint,10,'#65715f');gem(c,...l.joint,5,'#bcaf8e');const x=l.start[0],y=l.start[1];poly(c,[[x-22,y-9],[x-13,y-23],[x+12,y-24],[x+25,y-6],[x+17,y+11],[x-19,y+13]],near?'#aaa78f':'#8b8e7b');poly(c,[[x-22,y-9],[x-13,y-23],[x+12,y-24],[x+25,y-6],[x+5,y-12]],'#c2b99c');line(c,[[x-17,y+5],[x+15,y+4]],'#626e5b',3);crack(x-3,y-17,.65);};arm(r.arms[0],false);
  // Recessed furnace, overlapping chest slabs and a separate carved waist band.
  poly(c,[[-39,-112],[-17,-126],[27,-118],[40,-81],[27,-44],[-27,-43],[-44,-77]],'#707b65');
  poly(c,[[-37,-113],[-17,-122],[-12,-81],[-28,-67],[-43,-78]],'#969c83');poly(c,[[-37,-113],[-17,-122],[-15,-110],[-33,-101]],'#c0b99b');
  poly(c,[[-10,-118],[24,-115],[32,-105],[24,-85],[3,-80],[-15,-98]],'#b7b198');poly(c,[[-10,-118],[24,-115],[32,-105],[6,-107],[-15,-98]],'#d0c5a7');
  poly(c,[[-8,-104],[11,-108],[28,-93],[22,-75],[3,-68],[-14,-83]],'#515e50');
  poly(c,[[-8,-100],[10,-103],[23,-92],[18,-77],[3,-72],[-10,-84]],'#9b6347');gem(c,7,-88,12,'#d95d3d');poly(c,[[7,-100],[17,-92],[7,-82],[-2,-90]],'#ffb071');
  for(let i=0;i<3;i++){poly(c,[[-32,-95+i*10],[-17,-91+i*10],[-16,-85+i*10],[-34,-89+i*10]],i%2?'#818d72':'#a5aa8c');line(c,[[26,-83+i*8],[33,-87+i*8]],'#c1b697',2);}
  poly(c,[[-26,-66],[-3,-70],[25,-63],[26,-52],[-26,-48]],'#989d81');line(c,[[-25,-58],[24,-57]],'#d0c09b',2);for(let i=0;i<3;i++){const x=-23+i*17;poly(c,[[x,-51],[x+14,-53],[x+18,-35],[x+2,-31]],i===0?'#7c886d':'#aaa58b');line(c,[[x+5,-47],[x+7,-36]],'#d3c39e',1.5);}
  crack(-28,-108);crack(24,-105,.6);line(c,[[-25,-94],[-35,-92]],'#607459',2);
  // Deep eye slit, brow bevel and cheek blocks read as a stone helm at game scale.
  poly(c,[[-23,-124],[-25,-145],[-10,-157],[13,-155],[28,-142],[27,-120],[7,-114]],'#979b82');poly(c,[[-25,-145],[-10,-157],[13,-155],[28,-142],[0,-145]],'#c3b99b');
  poly(c,[[-19,-140],[20,-136],[23,-129],[-18,-131]],'#4e5c4d');line(c,[[-16,-136],[19,-132]],'#f18550',2.4);
  poly(c,[[-20,-128],[-10,-125],[-7,-117],[-21,-121]],'#b7b092');poly(c,[[5,-130],[13,-130],[15,-117],[7,-113]],'#c3b798');poly(c,[[18,-127],[27,-127],[25,-115],[16,-118]],'#808d72');crack(-7,-153,.45);
  if(broken){for(const s of [-1,1]){poly(c,[[s*20,-44],[s*43,-36],[s*31,-21],[s*12,-31]],'#727c68');line(c,[[s*22,-43],[s*29,-32],[s*36,-34]],'#d2b792',2);}line(c,[[-20,-57],[-9,-69],[4,-59],[9,-72]],'#414f46',3);}
  else r.legs.slice(2).forEach((l,i)=>drawLeg(l,i+2));
  // Asymmetric stone hammer and red-tipped gauntlet, attached to the same fixed arm bones.
  const h=r.arms[0].end;c.save();c.translate(...h);c.rotate(-.45-r.pose.lift*.65);poly(c,[[-26,-24],[18,-30],[31,-10],[23,16],[-18,21],[-32,6]],'#a7a48e');poly(c,[[-26,-24],[18,-30],[24,-20],[-22,-13],[-32,6]],'#d2c5a6');poly(c,[[24,-20],[31,-10],[23,16],[14,11]],'#75816b');for(let i=0;i<3;i++)poly(c,[[-27,-14+i*10],[-41,-10+i*10],[-26,-4+i*10]],'#b7b398');poly(c,[[-18,-8],[12,-12],[19,7],[-13,12]],'#8d977d');line(c,[[-13,-4],[9,-8],[13,5],[-9,8]],'#c9bd9b',2);line(c,[[-3,-5],[1,6]],'#d5bb87',2);line(c,[[-8,1],[6,-1]],'#d5bb87',2);crack(16,-22,.7);c.restore();
  arm(r.arms[1],true);const hand=r.arms[1].end;c.save();c.translate(...hand);c.rotate(-.65-r.pose.reach*.75);poly(c,[[-17,-18],[9,-24],[23,-9],[21,15],[2,28],[-20,12]],'#a6a68c');poly(c,[[-17,-18],[9,-24],[23,-9],[3,-13],[-20,-7]],'#cabd9d');poly(c,[[-15,-5],[0,-9],[6,15],[-9,21]],'#7c896f');line(c,[[-10,1],[-5,13]],'#c0b58f',2);for(let i=0;i<3;i++){poly(c,[[4,i*12-14],[18,i*12-17],[23,i*12-8],[15,i*12+2]],'#536651');poly(c,[[11,i*12-13],[25,i*12-13],[30,i*12-2],[19,i*12+1]],'#d75237');poly(c,[[19,i*12-12],[28,i*12-5],[19,i*12-3]],'#ffad70');}c.restore();
 }
 function spider(c,e,r){
  const leg=(l,i)=>limb(c,l,4.5,i<4?'#655877':'#a38cba',i<4?'#4e465f':'#796887');r.legs.slice(0,4).forEach(leg);
  poly(c,[[-58,-81],[-42,-117],[-12,-129],[15,-113],[21,-80],[1,-49],[-36,-48]],'#695a79');poly(c,[[-58,-81],[-42,-117],[-12,-129],[-21,-98],[-39,-74],[-36,-48]],'#80728a');
  for(const [x,y,s] of [[-25,-107,12],[-42,-88,7],[-11,-74,9]]){gem(c,x,y,s+2,'#8aa46b');gem(c,x,y,s,'#afcf78');gem(c,x+3,y-3,s*.3,'#d9e5a3');}
  r.legs.slice(4).forEach((l,i)=>leg(l,i+4));
  poly(c,[[-7,-105],[13,-115],[36,-103],[51,-77],[35,-47],[9,-49],[-8,-75]],'#9fa78a');poly(c,[[-7,-105],[13,-115],[14,-91],[-8,-75],[9,-49]],'#7a8771');
  for(const [x,y,s] of [[17,-91,7],[34,-81,5],[11,-74,4],[28,-66,7],[40,-68,3]]){oval(c,x,y,s+2,s+2,'#4c5950');oval(c,x+1,y,s,s,'#c0dc8a');}
  poly(c,[[5,-108],[-3,-151],[20,-113]],'#b9c4a5');poly(c,[[22,-111],[28,-149],[32,-106]],'#c0b3cb');
  claw(c,[28,-48],-.25,22,C.bone);
 }
 function bell(c,e,r,t){
  r.strands.forEach(s=>{for(let i=0;i<s.points.length-1;i++){const a=s.points[i],b=s.points[i+1];c.save();c.translate(...a);c.rotate(Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/2);line(c,[[-3,0],[3,0],[3,13],[-3,13],[-3,0]],i%2?'#8b6d5c':'#5d514b',2.5);c.restore();}});
  c.save();c.translate(0,-143);c.rotate(Math.sin(t*2)*.035+r.pose.reach*.28-r.pose.lift*.16);
  line(c,[[-7,0],[-12,-10],[-8,-21],[3,-26],[13,-19],[14,-8],[7,0],[-7,0]],'#baa17b',5);
  poly(c,[[-13,0],[-32,16],[-39,62],[-56,94],[55,94],[37,62],[29,18],[12,1]],'#8c7d63');poly(c,[[-13,0],[-32,16],[-39,62],[-56,94],[-19,86],[-13,27]],'#6e6656');poly(c,[[12,1],[29,18],[37,62],[55,94],[26,87],[11,30]],'#a89571');
  line(c,[[-20,20],[-26,67]],'#bcaa80',3);line(c,[[8,24],[13,71]],'#bbaa7c',2);
  line(c,[[1,33],[9,45],[2,56],[11,64]],'#c9ad7b',3);line(c,[[3,44],[-5,49],[0,63]],'#c9ad7b',2);
  oval(c,0,98,57,15,'#c3a275');oval(c,0,100,49,11,'#383a34');line(c,[[-53,92],[-38,82],[35,81],[54,92]],'#d0b07c',4);
  c.save();c.translate(0,54);const toll=e.dead?Math.sin(clamp((e.deathT||0)/.13)*Math.PI)*.65:-Math.sin(t*3)*.15-r.pose.reach*.42;c.rotate(toll);line(c,[[0,0],[0,64]],'#7d674e',8);gem(c,0,69,13,'#b9996d');c.restore();c.restore();
 }
 function chewer(c,e,r){
  const {abdomen,chest}=r.torso;
  const leg=(l,i)=>{const near=i>=2;limb(c,l,l.mount==='chest'?12:9,near?'#92769a':'#665571','#574561');gem(c,...l.joint,near?7:5,near?'#a189a7':'#7c6687');foot(c,l.end,near?13:10,near?'#a88aa9':'#776082');};
  r.legs.slice(0,2).forEach(leg);
  bodySpace(c,abdomen,()=>{
   poly(c,[[-33,-5],[-24,-27],[-2,-33],[22,-24],[31,-5],[24,17],[2,28],[-22,20]],'#796385');poly(c,[[-33,-5],[-24,-27],[-2,-33],[22,-24],[0,-13],[-13,13],[-22,20]],'#92779a');poly(c,[[0,-13],[22,-24],[31,-5],[24,17],[2,28],[-6,10]],'#61516d');
   poly(c,[[-21,-22],[-29,-42],[-43,-44],[-51,-35],[-46,-54],[-26,-53],[-11,-28]],'#564261');
   poly(c,[[8,-28],[3,-46],[-9,-51],[-12,-63],[10,-58],[20,-33]],'#624c70');
   gem(c,-13,-3,12,'#8fa565');gem(c,-13,-3,9,'#b3d475');gem(c,10,-20,6,'#a8c474');gem(c,-22,14,4,'#b99ba9');
  });
  torsoJoint(c,r,'#9c7fa0','#594765');
  bodySpace(c,chest,()=>{
   // Chest is substantially deeper than the rear abdomen; the waist is visibly pinched.
   poly(c,[[-32,14],[-38,-15],[-28,-48],[-3,-65],[29,-54],[46,-27],[35,9],[39,37],[11,47],[-16,37]],'#88708f');
   poly(c,[[-38,-15],[-28,-48],[-3,-65],[29,-54],[2,-41],[-17,-11],[-16,37],[-32,14]],'#a086a3');poly(c,[[-17,-11],[2,-41],[29,-54],[46,-27],[35,9],[11,47],[-8,28]],'#755e81');
   for(const [x,y] of [[-25,-37],[-5,-57],[23,-48]])poly(c,[[x-8,y+8],[x-12,y-11],[x-23,y-15],[x-30,y-9],[x-25,y-24],[x-7,y-22],[x+6,y-5]],'#594468');
   for(const [x,y,s] of [[-20,-8,17],[-15,-37,8],[10,-44,10]]){gem(c,x,y,s+3,'#8ea767');gem(c,x,y,s,'#b5d778');gem(c,x+3,y-4,s*.3,'#d5e696');}
   const jaw=r.pose.jaw,hinge=[20,-5];c.save();c.translate(...hinge);c.rotate(-.07-jaw*.17);
   poly(c,[[0,-35],[32,-42],[66,-31],[63,-15],[20,-12],[-3,20]],'#b495b0');poly(c,[[1,-23],[62,-24],[42,23],[20,53],[-4,22]],'#302937');
   for(let i=0;i<6;i++)poly(c,[[i*10+4,-24],[i*10+12,-25],[i*10+7,-7+(i%2)*7]],C.bone);c.restore();
   c.save();c.translate(...hinge);c.rotate(.08+jaw*.36);poly(c,[[0,0],[13,34],[43,43],[63,31],[47,57],[20,63],[-4,35],[-10,13]],'#a083a1');poly(c,[[10,25],[27,40],[54,35],[41,52],[19,48]],'#783b53');for(let i=0;i<4;i++)poly(c,[[16+i*10,43],[24+i*10,43],[21+i*10,25-i%2*5]],C.bone);c.restore();
   for(const [x,y] of [[-9,21],[1,-22],[38,-41],[20,29]])gem(c,x,y,4,'#c0a0b0');
  });
  line(c,r.strands[0].points,'#ae5267',7);line(c,r.strands[0].points.slice(-3),'#c26a79',4);
  r.legs.slice(2).forEach((l,i)=>leg(l,i+2));
 }
 function resentment(c,e,r,t){
  const arm=(a,i)=>{limb(c,a,4,i<3?'#a38bac':'#c4a5cd','#867299');const v=a.end;claw(c,v,Math.atan2(v[1]-a.joint[1],v[0]-a.joint[0])-Math.PI/2,16,i<3?'#b597c3':'#d0aed8');};r.arms.slice(0,3).forEach(arm);
  poly(c,[[-45,-83],[-38,-113],[-9,-128],[20,-118],[44,-96],[42,-58],[21,-32],[-12,-31],[-42,-50]],'#675375');
  for(const [x,y,s] of [[-18,-105,20],[14,-106,18],[-27,-74,18],[6,-78,22],[29,-65,17],[-5,-49,18]]){
   poly(c,[[x-s,y-s*.2],[x-s*.4,y-s],[x+s*.5,y-s*.85],[x+s,y],[x+s*.35,y+s],[x-s*.55,y+s*.65]],'#a98faa');poly(c,[[x-s,y-s*.2],[x-s*.4,y-s],[x,y-s*.4],[x-s*.1,y+s*.5],[x-s*.55,y+s*.65]],'#8b7696');
   poly(c,[[x-6,y-5],[x+3,y-8],[x+8,y],[x+1,y+9],[x-6,y+4]],'#4d345e');gem(c,x+1,y,3.7,'#dba5e5');
  }
  r.arms.slice(3).forEach((a,i)=>arm(a,i+3));for(let i=0;i<5;i++){const x=Math.cos(i*2.4+t*.22)*61,y=-77+Math.sin(i*2.4+t*.22)*71;poly(c,[[x,y-10],[x+5,y],[x,y+11],[x-5,y]],i%2?'#a577bd':'#d2a2df');}
 }
 function priest(c,e,r,t){
  const p=r.pose;
  r.legs.forEach(l=>{limb(c,l,3.2,'#c7c4a2');foot(c,l.end,4,'#d6ceb0');});
  poly(c,[[-18,-115],[-30,-80],[-43,-18],[-24,-29],[-30,-4],[-8,-35],[8,-28],[26,-5],[20,-29],[38,-19],[23,-82],[17,-116]],'#704762');poly(c,[[-18,-115],[-30,-80],[-43,-18],[-24,-29],[-7,-89]],'#89516f');
  poly(c,[[-14,-108],[13,-110],[23,-91],[10,-85],[-2,-92],[-16,-85],[-26,-96]],'#a6b498');
  poly(c,[[-12,-84],[11,-85],[19,-39],[10,-45],[4,-21],[-2,-44],[-13,-26],[-9,-49],[-19,-37]],'#c3c2a0');poly(c,[[-12,-84],[4,-88],[-2,-49],[-19,-37]],'#879078');
  for(const a of r.arms.slice(0,2))limb(c,a,3.3,'#c6c5a4');line(c,[[0,-118],[0,-38]],'#ded3b0',3);line(c,[[-18,-79],[17,-79]],'#d5cbaa',3);
  oval(c,0,-128,10,12,'#ddd2ad');oval(c,4,-129,6,7,'#233e3e');
  poly(c,[[-20,-140],[-15,-177],[10,-155],[18,-141]],'#8e4c76');poly(c,[[-15,-177],[10,-155],[18,-141],[0,-144]],'#a46289');poly(c,[[-27,-140],[19,-147],[25,-140],[-24,-132]],'#bd789c');
  const hand=r.arms[1].end;c.save();c.translate(...hand);c.rotate(.16+p.staff*1.1);line(c,[[0,58],[0,-69]],'#c3a179',4);gem(c,0,-74,12,'#d7b278');oval(c,0,-74,8,11,'#d596da');oval(c,1,-76,4,6,'#b35fbb');for(const s of [-1,1])poly(c,[[s*7,-85],[s*11,-98],[s*15,-88],[s*12,-78]],'#93569e');c.restore();
  for(let i=0;i<3;i++){const x=-38-i%2*9,y=-100+i*31+Math.sin(t*2+i)*3;poly(c,[[x,y-9],[x+4,y],[x,y+8],[x-4,y]],'#ad78ba');}
 }
 const painters={moth,bladder,claw_beast:beast,fortress,spider_queen:spider,great_bell:bell,chewer,resentment,marked_priest:priest};
 function leapHeight(e){if(e.dead||e.state!=='active'||e.attack?.action!=='leap')return 0;const a=e.attack,q=clamp(e.t/(a.active||1));return Math.sin(q*Math.PI)*(a.jumpHeight||55);}
 function transform(c,r){c.translate(r.root.x,r.root.y);c.rotate(r.root.angle);}
 function draw(c,e,k,t){if(!kinds.has(k))return false;const r=rig(e,k,t),scale=modelScale(k);c.save();c.scale(scale,scale);transform(c,r);painters[k](c,e,r,t);c.restore();return true;}
 function anchor(e,k,t){
  const r=rig(e,k,t),p=e.attack?.pose;let point=r.arms.at(-1)?.end||[15,-80];
  if(p==='stomp')point=r.legs.at(-1)?.end||[0,-20];
  else if(k==='moth')point=[5,-88];
  else if(k==='great_bell')point=[0,-80];
  else if(k==='bladder')point=p==='whip'?r.strands.at(-1).points.at(-1):[15,-100];
  else if(k==='chewer')point=e.attack?.action==='tongue'?r.strands[0].points.at(-1):r.mouth;
  else if(k==='spider_queen')point=[28,-48];
  else if(k==='marked_priest'){const h=r.arms[1].end,angle=.16+r.pose.staff*1.1;point=[h[0]+Math.sin(angle)*74,h[1]-Math.cos(angle)*74];}
  const a=r.root.angle,s=(e.scale||1)*modelScale(k),x=r.root.x+point[0]*Math.cos(a)-point[1]*Math.sin(a),y=r.root.y+point[0]*Math.sin(a)+point[1]*Math.cos(a);return [e.x+(e.face||1)*s*x,e.y-(e.z||0)+s*y-(e.scale||1)*leapHeight(e)];
 }
 function bones(c,e,k,t){const r=rig(e,k,t),scale=modelScale(k);c.save();c.scale(scale,scale);transform(c,r);for(const pts of [...r.arms,...r.legs].map(l=>[l.start,l.joint,l.end]).concat(r.strands.map(s=>s.points),r.torso?[r.torso.spine.map(s=>s.start).concat([r.torso.chest.center])]:[])){line(c,pts,'#69e0cb',1);for(const p of pts)oval(c,...p,2,2,'#f4d58c');}c.restore();}
 return {kinds,sample,rig,draw,anchor,bones,leapHeight,MODEL_SCALE,modelScale};
})(Motion);

/* Chapter IV: flat silhouettes, independent species rigs and encounter-timed clips. */
const AbyssArt=(function(Motion){
 'use strict';
 const kinds=new Set(['demon_jelly','nightmare','hell_hound','profane_obelisk','bottomless','behemoth']);
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const mix=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
 const rest={x:0,y:0,tilt:0,reach:0,lift:0,spread:0,jaw:0,cast:0,fold:0,whip:0,orbit:0,bite0:0,bite1:0,bite2:0};
 function keyframes(k,a){
  const p=v=>({...rest,...v});let wind=p({x:-6,reach:-.8,lift:.4,tilt:-.06,jaw:.65}),hit=p({x:12,reach:1,tilt:.1,jaw:-.3,spread:.3}),end=p({x:7,reach:.5,tilt:.05,spread:.1});
  if(['overhead','stomp','leap'].includes(a.pose)){
   wind=p({x:-4,y:-8,lift:1,tilt:-.12,reach:-.3,jaw:.9,spread:.2});hit=p({x:8,y:10,lift:-.25,tilt:.12,reach:.6,jaw:-.3,spread:.6});end=p({x:4,y:5,lift:-.1,reach:.3,spread:.3});
   if(a.pose==='leap')wind=p({x:-8,y:10,fold:.7,reach:-.5,jaw:.6});
  }else if(a.pose==='thrust'||['charge','backDash','nightmareHunt'].includes(a.action)){
   wind=p({x:-8,reach:-.7,fold:.3,tilt:-.09});hit=p({x:15,reach:1.25,tilt:.12,spread:-.2,jaw:.1});end=p({x:8,reach:.65,tilt:.05});
  }else if(a.pose==='uppercut'){
   wind=p({y:7,reach:-.3,lift:-.65,tilt:.12});hit=p({x:8,y:-2,reach:1,lift:.6});end=p({x:5,y:-6,reach:.25,lift:1.25,tilt:-.08});
  }
  if(a.ranged||['cast','bow'].includes(a.pose)){
   wind=p({y:4,cast:.5,spread:-.4,lift:.3,jaw:.35});hit=p({y:-4,cast:1,spread:1,lift:.7,jaw:1});end=p({y:-2,cast:.6,spread:.5,lift:.4,jaw:.3});
  }
  if(a.action==='eightPull'){wind=p({y:-5,reach:-.25,lift:.6,spread:-.6});hit=p({y:-7,spread:1.4,reach:.25,cast:1});end=p({spread:.65,reach:-.3});}
  if(a.pose==='electric'){wind=p({y:-3,reach:-.5,lift:.5,cast:.4});hit=p({x:7,reach:1.2,cast:1});end=p({x:3,reach:.65,cast:.4});}
  if(a.name==='甩尾'||a.name==='触手横鞭'){wind=p({x:-5,whip:-.8,tilt:-.07});hit=p({x:7,whip:1.1,tilt:.1,reach:.3});end=p({x:4,whip:.4});}
  if(k==='behemoth'&&a.pose==='bite'){wind=p({x:-8,jaw:.4,tilt:-.1,lift:.25});hit=p({x:15,jaw:-1,reach:1.1,tilt:.06});end=p({x:6,jaw:-.35,reach:.4});}
  if(k==='profane_obelisk'&&!a.ranged){wind.orbit=-.65;hit.orbit=1.1;end.orbit=.5;}
  if(k==='hell_hound'){
   const idx=a.name==='左首撕咬'?0:a.name==='中首重噬'?1:a.name==='右首噬咬'?2:-1;
   if(idx>=0){wind['bite'+idx]=-.75;hit['bite'+idx]=1;end['bite'+idx]=.35;}
   if(a.action==='shot'||a.action==='leap')for(let i=0;i<3;i++){wind['bite'+i]=-.45;hit['bite'+i]=.8;end['bite'+i]=.25;}
  }
  return {wind,hit,end};
 }
 function curve(frames,t){for(let i=1;i<frames.length;i++)if(t<=frames[i][0])return mix(frames[i-1][1],frames[i][1],smooth((t-frames[i-1][0])/(frames[i][0]-frames[i-1][0])));return {...frames.at(-1)[1]};}
 function sample(e,k,t){
  if(e.dead)return {...rest,fold:clamp((e.deathT||0)/.7),spread:-.5,jaw:.4};
  if(['hurt','flinch','stunned','knockdown'].includes(e.state))return {...rest,x:-4,y:7,tilt:-.11,fold:.45,spread:-.4,lift:-.3};
  const a=e.attack;if(!a||!['windup','active','recovery'].includes(e.state))return {...rest};
  const v=keyframes(k,a),cf=clamp(a.contactFraction??.35,0,1),wind=cf===0?v.hit:v.wind;
  const frames=cf===0?[[0,v.hit],[1,v.end]]:cf>=.99?[[0,wind],[1,v.hit]]:[[0,wind],[cf,v.hit],[Math.max(cf+.001,.86),v.end],[1,v.end]],end=cf>=.99?v.hit:v.end;
  if(e.state==='windup')return mix(rest,wind,smooth(e.t/(a.wind||1)));
  if(e.state==='active')return curve(frames,clamp(e.t/(a.active||1)));
  return mix(end,rest,smooth(1-e.t/(e.recoveryTotal||a.recovery||.5)));
 }
 function chain(start,target,upper,lower,bend=1){const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy),d=clamp(raw,Math.abs(upper-lower)+.001,upper+lower-.001),end=[start[0]+(raw?dx/raw:0)*d,start[1]+(raw?dy/raw:1)*d];return {start,end,joint:Motion.ik(start,end,upper,lower,bend),upper,lower};}
 function strand(start,count,length,angle){const points=[start];for(let i=0;i<count;i++){const a=angle(i),last=points.at(-1);points.push([last[0]+Math.cos(a)*length,last[1]+Math.sin(a)*length]);}return {points,length};}
 const point=(part,v)=>[part.center[0]+Math.cos(part.angle)*v[0]-Math.sin(part.angle)*v[1],part.center[1]+Math.sin(part.angle)*v[0]+Math.cos(part.angle)*v[1]];
 function rig(e,k,t=0){
  const p=sample(e,k,t),floating=['demon_jelly','nightmare','profane_obelisk'].includes(k),root={x:p.x,y:p.y+(floating&&!e.dead?Math.sin(t*2)*2:0),angle:p.tilt},arms=[],legs=[],strands=[],heads=[],stones=[];let torso=null;
  const foot=(start,x,i,upper,lower,bend,mount)=>{
   const gait=e.walking&&!e.dead?Math.sin((e.walkDistance||t*40)*.045+i*Math.PI):0,lift=p.fold*19+p.lift*(i%2?17:7)+Math.max(0,gait)*7;
   const tx=x+gait*9,ty=-root.y-lift,a=root.angle,l=chain(start,[tx*Math.cos(a)+ty*Math.sin(a),-tx*Math.sin(a)+ty*Math.cos(a)],upper,lower,bend);l.mount=mount;legs.push(l);
  };
  if(k==='demon_jelly'){
   for(let i=0;i<10;i++){const side=i<5?-1:1;strands.push(strand([-48+i*10.5,-92],8,i%3===0?12:13,j=>Math.PI/2+Math.sin(t*1.7+i*.9+j*.87)*.39-side*(.14+p.spread*.66)-p.reach*(i>4?1.02:.18)+p.lift*Math.sin(i+j*.6)*.45));}
  }else if(k==='nightmare'){
   for(let i=0;i<2;i++){const side=i?1:-1;arms.push(chain([side*19,-116],[side*68+p.reach*(i?35:18),-79-p.lift*55-p.cast*21],36,39,side));}
   for(let i=0;i<7;i++)strands.push(strand([-25+i*8,-66],4,13,j=>Math.PI/2+Math.sin(i+t*1.6+j*.6)*.14-p.reach*.28+p.fold*.3));
  }else if(k==='bottomless'){
   for(let i=0;i<4;i++){const side=i<2?-1:1,j=i%2;arms.push(chain([side*(j?42:28),-112+j*36],[side*(j?99:72)+p.reach*(side>0?32:12),-137+j*77-p.lift*35-p.cast*15],42,43,side));}
   foot([-27,-43],-65,0,31,40,1,'body');foot([26,-43],65,1,31,40,-1,'body');
  }else if(k==='profane_obelisk'){
   for(let i=0;i<6;i++){const a=t*.6+i*Math.PI/3+p.orbit;stones.push({center:[Math.cos(a)*(68+p.spread*14),-97+Math.sin(a)*24-p.lift*Math.cos(a)*35],angle:Math.sin(a)*.3+p.orbit*.35,depth:Math.sin(a),size:i%2?13:17});}
  }else{
   const large=k==='behemoth',abdomen={center:[large?-67:-62,large?-58:-55],angle:.02+p.fold*.12-p.reach*.035},joint=point(abdomen,[large?36:32,-3]);
   const angle=(large?-.27:-.17)-p.lift*.28+p.reach*.12+p.fold*.2,chest={center:point({center:joint,angle},[large?42:39,0]),angle};
   torso={abdomen,chest,joint,spine:[{start:abdomen.center,end:joint,length:Math.hypot(large?36:32,3)},{start:joint,end:chest.center,length:large?42:39}]};
   for(let i=0;i<4;i++){const front=i%2===1,part=front?chest:abdomen,offset=[i<2?-10:8,front?20:14];foot(point(part,offset),front?(i<2?58:85):(i<2?-91:-56),i,large?39:34,large?42:36,front?-1:1,front?'chest':'abdomen');legs.at(-1).offset=offset;}
   if(large){
    heads.push({center:point(chest,[34,-10]),angle:chest.angle+.2-p.jaw*.04,jaw:p.jaw});
    strands.push(strand(point(abdomen,[-25,-9]),7,16,j=>Math.PI-.5+Math.sin(t*1.2+j*.8)*.65-p.whip*.5));
    strands.push(strand(point(chest,[-5,8]),9,15,j=>Math.PI-.25+Math.sin(t*1.4+j*.7)*.55+p.whip*1.7));
   }else{
    const origins=[[10,-16],[-8,-38],[27,1]],lengths=[50,40,55],angles=[-.25,-1.1,.02];
    for(let i=0;i<3;i++){const start=point(chest,origins[i]),bite=p['bite'+i],angle=chest.angle+angles[i]+bite*.5-p.lift*.13,end=point({center:start,angle},[lengths[i],0]);heads.push({center:end,angle:angle*.45+.06,jaw:clamp(.22-bite*.7+p.cast*.5,-.35,1),neck:{start,end,length:lengths[i]},bite});}
    strands.push(strand(point(abdomen,[-29,-2]),7,13,j=>Math.PI-.7+Math.sin(j*.8+t*1.5)*.65-p.whip*1.4));
   }
  }
  return {pose:p,root,arms,legs,strands,heads,stones,torso};
 }
 function poly(c,pts,col){c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=col;c.fill();}
 function line(c,pts,col,w=2){c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='miter';c.lineCap='butt';c.stroke();}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 function gem(c,x,y,r,col){poly(c,[[x-r,y],[x-r*.4,y-r*.8],[x+r*.4,y-r],[x+r,y],[x+r*.5,y+r*.8],[x-r*.35,y+r]],col);}
 function shard(c,x,y,len,angle,col='#bd86d2',light='#e5b1ee'){c.save();c.translate(x,y);c.rotate(angle);poly(c,[[-len*.18,0],[-len*.14,-len*.44],[0,-len],[len*.17,-len*.35],[len*.1,4]],col);poly(c,[[0,-len],[len*.17,-len*.35],[len*.1,4],[0,-len*.19]],light);c.restore();}
 function space(c,part,paint){c.save();c.translate(...part.center);c.rotate(part.angle);paint();c.restore();}
 function segment(c,a,b,w,col,shade){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,n=[-dy/d*w,dx/d*w],pts=[[a[0]+n[0],a[1]+n[1]],[b[0]+n[0]*.7,b[1]+n[1]*.7],[b[0]-n[0]*.7,b[1]-n[1]*.7],[a[0]-n[0],a[1]-n[1]]];poly(c,pts,col);if(shade)poly(c,[a,b,pts[2],pts[3]],shade);}
 function limb(c,l,w,col,shade){segment(c,l.start,l.joint,w,col,shade);segment(c,l.joint,l.end,w*.7,col,shade);}
 function paw(c,h,w,col){poly(c,[[h[0]-w,h[1]-7],[h[0]+w*.6,h[1]-9],[h[0]+w+12,h[1]+2],[h[0]-w-3,h[1]+2]],col);for(let j=0;j<3;j++)poly(c,[[h[0]-w+2+j*w*.7,h[1]-5],[h[0]-w+8+j*w*.7,h[1]-4],[h[0]-w+13+j*w*.7,h[1]+3]],'#d3b8cf');}
 function hand(c,h,angle,size,col){space(c,{center:h,angle},()=>{poly(c,[[-15,-7],[-7,-17],[9,-15],[18,-2],[12,14],[-9,13]],col);for(let i=0;i<3;i++){const x=-13+i*12;poly(c,[[x,5],[x+7,4],[x+12,size*.46],[x+3,size],[x+5,size*.48],[x-1,19]],col);poly(c,[[x+12,size*.46],[x+3,size],[x+6,size*.61]],'#efb9ee');}poly(c,[[-9,-6],[-26,6],[-28,24],[-20,16],[-9,7]],col);});}
 function eye(c,x,y,rx,ry,col='#e78bdb'){oval(c,x,y,rx+2,ry+2,'#49354e');oval(c,x,y,rx,ry,col);oval(c,x+1,y-2,rx*.37,ry*.4,'#f5d0ec');}
 function jelly(c,e,r,t){
  r.strands.forEach((s,i)=>{line(c,e.dead?s.points.slice(0,4):s.points,i%3?'#9b8aca':'#c1a5e5',i%3?3.2:4.5);if(i%3===0&&!e.dead){const h=s.points.at(-1);shard(c,h[0],h[1]+5,14,.15,'#a989d1','#d2b6f2');}});
  poly(c,[[-64,-94],[-51,-131],[-30,-163],[0,-177],[30,-164],[52,-136],[65,-95],[31,-83],[-2,-88],[-32,-82]],'#51486c');
  poly(c,[[-64,-94],[-51,-131],[-30,-163],[0,-177],[-6,-139],[-30,-110],[-32,-82]],'#75668f');poly(c,[[0,-177],[30,-164],[52,-136],[65,-95],[31,-83],[19,-118]],'#3d3c58');
  line(c,[[-63,-94],[-32,-87],[0,-91],[31,-88],[64,-95]],'#b4a0c9',5);
  shard(c,0,-173,27,0,'#8e7fc2','#b4a3e7');
  for(const side of [-1,1])for(let i=0;i<3;i++){const x=side*(26+i*13),y=-146+i*18,len=e.bossState?.spiked?23+i*3:7;shard(c,x,y,len,side*.7,'#a895d8','#d6b9f0');}
  poly(c,[[-18,-141],[1,-157],[22,-140],[22,-116],[1,-98],[-20,-116]],'#9d8cd1');poly(c,[[1,-157],[22,-140],[22,-116],[1,-98],[7,-123]],'#cfb9ee');poly(c,[[1,-152],[6,-128],[0,-105],[-5,-128]],'#25243d');
  for(const s of [-1,1]){oval(c,s*43,-104,4,5,'#27283e');line(c,[[s*36,-141],[s*44,-120]],'#8979a7',2);}
  if(e.attack?.pose==='electric'&&e.state==='active'&&r.pose.cast>.5){for(const s of r.strands.slice(5)){const h=s.points.at(-1);line(c,[[h[0]-6,h[1]-7],[h[0]+3,h[1]-2],[h[0]-2,h[1]+4],[h[0]+7,h[1]+8]],'#d6cafa',1.5);}}
 }
 function nightmare(c,e,r,t){
  const p=r.pose;limb(c,r.arms[0],5,'#665071','#493b55');if(!e.dead)hand(c,r.arms[0].end,.3-p.reach*.7,45,'#a47fac');
  r.strands.forEach((s,i)=>{for(let j=1;j<s.points.length;j++)segment(c,s.points[j-1],s.points[j],8-j*1.4,i%2?'#553d66':'#322d46');if(i%3===0){const h=s.points.at(-1);shard(c,h[0],h[1]+6,14,.6,'#ab6ebd','#d79bdc');}});
  poly(c,[[-17,-133],[-35,-112],[-23,-78],[-32,-55],[-11,-64],[-15,-34],[5,-54],[21,-40],[14,-74],[34,-96],[20,-123]],'#41364e');
  poly(c,[[-17,-133],[-35,-112],[-23,-78],[-32,-55],[-11,-64],[-4,-103]],'#6e527a');poly(c,[[2,-124],[20,-123],[34,-96],[14,-74],[21,-40],[3,-60]],'#2c293f');
  poly(c,[[-22,-127],[-29,-149],[0,-184],[31,-141],[15,-125],[0,-116]],'#6c4775');poly(c,[[-29,-149],[0,-184],[3,-163],[-10,-142],[-22,-127]],'#865d8e');poly(c,[[-14,-143],[1,-165],[18,-140],[5,-120]],'#17182b');
  poly(c,[[-10,-139],[-2,-134],[-4,-129],[-11,-133]],'#e296de');poly(c,[[5,-134],[13,-141],[13,-134],[7,-129]],'#f1a4e4');
  shard(c,0,-90,23,0,'#aa6bbe','#dda2e4');poly(c,[[-19,-115],[-42,-105],[-22,-98],[-11,-106]],'#8b6796');poly(c,[[18,-115],[41,-96],[23,-98],[9,-108]],'#725784');
  limb(c,r.arms[1],5,'#7f5d8c','#503b60');if(!e.dead)hand(c,r.arms[1].end,-.2-p.reach*.9+p.lift*.4,48,'#c18ac6');
  for(let i=0;i<5;i++)shard(c,Math.cos(i*2.4+t*.2)*(48+i%2*12),-102+Math.sin(i*2.4+t*.2)*69,11+i%2*5,i%2*.2,'#a972bb','#dda7e6');
 }
 function beastTorso(c,r,large){
  const {abdomen,chest,joint}=r.torso;
  space(c,abdomen,()=>{poly(c,[[-37,-5],[-27,-31],[1,-39],[31,-23],[37,3],[18,26],[-16,27],[-35,12]],large?'#625276':'#815473');poly(c,[[-37,-5],[-27,-31],[1,-39],[31,-23],[0,-20],[-16,27],[-35,12]],large?'#817092':'#a17494');poly(c,[[0,-20],[31,-23],[37,3],[18,26],[0,19]],'#45364f');for(let i=0;i<3;i++)line(c,[[-7+i*10,-10],[-1+i*9,4],[-5+i*9,15]],large?'#9e84ab':'#c490b1',2);});
  segment(c,point(abdomen,[24,-3]),joint,15,'#745679','#44354f');segment(c,joint,point(chest,[-22,0]),15,'#8c6c95','#53405d');
  space(c,chest,()=>{poly(c,[[-33,-25],[-16,-49],[15,-49],[39,-26],[41,6],[20,32],[-9,29],[-32,10]],large?'#766086':'#815773');poly(c,[[-33,-25],[-16,-49],[15,-49],[39,-26],[9,-28],[-13,6],[-32,10]],large?'#9981a2':'#ac7e9e');poly(c,[[9,-28],[39,-26],[41,6],[20,32],[-4,15]],'#4c3a57');for(let i=0;i<3;i++)line(c,[[13,-14+i*10],[29,-8+i*8],[31,-14+i*8]],large?'#9b77a8':'#bd86aa',2.5);});
 }
 function dogHead(c,h,near,yellow){
  const skin=near?'#b38eaf':'#91718f',dark='#503047',jaw=.42+h.jaw*.9,hinge={center:[1,7],angle:jaw};
  segment(c,h.neck.start,h.neck.end,13,near?'#9a7699':'#755474','#503a59');
  space(c,h,()=>{poly(c,[[-18,-15],[-5,-25],[18,-20],[25,-8],[44,-3],[38,9],[19,18],[-8,13]],skin);poly(c,[[-18,-15],[-5,-25],[18,-20],[25,-8],[3,-13],[-4,7]],near?'#c4a1bb':'#a98aa5');poly(c,[[4,3],[40,2],point(hinge,[40,5]),point(hinge,[12,12]),[0,10]],'#281f30');for(let i=0;i<5;i++)poly(c,[[14+i*5,2],[18+i*5,2],[16+i*5,10+i%2*3]],'#e1d5c7');space(c,hinge,()=>{poly(c,[[-6,0],[7,8],[29,8],[40,0],[36,13],[10,18],[-7,8]],skin);for(let i=0;i<4;i++)poly(c,[[12+i*6,9],[17+i*6,9],[15+i*6,1]],'#d2bfc5');});
   poly(c,[[-14,-12],[-29,-32],[-12,-25],[-3,-17]],dark);poly(c,[[2,-22],[0,-40],[15,-26],[16,-17]],'#794269');poly(c,[[-15,-11],[-35,-15],[-21,1],[-31,9],[-13,13],[-8,-1]],'#5d344f');eye(c,15,-8,3,4,yellow?'#e8bd70':'#e685c3');gem(c,4,-5,2,'#c263a5');poly(c,[[36,-3],[43,-2],[41,2],[36,1]],'#413342');
  });
 }
 function hound(c,e,r,t){
  line(c,r.strands[0].points,'#7b3f64',7);line(c,r.strands[0].points.slice(-3),'#b66492',4);
  const leg=(l,i)=>{limb(c,l,i<2?9:11,i<2?'#6a4c6c':'#aa83a6','#543a5b');paw(c,l.end,i<2?10:12,i<2?'#816581':'#b899b1');};r.legs.slice(0,2).forEach(leg);
  dogHead(c,r.heads[0],false,e.bossState?.yellowRage>e.bossState?.clock);dogHead(c,r.heads[1],false,e.bossState?.yellowRage>e.bossState?.clock);
  beastTorso(c,r,false);
  for(const part of [r.torso.abdomen,r.torso.chest])space(c,part,()=>{for(let i=0;i<4;i++)shard(c,-24+i*14,-24-Math.sin(i/3*Math.PI)*14,27+i%2*15,-.45+i*.12,'#c064a4','#ed9ed1');});
  r.legs.slice(2).forEach((l,i)=>leg(l,i+2));dogHead(c,r.heads[2],true,e.bossState?.yellowRage>e.bossState?.clock);
 }
 function orbitStone(c,s){space(c,s,()=>{const z=s.size;poly(c,[[-z,-z*.5],[z*.15,-z*1.5],[z,z*.5],[-z*.3,z*1.5]],'#805888');poly(c,[[-z,-z*.5],[z*.15,-z*1.5],[0,0],[-z*.3,z*1.5]],'#af80b7');line(c,[[-z*.4,-z*.5],[z*.5,z*.4]],'#d3a2db',2);});}
 function obelisk(c,e,r,t){
  if(!e.dead)r.stones.filter(s=>s.depth<0).forEach(s=>orbitStone(c,s));
  const spread=r.pose.spread;line(c,[[-54,-98],[-30,-110],[0,-115],[32,-109],[54,-98]],'#68416f',5);
  poly(c,[[-25,-153],[-9,-165],[24,-150],[28,-60],[10,-41],[-9,-40],[-28,-61]],'#755080');poly(c,[[-25,-153],[-9,-165],[2,-144],[-2,-56],[-9,-40],[-28,-61]],'#b185ba');poly(c,[[2,-144],[24,-150],[28,-60],[10,-41],[-2,-56]],'#493552');
  poly(c,[[-23,-136],[0,-125],[24,-137],[23,-124],[0,-111],[-23,-123]],'#97709f');poly(c,[[-23,-78],[0,-67],[24,-78],[22,-63],[0,-49],[-22,-63]],'#9970a7');
  poly(c,[[0,-124],[14,-105],[14,-89],[0,-70],[-13,-87],[-13,-105]],'#d794d7');poly(c,[[0,-119],[4,-98],[0,-76],[-4,-98]],'#392840');
  shard(c,0,-169,31,0,'#bb81ce','#edb4ed');for(const s of [-1,1])shard(c,s*38,-141,21,s*.1,'#9d69b5','#d9a5e7');
  for(let i=0;i<3;i++)shard(c,-13+i*13,-10-i%2*8,35,-.05,'#ae7bc4','#d9aedf');
  line(c,[[-54,-98],[-31,-87],[0,-82],[31,-87],[54,-98]],'#7e4d87',5);if(!e.dead)r.stones.filter(s=>s.depth>=0).forEach(s=>orbitStone(c,s));
  for(const side of [-1,1])shard(c,side*(61+spread*9),-39,19,side*.2,'#af76c6','#d7a4e5');
 }
 function bottomless(c,e,r,t){
  const p=r.pose,arm=(l,i)=>{limb(c,l,6,i<2?'#775883':'#a378ac','#523b62');hand(c,l.end,(i<2?.42:-.42)-p.reach*.6,34,i<2?'#9f76a8':'#ba8ac4');};r.arms.slice(0,2).forEach(arm);
  r.legs.forEach((l,i)=>{limb(c,l,10,i?'#8f709d':'#675375','#483c58');paw(c,l.end,13,i?'#b592b6':'#8b6d96');});
  poly(c,[[-49,-118],[-26,-141],[7,-152],[42,-133],[59,-92],[49,-52],[25,-29],[-16,-28],[-51,-52],[-63,-87]],'#5c425f');
  const faces=[[-31,-115,20],[2,-139,18],[39,-115,17],[-48,-77,17],[45,-65,19],[-19,-40,17],[22,-38,16]];
  for(const [x,y,s] of faces){poly(c,[[x-s,y],[x-s*.45,y-s],[x+s*.3,y-s*1.2],[x+s,y],[x+s*.35,y+s],[x-s*.7,y+s*.5]],'#8c6a96');poly(c,[[x-s,y],[x-s*.45,y-s],[x+s*.3,y-s*1.2],[x,y],[x-s*.7,y+s*.5]],'#ad88b0');poly(c,[[x-5,y-5],[x+3,y-10],[x+8,y],[x+1,y+9],[x-7,y+2]],'#352137');eye(c,x+1,y-1,2.5,3,'#ec76b9');}
  // Portal shares the body's root transform; rings never detach during a stomp or recoil.
  for(let layer=0;layer<5;layer++){const radius=39-layer*7,pts=[];for(let i=0;i<13;i++){const a=i*Math.PI*2/13+t*(layer%2?-.5:.5)+layer*.33,rr=radius+(i%2?2:0)*(1+p.cast*.3);pts.push([Math.cos(a)*rr,-86+Math.sin(a)*rr*1.12]);}poly(c,pts,['#bc377f','#7d255c','#542044','#311c35','#151425'][layer]);}
  for(let i=0;i<5;i++){const a=t*.8+i*2.4;gem(c,Math.cos(a)*31,-86+Math.sin(a)*34,1.8,'#e787c1');}gem(c,0,-86,2,'#d178c4');
  r.arms.slice(2).forEach((l,i)=>arm(l,i+2));for(let i=0;i<5;i++)shard(c,Math.cos(i*2.4+t*.2)*74,-90+Math.sin(i*2.4+t*.2)*77,12,0,'#a96fb9','#dc9be0');
 }
 function behemoth(c,e,r,t){
  r.strands.forEach((s,i)=>line(c,s.points,i?'#97558f':'#6a3d6d',i?6:5));
  const leg=(l,i)=>{limb(c,l,i<2?17:21,i<2?'#655573':'#a087a8','#4f405b');gem(c,...l.joint,i<2?11:14,i<2?'#7c6887':'#b298b7');paw(c,l.end,i<2?14:18,i<2?'#8b7494':'#c4a8c2');};r.legs.slice(0,2).forEach(leg);
  beastTorso(c,r,true);
  for(const part of [r.torso.abdomen,r.torso.chest])space(c,part,()=>{for(let i=0;i<4;i++)shard(c,-29+i*16,-25-Math.sin(i/3*Math.PI)*20,38+i%2*23,-.55+i*.19,'#aa79c3','#d6a3ec');});
  r.legs.slice(2).forEach((l,i)=>leg(l,i+2));
  space(c,r.heads[0],()=>{
   poly(c,[[-23,-29],[-3,-49],[29,-46],[62,-26],[76,-7],[65,20],[20,30],[-16,14]],'#74617f');poly(c,[[-23,-29],[-3,-49],[29,-46],[62,-26],[17,-29],[-16,14]],'#9e88a6');
   const jaw=r.pose.jaw,hinge=[8,2],upper={center:hinge,angle:-.08-jaw*.13},lower={center:hinge,angle:.05+jaw*.72};
   poly(c,[point(upper,[5,-11]),point(upper,[74,-5]),point(lower,[62,48]),point(lower,[29,49]),point(lower,[-7,4])],'#302238');
   space(c,upper,()=>{
    poly(c,[[0,-22],[41,-29],[78,-14],[73,-3],[40,-8],[10,-8],[-9,3]],'#b49eb8');
    for(let i=0;i<7;i++)poly(c,[[9+i*9,-10],[17+i*9,-9],[12+i*9,12+i%2*9]],'#e3d1d2');
   });
   space(c,lower,()=>{poly(c,[[-7,4],[5,35],[29,49],[62,48],[78,29],[70,60],[37,76],[4,61],[-15,30]],'#9c83a5');poly(c,[[5,35],[29,49],[62,48],[70,38],[59,63],[31,66],[10,53]],'#713e66');for(let i=0;i<6;i++)poly(c,[[13+i*9,52+i%2*4],[21+i*9,53+i%2*4],[18+i*9,31-i%2*8]],'#dfc6d0');});
   for(const [x,y,s] of [[3,-24,3],[17,-32,4],[31,-27,3],[45,-19,2.5],[-7,-9,3],[5,-7,2.5]])eye(c,x,y,s,s,'#d37acf');
   shard(c,-15,-30,39,-.3,'#6d4c82','#a071b4');line(c,[[-17,-6],[-22,4],[-13,9]],'#b49cba',2);
  });
 }
 const painters={demon_jelly:jelly,nightmare,hell_hound:hound,profane_obelisk:obelisk,bottomless,behemoth};
 function leapHeight(e){if(e.dead||e.state!=='active'||e.attack?.action!=='leap')return 0;const a=e.attack,q=clamp(e.t/(a.active||1));return Math.sin(q*Math.PI)*(a.jumpHeight||55);}
 const modelScale=k=>k==='demon_jelly'?1.1:k==='nightmare'||k==='hell_hound'?1.05:k==='profane_obelisk'?1.2:k==='bottomless'?1.21:1;
 function transform(c,r){c.translate(r.root.x,r.root.y);c.rotate(r.root.angle);}
 function draw(c,e,k,t){if(!kinds.has(k))return false;const r=rig(e,k,t);c.save();c.scale(modelScale(k),modelScale(k));transform(c,r);painters[k](c,e,r,t);c.restore();return true;}
 function drops(c,e,k,t,d){if(!['demon_jelly','nightmare','profane_obelisk'].includes(k))return;const r=rig({...e,dead:true,deathT:0,attack:null},k,e.bossDeathAt??t),u=clamp(d*2.5);c.save();c.beginPath();c.rect(-500,-400,1000,403);c.clip();c.scale(modelScale(k),modelScale(k));
  if(k==='nightmare')r.arms.forEach((a,i)=>{const sign=i?1:-1;hand(c,[a.end[0]+sign*u*35,a.end[1]*(1-u*u)-24*u*u],(i?-.2:.3)+sign*u*1.5,i?48:45,i?'#c18ac6':'#a47fac');});
  if(k==='profane_obelisk')r.stones.forEach((s,i)=>{const q=clamp(((e.deathT||0)-i*.018)/.30);orbitStone(c,{...s,center:[s.center[0]+Math.sin(i*4)*q*18,s.center[1]*(1-q*q)-s.size*q*q],angle:s.angle+q*(i%2?1:-1)*1.4});});
  if(k==='demon_jelly')r.strands.forEach((s,i)=>{const q=clamp(((e.deathT||0)-i*.01)/.32),pivot=s.points[3];c.save();c.translate(pivot[0]+(i-4.5)*q*5,pivot[1]*(1-q*q)-12*q*q);c.rotate((i%2?1:-1)*q*Math.PI/2);const points=s.points.slice(3).map(v=>[v[0]-pivot[0],v[1]-pivot[1]]);line(c,points,i%3?'#9b8aca':'#c1a5e5',i%3?3.2:4.5);if(i%3===0){const h=points.at(-1);shard(c,h[0],h[1]+5,14,.15,'#a989d1','#d2b6f2');}c.restore();});
  c.restore();
 }
 function anchor(e,k,t,part){
  const r=rig(e,k,t),a=e.attack;let h=[0,-95];
  if(k==='bottomless'&&part==='portal')h=[0,-86];
  else if(a?.pose==='stomp')h=r.legs.at(-1)?.end||h;
  else if(k==='demon_jelly')h=a?.ranged?[0,-128]:r.strands.at(-1).points.at(-1);
  else if(k==='nightmare')h=r.arms[1].end;
  else if(k==='hell_hound'){const i=a?.name==='左首撕咬'?0:a?.name==='中首重噬'?1:2;h=a?.name==='甩尾'?r.strands[0].points.at(-1):point(r.heads[i],[30,0]);}
  else if(k==='profane_obelisk')h=a?.ranged?[0,-98]:r.stones[0].center;
  else if(k==='bottomless')h=a?.ranged||a?.pose==='cast'?[0,-86]:r.arms.at(-1).end;
  else if(k==='behemoth')h=a?.name==='触手横鞭'?r.strands[1].points.at(-1):point(r.heads[0],[63,0]);
  const angle=r.root.angle,s=(e.scale||1)*modelScale(k),x=r.root.x+h[0]*Math.cos(angle)-h[1]*Math.sin(angle),y=r.root.y+h[0]*Math.sin(angle)+h[1]*Math.cos(angle);
  return [e.x+(e.face||1)*s*x,e.y-(e.z||0)+s*y-(e.scale||1)*leapHeight(e)];
 }
 function bones(c,e,k,t){const r=rig(e,k,t),paths=r.arms.concat(r.legs).map(l=>[l.start,l.joint,l.end]).concat(r.strands.map(s=>s.points),r.heads.filter(h=>h.neck).map(h=>[h.neck.start,h.neck.end]),r.torso?[[r.torso.abdomen.center,r.torso.joint,r.torso.chest.center]]:[]);c.save();c.scale(modelScale(k),modelScale(k));transform(c,r);for(const pts of paths){line(c,pts,'#74dccc',1);for(const v of pts)oval(c,...v,2,2,'#e9d995');}c.restore();}
 return {kinds,sample,rig,draw,drops,anchor,bones,leapHeight,modelScale};
})(Motion);
 return Object.assign(FinalArt,{human:HumanArt,mutant:MutantArt,aberrant:AberrantArt,abyss:AbyssArt});

})(Motion);

const Models=(function(Motion,HumanArt,MutantArt,AberrantArt,AbyssArt){
 'use strict';const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const palettes={human:['#353e49','#89929a','#c3b08a'],mutant:['#4d4445','#96837c','#bc626a'],monster:['#353b4c','#737c91','#a694bd'],abyss:['#292639','#75617f','#ad70ce']};
 function line(c,p,col,w=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function poly(c,p,col,edge='#10121b',w=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=col;c.fill();}
 function ring(c,x,y,rx,ry,col,w=2){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);}
 function plate(c,pts,col,trim){poly(c,pts,col,'#151a22',1);const center=pts.reduce((a,v)=>[a[0]+v[0]/pts.length,a[1]+v[1]/pts.length],[0,0]);for(let i=0;i<pts.length;i++){c.save();c.globalAlpha*=i%3===0?.32:.13;poly(c,[center,pts[i],pts[(i+1)%pts.length]],i%2?'#080c19':trim,null);c.restore();}line(c,pts.slice(0,3),trim,1.3);}
 function flame(c,x,y,n,t,col='#ef9e48'){for(let i=0;i<5;i++){const a=i*2.3,x0=x+Math.sin(a)*n*.4,h=n*(.7+.3*Math.sin(t*8+a));poly(c,[[x0-5,y],[x0-8,y-h*.4],[x0+Math.sin(t*6+a)*6,y-h],[x0+5,y-h*.3]],col,null);}}
 function shard(c,x,y,n,a,col){c.save();c.translate(x,y);c.rotate(a);poly(c,[[-n*.14,0],[-n*.18,-n*.35],[0,-n],[n*.14,-n*.42],[n*.12,0]],col,'#181326',1);line(c,[[0,-n],[0,-n*.1]],'#d9d0e4',.8);c.restore();}
 function limb(c,a,b,d,width,col,trim){for(const [from,to,w] of [[a,b,width],[b,d,width*.73]]){const dx=to[0]-from[0],dy=to[1]-from[1],len=Math.hypot(dx,dy)||1,n=[-dy/len*w*.5,dx/len*w*.5];plate(c,[[from[0]+n[0],from[1]+n[1]],[to[0]+n[0]*.7,to[1]+n[1]*.7],[to[0]-n[0]*.7,to[1]-n[1]*.7],[from[0]-n[0],from[1]-n[1]]],col,trim);}oval(c,b[0],b[1],width*.34,width*.34,trim);}
 function claws(c,h,n=3,len=28,col='#d1c5b7'){for(let i=0;i<n;i++){const x=h[0]+i*6-7,y=h[1]+i*2;poly(c,[[x-3,y-3],[x+8,y-5],[x+len*.66,y+len*.22],[x+len*.78,y+len*.62],[x+len*.62,y+len],[x+len*.5,y+len*.43],[x+6,y+6]],col,null);}}
 function weapon(c,type,h,angle,p,t,e){if(e.dead&&!e.droppedWeapon)return;c.save();c.translate(h[0],h[1]);c.rotate(angle);const steel='#b1bbc1',dark='#34303c',trim=p[2],s=e.bossState||{},clock=s.clock||0;
  if(type==='armBlade'){poly(c,[[-9,9],[-15,-13],[-10,-40],[15,-79],[8,-41],[11,-12],[7,8]],'#b5a8a7','#55434c');line(c,[[-4,5],[-5,-27],[12,-68]],'#e5d4be',1.5);oval(c,0,3,10,7,'#79626b');}
  else if(['sword','flameSword','greatsword','sabre','chestSword','dagger'].includes(type)){const len=type==='greatsword'?106:type==='dagger'?44:77,w=type==='greatsword'?13:6;line(c,[[0,13],[0,-15]],'#4e3831',6);line(c,[[-14,-13],[14,-13]],trim,4);poly(c,[[-w,-17],[-w,-len+12],[type==='sabre'?8:0,-len],[w,-len+15],[w,-17]],type==='flameSword'&&(s.lit>clock||e.enraged)?'#f28b32':steel);line(c,[[0,-20],[0,-len+10]],'#e1e5dc',1);if(type==='flameSword'&&(s.lit>clock||e.enraged)){for(let i=0;i<8;i++){const q=(t*.9+i*.618)%1;c.globalAlpha=(1-q)*.8;oval(c,Math.sin(i*2.4+t)*9+q*8,-22-i*6-q*19,1+q,1+q,i%2?'#ffb956':'#ffe2a0');}c.globalAlpha=1;}if(type==='flameSword'&&(s.lit>clock||e.enraged)){for(let i=0;i<5;i++)flame(c,0,-24-i*13,22,t+i,'#ff983c');}if(type==='greatsword')for(let i=0;i<4;i++)poly(c,[[-5,-30-i*13],[0,-35-i*13],[5,-30-i*13],[0,-26-i*13]],'#87644e',null);
  }else if(type==='shield'){poly(c,[[-25,-46],[4,-56],[28,-43],[24,3],[0,24],[-25,4]],'#263642');poly(c,[[-19,-42],[1,-49],[21,-40],[17,0],[0,16],[-18,0]],'#4e6571',trim,2);line(c,[[0,-43],[0,8]],trim,4);line(c,[[-14,-19],[14,-19]],trim,3);oval(c,0,-19,6,6,'#abb7b4');
  }else if(type==='axe'||type==='cleaver'){line(c,[[0,17],[0,-65]],'#6c4933',6);poly(c,type==='cleaver'?[[-4,-66],[28,-63],[31,-26],[3,-29]]:[[-3,-64],[8,-70],[13,-63],[35,-49],[30,-28],[18,-32],[8,-45],[-3,-44]],steel);line(c,[[27,-54],[25,-34]],'#e0d7bc',2);
  }else if(type==='crossbow'||type==='musket'){line(c,[[0,14],[0,-67]],'#68513c',9);line(c,[[4,-10],[4,-74]],steel,4);if(type==='crossbow'){line(c,[[-28,-29],[-21,-46],[0,-51],[21,-46],[28,-29]],'#74818c',5);line(c,[[-28,-29],[0,-4],[28,-29]],'#d6c5a0',1);}else{line(c,[[0,-70],[7,-70]],'#151923',9);oval(c,-8,7,6,12,'#423328');}
  }else if(type==='hammer'){line(c,[[0,15],[0,-81]],'#665349',8);plate(c,[[-31,-94],[29,-94],[35,-63],[-34,-63]],'#59616a',trim);for(let i=-1;i<2;i++)line(c,[[i*17,-92],[i*17,-65]],'#202830',3);if(s.charged){glow(c,0,-79,45,'#ffce5577');for(let i=0;i<7;i++)oval(c,Math.sin(t*5+i)*33,-80+Math.cos(t*4+i)*25,2,2,'#ffe582');}
  }else if(type==='trunk'){line(c,[[0,20],[0,-105]],'#715d43',24);for(let i=-1;i<2;i++)line(c,[[i*6,15],[i*7-3,-90]],'#3b332b',2);line(c,[[4,-61],[30,-80]],'#65513b',11);oval(c,0,-106,13,6,'#a1936b');ring(c,0,-106,7,3,'#554530');
  }else if(type==='scythe'){line(c,[[0,40],[0,-97]],'#6d6963',6);poly(c,[[0,-99],[20,-116],[49,-118],[78,-103],[88,-77],[66,-94],[42,-99],[19,-91]],steel);line(c,[[19,-96],[46,-106],[73,-98]],'#687485',2);
  }else if(type==='hook'){line(c,[[0,0],[10,-20],[22,-34],[38,-30],[41,-15],[32,-8],[25,-13]],'#b7adb0',4);for(let i=0;i<9;i++)ring(c,-i*6,Math.sin(i*.8+t)*5+i*2,4,3,'#767e88',1.5);
  }else if(type==='staff'||type==='archStaff'){line(c,[[0,37],[0,-110]],'#726254',6);poly(c,[[-21,-108],[-13,-137],[0,-145],[16,-132],[21,-107],[0,-115]],type==='archStaff'?'#af9767':'#8a7589');oval(c,0,-125,9,13,'#7153a8');glow(c,0,-126,24,'#a986e64c');if(e.state==='windup'&&['flameJet','quake'].includes(e.attack?.action)){glow(c,0,-125,32,'#ff534dc0');flame(c,0,-123,26,t);}
  }else if(type==='reliquary'){poly(c,[[-22,-50],[22,-50],[27,-5],[-23,-5]],'#574d43',trim,3);poly(c,[[-17,-44],[17,-44],[17,-11],[-17,-11]],'#171d29');shard(c,0,-10,38,0,e.dead?'#37333c':'#e784be');line(c,[[-22,-39],[22,-39]],'#a69974',3);line(c,[[-22,-16],[22,-16]],'#a69974',3);
  }else if(type==='claws')claws(c,[0,-8],3,35);
  c.restore();
 }
 function pose(e,t){const a=e.attack||{},wind=e.state==='windup'?clamp(e.t/(a.wind||1)):0,active=e.state==='active'?clamp(e.t/(a.active||1)):0,swing=Math.sin(active*Math.PI),walking=e.walking||e.moving,gait=walking?Math.sin((e.walkDistance||t*65)*.09):Math.sin(t*2)*.1;
  let h=[25+44*swing,-68-38*wind],back=[-30,-63],angle=.45-wind*1.8+active*2.8;
  if(['overhead','leap','uppercut'].includes(a.pose)){h=[13+40*swing,-62-65*wind-40*Math.cos(active*Math.PI)*swing];angle=-.6-wind*.6+active*2.3;}
  if(['thrust','bow','cast'].includes(a.pose)){h=[30+35*swing-15*wind,-76];angle=1.45;}
  if(a.pose==='guard'){h=[24,-83];back=[21,-72];angle=.15;}
  if(a.pose==='reverse'){h=[24-40*wind+45*swing,-74];angle=-1.2-wind+active*3.2;}
  if(a.pose==='shield')back=[25+32*swing,-70];
  if(a.pose==='uppercut'){h=[26+35*swing,-45-72*active+wind*18];angle=1.9-active*2.9;}
  if(a.pose==='dualThrust'){h=[25+55*clamp((active-.55)/.2),-77];back=[h[0]-7,-94];angle=active>.55?Math.PI/2:-.7;}
  if(a.pose==='point'){back=[-5+80*wind,-91];h=[27,-62];}
  if(a.pose==='spin'){h=[30+Math.cos(active*TAU)*45,-70];back=[-h[0],-80];angle=active*TAU;}
  if(a.pose==='rear'){h=[18,-60];back=[-55-25*wind,-68];angle=-.7;}
  return {h,back,angle,gait,swing,wind,active,bob:Math.sin(t*2)*1.2};
 }
 const humanKinds=new Set(['iron_guard','hunter','twin_blade','flame_blade','war_hammer','butcher','archmage','general','reaper','sacrifice','giant_zombie','explorer','mutant_blade','crystal_claw','champion','dying','plague','marked_priest']);
 // Each silhouette owns its proportions and joint anchors; animation offsets share the rig.
 const rigs={
 iron_guard:{w:23,hip:[-7,-52],chest:[-9,-91],head:[0,-126],front:[22,-69],back:[-34,-68],feet:[[-28,0],[36,0]],armor:true},
 hunter:{w:18,hip:[-12,-46],chest:[2,-86],head:[17,-119],front:[51,-76],back:[-40,-58],feet:[[-44,0],[37,0]],hood:true},
 twin_blade:{w:16,hip:[-5,-48],chest:[12,-84],head:[28,-116],front:[48,-68],back:[-36,-51],feet:[[-41,0],[44,0]],hood:true},
 flame_blade:{w:18,hip:[-9,-46],chest:[5,-85],head:[20,-119],front:[43,-65],back:[-32,-52],feet:[[-43,0],[40,0]],hood:true},
 war_hammer:{w:29,hip:[-7,-50],chest:[-6,-95],head:[4,-129],front:[41,-69],back:[20,-55],feet:[[-38,0],[39,0]],armor:true},
 butcher:{w:30,hip:[-9,-49],chest:[1,-88],head:[15,-119],front:[45,-46],back:[-44,-55],feet:[[-41,0],[40,0]],flesh:true},
 archmage:{w:17,hip:[-5,-48],chest:[-4,-91],head:[6,-125],front:[38,-68],back:[-31,-63],feet:[[-28,0],[29,0]],robe:true},
 general:{w:20,hip:[-8,-46],chest:[3,-89],head:[18,-124],front:[47,-66],back:[-36,-65],feet:[[-41,0],[43,0]]},
 reaper:{w:17,hip:[-14,-43],chest:[-3,-90],head:[16,-128],front:[39,-68],back:[-27,-48],feet:[[-39,0],[31,0]],robe:true,hood:true},
 sacrifice:{w:31,hip:[-8,-46],chest:[4,-84],head:[23,-111],front:[55,-32],back:[-46,-42],feet:[[-41,0],[44,0]],flesh:true},
 giant_zombie:{w:35,hip:[-8,-56],chest:[5,-108],head:[24,-142],front:[54,-56],back:[-48,-63],feet:[[-45,0],[42,0]],flesh:true},
 explorer:{w:17,hip:[-12,-43],chest:[3,-85],head:[22,-119],front:[47,-56],back:[-35,-63],feet:[[-39,0],[40,0]]},
 mutant_blade:{w:22,hip:[-10,-42],chest:[2,-85],head:[18,-119],front:[58,-41],back:[-44,-52],feet:[[-42,0],[43,0]],flesh:true},
 crystal_claw:{w:25,hip:[-5,-43],chest:[7,-84],head:[26,-118],front:[57,-38],back:[-45,-43],feet:[[-36,0],[39,0]],armor:true},
 champion:{w:32,hip:[-5,-51],chest:[3,-96],head:[21,-131],front:[48,-55],back:[31,-48],feet:[[-39,0],[42,0]],armor:true},
 dying:{w:36,hip:[-9,-49],chest:[-2,-100],head:[19,-126],front:[56,-39],back:[-47,-47],feet:[[-44,0],[43,0]],flesh:true},
 plague:{w:23,hip:[-8,-43],chest:[-2,-83],head:[18,-114],front:[53,-40],back:[-36,-43],feet:[[-37,0],[39,0]],flesh:true,hood:true},
 marked_priest:{w:17,hip:[-5,-45],chest:[0,-88],head:[12,-125],front:[39,-65],back:[-32,-68],feet:[[-30,0],[30,0]],robe:true}
 };
 function fixedChain(start,target,upper,lower,bend){const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy),distance=clamp(raw,Math.abs(upper-lower)+.001,upper+lower-.001),nx=raw?dx/raw:0,ny=raw?dy/raw:1,end=[start[0]+nx*distance,start[1]+ny*distance];return {end,joint:Motion.ik(start,end,upper,lower,bend)};}
 function humanoidRig(e,k,time){
  const factor=k==='giant_zombie'?1.48:k==='dying'?1.42:1.34;
  const animation=Motion.samplePose(e,false,time),j=Motion.joints(animation),point=v=>v.map(n=>n*factor);
  const hip=point(j.hip),chest=point(j.chest),head=point(j.head),front=point(j.front),rear=point(j.rear);
  // Use the same planted/swinging feet and two-link knees as ordinary humanoids.
  const shoulders=[[chest[0]-9,chest[1]+3],[chest[0]+9,chest[1]+3]],hands=[point(j.back),point(j.hand)];
  if(k==='hunter'&&e.attack?.ranged){hands[0]=point(j.hand);hands[1]=[chest[0]+22,chest[1]+29];}
  if(e.attack?.pose==='kick'&&e.state==='active'){const u=Math.sin(Math.PI*clamp(e.t/e.attack.active));front[0]+=u*39;front[1]-=u*39;}
  if(e.attack?.pose==='point'){hands[0]=[chest[0]+51,chest[1]+3];}
  if(e.attack?.pose==='dualThrust'){const u=e.state==='active'?clamp((e.t/e.attack.active-.55)/.17):0;hands[0]=[chest[0]+18+u*37,chest[1]-6];hands[1]=[chest[0]+23+u*37,chest[1]+6];}
  const armLength=22*factor,arms=hands.map((h,i)=>fixedChain(shoulders[i],h,armLength,armLength,i?1:-1)),legs=[rear,front].map((f,i)=>fixedChain(hip,f,24*factor,25*factor,i?-1:1));
  return {hip,chest,head,feet:legs.map(v=>v.end),knees:legs.map(v=>v.joint),shoulders,hands:arms.map(v=>v.end),elbows:arms.map(v=>v.joint),angle:animation.angle+Math.PI/2,backAngle:animation.backAngle+Math.PI/2,factor};
 }
 // Authored skin for the dual swordsman. Shapes follow anatomy and cloth seams,
 // rather than triangulating every limb around an arbitrary center.
 function dualBladeRig(e,t){
  // Ordinary humanoid proportions, uniformly enlarged to the existing boss height.
  const factor=1.68,point=v=>v.map(n=>n*factor),j=Motion.joints(Motion.samplePose(e,false,t));
  const sampled=humanoidRig(e,'twin_blade',t),acting=['windup','active','recovery'].includes(e.state)&&e.attack;
  const hip=point(j.hip),chest=point(j.chest),head=point(j.head),hips=[hip,hip];
  const shoulders=[[-7,0],[7,0]].map(v=>[chest[0]+v[0],chest[1]+v[1]]);
  const handTargets=acting?sampled.hands.map(v=>v.map(n=>n*factor/sampled.factor)):[point(j.back),point(j.hand)];
  if(acting&&e.attack.pose==='dualThrust'){
    const u=e.state==='active'?clamp((e.t/e.attack.active-.55)/.17):e.state==='recovery'?1-clamp(e.t/(e.attack.recovery||.4)):0;
    handTargets[0]=[chest[0]+19+u*49,chest[1]-7];handTargets[1]=[chest[0]+26+u*49,chest[1]+7];
    sampled.angle=sampled.backAngle=-.65+(Math.PI/2+.65)*u;
  }
  const arms=handTargets.map((v,i)=>fixedChain(shoulders[i],v,23*factor,24*factor,i?1:-1));
  const legs=[j.rear,j.front].map((v,i)=>fixedChain(hip,point(v),24*factor,25*factor,i?-1:1));
  return {hip,chest,head,hips,shoulders,hands:arms.map(v=>v.end),elbows:arms.map(v=>v.joint),feet:legs.map(v=>v.end),knees:legs.map(v=>v.joint),sampled,acting,factor};
 }
 function dualBladeModel(c,e,t){
  const ink='#20232e',cloth='#343743',light='#555963',skin='#d5d2b8',steel='#ccd3cc';
  const fill=(pts,col)=>poly(c,pts,col,null);
  const {hip,chest,head,hips,shoulders,hands,elbows,feet,knees,sampled,acting}=dualBladeRig(e,t);
  function segment(a,b,widthA,widthB,col,shade){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;fill([[a[0]+nx*widthA,a[1]+ny*widthA],[b[0]+nx*widthB,b[1]+ny*widthB],[b[0]-nx*widthB,b[1]-ny*widthB],[a[0]-nx*widthA,a[1]-ny*widthA]],col);if(shade)fill([[a[0]-nx*widthA,a[1]-ny*widthA],[b[0]-nx*widthB,b[1]-ny*widthB],[b[0]+nx*widthB*.15,b[1]+ny*widthB*.15],[a[0]+nx*widthA*.15,a[1]+ny*widthA*.15]],shade);}
  function sword(hand,angle,length){c.save();c.translate(...hand);c.rotate(angle);fill([[-2.6,9],[2.8,9],[3,-8],[-2.5,-8]],'#70604c');fill([[-8,-6],[9,-7],[10,-10],[-8,-9]],'#b9ae87');fill([[-3.6,-11],[-3.1,-length+11],[.5,-length],[4,-length+15],[3.3,-11]],steel);fill([[.5,-length],[4,-length+15],[3.3,-11],[.3,-13]],'#919e9e');fill([[-3,-length+12],[.5,-length],[.3,-13],[-3.6,-11]],'#e4e6d1');c.restore();}
  // Rear arm and the shorter off-hand blade remain behind the body.
  segment(shoulders[0],elbows[0],5.5,4.2,'#444954','#717982');segment(elbows[0],hands[0],3.5,2.8,'#aaaead','#717880');
  const offAngle=acting?sampled.backAngle:-1.04;if(!e.dead)sword(hands[0],offAngle,66);
  fill([[hands[0][0]-4,hands[0][1]-3],[hands[0][0]+3,hands[0][1]-4],[hands[0][0]+5,hands[0][1]+2],[hands[0][0]-1,hands[0][1]+5]],skin);
  // Trousers overlap the knees; slim greaves taper into the ankle.
  for(let i=0;i<2;i++){const h=hips[i],k=knees[i],f=feet[i];segment(h,k,7.5,5,i?cloth:'#282d37',i?'#50565f':'#363c46');segment(k,f,4.6,3.3,i?'#aeb5b2':'#979fa1',i?'#717c82':'#626e76');fill([[k[0]-5,k[1]-4],[k[0]+4,k[1]-5],[k[0]+6,k[1]+3],[k[0],k[1]+6],[k[0]-5,k[1]+2]],i?'#909da0':'#77868b');fill([[f[0]-4,f[1]-3],[f[0]+4,f[1]-4],[f[0]+8,f[1]],[f[0]+10,f[1]+3],[f[0]-7,f[1]+3],[f[0]-8,f[1]]],i?'#c5c8b8':'#aeb6b0');}
  const cx=chest[0],cy=chest[1],hx=hip[0],hy=hip[1];
  // Three-quarter torso: back, side and chest are deliberate large planes.
  fill([[cx-16,cy-3],[cx-8,cy-12],[cx+11,cy-9],[cx+18,cy+1],[hx+12,hy-4],[hx+7,hy+7],[hx-12,hy+4],[cx-12,cy+20]],cloth);
  fill([[cx-16,cy-3],[cx-8,cy-12],[cx-7,cy+16],[hx-12,hy+4],[hx-19,hy+7],[cx-15,cy+19]],'#242b35');
  fill([[cx+1,cy-9],[cx+11,cy-9],[cx+18,cy+1],[hx+12,hy-4],[hx+4,hy-3],[cx+8,cy+16]],'#454a54');
  fill([[cx-10,cy+19],[cx+10,cy+20],[hx+12,hy-4],[hx-8,hy-1]],'#2c333e');
  // Neck sits inside the cowl and scarf, never on a visible ball joint.
  segment([cx+7,cy-6],[head[0]-3,head[1]+13],5,4,'#666d70');
  const x=head[0],y=head[1];c.save();
  oval(c,x,y,16.8,17.4,ink);
  c.beginPath();c.moveTo(x-15,y+6);c.bezierCurveTo(x-23,y-14,x-5,y-25,x+10,y-14);c.bezierCurveTo(x-3,y-16,x-11,y-7,x-15,y+6);c.fillStyle='#51565f';c.fill();
  // Rounded cranium beneath a separate mask whose upper rim rises past the face.
  c.beginPath();c.moveTo(x-4,y-8);c.lineTo(x+10,y-23);c.lineTo(x+15,y-10);c.bezierCurveTo(x+20,y+2,x+14,y+14,x+6,y+16);c.quadraticCurveTo(x-5,y+13,x-4,y-8);c.fillStyle='#dedec2';c.fill();
  fill([[x+10,y-23],[x+15,y-10],[x+16,y+3],[x+12,y+11],[x+8,y+13],[x+9,y-6]],'#c0c5b1');
  fill([[x+3,y+1],[x+11,y-1],[x+10,y+3],[x+4,y+4]],'#222b2e');
  fill([[x+7,y+11],[x+12,y+9],[x+10,y+12]],'#899383');
  c.restore();
  // Woven scarf: a short collar, one folded tail, no chest-wide red panel.
  fill([[x-13,y+12],[x+8,y+17],[cx+11,cy+5],[cx-2,cy+1],[x-11,y+21]],'#9f3a43');
  fill([[x-11,y+14],[x-31,y+9],[x-49,y-5],[x-64,y-1],[x-78,y-9],[x-63,y-7],[x-50,y-13],[x-28,y+1]],'#a9414b');
  fill([[x-49,y-5],[x-64,y-1],[x-78,y-9],[x-61,y-5],[x-50,y-13]],'#752f3e');
  // Front shoulder cap overlaps the upper arm, with a small exposed forearm.
  segment(shoulders[1],elbows[1],5.8,4.5,'#3b414d','#69747b');segment(elbows[1],hands[1],3.8,3.1,'#c5c6b5','#8d9999');
  const sh=shoulders[1];fill([[sh[0]-8,sh[1]-7],[sh[0]+5,sh[1]-8],[sh[0]+10,sh[1]+2],[sh[0]+5,sh[1]+10],[sh[0]-4,sh[1]+6]],'#505965');fill([[sh[0]-8,sh[1]-7],[sh[0]+5,sh[1]-8],[sh[0]+10,sh[1]+2],[sh[0]-1,sh[1]]],'#74808a');
  fill([[hx-13,hy-3],[hx+13,hy-5],[hx+15,hy+1],[hx-12,hy+4]],'#818c89');
  fill([[hx-5,hy+3],[hx+7,hy+1],[hx+10,hy+18],[hx-4,hy+17],[hx-12,hy+8]],'#303744');
  const angle=acting?sampled.angle:.48;if(!e.dead)sword(hands[1],angle,84);
  fill([[hands[1][0]-4,hands[1][1]-3],[hands[1][0]+3,hands[1][1]-4],[hands[1][0]+5,hands[1][1]+2],[hands[1][0]-1,hands[1][1]+5]],skin);
 }
 function humanoid(c,e,k,p,t,d){
  if(k==='twin_blade'){dualBladeModel(c,e,t);return;}if(HumanArt.kinds.has(k)){HumanArt.draw(c,e,k,t);return;}if(MutantArt.kinds.has(k)){MutantArt.draw(c,e,k,t);return;}
  const r=rigs[k],q=pose(e,t),s=e.bossState||{},broken=k==='champion'&&s.revived,skin=broken?'#877180':k==='sacrifice'?'#a05f50':k==='giant_zombie'?'#88957b':k==='plague'?'#8c996b':'#baa997',metal=p[1],cloth=['hunter','general','flame_blade','twin_blade'].includes(k)?'#843c40':p[0];
  const sk=humanoidRig(e,k,t),hip=sk.hip,chest=sk.chest,head=sk.head,w=Math.min(r.w,r.flesh?26:24);
  const [back,h]=sk.hands,[rear,shoulder]=sk.shoulders;
  const clothPoly=pts=>plate(c,pts,cloth,p[1]);
  limb(c,[chest[0]+5,chest[1]-4],[head[0]-3,head[1]+19],[head[0],head[1]+7],13,r.flesh||broken?skin:p[0],r.flesh?'#c4b49a':metal);
  // Back layers are attached to the torso and cannot cover foreground hands.
  if(['hunter','general','reaper','champion','war_hammer','explorer'].includes(k)){const x=chest[0]-w;clothPoly([[x,-103],[x-20,-86],[x-30-q.gait*4,-18],[x-12,-32],[x-10,-13],[x+13,-51]]);}
  if(k==='explorer'){plate(c,[[-52,-144],[-27,-151],[-20,-74],[-57,-72]],'#655140','#b49c79');poly(c,[[-48,-134],[-30,-139],[-27,-85],[-48,-84]],'#1a2226',null);shard(c,-37,-91,39,-.1,'#e481b7');line(c,[[-59,-74],[-20,-77]],'#ab9072',6);}
  if(k==='sacrifice'){line(c,[[-30,-39],[-26,-147],[15,-155],[41,-70]],'#594134',9);line(c,[[-44,-135],[33,-145]],'#917257',8);for(let i=0;i<9;i++)flame(c,-35+i*8,-91-i%3*13,23+i%3*12,t+i,i%2?'#fa7536':'#ffc467');}
  if(k==='plague')for(let i=0;i<8;i++){const x=chest[0]-21+Math.sin(i*3)*19,y=chest[1]-8+i*7;oval(c,x,y,10+i%3*3,12,'#658b42');oval(c,x-3,y-4,4,4,'#b8dc72');}
  if(k==='crystal_claw'&&s.armor!==false)for(let i=0;i<9;i++)shard(c,chest[0]-27+i*6,chest[1]-9,26+i%3*14,(i-4)*.16,'#68b9e5');
  for(let i=0;i<2;i++){const foot=sk.feet[i],knee=sk.knees[i];
   limb(c,hip,knee,foot,r.armor&&!broken?13:r.flesh?12:8,r.armor&&!broken?p[0]:skin,r.armor&&!broken?metal:'#d6ccb2');
   poly(c,[[foot[0]-5,foot[1]-4],[foot[0]+4,foot[1]-5],[foot[0]+11,foot[1]-1],[foot[0]+9,foot[1]+2],[foot[0]-6,foot[1]+2]],r.armor&&!broken?metal:'#c8c5af',null);
  }
  if(r.robe){clothPoly([[chest[0]-w-2,chest[1]-9],[chest[0]+w,chest[1]-6],[hip[0]+34,-13],[hip[0]+18,-3],[hip[0]+4,-17],[hip[0]-20,-4],[hip[0]-36,-12]]);for(let i=0;i<3;i++)line(c,[[chest[0]-13+i*12,chest[1]],[hip[0]-20+i*22,-16]],k==='archmage'?'#c7aa70':'#78657f',2);}
  else{plate(c,[[chest[0]-w,chest[1]-9],[chest[0]+w,chest[1]-8],[chest[0]+w+3,chest[1]+13],[hip[0]+17,hip[1]],[hip[0]-17,hip[1]],[chest[0]-w-4,chest[1]+13]],r.flesh||broken?skin:p[0],r.flesh||broken?'#d0b9a0':metal);
   if(r.armor&&!broken){plate(c,[[chest[0]-w+5,chest[1]-5],[chest[0]+w-4,chest[1]-7],[hip[0]+13,hip[1]-5],[hip[0]-11,hip[1]-2]],metal,p[2]);line(c,[[chest[0]+4,chest[1]-6],[hip[0]+3,hip[1]-8]],p[2],3);}
   else if(r.flesh||broken){for(let i=0;i<3;i++){const x=chest[0]-12+i*9,y=chest[1]+6+i*10;line(c,[[x-9,y-3],[x+10,y+8]],'#8a4b4b',3);for(let j=0;j<3;j++)line(c,[[x-5+j*5,y-5+j*2],[x-8+j*5,y+3+j*2]],'#baa192',2);}}
   else{poly(c,[[chest[0]-w,chest[1]-10],[chest[0],chest[1]+10],[hip[0]-8,hip[1]],[chest[0]-w-7,hip[1]+11]],cloth,null);line(c,[[chest[0]+w-5,chest[1]-8],[hip[0]-8,hip[1]+1]],'#c0b59c',5);}
  }
  line(c,[[hip[0]-18,hip[1]],[hip[0]+20,hip[1]-2]],'#5d5046',7);poly(c,[[hip[0]-7,hip[1]+2],[hip[0]+11,hip[1]],[hip[0]+15,-16],[hip[0]+4,-22],[hip[0]-5,-14]],cloth,null);
  if(k==='butcher')poly(c,[[chest[0]-20,chest[1]-7],[chest[0]+21,chest[1]-5],[hip[0]+25,-15],[hip[0]+6,-23],[hip[0]-18,-15]],'#843f3f',null);
  // Angular faces and deep cowls replace the shared round head.
  poly(c,[[head[0]-10,head[1]-14],[head[0]+12,head[1]-15],[head[0]+17,head[1]+5],[head[0]+6,head[1]+13],[head[0]-9,head[1]+4]],skin,null);
  if(r.armor&&!broken&&k!=='crystal_claw'){plate(c,[[head[0]-13,head[1]-18],[head[0]+9,head[1]-21],[head[0]+18,head[1]-12],[head[0]+15,head[1]+12],[head[0]-8,head[1]+10]],metal,p[2]);for(let i=0;i<3;i++)line(c,[[head[0]+i*5,head[1]-3],[head[0]-2+i*5,head[1]+8]],'#19272c',3);}
  else if(r.hood||k==='archmage'||k==='marked_priest'){const hood=k==='hunter'?'#82513e':k==='marked_priest'?'#72415f':'#302d3c';poly(c,[[head[0]-17,head[1]+8],[head[0]-21,head[1]-13],[head[0]-3,head[1]-35],[head[0]+20,head[1]-13],[head[0]+13,head[1]-9],[head[0]-5,head[1]-15]],hood,null);if(k==='reaper'){poly(c,[[head[0]-8,head[1]-11],[head[0]+13,head[1]-8],[head[0]+10,head[1]+7],[head[0]-7,head[1]+4]],'#121221',null);for(const x of [-2,8])poly(c,[[head[0]+x-4,head[1]-3],[head[0]+x+4,head[1]-5],[head[0]+x,head[1]+2]],'#cf82ee',null);}}
  if(['sacrifice','butcher','mutant_blade','crystal_claw','plague','archmage','marked_priest','explorer','twin_blade'].includes(k)){poly(c,[[head[0]-9,head[1]-14],[head[0]+11,head[1]-13],[head[0]+16,head[1]+4],[head[0]+6,head[1]+12],[head[0]-7,head[1]+6]],'#ddd9bf',null);oval(c,head[0]+8,head[1]-1,k==='mutant_blade'||k==='crystal_claw'?6:4,6,'#122029');}
  else if(k!=='reaper'&&(!r.armor||broken))line(c,[[head[0]+5,head[1]-2],[head[0]+14,head[1]-3]],broken?'#ef8fdd':'#19292c',3);
  if(k==='archmage'||k==='marked_priest'){poly(c,[[head[0]-17,head[1]-16],[head[0]-13,head[1]-59],[head[0]+5,head[1]-44],[head[0]+17,head[1]-15]],k==='archmage'?'#6a4d82':'#853e70',null);poly(c,[[head[0]-32,head[1]-14],[head[0]+28,head[1]-19],[head[0]+39,head[1]-11],[head[0]-34,head[1]-5]],'#76608c',null);}
  if(k==='general'){poly(c,[[head[0]-17,head[1]-13],[head[0]-23,head[1]-27],[head[0]+24,head[1]-27],[head[0]+16,head[1]-13]],'#78373c',null);line(c,[[head[0]-12,head[1]-13],[head[0]+26,head[1]-11]],'#d5b574',4);}
  if(k==='explorer'){poly(c,[[head[0]-16,head[1]-14],[head[0]-10,head[1]-31],[head[0]+10,head[1]-33],[head[0]+19,head[1]-14]],'#8a6b48',null);line(c,[[head[0]-29,head[1]-12],[head[0]+31,head[1]-11]],'#a98b60',5);}
  if(['twin_blade','flame_blade','general','hunter'].includes(k))poly(c,[[head[0]-12,head[1]+10],[head[0]+5,head[1]+13],[head[0]-6,head[1]+24],[head[0]-29,head[1]+17],[head[0]-57,head[1]+5],[head[0]-64,head[1]+10],[head[0]-72,head[1]-1],[head[0]-46,head[1]+3]],cloth,null);
  // Jointed upper arms and forearms carry the actual weapon anchors.
  limb(c,rear,sk.elbows[0],back,r.flesh?17:r.armor?15:9,r.flesh||broken?skin:p[0],r.flesh?'#c8b298':metal);
  limb(c,shoulder,sk.elbows[1],h,r.flesh?20:r.armor?17:10,r.flesh||broken?skin:p[0],r.flesh?'#d0baa1':metal);
  if(r.armor){for(const [i,j] of [rear,shoulder].entries()){if(broken&&i===1)continue;plate(c,[[j[0]-14,j[1]-12],[j[0]+9,j[1]-16],[j[0]+19,j[1]+4],[j[0]+1,j[1]+10],[j[0]-16,j[1]+3]],p[1],p[2]);}}
  if(k==='general')for(let i=0;i<5;i++)line(c,[[rear[0]-10+i*4,rear[1]-6],[rear[0]-10+i*4,rear[1]+5]],'#d9b564',3);
  if(k==='hunter')for(let i=0;i<3;i++){line(c,[[-24+i*6,-76],[-39+i*6,-141]],'#b8ad90',2);poly(c,[[-39+i*6,-139],[-44+i*6,-147],[-36+i*6,-145]],'#e2d8bc',null);}
  if(k==='mutant_blade'){for(let i=0;i<(s.arms||2);i++){const sign=i%2?1:-1,hh=i<2?(i?h:back):[sign*48,-42];if(i>=2)limb(c,[chest[0]+sign*17,-66],[sign*34,-56],hh,10,skin,'#c6b89b');weapon(c,'armBlade',hh,sign*(.85+q.swing*1.7),p,t,e);}for(let i=0;i<4;i++)shard(c,chest[0]-25+i*10,chest[1]-9,24+i%2*10,-.7,'#ddd4b7');}
  else if(['sacrifice','plague','crystal_claw'].includes(k)){claws(c,h,3,k==='crystal_claw'?46:32,k==='crystal_claw'?'#99d9f3':'#d8d0b6');claws(c,back,3,30,k==='crystal_claw'?'#73bce7':'#d8d0b6');if(k==='crystal_claw'&&s.armor!==false)for(const hand of [h,back])for(let i=0;i<4;i++)shard(c,hand[0]-8+i*6,hand[1]+5,24+i%2*13,(i-2)*.35,'#87ccee');}
  const main={iron_guard:'sword',hunter:'axe',twin_blade:'sabre',flame_blade:'flameSword',war_hammer:'hammer',butcher:e.attack?.weapon==='hook'?'hook':'cleaver',archmage:'archStaff',general:e.attack?.ranged?'musket':'sabre',reaper:'scythe',giant_zombie:'trunk',explorer:'reliquary',champion:'greatsword',marked_priest:'staff',dying:e.enraged&&!s.swordOut?'chestSword':null};
  const idleAngle={hunter:2.5,butcher:2.6,champion:1.35,explorer:0,war_hammer:.7,archmage:.2,reaper:.05,general:-.8},acting=['windup','active','recovery'].includes(e.state)&&e.attack,angle=acting?(e.attack.pose==='dualThrust'?Math.PI/2:sk.angle):(idleAngle[k]??.4);
  if(main[k])weapon(c,main[k],h,k==='hunter'&&(e.attack?.weapon==='crossbow'||e.attack?.ranged)?2.5:angle,p,t,e);for(const hand of [h,back])poly(c,[[hand[0]-4,hand[1]-4],[hand[0]+4,hand[1]-5],[hand[0]+6,hand[1]+3],[hand[0]-2,hand[1]+5]],r.armor&&!broken?metal:skin,null);
  if(k==='iron_guard')weapon(c,'shield',back,-.1,p,t,e);if(k==='hunter')weapon(c,'crossbow',back,e.attack?.weapon==='crossbow'?sk.backAngle:e.attack?.ranged?sk.angle:1.1,p,t,e);if(k==='twin_blade')weapon(c,'sabre',back,e.attack?.pose==='dualThrust'?Math.PI/2:sk.backAngle,p,t,e);if(k==='butcher')weapon(c,'hook',back,1.3-q.swing,p,t,e);if(k==='general')weapon(c,e.attack?.ranged?'sabre':'musket',back,-.5,p,t,e);
  if(k==='dying'&&!e.enraged)weapon(c,'chestSword',[chest[0]+13,chest[1]-7],-2.4,p,t,e);
  if(k==='reaper'){for(let i=0;i<5;i++)poly(c,[[chest[0]-w-3,chest[1]+i*9],[chest[0]-w-33-i%2*8,-37+i*6],[chest[0]-w-13,-41+i*9]],i%2?'#4e405b':'#302b3a',null);}
 }
 // Palm-local forward kinematics: MCP/PIP/DIP joints on each finger, two on the thumb.
 const ghostHandKey=(curls,spread,thumb,angle=0,lift=0,distal=1)=>({
  fingers:curls.map((curl,i)=>[(i-1.5)*spread,curl*.62,curl*1.14,curl*distal]),
  thumb:[thumb*.65,thumb*1.2],angle,lift
 });
 const ghostHandMoves=[
  {wind:ghostHandKey([.02,.04,.03,.06],.30,.05,-.30,-14),hit:ghostHandKey([1,1.1,1.08,.95],.025,1.2,.25,6),end:ghostHandKey([.7,.85,.8,.65],.09,.85,.40,2)},
  {wind:ghostHandKey([1.05,1.12,1.1,1],.02,1.2,-1,-28),hit:ghostHandKey([.02,.01,.03,.06],.12,.05,-Math.PI,10),end:ghostHandKey([.25,.32,.4,.48],.17,.3,-Math.PI+.28,5)},
  {wind:ghostHandKey([.02,.04,1.08,1.18],.23,.85,.90,-6),hit:ghostHandKey([.03,.03,.06,.09],.015,.12,Math.PI/2,0),end:ghostHandKey([.12,.15,.42,.52],.08,.4,1.2,2)},
  {wind:ghostHandKey([.38,.45,.58,.7],.32,.3,-.75,-18,.75),hit:ghostHandKey([.85,1,1.15,1.25],.20,.95,1.05,8,1.2),end:ghostHandKey([.5,.65,.85,1],.25,.65,1.25,3)}
 ];
 function ghostHandRig(f={},t=0){
  const mode=((f.handMode||0)%4+4)%4,phase=f.phase||'seek',move=ghostHandMoves[mode];
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,q)=>({fingers:a.fingers.map((v,i)=>v.map((n,j)=>n+(b.fingers[i][j]-n)*q)),thumb:a.thumb.map((n,i)=>n+(b.thumb[i]-n)*q),angle:a.angle+(b.angle-a.angle)*q,lift:a.lift+(b.lift-a.lift)*q});
  const breath=Math.sin(t*2.4)*.025,rest=ghostHandKey([.18+breath,.22+breath,.27+breath,.34+breath],.14,.28);
  const duration=PRIEST_HAND_TIMING[phase],progress=duration?clamp(1-(f.timer??duration)/duration):0;
  let pose=rest;
  if(f.stunned)pose=ghostHandKey([.6,.7,.8,.9],.09,.75,.55,7);
  else if(phase==='windup')pose=mix(rest,move.wind,smooth(progress));
  else if(phase==='strike')pose=mix(move.wind,move.hit,smooth(progress/.65));
  else if(phase==='recovery')pose=progress<.35?mix(move.hit,move.end,smooth(progress/.35)):mix(move.end,rest,smooth((progress-.35)/.65));
  const roots=[[-11,-5],[-3,-10],[6,-9],[14,-4]],lengths=[[14,10,8],[17,12,9],[15,11,8],[11,9,7]];
  const fingers=pose.fingers.map((angles,i)=>{
   const points=[roots[i]],base=-Math.PI/2+angles[0];let angle=base;
   for(let j=0;j<3;j++){angle+=angles[j+1];const from=points[j];points.push([from[0]+Math.cos(angle)*lengths[i][j],from[1]+Math.sin(angle)*lengths[i][j]]);}
   return {points,angles:angles.slice(1),lengths:lengths[i]};
  });
  let angle=-2.65+pose.thumb[0];const thumbPoints=[[-12,9]];
  for(let j=0;j<2;j++){if(j)angle+=pose.thumb[1];const from=thumbPoints[j],length=j?10:13;thumbPoints.push([from[0]+Math.cos(angle)*length,from[1]+Math.sin(angle)*length]);}
  return {fingers,thumb:{points:thumbPoints,angles:pose.thumb,lengths:[13,10]},angle:pose.angle,lift:pose.lift,mode,phase,stunned:!!f.stunned};
 }
 function ghostHand(c,x,y,t,size=1,f={}){
  const r=ghostHandRig(f,t),skin=r.stunned?'#8c76a0':'#b393c3',edge=r.stunned?'#594567':'#725585',joint=r.stunned?'#a08bad':'#e0c7ef';
  c.save();c.translate(x,y+r.lift*size);c.rotate(r.angle);c.scale(size,size);
  glow(c,0,-8,39,r.stunned?'#70598d33':'#926ecf40');
  // The silhouette ends at the palm heel; no wrist, wrist ring or forearm.
  poly(c,[[-15,-7],[-7,-16],[12,-11],[20,6],[14,20],[1,25],[-12,16]],r.stunned?'#665579cc':'#7e6497dd','#c1a2dd',1.1);
  for(const finger of [...r.fingers,r.thumb]){
   const pts=finger.points;
   for(let j=0;j<pts.length-1;j++){const width=(pts.length===3?6.5:6)-j*1.15;line(c,[pts[j],pts[j+1]],edge,width+1.8);line(c,[pts[j],pts[j+1]],skin,width);}
   for(let j=1;j<pts.length-1;j++){oval(c,...pts[j],j===1?3:2.4,j===1?3:2.4,edge);oval(c,...pts[j],j===1?1.9:1.4,j===1?1.9:1.4,joint);}
   const tip=pts.at(-1),last=pts.at(-2);line(c,[[last[0]*.25+tip[0]*.75,last[1]*.25+tip[1]*.75],tip],joint,1.7);
  }
  line(c,[[-6,5],[0,1],[9,5]],'#d5b5e066',1.2);line(c,[[-6,12],[3,15],[10,11]],'#d5b5e066',1.2);
  c.restore();return r;
 }
 function ghostHandWarning(c,x,y,r,size,shared){
  // Keep the glint on the palm, using the same lift, rotation and scale as the hand.
  const wx=x+size*(2*Math.cos(r.angle)-5*Math.sin(r.angle)),wy=y+size*(r.lift+2*Math.sin(r.angle)+5*Math.cos(r.angle));
  if(shared.warning)shared.warning(wx,wy,1,.85);
  else glow(c,wx,wy,24,'#ff573a77');
 }
 function tentacle(c,x,y,length,t,col,width=10){const pts=[];for(let i=0;i<9;i++)pts.push([x+i*length/8,y+Math.sin(i*.7+t)*15+i*4]);line(c,pts,'#11131e',width+3);line(c,pts,col,width);for(let i=1;i<8;i++)oval(c,pts[i][0],pts[i][1]+3,2,2,'#aaa2a2');}
 function beast(c,e,k,p,t){const q=pose(e,t),s=e.bossState||{},g=q.gait,large=k==='behemoth',w=large?92:k==='chewer'?66:57;
  if(k==='fortress'){for(const sign of [-1,1])for(const back of [true,false]){const x=sign*(back?37:56),z=back?-1:1;if(!s.brokenLegs){limb(c,[x*.6,-58],[x+z*g*9,-31],[x+sign*25,0],16,p[0],p[1]);plate(c,[[x-8,-38],[x+12,-38],[x+sign*27,-4],[x+sign*12,-1]],'#47525d',p[2]);}else poly(c,[[x-12,-12],[x+19,-6],[x+8,3]],p[1]);}plate(c,[[-45,-121],[40,-121],[57,-64],[31,-24],[-40,-24],[-58,-66]],'#414e59',p[1]);for(let i=0;i<5;i++)line(c,[[-40,-103+i*15],[40,-103+i*15]],'#17232f',3);poly(c,[[-21,-125],[-14,-153],[17,-153],[28,-129],[16,-116],[-13,-116]],'#7c8791');line(c,[[-8,-134],[16,-134]],'#d1bc8c',3);oval(c,6,-77,19,18,'#171c27');ring(c,6,-77,20,19,p[2],4);oval(c,6,-77,8,8,'#d17149');for(const sign of [-1,1])limb(c,[sign*42,-106],[sign*(62+q.swing*15),-71],[sign*(64+q.swing*32),-45-q.wind*28],18,p[0],p[1]);return;}
  if(k==='hell_hound'||k==='claw_beast'||large||k==='chewer'){if(k==='hell_hound')for(let i=0;i<9;i++)shard(c,-56+i*12,-84,22+i%3*12,-.4,'#d475b7');for(let i=0;i<(large?6:4);i++){const x=-w+20+i*(w*1.5/(large?5:3)),back=i%2?1:-1;limb(c,[x,-49],[x+back*18+g*6,-22],[x+back*25+g*12,0],large?12:11,p[0],p[1]);claws(c,[x+back*25+g*12,0],3,15);}
   plate(c,[[-w,-61],[-w+17,-88],[-28,-100],[31,-91],[w,-67],[w-12,-38],[-26,-28],[-w+5,-39]],p[0],p[1]);for(let i=0;i<5;i++)plate(c,[[-w+i*30,-66],[-w+7+i*30,-94],[-w+30+i*30,-99],[-w+39+i*30,-68]],i%2?p[0]:p[1],p[2]);tentacle(c,-w,-55,-(large?87:50),t,p[1],large?16:9);
   if(large){const jaw=8+q.swing*20;plate(c,[[48,-103],[91,-107],[129,-84],[119,-65],[64,-62]],'#49384f','#ab83be');poly(c,[[64,-65],[119,-65],[107,-29+jaw],[59,-45+jaw]],'#230d29');plate(c,[[57,-42+jaw],[108,-27+jaw],[94,-14+jaw],[49,-26+jaw]],'#59425e','#ae8dba');for(let i=0;i<7;i++){poly(c,[[65+i*8,-69],[72+i*8,-67],[69+i*8,-45]],'#ebd3cf');poly(c,[[59+i*7,-32+jaw],[65+i*7,-30+jaw],[63+i*7,-48+jaw]],'#d9b9c8');}for(let i=0;i<5;i++)oval(c,64+i*11,-87+Math.sin(i)*5,3.5,4,'#ef78ef');for(let i=0;i<9;i++){shard(c,-w+18+i*20,-88,40+i%3*13,-.3,'#b06bd4');oval(c,-65+i*19,-57,6,10,'#100f1f');oval(c,-65+i*19,-58,2,5,'#b585c0');}if(e.attack?.pose==='whip')for(let i=0;i<3;i++)tentacle(c,w-5,-65+i*13,75+q.swing*40,t+i,p[1],10);}
   else if(k==='hell_hound'){for(let i=0;i<3;i++){const x=36+i*16,y=-66+(i-1)*19;limb(c,[15,-64],[33,-66+i*6],[x,y],17,p[0],p[1]);poly(c,[[x-8,y-20],[x+17,y-16],[x+36,y],[x+24,y+15],[x-12,y+10]],p[0],p[1]);poly(c,[[x-6,y-15],[x-12,y-35],[x+8,y-17]],p[1]);line(c,[[x+10,y-6],[x+20,y-3]],s.yellowRage>s.clock?'#ffd55c':'#e9855e',3);line(c,[[x+15,y+8],[x+32,y+4]],'#12151c',3);for(let j=0;j<3;j++)poly(c,[[x+17+j*4,y+5],[x+21+j*4,y+5],[x+19+j*4,y+12]],'#d3b99c');}if(s.yellowRage>s.clock)glow(c,35,-65,70,'#ffdc5630');}
   else{const x=w-6;oval(c,x,-61,24,25,p[1]);poly(c,[[x,-75],[x+40,-65],[x+38,-39],[x+2,-37]],p[0]);line(c,[[x+10,-57],[x+37,-52]],'#17141f',9);for(let i=0;i<5;i++)poly(c,[[x+8+i*6,-60],[x+12+i*6,-60],[x+11+i*6,-50]],'#c4b8a4');oval(c,x+16,-72,3,3,p[2]);if(k==='chewer'){poly(c,[[x-13,-90],[x+44,-80],[x+58,-55],[x+41,3],[x-11,-9],[x-25,-49]],'#29152b');for(let i=0;i<6;i++){poly(c,[[x-9+i*9,-82],[x-2+i*9,-79],[x+i*9,-59]],'#e4ceb5');poly(c,[[x-5+i*8,-5],[x+3+i*8,-6],[x+i*8,-27]],'#c7ab96');}for(let i=0;i<4;i++){oval(c,-50+i*24,-91,11,14,p[1]);oval(c,-50+i*24,-97,7,7,'#151827');}if(e.attack?.action==='tongue'||s.tongueTarget)tentacle(c,x+30,-53,90+q.swing*100,t,'#b47888',10);}else for(const sign of [-1,1]){limb(c,[35,-54],[57,-28],[75+q.swing*28,sign*6-9],14,p[0],p[1]);claws(c,[75+q.swing*28,sign*6-9],3,39);}}
  }
 }
 function creature(c,e,k,p,t){if(MutantArt.kinds.has(k)){MutantArt.draw(c,e,k,t);return;}const q=pose(e,t),s=e.bossState||{};
  if(['fortress','hell_hound','claw_beast','behemoth','chewer'].includes(k)){beast(c,e,k,p,t);return;}
  if(k==='impaler'){for(let i=0;i<4;i++){const sign=i%2?1:-1;limb(c,[i<2?-27:25,-44],[sign*54,-28+q.gait*5],[sign*70,0],10,'#655d61',p[1]);claws(c,[sign*70,0],3,15);}plate(c,[[-58,-46],[-44,-78],[-13,-87],[25,-71],[42,-43],[8,-29],[-40,-30]],'#a18a82','#d6baa5');for(let i=0;i<(s.spines??8);i++)shard(c,-49+i*11,-63-Math.sin(i/7*Math.PI)*16,43+i%3*14,-.6+i*.1,'#beb7a3');oval(c,45,-42,22,17,'#8c817b');line(c,[[48,-35],[67,-33]],'#27222a',5);oval(c,58,-47,3,3,'#eec483');return;}
  if(k==='moth'){moth(c,t,p);return;}
  if(k==='bladder'){const pulse=1+Math.sin(t*2)*.035;c.save();c.translate(0,-75);c.scale(pulse,pulse);plate(c,[[-58,22],[-60,-20],[-37,-59],[1,-72],[36,-52],[58,-11],[53,39],[13,59],[-33,53]],'#687153','#a5ba76');for(let i=0;i<7;i++)oval(c,Math.sin(i*2.4)*34,Math.cos(i*2.4)*41,13,20,i%2?'#a4ce65':'#454f45');for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*45;line(c,[[x,-45],[x*.7,-10],[x*1.1,30]],'#303c3b',1.4);}for(let i=0;i<7;i++){const x=(i-3)*13;line(c,[[x,39],[x+Math.sin(t+i)*7,64],[x+Math.sin(t+i)*13,91],[x+Math.sin(t+i)*18,113-i%3*6]],'#abc879',3.5);}oval(c,8,5,17,21,'#273837');oval(c,10,6,7,9,'#b1bb74');c.restore();return;}
  if(k==='spider_queen'){for(const sign of [-1,1])for(let i=0;i<4;i++){const y=-67+i*12,x=sign*(60+i*8),lift=Math.sin(t*5+i)*4;limb(c,[sign*22,y],[x,y-20+lift],[x+sign*21,3-i*4],8,'#4a3a4d','#96818e');shard(c,x,y-16,15,sign*.6,'#9a8091');}oval(c,-17,-64,51,36,'#393047');for(let i=0;i<5;i++)ring(c,-30+i*10,-69,11,26,'#756577',2);oval(c,22,-66,28,25,'#635164');poly(c,[[7,-90],[14,-117],[24,-101],[34,-119],[43,-88]],'#99816c');for(let i=0;i<6;i++)oval(c,18+i%3*10,-80+Math.floor(i/3)*11,3,4,'#edb16f');claws(c,[34,-54],2,30,'#bdaabc');oval(c,-28,-66,12,10,'#92728a');return;}
  if(k==='great_bell'){for(const sign of [-1,1])for(let i=0;i<10;i++)ring(c,sign*(18+i*7),-141+i*14,5,8,'#6b514a',3);poly(c,[[-8,-155],[-16,-141],[16,-141],[8,-155]],'#aba18b');ring(c,0,-145,11,10,'#a9997a',4);poly(c,[[-28,-127],[-44,-109],[-44,-66],[-67,-43],[67,-43],[44,-66],[44,-109],[28,-127]],'#786c62','#292738',3);poly(c,[[-23,-119],[-34,-104],[-32,-64],[-43,-50],[43,-50],[32,-64],[34,-104],[23,-119]],'#938778','#b3a491',1);for(let i=-1;i<2;i++)line(c,[[i*22,-114],[i*27,-57]],'#393548',3);ring(c,0,-44,67,14,'#b5a386',6);oval(c,0,-44,53,8,'#272336');line(c,[[0,-94],[0,-31]],'#a09484',7);oval(c,0,-30,10,13,'#b3a58d');for(let i=0;i<4;i++)poly(c,[[-22+i*15,-89],[-16+i*15,-100],[-10+i*15,-89],[-16+i*15,-77]],'#41384e');return;}
  if(k==='resentment'){for(const sign of [-1,1])for(let i=0;i<3;i++){const h=[sign*(60+i*12+q.swing*25),-113+i*43];limb(c,[sign*25,-86+i*18],[sign*(42+i*17),-128+i*42],h,7,'#9680a7','#c9a9d8');claws(c,h,3,17,'#ac91bf');}glow(c,0,-60,90,'#8475a429');for(let i=0;i<10;i++){const x=Math.sin(i*2.39)*37,y=-35-Math.floor(i/3)*22;plate(c,[[x-19,y-9],[x-7,y-21],[x+17,y-13],[x+23,y+9],[x+2,y+18],[x-17,y+8]],i%2?'#756183':'#9b849e','#bca4c1');poly(c,[[x-5,y-5],[x+3,y-9],[x+9,y],[x+2,y+8],[x-5,y+4]],'#36203f',null);oval(c,x+2,y,2.5,3,'#dc8fe7');}for(let i=0;i<5;i++)tentacle(c,(i-2)*18,-28,Math.sin(i*4+t)*40,t+i,'#6a567780',7);for(const sign of [-1,1])limb(c,[sign*37,-68],[sign*62,-55],[sign*(83+q.swing*23),-63],9,'#8f8294','#aa94b8');line(c,[[-24,-106],[-9,-77],[-25,-66],[12,-36]],'#bd7bdf',2);return;}
  if(k==='demon_jelly'){for(let i=0;i<10;i++){const x=(i-4.5)*11,tip=[x+Math.sin(t+i*2)*30,5-i%3*7];line(c,[[x,-68],[x+Math.sin(t+i)*13,-44],[x+Math.sin(t+i)*24,-25],tip],'#9e87d8',5);if(i%3===0)shard(c,tip[0],tip[1]+8,16,.2,'#c196f6');}poly(c,[[-60,-69],[-55,-115],[-30,-145],[6,-150],[43,-129],[61,-93],[56,-70],[31,-62],[0,-67],[-31,-60]],'#4e3b67',p[1],2);for(let i=-2;i<3;i++)line(c,[[i*12,-136],[i*23,-102],[i*25,-72]],'#a37dc6',2);oval(c,0,-96,18,21,'#241f39');oval(c,0,-97,13,17,'#c79aff');poly(c,[[0,-115],[4,-98],[0,-78],[-4,-98]],'#251331');if(s.spiked)for(let i=0;i<11;i++)shard(c,Math.sin(i/10*Math.PI-Math.PI/2)*58,-89-Math.sin(i/10*Math.PI)*45,23,(i-5)*.25,'#bd9dd2');return;}
  if(k==='nightmare'){for(let i=0;i<6;i++)shard(c,Math.sin(i*4+t*.4)*56,-35-i*22,13,Math.sin(t+i)*.3,'#b17bce');glow(c,0,-70,66,'#7362a928');poly(c,[[-10,-138],[-31,-115],[-31,-76],[-17,-41],[-30,-18],[-8,-26],[9,-18],[31,-34],[16,-71],[30,-104],[12,-130]],'#312d48','#716588',1);for(let i=0;i<6;i++){const x=-24+i*9;poly(c,[[x-7,-57],[x+8,-53],[x+Math.sin(t+i)*20,1-i%3*7],[x-6,-22]],i%2?'#654075':'#403047',null);}oval(c,0,-113,12,17,'#171527');line(c,[[2,-117],[14,-115]],'#cf9ced',3);for(const sign of [-1,1]){const h=[sign*(58+q.swing*25),-64-q.wind*25];limb(c,[sign*15,-98],[sign*42,-81],h,7,'#534464','#a291b3');claws(c,h,3,33,'#c4b5d5');}return;}
  if(k==='profane_obelisk'){for(let i=0;i<6;i++){const a=t*.7+i*TAU/6,x=Math.cos(a)*75,y=-70+Math.sin(a)*25;plate(c,[[x-9,y-9],[x+7,y-15],[x+17,y+7],[x-5,y+13]],'#70667c','#aa94b4');}poly(c,[[-25,-137],[0,-166],[26,-138],[26,-42],[0,-16],[-25,-41]],'#70557d','#c790df',1);shard(c,0,-166,30,0,'#e4adfa');oval(c,0,-90,13,22,'#dc9cf2');poly(c,[[0,-111],[4,-91],[0,-69],[-4,-91]],'#2e173c',null);poly(c,[[0,-166],[26,-138],[26,-42],[0,-16]],'#292537');for(let i=0;i<5;i++){const y=-130+i*21;line(c,[[-13,y],[0,y-6],[12,y+2],[0,y+9],[0,y+16]],'#b389d1',2);}glow(c,0,-88,35,'#a275d52e');return;}
  if(k==='bottomless'){for(const sign of [-1,1])for(let i=0;i<3;i++){const hand=[sign*(69+i*12+q.swing*20),-116+i*43];limb(c,[sign*38,-90+i*23],[sign*(65+i*10),-135+i*45],hand,8,'#685075','#b896cb');claws(c,hand,3,19,'#b694c7');}for(let i=0;i<7;i++){const a=i*TAU/7;const x=Math.cos(a)*48,y=-63+Math.sin(a)*38;plate(c,[[x-20,y-8],[x-7,y-27],[x+13,y-22],[x+22,y+8],[x+4,y+26],[x-18,y+11]],i%2?'#68506f':'#453348','#98739d');oval(c,x,y-8,4,5,'#ed65bc');}for(let i=0;i<4;i++)tentacle(c,-35+i*23,-40,Math.sin(i+t)*43,t+i,'#6c597b',11);oval(c,0,-66,37,43,'#090b18');for(let i=0;i<4;i++){c.save();c.translate(0,-66);c.rotate(t*(i%2?1:-1)*.5+i);ring(c,0,0,37-i*6,43-i*6,['#b780d6','#805cb1','#4b397f','#382757'][i],2);c.restore();}for(let i=0;i<5;i++)oval(c,Math.cos(t*2+i*5)*25,-66+Math.sin(t*2+i*5)*30,2,2,'#bc91e0');return;}
 }
 function moth(c,t,p){const beat=Math.sin(t*7)*.15;for(const sign of [-1,1]){c.save();c.scale(sign*(.85+beat),1);poly(c,[[0,-74],[28,-122],[74,-148],[108,-129],[92,-85],[60,-60],[83,-29],[43,-12],[15,-36]],'#393345',p[1],1.5);poly(c,[[15,-73],[40,-112],[83,-128],[65,-86],[40,-71],[62,-32],[30,-39]],'#6a5978',null);for(let i=0;i<5;i++)line(c,[[10,-71],[40+i*9,-125+Math.sin(i)*10],[75+i*3,-111+beat*20]],'#9985a3',1);oval(c,57,-98,15,18,'#26263a');oval(c,57,-98,7,9,'#ad9e9d');oval(c,58,-99,3,6,'#413751');c.restore();}oval(c,0,-63,12,37,'#53505a');for(let i=0;i<6;i++)line(c,[[-9,-81+i*7],[10,-81+i*7]],'#292739',2);oval(c,0,-101,17,19,'#9b64bb');oval(c,0,-103,9,11,'#edb3ff');for(const sign of [-1,1])line(c,[[sign*6,-108],[sign*18,-125],[sign*25,-129]],'#c0adb2',2);}
 // One 0.8-second lifetime owns the corpse, detached props and all death particles.
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 function deathFrame(e,base){const time=Math.max(0,e.deathT||0),d=clamp(time/.8),style=e.bossDeath||base.deathStyle||'fall',delay=style==='impale'?.22:style==='bell'?.15:0,duration=style==='stagger'?.55:.34;
  let fall=smooth((time-delay)/duration);
  if(style==='defiant')fall=clamp(fall-Math.sin(clamp(time/.3)*Math.PI)*.18);
  return {time,d,style,alpha:1-d,fall,angle:1.52*fall+(style==='stagger'?Math.sin(time*32)*.16*(1-fall):style==='bell'?Math.sin(clamp(time/.15)*Math.PI)*.09*(1-fall):0)};
 }
 function fallTransform(c,f,k){
  // Low-bodied species fold their legs and settle onto their side, like regular beasts.
  if(['claw_beast','hell_hound','behemoth','chewer','spider_queen','impaler'].includes(k)){c.translate(0,14*f.fall);c.scale(1,1-.40*f.fall);c.rotate(.13*f.fall);}
  else{c.translate(-12*f.fall,-28*f.fall);c.rotate(f.angle);}
 }
 function deathBody(c,e,base,t,paint){const k=base.bossKind,f=deathFrame(e,base),{time,style,fall}=f;
  if(style==='collapse'){
   // Break the actual stone model into horizontal slabs, with the crown falling first.
   for(let i=0;i<8;i++){const top=-240+i*35,u=smooth((time-.015-i*.035)/.28),dy=Math.max(0,-top-30)*u;
    c.save();c.translate(Math.sin(i*4.1)*u*24,dy);c.translate(0,top+17);c.rotate(Math.sin(i*2.4)*u*.30);c.translate(0,-top-17);c.beginPath();c.rect(-350,top,700,35);c.clip();paint(e);c.restore();}
   return;
  }
  c.save();fallTransform(c,f,k);
  if(['ashes','voidFire','void','corrupt','defiant','dissolve'].includes(style)){
   const fire=style==='ashes'||style==='voidFire',q=clamp((time-(fire?.30:style==='defiant'?.10:.17))/(fire?.40:style==='defiant'?.60:.52));
   c.filter=style==='ashes'?'grayscale(1) brightness('+Math.max(.18,1-q)+')':style==='voidFire'||style==='void'?'saturate(.3) brightness('+Math.max(.12,1-q)+')':'saturate(.25) brightness('+Math.max(.2,1-q*.85)+')';
   if(style!=='defiant')c.globalAlpha*=1-q;
   // A receding ragged edge consumes the full body instead of leaving a solid silhouette.
   c.beginPath();c.moveTo(-350,-300);c.lineTo(350,-300);for(let i=14;i>=0;i--)c.lineTo(-350+i*50,35-q*250+Math.sin(i*5.1)*q*12);c.closePath();c.clip();
  }
  if(style==='moths'||style==='burst')c.globalAlpha*=1-smooth((time-.22)/.18);
  if(style==='swallow'){const q=smooth((time-.22)/.44);c.translate(0,-45*q);c.scale(Math.max(.001,1-q),Math.max(.001,1-q));}
  if(style==='stones'){
   for(let i=0;i<2;i++){c.save();c.translate(i?0:fall*8,i?0:-fall*10);c.rotate(i?0:-fall*.15);c.beginPath();c.rect(-350,i?-98:-300,700,i?400:202);c.clip();paint(e);c.restore();}
   line(c,[[-24,-100],[-7,-93],[4,-103],[26,-96]],'#21192c',2+fall*3);
  }else paint(e);
  if(style==='impale'&&time<.22){const chest=MutantArt.rig(e,k,t).chest,u=smooth(time/.22);MutantArt.embeddedSword(c,[chest[0]+(1-u)*160,chest[1]-(1-u)*75]);}
  if(style==='bell'&&time>.26){c.save();c.scale(AberrantArt.modelScale(k),AberrantArt.modelScale(k));line(c,[[-10,-120],[7,-102],[-4,-82],[12,-66],[2,-43]],'#272724',3);line(c,[[7,-102],[25,-109],[33,-97]],'#272724',2);c.restore();}
  c.restore();
 }
 function death(c,e,base,p,t){const k=base.bossKind,f=deathFrame(e,base),{time,d,style}=f;
  if(HumanArt.kinds.has(k))HumanArt.drops(c,e,k,t,d);
  if(MutantArt.kinds.has(k))MutantArt.drops(c,e,k,t,d);
  if(AbyssArt.kinds.has(k))AbyssArt.drops(c,e,k,t,d);
  if(k==='twin_blade')dualBladeDrops(c,e,t,d);
  if(style==='crystal')for(let i=0;i<16;i++){const q=clamp(time/.40),a=i*2.399,x=Math.cos(a)*(20+q*90),y=-80+Math.sin(a)*35+q*q*70;shard(c,x,Math.min(-5,y),15+i%4*8,a+q*3,i%3?'#86cef0':'#d8eafa');}
  if(['ashes','voidFire','corrupt','defiant','void','dissolve'].includes(style)){
   const fire=style==='ashes'||style==='voidFire',voidCol=style==='void'||style==='voidFire'||style==='dissolve';
   for(let i=0;i<16;i++){const q=clamp((time-.14)/.6),a=i*2.399,x=35+Math.sin(a)*(22+q*60)+i*4,y=-10-(i%4)*8-q*(16+i%5*8);
    if(fire&&time>.30)flame(c,x,y,22+8*Math.sin(i),time*3+i,style==='ashes'?'#e69144':'#a760eb');
    else if(time>.06)oval(c,x,y,2+q*3,2+q*4,voidCol?'#9270b7':'#45503a');
   }
  }
  if(style==='moths'&&time>.22)for(let i=0;i<38;i++){const q=clamp((time-.22)/.48),a=i*2.399,spread=.35+(i%7)/9,x=65+Math.cos(a)*q*160*spread+Math.sin(time*22+i)*q*4,y=-20+Math.sin(a*1.5)*q*85*spread-q*30,flap=1.8+Math.abs(Math.sin(time*22+i))*1.8;oval(c,x,y,3.8+i%3*.6,flap,i%2?'#756980':'#544b63');}
  if(style==='burst'&&time>=.30){const q=clamp((time-.30)/.4);ring(c,55,-20,15+q*95,8+q*30,'#98b777',3*(1-q)+.5);for(let i=0;i<12;i++){const a=i*2.399;poly(c,[[55+Math.cos(a)*q*100,-20+Math.sin(a)*q*45],[60+Math.cos(a)*q*100,-27+Math.sin(a)*q*45],[65+Math.cos(a)*q*100,-18+Math.sin(a)*q*45]],'#7f955c',null);}}
  if(style==='bell'&&time>.06&&time<.36){const q=clamp((time-.06)/.3);c.save();c.globalAlpha*=1-q;ring(c,0,-45,12+q*105,6+q*35,'#cfba91',2);c.restore();}
  if(style==='swallow'){const q=smooth((time-.12)/.60),r=Math.sin(q*Math.PI);oval(c,55,-12,8+75*r,4+24*r,'#160f24');ring(c,55,-12,8+75*r,4+24*r,'#a979d3',3);for(let i=0;i<9;i++){const a=i*2.399+time*5;line(c,[[55+Math.cos(a)*(18+q*70),-12+Math.sin(a)*(8+q*20)],[55+Math.cos(a)*12,-12+Math.sin(a)*4]],'#7e55a1',1.5);}}
 }
 function dualBladeDrops(c,e,t,d){const r=dualBladeRig({...e,dead:true,deathT:0,attack:null},t),u=clamp(d*2.8);for(let i=0;i<2;i++){const h=r.hands[i],length=i?84:66,sign=i?1:-1;c.save();c.translate(h[0]+sign*u*42,h[1]*(1-u*u)-6*u*u);c.rotate((i?.48:-1.04)+(Math.PI/2-(i?.48:-1.04))*u);poly(c,[[-3,-11],[-3,-length+11],[.5,-length],[4,-length+15],[3,-11]],'#ccd3cc',null);line(c,[[0,9],[0,-9]],'#70604c',5);line(c,[[-8,-9],[9,-9]],'#b9ae87',3);c.restore();}}
 function burrow(c,e,options={}){const x=options.x??e.x,y=options.y??e.y,s=(options.scale??e.scale??1)*1.8,t=options.time||0;c.save();c.translate(x,y);oval(c,0,2,39*s,9*s,'#352c35');c.scale((e.face||1)*s,s);const bob=Math.sin(t*24+(e.id||0))*1.7;
  for(let i=0;i<4;i++){const xx=-27+i*16,h=18+i%2*10;poly(c,[[xx-7,2],[xx-9,-4+bob],[xx-16,-h+bob],[xx+2,-7+bob],[xx+6,2]],i%2?'#657e6a':'#546c5d',null);line(c,[[xx-12,-h+4+bob],[xx,-5+bob]],'#9aab8e',1.4);}
  for(let i=0;i<6;i++)oval(c,-34+i*13,3+Math.sin(t*12+i)*2,4+i%2,2,'#807763');c.restore();
 }
 const materials={hunter:['#494f40','#777963','#b0a17b'],twin_blade:['#363342','#756878','#ae9eac'],flame_blade:['#503538','#92706a','#d6a468'],war_hammer:['#383a42','#7e8589','#b7a57e'],archmage:['#37304f','#78678d','#bfa777'],general:['#283641','#687c86','#c2a96f'],reaper:['#1e222e','#565769','#a59e96'],explorer:['#4f493d','#87795e','#baae89'],champion:['#393b4b','#8a8295','#bd9c8a'],marked_priest:['#382c44','#78658a','#bc90ca']};
 function draw(c,e,base,options={}){const k=base.bossKind;if(!k)return false;const t=options.time||0,p=materials[k]||palettes[base.stage]||palettes.abyss,s=e.bossState||{},d=e.dead?clamp((e.deathT||0)/.8):0,x=options.x??e.x,y=options.y??e.y,scale=options.scale??e.scale??1,face=e.face||1;
  if(e.dead&&(e.noCorpse||s.selfDestruct||d>=1))return true;
  c.save();c.globalAlpha*=e.dead?1-d:1;c.translate(x,y-(e.z||0));oval(c,0,4+((MutantArt.kinds.has(k)||AberrantArt.kinds.has(k)||AbyssArt.kinds.has(k))?(e.z||0):0),55*scale,10*scale,'#07101966');c.scale(face*scale,scale);if(!e.dead&&s.split>s.clock){ring(c,0,-40,30,14,'#8a78a044');c.restore();return true;}c.globalAlpha*=e.spawnDelay>0?.45:1;if(!e.dead&&s.cloak>s.clock)c.globalAlpha*=.38;if(!e.dead&&s.phase>s.clock)c.globalAlpha*=.28;if(!e.dead&&e.flash>0)c.filter='brightness(1.65)';if(!e.dead&&e.timeSealT>0)c.globalAlpha*=.6;
  if(e.dead){c.beginPath();c.rect(-500,-500,1000,505);c.clip();const poseTime=e.bossDeathAt??t,paint=entity=>{if(AbyssArt.kinds.has(k))AbyssArt.draw(c,entity,k,poseTime);else if(AberrantArt.kinds.has(k))AberrantArt.draw(c,entity,k,poseTime);else if(humanKinds.has(k))humanoid(c,entity,k,p,poseTime,d);else creature(c,entity,k,p,poseTime);};deathBody(c,e,base,poseTime,paint);death(c,e,base,p,poseTime);c.restore();return true;}
  c.save();
  if(!e.dead&&!HumanArt.kinds.has(k)&&!MutantArt.kinds.has(k)&&!AberrantArt.kinds.has(k)&&!AbyssArt.kinds.has(k)){const q=pose(e,t);if(['overhead','stomp','bite'].includes(e.attack?.pose)){c.translate(q.swing*9,q.wind*5-q.swing*8);c.rotate(-q.wind*.08+q.swing*.1);}else if(e.walking||e.moving)c.rotate(q.gait*.025);}if(!e.dead&&e.state==='active'&&e.attack?.action==='leap')c.translate(0,-(AbyssArt.kinds.has(k)?AbyssArt.leapHeight(e):AberrantArt.kinds.has(k)?AberrantArt.leapHeight(e):Math.sin(clamp(e.t/e.attack.active)*Math.PI)*(e.attack.jumpHeight||55)));if(!e.dead&&k==='sacrifice'&&e.attack?.action==='suicide'&&['windup','active'].includes(e.state)){c.save();c.globalCompositeOperation='lighter';glow(c,0,-83,110+Math.sin(t*22)*8,'#f3264666');ring(c,0,-79,57,69,'#ff4c6b99',2.5);c.restore();}if(AbyssArt.kinds.has(k))AbyssArt.draw(c,e,k,t);else if(AberrantArt.kinds.has(k))AberrantArt.draw(c,e,k,t);else if(humanKinds.has(k))humanoid(c,e,k,p,t,d);else creature(c,e,k,p,t);c.restore();if(!e.dead&&k==='champion'&&s.reviveUntil>s.clock){const q=clamp(1-(s.reviveUntil-s.clock)/1.15),fade=Math.sin(Math.PI*q);c.save();c.globalCompositeOperation='lighter';glow(c,0,-80,115,'#a90b2866');ring(c,0,-68,54+q*65,72+q*38,'#a9233b',3*fade);for(let i=0;i<13;i++){const a=i*2.4+t*.7,r=34+q*68;glow(c,Math.cos(a)*r,-75+Math.sin(a)*45-q*35,12+8*fade,'#c8234266');}c.restore();}if(!e.dead&&e.state==='stunned'){c.save();c.scale(face,1);poly(c,[[0,-160],[7,-153],[0,-146],[-7,-153]],'#e6bf7c');line(c,[[-18,-140],[-18+36*clamp(e.stun/(e.stunMax||5)),-140]],'#e6bf7c',2);c.restore();}if(!e.dead&&e.corpseVenom)glow(c,0,-70,50,'#b49a4722');c.restore();return true;
 }
 function behemothGroundSpike(c,x,y,q){
  const timing=BEHEMOTH_SPIKE_TIMING,rise=smooth((q+timing.emerge)/timing.emerge),withdraw=smooth((q-timing.hold)/(timing.life-timing.hold)),h=190*rise*(1-withdraw);
  if(h<.1)return;
  c.save();c.translate(x,y);oval(c,0,2,26,8,'#241b30');
  // One curved, tapered tentacle with a hard shell and an uninterrupted sharp tip.
  poly(c,[[-20,3],[-23,-h*.24],[-17,-h*.51],[-5,-h*.77],[10,-h],[10,-h*.70],[17,-h*.42],[21,2]],'#685176','#32243e',2);
  poly(c,[[-20,3],[-23,-h*.24],[-17,-h*.51],[-5,-h*.77],[10,-h],[-5,-h*.54],[-8,-h*.23],[-5,3]],'#a88cbb',null);
  poly(c,[[10,-h],[10,-h*.70],[17,-h*.42],[21,2],[9,2],[4,-h*.44]],'#80658e',null);
  line(c,[[-8,-h*.12],[-10,-h*.39],[-3,-h*.64],[10,-h]],'#dcc4e6',1.5);
  for(const u of [.22,.43,.62]){const bend=-13+u*17,w=19*(1-u);line(c,[[bend-w,-h*u],[bend-2,-h*u+5],[bend+w*.6,-h*u+1]],'#493550',1.8);}
  c.restore();
 }
 function effects(c,g,camera=0,shared={}){const p=g.p,time=g.time;const marker=(x,y,r,col)=>{if(shared.warning){shared.warning(x-camera,y-28,1);return;}glow(c,x-camera,y-28,28,'#ff573a77');};
  const groundTell=(x,y,r,progress=0,color='#e85155')=>{c.save();c.globalAlpha=.16+.12*progress;oval(c,x,y,r,r/1.6,color);c.globalAlpha=.85;ring(c,x,y,r,r/1.6,color,2.5);if(progress>0)ring(c,x,y,Math.max(1,r*progress),Math.max(1,r/1.6*progress),'#ffb2a2',1.5);c.restore();};
  const weaponTell=(e,a)=>{const k=e.bossKind,art=HumanArt.kinds.has(k)?HumanArt:MutantArt;if(AbyssArt.kinds.has(k))return AbyssArt.anchor(e,k,time);if(AberrantArt.kinds.has(k))return AberrantArt.anchor(e,k,time);if(k==='twin_blade'){const rig=dualBladeRig(e,time),off=a?.pose==='reverse',idx=off?0:1,h=rig.hands[idx],angle=off?rig.sampled.backAngle:rig.sampled.angle,len=off?47:64,scale=e.scale||1;return [e.x+(e.face||1)*(h[0]+Math.sin(angle)*len)*scale,e.y-(e.z||0)+(h[1]-Math.cos(angle)*len)*scale];}if(!art.kinds.has(k))return null;if(a?.pose==='kick')return art.anchor(e,k,time,'foot');if(a?.pose==='rear')return MutantArt.anchor(e,k,time,'back');const rig=art.rig(e,k,time),off=k==='iron_guard'&&a?.action==='guard'||a?.pose==='offhand'||a?.pose==='shield'||a?.weapon==='hook'||a?.action==='hook'||a?.action==='hookArc'||a?.action==='aimShot'&&['hunter','general'].includes(k),idx=off?0:1,h=rig.hands[idx]||rig.hands[0];if(!h)return MutantArt.kinds.has(k)?MutantArt.anchor(e,k,time,'body'):[e.x,e.y-(e.z||0)-60*(e.scale||1)];const angle=idx?rig.angle:rig.backAngle,len=off&&k==='iron_guard'&&a?.action==='guard'?18:k==='war_hammer'?94:k==='archmage'?105:k==='champion'?64:k==='explorer'?35:k==='flame_blade'?55:k==='crystal_claw'?22:38,point=[h[0]+Math.sin(angle)*len,h[1]-Math.cos(angle)*len],scale=e.scale||1;return [e.x+(e.face||1)*point[0]*scale,e.y-(e.z||0)+point[1]*scale];};
  c.save();if(g.enemies.some(e=>!e.dead&&e.bossState?.hunting)){c.fillStyle='#09061655';c.fillRect(0,0,c.canvas.width,c.canvas.height);ring(c,p.x-camera,p.y-p.z-55,22,22,'#b779dc',2);}
  for(const e of g.enemies){if(e.dead)continue;const a=e.attack,s=e.bossState||{},k=e.bossKind||g.TYPES?.[e.type]?.bossKind,guarding=a?.action==='guard'||a?.flags?.some(f=>['guardStance','parryStance','spikeGuard','shieldAdvance'].includes(f)),tellPoint=e.bossState&&a?.bossMove&&['windup','active'].includes(e.state)&&e.red>0?weaponTell({...e,bossKind:k},a):null;if(e.corpseVenom?.warning!=null){marker(e.x,e.y,175,'#dc564e');glow(c,e.x-camera,e.y-50,40,'#e64d5c66');}if(s.spikeWarning>s.clock)glow(c,e.x-camera,e.y-100,55,'#ff782aaa');if(s.preyUntil>s.clock){const x=p.x-camera,y=p.y-p.z-117;oval(c,x,y,11,12,'#eee1e8');oval(c,x-4,y-2,3,4,'#32162f');oval(c,x+4,y-2,3,4,'#32162f');for(let i=-1;i<=1;i++)line(c,[[x+i*5,y+7],[x+i*5,y+15]],'#eee1e8',3);ring(c,x,y,18,19,'#c856af',1.5);}if(!a?.bossMove)continue;
   if(e.state==='windup'){
    const q=clamp(e.t/(a.wind||1));if(['aimShot','nightmareHunt'].includes(a.action)){const x=(e.bossAim?.x??p.x)-camera,y=(e.bossAim?.y??p.y)-p.z-52;ring(c,x,y,21,21,'#ee8a73',2);for(const d of [-1,1]){line(c,[[x+d*14,y],[x+d*30,y]],'#f5ad83',2);line(c,[[x,y+d*14],[x,y+d*30]],'#f5ad83',2);}}
    if(['ray','returnSword'].includes(a.action)){const tx=e.bossAim?.x??p.x,ty=e.bossAim?.y??p.y,ang=Math.atan2(ty-e.y,tx-e.x),len=a.action==='returnSword'?620:1100;line(c,[[e.x-camera,e.y-45],[e.x-camera+Math.cos(ang)*len,e.y+Math.sin(ang)*len-45]],q>.65?'#ff6565':'#b48ab980',q>.65?2:1);}
    if(a.action==='hookArc'){c.save();c.translate(e.x-camera,e.y);c.scale(e.face,.42);c.beginPath();c.arc(0,0,(a.range+a.minRadius)/2,-Math.PI/2,Math.PI/2);c.strokeStyle='#d94c53';c.lineWidth=1.2;c.stroke();c.restore();}
    if(a.pose==='kick'||a.pose==='rear')glow(c,tellPoint?tellPoint[0]-camera:e.x-camera+e.face*(a.pose==='rear'?-32:35)*e.scale,tellPoint?tellPoint[1]:e.y-(a.pose==='rear'?70:18)*e.scale,20,'#ff453a66');
    if(a.action==='suicide'){groundTell(e.x-camera,e.y,a.range,q,'#ed354b');glow(c,e.x-camera,e.y-75,86,'#ee284b66');}
    else if(a.action==='bastionHop'&&s.hop)groundTell(s.hop.tx-camera,s.hop.ty,a.range,q);
    else if(['spineVolley','eightPull','quake'].includes(a.action))marker(e.x,e.y,a.range||260,'#d8616277');
   }
   if(s.charged)glow(c,e.x-camera+e.face*40,e.y-120,35,'#ffdc5e33');if(s.armorWarning>s.clock)marker(e.x,e.y,245,'#f17278');if(s.air>s.clock)marker(e.x,e.y,120,'#b8567c66');
   if(s.vacuum>s.clock&&!s.vacuumHit&&!e.timeSealT&&!e.sleepT&&!e.furnaceCapture&&!e.mindControlT&&!['stunned','knockdown','flinch'].includes(e.state)){
    const danger=Math.hypot(p.x-e.x,(p.y-e.y)*1.6)<VACUUM.warning&&p.z<135;
    const portal=AbyssArt.anchor(e,'bottomless',time,'portal');
    const col=danger?'#ff485b':'#d99aff',cx=portal[0]-camera,cy=portal[1];
    c.save();c.globalCompositeOperation='lighter';
    // Upright waves converge on the animated portal mouth, not the arena floor.
    for(let i=0;i<7;i++){
     const q=(s.clock*.85+i/7)%1,r=12+(1-q)*VACUUM.range*.55;
     c.globalAlpha=.18+.65*Math.sin(q*Math.PI);
     ring(c,cx,cy,r,r*1.12,col,danger?3.5:2.5);
    }
    c.globalAlpha=danger?.8:.35;
    const mouth=39*(e.scale||1)*1.21;
    ring(c,cx,cy,mouth,mouth*1.12,col,danger?4:2);
    glow(c,cx,cy,mouth,col+(danger?'66':'33'));
    c.restore();
   }
   if(e.bossBlink&&time-e.bossBlink.at<.5){const b=e.bossBlink,q=clamp((time-b.at)/.5);ring(c,b.x-camera,b.y,60*(1-q)+2,15*(1-q)+2,'#bd8eeb',3);}if(e.bossState&&e.red>0&&shared.warning)shared.warning(tellPoint?tellPoint[0]-camera:e.x-camera,tellPoint?tellPoint[1]:e.y-95*e.scale,Math.min(1,e.red*14),tellPoint?1.2:1,guarding);
  }
  for(const f of g.bossEffects||[]){const q=f.age-f.delay,x=f.x-camera,y=f.y,warning=q<0,col=warning?'#e56d70':'#c3a1dc';c.save();
   if(f.type==='plagueCloud'){if(shared.mist)shared.mist(x,y,f.radius,Math.min(1,(f.life-q)*2),'#98ac68');else {c.globalAlpha=.2;for(let i=0;i<9;i++)glow(c,x+Math.sin(i*4+time*.2)*f.radius*.55,y-40,65,'#98ac6844');}}
   else if(f.type==='soundImpact'){const progress=warning?clamp(f.age/f.delay):clamp(q/f.life);c.save();c.globalAlpha=warning?.18:.12;oval(c,x,y,f.radius,f.radius/1.6,warning?'#e86e57':'#e6c79a');c.restore();ring(c,x,y,f.radius,f.radius/1.6,warning?'#ed7963':'#efd9a5',warning?2:3);if(warning)ring(c,x,y,Math.max(1,f.radius*progress),Math.max(1,f.radius/1.6*progress),'#efb286',1);else ring(c,x,y,f.radius*(.5+progress*.5),f.radius/1.6*(.5+progress*.5),'#f9e5b9',3);}
   else if(f.type==='ring'&&f.profaneHoly){const u=warning?clamp(f.age/f.delay):clamp(q/f.life);if(warning){groundTell(x,y,f.radius,u,'#a25cff');for(let i=0;i<6;i++){const a=i*Math.PI/3+time*.18;ring(c,x+Math.cos(a)*f.radius*.72,y+Math.sin(a)*f.radius*.30,5,3,'#d5a5ff',1);}}else{c.save();c.globalCompositeOperation='lighter';glow(c,x,y-36,f.radius*.72,'#9d58e566');for(let i=-2;i<=2;i++){const xx=x+i*f.radius*.22,hh=f.radius*(.75-Math.abs(i)*.08)*(1-u*.35);const grad=c.createLinearGradient(xx,y,xx,y-hh);grad.addColorStop(0,'#d9b3ff99');grad.addColorStop(1,'#8b42d600');c.fillStyle=grad;c.fillRect(xx-6,y-hh,12,hh);}ring(c,x,y,f.radius*(.55+.45*u),f.radius*.34*(.55+.45*u),'#d8abff',4*(1-u)+1);c.restore();}}
   else if(f.type==='priestHand'){const r=ghostHand(c,x,y-75,time,1.7,f);if(f.phase==='windup'&&!f.stunned)ghostHandWarning(c,x,y-75,r,1.7,shared);}
   else if(f.type==='chainHook'){const from=HumanArt.anchor(f.owner,'butcher',time),u=q<.28?clamp(q/.28):1-clamp((q-.28)/.27),sx=from[0]-camera,sy=from[1],hx=sx+(f.tx-from[0])*u,hy=sy+(f.ty-55-from[1])*u;line(c,[[sx,sy],[hx,hy]],'#78858b',2);const count=Math.max(2,Math.ceil(Math.hypot(hx-sx,hy-sy)/12));for(let i=0;i<count;i++){const k=i/count;ring(c,sx+(hx-sx)*k,sy+(hy-sy)*k,4,2,'#a5acab',1.5);}HumanArt.hookTip(c,hx,hy,Math.atan2(hy-sy,hx-sx)-Math.PI/2,f.owner.scale||1);}
   else if(f.type==='line'||f.type==='ray'){const n=f.length||400,from=f.type==='ray'?0:-n;line(c,[[x+Math.cos(f.angle)*from,y+Math.sin(f.angle)*from-40],[x+Math.cos(f.angle)*n,y+Math.sin(f.angle)*n-40]],col,warning?1.5:8);}
   else if(f.type==='swordFlight'){if(warning){line(c,[[f.sx-camera,f.sy-48],[f.tx-camera,f.ty-48]],'#ef6868',2);if(f.returning)MutantArt.greatsword(c,[x,y-48],f.holdAngle,true);}else MutantArt.greatsword(c,[x,y-48],Math.atan2(f.ty-f.sy,f.tx-f.sx)+Math.PI/2,true);}
   else if(f.type==='link'){line(c,[[x,y-65],[f.tx-camera,f.ty-65]],col,warning?1.3:8);if(warning){glow(c,x,y-65,30,'#ff443daa');glow(c,f.tx-camera,f.ty-65,30,'#ff443daa');}}
   else if(f.type==='ghostHand'){const u=warning?0:clamp(q/.2),mode=f.handMode||0;let hx=x+(f.tx-f.x)*u,hy=y-80+(f.ty-f.y)*u;if(mode===1)hy-=warning?45:-u*65;if(mode===3)hx+=Math.sin(u*Math.PI)*65;c.save();c.translate(hx,hy);const r=ghostHand(c,0,0,time,1.7,{handMode:mode,phase:warning?'windup':q<.26?'strike':'recovery',timer:warning?-q:q<.26?.26-q:Math.max(0,.5-(q-.26))});if(mode===0&&!warning)ring(c,0,0,25*(1-u*.5),30,'#c39ddd',4);c.restore();if(warning)ghostHandWarning(c,hx,hy,r,1.7,shared);}
   else if(f.type==='meleeTrail'){c.globalAlpha=1-clamp(q/.22);c.translate(x,y-55);c.scale(f.face||1,.45);c.beginPath();c.arc(0,0,f.radius*.82,-1.15,1.1);c.strokeStyle='#d8c2b780';c.lineWidth=5;c.stroke();c.beginPath();c.arc(0,0,f.radius*.72,-.7,1);c.strokeStyle='#efe0cc88';c.lineWidth=1.5;c.stroke();}
   else if(f.type==='seeker'||f.type==='spike'){
    ring(c,x,y,f.radius,f.radius*.34,f.warned&&f.type==='seeker'?'#e56d70':'#a88bba88',2);
    if(f.locked&&f.type==='seeker'&&f.warned)marker(f.x,y,f.radius);
    if(f.type==='spike'||f.locked)behemothGroundSpike(c,x,y,q);
   }
   else if(f.type==='rocket'){glow(c,x,y-95,25,warning?'#fc665577':'#ffba6355');if(warning)ring(c,x,y-95,14,14,'#ff8771',2);}
   else if(f.type==='portal'){ring(c,x,y,60*(1-clamp(q/.5))+3,15,'#bc85e5',3);}
   else if(f.type==='deathBurst'){glow(c,x,y-65,80*(1-q/.4),'#ba73ff77');ring(c,x,y-65,15+q*150,10+q*120,'#d2a5f7',3);}
   else if(f.type==='flame'){const face=f.face??f.owner?.face??1,length=f.radius||280,fade=Math.min(1,(f.life||.1)/.16);c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=fade;for(let i=0;i<28;i++){const q=(i/28+time*1.7)%1,spread=10+q*38,xx=x+face*q*length,yy=y-65+Math.sin(i*2.4+time*8)*q*36;glow(c,xx,yy,spread*.85,'#ff7c3040');flame(c,xx,yy+spread*.45,18+q*28,time+i,'#ff873baa');if(i%3===0)flame(c,xx-face*5,yy+spread*.2,10+q*14,time+i*.7,'#ffe0a4bb');}glow(c,x+face*22,y-65,25,'#ffd38b77');c.restore();}
   else if(f.type==='suicideBurst'){const u=clamp(q/f.life);c.save();c.globalCompositeOperation='lighter';ring(c,x,y,Math.max(1,f.radius*u),Math.max(1,f.radius*u/1.6),'#ff704e',6*(1-u));for(let i=0;i<14;i++){const a=i*TAU/14,rr=f.radius*(.15+.75*u),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.48;glow(c,xx,yy-13,28*(1-u)+8,'#ff422f77');flame(c,xx,yy,28*(1-u)+7,time+i,'#f66b3d');}c.restore();}
   else if(f.type==='bombardShot'){if(warning)groundTell(x,y,f.radius,clamp(f.age/f.delay),'#e7535b');}
   else if(f.type==='dive'){if(warning)groundTell(x,y,f.radius,clamp(f.age/f.delay),'#e44853');else ring(c,x,y,f.radius,f.radius/1.6,'#f2a098',3);}
   else if(f.type==='crystalBurst'){if(warning){groundTell(x,y,f.radius,clamp(f.age/f.delay),'#df5666');for(let i=0;i<9;i++){const a=i*TAU/9;ring(c,x+Math.cos(a)*f.radius*.72,y+Math.sin(a)*f.radius*.45,5,3,'#f3a2ad',1.5);}}else{const u=clamp(q/f.life);ring(c,x,y,f.radius*(.45+.55*u),f.radius/1.6*(.45+.55*u),'#f1a3b9',4*(1-u));for(let i=0;i<20;i++){const a=i*2.399,rr=f.radius*(.2+u*.68)*(i%3===0?1:.8),sx=x+Math.cos(a)*rr,sy=y+Math.sin(a)*rr/1.6;shard(c,sx,sy-8-u*32,18+i%4*8,a+u*2,i%3?'#80c8e8':'#e39fb8');}}}
   else if(f.type==='eight'){for(let i=0;i<8;i++){const a=i*TAU/8;line(c,[[x,y-40],[x+Math.cos(a)*f.radius,y+Math.sin(a)*f.radius*.6-30]],'#b393c4',5);}}
   else if(!['wave','bombardShot','trackSound','thrownAlly'].includes(f.type)){const r=warning?f.radius:f.radius*(.35+clamp(q/.35)*.65);if(warning)marker(f.x,y,r);else ring(c,x,y,r,r*.34,'#b6a5bc99',2);if(!warning)glow(c,x,y-10,Math.max(1,r*.4),'#ac88d22a');}
   c.restore();
  }c.restore();
 }
 function voidBomb(c,b,camera){
  const q=clamp((b.age||0)/Math.max(.01,b.flight||1)),x=b.x-camera,y=b.y-(b.z||0),spin=(b.age||0)*5.5,pulse=1+Math.sin(spin*2)*.06,edge=b.reflected?'#a6fbe6':'#ed58bc';
  c.save();
  if(b.bomb){
   const rx=b.radius,ry=rx*(b.bossProjectile?.625:.42),tx=b.tx-camera;
   c.globalAlpha=.18+q*.16;oval(c,tx,b.ty,rx,ry,'#a32991');
   c.globalAlpha=.55+q*.4;ring(c,tx,b.ty,rx,ry,edge,2.5);
   c.globalAlpha=.3+q*.35;ring(c,tx,b.ty,Math.max(1,rx*q),Math.max(1,ry*q),'#ef9bdc',1.2);
  }
  c.globalAlpha=1;c.translate(x,y);
  const dx=(b.tx??b.x)-(b.sx??b.x),dy=(b.ty??b.y)-(b.sy??b.y)+(b.startZ??48)-Math.cos(q*Math.PI)*Math.PI*170,angle=Math.atan2(dy,dx);
  c.save();c.rotate(angle);
  for(let i=3;i>=0;i--){const t=i/3;c.globalAlpha=.4*(1-t)+.08;oval(c,-21-i*9,Math.sin(spin-i)*3,7-i,4-i*.6,i%2?'#b94ce0':'#ed58bc');}
  c.restore();c.scale(pulse,pulse);
  glow(c,0,0,30,'#c32bba66');oval(c,0,0,14,14,'#35103f');ring(c,0,0,14,14,'#ad45d0',2);
  c.save();c.rotate(spin);ring(c,0,0,21,8,edge,2);c.rotate(1.1);ring(c,0,0,19,7,'#aa58e5',1.5);c.restore();
  poly(c,[[-7,-9],[2,-11],[8,-3],[3,7],[-4,10],[-9,1]],'#822472',null);
  line(c,[[-5,-7],[2,-3],[-2,3],[4,7]],'#f574ca',2);oval(c,-3,-4,3,4,'#ffd4ef');
  c.restore();return true;
 }
 function crystalProjectile(c,b,camera){
  const dark=b.projectile==='darkCrystal',phase=(b.travelled||0)*.025+(b.age||0)*8;
  const edge=b.reflected?'#a6fbe6':dark?'#c58aff':'#ff718b',light=b.reflected?'#e1fff5':dark?'#f0d8ff':'#ffe1e7';
  c.save();c.translate(b.x-camera,b.y-(b.z||0));c.rotate(Math.atan2(b.vy,b.vx));
  glow(c,0,0,dark?27:24,edge+'44');
  // Small drifting fragments and a tapered energy wake, with no shaft or feathers.
  c.save();c.globalAlpha*=.38;
  poly(c,[[-12,-5],[-57,Math.sin(phase)*3],[-12,5]],edge,null);
  for(let i=0;i<3;i++){const xx=-25-i*11,yy=Math.sin(phase-i*1.8)*(4+i*2);poly(c,[[xx-4,yy],[xx,yy-3],[xx+4,yy],[xx,yy+3]],edge,null);}
  c.restore();
  if(dark){
   poly(c,[[-19,0],[-9,-12],[8,-10],[22,0],[8,10],[-9,12]],'#241532',edge,1.2);
   poly(c,[[-19,0],[-9,-12],[2,-2],[22,0]],'#8054b0',null);
   poly(c,[[2,-2],[8,-10],[22,0],[8,10]],'#50306e',null);
   poly(c,[[-19,0],[2,-2],[8,10],[-9,12]],'#382047',null);
   line(c,[[-12,0],[-4,-4],[2,1],[9,-3],[16,0]],light,1.5);
   for(const sign of [-1,1]){const xx=-3+Math.sin(phase)*4,yy=sign*(17+Math.cos(phase)*2);poly(c,[[xx-6,yy],[xx,yy-4],[xx+5,yy],[xx,yy+4]],'#6f4698',edge,1);}
  }else{
   poly(c,[[-21,-3],[-9,-11],[10,-7],[27,0],[6,9],[-13,7]],'#801f3e',edge,1.2);
   poly(c,[[-21,-3],[-9,-11],[10,-7],[3,-1]],'#e55578',null);
   poly(c,[[3,-1],[10,-7],[27,0],[6,9]],'#b73156',null);
   poly(c,[[-21,-3],[3,-1],[6,9],[-13,7]],'#59172e',null);
   line(c,[[-16,-3],[3,-1],[25,0]],light,1.4);
   line(c,[[-8,-9],[3,-1],[6,7]],'#ff9fb3',1);
  }
  c.restore();return true;
 }
 function plagueOrb(c,b,camera){
  const x=b.x-camera,y=b.y-(b.z||0),t=b.orbAge||0,pulse=1+Math.sin(t*8)*.06,col=b.reflected?'#a8f7dc':'#b8df7c';
  c.save();glow(c,x,y,46,col+'44');oval(c,x,y,24*pulse,23*pulse,'#435c35');oval(c,x-6,y-6,14,15,'#809c4d');ring(c,x,y,24*pulse,23*pulse,col,2);
  for(let i=0;i<7;i++){const a=t*1.8+i*2.399,r=12+i%3*6;oval(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.8,3+i%2,3+i%2,i%2?'#d9eda0':'#638643');}
  for(let i=0;i<3-(b.orbShots||0);i++){const a=t*1.3+i*Math.PI*2/3;glow(c,x+Math.cos(a)*29,y+Math.sin(a)*26,7,col+'88');}
  if(b.warned&&!b.reflected)ring(c,x,y,30,29,'#ff6658',2.5);oval(c,x-8,y-10,4,5,'#e6f8bf');c.restore();return true;
 }
 function projectile(c,b,camera=0){if(b.plagueOrb)return plagueOrb(c,b,camera);if(b.projectile==='bloodCrystal'||b.projectile==='darkCrystal')return crystalProjectile(c,b,camera);if(b.projectile==='voidBomb')return voidBomb(c,b,camera);if(b.projectile==='arcaneBomb'){const x=b.x-camera,y=b.y-b.z;glow(c,x,y,24,'#d84bca77');shard(c,x,y+12,25,.2,'#db70c6');oval(c,x,y,5,8,'#ffd4f4');return true;}if(!b.bossProjectile||b.bomb||b.projectile==='fireball'||b.flags?.includes('burn')||b.flags?.includes('poison'))return false;const x=b.x-camera,y=b.y-b.z,flags=b.flags||[],col=b.reflected?'#a8f7dc':flags.includes('burn')?'#f5ab61':flags.includes('poison')?'#b3ce81':flags.includes('slow')?'#9edcea':b.bossStage==='human'?'#aa9fef':'#ba89dc';c.save();
  if(b.projectile==='hook')line(c,[[b.originX-camera,b.originY-48],[x,y]],'#b1a899',2);
  c.translate(x,y);c.rotate(Math.atan2(b.vy,b.vx));
  if(b.projectile==='rocket'){poly(c,[[-22,-6],[10,-6],[22,0],[10,6],[-22,6]],'#ef493e',null);poly(c,[[9,-6],[22,0],[9,6]],'#ff8062',null);for(const sign of [-1,1])poly(c,[[-14,sign*4],[-25,sign*14],[-25,sign*3]],'#d93235',null);poly(c,[[-23,-5],[-49-(b.rocketSpeed||0)*.008,0],[-23,5]],'#ff985d',null);glow(c,-28,0,16,'#ff614d88');}
  else if(b.projectile==='hook'){line(c,[[-14,0],[3,-3],[13,-12],[22,-8],[22,4],[12,9],[9,3]],'#d4c4ae',4);}
  else if(b.projectile==='boneSpine'){poly(c,[[-24,-6],[0,-9],[33,0],[0,8],[-22,5]],'#d6c6b7');line(c,[[-20,0],[26,0]],'#8a7587',2);}
  else if(b.projectile==='musket'){glow(c,0,0,13,'#ffbd7955');line(c,[[-38,0],[4,0]],'#ffe2a9',3);oval(c,7,0,5,3,'#eee2c0');}
  else if(b.projectile==='bolt'){line(c,[[-28,0],[15,0]],'#c1c7c5',3);poly(c,[[9,-4],[22,0],[9,4]],'#e7d5be');line(c,[[-25,-5],[-17,0],[-25,5]],'#ad9981',2);}
  else{glow(c,0,0,22,col+'55');oval(c,0,0,b.projectile==='fireball'?12:9,9,col);oval(c,3,-2,4,4,'#f4e6e7');line(c,[[-12,0],[-35,0]],col+'88',4);ring(c,-2,0,13,12,col+'66',1);}
  c.restore();return true;
 }
 return {fixedChain,ghostHandRig,ghostHand,dualBladeRig,humanBossRig:HumanArt.rig,mutantBossRig:MutantArt.rig,humanoidRig,hammerHead,deathFrame,burrow,draw,effects,projectile,rows:33};

})(Motion,Art.human,Art.mutant,Art.aberrant,Art.abyss);
 function hammerHead(e,time=0){const r=Art.human.rig(e,'war_hammer',time),h=r.hands[1],angle=r.angle,s=e.scale||1;return {x:e.x+(e.face||1)*(h[0]+Math.sin(angle)*94)*s,y:e.y,z:(e.z||0)-(h[1]-Math.cos(angle)*94)*s};}
 // Core body only: weapons, wings, tails, long necks and orbiting stones do not take hits.
 // The same posed volume is used for sword cuts, plunges and reflected projectiles.
 function hurtbox(e,spec={},time=0){
  const k=spec.bossKind||e.bossKind,scale=e.scale||1,face=e.face||1;
  let rect=[-28,-120,28,-8],root={x:0,y:0,angle:0},modelScale=1,hop=0;
  const human=Art.human.kinds.has(k),mutant=Art.mutant.kinds.has(k)&&k!=='impaler';
  if(human||mutant||k==='twin_blade'){
   const r=human?Art.human.rig(e,k,time):mutant?Art.mutant.rig(e,k,time):Models.humanoidRig(e,k,time);
   const width=r.anatomy?.width||({iron_guard:23,war_hammer:25,butcher:26,twin_blade:18}[k]||19);
   const xs=[r.hip[0],r.chest[0],r.head[0]],ys=[r.hip[1],r.chest[1],r.head[1]];
   rect=[Math.min(...xs)-width,Math.min(...ys)-14,Math.max(...xs)+width,Math.max(...ys)+22];
  }else if(Art.aberrant.kinds.has(k)||Art.abyss.kinds.has(k)){
   const art=Art.aberrant.kinds.has(k)?Art.aberrant:Art.abyss,r=art.rig(e,k,time);
   root=r.root;modelScale=art.modelScale(k);hop=art.leapHeight(e)*scale;
   const profiles={moth:[-22,-115,22,-34],bladder:[-47,-160,48,-66],fortress:[-42,-138,42,-30],spider_queen:[-53,-120,48,-40],great_bell:[-51,-138,51,-26],resentment:[-38,-151,38,-42],marked_priest:[-22,-140,22,-26],demon_jelly:[-60,-176,60,-83],nightmare:[-27,-145,27,-42],profane_obelisk:[-28,-162,28,-33],bottomless:[-47,-145,47,-25]};
   rect=profiles[k]||rect;
   if(r.torso){const {abdomen,chest}=r.torso,large=k==='behemoth',w=large?43:36,h=large?34:28;rect=[Math.min(abdomen.center[0],chest.center[0])-w,Math.min(abdomen.center[1],chest.center[1])-h,Math.max(abdomen.center[0],chest.center[0])+w,Math.max(abdomen.center[1],chest.center[1])+h];}
  }else if(k==='impaler')rect=[-65,-96,42,-16];
  else if(spec.final)rect=[-35,-259,35,-15];
  const [left,top,right,bottom]=rect,c=Math.cos(root.angle),s=Math.sin(root.angle),points=[[left,top],[right,top],[left,bottom],[right,bottom]].map(([x,y])=>[root.x+x*c-y*s,root.y+x*s+y*c]);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),size=scale*modelScale;
  return {x:e.x+face*(minX+maxX)*.5*size,y:e.y,rx:(maxX-minX)*.5*size,ry:Math.min(22,Math.max(9,(maxX-minX)*.16))*scale,bottom:Math.max(0,(e.z||0)+hop-maxY*size),top:(e.z||0)+hop-minY*size};
 }
 return {roster:Roster,final:FinalBoss,encounters:Encounters,art:Art,models:Models,hurtbox};
});
