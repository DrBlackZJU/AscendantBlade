/* Deterministic combat simulation. No DOM, network, or rendering dependencies. */
(function (root, factory) {
  const api = factory(
    typeof module==='object'&&module.exports?require('./game.js').Systems:root.AshSystems,
    typeof module==='object'&&module.exports?require('./enemy.js'):root.AshEnemyCatalog
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AshCombat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Systems,EnemyCatalog) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.5);
  const {EventBus,DEFAULT_RULES,tagPrefix,tagsFor}=Systems;
  const GUARD={startup:DEFAULT_RULES.guardStartup,window:DEFAULT_RULES.guardWindow,recovery:DEFAULT_RULES.guardRecovery,perfect:DEFAULT_RULES.perfectWindow};
  const guardEnd=GUARD.startup+GUARD.window,guardTotal=guardEnd+GUARD.recovery;
  const isBoss=e=>!!TYPES[e.type]?.boss;
  const bossGeometry=typeof module==='object'&&module.exports?require('./boss.js'):globalThis.AshBoss;
  const CHAPTERS=[
    {name:'雨夜 · 山门',short:'山门',en:'THE ASHEN GATE',theme:'rain',boss:'boss',areas:['外庭','长阶','山门'],hint:'辨清起手，破开山门'},
    {name:'残照 · 长桥',short:'长桥',en:'BRIDGE OF FALLEN LEAVES',theme:'sunset',boss:'duelist',areas:['荒渡','断桥','剑冢'],hint:'长枪控距，双刀追身；逐击格挡'},
    {name:'寒灰 · 钟楼',short:'钟楼',en:'THE SILENT BELFRY',theme:'snow',boss:'warden',areas:['雪径','重廊','钟楼'],hint:'盾阵与弩箭交错，玄戟镇守终点'}
  ];
  const ENCOUNTERS=[
    [['sword',650,525],['sword',890,590],['bow',1010,472]],
    [['axe',1660,553],['sword',1830,468],['bow',2140,600],['sword',2080,528]],
    [['boss',3090,548]],
    [['spear',600,540],['bow',1010,472],['dual',850,605],['sword',1040,570]],
    [['shield',1620,530],['spear',1810,610],['dual',2060,480],['bow',2190,565]],
    [['duelist',3080,550]],
    [['shield',615,520],['crossbow',1020,472],['dual',860,605],['spear',1050,560]],
    [['axe',1620,565],['shield',1760,480],['crossbow',2170,610],['dual',2050,530],['spear',2210,490]],
    [['warden',3090,548]]
  ];
  const STAGES=ENCOUNTERS.map((enemies,index)=>({index,chapter:Math.floor(index/3),area:index%3,
    name:CHAPTERS[Math.floor(index/3)].areas[index%3],left:[45,1170,2350][index%3],
    right:[1120,2300,3550][index%3],startX:[175,1260,2450][index%3],exit:[1150,2330,3610][index%3],enemies}));
  const ATTACKS = [
    {name:'一式 · 横斩', wind:.095, active:.105, recovery:.17, damage:17, posture:8, range:123},
    {name:'二式 · 回切', wind:.08, active:.11, recovery:.18, damage:20, posture:9, range:132},
    {name:'三式 · 追刺', wind:.12, active:.12, recovery:.19, damage:23, posture:11, range:149},
    {name:'四式 · 断山', wind:.29, active:.16, recovery:.43, damage:46, posture:27, range:169}
  ];
  const MOVES = {
    cut: {name:'横斩', pose:'sweep', wind:.55, active:.12, recovery:.55, range:119, lane:48, damage:13, posture:32},
    thrust: {name:'突刺', pose:'thrust', wind:.66, active:.14, recovery:.65, range:148, lane:32, damage:17, posture:38, lunge:220},
    quick: {name:'回身斩', pose:'reverse', wind:.40, active:.12, recovery:.55, range:123, lane:49, damage:12, posture:30},
    chop: {name:'裂地斧', pose:'overhead', wind:.88, active:.16, recovery:.92, range:146, lane:56, damage:25, posture:44, ground:true},
    sweep: {name:'旋身斧', pose:'spin', wind:.72, active:.19, recovery:.83, range:169, lane:72, damage:20, posture:40, both:true},
    shot: {name:'引弓', pose:'bow', wind:.78, active:.1, recovery:.62, range:850, lane:600, damage:13, posture:35, ranged:true},
    fastshot: {name:'追风矢', pose:'bow', wind:.49, active:.1, recovery:.62, range:850, lane:600, damage:11, posture:35, ranged:true},
    hammer: {name:'山崩', pose:'overhead', wind:1.04, active:.18, recovery:.97, range:193, lane:77, damage:32, posture:52, ground:true},
    backswing: {name:'横扫千军', pose:'spin', wind:.82, active:.19, recovery:.87, range:221, lane:95, damage:24, posture:46, both:true},
    rush: {name:'震门', pose:'thrust', wind:.77, active:.23, recovery:.85, range:196, lane:61, damage:27, posture:49, lunge:530},
    aftershock: {name:'余震', pose:'overhead', wind:.43, active:.17, recovery:.92, range:209, lane:89, damage:24, posture:45, ground:true},
    spearJab:{name:'探云刺',pose:'thrust',wind:.59,active:.18,recovery:.55,range:225,lane:34,damage:17,posture:37,lunge:130},
    spearSweep:{name:'扫膝',pose:'lowSweep',wind:.72,active:.22,recovery:.65,range:195,lane:64,damage:19,posture:41,both:true,ground:true},
    shieldBash:{name:'盾撞',pose:'bash',wind:.65,active:.18,recovery:.52,range:116,lane:49,damage:15,posture:42,lunge:210},
    shieldCut:{name:'盾后斩',pose:'sweep',wind:.52,active:.17,recovery:.66,range:131,lane:47,damage:18,posture:39},
    twinCut:{name:'左刃',pose:'sweep',wind:.43,active:.17,recovery:.40,range:123,lane:47,damage:12,posture:30,lunge:95},
    twinBack:{name:'右刃',pose:'reverse',wind:.34,active:.17,recovery:.53,range:135,lane:53,damage:14,posture:33},
    twinDive:{name:'跃步劈',pose:'leap',wind:.68,active:.24,recovery:.70,range:156,lane:55,damage:22,posture:43,lunge:220},
    bolt:{name:'机弩',pose:'crossbow',wind:.81,active:.14,recovery:.65,range:850,lane:600,damage:16,posture:40,ranged:true},
    boltFollow:{name:'连机',pose:'crossbow',wind:.38,active:.14,recovery:.64,range:850,lane:600,damage:13,posture:37,ranged:true},
    ravenCut:{name:'鸦落',pose:'sweep',wind:.55,active:.19,recovery:.56,range:162,lane:61,damage:21,posture:39,lunge:120},
    ravenBack:{name:'返羽',pose:'reverse',wind:.34,active:.18,recovery:.53,range:172,lane:65,damage:19,posture:39,both:true},
    ravenDraw:{name:'居合',pose:'draw',wind:.93,active:.25,recovery:.88,range:236,lane:43,damage:32,posture:54,lunge:420},
    ravenDive:{name:'双刃坠',pose:'leap',wind:.72,active:.25,recovery:.83,range:183,lane:75,damage:27,posture:48,lunge:150},
    halberdThrust:{name:'穿庭',pose:'thrust',wind:.78,active:.24,recovery:.73,range:261,lane:49,damage:28,posture:49,lunge:190},
    halberdSweep:{name:'回廊',pose:'spin',wind:.87,active:.27,recovery:.82,range:257,lane:95,damage:26,posture:50,both:true},
    halberdSlam:{name:'断钟',pose:'overhead',wind:1.07,active:.26,recovery:1.08,range:234,lane:80,damage:35,posture:61,ground:true},
    halberdHook:{name:'倒卷',pose:'reverse',wind:.40,active:.21,recovery:.74,range:224,lane:76,damage:23,posture:44,both:true},
    weakCut:{name:'短刀自卫',pose:'sweep',wind:.64,active:.16,recovery:.90,range:88,lane:39,damage:7,posture:23},
    weakThrust:{name:'仓促刺',pose:'thrust',wind:.72,active:.16,recovery:1.02,range:103,lane:31,damage:9,posture:25,lunge:65}
  };
  const TYPES = {
    sword: {name:'刀兵', hp:86, posture:75, speed:112, scale:1, reach:111, color:'#c9d3cd'},
    bow: {name:'弓兵', hp:65, posture:58, speed:101, scale:1, reach:560, color:'#a9bdaa',ammo:4},
    axe: {name:'精英斧卫', hp:162, posture:115, speed:76, scale:1.15, reach:138, color:'#d7ad7d'},
    boss: {name:'镇门者 · 铁屠', hp:960, posture:240, speed:68, scale:1.8, reach:178, color:'#ddad85',boss:true,weapon:'hammer',armor:true,execution:360},
    spear:{name:'长枪兵',hp:112,posture:92,speed:105,scale:1.06,reach:190,color:'#b7c9cd',weapon:'spear'},
    shield:{name:'精英盾卫',hp:170,posture:121,speed:75,scale:1.13,reach:104,color:'#b9b69c',weapon:'sword',armor:true},
    dual:{name:'双刀客',hp:103,posture:87,speed:149,scale:1,reach:116,color:'#c8afa3',weapon:'dual'},
    crossbow:{name:'弩兵',hp:89,posture:74,speed:88,scale:1.02,reach:600,color:'#b7c6cd',weapon:'crossbow',ranged:true,ammo:6},
    duelist:{name:'剑痴 · 鸦刃',hp:1050,posture:225,speed:137,scale:1.23,reach:149,color:'#d2aca1',boss:true,weapon:'dual',execution:380},
    warden:{name:'钟楼监军 · 玄戟',hp:1250,posture:275,speed:83,scale:1.56,reach:216,color:'#b9c5cf',boss:true,weapon:'halberd',armor:true,execution:440}
  };
  TYPES.bow.ranged=true;TYPES.axe.armor=true;
  const ENEMY_CATALOG=EnemyCatalog||{REGULAR:[],BOSSES:[],ALL:[],BY_ID:{}};
  // Expand the simulation to the full 96-enemy design catalog. The legacy ten types
  // keep their hand-authored behavior; every later entry uses its catalog move table.
  for(const spec of (ENEMY_CATALOG.ALL||[])){
    const legacy=!!TYPES[spec.id];
    const type=TYPES[spec.id]||(TYPES[spec.id]={
      name:spec.name,hp:spec.hp,posture:spec.posture,speed:spec.speed,scale:spec.scale||1,
      reach:spec.reach,color:spec.color||'#b8c0b5',weapon:spec.weapon||'sword'
    });
    Object.assign(type,{
      catalog:true,final:!!spec.final,catalogIndex:spec.index,stage:spec.stage,role:spec.role,unlock:spec.unlock,
      threat:spec.threat,xp:spec.xp,core:spec.core,elite:!!spec.elite,large:!!spec.large,humanoid:!!spec.humanoid,morphology:spec.morphology,mana:spec.mana??null,revives:!!spec.revives,
      art:spec.art,bodyPlan:spec.bodyPlan,bossKind:spec.bossKind,deathStyle:spec.deathStyle,rageAt:spec.rageAt,hybrid:!!spec.hybrid,combo:!!spec.combo,aura:spec.aura,auraRadius:spec.auraRadius,turnDelay:spec.turnDelay||.22,
      ranged:!!spec.ranged,armor:!!spec.armor||!!type.armor,boss:!!spec.boss||!!type.boss,
      execution:spec.execution??type.execution,weapon:legacy?(type.weapon||spec.weapon||'sword'):(spec.weapon||type.weapon||'sword'),
      ammo:/弓兵$/.test(spec.name)&&spec.weapon==='bow'&&spec.ammo===3?4:/弩兵$/.test(spec.name)&&spec.weapon==='crossbow'&&spec.ammo===4?6:legacy?(type.ammo??spec.ammo??null):(spec.ammo??type.ammo??null),flags:spec.flags||[]
    });
    if(!type.boss)type.name=spec.name.replace(/^精英\s*[·・]?\s*/,'').replace(/\s*[·・]?\s*精英$/,'');
    if(/投枪手$/.test(spec.name))type.weapon='javelin';
    for(const k of ['lateQuality','spectral','legs','heads','swarm','slide','burrow','dormantThreshold','dormantSeconds','dormantHeal','dormantOnce','unlimitedCorpses','autoConsume','shatterBlessing','reviveChances','hatch','rageOnWeak','offensiveSwitch','rapidLow'])type[k]=spec[k];
    const moveKeys=[];
    for(const move of (spec.moves||[])){
      MOVES[move.key]={...move,
        name:move.name,pose:move.pose||'sweep',wind:move.wind,active:move.active,recovery:move.recovery,
        range:move.range,lane:move.lane??(move.ranged?600:Math.max(38,Math.min(105,Math.round((move.range||120)*.36)))),
        damage:move.damage,posture:move.posture,ranged:!!move.ranged,lunge:move.lunge||0,
        both:!!move.both,ground:!!move.ground,special:move.special||'',flags:move.flags||[]
      };
      moveKeys.push(move.key);
    }
    if(!legacy)type.moveKeys=moveKeys;
  }
  for(const type of Object.values(TYPES))if(type?.boss){type.armor=true;type.flags=[...new Set([...(type.flags||[]),'armor'])];}
  for(const [id,elite] of [['rot_tentacle',false],['rot_tentacle_elite',true]]){
    TYPES[id]={name:elite?'巨型腐坏触手':'腐坏触手',hp:elite?220:95,posture:elite?145:60,speed:elite?22:30,scale:elite?1.4:1,reach:elite?215:160,color:'#8c676d',weapon:'tentacle',art:'tentacle',bodyPlan:'tentacle',stage:'mutant',humanoid:false,morphology:'nonhumanoid',elite,large:elite,role:'召唤物',threat:elite?3:1.2,xp:0,moveKeys:[id+'_m1',id+'_m2']};
    MOVES[id+'_m1']={name:'水平抽击',pose:'sweep',wind:.76,active:.22,recovery:.78,range:elite?225:170,lane:85,damage:elite?24:14,posture:elite?48:30,ranged:false,lunge:0,both:true,ground:false,flags:[]};
    MOVES[id+'_m2']={name:'下劈',pose:'overhead',wind:.92,active:.2,recovery:.85,range:elite?200:150,lane:72,damage:elite?28:18,posture:elite?55:36,ranged:false,lunge:0,both:false,ground:true,flags:[]};
  }
  TYPES.zombie={name:'僵尸',hp:72,posture:48,speed:74,scale:.95,reach:135,color:'#95a58e',weapon:'claw',art:'zombie',bodyPlan:'zombie',stage:'mutant',humanoid:true,morphology:'humanoid',elite:false,large:false,armor:false,revives:false,flags:[],unlock:999,lateQuality:true,role:'召唤物',threat:1,xp:0,moveKeys:['zombie_m1','zombie_m2','zombie_m3']};
  MOVES.zombie_m1={name:'抓挠',pose:'sweep',wind:.65,active:.18,recovery:.72,range:110,lane:48,damage:10,posture:23,ranged:false,lunge:70,flags:[],weight:1.8};
  MOVES.zombie_m2={name:'啃咬',pose:'bite',wind:.72,active:.22,recovery:.85,range:100,lane:45,damage:13,posture:25,ranged:false,lunge:55,flags:[],weight:1};
  MOVES.zombie_m3={name:'趔趄扑击',pose:'leap',wind:.86,active:.42,recovery:1.02,contactFraction:.7,range:135,lane:52,damage:16,posture:30,ranged:false,lunge:280,flags:[],weight:.7};
  TYPES.explosive_zombie={...TYPES.zombie,name:'自爆僵尸',hp:86,posture:48,speed:82,art:'explosiveZombie',color:'#a6b36c',moveKeys:['explosive_zombie_m1','explosive_zombie_m2','explosive_zombie_m3','explosive_zombie_m4']};
  for(let i=1;i<=3;i++)MOVES['explosive_zombie_m'+i]={...MOVES['zombie_m'+i],flags:[...MOVES['zombie_m'+i].flags]};
  MOVES.explosive_zombie_m4={name:'疫囊自爆',pose:'selfDestruct',wind:1.05,active:.2,recovery:.6,range:190,lane:105,damage:30,posture:48,ranged:false,lunge:0,both:true,flags:['selfDestruct','poison'],hpBelow:.8,mustExplodeBelow:.4,weight:.8};
  // Brood-only larvae stay outside the natural wave catalog.
  TYPES.poison_maggot={name:'毒蛆',hp:32,posture:24,speed:132,scale:.65,reach:95,color:'#b8c982',weapon:'organic',bodyPlan:'maggot',stage:'monster',humanoid:false,morphology:'nonhumanoid',elite:false,large:false,armor:false,unlock:999,lateQuality:true,role:'召唤物',threat:1,xp:0,flags:['poison'],core:'仅由腐沼母体孵化；啃咬和短跳命中或被格挡后爆浆死亡，普通格挡仍中毒，完美格挡免疫中毒。',moveKeys:['poison_maggot_m1','poison_maggot_m2']};
  MOVES.poison_maggot_m1={name:'啃咬',pose:'bite',wind:.52,active:.18,recovery:.65,range:75,lane:36,damage:7,posture:14,ranged:false,lunge:55,flags:['poison','poisonOnBlock','burstOnContact'],special:'中毒4 DPS，持续4s；普通格挡仍中毒，完美格挡免疫；命中或被格挡后爆浆死亡'};
  MOVES.poison_maggot_m2={name:'短距离跳跃',pose:'leap',wind:.68,active:.32,recovery:.78,contactFraction:.7,range:95,lane:42,damage:9,posture:18,ranged:false,lunge:460,flags:['poison','poisonOnBlock','burstOnContact'],special:'短距离跳跃；中毒4 DPS，持续4s；普通格挡仍中毒，完美格挡免疫；命中或被格挡后爆浆死亡'};
  // Fission offspring are dedicated summons, outside the natural wave catalog.
  TYPES.fission_spawn={name:'裂殖体',hp:41,posture:34,speed:118,scale:.7,reach:110,color:TYPES.e58.color,weapon:'organic',bodyPlan:'blob',stage:'monster',humanoid:false,morphology:'nonhumanoid',elite:false,large:false,armor:false,unlock:999,lateQuality:true,role:'裂殖召唤物',threat:1,xp:31,flags:[],core:'仅由复生体裂殖生成的小型肉团；使用撞击和滚压，不再裂殖。',moveKeys:['fission_spawn_m1','fission_spawn_m2']};
  MOVES.fission_spawn_m1={name:'撞击',pose:'thrust',wind:.55,active:.24,recovery:.6,range:105,lane:42,damage:10,posture:22,ranged:false,lunge:210,both:false,ground:false,flags:[],weight:1.5};
  MOVES.fission_spawn_m2={name:'滚压',pose:'spin',wind:.72,active:.38,recovery:.78,range:130,lane:48,damage:13,posture:27,ranged:false,lunge:360,both:false,ground:false,flags:[],weight:1};
  for(const id of ['duelist','warden']){TYPES[id].humanoid=true;TYPES[id].morphology='humanoid';}
  class Game {
    constructor(seed = 717) { this.seed = seed;this.hooks=new EventBus();this.rules={...DEFAULT_RULES};this.reset(); }
    random() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
    reset(stage = 0) {
      stage=clamp(Math.floor(stage)||0,0,STAGES.length-1);
      this.time=0; this.freeze=0; this.events=[]; this.enemies=[]; this.projectiles=[]; this.netZones=[]; this.tarZones=[]; this.enemyHazards=[];this.enemyCorpses=[];this.decoys=[]; this.nextId=1;this.pendingPress={};
      this.stage=stage; this.stageClear=false; this.clearTimer=0; this.status='playing';
      this.bounds={left:STAGES[stage].left,right:STAGES[stage].right};
      this.p={x:STAGES[stage].startX,y:550,z:0,vz:0,vx:0,vy:0,walkDistance:0,face:1,hp:150,grayHp:0,maxHp:150,
        state:'idle', t:0, invuln:0, dashCd:0, airDash:false, jumps:0, combo:0, comboGrace:0,
        guardCd:0, guardFlash:0,blockFlash:0,blockMultiGuard:0,hurt:0,attackBuffer:0,jumpBuffer:0,dashBuffer:0,guardBuffer:0,counter:0,
        canDownStrike:true,charge:0,jPending:false,jHold:0,wasJ:false,chargeSource:'j',lastRealDamage:-99,damageMultiplier:1,postureMultiplier:1,guardPostureMultiplier:1,dashMultiplier:1,grayRecoveryMultiplier:1,
        chargeMax:1.05,heavyMaxDamage:80,heavyDamageMultiplier:1,heavyRangeMultiplier:1,
        executionRange:260,executionChain:false,executionPathDamage:0,executionPathPosture:0,execQueue:[],execDuration:.83,execRushStacks:0,execRushUntil:-1,execInvuln:0,execGuardT:null,
        healCapBonus:0,evasionBase:0,evasionBonus:0,evasionFatigue:0,evasionFatiguePenalty:.02,lastEvasion:-99,evasionRecovery:0,probabilityMultiplier:1,critBase:0,critMultiplier:2,enemyTimeScale:1,enemySlow:1,enemySlowT:0,enemyDots:{},
        dashCharges:1,dashMaxCharges:1,dashRegen:0,airDashes:0,dashSpeedBoost:false,speedBoost:0,chargeSerial:0,dashDuration:.19,dashBloodDistance:0,
        downBounce:true,unlimitedDownStrike:false,downStrikeCount:0,downStrikeMax:1,downDamageMultiplier:1,downStrikeDamageGrowth:0,downRangeMultiplier:1,jumpMax:2,jumpHeightMultiplier:1,plungeStartZ:0,
        superArmor:0,ultimateForm:0,kills:0,execTarget:null,attackSpeedMultiplier:1,moveSpeedMultiplier:1,dashDistanceMultiplier:1,chargeRateBoost:1,chargeGlobalMultiplier:1,chargeSpeedPenalty:1,attackRangeMultiplier:1,visualScale:1.04,rockThrustRank:0,rockThrustActive:false,rockThrustFull:false,steadfastRank:0,steadfastHeavyMultiplier:1,swallowReturnRank:0,grayRecoveryWhileHit:0,attackSerial:0,dashSerial:0,stealth:false,dashInvulnBonus:0,thrustDamageMultiplier:1,thrustPostureMultiplier:1,thrustRangeMultiplier:1,chargeReadyAt:-99};
      this.stats={kills:0, parries:0, executions:0, maxCombo:0, damageTaken:0};
      this.hitChain=0; this.chainTimer=0; this.spawnStage(stage); this.emit('chapter',{stage});
    }
    spawn(type,x,y) {
      const base=TYPES[type];
      const e={id:this.nextId++,type,bossKind:base.bossKind,x,y,z:0,face:-1,hp:base.hp,maxHp:base.hp,posture:base.posture,maxPosture:base.posture,
        state:'idle',t:0,cd:.65+this.random()*.7,stun:0,flash:0,red:0,scale:base.scale,
        cycle:0,queue:[],attack:null,damageDone:false,alerted:false,dead:false,deathT:0,knockX:0,knockY:0,
        sinceHit:0,enraged:false,walkDistance:0,vx:0,vy:0,recoveryTotal:0,guardReaction:0,ammo:base.ammo??null,mana:base.mana??null,knockVz:0,aiPhase:this.random()*Math.PI*2,aiMood:.82+this.random()*.36,xpMultiplier:1,attackMultiplier:1,actionSpeedMultiplier:1,tempoT:0,moveBuff:1,damageBuff:1,revived:false,splitDone:false,specialUsed:{},summoned:false,postureLock:0,loiterT:0,patienceLimit:(base.ranged?8.5:6.5)+this.random()*(base.ranged?4.5:3.5),forcedAggro:false,attackLockExempt:false,pendingStun:false};
      this.enemies.push(e); return e;
    }
    spawnStage(stage) {
      for(const [type,x,y] of STAGES[stage].enemies)this.spawn(type,x,y);
    }
    get chapter(){return Math.floor(this.stage/3);}
    get stageInfo(){return STAGES[this.stage];}
    emit(type,data={}) {const {type:entityType,...payload}=data;this.events.push({...payload,...(entityType?{entityType}:{}),type});}
    trigger(name,data={}){
      const payload={game:this,player:this.p,...data};
      const cascade=name==='onAttackKill'||name==='onEnemyPostureBreak'||/^on.*Kill$/.test(name);
      if(cascade){this.cascadeQueue??=[];this.cascadeCount??=0;if(this.cascadeCount>=32||this.cascadeQueue.length){this.cascadeQueue.push({name,payload});return payload;}this.cascadeCount++;}
      return this.hooks.emit(name,payload);
    }
    flushCombatCascades(){
      this.cascadeCount=0;const queue=this.cascadeQueue||[];let index=0;
      // New cascades append to the same FIFO; no recursive explosion or dropped rewards.
      while(index<queue.length&&this.cascadeCount<32){const job=queue[index++];this.cascadeCount++;this.hooks.emit(job.name,job.payload);}
      if(index)queue.splice(0,index);
    }
    guardTime(){const p=this.p;return p.state==='charge'&&this.chargeGuardEnabled?.()?p.chargeGuardT??null:p.state==='execute'&&p.execDone?p.execGuardT:p.state==='guard'?p.t:null;}
    guardActive(){const t=this.guardTime();return t!==null&&t>=this.rules.guardStartup&&t<=this.rules.guardStartup+this.rules.guardWindow;}
    get evasionChanceBase(){const p=this.p;return clamp((p.evasionBase+(p.evasionBonus||0))*(p.probabilityMultiplier||1),0,.75);}
    get evasionChance(){const p=this.p;if(this.time<(p.flowEvasionUntil||0))return 1;return clamp(this.evasionChanceBase-(p.evasionFatigue||0)*(p.evasionFatiguePenalty||.02),0,.75);}
    postureBreakDuration(e){
      if(!isBoss(e))return 5;
      const progress=clamp(Number.isFinite(e?.bossProgress)?e.bossProgress:(this.time-240)/675,0,1);
      return 5*(.75-.25*progress);
    }
    executionDamage(e){
      if(!isBoss(e))return e.hp;
      if(TYPES[e.type]?.final)return e.maxHp*.20;
      // Keep a boss-specific fixed component while letting executions remain meaningful
      // after survival scaling greatly increases the target's health pool.
      return (TYPES[e.type].execution||0)*.20+e.maxHp*.20;
    }
    healEnemy(enemy,amount,{source='natural',healerType=null,quiet=false}={}){if(!enemy||enemy.dead)return 0;if(enemy.antiRegen||enemy.antiRegenSerum)amount*=isBoss(enemy)?.5:0;const gain=Math.min(Math.max(0,amount),Math.max(0,enemy.maxHp-enemy.hp));enemy.hp+=gain;if(gain&&!quiet)this.emit('enemyHeal',{x:enemy.x,y:enemy.y,amount:gain,source,healerType:healerType||enemy.type});return gain;}
    heal(amount,{source='ordinary',breakthrough=false,quiet=false}={}){
      const p=this.p;if(p.hp+p.grayHp<=0||this.status!=='playing')return 0;
      amount*=1+Math.max(0,Number(this.healingBonus?.({source,breakthrough})||0));
      // Base healing may now fill 100% max life. Each breakthrough raises the global
      // healing ceiling by another 25% max life for every healing source (V13).
      const ceiling=p.maxHp*(1+(p.healCapBonus||0));
      const gain=Math.min(Math.max(0,amount),Math.max(0,ceiling-p.hp-p.grayHp));
      p.hp+=gain;if(gain>0){this.trigger('onHeal',{amount:gain,source,breakthrough});if(!quiet)this.emit('heal',{x:p.x,y:p.y,amount:gain,source});}return gain;
    }
    canDash(){return this.p.dashCharges>0&&!(this.p.z>0&&this.p.airDash);}
    dashCooldown(){return Math.max(.6,2.0*this.p.dashMultiplier);}
    spendDash(){const p=this.p;p.dashCharges=Math.max(0,p.dashCharges-1);if(p.dashRegen<=0)p.dashRegen=this.dashCooldown();p.dashCd=p.dashRegen;}
    resetDashes(){const p=this.p;p.dashCharges=p.dashMaxCharges;p.dashRegen=0;p.dashCd=0;p.airDashes=0;p.airDash=false;}
    drainEvents() {const out=this.events;this.events=[];return out;}
    hitstop(seconds) {this.freeze=Math.max(this.freeze,seconds);}
    isSmallEnemy(e){const base=e&&TYPES[e.type];return !!e&&!isBoss(e)&&!base?.large&&!base?.elite;}
    launchEnemy(e,fromX,fromY,{force=900,lift=430,duration=.88,allowElite=false,eliteForceScale=1,source=null,bowlingChainSecondary=false,bowlingChainVisited=null}={}){
      if(!e||e.dead)return false;
      if(TYPES[e.type]?.final)return false;
      const request=this.trigger('beforeEnemyLaunch',{enemy:e,fromX,fromY,force,lift,duration,allowElite,eliteForceScale});
      const small=this.isSmallEnemy(e),elite=!!TYPES[e.type]?.elite&&!e.eliteLost&&!isBoss(e);
      if(!small&&!(elite&&request.allowElite)){
        const dx=e.x-fromX,dy=e.y-fromY,len=Math.hypot(dx,dy)||1;
        e.knockX=dx/len*Math.min(force*.24,170);e.knockY=dy/len*Math.min(force*.10,70);
        if(e.state!=='stunned'){e.state='flinch';e.t=Math.max(e.t||0,.24);e.queue=[];}
        return false;
      }
      if(elite){const scale=clamp(request.eliteForceScale||1,.12,.55);force*=scale;lift*=scale;duration=Math.min(duration,.55);}
      let dx=e.x-fromX,dy=e.y-fromY,len=Math.hypot(dx,dy);if(len<4){dx=e.id%2?1:-1;dy=.12;len=Math.hypot(dx,dy);}
      e.state='knockdown';e.t=duration;e.queue=[];e.damageDone=true;e.attack=null;e._bowlingHit=new Set();e._bowlingChainSecondary=bowlingChainSecondary;e._bowlingChainVisited=bowlingChainVisited;e._bowlingLastX=e.x;e._bowlingLastY=e.y;
      e.knockX=dx/len*force;e.knockY=dy/len*force*.22;e.knockVz=lift;e.z=Math.max(e.z||0,2);
      e.launchPeakZ=Math.max(e.launchPeakZ||0,e.z);
      this.trigger('onEnemyLaunch',{enemy:e,fromX,fromY,force,lift,duration,source});this.emit('launch',{x:e.x,y:e.y,z:e.z,type:e.type});return true;
    }
    launchCorpse(e,fromX,fromY,{force=850,lift=230,rank=1,overkill=0}={}){
      if(!e?.dead||e.dummy||isBoss(e)||e.corpseLocked)return false;
      let dx=e.x-fromX,dy=e.y-fromY,len=Math.hypot(dx,dy);if(len<4){dx=this.p.face||1;dy=0;len=1;}
      e.knockX=dx/len*force;e.knockY=dy/len*force*.22;e.knockVz=lift;e.z=Math.max(2,e.z||0);e.deathT=0;
      e._bowlingProjectile={rank,overkill,hit:new Set(),lastX:e.x,lastY:e.y};
      this.emit('launch',{x:e.x,y:e.y,z:e.z,type:e.type,corpse:true});return true;
    }
    get executeTarget() {
      return this.enemies.filter(e=>!e.dead&&!e.furnaceCapture&&!e.groundDrag&&!(e.timeSealT>0)&&e.state==='stunned'&&distance(e,this.p)<this.p.executionRange&&(!this.p.alphaRank||!this.viewBounds||e.x>=this.viewBounds.left&&e.x<=this.viewBounds.right))
        .sort((a,b)=>distance(a,this.p)-distance(b,this.p))[0]||null;
    }
    startAttack() {
      const p=this.p,base=ATTACKS[p.combo],speed=Math.max(.55,p.attackSpeedMultiplier||1);
      p.state='attack';p.t=0;p.attack={...base,baseRange:base.range,range:base.range*(p.attackRangeMultiplier||1),wind:base.wind/speed,recovery:base.recovery/speed};p.attackIndex=p.combo;p.hitIds=new Set();p.attackBuffer=0;p.swingSound=false;p.attackSerial++;
      if(p.counter>0){p.t=p.attack.wind*.24;p.counter=0;}
      this.trigger('onAttackStart',{index:p.attackIndex,serial:p.attackSerial});
      this.emit('swingStart',{x:p.x,y:p.y,z:p.z,index:p.attackIndex});
    }
    startPlunge() {
      const p=this.p;if(!p.canDownStrike&&!p.unlimitedDownStrike)return false;p.canDownStrike=p.unlimitedDownStrike;p.state='plunge';p.t=0;p.vz=-880;p.combo=0;p.comboGrace=0;
      p.hitIds=new Set();p.attackBuffer=0;p.plungeStartZ=p.z;p.attackSerial++;this.trigger('onAttackStart',{index:'plunge',serial:p.attackSerial});this.emit('plungeStart',{x:p.x,y:p.y,z:p.z});
    }
    startCharge(source='l'){const p=this.p;p.state='charge';p.charge=0;p.t=0;p.attackBuffer=0;p.chargeReady=false;p.chargeSource=source;p.jPending=false;p.chargeRateBoost=p.chargeGlobalMultiplier||1;p.chargeSerial=(p.chargeSerial||0)+1;this.trigger('onChargeStart',{source,serial:p.chargeSerial});this.emit('chargeStart',{x:p.x,y:p.y});}
    releaseHeavy(){
      const p=this.p,q=clamp(p.charge/p.chargeMax,0,1);p.state='heavy';p.t=0;p.hitIds=new Set();p.swingSound=false;p.combo=0;
      p.attack={wind:.10,active:.23,recovery:.34,baseRange:145+q*40,range:(145+q*40)*p.heavyRangeMultiplier*(p.attackRangeMultiplier||1),lane:49*p.heavyRangeMultiplier,damage:(29+q*(p.heavyMaxDamage-29))*p.heavyDamageMultiplier*(p.steadfastHeavyMultiplier||1),posture:25+q*42};
      p.fullCharge=q>=.98;p.attackIndex=3;p.attackSerial++;this.trigger('onHeavyRelease',{fullCharge:p.fullCharge,serial:p.attackSerial,peakAge:p.fullCharge?Math.max(0,this.time-(p.chargeReadyAt||this.time)):999});
    }
    startThrust(input){
      const p=this.p,rock=p.state==='charge'&&(p.rockThrustRank||0)>0,chargeRatio=rock?clamp(p.charge/Math.max(.01,p.chargeMax),0,1):0;
      if(p.state!=='dash')this.spendDash();if(input.a||input.d)p.face=input.d?1:-1;
      p.state='thrust';p.t=0;p.hitIds=new Set();p.swingSound=false;p.attackBuffer=0;p.dashBuffer=0;p.combo=0;p.jPending=false;p.rockThrustActive=rock;p.rockThrustFull=rock&&chargeRatio>=.98;
      if(rock){const r=p.rockThrustRank,range=[0,188,238,262][r]*(p.attackRangeMultiplier||1)*(p.thrustRangeMultiplier||1),lane=[0,48,70,78][r],damage=[0,48+72*chargeRatio,55+88*chargeRatio,62+110*chargeRatio][r]*(p.thrustDamageMultiplier||1),posture=[0,34+48*chargeRatio,40+60*chargeRatio,48+74*chargeRatio][r]*(p.thrustPostureMultiplier||1);p.attack={wind:.075,active:.23,recovery:.29,baseRange:[0,188,238,262][r],range,lane,damage,posture};}
      else p.attack={wind:.055,active:.19,recovery:.23,baseRange:152,range:152*(p.attackRangeMultiplier||1)*(p.thrustRangeMultiplier||1),damage:30*(p.thrustDamageMultiplier||1),posture:26*(p.thrustPostureMultiplier||1)};
      p.invuln=0; // Ascensions can explicitly grant defensive frames to this thrust.
      p.attackIndex=2;p.attackSerial++;this.trigger('onAttackStart',{index:rock?'rockThrust':'thrust',serial:p.attackSerial});
      if(rock){p.fullCharge=p.rockThrustFull;this.trigger('onHeavyRelease',{fullCharge:p.fullCharge,serial:p.attackSerial,rockThrust:true});}
      if(p.counter>0){p.counter=0;p.attack.posture+=12;this.trigger('onThrustPerfectTiming');}
      this.emit(rock?'rockThrustStart':'thrustStart',{x:p.x,y:p.y,z:p.z,rank:p.rockThrustRank,charge:chargeRatio,full:p.rockThrustFull,face:p.face,length:p.attack.range});
    }
    startDash(input) {
      const p=this.p;let dx=(input.d?1:0)-(input.a?1:0),dy=(input.s?1:0)-(input.w?1:0);
      if(!dx&&!dy)dx=p.face;
      const length=Math.hypot(dx,dy);p.dashX=dx/length;p.dashY=dy/length;
      this.spendDash();p.state='dash';p.t=0;p.invuln=.235+(p.dashInvulnBonus||0);p.vz=0;p.comboGrace=.65;p.dashSerial++;p.dashDuration=.19;p.dashBloodDistance=0;
      p.dashStartedAir=p.z>0;if(p.z>0){p.airDashes++;p.airDash=p.airDashes>=p.dashMaxCharges;}if(dx)p.face=Math.sign(dx);
      p.dashBuffer=0;p.vx=p.dashX*260;p.vy=p.dashY*180;
      this.emit('dash',{x:p.x,y:p.y,z:p.z,face:p.face});this.trigger('onDashStart',{x:p.x,y:p.y,z:p.z,face:p.face,serial:p.dashSerial});
    }
    applyPlayerDot(type,dps,duration,source='enemy'){
      const p=this.p;p.enemyDots??={};const old=p.enemyDots[type];
      p.enemyDots[type]={dps:Math.max(dps,old?.dps||0),remaining:Math.max(duration,old?.remaining||0),tick:old?.tick||0,source};
      this.emit('playerAilment',{ailment:type,dps,duration});
    }
    damagePlayerDot(amount,type='dot'){
      const p=this.p;if(amount<=0||this.status!=='playing'||p.hp<=0)return;
      const damage=Math.max(0,this.hooks.modify('realDamage',amount*(p.hunterMarkT>0?1.2:1),{enemy:null,arrow:null,dot:true,status:type}));
      p.hp=Math.max(0,p.hp-damage);p.lastRealDamage=this.time;this.stats.damageTaken+=damage;
      this.trigger('onRealDamageTaken',{amount:damage,grayLost:0,enemy:null,arrow:null,dot:true,status:type,superArmor:p.superArmor>0});
      this.emit('playerDot',{x:p.x,y:p.y,z:p.z+44,damage,status:type});
      if(p.hp<=0){const death=this.trigger('beforeDeath',{enemy:null,arrow:null,damage,preHitGray:p.grayHp,prevent:false,dot:true,status:type});if(!death.prevent){this.status='dead';this.emit('defeat');}}
    }
    updatePlayerAilments(dt){
      const p=this.p;
      if(p.enemySlowT>0){p.enemySlowT=Math.max(0,p.enemySlowT-dt);if(p.enemySlowT<=0)p.enemySlow=1;}
      for(const [type,status] of Object.entries(p.enemyDots||{})){
        const active=Math.min(dt,status.remaining);status.remaining-=dt;status.tick+=active;
        if(status.tick>=.5||status.remaining<=0){const elapsed=status.tick;status.tick=0;this.damagePlayerDot(status.dps*elapsed,type);}
        if(status.remaining<=0)delete p.enemyDots[type];if(this.status!=='playing')break;
      }
    }
    resolveEnemyMoveSpecial(e,a,result='effect'){
      if(!e||!a)return;const flags=a.flags||[],special=a.special||'',hit=result==='hit';
      const blocked=['block','block-protected','block-reflect'].includes(result);
      if((hit||blocked&&flags.includes('poisonOnBlock'))&&flags.includes('poison'))this.applyPlayerDot('poison',special.includes('7 DPS')?7:special.includes('6 DPS')?6:4,4,e.type);
      if(flags.includes('burstOnContact')&&(hit||blocked||result==='parry'||result==='dead')){
        if(!e.contactBurstDone){
          e.contactBurstDone=true;
          this.emit('maggotBurst',{x:e.x,y:e.y,z:e.z||0,scale:e.scale});
          if(!e.dead)this.kill(e,['otherSpecial','selfDestruct']);
          // Parry retaliation may already have killed this fragile unit.
          e.noCorpse=e.corpseLocked=true;e.knockX=e.knockY=e.knockVz=e.z=0;e._bowlingProjectile=null;
        }
        return;
      }
      if(hit&&flags.includes('burn'))this.applyPlayerDot('burn',5,3,e.type);
      if(hit&&flags.includes('bleed'))this.applyPlayerDot('bleed',4,4,e.type);
      if(hit&&flags.includes('hunterMark'))this.p.hunterMarkT=5;
      if(hit&&flags.includes('tongue')){e.tonguePullT=.28;e.tongueX=this.p.x-e.face*52;e.tongueY=this.p.y;this.emit('enemyTonguePull',{x:e.x,y:e.y,toX:this.p.x,toY:this.p.y});}
      if(hit&&flags.includes('pull')){
        const m=special.match(/拉近(?:约)?\s*(\d+)/),pull=m?Number(m[1]):140,dx=e.x-this.p.x,dy=e.y-this.p.y,len=Math.hypot(dx,dy)||1;
        this.p.x+=dx/len*Math.min(pull,Math.abs(dx));this.p.y+=dy/len*Math.min(pull*.35,Math.abs(dy));this.emit('enemyPull',{x:this.p.x,y:this.p.y,source:e.type});
      }
      if(hit&&flags.includes('slow')){
        const m=special.match(/减速\s*(\d+)%/),slow=m?1-Number(m[1])/100:.65;this.p.enemySlow=Math.min(this.p.enemySlow||1,slow);this.p.enemySlowT=Math.max(this.p.enemySlowT||0,1.8);
      }
      if(flags.includes('boneHook')&&hit){const dx=e.x-this.p.x,dy=e.y-this.p.y;this.p.x+=Math.sign(dx)*Math.min(180,Math.max(0,Math.abs(dx)-70));this.p.y+=dy*.6;this.p.hookRoot=.25;e.queue=['e37_m2'];this.emit('boneHookPull',{x:e.x,y:e.y,toX:this.p.x,toY:this.p.y});}
      if(flags.includes('heal')){const ally=this.enemies.filter(o=>!o.dead&&o!==e&&distance(o,e)<430&&o.hp<o.maxHp*.8).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];e.healCd=12;if(ally)this.healEnemy(ally,Math.max(9,ally.maxHp*.065),{source:'priest',healerType:e.type});}
      if(flags.includes('bloodReload')&&e.ammo<=0&&e.hp>e.maxHp*.12){this.damageEnemy(e,e.maxHp*.12,0,['bloodReload'],{secondary:true,flinch:false});e.ammo=3;this.emit('enemyReload',{x:e.x,y:e.y,type:e.type});}
      if(flags.includes('consumeCorpse')||flags.includes('raiseZombie')){
        const corpse=this.enemyCorpses.find(c=>c.id===e.castCorpseId&&c.life>0&&!c.used);
        if(corpse&&distance(corpse,e)<(flags.includes('raiseZombie')?460:200)){
          corpse.used=true;
          if(flags.includes('raiseZombie')){this.spawnEnemyMinion(e,'zombie',corpse.x,corpse.y);e.raiseCd=4;}
          else if((TYPES[e.type].unlimitedCorpses||(e.corpseStacks||0)<5)){e.corpseStacks=(e.corpseStacks||0)+1;e.scale=TYPES[e.type].scale*(1+e.corpseStacks*.075);e.consumeCd=2;this.healEnemy(e,e.maxHp*.045,{source:'consumeCorpse'});this.emit('enemyConsume',{x:e.x,y:e.y,stacks:e.corpseStacks,enemyType:e.type});}
        }
      }
      if(flags.includes('summonTentacle')){this.spawnEnemyMinion(e,'rot_tentacle',e.x+e.face*90,e.y);e.summonCd=8;}
      if(flags.includes('sacrifice')&&e.hp<e.maxHp*.5&&!e.sacrificeDone){e.sacrificeDone=true;this.spawnEnemyMinion(e,e.type==='rot_priest'?'rot_tentacle_elite':'rot_tentacle',e.x,e.y);this.kill(e,['otherSpecial','sacrifice']);}
      if(flags.includes('buff')){
        if(e.type==='e14')e.hornCd=14;
        for(const ally of this.enemies){
          if(ally.dead||distance(ally,e)>440)continue;const horn=e.type==='e14';ally.tempoT=Math.max(ally.tempoT||0,horn?5:6);ally.moveBuff=Math.max(ally.moveBuff||1,horn?1.22:1.10);ally.actionSpeedMultiplier=Math.max(ally.actionSpeedMultiplier||1,horn?1.18:1.12);ally.damageBuff=Math.max(ally.damageBuff||1,horn?1:1.08);if(horn){ally.alerted=true;ally.loiterT=Math.max(ally.loiterT||0,(ally.patienceLimit||8)-2);}
        }
        this.emit('enemyBuff',{x:e.x,y:e.y,radius:420});
      }
      if(flags.includes('summon')&&!e.specialUsed.summon){
        e.specialUsed.summon=true;const stage=TYPES[e.type].stage,target=stage==='monster'?'e51':stage==='mutant'?'e25':'sword';
        for(let i=0;i<2;i++){const child=this.spawn(TYPES[target]?target:'sword',clamp(e.x+(i?1:-1)*(80+this.random()*35),this.bounds.left+30,this.bounds.right-30),clamp(e.y+(i?1:-1)*30,420,675));child.summoned=true;child.xpMultiplier=.35;child.spawnDelay=.35;child.alerted=true;child.waveId=null;}
        this.emit('enemySummon',{x:e.x,y:e.y,type:e.type});
      }
      if(/装填/.test(a.name+special)&&!flags.includes('bloodReload')){e.ammo=Math.max(e.ammo||0,1);this.emit('enemyReload',{x:e.x,y:e.y,type:e.type});}
      if(flags.includes('selfDestruct')){
        // The move's own active hitbox is the explosion. Do not apply a second hidden hit
        // after the visible attack resolves; this keeps one tell = one defensive timing.
        this.emit('enemyExplosion',{x:e.x,y:e.y,radius:Math.max(185,a.range||0)});
        this.kill(e,['otherSpecial','selfDestruct']);
      }
    }
    blockHit(damage,e,arrow,{source='guard',prepaidSpirit=false}={}) {
      const p=this.p;
      // Normal blocks aggregate extremely tight multi-hit bursts (e.g. shotgun pellets)
      // into a single recoverable-damage event. This is deliberately NOT p.invuln:
      // unguarded hits still land normally, and perfect blocks still resolve per projectile.
      if((p.blockMultiGuard||0)>0){
        p.blockFlash=.18;let result='block-protected';
        if(arrow&&p.swallowReturnRank){
          arrow.reflected=true;arrow.warned=true;arrow.z=p.z+45;arrow.reflectRank=p.swallowReturnRank;
          this.aimReflectedProjectile(arrow,e,1050);arrow.life=2;arrow.owner=e?e.id:null;arrow.damage=[35,45,55,60][p.swallowReturnRank];this.trigger('onProjectileReflect',{arrow,enemy:e});this.scatterReflection(arrow);
          result='block-reflect';this.emit('normalReflect',{x:p.x+p.face*28,y:p.y,z:p.z+48,rank:p.swallowReturnRank});
        }
        this.emit('block',{x:p.x+p.face*25,y:p.y,z:p.z+48,...this.guardVisualState?.(),source,grayAmount:0,momentumCost:0,multihitProtected:true});this.hitstop(.012);return result;
      }
      // Gray health is recoverable injury, not a second life bar. Once real HP reaches
      // zero the hit is lethal unless a beforeDeath effect (for example Immortal) prevents it.
      if(p.hp<=0)return 'dead';
      const amount=Math.min(p.hp,Math.max(0,this.hooks.modify('grayConversion',damage*this.rules.grayConversion,{enemy:e,arrow,source})));
      const gate=this.trigger('beforeRecoverableBlock',{amount,damage,enemy:e,arrow,source,prepaidSpirit,preventGray:prepaidSpirit,momentumCost:0,guardPostureMultiplier:1});
      let grayAmount=amount;
      if(gate.preventGray)grayAmount=0;
      else{p.hp-=amount;p.grayHp+=amount;this.trigger('onRecoverableDamageTaken',{amount,enemy:e,arrow,source});}
      if(p.hp<=0){
        const death=this.trigger('beforeDeath',{enemy:e,arrow,damage,preHitGray:p.grayHp,prevent:false,recoverable:true,source});
        if(!death.prevent){this.status='dead';this.emit('guardCollapse',{x:p.x,y:p.y,z:p.z+48});this.emit('defeat');return 'dead';}
      }
      p.blockFlash=.18;p.blockMultiGuard=Math.max(p.blockMultiGuard||0,.10);
      this.trigger('onBlock',{enemy:e,damage,arrow,source,grayAmount,momentumCost:gate.momentumCost||0});
      if(e&&!e.dead&&!e.furnaceCapture&&!arrow)this.damageEnemy(e,0,(gate.guardPostureMultiplier||1)*this.hooks.modify('guardPosture',Math.max(7,(e.attack?.posture||32)*.24)*(p.guardPostureMultiplier||1),{enemy:e,arrow,source}),'block');
      let result='block';
      if(arrow&&p.swallowReturnRank){
        arrow.reflected=true;arrow.warned=true;arrow.z=p.z+45;arrow.reflectRank=p.swallowReturnRank;
        this.aimReflectedProjectile(arrow,e,1050);arrow.life=2;arrow.owner=e?e.id:null;arrow.damage=[35,45,55,60][p.swallowReturnRank];this.trigger('onProjectileReflect',{arrow,enemy:e});this.scatterReflection(arrow);
        result='block-reflect';this.emit('normalReflect',{x:p.x+p.face*28,y:p.y,z:p.z+48,rank:p.swallowReturnRank});
      }
      this.emit('block',{x:p.x+p.face*25,y:p.y,z:p.z+48,...this.guardVisualState?.(),source,grayAmount,momentumCost:gate.momentumCost||0});this.hitstop(.025);return result;
    }
    resolvePerfectBlock(e,arrow,{source='guard',preservePlayer=false,reflectArrow=true}={}) {
      if(this.p.state==='charge'&&this.chargeGuardEnabled?.())preservePlayer=true;
      const p=this.p,saved=preservePlayer?{state:p.state,t:p.t,combo:p.combo,attack:p.attack,attackIndex:p.attackIndex,hitIds:p.hitIds,swingSound:p.swingSound,attackBuffer:p.attackBuffer}:null;
      if(!preservePlayer){p.state='idle';p.t=0;p.guardCd=0;p.counter=.5;}
      p.guardFlash=.22;p.invuln=Math.max(p.invuln,.10);this.stats.parries++;this.hitstop(.065);
      this.emit('parry',{x:p.x+p.face*28,y:p.y,z:p.z+48,...this.guardVisualState?.(),arrow:!!arrow,source});
      if(arrow&&reflectArrow){
        arrow.reflected=true;arrow.warned=true;arrow.z=p.z+45;
        this.aimReflectedProjectile(arrow,e,1100);
        arrow.life=2;arrow.owner=e?e.id:null;arrow.damage=[35,45,55,60][p.swallowReturnRank||0];arrow.reflectRank=Math.max(arrow.reflectRank||0,p.swallowReturnRank||0);this.trigger('onProjectileReflect',{arrow,enemy:e});this.scatterReflection(arrow);
      } else if(e&&!e.dead&&!e.furnaceCapture) {
        const postureEvent=this.hooks.emit('modify:perfectPosture',{value:this.hooks.modify('guardPosture',(e.attack?e.attack.posture:35)*(p.guardPostureMultiplier||1),{enemy:e,arrow,source}),enemy:e,arrow,source});
        this.damageEnemy(e,3,postureEvent.value,'parry',{instantPostureBreak:!!postureEvent.instantBreak});
        if(e.state!=='stunned'&&!e.dead&&!e.furnaceCapture){
          const keepChain=(isBoss(e)||e.type==='dual')&&e.queue.length;
          this.recoverEnemy(e,keepChain?.12:.34);if(!keepChain)e.queue=[];e.knockX=p.face*(isBoss(e)?25:100);
        }
      }
      this.trigger('onPerfectBlock',{enemy:e,arrow,source});
      if(saved&&p.state!=='hurt'&&p.state!=='execute')Object.assign(p,saved);
      return 'parry';
    }
    parry(e,arrow){
      const result=this.resolvePerfectBlock(e,arrow,{source:'guard',preservePlayer:true,reflectArrow:true});
      // A successful manual perfect block immediately refreshes the guard cooldown.
      // Clear any pre-existing buffered guard press so opening a fresh perfect window
      // still requires a deliberate new K input after the parry lands.
      this.p.guardCd=0;this.p.guardBuffer=0;this.p.counter=.5;return result;
    }
    receiveHit(damage,e,arrow) {
      if(this.p.state==='thrust'&&this.thrustInvulnerable?.())return 'immune';
      const p=this.p;if(p.hp<=0||p.state==='execute'&&p.invuln>0&&!this.guardActive())return 'immune';
      if(p.hunterMarkT>0)damage*=1.2;
      if(this.guardActive()){
        const targetBonus=Math.max(0,this.hooks.modify('perfectWindowAgainst',0,{enemy:e,arrow}));
        if(this.guardTime()<=this.rules.guardStartup+this.rules.perfectWindow+targetBonus){this.parry(e,arrow);return 'parry';}
        return this.blockHit(damage,e,arrow,{source:'guard'});
      }
      const autoDefense=this.trigger('beforeAutoDefense',{damage,rawDamage:damage,enemy:e,arrow,handled:false,result:null});
      if(autoDefense.handled)return autoDefense.result||'immune';
      if(p.state==='dash'){this.trigger('onEnemyAttackMiss',{enemy:e,move:e.attack,evaded:true,dash:true});return 'immune';}
      if(p.invuln>0)return 'immune';
      if(this.evasionChance>0&&this.random()<this.evasionChance){
        p.evasionFatigue=Math.min(10,p.evasionFatigue+1);p.lastEvasion=this.time;p.evasionRecovery=0;p.invuln=.14;
        this.emit('evasion',{x:p.x,y:p.y,z:p.z});this.trigger('onEvasion',{enemy:e,arrow,chance:this.evasionChance});return 'evade';
      }
      const intercept=this.trigger('beforeRealHit',{damage,enemy:e,arrow,handled:false,result:null});
      if(intercept.handled)return intercept.result||'immune';
      const rawDamage=damage;damage=Math.max(0,this.hooks.modify('realDamage',damage,{enemy:e,arrow,rawDamage}));const preHitGray=p.grayHp;
      const grayLost=Math.min(p.grayHp,Math.max(0,this.hooks.modify('grayLossOnHit',p.grayHp*this.rules.grayLossOnHit,{enemy:e})));
      p.grayHp-=grayLost;const spill=Math.max(0,damage-p.hp);p.hp=Math.max(0,p.hp-damage);p.grayHp=Math.max(0,p.grayHp-spill);
      p.lastRealDamage=this.time;p.invuln=Math.max(0,this.hooks.modify('hitInvuln',.58,{enemy:e,arrow,rawDamage,damage}));p.hurt=.3;
      const chargeArmor=p.state==='charge'&&(p.steadfastRank||0)>0;
      if(p.superArmor>0||chargeArmor){p.hurt=.16;p.knock=0;}
      else{if(p.state==='execute'){p.execTarget=null;p.execQueue=[];p.execSoulLinkTargets=new Set();p.execGuardT=null;}p.state='hurt';p.t=0;p.combo=0;p.attackBuffer=0;p.vx=p.vy=0;const chargeHit=e?.attack?.lunge>0&&!arrow;p.knock=(chargeHit?e.face:(e?Math.sign(p.x-e.x)||e.face:-(Math.sign(arrow?.vx)||p.face)))*(chargeHit?150:190);}
      this.trigger('onRealDamageTaken',{amount:damage,rawDamage,grayLost,enemy:e,arrow,superArmor:p.superArmor>0});
      this.stats.damageTaken+=damage;this.hitChain=0;this.chainTimer=0;
      this.emit('playerHit',{x:p.x,y:p.y,z:p.z+44,damage});this.hitstop(.08);
      if(p.hp<=0){const death=this.trigger('beforeDeath',{enemy:e,arrow,damage,preHitGray,prevent:false});if(!death.prevent){this.status='dead';this.emit('defeat');}}
      return 'hit';
    }
    damageEnemy(e,damage,posture,kind='normal',options={}) {
      if(e.dead||e.furnaceCapture||e.groundDrag&&!isBoss(e))return;
      const tags=tagsFor(kind);kind=tags[0];
      if(e.mindControlT>0&&!tags.includes('mindControl'))return;
      const canSealDevour=!isBoss(e);
      if(e.timeSealT>0&&!tags.includes('timeSeal')&&!this.p.canAttackTimeSeal){if(canSealDevour&&!options.secondary&&tags.includes('heavy')&&this.p.spaceSealDevour){this.trigger('onSpaceSealDevour',{enemy:e});}return;}
      if(canSealDevour&&e.timeSealT>0&&!options.secondary&&tags.includes('heavy')&&this.p.spaceSealDevour){this.trigger('onSpaceSealDevour',{enemy:e});return;}
      const defensive=kind==='parry'||kind==='block'||(kind==='otherSpecial'&&damage<=3);
      const secondary=!!options.secondary,direct=!defensive&&!secondary;
      let attackContext={};
      if(direct&&kind!=='execution'){
        const result=this.trigger('beforeAttackDamage',{enemy:e,damage:damage*this.p.damageMultiplier,posture:posture*this.p.postureMultiplier,tags});
        attackContext=result;damage=result.damage;posture=result.posture;
      }
      // Whirlwind's rear hit and extra rings share one settlement per target.
      // Scale after direct bonuses, before target-wide vulnerabilities.
      if(options.contactMultiplier!==undefined){damage*=options.contactMultiplier;posture*=options.contactMultiplier;}
      // Fixed fire-arc damage bypasses attack/critical scaling, but respects enemy vulnerabilities.
      damage+=(options.contactBonusDamage||0)+(attackContext.contactBonusDamage||0);posture+=(options.contactBonusPosture||0)+(attackContext.contactBonusPosture||0);
      const globalDamage=this.trigger('beforeEnemyDamage',{enemy:e,damage,posture,tags,direct,secondary,periodic:!!options.periodic,executionBonus:options.executionBonus||1});damage=globalDamage.damage;posture=globalDamage.posture;
      // Final-boss executions pass through ascension and vulnerability hooks above.
      // Cap the actual hit after both execution bonus budgets at 30% of maximum HP.
      if(TYPES[e.type]?.final&&tags.includes('execution')&&!options.secondary)damage=Math.min(damage,e.maxHp*.30);
      damage=Math.max(0,damage);posture=Math.max(0,posture);
      const melee=direct&&!options.periodic&&tags.some(t=>['normal','comboFinisher','heavy','thrust','downStrike'].includes(t));
      const guardFlags=e.attack?.flags||[],stance=!e.offensive&&(e.state==='windup'&&guardFlags.some(f=>['parryStance','guardStance','spikeGuard'].includes(f))||['windup','active'].includes(e.state)&&guardFlags.includes('shieldAdvance'));
      if(stance&&melee&&!attackContext.shadowSlash&&!e.guardConsumed&&(this.p.x-e.x)*e.face>0){
        e.guardReaction=.22;this.emit('shieldBlock',{x:e.x,y:e.y});
        if(guardFlags.includes('parryStance')){e.guardConsumed=true;e.queue=[TYPES[e.type].moveKeys.find(k=>MOVES[k].flags.includes('counter'))];this.recoverEnemy(e,.08);}
        else{
          if(guardFlags.includes('spikeGuard')&&(e.spikeGrayCd||0)<=0){const gray=Math.max(0,Math.min(this.p.hp-1,this.p.maxHp*.04,damage*.5));this.p.hp-=gray;this.p.grayHp+=gray;e.spikeGrayCd=.14;if(gray>0){this.trigger('onRecoverableDamageTaken',{amount:gray,enemy:e,source:'spikeShield'});this.emit('spikeGray',{x:this.p.x,y:this.p.y,amount:gray});}}
          this.damageEnemy(e,0,posture*.65,['block'],{quiet:true});
        }
        return;
      }
      const braced=!attackContext.shadowSlash&&(e.type==='shield'||(TYPES[e.type].armor&&/盾/.test(TYPES[e.type].name)))&&kind==='normal'&&e.state==='idle'&&(this.p.x-e.x)*e.face>0;
      if(braced){damage=Math.ceil(damage*.22);posture*=1.35;e.guardReaction=.18;this.emit('shieldBlock',{x:e.x,y:e.y});}
      e.lastDamageRecord={amount:damage,preHp:e.hp,tags:[...tags],time:this.time};const preHp=e.hp,actualPosture=Math.min(e.posture,posture);e.hp=Math.max(0,e.hp-damage);e.posture=Math.max(0,e.posture-posture);
      this.trigger('onEnemyDamageResolved',{enemy:e,damage,posture,tags,direct,secondary,options});
      if(e.type==='tank'&&damage>0&&!tags.includes('tankWound')){const wound=Math.min(preHp,damage)*.25;e.tankWound=(e.tankWound||0)+wound;e.tankWoundRate=(e.tankWoundRate||0)+wound/3;}
      if(e.type==='e38'&&!e.shellBroken&&e.hp>0&&(e.hp<=e.maxHp*.4||e.posture<=0)){
        e.shellBroken=true;if(e.posture<=0&&!e.shellSaved){e.shellSaved=true;e.posture=e.maxPosture;}
        e.queue=[];this.recoverEnemy(e,.45);this.emit('enemyShellBreak',{x:e.x,y:e.y});
      }
      const airborneKnock=e.state==='knockdown'&&((e.z||0)>0||(e.knockVz||0)>0);
      if(!e.splitDone&&TYPES[e.type].flags?.includes('split')&&preHp>e.maxHp*.5&&e.hp<=e.maxHp*.5){
        e.splitDone=true;for(let i=0;i<2;i++){const child=this.spawnEnemyMinion(e,'fission_spawn',clamp(e.x+(i?1:-1)*70,this.bounds.left+30,this.bounds.right-30),clamp(e.y+(i?1:-1)*28,420,675));child.xpMultiplier=.30;child.spawnDelay=.25;}
        this.emit('enemySplit',{x:e.x,y:e.y,type:e.type});
      }
      if(!options.quiet)e.flash=.14;if(posture>0||direct)e.sinceHit=0;
      if(direct){this.hitChain++;this.chainTimer=2.4;this.stats.maxCombo=Math.max(this.stats.maxCombo,this.hitChain);}
      if(!options.quiet)this.emit('hit',{x:e.x,y:e.y,z:48*e.scale,damage,kind,critical:tags.includes('critical')});
      // Commit death / posture break before effect hooks; nested effects cannot reward this death twice.
      if(e.hp<=0){if(tags.includes('spaceSlash')&&Number.isFinite(options.deathCutAngle))e.deathCutAngle=options.deathCutAngle;this.kill(e,tags);}
      else if(e.posture<=0&&e.state!=='stunned'&&!(tags.every(t=>['normal','critical'].includes(t))&&e.attack?.flags?.includes('selfDestruct')&&e.state==='windup')){
        if(airborneKnock){
          // Never replace an airborne knockdown state: doing so used to stop vertical physics
          // and leave enemies hanging in the air. Queue the posture break for landing instead.
          if(!e.pendingStun){e.pendingStun=true;this.emit('break',{x:e.x,y:e.y,z:75*e.scale,boss:isBoss(e),scale:e.scale,ascensionInstant:!!options.instantPostureBreak});if(!options.quiet)this.hitstop(.08);this.trigger('onEnemyPostureBreak',{enemy:e,tags});}
        }else{
          e.state='stunned';e.stun=e.stunMax=this.postureBreakDuration(e);e.t=0;e.queue=[];
          this.emit('break',{x:e.x,y:e.y,z:75*e.scale,boss:isBoss(e),scale:e.scale,ascensionInstant:!!options.instantPostureBreak});if(!options.quiet)this.hitstop(.11);
          this.trigger('onEnemyPostureBreak',{enemy:e,tags});
        }
      }else if((direct||secondary&&options.flinchDuration>0)&&options.flinch!==false&&e.state!=='stunned'&&!airborneKnock){
        const armor=((TYPES[e.type].armor&&!(e.type==='e38'&&e.shellBroken)||isBoss(e))&&e.state==='windup')||(['windup','active'].includes(e.state)&&e.attack?.flags?.includes('selfDestruct'));
        const bossLightHit=isBoss(e)&&kind==='normal';
        if(!armor&&!braced&&!bossLightHit&&e.state!=='active'){const remaining=options.flinchDuration>0&&e.state==='flinch'?e.t:0;e.state='flinch';e.t=Math.max(remaining,options.flinchDuration||0,tags.some(t=>['heavy','comboFinisher','downStrike'].includes(t))?.31:.14);e.queue=[];}
        if(!bossLightHit)e.knockX=this.p.face*(braced?12:isBoss(e)?25:tags.includes('comboFinisher')?230:65);
      }else if(direct&&airborneKnock){
        // Airborne follow-ups may push the body sideways, but never reset/grant lift.
        e.knockX+=this.p.face*(tags.includes('comboFinisher')?70:28);
      }
      if(direct){
        this.trigger('onAttackHit',{...attackContext,enemy:e,damage,posture,actualPosture,tags});
        // The execution animation dispatches its completed hit with boss context below.
        for(const tag of tags)if(tagPrefix[tag]&&!(tag==='execution'&&options.executionAnimation))this.trigger('on'+tagPrefix[tag]+'Hit',{enemy:e,damage,tags});
      }else if(secondary)this.trigger('onEffectHit',{enemy:e,damage,posture,tags});
    }
    kill(e,kind='normal') {
      if(e.dead||e.furnaceCapture||e.groundDrag&&!isBoss(e))return;const tags=tagsFor(kind),base=TYPES[e.type];
      if(base.final&&tags.includes('slay')&&!tags.includes('stoneShatter')){e.hp=Math.max(1,e.hp);return;}
      const attemptingRevive=!(e.medusaGold||e.medusaUntil>this.time)&&(base.revives||base.flags?.includes('revive'))&&!e.revived&&!tags.includes('execution')&&!tags.includes('slay');
      if(attemptingRevive&&!e.antiRegen){
        e.revived=true;e.hp=Math.max(1,e.maxHp*.60);e.posture=Math.max(1,e.maxPosture*.55);e.state='recovery';e.t=2;e.queue=[];e.cd=2;this.emit('enemyRevive',{x:e.x,y:e.y,type:e.type});return;
      }
      // Only an attempted revival suppressed by Death Sentence detonates the serum.
      // Normal kills, direct executions and enemies already revived never set this flag.
      if(attemptingRevive&&e.antiRegen&&e.antiRegenSerum)e._deathSentenceReviveBlocked=true;
      // Resolve presentation BEFORE kill hooks can launch or consume the body.
      if(!base.boss&&!e.dummy&&!e.groundDrag&&!e.furnaceCapture&&!e.furnaceConsumed){
        const h=this.deathBlackHole?.(),stone=base.bodyPlan==='statue'&&['petrifying','dormant'].includes(e.state);
        const flavorTags=this.deathDamageTags?.(tags,e)||tags,has=(...names)=>flavorTags.some(t=>names.includes(t));
        if(e.medusaGold||e.medusaUntil>this.time)e.deathFlavor=e.medusaGold?'goldStone':'stone';
        else if(has('mindFrostDeath'))e.deathFlavor='ice';
        else if(has('consecration','holy','holyStrike','newSunAnnihilation','endEyeAnnihilation'))e.deathFlavor='annihilation';
        else if(h&&h.life>0&&distance(h,e)<=h.radius){e.deathFlavor='blackHole';e.deathSink=h;if(stone)e.statueCollapse=true;}
        else if(stone){e.statueCollapse=true;}
        else if(has('iceFlame'))e.deathFlavor='ice';
        // Only cyclone damage carries these tags; Wind Blade attack bonuses do not.
        else if(has('tornado','windTornado'))e.deathFlavor='wind';
        else if(has('fire','burn','flame','fireTouch','fireball','toxicFlame','fireTornado'))e.deathFlavor='fire';
        else if(has('lightning','lightningDash','lightningSpirit','lightningRod','chargeOrbLightning'))e.deathFlavor='lightning';
        else if(has('soulGreatsword','soulBlade','soulLink','soulLinkShare','alphaSoulLink','ghostHand','ghostExecutioner','ghostExecution','ghostCarnage','soul','illusion'))e.deathFlavor='soul';
        else if(has('catalyst','poison','virulentPoison','poisonBlade','acidBlood'))e.deathFlavor='poison';
        else if(e.frozenUntil>this.time||has('frostbite'))e.deathFlavor='ice';
        else if(has('spaceSlash'))e.deathFlavor='rift';
        else if(has('sharpShadow','precisionSwordQi')&&!has('bleed'))e.deathFlavor='shadowSever';
        else if(has('curse','endEye','dualEye'))e.deathFlavor='curse';
        else if(has('bleed'))e.deathFlavor='bleed';
        e.corpseLocked=e.statueCollapse||['blackHole','ice','annihilation','wind'].includes(e.deathFlavor);
        if(e.deathFlavor==='annihilation')e.noCorpse=true;
        if(e.corpseLocked){e.knockX=e.knockY=e.knockVz=0;if(e.deathFlavor!=='wind')e.z=0;e._bowlingProjectile=null;e.flyingKickMark=null;e._flyingKickCorpse=false;}
      }
      if(e.medusaGold||e.medusaUntil>this.time){e.deathFlavor=e.medusaGold?'goldStone':'stone';e.statueCollapse=false;e.corpseLocked=true;e.knockX=e.knockY=e.knockVz=0;e._bowlingProjectile=null;e.flyingKickMark=null;}
      if(tags.includes('selfDestruct')){e.noCorpse=true;e.corpseLocked=true;e.knockX=e.knockY=e.knockVz=e.z=0;e._bowlingProjectile=null;}
      // A launched enemy can die mid-flight. Keep the SAME rendered body and its
      // previous sweep endpoint available to Bowling's collision handler.
      if(!e.corpseLocked&&!e.dummy&&e.state==='knockdown'&&Math.hypot(e.knockX||0,e.knockY||0)>120){
        e._bowlingProjectile={rank:0,overkill:0,hit:e._bowlingHit||new Set(),lastX:e._bowlingLastX??e.x,lastY:e._bowlingLastY??e.y};
      }
      if(e.dummy){e.hp=0;e.knockX=e.knockY=e.knockVz=0;}e.dead=true;e.state='dead';e.deathT=0;e.queue=[];
      if(!e.corpseLocked&&!e.summoned&&!e.dummy)this.enemyCorpses.push({id:e.id,x:e.x,y:e.y,type:e.type,life:7,used:false});
      e.killTags=tags;e.killType=tags[0];
      this.stats.kills++;this.emit('kill',{x:e.x,y:e.y,type:e.type,tags});
      const rng=this.random;if(e.dummy)this.random=()=>0;try{this.trigger('onAttackKill',{enemy:e,tags});for(const tag of tags)if(tagPrefix[tag])this.trigger(`on${tagPrefix[tag]}Kill`,{enemy:e,tags});}finally{this.random=rng;}
    }
    updateExecutionRush() {
      const p=this.p;
      if(p.execRushStacks>0&&this.time+1e-9>=p.execRushUntil){
        const layers=1+Math.floor((this.time-p.execRushUntil+1e-9)/.8);
        p.execRushStacks=Math.max(0,p.execRushStacks-layers);
        p.execRushUntil+=layers*.8;
      }
    }
    beginExecution(e,chained=false) {
      if(!e||e.dead||e.furnaceCapture)return false;
      const p=this.p;p.state='execute';p.t=0;p.execTarget=e;p.execFrom={x:p.x,y:p.y,z:p.z};p.execDone=false;p.execAnchor=null;p.execGuardT=null;
      if(!chained){p.execChainCount=0;p.execSoulLinkTargets=new Set();p.execQueue=p.executionChain?this.enemies.filter(other=>other!==e&&!other.dead&&!other.furnaceCapture&&other.state==='stunned'&&!(other.timeSealT>0)&&distance(p,other)<p.executionRange&&(!this.viewBounds||other.x>=this.viewBounds.left&&other.x<=this.viewBounds.right)):[];}
      // Completed executions add a speed layer. After 1.6 s without a finish,
      // lose one layer, then another every .8 s. Apply the remaining layer's
      // fixed factor to the base alpha/carnage duration without compounding it.
      this.updateExecutionRush();
      const rushFactor=[1,.83,.70,.60,.51,.43,.35,.28,.23,.20,.17,.15,.13,.12,.11,.10][Math.min(15,p.execRushStacks)];
      p.execDuration=(p.executionChain?.22:(p.executionDuration||.83))*rushFactor;
      p.execHitAt=(p.executionChain?.075:(p.executionHitAt||.32))*rushFactor;
      p.execTravelDuration=(p.executionChain?.055:(p.executionTravelDuration||.13))*rushFactor;
      p.execPathHits=new Set([e.id,...p.execQueue.map(other=>other.id)]);
      p.invuln=1.1;p.execInvuln=1.1;p.attackBuffer=0;p.combo=0;e.stun=Math.max(e.stun,1.2);
      p.face=e.x>=p.x?1:-1;this.emit('executeStart',{x:e.x,y:e.y,boss:isBoss(e),alphaRank:p.alphaRank||0,alpha:p.alphaRank>0});
      this.trigger('onExecutionStart',{enemy:e});this.trigger('onExecution',{enemy:e});
    }
    updatePlayer(dt,input,pressed) {
      const p=this.p;this.updateExecutionRush();if(p.hookRoot>0){p.hookRoot=Math.max(0,p.hookRoot-dt);input={...input,a:false,d:false,w:false,s:false};}p.moveIntent=!!(input.a||input.d||input.w||input.s);p.attackMotionThisStep=false;
      const liveGuardEnd=this.rules.guardStartup+this.rules.guardWindow,liveGuardTotal=liveGuardEnd+this.rules.guardRecovery;
      for(const key of ['invuln','execInvuln','guardCd','guardFlash','blockFlash','blockMultiGuard','hurt','comboGrace','attackBuffer','jumpBuffer','dashBuffer','guardBuffer','counter','speedBoost','superArmor','ultimateForm'])p[key]=Math.max(0,p[key]-dt);
      if(p.dashCharges<p.dashMaxCharges){
        // Triple Dash starts recovering as soon as a charge is spent.
        if(p.state!=='dash'||p.dashRegenDuringDash)p.dashRegen=Math.max(0,p.dashRegen-dt);
        if(p.dashRegen<=0){p.dashCharges++;p.dashRegen=p.dashCharges<p.dashMaxCharges?this.dashCooldown():0;}
      }
      p.dashCd=p.dashRegen;
      if(this.time-p.lastEvasion>4&&p.evasionFatigue>0){p.evasionFatigue=0;p.evasionRecovery=0;}
      if(p.grayHp>0&&!p.bossPlague&&(!p.voidMire&&this.time-p.lastRealDamage>=this.rules.grayRecoveryDelay||(p.grayRecoveryWhileHit||0)>0||(p.innerForceRecoveringGray||0)>0&&!p.voidMire)){
        const recentMult=!p.voidMire&&this.time-p.lastRealDamage>=this.rules.grayRecoveryDelay?1:(p.grayRecoveryWhileHit||0);
        const rate=Math.max(0,this.hooks.modify('grayRecovery',this.rules.grayRecoveryRate*p.grayRecoveryMultiplier*dt));
        const amount=Math.min(p.grayHp,rate*recentMult+(!p.voidMire?Math.min(p.innerForceRecoveringGray||0,rate*(1-recentMult)):0));
        p.innerForceRecoveringGray=Math.max(0,(p.innerForceRecoveringGray||0)-amount);
        p.grayHp-=amount;p.hp+=amount;this.trigger('onRecoverGrayHealth',{amount});
      }
      if(p.comboGrace<=0&&p.state==='idle')p.combo=0;
      const newJ=pressed.j||(input.j&&!p.wasJ);p.wasJ=!!input.j;
      if(newJ){p.jPending=true;p.jHold=0;}
      if(p.jPending)p.jHold+=dt;
      if(pressed.space)p.jumpBuffer=.16;
      if(pressed.shift)p.dashBuffer=.15;
      if(pressed.k)p.guardBuffer=.16;
      const actionable=p.state!=='execute'&&p.state!=='hurt';
      if(actionable&&pressed.q&&this.executeTarget)this.beginExecution(this.executeTarget);
      const thrustCommand=pressed.thrust||(newJ&&(input.shift||pressed.shift))||(pressed.shift&&input.j);
      if(actionable&&p.state!=='execute'&&thrustCommand&&(p.dashCharges>0||p.state==='dash'&&p.t<.12))this.startThrust(input);
      else if(p.state!=='execute'&&actionable&&p.dashBuffer>0&&this.canDash())this.startDash(input);
      const attackState=['attack','heavy','thrust'].includes(p.state),heavyGuardCancel=p.state==='heavy'&&p.t>=p.attack.wind+p.attack.active*.35;
      const free=p.state==='idle'||p.state==='landing'||p.state==='charge'||heavyGuardCancel||(attackState&&(p.t<p.attack.wind*.65||p.t>p.attack.wind+p.attack.active));
      // While an existing guard is still open, only a perfect block can have reset
      // guardCd to zero. A fresh K press can then restart the guard timeline, giving
      // skilled players another startup + perfect window without sacrificing the
      // forgiving multi-hit ordinary guard for players who simply hold the first guard.
      const perfectRefresh=p.state==='guard'&&p.guardCd<=0;
      if((free||perfectRefresh)&&p.guardBuffer>0&&p.guardCd<=0){if(p.execInvuln>0){p.invuln=0;p.execInvuln=0;}if(p.state==='charge'&&this.chargeGuardEnabled?.())p.chargeGuardT=0;else{p.state='guard';p.t=0;}p.guardCd=liveGuardTotal;p.guardBuffer=0;p.attackBuffer=0;this.emit('guard',{x:p.x,y:p.y,refreshed:perfectRefresh});}
      // Guarding in execution recovery keeps the finish animation running, but gives
      // up its invulnerability immediately. Guard timing has its own clock.
      if(p.state==='execute'&&p.execDone&&p.guardBuffer>0&&p.guardCd<=0){p.invuln=0;p.execInvuln=0;p.execGuardT=0;p.guardCd=liveGuardTotal;p.guardBuffer=0;this.emit('guard',{x:p.x,y:p.y,execution:true});}
      if((p.state==='idle'||p.state==='attack'||p.state==='landing')&&p.jumpBuffer>0&&p.jumps<(p.jumpMax||2)){
        const baseJump=p.jumps===0?560:p.jumps===1?495:455;p.vz=baseJump*(p.jumpHeightMultiplier||1);p.jumps++;p.jumpBuffer=0;if(p.state!=='idle'){p.state='idle';p.comboGrace=.6;}
        this.emit('jump',{x:p.x,y:p.y,z:p.z,second:p.jumps===2});this.trigger('onJump',{x:p.x,y:p.y,z:p.z,jump:p.jumps,second:p.jumps===2});
      }
      if(newJ&&input.s&&p.z>12&&p.canDownStrike&&['idle','attack'].includes(p.state)){
        p.jPending=false;this.startPlunge();
      }
      if(p.jPending&&!input.j){p.jPending=false;p.attackBuffer=.34;}
      const chargeFree=p.state==='idle'||p.state==='landing'||p.state==='attack'&&p.t>=p.attack.wind+p.attack.active;
      if(chargeFree&&p.jPending&&input.j&&p.jHold>=.18){const held=p.jHold;this.startCharge('j');p.charge=Math.min(p.chargeMax,held);}
      else if(chargeFree&&input.l)this.startCharge('l');
      if(p.state==='charge'){
        p.charge=Math.min(p.chargeMax,p.charge+dt*Math.max(.25,p.chargeRateBoost||1)*(p.chargeSpeedPenalty||1));
        if(p.charge>=p.chargeMax&&!p.chargeReady){p.chargeReady=true;p.chargeReadyAt=this.time;this.emit('chargeReady',{x:p.x,y:p.y,z:p.z});this.trigger('onChargeReady',{time:this.time});}
        if(!(p.chargeSource==='j'?input.j:input.l))this.releaseHeavy();
      }
      if(p.state==='idle'&&p.attackBuffer>0) {
        if(input.s&&p.z>12&&p.canDownStrike)this.startPlunge();else this.startAttack();
      }
      p.t+=dt;
      if(p.state==='charge'&&p.chargeGuardT!=null){p.chargeGuardT+=dt;if(p.chargeGuardT>liveGuardEnd)p.chargeGuardT=null;}else p.chargeGuardT=null;
      if(p.state==='execute'&&p.execGuardT!==null)p.execGuardT+=dt;
      let dx=(input.d?1:0)-(input.a?1:0),dy=(input.s?1:0)-(input.w?1:0);
      if(p.z>0&&p.downStrikeCount>0&&!p.diveBombDashActive){dy=Math.min(0,dy);p.vy=Math.min(0,p.vy);if(p.state==='dash')p.dashY=Math.min(0,p.dashY);}
      const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
      p.moving=false;
      if(['idle','attack','guard','charge','heavy'].includes(p.state)){
        const factor=(p.state==='charge'?1:p.state==='heavy'?.18:p.state==='attack'?(p.z>0?.65:.36):p.state==='guard'?.38:1)*(p.speedBoost>0?1.3:1)*(p.moveSpeedMultiplier||1)*(p.enemySlow||1);
        const smooth=1-Math.exp(-dt*((dx||dy)?24:34));
        p.vx+=(dx*270*factor-p.vx)*smooth;p.vy+=(dy*187*factor-p.vy)*smooth;
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.walkDistance+=Math.hypot(p.vx,p.vy)*dt;p.moving=Math.hypot(p.vx,p.vy)>10;
        if(dx&&['idle','charge','attack','heavy'].includes(p.state))p.face=Math.sign(dx);
      }
      if(['attack','heavy','thrust'].includes(p.state)){
        p.attackMotionThisStep=true;
        const a=p.attack;
        if(p.t>=a.wind&&p.t<a.wind+a.active){
          p.x+=p.face*(p.state==='thrust'?850:p.attackIndex===3?200:135)*dt;
          if(p.t>=a.wind+a.active*.35&&!p.swingSound){
            p.swingSound=true;this.emit('swing',{x:p.x,y:p.y,z:p.z,index:p.state==='heavy'?2:p.attackIndex,face:p.face,heavy:p.state==='heavy',scale:a.baseRange>0?a.range/a.baseRange:1});
            if(p.state==='heavy'){
              this.trigger('onHeavyStrike',{fullCharge:p.fullCharge});
              if(p.whirlwindRank)this.emit('whirlwindSlash',{x:p.x,y:p.y,z:p.z,rank:p.whirlwindRank,hits:a.fireWhirlArcs||a.whirlTurns||1,fire:!!a.fireWhirlArcs,radius:a.range*.95*(a.fireWhirlArcs?1.3:1)});
            }
          }
          for(const e of this.enemies){
            const body=isBoss(e)?this.enemyHurtbox(e):null,ex=((body?.x??e.x)-p.x)*p.face;
            const forward=body?ex>-body.rx&&ex<a.range+body.rx&&Math.abs(body.y-p.y)<(a.lane||49)+body.ry:ex>-28&&ex<a.range+e.scale*13&&Math.abs(e.y-p.y)<(a.lane||49)+e.scale*9;
            const radial=p.state==='heavy'&&p.whirlwindRank>0&&distance(p,e)<a.range*.95;
            const fireRadial=p.state==='heavy'&&a.fireWhirlArcs>0&&distance(p,e)<a.range*.95*1.3;
            const heightOK=body?p.z<body.top&&p.z+78>body.bottom:p.z<e.scale*78+25;
            const reachable=this.hooks.modify('playerAttackReach',(forward||radial||fireRadial)&&heightOK,{enemy:e});
            if(p.t>=a.wind+a.active*.35&&!e.dead&&!e.furnaceCapture&&!p.hitIds.has(e.id)&&reachable){
              const rings=Math.max(0,(a.whirlTurns||1)-1),fireArcs=fireRadial?a.fireWhirlArcs:0,contactMultiplier=fireArcs?((radial?(ex<30?.60:1):forward?1:0)+fireArcs*.20):radial?(ex<30?.60+rings*.20:1+rings*.10):1;
              p.hitIds.add(e.id);this.damageEnemy(e,a.damage,a.posture,p.state==='heavy'?(p.fullCharge?['heavy','fullCharge']:['heavy']):p.state==='thrust'?(p.rockThrustActive?(p.rockThrustFull?['thrust','rockThrust','heavy','fullCharge']:['thrust','rockThrust','heavy']):'thrust'):p.attackIndex===3?'comboFinisher':'normal',{contactMultiplier,contactBonusDamage:fireArcs*27,contactBonusPosture:fireArcs*10});
              this.hitstop(p.attackIndex===3?.09:.042);
            }
          }
        }
        const linkRecovery=(p.state==='attack'&&p.attackIndex<3&&p.attackBuffer>0)?a.recovery*.68:a.recovery;
        if(p.t>=a.wind+a.active+linkRecovery){
          p.combo=p.state==='attack'?(p.attackIndex+1)%4:0;p.comboGrace=.7;if(p.state==='thrust'){p.rockThrustActive=false;p.rockThrustFull=false;}p.state='idle';p.swingSound=false;
          if(p.attackBuffer>0)this.startAttack();
        }
      }else p.swingSound=false;
      if(p.state==='guard'&&p.t>=liveGuardTotal)p.state='idle';
      if(p.state==='dash') {
        if(p.diveBombDashActive){const lateral=(input.d?1:0)-(input.a?1:0),depth=(input.s?1:0)-(input.w?1:0),steer=lateral*(-p.dashY)+depth*p.dashX;p.x+=-p.dashY*steer*240*dt;p.y+=p.dashX*steer*180*dt;}p.x+=p.dashX*1020*(p.dashDistanceMultiplier||1)*(p.diveBombDashActive?(p.diveBombMultiplier||1):1)*dt;p.y+=p.dashY*600*(p.dashDistanceMultiplier||1)*(p.diveBombDashActive?(p.diveBombMultiplier||1):1)*dt;
        if(p.t>=(p.diveBombDashActive?p.diveDuration||.65:p.dashDuration||.19)){if(!p.dashStartedAir){const near=this.enemies.filter(e=>!e.dead&&!e.furnaceCapture&&Math.abs(e.y-p.y)<75&&distance(e,p)<360);if(!near.some(e=>(e.x-p.x)*p.face>0)&&near.some(e=>(e.x-p.x)*p.face<0))p.face*=-1;}const serial=p.dashSerial;p.state='idle';p.t=0;if(p.dashSpeedBoost)p.speedBoost=1.4;this.trigger('onDashEnd',{x:p.x,y:p.y,z:p.z,face:p.face,serial});}
      }
      if(p.state==='hurt'){p.x+=(p.knock||0)*dt;p.knock*=Math.exp(-8*dt);if(p.t>.22){p.knock=0;p.state='idle';}}
      if(p.state==='execute'){
        const e=p.execTarget;
        if(!e){p.state='idle';p.execQueue=[];p.execSoulLinkTargets=new Set();return;}
        const oldX=p.x,oldY=p.y;
        if(e.dead&&!p.execAnchor)p.execAnchor={x:p.x,y:p.y,z:p.z};
        const travel=clamp(p.t/(p.execTravelDuration||.13),0,1);
        if(p.execAnchor){p.x=p.execAnchor.x;p.y=p.execAnchor.y;p.z=p.execAnchor.z;}
        else{p.x=p.execFrom.x+(e.x-p.face*42-p.execFrom.x)*travel;p.y=p.execFrom.y+(e.y-p.execFrom.y)*travel;p.z=p.execFrom.z*(1-travel);}
        if(p.executionPathDamage>0&&p.t<=.15){
          for(const other of this.enemies)if(!other.dead&&!other.furnaceCapture&&!p.execPathHits.has(other.id)&&this.segmentContact(oldX,oldY,p.x,p.y,other,38,34)){
            p.execPathHits.add(other.id);this.damageEnemy(other,p.executionPathDamage*p.damageMultiplier,p.executionPathPosture*p.postureMultiplier,['thrust','alpha'],{secondary:true,quiet:true});
            this.emit('alphaTrail',{x:oldX,y:oldY,toX:p.x,toY:p.y});
          }
        }
        if(p.t>=p.execHitAt&&!p.execDone){
          p.execDone=true;p.execAnchor={x:p.x,y:p.y,z:p.z};p.execChainCount=(p.execChainCount||0)+1;this.stats.executions++;
          const execBase=this.executionDamage(e),modifiedDamage=Math.max(0,this.hooks.modify('executionDamage',execBase,{enemy:e,boss:isBoss(e)})),execDamage=isBoss(e)?Math.min(modifiedDamage,execBase*1.5):modifiedDamage;
          const hpBeforeExecution=e.hp;this.hitstop(p.executionChain?.055:Math.max(.06,.17-(p.alphaRank||0)*.025));
          this.damageEnemy(e,execDamage,0,'execution',{executionBonus:isBoss(e)&&execBase>0?execDamage/execBase:1,executionAnimation:true});
          this.emit('executeHit',{x:e.x,y:e.y,z:54*e.scale,boss:isBoss(e),damage:hpBeforeExecution-e.hp,alphaRank:p.alphaRank||0,alpha:(p.alphaRank||0)>0});
          this.trigger('onExecutionHit',{enemy:e,boss:isBoss(e)});
          if(!e.dead&&!e.furnaceCapture){e.posture=e.maxPosture;this.recoverEnemy(e,1);e.queue=[];}
        }
        if(p.t>=p.execDuration){
          // Completion, not the damage frame or the next start, refreshes the decay timer.
          if(p.execDone){p.execRushStacks=Math.min(15,p.execRushStacks+1);p.execRushUntil=this.time+1.6;}
          let next;while(p.execQueue.length&&!next){const candidate=p.execQueue.shift(),linked=p.execSoulLinkTargets?.has(candidate.id)&&!isBoss(candidate)&&!candidate.groundDrag&&!(candidate.timeSealT>0)&&!(candidate.mindControlT>0);if(!candidate.dead&&!candidate.furnaceCapture&&(linked||candidate.state==='stunned'))next=candidate;}
          if(next&&p.alphaRank===3&&p.execChainCount>=10&&!p.execSoulLinkTargets?.size){for(const target of [next,...p.execQueue]){if(target.dead)continue;this.trigger('onExecutionStart',{enemy:target});this.emit('alphaTrail',{x:p.x,y:p.y,toX:target.x,toY:target.y});for(const other of this.enemies)if(other!==target&&!other.dead&&!other.furnaceCapture&&this.segmentContact(p.x,p.y,target.x,target.y,other,45,45))this.damageEnemy(other,p.executionPathDamage||20,p.executionPathPosture||10,['alpha','thrust'],{secondary:true});this.damageEnemy(target,this.executionDamage(target),0,['execution'],{executionAnimation:true});this.trigger('onExecutionHit',{enemy:target,boss:isBoss(target)});this.stats.executions++;p.execRushStacks=Math.min(15,p.execRushStacks+1);p.execRushUntil=this.time+1.6;}p.execQueue=[];next=null;}if(next)this.beginExecution(next,true);
          else{if(p.execGuardT!==null&&p.execGuardT<liveGuardTotal){p.state='guard';p.t=p.execGuardT;}else p.state='idle';p.execGuardT=null;p.execTarget=null;p.z=0;p.vz=0;p.airDash=false;p.airDashes=0;p.jumps=0;p.execQueue=[];p.execSoulLinkTargets=new Set();}
        }
      }
      if(p.state!=='dash'&&p.state!=='execute'){
        if(p.z>0||p.vz>0){p.vz-=1450*dt;p.z+=p.vz*dt;}
        if(p.state==='plunge'){
          // Swept vertical contact prevents tunnelling through enemies at high fall speeds.
          const inDownStrikeRange=e=>{if(e.dead||e.furnaceCapture)return false;const body=isBoss(e)?this.enemyHurtbox(e):null;return this.hooks.modify('playerAttackReach',Math.abs((body?.x??e.x)-p.x)<(50+(body?.rx??e.scale*12))*p.downRangeMultiplier&&Math.abs((body?.y??e.y)-p.y)<40*p.downRangeMultiplier&&p.z<(body?.top??e.scale*85+18),{enemy:e});};
          const target=this.enemies.find(inDownStrikeRange);
          if(target){
            const highDrop=p.eagleDropRank>=2&&p.plungeStartZ>=p.eagleDropHighThreshold;
            const areaStrike=p.guillotineRank===3||highDrop;
            const victims=this.enemies.filter(e=>inDownStrikeRange(e)&&(areaStrike||e===target||this.hooks.modify('playerAttackReach',false,{enemy:e})));
            p.downStrikeCount=(p.downStrikeCount||0)+1;
            const strikeCount=p.downStrikeCount;
            const downMultiplier=p.downDamageMultiplier*(1+(p.downStrikeDamageGrowth||0)*Math.max(0,strikeCount-1));
            for(const e of victims)this.damageEnemy(e,33*downMultiplier,31*downMultiplier,'downStrike');
            p.combo=0;this.trigger('onDownStrikeHit',{enemy:target,count:strikeCount});p.state='idle';p.z=Math.max(p.z,55);p.vz=Math.max(p.vz,555);p.jumps=1;this.resetDashes();p.canDownStrike=(p.downStrikeCount||0)<(p.downStrikeMax||1);this.emit('bounce',{x:p.x,y:p.y,z:p.z});
            this.hitstop(.075);
          }
        }
        if(p.z<=0){
          if(p.state==='plunge'){p.state='landing';p.t=0;this.emit('slam',{x:p.x,y:p.y});this.trigger('onDownStrikeLand',{x:p.x,y:p.y});this.hitstop(.035);}
          else if(p.jumps>0)this.emit('land',{x:p.x,y:p.y});
          p.z=0;p.vz=0;p.jumps=0;p.airDash=false;p.airDashes=0;p.downStrikeCount=0;p.canDownStrike=true;
        }
      }
      if(p.state==='landing'&&p.t>.22)p.state='idle';
      if(!this.loopWorld)p.x=clamp(p.x,this.bounds.left,this.bounds.right);p.y=clamp(p.y,410,690);
      // No body collision for the hero: dodge is never blocked by an enemy.
    }
    updateEnemyFields(dt){
      const alive=this.enemies.filter(e=>!e.dead&&!e.furnaceCapture&&!e.spawnDelay);
      for(const e of alive){e.auraTempo=1;e.auraRegen=0;e.inBloodMist=false;e.auraActive=false;}
      for(const e of alive){
        const base=TYPES[e.type];if(!base.aura||e.mindControlT>0||e.timeSealT>0||e.sleepT>0||e.medusaGold||e.medusaUntil>this.time)continue;
        if(base.aura==='mist'){e.fogPulse=(e.fogPulse||0)-dt;if(e.fogPulse<=0){e.fogPulse=6;e.fogT=2.8;}e.fogT=Math.max(0,(e.fogT||0)-dt);if(!e.fogT)continue;}
        for(const ally of alive){if(ally===e||ally.mindControlT>0||distance(e,ally)>base.auraRadius)continue;e.auraActive=true;
          if(base.aura==='tempo')ally.auraTempo=1.1;
          else {ally.auraRegen=Math.max(ally.auraRegen,base.aura==='mist'?.004:.006);if(base.aura==='mist')ally.inBloodMist=true;}
        }
      }
      for(const e of alive)if(e.auraRegen)this.healEnemy(e,e.maxHp*e.auraRegen*dt,{source:'enemyAura',quiet:true});
      for(const c of this.enemyCorpses)c.life-=dt;this.enemyCorpses=this.enemyCorpses.filter(c=>c.life>0&&!c.used);
      for(const h of this.enemyHazards)h.life-=dt;this.enemyHazards=this.enemyHazards.filter(h=>h.life>0);
    }
    resolveEnemySpell(e,a){
      const flags=a.flags||[],p=this.p;let kind=null,inside=false,x=e.x,y=e.y,radius=a.range;
      if(flags.includes('arcaneBeam')){kind='arcaneBeam';inside=(p.x-e.x)*e.face>0&&(p.x-e.x)*e.face<a.range&&Math.abs(p.y-e.y)<(a.lane||33)&&p.z<85;}
      else if(flags.includes('holyBeam')){kind='holyBeam';x=e.targetX;y=e.targetY;radius=75;inside=Math.hypot(p.x-x,(p.y-y)*1.7)<radius&&p.z<100;}
      else if(flags.includes('quake')){kind='quake';inside=Math.hypot(p.x-x,(p.y-y)*1.6)<radius&&p.z<62;}
      else if(flags.includes('crystalSpike')){kind='crystalSpike';inside=(p.x-x)*e.face>-30&&(p.x-x)*e.face<radius&&Math.abs(p.y-y)<65&&p.z<85;}
      if(!kind)return false;
      e.damageDone=true;this.enemyHazards.push({kind,x,y,face:e.face,radius,lane:a.lane||33,enemyType:e.type,stage:TYPES[e.type].stage,life:kind==='crystalSpike'?.65:.4,maxLife:kind==='crystalSpike'?.65:.4});
      if(inside){const result=this.receiveHit(a.damage,e,null);this.resolveEnemyMoveSpecial(e,a,result);}else if(distance(p,e)<a.range+80)this.trigger('onEnemyAttackMiss',{enemy:e,move:a});
      this.emit('enemySpell',{kind,x,y,radius,face:e.face});return true;
    }
    enemyRanged(e){
      const base=TYPES[e.type];if(e.type==='bone_spitter'&&e.ammo<=0)return e.hp>e.maxHp*.12;
      if(!base.ranged||base.hybrid||e.ammo<=0)return false;
      return !base.moveKeys||base.moveKeys.some(k=>{const a=MOVES[k];return (e.mana==null||(a.manaCost||0)<=e.mana)&&(a.ranged||a.flags?.some(f=>['arcaneBeam','holyBeam'].includes(f)));});
    }
    ninjaThrowReady(e,dist){return e.type==='ninja'&&e.ammo>0&&(e.shurikenCd||0)<=0&&dist>160&&dist<=490;}
    enemyMeleeReach(e){const moves=(TYPES[e.type].moveKeys||[]).map(k=>MOVES[k]).filter(a=>a.damage>0&&!a.ranged&&!a.manaCost&&!a.reactiveOnly);return moves.length?Math.max(...moves.map(a=>a.range)):TYPES[e.type].reach;}
    availableCorpse(e,radius=330){return this.enemyCorpses.find(c=>c.life>0&&!c.used&&c.id!==e.id&&distance(c,e)<radius);}
    spawnEnemyMinion(owner,type,x,y){
      const child=this.spawn(type,this.loopWorld?x:clamp(x,this.bounds.left+25,this.bounds.right-25),clamp(y,415,680));
      const base=TYPES[owner.type],inheritedScale=(scale)=>base.lateQuality?Math.min(2.5,1+Math.max(0,scale-1)*.25):scale;
      const hpScale=inheritedScale(owner.maxHp/Math.max(1,base.hp)),postureScale=inheritedScale(owner.maxPosture/Math.max(1,base.posture));
      child.hp=child.maxHp=Math.round(child.maxHp*hpScale);child.posture=child.maxPosture=Math.round(child.maxPosture*postureScale);
      child.attackMultiplier=owner.attackMultiplier||1;child.summoned=true;child.xpMultiplier=0;child.spawnDelay=.45;child.alerted=true;child.waveId=null;child.summonerId=owner.id;
      this.emit('enemySummon',{x:child.x,y:child.y,type});return child;
    }
    chooseQualitySequence(e,cycle){
      const base=TYPES[e.type],keys=base.moveKeys||[],p=this.p,dist=distance(e,p),alive=this.enemies.filter(o=>!o.dead);
      const sacrifice=keys.find(k=>MOVES[k].flags?.includes('sacrifice'));
      if(sacrifice&&e.hp<e.maxHp*.5&&!e.sacrificeDone)return [sacrifice];
      if(e.type==='berserker')return keys.filter(k=>MOVES[k].damage>0).slice(0,2);
      if(e.type==='bone_spitter'){
        if(dist<175)return [keys.find(k=>!MOVES[k].ranged&&MOVES[k].damage>0)];
        if(e.ammo>0)return Array.from({length:Math.min(3,e.ammo)},()=>keys[0]);
        if(e.hp>e.maxHp*.12)return [keys.find(k=>MOVES[k].flags.includes('bloodReload'))];
      }
      if(e.type==='ninja')return [this.ninjaThrowReady(e,dist)?keys[1]:keys[0]];
      let pool=keys.filter(k=>{
        const a=MOVES[k],f=a.flags||[];
        if(a.reactiveOnly||a.requiresShellBroken&&!e.shellBroken)return false;
        if(a.manaCost&&(e.mana||0)<a.manaCost)return false;
        if(a.ranged&&e.ammo<=0)return false;
        if((a.special||'').includes('半血后')&&e.hp>e.maxHp*.5)return false;
        if(f.includes('sacrifice'))return false;
        if(f.includes('raiseZombie'))return (e.raiseCd||0)<=0&&!!this.availableCorpse(e,460)&&alive.filter(o=>o.type==='zombie'&&o.summonerId===e.id).length<3;
        if(f.includes('consumeCorpse'))return (TYPES[e.type].unlimitedCorpses||(e.corpseStacks||0)<5)&&(e.consumeCd||0)<=0&&!!this.availableCorpse(e,180);
        if(f.includes('heal'))return (e.healCd||0)<=0&&alive.some(o=>o!==e&&distance(o,e)<430&&o.hp<o.maxHp*.8&&!o.antiRegen);
        if(f.includes('summonTentacle'))return (e.summonCd||0)<=0&&alive.filter(o=>o.summonerId===e.id&&o.type==='rot_tentacle').length<2;
        if(f.includes('bloodReload'))return e.ammo<=0&&e.hp>e.maxHp*.12;
        if(f.includes('backstab'))return distance(e,{x:p.x-p.face*82,y:p.y})<275&&(p.x-e.x)*e.face>=0&&(e.backstabCd||0)<=0;
        if(f.includes('arcaneBeam'))return Math.abs(p.y-e.y)<a.lane+30&&dist>140;
        if(a.damage>0&&!a.ranged&&!a.manaCost)return dist<a.range+Math.max(0,a.lunge||0)*(a.active||.16)+55;
        if(a.ranged&&dist<125)return false;
        if(f.includes('quake'))return dist<a.range+25;
        return true;
      });
      if(!pool.length)return [keys.find(k=>MOVES[k].damage>0&&!MOVES[k].ranged&&!MOVES[k].manaCost&&!MOVES[k].reactiveOnly)||'weakCut'];
      if(e.type==='e48'){const raise=pool.find(k=>MOVES[k].flags?.includes('raiseZombie'));if(raise)return [raise];}
      if(e.type==='priest'&&cycle%3!==1){const heal=pool.find(k=>MOVES[k].flags?.includes('heal'));if(heal)return [heal];}
      const weights=pool.map(k=>{const a=MOVES[k];let w=a.weight??1;if(a.flags.includes('tar'))w*=p.tarT>0?.4:5;if(a.flags.includes('ignite'))w*=p.tarT>0?4:1;if(a.flags.includes('backstab'))w*=1.4;return w;});
      let roll=this.random()*weights.reduce((a,b)=>a+b,0),key=pool[pool.length-1];for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<=0){key=pool[i];break;}}
      if(base.combo&&!MOVES[key].ranged&&MOVES[key].damage>0){const next=pool.find(k=>k!==key&&!MOVES[k].ranged&&MOVES[k].damage>0);return next?[key,next]:[key];}
      return [key];
    }
    chooseSequence(e) {
      const cycle=e.cycle++;if(e.dummy)return [e.dummyMode==='shoot'?'shot':'cut'];
      if(TYPES[e.type].moveKeys?.length&&(['human','mutant'].includes(TYPES[e.type].stage)||TYPES[e.type].lateQuality))return this.chooseQualitySequence(e,cycle);
      if(TYPES[e.type].ranged&&e.ammo<=0){if(e.type==='bone_spitter')return [TYPES[e.type].moveKeys.find(k=>MOVES[k].flags?.includes('bloodReload'))];if(TYPES[e.type].moveKeys){const melee=TYPES[e.type].moveKeys.find(k=>!MOVES[k].ranged&&MOVES[k].damage>0);if(melee)return [melee];}if(/投枪手$/.test(TYPES[e.type].name))return [TYPES[e.type].moveKeys?.find(k=>k.endsWith('_m2'))||'e09_m2'];return cycle%2?['weakThrust']:['weakCut'];}
      if(e.type==='sword')return cycle%3===0?['cut','quick']:cycle%3===1?['thrust']:['cut'];
      if(e.type==='axe')return cycle%3===1?['sweep','chop']:cycle%3===0?['chop']:['sweep'];
      if(e.type==='bow')return cycle%3===2?['shot','fastshot']:['shot'];
      if(e.type==='crossbow')return cycle%2?['bolt','boltFollow','boltFollow']:['bolt','boltFollow'];
      if(e.type==='spear')return cycle%3===0?['spearJab','spearJab']:cycle%3===1?['spearSweep']:['spearJab'];
      if(e.type==='shield')return cycle%2?['shieldCut']:['shieldBash','shieldCut'];
      if(e.type==='dual')return cycle%3===2?['twinDive']:['twinCut','twinBack'];
      if(e.type==='duelist'){
        if(e.enraged)return cycle%3===0?['ravenCut','ravenBack','ravenCut','ravenDraw']:cycle%3===1?['ravenDraw','ravenBack']:['ravenDive','ravenCut','ravenBack'];
        return cycle%3===0?['ravenCut','ravenBack']:cycle%3===1?['ravenDraw']:['ravenDive','ravenBack'];
      }
      if(e.type==='warden'){
        if(e.enraged)return cycle%3===0?['halberdThrust','halberdHook','halberdSlam']:cycle%3===1?['halberdSweep','halberdHook','halberdThrust']:['halberdSlam','halberdSweep'];
        return cycle%3===0?['halberdThrust','halberdHook']:cycle%3===1?['halberdSweep']:['halberdSlam'];
      }
      if(e.type==='e14')return [(e.hornCd||0)<=0?'e14_m1':'e14_m2'];
      const custom=TYPES[e.type].moveKeys;
      if(custom?.length){
        let pool=custom.filter(k=>!(MOVES[k].special||'').includes('半血后')||e.enraged);
        if(e.mana!==null)pool=pool.filter(k=>!(MOVES[k].ranged||MOVES[k].flags?.some(f=>['heal','summonTentacle','summonOnDeath','quake'].includes(f)))||e.mana>=(MOVES[k].flags?.includes('summonTentacle')?3:1));
        pool=pool.filter(k=>!MOVES[k].flags?.includes('summonOnDeath')&&(!MOVES[k].flags?.includes('sacrifice')||e.hp<=e.maxHp*.5));
        if(e.type==='e08'&&distance(e,this.p)<245&&cycle%3===0)return [custom.find(k=>MOVES[k].flags?.includes('backstab'))];
        if(e.type==='bone_spitter')pool=pool.filter(k=>!MOVES[k].flags?.includes('bloodReload')||e.ammo<=0);
        if(e.type==='e13'||e.type==='e36')if(!(this.p.tarT>0)&&cycle%3!==2){const oil=pool.find(k=>MOVES[k].name==='投油罐');if(oil)return [oil];}
        const detonate=pool.find(k=>(MOVES[k].flags||[]).includes('selfDestruct'));
        if(detonate&&e.hp<=e.maxHp*.60)return [detonate];
        const oneUse=pool.filter(k=>(MOVES[k].special||'').includes('每阶段最多一次')&&!e.specialUsed[k]);
        if(oneUse.length&&cycle%5===3){e.specialUsed[oneUse[0]]=true;return [oneUse[0]];}
        pool=pool.filter(k=>!(MOVES[k].special||'').includes('HP<60%')||e.hp<=e.maxHp*.60);
        if(!pool.length)pool=custom.filter(k=>!MOVES[k].ranged&&MOVES[k].damage>0);
        const start=cycle%pool.length,seq=[pool[start]];
        const maxChain=TYPES[e.type]?.final?(e.enraged?4:3):isBoss(e)?(e.enraged?3:2):((TYPES[e.type].role||'').includes('高速')||/连|双刀|连拳/.test(TYPES[e.type].core||'')?2:1);
        for(let i=1;i<maxChain&&pool.length>1;i++)seq.push(pool[(start+i)%pool.length]);
        return seq;
      }
      if(e.enraged)return cycle%3===0?['hammer','aftershock','backswing']:cycle%3===1?['rush','aftershock']:['backswing','hammer'];
      return cycle%3===0?['hammer']:cycle%3===1?['backswing']:['rush','hammer'];
    }
    beginEnemyMove(e,key) {
      if(!MOVES[key])key='weakCut';
      if(MOVES[key].manaCost&&(e.mana||0)<MOVES[key].manaCost){key=TYPES[e.type].moveKeys?.find(k=>!MOVES[k].manaCost&&!MOVES[k].ranged&&MOVES[k].damage>0&&!MOVES[k].reactiveOnly)||'weakCut';e.queue=[];}
      if(MOVES[key].ranged&&e.ammo<=0){key=TYPES[e.type].moveKeys?.find(k=>!MOVES[k].ranged&&MOVES[k].damage>0)||'weakCut';e.queue=[];}
      const move=MOVES[key],attackScale=Math.max(0,(e.attackMultiplier||1)*(e.damageBuff||1)*(1+(e.corpseStacks||0)*.08)),actionSpeed=Math.max(.40,(e.actionSpeedMultiplier||1)*(e.bossActionSpeed||1)*(e.auraTempo||1)*(e.rageSpeed||1)*(e.shellBroken?1.18:1)*Math.min(e.frostSlow||1,e.frostTraceBossSlowUntil>this.time?.28:1)),forced=!!e.forcedAggro;
      e.attack={...move,wind:move.wind/actionSpeed,active:move.active/(e.bossActionSpeed||1),recovery:move.recovery/actionSpeed,damage:move.damage*attackScale};e.moveKey=key;e.state='windup';e.t=0;e.damageDone=false;e.redDone=false;e.swingDone=false;
      e.manaPaid=false;e.latePaid=false;e.lateEffectDone=false;e.guardConsumed=false;e.backstabTarget=null;if(move.action==='guard'||move.flags?.some(f=>['parryStance','guardStance','spikeGuard','shieldAdvance'].includes(f))){e.red=.28;this.emit('warning',{x:e.x,y:e.y,z:85*e.scale});}
      if(move.flags?.includes('backstab')){e.backstabTarget={x:this.p.x-this.p.face*82,y:this.p.y};e.backstabCd=4;}
      if(move.flags?.includes('raiseZombie')||move.flags?.includes('consumeCorpse'))e.castCorpseId=this.availableCorpse(e,move.flags.includes('raiseZombie')?460:180)?.id;
      // An enemy that finally loses patience gets one whole sequence outside the shared
      // attack budget. Other enemies do not count this sequence as occupying a lock either.
      e.attackLockExempt=forced;
      e.loiterT=0;e.forcedAggro=false;const rangedPatience=this.enemyRanged(e);e.patienceLimit=(rangedPatience?8.5:6.5)+this.random()*(rangedPatience?4.5:3.5);
      e.targetY=this.p.y;e.targetX=this.p.x;e.locked=false;
      if(TYPES[e.type]?.final)this.emit('finalAttackCue',{x:e.x,y:e.y,z:110*e.scale,slot:TYPES[e.type].slot||0,index:Number((key.match(/_m(\d+)$/)||[])[1]||1),name:move.name});
    }
    recoverEnemy(e,duration){e.state='recovery';e.t=duration;e.recoveryTotal=duration;}
    prepareAiFrame(){
      const p=this.p,cells=new Map(),decoys=this.decoys.filter(d=>d.life>0&&d.blocks>0),aliveEnemies=this.enemies.filter(e=>!e.dead&&!e.furnaceCapture),key=(x,y)=>Math.floor(x/120)+','+Math.floor(y/120);
      let active=0,front=0,ranged=0,rangedActive=0;
      for(const e of aliveEnemies){if(!['knockdown','stunned'].includes(e.state))active++;if(distance(p,e)<350&&!['knockdown','stunned'].includes(e.state))front++;const isRanged=this.enemyRanged(e);if(isRanged)ranged++;if(isRanged&&!e.attackLockExempt&&['windup','active'].includes(e.state))rangedActive++;const k=key(e.x,e.y),bucket=cells.get(k);if(bucket)bucket.push(e);else cells.set(k,[e]);}
      let committed=0;for(const e of aliveEnemies)if(!e.attackLockExempt&&['windup','active'].includes(e.state)&&distance(p,e)<620)committed++;
      this.decoys=decoys;this.aiFrame={active,front,ranged,rangedActive,committed,cells,decoys,key};
    }
    nearbyAiEnemies(e){const f=this.aiFrame;if(!f)return this.enemies;const cx=Math.floor(e.x/120),cy=Math.floor(e.y/120),out=[];for(let ix=cx-1;ix<=cx+1;ix++)for(let iy=cy-1;iy<=cy+1;iy++){const bucket=f.cells.get(ix+','+iy);if(bucket)out.push(...bucket);}return out;}
    engagementLimits(){
      const alive=this.aiFrame?.active??this.enemies.filter(e=>!e.dead&&!e.furnaceCapture&&!['knockdown','stunned'].includes(e.state)).length;
      // Soft limits, not caps: a normal fight stays readable, but hoarding enemies steadily
      // increases the number willing to crowd the front line and commit attacks.
      return {alive,front:3+Math.floor(Math.max(0,alive-7)/6)+Math.floor((this.lateIntensity||0)*5),attacks:2+Math.floor(Math.max(0,alive-9)/8)+Math.floor((this.lateIntensity||0)*3)};
    }
    iceFlameMoveMultiplier(e){return e.effects?.iceFlame?.remaining>0?.85:1;}
    permanentFearStep(e,dt,moveSpeed){
      // Keep a fixed home area; neither the player nor each new destination moves it.
      const wander=e.fearWander??={x:e.x,y:e.y,target:null,pause:0};
      e.vx=e.vy=0;
      if(wander.pause>0)wander.pause=Math.max(0,wander.pause-dt);
      else{
        if(!wander.target){
          const x=wander.x+(this.random()*2-1)*180,y=wander.y+(this.random()*2-1)*55;
          wander.target={x:this.loopWorld?x:clamp(x,this.bounds.left+10,this.bounds.right-15),y:clamp(y,410,685)};
        }
        const dx=wander.target.x-e.x,dy=wander.target.y-e.y,dist=Math.hypot(dx,dy),step=Math.min(dist,moveSpeed*.32*dt);
        if(dist>1&&dt>0){e.vx=dx/dist*step/dt;e.vy=dy/dist*step/dt;e.x+=e.vx*dt;e.y+=e.vy*dt;}
        if(dist<=Math.max(1,step)){wander.target=null;wander.pause=.35+this.random()*.75;}
      }
      if(Math.abs(e.vx)>1)e.face=Math.sign(e.vx);
      const speed=Math.hypot(e.vx,e.vy);e.walkDistance+=speed*dt;e.walking=e.moving=speed>1;
    }
    enemyStep(e,dt) {
      if(e.groundDrag&&!isBoss(e))return;
      if(e.dead){if(e.statueCollapse&&!['blackHole','annihilation'].includes(e.deathFlavor)){const h=this.deathBlackHole?.();if(h&&h.life>0&&distance(h,e)<=h.radius){e.deathFlavor='blackHole';e.deathSink=h;e.deathT=0;}}e.deathT+=dt;if(e.deathFlavor==='wind')return;if(e.deathFlavor==='blackHole'){const q=1-Math.exp(-dt*9);e.x+=(e.deathSink.x-e.x)*q;e.y+=(e.deathSink.y-e.y)*q;return;}if(Math.abs(e.knockX)>1||Math.abs(e.knockY)>1||(e.z||0)>0){const wasAirborne=e.z>0;e.x+=e.knockX*dt;e.y+=e.knockY*dt;e.knockX*=Math.exp(-3*dt);e.knockY*=Math.exp(-3*dt);e.knockVz=(e.knockVz||0)-1180*dt;e.z=Math.max(0,(e.z||0)+e.knockVz*dt);if(e.z<=0&&e.knockVz<0)e.knockVz=0;if(!this.loopWorld)e.x=clamp(e.x,this.bounds.left+10,this.bounds.right-15);e.y=clamp(e.y,410,685);if(wasAirborne&&e.z<=0)this.trigger('onEnemyLand',{enemy:e,peakZ:e.launchPeakZ||0});}return;}
      if(e.dummy){e.x=e.homeX;e.y=e.homeY;e.knockX=e.knockY=e.knockVz=e.z=0;}
      if(e.spawnDelay>0){e.spawnDelay=Math.max(0,e.spawnDelay-dt);return;}
      e.hornCd=Math.max(0,(e.hornCd||0)-dt);e.flash=Math.max(0,e.flash-dt);e.red=Math.max(0,e.red-dt);e.guardReaction=Math.max(0,e.guardReaction-dt);e.sinceHit+=dt;e.cd-=dt*(1+(this.lateIntensity||0)*.75);e.postureLock=Math.max(0,(e.postureLock||0)-dt);if(e.tarT>0){e.tarT=Math.max(0,e.tarT-dt);if(e.tarT<=0)e.tarSlow=1;}
      for(const key of ['healCd','raiseCd','consumeCd','summonCd','shurikenCd','backstabCd','spikeGrayCd'])e[key]=Math.max(0,(e[key]||0)-dt);
      if(e.frostT>0){e.frostT=Math.max(0,e.frostT-dt);if(e.frostT<=0)e.frostSlow=1;}
      if(e.mindControlT>0){e.vx*=Math.exp(-10*dt);e.vy*=Math.exp(-10*dt);e.cd=Math.max(e.cd,.2);return;}
      if(e.timeSealT>0||e.furnaceCapture){e.vx=0;e.vy=0;e.knockX=0;e.knockY=0;return;}
      if(e.sleepT>0){e.sleepT=Math.max(0,e.sleepT-dt);e.vx*=Math.exp(-10*dt);e.vy*=Math.exp(-10*dt);e.cd=Math.max(e.cd,.2);return;}
      if(e.tankWound>0){const amount=Math.min(e.tankWound,(e.tankWoundRate||0)*dt);e.tankWound-=amount;this.damageEnemy(e,amount,0,['tankWound','bleed'],{secondary:true,periodic:true,quiet:true,flinch:false});if(e.tankWound<=.001){e.tankWound=0;e.tankWoundRate=0;}if(e.dead)return;}
      if(e.tonguePullT>0&&!['stunned','flinch','knockdown'].includes(e.state)){const q=Math.min(1,dt/e.tonguePullT);e.x+=(e.tongueX-e.x)*q;e.y+=(e.tongueY-e.y)*q;e.tonguePullT=Math.max(0,e.tonguePullT-dt);}
      if(!isBoss(e)&&e.state==='idle'){e.loiterT=(e.loiterT||0)+dt;if(e.loiterT>=(e.patienceLimit||8)/(1+(this.lateIntensity||0)*3))e.forcedAggro=true;}
      if(e.tempoT>0){e.tempoT=Math.max(0,e.tempoT-dt);if(e.tempoT<=0){e.moveBuff=1;e.actionSpeedMultiplier=1;e.damageBuff=1;}}
      const knockFriction=e.state==='knockdown'?3.0:10;
      e.x+=e.knockX*dt;e.y+=e.knockY*dt;e.knockX*=Math.exp(-knockFriction*dt);e.knockY*=Math.exp(-knockFriction*dt);
      if(e.state==='knockdown'){
        const wasAirborne=e.z>0;e.knockVz-=1180*dt;e.z=Math.max(0,(e.z||0)+e.knockVz*dt);e.launchPeakZ=Math.max(e.launchPeakZ||0,e.z);e.t-=dt;
        if(wasAirborne&&e.z<=0){this.trigger('onEnemyLand',{enemy:e,peakZ:e.launchPeakZ||0});e.launchPeakZ=0;if(e.dead)return;}
        if(e.z<=0&&e.knockVz<0)e.knockVz=0;
        if(!this.loopWorld)e.x=clamp(e.x,this.bounds.left+10,this.bounds.right-15);e.y=clamp(e.y,410,685);
        if(e.t<=0&&e.z<=0){
          e.z=0;e.knockVz=0;
          if(e.pendingStun){e.pendingStun=false;e.state='stunned';e.stun=e.stunMax=this.postureBreakDuration(e);e.t=0;e.queue=[];e.cd=.35;}
          else {this.recoverEnemy(e,.38);e.cd=.35;}
        }
        return;
      }
      if(!this.loopWorld)e.x=clamp(e.x,this.bounds.left+10,this.bounds.right-15);e.y=clamp(e.y,410,685);
      const p=this.p;let decoy=null,decoyDist=Infinity;for(const d of this.aiFrame?.decoys||this.decoys)if(!d.dead&&!d.noAggro){const dd=distance(e,d);if(dd<decoyDist){decoy=d;decoyDist=dd;}}const target=(decoy&&decoyDist<720)?decoy:p,dx=target.x-e.x,dy=target.y-e.y,dist=distance(target,e),base=TYPES[e.type],moveSpeed=base.speed*(e.speedMultiplier||1)*(e.bossMoveSpeed||1)*(e.rageSpeed||1)*(e.auraTempo||1)*(e.shellBroken?1.25:1)*(1+(this.lateIntensity||0)*.5)*(e.moveBuff??1)*Math.min(e.frostSlow||1,e.frostTraceBossSlowUntil>this.time?.28:1)*this.iceFlameMoveMultiplier(e)*(e.tarSlow||1)*(e.vineRoot?0:1);
      const ranged=this.enemyRanged(e),reach=base.ranged&&!ranged?this.enemyMeleeReach(e):base.reach;
      if((e.fearT>0||e.permaFear)&&!isBoss(e)&&e.state!=='stunned'&&!e.seal?.remaining&&!e.sleepT){
        e.fearT=Math.max(0,(e.fearT||0)-dt);e.cd=Math.max(e.cd,.25);e.state='idle';e.queue=[];e.attack=null;e.attackLockExempt=false;e.loiterT=0;e.forcedAggro=false;
        if(e.permaFear)this.permanentFearStep(e,dt,moveSpeed);
        else{e.face=Math.sign(e.x-p.x)||1;e.vx=e.face*moveSpeed*.72;e.vy=0;e.x=this.loopWorld?e.x+e.vx*dt:clamp(e.x+e.vx*dt,this.bounds.left+10,this.bounds.right-15);e.walkDistance+=Math.abs(e.vx)*dt;e.walking=e.moving=Math.abs(e.vx)>1;}
        return;
      }
      if((isBoss(e)||e.type==='berserker'||e.type==='tank')&&!e.enraged&&e.hp<=e.maxHp*(base.rageAt??(isBoss(e)?.5:.4))){e.enraged=true;if(!isBoss(e))e.rageSpeed=1.3;this.emit('enrage',{x:e.x,y:e.y,type:e.type});}
      if(e.state==='stunned') {
        // Freeze the target's stun during the actual execution animation.
        if(p.state!=='execute'||p.execTarget!==e&&!p.execQueue.includes(e))e.stun-=dt;
        if(e.stun<=0){e.posture=e.maxPosture;this.recoverEnemy(e,.6);this.emit('recover',{x:e.x,y:e.y});}
        return;
      }
      if(e.state==='flinch'||e.state==='recovery') {
        if(e.state==='recovery'&&!e.queue.length&&e.t>.15&&(e.type==='spear'||e.type==='duelist'||e.attack?.flags?.includes('retreat'))){
          e.x-=e.face*44*dt;e.walkDistance+=44*dt;
        }
        e.t-=dt;
        if(e.t<=0){
          if(e.queue.length&&dist<(ranged?550:420)){
            const limits=this.engagementLimits(),committed=Math.max(0,(this.aiFrame?.committed||0)-(!e.attackLockExempt&&['windup','active'].includes(e.state)&&distance(p,e)<620?1:0));
            if(isBoss(e)||committed<limits.attacks)this.beginEnemyMove(e,e.queue.shift());
            else {e.t=.08;return;}
          }else {
            e.state='idle';
            const base=TYPES[e.type],rangedIdle=this.enemyRanged(e);
            if(TYPES[e.type]?.final)e.cd=.035+this.random()*.075;else if(isBoss(e))e.cd=.08+this.random()*.18;
            else if(rangedIdle){
              const peers=this.enemies.filter(o=>o!==e&&!o.dead&&this.enemyRanged(o)).length;
              e.cd=1.25+this.random()*1.15+Math.min(2.5,peers*.24);
            }else e.cd=.25+this.random()*.45;
            e.queue=[];
          }
        }
        return;
      }
      if(e.state==='windup') {
        e.t+=dt;const a=e.attack;
        if(a.flags?.includes('backstab')){if(e.t<a.wind-.24&&e.backstabTarget){e.x+=clamp(e.backstabTarget.x-e.x,-1050*dt,1050*dt);e.y+=clamp(e.backstabTarget.y-e.y,-500*dt,500*dt);}e.face=p.x>=e.x?1:-1;}
        if(!p.stealth&&!a.flags?.some(f=>['boneHook','backstab','arcaneBeam','holyBeam'].includes(f))&&a.wind-e.t>.22){const wanted=dx>=0?1:-1;if(wanted!==e.face){e.turnWait=(e.turnWait||0)+dt;if(e.turnWait>=(base.turnDelay||.22)){e.face=wanted;e.turnWait=0;}}else e.turnWait=0;e.y+=clamp(dy,-1,1)*Math.min(Math.abs(dy)*4,moveSpeed*.4)*dt;}
        // Align the red flash to the actual contact frame rather than blindly to windup end.
        // Long multi-hit actives can make their first contact well after windup, so their warning
        // may legitimately occur during early active frames instead of too early to perfect-block.
        const flightTime=Math.max(0,Math.hypot(dx-e.face*30,dy)-25)/670;
        if(a.ranged){
          const warningLead=Math.max(0,.18-flightTime-a.active*.35);
          if(warningLead>0&&!e.redDone&&a.wind-e.t<=warningLead){e.redDone=true;e.red=.12;this.emit('warning',{x:e.x,y:e.y,z:85*e.scale});}
        }else{
          const warnAt=a.wind+a.active*(a.contactFraction??.35)-.17;
          if(warnAt<=a.wind&&!e.redDone&&e.t>=Math.max(0,warnAt)){e.redDone=true;e.red=.12;this.emit('warning',{x:e.x,y:e.y,z:85*e.scale});}
        }
        if(e.t>=a.wind){e.state='active';e.t=0;}
        return;
      }
      if(e.state==='active') {
        const a=e.attack;e.t+=dt;
        if(a.lunge){
          const step=e.face*a.lunge*dt,front=(p.x-e.x)*e.face;
          // Very fast charges must not tunnel through a nearby player before their visible
          // contact frame. Stop just short until the hit can resolve, then let the lunge pass.
          if(!e.damageDone&&front>0&&Math.abs(step)>=Math.max(0,front-26))e.x=p.x-e.face*26;
          else e.x+=step;
        }
        const contact=e.t>=a.active*(a.contactFraction??.35);
        if(contact&&!e.manaPaid){if(a.hpCost&&e.hp<=e.maxHp*a.hpCost){e.queue=[];this.recoverEnemy(e,.3);return;}this.lateContact(e,a);if(a.manaCost&&(e.mana||0)<a.manaCost){e.queue=[];this.recoverEnemy(e,.3);return;}if(a.manaCost)e.mana-=a.manaCost;e.manaPaid=true;}
        if(!a.ranged&&!e.redDone&&a.active*(a.contactFraction??.35)>.17&&e.t>=a.active*(a.contactFraction??.35)-.17){e.redDone=true;e.red=.12;this.emit('warning',{x:e.x,y:e.y,z:85*e.scale});}
        if(contact&&!e.swingDone){e.swingDone=true;this.emit('enemySwing',{x:e.x,y:e.y,face:e.face,move:e.moveKey,scale:e.scale});
          if(/捕网手$/.test(TYPES[e.type]?.name||'')&&e.moveKey.endsWith('_m3')){this.netZones.push({x:e.x,y:e.y,radiusX:115,radiusY:48,life:1.8,maxLife:1.8});this.emit('netSpread',{x:e.x,y:e.y});}
        }
        if(contact&&!e.damageDone&&this.resolveEnemySpell(e,a)){}
        else if(a.flags?.includes('boneHook')&&contact&&!e.damageDone){e.damageDone=true;this.projectiles.push({x:e.x+e.face*25,y:e.y,z:48,vx:e.face*1350,vy:0,vz:0,life:360/1350,owner:e.id,reflected:false,damage:0,flags:['boneHook'],moveKey:e.moveKey,originX:e.x,originY:e.y});}
        else if(a.ranged&&contact&&!e.damageDone){
          e.damageDone=true;
          if(e.ammo<=0){e.queue=[];this.recoverEnemy(e,.45);return;}
          e.ammo--;
          if(a.flags?.includes('shuriken'))e.shurikenCd=5;
          if(e.ammo===0){e.queue=[];this.emit('ammoEmpty',{x:e.x,y:e.y,type:e.type});}
          const sx=e.x+e.face*(e.type==='bone_spitter'?-12:30),sy=e.y,sz=e.type==='bone_spitter'?68:48;
          const shotTarget=p.stealth&&target===p?{x:e.targetX,y:e.targetY}:(target||p),tx=shotTarget.x-sx,ty=shotTarget.y-sy,length=Math.hypot(tx,ty)||1;
          if(a.flags?.includes('lob')){
            const n=e.moveKey==='e20_m2'?2:1;for(let i=0;i<n;i++){const lx=shotTarget.x+(i-(n-1)/2)*90,ly=shotTarget.y;this.projectiles.push({bomb:true,x:sx,y:sy,z:sz,sx,sy,tx:lx,ty:ly,flight:.8+i*.18,age:0,radius:95,vx:0,vy:0,vz:0,life:3,owner:e.id,damage:a.damage,posture:a.posture,reflected:false,tar:a.flags.includes('tar'),ignite:a.flags.includes('ignite'),poison:a.flags.includes('poisonCloud')||a.flags.includes('poison'),flags:a.flags||[],projectile:a.projectile,moveKey:e.moveKey});}this.emit('arrow',{x:sx,y:sy});}
          else this.projectiles.push({x:sx,y:sy,z:sz,vx:tx/length*670,vy:ty/length*670,vz:0,life:3,
            owner:e.id,reflected:false,warned:e.redDone,damage:a.damage,special:a.special||'',flags:a.flags||[],moveKey:e.moveKey,projectile:a.projectile||(TYPES[e.type].weapon==='dagger'?'dagger':undefined),aimX:shotTarget.x,aimY:shotTarget.y,cloudTravel:a.flags?.includes('poisonCloud')?length:null,travelled:0,
            javelin:/投枪手$/.test(TYPES[e.type]?.name||'')&&e.moveKey.endsWith('_m1'),net:/捕网手$/.test(TYPES[e.type]?.name||'')&&e.moveKey.endsWith('_m1')});this.emit('arrow',{x:sx,y:sy});
        } else if(!a.ranged&&contact&&!e.damageDone) {
          const inFront=(target.x-e.x)*e.face;
          if(target!==p){
            if((a.both?Math.abs(target.x-e.x)<a.range:inFront>-35&&inFront<a.range)&&Math.abs(target.y-e.y)<a.lane){e.damageDone=true;target.blocks--;if(target.blocks<=0)target.life=Math.min(target.life,.08);this.emit('decoyHit',{x:target.x,y:target.y,perfect:!!target.perfect,rank:target.rank||1,enemyId:e.id});this.trigger('onDecoyHit',{decoy:target,enemy:e,enemyId:e.id,perfect:!!target.perfect,arrow:false});if(target.perfect)this.damageEnemy(e,0,26,'parry');else if((target.rank||1)>=2)this.damageEnemy(e,0,10,'block');}
            if(e.state==='active'&&e.t>=a.active)this.recoverEnemy(e,e.queue.length?.15:a.recovery);return;
          }
          const guard=this.guardActive(),extraX=guard?this.rules.guardReachX:0,extraY=guard?this.rules.guardReachY:0,extraZ=guard?this.rules.guardReachZ:0;
          if((a.both?Math.abs(p.x-e.x)<a.range+extraX:inFront>-35&&inFront<a.range+extraX)&&Math.abs(p.y-e.y)<a.lane+extraY&&p.z<(a.ground?62:100)*e.scale+extraZ){
            e.damageDone=true;const hookDodge=a.flags?.includes('boneHook')&&p.state==='dash';if(hookDodge)this.trigger('onEnemyAttackMiss',{enemy:e,move:a,evaded:true,dash:true});const result=a.flags?.includes('boneHook')?(this.guardActive()?this.receiveHit(a.damage,e,null):p.invuln>0||p.state==='dash'?'immune':'hit'):this.receiveHit(a.damage,e,null);this.resolveEnemyMoveSpecial(e,a,result);
          }else if(a.damage<=0&&a.posture<=0&&a.range<=0){
            e.damageDone=true;this.resolveEnemyMoveSpecial(e,a,'effect');
          }
        }
        if(e.state==='active'&&e.t>=a.active){if(a.flags?.includes('selfDestruct')&&!e.dead&&!e.furnaceCapture)this.resolveEnemyMoveSpecial(e,a,'effect');if(!a.ranged&&!e.damageDone&&distance(p,e)<320)this.trigger('onEnemyAttackMiss',{enemy:e,move:a});this.recoverEnemy(e,e.queue.length?.15:a.recovery);}
        return;
      }
      if(e.dummy){if(e.dummyMode!=='idle'&&!p.stealth&&dist<(e.dummyMode==='shoot'?480:220)&&e.cd<=0){e.queue=[];this.beginEnemyMove(e,e.dummyMode==='shoot'?'shot':'cut');e.cd=e.dummyMode==='shoot'?2.4:1.6;}return;}
      if(e.sinceHit>4&&(e.postureLock||0)<=0)e.posture=Math.min(e.maxPosture,e.posture+dt*4);
      if(dist<920&&!p.stealth)e.alerted=true;if(!e.alerted)return;
      if(p.stealth){const phase=this.time*(.72+(e.id%5)*.04)+(e.aiPhase||e.id),mx=Math.sin(phase*1.31)+Math.cos(phase*.57)*.45,my=Math.cos(phase*.93)+Math.sin(phase*.41)*.55,ml=Math.hypot(mx,my)||1,speed=moveSpeed*(.28+(e.id%4)*.035),smooth=1-Math.exp(-6*dt);e.vx+=(mx/ml*speed-e.vx)*smooth;e.vy+=(my/ml*speed*.72-e.vy)*smooth;e.x=this.loopWorld?e.x+e.vx*dt:clamp(e.x+e.vx*dt,this.bounds.left+10,this.bounds.right-15);e.y=clamp(e.y+e.vy*dt,410,685);e.face=Math.abs(e.vx)>3?Math.sign(e.vx):e.face;e.walkDistance+=Math.hypot(e.vx,e.vy)*dt;e.walking=e.moving=Math.hypot(e.vx,e.vy)>8;e.state='idle';e.queue=[];e.cd=Math.max(e.cd,.25);return;}
      if(e.type==='e14'&&(e.hornCd||0)<=0){this.beginEnemyMove(e,'e14_m1');return;}
      const desiredFace=dx>=0?1:-1;if(desiredFace!==e.face){e.turnWait=(e.turnWait||0)+dt;if(e.turnWait>=(base.turnDelay||.22)){e.face=desiredFace;e.turnWait=0;}}else e.turnWait=0;

      // Duel-paced crowd AI: only the near ring commits aggressively. Mid/far enemies
      // loiter, orbit, and approach slowly so silhouettes and tells remain readable.
      const phase=this.time*(.54+(e.id%4)*.035)+(e.aiPhase||e.id*1.37),boss=isBoss(e);
      const closeBand=ranged?500:330,farBand=ranged?790:700,limits=this.engagementLimits();
      const frontliners=Math.max(0,(this.aiFrame?.front||0)-(dist<350&&!['knockdown','stunned'].includes(e.state)?1:0));
      const rangedPeers=ranged?(this.aiFrame?.ranged||0):0;
      const rangedCommitted=ranged?(this.aiFrame?.rangedActive||0):0;
      const impatient=!boss&&!!e.forcedAggro;
      let mx=0,my=0,pace=1;

      if(boss){
        // Bosses never loiter or wait for a slot: they continuously pressure the player.
        pace=TYPES[e.type]?.final?(dist>reach*1.15?1.62:1.30):(dist>reach*1.15?1.30:1.08);
        mx=Math.sign(dx);my=Math.abs(dy)>18?Math.sign(dy)*.72:0;
      }else if(dist>farBand){
        if(impatient){pace=1.16;mx=Math.sign(dx);my=Math.abs(dy)>30?Math.sign(dy)*.55:0;}
        else{pace=dist>1050?.34:.20;mx=Math.sign(dx)*.28+Math.cos(phase)*.20;my=(Math.abs(dy)>55?Math.sign(dy)*.14:0)+Math.sin(phase*.86)*.66;}
      }else if(dist>closeBand){
        const waiting=frontliners>=limits.front&&!impatient;
        pace=impatient?1.10:(waiting?.15:.43);
        mx=impatient?Math.sign(dx):(waiting?-Math.sign(dx)*.06:Math.sign(dx)*.48);
        my=(Math.abs(dy)>28?Math.sign(dy)*(impatient?.48:.22):0)+Math.sin(phase)*(impatient?.22:.60);
      }else if(ranged){
        pace=impatient?1.02:.72;
        if(Math.abs(dx)<260)mx=-Math.sign(dx);else if(Math.abs(dx)>455)mx=Math.sign(dx)*(impatient?.92:.58);
        if(Math.abs(dy)>22)my=Math.sign(dy)*(impatient?.68:.48);
      }else{
        pace=1.06;
        if(Math.abs(dx)>reach*.78)mx=Math.sign(dx);
        if(Math.abs(dy)>19)my=Math.sign(dy)*.75;
        if((e.type==='dual'||e.type==='duelist')&&Math.abs(dx)>190&&Math.abs(dy)<12)my=(e.id%2?1:-1)*.45;
        if(e.type==='spear'&&Math.abs(dx)<110)mx=-Math.sign(dx);
      }

      // Separation prevents a single unreadable body pile without forcing enemies to flee.
      for(const other of this.nearbyAiEnemies(e)){
        if(other===e||other.dead||base.spectral||TYPES[other.type].spectral)continue;
        const near=Math.hypot(e.x-other.x,(e.y-other.y)*1.6);
        if(near<82){my+=(e.y>=other.y?1:-1)*.8;mx+=(e.x>=other.x?1:-1)*.34;}
      }
      const ml=Math.hypot(mx,my)||1,smooth=1-Math.exp(-15*dt),targetSpeed=moveSpeed*pace;
      e.vx+=(mx/ml*targetSpeed-e.vx)*smooth;e.vy+=(my/ml*targetSpeed*.68-e.vy)*smooth;
      e.x+=e.vx*dt;e.y+=e.vy*dt;e.walkDistance+=Math.hypot(e.vx,e.vy)*dt;e.walking=Math.hypot(e.vx,e.vy)>8;

      // Engagement is a soft budget. It grows when the player lets a crowd accumulate, so
      // stalling cannot keep an arbitrarily large army politely waiting off-screen. Bosses
      // ignore the budget entirely and always claim an attack when in range.
      const engaged=Math.max(0,(this.aiFrame?.committed||0)-(!e.attackLockExempt&&['windup','active'].includes(e.state)&&distance(p,e)<620?1:0));
      const aggressive=boss||impatient||dist<=closeBand+35;
      const ninjaThrow=this.ninjaThrowReady(e,dist);
      const rangeOK=ninjaThrow|| (base.bossKind?dist<950&&this.bossHasMove(e):base.final&&base.ranged?dist<1050:ranged?aggressive&&dist<(impatient?650:545):aggressive&&Math.abs(dx)<reach+(impatient?80:34)&&Math.abs(dy)<(impatient?78:54));
      // Ranged units deliberately share firing attention. As their count rises, more of them
      // orbit and wait instead of creating an unreadable projectile wall. A unit that has
      // loitered for too long becomes impatient, pushes in, and ignores both soft locks once.
      const rangedSoftSlots=Math.max(1,Math.ceil(rangedPeers/8));
      const rangedPermission=!ranged||impatient||rangedCommitted<rangedSoftSlots;
      const attackPermission=!e.vineMute&&(boss||impatient||engaged<limits.attacks);
      if(e.cd<=0&&rangeOK&&attackPermission&&rangedPermission&&p.state!=='execute'&&!p.stealth){
        e.queue=ninjaThrow?[base.moveKeys.find(k=>MOVES[k].flags?.includes('shuriken'))]:this.chooseSequence(e);this.beginEnemyMove(e,e.queue.shift());
      }
    }
    applyEnemyProjectileAilment(e,b){
      e.effects??={};for(const [flag,type,dps,duration] of [['poison','poison',7,4],['burn','burn',7,3],['fire','burn',7,3]]){
        if(!b.flags?.includes(flag))continue;const old=e.effects[type];e.effects[type]={dps:Math.max(dps,old?.dps||0),postureDps:old?.postureDps||0,remaining:Math.max(duration,old?.remaining||0),forecastDuration:duration,tick:old?.tick||0,infinite:false,tags:['reflect',type]};
      }
    }
    createEnemyZone(b){
      if(b.zoneCreated)return;b.zoneCreated=true;
      if(b.tar||b.poison||b.flags?.includes('poisonCloud'))this.tarZones.push({x:b.x,y:b.y,radius:b.radius||95,life:b.tar?3.5:3,maxLife:b.tar?3.5:3,poison:!!(b.poison||b.flags?.includes('poisonCloud')),burning:false,friendly:!!b.reflected,owner:b.owner});
      if(b.ignite)for(const zone of this.tarZones)if(!zone.poison&&Math.hypot(zone.x-b.x,zone.y-b.y)<zone.radius+(b.radius||80)){zone.burning=true;zone.life=Math.max(zone.life,2.5);zone.maxLife=Math.max(zone.maxLife,zone.life);}
    }
    returnLob(b,owner){
      const tx=owner?.x??this.p.x+this.p.face*300,ty=owner?.y??this.p.y;
      Object.assign(b,{reflected:true,returnArc:true,sx:b.x,sy:b.y,tx,ty,startZ:45,z:45,age:0,flight:clamp(Math.hypot(tx-b.x,ty-b.y)/670,.34,.9),life:2,damage:b.damage>0&&b.reflectRank?b.damage:35,warned:true,vx:0,vy:0,vz:0,zoneCreated:false});
    }
    stepLob(b,dt){
      const owner=this.enemies.find(e=>e.id===b.owner);
      if(b.reflected&&!b.returnArc){this.returnLob(b,owner);return;}
      b.age+=dt;b.life-=dt;
      if(!b.reflected&&!b.warned&&b.flight-b.age<=.18){b.warned=true;this.emit('arrowWarning',{x:b.x,y:b.y,z:b.z});}
      const q=Math.min(1,b.age/b.flight);b.x=b.sx+(b.tx-b.sx)*q;b.y=b.sy+(b.ty-b.sy)*q;b.z=(b.startZ??48)*(1-q)+Math.sin(q*Math.PI)*170;
      if(q<1)return;
      if(b.reflected){
        if(!b.tar)for(const e of this.enemies)if(!e.dead&&!e.furnaceCapture&&!e.spawnDelay&&Math.hypot(e.x-b.x,(e.y-b.y)*1.6)<b.radius){this.damageEnemy(e,b.damage,42,['reflect','explosion',...(b.flags||[])]);this.applyEnemyProjectileAilment(e,b);}
        this.createEnemyZone(b);this.emit('enemyExplosion',{x:b.x,y:b.y,radius:b.radius,reflected:true,projectile:b.projectile,color:b.projectile==='voidBomb'?'#d84bba':undefined});b.life=0;return;
      }
      const p=this.p;let result='miss';
      if(Math.hypot(p.x-b.x,(p.y-b.y)*1.6)<b.radius&&p.z<90){
        if(!b.tar||this.guardActive())result=this.receiveHit(b.tar?0:b.damage,owner,b);
      }
      if(b.reflected||['block','parry','block-reflect'].includes(result)){this.returnLob(b,owner);return;}
      this.createEnemyZone(b);if(owner)this.resolveEnemyMoveSpecial(owner,{flags:b.flags||[],special:'',name:b.moveKey||''},result);
      if(!b.tar)this.emit('enemyExplosion',{x:b.x,y:b.y,radius:b.radius,poison:b.poison,projectile:b.projectile,color:b.projectile==='voidBomb'?'#d84bba':undefined});b.life=0;
    }
    projectileStep(dt) {
      for(const b of this.projectiles){
        if(b.life<=0)continue;
        if(b.bomb){this.stepLob(b,dt);continue;}
        const oldX=b.x,oldY=b.y;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.travelled=(b.travelled||0)+Math.hypot(b.x-oldX,b.y-oldY);
        if(!b.reflected){
          const decoy=this.decoys.filter(d=>d.life>0&&d.blocks>0&&!d.noAggro).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
          if(decoy&&this.segmentContact(oldX,oldY,b.x,b.y,decoy,30,34)&&b.z>=4&&b.z<=96){
            const shooter=this.enemies.find(e=>e.id===b.owner);decoy.blocks--;if(decoy.blocks<=0)decoy.life=Math.min(decoy.life,.08);b.life=0;
            this.emit('decoyHit',{x:decoy.x,y:decoy.y,perfect:!!decoy.perfect,rank:decoy.rank||1,enemyId:shooter?.id,arrow:true});this.trigger('onDecoyHit',{decoy,enemy:shooter,enemyId:shooter?.id,perfect:!!decoy.perfect,arrow:true});
            if(shooter&&!shooter.dead){if(decoy.perfect)this.damageEnemy(shooter,0,26,'parry');else if((decoy.rank||1)>=2)this.damageEnemy(shooter,0,10,'block');}
            continue;
          }
          const p=this.p,remaining=((p.x-b.x)*b.vx+(p.y-b.y)*b.vy)/(b.vx*b.vx+b.vy*b.vy);
          const cross=Math.abs((p.x-b.x)*b.vy-(p.y-b.y)*b.vx)/Math.hypot(b.vx,b.vy);
          if(!b.warned&&remaining>=0&&remaining<=.18&&cross<60){
            b.warned=true;const e=this.enemies.find(e=>e.id===b.owner);if(e)e.red=.12;
            this.emit('arrowWarning',{x:b.x,y:b.y,z:b.z});
          }
          const guard=this.guardActive(),reach=guard?this.rules.arrowGuardReach+(b.homing?28:0):0;
          if(this.segmentContact(oldX,oldY,b.x,b.y,p,25+reach+(b.hitRadiusX||0),27+(b.hitRadiusY||0)+(guard?this.rules.guardReachY+(b.homing?12:0):0))&&b.z+(b.hitRadiusY||0)>=p.z+9-(guard?this.rules.guardReachZ:0)&&b.z-(b.hitRadiusY||0)<=p.z+92+(guard?this.rules.guardReachZ:0)){
            const e=this.enemies.find(e=>e.id===b.owner);
            if(b.flags?.includes('boneHook')){b.life=0;if(this.guardActive()){if(this.guardTime()<=this.rules.guardStartup+this.rules.perfectWindow)this.resolvePerfectBlock(e,null,{preservePlayer:true,reflectArrow:false});else this.blockHit(0,e,null,{source:'boneHook'});continue;}if(p.invuln>0||p.state==='dash'){if(p.state==='dash'&&e)this.trigger('onEnemyAttackMiss',{enemy:e,evaded:true,dash:true,arrow:b});continue;}if(e&&!e.dead&&!e.furnaceCapture){this.resolveEnemyMoveSpecial(e,{flags:['boneHook']},'hit');this.recoverEnemy(e,.25);}continue;}
            const result=this.receiveHit(b.damage,e,b);if(b.net)this.emit('netImpact',{x:b.x,y:b.y,z:b.z});if(result!=='parry'&&result!=='block-reflect'){if(b.flags?.includes('poisonCloud'))this.createEnemyZone(b);b.life=0;if(e)this.resolveEnemyMoveSpecial(e,{special:b.special||'',flags:b.flags||[],name:b.moveKey||'',damage:b.damage,posture:0},result);}
          }
        }else {
          for(const e of this.enemies){
            if(e.dead||e.furnaceCapture||e.spawnDelay||e.mindControlT>0||(e.timeSealT>0&&!this.p.canAttackTimeSeal)||b.chainHits?.has(e.id))continue;
            const body=isBoss(e)?this.enemyHurtbox(e):null;
            if(this.segmentContact(oldX,oldY,b.x,b.y,body||e,(body?.rx??22*e.scale)+(b.hitRadiusX||0),(body?.ry??30)+(b.hitRadiusY||0))&&b.z+(b.hitRadiusY||0)>(body?.bottom??0)&&b.z-(b.hitRadiusY||0)<(body?.top??100*e.scale)){
              const rank=b.reflectRank||0,hitDamage=b.damage||35,chainLightning=Number.isFinite(b.chainRemaining);this.damageEnemy(e,hitDamage,[42,45,50,55][rank],['reflect',...(chainLightning?['lightning']:[]),...(b.flags||[])]);
              if((b.flags||[]).includes('poison')){e.effects??={};const old=e.effects.poison;e.effects.poison={dps:Math.max(7,old?.dps||0),postureDps:old?.postureDps||0,remaining:Math.max(5,old?.remaining||0),forecastDuration:Math.max(5,old?.forecastDuration||0),tick:old?.tick||0,infinite:false,tags:['reflect','poison']};}
              if((b.flags||[]).some(f=>f==='fire'||f==='burn')){e.effects??={};const old=e.effects.burn;e.effects.burn={dps:Math.max(9,old?.dps||0),postureDps:old?.postureDps||0,remaining:Math.max(4,old?.remaining||0),forecastDuration:Math.max(4,old?.forecastDuration||0),tick:old?.tick||0,infinite:false,tags:['reflect','fire']};}
              if(rank>=3){for(const other of this.enemies)if(!other.dead&&!other.furnaceCapture&&other!==e&&Math.hypot(other.x-e.x,other.y-e.y)<135)this.damageEnemy(other,30,30,['reflect','explosion'],{secondary:true,quiet:true});this.emit('reflectExplosion',{x:e.x,y:e.y,radius:135});}
              b.chainHits??=new Set();b.chainHits.add(e.id);
              const next=b.chainRemaining>0?this.enemies.filter(o=>!o.dead&&!o.spawnDelay&&!(o.mindControlT>0)&&(!(o.timeSealT>0)||this.p.canAttackTimeSeal)&&!b.chainHits.has(o.id)&&distance(e,o)<=650).sort((a,c)=>distance(e,a)-distance(e,c))[0]:null;
              if(next){b.chainRemaining--;b.x=e.x;b.y=e.y;b.z=45;this.aimReflectedProjectile(b,next,1100);b.life=1.2;this.emit('lightningDashBounce',{x:e.x,y:e.y,toX:next.x,toY:next.y});}else b.life=0;
              this.hitstop(.025);break;
            }
          }
        }
        if(!b.reflected&&b.cloudTravel!=null&&b.travelled>=b.cloudTravel){this.createEnemyZone(b);b.life=0;}
        if(b.z<0)b.life=0;
      }
      this.projectiles=this.projectiles.filter(b=>b.life>0);
    }
    aimReflectedProjectile(b,e,speed){
      const live=e&&!e.dead&&!e.furnaceCapture,body=live&&isBoss(e)?this.enemyHurtbox(e):null;
      // Aim at the posed torso, including its height, rather than the old foot-level point.
      const dx=live?(body?.x??e.x)-b.x:this.p.face*400,dy=live?(body?.y??e.y)-b.y:0,len=Math.hypot(dx,dy)||1;
      b.vx=dx/len*speed;b.vy=dy/len*speed;b.vz=live?((body?(body.bottom+body.top)/2:(e.z||0)+46)-b.z)/(len/speed):0;
    }
    scatterReflection(b){if(b.reflectRank<2||b.splitDone)return;b.splitDone=true;for(const sign of [-1,1]){const a=Math.atan2(b.vy,b.vx)+sign*.32,speed=Math.hypot(b.vx,b.vy);this.projectiles.push({...b,x:b.x+Math.cos(a)*32,y:b.y+Math.sin(a)*32,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,splitDone:true});}this.emit('reflectFan',{x:b.x,y:b.y,z:b.z});}
    enemyHurtbox(e){return bossGeometry.hurtbox(e,TYPES[e.type],this.time);}
    segmentContact(x1,y1,x2,y2,target,rx,ry) {
      const dx=(x2-x1)/rx,dy=(y2-y1)/ry,tx=(target.x-x1)/rx,ty=(target.y-y1)/ry;
      const u=clamp((tx*dx+ty*dy)/(dx*dx+dy*dy||1),0,1);
      return (tx-u*dx)**2+(ty-u*dy)**2<=1;
    }
    step(dt,input={},pressed={}) {
      if(this.status!=='playing')return;dt=Math.min(dt,.033);
      if(this.freeze>0){
        this.freeze=Math.max(0,this.freeze-dt);
        this.pendingPress={...this.pendingPress,...pressed};return;
      }
      this.flushCombatCascades();
      pressed={...this.pendingPress,...pressed};this.pendingPress={};
      this.time+=dt;this.chainTimer=Math.max(0,this.chainTimer-dt);if(!this.chainTimer)this.hitChain=0;
      for(const zone of this.netZones){zone.life-=dt;if(this.p.z<40&&Math.abs(this.p.x-zone.x)<zone.radiusX&&Math.abs(this.p.y-zone.y)<zone.radiusY){this.p.enemySlow=Math.min(this.p.enemySlow||1,.55);this.p.enemySlowT=Math.max(this.p.enemySlowT||0,.12);}}
      this.netZones=this.netZones.filter(zone=>zone.life>0);
      this.p.tarT=Math.max(0,(this.p.tarT||0)-dt);
      this.p.hunterMarkT=Math.max(0,(this.p.hunterMarkT||0)-dt);
      for(const zone of this.tarZones){zone.life-=dt;
        if(zone.friendly){for(const e of this.enemies)if(!e.dead&&!e.furnaceCapture&&Math.hypot(e.x-zone.x,(e.y-zone.y)*2)<zone.radius){if(!zone.poison){e.tarT=.4;e.tarSlow=.72;}if(zone.poison||zone.burning)this.applyEnemyProjectileAilment(e,{flags:[zone.poison?'poison':'burn']});}}
        else if(this.p.z<50&&Math.hypot(this.p.x-zone.x,(this.p.y-zone.y)*2)<zone.radius){if(zone.poison)this.applyPlayerDot('poison',4,1,'zone');else{if(!zone.fireOnly)this.p.tarT=Math.max(this.p.tarT,2);if(zone.burning)this.applyPlayerDot('burn',5,1,'zone');}}
      }
      if(this.p.tarT>0){this.p.enemySlow=Math.min(this.p.enemySlow||1,.72);this.p.enemySlowT=Math.max(this.p.enemySlowT||0,.2);}
      this.tarZones=this.tarZones.filter(zone=>zone.life>0);
      this.updatePlayer(dt,input,pressed);this.updatePlayerAilments(dt);
      const enemyDt=dt*clamp(this.p.enemyTimeScale||1,.05,1);
      this.prepareAiFrame();this.updateEnemyFields(enemyDt);for(const e of this.enemies)this.enemyStep(e,enemyDt);
      this.projectileStep(enemyDt);
      if(this.externalFlow)return;
      if(!this.stageClear&&this.enemies.every(e=>e.dead)){
        this.stageClear=true;this.clearTimer=0;this.emit('clear',{stage:this.stage});
        if(this.stage<STAGES.length-1)this.bounds.right+=210;
      }
      if(this.stageClear){
        this.clearTimer+=dt;
        if(this.stage===STAGES.length-1&&this.clearTimer>1.3){this.status='victory';this.emit('victory');}
        else if(this.stage<STAGES.length-1&&this.p.x>this.stageInfo.exit){
          this.stage++;this.stageClear=false;const info=this.stageInfo,chapterChanged=info.area===0;
          this.bounds={left:info.left,right:info.right};
          this.enemies=[];this.projectiles=[];this.netZones=[];this.tarZones=[];this.enemyHazards=[];this.enemyCorpses=[];
          if(chapterChanged){this.p.x=info.startX;this.p.y=550;this.p.z=0;this.p.vz=0;this.p.state='idle';this.p.jumps=0;this.p.airDash=false;this.p.hp=this.p.maxHp;}
          else this.p.hp=Math.min(this.p.maxHp,this.p.hp+32);
          this.spawnStage(this.stage);this.emit('chapter',{stage:this.stage,chapterChanged});
        }
      }
    }
  }
  const api={Game,ATTACKS,MOVES,TYPES,CHAPTERS,STAGES,GUARD,isBoss,clamp,distance,ENEMY_CATALOG};
  const finalBoss=typeof module==='object'&&module.exports?require('./boss.js').final:globalThis.AshFinalBoss;
  finalBoss.install(api);
  const installLateEnemies=({Game,TYPES,MOVES,distance})=>{
  const P=Game.prototype,guard=a=>a.flags?.some(f=>['guardStance','parryStance','spikeGuard'].includes(f));
  const wrap=(key,fn)=>{const old=P[key];P[key]=function(...args){return fn.call(this,old,...args);};};
  const suppressed=(e,t)=>e.antiRegen||e.suppressDeathrattle||t.some(x=>['execution','slay','noDeathrattle','devour','selfDestruct','sacrifice'].includes(x));
  const tags=k=>Array.isArray(k)?k:[k];
  wrap('reset',function(old,...args){const result=old.apply(this,args);this.lateZones=[];this.lateSigils=[];return result;});
  P.lateMoveAllowed=function(e,a){
    const b=TYPES[e.type],d=distance(e,this.p);
    if((e.moveCooldowns?.[a.key]||0)>0||guard(a)&&((e.guardCd||0)>0||e.offensive))return false;
    if(a.emptyManaOnly&&(e.mana||0)>0)return false;
    if(a.hpBelow!==undefined&&!(e.hp<e.maxHp*a.hpBelow||(a.emptyManaAlternative&&e.mana<=0)))return false;
    if(a.once&&e.specialUsed[a.key])return false;
    if(a.hpCost&&e.hp<=e.maxHp*a.hpCost)return false;
    if(a.frontOnly&&((this.p.x-e.x)*e.face<0||d>420))return false;
    if(a.flags?.includes('selfDestruct')&&d>a.range+Math.max(0,a.lunge||0)*(a.active||.16))return false;
    if(a.flags?.includes('spawnMinion')&&((e.summonCd||0)>0||this.enemies.filter(o=>!o.dead&&o.summonerId===e.id).length>(a.cap||4)-(a.countMin||1)))return false;
    if(a.flags?.includes('devourAlly')&&!this.enemies.some(o=>o!==e&&!o.dead&&o.hp/o.maxHp<.1&&distance(o,e)<330&&!TYPES[o.type].boss))return false;
    if(a.flags?.includes('truthSacrifice')&&e.truthUsed)return false;
    return true;
  };
  wrap('chooseQualitySequence',function(old,e,cycle){
    const b=TYPES[e.type],original=b.moveKeys;
    const keys=original.filter(k=>this.lateMoveAllowed(e,MOVES[k]));
    const priority=keys.find(k=>MOVES[k].flags.some(f=>['selfDestruct','truthSacrifice','sigilSacrifice'].includes(f))&&(MOVES[k].mustExplodeBelow===undefined||e.hp<e.maxHp*MOVES[k].mustExplodeBelow));
    if(priority)return [priority];
    // Filter only during this synchronous selection; shared type data never persists a per-enemy cooldown.
    b.moveKeys=keys;try{const selected=old.call(this,e,cycle);return selected.filter(k=>this.lateMoveAllowed(e,MOVES[k]));}finally{b.moveKeys=original;}
  });
  wrap('beginEnemyMove',function(old,e,key){
    let a=MOVES[key];if(a&&!this.lateMoveAllowed(e,a)){e.queue=[];this.recoverEnemy(e,.25);return;}
    old.call(this,e,key);a=e.attack;if(!a)return;
    if(guard(a))e.guardCd=7;
    if(a.flags?.includes('burrowStrike')){e.burrowT=.75;e.burrowTarget={x:this.p.x-this.p.face*65,y:this.p.y};e.state='burrow';e.vx=e.vy=0;this.emit('enemyBurrow',{x:e.x,y:e.y,toX:e.burrowTarget.x,toY:e.burrowTarget.y});}
    if(e.swarmTier)a.damage*=e.swarmTier===1?.5:e.swarmTier===2?.75:e.swarmTier===4?1.2:1;
  });
  P.lateContact=function(e,a){
    if(e.latePaid)return;e.latePaid=true;
    if(a.hpCost){e.hp-=e.maxHp*a.hpCost;this.emit('enemyBloodCost',{x:e.x,y:e.y,amount:e.maxHp*a.hpCost});}
    if(a.cooldown){e.moveCooldowns??={};e.moveCooldowns[e.moveKey]=a.cooldown;}
    if(a.once)e.specialUsed[e.moveKey]=true;
  };
  wrap('resolveEnemyMoveSpecial',function(old,e,a,result){
    if(!e||!a)return;const f=a.flags||[];
    if(f.includes('spawnMinion')){
      if(e.lateEffectDone)return;
      const room=(a.cap||4)-this.enemies.filter(o=>!o.dead&&o.summonerId===e.id).length;
      if(room<(a.countMin||1))return;
      const count=a.countMin?Math.min(room,a.countMin+Math.floor(this.random()*(a.countMax-a.countMin+1))):(a.count||1);
      e.lateEffectDone=true;e.summonCd=a.cooldown||9;
      for(let i=0;i<Math.min(count,room);i++){const c=this.spawnEnemyMinion(e,a.summonType,e.x+(i%2?-1:1)*(65+i*18),e.y+(i%2?22:-22));if(a.smallSpawn){c.hp=c.maxHp=Math.max(1,Math.round(c.maxHp*.25));c.posture=c.maxPosture=Math.max(1,Math.round(c.maxPosture*.45));c.swarmTier=1;}}
      return;
    }
    if(f.includes('groundSlide')){e.slideT=.26;e.slideDir=e.x<this.p.x?1:-1;return;}
    if(f.includes('groundZone')){this.lateZones??=[];this.lateZones.push({x:a.frontOnly?e.x+e.face*150:e.targetX,y:a.frontOnly?e.y:e.targetY,life:5,radius:100,kind:a.zone});this.emit('enemyZone',{x:e.targetX,y:e.targetY,kind:a.zone});return;}
    if(f.includes('truthSacrifice')){if(!e.truthUsed){e.truthUsed=true;e.hp=e.maxHp;e.posture=e.maxPosture;this.emit('enemyExplosion',{x:e.x,y:e.y,radius:a.range});}return;}
    if(f.includes('sigilSacrifice')){if(e.lateEffectDone)return;e.lateEffectDone=true;this.lateSigils??=[];this.lateSigils.push({x:e.targetX,y:e.targetY,t:1.1,owner:e,damage:32});this.kill(e,['sacrifice']);return;}
    if(f.includes('devourAlly')){const victim=this.enemies.find(o=>o!==e&&!o.dead&&!TYPES[o.type].boss&&o.hp/o.maxHp<.1&&distance(o,e)<330);if(victim){this.kill(victim,['slay','devour']);e.corpseStacks=(e.corpseStacks||0)+1;this.healEnemy(e,e.maxHp*.12,{source:'devour'});this.emit('enemyPull',{x:victim.x,y:victim.y,source:e.type});}return;}
    return old.call(this,e,a,result);
  });
  wrap('enemyStep',function(old,e,dt){
    if(e.dead||e.furnaceCapture||e.spawnDelay>0)return old.call(this,e,dt);
    if(e.medusaGold||e.medusaUntil>this.time){e.vx=e.vy=e.knockX=e.knockY=e.knockVz=0;e.walking=e.moving=false;e.flash=Math.max(0,(e.flash||0)-dt);return;}
    if(e.medusaPose){delete e.medusaPose;e.medusaTick=0;}
    const b=TYPES[e.type];e.age=(e.age||0)+dt;e.guardCd=Math.max(0,(e.guardCd||0)-dt);for(const k in e.moveCooldowns)e.moveCooldowns[k]=Math.max(0,e.moveCooldowns[k]-dt);
    if(b.swarm){const r=e.hp/e.maxHp;e.swarmTier=b.swarm===4?(r>=.7?4:r>=.4?3:r>=.2?2:1):(r>=.66?3:r>=.33?2:1);e.eliteLost=b.swarm===4&&r<.4;e.moveBuff=e.swarmTier===1?.6:e.swarmTier===2?.8:e.swarmTier===4?1.15:1;}
    if(b.rageOnWeak&&(e.hp/e.maxHp<.35||(b.heads===2&&(this.p.hp+this.p.grayHp)/this.p.maxHp<.35))){e.enraged=true;e.rageSpeed=1.35;}
    if(b.rapidLow&&e.hp/e.maxHp<.3)e.rageSpeed=1.6;
    if(b.offensiveSwitch&&(e.hp/e.maxHp<.35||e.state==='stunned')){e.offensive=true;e.rageSpeed=1.4;e.moveBuff=1.35;}
    if(e.state==='dormant'){e.dormantT-=dt;e.vx=e.vy=0;if(e.dormantT<=0){if(e.antiRegen){this.kill(e,['noDeathrattle']);return;}e.hp=e.maxHp*b.dormantHeal;e.posture=e.maxPosture;e.state='idle';e.cd=.6;this.emit('enemyRevive',{x:e.x,y:e.y,type:e.type});}return;}
    if(e.state==='petrifying'){
      e.petrifyT=Math.min(.85,(e.petrifyT||0)+dt);e.vx=e.vy=e.knockX=e.knockY=0;e.walking=false;
      if(e.petrifyT>=.85){e.state='dormant';e.dormantT=b.dormantSeconds;e.dormantUsed=true;}return;
    }
    if(b.dormantThreshold&&(!e.dormantUsed||!b.dormantOnce)&&e.hp/e.maxHp<b.dormantThreshold&&e.hp>0){
      if(b.bodyPlan==='statue'){
        // Complete the current strike and its full recovery before channeling.
        e.queue=[];if(e.state==='idle'){e.state='petrifying';e.petrifyT=0;e.attack=null;e.walking=false;e.vx=e.vy=0;return;}
      }else{e.dormantUsed=true;e.dormantT=b.dormantSeconds;e.state='dormant';e.queue=[];e.attack=null;return;}
    }
    if(e.state==='burrow'){e.burrowT-=dt;const q=Math.min(1,dt/Math.max(dt,e.burrowT+dt));e.x+=(e.burrowTarget.x-e.x)*q;e.y+=(e.burrowTarget.y-e.y)*q;if(e.burrowT<=0){e.state='windup';e.t=0;e.attack.wind=.55/(e.bossActionSpeed||1);e.face=this.p.x>=e.x?1:-1;this.emit('warning',{x:e.x,y:e.y});}return;}
    if(e.slideT>0){e.slideT=Math.max(0,e.slideT-dt);e.x+=e.slideDir*620*dt;e.y+=(e.id%2?1:-1)*95*dt;}
    if(b.autoConsume){const corpse=this.availableCorpse(e,90);if(corpse){corpse.used=true;e.corpseStacks=(e.corpseStacks||0)+1;this.healEnemy(e,e.maxHp*.045,{source:'consumeCorpse'});this.emit('enemyConsume',{x:e.x,y:e.y,stacks:e.corpseStacks,enemyType:e.type});}}
    if(e.type==='void_aggregate')e.scale=b.scale*(1+Math.min(12,e.corpseStacks||0)*.075);
    if(b.shatterBlessing&&e.age>=25&&(e.blessCheck||0)<=e.age){e.blessCheck=e.age+5;if(this.random()<.3){for(const a of this.enemies.filter(a=>a!==e&&!a.dead&&distance(e,a)<650).sort((a,b)=>distance(e,a)-distance(e,b)).slice(0,10)){this.healEnemy(a,a.maxHp*.2,{source:'obelisk'});a.tempoT=5;a.moveBuff=1.25;a.actionSpeedMultiplier=1.25;}this.kill(e,['sacrifice']);return;}}
    const before=this.projectiles.length,attack=e.attack,wasActive=e.state==='active';
    const result=old.call(this,e,dt);
    if(attack?.shots>1&&this.projectiles.length>before){const shot=this.projectiles[before],angle=Math.atan2(shot.vy,shot.vx);for(let i=1;i<attack.shots;i++){const a=angle+(i%2?1:-1)*.18*Math.ceil(i/2);this.projectiles.push({...shot,vx:Math.cos(a)*670,vy:Math.sin(a)*670});}}
    if(wasActive&&attack?.flags?.includes('truthSacrifice')&&!e.truthUsed&&e.state==='recovery')this.resolveEnemyMoveSpecial(e,attack,'miss');
    return result;
  });
  wrap('damageEnemy',function(old,e,damage,posture,kind='normal',options={}){
    if(e?.state==='burrow'){if(tags(kind).includes('quakeStomp')){e.burrowT=0;e.state='flinch';e.t=.8;e.queue=[];e.attack=null;this.emit('enemyExplosion',{x:e.x,y:e.y,radius:85});}else return;}
    const dormant=e?.state==='dormant'||e?.state==='petrifying',stoneState=e?.state;const result=old.call(this,e,damage,posture,kind,options);
    if(e&&!e.dead&&!e.furnaceCapture&&TYPES[e.type]?.hatch&&e.posture<=0)this.kill(e,kind);
    if(dormant&&!e.dead&&!e.furnaceCapture){e.state=stoneState;e.knockX=e.knockY=e.knockVz=0;}return result;
  });
  wrap('kill',function(old,e,kind='normal'){
    if(e.dead)return;const b=TYPES[e.type],t=tags(kind);
    const burstThrough=b.hatch&&e.hp<=0&&e.lastDamageRecord?.time===this.time&&e.lastDamageRecord.preHp>e.maxHp*.4;
    if(b.hatch&&!burstThrough&&!suppressed(e,t)&&!e.hatched){e.hatched=true;this.emit('enemyCocoonBurst',{x:e.x,y:e.y,abyss:true});this.spawnEnemyMinion(e,b.hatch,e.x,e.y);}
    if(b.reviveChances&&!e.medusaGold&&!(e.medusaUntil>this.time)&&!suppressed(e,t)){const n=e.reviveCount||0;if(n<b.reviveChances.length&&this.random()<b.reviveChances[n]){e.reviveCount=n+1;e.hp=e.maxHp*.6;e.posture=e.maxPosture*.6;e.state='recovery';e.t=2;e.queue=[];this.emit('enemyRevive',{x:e.x,y:e.y,type:e.type});return;}}
    const collapse=b.bodyPlan==='statue'&&['petrifying','dormant'].includes(e.state)&&!e.groundDrag&&!e.furnaceConsumed&&!e.furnaceCapture;
    const result=old.call(this,e,kind);if(collapse&&e.dead&&!['blackHole','stone','goldStone'].includes(e.deathFlavor)){e.statueCollapse=true;e.knockX=e.knockY=e.knockVz=0;}return result;
  });
  wrap('isSmallEnemy',function(old,e){return e?.eliteLost?true:old.call(this,e);});
  wrap('updateEnemyFields',function(old,dt){
    old.call(this,dt);this.p.voidMire=false;
    for(const z of this.lateZones||[]){z.life-=dt;if(z.life>0&&distance(z,this.p)<z.radius&&this.p.z<40){this.p.enemySlow=Math.min(this.p.enemySlow||1,z.kind==='void'?.82:.55);this.p.enemySlowT=.15;if(z.kind==='void')this.p.voidMire=true;}}
    this.lateZones=(this.lateZones||[]).filter(z=>z.life>0);
    for(const s of this.lateSigils||[]){s.t-=dt;if(s.t<=0){if(distance(s,this.p)<100&&this.p.z<100)this.receiveHit(s.damage,s.owner,null);this.emit('enemyExplosion',{x:s.x,y:s.y,radius:100});}}
    this.lateSigils=(this.lateSigils||[]).filter(s=>s.t>0);
  });

  };
  installLateEnemies(api);
  const bossEncounters=typeof module==='object'&&module.exports?require('./boss.js').encounters:globalThis.AshBossEncounters;
  bossEncounters.install(api);
  return api;
});
