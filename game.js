/* Shared extension points are available before combat loads. */
const AshSystems=(()=>{
  'use strict';
  class EventBus{
    constructor(){this.listeners=new Map();}
    on(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);return()=>this.listeners.get(name)?.delete(fn);}
    emit(name,event={}){event.event=name;for(const fn of [...(this.listeners.get(name)||[])])fn(event);return event;}
    modify(rule,value,context={}){return this.emit(`modify:${rule}`,{value,...context}).value;}
  }
  const KILL_TAGS=['normal','comboFinisher','heavy','thrust','downStrike','execution','fire','lightning','ice','otherSpecial'];
  const EVENTS=['onAttackHit','onAttackKill','onComboFinisherHit','onComboFinisherKill','onHeavyHit','onHeavyKill',
    'onThrustHit','onThrustKill','onThrustPerfectTiming','onDownStrikeHit','onDownStrikeKill','onBlock','onPerfectBlock',
    'onRealDamageTaken','onRecoverableDamageTaken','onRecoverGrayHealth','onEnemyPostureBreak',
    'onExecution','onExecutionStart','onExecutionHit','onExecutionKill','onGainMomentum','onSpendMomentum',
    'onWaveStart','onWaveClear','onLevelUp','onAscensionChosen','beforeRecoverableBlock','beforeRealHit','onMomentumBurst','onMomentumBurstHit'];
  const DEFAULT_RULES={guardStartup:.045,guardWindow:.480,perfectWindow:.200,guardRecovery:.135,
    guardReachX:40,guardReachY:16,guardReachZ:16,arrowGuardReach:22,
    grayConversion:.85,grayLossOnHit:.25,grayRecoveryDelay:3,grayRecoveryRate:7,
    momentumMax:100,momentumDecayDelay:Infinity,momentumDecay:0,waveInterval:9,maxAlive:Infinity};
  const tagPrefix={comboFinisher:'ComboFinisher',heavy:'Heavy',thrust:'Thrust',downStrike:'DownStrike',execution:'Execution'};
  function tagsFor(kind){return [...new Set(Array.isArray(kind)?kind:[({plunge:'downStrike',reflect:'otherSpecial',parry:'otherSpecial'})[kind]||kind||'normal'])];}
  return {EventBus,KILL_TAGS,EVENTS,DEFAULT_RULES,tagPrefix,tagsFor};
})();
if(!(typeof module==='object'&&module.exports))globalThis.AshSystems=AshSystems;

if(typeof document!=='undefined'&&!document.getElementById('game-styles')){
  const style=document.createElement('style');style.id='game-styles';
  style.textContent=`
:root{color-scheme:dark;--bg:#101518;--line:#2a3236;--text:#e7e6dc;--muted:#7d898d;--accent:#e9ae72}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:"Segoe UI","Microsoft YaHei",sans-serif}button,a{-webkit-tap-highlight-color:transparent}button{font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:5px}#app{width:min(1480px,96vw);margin:0 auto}.masthead{height:89px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{color:var(--text);font-size:28px;font-weight:800;letter-spacing:5px;text-decoration:none;display:flex;align-items:center;gap:0}.brand span{color:var(--accent)}.brand i{font-size:10px;letter-spacing:3px;font-style:normal;font-weight:500;margin-left:22px;padding-left:22px;border-left:1px solid #3d4546}.chapter{display:flex;align-items:center;gap:16px;font-size:12px;letter-spacing:2px}.chapter b{font:12px monospace;color:var(--accent);border:1px solid #5d5042;padding:7px}.chapter em{font:10px monospace;letter-spacing:2px;color:var(--muted)}.top-button{border:0;background:none;color:var(--muted);font-size:11px;letter-spacing:2px}.top-button span{color:var(--accent);margin-left:7px}.game-frame{position:relative;margin-top:22px;overflow:hidden;border:1px solid #323a3b;background:#101a20;aspect-ratio:16/9}canvas{display:block;width:100%;height:100%;outline:none}.overlay{position:absolute;inset:0}.title-screen{background:linear-gradient(90deg,rgba(10,17,20,.96),rgba(10,17,20,.82) 32%,rgba(10,17,20,.08) 72%);display:flex;align-items:center}.title-copy{margin-left:7%;margin-top:-3%}.eyebrow{font:10px monospace;letter-spacing:3px;color:var(--accent);display:flex;align-items:center;gap:12px}.eyebrow>span{width:23px;height:1px;background:var(--accent)}h1{font-family:"STKaiti","KaiTi","Microsoft YaHei",serif;font-size:clamp(34px,5.4vw,77px);font-weight:600;letter-spacing:6px;line-height:1.35;margin:25px 0 20px}h1 span{color:var(--accent)}.blade-title{line-height:1.08;margin:0 0 34px}.blade-title .blade-main{display:block;color:#edbd55;font-size:1.08em;font-weight:700;letter-spacing:8px;text-shadow:0 2px 18px #d58c3538}.blade-title .blade-tagline{display:block;margin-top:17px;color:#f3f2eb;font-size:.58em;font-weight:600;line-height:1.45;letter-spacing:7px;text-shadow:0 2px 12px #080a0dcc}.title-copy p{font-size:13px;line-height:2.1;letter-spacing:2px;color:#99a5a7;margin:0 0 32px}.primary{display:flex;justify-content:space-between;align-items:center;gap:55px;padding:17px 25px;border:1px solid #f2c795;background:#e8ad74;color:#242726;font-size:14px;letter-spacing:3px;font-weight:600;transition:background .2s,transform .2s}.primary:hover{background:#ffcb94;transform:translateY(-2px)}.primary span{font-size:21px}.start-hint{font:10px monospace;letter-spacing:2px;color:#7c8d93;margin-top:17px}.start-hint span{margin:0 9px}.title-stamp{position:absolute;right:6%;top:11%;writing-mode:vertical-rl;display:flex;gap:20px;align-items:center}.title-stamp span{font-size:11px;letter-spacing:7px;color:var(--accent);padding:12px 9px;border:1px solid #967151}.title-stamp b{font:28px "KaiTi",serif;letter-spacing:10px}.title-stamp i{font-size:10px;font-style:normal;color:#87979a;letter-spacing:4px}.title-bottom{position:absolute;bottom:4%;left:7%;right:5%;display:flex;justify-content:space-between;color:#809293;font-size:10px;letter-spacing:2px}.status-dot{display:inline-block;width:5px;height:5px;background:#b2c4b6;border-radius:50%;margin-right:9px}.control-strip{display:flex;align-items:center;justify-content:space-between;padding:23px 20px;border:1px solid var(--line);border-top:0;gap:12px}.control{display:flex;align-items:center;gap:10px}.control>div{display:flex;gap:3px}.control span{font-size:11px;letter-spacing:1px;color:#9aa5a7}.control b{font-size:9px;font-weight:400;color:#758081}kbd{display:inline-flex;justify-content:center;align-items:center;min-width:23px;height:25px;padding:0 7px;border:1px solid #465054;border-radius:3px;box-shadow:0 2px 0 #060c0f;font:10px monospace;color:#d1d7d4}.execution-control kbd{border-color:#89694e;color:var(--accent)}.underbar{display:flex;align-items:center;justify-content:space-between;height:62px;color:#5f6c70;font:10px monospace;letter-spacing:2px}.underbar button{background:none;border:0;color:#a0acab;font-size:11px;letter-spacing:2px}.underbar button span{margin-left:10px;color:var(--accent)}.hidden{display:none!important}.center-screen{display:flex;align-items:center;justify-content:center;background:rgba(7,13,17,.79);backdrop-filter:blur(8px)}.panel{text-align:center;max-width:520px;padding:32px}.panel .eyebrow{justify-content:center}.panel h2{font-size:45px;letter-spacing:7px;margin:20px 0;color:#f0dfc6}.panel p{font-size:13px;line-height:1.9;color:#a6b2b5}.panel .primary{margin:26px auto 15px;min-width:245px}.secondary{border:0;background:none;color:#a7b6b7;letter-spacing:2px;font-size:12px;padding:12px}.small{font:10px monospace;color:#6e858d;margin-top:20px;letter-spacing:2px}.canvas-pause{position:absolute;right:26px;top:27px;background:rgba(16,25,29,.6);border:1px solid #425052;color:#cccfc8;padding:10px;font:14px monospace}.canvas-pause span{font-size:9px;opacity:.55;margin-left:10px}.help{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;padding:25px 15px 45px;border-top:1px solid var(--line)}.help h3{color:#d2b392;font-size:14px;letter-spacing:3px}.help p{font-size:12px;line-height:2;color:#92a0a3}.end-stats{display:flex;justify-content:center;gap:36px;margin:24px 0}.end-stats div{color:#7f969b;font-size:11px}.end-stats strong{display:block;color:#e6ba8d;font:25px monospace;margin-bottom:8px}@media(max-width:1000px){.chapter em{display:none}.control{flex-direction:column;gap:8px}.control-strip{padding:16px 10px;gap:6px}.title-copy p{margin-bottom:17px;font-size:11px}.eyebrow{font-size:8px;letter-spacing:2px}h1{margin:15px 0}.primary{padding:12px 20px}.help{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){#app{width:98vw}.masthead{height:63px}.brand{font-size:22px}.brand i{display:none}.chapter{font-size:10px}.game-frame{margin-top:10px}.title-copy{margin-left:5%}.title-copy h1{font-size:30px;margin:12px 0}.title-copy p{display:none}.title-copy .eyebrow{font-size:6px}.title-stamp{right:4%;gap:10px}.title-stamp b{font-size:20px}.title-stamp i{display:none}.title-bottom{display:none}.start-hint{font-size:8px;margin-top:10px}.primary{font-size:11px;padding:8px 14px;gap:25px}.control-strip{flex-wrap:wrap;justify-content:center;gap:13px}.control span{font-size:9px}.underbar>span:first-child{display:none}.panel h2{font-size:25px;margin:10px}.panel p{font-size:11px}.panel .primary{margin:10px auto}.end-stats{margin:8px}.help{grid-template-columns:1fr}.canvas-pause{top:12px;right:12px;padding:5px}}

.audio-controls{display:flex;align-items:center;gap:20px}.music-volume{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:11px;white-space:nowrap}.music-volume input{width:110px;height:22px;margin:0;cursor:pointer;accent-color:var(--accent)}.music-volume output{min-width:34px;color:var(--accent);font:11px monospace}.music-volume input:focus-visible{outline:2px solid var(--accent);outline-offset:4px}@media(max-width:650px){.audio-controls{gap:10px}.music-volume{gap:5px}.music-volume input{width:65px}.top-button{letter-spacing:0;padding:4px}.top-button span{margin-left:3px}.brand{letter-spacing:2px;font-size:20px}}@media(max-width:380px){.music-volume input{width:48px}.music-volume output{min-width:28px}}

#runtime-error{max-width:560px;margin:16px auto 0;text-align:left;color:#e7c5a0;font-size:12px}#runtime-error summary{cursor:pointer}#runtime-error textarea{display:block;width:100%;height:180px;resize:vertical;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;user-select:text;background:#10191d;padding:12px;color:#bfc9c9;border:1px solid #323a3b;font:11px/1.5 monospace}#runtime-error .secondary{padding:10px 0;margin-right:12px;color:#e7c5a0}#runtime-error [role="status"]{color:#bfc9c9}
`;
  document.head.appendChild(style);
}

if(typeof document!=='undefined'&&!document.getElementById('survival-styles')){
  const style=document.createElement('style');style.id='survival-styles';
  style.textContent=`
.title-copy{margin-top:-1%}.title-copy h1{font-size:clamp(34px,4.8vw,69px);margin:19px 0 16px}.title-copy p{margin-bottom:20px}.arena-select{display:flex;gap:8px;margin:0 0 20px}.arena-select button{background:#172327aa;border:1px solid #45514f;color:#879b98;padding:10px 15px;font:11px monospace;letter-spacing:2px;transition:.2s}.arena-select button.selected,.arena-select button:hover{border-color:#c3a173;color:#e3c79c;background:#493e2d70}.start-actions{display:flex;align-items:center;gap:15px}.start-actions .secondary{font-size:11px}.start-hint{margin-top:13px}.control-strip{padding-left:15px;padding-right:15px}.control{gap:7px}.control span{letter-spacing:0}.upgrade-panel{text-align:center;width:min(1180px,94%)}.upgrade-panel>.eyebrow{justify-content:center}.upgrade-panel h2{font:38px 'KaiTi',serif;letter-spacing:12px;color:#edcca0;margin:18px 0 10px}.upgrade-panel>p{font-size:12px;color:#9cafac;line-height:1.8}.upgrade-choices{display:grid;grid-template-columns:repeat(var(--offer-count,3),minmax(0,1fr));gap:14px;margin:27px 0 20px;width:100%}.upgrade-card{text-align:left;border:1px solid #596158;background:linear-gradient(140deg,#293936,#142325);padding:25px 23px;position:relative;color:#d6dfd1;min-height:210px;transition:.15s}.upgrade-card:hover,.upgrade-card:focus-visible{border-color:#e9bf84;transform:translateY(-4px);background:linear-gradient(140deg,#39433a,#192b2b)}.upgrade-card .choice-number{font:10px monospace;letter-spacing:3px;color:#9d8c6c}.upgrade-card h3{font:31px 'KaiTi',serif;letter-spacing:5px;color:#e7c497;margin:23px 0 11px}.upgrade-card .subtitle{font-size:10px;letter-spacing:3px;color:#8aab9c}.upgrade-card p{font-size:12px;line-height:1.9;color:#b4c2b7;margin:16px 0 0}.upgrade-card .rank{position:absolute;right:20px;top:26px;font:10px monospace;color:#a99a79}@media(max-width:1100px){.control{flex-direction:column;gap:8px}.arena-select{margin-bottom:12px}.arena-select button{padding:8px 11px}.title-copy p{font-size:11px;margin-bottom:12px}.title-copy h1{font-size:47px;margin:12px 0}.primary{padding:12px 20px}.title-copy{margin-left:6%}.start-actions{gap:6px}.upgrade-card{padding:17px;min-height:185px}.upgrade-card h3{margin:17px 0 8px;font-size:26px}.upgrade-panel h2{font-size:30px}.upgrade-choices{margin:18px 0}}@media(max-width:750px){.title-copy h1{font-size:35px;line-height:1.25}.title-copy p{display:none}.title-copy .eyebrow{font-size:7px}.arena-select button{font-size:9px;padding:6px 8px}.start-actions .secondary{font-size:9px;padding:6px}.start-actions .primary{font-size:11px;padding:9px 13px;gap:20px}.title-stamp i{display:none}.upgrade-card{min-height:145px;padding:12px}.upgrade-card h3{font-size:22px;margin-top:12px}.upgrade-card p{font-size:10px;margin-top:7px}.upgrade-card .subtitle{display:none}.upgrade-choices{gap:8px}.upgrade-panel>.eyebrow{display:none}.upgrade-panel h2{font-size:23px;margin:10px 0}.upgrade-panel>p{font-size:10px}.upgrade-card .rank{top:12px;right:10px;font-size:8px}.upgrade-panel .small{margin:8px 0;font-size:9px}.control-strip{gap:12px}}@media(max-width:480px){.title-copy h1{font-size:27px}.title-copy .eyebrow{display:none}.start-hint{display:none}.arena-select{gap:4px;margin:8px 0}.title-stamp{top:9%}.title-stamp b{font-size:17px}.title-stamp>span{font-size:8px;letter-spacing:2px;padding:6px}.start-actions{flex-direction:column;align-items:flex-start;gap:0}.title-copy{margin-top:0}.upgrade-card{min-height:123px;padding:9px}.upgrade-card h3{font-size:18px}.upgrade-card p{font-size:9px;line-height:1.5}.upgrade-panel>p{display:none}.upgrade-card .rank{display:none}}

/* V18 title and unobtrusive help */
[hidden]{display:none!important}.masthead .chapter,.title-stamp{display:none}.title-screen{background:linear-gradient(90deg,rgba(8,8,18,.87),rgba(8,8,18,.12) 60%,transparent)}.title-copy{max-width:590px}.title-copy h1{font-size:clamp(44px,5.3vw,78px)}.blade-title .blade-tagline{font-size:.56em}

.canvas-manual{position:absolute;right:24px;bottom:18px;z-index:12;border:1px solid #7c7164;background:#111521bb;color:#c8bfa9;padding:7px 12px;cursor:pointer}.manual-panel{width:min(850px,88%);max-height:85%;overflow:auto;text-align:left}.manual-panel p{line-height:1.8}.manual-panel h3{color:#d2b183}.manual-panel button{float:right}#manual-screen{z-index:30}
`;
  document.head.appendChild(style);
}

/* Survival depends on combat and ascensions, so initialize it on first use. */
let survivalAPI;
function getSurvival(){
  if(survivalAPI)return survivalAPI;
  const Combat=typeof module==='object'&&module.exports?require('./combat.js'):globalThis.AshCombat;
  survivalAPI=(()=>{
  'use strict';
  const {Game,TYPES,CHAPTERS,clamp,isBoss,distance,ENEMY_CATALOG}=Combat;
  const XP={sword:14,bow:13,axe:30,spear:18,shield:29,dual:19,crossbow:18,boss:200,duelist:220,warden:260};
  const MOMENTUM_BURST={cost:80,radius:340,damage:8,posture:10,parryDamage:6,parryPosture:18,flinch:.46,launchForce:980,launchLift:470};
  const XP_FOR_LEVEL=level=>Math.round((level<=8?26+(level-1)*12:level<=20?110+(level-8)*24:398+(level-20)*36)*(1.1+.4*clamp((level-1)/99,0,1)));
  const {ASCENSIONS,DUAL_ASCENSIONS,AscensionEffects}=typeof module==='object'&&module.exports?require('./ascensions.js'):globalThis.AshAscensions;
  class Run{
    constructor({arena=0,challenge=false,training=false,seed=Date.now()>>>0}={}){
      this.game=new Game(seed);this.game.reset(clamp(arena,0,2)*3);this.game.externalFlow=true;
      const g=this.game;g.enemies=[];g.projectiles=[];g.events=[];g.bounds={left:45,right:18000};g.p.x=2550;g.p.y=550;
      this.arena=arena;this.challenge=challenge;this.training=training;this.trainingHits=[];this.trainingConfig={hp:3000,posture:600};this.time=0;this.dayOffset=[0,50,125,200,325,400,475,500][Math.floor(g.random()*8)];this.wave=0;this.nextWave=0;this.currentWaveInterval=5.5;this.spawnQueue=[];this.waveRecords=new Map();
      this.xp=0;this.level=1;this.nextXP=XP_FOR_LEVEL(1);this.momentum=0;this.momentumMultiplier=1;this.lastMomentum=0;
      this.safeTime=0;this.totalXP=0;this.offers=[];this.pendingLevels=0;this.upgrades={};this.duals={};this.registry=[...ASCENSIONS];this.dualRegistry=[...(DUAL_ASCENSIONS||[])];this.rerolls=0;this.currentBonusRerolls=0;this.rerollDualBoost=0;
      this.pacingKills=[];this.recentKills=[];this.lastPerfect=-99;this.specialActions=[];this.waveClears=0;this.peakAlive=0;this.ascensionCredits=0;this.ascensionSelections=0;this.creditSources=[];this.activeOfferSource='level';this.lastAscensionChoice=null;
      g.hooks.on('onAttackHit',e=>this.gainMomentum(e.tags.some(t=>['heavy','downStrike','comboFinisher'].includes(t))?3.2:1.3,'attack'));
      g.hooks.on('onAttackKill',e=>this.rewardKill(e));
      g.hooks.on('onPerfectBlock',()=>{this.lastPerfect=this.time;this.noteSkill('perfect');this.gainMomentum(11,'perfectBlock');});
      g.hooks.on('onBlock',()=>this.gainMomentum(3,'block'));
      g.hooks.on('onRealDamageTaken',e=>{if(e.amount>0)this.gainMomentum(4+Math.min(e.amount*.28,12),'damageCompensation');});
      g.hooks.on('onExecutionHit',()=>{this.noteSkill('execution');this.gainMomentum(2,'execution');});
      g.hooks.on('onHeavyHit',e=>{if(e.tags.includes('fullCharge'))this.noteSkill('fullCharge');});
      g.hooks.on('onDownStrikeHit',()=>this.noteSkill('downStrike'));
      this.effects=new AscensionEffects(this);
      this.loopLength=g.bounds.right-g.bounds.left;this.loopWorld=!training;g.loopWorld=this.loopWorld;g.loopLength=this.loopLength;this.continuousWorld=!training;this.worldOrigin=g.bounds.left;this.bossTimes=[120,240,350,450,540,625,705,780,850,915,975];this.bossIndex=0;this.campaignSerial=0;this.finalPhase='waiting';this.finalIds=new Set();this.finalVictoryAt=Infinity;this.relocateAt=0;this.cleanupAt=0;this.rushPending=false;this.rushAwaitingReward=false;this.rushRewardAt=0;
      if(challenge){this.wave=1;this.nextWave=Infinity;this.rushPending=true;this.grantLevels(3,'rushStart');}
      if(training){this.nextWave=Infinity;this.momentum=100;for(const [mode,dx] of [['idle',160],['slash',390],['shoot',670]])this.spawnTrainingDummy(mode,g.p.x+dx);g.hooks.on('beforeDeath',e=>{e.prevent=true;g.p.hp=g.p.maxHp;g.p.grayHp=0;g.p.state='idle';g.p.invuln=1;});const record=e=>{if(e.enemy?.dummy)this.trainingHits.push({time:this.time,damage:e.damage,posture:e.posture||0});};g.hooks.on('onAttackHit',record);g.hooks.on('onEffectHit',record);}
      g.emit('chapter',{stage:g.stage,chapterChanged:true});
    }
    spawnTrainingDummy(mode,x){const g=this.game,e=g.spawn(mode==='shoot'?'bow':'sword',x,550);Object.assign(e,{dummy:true,dummyMode:mode,homeX:x,homeY:550,spawnDelay:0,alerted:true,ammo:Infinity,hp:this.trainingConfig.hp,maxHp:this.trainingConfig.hp,posture:this.trainingConfig.posture,maxPosture:this.trainingConfig.posture,cd:1});return e;}
    updateLoopWorld(){
      if(this.time<this.relocateAt)return;this.relocateAt=this.time+.5;
      const g=this.game,p=g.p;
      for(const e of g.enemies)if(!this.training&&!e.dead&&!e.permaFear&&!e.medusaGold&&!(e.medusaUntil>g.time)&&!isBoss(e)&&!e.spawnDelay&&Math.abs(e.x-p.x)>1900&&e!==p.execTarget){
        e.x=this.loopWorld?p.x+(e.x<p.x?-1:1)*(1050+g.random()*250):clamp(p.x+(e.x<p.x?-1:1)*(1050+g.random()*250),g.bounds.left+40,g.bounds.right-40);e.y=420+g.random()*260;e.targetX=p.x;
      }
      if(this.time>=this.cleanupAt){this.cleanupAt=this.time+2;
        const ids=new Set(g.enemies.filter(e=>!e.dead).map(e=>e.id)),f=this.effects;
        for(const m of [f.bully,f.v11.probe,f.v11.armor,f.v11.heat,f.v11.wounds,f.v11.fireTouch,f.v11.flyingKick.marks,f.v12.flaws,f.v16.seals,f.v16.landings,f.v16.combo,f.v16.preHitState,...Object.values(f.dualState).filter(m=>m instanceof Map),...this.effects.v11.tornadoes.map(t=>t.hits),this.effects.v11.tornadoStorm?.hits])if(m instanceof Map)for(const id of m.keys())if(typeof id==='number'&&!ids.has(id))m.delete(id);
        for(const [id,r] of this.waveRecords)if(r.cleared)this.waveRecords.delete(id);
        for(const k of Object.keys(f.v16.timers))if(/\d+$/.test(k)&&!ids.has(Number(k.match(/\d+$/)[0])))delete f.v16.timers[k];
      }
    }
    shiftLoopWorld(dx){
      if(!dx)return;const g=this.game,seen=new WeakSet(),xKeys=new Set(['x','x1','x2','sx','tx','startX','lastX','targetX','originX','toX','fromX','homeX','aimX','tongueX']);
      const shift=value=>{if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);if(value instanceof Map){for(const v of value.values())shift(v);return;}if(value instanceof Set)return;if(Array.isArray(value)){for(const v of value)shift(v);return;}for(const key of xKeys)if(Number.isFinite(value[key]))value[key]+=dx;for(const [key,v] of Object.entries(value))if(key!=='run'&&key!=='game')shift(v);};
      shift(g.p);shift(g.enemies);shift(g.projectiles);shift(g.decoys);shift(g.netZones);shift(g.tarZones);shift(g.enemyHazards);shift(g.enemyCorpses);shift(this.effects);shift(this.sacrificeSouls);if(this.introStart)this.introStart.x+=dx;if(Number.isFinite(this.finalCenter))this.finalCenter+=dx;g.emit('worldWrap',{dx,length:this.loopLength});
    }
    wrapLoopWorld(){if(!this.loopWorld)return;const g=this.game,p=g.p,left=g.bounds.left,right=g.bounds.right;if(p.x>right)this.shiftLoopWorld(-this.loopLength);else if(p.x<left)this.shiftLoopWorld(this.loopLength);}
    chooseTierBoss(ordinal){const group=Math.floor(ordinal/3),tier=ordinal%3,pool=ENEMY_CATALOG.BOSSES.filter(e=>e.group===group&&e.tier===tier);return pool[Math.floor(this.game.random()*pool.length)].id;}
    spawnCampaignBoss(type,x){
      const id=-(++this.campaignSerial);this.waveRecords.set(id,{id,pending:1,alive:0,cleared:false});
      this.spawnNext({type,wave:id,boss:true});const e=this.game.enemies.at(-1);if(x!==undefined)e.x=x;return e;
    }
    sacrifice(e,initial=false){
      if(e.dead)return;const g=this.game;e.suppressDeathrattle=true;e.dead=true;e.hp=0;e.deathT=0;e.state='dead';e.deathFlavor='soul';e.attack=null;e.queue=[];
      const record=this.waveRecords.get(e.waveId);if(record){record.alive=Math.max(0,record.alive-1);if(!record.alive&&!record.pending)record.cleared=true;}
      const bosses=(this.finalBossTargets??=g.enemies.filter(b=>this.finalIds.has(b.id))).filter(b=>!b.dead);
      if(bosses.length){
        this.sacrificeSouls??=[];
        // Roll each arrival particle independently; the five growth shares keep their total value.
        for(let i=0;i<(initial?5:1);i++){const target=bosses[Math.floor(g.random()*bosses.length)];this.sacrificeSouls.push({x:e.x,y:e.y-40,target,initial,amount:initial?Math.round(e.maxHp*.08):e.maxHp*.12});}
      }
    }
    updateSacrificeSouls(dt){
      if(!this.sacrificeSouls?.length)return;const g=this.game,bosses=(this.finalBossTargets??=g.enemies.filter(b=>this.finalIds.has(b.id))).filter(b=>!b.dead),arrivals=new Map();
      for(const soul of this.sacrificeSouls){if(soul.target.dead){if(!bosses.length){soul.done=true;continue;}soul.target=bosses[Math.floor(g.random()*bosses.length)];}
        const b=soul.target,dx=b.x-soul.x,dy=b.y-60-soul.y,d=Math.hypot(dx,dy),travel=850*dt;
        if(d>travel){soul.x+=dx/d*travel;soul.y+=dy/d*travel;continue;}
        soul.done=true;const a=arrivals.get(b)||{growth:0,heal:0};a[soul.initial?'growth':'heal']+=soul.amount;arrivals.set(b,a);
      }
      this.sacrificeSouls=this.sacrificeSouls.filter(s=>!s.done);
      for(const [b,a] of arrivals){if(a.growth){b.maxHp+=a.growth;b.hp+=a.growth;b.sacrificeHp=(b.sacrificeHp||0)+a.growth;g.emit('enemyHeal',{x:b.x,y:b.y,source:'sacrifice',amount:a.growth,healerType:b.type});}if(a.heal)g.healEnemy(b,a.heal,{source:'sacrifice'});}
    }

    beginFinal(){
      const g=this.game,p=g.p;this.finalPhase='intro';this.finalIntro=0;this.introStart={x:p.x,y:p.y};this.finalCenter=clamp(p.x,g.bounds.left+800,g.bounds.right-800);this.spawnQueue=[];g.projectiles=[];
      // The sky's 600-second cycle starts at 04:00. Keep its clock separate from campaign timers.
      let skyStart=this.time+this.dayOffset;const hour=(4+skyStart/25)%24;
      const skyDelta=hour<=6?-hour*25:(24-hour)*25;
      if(skyStart+skyDelta<0)skyStart+=600;
      this.finalSkyStart=skyStart;this.finalSkyTarget=skyStart+skyDelta;this.dayOffset=skyStart-this.time;
      for(const spec of ENEMY_CATALOG.BOSSES.filter(e=>e.final)){const e=this.spawnCampaignBoss(spec.id,this.finalCenter+(spec.slot===0?-470:470));e.y=555;e.spawnDelay=4.2;this.finalIds.add(e.id);}
      this.finalBossTargets=g.enemies.filter(b=>this.finalIds.has(b.id));
      for(const e of g.enemies)if(!this.finalIds.has(e.id)&&!e.dead)this.sacrifice(e,true);
      p.state='idle';p.t=0;p.attack=null;p.vx=p.vy=0;p.invuln=5;g.emit('finalArrival',{x:this.finalCenter,y:550});
    }
    finishFinalBattle(){
      if(this.finalPhase==='ending')return;
      const g=this.game;this.offers=[];this.pendingLevels=0;this.creditSources=[];this.spawnQueue=[];
      this.sacrificeSouls=[];this.finalPhase='ending';this.finalVictoryAt=this.time+2;g.p.invuln=Math.max(g.p.invuln,2.2);
      g.projectiles=[];g.bossEffects=[];g.enemyHazards=[];g.netZones=[];g.tarZones=[];
      // Victory cleanup is a visible fall, without rewards, resurrection or deathrattles.
      for(const e of g.enemies)if(!e.dead&&!this.finalIds.has(e.id))Object.assign(e,{dead:true,hp:0,deathT:0,state:'dead',attack:null,queue:[],suppressDeathrattle:true,revivePending:false,spawnDelay:0,knockX:0,knockY:0,knockVz:0,z:0});
    }
    updateCampaign(dt){
      const g=this.game;this.updateSacrificeSouls(dt);
      if(this.finalPhase==='intro'){
        this.finalIntro+=dt;const q=clamp(this.finalIntro/1.2,0,1),ease=q*q*(3-2*q),p=g.p;
        const skyProgress=clamp(this.finalIntro/4.2,0,1);
        this.dayOffset=this.finalSkyStart+(this.finalSkyTarget-this.finalSkyStart)*skyProgress-this.time;
        p.x=this.introStart.x+(this.finalCenter-this.introStart.x)*ease;p.y=this.introStart.y+(550-this.introStart.y)*ease;p.z=Math.sin(q*Math.PI)*180;p.invuln=1;
        for(const e of g.enemies)if(this.finalIds.has(e.id))e.spawnDelay=Math.max(0,4.2-this.finalIntro);
        if(this.finalIntro>=4.2){this.finalPhase='battle';this.finalAddsAt=this.time+8;p.z=0;p.invuln=1;}
        return true;
      }
      if(this.finalPhase==='battle'){
        this.dayOffset=this.finalSkyTarget-this.time;
        if(!g.enemies.some(e=>this.finalIds.has(e.id)&&!e.dead)){this.finishFinalBattle();return true;}
        if(!this.challenge){
          if(this.time>=this.finalAddsAt){this.finalAddsAt=this.time+12;for(let i=0;i<12;i++){const pool=ENEMY_CATALOG.REGULAR.filter(e=>e.stage==='abyss'),type=pool[Math.floor(g.random()*pool.length)].id,id=-(++this.campaignSerial);this.waveRecords.set(id,{id,pending:1,alive:0,cleared:false});this.spawnNext({type,wave:id});g.enemies.at(-1).sacrificeAt=this.time+10+Math.floor(g.random()*16)*.2;}}
          for(const e of g.enemies)if(!e.dead&&e.sacrificeAt&&this.time>=e.sacrificeAt)this.sacrifice(e);
        }
        return false;
      }
      if(this.finalPhase==='ending'){
        g.p.invuln=Math.max(g.p.invuln,.2);
        for(const e of g.enemies)if(e.dead)e.deathT=(e.deathT||0)+dt;
        if(this.time>=this.finalVictoryAt){g.status='victory';g.emit('victory');}
        return true;
      }
      if(this.challenge){
        if(this.rushAwaitingReward&&this.time>=this.rushRewardAt){this.rushAwaitingReward=false;this.grantLevels(3,'rushBoss');this.rushPending=true;}
        if(this.rushPending&&!this.pendingLevels&&!this.offers.length){this.rushPending=false;if(this.bossIndex<11)this.spawnCampaignBoss(this.chooseTierBoss(this.bossIndex++));else this.beginFinal();}
      }else{
        if(this.time>=1070){this.finalPhase='ritual';this.spawnQueue=[];for(const e of g.enemies)if(!e.dead)e.sacrificial=true;if(this.time>=1080)this.beginFinal();}
        else while(this.bossIndex<this.bossTimes.length&&this.time>=this.bossTimes[this.bossIndex])this.spawnCampaignBoss(this.chooseTierBoss(this.bossIndex++));
      }
      return this.finalPhase==='intro';
    }
    resetTrainingDummy(e){const id=e.id,mode=e.dummyMode,x=e.homeX,fresh=this.spawnTrainingDummy(mode,x);this.game.enemies.pop();for(const key of Object.keys(e))delete e[key];Object.assign(e,fresh,{id});for(const m of [this.effects.bully,this.effects.v11.heat,this.effects.v11.wounds,this.effects.v12.flaws])m.delete(id);this.game.emit('spawn',{x:e.x,y:e.y});}
    trainingPick(id){if(!this.training)return false;const offer=this.registry.find(a=>a.id===id)||this.dualRegistry.find(a=>a.id===id);if(!offer)return false;for(const key of offer.parents||[id]){const card=this.registry.find(a=>a.id===key);this.applyAscensionOffer({...card,grantTo:3},{free:true});}if(offer.parents)this.applyAscensionOffer({...offer,dual:true},{free:true});this.offers=[];this.pendingLevels=0;this.creditSources=[];return true;}
    trainingOffers(){this.offers=[...this.registry,...this.dualRegistry];this.game.emit('upgrade',{training:true});return true;}
    momentumGainScale(reason){
      // Resource income deliberately tapers after the opening. Skillful defensive actions
      // retain more value than passive kill/wave income, preventing late runs from becoming
      // a permanent R-burst loop while keeping perfect blocks rewarding.
      const t=clamp((this.wave-10)/34,0,1);
      const skill=reason==='perfectBlock'||reason==='execution';
      // Late runs now ask the player to earn R instead of cycling it from passive crowd rewards.
      // Technical sources retain more value, but even they taper meaningfully.
      return reason==='execution'?.85-.50*clamp((this.wave-6)/24,0,1):skill?1-.35*t:1-.58*t;
    }
    gainMomentum(amount,reason){
      amount*=this.momentumGainScale(reason);
      amount=Math.max(0,this.game.hooks.modify('momentumGain',amount*this.momentumMultiplier,{reason}));
      const before=this.momentum;this.momentum=clamp(this.momentum+amount,this.effects?.momentumMinimum()||0,this.game.rules.momentumMax);
      this.syncTemporaryMomentum();this.lastMomentum=this.time;this.game.trigger('onGainMomentum',{amount:this.momentum-before,reason,run:this});
    }
    syncTemporaryMomentum(){
      const u=this.effects?.ultimate;
      if(u)u.momentum=u.remaining>0&&this.hasDual('ultimateForm','bloodGuard')?clamp(u.momentum||0,0,Math.max(0,this.game.rules.momentumMax-this.momentum)):0;
    }
    get temporaryMomentum(){this.syncTemporaryMomentum();return this.effects?.ultimate.momentum||0;}
    spendMomentum(amount,reason='extension',{temporaryOnly=false,allowOverdraft=false}={}){
      amount=Math.max(0,this.game.hooks.modify('momentumCost',amount,{reason}));
      const temporary=reason==='momentumBurst'?0:this.temporaryMomentum;
      const overdraw=!temporaryOnly&&reason==='momentumBurst'&&this.momentum<amount&&allowOverdraft&&this.effects?.canOverdraw();
      if((temporaryOnly?temporary:this.momentum+temporary)<amount&&!overdraw)return false;
      const spentTemporary=Math.min(temporary,amount);
      if(spentTemporary)this.effects.ultimate.momentum-=spentTemporary;
      this.momentum=overdraw&&!this.hasDual('hotBlood','maniac')?this.momentum-amount:Math.max(this.effects?.momentumMinimum()||0,this.momentum-(amount-spentTemporary));
      if(overdraw)this.effects.startOverdraft();
      this.syncTemporaryMomentum();this.game.trigger('onSpendMomentum',{amount,reason,temporary:spentTemporary,run:this});return true;
    }
    getMomentumBurstConfig(){
      const g=this.game,base=MOMENTUM_BURST;
      const intercalary=this.hasDual('newSun','ultimateForm')?2:1;
      return {...base,
        cost:Math.max(1,Math.round(g.hooks.modify('momentumBurstCost',base.cost,{run:this}))),
        damage:Math.max(0,g.hooks.modify('momentumBurstDamage',base.damage,{run:this,kind:'blast'}))*intercalary,
        parryDamage:Math.max(0,g.hooks.modify('momentumBurstDamage',base.parryDamage,{run:this,kind:'parry'}))*intercalary,
        posture:(base.posture+Math.min(14,Math.max(0,this.level-1)*.45))*intercalary,
        parryPosture:(base.parryPosture+Math.min(18,Math.max(0,this.level-1)*.6))*intercalary,
        radius:Math.max(120,g.hooks.modify('momentumBurstRadius',base.radius,{run:this}))};
    }
    isMomentumBurstThreat(e){
      const g=this.game,p=g.p,a=e?.attack;if(!e||e.dead||!a||a.ranged||e.damageDone)return false;
      const dx=(p.x-e.x)*e.face,dy=Math.abs(p.y-e.y);
      const reach=(a.both?Math.abs(p.x-e.x)<=a.range+32:dx>-42&&dx<=a.range+38)&&dy<=a.lane+24&&p.z<(a.ground?72:112)*e.scale;
      if(!reach)return false;
      if(e.state==='windup')return a.wind-e.t<=.11;
      if(e.state==='active')return e.t<=a.active*.62;
      return false;
    }
    castMomentumBurst(options={}){
      const g=this.game,p=g.p,cfg=this.getMomentumBurstConfig(),free=!!options.free;
      if(g.status!=='playing'||this.offers.length||(!free&&this.momentum<cfg.cost&&!this.effects.canOverdraw())||p.state==='execute'||p.state==='hurt')return false;
      const beforeBurstMomentum=this.momentum;
      if(!free&&!this.spendMomentum(cfg.cost,'momentumBurst',{allowOverdraft:true}))return false;
      const paidCost=free?0:Math.max(0,beforeBurstMomentum-this.momentum);
      if(free)g.emit('freeBurst',{x:p.x,y:p.y,z:p.z,source:options.source||'free'});

      let shattered=0,parried=0,blasted=0;
      for(const b of g.projectiles){
        if(b.life<=0||b.reflected)continue;
        b.life=0;shattered++;g.emit('burstProjectile',{x:b.x,y:b.y,z:b.z});
      }

      const nearby=g.enemies.filter(e=>!e.dead&&!e.spawnDelay&&distance(p,e)<=cfg.radius);
      for(const e of nearby){
        if(this.isMomentumBurstThreat(e)){
          parried++;
          g.resolvePerfectBlock(e,null,{source:'momentumBurst',preservePlayer:true,reflectArrow:false});
          if(!e.dead){
            g.damageEnemy(e,cfg.parryDamage,cfg.parryPosture,['momentumBurst'],{secondary:true,flinch:false,quiet:true});
            g.trigger('onMomentumBurstHit',{enemy:e,attacking:true,damage:cfg.parryDamage,run:this});
          }
          if(!e.dead&&e.state!=='stunned'){
            e.state='flinch';e.t=cfg.flinch;e.queue=[];e.knockX=0;e.knockY=0;e.knockVz=0;e.z=0;
          }
          g.emit('burstParry',{x:e.x,y:e.y,z:70*e.scale,boss:isBoss(e)});continue;
        }
        blasted++;
        if(e.state!=='stunned')g.launchEnemy(e,p.x,p.y,{force:cfg.launchForce,lift:cfg.launchLift,duration:.92});
        g.damageEnemy(e,cfg.damage,cfg.posture,['momentumBurst'],{secondary:true,flinch:false});
        g.trigger('onMomentumBurstHit',{enemy:e,attacking:false,damage:cfg.damage,run:this});
      }
      g.hitstop(.07);g.emit('momentumBurst',{x:p.x,y:p.y,z:p.z,radius:cfg.radius,shattered,parried,blasted,cost:paidCost,damage:cfg.damage,solarRank:this.upgrades.newSun||0,free,source:options.source||null});
      g.trigger('onMomentumBurst',{run:this,shattered,parried,blasted,cost:paidCost,free,source:options.source||null});return true;
    }
    noteSkill(kind){this.specialActions.push({kind,time:this.time});this.specialActions=this.specialActions.filter(a=>this.time-a.time<6).slice(-16);}
    enemyXPFactor(){
      if(this.time<=60)return .85;
      if(this.time<180)return .85+.15*(this.time-60)/120;
      if(this.time<=480)return 1;
      return 1-.15*clamp((this.time-480)/240,0,1);
    }
    enemyBaseKillXP(enemy){const rawBase=TYPES[enemy.type]?.xp||XP[enemy.type]||16;return Math.max(rawBase,Math.round(rawBase*(enemy.xpMultiplier||1)))*this.enemyXPFactor();}
    rewardKill({enemy,tags}){if(this.training||this.finalIds.has(enemy.id))return;if(this.challenge&&isBoss(enemy)){this.game.heal(this.game.p.maxHp*.22,{source:'rushVictory'});enemy.rushCorpseUntil=this.time+2.8;this.rushRewardAt=this.time+2.8;this.rushAwaitingReward=true;return;}
      const base=this.enemyBaseKillXP(enemy);
      const special=tags.some(t=>t!=='normal'&&t!=='block');
      let bonus=tags.includes('execution')?.60:tags.includes('fullCharge')?.50:tags.includes('heavy')?.35:
        tags.includes('comboFinisher')?.30:tags.includes('downStrike')?.35:tags.includes('thrust')?.20:special?.20:0;
      // Hidden rewards are additive. Ordinary attacks always retain their full base reward.
      if(this.time-this.lastPerfect<4)bonus+=.20;
      this.recentKills=this.recentKills.filter(k=>this.time-k.time<8);
      if(this.recentKills.some(k=>k.type!==tags[0])&&special)bonus+=.12;
      if(new Set(this.specialActions.filter(a=>this.time-a.time<6).map(a=>a.kind)).size>=3)bonus+=.12;
      this.recentKills.push({time:this.time,type:tags[0]});this.recentKills=this.recentKills.slice(-12);
      const reward=Math.max(Math.round(base),Math.round(this.game.hooks.modify('killXP',base*(1+bonus),{enemy,tags,base})));
      this.pacingKills.push(this.time);this.pacingKills=this.pacingKills.filter(t=>this.time-t<30);this.xp+=reward;this.totalXP+=reward;this.gainMomentum(tags.includes('execution')?3:(special?8:5)+(bonus>.5?3:0),'kill');
      this.game.emit('xp',{x:enemy.x,y:enemy.y,amount:reward,special});
      const record=this.waveRecords.get(enemy.waveId);if(record){record.alive--;this.checkWaveClear(record);}
    }
    checkWaveClear(record){
      if(record.cleared||record.pending!==0||record.alive!==0)return;
      record.cleared=true;this.waveClears++;const before=this.momentum;this.gainMomentum(15,'waveClear');
      const gained=Math.max(0,this.momentum-before),accelerated=!this.challenge&&this.time<240&&record.id===this.wave&&this.time<this.nextWave;
      this.game.emit('waveClear',{wave:record.id,momentum:Math.round(gained*10)/10,accelerated});
      this.game.trigger('onWaveClear',{wave:record.id,run:this,accelerated});
      if(accelerated)this.startWave();
    }
    waveStageWeights(wave){
      const time=Math.max(0,this.time),weights={human:0,mutant:0,monster:0,abyss:0};
      if(time<240){weights.human=1;return weights;}
      if(time<330){weights.mutant=(time-240)/90;weights.human=1-weights.mutant;return weights;}
      if(time<450){weights.mutant=1;return weights;}
      if(time<660){weights.monster=(time-450)/210;weights.mutant=1-weights.monster;return weights;}
      if(time<780){weights.monster=1;return weights;}
      if(time<975){weights.abyss=(time-780)/195;weights.monster=1-weights.abyss;return weights;}
      weights.abyss=1;return weights;
    }
    enemyUnlockTime(spec){
      if(spec.unlock>=999)return Infinity;
      if(spec.stage==='human')return Math.max(0,(spec.unlock-1)*15);
      if(spec.stage==='mutant')return 240+Math.max(0,spec.unlock-29)*20;
      const start=spec.stage==='monster'?450:780,interval=spec.stage==='monster'?7:6.5;
      const roster=ENEMY_CATALOG.REGULAR.filter(e=>e.stage===spec.stage&&e.unlock<999);
      return start+Math.max(0,roster.findIndex(e=>e.id===spec.id))*interval;
    }
    deploymentCost(spec,wave=this.wave){
      // Early waves stay sparse/readable. Later waves deliberately convert more strength budget
      // into bodies because the 140-card + dual pool can create extremely strong late builds.
      const t=clamp((wave-22)/42,0,1),threatFactor=1.12-.07*t,bodySurcharge=1.25-.53*t;
      return spec.threat*threatFactor+bodySurcharge+(spec.ranged?.70:spec.elite?.30:0);
    }
    pickWaveEnemy(pool,remaining,wave,stageWeights,planned=[]){
      const g=this.game;
      const stageRoll=g.random(),human=stageWeights.human,mutant=stageWeights.mutant;
      const desired=stageRoll<human?'human':stageRoll<human+mutant?'mutant':stageRoll<human+mutant+(stageWeights.monster||0)?'monster':'abyss';
      // Budget fallback may change the enemy within the active stage mix, but must
      // not pull a future stage into the human or mutant portion of a run.
      const active=pool.filter(e=>stageWeights[e.stage]>0);
      const eligible=active.length?active:pool.filter(e=>e.stage===['human','mutant','monster','abyss'].find(stage=>pool.some(o=>o.stage===stage)));
      let candidates=eligible.filter(e=>e.stage===desired&&this.deploymentCost(e,wave)<=remaining*1.15+.001);
      if(!candidates.length)candidates=eligible.filter(e=>this.deploymentCost(e,wave)<=remaining*1.15+.001);
      if(!candidates.length)candidates=[...eligible].sort((a,b)=>this.deploymentCost(a,wave)-this.deploymentCost(b,wave)).slice(0,Math.min(8,eligible.length));
      const plannedRanged=planned.filter(e=>e.ranged).length;
      let total=0;const weighted=candidates.map(e=>{
        const recent=this.time-this.enemyUnlockTime(e)<=40?1.22:1,elite=e.threat>=4?.90:1;
        const bodyWeight=Math.pow(Math.max(.8,e.threat),.16);
        const rangedPenalty=e.ranged?.26/(1+plannedRanged*1.35):1;
        const w=recent*elite*bodyWeight*rangedPenalty;total+=w;return [e,total];
      });
      const roll=g.random()*total;return (weighted.find(([,c])=>roll<=c)||weighted[weighted.length-1])?.[0];
    }
    isBossWave(wave){
      if(wave<10)return false;
      if(wave<=34)return (wave-10)%8===0;       // 10,18,26,34
      if(wave<=52)return (wave-34)%6===0;       // 40,46,52
      return (wave-52)%5===0;                   // 57,62,67... late pressure
    }
    bossOrdinalForWave(wave){
      let n=0;for(let w=1;w<=wave;w++)if(this.isBossWave(w))n++;return Math.max(1,n);
    }
    bossTypeForWave(wave){
      const bosses=ENEMY_CATALOG?.BOSSES||[];if(!bosses.length)return CHAPTERS[(this.arena+this.bossOrdinalForWave(wave)-1)%3].boss;
      const ordinal=this.bossOrdinalForWave(wave);if(ordinal<=bosses.length)return bosses[ordinal-1].id;
      const late=bosses.slice(Math.floor(bosses.length/2));return late[(ordinal-bosses.length-1)%late.length].id;
    }
    pacing(){const late=clamp((this.time-360)/360,0,1),alive=this.game.enemies.filter(e=>!e.dead).length,target=8+Math.min(28,this.time/30),rate=this.pacingKills.filter(t=>this.time-t<30).length;const adapt=clamp((target-alive)/Math.max(8,target)+(rate-12)/50,-1,1)*.08;return {late,adapt,interval:(1-late*.30)*(1-adapt),budget:(1+late*.16)*(1+adapt),xp:1-late*.12};}
    mobCountScale(){if(this.time<=180)return 1;if(this.time<600)return 1-.20*(this.time-180)/420;return .80+.10*clamp((this.time-600)/300,0,1);}
    mobDurabilityScale(){return 1-.25*clamp((this.time-180)/720,0,1);}
    midWaveCountScale(){return 1+.2*Math.min(clamp((this.time-180)/120,0,1),clamp((780-this.time)/120,0,1));}
    startWave(){
      const g=this.game;if(this.time>=1070||this.finalPhase==='battle'||this.challenge)return;this.wave++;this.currentWaveInterval=([5.5,6.5,7.5,8.5][this.wave-1]||g.rules.waveInterval)*(this.wave<=4?1:this.pacing().interval);this.nextWave=this.time+this.currentWaveInterval;
      const bossWave=false,lateBodies=Math.max(0,this.wave-22)*.16+Math.max(0,this.wave-46)*.14,fullBudget=Math.round((4+.64*this.wave+lateBodies)*this.pacing().budget*(1-.5*clamp((this.time-240)/660,0,1))*this.mobCountScale()),budget=Math.max(2,bossWave?Math.round(fullBudget*.48):fullBudget);
      const regular=ENEMY_CATALOG?.REGULAR||[];const pool=regular.filter(e=>this.time>=this.enemyUnlockTime(e));
      const weights=this.waveStageWeights(this.wave),spawns=[],planned=[];let spent=0,threatSpent=0,safety=0;
      while(pool.length&&spent<budget*.88&&safety++<80){
        const remaining=Math.max(.5,budget-spent),spec=this.pickWaveEnemy(pool,remaining,this.wave,weights,planned);if(!spec)break;
        const cost=this.deploymentCost(spec,this.wave);spawns.push(spec.id);planned.push(spec);spent+=cost;threatSpent+=spec.threat;
        if(spent>=budget&&spent<=budget*1.15)break;
        if(spent>budget*1.15){spawns.pop();planned.pop();spent-=cost;threatSpent-=spec.threat;break;}
      }
      if(!spawns.length){spawns.push('sword');const spec=regular.find(e=>e.id==='sword');spent=spec?this.deploymentCost(spec,this.wave):1.6;threatSpent=spec?.threat||1;}
      const extra=Math.round(spawns.length*(this.midWaveCountScale()-1));
      for(let i=0;i<extra;i++){const spec=this.pickWaveEnemy(pool,Infinity,this.wave,weights,planned);if(!spec)break;spawns.push(spec.id);planned.push(spec);spent+=this.deploymentCost(spec,this.wave);threatSpent+=spec.threat;}
      const record={id:this.wave,pending:spawns.length+(bossWave?1:0),alive:0,cleared:false,budget,spent,threatSpent};this.waveRecords.set(this.wave,record);
      const spacing=this.wave<=3?.18:.28;
      for(let i=0;i<spawns.length;i++)this.spawnQueue.push({type:spawns[i],wave:this.wave,due:this.time+i*spacing});
      if(bossWave){
        const type=this.bossTypeForWave(this.wave);
        this.spawnQueue.push({type,wave:this.wave,boss:true,due:this.time+spawns.length*spacing+.08});
      }
      g.emit('wave',{wave:this.wave,count:spawns.length+(bossWave?1:0),boss:bossWave,budget,spent,threatSpent,bossType:bossWave?this.bossTypeForWave(this.wave):null});
      g.trigger('onWaveStart',{wave:this.wave,count:spawns.length,run:this,budget,spent,boss:bossWave});
    }
    spawnNext(item){
      const g=this.game,p=g.p;let side=g.random()<.5?-1:1;if(!this.loopWorld){if(p.x<1050)side=1;if(p.x>g.bounds.right-1050)side=-1;}
      const viewLeft=clamp(p.x-640,g.bounds.left,g.bounds.right-1280),viewRight=viewLeft+1280;
      const rawX=p.x+side*(item.wave<=10?460+g.random()*380:850+g.random()*600),x=this.loopWorld?rawX:clamp(rawX,g.bounds.left+40,g.bounds.right-40),y=420+g.random()*260;
      const e=g.spawn(item.type,x,y),minutes=this.time/60,boss=isBoss(e),finalBoss=!!TYPES[e.type]?.final,late=Math.max(0,this.wave-20);
      // Each enemy uses its authored base HP and one elapsed-time multiplier.
      const dip=clamp(1-Math.abs(minutes-4),0,1);
      const lateGrowth=clamp((minutes-6)/10,0,1);
      const hpScale=boss?1.30+minutes*.19:(2.18+minutes*.31)*(1-.20*dip+.50*lateGrowth);
      const postureScale=boss?1.14+minutes*.12+late*.006:(1.38+minutes*.19+late*.008)*(1-.10*dip+.25*lateGrowth);
      const progress=clamp((this.time-240)/660,0,1),mobDurability=boss?1:this.mobDurabilityScale();
      const bossProgress=boss?clamp(this.challenge?(this.bossIndex-1)/10:(this.time-240)/675,0,1):0;
      if(finalBoss){e.hp=e.maxHp=this.challenge?15000:TYPES[e.type].hp;e.posture=e.maxPosture=TYPES[e.type].posture;}else{e.hp=e.maxHp=Math.round(TYPES[e.type].hp*hpScale);e.posture=e.maxPosture=Math.round(e.maxPosture*postureScale*(1+progress)*mobDurability);}
      const bossSpec=boss?ENEMY_CATALOG.BY_ID[e.type]:null;
      if(!this.challenge&&finalBoss)e.posture=e.maxPosture=Math.round(6000*(1+bossSpec.postureBonus/100));
      if(boss)e.bossProgress=bossProgress;
      e.attackMultiplier=boss?1+minutes*.03:1+minutes*.04;
      e.speedMultiplier=finalBoss?1.30:boss?1.10:Math.min(1.42,1.22+minutes*.025);if(finalBoss){e.actionSpeedMultiplier=1.28;e.finalBoss=true;e.cd=.18;}
      e.xpMultiplier=boss?Math.min(2.25,1.48+minutes*.06):Math.min(3.20,2.08+minutes*.10)*this.pacing().xp/this.mobCountScale();
      e.attackMultiplier*=1+(boss?.5:1)*progress;if(finalBoss&&this.challenge)e.attackMultiplier*=.80;e.waveId=item.wave;e.spawnDelay=boss?1.45:.62;e.alerted=true;g.trigger('onEnemySpawn',{enemy:e,wave:item.wave,boss});
      const record=this.waveRecords.get(item.wave);if(record){record.pending--;record.alive++;}
      g.emit('spawn',{x,y});if(item.boss)g.emit('bossWave',{wave:item.wave,bossType:item.type});
    }
    grantAscensionCredit(source='bonus'){
      this.pendingLevels++;this.ascensionCredits++;this.creditSources.push(source);this.game.trigger('onAscensionCredit',{source,run:this});
      this.game.emit('ascensionPending',{credits:this.pendingLevels});
      if(this.pendingLevels>=5)this.openAscensions();
    }
    gainLevel(source='level'){
        this.level++;this.nextXP=XP_FOR_LEVEL(this.level);this.pendingLevels++;this.ascensionCredits++;this.creditSources.push(source);
        const growth=this.applyLevelGrowth();
        this.game.trigger('onLevelUp',{level:this.level,run:this,source,...growth});
    }
    applyLevelGrowth(source='levelVitality'){
        const p=this.game.p,oldMax=p.maxHp;
        p.maxHp+=6;
        // Level vitality is filled immediately instead of merely raising an empty ceiling.
        p.hp=Math.min(p.maxHp*(1+(p.healCapBonus||0)),p.hp+(p.maxHp-oldMax));
        // A meaningful burst early on that also keeps pace with late-game max-health builds.
        this.game.heal(Math.max(10,p.maxHp*.08),{source});
        p.damageMultiplier+=.025;p.postureMultiplier+=.01;p.guardPostureMultiplier=(p.guardPostureMultiplier||1)+.025;
        return {maxHpGain:p.maxHp-oldMax,damageGain:.025,guardPostureGain:.025};
    }
    grantLevels(count,source='level'){
      for(let i=0;i<count;i++)this.gainLevel(source);
      this.game.emit('ascensionPending',{credits:this.pendingLevels});
      if(this.pendingLevels>=5||this.pendingLevels>0&&['rushStart','rushBoss'].includes(source))this.openAscensions();
    }
    processLevelUps(){
      const previousCredits=this.pendingLevels;
      while(this.xp>=this.nextXP){this.xp-=this.nextXP;this.gainLevel();}
      if(this.pendingLevels>previousCredits&&!this.offers.length)this.game.emit('ascensionPending',{credits:this.pendingLevels});
      if(this.pendingLevels>=5)this.openAscensions();
    }
    openAscensions(){
      if(this.training)return this.trainingOffers();
      if(this.finalPhase==='intro'||this.game.status!=='playing'||!this.pendingLevels||this.offers.length)return false;
      this.makeOffers(true);return true;
    }
    updateAscensionSafety(dt){
      const g=this.game,p=g.p;
      const threat=g.enemies.some(e=>!e.dead&&!e.spawnDelay&&(distance(p,e)<620||(e.attack?.ranged&&['windup','active'].includes(e.state)&&distance(p,e)<1100)))||g.projectiles.some(b=>b.life>0&&!b.reflected&&Math.hypot(b.x-p.x,b.y-p.y)<1000);
      this.safeTime=threat||p.state!=='idle'||p.z>1?0:this.safeTime+dt;
      if(this.pendingLevels>=5||this.pendingLevels&&this.safeTime>=1.25)this.openAscensions();
    }
    registerAscension(definition){
      if(!definition.id||typeof definition.apply!=='function')throw new Error('Ascension requires id and apply(run).');
      if(this.registry.some(a=>a.id===definition.id))throw new Error('Duplicate ascension id');this.registry.push(definition);
    }
    dualForParents(a,b){const key=[a,b].sort().join('|');return this.dualRegistry.find(d=>[...d.parents].sort().join('|')===key)||null;}
    hasDual(a,b){const d=this.dualForParents(a,b);return !!(d&&this.duals[d.id]);}
    availableDuals(){return this.dualRegistry.filter(d=>!this.duals[d.id]&&d.parents.every(id=>(this.upgrades[id]||0)>=3));}
    offerWeights(){
      let w=this.level<10?{fresh:.86,upgrade:.14,dual:0}:this.level<20?{fresh:.75,upgrade:.24,dual:.01}:this.level<30?{fresh:.60,upgrade:.36,dual:.04}:this.level<40?{fresh:.44,upgrade:.47,dual:.09}:{fresh:.36,upgrade:.52,dual:.12};
      const freshBonus=.08*clamp((30-this.level)/29,0,1);w={...w,fresh:w.fresh+freshBonus,upgrade:w.upgrade-freshBonus};
      const n=this.availableDuals().length;if(n){const extra=Math.min(.04,Math.max(0,n-1)*.01);w={...w,fresh:Math.max(.05,w.fresh-extra),dual:w.dual+extra};}
      if(n){const owned=Object.keys(this.duals).length,b=(owned===0?.14:owned===1?.08:0)*(this.level<10?.25:this.level<20?.5:1);w={...w,fresh:w.fresh-b,dual:w.dual+b};}
      if(n){const scale=this.level<80?.5+.5*clamp((this.level-1)/79,0,1):1+.25*clamp((this.level-100)/20,0,1),change=w.dual*(scale-1);w={...w,dual:w.dual+change,fresh:w.fresh-change};}
      if(n&&Object.keys(this.duals).length>=2){const reduction=.60*Math.max(clamp((this.level-30)/70,0,1),clamp((this.time-360)/720,0,1)),removed=w.dual*reduction;w={...w,dual:w.dual-removed,fresh:w.fresh+removed};}
      if(this.rerollDualBoost&&n){const b=Math.min(.03*this.rerollDualBoost,Math.max(0,w.fresh-.03));w={...w,fresh:w.fresh-b,dual:w.dual+b};}
      return w;
    }
    lv3OfferWeight(){
      // Preserve the old early weighting, with a linear additional suppression.
      const base=this.level<10?.22:this.level<20?.45:this.level<30?.70:1;
      return base*(this.level<50?.5+.5*clamp((this.level-1)/49,0,1):1+.15*clamp((this.level-90)/30,0,1));
    }
    makeOffers(notify=false,{reroll=false}={}){
      this.activeOfferSource=this.creditSources[0]||'level';
      const fatePage=this.activeOfferSource==='dualFateRewrite';
      const firstbornPage=this.activeOfferSource==='firstbornBirthright';
      if(!reroll)this.currentBonusRerolls=(this.activeOfferSource==='rerollFateBonus'||fatePage)?3:0;
      const earlyFresh=this.ascensionSelections<4&&!firstbornPage,blockLV3=this.ascensionSelections<10&&!fatePage;
      const rapid=this.upgrades.rapidGrowth||0,forceFresh=earlyFresh||!!this.effects?.rapidGrowthForceNext,choiceRank=this.upgrades.choice||0,targetCount=choiceRank>=3?5:choiceRank>=1?4:3;
      const eligible=this.registry.filter(a=>(this.upgrades[a.id]||0)<(a.maxLevel||3)&&(!a.available||a.available(this))),fresh=eligible.filter(a=>!this.upgrades[a.id]),upgrade=eligible.filter(a=>this.upgrades[a.id]&&(!blockLV3||this.upgrades[a.id]<2)),dual=earlyFresh?[]:this.availableDuals();
      const selected=[],used=new Set(),take=pool=>{const candidates=pool.filter(x=>!used.has(x.id));if(!candidates.length)return null;let x;if(pool===upgrade){const lv3Weight=this.lv3OfferWeight(),total=candidates.reduce((sum,a)=>sum+((this.upgrades[a.id]||0)>=2?lv3Weight:1),0);let roll=this.game.random()*total;x=candidates.find(a=>(roll-=((this.upgrades[a.id]||0)>=2?lv3Weight:1))<=0)||candidates.at(-1);}else x=candidates[Math.floor(this.game.random()*candidates.length)];used.add(x.id);selected.push(x);return x;};
      const pickKind=()=>{const w=this.offerWeights(),choices=[];if(fresh.some(x=>!used.has(x.id)))choices.push(['fresh',w.fresh]);if(upgrade.some(x=>!used.has(x.id)))choices.push(['upgrade',w.upgrade]);if(dual.some(x=>!used.has(x.id)))choices.push(['dual',w.dual]);if(!choices.length)return null;const total=choices.reduce((a,b)=>a+b[1],0),r=this.game.random()*total;let c=0;return (choices.find(x=>(c+=x[1])>=r)||choices.at(-1))[0];};
      while(selected.length<targetCount){let x=null;if(earlyFresh){x=take(fresh);}else if(fatePage||firstbornPage){x=take(dual)||take(fresh)||take(upgrade);}else if(forceFresh){x=take(fresh);}else{const kind=pickKind();if(!kind)break;x=take(kind==='dual'?dual:kind==='fresh'?fresh:upgrade);}if(!x)break;}
      let rapidUsed=false;
      this.offers=selected.map((a,slot)=>{
        if(a.parents)return {...a,dual:true,offerType:'dual',nextLevel:null,grantTo:null,description:a.description};
        const current=this.upgrades[a.id]||0;let grantTo=current+1,rapidBoost=false,rapidGrowthReward=false;
        if(earlyFresh){grantTo=1;}
        else if(fatePage){grantTo=3;rapidBoost=true;}
        else if(firstbornPage&&current===0){grantTo=3;rapidBoost=true;rapidGrowthReward=true;}
        else if(forceFresh&&current===0){grantTo=3;rapidBoost=true;rapidGrowthReward=true;}
        else if(!rapidUsed&&rapid>=1&&current===1&&this.game.random()<(.03+(slot===0&&this.hasDual('choice','rapidGrowth')?.05:0))){grantTo=3;rapidBoost=true;rapidGrowthReward=true;rapidUsed=true;}
        else if(!rapidUsed&&rapid>=2&&current===0&&this.game.random()<(.04+(slot===0&&this.hasDual('choice','rapidGrowth')?.05:0))){grantTo=2;rapidBoost=true;rapidGrowthReward=true;rapidUsed=true;}
        return {...a,offerType:current?'upgrade':'fresh',nextLevel:grantTo,grantTo,rapidBoost,rapidGrowthReward,description:a.levels?.[Math.min(2,grantTo-1)]||a.description};
      });
      if(!this.offers.length)this.offers=[{id:'reserve-growth',name:'百炼',subtitle:'诸艺已臻化境',description:'所有合法擢升已获得，本次改为永久提高 8% 攻击伤害。',nextLevel:null,fallback:true,apply(run){run.game.p.damageMultiplier+=.08;}}];
      if(notify)this.game.emit('upgrade',{level:this.level,credits:this.pendingLevels});
    }
    rerollOffers(){
      if(!this.offers.length)return false;
      if(this.currentBonusRerolls>0)this.currentBonusRerolls--;else if(this.rerolls>0)this.rerolls--;else return false;
      if(this.hasDual('choice','rerollFate'))this.rerollDualBoost++;
      this.makeOffers(false,{reroll:true});this.game.emit('reroll',{remaining:this.rerolls,bonus:this.currentBonusRerolls});return true;
    }
    applyAscensionOffer(offer,{free=false}={}){
      if(!offer)return false;
      if(offer.dual){if(this.duals[offer.id]||!offer.parents.every(id=>(this.upgrades[id]||0)>=3))return false;this.duals[offer.id]=true;this.effects?.onDualAcquired?.(offer);this.game.trigger('onDualAscensionChosen',{id:offer.id,parents:offer.parents,run:this});return true;}
      if(!offer.fallback){let rank=this.upgrades[offer.id]||0;if(rank>=(offer.maxLevel||3))return false;const target=Math.min(offer.maxLevel||3,offer.grantTo||rank+1);while(rank<target){rank++;this.upgrades[offer.id]=rank;offer.apply(this,rank);}}else if(!free)offer.apply(this);else return false;
      this.game.trigger('onAscensionChosen',{id:offer.id,rank:this.upgrades[offer.id]||null,run:this,free,rapidBoost:!!offer.rapidBoost,rapidGrowthReward:!!offer.rapidGrowthReward});return true;
    }
    chooseAscension(id){
      if(this.training)return this.trainingPick(id);
      const offer=this.offers.find(o=>o.id===id);if(!offer)return false;const source=this.activeOfferSource||this.creditSources[0]||'level',wasRapidForce=this.ascensionSelections>=4&&!!this.effects?.rapidGrowthForceNext,page=[...this.offers];if(!this.applyAscensionOffer(offer))return false;if(wasRapidForce)this.effects.rapidGrowthForceNext=false;
      this.ascensionSelections++;this.pendingLevels--;if(this.creditSources.length)this.creditSources.shift();this.lastAscensionChoice={id:offer.id,name:offer.name,rank:offer.dual?'DUAL':this.upgrades[offer.id]||null,source,dual:!!offer.dual,refinementBonus:source==='refinementBoss',rapidBoost:!!offer.rapidBoost};
      const choiceRank=this.upgrades.choice||0,baseChance=choiceRank>=3?.10:choiceRank>=2?.05:0,chance=this.game.hooks.modify('positiveChance',baseChance,{source:'choice'}),refinedChoice=source==='refinementBoss'&&this.hasDual('refinement','choice'),giftTriggered=refinedChoice||chance>0&&this.game.random()<chance;
      if(giftTriggered){const pool=page.filter(o=>o.id!==id&&!o.fallback&&(o.dual?!this.duals[o.id]:(this.upgrades[o.id]||0)<(o.maxLevel||3)));if(pool.length){const bonus=pool[Math.floor(this.game.random()*pool.length)];if(this.applyAscensionOffer(bonus,{free:true})){const gifted={id:bonus.id,name:bonus.name,rank:bonus.dual?'DUAL':this.upgrades[bonus.id]||null,dual:!!bonus.dual,rapidBoost:!!bonus.rapidBoost};this.lastAscensionChoice.gifted=gifted;this.game.emit('bonusAscension',gifted);}}}
      this.offers=[];this.currentBonusRerolls=0;this.rerollDualBoost=0;if(this.pendingLevels)this.makeOffers(false);return true;
    }
    canDismantleOffers(){return !this.training&&this.game.status==='playing'&&this.pendingLevels>0&&this.offers.length>0&&(this.hasDual('dismantle','rerollFate')||this.hasDual('choice','pageStorm'));}
    dismantleOffers(){
      if(!this.canDismantleOffers())return false;
      const recycling=this.hasDual('dismantle','rerollFate'),enchanting=this.hasDual('choice','pageStorm');
      const dualCount=this.offers.filter(o=>o.dual).length,xp=recycling?this.nextXP*(.50+.25*dualCount):0;
      const wasRapidForce=this.ascensionSelections>=4&&!!this.effects.rapidGrowthForceNext;
      this.ascensionSelections++;this.pendingLevels--;this.creditSources.shift();
      if(wasRapidForce)this.effects.rapidGrowthForceNext=false;
      this.offers=[];this.currentBonusRerolls=0;this.rerollDualBoost=0;
      if(enchanting)this.effects.enchant.levels++;
      this.xp+=xp;this.totalXP+=xp;this.lastAscensionChoice=null;
      this.processLevelUps();
      if(this.pendingLevels&&!this.offers.length)this.makeOffers(false);
      this.game.emit('ascensionDismantled',{xp,enchanting,dualCount,credits:this.pendingLevels});return true;
    }
    step(dt,input={},pressed={}){
      if(this.finalPhase==='battle'&&!this.game.enemies.some(e=>this.finalIds.has(e.id)&&!e.dead)){
        this.finishFinalBattle();
      }
      if(this.offers.length||this.game.status!=='playing')return;
      if(pressed.e&&this.openAscensions())return;
      this.time+=dt;const g=this.game;if(!this.training&&this.updateCampaign(dt))return;g.lateIntensity=this.training?0:clamp((this.time-360)/600,0,1);if(pressed.r)this.castMomentumBurst();
      if(!this.challenge&&!this.training){
        if(this.time>=this.nextWave)this.startWave();
        // There is deliberately no hard population cap. If the player stalls, queued waves
        // continue to enter and the AI's soft engagement budget rises with the crowd.
        while(this.spawnQueue.length&&this.spawnQueue[0].due<=this.time)this.spawnNext(this.spawnQueue.shift());
        const alive=g.enemies.filter(e=>!e.dead).length;this.peakAlive=Math.max(this.peakAlive,alive);
      }
      this.updateLoopWorld();const before=g.time;g.step(dt,input,pressed);this.wrapLoopWorld();
      if(g.time>before&&g.status==='playing')this.effects.update(g.time-before);
      if(this.training){for(const e of g.enemies)if(e.dummy&&e.dead&&e.deathT>=1.15)this.resetTrainingDummy(e);g.heal(35*dt,{source:'training',quiet:true});this.momentum=clamp(this.momentum+35*dt,this.effects.momentumMinimum(),g.rules.momentumMax);this.effects.updateOverdraft();this.syncTemporaryMomentum();this.trainingHits=this.trainingHits.filter(h=>this.time-h.time<5);this.pendingLevels=0;this.creditSources=[];this.xp=0;}
      g.enemies=g.enemies.filter(e=>e.dummy||!e.dead||e.rushCorpseUntil>this.time||this.finalPhase==='ending'&&this.finalIds.has(e.id)||(!e.furnaceConsumed&&e.deathT<1.2));
      if(g.status==='playing'&&!this.training)this.processLevelUps();
      if(!this.training)this.updateAscensionSafety(dt);
      // Completed wave metadata is no longer needed after its clear event.
      for(const [id,record] of this.waveRecords)if(record.cleared&&id<this.wave-6)this.waveRecords.delete(id);
    }
  }
  return {Run,ASCENSIONS,DUAL_ASCENSIONS,XP,MOMENTUM_BURST,XP_FOR_LEVEL};
  })();
  if(!(typeof module==='object'&&module.exports))globalThis.AshSurvival=survivalAPI;
  return survivalAPI;
}

/* Authored ending plates. The combat boss renderer supplies the original armor. */
const AshVictoryArt=(()=>{
  'use strict';
  const W=1120,H=600,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
  const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  function shape(c,p,fill,stroke=null,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function line(c,p,color,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
  function haze(c,x,y,rx,ry,color){c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();}
  function gradient(c,y1,y2,stops){const g=c.createLinearGradient(0,y1,0,y2);stops.forEach(([at,col])=>g.addColorStop(at,col));return g;}
  function temple(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);line(c,[[0,-178],[0,-158]],col,3);shape(c,[[-26,0],[-26,-120],[26,-120],[26,0]],col);
    for(let i=0;i<3;i++){const yy=-142+i*41,half=30+i*9;shape(c,[[-half,yy+15],[-half-16,yy+22],[-half+6,yy+4],[-14,yy-8],[14,yy-8],[half-6,yy+4],[half+16,yy+22],[half,yy+15]],col);}
    shape(c,[[-7,0],[-7,-32],[7,-32],[7,0]],'#10141d');c.restore();}
  function ridge(c,points,col){shape(c,[[0,H],...points,[W,H]],col);}
  function pillar(c,x,y,s,dawn=false){c.save();c.translate(x,y);c.scale(s,s);const edge=dawn?'#b8967550':'#87718c55';
    shape(c,[[-18,0],[-18,-168],[-9,-182],[17,-177],[19,0]],gradient(c,-180,0,[[0,'#33303c'],[1,'#11151f']]),edge,.8);
    shape(c,[[-24,-176],[-25,-187],[24,-187],[23,-176]],'#39323f',edge,.7);line(c,[[-11,-165],[-11,-16]],edge,1);
    line(c,[[7,-162],[-2,-132],[9,-118],[-5,-89],[4,-57]],'#080d17',2);line(c,[[-24,-186],[9,-186]],edge,1.5);c.restore();}
  function landscape(c,index,t){const dawn=index===3,after=index===2,u=dawn?clamp(t/5):0;
    c.fillStyle=gradient(c,0,H,dawn?[[0,'#202638'],[.40,'#736071'],[.72,'#d99a79'],[1,'#edbc87']]:[[0,'#0d0c1a'],[.36,'#282035'],[.73,after?'#71434d':'#593049'],[1,'#a26260']]);c.fillRect(0,0,W,H);
    const sx=dawn?814:938,sy=dawn?258-u*56:117;
    haze(c,sx,sy,210,180,dawn?'#ffc68866':'#edb67b18');haze(c,770,345,620,180,dawn?'#f3b78a55':'#b5637430');
    ellipse(c,sx,sy,dawn?43:31,dawn?43:31,dawn?'#ffd695':'#c49c83');ellipse(c,sx-3,sy-4,dawn?36:27,dawn?36:27,dawn?'#ffe3aa':'#d2b59a');
    for(let i=0;i<5;i++){const x=100+noise(i+80)*880,y=115+noise(i+30)*150;haze(c,x,y,220,7+noise(i)*5,dawn?'#ecc6b014':'#9e7c960b');}
    ridge(c,[[0,368],[84,322],[158,343],[277,232],[399,337],[524,260],[643,353],[762,281],[885,359],[1016,245],[1120,327]],dawn?'#826b78':'#423044');
    temple(c,244,371,.46,dawn?'#665766':'#2f2937');temple(c,690,401,.59,dawn?'#615665':'#302735');temple(c,985,391,.38,dawn?'#65545e':'#302734');
    ridge(c,[[0,418],[115,340],[234,397],[351,316],[478,421],[625,330],[758,400],[857,339],[996,422],[1120,357]],dawn?'#625969':'#2c2736');
    temple(c,439,445,.35,dawn?'#474753':'#22232d');temple(c,858,450,.40,dawn?'#44434f':'#20232e');
    ridge(c,[[0,463],[162,403],[281,449],[471,375],[621,461],[763,390],[932,457],[1053,404],[1120,438]],dawn?'#373e4f':'#19222e');
    haze(c,670,426,640,65,dawn?'#efb49135':'#b27b8d20');
    // Ruined mountain gate: lower halves disappear into the near ridge.
    pillar(c,82,499,1.22,dawn);pillar(c,208,472,.74,dawn);pillar(c,1038,495,1.04,dawn);
    shape(c,[[0,497],[225,467],[435,485],[742,456],[945,479],[1120,468],[1120,H],[0,H]],gradient(c,456,H,[[0,dawn?'#161d28':'#101622'],[1,'#080c14']]));
    // The causeway, stone joints and wet reflections all converge toward the gate.
    shape(c,[[255,H],[735,459],[851,460],[1090,H]],'#101722');line(c,[[255,H],[735,459]],dawn?'#dcab7959':'#82748055',1.6);line(c,[[1090,H],[851,460]],'#8d727344',1.2);
    for(let i=1;i<9;i++){const q=i/9,y=460+q*q*140,left=735-(735-255)*q*q,right=851+(1090-851)*q*q;line(c,[[left,y],[right,y-2]],'#b99b7c24',.9);line(c,[[left+(right-left)*.42,y],[left+(right-left)*.45,y+q*20]],'#b99b7c20',.7);}
    for(let i=0;i<95;i++){const x=noise(i+200)*W,y=485+noise(i+320)*110;line(c,[[x,y],[x+4+noise(i+800)*24,y-1]],dawn?'#c9aa7f18':'#8d7f9720',.6);}
    for(const [x,y,s] of [[134,510,1],[966,518,.9]]){line(c,[[x,y],[x,y-94*s]],'#0b1019',4*s);shape(c,[[x,y-88*s],[x+47*s,y-79*s],[x+41*s,y-54*s],[x,y-63*s]],after||dawn?'#3c2732':'#502c3b');line(c,[[x+3,y-86*s],[x+41*s,y-79*s]],'#ac677d33',1);}
    if(dawn){c.save();c.globalCompositeOperation='screen';haze(c,814,422,270,45,'#f7bf7744');for(let i=0;i<35;i++){const y=472+i*3,x=803-i*1.8;line(c,[[x-8-noise(i)*i*2,y],[x+12+noise(i+80)*i*2,y]],'#f5bb7820',.9);}c.restore();}
  }
  function sword(c,hand,tip,warm=false){const dx=tip[0]-hand[0],dy=tip[1]-hand[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
    line(c,[[hand[0]-dx/len*10,hand[1]-dy/len*10],hand],'#917056',4);shape(c,[[hand[0]+nx*2,hand[1]+ny*2],[tip[0],tip[1]],[hand[0]-nx*2,hand[1]-ny*2]],warm?'#e8c796':'#e6ded0');line(c,[[hand[0]-nx*7,hand[1]-ny*7],[hand[0]+nx*7,hand[1]+ny*7]],'#c29d72',3);line(c,[hand,tip],'#fff2d0',.8);}
  function hero(c,x,y,s,pose='rest',warm=false){c.save();c.translate(x,y);c.scale(s,s);const fight=pose==='clash',cut=pose==='cut',back=pose==='back',rim=warm?'#d3a97b':'#afa3b0';
    ellipse(c,0,3,37,5,'#05091099');
    line(c,[[-10,-37],[-17,-16],[-23,1]],'#080d15',10);line(c,[[9,-35],[17,-19],[fight?31:22,1]],'#080d15',10);line(c,[[-17,-18],[-23,0]],'#39414b',1);line(c,[[18,-18],[23,0]],'#323847',1);
    // A faceted coat with seams and folds, rather than a bright outline around a slab.
    shape(c,[[-19,-103],[10,-106],[23,-74],[21,-37],[2,-24],[-29,-32],[-25,-71]],gradient(c,-106,-24,[[0,'#26303c'],[.52,'#121d2a'],[1,'#101722']]));
    shape(c,[[-19,-101],[-10,-86],[-12,-48],[-24,-31],[-29,-32],[-25,-71]],'#303946');shape(c,[[10,-104],[23,-74],[21,-37],[8,-32],[12,-76]],'#0b111d');
    line(c,[[-19,-98],[-26,-70],[-29,-34]],rim+'88',1);line(c,[[15,-84],[12,-47],[1,-31]],'#58606e66',.7);line(c,[[-18,-48],[0,-43],[19,-48]],'#6e626155',2);line(c,[[-6,-88],[-7,-60]],'#62718066',.7);
    ellipse(c,-3,-121,13,17,'#0c121b');shape(c,[[-17,-124],[-13,-138],[1,-146],[15,-124]],'#080e16');shape(c,[[-13,-138],[1,-146],[6,-137],[-13,-126]],'#17212d');line(c,[[-17,-124],[15,-124]],rim+'99',1);
    if(!back){shape(c,[[4,-121],[12,-119],[8,-108],[2,-110]],'#a48b82');line(c,[[6,-118],[11,-118]],'#0d1119',1.3);}
    const hand=fight?[46,-78]:cut?[45,-62]:[29,-64],tip=fight?[145,-116]:cut?[135,-110]:[83,-18];
    line(c,[[-18,-96],[-36,-70],[-29,-51]],'#25303c',8);line(c,[[-34,-72],[-29,-52]],rim+'66',1);
    line(c,[[15,-97],[fight?31:26,-79],hand],'#2e3945',8);line(c,[[26,-79],hand],rim+'99',1.2);ellipse(c,...hand,3.5,4.2,'#bca28a');sword(c,hand,tip,warm);
    // The scarf preserves the game's identity and carries the direction of the blow.
    const flutter=cut?-7:0;shape(c,[[-17,-103],[7,-110],[42,-104],[67,-91+flutter],[93,-102+flutter],[72,-80+flutter],[38,-90],[-12,-95]],'#87414b');shape(c,[[6,-108],[42,-104],[67,-91+flutter],[93,-102+flutter],[68,-87+flutter],[40,-100]],'#b56363');line(c,[[-12,-102],[13,-105],[45,-97]],'#d0857377',1);shape(c,[[-18,-101],[-45,-112],[-79,-101],[-51,-92],[-68,-80],[-25,-87]],'#452738');line(c,[[-43,-106],[-67,-102]],'#ad687a44',.7);
    c.restore();}
  function atmosphere(c,index){const dawn=index===3;
    // Fixed grain coordinates avoid flicker when the dawn plate is repainted.
    for(let i=0;i<1900;i++){const x=noise(i+6000)*W,y=noise(i+9000)*H;c.fillStyle=i%2?'#e8c5a007':'#080b1712';c.fillRect(x,y,.7,.7);}
    if(!dawn)for(let i=0;i<58;i++){const x=noise(i+1100)*W,y=noise(i+1700)*H;line(c,[[x,y],[x-7,y+21+noise(i)*20]],'#c8b6cb13',.7);}
    for(let i=0;i<24;i++){const x=180+noise(i+2000)*860,y=160+noise(i+2200)*365;ellipse(c,x,y,.7+noise(i)*1.2,.7+noise(i)*1.2,dawn?'#f7c88666':index===2?'#e0a47955':'#c5a0ca50');}
    const vignette=c.createRadialGradient(610,292,120,560,300,640);vignette.addColorStop(0,'transparent');vignette.addColorStop(.66,'#0408120c');vignette.addColorStop(1,'#030611ba');c.fillStyle=vignette;c.fillRect(0,0,W,H);
    c.fillStyle=gradient(c,495,H,[[0,'transparent'],[1,'#040812dd']]);c.fillRect(0,495,W,105);
  }
  function impact(c,x,y){c.save();c.globalCompositeOperation='lighter';haze(c,x,y,92,80,'#f5b27d55');haze(c,x,y,32,30,'#ffddbdbb');
    for(let i=0;i<26;i++){const a=noise(i+4000)*TAU,r=18+noise(i+4500)*71;line(c,[[x+Math.cos(a)*7,y+Math.sin(a)*7],[x+Math.cos(a)*r,y+Math.sin(a)*r]],i%3?'#e5bc8477':'#efd6fd99',i%3?.8:1.5);ellipse(c,x+Math.cos(a)*r,y+Math.sin(a)*r,1,1.3,'#ffe4b7');}
    line(c,[[x-24,y+22],[x+24,y-22]],'#fff4d9',2);ellipse(c,x,y,4,4,'#fff6e6');c.restore();}
  function cleave(c){c.save();c.globalCompositeOperation='lighter';
    // A tapered blade arc has a direction and a sharp tip, with no rounded beam caps.
    for(const [thick,col] of [[18,'#a970c518'],[6,'#cbaad136'],[1,'#f2dfd888']]){c.beginPath();c.moveTo(290,455);c.quadraticCurveTo(675,291-thick,1027,171);c.quadraticCurveTo(690,305+thick,290,455);c.fillStyle=col;c.fill();}
    c.beginPath();c.moveTo(319,443);c.quadraticCurveTo(693,300,1027,171);c.strokeStyle='#fff0db';c.lineWidth=1.4;c.stroke();haze(c,760,279,130,48,'#d2a0de22');
    for(let i=0;i<38;i++){const x=630+noise(i+5100)*375,y=262-(x-740)*.38+(noise(i+5700)-.5)*92,r=2+noise(i+5800)*6;shape(c,[[x-r,y],[x+r*1.2,y-r],[x,y+r*1.4]],i%3?'#8b788e':'#e4c6c2');line(c,[[x,y],[x-13-noise(i)*23,y+7]],'#d9b9d044',.7);}
    c.restore();}
  function draw(c,index,time=0,boss){c.save();c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);c.clearRect(0,0,W,H);c.lineJoin='round';landscape(c,index,time);
    if(index===0){
      haze(c,785,381,235,118,'#8158a225');ellipse(c,766,498,84,11,'#050912aa');
      boss(c,{x:936,y:484,scale:.91,slot:0,time:1,face:-1,silhouette:true});
      boss(c,{x:775,y:492,scale:1.23,slot:1,time:1,face:-1,entity:{state:'active',t:.12,attack:{active:1,finalIndex:1}}});
      hero(c,381,503,1.73,'clash');
      // Both blades meet at this single bright focal point.
      shape(c,[[801,334],[632,304],[617,290],[640,297],[803,327]],'#5d4b64','#d2b6ce',1);impact(c,632,301);
    }else if(index===1){
      haze(c,789,342,290,166,'#af71972c');
      for(let part=0;part<2;part++){c.save();c.beginPath();c.moveTo(0,part?568:0);c.lineTo(W,part?135:0);c.lineTo(W,part?H:135);c.lineTo(0,part?H:568);c.closePath();c.clip();
        boss(c,{x:805+(part?23:0),y:508+(part?20:0),scale:1.30,slot:1,time:2,face:-1});boss(c,{x:995+(part?13:0),y:494+(part?9:0),scale:.88,slot:0,time:2,face:-1});c.restore();}
      hero(c,476,519,1.88,'cut');cleave(c);
    }else if(index===2){
      haze(c,697,482,295,44,'#a5808544');
      for(const [x,y,s,slot,angle] of [[281,509,.64,0,-1.50],[897,509,.75,1,1.48]]){c.save();c.translate(x,y);c.rotate(angle);boss(c,{scale:s,slot,dead:true});c.restore();}
      for(let i=0;i<19;i++){const x=230+noise(i+3300)*725,y=493+noise(i+3500)*39,r=4+noise(i+3600)*11;shape(c,[[x-r,y],[x-3,y-r],[x+r,y-3],[x+4,y+3]],'#24232d','#68566566',.5);}
      hero(c,565,500,1.75,'rest');line(c,[[584,478],[712,537]],'#b48b7344',1.1);
    }else{
      // A smaller back view and open sky make the final beat quiet and expansive.
      hero(c,446,512,1.55,'back',true);haze(c,806,255,365,196,'#ffc3810c');
      for(let i=0;i<5;i++){const x=655+i*21,y=207+Math.sin(i*1.7)*10;line(c,[[x-4,y+2],[x,y],[x+4,y+2]],'#35344399',1);}
    }
    atmosphere(c,index);c.restore();
  }
  return {draw};
})();
if(!(typeof module==='object'&&module.exports))globalThis.AshVictoryArt=AshVictoryArt;

// One full day spans ten minutes of simulation; UI pauses freeze the sky.
function sampleDaylight(seconds){
 const hour=(4+Math.max(0,seconds)/600*24)%24,keys=[
 [0,'深夜',[8,17,33],[25,34,54]], [4,'凌晨',[24,27,53],[91,65,85]], [6,'清晨',[70,99,129],[221,162,119]],
 [9,'上午',[84,141,177],[181,204,199]], [12,'中午',[75,149,188],[195,220,209]], [17,'黄昏',[93,69,112],[231,137,90]],
 [20,'晚上',[28,38,69],[79,77,113]], [23,'深夜',[8,17,33],[25,34,54]], [24,'深夜',[8,17,33],[25,34,54]]];
 let i=0;while(i<keys.length-2&&hour>=keys[i+1][0])i++;const a=keys[i],b=keys[i+1],t=(hour-a[0])/(b[0]-a[0]),q=t*t*(3-2*t),mix=(u,v)=>u.map((n,j)=>Math.round(n+(v[j]-n)*q));
 const sun=(hour-5.5)/13,elevation=Math.max(0,Math.sin(sun*Math.PI)),day=hour>=5.5&&hour<=18.5;
 return {hour,label:a[1],top:mix(a[2],b[2]),horizon:mix(a[3],b[3]),day,elevation,sunX:120+sun*1200,sunY:370-elevation*315,shadowX:Math.cos(sun*Math.PI)*(90-65*elevation),light:.05+elevation*.85};
}
/* Canvas art helpers and game presentation. */
const AshBattleArt=(()=>{
  'use strict';
  const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
  const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  function stroke(c,pts,color,w=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}
  function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=color;c.fill();}
  function glow(c,x,y,r,color){AshCombatFX.glow(c,x,y,r,color);}
  const boltJitterCache=new Map();
  function bolt(c,a,b,seed,width=2){
    if(!AshCombatFX.segmentVisible(c,a[0],a[1],b[0],b[1],40))return;
    const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,key=Math.floor(seed),jitter=boltJitterCache.get(key)||(()=>{const v=Array.from({length:12},(_,i)=>(noise(key+i)-.5)*Math.sin(i/12*Math.PI));if(boltJitterCache.size>=96)boltJitterCache.delete(boltJitterCache.keys().next().value);boltJitterCache.set(key,v);return v;})();
    c.beginPath();c.moveTo(...a);for(let i=1;i<12;i++){const q=i/12,j=jitter[i]*Math.min(30,l*.19);c.lineTo(a[0]+dx*q-dy/l*j,a[1]+dy*q+dx/l*j);}c.lineTo(...b);
    c.lineCap='round';c.lineJoin='round';for(const [color,w] of [['#4d9ff7',width*3],['#bceeff',width],['#fffaff',Math.max(.6,width*.35)]]){c.strokeStyle=color;c.lineWidth=w;c.stroke();}
    for(let i=3;i<10;i+=3){const q=i/12,j=jitter[i]*Math.min(30,l*.19),x=a[0]+dx*q-dy/l*j,y=a[1]+dy*q+dx/l*j,side=i%2?1:-1;stroke(c,[[x,y],[x+side*13,y+6],[x+side*23,y-8]],'#89d9ff',.8);}
  }
  function floorTiles(bounds,camera,width){const tiles=[];const left=bounds.left,right=bounds.right;
    for(let row=0;row<8;row++){const offset=(row%2)*88;for(let col=Math.floor((Math.max(left,camera-190)-left-offset)/176);col<Math.ceil((Math.min(right,camera+width+190)-left-offset)/176);col++){
      const x=left+col*176+offset;tiles.push({x,y:402+row*38,row,col,seed:row*317+col*71});}}
    return tiles;
  }
  function floor(c,bounds,camera,width,theme){
    c.save();const left=bounds.left-camera,right=bounds.right-camera;
    // All pavement, drainage and edge stones share the logical world origin.
    c.beginPath();c.rect(left,398,right-left,316);c.clip();
    const bg=c.createLinearGradient(0,398,0,714);bg.addColorStop(0,'#354447');bg.addColorStop(.5,theme==='sunset'?'#3c3b32':'#28383b');bg.addColorStop(1,'#17272e');c.fillStyle=bg;c.fillRect(0,398,width,316);
    for(const t of floorTiles(bounds,camera,width)){const x=t.x-camera,y=t.y,n=noise(t.seed),tone=Math.floor(36+n*12);c.beginPath();c.moveTo(x+3,y+2);c.lineTo(x+172,y+2);c.lineTo(x+164,y+36);c.lineTo(x-5,y+36);c.closePath();c.fillStyle=`rgb(${tone},${tone+12},${tone+14})`;c.fill();c.strokeStyle='#122229';c.lineWidth=1.5;c.stroke();stroke(c,[[x+4,y+3],[x+170,y+3]],'#65757055');
      if(n>.48){stroke(c,[[x+26+n*70,y+4],[x+34+n*54,y+14],[x+30+n*64,y+21],[x+42+n*60,y+35]],'#0e1f2666');}
      if(n>.72){c.globalAlpha=.22;oval(c,x+67,y+23,35,4,'#a4b9b9');c.globalAlpha=1;}
      for(let i=0;i<3;i++){const q=noise(t.seed+i+70);stroke(c,[[x+q*145,y+11+i*7],[x+q*145+9+q*24,y+10+i*7]],'#a6b0a10b');}
    }
    for(const y of [400,699]){c.fillStyle='#12232a';c.fillRect(0,y,width,8);stroke(c,[[0,y],[width,y]],'#84928b88',2);for(let wx=Math.floor((camera-30)/92)*92;wx<camera+width+92;wx+=92){c.fillStyle='#62726933';c.fillRect(wx-camera,y+2,65,2);}}
    // Inset engraved medallions make the extended battlefield visually continuous.
    for(let wx=bounds.left+360;wx<bounds.right;wx+=720){if(wx<camera-180||wx>camera+width+180)continue;const x=wx-camera,y=554;c.save();c.translate(x,y);c.scale(1,.32);c.strokeStyle='#91a18b27';c.lineWidth=2;for(const r of [57,63,79]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}for(let i=0;i<8;i++){const a=i*TAU/8;stroke(c,[[Math.cos(a)*20,Math.sin(a)*20],[Math.cos(a+.15)*51,Math.sin(a+.15)*51],[Math.cos(a)*70,Math.sin(a)*70]],'#91a18b32',2);}c.restore();}
    c.restore();
    for(const x of [left,right])if(x>-30&&x<width+30){c.fillStyle='#101d24';c.fillRect(x-9,398,18,316);stroke(c,[[x-9,398],[x-9,714]],'#87978c',2);stroke(c,[[x+9,398],[x+9,714]],'#52635d',2);for(let y=402;y<710;y+=39)stroke(c,[[x-8,y],[x+8,y]],'#53635d');}
  }
  // Curved ribbons have a tapered wake, bright leading edge and a broad ground footprint.
  function ribbon(...args){return AshCombatFX.ribbon(...args);}
  function flame(c,x,y,h,seed,time,color='#fca84d'){
    if(!(h>0))return;
    const {cold,hot,pale}=AshCombatFX.flamePalette(color);
    const flicker=.78+.22*Math.sin(time*13+seed*1.7),height=h*flicker;
    const sway=Math.sin(time*7+seed)*height*.29,w=height*.27;
    const g=c.createLinearGradient(x,y,x+sway,y-height);g.addColorStop(0,cold?color+'66':'#d4542688');g.addColorStop(.24,color+'cc');g.addColorStop(.62,hot+'99');g.addColorStop(1,hot+'00');
    c.beginPath();c.moveTo(x-w,y);c.bezierCurveTo(x-w*1.6,y-height*.25,x+sway-w*.9,y-height*.51,x+sway-w*.3,y-height*.76);c.quadraticCurveTo(x+sway+w*.6,y-height*.57,x+sway,y-height);c.bezierCurveTo(x+sway+w*.1,y-height*.60,x+w*1.8,y-height*.35,x+w,y);c.closePath();c.fillStyle=g;c.fill();
    const core=c.createLinearGradient(x,y,x,y-height*.63);core.addColorStop(0,pale+'99');core.addColorStop(.4,pale+'88');core.addColorStop(1,pale+'00');c.beginPath();c.moveTo(x-w*.35,y);c.bezierCurveTo(x-w*.8,y-height*.3,x+sway*.6,y-height*.3,x+sway*.8,y-height*.69);c.quadraticCurveTo(x+w*.3,y-height*.27,x+w*.4,y);c.fillStyle=core;c.fill();
    const ember=(time*1.8+noise(seed))%1;c.globalAlpha*=.9;stroke(c,[[x+sway*ember,y-height*ember],[x+sway*ember+2,y-height*ember-3]],pale,1);c.globalAlpha/=.9;
  }
  const IMPACTS={frostExplosion:'ice',giantImpact:'stone',probeConsume:'probe',finalHoly:'holy',holyStrike:'holy',bountyClaim:'bounty',enemyExplosion:'fire',quake:'stone',shockwave:'airPressure',chargePeak:'airPressure',rockShockwave:'airPressure',twinShock:'goldFissure',burstEcho:'burst',peakShock:'airPressure',dualHeavyShock:'smallRecoil',bullImpact:'bull',posturePulse:'bladeShock',corpseBomb:'blood',overkill:'overkillRupture',bloodTide:'blood',flyingKickExplosion:'goldShrapnel',heatBurst:'fire',projectileFireBurst:'projectileFire',frictionBurst:'frictionHeat',poisonFlameBlast:'poisonFlame',serumReactionBurst:'serumReaction',emberSpreadBurst:'flameSpread',heavyRecoil:'heavyRecoil',ignite:'fire',meteorImpact:'meteor',fireTouch:'fire',acidBlood:'acidBlood',plague:'poison',iceBarrierBreak:'iceArmor',freeze:'ice',consecrationEnd:'holy',furnace:'fire',timeReturn:'void'};
  class Effects{
    constructor(){this.items=[];}
    clear(){this.items=[];}
    ingest(e,view=null){if(e.type==='resonanceShock'){for(let i=this.items.length-1;i>=0;i--){const f=this.items[i];if(f.kind==='bladeShock'&&f.t<.04&&f.x===e.x&&f.y===e.y){f.stacks=Math.max(f.stacks||0,Math.min(4,Math.max(0,(e.waves||1)-1)));break;}}return;}if(e.type==='dualHeavyShock'&&e.boss)return;if(!IMPACTS[e.type]&&e.type!=='damageShield'&&e.type!=='ghostHand'&&e.type!=='lightningRod')return;if(view){let lo=Number.isFinite(e.x)?e.x:Infinity,hi=Number.isFinite(e.x)?e.x:-Infinity;for(const p of e.points||[]){lo=Math.min(lo,p.x);hi=Math.max(hi,p.x);}const pad=Math.max(e.radius||120,e.rockRiftLength||0)+150;if(lo!==Infinity&&(hi+pad<view.left||lo-pad>view.right))return;}if(e.type==='bountyClaim'&&e.targetId){const prior=this.items.find(f=>f.kind==='bounty'&&f.targetId===e.targetId&&f.t<.04);if(prior){prior.rank=Math.max(prior.rank||1,e.rank||1);prior.boss=prior.boss||e.boss;prior.beast=prior.beast||e.beast;return;}}if(e.type==='damageShield')this.items.push({...e,kind:'shield',t:0,life:.4});const kind=e.type==='meteorImpact'&&e.pollution?'void':e.type==='fireTouch'?'touch':e.type==='quake'&&e.big?'greatStomp':e.type==='ignite'&&e.spread?'flameSpread':IMPACTS[e.type];if(kind&&Number.isFinite(e.x)&&Number.isFinite(e.y)){this.items.push({...e,kind,seed:noise(e.x+e.y)*TAU,t:0,life:kind==='goldShrapnel'?AshHeavyImpactFX.life.kick:kind==='goldFissure'?(e.rockRiftLength?AshEarthBloodFX.life.aftershock:AshHeavyImpactFX.life.twin):kind==='greatStomp'?AshEarthBloodFX.life.greatStomp:kind==='stone'?AshEarthBloodFX.life.stone:kind==='airPressure'?AshHeavyImpactFX.life.pressure:kind==='smallRecoil'?AshHeavyImpactFX.life.smallRecoil:kind==='bladeShock'?AshOverkillBladeShockFX.life.bladeShock:kind==='overkillRupture'?AshOverkillBladeShockFX.life.overkill:kind==='projectileFire'?AshProjectileImpactFX.life:kind==='poisonFlame'?.9:kind==='serumReaction'?1.05:kind==='flameSpread'?.85:kind==='heavyRecoil'?1.55:kind==='frictionHeat'?.9:kind==='bull'?.85:kind==='bounty'?.78:kind==='probe'?(e.heavy?.55:.36):['meteor','acidBlood','iceArmor'].includes(kind)?1.05:kind==='touch'?.45:.7,radius:kind==='bull'?320:kind==='bounty'?140*(e.scale||1):e.radius||(kind==='overkillRupture'?210:kind==='iceArmor'?180:kind==='acidBlood'?135:90)});}
      if(e.type==='ghostHand')this.items.push({...e,kind:'hand',t:0,life:.95,radius:70});
      if(e.type==='lightningRod'&&e.points?.length)this.items.push({...e,kind:'bolt',t:0,life:.48});
      if(this.items.length>90)this.items.splice(0,this.items.length-90);
    }
    update(dt){for(const e of this.items)e.t+=dt;this.items=this.items.filter(e=>e.t<e.life);}
    draw(c,camera){for(const e of this.items){const q=e.t/e.life,x=e.x-camera,y=e.y;if(e.kind!=='bolt'&&(x<-Math.max(e.radius||100,e.rockRiftLength||0)-100||x>c.canvas.width+Math.max(e.radius||100,e.rockRiftLength||0)+100))continue;if(e.kind==='goldShrapnel'){AshHeavyImpactFX.kick(c,e,camera);continue;}if(e.kind==='goldFissure'){if(e.rockRiftLength)AshEarthBloodFX.aftershock(c,{...e,length:e.rockRiftLength},camera);else AshHeavyImpactFX.twin(c,e,camera);continue;}if(e.kind==='greatStomp'){AshEarthBloodFX.greatStomp(c,e,camera);continue;}if(e.kind==='stone'){AshEarthBloodFX.stone(c,e,camera);continue;}if(e.kind==='airPressure'){AshHeavyImpactFX.pressure(c,e,camera);continue;}if(e.kind==='smallRecoil'){AshHeavyImpactFX.smallRecoil(c,e,camera);continue;}if(e.kind==='bladeShock'){if(e.stacks>0)AshHeavyImpactFX.resonance(c,e,camera);else AshOverkillBladeShockFX.bladeShock(c,e,camera);continue;}if(e.kind==='overkillRupture'){AshOverkillBladeShockFX.overkill(c,e,camera);continue;}if(e.kind==='projectileFire'){AshProjectileImpactFX.draw(c,e,camera);continue;}if(e.kind==='heavyRecoil'){AshCombatFX.heavyRecoilImpact(c,e,camera);continue;}if(e.kind==='frictionHeat'){AshCombatFX.frictionHeatBurst(c,e,camera);continue;}if(e.kind==='poisonFlame'){AshFireFamiliesFX.poisonBurst(c,{...e,x,y});continue;}if(e.kind==='serumReaction'){AshFireFamiliesFX.serumBurst(c,{...e,x,y});continue;}if(e.kind==='flameSpread'){AshFireFamiliesFX.flameSpread(c,{...e,x,y,density:e.type==='ignite'?1:.65});continue;}if(e.kind==='bull'){AshCombatFX.bullImpact(c,e,camera);continue;}if(e.kind==='acidBlood'){AshCombatFX.acidBloodImpact(c,e,camera);continue;}if(e.kind==='iceArmor'){AshCombatFX.iceArmorBreak(c,e,camera);continue;}if(e.kind==='touch'){AshCombatFX.touchIgnition(c,e,camera);continue;}if(e.kind==='wound'){AshCombatFX.woundImpact(c,e,camera);continue;}if(e.kind==='bounty'){AshCombatFX.bountyImpact(c,e,camera);continue;}c.save();
      if(e.kind==='probe'){AshCombatFX.probeBreak(c,e,camera);c.restore();continue;}
      if(e.kind==='hand'){hand(c,x,y,.75*Math.sin(q*Math.PI),e.t);c.restore();continue;}
      if(e.kind==='burst'){c.globalCompositeOperation='lighter';for(let i=0;i<3;i++){c.globalAlpha=(1-q)*(.6-i*.13);c.beginPath();c.ellipse(x,y-20,e.radius*q*(1-i*.16),e.radius*q*.38*(1-i*.16),0,0,TAU);c.strokeStyle=i?'#e2ca8e':'#d4f4e3';c.lineWidth=(1-q)*(6-i);c.stroke();}for(let i=0;i<30;i++){const a=i*TAU/30,r=e.radius*q;stroke(c,[[x+Math.cos(a)*r*.8,y-20+Math.sin(a)*r*.38*.8],[x+Math.cos(a)*r,y-20+Math.sin(a)*r*.38]],'#e4efdb',1.5*(1-q));}c.restore();continue;}
      if(e.kind==='shield'){c.translate(x,y-48);c.scale(e.face||1,1);c.globalCompositeOperation='lighter';c.globalAlpha=1-q;for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,33+i*5+q*12,48+i*5,0,-1.1,1.1);c.strokeStyle=i?'#83b8da':'#e0f5ff';c.lineWidth=i?1.2:3;c.stroke();}glow(c,35,0,24,'#d0f1ff66');c.restore();continue;}
      if(e.kind==='bolt'){c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)*(.65+.35*Math.cos(q*25)**2);const points=e.points;bolt(c,[points[0].x-camera-35,points[0].y-370],[points[0].x-camera,points[0].y],e.t*40,3.2);for(let i=1;i<points.length;i++)bolt(c,[points[i-1].x-camera,points[i-1].y],[points[i].x-camera,points[i].y],i+Math.floor(e.t*30),2.5);for(const p of points)glow(c,p.x-camera,p.y,58,'#75cfff88');c.restore();continue;}
      const r=e.radius,spread=Math.sin(clamp(q*1.7)*Math.PI*.5),colors={stone:'#d7c29c',kick:'#ffdb8e',blood:'#e46e77',fire:'#ff963b',meteor:'#ffb354',poison:'#a4db6c',ice:'#b6efff',holy:'#f8e4a6',void:'#bd9eeb'},color=e.color||colors[e.kind];
      if(e.kind==='holy')AshCombatFX.holy(c,x,y,r,q,e.color||'#f8e4a6');
      c.globalAlpha=(1-q)*.55;oval(c,x,y,r*spread,r*.32*spread,color);c.globalAlpha=1;
      if(e.kind==='stone'||e.kind==='meteor'||e.kind==='kick'){
        for(let i=0;i<13;i++){const a=i*TAU/13,n=noise(i+e.x),end=r*(.5+n*.5)*spread;const pts=[[x,y],[x+Math.cos(a+.1)*end*.45,y+Math.sin(a+.1)*end*.15],[x+Math.cos(a)*end,y+Math.sin(a)*end*.32]];c.globalAlpha=(1-q)*.65;stroke(c,pts,'#10191c',4);stroke(c,pts,color,1);}
      }
      c.globalCompositeOperation='lighter';c.globalAlpha=1-q;if(e.kind==='kick'){glow(c,x,y-25,r*.7,'#fff0bfaa');for(let i=0;i<8;i++){const a=i*TAU/8;stroke(c,[[x,y-25],[x+Math.cos(a)*r*spread,y-25+Math.sin(a)*r*.6*spread]],'#fff6ce',3*(1-q));}}glow(c,x,y-20,r*.6,color+'44');
      for(let i=0;i<22;i++){const a=i*2.399,n=noise(i+e.x),d=r*(.24+n*.76)*spread,xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.32-Math.sin(q*Math.PI)*(12+n*42);
        if(e.kind==='fire'||e.kind==='meteor'||e.kind==='kick'){if(i<15)flame(c,xx,yy,(20+n*65)*(1-q),i,e.t,color);}
        else if(e.kind==='holy'){glow(c,xx,yy,5+n*7,color+'88');stroke(c,[[xx,yy+3],[xx,yy-8-n*12]],i%3?color:'#fff9e8',1+n);}
        else if(e.kind==='ice'){c.beginPath();c.moveTo(xx,yy-22*(1-q));c.lineTo(xx+5,yy);c.lineTo(xx,yy+8);c.lineTo(xx-4,yy);c.closePath();c.fillStyle=i%2?'#eafcff':color;c.fill();}
        else if(e.kind==='blood'){stroke(c,[[xx-Math.cos(a)*15,yy+5],[xx,yy],[xx+Math.cos(a)*9,yy-3]],color,2+3*n);}
        else if(e.kind==='poison'){glow(c,xx,yy-8,13+n*17,'#9ecb6877');oval(c,xx,yy,2+n*3,3+n*4,'#d8ef9c');}
        else{c.save();c.translate(xx,yy);c.rotate(a+q*4);c.fillStyle=i%3?color:'#f9e9cc';c.fillRect(-3,-2,4+n*5,2+n*4);c.restore();}
      }
      for(let i=0;i<3;i++)ribbon(c,x,y+2,r*spread,TAU*i/3+q*.8,color,(1-q)*.7,.32);c.restore();
    }}
  }
  function lightningMarks(c,enemies,time,camera,rank){
    let visibleMarks=0;for(const e of enemies)if(!e.dead&&e.lightningMark&&e.x-camera>-100&&e.x-camera<c.canvas.width+100)visibleMarks++;const crowded=visibleMarks>24;
    for(const e of enemies){if(e.dead||!e.lightningMark)continue;const x=e.x-camera,y=e.y-(e.z||0)-60*(e.scale||1);if(x<-100||x>c.canvas.width+100)continue;const age=time-(e.lightningMark.time??time),ready=e.lightningMark.ready||age>=[0,.85,.7,.22][rank||1];c.save();c.globalCompositeOperation='lighter';const pulse=.75+.25*Math.sin(time*12);glow(c,x,y,ready?58:40,ready?'#45aaff77':'#448aca44');
      // A split thunder scar remains attached to the body, surrounded by crawling arcs.
      const scar=[[x+10,y-29],[x-7,y-6],[x+5,y-6],[x-12,y+27],[x+10,y+1],[x-2,y+1],[x+10,y-29]];stroke(c,scar,'#448dff',6);stroke(c,scar,ready?'#f0ffff':'#a6d9ff',2.1);
      for(let i=0;i<(crowded?(ready?2:1):(ready?5:3));i++){const a=time*(i%2?2:-2)+i*TAU/5,r=28+i%2*10;c.globalAlpha=pulse*.7;bolt(c,[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a+.8)*r,y+Math.sin(a+.8)*r],Math.floor(time*12)+i,.65);}c.restore();
    }
  }
  function vortex(c,x,y,r,time,black=false){
    if(!AshCombatFX.visible(c,x,y-(black?0:80),r+80,black?r*.4+20:180))return;
    c.save();if(black){oval(c,x,y,r*.69,r*.24,'#100d1be6');glow(c,x,y,r*.6,'#6942a855');}
    if(!black){const g=c.createLinearGradient(x-60,y-155,x+60,y);g.addColorStop(0,'#b9d6d20c');g.addColorStop(.45,'#72969742');g.addColorStop(1,'#d9e9dc08');c.beginPath();c.moveTo(x-13,y);c.bezierCurveTo(x-38,y-52,x-32,y-101,x-75,y-154);c.quadraticCurveTo(x,y-183,x+77,y-150);c.bezierCurveTo(x+35,y-101,x+40,y-52,x+13,y);c.closePath();c.fillStyle=g;c.fill();glow(c,x,y,55,'#a8b9a32a');}
    c.globalCompositeOperation='lighter';
    for(let band=0;band<(black?9:14);band++){const k=band/(black?9:14),rr=black?r*(.23+k*.77):r*(.20+k*.65),yy=black?y:y-12-k*142;
      ribbon(c,x+Math.sin(time*2+k*4)*(black?0:7),yy,rr,-time*(black?2.5:5)+band*.8,black?'#a085de':'#a9cbd0',black?.28:.18+k*.2,black?.32:.22);
    }
    for(let i=0;i<32;i++){const q=(time*(black?.38:.6)+i/32)%1,a=i*2.399+time*4,rr=black?r*(1-q):r*(.2+q*.55),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.27-(black?0:q*155);stroke(c,[[xx,yy],[xx-Math.sin(a)*9,yy+Math.cos(a)*3]],black?'#d4b5f3':'#e1eeeb',1.3);}
    c.restore();if(black){oval(c,x,y,r*.24,r*.10,'#05050bee');}
  }
  function pages(c,f,camera,time){if(f.x-camera+f.radius+20<0||f.x-camera-f.radius-20>c.canvas.width)return;for(let i=0;i<28;i++){const a=time*(1.8+i*.011)+i*2.399,r=f.radius*(.25+(i%7)/10),x=f.x-camera+Math.cos(a)*r,y=f.y+Math.sin(a)*r*.32-25-i%4*14;AshCombatFX.page(c,x,y,Math.sin(a)*.7,6+Math.abs(Math.cos(a))*5);}}
  function hand(c,x,y,grip,time){
    c.save();oval(c,x,y,53,17,'#160f26bb');glow(c,x,y-24,65,'#ad78d433');c.translate(x,y+12);c.scale(1,Math.max(.05,grip));
    const skin=c.createLinearGradient(-25,0,25,-90);skin.addColorStop(0,'#30223f');skin.addColorStop(.5,'#80618c');skin.addColorStop(1,'#c0a1c8');
    c.beginPath();c.moveTo(-15,0);c.bezierCurveTo(-21,-23,-28,-36,-22,-53);c.bezierCurveTo(-15,-70,16,-74,23,-52);c.bezierCurveTo(29,-35,13,-17,14,0);c.closePath();c.fillStyle=skin;c.fill();
    for(let i=0;i<5;i++){const base=-20+i*10,length=i===0?28:47-Math.abs(i-2)*7,tip=base+(i-2)*(10-grip*6),bend=-70-length;
      c.beginPath();c.moveTo(base,-48);c.bezierCurveTo(base+(i-2)*8,-72,tip,bend,tip-4*grip,bend+19*grip);c.strokeStyle='#a88bab';c.lineWidth=i===0?9:7;c.lineCap='round';c.stroke();
      c.beginPath();c.moveTo(base+2,-51);c.bezierCurveTo(base+(i-2)*8+2,-72,tip+2,bend+4,tip-4*grip+2,bend+19*grip);c.strokeStyle='#e0c6d0';c.lineWidth=1.3;c.stroke();
      stroke(c,[[tip-4*grip,bend+19*grip],[tip-6*grip,bend+27*grip]],'#342438',3);
    }
    stroke(c,[[-11,-48],[-4,-42],[7,-46],[14,-55]],'#342337',2);stroke(c,[[-5,-9],[1,-24],[-3,-35]],'#bc95bd',1.4);c.restore();
  }
  function pollutionField(c,z,camera,time){
    const x=z.x-camera,y=z.y,r=z.radius;if(x+r<-40||x-r>c.canvas.width+40)return;
    c.save();c.globalAlpha=Math.min(1,z.remaining/.65);oval(c,x,y,r,r*.32,'#1d173de0');
    c.globalCompositeOperation='lighter';
    // Iridescent ripples, a broken rim and rising motes replace the fire sprites.
    for(let layer=0;layer<3;layer++){
      const phase=(time*.28+layer/3)%1,rr=r*(.3+.7*phase);
      c.globalAlpha=Math.min(1,z.remaining/.65)*(1-phase)*.48;
      oval(c,x,y,rr,rr*.32,layer%2?'#87e1c52b':'#ac6bf43b');
      c.strokeStyle=layer%2?'#87e1c5':'#ac6bf4';c.lineWidth=1.4;c.stroke();
    }
    c.globalAlpha=Math.min(1,z.remaining/.65)*.85;
    for(let i=0;i<24;i++){
      const a=i*2.399+Math.sin(time*.4+i)*.08,d=r*Math.sqrt(noise(i+z.x));
      const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.32;
      const rise=(time*.3+noise(i+11))%1;
      glow(c,xx,yy-rise*42,3+Math.sin(time*2+i),i%2?'#b777ee88':'#7be4c788');
      if(i<12)stroke(c,[[xx-7,yy],[xx,yy-3],[xx+8,yy+1]],i%2?'#b786ee99':'#79e3ca77',1.2);
    }
    c.restore();
  }
  function fireField(c,z,camera,time,iceFlame=false){const x=z.x-camera,y=z.y,r=z.radius,cold=!!z.touchTrail&&iceFlame;if(x+r<-40||x-r>c.canvas.width+40)return;c.save();if(z.touchTrail)c.globalAlpha=.45*Math.max(0,Math.min(1,z.life/(z.maxLife||2.3)));oval(c,x,y,r,r*.32,cold?'#1c354988':'#47271988');c.globalCompositeOperation='lighter';for(let i=0;i<(z.dragonStrip?6:z.touchTrail?8:16);i++){const a=i*2.399,d=r*Math.sqrt(noise(i+z.x));const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.32;flame(c,xx,yy,(17+noise(i+4)*31)*(z.touchTrail?.62:1),i,time,cold?'#8bdcff':'#e87932');if(i%3===0)glow(c,xx,yy,24,cold?'#73caff33':'#ed833c33');}c.restore();}
  function dragonShadow(c,x,y,time,dir){
    c.save();c.translate(x,y);c.scale(dir*2.2,.68);c.fillStyle='#080d14bb';c.strokeStyle='#d6a36044';c.lineWidth=1.3;
    c.beginPath();c.moveTo(-154,24);c.bezierCurveTo(-96,-13,-60,32,-22,-8);c.quadraticCurveTo(-11,-27,13,-18);c.lineTo(47,-10);c.lineTo(64,2);c.lineTo(37,11);c.quadraticCurveTo(15,31,-17,17);c.bezierCurveTo(-65,47,-107,1,-154,24);c.closePath();c.fill();c.stroke();
    for(const side of [-1,1]){const flap=Math.sin(time*9)*12;
      c.beginPath();c.moveTo(-21,side*8);c.bezierCurveTo(-46,side*48,-71,side*(88+flap),-98,side*(103+flap));c.quadraticCurveTo(-94,side*49,-57,side*50);c.quadraticCurveTo(-55,side*20,-25,side*29);c.lineTo(-7,side*9);c.closePath();c.fill();c.stroke();
      stroke(c,[[-17,side*10],[-44,side*37],[-98,side*(103+flap)]],'#3b302744',2);
      stroke(c,[[4,side*14],[-7,side*37],[9,side*45],[19,side*41]],'#080d14bb',7);
      stroke(c,[[14,side*14],[1,side*32],[-10,side*38]],'#080d14bb',6);
    }
    stroke(c,[[10,-15],[0,-33],[-12,-39]],'#080d14cc',6);stroke(c,[[20,-13],[15,-32],[23,-40]],'#080d14cc',5);c.restore();
  }
  function dragonGround(c,state,camera,width,time){
    if(!state)return;const m=state.pending;
    const burn=(x1,x2,y,life=4,blue=false)=>{const start=Math.max(x1,camera-50),end=Math.min(x2,camera+width+50);if(end<=start)return;c.save();c.globalAlpha=Math.min(1,life);c.fillStyle='#351f1b80';c.fillRect(start-camera,y-42,end-start,84);c.globalCompositeOperation='lighter';
      for(let wx=Math.floor(start/38)*38;wx<end;wx+=38){if(wx<x1||wx>x2)continue;for(let row=0;row<3;row++){const seed=wx+row*117,yy=y-32+row*27+noise(seed)*24,h=24+noise(seed+8)*44,xx=wx-camera+noise(seed+12)*26-13;flame(c,xx,yy,h,seed,time,blue?(row%2?'#75d5ff':'#247fe2'):(row%2?'#ee963e':'#ce602a'));}if(wx%3===0)glow(c,wx-camera,y,45,'#f0853233');}c.restore();};
    for(const z of state.zones||[])burn(z.x1,z.x2,z.y,z.life,z.blue);
    if(!m)return;
    if(m.phase==='warn'){const q=clamp(1-m.t/.8),x=m.dir>0?m.x1+(m.x2-m.x1)*q:m.x2-(m.x2-m.x1)*q;dragonShadow(c,x-camera,m.y,time,m.dir);}
    else{const q=clamp(1-m.t/m.total),x=m.dir>0?m.x1+(m.x2-m.x1)*q:m.x2-(m.x2-m.x1)*q;burn(m.dir>0?m.x1:x,m.dir>0?x:m.x2,m.y,4,m.blue);c.save();c.globalCompositeOperation='lighter';glow(c,x-camera,m.y-18,105,'#ffce7b66');c.globalAlpha=.65;for(let i=0;i<9;i++)flame(c,x-camera+(noise(i)*52-26),m.y-55+i*13,45+noise(i+5)*50,i,time,m.blue?'#6fcfff':'#ffb65f');c.restore();}
  }
  function meteor(c,m,camera){const q=clamp(m.t/m.life),x=m.x-camera,y=m.y,fall=q*q; c.save();c.globalCompositeOperation='lighter';ribbon(c,x,y,m.radius,TAU*q,'#ffb668',.7,.32);const mx=x-190*(1-fall),my=y-470*(1-fall);for(let i=12;i>=0;i--){const k=i/12;glow(c,mx-k*96,my-k*185,14+k*22,`rgba(255,${115+Math.floor(k*60)},55,${.26*(1-k*.7)})`);}c.restore();c.save();c.translate(mx,my);c.rotate(q*3);c.fillStyle='#654735';c.beginPath();for(let i=0;i<9;i++){const a=i*TAU/9,r=14+noise(i)*8;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();for(let i=0;i<5;i++)stroke(c,[[Math.cos(i)*18,Math.sin(i)*18],[Math.cos(i+.8)*6,Math.sin(i+.8)*6],[0,0]],'#ffcc7b',2);c.restore();}
  function whirlwind(c,p,camera){const a=p.attack;if(p.state!=='heavy'||!p.whirlwindRank||!a)return;const q=clamp((p.t-a.wind)/a.active);if(p.t<a.wind||p.t>a.wind+a.active+.08)return;const r=a.range*.95,phase=q*TAU*(a.whirlTurns||1),alpha=Math.sin(Math.PI*clamp(q))*.7+.2;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<3;i++)ribbon(c,p.x-camera,p.y-p.z-35+i*10,r-i*14,phase+i*TAU/3,'#b9f0e8',alpha*(1-i*.18),.32);for(let i=0;i<18;i++){const t=phase-i*.23,rr=r*(.72+i%3*.08);stroke(c,[[p.x-camera+Math.cos(t)*rr,p.y-p.z-25+Math.sin(t)*rr*.32],[p.x-camera+Math.cos(t+.12)*rr,p.y-p.z-25+Math.sin(t+.12)*rr*.32]],'#f6ffed',1.1);}c.restore();}
  return {Effects,floor,floorTiles,lightningMarks,vortex,pages,meteor,whirlwind,ribbon,flame,bolt,hand,fireField,pollutionField,dragonGround};
})();
const AshV16Art=(()=>{
  const TAU=Math.PI*2;
  const fearStarts=new WeakMap(),fearHeights={spider:80,crawler:80,quadruped:85,ghoul:124,aggregate:103,floater:121,tower:140,obelisk:140,statue:140};
  function line(c,pts,color,w=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function poly(c,pts,color){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function ellipse(c,x,y,a,b,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,a,b,0,0,TAU);c.fill();}
  function ring(c,x,y,r,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}
  function dragon(c,x,y,t,face=1){c.save();c.translate(x,y);c.scale(face,1);const flap=Math.sin(t*7)*13;
    // Batlike articulated wings, membranes, shoulders, hooked claws and a sinuous tail.
    line(c,[[-12,5],[-28,14],[-43,11],[-53,2],[-61,5]],'#703c39',7);
    for(const side of [-1,1]){const elbow=[-10,side*(18+flap*.45)],tip=[-40,side*(38+flap)];poly(c,[[2,0],elbow,tip,[-34,side*15],[-23,side*16],[-15,side*5]],side>0?'#b96347':'#87413f');line(c,[[2,0],elbow,tip],'#e09b6d',2);line(c,[elbow,[-34,side*15]],'#e4a675',1);line(c,[elbow,[-23,side*16]],'#d28763',1);}
    ellipse(c,0,3,17,10,'#ad5841');ellipse(c,5,6,11,5,'#e6a36b');ellipse(c,14,-4,9,12,'#b96446');poly(c,[[17,-11],[30,-5],[29,1],[16,3]],'#cc8050');poly(c,[[11,-13],[7,-24],[17,-15]],'#f3d5a3');poly(c,[[20,-11],[21,-22],[25,-9]],'#e0bd8b');line(c,[[23,-3],[32,-2]],'#713c38',2);ellipse(c,20,-8,2.1,1.4,'#fff1a2');
    for(let i=0;i<5;i++)poly(c,[[-17+i*6,-3],[-20+i*6,-12],[-11+i*6,-5]],'#e3ae76');
    for(const xx of [-9,8])line(c,[[xx,8],[xx-3,17],[xx+4,20]],'#c67f59',3);c.restore();
  }
  function holy(c,field,camera,time){const x=field.x-camera,y=field.y,r=field.radius;c.save();c.translate(x,y);c.scale(1,.30);c.globalCompositeOperation='lighter';c.globalAlpha=.6*Math.min(1,field.life||1);const color=field.burning?'#efbc78':'#d8ddac';for(const rr of [.53,.82,.88,1])ring(c,0,0,r*rr,color,1.5);
    for(let i=0;i<12;i++){const a=i*TAU/12,xx=Math.cos(a)*r*.95,yy=Math.sin(a)*r*.95;c.save();c.translate(xx,yy);c.rotate(a+Math.PI/2);line(c,[[-5,-7],[0,-12],[5,-7],[0,7],[-5,-7]],color,1.5);line(c,[[0,-9],[0,9]],color);c.restore();}
    for(let k=0;k<2;k++){const pts=[];for(let i=0;i<=3;i++){const a=i*TAU/3+k*Math.PI;pts.push([Math.cos(a)*r*.75,Math.sin(a)*r*.75]);}line(c,pts,color,1.2);}ring(c,0,0,r*.22,color,2);c.restore();
    c.save();c.globalCompositeOperation='lighter';for(let i=0;i<16;i++){const q=(time*.35+i*.618)%1,a=i*2.399,xx=x+Math.cos(a)*r*.72,yy=y+Math.sin(a)*r*.22-q*58;c.globalAlpha=Math.sin(q*Math.PI)*.65;line(c,[[xx-3,yy],[xx+3,yy]],'#e6f7be',1.7);line(c,[[xx,yy-3],[xx,yy+3]],'#e6f7be',1.7);}c.restore();
  }
  function aura(c,x,y,time,color,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.globalCompositeOperation='lighter';const grad=c.createLinearGradient(0,5,0,-145);grad.addColorStop(0,color+'05');grad.addColorStop(.45,color+'38');grad.addColorStop(1,color+'00');for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(-36-layer*6,3);for(let i=0;i<=16;i++){const a=Math.PI+i*Math.PI/16,xx=Math.cos(a)*(43+layer*7),yy=Math.sin(a)*(107+layer*14)-28;const spike=i%2?13+Math.sin(time*17+i*2)*9:0;c.lineTo(xx*(1+spike/60),yy-spike);}c.lineTo(36+layer*6,3);c.closePath();c.fillStyle=grad;c.fill();c.strokeStyle=color;c.globalAlpha=.28-layer*.06;c.lineWidth=1.6;c.stroke();}for(let i=0;i<22;i++){const q=(time*.9+i*.618)%1,xx=Math.sin(i*4.7)*(34+q*12),yy=-q*135;c.globalAlpha=Math.sin(q*Math.PI)*.8;line(c,[[xx,yy],[xx+Math.sin(time*8+i)*4,yy-12-q*14]],color,1+i%3*.4);}c.restore();}
  function marks(c,g,f,camera,time){
    const ids=new Set(f.v11.soulLinks.flatMap(l=>l.ids)),linked=g.enemies.filter(e=>!e.dead&&ids.has(e.id));c.save();
    // A faint chain connects neighbors; each member has its own unmistakable seal.
    for(let i=1;i<linked.length;i++){const a=linked[i-1],b=linked[i],dx=b.x-a.x,dy=b.y-a.y,n=Math.min(32,Math.ceil(Math.hypot(dx,dy)/15));c.globalAlpha=.10+.07*Math.sin(time*2+i);for(let j=0;j<n;j++){const q=(j+.5)/n,x=a.x+dx*q-camera,y=a.y+dy*q-50;c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));c.strokeStyle='#c38af0';c.lineWidth=1.3;c.beginPath();c.ellipse(0,0,6,2.7,0,0,TAU);c.stroke();c.restore();}}
    for(const e of g.enemies){if(e.dead||e.furnaceCapture)continue;const x=e.x-camera,y=e.y-(e.z||0),scale=e.scale||1;if(x<-180||x>c.canvas.width+180)continue;c.globalAlpha=1;
      if(e.starColourVulnerability){c.save();c.globalCompositeOperation='lighter';const yy=y-91*scale,a=time*.6;ring(c,x,yy,10,'#b580ed',1.5);line(c,[[x-9,yy],[x,yy-14],[x+9,yy],[x,yy+14],[x-9,yy]],'#85dfc9',1.4);ellipse(c,x+Math.cos(a)*13,yy+Math.sin(a)*8,2,2,'#cfacff');c.restore();}
      if(e.bloodNovaUntil>g.time){const yy=y-100*scale;poly(c,[[x,yy-12],[x+5,yy-3],[x+12,yy],[x+4,yy+5],[x,yy+12],[x-4,yy+4],[x-12,yy],[x-5,yy-3]],'#e98969');ellipse(c,x,yy,3,3,'#fff0b6');}
      if(e.sleepT>0){c.save();c.textAlign='center';for(let j=0;j<3;j++){const q=(time*.55+j/3)%1;c.globalAlpha=Math.sin(q*Math.PI);c.font=`bold ${14+q*9}px sans-serif`;c.fillStyle='#cee5ff';c.fillText('Z',x+12+q*24,y-80*scale-q*35);}c.restore();}
      if((e.fearT>0||e.permaFear)&&(!e.illusionFear||e.permaFear)){if(!fearStarts.has(e))fearStarts.set(e,time);const height=fearHeights[AshCombat.ENEMY_CATALOG.BY_ID[e.type]?.bodyPlan]||100;const drawFear=e.permaFear?AshCombatFX.permanentFear:AshCombatFX.fearCrown;drawFear(c,x,y-height*scale,time,scale,time-fearStarts.get(e));}else fearStarts.delete(e);
      if(e.effects?.illusion||(e.illusionFear&&(e.fearT>0||e.permaFear)))AshCombatFX.illusionCloud(c,x,y-90*scale,time,scale);
      const effects=e.effects||{};for(const [kind,col] of [[effects.iceFlame?'iceFlame':effects.burn?'burn':'tarBurn',effects.iceFlame?'#8bdcff':'#f78632'],['poisonFlame','#69ed8e']])if(effects[kind]){for(let j=0;j<(g.enemies.length>35?3:8);j++){const phase=(time*.85+j*.37)%1,xx=x+Math.sin(j*2.4)*19*scale,yy=y-8-j%3*16*scale;AshBattleArt.flame(c,xx,yy,22+phase*30,j,time,col);}}
      if(effects.bleed){c.strokeStyle='#a51f39';c.lineWidth=2.2;for(let j=0;j<4;j++){const xx=x-13+j*8,yy=y-65+j%2*13;line(c,[[xx,yy],[xx+3,yy+18]],'#dd5360',2);const q=(time*.8+j*.27)%1;ellipse(c,xx+3,yy+20+q*35,1.8,3.5,'#cf3549');}}
      if(effects.poison){for(let j=0;j<5;j++){const q=(time*.5+j*.23)%1;ellipse(c,x+Math.sin(j*3)*22,y-12-q*60,2+q*3,2+q*3,'#83b94a88');}}
      if(e.seal?.remaining>0){const yy=y-57*scale;for(let j=0;j<3;j++){const a=j*TAU/3+time*.25;line(c,[[x+Math.cos(a)*33,yy+Math.sin(a)*26],[x+Math.cos(a)*7,yy+Math.sin(a)*6]],'#b7cbec',4);}ring(c,x,yy,25,'#a397f4',2.6);}
      if(ids.has(e.id)){ring(c,x,y-66*scale,10,'#c88ce7',2);line(c,[[x-6,y-73*scale],[x,y-59*scale],[x+6,y-73*scale]],'#deb5fa',1.5);}
      if(e.id===f.v11.bountyId||e.weakBounty>g.time){const yy=y-99*scale;c.globalAlpha=e.id===f.v11.bountyId?.85:.45;ring(c,x,yy,12,'#ff615e',2);for(const sign of [-1,1]){line(c,[[x+sign*8,yy],[x+sign*18,yy]],'#ff9a86',2);line(c,[[x,yy+sign*8],[x,yy+sign*18]],'#ff9a86',2);}ellipse(c,x,yy,2,2,'#ffcfb0');}
      if(f.revenge.targetId===e.id&&f.revenge.remaining>0){const yy=y-125*scale;poly(c,[[x-10,yy-9],[x,yy-2],[x+10,yy-9],[x+6,yy+6],[x,yy+11],[x-6,yy+6]],'#df4f7f');line(c,[[x-5,yy],[x+5,yy]],'#ffe1e1',2);}
      if(e.probeStacks>0)AshCombatFX.probeRing(c,e,camera,time);
      if(e.armorRendT>0){const yy=y-49*scale;c.globalAlpha=.85;line(c,[[x-15,yy-16],[x-3,yy-20],[x-5,yy-3],[x-12,yy+7],[x-16,yy-8]],'#e6a266',2);line(c,[[x+3,yy-20],[x+15,yy-16],[x+16,yy-8],[x+9,yy+12],[x+4,yy-2]],'#e6a266',2);line(c,[[x+1,yy-16],[x-3,yy-7],[x+3,yy-2],[x-1,yy+7]],'#ffe4bb',2);}
      const heat=f.v11.heat.get(e.id);if(heat&&g.time-heat.t<3){const q=Math.min(1,heat.n/[0,8,7,6][f.rank('thousandFire')||1]);c.globalAlpha=q*.65;for(let j=0;j<7;j++){const xx=x+Math.sin(j*2.4)*23*scale;line(c,[[xx,y-20*scale],[xx+Math.sin(time*9+j)*7,y-45*scale],[xx-3,y-(56+q*25)*scale]],'#ff8b42',1+q*2);}ring(c,x,y-55*scale,28*scale,'#f7a45e',q*2+.5);}
      if(e.attack?.flags?.includes('selfDestruct')&&['windup','active'].includes(e.state)){aura(c,x,y,time,'#ff3428',scale);c.globalAlpha=.32+.2*Math.sin(time*28);ellipse(c,x,y-48*scale,25*scale,43*scale,'#ff3529');ring(c,x,y-48*scale,31*scale,'#ffc171',2);}
      if(e.tempoT>0){c.globalAlpha=.5;for(let j=0;j<3;j++){const yy=y-85-j*8-((time*20)%8);line(c,[[x-6,yy+4],[x,yy],[x+6,yy+4]],'#e6c485',1.5);}}
    }c.restore();
  }
  function followers(c,g,f,camera,time){const p=g.p,x=p.x-camera,y=p.y-p.z,s=f.v16;c.save();
    if(f.rank('thorns')){const crowned=f.pair('starBlessing','thorns')&&f.v12.star.invuln>0,pulse=.86+.14*Math.sin(time*4);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=crowned?.72*pulse:.28*pulse;for(let i=0;i<5;i++){const a=-Math.PI*.9+i*Math.PI*.45,xx=x+Math.cos(a)*31,yy=y-52+Math.sin(a)*38,dx=Math.cos(a),dy=Math.sin(a);poly(c,[[xx-dy*4,yy+dx*4],[xx+dx*(crowned?18:10),yy+dy*(crowned?18:10)],[xx+dy*4,yy-dx*4]],crowned?i%2?'#ffe3a0':'#d9f8ff':'#bd8c82');}c.restore();}
    if(f.rank('airSupport')){c.save();const diving=f.pair('diveBomb','airSupport')&&f.v12.dive.active;c.translate(x-(diving?20:68),y-(diving?48:120)+Math.sin(time*3)*5);if(diving)c.rotate(p.face*.45);const k=f.pair('elementAffinity','synergy')?1.2:1;c.scale(k,k);dragon(c,0,0,time,p.face);c.restore();}
    if(f.rank('furnace')){const xx=x-48,yy=y-42+Math.sin(time*2)*4;c.save();c.translate(xx,yy);ellipse(c,0,2,17,15,'#775b4c');ellipse(c,0,0,12,10,'#a6805e');ellipse(c,0,-11,19,5,'#af9468');ellipse(c,0,-12,12,3,'#251d23');line(c,[[-12,11],[-15,21]],'#a48d67',4);line(c,[[12,11],[15,21]],'#a48d67',4);for(const xx of [-21,21]){ring(c,xx,-1,5,'#b29972',3);}for(let i=0;i<3;i++){line(c,[[-7+i*7,-3],[-9+i*7,4],[-5+i*7,7]],'#f3bb73',1.5);}c.globalAlpha=.6;for(let i=0;i<5;i++){const q=(time*.4+i*.2)%1;ellipse(c,Math.sin(time+i)*8,-15-q*23,1.2,2.5,'#ffc78c');}c.restore();}
    for(const q of s.shots){const xx=q.x-camera,yy=q.y;line(c,[[xx-(q.x-q.startX)*.10,yy-(q.y-q.startY)*.10],[xx,yy]],'#db7544',8);ellipse(c,xx,yy,8,6,'#ffe3a3');ring(c,xx,yy,12,'#f5a45c',1);}
    if(s.dragonBreath){const b=s.dragonBreath;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<28;i++){const q=(i/28+time*1.7)%1,xx=x-68+b.face*q*310,yy=y-106+q*85+Math.sin(i*2.4+time*8)*q*45;AshBattleArt.flame(c,xx,yy,22+q*26,i,time,'#ffa040');}c.restore();}
    if(s.windVisual){const w=s.windVisual;c.globalAlpha=w.life/.35;line(c,[[w.x-camera,w.y-40],[w.x-camera+w.face*w.length,w.y-40]],'#a4e9e7',8);line(c,[[w.x-camera,w.y-43],[w.x-camera+w.face*w.length,w.y-41]],'#f3ffff',2);}
    AshCombatFX.executionParticles(c,x,y,time,f.executioner.stacks,f.executioner.remaining,p.visualScale||1);
    if(p.ultimateForm>0)aura(c,x,y,time,'#ffd15e',p.visualScale||1);
    if(f.rank('bloodthirst')&&f.dualState.immortalBlood>0){aura(c,x,y,time,'#a71836',p.visualScale||1);AshCombatFX.deadDoorFlames(c,x,y,time,p.visualScale||1);}else if(!(p.ultimateForm>0)&&f.rank('bloodthirst')&&(p.hp+p.grayHp)/p.maxHp<.5)aura(c,x,y,time,'#f34f65',p.visualScale||1);
    const star=f.v12.star;if(star.invuln>0||star.channel>0){c.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const a=time*.8+i*TAU/7,xx=x+Math.cos(a)*39,yy=y-53+Math.sin(a)*55;c.globalAlpha=.75;poly(c,[[xx,yy-7],[xx+2,yy-2],[xx+7,yy],[xx+2,yy+2],[xx,yy+7],[xx-2,yy+2],[xx-7,yy],[xx-2,yy-2]],'#e8efff');}c.globalAlpha=.35;line(c,[[x-35,y-84],[x,y-113],[x+35,y-84],[x+29,y-24],[x,y-6],[x-29,y-24],[x-35,y-84]],'#9bbaf4',2);}
c.restore();
  }
  return {dragon,holy,aura,marks,followers};
})();
/* Canvas presentation, synthesized audio, keyboard input. */
function initializeGame(){
  'use strict';
  if(!document.getElementById('game')||globalThis.AshGame)return;
  getSurvival();
  // Ending presentation styles travel with the game entry point.
  if(!document.getElementById('victory-cg-styles')){
    const style=document.createElement('style');style.id='victory-cg-styles';
    style.textContent=`
@keyframes cgReveal{from{opacity:0;transform:translateY(10px);filter:brightness(.55)}to{opacity:1;transform:none;filter:brightness(1)}}
.victory-cg{position:absolute;inset:3% 4%;display:flex;flex-direction:column;gap:12px;z-index:2}
.victory-cg-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr) minmax(0,1fr);gap:12px;flex:1;min-height:0}
.victory-cg-grid canvas{width:100%;height:100%;min-width:0;min-height:0;border:1px solid #79675666;background:#0b1116;box-shadow:0 8px 28px #0005;opacity:0;animation:cgReveal 1.1s cubic-bezier(.2,.8,.2,1) both}
.victory-cg-grid canvas:nth-child(1){animation-delay:.05s}.victory-cg-grid canvas:nth-child(2){animation-delay:2.3s}.victory-cg-grid canvas:nth-child(3){animation-delay:4.6s}.victory-cg-grid canvas:nth-child(4){animation-delay:7s}
.victory-cg.rush .victory-cg-grid canvas{border-color:#8c697566}
.end-screen-cg{background:radial-gradient(ellipse at 65% 50%,#211825,#090d15 75%);backdrop-filter:none}
.end-screen-cg #end-panel{opacity:0;pointer-events:none;transform:translateY(18px);transition:opacity .55s,transform .55s}
.end-screen-cg.cg-finished #victory-cg{opacity:.45;filter:brightness(.7);transition:opacity .9s,filter .9s}
.end-screen-cg.cg-finished #end-panel{opacity:1;pointer-events:auto;transform:none;z-index:3;background:linear-gradient(145deg,#14151df5,#090f17f2);border:1px solid #8c705855;box-shadow:0 20px 90px #000b;padding:28px 48px}
.end-screen-cg.cg-skipped .victory-cg-grid canvas{animation:none;opacity:1;transform:none;filter:brightness(1)}
.end-screen-cg.cg-skipped #end-panel,.end-screen-cg.cg-skipped #victory-cg{transition:none}
@media(max-width:650px){.victory-cg{inset:3%;gap:6px}.victory-cg-grid{gap:5px}.end-screen-cg.cg-finished #end-panel{padding:15px 24px}}
@media(prefers-reduced-motion:reduce){.victory-cg-grid canvas{animation-duration:.01s}.end-screen-cg #end-panel,.end-screen-cg.cg-finished #victory-cg{transition:none}}
`;
    document.head.appendChild(style);
  }
  const {Game,TYPES,MOVES,CHAPTERS,GUARD,isBoss,clamp}=AshCombat;
  const art=new AshBattleArt.Effects();
  const {Run}=AshSurvival;const rig=new AshMotion.Rig();
  let run=null,selectedArena=0,codexReturn='title',lightningFX=[],meteorFX=[],luckSpearFX=[],dissolveFX=[],bladeRingFX=[],bellWaveFX=[],bellAnchorX=720,diveBombFX=[],phantomRushFX=[],timeSealDevourFX=[],postureShatterFX=[],windSpiralFX=[],guillotineFX=[],corpseBombFX=[],cocoonBurstFX=[],dualFX=[],lastThornBurstFX=-Infinity;
  const canvas=document.getElementById('game');let ctx=canvas.getContext('2d');const seamCanvas=document.createElement('canvas');seamCanvas.width=1440;seamCanvas.height=810;const seamContext=seamCanvas.getContext('2d');
  const $=id=>document.getElementById(id);
  const W=1440,H=810,TAU=Math.PI*2;
  let game=new Game(),mode='title',camera=0,realTime=0,last=performance.now(),accumulator=0;
  let shake=0,screenFlash=0,executeFlash=0,killInk=0,chapterTime=0,banner='',bannerSub='',bannerTimer=0;
  let mute=false,audioContext=null,soundGain=null,particles=[],rings=[],slashes=[],bloodXFX=[],serumBurstFX=[],texts=[],ghosts=[],pressed={},keys={};
  let musicVolume=.2;
  try{const saved=localStorage.getItem('ashen-music-volume');if(saved!==null&&Number.isFinite(Number(saved)))musicVolume=clamp(Number(saved),0,1);}catch(error){/* Storage is optional. */}
  const music=new AshMusic.BattleMusic({volume:musicVolume,onTransition:()=>sound('bellEcho')});
  function updateMusicVolume(){
    const percent=Math.round(music.volume*100);
    $('music-volume').value=percent;$('music-volume-value').textContent=percent+'%';
    $('music-volume').setAttribute('aria-valuetext',percent+'%');
  }
  updateMusicVolume();
  function setMusic(){
    music.setEnabled(!music.enabled);
    $('music-toggle').innerHTML=`音乐 <span>${music.enabled?'开':'关'}</span>`;
    $('music-toggle').setAttribute('aria-pressed',String(music.enabled));
    if(music.enabled)startAudio();
  }
  $('music-toggle').onclick=setMusic;
  $('music-volume').oninput=()=>{
    music.setVolume(Number($('music-volume').value)/100);updateMusicVolume();
    try{localStorage.setItem('ashen-music-volume',String(music.volume));}catch(error){/* Storage is optional. */}
  };
  function updateBattleMusic(dt){
    const battleModes=['playing','upgrade','upgradeReward'];
    const musicMode=mode==='codex'?codexReturn:mode;
    const inBattle=battleModes.includes(musicMode);
    if(['title','dead','victory','enemyReview'].includes(mode))music.stop();
    else music.setRunning(inBattle&&!document.hidden);
    // BOSS RUSH keeps the boss track even between bosses and during upgrades.
    let enemyCount=0,boss=!!run?.challenge;
    if(inBattle)for(const e of game.enemies){
      if(e.dead||e.dummy||e.bossProxy)continue;
      // A living boss locks high music throughout its entrance and across the arena.
      if(isBoss(e))boss=true;
      if(e.spawnDelay||e.furnaceCapture||e.sacrificial||e.mindControlT>0||Math.abs(e.x-game.p.x)>1800)continue;
      enemyCount++;
    }
    music.update(dt,{enemyCount,boss});
  }
  const enemyVisualCache=new Map();
  let ghostTimer=0,slowTime=0,finished=false,reviveCinematic=null;
  let flowTrailFX=[],flowTrailTimer=0,visualFrame=null,visualCounts=new Map();
  function visualScene(){if(!visualFrame||visualFrame.game!==game||visualFrame.time!==game.time||visualFrame.count!==game.enemies.length){const byId=new Map();let visibleCount=0;for(const e of game.enemies)if(!e.dead){byId.set(e.id,e);if(e.x-camera>-180&&e.x-camera<W+180)visibleCount++;}visualFrame={game,time:game.time,count:game.enemies.length,byId,visibleCount,ghostVines:run?.dualRegistry.some(d=>run.duals[d.id]&&d.parents.includes('parasiticVines')&&d.parentNames.some(n=>/幽|鬼|影/.test(n)))};}return visualFrame;}
  const keyMap={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyJ:'j',KeyK:'k',KeyQ:'q',KeyL:'l',KeyR:'r',KeyE:'e',Space:'space',ShiftLeft:'shift',ShiftRight:'shift'};

  function sound(type) {
    if(mute||!audioContext)return;
    const ac=audioContext,t=ac.currentTime;
    const tone=(f,end,dur,gain,wave='sine',delay=0)=>{
      const o=ac.createOscillator(),g=ac.createGain();o.type=wave;o.frequency.setValueAtTime(f,t+delay);
      o.frequency.exponentialRampToValueAtTime(Math.max(15,end),t+delay+dur);
      g.gain.setValueAtTime(gain,t+delay);g.gain.exponentialRampToValueAtTime(.001,t+delay+dur);
      o.connect(g);g.connect(soundGain);o.start(t+delay);o.stop(t+delay+dur);
    };
    const noise=(dur,gain,freq)=>{
      const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*dur),ac.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      const s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=freq;
      g.gain.value=gain;s.connect(f);f.connect(g);g.connect(soundGain);s.start(t);
    };
    if(type==='swing'){noise(.12,.055,1700);tone(180,60,.12,.035,'triangle');}
    if(type==='heavy'){noise(.18,.14,550);tone(105,28,.24,.16,'triangle');}
    if(type==='hit'){noise(.07,.105,700);tone(155,42,.09,.12,'triangle');}
    if(type==='enchant'){tone(980,360,.18,.045,'sine');tone(1480,640,.14,.025,'triangle');noise(.04,.025,2600);}
    if(type==='parry'){tone(1250,520,.33,.075);tone(2450,1900,.22,.04,'sine',.01);noise(.04,.1,3200);tone(85,40,.13,.1);}
    if(type==='break'){tone(450,130,.4,.08,'sawtooth');noise(.23,.12,2000);}
    if(type==='dash'){noise(.17,.075,900);tone(300,90,.18,.035);}
    if(type==='jump')tone(140,330,.12,.025,'triangle');
    if(type==='warning')tone(820,1100,.065,.027,'sine');
    if(type==='hurt'){tone(90,25,.22,.16,'sawtooth');noise(.12,.09,500);}
    if(type==='execute'){tone(80,23,.55,.24,'triangle');noise(.35,.19,600);tone(1300,300,.5,.055,'sine',.05);}
    if(type==='chapter'){tone(330,330,1,.04);tone(440,440,.8,.03,'sine',.12);tone(660,660,1,.025,'sine',.24);}
    // Final-boss attack cues use the same safe audio path as every other event.
    // Keep the two bosses sonically distinct without leaking a nested `tone`
    // helper into the event processor.
    if(type==='finalAttackRanged'){tone(540,760,.11,.032,'sine');}
    if(type==='finalAttackMelee'){tone(190,125,.11,.032,'sawtooth');}
    if(type==='arrow')noise(.09,.035,3000);
    if(type==='burst'){tone(74,31,.34,.18,'triangle');tone(560,155,.28,.07,'sawtooth',.015);tone(1180,390,.23,.055,'sine',.025);noise(.22,.16,650);}
    if(type==='bell'||type==='bellEcho'){
      const soft=type==='bellEcho',gain=soft?.035:.075;
      tone(98,82,soft?1.4:2.4,gain,'sine');tone(196,174,soft?1.1:1.9,gain*.62,'sine',.008);
      tone(293,252,soft?.9:1.55,gain*.45,'triangle',.018);tone(417,361,soft?.72:1.25,gain*.26,'sine',.028);
      if(!soft)noise(.08,.025,2400);
    }
  }
  function startAudio(){
    try {if(!audioContext){audioContext=new(window.AudioContext||window.webkitAudioContext)();soundGain=audioContext.createGain();soundGain.gain.value=mute?0:1;soundGain.connect(audioContext.destination);}audioContext.resume();}catch(e){/* Audio optional. */}
    music.unlock();
  }
  function setSound(){mute=!mute;$('sound').innerHTML=`音效 <span>${mute?'关':'开'}</span>`;$('sound').setAttribute('aria-pressed',String(mute));if(soundGain)soundGain.gain.setValueAtTime(mute?0:1,audioContext.currentTime);if(!mute)startAudio();}
  function resetDrawingContext(){
    // resetTransform leaves saved clips, alpha and filters behind after a failed draw.
    ctx=canvas.getContext('2d');
    if(ctx.reset)ctx.reset();else canvas.width=canvas.width;
  }
  function showRuntimeError(error,phase){
    window.AshLastError={message:error.message,stack:error.stack,time:run?.time,phase,
      ascensions:{...run?.upgrades},duals:{...run?.duals},
      bosses:game?.enemies.filter(e=>isBoss(e)&&!e.dead).map(e=>({type:e.type,state:e.state,spawnDelay:e.spawnDelay,move:e.moveKey}))};
    let details=$('runtime-error');
    if(!details){
      details=document.createElement('details');details.id='runtime-error';
      const summary=document.createElement('summary');summary.textContent='异常详情（可复制反馈）';
      const report=document.createElement('textarea');report.readOnly=true;report.setAttribute('aria-label','异常详情');report.spellcheck=false;
      const copy=document.createElement('button');copy.type='button';copy.className='secondary';copy.textContent='复制全部';
      const status=document.createElement('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
      copy.onclick=async()=>{
        let copied=false;
        try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(report.value);copied=true;}}catch{/* Local files or browser permissions may block clipboard access. */}
        if(!copied){report.focus();report.select();try{copied=document.execCommand('copy');}catch{/* Keep the report selected for manual copying. */}}
        status.textContent=copied?'已复制':'已全选，请按 Ctrl+C 复制';
      };
      details.append(summary,copy,status,report);$('pause-screen').querySelector('.panel').append(details);
    }
    details.hidden=false;details.querySelector('textarea').value=JSON.stringify(window.AshLastError,null,2);details.querySelector('[role="status"]').textContent='';
  }
  function start(arena=selectedArena,challenge=false,training=false){
    clearTimeout(finish.cgTimer);
    selectedArena=clamp(arena,0,2);run=new Run({arena:selectedArena,challenge,training});game=run.game;
    resetDrawingContext();accumulator=0;delete window.AshLastError;if($('runtime-error'))$('runtime-error').hidden=true;mode='playing';finished=false;medusaGazeFX=[];particles=[];rings=[];slashes=[];bloodXFX=[];serumBurstFX=[];texts=[];ghosts=[];lightningFX=[];meteorFX=[];luckSpearFX=[];dissolveFX=[];bladeRingFX=[];bellWaveFX=[];diveBombFX=[];phantomRushFX=[];timeSealDevourFX=[];postureShatterFX=[];windSpiralFX=[];guillotineFX=[];corpseBombFX=[];cocoonBurstFX=[];dualFX=[];lastThornBurstFX=-Infinity;rig.clear();art.clear();$('end-screen').classList.remove('end-screen-cg','cg-finished','cg-skipped');$('victory-cg').classList.add('hidden');$('end-panel').style.removeProperty('opacity');
    pressed={};keys={};reviveCinematic=null;flowTrailFX=[];flowTrailTimer=0;visualFrame=null;visualCounts.clear();camera=Math.max(0,game.p.x-490);shake=screenFlash=executeFlash=killInk=0;
    for(const id of ['title-screen','pause-screen','end-screen','upgrade-screen','codex-screen'])$(id).classList.add('hidden');
    $('pause').classList.remove('hidden');canvas.focus();music.start(run.challenge?2:0);startAudio();processEvents();updateMasthead();
  }
  function updateMasthead(){
    const c=CHAPTERS[selectedArena];
    document.querySelector('.chapter').innerHTML=`<b>0${selectedArena+1}</b><span>${c.name}</span><em>${c.en}</em>`;
    $('arena-name').textContent=c.name.replace(' · ','');
    document.querySelectorAll('[data-arena]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.arena)===selectedArena));
  }
  function pause(){
    if(mode==='playing'){mode='paused';music.setRunning(false);$('pause-screen').classList.remove('hidden');keys={};pressed={};}
    else if(mode==='paused'){mode='playing';music.setRunning(true);startAudio();$('pause-screen').classList.add('hidden');canvas.focus();}
  }
  function returnTitle(){
    clearTimeout(finish.cgTimer);
    mode='title';keys={};pressed={};rig.clear();
    for(const id of ['pause-screen','end-screen','upgrade-screen','codex-screen','pause'])$(id).classList.add('hidden');
    $('end-screen').classList.remove('end-screen-cg','cg-finished','cg-skipped');$('victory-cg').classList.add('hidden');$('title-screen').classList.remove('hidden');updateMasthead();
  }
  function drawVictoryCG(rush=false){
    if(finish.cgPainted&&realTime-(finish.cgLastPaint??-Infinity)<1/24)return;
    const elapsed=Math.max(0,realTime-(finish.cgStart??realTime)),dawnTime=Math.min(5,Math.max(0,elapsed-7));
    document.querySelectorAll('#victory-cg canvas').forEach((canvas,index)=>{
      const rect=canvas.getBoundingClientRect(),density=Math.min(2,window.devicePixelRatio||1);
      const width=Math.max(1,Math.min(2240,Math.round(rect.width*density))),height=Math.max(1,Math.min(1200,Math.round(rect.height*density)));
      const resized=canvas.width!==width||canvas.height!==height;
      if(resized){canvas.width=width;canvas.height=height;}
      if(resized||!finish.cgPainted||index===3&&dawnTime!==finish.cgDawnTime)AshBossArt.cinematic(canvas.getContext('2d'),index,dawnTime);
    });
    finish.cgPainted=true;finish.cgLastPaint=realTime;finish.cgDawnTime=dawnTime;
  }
  function completeVictoryCG(skip=false){
    if(mode!=='victory')return;
    clearTimeout(finish.cgTimer);
    const end=$('end-screen');
    if(skip){finish.cgStart=realTime-14.5;finish.cgPainted=false;drawVictoryCG(!!run.challenge);end.classList.add('cg-skipped');}
    end.classList.add('cg-finished');
  }
  function finish(victory){
    if(finished)return;finished=true;mode=victory?'victory':'dead';keys={};pressed={};
    $('end-eyebrow').textContent='';
    $('end-title').textContent=victory?'胜利':'战败';
    $('end-text').textContent='';
    $('end-stats').innerHTML=`<div><strong>${game.stats.kills}</strong>击败敌人</div><div><strong>${game.stats.parries}</strong>完美格挡</div><div><strong>${game.stats.executions}</strong>处决</div>`;
    $('retry').innerHTML='再次出战 <span>↗</span>';
    const end=$('end-screen'),cg=$('victory-cg');end.classList.remove('hidden','end-screen-cg','cg-finished','cg-skipped');cg.classList.add('hidden');cg.classList.toggle('rush',!!run.challenge);if(victory){end.classList.add('end-screen-cg');cg.classList.remove('hidden');finish.cgStart=realTime;finish.cgPainted=false;drawVictoryCG(!!run.challenge);clearTimeout(finish.cgTimer);finish.cgTimer=setTimeout(()=>completeVictoryCG(),14500);}else $('end-panel').style.removeProperty('opacity');$('pause').classList.add('hidden');
  }
  function showUpgrade(){
    mode='upgrade';keys={};pressed={};$('pause').classList.add('hidden');
    $('upgrade-screen').classList.remove('hidden');
    $('upgrade-choices').classList.toggle('training-choices',!!run.training);if(run.training){showTrainingChoices();return;}
    const bonus=run.currentBonusRerolls||0,rerolls=run.rerolls||0;
    $('upgrade-summary').textContent=`LV.${run.level} · 剩余 ${run.pendingLevels} 次擢升机会。`;
    const choices=$('upgrade-choices');choices.style.setProperty('--offer-count',Math.max(1,run.offers.length));
    choices.innerHTML=run.offers.map((o,i)=>{const owned=!!run.upgrades[o.id],dual=!!o.dual,parentNames=dual?(o.parentNames||o.parents||[]).join(' + '):'';const typeLabel=dual?'双重':owned?'强化':'领悟';const rank=dual?'DUAL / LV3 + LV3':o.fallback?'满修':o.rapidBoost?'快速成长 · 直接 LV'+o.grantTo:owned?'LV'+run.upgrades[o.id]+' → LV'+o.nextLevel:'获得 LV1';return `<button class="upgrade-card ${owned?'owned':''} ${o.rapidBoost?'rapid-growth':''} ${dual?'dual-ascension':''}" data-upgrade="${o.id}"><span class="choice-number">0${i+1} / ${typeLabel}</span><span class="rank">${rank}</span><h3>${o.name}</h3><span class="subtitle">${dual?parentNames:o.subtitle||''}</span><p>${o.description}</p></button>`;}).join('')+((bonus||rerolls)?`<button id="reroll-upgrades" class="upgrade-reroll">重掷命运 [R] · ${bonus?`本次 ${bonus}`:`剩余 ${rerolls}`} 次</button>`:'');
    if(run.canDismantleOffers())choices.insertAdjacentHTML('beforeend','<button id="dismantle-upgrades" class="upgrade-reroll">拆解 [T]</button>');
    document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>chooseUpgrade(b.dataset.upgrade));const rr=$('reroll-upgrades');if(rr)rr.onclick=()=>{if(run.rerollOffers())showUpgrade();};
    const dismantle=$('dismantle-upgrades');if(dismantle)dismantle.onclick=dismantleUpgrade;
  }
  function showTrainingChoices(){
    $('upgrade-summary').textContent='试炼场 · 每次 E 选择一项直接升至 LV3；双重自动补齐双方 LV3。击杀概率效果在稻草人死亡时必触发。';
    const area=$('upgrade-choices');area.classList.add('training-choices');area.innerHTML='<div class="training-controls"><input id="training-search" placeholder="搜索擢升或父卡名称" aria-label="搜索擢升"><label>生命上限 <input id="dummy-hp" type="number" min="100" max="1000000" value="'+run.trainingConfig.hp+'"></label><label>架势上限 <input id="dummy-posture" type="number" min="10" max="100000" value="'+run.trainingConfig.posture+'"></label><button id="reset-dummies">应用并复原稻草人</button><button id="close-training">返回战斗 [E]</button></div><div id="training-pool"></div>';
    const render=()=>{const q=$('training-search').value.trim().toLowerCase(),pool=run.offers.filter(a=>(a.name+' '+AshI18n.english(a.name)+' '+(a.parentNames||[]).map(n=>n+' '+AshI18n.english(n)).join(' ')+' '+a.id).toLowerCase().includes(q));$('training-pool').innerHTML=pool.map(a=>{const owned=a.parents?!!run.duals[a.id]:run.upgrades[a.id]===3;return `<button class="upgrade-card ${a.parents?'dual-ascension':''}" data-training="${a.id}" ${owned?'disabled':''}><span class="rank">${owned?'已持有':a.parents?'双重 / 自动获得父卡':'基础 / LV3'}</span><h3>${a.name}</h3><p>${a.parents?a.parentNames.join(' + ')+'：'+a.description:a.levels.map((v,i)=>'LV'+(i+1)+' '+v).join('<br>')}</p></button>`;}).join('');document.querySelectorAll('[data-training]').forEach(b=>b.onclick=()=>chooseUpgrade(b.dataset.training));};
    $('training-search').oninput=render;$('reset-dummies').onclick=()=>{run.trainingConfig.hp=clamp(Number($('dummy-hp').value)||3000,100,1000000);run.trainingConfig.posture=clamp(Number($('dummy-posture').value)||600,10,100000);for(const e of game.enemies)if(e.dummy)run.resetTrainingDummy(e);};$('close-training').onclick=()=>{run.offers=[];mode='playing';$('upgrade-screen').classList.add('hidden');$('pause').classList.remove('hidden');canvas.focus();};render();
  }
  function dismantleUpgrade(){
    if(!run.dismantleOffers())return;sound('chapter');
    if(run.offers.length)showUpgrade();else{mode='playing';$('upgrade-screen').classList.add('hidden');$('pause').classList.remove('hidden');canvas.focus();}
  }
  function chooseUpgrade(id){
    if(!run.chooseAscension(id))return;sound('chapter');
    const choice=run.lastAscensionChoice;
    if(choice?.gifted){
      // Keep the original page readable and spotlight the randomly gifted option before
      // advancing to the next pending choice or returning to combat.
      mode='upgradeReward';keys={};pressed={};
      const card=document.querySelector(`[data-upgrade="${choice.gifted.id}"]`);
      document.querySelectorAll('[data-upgrade]').forEach(b=>{b.disabled=true;if(b!==card)b.classList.add('reward-dim');});
      if(card)card.classList.add('ascension-gift');
      $('upgrade-summary').textContent=`${choice.refinementBonus?'精炼':'抉择抉择'} · 随机赠予：${choice.gifted.name}${choice.gifted.rank==='DUAL'?' · DUAL':choice.gifted.rank?' LV'+choice.gifted.rank:''}`;
      setTimeout(()=>{if(mode!=='upgradeReward')return;if(run.offers.length)showUpgrade();else {mode='playing';$('upgrade-screen').classList.add('hidden');$('pause').classList.remove('hidden');canvas.focus();}},850);
      return;
    }
    if(run.offers.length)showUpgrade();
    else {mode='playing';$('upgrade-screen').classList.add('hidden');$('pause').classList.remove('hidden');canvas.focus();}
  }
  function toggleCodex(){
    if(mode==='codex'){$('codex-tooltip')?.classList.add('hidden');$('codex-screen').classList.add('hidden');mode=codexReturn;if(mode==='playing')canvas.focus();return;}
    codexReturn=mode;mode='codex';keys={};pressed={};
    const owned=AshAscensions.ASCENSIONS.filter(a=>(run?.upgrades[a.id]||0)>0).map(a=>({...a,rank:run.upgrades[a.id]}));
    const duals=AshAscensions.DUAL_ASCENSIONS.filter(a=>run?.duals[a.id]).map(a=>({...a,rank:'双重'}));
    const entries=[...owned,...duals];
    $('codex-list').innerHTML=entries.length?entries.map(a=>`<button class="codex-entry owned ${a.dual?'dual-owned':''}" data-codex="${a.id}" aria-describedby="codex-tooltip"><h3>${a.name}<small>${a.dual?'双重':'LV'+a.rank}</small></h3></button>`).join(''):'<p class="codex-empty">本局尚未获得擢升</p>';
    let tip=$('codex-tooltip');if(!tip){tip=document.createElement('div');tip.id='codex-tooltip';tip.className='codex-tooltip hidden';tip.setAttribute('role','tooltip');document.body.appendChild(tip);}
    for(const tile of document.querySelectorAll('[data-codex]')){
      const show=()=>{const a=entries.find(x=>x.id===tile.dataset.codex);tip.innerHTML=`<h3>${a.name} <small>${a.dual?'双重':'LV'+a.rank}</small></h3>${a.dual?`<div class="codex-parents">${a.parentNames.join(' + ')}</div><p>${a.description}</p>`:a.levels.slice(0,a.rank).map((v,i)=>`<p><b>LV${i+1}</b> ${v}</p>`).join('')}`;tip.classList.remove('hidden');const rect=tile.getBoundingClientRect(),width=Math.min(340,innerWidth-24);tip.style.width=width+'px';tip.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';tip.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-tip.offsetHeight-12))+'px';};
      const hide=()=>tip.classList.add('hidden');tile.onmouseenter=show;tile.onmouseleave=hide;tile.onfocus=show;tile.onblur=hide;tile.onclick=show;
    }
    $('codex-screen').classList.remove('hidden');
  }
  $('close-codex').onclick=toggleCodex;
  const codexButton=document.createElement('button');codexButton.textContent='修习录 · TAB';codexButton.onclick=toggleCodex;
  document.querySelector('.underbar').insertBefore(codexButton,$('help-toggle'));
  $('start').onclick=()=>start();$('challenge').onclick=()=>start(selectedArena,true);$('training').onclick=()=>start(selectedArena,false,true);
  $('resume').onclick=pause;$('pause').onclick=pause;
  $('retry').onclick=()=>start(selectedArena,run?.challenge,run?.training);
  $('restart-pause').onclick=()=>start(selectedArena,run?.challenge,run?.training);$('pause-title').onclick=returnTitle;
  document.querySelectorAll('[data-arena]').forEach(b=>b.onclick=()=>{selectedArena=Number(b.dataset.arena);rig.clear();updateMasthead();});
  $('sound').onclick=setSound;$('help-toggle').onclick=()=>{$('help').classList.toggle('hidden');$('help-toggle').lastElementChild.textContent=$('help').classList.contains('hidden')?'＋':'−';};
  let manualPrevious='title';
  const manualHTML=$('help').innerHTML;
  function toggleManual(){const panel=$('manual-screen');if(!panel.classList.contains('hidden')){panel.classList.add('hidden');mode=manualPrevious;if(mode==='playing')canvas.focus();return;}manualPrevious=mode;if(mode==='playing'){keys={};pressed={};}mode='help';$('manual-content').innerHTML=manualHTML;panel.classList.remove('hidden');}
  $('manual-open').onclick=toggleManual;$('manual-close').onclick=toggleManual;
  $('back-title').onclick=returnTitle;
  document.querySelector('.brand').onclick=e=>{e.preventDefault();if(mode==='playing')pause();};
  document.addEventListener('keydown',e=>{
    if(e.code==='F8'&&mode==='title'){e.preventDefault();start(0,false,true);return;}if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target?.matches('input,textarea,select')){if(e.code==='Escape')e.target.blur();return;}
    if(e.code==='Escape'&&mode==='victory') {e.preventDefault();completeVictoryCG(true);return;}
    if(run?.training&&mode==='upgrade'&&['KeyE','Escape'].includes(e.code)){e.preventDefault();$('close-training').click();return;}
    const key=keyMap[e.code];
    if(key){e.preventDefault();if(mode==='playing'){if(!keys[key]&&!e.repeat){pressed[key]=true;if(key==='j'&&keys.shift||key==='shift'&&keys.j)pressed.thrust=true;}keys[key]=true;}}
    if(e.repeat)return;if(e.code==='KeyH'||e.code==='Escape'&&mode==='help'){e.preventDefault();toggleManual();return;}
    if(e.code==='Tab'){e.preventDefault();toggleCodex();return;}
    if(e.code==='Escape'&&mode==='codex'){toggleCodex();return;}
    if(mode==='upgrade'&&e.code==='KeyR'){if(run.rerollOffers())showUpgrade();return;}
    if(mode==='upgrade'&&e.code==='KeyT'){e.preventDefault();dismantleUpgrade();return;}
    if(mode==='upgrade'&&/^Digit[12345]$/.test(e.code)){const o=run.offers[Number(e.code.slice(-1))-1];if(o)chooseUpgrade(o.id);}
    else if(e.code==='Enter'&&mode==='title')start();
    else if(e.code==='Escape')pause();
    else if(e.code==='KeyM')setMusic();
    else if(e.code==='KeyN')setSound();
    else if(e.code==='KeyR'&&(mode==='dead'||mode==='victory'))start(selectedArena,run?.challenge,run?.training);
  });
  document.addEventListener('keyup',e=>{const key=keyMap[e.code];if(key){keys[key]=false;}});
  document.addEventListener('ashlanguagechange',()=>{keys={};pressed={};if(mode==='playing')canvas.focus();});
  // Retry a browser-blocked play only on a fresh user gesture, not every frame.
  document.addEventListener('pointerdown',()=>{if(mode==='playing')music.unlock();});
  window.addEventListener('blur',()=>{keys={};pressed={};if(mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});

  function burst(x,y,count,color,speed=190,z=45,options={}){
    count=Math.min(count,Math.max(0,1600-particles.length));
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU,v=speed*(.25+Math.random());
      particles.push({x,y:y-z,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:(options.minLife??.22)+Math.random()*.4,max:(options.minLife??.22)+.4,color,size:(1+Math.random()*2.6)*(options.sizeMultiplier||1),...(options.glowColor&&i%4===0?{glowColor:options.glowColor}:{})});
    }
  }
  function ring(x,y,color,r=60,z=0){if(rings.length>=160)return;rings.push({x,y:y-z,color,r,t:0,life:.38});}
  function label(x,y,text,color='#eec18b',size=18,options={}){if(!/^[+-]?\d+(?:\.\d+)?$/.test(String(text)))return;texts.push({x,y,text,color,size,t:0,life:.85,...options});}
  function announce(title,sub,duration=3){banner=title;bannerSub=sub;bannerTimer=duration;}
  function bossDisplayName(type){const name=TYPES[type]?.name||'';return name.includes(' · ')?name.split(' · ').pop():name;}
  function shiftWorldVisuals(dx){
    camera+=dx;const collections=[particles,rings,slashes,bloodXFX,serumBurstFX,flowTrailFX,texts,ghosts,lightningFX,meteorFX,luckSpearFX,dissolveFX,bladeRingFX,diveBombFX,phantomRushFX,timeSealDevourFX,postureShatterFX,windSpiralFX,guillotineFX,corpseBombFX,cocoonBurstFX,dualFX,art.items||[]];
    for(const collection of collections)for(const fx of collection){for(const key of ['x','x1','x2','sx','tx','startX','targetX','originX','toX','fromX'])if(Number.isFinite(fx[key]))fx[key]+=dx;if(fx.primary?.x!==undefined)fx.primary.x+=dx;if(Array.isArray(fx.points))for(const p of fx.points)if(Number.isFinite(p.x))p.x+=dx;}
  }
  const fxPositionKeys=['x','x1','x2','toX','fromX'];
  const denseTypes=new Set(['kill','break','hit','enemyHeal','soulDrain','woundMark','tarField','ignite','launch','xp','flawMark','flawConsume','sacrificialFlash','fireTouch','soulBladeHit','spiritLightning','diveBombHit','lightningMark']);
  function effectInView(fx,pad=180){let lo=Infinity,hi=-Infinity;for(const key of fxPositionKeys)if(Number.isFinite(fx[key])){lo=Math.min(lo,fx[key]);hi=Math.max(hi,fx[key]);}if(fx.points)for(const p of fx.points){lo=Math.min(lo,p.x);hi=Math.max(hi,p.x);}return lo===Infinity||hi+pad>=camera&&lo-pad<=camera+W;}
  function spawnWoundFX(event){
    if(!effectInView(event,260))return;
    const target=game.enemies.find(e=>e.id===event.targetId)||game.enemies.find(e=>Math.abs(e.x-event.x)<2&&Math.abs(e.y-event.y)<2);
    if(!target||target.furnaceCapture||target.furnaceConsumed)return;
    const scale=target.scale||1,size=Math.ceil(Math.min(1024,420*scale)),ox=size/2,oy=size*.78;
    const source=document.createElement('canvas');source.width=source.height=size;
    const c=source.getContext('2d',{willReadFrequently:true}),main=ctx,record=rig.records.get(target.id),savedRecord=record?{...record}:null;
    c.translate(ox-(target.x-camera),oy-target.y);
    // Freeze only the silhouette, without attacks, shadows, status overlays or rig changes.
    try{ctx=c;fighterBody({...target,z:0,dead:false,state:target.dead?'idle':target.state,deathT:0,deathSnapshot:true,woundSnapshot:true,flash:0,red:0,timeSealT:0,auraActive:false,effects:{}});}
    finally{ctx=main;c.setTransform(1,0,0,1,0,0);if(savedRecord)rig.records.set(target.id,savedRecord);else rig.records.delete(target.id);}
    const asset=AshCombatFX.woundAsset(source,ox,oy,isBoss(target)?scale:1);if(!asset)return;
    const intensity=Math.max(.65,Math.min(1.4,Math.sqrt(Math.max(1,event.amount||40)/40)));
    art.items.push({kind:'wound',target,asset,x:target.x,y:target.y-(target.z||0),t:0,life:.58,intensity,radius:asset.size*1.8*4});
    if(art.items.length>90)art.items.splice(0,art.items.length-90);
  }
  function processEvents(){
    for(const e of game.drainEvents()){
      if(denseTypes.has(e.type)&&!e.empowered&&!e.primary&&!e.critical&&e.kind!=='execution'){const n=(visualCounts.get(e.type)||0)+1;visualCounts.set(e.type,n);if(n>(e.type==='hit'||e.type==='spiritLightning'?48:24))continue;}
      if(e.type==='worldWrap'){shiftWorldVisuals(e.dx);continue;}
      art.ingest(e,{left:camera,right:camera+W});
      if(e.type==='swing'&&!(e.heavy&&game.p.whirlwindRank)){const flameHeavy=!!(e.heavy&&run?.upgrades?.flame);sound(e.heavy||e.index===3?'heavy':'swing');slashes.push({x:e.x,y:e.y-e.z-45,face:e.face,index:e.index,t:0,life:.18,color:flameHeavy?'#ffb067':'#d9eeee',scale:e.scale||1});if(flameHeavy){const rank=run.upgrades.flame;ring(e.x+e.face*(e.index===2?110:72),e.y,'#f09b4f',52+rank*10,e.z+28);burst(e.x+e.face*(e.index===2?110:72),e.y,10+rank*3,'#ef9d49',150+rank*35,e.z+30);}}
      if(e.type==='swing'){const rb=run?.effects?.v11?.returnBlade,serial=game.p.attackSerial,rank=run?.upgrades?.returnBlade||0;if(rank&&rb?.serial===serial){slashes.push({x:e.x,y:e.y-e.z-51,face:e.face,index:2,t:0,life:rank===3?.36:.28,color:'#a7efff',scale:[0,1.04,1.25,1.9][rank],returnBlade:true});burst(e.x+e.face*(rank===3?210:130),e.y,rank===3?19:10,'#c7f8ff',rank===3?280:180,e.z+48);}}
      if(e.type==='hit'){
        const heavy=e.kind==='heavy'||e.kind==='comboFinisher',critical=!!e.critical;
        burst(e.x,e.y,heavy?24:12,critical?'#ffd34e':e.kind==='reflect'?'#9eeded':'#ecc395',heavy?330:220,e.z);
        shake=Math.max(shake,heavy?9:e.kind==='downStrike'?7:3.5);sound(heavy?'heavy':'hit');
        if(e.kind!=='execution'&&e.damage>0)label(e.x+(Math.random()-.5)*22,e.y-e.z-24,Math.round(e.damage).toString(),critical?'#ffd34e':heavy?'#f9d69d':'#c9d4d2',critical?(heavy?28:21):heavy?24:14,{critical});
      }
      if(e.type==='lightning'){lightningFX.push({...e,t:0,life:.36});sound('parry');shake=Math.max(shake,4);if(e.primary){ring(e.primary.x,e.primary.y+26,'#b9d7ff',44);burst(e.primary.x,e.primary.y+26,18,'#dcebff',250,0);}}
      if(e.type==='ignite'){if(e.spread){label(e.x,e.y-132,'炎 扩','#ffc27c',16);}else{const count=15+(e.rank||1)*4;ring(e.x,e.y,'#e68c47',e.radius);burst(e.x,e.y,count,'#f6b35d',210+(e.rank||1)*30,40);if(e.rank){ring(e.x,e.y,'#ffb25d',28+(e.rank||1)*14,58);burst(e.x,e.y,8+(e.rank||1)*4,'#ff9540',120+(e.rank||1)*30,58);}}}
      if(e.type==='shockwave'){sound('heavy');shake=12;}
      if(e.type==='enchantImpact'){const z=e.z||48;burst(e.x,e.y,18,'#bf91ff',190,z);burst(e.x,e.y,8,'#fff0ff',100,z);shake=Math.max(shake,2);sound('enchant');}
      if(e.type==='frostExplosion'){ring(e.x,e.y,'#bcefff',e.radius||190,40);burst(e.x,e.y,24,'#c7f4ff',210,48);}
      if(e.type==='chainsawRend'){burst(e.x,e.y,12,'#efb16c',175,46);ring(e.x,e.y,'#dcb576',34,40);}
      if(e.type==='bloodShadow'){burst(e.x,e.y,10,'#d75e72',160,45);}
      if(e.type==='thorns'){burst(e.x,e.y,5,'#d5a6a0',110,45);dualFX.push({kind:'thornGuard',x:e.sourceX??game.p.x,y:e.sourceY??game.p.y,z:e.sourceZ??game.p.z,t:0,life:e.perfect?.4:.3});}
      if(e.type==='thornBurst'&&game.time-lastThornBurstFX>=.18){lastThornBurstFX=game.time;dualFX.push({...e,kind:'thornBurst',z:game.p.z,t:0,life:.55,seed:Math.random()*TAU});burst(e.x,e.y,12,'#f6eab6',175,game.p.z+55);}
      if(e.type==='endEye'){ring(e.x,e.y,'#ba70b6',e.radius||130,0);burst(e.x,e.y,12,'#efaa66',115,e.z||68);}
      if(e.type==='intimidateLock'){ring(e.x,e.y,'#8c6bc7',38+(e.rank||1)*4,62);}if(e.type==='intimidateTick'){ring(e.x,e.y,'#b39ae7',34+(e.rank||1)*5,66);burst(e.x,e.y,7+(e.rank||1)*2,'#b89bea',92,70);slashes.push({x:e.x,y:e.y-55,face:e.eye?1:-1,index:1,t:0,life:.16,color:'#c9adff',scale:.55});}
      if(e.type==='bladeBreak'){label(e.x,e.y-135,e.boss?'震刀 · 三倍削势':'震刀 · 崩解','#f8d794',17);}
      if(e.type==='heal'){label(e.x,e.y-110,'+'+Math.round(e.amount),'#a5d5ab',14);}
      if(e.type==='evasion'){label(e.x,e.y-e.z-100,'闪 避','#a2d9db',17);burst(e.x,e.y,12,'#9dd5d8',125,e.z+40);}
      if(e.type==='timeDodge'){screenFlash=Math.max(screenFlash,.10);ring(e.x,e.y,'#b8d9f5',125,e.z+35);burst(e.x,e.y,26,'#c8e2f3',210,e.z+42);label(e.x,e.y-e.z-122,'时 流 · 闪 避','#d7ecff',18);}
      if(e.type==='critical'){ring(e.x,e.y,'#f2d68d',58,e.z*.35);label(e.x,e.y-e.z-78,'暴 击','#ffe6a3',16);}
      if(e.type==='slay'&&e.source!=='luckSpear'){
        if(e.normalAttack){
          bloodXFX.push({x:e.x,y:e.y-(e.z||55)*.85,t:0,life:.43,scale:e.boss?1.6:1});
        }else{
          const guillotineSlay=['guillotine','guillotineDive','eagleDrop'].includes(e.source);
          if(guillotineSlay){guillotineFX.push({x:e.x,y:e.y,z:e.z||55,t:0,life:.6,kind:e.source==='guillotineDive'?'dive':'base',seed:Math.random()*TAU});shake=Math.max(shake,14);screenFlash=Math.max(screenFlash,.06);ring(e.x,e.y,'#f0c57a',118,e.z*.42);burst(e.x,e.y,34,'#ffb36d',310,e.z*.45);label(e.x,e.y-e.z-108,e.source==='guillotineDive'?'天 刑 · 断 首':'断 首','#ffe1ac',18);}
          shake=Math.max(shake,e.dissolve?11:8);ring(e.x,e.y,e.dissolve?'#8fd26d':'#dd9d82',e.dissolve?112:88,e.z*.35);burst(e.x,e.y,e.dissolve?52:24,e.dissolve?'#98d277':'#cf8b73',e.dissolve?330:250,e.z*.4);if(e.dissolve)dissolveFX.push({x:e.x,y:e.y,z:e.z||0,t:0,life:.72,seed:Math.random()*TAU});if(!guillotineSlay)label(e.x,e.y-e.z-92,e.dissolve?'溶 解 · 斩 杀':'斩 杀',e.dissolve?'#d2f0b7':'#efb49a',17);
        }
      }
      if(e.type==='guillotineAoe'){ring(e.x,e.y,'#d9bd9c',e.radius,e.z*.3);burst(e.x,e.y,20,'#e4c5a1',230,e.z*.35);}
      if(e.type==='poisonBlade'){ring(e.x,e.y,'#8fbd5f',62,48);burst(e.x,e.y,18,'#a5d86e',165,58);slashes.push({x:e.x,y:e.y-48,face:1,index:2,t:0,life:.22,color:'#b4e27a',scale:.75});label(e.x,e.y-108,'毒 刃 · 入 骨','#c8ec99',14);}
      if(e.type==='rockThrustStart'){sound('heavy');ring(e.x,e.y,'#c8b071',72+(e.rank||1)*14,e.z+18);burst(e.x,e.y,12+(e.rank||1)*5,'#d8c28b',180+(e.rank||1)*35,e.z+30);label(e.x,e.y-e.z-116,e.full?'岩突 · 满蓄':'岩石突刺','#ead7a1',15);}
      if(e.type==='rockShockwave'){sound('heavy');shake=Math.max(shake,8);}
      if(e.type==='quake'){sound('heavy');shake=Math.max(shake,e.big?14:e.air?7:9);if(e.big){screenFlash=Math.max(screenFlash,.05);label(e.x,e.y-110,'震 踏 · 大 地','#efd69e',16);}}
      if(e.type==='lightningDash'){sound('parry');ring(e.x,e.y,'#8fcaff',52+(e.rank||1)*5,e.z*.45);burst(e.x,e.y,18+(e.rank||1)*4,'#a8d9ff',270,e.z*.55);slashes.push({x:e.x-55,y:e.y-e.z-48,face:1,index:2,t:0,life:.18,color:'#bce7ff',scale:1.15});}
      if(e.type==='lightningDashBounce'){lightningFX.push({points:[{x:e.x,y:e.y-40},{x:e.toX,y:e.toY-40}],t:0,life:.23});ring(e.toX,e.toY,'#a6d6ff',38,48);}
      if(e.type==='innerForceGray'){ring(e.x,e.y,'#b9c3c8',48,e.z+35);fog(e.x-camera,e.y-e.z-42,34,48,'rgba(184,201,202,.16)');label(e.x,e.y-e.z-104,'化劲 · '+Math.max(1,Math.round(e.amount))+'灰','#c5d1d2',12);}
      if(e.type==='innerForceCounter'){sound('parry');ring(e.x,e.y,'#e5eee5',78,48);burst(e.x,e.y,20,'#d5e5dc',230,52);label(e.x,e.y-112,'归 元 · 反震','#e4eee5',14);}
      if(e.type==='steadfastBlock'){sound('parry');ring(e.x,e.y,'#d7c48d',70,e.z+40);burst(e.x,e.y,14,'#d8c893',170,e.z+46);label(e.x,e.y-e.z-112,'岿 然 · 格 挡','#eee0aa',14);}
      if(e.type==='devourGray'){ring(e.x,e.y,'#9b6572',50,e.z+34);for(let i=0;i<12;i++){const a=i*TAU/12+realTime*.7;particles.push({x:e.x+Math.cos(a)*56,y:e.y-e.z-35+Math.sin(a)*28,vx:-Math.cos(a)*90,vy:-Math.sin(a)*50,life:.35,max:.35,color:'#b96e7d',size:2});}label(e.x,e.y-e.z-102,'吞 噬 · '+Math.max(1,Math.round(e.amount))+'灰','#d59aa5',12);}
      if(e.type==='skeletonRise'){ring(e.x,e.y,'#a8b79a',58,0);burst(e.x,e.y,18,'#b9c3aa',115,22);label(e.x,e.y-94,e.type==='archer'?'骸骨弓手':e.type==='armored'?'披甲骸骨':'骸骨剑士','#cbd2b9',12);}
      if(e.type==='skeletonAttack'){if(e.type==='archer'){slashes.push({x:e.x,y:e.y-42,face:e.toX>e.x?1:-1,index:2,t:0,life:.16,color:'#aebaa9',scale:Math.max(.5,Math.min(2.4,Math.abs(e.toX-e.x)/220))});}else burst(e.toX,e.toY,e.type==='armored'?12:7,'#aeb7a7',140,35);}
      if(e.type==='soulDrain'){for(let j=0;j<12;j++){const a=j*TAU/12,rr=e.radius||220;particles.push({x:e.x+Math.cos(a)*rr,y:e.y-35+Math.sin(a)*rr*.35,vx:-Math.cos(a)*rr*2,vy:-Math.sin(a)*rr*.7,life:.45,max:.45,color:'#b18be0',size:2});}burst(e.x,e.y,7+(e.hits||1)*2,'#a877a3',110,e.z+38);label(e.x,e.y-e.z-104,e.full?'汲魂 · 满蓄':'汲 魂','#c8a6d7',12);}
      if(e.type==='blackHole'){ring(e.x,e.y,'#725297',e.radius||190,0);ring(e.x,e.y,'#17101f',(e.radius||190)*.42,0);label(e.x,e.y-100,'黑 洞','#b993da',14);}
      if(e.type==='blackHolePulse'){ring(e.x,e.y,'#7d5ca4',e.radius||190,0);}
      if(e.type==='illusion'){fog(e.x-camera,e.y-e.z-45,46,70,'rgba(128,79,157,.24)');ring(e.x,e.y,'#a271bd',62,e.z*.45);label(e.x,e.y-e.z-105,'幻 象','#d5a9e3',12);}
      if(e.type==='spiritLightning'){lightningFX.push({points:e.points,t:0,life:e.frenzy?.18:.28,critical:!!e.critical});if(e.frenzy)screenFlash=Math.max(screenFlash,.035);}
      if(e.type==='spiritFrenzy'){ring(e.x,e.y,'#91cfff',90,e.z+55);burst(e.x,e.y,24,'#b8e3ff',240,e.z+70);label(e.x,e.y-e.z-130,'雷 灵 · 狂 暴','#d5efff',15);}




      if(e.type==='dragonFireball'){ring(e.x,e.y,'#f1a354',58,28);burst(e.x,e.y,18,'#ffb05c',260,42);}
      if(e.type==='dragonFlame'){ring(e.x,e.y,'#e87e3f',120,14);burst(e.x,e.y,22,'#f3a154',220,25);}
      if(e.type==='fireTornado'){const radius=e.radius||170;ring(e.x,e.y,e.empowered?'#ff9b43':'#e77f3f',radius,0);if(e.empowered)ring(e.x,e.y,'#ffd071',radius*.68,18);for(let i=0;i<(e.empowered?40:24);i++){const a=i*.72+realTime,rr=20+(i%6)*(radius/10.5);particles.push({x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr*.23,vx:Math.cos(a+1.3)*(e.empowered?135:90),vy:-80-Math.random()*(e.empowered?135:90),life:e.empowered?.62:.45,max:e.empowered?.62:.45,color:i%4===0&&e.empowered?'#ffd071':'#f09a4d',size:e.empowered?2.8:2});}}
      if(e.type==='shadowFear'){ring(e.x,e.y,'#9d61c4',e.radius||280,e.z*.2);fog(e.x-camera,e.y-e.z-30,95,70,'rgba(91,47,122,.23)');label(e.x,e.y-e.z-112,'破 影 · 惊 魂','#d6a8eb',13);}
      if(e.type==='diveCooldown'){ring(e.x,e.y,e.perfect?'#f4d58d':'#d0b778',e.perfect?88:62,e.z+30);label(e.x,e.y-e.z-105,'俯冲冷却 −'+e.amount.toFixed(2)+'s','#efd59e',11);}
      if(e.type==='acidBlood'){label(e.x,e.y-e.z-105,'酸 血','#c8e48d',12);}
      if(e.type==='bloodSword'){ring(e.x,e.y,'#9c4050',74,e.z*.35);burst(e.x,e.y,18,'#c85f68',230,e.z*.45);}
      if(e.type==='ghostPulse'){ring(e.x,e.y,'#a6c6d7',e.radius||120,e.z*.25);}
      if(e.type==='giantStagger'){ring(e.x,e.y,'#d2b677',82,e.z*.45);label(e.x,e.y-e.z-105,'镇 退','#e5ca91',13);}
      if(e.type==='lightningMark'){ring(e.x,e.y,'#8dc9ff',38,e.z*.55);label(e.x,e.y-e.z-96,'雷 印','#b9e2ff',11);}

      if(e.type==='frostStack'){ring(e.x,e.y,'#9fd6ea',34+(e.stacks||1)*5,e.z*.4);label(e.x,e.y-e.z-95,'霜 '+(e.stacks||1),'#c3e8f3',10);}
      if(e.type==='freeze'){ring(e.x,e.y,'#bce9f5',88,e.z*.4);burst(e.x,e.y,24,'#d0f1f8',140,e.z*.5);label(e.x,e.y-e.z-110,e.boss?'寒 凝':'冻 结','#d9f5fa',14);}
      if(e.type==='foodDrop'){ring(e.x,e.y,['','#9bc875','#dfb56b','#d47b62'][e.size||1],32+8*(e.size||1),0);}
      if(e.type==='foodPickup'){burst(e.x,e.y,12+5*(e.size||1),'#b7d98c',150,38);label(e.x,e.y-90,'补 给 +'+Math.round(e.amount||0),'#d3eba8',12);}
      if(e.type==='peaImpact')burst(e.x,e.y-(e.z||48),e.burst?7:5,'#b8e878',95,0);
      if(e.type==='healingSpirit'){
        ring(e.x,e.y,'#8fd7a0',64,e.z+8);
        rings.push({x:e.x,y:e.y-e.z-48,color:'#9af5b1',r:43,t:0,life:.65,healHalo:true});
        burst(e.x,e.y,12,'#b2e5bc',125,e.z+52);
        for(let i=0;i<22;i++){const a=i*TAU/22+Math.random()*.25,rr=18+Math.random()*28;
          particles.push({x:e.x+Math.cos(a)*rr,y:e.y-e.z-25-Math.random()*68,vx:Math.cos(a)*(18+Math.random()*32),vy:-25-Math.random()*65,life:.55+Math.random()*.35,max:.9,color:i%4?'#67e992':'#d7ffe0',size:3+Math.random()*2,cross:true});
        }
        label(e.x,e.y-e.z-112,'灵 愈','#c8efd0',13);
      }
      if(e.type==='doomMark'){ring(e.x,e.y,'#6e526f',56,e.z*.45);label(e.x,e.y-e.z-100,'厄','#c69ac6',14);}
      if(e.type==='doomStrike'){if(e.slay){burst(e.x,e.y,42,'#b277ed',330,55);slashes.push({x:e.x,y:e.y,z:60,face:1,t:0,life:.3,heavy:true});}shake=Math.max(shake,5);ring(e.x,e.y,'#a26899',92,e.z*.35);burst(e.x,e.y,24,'#b576a8',210,e.z*.5);label(e.x,e.y-e.z-115,e.boss?'厄 运 · 镇守':'厄 运','#d6a3ca',13);}
      if(e.type==='seal'){ring(e.x,e.y,'#8d7ac3',82,e.z*.4);line(e.x-camera-38,e.y-e.z-92,e.x-camera+38,e.y-e.z-26,'rgba(202,170,244,.78)',2.8);line(e.x-camera+38,e.y-e.z-92,e.x-camera-38,e.y-e.z-26,'rgba(145,103,196,.72)',2.4);label(e.x,e.y-e.z-124,'缚 魂','#d6bcf5',14);}
      if(e.type==='phantom'){ghosts.push({x:e.x,y:e.y,z:e.z||0,face:e.face||game.p.face,t:0,life:e.life||1.2,phantom:true});ring(e.x,e.y,'#9c91bb',50,e.z+35);}
      if(e.type==='revenge'){label(e.x,e.y-e.z-110,'复 仇','#e49481',12);ring(e.x,e.y,'#b76055',50,e.z*.4);}
      if(e.type==='bully'){label(e.x,e.y-e.z-102,e.force?'欺凌 · 必暴':'欺 凌','#e1bd83',11);}
      if(e.type==='executioner'){ring(e.x,e.y,'#b27772',e.radius||120,e.z*.25);label(e.x,e.y-e.z-115,'行刑 '+(e.stacks||1),'#d7aaa0',12);}
      if(e.type==='techniqueMastery'){burst(e.x,e.y,22,'#dfca86',180,48);label(e.x,e.y-112,'技 艺 · +'+(e.amount||0)+' XP','#f0dda0',12);}
      if(e.type==='critGrowth')label(game.p.x,game.p.y-game.p.z-115,'拆解 · 暴击成长','#f1d490',11);
      if(e.type==='rerollGain')label(game.p.x,game.p.y-game.p.z-115,'重掷 +1','#d4c3ee',12);
      if(e.type==='roarHeal'){ring(e.x,e.y,'#a1c5a5',88,e.z+32);label(e.x,e.y-e.z-110,'咆哮 · 回生','#c9e1ca',12);}
      if(e.type==='grayGain')label(e.x,e.y-e.z-96,'+'+Math.max(1,Math.round(e.amount||0))+' 灰','#b4bfc0',11);
      if(e.type==='carnageBoss'){screenFlash=Math.max(screenFlash,.11);ring(e.x,e.y,'#e8645f',132,e.z+28);burst(e.x,e.y,34,'#f49a6e',360,e.z+50);label(e.x,e.y-e.z-132,'残 杀 · 沸 腾','#ffd2a0',17);}

      if(e.type==='swordQi'){const c=e.strong?'#eef9ff':'#bfe4ef';ring(e.x,e.y,c,e.strong?90:48,e.z+30);if(e.strong){screenFlash=Math.max(screenFlash,.05);label(e.x,e.y-e.z-122,'剑 气 · 贯 天','#e8f7ff',17);}}
      if(e.type==='swordQiHit'){burst(e.x,e.y,e.strong?18:8,e.strong?'#e7f8ff':'#b9dce6',e.strong?300:170,46);}
      if(e.type==='luckSpear'){sound('parry');shake=Math.max(shake,10);screenFlash=Math.max(screenFlash,.08);luckSpearFX.push({x:e.x,y:e.y,z:e.z||0,t:0,life:.48,boss:e.boss});ring(e.x,e.y,'#f4d278',116,e.z*.25);burst(e.x,e.y,38,'#f5d889',390,e.z*.45);label(e.x,e.y-e.z-126,e.boss?'幸运之矛 · 天罚':'幸 运 之 矛','#fff1ae',18);}
      if(e.type==='curseTick'){ring(e.x,e.y,'#bd5d9a',46+(e.rank||1)*6,58);burst(e.x,e.y,8+(e.rank||1)*3,'#c76ba6',100,62);label(e.x,e.y-112,'咒 蚀','#e4a6c9',12);}if(e.type==='playerAilment')label(game.p.x,game.p.y-game.p.z-115,e.ailment==='poison'?'中 毒':e.ailment==='burn'?'灼 烧':'流 血',e.ailment==='burn'?'#f29964':'#b5c878',12);
      if(e.type==='finalHoly'){sound('heavy');burst(e.x,e.y,22,'#c887ff',210,15);}
      if(e.type==='finalStrike'){sound(['axe','spin'].includes(e.kind)?'heavy':'swing');burst(e.x+e.face*110,e.y,12,'#db7fff',220,85);}
      if(e.type==='finalImpact'){sound('heavy');shake=Math.max(shake,9);ring(e.x,e.y,e.color||'#ad68ff',e.radius||100);burst(e.x,e.y,26,e.color||'#ad68ff',280,24);}
      if(e.type==='enemyExplosion'){sound('heavy');shake=Math.max(shake,12);ring(e.x,e.y,e.color||'#d68461',e.radius||185);burst(e.x,e.y,34,e.projectile==='voidBomb'?'#ed79cc':'#d89a6e',360,22);}
      if(e.type==='sacrificialFlash'){postureShatterFX.push({...e,redFlash:true,t:0,life:.8});}
      if(e.type==='flawConsume'){dualFX.push({...e,kind:'flawPuncture',t:0,life:.38});}
      if(e.type==='enemySummon')ring(e.x,e.y,'#8e9f78',95,20);
      if(e.type==='enemyRevive')label(e.x,e.y-120,'返 生','#a9b78a',14);
      if(e.type==='enemySplit')label(e.x,e.y-118,'裂 殖','#bb8e8b',14);
      if(e.type==='alphaTrail'){slashes.push({x:e.x,y:e.y-48,face:e.toX>e.x?1:-1,index:2,t:0,life:.22,color:'#c4dded',scale:Math.max(1,Math.abs(e.toX-e.x)/140)});}
      if(e.type==='bossWave'&&run.finalPhase!=='intro')announce('镇守降临',bossDisplayName(e.bossType),4);
      // V11 ascension feedback: every mechanic should have a readable visual language.
      if(e.type==='pursuitStep'){ghosts.push({x:e.x-(e.toX>e.x?1:-1)*38,y:e.y,z:e.z,face:e.toX>e.x?1:-1,t:0,life:.18});}
      if(e.type==='hiddenEdge'){ring(e.x,e.y,'#b7bdc4',42+Math.min(e.charges||1,8)*8,e.z+38);label(e.x,e.y-e.z-106,'藏 锋 ×'+(e.charges||1),'#e0e4e8',12);}
      if(e.type==='returnBladeReady'){ring(e.x,e.y,'#d7eef4',72,e.z+42);slashes.push({x:e.x,y:e.y-e.z-48,face:1,index:1,t:0,life:.22,color:'#dff7ff',scale:.8});label(e.x,e.y-e.z-112,e.attacks>1?'返 刃 ×'+e.attacks:'返 刃','#e7fbff',13);}
      if(e.type==='heavyRecoil'){shake=Math.max(shake,6);}
      if(e.type==='guardVitality'){ring(e.x,e.y,e.perfect?'#a4e9dc':'#8dbfb5',e.perfect?72:48,e.z+38);label(e.x,e.y-e.z-100,e.perfect?'守 中 · 生 机':'守 中','#bfe9dc',11);}
      if(e.type==='echoArmed'){ring(e.x,e.y,'#c9e7dc',74,e.z+18);label(e.x,e.y-e.z-108,'回 响','#d7efe5',11);}
      if(e.type==='burstEcho'){shake=Math.max(shake,e.order===2?6:3);ring(e.x,e.y,e.order===2?'#d5e7cf':'#a9c8bf',e.radius||240,10);burst(e.x,e.y,e.order===2?22:12,'#c8ded4',190,18);}
      if(e.type==='peakTiming'){ring(e.x,e.y,'#ffe09a',72,e.z+42);burst(e.x,e.y,14,'#f6d98a',160,e.z+44);label(e.x,e.y-e.z-118,'恰 至 巅 峰','#ffe7a9',14);}
      if(e.type==='chargePeak'){sound('parry');label(e.x,e.y-game.p.z-122,'满 弦 一 震','#fff0bc',14);}
      if(e.type==='armorRend'){burst(e.x,e.y,6,'#e3b475',110,e.z*.45);}
      if(e.type==='twinShock'){shake=Math.max(shake,e.blood?8:5);if(e.blood)label(e.x,e.y-104,'余 锋 · 藏 杀','#ff9aaa',13);}
      if(e.type==='corpseBomb'){corpseBombFX.push({x:e.x,y:e.y,radius:e.radius||120,strong:!!e.strong,t:0,life:.72,seed:Math.random()*TAU});shake=Math.max(shake,e.strong?11:7);ring(e.x,e.y,e.strong?'#d84b60':'#b73548',e.radius||120,10);burst(e.x,e.y,e.strong?32:22,e.strong?'#ee6978':'#c84455',e.strong?300:230,24);}
      if(e.type==='overkill')label(e.x,e.y-(e.z||0)-90*(e.scale||1),'过 杀','#f1b09b',12);
      if(e.type==='bountyMark'){label(e.x,e.y-e.z-125,e.beast?'异 兽 · 悬 赏':e.boss?'悬 赏 · 镇 守':'悬 赏','#f1c66f',12);ring(e.x,e.y,e.beast?'#83d59a':'#d6a54d',e.beast?68:56,e.z*.48);}
      if(e.type==='enemyHeal'){const voidGhoul=e.source==='sacrifice'||e.source==='consumeCorpse'&&e.healerType==='void_aggregate',ghoul=['consumeCorpse','devour'].includes(e.source),priest=e.source==='priest'&&e.healerType!=='priest';const colors=voidGhoul?['#b34a8c','#d77ab6','#efacd3']:ghoul?['#bd4050','#e26770','#f5a7a9']:priest?['#58b77b','#83d9a2','#c8f4d5']:['#f3e8d7','#fff4e9','#ffffff'];ring(e.x,e.y,colors[0],64,44);rings.push({x:e.x,y:e.y-48,color:colors[1],r:43,t:0,life:.65,healHalo:true});burst(e.x,e.y,10,colors[1],105,55);for(let i=0;i<22;i++){const a=i*TAU/22+Math.random()*.25,rr=18+Math.random()*28;particles.push({x:e.x+Math.cos(a)*rr,y:e.y-25-Math.random()*68,vx:Math.cos(a)*(18+Math.random()*32),vy:-25-Math.random()*65,life:.55+Math.random()*.35,max:.9,color:i%4?colors[1]:colors[2],size:3+Math.random()*2,cross:true});}}
      if(e.type==='enemyConsume'){const visualStacks=Math.min(12,e.stacks),voidType=e.enemyType==='void_aggregate',color=voidType?'#b34a8c':'#b0444c';ring(e.x,e.y,color,45+visualStacks*9,35);burst(e.x,e.y,8+visualStacks*2,voidType?'#d77ab6':'#cf5a58',100,45);}
      if(e.type==='enemyBloodCost'){burst(e.x,e.y,8,'#ba5461',90,35);}
      if(e.type==='enemyShellBreak'||e.type==='enemyCocoonBurst'){cocoonBurstFX.push({x:e.x,y:e.y,abyss:!!e.abyss,t:0,life:.65,seed:Math.random()*TAU});ring(e.x,e.y,e.abyss?'#b792e3':'#d3c4a1',90,35);burst(e.x,e.y,22,e.abyss?'#ae85d5':'#ad9e83',175,50);}
      if(e.type==='lightningDashDetonate'){ring(e.x,e.y,'#9bdfff',e.radius,24);burst(e.x,e.y,16+e.count*8,'#b8eeff',260,45);label(e.x,e.y-116,'雷 印 · 共 鸣','#d8f5ff',14);}

      if(e.type==='bowlingHit'){ring(e.x,e.y,'#b9a987',64,e.z*.25);burst(e.x,e.y,12,'#c4b58f',180,e.z*.3);}
      if(e.type==='heatStack'){const q=Math.min(1,(e.n||1)/(e.need||8));ring(e.x,e.y,'#dc793c',32+q*35,e.z*.38);}
      if(e.type==='frictionBurst'){shake=Math.max(shake,7);label(e.x,e.y-(e.z||0)-112,'千 击 · 生 火','#ffc06f',14);}
      if(['heatBurst','projectileFireBurst','poisonFlameBlast','serumReactionBurst','emberSpreadBurst'].includes(e.type))shake=Math.max(shake,7);
      if(e.type==='windRelease')windSpiralFX.push({x:e.x,y:e.y,z:e.z||0,t:0,life:.30,amount:e.amount||1,kind:'release',face:e.face||game.p.face,seed:Math.random()*TAU});
      if(e.type==='windSpiral'){windSpiralFX.push({x:e.x,y:e.y,z:e.z||0,t:0,life:e.kind==='slideDust'?.36:.46,amount:e.amount||1,kind:e.kind||'release',face:e.face||game.p.face,seed:Math.random()*TAU});}
      if(e.type==='woundBurst')spawnWoundFX(e);
      if(e.type==='swordSpiritImpact'){slashes.push({x:e.x,y:e.y-48,face:1,index:2,t:0,life:.20,color:'#d7f3ef',scale:.9});burst(e.x,e.y,8,'#ccebe6',150,38);}
      if(e.type==='swordSpiritRush'){for(const q of e.targets||[])slashes.push({x:q.x,y:q.y-48,face:1,index:2,t:0,life:.25,color:'#ecfbf7',scale:1.25});screenFlash=Math.max(screenFlash,.035);}
      if(e.type==='defenseSpiritBlock'||e.type==='defenseSpiritParry'){ring(e.x,e.y,e.type.endsWith('Parry')?'#c3faec':'#a8c9c4',82,e.z+38);}
      if(e.type==='bullImpact')shake=Math.max(shake,e.rank===2?5.2:7.8);
      if(e.type==='slideCounter'){ring(e.x,e.y,'#b8e7df',68,e.z*.42);label(e.x,e.y-e.z-100,'破 招 · 滑 铲','#ccefe9',11);}
      // Contact ignition is drawn by the body-attached touch effect.
      if(e.type==='furnace'){ring(e.x,e.y,'#dc8c48',95,0);burst(e.x,e.y,28,'#f0a259',250,20);label(e.x,e.y-100,'炼 化','#ffc27b',13);}
      if(e.type==='lullaby'){for(const q of e.targets||[]){ring(q.x,q.y,'#8e83bd',52,50);label(q.x,q.y-105,'Z','#c6bdeb',15);}}
      if(e.type==='wake'){ring(e.x,e.y,'#c19ac9',65,45);burst(e.x,e.y,10,'#cbb0d4',140,50);}
      if(e.type==='meditationBlock'){ring(e.x,e.y,'#b8d6b1',76,e.z+42);}
      if(e.type==='consecration'){ring(e.x,e.y,'#d7cf91',e.radius||160,0);label(e.x,e.y-90,'祝 圣','#ece4ad',13);}
      if(e.type==='consecrationEnd'){ring(e.x,e.y,'#f0cb76',e.radius||180,0);burst(e.x,e.y,30,'#efb963',270,18);}
      if(e.type==='soulBladeSpawn'){for(let j=0;j<(e.n||1);j++){const a=j*TAU/(e.n||1);slashes.push({x:e.x+Math.cos(a)*28,y:e.y-48+Math.sin(a)*18,face:1,index:2,t:0,life:.3,color:'#a98ed2',scale:.55});}}
      if(e.type==='reflectExplosion'){burst(e.x,e.y,28,'#b9eaff',300,45);ring(e.x,e.y,'#d1efff',e.radius,10);}if(e.type==='rockThrustStart'){run.effects.v16.rockVisuals??=[];run.effects.v16.rockVisuals.push({x:e.x,y:e.y,face:e.face||game.p.face,length:e.length||260,full:e.full,t:game.time});}if(e.type==='soulBladeHit'){if(e.empowered)dualFX.push({...e,kind:'soulBladeEmpowered',z:e.z||48,t:0,life:.42,seed:Math.random()*TAU});else{ring(e.x,e.y,'#9e86cb',48,40);burst(e.x,e.y,8,'#b09bd6',145,48);}}
      if(e.type==='medusaGaze')medusaGazeFX.push({...e,t:0,life:.6});
      if(e.type==='petrify'){ring(e.x,e.y,e.gold?'#e7c361':'#aab49b',55,e.z);burst(e.x,e.y,12,e.gold?'#dfbd61':'#98a08e',85,e.z);}
      if(e.type==='iceBarrierReady'){ring(e.x,e.y,'#c2eafa',74,e.z+34);label(e.x,e.y-e.z-110,'冰 结','#d8f3ff',12);}
      if(e.type==='iceBarrierBreak'){shake=Math.max(shake,6);}
      if(e.type==='emergencyDodge'){ring(e.x,e.y,'#c9eaf1',72,e.z+30);ghosts.push({x:e.x,y:e.y,z:e.z,face:game.p.face,t:0,life:.27});label(e.x,e.y-e.z-108,'紧 急 闪 避','#d9f4f6',12);}
      if(e.type==='flyingKick'){ring(e.x,e.y,'#d4c28f',62,e.z*.4);burst(e.x,e.y,10,'#dec994',175,e.z*.45);}
      if(e.type==='flyingKickExplosion')shake=Math.max(shake,8);
      if(e.type==='timeSeal'){ring(e.x,e.y,'#55bfff',84,e.z*.5);screenFlash=Math.max(screenFlash,.025);}
      if(e.type==='timeReturn'){ring(e.x,e.y,'#79d7ff',96,e.z*.45);burst(e.x,e.y,16,'#74cfff',150,e.z*.5);}
      if(e.type==='timeSealDevour'){timeSealDevourFX.push({...e,t:0,life:.42,seed:Math.random()*TAU});screenFlash=Math.max(screenFlash,.10);shake=Math.max(shake,5);}
      if(['shadowSlash','ghostCrush','blackHoleRide','rockNailBurst','soulLinkShock','allLightningMarks','levelDoomWave','ghostExecute','lightningTrail','lightningTrailBurst','huntExecute','resonanceKillingAura','windPursuit','acidSpike','overkillLaser','alphaBloodFeast','bloodExecutionerBurst','alphaRift'].includes(e.type)){const lives={shadowSlash:.20,ghostCrush:.72,blackHoleRide:.75,rockNailBurst:.66,soulLinkShock:.48,allLightningMarks:.7,levelDoomWave:.75,ghostExecute:.72,lightningTrail:.95,lightningTrailBurst:.58,huntExecute:.62,resonanceKillingAura:.72,windPursuit:.42,acidSpike:.38,overkillLaser:.22,alphaBloodFeast:AshEarthBloodFX.life.blood,bloodExecutionerBurst:AshEarthBloodFX.life.blood,alphaRift:.48};dualFX.push({...e,kind:e.type,t:0,life:lives[e.type]||.6,seed:Math.random()*TAU});}
      if(e.type==='miniBell'){sound('bell');shake=Math.max(shake,10);screenFlash=Math.max(screenFlash,.07);dualFX.push({...e,kind:'miniBell',t:0,life:1.15,seed:Math.random()*TAU});label(e.x,e.y-e.z-128,'小 · 敲 · 钟','#f5dda0',18);}
      if(e.type==='ghostCrush'||e.type==='ghostExecute'){sound('heavy');shake=Math.max(shake,12);}
      if(e.type==='groundDragStart')sound('heavy');
      if(e.type==='groundDragEnd')shake=Math.max(shake,e.source==='ghostCarnage'?8:4);
      if(e.type==='lightningTrailBurst'||e.type==='allLightningMarks'){sound('parry');shake=Math.max(shake,7);}
      if(e.type==='tornadoMerge'){shake=Math.max(shake,7);ring(e.x,e.y,'#a9d0d1',e.radius||320,0);burst(e.x,e.y,28,'#b8d9d9',280,25);}
      if(e.type==='tornadoSplit'){shake=Math.max(shake,4);ring(e.x,e.y,'#c5e3e3',e.radius||320,0);burst(e.x,e.y,18,'#cce8e8',220,20);}
      if(e.type==='bell'){sound('bell');screenFlash=Math.max(screenFlash,.07);ring(game.p.x,game.p.y,'#e2c57d',380,0);bellAnchorX=clamp(e.x-camera,90,W-90);bellWaveFX.push({x:bellAnchorX,y:-38,t:0,life:2.15,main:true,seed:Math.random()*TAU});label(game.p.x,game.p.y-game.p.z-145,'铛','#f4dda2',27);}
      if(e.type==='bellEcho'){sound(e.dual?'bell':'bellEcho');screenFlash=Math.max(screenFlash,e.dual?.07:.035);bellWaveFX.push({x:bellAnchorX,y:-38,t:0,life:e.dual?2.15:1.8,main:!!e.dual,seed:Math.random()*TAU});}
      if(e.type==='pageStorm'){ring(e.x,e.y,'#b8c5d9',e.radius||150,0);label(e.x,e.y-88,'书 页 风 暴','#d6dfef',11);}
      if(e.type==='pageStormEnd'){ring(e.x,e.y,'#c7d5e8',e.radius||180,0);burst(e.x,e.y,20,'#d2ddec',180,20);}
      if(e.type==='antiRegenMark'){ring(e.x,e.y,'#69b9a4',46,e.z*.45);label(e.x,e.y-e.z-100,'死 刑 宣 告','#92d7c6',10);}
      if(e.type==='serumBurst'){
        const rank=e.rank||1,posture=!!e.posture,base=posture?84:66;
        serumBurstFX.push({x:e.x,y:e.y,z:e.z||0,rank,posture,t:0,life:rank===3?1.05:posture?.60:.52,seed:Math.random()*TAU});
        ring(e.x,e.y,posture?'#86dfcd':'#69c5b1',base,e.z*.18);
        ring(e.x,e.y,posture?'#4f9789':'#4d8e81',base*.58,e.z*.10);
        burst(e.x,e.y,10+rank*2,posture?'#a7efe0':'#83d4c3',120+rank*12,e.z*.24);
        for(let i=0;i<8;i++){
          const a=i*TAU/8+Math.random()*.10,rr=12+Math.random()*12,v=78+Math.random()*72+rank*8;
          particles.push({x:e.x+Math.cos(a)*rr,y:e.y-(e.z||0)*.18+Math.sin(a)*rr*.22,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.48-62,life:.22+Math.random()*.18,max:.40,color:i%2?'#8fe2d0':'#dffbf3',size:1.2+Math.random()*1.8});
        }
      }
      if(e.type==='flawMark'){ring(e.x,e.y+3,'#bdc4cd',20*(e.scale||1));}
      if(e.type==='afterForce'){burst(e.x,e.y,9,'#d7e7cf',130,e.z+25);ghosts.push({x:e.x-18*game.p.face,y:e.y,z:e.z,face:game.p.face,t:0,life:.18});}
      if(e.type==='starChannel'){ring(e.x,e.y,e.blackVeil?'#6774b9':'#9fc7ff',88,e.z+28);if(e.blackVeil){screenFlash=Math.max(screenFlash,.045);fog(e.x-camera,e.y-e.z-60,105,150,'rgba(28,34,82,.28)');label(e.x,e.y-e.z-122,'黑 夜 面 纱','#aebcff',13);}else label(e.x,e.y-e.z-122,'星 辉 引 导','#cfe2ff',12);}
      if(e.type==='starBlessing'){screenFlash=Math.max(screenFlash,.055);burst(e.x,e.y,26,'#d6e9ff',220,e.z+55);label(e.x,e.y-e.z-136,'星 辉 护 佑','#eef5ff',16);}
      if(e.type==='starHeal'){label(e.x,e.y-e.z-105,'+'+Math.max(1,Math.round(e.amount||0)),'#cce8ff',12);}
      if(e.type==='vineBind'){ring(e.x,e.y,e.ghost?'#9e69d1':'#75a95f',66,e.z*.4);label(e.x,e.y-e.z-108,e.ghost?'鬼 藤':'藤 缚',e.ghost?'#c9a1f0':'#9bd77d',11);}
      if(e.type==='vinePulse'){burst(e.x,e.y,5,e.ghost?'#ac7fdd':'#7eb86d',70,e.z+20);}
      if(e.type==='tarSpawn'){ring(e.x,e.y,'#55453b',e.radius||90,0);}
      if(e.type==='chargeOrbSpawn'){const oc=e.entityType==='lightning'?'#8ad8ff':e.entityType==='frost'?'#b9ecff':'#a789d8';ring(e.x,e.y,oc,58,25);}
      if(e.type==='chargeOrbBurst'){const c=e.entityType==='lightning'?'#87d9ff':e.entityType==='frost'?'#c4efff':'#9d7bc8';ring(e.x,e.y,c,e.radius||240,22);burst(e.x,e.y,26,c,260,36);}
      if(e.type==='mindControl'){ring(e.x,e.y,'#83d9c8',82,e.z*.5);label(e.x,e.y-e.z-120,'心 灵 控 制','#a7efe0',12);}
      if(e.type==='mindStrike'){slashes.push({x:e.toX,y:e.toY-45,face:1,index:2,t:0,life:.18,color:'#7fd8c8',scale:.8});}
      if(e.type==='mindControlEnd'&&!e.dead){ring(e.x,e.y,'#77f6a0',100,e.z*.4);burst(e.x,e.y,35,'#87ffad',240,50);}
      if(e.type==='mindControlDeath'){ring(e.x,e.y,e.ice?'#79dcff':'#77f6a0',100,(e.airZ||0)+55*(e.scale||1)*.4);burst(e.x,e.y,e.ice?88:52,e.ice?'#89dfff':'#87ffad',240,(e.airZ||0)+50,{minLife:.26,sizeMultiplier:1.25,glowColor:e.ice?'#75d8ff55':'#78ffa155'});}
      if(e.type==='diveBombStart'){sound('burst');ring(e.x,e.y,'#f0b56b',72,e.z+15);diveBombFX.push({kind:'path',x:e.x,y:e.y,z:e.z||0,face:game.p.face,t:0,life:.72,rank:e.rank||1,seed:Math.random()*TAU});label(e.x,e.y-e.z-112,'俯 冲 轰 炸','#ffd293',13);}
      if(e.type==='diveBombHit'){shake=Math.max(shake,5);ring(e.x,e.y,'#df8b46',74,e.z*.25);burst(e.x,e.y,18,'#ef9a4c',235,e.z*.35);diveBombFX.push({kind:'strike',x:e.x,y:e.y,z:e.z||0,t:0,life:.48,rank:e.rank||1,seed:Math.random()*TAU});}
      if(e.type==='diveFlame'){burst(e.x,e.y,8,'#e88b43',100,e.z*.25);}
      if(e.type==='ringBlade'||e.type==='blackHoleBlade'){bladeRingFX.push({x:e.x,y:e.y,z:e.z||0,radius:e.radius||130,rank:e.rank||1,source:e.source||'jump',black:e.type==='blackHoleBlade',t:0,life:e.type==='blackHoleBlade'?.55:.42,seed:Math.random()*TAU});if(e.type==='ringBlade')sound('swing');}
      if(e.type==='phantomRushStart')phantomRushFX.push({kind:'start',x:e.x,y:e.y,z:e.z||0,face:e.face||1,t:0,life:.5});
      if(e.type==='phantomRush'){phantomRushFX.push({kind:'hit',x:e.x,y:e.y,z:e.z||0,fromX:e.fromX,fromY:e.fromY,face:e.face||1,t:0,life:.38});slashes.push({x:e.x,y:e.y-e.z-48,face:e.face||1,index:2,t:0,life:.28,color:'#9a8bd7',scale:1.5});burst(e.x,e.y,22,'#8376bd',270,e.z+36);}
      if(e.type==='elementCrit'){ring(e.x,e.y,'#d7f1ff',62,e.z*.45);label(e.x,e.y-e.z-112,'元 素 暴 击','#dff6ff',11);}
      if(e.type==='forgedLevel'){screenFlash=Math.max(screenFlash,.04);ring(e.x,e.y,'#e0c183',95,e.z+28);}
      if(e.type==='forgeBoss'){screenFlash=Math.max(screenFlash,.04);ring(e.x,e.y,'#e0c183',110,e.z+28);burst(e.x,e.y,22,'#d9b86f',190,e.z+38);}
      if(e.type==='block'){const col=AshCombatFX.resonanceColor('#bdc6ba',e.resonanceStacks??run?.effects?.resonance.stacks??0);sound('hit');shake=3;burst(e.x,e.y,13,col,160,e.z);ring(e.x,e.y,col,48,e.z);label(e.x,e.y-e.z-25,e.momentumCost?'气 御':'格 挡',e.momentumCost?'#e5cc92':'#a8b9b0',13);}
      if(e.type==='guardCollapse'){sound('hurt');shake=18;screenFlash=-.22;burst(e.x,e.y,35,'#c9829f',300,e.z);}
      if(e.type==='shieldBlock'){sound('parry');burst(e.x,e.y,10,'#c4b390',150,50);}
      if(e.type==='chargeReady'){sound('parry');ring(e.x,e.y,'#efcd8e',55,(e.z||0)+45);burst(e.x,e.y,10,'#efcd8e',100,(e.z||0)+50);}
      if(e.type==='thrustStart')sound('dash');
      if(e.type==='spawn')ring(e.x,e.y,'#b89d7b',35);
      if(e.type==='ammoEmpty')label(e.x,e.y-112,'箭尽 · 换短刀','#a3b2a4',11);
      if(e.type==='xp')label(e.x,e.y-110,'+'+e.amount+' 经验',e.special?'#d4c294':'#849f90',11);
      if(e.type==='upgrade'&&(run?.training||run?.pendingLevels>0)&&run?.offers.length){sound('chapter');showUpgrade();}
      if(e.type==='momentumBurst'){sound('burst');shake=Math.max(shake,18);screenFlash=Math.max(screenFlash,.13);const solar=e.solarRank>0;ring(e.x,e.y,solar?'#ffcf72':'#d6f0dc',e.radius,e.z+18);ring(e.x,e.y,solar?'#ff8d4d':'#eac58a',e.radius*.67,e.z+24);burst(e.x,e.y,solar?76:58,solar?'#ffc164':'#d7e7c9',solar?540:470,e.z+42);label(e.x,e.y-e.z-118,solar?'新 星 · 爆 发':'战 意 · 爆 发',solar?'#ffd58b':'#f1d5a0',24);}
      if(e.type==='burstProjectile'){burst(e.x,e.y,9,'#cfe9dc',180,e.z);ring(e.x,e.y,'#b7d9d0',24,e.z);}
      if(e.type==='burstParry'){ring(e.x,e.y,'#c2f5e5',72,e.z*.55);burst(e.x,e.y,18,'#d4f4e8',250,e.z*.6);label(e.x,e.y-e.z-35,'破 招','#c7f5e7',14);}
      if(e.type==='bloodGuard')label(e.x,e.y-e.z-92,'气御 −'+e.cost,'#e5c77f',12);
      if(e.type==='fearlessBlock')label(e.x,e.y-e.z-108,'无惧 · 格挡','#c7d6c7',14);
      if(e.type==='ultimateForm'){ring(e.x,e.y,'#f2c56f',118,e.z+35);burst(e.x,e.y,32,'#f1c878',260,e.z+45);label(e.x,e.y-e.z-135,'终 极 形 态','#ffe2a0',20);}
      if(e.type==='scarletCloak'){ring(e.x,e.y,'#e85c76',e.radius,e.z+35);burst(e.x,e.y,18,'#ed758b',180,e.z+40);}
      if(e.type==='protectiveAura'){ring(e.x,e.y,'#a9dedb',65,e.z+40);burst(e.x,e.y,10,'#d4f0e9',110,e.z+45);}
      if(e.type==='ultimateParry')label(e.x,e.y-e.z-128,'超 限 · 完 美','#fff0b0',16);
      if(e.type==='bonusAscension')announce('抉 择 · 额 外 领 悟',e.name+' LV'+e.rank,2.2);
      if(e.type==='clash'){ring(e.x,e.y,e.perfect?'#c3f9ec':'#d5c49a',e.perfect?78:54,e.z+45);label(e.x,e.y-e.z-106,e.perfect?'交锋 · 完美':'交锋','#e6d09b',13);}
      if(e.type==='revive'){reviveCinematic={t:0,life:1.18*.60,x:e.x,y:e.y,z:e.z||0,source:e.source||'immortal'};pressed={};sound('hurt');}
      if(e.type==='immortalRevenge'){shake=Math.max(shake,12);ring(e.x,e.y,'#b76f72',e.radius||360,e.z*.25);burst(e.x,e.y,36,'#cf7a76',310,e.z+25);}
      if(e.type==='immortalGray'){ring(e.x,e.y,'#a7adb9',95,e.z+30);label(e.x,e.y-e.z-120,'灰 血 · 不 灭','#c9cfdd',15);}
      if(e.type==='borrowForce')label(e.x,e.y-e.z-105,e.rank===3?'借力 · 满蓄':'借 力','#f0d29a',13);
      if(e.type==='grayHeal')label(e.x,e.y-e.z-90,'+'+Math.max(1,Math.round(e.amount))+' 灰','#abb7b5',11);
      if(e.type==='breakWave'){if(!e.screen)ring(e.x,e.y,'#d5bd73',e.radius||180,40);else screenFlash=Math.max(screenFlash,.07);}
      if(e.type==='bloodBrew')label(game.p.x,game.p.y-game.p.z-105,'血酿 '+e.stacks,'#c98979',11);
      if(e.type==='shadowEnter')label(e.x,e.y-e.z-108,'遁 影','#9b9dbb',13);
      if(e.type==='shadowExit'&&e.strike)ring(e.x,e.y,'#a38ec4',55,e.z+35);
      if(e.type==='shadowCut'){burst(e.x,e.y,14,'#b5b9bc',210,45);slashes.push({x:e.x,y:e.y-48,face:game.p.face,index:2,t:0,life:.22,color:'#aab0b6',scale:1.15});}
      if(e.type==='backstab')dualFX.push({...e,kind:'shadowSlash',t:0,life:.20});
      if(e.type==='meteorWarn')meteorFX.push({...e,t:0,life:e.duration||.7});
      if(e.type==='meteorImpact'){sound('heavy');shake=Math.max(shake,13);const color=e.pollution?'#bf83ed':'#f0a45a';ring(e.x,e.y,color,e.radius,12);burst(e.x,e.y,46,e.pollution?'#83dfc8':'#f1a354',430,28);if(e.zone)ring(e.x,e.y,e.pollution?'#8e6fd3':'#d46d35',e.zone,0);}
      if(e.type==='launch')burst(e.x,e.y,8,'#b7a98b',180,e.z+15);
      if(e.type==='parry'){const stacks=e.resonanceStacks??run?.effects?.resonance.stacks??0,col=AshCombatFX.resonanceColor('#d0f8f0',stacks);sound('parry');shake=10;screenFlash=.09;burst(e.x,e.y,42,col,370,e.z);ring(e.x,e.y,AshCombatFX.resonanceColor('#b0efe2',stacks),120,e.z);label(e.x,e.y-e.z-42,e.arrow?'完美 · 返矢':'完 美 格 挡','#c3f9ec',19);}
      if(e.type==='guard')ring(e.x,e.y,AshCombatFX.resonanceColor('#80b7b3',run?.effects?.resonance.stacks||0),44,44);
      if(e.type==='break'){const golden=!!(e.boss||e.ascensionInstant);sound('break');shake=Math.max(shake,e.boss?16:golden?11:7);if(golden){screenFlash=Math.max(screenFlash,e.boss?.10:.045);burst(e.x,e.y,e.boss?44:30,'#efb95e',e.boss?390:280,e.z*.55);postureShatterFX.push({...e,t:0,life:e.boss?.72:.56,seed:Math.random()*TAU});}else{burst(e.x,e.y,15,'#9db1aa',170,e.z*.45);ring(e.x,e.y,'#7f948e',72,e.z*.35);}label(e.x,e.y-e.z-25,'架 势 崩 解',golden?'#f7c87b':'#bdcbc5',golden?22:18);}
      if(e.type==='finalAttackCue')sound(e.slot?'finalAttackMelee':'finalAttackRanged');
      if(e.type==='dash'){sound('dash');burst(e.x,e.y,8,'#82c9cc',100,e.z+25);}
      if(e.type==='jump'){sound('jump');ring(e.x,e.y,e.second?'#82cbcf':'#758486',e.second?38:28,e.z);}
      if(e.type==='land')burst(e.x,e.y,5,'#899891',70,0);
      if(e.type==='plungeStart'){sound('swing');ring(e.x,e.y,'#c1eeeb',35,e.z);}
      if(e.type==='bounce'){sound('heavy');shake=9;burst(e.x,e.y,30,'#b8efdf',300,30);ring(e.x,e.y,'#96e5d6',95);label(e.x,e.y-95,'踏 返 · 重置','#a5e6d5',17);}
      if(e.type==='slam'){sound('heavy');shake=6;ring(e.x,e.y,'#92a9a4',85);burst(e.x,e.y,20,'#a4b9b0',200,0);}
      if(e.type==='warning'){sound('warning');}
      if(e.type==='arrowWarning'){sound('warning');ring(e.x,e.y,'#ff5d59',23,e.z);}
      if(e.type==='playerHit'){shake=12;screenFlash=-.16;sound('hurt');burst(e.x,e.y,23,'#dc7664',250,e.z);label(e.x,e.y-e.z-40,`−${Math.max(0,Math.round(e.damage||0))}`,'#f1947e',20);}
      if(e.type==='enemySwing'){
        const move=MOVES[e.move]||{};if(move.ranged)continue;
        const tint=(move.flags||[]).includes('poison')?'#9ecb73':(move.flags||[]).includes('burn')?'#ed9953':(move.flags||[]).includes('bleed')?'#c86f72':'#d88770';
        sound(e.scale>1||move.pose==='overhead'?'heavy':'swing');
        const index=move.pose==='thrust'?2:move.pose==='reverse'?1:move.pose==='overhead'?3:move.pose==='spin'?1:0;
        slashes.push({x:e.x,y:e.y-45*e.scale,face:e.face,index,t:0,life:.22,color:tint,scale:e.scale});
        if(move.ground||move.pose==='overhead'){const rr=Math.min(150,Math.max(55,(move.range||120)*.45))*e.scale;ring(e.x+e.face*Math.min(120,(move.range||120)*.5),e.y,tint,rr);burst(e.x+e.face*Math.min(120,(move.range||120)*.5),e.y,14,tint,220,0);shake=Math.max(shake,4*e.scale);}
      }
      if(e.type==='netSpread'){ring(e.x,e.y,'#a7d1c7',112,0);burst(e.x,e.y,13,'#acc5af',125,5);}
      if(e.type==='netImpact'){ring(e.x,e.y,'#a4ded2',55,e.z);burst(e.x,e.y,13,'#bddbd1',140,e.z);}
      if(e.type==='arrow')sound('arrow');
      if(e.type==='executeStart'){const ar=e.alphaRank||0;executeFlash=ar?(.22-ar*.03):.32;slowTime=ar?(.34-ar*.05):.55;ring(e.x,e.y,ar?'#d9ecff':'#f4c388',ar?82+ar*12:140,50);if(ar){const n=[0,5,9,15][ar];for(let i=0;i<n;i++){const a=i*TAU/n+Math.random()*.28,rr=18+(i%4)*14;slashes.push({x:e.x+Math.cos(a)*rr,y:e.y-48+Math.sin(a)*rr*.52,face:i%2?1:-1,index:i%3===0?2:1,t:-i*(ar===3?.005:.009),life:.13-ar*.008+Math.random()*.035,color:i%3===0?'#ffffff':'#cfe8ff',scale:.55+ar*.13+Math.random()*.45});}burst(e.x,e.y,8+ar*5,'#dceeff',280+ar*45,54);}}
      if(e.type==='executeHit'){sound('execute');const ar=e.alphaRank||0;shake=ar?11+ar*2:23;killInk=ar?.12+.015*ar:.26;screenFlash=ar?.07+.012*ar:.14;burst(e.x,e.y,ar?22+ar*9:70,ar?'#d8efff':'#f1c48c',ar?340+ar*45:550,e.z);if(ar){const n=[0,7,12,22][ar];for(let i=0;i<n;i++){const ox=Math.sin(i*2.13)*(.45+ar*.18)*72,oy=Math.cos(i*1.77)*(.55+ar*.10)*38;slashes.push({x:e.x+ox,y:e.y-50+oy,face:i%2?1:-1,index:i%4===0?2:1,t:-i*(ar===3?.0035:.006),life:.12+(i%3)*.015,color:i%5===0?'#ffffff':'#c7e4f6',scale:.58+ar*.13+(i%4)*.15});}ring(e.x,e.y,'#d7edff',58+ar*12,e.z*.45);label(e.x,e.y-e.z-52,ar===3?'一 瞬 · 千 斩':ar===2?'绝 影 · 连 斩':'绝 影 · 疾 斩','#e9f7ff',20+ar*2);}else{slashes.push({x:e.x-160,y:e.y-50,face:1,index:2,t:0,life:.45,color:'#fff0cf',scale:3});label(e.x,e.y-e.z-45,e.boss?'斩 · '+Math.round(e.damage||0):'斩','#ffe0ac',e.boss?36:49);}}
      if(e.type==='maggotBurst'){
        sound('hurt');burst(e.x,e.y,24,'#a4c75c',210,(e.z||0)+12);burst(e.x,e.y,9,'#dce6a1',125,(e.z||0)+10);ring(e.x,e.y,'#b0d274',42,(e.z||0)+4);shake=Math.max(shake,2);
      }
      if(e.type==='kill'&&!(e.entityType==='poison_maggot'&&e.tags?.includes('selfDestruct')))burst(e.x,e.y,16,'#6a7b79',160,40);
      if(e.type==='chapter'){
        sound('chapter');chapterTime=3.4;
        const c=CHAPTERS[selectedArena];
        if(run.time===0)announce('利刃出鞘','',2.8);
        else announce(c.name,run?.challenge?TYPES[c.boss].name+' · 镇守挑战':'少量强敌 · 高频交锋 · 外围敌人会观望游走',3.6);
      }
      if(e.type==='enrage'||e.type==='houndAnger'){const yellow=e.type==='houndAnger';dualFX.push({...e,kind:'bossEnrage',yellow,t:0,life:yellow?1.15:1.6,seed:Math.random()*TAU});shake=Math.max(shake,yellow?4:9);sound('heavy');}
      if(e.type==='recover')label(e.x,e.y-100,'架势恢复','#a6b0a5',13);
      if(e.type==='defeat')setTimeout(()=>{if(game.status==='dead')finish(false);},650);
      if(e.type==='finalArrival')shake=Math.max(shake,22);if(e.type==='sacrifice'){burst(e.x,e.y,8,'#bd79ed',160,40);}if(e.type==='victory')finish(true);
    }
  }
  function updateFX(dt){
    art.update(dt);
    for(const f of flowTrailFX){f.t+=dt;f.x+=f.vx*dt;f.y-=dt*8;}
    for(const e of medusaGazeFX)e.t+=dt;medusaGazeFX=medusaGazeFX.filter(e=>e.t<e.life);
    flowTrailFX=flowTrailFX.filter(f=>f.t<f.life).slice(-96);
    const flow=run?.effects?.v11?.flow.stacks||0,p=game.p,speed=Math.hypot(p.vx||0,p.vy||0);
    flowTrailTimer=Math.max(0,flowTrailTimer-dt);
    if(mode==='playing'&&flow>0&&speed>25&&flowTrailTimer<=0){flowTrailTimer=.032;const n=2+Math.min(2,Math.floor(flow/4));for(let i=0;i<n;i++)flowTrailFX.push({x:p.x-(p.vx||0)*(.022+i*.014)+(i-(n-1)/2)*4,y:p.y-(p.z||0)+2-(p.vy||0)*.015,t:0,life:.52+Math.min(.2,flow*.02),vx:-(p.vx||0)*.07,size:2.1+Math.min(1.9,flow*.19),phase:i});if(flowTrailFX.length>96)flowTrailFX.splice(0,flowTrailFX.length-96);}

    shake=Math.max(0,shake-dt*28);screenFlash=screenFlash>0?Math.max(0,screenFlash-dt):Math.min(0,screenFlash+dt);
    executeFlash=Math.max(0,executeFlash-dt);killInk=Math.max(0,killInk-dt);slowTime=Math.max(0,slowTime-dt);
    chapterTime=Math.max(0,chapterTime-dt);bannerTimer=Math.max(0,bannerTimer-dt);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.cross?0:360)*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0).slice(-650);
    for(const e of lightningFX)e.t+=dt;lightningFX=lightningFX.filter(e=>e.t<e.life).slice(-64);for(const e of meteorFX)e.t+=dt;meteorFX=meteorFX.filter(e=>e.t<e.life).slice(-32);for(const e of luckSpearFX)e.t+=dt;luckSpearFX=luckSpearFX.filter(e=>e.t<e.life);for(const e of dissolveFX)e.t+=dt;dissolveFX=dissolveFX.filter(e=>e.t<e.life);
    for(const collection of [bladeRingFX,bellWaveFX,diveBombFX,phantomRushFX,timeSealDevourFX,postureShatterFX,windSpiralFX,guillotineFX,corpseBombFX,cocoonBurstFX,dualFX,serumBurstFX])for(const e of collection)e.t+=dt;
    bladeRingFX=bladeRingFX.filter(e=>e.t<e.life).slice(-48);bellWaveFX=bellWaveFX.filter(e=>e.t<e.life).slice(-12);diveBombFX=diveBombFX.filter(e=>e.t<e.life).slice(-72);phantomRushFX=phantomRushFX.filter(e=>e.t<e.life).slice(-24);timeSealDevourFX=timeSealDevourFX.filter(e=>e.t<e.life).slice(-16);postureShatterFX=postureShatterFX.filter(e=>e.t<e.life).slice(-32);windSpiralFX=windSpiralFX.filter(e=>e.t<e.life).slice(-48);guillotineFX=guillotineFX.filter(e=>e.t<e.life).slice(-24);corpseBombFX=corpseBombFX.filter(e=>e.t<e.life).slice(-24);cocoonBurstFX=cocoonBurstFX.filter(e=>e.t<e.life).slice(-24);dualFX=dualFX.filter(e=>e.t<e.life).slice(-48);serumBurstFX=serumBurstFX.filter(e=>e.t<e.life).slice(-24);
    for(const collection of [rings,slashes,bloodXFX,texts,ghosts])for(const e of collection)e.t+=dt;
    rings=rings.filter(e=>e.t<e.life).slice(-160);slashes=slashes.filter(e=>e.t<e.life).slice(-192);bloodXFX=bloodXFX.filter(e=>e.t<e.life);texts=texts.filter(e=>e.t<e.life);ghosts=ghosts.filter(e=>e.t<e.life).slice(-96);
    if(mode==='playing'&&game.p.state==='dash'){
      ghostTimer-=dt;if(ghostTimer<=0){ghosts.push({x:game.p.x,y:game.p.y,z:game.p.z,face:game.p.face,t:0,life:.23});ghostTimer=.025;}
    }
  }
  function path(points,color,width=2,close=false,fill=false){
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();
    if(fill){ctx.fillStyle=color;ctx.fill();}else{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  }
  function line(x1,y1,x2,y2,color,width=1){path([[x1,y1],[x2,y2]],color,width);}
  function circle(x,y,r,color,stroke=false,width=1){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx[stroke?'strokeStyle':'fillStyle']=color;ctx.lineWidth=width;ctx[stroke?'stroke':'fill']();}
  function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill();}
  function text(str,x,y,size=12,color='#bdc9c5',align='left',font='sans-serif',maxWidth){
    ctx.font=`${size}px ${font==='serif'?'"KaiTi","STKaiti",serif':font==='mono'?'"Consolas",monospace':'"Microsoft YaHei","Segoe UI",sans-serif'}`;
    ctx.fillStyle=color;ctx.textAlign=align;const translated=AshI18n.t(str);if(maxWidth)ctx.fillText(translated,x,y,maxWidth);else ctx.fillText(translated,x,y);ctx.textAlign='left';
  }
  function fog(x,y,rx,ry,color){if(!(rx>0&&ry>0))return;ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);AshCombatFX.glow(ctx,0,0,rx,color);ctx.restore();}
  function starPoints(cx,cy,points,outerR,innerR,rotation=-Math.PI/2){
    const out=[];
    for(let i=0;i<points*2;i++){
      const a=rotation+i*Math.PI/points,r=i%2===0?outerR:innerR;
      out.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);
    }
    return out;
  }
  function temple(x,y,scale,light=false){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    const c=light?'#223234':'#15262d';
    ctx.fillStyle=c;ctx.fillRect(-110,-140,220,145);
    for(let i=0;i<3;i++){
      const top=-144-i*76,w=170-i*28;
      path([[-w,top+9],[-w*.63,top-9],[-42,top-40],[0,top-50],[42,top-40],[w*.63,top-9],[w,top+9],[w-15,top+18],[-w+15,top+18]],c,1,true,true);
      if(i<2){ctx.fillStyle=c;ctx.fillRect(-78+i*20,top-68,156-i*40,60);}
      line(-w+20,top+14,w-20,top+14,light?'#34413e':'#24353a',2);
    }
    ctx.fillStyle='#101e24';ctx.fillRect(-31,-119,62,124);line(0,-386,0,-338,c,4);
    ctx.restore();
  }
  function pine(x,y,s){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    path([[0,0],[8,-63],[-3,-145],[4,-225]],'#101e24',8);
    for(let i=0;i<6;i++){
      const yy=-55-i*28,w=92-i*10,lean=(i%2?1:-1)*16;
      path([[-w,yy+12],[-w*.5,yy-10],[lean,yy-45],[w*.4,yy-16],[w,yy+3]],'#14262a',1,true,true);
    }ctx.restore();
  }
  function lantern(x,y,s=1){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    fog(0,7,80,80,'#e4943920');line(0,-42,0,-20,'#71807a',1);
    ctx.shadowBlur=19;ctx.shadowColor='#e6aa65';
    path([[-13,-16],[13,-16],[16,16],[-16,16]],'#c89256',1,true,true);ctx.shadowBlur=0;
    line(-17,-19,17,-19,'#1c2b2c',5);line(-18,18,18,18,'#172528',5);
    line(-5,-13,-5,15,'#936335',1);line(5,-13,5,15,'#936335',1);line(0,20,0,34,'#ae744a',2);ctx.restore();
  }
  function gate(x,y,scale=1){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    fog(0,-90,240,190,'#c7954910');
    ctx.fillStyle='#152227';ctx.fillRect(-128,-278,28,285);ctx.fillRect(100,-278,28,285);
    ctx.fillStyle='#34413d';ctx.fillRect(-129,-277,5,281);ctx.fillRect(100,-277,5,281);
    for(const xx of [-128,100]){ctx.fillStyle='#35423f';ctx.fillRect(xx-8,-4,44,15);ctx.fillRect(xx-5,-250,37,10);}
    path([[-187,-270],[-147,-285],[-102,-312],[0,-328],[102,-312],[147,-285],[187,-270],[174,-256],[-174,-256]],'#142126',1,true,true);
    path([[-187,-270],[-148,-277],[-104,-302],[0,-317],[104,-302],[148,-277],[187,-270]],'#526059',3);
    ctx.fillStyle='#263430';ctx.fillRect(-106,-241,212,16);ctx.fillStyle='#101c20';ctx.fillRect(-35,-261,70,43);line(-36,-262,36,-262,'#737364',1);
    text('山 門',0,-234,18,'#ae9977','center','serif');lantern(-89,-210,.72);lantern(89,-210,.72);ctx.restore();
  }
  function background(themeOverride=null,camOverride=null){
    const cam=camOverride??(mode==='title'?420:camera);
    const biome=themeOverride||(run?.continuousWorld?'rain':CHAPTERS[mode==='title'?selectedArena:run.arena].theme);
    const daylight=sampleDaylight((run?.time||0)+(run?.dayOffset||0)),rgb=a=>'rgb('+a.join(',')+')';const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,rgb(daylight.top));sky.addColorStop(.5,rgb(daylight.horizon));sky.addColorStop(1,'#14242a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Moon, distant ridges, and temple roofs move at separate depths.
    if(daylight.day){fog(daylight.sunX,daylight.sunY,140,140,'#ffce8855');circle(daylight.sunX,daylight.sunY,27+12*(1-daylight.elevation),'#ffdfa1');}else{const phase=(daylight.hour<5.5?daylight.hour+24:daylight.hour)-18.5,mx=180+phase/11*1000,my=310-Math.sin(phase/11*Math.PI)*235;fog(mx,my,110,110,'#b9ceef22');circle(mx,my,25,'#cbd8e4');circle(mx+10,my-6,23,rgb(daylight.top));}ctx.save();ctx.globalAlpha=Math.max(0,.7-daylight.light);for(let i=0;i<65;i++){const xx=(i*173.3)%W,yy=35+(i*91.7)%240;circle(xx,yy,i%3===0?1.2:.65,'#d6e2f0');}ctx.restore();

    const worldLength=run?.loopLength||17955,worldLeft=game?.bounds?.left||45,wrap=(n,m)=>((n%m)+m)%m;
    for(let layer=0;layer<3;layer++){
      const parallax=[.08,.13,.20][layer],period=run?.loopWorld?worldLength*parallax:2300+layer*720,phase=wrap((cam-worldLeft)*parallax,period),segments=Math.max(9,Math.round(period/165));
      for(let copy=-1;copy<=Math.ceil((W+420)/period)+1;copy++){const x0=copy*period-phase,pts=[[x0-2,520]];for(let i=0;i<=segments;i++){const a=i/segments*TAU,y=270+layer*50+Math.sin(a*(2+layer)+layer*.73)*43+Math.sin(a*(5+layer)+1.27)*22+Math.sin(a*11+layer*.41)*9;pts.push([x0+i*period/segments,y]);}pts.push([x0+period+2,520]);path(pts,['#21343d','#1b3038','#1b2c31'][layer],1,true,true);}
    }
    if(biome==='rain'){
      if(run?.loopWorld){const period=worldLength*.16,phase=wrap((cam-worldLeft)*.16,period),sites=[[.10,.69],[.45,1.02],[.78,.60]];for(let copy=-1;copy<=Math.ceil((W+500)/period)+1;copy++)for(const [q,s] of sites)temple(copy*period+q*period-phase,430+(1-s)*12,s);}
      else{temple(340-cam*.16,426,.69);temple(1220-cam*.16,434,1.02);temple(1830-cam*.16,433,.6);}
    }
    else if(biome==='sunset'){
      ctx.fillStyle='#343a36';ctx.fillRect(0,354,W,16);
      for(let i=0;i<9;i++){const xx=i*220-cam*.18;path([[xx,470],[xx,368],[xx+25,368],[xx+39,419],[xx+160,419],[xx+177,368],[xx+198,368],[xx+198,470]],'#363c35',1,true,true);line(xx,351,xx+198,351,'#777263',3);}
      fog(740,391,1000,75,'#e4ac692a');
    }else{
      for(let i=0;i<5;i++){
        const xx=i*380-cam*.17;ctx.fillStyle='#293c45';ctx.fillRect(xx,139,107,302);
        path([[xx-18,139],[xx+54,64],[xx+125,139]],'#2b3d47',1,true,true);
        for(let j=0;j<3;j++){ctx.fillStyle='#132b37';ctx.fillRect(xx+35,175+j*75,34,43);path([[xx+35,175+j*75],[xx+52,159+j*75],[xx+69,175+j*75]],'#132b37',1,true,true);}
        line(xx-18,139,xx+54,64,'#95a19c',3);line(xx+54,64,xx+125,139,'#95a19c',2);
      }
    }
    if(run?.loopWorld){const period=worldLength*.27,phase=wrap((cam-worldLeft)*.27,period),count=19;for(let copy=-1;copy<=Math.ceil((W+300)/period)+1;copy++)for(let i=0;i<count;i++)pine(copy*period+i*period/count-phase,454,.55+((i+1)%3)*.16);}else for(let i=-1;i<10;i++)pine(i*255-cam*.27,454,.55+((i+4)%3)*.16);
    fog(730,417,950,73,'#a1b6a520');
    // Rear wall is behind the upper walkable edge, not on the pavement.
    ctx.save();ctx.translate(0,-64);
    ctx.fillStyle='#202d2f';ctx.fillRect(0,415,W,48);line(0,415,W,415,'#647066',3);line(0,423,W,423,'#142328',5);
    for(let i=-1;i<20;i++){const x=i*128-(cam*.7)%128;ctx.fillStyle='#27383a';ctx.fillRect(x,424,102,31);line(x+8,434,x+88,434,'#324442',1);}
    for(let i=-1;i<9;i++){
      const x=i*255-(cam*.78)%255;ctx.fillStyle='#1b292c';ctx.fillRect(x,383,13,78);path([[x-9,384],[x+6,374],[x+23,384]],'#4c5c54',1,true,true);
    }
    ctx.restore();
    const floorOrigin=Math.floor(camera/31680)*31680-31680;if(!themeOverride&&run?.loopWorld){const length=run.loopLength;for(const offset of [-length,0,length])AshBattleArt.floor(ctx,game.bounds,cam-offset,W,biome);}else AshBattleArt.floor(ctx,themeOverride?{left:floorOrigin,right:floorOrigin+95040}:game?.bounds||{left:0,right:5200},themeOverride?camera:cam,W,biome);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=daylight.light*.15;ctx.fillStyle='rgb('+daylight.horizon.join(',')+')';ctx.fillRect(0,398,W,316);ctx.restore();
    // Compact arenas keep their authored placements. The long loop uses the same finished
    // assets through drawWorldLandmarks, rather than improvised scenery.
    if(!run?.loopWorld)for(const x of [100,1130,2350,3570,4790]){
      const sx=x-cam;if(sx<-200||sx>W+200)continue;
      ctx.fillStyle='#1a272b';ctx.fillRect(sx,321,9,144);line(sx-8,322,sx+50,322,'#394943',4);lantern(sx+39,357,.82);
    }
    if(biome==='rain'&&!run?.loopWorld){gate(1840-cam,461,.8);gate(1170-cam,457,.58);}
    else if(biome==='sunset'){
      for(const xx of [180,820,1600,2200,3080,3960,4860]){const x=xx-cam;path([[x,459],[x+8,390],[x-7,309],[x+4,248]],'#342d2a',9);path([[x,365],[x-46,323],[x-65,280]],'#342d2a',5);path([[x,332],[x+45,302],[x+62,268]],'#342d2a',4);
        for(let i=0;i<7;i++)ellipse(x-64+i*21,274+Math.sin(i*3)*25,42,19,['#80533a','#9c6440','#a77748'][i%3]);}
    }else{
      const x=1710-cam;ctx.fillStyle='#23343a';ctx.fillRect(x-90,197,180,266);path([[x-110,197],[x,119],[x+110,197]],'#32484e',1,true,true);
      ctx.fillStyle='#101f28';ctx.fillRect(x-58,232,116,200);path([[x-58,232],[x,191],[x+58,232]],'#101f28',1,true,true);
      path([[x-27,268],[x-33,327],[x-45,344],[x+45,344],[x+33,327],[x+27,268]],'#827c66',1,true,true);line(x,227,x,269,'#5f6c64',3);circle(x,344,6,'#baad87');
      for(let i=0;i<Math.ceil(((game?.bounds?.right||2200)+340)/170);i++)line(i*170-cam,460,i*170+90-cam,460,'#a1ada7',3);
    }
    // Banners use a slow wave, tying the quiet environment to the moving characters.
    if(!run?.loopWorld)for(const xx of [410,1950,2820,4390,5100]){
      const x=xx-cam;line(x,300,x,460,'#25342f',5);line(x-5,305,x+65,305,'#435248',3);
      path([[x+5,307],[x+64,307],[x+64+Math.sin(realTime*1.4)*5,387],[x+33,402],[x+4,387]],'#655349',1,true,true);
      line(x+15,316,x+52,316,'#a38a69',1);text('守',x+34,356,25,'#bdab86','center','serif');
    }
    if(mode!=='title'&&!run?.loopWorld&&!game.externalFlow&&!game.stageClear){
      const gx=game.bounds.right+10-cam;
      if(gx<W+60){
        for(let i=0;i<5;i++)line(gx,440+i*41,gx,459+i*41,'#dfaa6659',2);
        text('清除守敌',gx-13,695,12,'#b8996a','right');
      }
    }
    // Foreground sill and grasses frame the playable plane without obscuring it.
    ctx.fillStyle='#101b20';ctx.fillRect(0,714,W,96);line(0,715,W,715,'#3c4942',3);

  }

  const enemyReworkArt={
    assassin:{gear:'hood',shape:'lean',cloth:'#252c36',body:'#b5bec5',accent:'#b8545d',cape:false,shoulders:false},
    ninja:{gear:'mask',shape:'lean',cloth:'#242635',body:'#798591',detail:'#a9b9bf',accent:'#85749e',cape:false,shoulders:false},
    samurai:{gear:'crest',shape:'standard',cloth:'#384f60',body:'#c3b8a7',accent:'#be6452',detail:'#e1cda6',cape:false},
    berserker:{gear:'bare',shape:'broad',cloth:'#75503f',body:'#c19780',accent:'#a33e36',detail:'#ccbeb0',cape:false,shoulders:false},
    mage:{gear:'wizard',shape:'robe',cloth:'#305b86',body:'#e8f3f7',accent:'#7fc8f5',detail:'#f6fdff',cape:true},
    priest:{gear:'wizard',shape:'robe',cloth:'#d9d1b0',body:'#b8bbb1',accent:'#bca053',detail:'#f1dfa1',cape:true},
    heavyShield:{gear:'helmet',shape:'broad',cloth:'#4e6169',body:'#a4b5b7',accent:'#a48d59',detail:'#d0c4a0',shoulders:true,cape:false},
    heavyAxe:{gear:'helmet',shape:'broad',cloth:'#5c5046',body:'#b9b3a6',accent:'#a55d49',detail:'#c4b697',shoulders:true,cape:false},
    oilThrower:{gear:'hood',shape:'standard',cloth:'#625243',body:'#b8aea0',accent:'#dd9752',cape:false},
    corruptOilThrower:{gear:'bare',shape:'hunched',cloth:'#4c5144',body:'#9b9985',accent:'#bcb46c',mutation:'sacs',cape:false},
    demolition:{gear:'cap',shape:'lean',cloth:'#655448',body:'#b6ab9e',accent:'#cc8255',cape:false},
    spikeShield:{gear:'helmet',shape:'broad',cloth:'#58464d',body:'#af9b9b',accent:'#bc6473',detail:'#c7ba9e',mutation:'spines'},
    burstCrawler:{gear:'bare',shape:'hunched',body:'#b68f79',cloth:'#694a43',accent:'#df9158',detail:'#ceac77',mutation:'sacs'},
    poisonCrawler:{gear:'bare',shape:'hunched',body:'#91a37c',cloth:'#405741',accent:'#74a748',detail:'#d1e198',mutation:'sacs'},
    boneEater:{gear:'bare',shape:'broad',body:'#bcaa96',cloth:'#655348',accent:'#a7554d',detail:'#dcc9ab',mutation:'spines'},
    hunter:{gear:'mask',shape:'lean',body:'#ba989d',cloth:'#402f43',accent:'#c95676',detail:'#b7c3b2',mutation:'tendrils',cape:false},
    undyingSoldier:{gear:'helmet',shape:'hunched',body:'#a9bdab',cloth:'#294536',accent:'#80d795',detail:'#d6f2d8',mutation:'sacs',shoulders:false,cape:false},
    undeadSamurai:{gear:'horned',shape:'lean',body:'#b7c9ae',cloth:'#243b34',accent:'#6fd19a',detail:'#d3f6d5',mutation:'spines',shoulders:true,cape:true},
    crystalFists:{gear:'bare',shape:'hulking',body:'#84a9b3',cloth:'#45616e',accent:'#99dbea',detail:'#d0f5f7',mutation:'crystal',shoulders:false},
    splitFists:{gear:'bare',shape:'broad',body:'#b49d92',cloth:'#61504c',accent:'#b85567',detail:'#dab5a3',mutation:'none',shoulders:false},
    pupa:{gear:'bare',shape:'lean',body:'#bdcda8',cloth:'#626d52',accent:'#98b15f',detail:'#ddd5a2',mutation:'spines'},
    licker:{gear:'bare',shape:'hunched',body:'#ac8188',cloth:'#613f47',accent:'#d85e79',detail:'#dfbfb0',mutation:'jaw'},
    mistServant:{gear:'hood',shape:'hunched',body:'#b698aa',cloth:'#603f55',accent:'#bd788f',detail:'#d6afc3',mutation:'none'},
    charger:{gear:'bare',shape:'hulking',body:'#a59585',cloth:'#65524b',accent:'#a46459',detail:'#cfc1a1',mutation:'spines'},
    boneLancer:{gear:'mask',shape:'lean',body:'#aeb3a0',cloth:'#515b56',accent:'#8f7765',detail:'#ded5b6',mutation:'spines'},
    corruptWarden:{gear:'crest',shape:'broad',body:'#b29b96',cloth:'#544454',accent:'#ad737c',detail:'#bcbc92',mutation:'tendrils'},
    necromancer:{gear:'hood',shape:'robe',body:'#adafa4',cloth:'#374c46',accent:'#8eaf67',detail:'#bdd8a0',mutation:'none',cape:true},
    boneCrawler:{gear:'bare',shape:'hulking',body:'#98938a',cloth:'#5c4e48',accent:'#8b5750',detail:'#e2d9b8',mutation:'spines'},
    rotServant:{gear:'bare',shape:'hunched',body:'#a7a18e',cloth:'#555145',accent:'#8eaa65',mutation:'sacs'},
    rotPriest:{gear:'wizard',shape:'robe',body:'#b2b88b',cloth:'#485c39',accent:'#9fa75c',detail:'#d4cb88',mutation:'tendrils',cape:true},
    immortalShield:{gear:'horned',shape:'broad',body:'#b1c5b6',cloth:'#29453e',accent:'#70d9a2',detail:'#d8f9df',mutation:'spines',shoulders:true,cape:true},
    tank:{gear:'bare',shape:'hulking',body:'#b69080',cloth:'#73564d',accent:'#b34749',detail:'#c5ac97',mutation:'none',shoulders:false},
    zombie:{gear:'bare',shape:'hunched',body:'#939b7e',cloth:'#4a5448',accent:'#88865c',mutation:'none'},
    explosiveZombie:{gear:'bare',shape:'hunched',body:'#a4ac77',cloth:'#4e5439',accent:'#aecb57',detail:'#dbe68c',mutation:'none'},
    tentacle:{gear:'bare',shape:'hulking',body:'#a77b8d',cloth:'#523a4c',accent:'#ca719d',detail:'#dbaaba',mutation:'none'}
  };
  function enemyVisual(type){
    if(enemyVisualCache.has(type))return enemyVisualCache.get(type);
    const t=TYPES[type]||{},seed=(t.catalogIndex||1)+(t.boss?73:0);
    const palettes={
      human:[['#c8c2b5','#53646c','#a35e50','#b9c3ba'],['#c5c8bb','#6a594f','#b78a55','#a9b8b0'],['#b9c4c0','#475c65','#8b6a62','#c4b17d'],['#c9bbaa','#665a70','#9f7552','#aeb4aa'],['#b7c4b2','#4e6655','#8d5d4c','#c6bc9d'],['#c4b7aa','#5f5f67','#a06961','#aab8c0'],['#bfc0b0','#6a6550','#8f7055','#c6c7bd'],['#b6c5c9','#4c5968','#8c5b67','#aebdb7']],
      mutant:[['#aebc9d','#4d6656','#8c5f49','#c4c879'],['#b9b29a','#5b535d','#7e8450','#b7bf81'],['#9db4a7','#4b625d','#76556c','#a6c58c'],['#b4a899','#675247','#8b7150','#bec48d'],['#a6b99f','#556050','#7d4f47','#b6c874'],['#b6a8aa','#5e4e60','#7a7650','#c0b57f'],['#a7b4b8','#475d65','#6f5a49','#a8c29b'],['#b0b39b','#5a6147','#815357','#c8bd78']],
      monster:[['#8fa59c','#314b4a','#7d5a6c','#9bc7a0'],['#a1a18a','#4a4c3d','#786248','#c1b277'],['#8aa3a9','#334b58','#63516e','#8fc0bd'],['#9b918c','#543f45','#85574f','#b88b75'],['#899b82','#3d503b','#6f6243','#9fc27d'],['#9c8ea1','#4f4058','#74536e','#ba92ad'],['#879fa0','#3b5050','#6c5447','#95b9a9'],['#a09b83','#514b36','#795b48','#c6b17c']]
    };
    const stage=t.stage||'human',pal=stage==='abyss'?[['#a28cb7','#3e2954','#9d58b8','#d79aef'],['#837393','#30263e','#7152a3','#b799ec'],['#b293ae','#4d2f49','#b05291','#f2a3da']]:palettes[stage]||palettes.human,palRow=pal[(seed*7+3)%pal.length];
    const role=t.role||'',txt=(t.name||'')+' '+role+' '+(t.core||''),flags=t.flags||[];
    let gear=['bare','band','hood','cap','helmet','mask'][(seed*5+Math.floor(seed/3))%6];
    if(t.armor)gear=seed%2?'helmet':'mask';if(t.boss)gear=['crest','mask','crown','horned'][seed%4];
    let shape=t.large||t.boss?'hulking':t.speed>140?'lean':['lean','standard','broad','hunched'][seed%4];
    let mutation='none';
    if(stage!=='human'){
      if(flags.includes('poison')||/毒|瘴|酸/.test(txt))mutation='sacs';
      else if(flags.includes('burn')||/火|燃|爆/.test(txt))mutation='ember';
      else if(flags.includes('pull')||/触|钩|腕|链/.test(txt))mutation='tendrils';
      else if(flags.includes('armor')||t.armor||/骨|甲|壳|柱/.test(txt))mutation='spines';
      else if(flags.includes('summon')||/母|巢|胎/.test(txt))mutation='brood';
      else mutation=['eye','spines','jaw','tendrils','sacs'][seed%5];
    }
    let displayWeapon=t.weapon||'sword';
    if(/投枪手$/.test(t.name||''))displayWeapon='javelin';
    else if(/捕网手$/.test(t.name||''))displayWeapon='net';
    else if(/斧卫$/.test(t.name||''))displayWeapon='axe';
    else if(/锤兵$/.test(t.name||''))displayWeapon='hammer';
    else if(/号角/.test(txt))displayWeapon='horn';
    else if(/战旗|旗手/.test(txt))displayWeapon='banner';
    else if(/火铳|炮手|炮|针射|枪火/.test(txt))displayWeapon=(stage==='monster'||stage==='abyss')?'organic':'gun';
    else if(/铁链|钩镰|拉扯|锁钩/.test(txt))displayWeapon='chain';
    else if(/爆竹|自爆/.test(txt))displayWeapon='bomb';
    else if((stage==='monster'||stage==='abyss')&&t.ranged)displayWeapon='organic';
    else if((stage==='monster'||stage==='abyss')&&displayWeapon==='sword')displayWeapon=seed%3?'claw':'boneblade';
    let anatomy='humanoid';
    if(stage==='monster'||stage==='abyss'||t.boss&&t.humanoid===false){
      if(type==='e71'||/血晶塔|脊柱炮/.test(txt))anatomy='tower';
      else if(/断天柱|骨柱|黑日祭器/.test(txt))anatomy='pillar';
      else if(/万足/.test(txt))anatomy='centipede';
      else if(/蛹/.test(txt))anatomy='cocoon';
      else if(/蛾群/.test(txt))anatomy='swarm';
      else if(/骨轮/.test(txt))anatomy='roller';
      else if(/蠕兽|地脉胎/.test(txt))anatomy='worm';
      else if(/酸囊浮体|深井眼|孢主|瘴雾囊/.test(txt))anatomy='floater';
      else if(/肉钟|胎钟/.test(txt))anatomy='bell';
      else if(/腐沼母体|钩爪母兽|青瘴母|瘴海女王/.test(txt))anatomy='brood';
      else if(/复生体|拟态尸堆|肉城|兵冢|终末异胎|千喉兽|炉心/.test(txt))anatomy='blob';
      else if(/瘤犬|裂口兽|骨刺兽|爬墙脊兽|缝合骑兽|髓针兽/.test(txt))anatomy='quadruped';
    }
    const v={seed,stage,body:palRow[0],cloth:palRow[1],accent:palRow[2],detail:palRow[3],gear,shape,mutation,displayWeapon,anatomy,
      cape:stage==='human'&&seed%4===0,shoulders:t.armor||t.elite||seed%5===0,waist:seed%3,mark:seed%6,glow:stage==='human'?null:palRow[3]};
    if(enemyReworkArt[t.art])Object.assign(v,enemyReworkArt[t.art],{displayWeapon:t.weapon,art:t.art});
    if(t.lateQuality&&stage==='abyss')Object.assign(v,{body:palRow[0],cloth:palRow[1],accent:palRow[2],detail:palRow[3]});
    if(t.lateQuality&&t.bodyPlan&&t.bodyPlan!=='creature')v.anatomy=t.bodyPlan;
    else if(['crawler','humanoid','tentacle','zombie'].includes(t.bodyPlan))v.anatomy=t.bodyPlan;
    if(type==='hook_young'){const mother=enemyVisual('e69');Object.assign(v,{body:mother.body,cloth:mother.cloth,accent:mother.accent,detail:mother.detail,mutation:'none'});}
    if(type==='fission_spawn'){const parent=enemyVisual('e58');Object.assign(v,{body:parent.body,cloth:parent.cloth,accent:parent.accent,detail:parent.detail,mutation:'none'});}
    if(type==='poison_maggot')Object.assign(v,{body:'#b7c88b',cloth:'#526744',accent:'#91bc4f',detail:'#e0dfa8',mutation:'none',glow:'#b6d86d'});
    if(t.bodyPlan==='statue'){v.body=t.stage==='abyss'?'#716584':'#607f79';v.cloth=t.stage==='abyss'?'#393348':'#355a58';v.accent=t.stage==='abyss'?'#997db8':'#82aaa0';v.detail=t.stage==='abyss'?'#bc9bdd':'#a9c2b6';}
    if(t.bodyPlan==='maw'){v.body='#302c40';v.cloth='#1b1d2b';v.accent='#6f548d';v.detail='#76618f';}
    // Keep each mutant's authored palette; only the requested rot casters and warden change hue.
    if(stage==='mutant'&&['corruptWarden','rotPriest'].includes(t.art))Object.assign(v,{body:'#b5b89a',cloth:'#536044',accent:'#a99b5c',detail:'#d2cd98',glow:'#b6c879'});
    if(type==='e50')Object.assign(v,{body:'#e1d6ab',cloth:'#a99c74',accent:'#d9a096',detail:'#f4ead0'});
    if(type==='e66')Object.assign(v,{body:'#b39a60',cloth:'#72563d',accent:'#d2ad64',detail:'#e0c98a'});
    if(v.anatomy==='ghost'&&stage!=='abyss')Object.assign(v,{body:'#c1e4ec',cloth:'#81b6cf',accent:'#a1ddeb',detail:'#e5fbff',glow:'#b8e8f4'});
    if(type==='e63')v.anatomy='stitchBeast';
    if(['e49','rot_priest'].includes(type)){v.gear='wizard';v.displayWeapon='staff';}
    enemyVisualCache.set(type,v);return v;
  }
  function drawEnemyBack(j,v,boss){
    const chest=j.chest,hip=j.hip;
    if(v.cape)path([[chest[0]-7,chest[1]+1],[chest[0]-23,chest[1]+10],[hip[0]-20,hip[1]+26],[hip[0]+4,hip[1]+12]],v.cloth,1,true,true);
    if(v.mutation==='spines')for(let i=0;i<4+(boss?2:0);i++){const yy=chest[1]-8+i*12;path([[chest[0]-5,yy],[chest[0]-17-(i%2)*5,yy-7],[chest[0]-8,yy+5]],v.detail,1,true,true);}
    if(v.mutation==='tendrils')for(let i=0;i<2+(boss?1:0);i++){const ox=hip[0]-6-i*5,oy=hip[1]-5+i*5;ctx.beginPath();ctx.moveTo(ox,oy);ctx.quadraticCurveTo(ox-30-i*8,oy+8+Math.sin(realTime*2+i)*8,ox-24+i*4,oy+31+i*8);ctx.strokeStyle=v.accent;ctx.lineWidth=3+i;ctx.stroke();}
    if(v.mutation==='brood'){ellipse(chest[0]-8,chest[1]+4,boss?17:12,boss?22:16,v.accent);for(let i=0;i<3;i++)circle(chest[0]-10+i*7,chest[1]+2+(i%2)*7,2.5,v.detail);}
  }
  function drawEnemyTorso(j,v,boss,armored){
    const cx=(j.hip[0]+j.chest[0])/2,cy=(j.hip[1]+j.chest[1])/2;
    if(v.shape==='robe'){path([[j.chest[0]-11,j.chest[1]],[j.chest[0]+11,j.chest[1]],[j.hip[0]+22,-5],[j.hip[0]-22,-5]],v.cloth,1,true,true);line(j.chest[0],j.chest[1]+5,j.hip[0],-8,v.detail,3);}
    if(v.shape==='broad'||v.shape==='hulking'){ellipse(cx,cy,boss?22:15,boss?27:22,v.cloth);}
    else if(v.shape==='hunched')path([[j.chest[0]-13,j.chest[1]],[j.chest[0]+8,j.chest[1]-5],[j.hip[0]+13,j.hip[1]],[j.hip[0]-7,j.hip[1]+2]],v.cloth,1,true,true);
    else path([[j.chest[0]-8,j.chest[1]],[j.chest[0]+9,j.chest[1]+1],[j.hip[0]+8,j.hip[1]],[j.hip[0]-8,j.hip[1]]],v.cloth,1,true,true);
    if(v.shoulders){ellipse(j.chest[0]-10,j.chest[1]+3,boss?11:8,boss?7:5,armored?'#727d78':v.accent);ellipse(j.chest[0]+11,j.chest[1]+3,boss?11:8,boss?7:5,armored?'#727d78':v.accent);}
    if(v.waist===0)line(j.hip[0]-12,j.hip[1],j.hip[0]+12,j.hip[1],v.detail,4);
    else if(v.waist===1)path([[j.hip[0]-10,j.hip[1]],[j.hip[0]+8,j.hip[1]],[j.hip[0]+3,j.hip[1]+19],[j.hip[0]-12,j.hip[1]+15]],v.accent,1,true,true);
    if(v.mutation==='sacs'){for(let i=0;i<3;i++){const xx=j.chest[0]-10+i*9,yy=j.chest[1]+7+(i%2)*8;circle(xx,yy,4+i,v.detail);circle(xx-1,yy-1,1.4,'rgba(230,255,180,.7)');}}
    if(v.mutation==='ember'){for(let i=0;i<3;i++)line(j.chest[0]-8+i*7,j.chest[1]+5,j.hip[0]-7+i*7,j.hip[1]-3,v.detail,1.5);}
  }
  function drawEnemyHead(j,v,boss,enraged){
    const [hx,hy]=j.head,r=boss?12:10;
    if(v.gear==='wizard'){path([[hx-18,hy-8],[hx-4,hy-40],[hx+8,hy-31],[hx+12,hy-8]],v.cloth,1,true,true);line(hx-22,hy-8,hx+21,hy-8,v.accent,5);}
    if(v.gear==='helmet'||v.gear==='crest'||v.gear==='crown'||v.gear==='horned'){
      path([[hx-r-2,hy-5],[hx-r+2,hy-r-6],[hx,hy-r-11],[hx+r+3,hy-r-4],[hx+r+2,hy+1]],v.cloth,1,true,true);
      if(v.gear==='crest')path([[hx-3,hy-r-8],[hx+1,hy-r-24],[hx+6,hy-r-9]],v.accent,1,true,true);
      if(v.gear==='crown')for(let i=-1;i<=1;i++)path([[hx+i*7-4,hy-r-7],[hx+i*7,hy-r-18-(i===0?5:0)],[hx+i*7+4,hy-r-7]],v.detail,1,true,true);
      if(v.gear==='horned'){path([[hx-r+3,hy-r],[hx-r-10,hy-r-15],[hx-r-4,hy-r+4]],v.detail,1,true,true);path([[hx+r-3,hy-r],[hx+r+10,hy-r-15],[hx+r+4,hy-r+4]],v.detail,1,true,true);}
    }else if(v.gear==='hood')path([[hx-r-3,hy+5],[hx-r-5,hy-r+3],[hx,hy-r-12],[hx+r+7,hy-r+4],[hx+r+3,hy+7]],v.cloth,1,true,true);
    else if(v.gear==='band'||v.gear==='cap')line(hx-r-2,hy-r+2,hx+r+2,hy-r+2,v.accent,v.gear==='cap'?6:3);
    else if(v.gear==='mask'){path([[hx-8,hy-5],[hx+9,hy-5],[hx+7,hy+7],[hx-6,hy+8]],v.detail,1,true,true);}
    if(v.mutation==='eye'){circle(hx+3,hy-1,boss?5:4,v.detail);circle(hx+3,hy-1,1.8,enraged?'#ff755e':'#23302d');}
    if(v.mutation==='jaw'){path([[hx-7,hy+4],[hx,hy+11],[hx+8,hy+4]],v.accent,2);for(let i=-2;i<=2;i++)line(hx+i*3,hy+5,hx+i*3+1,hy+9,'#e1d9b7',1);}
  }
  let frostGlyph=null;
  function snowflake(x,y,r,alpha=1,spin=0){
    if(!frostGlyph){
      frostGlyph=document.createElement('canvas');frostGlyph.width=frostGlyph.height=96;
      const c=frostGlyph.getContext('2d');c.translate(48,48);c.strokeStyle='#bfeeff';c.shadowColor='#65cfff';c.shadowBlur=10;c.lineWidth=2;c.lineCap='round';c.lineJoin='round';
      c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6,dx=Math.sin(a),dy=-Math.cos(a),sx=Math.cos(a),sy=Math.sin(a);
        c.moveTo(0,0);c.lineTo(dx*22,dy*22);
        c.moveTo(dx*12-sx*5,dy*12-sy*5);c.lineTo(dx*16,dy*16);
        c.moveTo(dx*12+sx*5,dy*12+sy*5);c.lineTo(dx*16,dy*16);
      }c.stroke();c.shadowBlur=0;c.fillStyle='#e9fbff';c.beginPath();c.arc(0,0,2.5,0,TAU);c.fill();
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';ctx.drawImage(frostGlyph,-r*2.2,-r*2.2,r*4.4,r*4.4);ctx.restore();
  }
  function drawFrostSnowflakes(e,x,y,s=1){if(!((e.frostStacks||0)>0||e.effects?.frostbite||(e.frostT>0&&!(e.pageSlowUntil>game.time))))return;const n=Math.min(7,Math.max(2,(e.frostStacks||1)+1)),frozen=!!e.effects?.frostbite;for(let i=0;i<n;i++){const a=i*TAU/n+realTime*(i%2?.18:-.13),rr=(31+(i%3)*8)*s,xx=x+Math.cos(a)*rr,yy=y-47*s+Math.sin(a)*18*s;snowflake(xx,yy,(frozen?8:6.2)*s,.48+(i%3)*.12,-a+realTime*.35);}if(frozen){ctx.save();ctx.globalAlpha=.16+.04*Math.sin(realTime*5);ctx.strokeStyle='#aeeaff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-43*s,43*s,55*s,0,0,TAU);ctx.stroke();ctx.restore();}}
  function drawTimeSealGlitch(e,x,y,s=1){
    if(!(e.timeSealT>0))return;const q=clamp(e.timeSealT/(e.timeSealMax||6),0,1),pulse=.5+.5*Math.sin(realTime*19+(e.id||0));ctx.save();ctx.globalCompositeOperation='lighter';
    fog(x,y-48*s,58*s,78*s,`rgba(42,155,255,${.12+pulse*.05})`);for(let i=0;i<9;i++){const yy=y-(18+i*10)*s+Math.sin(realTime*15+i*2.7)*2,skip=((Math.floor(realTime*24)+i*7+(e.id||0))%5)===0;if(skip)continue;const left=x-(28+(i%3)*9)*s+Math.sin(realTime*31+i)*6,right=x+(30+(i%4)*7)*s;ctx.globalAlpha=.18+(i%3)*.10;line(left,yy,right,yy+i%2,'#50c8ff',i%3===0?3:1.2);if(i%3===0){ctx.fillStyle='rgba(82,188,255,.18)';ctx.fillRect(left+8,yy-3,(18+i*3)*s,5);}}
    ctx.globalAlpha=.55;ctx.strokeStyle='#9ce9ff';ctx.lineWidth=1.5;ctx.setLineDash([7,12]);ctx.beginPath();ctx.ellipse(x,y-45*s,(38+8*pulse)*s,(56+5*pulse)*s,0,0,TAU);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<4;i++){const a=realTime*(2.5+i*.2)+i*TAU/4,xx=x+Math.cos(a)*48*s,yy=y-45*s+Math.sin(a)*38*s;line(xx-8,yy,xx+9,yy,'#d5f7ff',1.4);}ctx.globalAlpha=.32+.18*(1-q);line(x-52*s,y-47*s,x+53*s,y-47*s,'#dffaff',1.5);ctx.restore();
  }
  function attackTint(a,v){const f=a?.flags||[];if(f.includes('poison'))return '#9ecb73';if(f.includes('burn'))return '#ee9a55';if(f.includes('bleed'))return '#c86f72';if(f.includes('slow'))return '#86b8c9';return v?.accent||'#d88770';}
  function drawEnemyAttackVisual(e,j,v,x,y,z,s,face){
    if(!e.attack||!['windup','active'].includes(e.state))return;
    const a=e.attack,color=attackTint(a,v),active=e.state==='active',q=active?clamp(e.t/Math.max(.01,a.active),0,1):clamp(e.t/Math.max(.01,a.wind),0,1);
    const hx=x+face*j.hand[0]*s,hy=y-z+j.hand[1]*s,range=Math.min(420,Math.max(70,a.range||120))*s;
    const flags=a.flags||[];
    if(flags.includes('burstOnContact')){
      ctx.save();ctx.globalAlpha=active?.65:.2+q*.3;
      for(let i=0;i<3;i++)ellipse(hx+face*(6+i*5)*s,hy+(i-1)*4*s,(2+q)*s,1.5*s,'#b7d777');
      ctx.restore();return;
    }
    if(guardWarning(e)){const shield=e.type==='shield'||/盾弩手$/.test(TYPES[e.type]?.name||'')||['shield','spikeShield','towerShield'].includes(TYPES[e.type]?.weapon),h=shield?(e.type==='shield'||/盾弩手$/.test(TYPES[e.type]?.name||'')?[j.back[0]+10,j.back[1]]:[j.hand[0]+9,j.hand[1]+4]):j.hand;ctx.save();ctx.globalAlpha=.42;ctx.strokeStyle='#ffad35';ctx.shadowColor='#ff9b30';ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+face*h[0]*s,y-z+h[1]*s,shield?17*s:27*s,shield?34*s:14*s,0,0,TAU);ctx.stroke();ctx.restore();return;}
    if(flags.includes('consumeCorpse')||flags.includes('devourAlly')){
      const ghoul=['e57','devourer'].includes(e.type),feedingRig=ghoul?AshMotion.creaturePose(e,'ghoul',game.time).articulated:null,mouthX=x+face*(feedingRig?feedingRig.head[0]+10:8)*s,mouthY=y-z+(feedingRig?feedingRig.head[1]+15:-67)*s;
      const food=flags.includes('consumeCorpse')?game.enemyCorpses.find(c=>c.id===e.castCorpseId):game.enemies.find(o=>o!==e&&!o.dead&&!TYPES[o.type]?.boss&&o.hp/o.maxHp<.1&&Math.hypot(o.x-e.x,o.y-e.y)<330);
      const foodX=food?food.x-camera:x-face*25*s,foodY=food?food.y:y;
      ctx.save();ctx.globalAlpha=active?.72:.20+q*.35;ctx.strokeStyle=ghoul?'#b8c4a2':'#aa8b80';ctx.lineWidth=active?4:2;ctx.beginPath();ctx.moveTo(foodX,foodY-8);ctx.quadraticCurveTo((foodX+mouthX)*.5,mouthY+38-q*22,mouthX,mouthY);ctx.stroke();
      for(let i=0;i<6;i++){const t=(game.time*1.6+i/6)%1,xx=foodX+(mouthX-foodX)*t,yy=foodY-8+(mouthY-foodY+8)*t-16*Math.sin(t*Math.PI);circle(xx,yy,2+i%2,ghoul?'#c6cfb0':'#c39489');}
      ctx.restore();return;
    }
    if(flags.some(f=>['raiseZombie','summonTentacle','spawnMinion','sacrifice','truthSacrifice','sigilSacrifice','heal','bloodReload','groundZone'].includes(f))){ritualSeal(x,y,35+q*24,.3+q*.5,v.stage!=='abyss'&&['priest','rotPriest','corruptWarden'].includes(v.art)?v.detail:'#b479e8');for(let i=0;i<5;i++){const a=i*TAU/5+game.time*3;circle(x+Math.cos(a)*24,y-25-q*40+Math.sin(a)*10,3,color);}return;}
    if(flags.includes('pull')&&TYPES[e.type]?.lateQuality){const length=active?a.range*Math.sin(Math.PI*Math.min(1,q*1.5)):25+q*25;ctx.save();ctx.globalAlpha=active?.9:.55;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo(hx+face*length*.5,hy+12,hx+face*length,hy);ctx.strokeStyle=color;ctx.lineWidth=active?7:3;ctx.stroke();circle(hx+face*length,hy,5,v.detail);ctx.restore();return;}
    if(flags.includes('holyBeam')||flags.includes('arcaneBeam')){
      const holy=flags.includes('holyBeam'),h={kind:holy?'holyBeam':'arcaneBeam',x:holy?e.targetX-camera:x,y:holy?e.targetY:y,face,radius:holy?75:a.range,lane:a.lane||33};
      // The released beam is drawn once by the hazard; the caster only owns its tell.
      if(!active||!e.damageDone)AshEnemyArt.spell(ctx,h,TYPES[e.type].stage,q,true);return;
    }
    if(e.type==='e30'&&a.flags?.includes('poison')){ctx.save();ctx.globalAlpha=active?.44:.12+q*.12;ctx.fillStyle='#9cc96a';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+face*range*.7,hy-38*s);ctx.lineTo(hx+face*range*.7,hy+38*s);ctx.closePath();ctx.fill();ctx.restore();}
    if(e.type==='e35'&&a.flags?.includes('crystalSpike')){ctx.save();ctx.globalAlpha=active?.8:.2+q*.3;for(let i=0;i<5;i++){const xx=x+face*(45+i*32)*s;path([[xx-8*s,y],[xx,y-(active?42:18)*s],[xx+9*s,y]],'#9adfe5',1,true,true);}ctx.restore();}
    ctx.save();ctx.globalAlpha=active?.34:.08+q*.10;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap='round';
    if(a.ranged){
      if((a.flags||[]).includes('poison')||v.displayWeapon==='organic'){
        const len=active?range*.62:35+q*32;ctx.lineWidth=active?10:5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+face*len,hy);ctx.stroke();fog(hx+face*len,hy,active?28:14,active?18:10,color+'55');
      }else{ctx.lineWidth=1.5;ctx.setLineDash([8,9]);ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+face*Math.min(range,260),hy);ctx.stroke();ctx.setLineDash([]);}
    }else if(a.pose==='thrust'||a.lunge>180){
      ctx.lineWidth=active?5:2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+face*range*.72,hy);ctx.stroke();
    }else if(a.pose==='overhead'||a.ground){
      const ix=x+face*Math.min(range*.48,145*s);ctx.lineWidth=active?3:1.5;ctx.beginPath();ctx.ellipse(ix,y+1,Math.min(range*.34,95*s),16*s,0,0,TAU);ctx.stroke();if(active&&q>.25)line(ix,y-68*s,ix,y-4,color,3);
    }else{
      ctx.translate(x,y-z-45*s);ctx.scale(face,1);ctx.lineWidth=active?5:2;ctx.beginPath();ctx.arc(0,0,Math.min(range*.55,135*s),a.both?-2.8:-1.15,a.both?2.8:1.15);ctx.stroke();
    }
    ctx.restore();
  }
  function creatureAnchor(anatomy){
    if(anatomy==='tower'||anatomy==='pillar')return [10,-76];
    if(anatomy==='floater')return [26,-62];
    if(anatomy==='maggot')return [46,-13];
    if(anatomy==='worm')return [38,-28];
    if(anatomy==='quadruped')return [40,-38];
    if(anatomy==='roller')return [28,-34];
    if(anatomy==='swarm')return [20,-48];
    if(anatomy==='centipede')return [56,-24];
    if(anatomy==='cocoon')return [18,-60];
    if(anatomy==='bell')return [24,-50];
    if(anatomy==='crawler')return [37,-78];
    if(anatomy==='ghoul')return [34,-98];
    if(anatomy==='zombie')return [35,-73];
    if(anatomy==='aggregate')return [35,-74];
    if(anatomy==='statue')return [50,-100];
    if(anatomy==='maw')return [60,-48];
    if(anatomy==='brood')return [34,-34];
    if(anatomy==='hookYoung')return [34,-34];
    return [28,-35];
  }
  function drawCreatureSpikes(cx,cy,count,r,color,phase=0){
    for(let i=0;i<count;i++){const a=-2.75+i*(5.5/Math.max(1,count-1))+phase,ox=Math.cos(a)*r,oy=Math.sin(a)*r*.55;path([[cx+ox,cy+oy],[cx+Math.cos(a)*(r+13+(i%3)*4),cy+Math.sin(a)*(r+13+(i%3)*4)*.62],[cx+Math.cos(a+.12)*r,cy+Math.sin(a+.12)*r*.55]],color,1,true,true);}
  }
  function drawNonHumanoidEnemy(e,v,x,y,z,s,face){
    const skeleton=AshMotion.creaturePose(e,v.anatomy,game.time),anatomy=v.anatomy,flash=e.flash>0,body=flash?'#fff6dc':v.body,edge=v.detail,accent=v.accent;
    const attacking=e.attack&&['windup','active','recovery'].includes(e.state),active=e.state==='active',aq=attacking?(active?clamp(e.t/Math.max(.01,e.attack.active),0,1):clamp(e.t/Math.max(.01,e.attack.wind),0,1)):0;
    const bob=Math.sin(game.time*2.4+(e.id||0))*2,breath=1+Math.sin(game.time*3.1+(e.id||0))*.025;
    if(!e.dead){ellipse(x,y+5,34*s+z*.06,8*s,'#06121970');ellipse(x+4,y+10,48*s,3,'#8ca5980c');}
    ctx.save();ctx.translate(x,y-z);ctx.scale(face*s,s);ctx.globalAlpha=e.deathSnapshot?1:e.dead?(e.rushCorpseUntil>run.time?1:Math.max(0,1-e.deathT/.8)):e.spawnDelay>0?.25+(1-e.spawnDelay/.7)*.5:1;if(e.timeSealT>0){ctx.globalAlpha*=.58;ctx.filter='grayscale(.68) sepia(.12) hue-rotate(150deg) saturate(2.5) brightness(1.28)';ctx.translate(Math.sin(realTime*37+(e.id||0))*2.4,0);}
    if(e.statueCollapse&&!e.groundDrag&&!e.groundDragged&&!e.furnaceCapture){AshEnemyArt.collapse(ctx,e,v);ctx.restore();return skeleton.anchor;}
    ctx.rotate(skeleton.rotation);ctx.translate(...skeleton.root);
    const drawLegs=()=>{for(const points of skeleton.legs){path(points,v.cloth,anatomy==='centipede'?2:5);const foot=points[2];line(foot[0],foot[1],foot[0]+8,foot[1],edge,2);}};
    const thrust=skeleton.drive*8;
    if(TYPES[e.type]?.spectral)ctx.globalAlpha*=.62;
    if(e.state==='dormant')ctx.globalAlpha*=.7;
    if(e.state==='dormant'&&anatomy==='blob')ctx.scale(1,.35);
    if(anatomy==='spider'){
      AshEnemyArt.spider(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='ghost'){
      AshEnemyArt.spectral(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='obelisk'){
      ctx.translate(0,bob*3);path([[0,-110],[29,-64],[0,-15],[-29,-64]],body,2,true,true);path([[0,-110],[0,-15],[15,-66]],v.cloth,1,true,true);line(-9,-73,9,-55,accent,4);for(let i=0;i<5;i++){const a=game.time*.7+i*TAU/5,xx=Math.cos(a)*43,yy=-54+Math.sin(a)*25;path([[xx,yy-8],[xx+8,yy],[xx,yy+7],[xx-6,yy]],edge,1,true,true);}
    }else if(anatomy==='bat'){
      const flap=Math.sin(game.time*24)*16;path([[0,-48],[-48,-80-flap],[-37,-40],[-20,-51],[-9,-29]],v.cloth,2,true,true);path([[0,-48],[48,-80-flap],[37,-40],[20,-51],[9,-29]],body,2,true,true);ellipse(0,-44,9,17,body);circle(-4,-52,2,accent);circle(4,-52,2,accent);
    }else if(anatomy==='statue'){
      AshEnemyArt.statue(ctx,skeleton.articulated,v,e);AshEnemyArt.melee(ctx,e,skeleton.articulated,v);
    }else if(anatomy==='tower'){
      AshEnemyArt.tower(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='pillar'){
      path([[-25,2],[-21,-30],[-13,-68],[-7,-103],[3,-117],[13,-83],[21,-49],[29,0]],body,2,true,true);drawCreatureSpikes(0,-61,6,27,edge,.2);line(-8,-91,7,-76,accent,3);circle(2,-68,7,accent);
    }else if(anatomy==='tentacle'){
      AshEnemyArt.tentacle(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='stitchBeast'){
      AshEnemyArt.stitched(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='ghoul'){
      AshEnemyArt.ghoul(ctx,skeleton.articulated,v,e);AshEnemyArt.melee(ctx,e,skeleton.articulated,v);
    }else if(anatomy==='zombie'){
      AshEnemyArt.zombie(ctx,skeleton.articulated,v,e,game.time);
    }else if(anatomy==='aggregate'){
      AshEnemyArt.aggregate(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='crawler'){
      const r=skeleton.articulated;
      ctx.save();if(attacking){const spit=e.attack.pose==='spit';ctx.translate(active?aq*5:-aq*5,spit?-aq*7:aq*4);ctx.scale(1,active?1+Math.sin(aq*Math.PI)*.08:1-aq*.12);}
      path([r.hips[0],r.knees[0],r.feet[0]],v.cloth,8);circle(...r.knees[0],4,edge);
      path([r.shoulders[0],r.elbows[0],r.hands[0]],v.cloth,8);circle(...r.elbows[0],4.5,edge);
      path([[r.hip[0]-17,r.hip[1]],[r.chest[0]-19,r.chest[1]+5],[r.chest[0]-10,r.chest[1]-13],[r.chest[0]+14,r.chest[1]-10],[r.hip[0]+23,r.hip[1]+3]],body,2,true,true);
      path([[r.chest[0]-16,r.chest[1]],[r.chest[0]+8,r.chest[1]-6],[r.hip[0]+26,r.hip[1]-8],[r.hip[0]+2,r.hip[1]-2]],v.cloth,2,true,true);
      for(let i=0;i<3;i++)line(r.chest[0]-13,r.chest[1]+9+i*7,r.chest[0]+10,r.chest[1]+11+i*7,edge,1.5);
      AshEnemyArt.crawlerHead(ctx,r,v,e);
      path([r.hips[1],r.knees[1],r.feet[1]],body,8);circle(...r.knees[1],4,edge);
      path([r.shoulders[1],r.elbows[1],r.hands[1]],body,8);circle(...r.elbows[1],4.5,edge);for(const hand of r.hands){circle(...hand,5,body);for(let i=-1;i<=1;i++)line(hand[0]+i*3,hand[1],hand[0]+i*5+8,hand[1]-5,edge,1.8);}
      if(TYPES[e.type]?.legs===6){for(const side of [-1,1]){const joint=[r.hip[0]+side*14,-24-side*r.gait*5],foot=[r.hip[0]+side*28,3];path([[r.hip[0]+side*8,r.hip[1]],joint,foot],side<0?v.cloth:body,6);circle(...joint,3.5,edge);}}
      if(TYPES[e.type]?.weapon==='dualScythe')for(const [i,hand] of r.hands.entries()){const side=i===0?-1:1,xx=hand[0],yy=hand[1];path([[xx,yy],[xx+side*12,yy-31],[xx+side*42,yy-43],[xx+side*22,yy-19],[xx+side*13,yy-8]],edge,2,true,true);}
      if(v.mutation==='sacs')for(let i=0;i<4;i++){ellipse(-23+i*13,-46-(i%2)*10,9,11,accent);circle(-25+i*13,-50-(i%2)*10,3,edge);}
      if(e.type==='bone_spitter'||e.type==='e56')for(let i=0;i<(e.ammo||0);i++)path([[-27+i*18,-54],[-31+i*18,-87],[-16+i*18,-53]],edge,1,true,true);
      if(e.type==='e45'){path([[23,-71],[49,-75],[41,-51]],edge,1,true,true);drawCreatureSpikes(-7,-53,4,22,edge,-1.5);}
      if(e.type==='e42'){const tongue=active&&e.attack?.flags?.includes('tongue')?Math.sin(aq*Math.PI)*(e.attack.range||180)/s:22;path([[r.head[0]+16,r.head[1]+12],[r.head[0]+28+tongue*.5,r.head[1]+20],[r.head[0]+20+tongue,r.head[1]+14]],'#d9777b',4);}
      if(attacking&&e.attack.pose==='spit')ellipse(39,-47,7,active?7:3,'#392b30');ctx.restore();
    }else if(anatomy==='maw'){
      const gait=e.walking?Math.sin((e.walkDistance||0)/22):0,bite=active?Math.sin(Math.PI*aq)*13:0;
      ctx.translate(0,Math.abs(gait)*2);
      // Long, plated rear body and six narrow jointed limbs keep the silhouette low.
      for(let i=0;i<5;i++){const tx=-103+i*17,ty=-34-Math.sin(i*.55+game.time*1.1)*4;path([[tx-14,ty+6],[tx-6,ty-10],[tx+13,ty-12],[tx+19,ty+5]],i%2?v.cloth:body,2,true,true);line(tx-4,ty-8,tx+12,ty-10,edge,1);}
      for(let i=0;i<6;i++){const xx=-34+i*17,phase=gait*(i%2?-1:1),hip=[xx,-32],knee=[xx-8+(i%2?14:-5)+phase*6,-9],foot=[xx+(i%2?16:-12)+phase*11,3-Math.max(0,phase)*5];path([hip,knee,foot],i%2?body:v.cloth,5);circle(...knee,3,edge);line(foot[0]-2,foot[1],foot[0]+5,foot[1],edge,2);}
      path([[-49,-31],[-40,-63],[-17,-72],[21,-71],[49,-60],[62,-39],[50,-21],[13,-18],[-32,-23]],body,3,true,true);
      path([[-36,-53],[-14,-64],[18,-64],[43,-54],[48,-31],[20,-28],[-26,-32]],v.cloth,2,true,true);
      // Three tall, asymmetrical dorsal plates echo the reference without adding a humanoid head.
      for(const [xx,top,w] of [[-17,-111,17],[13,-128,20],[39,-106,18]]){path([[xx-w,-54],[xx-w*.72,top+17],[xx,top],[xx+w*.65,top+13],[xx+w,-54]],v.cloth,2,true,true);line(xx-w*.5,-58,xx-2,top+17,edge,1.5);}
      for(const [xx,yy,rr] of [[-17,-48,5],[-7,-57,7],[4,-43,4],[11,-58,5],[22,-45,7],[32,-57,5],[40,-40,4]]){circle(xx,yy,rr,accent);circle(xx+1,yy-1,rr*.68,'#13151e');}
      path([[43,-49],[65+thrust,-42-bite*.3],[76+thrust,-28+bite],[57,-27]],body,2,true,true);path([[56,-34],[72+thrust,-29+bite],[60,-24],[46,-29]],'#11121b',1,true,true);
      for(let i=0;i<4;i++){const xx=-25+i*20;path([[xx,-28],[xx+Math.sin(game.time*2+i)*6,-6],[xx+Math.sin(game.time*2+i)*9,4]],edge,3);}
    }else if(anatomy==='quadruped'){
      AshEnemyArt.quadruped(ctx,skeleton,v,e,TYPES[e.type],game.time);
    }else if(anatomy==='floater'){
      AshEnemyArt.floater(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='maggot'){
      AshEnemyArt.maggot(ctx,skeleton,v,e);
    }else if(anatomy==='worm'){
      AshEnemyArt.worm(ctx,skeleton,v,e);
    }else if(anatomy==='roller'){
      ctx.translate(0,-34);ctx.rotate((e.walkDistance||0)/31);ctx.translate(0,34);circle(0,-34,31,v.cloth);circle(0,-34,23,body);drawCreatureSpikes(0,-34,10,28,edge);circle(0,-34,10,accent);circle(3,-36,3,'#172326');
    }else if(anatomy==='swarm'){
      const tier=e.swarmTier||TYPES[e.type]?.swarm||3,count=[0,5,12,23,38][tier],spread=[0,14,25,37,48][tier];
      for(let i=0;i<count;i++){const a=game.time*(1.2+i*.035)+i*2.399,rr=spread*(.3+(i%7)/9),xx=Math.cos(a)*rr,yy=-48+Math.sin(a*1.5)*rr*.72,flap=2+Math.abs(Math.sin(game.time*22+i))*4;ellipse(xx-5,yy,7,flap,i%2?body:v.cloth);ellipse(xx+5,yy,7,flap,i%2?body:v.cloth);circle(xx,yy,2,accent);}fog(0,-45,spread,spread*.7,'rgba(84,93,89,.16)');
    }else if(anatomy==='centipede'){
      drawLegs();for(const [i,point] of skeleton.segments.entries())ellipse(point[0],point[1],10,7,i%2?body:v.cloth);ellipse(61+thrust,-25,17,11,body);for(let i=-1;i<=1;i++)path([[68+thrust,-25+i*4],[85+thrust,-31+i*6],[82+thrust,-20+i*5]],accent,1,true,true);
    }else if(anatomy==='cocoon'){
      AshEnemyArt.cocoon(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='bell'){
      AshEnemyArt.spectral(ctx,skeleton,v,e,game.time,true);
    }else if(anatomy==='brood'){
      AshEnemyArt.brood(ctx,skeleton,v,e,game.time);
    }else if(anatomy==='hookYoung'){
      AshEnemyArt.hookYoung(ctx,skeleton,v,e,game.time);
    }else{
      if(e.type==='fission_spawn'&&attacking&&e.attack.pose==='spin'){const roll=active?aq*TAU:0;ctx.translate(0,-28);ctx.rotate(roll);ctx.translate(0,28);}
      // Low, irregular masses: meat heaps, weapon mounds, many-mouthed bosses, etc.
      path([[-45,-4],[-41,-31],[-24,-50],[-4,-45],[10,-61],[31,-48],[47,-23],[43,0]],v.cloth,2,true,true);ellipse(-5,-28,34,24,body);for(let i=0;i<4;i++){const xx=-26+i*18,yy=-26-(i%2)*13;circle(xx,yy,6,accent);circle(xx+1,yy,2,'#1b2524');}if(/兵冢/.test(TYPES[e.type]?.name||''))for(let i=0;i<6;i++){const a=-2.6+i*.65;line(-10+i*4,-35,Math.cos(a)*55,Math.sin(a)*35-42,edge,3);}if(/千喉/.test(TYPES[e.type]?.name||''))for(let i=0;i<3;i++)path([[-22+i*21,-20],[-12+i*21,-13],[-1+i*21,-20]],'#d1b8a6',2);
    }
    if(attacking&&!['ghoul','statue','quadruped','spider','worm','maggot','ghost','bell','crawler'].includes(anatomy)){const a=creatureAnchor(anatomy),pulse=.5+.5*Math.sin(game.time*12);ctx.globalCompositeOperation='lighter';circle(a[0],a[1],3+aq*5,active?'#fff1d1':accent);ctx.globalAlpha=.24+.18*pulse;circle(a[0],a[1],12+aq*10,accent,true,2);ctx.globalCompositeOperation='source-over';}
    ctx.restore();
    return skeleton.anchor;
  }
  function drawNonHumanoidOverlay(e,x,y,s,face,anchor){
    if(e.bossThrowWarning||e.bossThrown){const lift=e.z||0,pulse=.72+.20*Math.sin(realTime*12+(e.id||0));ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(e.bossThrown?.78:.62)*pulse;fog(x,y-lift-44*s,46*s,62*s,'#ff30305c');ctx.strokeStyle='#ff544a';ctx.shadowColor='#ff3028';ctx.shadowBlur=18;ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(x,y-lift-40*s,38*s,55*s,0,0,TAU);ctx.stroke();ctx.restore();}
    if(e.type==='void_aggregate'){const stacks=Math.min(12,e.corpseStacks||0),pulse=.8+.12*Math.sin(realTime*2.4+e.id),radius=(95+stacks*13)*s;ctx.save();ctx.globalAlpha=.65;fog(x,y-47*s,radius*pulse,radius*.68*pulse,'rgba(105,65,165,.22)');for(let i=0;i<3+Math.floor(stacks/3);i++){const a=realTime*.55+i*2.399,rr=radius*(.38+(i%3)*.16);fog(x+Math.cos(a)*rr,y-37*s+Math.sin(a)*rr*.34,26+stacks*1.5,32+stacks*1.5,'rgba(148,103,204,.15)');}ctx.restore();}
    if(e.effects?.iceFlame||e.effects?.burn||e.effects?.tarBurn){const cold=!!e.effects?.iceFlame;fog(x,y-36*s,34*s,45*s,cold?'#73caff3d':'#eb81303d');for(let i=0;i<5;i++){const yy=y-12-i*12-((realTime*38+i*9)%18);line(x+Math.sin(i*2.8+realTime*5)*18,yy,x+Math.sin(i*2.8+realTime*5)*16,yy-12,cold?'#8bdcff':'#e9a64c',2);}}

    if(e.effects?.poison){const pulse=.55+.2*Math.sin(realTime*7+e.id);fog(x,y-36*s,43*s,42*s,'rgba(117,174,75,'+(0.12+pulse*.09)+')');for(let i=0;i<6;i++){const a=realTime*(1.1+i*.08)+i*1.3;circle(x+Math.cos(a)*(18+8*(i%2))*s,y-32*s+Math.sin(a*1.4)*28*s-(realTime*10+i*4)%13,2.6+(i%2),'rgba(173,220,112,.62)');}}
    if(e.effects?.bleed)for(let i=0;i<4;i++){const yy=y-(28+i*12)*s-((realTime*22+i*8)%10);line(x+(i-1.5)*10*s,yy,x+(i-1.5)*9*s,yy+10,'rgba(202,84,86,.68)',2);}
    drawFrostSnowflakes(e,x,y,s);
    if(e.armorRendT>0){ctx.save();ctx.globalAlpha=.62;for(let i=0;i<3;i++)line(x-20*s+i*16*s,y-70*s,x-8*s+i*13*s,y-48*s,'#d8a167',2);ctx.restore();}
    if(e.antiRegenSerum){ctx.save();ctx.globalAlpha=.65+.2*Math.sin(realTime*8);ctx.strokeStyle='#76c9b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-58*s,20*s,0,TAU);ctx.stroke();ctx.restore();}
    drawTimeSealGlitch(e,x,y,s);
    if((e.killingAuraSeen||-99)>game.time-.65){const surge=!!e.killingAuraSurge,pulse=.5+.3*Math.sin(realTime*10+e.id);fog(x,y-38*s,(surge?42:31)*s,47*s,'rgba(145,86,205,'+(surge?.18:.10+pulse*.05)+')');}
    if(e.red>0){const rx=x+face*(anchor?.[0]||0)*s,ry=y+(anchor?.[1]||-60)*s;warningGlint(rx,ry,Math.min(1,e.red*14),1,guardWarning(e));}
    if(e.state==='stunned'){const yy=y-125*s;ctx.save();ctx.translate(x,yy);ctx.rotate(Math.PI/4);ctx.strokeStyle='#efc47e';ctx.lineWidth=2;ctx.strokeRect(-8,-8,16,16);ctx.restore();line(x-18,yy+19,x-18+36*clamp(e.stun/(e.stunMax||game.postureBreakDuration(e)),0,1),yy+19,'#e5ba6d',2);}
  }
  function weapon(x,y,angle,type,color,scale=1,pull=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
    if(type==='chainsaw'){line(-15,0,8,0,'#725848',7);ctx.fillStyle='#667574';ctx.fillRect(5,-9,71,18);ellipse(76,0,10,9,'#718583');line(8,-10,73,-10,'#d0d6c0',2);line(8,10,73,10,'#d0d6c0',2);for(let i=0;i<10;i++){const xx=7+(i*8+game.time*90)%72;path([[xx,-9],[xx+5,-15],[xx+7,-9]],'#e1d9b5',1,true,true);path([[xx,9],[xx-3,15],[xx+5,9]],'#c7c8b4',1,true,true);}ctx.fillStyle='#cf9a55';ctx.fillRect(8,-6,12,12);line(26,0,65,0,'#203b3d',4);}
    else if(type==='dagger'){line(-13,0,12,0,'#59473a',5);path([[8,-6],[40,-4],[55,0],[40,4],[8,6]],'#ccd5d0',1,true,true);line(7,-8,7,8,'#9a7552',3);}
    else if(type==='fists'){ellipse(12,0,13,9,color);for(let i=-1;i<=1;i++)circle(22,i*5,4,'#c8a397');}
    else if(type==='crystalFist'){path([[-12,-8],[5,-17],[26,-15],[36,-3],[27,15],[4,18],[-12,8]],'#72aaba',2,true,true);for(let i=0;i<3;i++){const yy=(i-1)*10;path([[9,yy-5],[25+i*4,yy-9],[41-i*3,yy],[24,yy+5]],i%2?'#c1f4f3':'#8cd5e2',1,true,true);}line(-6,-6,21,-12,'#e3ffff',2);}
    else if(type==='boneSpear'){line(-38,0,77,0,'#9b917e',5);for(let i=0;i<6;i++)line(i*12-23,-4,i*12-19,4,'#e0d7bc',3);path([[72,-7],[117,0],[73,8],[82,0]],'#e6ddbf',1,true,true);}
    else if(type==='spikeShield'){path([[-9,-28],[17,-33],[31,-18],[33,19],[14,34],[-10,25]],'#675762',2,true,true);path([[-3,-22],[15,-27],[25,-15],[26,17],[13,27],[-3,19]],'#a19a8b',1,true,true);for(let i=-1;i<=1;i++)path([[13,i*17-5],[43,i*19],[14,i*17+5]],'#e1d4bb',1,true,true);}
    else if(type==='soulBlade'){ctx.globalCompositeOperation='lighter';ctx.shadowColor='#b686e9';ctx.shadowBlur=14;path([[-12,-5],[48,-7],[91,0],[48,7],[-12,5]],'#d3b7ff',1,true,true);line(-12,0,86,0,'#ffffff',2);line(-14,-12,-14,12,'#a98ed2',3);}
    else if(type==='katana'){line(-26,0,17,0,'#41333a',6);for(let i=-1;i<4;i++)line(-20+i*8,-3,-16+i*8,3,'#bc9b78',1.4);line(13,-11,15,10,'#d1aa65',3);ctx.strokeStyle='#d5dedb';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(17,0);ctx.quadraticCurveTo(71,-8,105,-23);ctx.stroke();line(20,-2,101,-22,'#f8f0d8',1.5);}
    else if(type==='dualaxes'){AshBossArt.axe(ctx,{scale:.62,palette:'ordinary'});}
    else if(type==='towerShield'){
      path([[-13,-33],[0,-38],[14,-33],[17,23],[8,32],[-8,32],[-16,23]],'#566567',2,true,true);
      path([[-9,-29],[0,-33],[10,-29],[12,21],[6,27],[-6,27],[-11,21]],'#85938e',1,true,true);
      line(0,-29,0,25,'#c4c4aa',2);line(-10,-17,10,-17,'#b4bda8',2);circle(0,0,5,'#b8a579');
    }
    else if(type==='staff'){line(-42,0,84,0,'#6b5040',6);line(-34,-2,72,-2,'#b79866',2);circle(91,0,15,color);circle(91,0,8,'#e7d9af');}
    else if(type==='holyStaff'){line(-41,0,79,0,'#d0bb82',6);line(-35,-2,65,-2,'#fff0be',2);path([[78,-13],[92,-21],[106,-13],[106,13],[92,21],[78,13]],'#e8ddad',2,true,true);circle(92,0,10,'#fff5c9');line(81,-1,103,-1,'#fffdf0',2);}
    else if(type==='shield'){path([[0,-34],[33,-31],[49,-8],[46,26],[23,45],[-3,26]],'#69767b',3,true,true);path([[2,-30],[30,-27],[42,-8],[39,24],[23,37],[1,23]],'#aab3aa',2,true,true);circle(21,0,9,color);}
    else if(type==='bow'){
      ctx.beginPath();ctx.arc(7,0,34,-1.28,1.28);ctx.strokeStyle='#c5ae82';ctx.lineWidth=3;ctx.stroke();
      path([[17,-32],[17-pull,0],[17,32]],'#a9c3b7',1);line(-3,0,45,0,'#d1d6bd',2);
    }else if(type==='javelin'){
      // Light throwing spear: narrow leaf-shaped head and a balanced wooden shaft.
      line(-37,0,68,0,'#8f7656',3.6);line(-18,-1,53,-1,'#b6a07e',1.1);path([[65,-4],[98,0],[65,4],[70,0]],'#d7e1d8',1,true,true);line(62,-4,83,0,'#f3eee0',1);line(-37,-3,-34,3,'#c09d67',2);
    }else if(type==='net'){
      ctx.lineWidth=2.5;ctx.strokeStyle='#a4b7ad';ctx.beginPath();ctx.arc(33,0,14,-1.2,1.2);ctx.stroke();line(-15,0,20,0,'#887c65',4);
    }else if(type==='spear'||type==='halberd'){
      line(-43,0,91,0,'#a79a7c',4);path([[84,-4],[118,0],[84,5]],'#d8e0cc',1,true,true);
      if(type==='halberd'){path([[68,-3],[66,-24],[90,-28],[93,-13],[84,0]],'#aebcc0',1,true,true);line(66,-24,90,-28,'#e5dfc4',2);}
      line(69,-6,74,8,'#986953',3);
    }else if(type==='crossbow'){
      line(-18,0,48,0,'#b4a082',7);path([[31,-29],[15,-21],[12,0],[15,21],[31,29]],'#aebbb0',3);line(31,-29,31,29,'#c3d3c1');line(0,0,59,0,color,2);
    }else if(type==='axe'){
      // Reuse the actual final BOSS axe mesh at regular-enemy size, with a muted steel/wood palette.
      AshBossArt.axe(ctx,{scale:1.07,palette:'ordinary'});
    }else if(type==='hammer'){
      // Independent sledgehammer geometry: shorter grip-to-head distance and a
      // centered rectangular striking block, never the axe crescent silhouette.
      line(-42,0,82,0,'#44352b',8);line(-42,-1,81,-1,'#9b7955',5);
      line(-35,-3,65,-3,'#cf9d62',1.5);line(-37,4,-30,7,'#aa7c4f',2);
      path([[68,-20],[94,-23],[104,-15],[105,14],[96,22],[69,20],[63,10],[63,-10]],'#747f82',2,true,true);
      path([[69,-18],[93,-20],[100,-14],[78,-11]],'#b6c0bd',1,true,true);
      path([[96,-21],[106,-15],[107,14],[97,22],[94,15],[95,-15]],'#596467',1,true,true);
      line(72,-14,72,14,'#d7cfb3',2);line(79,-17,98,-18,'#d9e0d9',1.5);
    }else if(type==='boss'){
      line(-18,0,65,0,'#8f7a61',8);ctx.fillStyle='#646a61';ctx.fillRect(52,-28,33,56);
      ctx.fillStyle='#a09a83';ctx.fillRect(53,-28,7,56);path([[52,-28],[85,-28],[90,-20],[90,21],[85,28]],'#b7ad91',2);
      line(58,-20,81,-20,'#c3b59a',2);line(65,-12,74,14,'#4b5650',2);
    }else if(type==='gun'){
      line(-15,0,50,0,'#6f6a60',8);line(42,0,80,0,'#a9ada4',5);ctx.fillStyle='#765c45';ctx.fillRect(-8,3,22,10);line(76,-5,88,0,'#d1c9a5',2);
    }else if(type==='chain'){
      line(-10,0,30,0,'#88745a',5);for(let i=0;i<5;i++)circle(35+i*10,Math.sin(i*2)*2,4,'#9da49d',true,2);path([[78,-3],[92,-13],[89,0],[96,8],[80,5]],'#c3c8b7',1,true,true);
    }else if(type==='horn'){
      ctx.beginPath();ctx.arc(15,0,28,-1.0,1.0);ctx.strokeStyle='#c6aa72';ctx.lineWidth=8;ctx.stroke();circle(39,0,9,'#856c4e',true,4);
    }else if(type==='banner'){
      line(-25,0,82,0,'#8c7657',5);path([[45,-4],[79,-4],[75,-42],[47,-34]],color,1,true,true);line(47,-34,75,-42,'#e1d3af',1);
    }else if(type==='bomb'){
      line(-8,0,22,0,'#7f6d55',5);circle(39,0,14,'#7b4b3f');line(39,-14,48,-26,'#d2a65e',2);
    }else if(type==='organic'){
      ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(20,-13,58,0);ctx.quadraticCurveTo(73,8,86,0);ctx.strokeStyle=color;ctx.lineWidth=10;ctx.stroke();for(let i=0;i<4;i++)circle(25+i*13,(i%2?5:-5),3,'#d4d89d');
    }else if(type==='claw'){
      line(-10,0,30,0,color,7);for(let i=-1;i<=1;i++)path([[24,i*5],[67,i*7-7],[77,i*7]],'#c8c5aa',2);
    }else if(type==='boneblade'){
      line(-12,0,6,0,color,7);path([[5,-5],[35,-9],[58,-4],[86,-12],[72,4],[38,7],[5,5]],'#c5c0a0',1,true,true);
    }else{
      line(-14,0,3,0,'#866e51',5);line(3,-9,3,9,'#bfb492',3);
      path([[7,-3],[69,-2],[83,-7],[70,4],[7,4]],color,1,true,true);line(12,4,70,4,'#ecf9e9',1.1);
    }ctx.restore();
  }
  function drawTrainingDummy(e){const x=e.x-camera,y=e.y;ctx.save();ctx.globalAlpha=e.dead?.4:1;line(x,y,x,y-102,'#9d805b',7);line(x-26,y-67,x+27,y-67,'#b29b70',7);ellipse(x,y-63,21,29,'#a99a68');for(let i=-3;i<=3;i++)line(x+i*5,y-87,x+i*6,y-39,'#d4be80',1);ellipse(x,y-108,14,16,'#c4b483');path([[x-6,y-112],[x-3,y-107],[x-6,y-102]],'#554b38',2);path([[x+6,y-112],[x+3,y-107],[x+6,y-102]],'#554b38',2);line(x-9,y-96,x+9,y-96,'#69543a',2);line(x-17,y-78,x+17,y-78,'#715e45',3);line(x-18,y-47,x+18,y-47,'#715e45',3);if(e.dummyMode!=='idle'){const q=e.state==='windup'?e.t/(e.attack?.wind||1):e.state==='active'?1:0;if(e.dummyMode==='slash')line(x+20,y-63,x+e.face*(35+Math.sin(q*2)*45),y-108+q*45,'#cdd9d5',4);else{ctx.strokeStyle='#c1a67b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+e.face*29,y-73,26,-1.3,1.3);ctx.stroke();}}ctx.globalAlpha=1;ctx.fillStyle='#172326';ctx.fillRect(x-39,y-145,78,5);ctx.fillStyle='#d4937a';ctx.fillRect(x-39,y-145,78*e.hp/e.maxHp,5);woundBar(e,x-39,y-145,78,5);ctx.fillStyle='#dec38c';ctx.fillRect(x-39,y-136,78*e.posture/e.maxPosture,3);ctx.fillStyle='#bfcac0';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(AshI18n.t(e.dummyMode==='idle'?'不攻击':e.dummyMode==='slash'?'劈砍':'射击')+' '+Math.round(e.hp)+' / '+e.maxHp,x,y-154);ctx.restore();}
  function drawGroundDrag(e){
    const d=e.groundDrag,q=clamp(d.t/d.duration,0,1),s=e.scale||1,x=e.x-camera,y=e.y;
    // Clip at the ground before translating the body: feet disappear first.
    const sink=d.boss&&d.source!=='sealingNail'?Math.sin(q*Math.PI)*42*s:Math.pow(q,3)*(165*s+(e.z||0));
    const opening=Math.min(1,q/.12,(1-q)/.16),rx=(42*s+12)*Math.max(.05,opening);
    ctx.save();ctx.shadowColor='#aa64ef';ctx.shadowBlur=20;
    ellipse(x,y,rx,11*s,'#251035');ellipse(x,y,rx*.88,7*s,'#6835a3');ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(x-400*s,-1000,800*s,y+1002);ctx.clip();ctx.translate(0,sink);
    if(TYPES[e.type]?.final)drawDemon(e);else fighter(e,false);
    ctx.restore();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#b06bff';ctx.shadowBlur=12;
    ctx.strokeStyle='#c185ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y+2,rx,9*s,0,0,Math.PI);ctx.stroke();
    for(let i=0;i<8;i++){const a=i*TAU/8+q*3;circle(x+Math.cos(a)*rx,y+Math.sin(a)*7*s-4*Math.sin(q*Math.PI),1.5,'#e5bdff');}
    ctx.restore();
  }
  function minRed(stacks){return Math.min(225,170+stacks*11);}
  function guardWarning(e){return e.attack?.action==='guard'||e.attack?.flags?.some(f=>['guardStance','parryStance','spikeGuard','shieldAdvance'].includes(f));}
  function warningGlint(x,y,opacity=1,size=1,guard=false){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.globalAlpha=opacity;ctx.shadowColor=guard?'#ff9b30':'#ff514b';ctx.shadowBlur=22;circle(0,0,5,guard?'#fff2cb':'#ffe6c7');line(-31,0,31,0,guard?'#ffad35':'#ff574a',3);line(0,-20,0,20,guard?'#ffc052':'#ff6d54',2);circle(0,0,16,guard?'#ff9b30':'#ff6a58',true,1);ctx.restore();}
  function mistCloud(x,y,r,alpha,color){ctx.save();ctx.globalAlpha=.25*alpha;for(let i=0;i<9;i++){const a=i*TAU/9+realTime*.18;fog(x+Math.cos(a)*r*.55,y-45+Math.sin(a)*30,r*.48,55,color);}ctx.restore();}
  function poisonOrb(x,y,color='#9fce78'){circle(x,y,7,color);circle(x-8,y+2,4,'rgba(137,181,91,.55)');line(x-10,y,x-28,y,'rgba(152,205,105,.55)',4);}
  const annihilationShapes=new WeakMap();
  function annihilationShape(e,x,y,scale){
    let shape=annihilationShapes.get(e);if(shape)return shape;
    const size=Math.ceil(320*scale),ox=size/2,oy=size*.8;
    const mask=document.createElement('canvas');mask.width=mask.height=size;
    const c=mask.getContext('2d',{willReadFrequently:true}),main=ctx;
    // Freeze the first death silhouette; later frames must never draw a falling corpse.
    c.translate(ox-x,oy-y);
    try{ctx=c;fighterBody({...e,deathT:0,timeSealT:0,flash:0});}finally{ctx=main;}
    c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#fff';c.fillRect(0,0,size,size);c.globalCompositeOperation='source-over';
    const pixels=c.getImageData(0,0,size,size).data,dust=[],step=Math.max(2,Math.ceil(2.4*scale));
    for(let py=0;py<size;py+=step)for(let px=0;px<size;px+=step){
      if(pixels[(py*size+px)*4+3]<96)continue;
      const seed=((px*73+py*37+(e.id||1)*19)%997)/997;
      dust.push({x:px-ox,y:py-oy,seed,size:step*(.45+seed*.4)});
    }
    shape={mask,ox,oy,dust};annihilationShapes.set(e,shape);return shape;
  }
  const flavorDeathShapes=new WeakMap();
  function flavorDeathAnchor(e,x,y,scale,height){
    const visual=enemyVisual(e.type),anatomy=visual?.anatomy;
    const rotation=['unclean_mage','void_priest'].includes(e.type)?e.deathT*.9:
      anatomy&&anatomy!=='humanoid'?AshMotion.creaturePose(e,anatomy,game.time).rotation:
      AshMotion.samplePose(e,false,game.time).rotation||0;
    const angle=(e.face||1)*rotation;
    return {x:x+Math.sin(angle)*height*scale,y:y-Math.cos(angle)*height*scale,angle};
  }
  function flavorDeathShape(e,x,y,scale){
    let shape=flavorDeathShapes.get(e);
    if(!shape){
      const size=Math.ceil(420*scale),image=document.createElement('canvas');image.width=image.height=size;
      let cracks=null;if(e.deathFlavor==='curse'){cracks=document.createElement('canvas');cracks.width=cracks.height=size;}
      shape={image,cracks,dust:[],ox:size/2,oy:size*.72,size};flavorDeathShapes.set(e,shape);
    }
    const {image,cracks,dust,ox,oy,size}=shape;
    const c=image.getContext('2d',{willReadFrequently:true}),main=ctx;
    // Reuse the canvas, but render the native falling pose at the current death time.
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,size,size);c.save();c.translate(ox-x,oy-y);
    try{ctx=c;fighterBody({...e,timeSealT:0,flash:0,effects:{},auraActive:false,deathSnapshot:true});}finally{ctx=main;c.restore();}
    c.setTransform(1,0,0,1,0,0);
    if(cracks){
      const cc=cracks.getContext('2d');cc.setTransform(1,0,0,1,0,0);cc.globalCompositeOperation='source-over';cc.clearRect(0,0,size,size);
      // Sample fragments once after the normal fall has completed, never per frame.
      if(!shape.dustSampled&&e.deathT>=.4){
        shape.dustSampled=true;const pixels=c.getImageData(0,0,size,size).data,step=Math.max(5,Math.ceil(9*scale)),samples=[];
        for(let py=0;py<size;py+=step)for(let px=0;px<size;px+=step){
          if(pixels[(py*size+px)*4+3]<96)continue;
          const seed=((px*73+py*37+(e.id||1)*19)%997)/997;samples.push({x:px-ox,y:py-oy,seed});
        }
        for(let i=0;i<Math.min(48,samples.length);i++)dust.push(samples[Math.floor(i*samples.length/Math.min(48,samples.length))]);
      }
      const anchor=flavorDeathAnchor(e,ox,oy,scale,55);
      cc.translate(anchor.x,anchor.y);cc.rotate(anchor.angle);cc.strokeStyle='#e695cf';cc.lineWidth=1.5*scale;
      for(let i=0;i<7;i++){
        const a=i*TAU/7+.2,dx=Math.cos(a),dy=Math.sin(a);cc.beginPath();cc.moveTo(0,0);
        for(let j=1;j<=5;j++){const r=j*28*scale,jitter=Math.sin(i*7+j*3)*11*scale;cc.lineTo(dx*r-dy*jitter,dy*r+dx*jitter);}cc.stroke();
      }
      cc.setTransform(1,0,0,1,0,0);cc.globalCompositeOperation='destination-in';cc.drawImage(image,0,0);
    }
    return shape;
  }
  function drawSplitDeath(e,shape,x,y,scale,t){
    const horizontal=e.deathFlavor==='shadowSever',q=horizontal?clamp(t/.25,0,1):clamp((t-.08)/.55,0,1),anchor=flavorDeathAnchor(e,x,y,scale,35),a=(horizontal?0:e.deathCutAngle??-.32)+anchor.angle,cx=anchor.x,cy=anchor.y;
    ctx.globalAlpha*=Math.max(0,1-t/.8);
    ctx.translate(cx,cy);ctx.rotate(a);
    for(const sign of [-1,1]){
      ctx.save();ctx.translate(sign*q*(horizontal?9:19)*scale,sign*q*(horizontal?6:10)*scale);
      ctx.beginPath();ctx.rect(-shape.size,sign<0?-shape.size:0,shape.size*2,shape.size);ctx.clip();
      ctx.rotate(-a);ctx.drawImage(shape.image,x-cx-shape.ox,y-cy-shape.oy);ctx.restore();
    }
  }
  function drawCurseDeath(e,shape,x,y,scale,t){
    const q=clamp((t-.4)/.36,0,1),fade=Math.max(0,1-t/.8),baseAlpha=ctx.globalAlpha;
    ctx.save();ctx.globalAlpha=baseAlpha*fade;
    ctx.filter='saturate(.65) brightness(.8)';
    ctx.beginPath();ctx.moveTo(x-shape.ox,y-shape.oy);ctx.lineTo(x+shape.size-shape.ox,y-shape.oy);
    for(let i=12;i>=0;i--)ctx.lineTo(x-shape.ox+i*shape.size/12,y+shape.size-shape.oy-q*shape.size+Math.sin(i*5.1)*q*8*scale);
    ctx.closePath();ctx.clip();ctx.drawImage(shape.image,x-shape.ox,y-shape.oy);
    ctx.filter='none';ctx.globalCompositeOperation='lighter';ctx.globalAlpha=baseAlpha*fade*Math.min(1,t/.09)*.7;
    ctx.drawImage(shape.cracks,x-shape.ox,y-shape.oy);ctx.restore();
    if(t>.4){ctx.save();ctx.globalAlpha=baseAlpha*fade;for(const p of shape.dust){
      const a=p.seed*TAU,drift=q*(18+p.seed*30)*scale,xx=x+p.x+Math.cos(a)*drift,yy=y+p.y-q*(16+p.seed*30)*scale;
      ctx.fillStyle=p.seed<.45?'#ba68a6':'#5b345c';ctx.fillRect(xx,yy,(1.5+p.seed)*scale,(1.5+p.seed)*scale);
    }ctx.restore();}
  }
  const windDeathShapes=new WeakMap();
  function windDeathShape(e,x,y,scale){
    let shape=windDeathShapes.get(e);if(shape)return shape;
    const size=Math.ceil(420*scale),ox=size/2,oy=size*.72,source=document.createElement('canvas');source.width=source.height=size;
    const c=source.getContext('2d',{willReadFrequently:true}),main=ctx,record=rig.records.get(e.id);
    // Render a canonical first-death pose, without combat flashes, shadows or aura.
    rig.records.delete(e.id);c.translate(ox-x,oy-y);
    try{ctx=c;fighterBody({...e,face:1,z:0,deathT:0,deathSnapshot:true,flash:0,red:0,timeSealT:0,auraActive:false,effects:{}});}
    finally{ctx=main;if(record)rig.records.set(e.id,record);else rig.records.delete(e.id);}
    c.setTransform(1,0,0,1,0,0);shape=AshWindDeath.capture(source,ox,oy);if(shape)windDeathShapes.set(e,shape);return shape;
  }
  const medusaShapes=new WeakMap();
  function medusaStoneShape(e){
    let shape=medusaShapes.get(e);if(shape&&shape.pose===e.medusaPose&&shape.gold===!!e.medusaGold)return shape;
    const scale=e.scale||1,size=Math.ceil((TYPES[e.type]?.final?600:460)*scale),ox=size/2,oy=size*.8,x=e.x-camera,y=e.y-(e.z||0);
    const mask=document.createElement('canvas');mask.width=mask.height=size;const c=mask.getContext('2d'),main=ctx;
    c.translate(ox-x,oy-y);c.filter=e.medusaGold?'grayscale(1) sepia(1) saturate(3.2) brightness(1.15)':'grayscale(1) brightness(.8)';
    try{ctx=c;fighterBody({...e.medusaPose,x:e.x,y:e.y,z:e.z,hp:e.hp,posture:e.posture,flash:0,woundSnapshot:true,medusaRender:true,medusaRenderTime:e.medusaPose?.medusaRenderTime});}finally{ctx=main;}
    c.setTransform(1,0,0,1,0,0);c.filter='none';c.globalCompositeOperation='source-atop';c.globalAlpha=.25;c.fillStyle=e.medusaGold?'#dab34c':'#9da08e';c.fillRect(0,0,size,size);
    shape={mask,ox,oy,pose:e.medusaPose,gold:!!e.medusaGold};medusaShapes.set(e,shape);return shape;
  }
  let medusaGazeFX=[];
  function fighter(e,isPlayer=false,ghost=false){
    if(e.dead&&e.noCorpse&&e.deathFlavor!=='annihilation')return;
    const kind=!isPlayer&&!ghost&&e.dead?e.deathFlavor:null;
    if(!kind){
      if(!isPlayer&&!ghost&&(e.medusaGold||e.medusaUntil>game.time)){
        const stone=medusaStoneShape(e);ctx.drawImage(stone.mask,e.x-camera-stone.ox,e.y-(e.z||0)-stone.oy);return;
      }
      return fighterBody(e,isPlayer,ghost);
    }
    const t=e.deathT||0,x=e.x-camera,y=e.y-(e.z||0),scale=e.scale||1;
    ctx.save();
    if(kind==='wind'){
      if(t<.8&&x>=-240&&x<=W+240)AshWindDeath.draw(ctx,windDeathShape(e,x,e.y,scale),t,x,y,1,e.face||1);
      ctx.restore();return;
    }
    if(kind==='bleed'){
      if(t>=.8){ctx.restore();return;}
      // Mild loss of color only: retain material colors and the normal fall, unlike soul death.
      ctx.filter=`saturate(${1-.28*clamp(t/.18,0,1)}) brightness(.98)`;
      fighterBody(e);ctx.restore();return;
    }
    if(kind==='rift'||kind==='shadowSever'||kind==='curse'){
      if(t>=.8||x<-240||x>W+240){ctx.restore();return;}
      const shape=flavorDeathShape(e,x,y,scale);
      if(kind==='curse')drawCurseDeath(e,shape,x,y,scale,t);else drawSplitDeath(e,shape,x,y,scale,t);
      ctx.restore();return;
    }
    if(kind==='annihilation'){
      if(t>=.76||x<-240||x>W+240){ctx.restore();return;}
      const shape=annihilationShape(e,x,y,scale),q=clamp((t-.18)/.58,0,1);
      if(t<.18)ctx.drawImage(shape.mask,x-shape.ox,y-shape.oy);
      else for(const p of shape.dust){
        const a=p.seed*TAU,drift=(8*q+q*q*(42+p.seed*85))*scale;
        const px=x+p.x+Math.cos(a)*drift+q*28*scale,py=y+p.y+Math.sin(a)*drift*.48-q*(22+p.seed*46)*scale;
        ctx.globalAlpha=(1-q)*(1-q)*(.7+p.seed*.3);ctx.fillStyle=p.seed<.16?'#302d33':'#090a0d';
        const r=p.size*(1-q*.65);ctx.fillRect(px-r/2,py-r/2,r,r);
      }
      ctx.restore();return;
    }
    if(kind==='blackHole'){if(t>=.6){ctx.restore();return;}const size=Math.max(.01,1-t/.52);ctx.translate(x,y);ctx.rotate(t*5);ctx.scale(size,size);ctx.translate(-x,-y);ctx.globalAlpha*=Math.max(0,1-t/.6);fighterBody(e);ctx.restore();return;}
    if(['ice','stone','goldStone'].includes(kind)&&t>.32){const q=clamp((t-.32)/.6,0,1);ctx.globalAlpha=1-q;for(let i=0;i<16;i++){const a=i*2.399,xx=x+Math.cos(a)*(12+q*46)*scale,yy=y-(i%5)*19*scale*(1-q)+Math.sin(a)*12*q;ctx.save();ctx.translate(xx,yy);ctx.rotate(a+q*2);path([[-6,-9],[3,-13],[9,0],[0,7]],kind==='goldStone'?(i%2?'#f4d87d':'#af7e28'):kind==='stone'?(i%2?'#bcc0b4':'#73796f'):(i%2?'#b8eafa':'#73b7d1'),1,true,true);ctx.restore();}ctx.restore();return;}
    if(kind==='stone'||kind==='goldStone'){const stone=medusaStoneShape(e);ctx.drawImage(stone.mask,x-stone.ox,y-stone.oy);ctx.restore();return;}
    ctx.filter=kind==='fire'?`grayscale(1) brightness(${Math.max(.24,1-t*2)})`:kind==='lightning'?(t<.34?'grayscale(1) brightness(3)':'grayscale(1) brightness(.25)'):kind==='soul'?'grayscale(1) brightness(1.45)':kind==='poison'?'grayscale(1) sepia(1) saturate(2.2) hue-rotate(28deg)':'grayscale(1) sepia(1) saturate(2) hue-rotate(145deg)';
    fighterBody(kind==='ice'?{...e,deathT:0}:e);ctx.filter='none';
    if(kind==='fire'&&t<.9){ctx.globalAlpha=1-t/.9;for(let i=0;i<7;i++)AshBattleArt.flame(ctx,x+(i-3)*10*scale,y-i%3*16*scale,25+i%3*10,i,realTime,'#ea8b43');}
    ctx.restore();
  }
  function fighterBody(e,isPlayer=false,ghost=false){
    if(e.furnaceConsumed)return;
    const modelTime=e.medusaRender?(e.medusaRenderTime??game.time):game.time;
    if(isPlayer)e={...e,id:0,effects:{...e.effects,...Object.fromEntries(Object.entries(e.enemyDots||{}).filter(([,v])=>v.remaining>0))}};
    if(!isPlayer&&e.state==='burrow'){const x=e.x-camera,targetX=e.burrowTarget.x-camera,targetY=e.burrowTarget.y,burrowScale=TYPES[e.type]?.bossKind==='claw_beast'?1.8:1;if(TYPES[e.type]?.bossKind==='claw_beast')AshBossModels.burrow(ctx,e,{x,y:e.y,time:game.time});else ellipse(x,e.y,35,9,'#35283c');ctx.save();ctx.strokeStyle='#e95855';ctx.lineWidth=3;ctx.shadowColor='#ed343a';ctx.shadowBlur=13;ctx.beginPath();ctx.ellipse(targetX,targetY,65*burrowScale,22*burrowScale,0,0,TAU);ctx.stroke();ctx.restore();return;}
    if(e.dummy){drawTrainingDummy(e);return;}
    if(e.medusaRender&&TYPES[e.type]?.final){AshBossArt.draw(ctx,{x:e.x-camera,y:e.y-(e.z||0),scale:1.45,slot:TYPES[e.type].slot,time:modelTime,face:e.face,entity:e});return;}
    const capture=e.furnaceCapture,cq=capture?.q||0;const s=(isPlayer?(e.visualScale||1.04):(e.scale||1)*(e.mindControlT>0&&run?.hasDual('frostTrace','mindControl')&&run?.hasDual('elementAffinity','synergy')?1.2:1))*(1-cq*.9),face=e.face||1,x=(capture?capture.x+(capture.toX-capture.x)*cq:e.x)-camera,y=capture?capture.y+(capture.toY-capture.y)*cq:e.y,z=e.z||0;
    if(x<-240||x>W+240)return;
    if(!isPlayer&&!ghost&&(TYPES[e.type]?.bossKind||TYPES[e.type]?.bossModel)){const base=TYPES[e.type];AshBossModels.draw(ctx,e,base.bossModel?{...base,bossKind:base.bossModel}:base,{x,y,scale:s,time:modelTime});return;}
    if(!isPlayer&&!ghost&&['unclean_mage','void_priest'].includes(e.type)){ctx.save();ctx.translate(x,y-z);ctx.scale(face*s,s);AshEnemyArt.voidCaster(ctx,e,modelTime);ctx.restore();if(!e.woundSnapshot)drawNonHumanoidOverlay(e,x,y,s,face,[35,-70]);return;}
    const p=e.medusaRender?AshMotion.samplePose(e,false,modelTime):ghost?AshMotion.samplePose({...e,state:'dash'},true,game.time):rig.get(e,isPlayer,mode==='title'?realTime:game.time);
    const rc=isPlayer&&!ghost?reviveCinematic:null;let reviveTilt=0,reviveDrop=0;
    if(rc){const q=clamp(rc.t/rc.life,0,1),smooth=v=>v*v*(3-2*v),fallEnd=.28;if(q<fallEnd){const k=smooth(q/fallEnd);reviveTilt=1.22*k;reviveDrop=17*k;}else{const k=smooth((q-fallEnd)/(1-fallEnd));reviveTilt=1.22*(1-k);reviveDrop=17*(1-k);}}
    const base=!isPlayer?(TYPES[e.type]||{}):null,visual=!isPlayer?{...enemyVisual(e.type)}:null;
    if(visual&&e.corpseStacks&&!['void_aggregate','e57'].includes(e.type)){visual.body='rgb('+minRed(e.corpseStacks)+',75,70)';visual.cloth='rgb('+Math.min(170,100+e.corpseStacks*13)+',55,48)';}
    if(visual&&e.type==='e38')visual.anatomy=e.shellBroken?'humanoid':'cocoon';
    if(!isPlayer&&!ghost&&e.auraActive&&base.aura!=='mist'){ctx.save();ctx.globalAlpha=.12+.04*Math.sin(realTime*4);ctx.strokeStyle=e.type==='e15'?'#f5cb65':'#9bc566';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,base.auraRadius,base.auraRadius/1.5,0,0,TAU);ctx.stroke();ctx.restore();}
    if(!isPlayer&&!ghost&&visual?.anatomy&&visual.anatomy!=='humanoid'){
      if(cq){ctx.save();ctx.translate(x,y-z);ctx.rotate(cq*TAU*2);ctx.translate(-x,-y+z);}const anchor=drawNonHumanoidEnemy(e,visual,x,y,z,s,face);if(cq)ctx.restore();if(!e.dead&&!e.woundSnapshot)drawEnemyAttackVisual(e,{hand:anchor},visual,x,y,z,s,face);if(!e.dead&&!e.woundSnapshot)drawNonHumanoidOverlay(e,x,y,s,face,anchor);return;
    }
    const j=AshMotion.joints(p),boss=!isPlayer&&isBoss(e),armored=!isPlayer&&!!base?.armor;
    if(!isPlayer&&e.type==='heavy_axe'){j.back=[j.hand[0]-18*Math.cos(p.angle),j.hand[1]-18*Math.sin(p.angle)];j.backElbow=[j.chest[0]-7,j.chest[1]+16];}
    if(!isPlayer&&base?.weapon==='towerShield'){j.back=[j.hand[0]+6,j.hand[1]+15];j.backElbow=[j.chest[0]-9,j.chest[1]+17];}
    const bodyColor=ghost?(e.ghostColor||'#95e6de'):isPlayer?(e.ultimateForm>0?'#ffc355':run?.upgrades?.iceBarrier&&run?.effects?.v11?.iceBarrier?.ready?'#c5dce7':run?.upgrades?.bloodthirst>=2&&(e.hp+e.grayHp)/e.maxHp<.25?(run?.effects?.dualState.immortalBlood>0?'#a71836':'#e96464'):'#d7e4dc'):e.corpseStacks&&!['void_aggregate','e57'].includes(e.type)?'rgb('+minRed(e.corpseStacks)+',75,70)':visual?.body||base?.color||'#d3dcd7';
    let color=bodyColor;if(e.flash>0||isPlayer&&e.hurt>.12)color='#fff7de';
    if(!ghost&&!e.deathSnapshot){const dl=sampleDaylight((run?.time||0)+(run?.dayOffset||0));ctx.save();ctx.globalAlpha=.12+dl.light*.16;line(x,y,x+dl.shadowX*s,y+12+Math.abs(dl.shadowX)*.2,'#07151c',16*s);ctx.restore();ellipse(x,y+4,25*s+z*.07,7*s,'#06121970');ellipse(x+5,y+10,38*s,3,'#8ca5980c');}
    if(isPlayer&&!ghost&&!e.dead)drawHiddenEdgeTrails(x,y,z,s,face,run?.effects?.v11?.hiddenEdge?.charges||0);
    ctx.save();ctx.translate(x,y-z+reviveDrop);ctx.scale(face*s,s);if(!isPlayer&&e.timeSealT>0){ctx.filter='grayscale(.68) sepia(.12) hue-rotate(150deg) saturate(2.5) brightness(1.28)';ctx.translate(Math.sin(realTime*37+(e.id||0))*2.4,0);}
    ctx.globalAlpha=e.deathSnapshot?1:e.dead?(e.rushCorpseUntil>run.time?1:Math.max(0,1-e.deathT/.8)):e.spawnDelay>0?.25+(1-e.spawnDelay/.7)*.5:1;if(!isPlayer&&e.timeSealT>0)ctx.globalAlpha*=.58;if(isPlayer&&e.stealth)ctx.globalAlpha*=.34;
    if(ghost)ctx.globalAlpha=(e.ghostAlpha??.26)*(1-(e.t||0)/Math.max(.01,e.life||1));
    ctx.rotate((p.rotation||0)+(e.state==='knockdown'?face*.82:0)+reviveTilt*face+cq*TAU*2);
    if(!isPlayer&&!ghost)drawEnemyBack(j,visual,boss);
    path([j.hip,j.rearKnee,j.rear],ghost?color:visual?.cloth||'#7b918b',boss?8:5);
    path([j.chest,j.backElbow,j.back],ghost?color:visual?.cloth||'#83958e',boss?6:4);
    path([j.hip,j.knee,j.front],color,boss?9:5);
    line(j.front[0]-2,j.front[1],j.front[0]+7,j.front[1],color,4);
    line(j.rear[0]-2,j.rear[1],j.rear[0]+6,j.rear[1],color,4);
    if(boss){
      ctx.save();ctx.translate((j.hip[0]+j.chest[0])/2,(j.hip[1]+j.chest[1])/2);ctx.rotate(-p.lean);
      ellipse(0,0,22,29,visual?.cloth||'#8c8f7d');ellipse(4,-1,19,26,color);path([[-14,-18],[-5,0],[16,18]],visual?.accent||'#72685a',5);ctx.restore();
      line(j.hip[0]-18,j.hip[1],j.hip[0]+18,j.hip[1],visual?.cloth||'#544d43',7);circle(j.hip[0],j.hip[1],4,visual?.detail||'#d5b98a');
    }else line(...j.hip,...j.chest,color,6);
    if(!isPlayer&&!ghost)drawEnemyTorso(j,visual,boss,armored);
    if(!isPlayer&&!ghost&&['e34','undead_samurai','immortal_shield'].includes(e.type)){
      const green=e.revived?'#c4ffe0':'#78dca3',cx=j.chest[0],cy=j.chest[1];
      if(e.type==='e34'){
        for(let i=0;i<3;i++)line(cx-8+i*7,cy+1,cx-5+i*7,j.hip[1]-4,green,1.7);
        path([[cx-12,cy-10],[cx-23,cy+3],[cx-15,cy+9]],visual.cloth,2,true,true);
      }else if(e.type==='undead_samurai'){
        path([[cx-12,cy-8],[cx-26,cy+6],[cx-19,cy+15],[cx-28,j.hip[1]+12],[cx-9,j.hip[1]+3]],visual.cloth,2,true,true);
        path([[cx+11,cy-8],[cx+22,cy+6],[cx+13,cy+15]],visual.cloth,2,true,true);
        for(let i=0;i<3;i++)line(cx-9+i*7,cy+4,cx-4+i*7,cy+15,green,1.6);
      }else{
        path([[cx-17,cy-11],[cx-28,cy-22],[cx-20,cy+2]],visual.cloth,2,true,true);
        path([[cx+16,cy-11],[cx+28,cy-22],[cx+20,cy+2]],visual.cloth,2,true,true);
        line(cx-8,cy+3,cx+8,cy+17,green,2);
        line(cx+8,cy+3,cx-8,cy+17,green,2);
      }
    }
    if(!isPlayer&&!ghost&&e.type==='bone_spitter'){for(let i=0;i<6;i++){const bx=j.chest[0]-19+i*7,by=j.chest[1]-19-(i%2)*5;path([[bx,by],[bx-4,by-20-i%3*5],[bx+6,by-3]],'#d7d2b8',1,true,true);}}
    if(!isPlayer&&!ghost&&e.type==='e35'){for(const [ox,oy] of [[-15,4],[7,2],[2,16]])path([[j.chest[0]+ox,j.chest[1]+oy],[j.chest[0]+ox+7,j.chest[1]+oy-23],[j.chest[0]+ox+15,j.chest[1]+oy+5]],'#99dce3',1,true,true);}
    if(!isPlayer&&!ghost&&e.type==='e38'&&!e.shellBroken){path([[j.chest[0]-19,j.chest[1]-32],[j.chest[0]+15,j.chest[1]-39],[j.hip[0]+19,j.hip[1]+5],[j.hip[0]-18,j.hip[1]+6]],'#8c8973',2,true,true);}
    if(!boss&&armored){
      path([[j.chest[0]-11,j.chest[1]-2],[j.chest[0]+12,j.chest[1]+2],[j.hip[0]+13,j.hip[1]-4],[j.hip[0]-12,j.hip[1]-3]],'#65736e',1,true,true);
      line(j.chest[0]-10,j.chest[1]+8,j.chest[0]+11,j.chest[1]+10,'#bec4af',2);
    }
    if(!isPlayer&&base?.weapon==='dual')weapon(...j.back,p.backAngle,'sword',visual?.detail||color,.72);
    if(!isPlayer&&base?.weapon==='dualaxes')weapon(...j.back,p.backAngle,'dualaxes',visual?.detail||color,1);
    if(!isPlayer&&['fists','crystalFist'].includes(base?.weapon))weapon(...j.back,p.backAngle,base.weapon,visual?.detail||color,1);
    if(!isPlayer&&base?.weapon==='towerShield'){line(j.back[0],j.back[1],j.hand[0]-3,j.hand[1]+13,color,6);circle(j.hand[0]-3,j.hand[1]+13,4,color);}
    path([j.chest,j.elbow,j.hand],color,boss?7:4.5);
    circle(...j.head,boss?12:10,color);circle(j.head[0]+2,j.head[1]-1,boss?7:6,ghost?(run?.upgrades.sharpShadow?'#a8afb5':color):'#213033');
    line(j.head[0]+5,j.head[1]-1,j.head[0]+10,j.head[1]-1,isPlayer?'#e0fbeb':e.enraged?'#ff7c61':'#dfc8a4',2);
    if(isPlayer){
      line(j.head[0]-8,j.head[1]-8,j.head[0]+9,j.head[1]-8,'#bf6e55',3.5);
      const wave=Math.sin(realTime*8-(e.vx||0)*.002)*4,xx=j.chest[0],yy=j.chest[1];
      path([[xx-3,yy],[xx-23,yy-2+wave],[xx-48,yy+9+wave],[xx-38,yy+1+wave],[xx-18,yy-8],[xx-3,yy-5]],'#bc6e55',1,true,true);
      line(j.hip[0]-6,j.hip[1],j.hip[0]+6,j.hip[1],'#857c63',5);
    }else if(!ghost){
      drawEnemyHead(j,visual,boss,e.enraged);
      if(['e34','undead_samurai','immortal_shield'].includes(e.type)){
        const glow=e.revived?'#c7ffe5':'#86e9ad';
        line(j.head[0]-6,j.head[1]+1,j.head[0]-2,j.head[1],glow,2.3);
        line(j.head[0]+4,j.head[1],j.head[0]+9,j.head[1]+1,glow,2.3);
        if(e.type==='undead_samurai'){
          path([[j.head[0]-13,j.head[1]-12],[j.head[0]-20,j.head[1]-29],[j.head[0]-5,j.head[1]-17]],visual.cloth,1,true,true);
          path([[j.head[0]+9,j.head[1]-16],[j.head[0]+19,j.head[1]-29],[j.head[0]+15,j.head[1]-10]],visual.cloth,1,true,true);
        }
      }
      if(base?.ranged&&base.stage==='human')line(j.chest[0]-14,j.chest[1]+20,j.chest[0]-23,j.chest[1]-16,visual?.accent||'#8c795b',4);
    }
    const knife=base?.ranged&&e.ammo<=0&&!['katana','boneblade','claw','staff'].includes(base.weapon)&&!/投枪手$/.test(base?.name||'')&&!(['windup','active'].includes(e.state)&&e.attack?.ranged);
    const wt=isPlayer?(run?.hasDual('armorRend','sawStorm')?'chainsaw':'sword'):knife?'dagger':visual?.displayWeapon||base?.weapon||e.type;
    const reachScale=!isPlayer&&e.attack&&!e.attack.ranged?clamp((e.attack.range||base?.reach||120)/(base?.reach||120),.82,1.32):1;
    let weaponX=j.hand[0],weaponY=j.hand[1],weaponAngle=p.angle;
    if(!isPlayer&&(wt==='axe'||wt==='hammer')){const mount=wt==='axe'?{along:-7,across:2,turn:-.08}:{along:3,across:-1,turn:.06},ca=Math.cos(p.angle),sa=Math.sin(p.angle);weaponX+=ca*mount.along-sa*mount.across;weaponY+=sa*mount.along+ca*mount.across;weaponAngle+=mount.turn;}
    if(['towerShield','spikeShield','shield'].includes(wt)){weaponX=j.hand[0]+9;weaponY=j.hand[1]+4;weaponAngle=-((p.rotation||0)+(e.state==='knockdown'?face*.82:0)+cq*TAU*2);}
    if(isPlayer&&!ghost&&!e.dead&&wt==='sword'&&['attack','heavy','thrust','plunge'].includes(e.state))AshCombatFX.swiftEchoes(ctx,weaponX,weaponY,weaponAngle,run?.effects?.swiftStacks()||0,run?.effects?.swiftMax()||6,e.t/Math.max(.01,e.attack?.active||.3));
    weapon(weaponX,weaponY,weaponAngle,wt==='dual'?'sword':wt,isPlayer?color:visual?.detail||color,(boss?.84:e.type==='duelist'?1.1:1)*reachScale*(isPlayer?e.swordScale||1:1),p.bowPull);
    if(isPlayer&&!ghost&&!e.dead&&wt==='sword')drawHiddenEdgeSword(weaponX,weaponY,weaponAngle,run?.effects?.v11?.hiddenEdge?.charges||0);
    if(isPlayer&&wt==='sword'&&run?.upgrades?.peakTiming&&e.state==='charge'&&e.chargeReady){const window=[0,.15,.2,.25][run.upgrades.peakTiming],age=game.time-(e.chargeReadyAt??-Infinity);if(age>=0&&age<=window){const pulse=.78+.22*Math.sin(realTime*30);ctx.save();ctx.translate(weaponX,weaponY);ctx.rotate(weaponAngle);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pulse;ctx.shadowColor='#ffd347';ctx.shadowBlur=18;line(9,0,76,0,'#ffe177',5);line(14,-2,72,-2,'#fff2ad',2);for(let i=0;i<5;i++){const xx=24+i*11,yy=Math.sin(realTime*18+i*2.4)*5;circle(xx,yy,2+i%2,'#ffe485');}ctx.restore();}}
    if(!isPlayer&&e.type==='immortal_shield'){
      ctx.save();ctx.translate(weaponX,weaponY);ctx.rotate(weaponAngle);
      path([[-9,-16],[0,-26],[10,-15],[9,13],[0,22],[-10,12]],'#24433b',2,true,true);
      line(-5,-8,5,8,e.revived?'#c7ffe5':'#78dda3',2.2);
      line(5,-8,-5,8,e.revived?'#c7ffe5':'#78dda3',2.2);
      circle(0,0,3,'#d1ffe3');ctx.restore();
    }
    if(isPlayer&&wt==='sword'&&(run?.effects?.v11?.wind?.amount||0)>=2){const spin=realTime*5.2;ctx.save();ctx.translate(j.hand[0],j.hand[1]);ctx.rotate(p.angle);ctx.globalCompositeOperation='lighter';ctx.shadowColor='#bfeff2';ctx.shadowBlur=9;for(let i=0;i<3;i++){ctx.save();ctx.translate(25+i*20,0);ctx.rotate(spin+i*2.1);ctx.scale(1,.34);ctx.globalAlpha=.58+i*.10;ctx.strokeStyle=i===2?'#efffff':'#b9e9ec';ctx.lineWidth=1.5+i*.35;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,13+i*2,.25,Math.PI*1.72);ctx.stroke();ctx.restore();}ctx.restore();}
    if(isPlayer&&run?.hasDual('potential','soulGreatsword')){const f=run.effects,q=e.state==='charge'?clamp(f.soulGreatsword.stored/100,0,1):e.state==='heavy'?1:0;if(q>0){ctx.save();ctx.translate(j.hand[0],j.hand[1]);ctx.rotate(p.angle);path([[8,-5],[15+q*88,-7],[26+q*88,0],[15+q*88,7],[8,5]],'#191226',1,true,true);line(12,-5,18+q*88,-7,'#79618d',1.5);ctx.restore();}}
    if(isPlayer&&run?.upgrades?.poisonBlade&&run?.effects?.poisonBlade?.ready){
      const pr=run.upgrades.poisonBlade;ctx.save();ctx.translate(j.hand[0],j.hand[1]);ctx.rotate(p.angle);ctx.globalCompositeOperation='lighter';ctx.shadowColor='#9fd86d';ctx.shadowBlur=12+pr*5;line(12,-1,76+pr*5,-1,'rgba(179,230,119,.82)',2.1+pr*.45);for(let i=0;i<3+pr;i++)circle(22+i*13+Math.sin(realTime*4+i)*3,-2+Math.sin(realTime*7+i)*4,1.5+pr*.25,'rgba(194,239,135,.76)');ctx.restore();
    }
    if(e.type==='shield'||/盾弩手$/.test(base?.name||'')){
      const bx=j.back[0]+10,by=j.back[1];path([[bx-12,by-23],[bx+15,by-20],[bx+17,by+15],[bx,by+27],[bx-14,by+13]],'#778579',1,true,true);
      path([[bx-12,by-23],[bx+15,by-20],[bx+17,by+15],[bx,by+27]],'#d0bd91',2);circle(bx,by,5,'#c7af7b');
    }
    ctx.restore();
    if(isPlayer&&!ghost&&run?.effects?.carnage?.buff>0){const life=clamp(run.effects.carnage.buff/6,0,1),pulse=.68+.20*Math.sin(realTime*13);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(.42+.35*life)*pulse;fog(x,y-z-51,43+6*life,72,'rgba(207,53,48,.24)');ctx.strokeStyle='#fa9569';ctx.shadowColor='#ff4d45';ctx.shadowBlur=21;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y-z-45,33+Math.sin(realTime*7)*3,57,0,0,TAU);ctx.stroke();for(let i=0;i<7;i++){const a=realTime*2+i*TAU/7,px=x+Math.cos(a)*28,py=y-z-28+Math.sin(a*1.3)*36;line(px,py,px+Math.cos(a)*7,py-13,'#ffbc83',1.6);}ctx.restore();}
    if(!isPlayer&&!ghost&&!e.dead&&(e.bossThrowWarning||e.bossThrown)){const pulse=.72+.20*Math.sin(realTime*12+(e.id||0));ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(e.bossThrown?.78:.62)*pulse;fog(x,y-z-44*s,39*s,61*s,'#ff30305c');ctx.strokeStyle='#ff544a';ctx.shadowColor='#ff3028';ctx.shadowBlur=18;ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(x,y-z-43*s,31*s,55*s,0,0,TAU);ctx.stroke();ctx.restore();}
    if(!isPlayer&&!ghost&&!e.dead&&!e.woundSnapshot)drawEnemyAttackVisual(e,j,visual,x,y,z,s,face);
    if(ghost||e.dead||e.groundDrag||e.woundSnapshot)return;
    if(!isPlayer&&e.pressureWeakUntil>game.time){
      ctx.save();ctx.strokeStyle='#929699';ctx.lineWidth=1.8;ctx.lineCap='round';
      for(let i=0;i<5;i++){const drift=(realTime*30+i*17)%62,bx=x+(i-2)*15*s,by=y-z-(92-drift)*s;ctx.globalAlpha=.35+.35*Math.sin(Math.PI*drift/62);ctx.beginPath();for(let j=0;j<=8;j++){const xx=bx+Math.sin(j*.7+realTime*3+i)*3*s,yy=by+j*3*s;if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();}ctx.restore();
    }
    if(e.effects?.iceFlame||e.effects?.burn||e.effects?.tarBurn){const cold=!!e.effects?.iceFlame;fog(x,y-z-43*s,isPlayer?43*s:29*s,isPlayer?62*s:49*s,cold?'#73caff3d':isPlayer?'#df383854':'#eb81303d');for(let i=0;i<(isPlayer?7:4);i++){const xx=x+(i-3)*8*s+Math.sin(realTime*7+i)*4*s,yy=y-z-10*s-(i%3)*17*s;AshBattleArt.flame(ctx,xx,yy,(isPlayer?26:19)*s,i,realTime,cold?'#8bdcff':isPlayer?'#e95738':'#e9a64c');}}

    if(e.effects?.poison){const pulse=.55+.2*Math.sin(realTime*7+e.id);fog(x,y-38*s,34*s,44*s,'rgba(117,174,75,'+(0.10+pulse*.08)+')');for(let i=0;i<5;i++){const a=realTime*(1.1+i*.08)+i*1.6,rr=13+7*(i%2);circle(x+Math.cos(a)*rr*s,y-28*s+Math.sin(a*1.4)*22*s-(realTime*11+i*5)%12,2.2+(i%2),'rgba(173,220,112,.55)');}ctx.save();ctx.globalAlpha=.25+pulse*.12;ctx.strokeStyle='#9bc66b';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(x,y-43*s,25*s,37*s,0,0,TAU);ctx.stroke();ctx.restore();}
    if(e.effects?.bleed){for(let i=0;i<3;i++){const yy=y-(42+i*13)*s-((realTime*22+i*8)%10);line(x+(i-1)*8*s,yy,x+(i-1)*7*s,yy+9,'rgba(202,84,86,.62)',2);}circle(x+13*s,y-65*s,3,'#d06d6d');}
    drawFrostSnowflakes(e,x,y,s);
    if(e.armorRendT>0){ctx.save();ctx.globalAlpha=.65;for(let i=0;i<3;i++)line(x-18*s+i*14*s,y-72*s,x-7*s+i*12*s,y-50*s,'#d8a167',2);ctx.restore();}
    if(e.antiRegenSerum){ctx.save();ctx.globalAlpha=.62+.2*Math.sin(realTime*8);ctx.strokeStyle='#76c9b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-60*s,20*s,0,TAU);ctx.stroke();line(x-14*s,y-74*s,x+14*s,y-46*s,'#75c5af',1.4);line(x+14*s,y-74*s,x-14*s,y-46*s,'#75c5af',1.4);ctx.restore();}
    if(e.seal?.remaining>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.16*Math.sin(realTime*8);line(x-34*s,y-94*s,x+34*s,y-34*s,'#b58fe1',2.6);line(x+34*s,y-94*s,x-34*s,y-34*s,'#8966b8',2.2);ctx.restore();}
    drawTimeSealGlitch(e,x,y,s);
    if((e.killingAuraSeen||-99)>game.time-.65){const surge=!!e.killingAuraSurge,pulse=.5+.3*Math.sin(realTime*10+e.id);ctx.save();ctx.globalCompositeOperation='lighter';fog(x,y-43*s,(surge?42:30)*s,(surge?55:43)*s,'rgba(145,86,205,'+(surge?.18:.08+pulse*.06)+')');for(let i=0;i<(surge?6:3);i++){const a=realTime*(surge?3.2:2)+i*1.17;line(x+Math.cos(a)*(surge?25:18),y-25*s,x+Math.cos(a+.8)*(surge?14:9),y-(surge?82:72)*s,'rgba(205,158,255,'+(surge?.38:.22)+')',surge?1.7:1.3);}ctx.restore();}
    if(isPlayer&&(e.state==='guard'||e.guardFlash>0)){
      const active=e.state==='guard'&&e.t>=GUARD.startup&&e.t<=GUARD.startup+GUARD.window;
      const perfect=active&&e.t<=GUARD.startup+GUARD.perfect||e.guardFlash>0;
      ctx.save();ctx.translate(x+face*20,y-z-47);ctx.scale(face,1);
      ctx.beginPath();ctx.arc(0,0,46,-1.2,1.2);ctx.strokeStyle=perfect?AshCombatFX.resonanceColor('#c1f9e9',run?.effects?.resonance.stacks||0):active?AshCombatFX.resonanceColor('#b3bcab',run?.effects?.resonance.stacks||0):'#799c9970';ctx.lineWidth=active?3:1;
      if(perfect){ctx.shadowColor=AshCombatFX.resonanceColor('#93efd9',run?.effects?.resonance.stacks||0);ctx.shadowBlur=16;}ctx.stroke();ctx.restore();
    }
    if(isPlayer&&e.state==='charge'){
      const q=clamp(e.charge/e.chargeMax,0,1);line(x-23,y-z+17,x+23,y-z+17,'#3f453b',3);
      line(x-23,y-z+17,x-23+46*q,y-z+17,q>=.98?'#fff0bc':'#dfb375',3);
    }
    if(!isPlayer&&e.red>0){
      const guarding=guardWarning(e),shield=e.type==='shield'||/盾弩手$/.test(base?.name||''),mountedShield=['towerShield','spikeShield','shield'].includes(wt);
      let point=guarding?(shield?[j.back[0]+10,j.back[1]]:mountedShield?[weaponX,weaponY]:[weaponX+Math.cos(weaponAngle)*38,weaponY+Math.sin(weaponAngle)*38]):j.head;
      warningGlint(x+face*point[0]*s,y-z+point[1]*s,Math.min(1,e.red*14),1,guarding);
    }
    if(!isPlayer&&e.state==='stunned'){
      const yy=y-115*s;ctx.save();ctx.translate(x,yy);ctx.rotate(Math.PI/4);ctx.strokeStyle='#efc47e';ctx.lineWidth=2;ctx.strokeRect(-8,-8,16,16);ctx.restore();
      line(x-18,yy+19,x-18+36*clamp(e.stun/(e.stunMax||game.postureBreakDuration(e)),0,1),yy+19,'#e5ba6d',2);
    }
  }
  function drawEyeGlyph(x,y,{curse=false,mirror=0,scale=1,rank=1}={}){
    const pulse=.72+.28*Math.sin(realTime*(curse?6.1:7.2)+mirror*1.7);
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(Math.sin(realTime*1.8+mirror)*.035);
    ctx.globalCompositeOperation='lighter';ctx.shadowColor=curse?'#d765a6':'#af8bff';ctx.shadowBlur=18+rank*3;
    const outer=curse?'rgba(95,27,75,.94)':'rgba(52,28,91,.94)',edge=curse?'#eb91c2':'#e4d3ff',iris=curse?'#ef9fc7':'#a97ae8';
    ctx.fillStyle=outer;ctx.beginPath();ctx.moveTo(-22,0);ctx.quadraticCurveTo(0,-15,22,0);ctx.quadraticCurveTo(0,15,-22,0);ctx.fill();
    ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='rgba(249,244,255,.96)';ctx.beginPath();ctx.ellipse(0,0,8.5+pulse*1.6,6.3+pulse*.7,0,0,TAU);ctx.fill();
    circle(0,0,4.6+pulse*.8,iris);circle(0,0,1.7,'#24162f');
    if(curse){ctx.strokeStyle='rgba(239,137,192,.65)';ctx.lineWidth=1.1;for(let k=0;k<3;k++){const a=realTime*.45+k*TAU/3;line(Math.cos(a)*25,Math.sin(a)*9,Math.cos(a)*32,Math.sin(a)*15,'rgba(225,101,166,.55)',1);}}
    else {ctx.strokeStyle='rgba(203,177,255,.48)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0,0,28+rank*2,.15,Math.PI-.15);ctx.stroke();}
    ctx.restore();
  }
  function drawKillingAuraFX(){
    const rank=run?.upgrades?.killingAura;if(!rank||!(run.effects.killingAuraSurge>0))return;
    const p=game.p,x=p.x-camera,y=p.y-(p.z||0),surge=(run.effects.killingAuraSurge||0)>0,ultimate=p.ultimateForm>0;
    const executionBuff=!!run.upgrades.executioner&&run.effects.executioner.remaining>0;
    const color=executionBuff?(ultimate?'#cc792f':'#8951ad'):ultimate?'#ffba55':surge?'#d899ef':'#9572c8',highlight=executionBuff?(ultimate?'#dcac70':'#bb91d3'):ultimate?'#fff2b7':'#edd9ff',scale=(p.visualScale||1)*(surge?1.13:.96);
    ctx.save();ctx.globalCompositeOperation=executionBuff?'source-over':'lighter';ctx.globalAlpha=surge?.85:.60;
    fog(x,y-58,ultimate?88:69,ultimate?110:91,ultimate?'rgba(236,143,49,.16)':'rgba(134,84,191,.15)');
    AshV16Art.aura(ctx,x,y,realTime*(surge?1.2:.7),color,scale);
    ctx.shadowColor=color;ctx.shadowBlur=ultimate?18:12;
    for(let i=0;i<8;i++){const phase=realTime*(surge?2.5:1.6)+i*TAU/8,side=Math.cos(phase),rise=(realTime*.75+i*.143)%1,xx=x+side*(30+rise*16)*scale,yy=y-14-rise*135*scale;ctx.globalAlpha=(.20+.55*Math.sin(Math.PI*rise))*(side>0?1:.7);ctx.strokeStyle=i%3===0?highlight:color;ctx.lineWidth=(ultimate?3:2.2)*(1-rise*.45);ctx.beginPath();ctx.moveTo(xx-side*9,yy+23);ctx.quadraticCurveTo(xx+side*13,yy+3,xx+side*5,yy-19);ctx.stroke();}
    ctx.globalAlpha=ultimate?.40:.28;ctx.strokeStyle=highlight;ctx.lineWidth=ultimate?3:2;ctx.beginPath();ctx.ellipse(x,y+5,(ultimate?73:57)*scale,16*scale,0,0,TAU);ctx.stroke();
    ctx.restore();
  }
  function drawBreakMomentumWaves(){
    for(const wave of run?.effects?.breakMomentumWaves||[]){const x=wave.x-camera,r=wave.radius;if(r<=0)continue;ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(244,210,126,.68)';ctx.lineWidth=5;ctx.shadowColor='#edbd62';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(x,wave.y,r,Math.max(1,r*.32),0,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,239,181,.36)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,wave.y,r+18,Math.max(1,(r+18)*.32),0,0,TAU);ctx.stroke();ctx.restore();}
  }

  function drawSauronEyeFX(){
    const effects=run?.effects;if(!effects?.pair('intimidation','curse'))return;
    const target=effects.visibleEnemies()[0];if(!target)return;
    const age=game.time-(effects.dualState.eyePulseAt??-10);
    const attack=age>=0&&age<.42?Math.pow(1-age/.42,2):0;
    SauronEyeFX.draw(ctx,target.x-camera,target.y-(target.z||0)-156*target.scale,realTime,target.scale,attack);
  }
  function drawIntimidationFX(){
    const rank=run?.upgrades?.intimidation;if(!rank)return;
    const ids=run?.effects?.intimidation?.targetIds;if(!ids?.length)return;
    const groups=new Map();ids.forEach((id,i)=>{if(!groups.has(id))groups.set(id,[]);groups.get(id).push(i);});
    for(const [id,slots] of groups){
      const target=game.enemies.find(e=>e.id===id&&!e.dead&&!e.spawnDelay);if(!target)continue;
      const tx=target.x-camera,ty=target.y-112*target.scale;
      if(slots.length===1)drawEyeGlyph(tx,ty,{rank,mirror:slots[0],scale:.9+rank*.05});
      else {drawEyeGlyph(tx-19,ty,{rank,mirror:0,scale:.78+rank*.04});drawEyeGlyph(tx+19,ty,{rank,mirror:1,scale:.78+rank*.04});}
    }
  }
  function drawCurseFX(){
    const ids=run?.effects?.curse?.targetIds,rank=run?.upgrades?.curse;if(!ids?.length||!rank)return;
    // 诅咒同样只在目标头顶标出咒眼；没有玩家→目标的视觉连线。
    const groups=new Map();ids.forEach((id,i)=>{if(!groups.has(id))groups.set(id,[]);groups.get(id).push(i);});
    for(const [id,slots] of groups){
      const target=game.enemies.find(e=>e.id===id&&!e.dead&&!e.spawnDelay);if(!target)continue;
      const tx=target.x-camera,ty=target.y-104*target.scale;
      if(slots.length===1)drawEyeGlyph(tx,ty,{curse:true,rank,mirror:slots[0],scale:.86+rank*.04});
      else {drawEyeGlyph(tx-18,ty,{curse:true,rank,mirror:0,scale:.74+rank*.04});drawEyeGlyph(tx+18,ty,{curse:true,rank,mirror:1,scale:.74+rank*.04});}
    }
  }
  function woundBar(e,x,y,w,h){const mark=run?.effects.v11.wounds.get(e.id);if(!mark||e.dead)return;const amount=Math.min(e.hp,mark.amount*[0,1,1.18,1.38][run.effects.rank('delayedWound')||1]);ctx.fillStyle='#bd67e5';ctx.fillRect(x+w*(e.hp-amount)/e.maxHp,y,w*amount/e.maxHp,h);}
  function enemyBars(e){
    if(e.dummy||e.dead||e.furnaceCapture||e.groundDrag||isBoss(e)||e.spawnDelay>0)return;
    const elite=!!TYPES[e.type]?.elite&&!e.eliteLost;
    const x=e.x-camera,y=e.y-115*e.scale,w=elite||TYPES[e.type].ranged?88:52;
    if(!elite&&!TYPES[e.type].ranged&&e.hp===e.maxHp&&e.posture===e.maxPosture&&e.state!=='stunned')return;
    if(x<-100||x>W+100)return;
    text(TYPES[e.type].name,x,y-12,10,elite?'#c7a171':'#9caba6','center');
    ctx.fillStyle='#0b161ad9';ctx.fillRect(x-w/2-2,y-2,w+4,14);
    ctx.fillStyle='#b4beb1';ctx.fillRect(x-w/2,y,w*e.hp/e.maxHp,4);
    const wound=run?.effects.v11.wounds.get(e.id);if(wound){const pending=Math.min(e.hp,wound.amount*[0,1,1.18,1.38][run.effects.rank('delayedWound')||1]);ctx.fillStyle='#aa58cddd';ctx.fillRect(x-w/2+w*(e.hp-pending)/e.maxHp,y,w*pending/e.maxHp,4);}
    ctx.fillStyle='#594a35';ctx.fillRect(x-w/2,y+7,w,3);
    ctx.fillStyle=e.state==='stunned'?'#ffe5a8':'#c5a266';ctx.fillRect(x-w/2,y+7,w*e.posture/e.maxPosture,3);
  }
  function drawPostureShatters(){
    for(const fx of postureShatterFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-(fx.z||55)*.48,s=(fx.boss?1.42:1)*(fx.scale||1),burst=1-Math.pow(1-q,2);ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-q;ctx.shadowColor=(fx.redFlash?'#ff3844':'#ffd25c');ctx.shadowBlur=fx.boss?42:28;fog(0,0,(58+80*burst)*s,(42+50*burst)*s,(fx.redFlash?'rgba(255,35,54,':'rgba(255,188,49,')+(.30*(1-q))+')');for(let band=0;band<2;band++){ctx.beginPath();ctx.ellipse(0,18,(24+burst*(92+band*40))*s,(8+burst*(28+band*10))*s,0,0,TAU);ctx.strokeStyle=band?(fx.redFlash?'rgba(255,49,58,.48)':'rgba(255,174,43,.48)'):(fx.redFlash?'#ffb8ad':'#fff2b0');ctx.lineWidth=(fx.boss?6:4)*(1-q)+1;ctx.stroke();}for(let i=0;i<(fx.boss?18:13);i++){const a=fx.seed+i*2.399+(i%3)*.14,rr=(28+(i%4)*9)*s,end=(78+(i%5)*20)*s*burst;line(Math.cos(a)*rr*.25,Math.sin(a)*rr*.18,Math.cos(a)*end,Math.sin(a)*end*.54,i%4===0?'#ffffff':i%2?(fx.redFlash?'#ff5260':'#ffd96d'):(fx.redFlash?'#d61b38':'#e99c30'),(fx.boss?4.2:3.1)*(1-q));ctx.save();ctx.translate(Math.cos(a)*end,Math.sin(a)*end*.54-q*(15+i%3*13));ctx.rotate(a+q*(i%2?5:-5));path([[-8*s,-2*s],[4*s,-5*s],[11*s,0],[3*s,5*s]],i%3===0?(fx.redFlash?'#ffc3b7':'#fff0a8'):(fx.redFlash?'#f33750':'#e8aa42'),1,true,true);ctx.restore();}circle(0,0,(10+20*(1-q))*s,(fx.redFlash?'rgba(255,119,115,':'rgba(255,250,211,')+(.88*(1-q))+')');line(-34*s,0,34*s,0,'#ffffff',4*(1-q)+1);ctx.restore();}
  }
  function drawDualEffects(){
    const ds=run?.effects?.dualState;
    if(ds){
      for(const t of ds.lightningTrails||[]){const x1=t.x1-camera,y1=t.y1-18,x2=t.x2-camera,y2=t.y2-18;if(!AshCombatFX.segmentVisible(ctx,x1,y1,x2,y2,80))continue;const charged=t.t<=0,pulse=.55+.35*Math.sin(realTime*22);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(charged?.85:.42)*clamp(t.life/.35,0,1);line(x1,y1,x2,y2,charged?'rgba(155,232,255,.42)':'rgba(76,145,223,.24)',charged?15:8);AshBattleArt.bolt(ctx,[x1,y1],[x2,y2],Math.floor(realTime*20)+(t.x1|0),charged?3.2:1.8);for(let i=1;i<6;i++){const q=i/6,x=x1+(x2-x1)*q,y=y1+(y2-y1)*q;circle(x,y,3+pulse*2,charged?'#e9ffff':'#7bbcff');}ctx.restore();}
      for(const [id] of ds.rockNails||[]){const e=visualScene().byId.get(id);if(!e||e.furnaceCapture)continue;AshCombatFX.rockNails(ctx,e.x-camera,e.y-(e.z||0)-58*e.scale,e.scale,game.time);}
      for(const e of game.enemies){if(e.dead)continue;const x=e.x-camera,y=e.y-(e.z||0)-55*e.scale;if(x<-150||x>W+150)continue;if(e.huntMarkUntil>game.time){const life=clamp((e.huntMarkUntil-game.time)/1.5,0,1);ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.25*Math.sin(realTime*10);ctx.rotate(realTime*.7);for(let i=0;i<4;i++){ctx.rotate(TAU/4);path([[0,-50],[7,-37],[0,-28],[-7,-37]],life<.28?'#ffda78':'#db5568',1,true,true);}ctx.rotate(-realTime*.7);ctx.strokeStyle=life<.28?'#ffd276':'#b64a62';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,34,-2.7,-.45);ctx.stroke();ctx.beginPath();ctx.arc(0,0,34,.45,2.7);ctx.stroke();ctx.restore();}if(e.id===ds.beastBountyId){ctx.save();ctx.translate(x,y-28);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6+.22*Math.sin(realTime*7);for(let i=0;i<6;i++){const a=i*TAU/6+realTime*.25;line(Math.cos(a)*18,Math.sin(a)*9,Math.cos(a)*31,Math.sin(a)*16,'#8fe3a5',2);}circle(0,0,6,'#d8ffe0');ctx.restore();}}
    }
    for(const fx of windSpiralFX){
      const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-(fx.z||0)*.18,pulse=1-q;
      ctx.save();ctx.globalCompositeOperation='lighter';
      if(fx.kind==='release'){
        const radius=28+Math.min(10,(fx.amount||1)*3);ctx.translate(x,y-5);ctx.rotate((fx.seed||0)+q*TAU);ctx.scale(1,.34);ctx.globalAlpha=.82*pulse;ctx.strokeStyle='#dcfbff';ctx.lineWidth=3.2;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,radius,.18,Math.PI*1.72);ctx.stroke();ctx.globalAlpha=.48*pulse;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,radius*.58,Math.PI*.72,Math.PI*2.15);ctx.stroke();
      }else if(fx.kind==='slideDust'){
        const face=fx.face||1,reach=76+Math.min(30,(fx.amount||1)*12);
        for(let i=0;i<3;i++){const back=i*23+q*38,yy=y+8-i*7;ctx.globalAlpha=(.70-i*.16)*pulse;ctx.strokeStyle=i===0?'#dce8d8':i===1?'#c5cbb9':'#a9ad9d';ctx.lineWidth=3-i*.55;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(x-face*back,yy,reach*(1-i*.18),13+i*3,-face*.10,Math.PI*.12,Math.PI*.88);ctx.stroke();}
        for(let i=0;i<11;i++){const spread=(i%4)*13+q*(24+i%3*8),sx=x-face*(10+spread),sy=y+12-(i%3)*9-q*(9+i%4*3);ctx.globalAlpha=(.45+(i%3)*.1)*pulse;circle(sx,sy,2.2+i%3,'#c5baa0');}
      }else{
        const reach=46+(fx.amount||1)*26;ctx.globalAlpha=.9*pulse;for(let i=0;i<3;i++){const dir=i%2?1:-1,off=i*12,rot=(fx.seed||0)+q*7*dir+i*.9;AshBattleArt.vortex(ctx,x+Math.cos(rot)*off,y-10-i*6,reach*(1-i*.16)*(1+.05*Math.sin((fx.seed||0)*3+i)),game.time*2.1*dir);}ctx.globalAlpha=.26*pulse;ctx.strokeStyle='#d8fbff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+q*(fx.face||1)*10,y+10,reach*(1.05+.1*q),18+reach*.10,0,0,TAU);ctx.stroke();for(let i=0;i<8;i++){const a=(fx.seed||0)+i*TAU/8+q*5,rr=12+reach*(.25+(i%4)*.12);circle(x+Math.cos(a)*rr,y+6+Math.sin(a)*rr*.28+(i%3)*2,1.6+i%2,'rgba(214,247,248,.52)');}
      }
      ctx.restore();
    }
    for(const fx of guillotineFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-(fx.z||55)*.72,pulse=1-q;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pulse;ctx.shadowColor=fx.kind==='dive'?'#ffb36d':'#e0c891';ctx.shadowBlur=24;const span=(fx.kind==='dive'?92:72)+q*18;for(const side of [-1,1]){const ax=x-side*span,ay=y-34,bx=x+side*span*.72,by=y+28;line(ax,ay,bx,by,'#6b2415',10*(1-q)+2);line(ax,ay,bx,by,fx.kind==='dive'?'#ff9e55':'#f0c67c',5*(1-q)+1.2);line(ax,ay,bx,by,'#fff2d0',1.7*(1-q)+.4);}ctx.globalAlpha=.42*pulse;ctx.strokeStyle=fx.kind==='dive'?'#ffcf89':'#ead9aa';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-4,36+q*55,-Math.PI*.18,Math.PI*1.18);ctx.stroke();ctx.beginPath();ctx.arc(x,y-8,18+q*30,0,TAU);ctx.stroke();for(let i=0;i<10;i++){const a=(fx.seed||0)+i*TAU/10,rr=22+q*48;line(x,y-6,x+Math.cos(a)*rr,y-6+Math.sin(a)*rr*.55,'rgba(255,221,172,.42)',1.6);}ctx.restore();}
    for(const fx of corpseBombFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-30,spread=fx.radius*(.18+q*.82),fade=1-q;ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade;ctx.shadowColor=fx.strong?'#f04d65':'#bd283e';ctx.shadowBlur=22;fog(x,y,48+spread*.55,38+spread*.28,fx.strong?'rgba(174,35,58,.35)':'rgba(127,22,40,.32)');for(let ringIndex=0;ringIndex<3;ringIndex++){ctx.strokeStyle=ringIndex===0?'#f16b78':ringIndex===1?'#cb3c50':fx.strong?'#92233c':'#6e2033';ctx.lineWidth=(5-ringIndex)*(1-q)+1;ctx.beginPath();ctx.ellipse(x,y+25,spread*(1-ringIndex*.11),spread*(.34-ringIndex*.045),q*.4,0,TAU);ctx.stroke();}for(let i=0;i<12;i++){const a=fx.seed+i*TAU/12+q*.7,r=spread*(.42+(i%4)*.17),sx=x+Math.cos(a)*r,sy=y+Math.sin(a)*r*.46-q*35;ctx.save();ctx.translate(sx,sy);ctx.rotate(a+q*4);path([[-9,-2],[0,-5],[11,-2],[15,2],[0,4]],i%3===0?'#e75b6b':fx.strong?'#bc344d':'#a72b41',1,true,true);ctx.restore();}line(x-15,y-15,x+15,y-15,'#ec6472',3*fade);line(x,y-31,x,y+2,'#bd324b',2*fade);ctx.restore();}
    for(const fx of cocoonBurstFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-53,fade=1-q;ctx.save();ctx.globalAlpha=fade;ctx.shadowColor=fx.abyss?'#a66cdb':'#d3bb8c';ctx.shadowBlur=13;for(let i=0;i<14;i++){const a=fx.seed+i*TAU/14,rr=10+q*(45+(i%4)*11),sx=x+Math.cos(a)*rr,sy=y+Math.sin(a)*rr*.8-q*17;ctx.save();ctx.translate(sx,sy);ctx.rotate(a+q*(i%2?4:-4));path([[-8,-13],[4,-11],[11,6],[-4,10]],i%3===0?fx.abyss?'#d1b7ef':'#ede0bc':fx.abyss?'#765797':'#998e71',1,true,true);ctx.restore();}ctx.strokeStyle=fx.abyss?'#cca3f4':'#e7d5aa';ctx.lineWidth=3*fade;ctx.beginPath();ctx.ellipse(x,y,20+q*55,34+q*38,0,0,TAU);ctx.stroke();ctx.restore();}
    for(const fx of dualFX){if(!effectInView(fx,Math.max(240,fx.radius||0)))continue;const q=clamp(fx.t/fx.life,0,1),x=(fx.x??fx.x1??0)-camera,y=(fx.y??fx.y1??0)-(fx.z||0)*.55,ease=1-Math.pow(1-q,2);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-q;
      if(fx.kind==='flawPuncture'){const r=19*(fx.scale||1),spread=1+q*.9;ctx.strokeStyle='#cbd1da';ctx.lineWidth=2*(1-q)+.5;for(let i=0;i<6;i++){const a=i*TAU/6;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*q*12,y+3+Math.sin(a)*q*4,r*spread,r*.34*spread,0,a+.10,a+TAU/6-.1);ctx.stroke();}line(x,y-19*(1-q),x,y+8,'#f1f3f6',3*(1-q)+.5);line(x-9*(1-q),y-4,x+9*(1-q),y+4,'#d1d6dd',2*(1-q));}
      if(fx.kind==='thornGuard'){const cy=fx.y-(fx.z||0)-54;ctx.strokeStyle='#e7b5a2';ctx.lineWidth=fx.life>.3?2.5:1.7;ctx.beginPath();ctx.ellipse(x,cy,25+q*20,38+q*14,0,-2.5,.5);ctx.stroke();for(let i=0;i<5;i++){const a=-2.55+i*.65,xx=x+Math.cos(a)*(25+q*18),yy=cy+Math.sin(a)*(38+q*12);line(xx-Math.cos(a)*8,yy-Math.sin(a)*8,xx+Math.cos(a)*9,yy+Math.sin(a)*9,i%2?'#d5a9a0':'#f0d1ae',2*(1-q)+.5);}}
      else if(fx.kind==='thornBurst'){const cy=fx.y-(fx.z||0)-56,r=fx.radius||240,spread=30+ease*(r-30);ctx.shadowColor='#f4d990';ctx.shadowBlur=18*(1-q);ctx.strokeStyle='#fff4c8';ctx.lineWidth=5*(1-q)+1;ctx.beginPath();ctx.ellipse(x,fx.y,spread,spread*.31,0,0,TAU);ctx.stroke();ctx.strokeStyle='#9ee9f0';ctx.lineWidth=2.4*(1-q)+.7;ctx.beginPath();ctx.ellipse(x,fx.y,spread*.82,spread*.25,0,0,TAU);ctx.stroke();for(let i=0;i<12;i++){const a=(fx.seed||0)+i*TAU/12,inner=spread*.76,outer=spread*(1.04+i%3*.08);path([[x+Math.cos(a)*inner,fx.y+Math.sin(a)*inner*.31],[x+Math.cos(a+.09)*outer,fx.y+Math.sin(a+.09)*outer*.31],[x+Math.cos(a+.17)*inner,fx.y+Math.sin(a+.17)*inner*.31]],i%3?'#e5c980':'#d5faff',1,true,true);}for(let i=0;i<7;i++){const a=-Math.PI+i*Math.PI/6,xx=x+Math.cos(a)*31,yy=cy+Math.sin(a)*42,len=(i%2?23:32)*(1-q*.5);path([[xx-5,yy+5],[xx+Math.cos(a)*len,yy+Math.sin(a)*len],[xx+5,yy-5]],i%2?'#f3dda2':'#ecfbff',1,true,true);}circle(x,cy,14*(1-q),'rgba(255,246,200,.5)');}
      if(fx.kind==='overkillLaser'){const sx=fx.x-camera,sy=fx.y-(fx.z||45),tx=fx.toX-camera,ty=fx.toY-(fx.toZ||48),fade=1-clamp((q-.35)/.65,0,1),pulse=.75+.25*Math.sin(q*TAU*3);ctx.globalAlpha=fade;ctx.shadowColor='#ff304f';ctx.shadowBlur=24;line(sx,sy,tx,ty,'rgba(112,5,23,.50)',18*pulse);line(sx,sy,tx,ty,'#ef3151',7*pulse);line(sx,sy,tx,ty,'#ffe0d5',2.2);circle(tx,ty,10+q*24,'rgba(255,66,84,'+(.7*fade)+')');for(let i=0;i<7;i++){const a=fx.seed+i*TAU/7,r=12+q*(20+i%3*8);line(tx+Math.cos(a)*4,ty+Math.sin(a)*3,tx+Math.cos(a)*r,ty+Math.sin(a)*r*.6,i%2?'#ff6a73':'#b80f35',2.2*fade);}}
      if(fx.kind==='acidSpike'){const sx=fx.x-camera,sy=fx.y-(fx.z||48),tx=fx.toX-camera,ty=fx.toY-(fx.toZ||45),travel=clamp(q/.72,0,1),back=Math.max(0,travel-.18),px=sx+(tx-sx)*travel,py=sy+(ty-sy)*travel,bx=sx+(tx-sx)*back,by=sy+(ty-sy)*back,a=Math.atan2(ty-sy,tx-sx);ctx.globalAlpha=q<.78?1:1-(q-.78)/.22;ctx.shadowColor='#a8ee66';ctx.shadowBlur=16;line(bx,by,px,py,'rgba(137,222,75,.42)',11*(1-q)+3);line(bx,by,px,py,'#d9ff9a',2.4);ctx.save();ctx.translate(px,py);ctx.rotate(a);path([[-22,-5],[-4,-8],[22,0],[-4,8],[-22,5],[-12,0]],'#8fc94f',1.5,true,true);line(-15,0,16,0,'#efffc0',1.7);ctx.restore();if(travel>=1){const impact=clamp((q-.72)/.28,0,1);ctx.globalAlpha=1-impact;ctx.strokeStyle='#a9e76a';ctx.lineWidth=3*(1-impact)+1;ctx.beginPath();ctx.ellipse(tx,ty,12+impact*38,5+impact*13,0,0,TAU);ctx.stroke();for(let i=0;i<7;i++){const aa=fx.seed+i*TAU/7,r=8+impact*(24+i%3*7);line(tx+Math.cos(aa)*6,ty+Math.sin(aa)*3,tx+Math.cos(aa)*r,ty+Math.sin(aa)*r*.45,i%2?'#dfff9d':'#76b842',2*(1-impact));}}}
      else if(fx.kind==='alphaBloodFeast'||fx.kind==='bloodExecutionerBurst'){ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;AshEarthBloodFX.blood(ctx,{...fx,y:fx.y-(fx.z||0)*.55,z:0},camera);ctx.restore();}
      else if(fx.kind==='alphaRift'){const x1=fx.x1-camera,y1=fx.y1-46,x2=fx.x2-camera,y2=fx.y2-46,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wave=Math.sin(q*Math.PI);ctx.shadowColor='#776eff';ctx.shadowBlur=24;line(x1,y1,x2,y2,'rgba(35,13,82,.70)',22*(1-q)+7);line(x1+nx*3*wave,y1+ny*3*wave,x2-nx*4*wave,y2-ny*4*wave,'#7758d9',8*(1-q)+2);line(x1-nx*2,y1-ny*2,x2+nx*2,y2+ny*2,'#dcf4ff',2.4*(1-q)+.7);for(let i=1;i<9;i++){const k=i/9,xx=x1+dx*k,yy=y1+dy*k,jag=Math.sin(i*7.13+fx.seed)*16*wave;line(xx+nx*jag,yy+ny*jag,xx+nx*(jag+(i%2?24:-24)),yy+ny*(jag+(i%2?24:-24)),i%3===0?'#e6fbff':'#9a7af1',2.2*(1-q)+.4);}fog((x1+x2)/2,(y1+y2)/2,55+ease*80,25+ease*30,'rgba(88,53,183,'+(.22*(1-q))+')');}
      else if(fx.kind==='bossEnrage'){const pulse=.78+.22*Math.sin(fx.t*28),color=fx.yellow?'#ffd447':'#ff392f';ctx.shadowColor=color;ctx.shadowBlur=34*(1-q);fog(x,y-55,92+ease*105,120+ease*80,(fx.yellow?'rgba(255,201,35,':'rgba(255,45,35,')+(.30*(1-q)*pulse)+')');for(let i=0;i<18;i++){const a=fx.seed+i*2.399,r=35+ease*(80+(i%5)*18);line(x+Math.cos(a)*24,y+Math.sin(a)*16-20,x+Math.cos(a)*r,y+Math.sin(a)*r*.55-65-q*(35+i%4*10),i%3===0?(fx.yellow?'#fff2b8':'#ffd0b8'):(fx.yellow?'#ffd447':'#ff4b3f'),(3.6-i%3*.7)*(1-q)+.5);}}
      else if(fx.kind==='lightningTrail'){const x2=fx.x2-camera,y2=fx.y2;line(x,y,x2,y2,'rgba(91,165,244,.24)',10*(1-q));for(let i=0;i<7;i++){const k=i/6;circle(x+(x2-x)*k,y+(y2-y)*k,2.5,'#87c8ff');}}
      else if(fx.kind==='lightningTrailBurst'){const x2=fx.x2-camera,y2=fx.y2;ctx.shadowColor='#77d9ff';ctx.shadowBlur=25;for(let i=0;i<3;i++)AshBattleArt.bolt(ctx,[x,y+i*7-7],[x2,y2+i*7-7],fx.seed*20+i+Math.floor(fx.t*30),4-i);for(let i=0;i<9;i++){const k=i/8,xx=x+(x2-x)*k,yy=y+(y2-y)*k;fog(xx,yy,38*(1-q),19*(1-q),'rgba(116,225,255,.55)');}}
      else if(fx.kind==='ghostCrush'||fx.kind==='ghostExecute'){fog(x,y,110+ease*80,75+ease*45,'rgba(116,71,157,'+(.34*(1-q))+')');AshBattleArt.hand(ctx,x,y+28,.18+q*.7,fx.t*3);for(let i=0;i<12;i++){const a=fx.seed+i*TAU/12,r=(28+ease*130);line(x+Math.cos(a)*18,y+Math.sin(a)*8,x+Math.cos(a)*r,y+Math.sin(a)*r*.34,i%3?'#a77bd0':'#f1d5ff',3*(1-q));}}
      else if(fx.kind==='shadowSlash')AshCombatFX.shadowSlash(ctx,fx,camera);
      else if(fx.kind==='rockNailBurst')AshCombatFX.rockBurst(ctx,fx,camera);
      else if(fx.kind==='soulBladeEmpowered')AshCombatFX.soulImpact(ctx,fx,camera);
      else if(fx.kind==='miniBell'){const r=(fx.radius||235)*(.22+ease*.95);fog(x,y-42,95+ease*100,120+ease*70,'rgba(255,218,133,'+(.20*(1-q))+')');for(let i=0;i<4;i++){ctx.strokeStyle=i?'rgba(245,207,119,.45)':'#fff0bc';ctx.lineWidth=(5-i*.7)*(1-q)+.8;ctx.beginPath();ctx.ellipse(x,y,r*(.7+i*.12),r*(.22+i*.035),0,0,TAU);ctx.stroke();}for(let i=0;i<16;i++){const a=i*TAU/16,rr=r*(.8+(i%3)*.08);line(x+Math.cos(a)*rr*.55,y+Math.sin(a)*rr*.16,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.28,i%4===0?'#fff9df':'#e6bd68',2.5*(1-q));}}
      else if(fx.kind==='soulLinkShock'){fog(x,y,90+ease*80,70+ease*35,'rgba(170,116,236,'+(.26*(1-q))+')');for(let i=0;i<Math.max(3,fx.count||3);i++){const a=fx.seed+i*TAU/Math.max(3,fx.count||3);AshBattleArt.bolt(ctx,[x,y],[x+Math.cos(a)*(80+ease*95),y+Math.sin(a)*(35+ease*40)],i+Math.floor(fx.t*20),1.8);}}
      else if(fx.kind==='allLightningMarks'){fog(x,y,120+ease*150,90+ease*80,'rgba(95,190,255,'+(.26*(1-q))+')');for(let i=0;i<14;i++){const a=fx.seed+i*2.399,r=55+ease*(90+(i%4)*35);AshBattleArt.bolt(ctx,[x+Math.cos(a)*20,y+Math.sin(a)*10],[x+Math.cos(a)*r,y+Math.sin(a)*r*.48],i+Math.floor(fx.t*30),1.8);}}
      else if(fx.kind==='levelDoomWave'){ctx.strokeStyle='#ce5275';ctx.lineWidth=4*(1-q)+1;ctx.beginPath();ctx.ellipse(x,y,80+ease*520,24+ease*150,0,0,TAU);ctx.stroke();for(let i=0;i<12;i++){const a=i*TAU/12,r=80+ease*500;path([[x+Math.cos(a)*r,y+Math.sin(a)*r*.28-12],[x+Math.cos(a)*r-5,y+Math.sin(a)*r*.28+8],[x+Math.cos(a)*r+5,y+Math.sin(a)*r*.28+8]],i%2?'#e66b8a':'#8f3d69',1,true,true);}}
      else if(fx.kind==='huntExecute'){fog(x,y,95+ease*80,70+ease*50,'rgba(201,65,76,'+(.34*(1-q))+')');for(let i=0;i<5;i++){const yy=y-55+i*24;line(x-75-ease*45,yy+22,x+75+ease*45,yy-22,i===2?'#fff0a8':'#e56268',6*(1-q)+1);}}
      else if(fx.kind==='resonanceKillingAura'){fog(x,y,100+ease*170,70+ease*90,'rgba(217,194,106,'+(.22*(1-q))+')');for(let i=0;i<3;i++){ctx.strokeStyle=i===0?'#fff2a9':i===1?'#d4cf86':'#6fb6aa';ctx.lineWidth=(5-i)*(1-q)+1;ctx.beginPath();ctx.ellipse(x,y,(45+ease*(160+i*35)),(15+ease*(50+i*10)),0,0,TAU);ctx.stroke();}for(let i=0;i<15;i++){const a=fx.seed+i*2.399,r=45+ease*(120+(i%4)*30);line(x+Math.cos(a)*25,y+Math.sin(a)*9,x+Math.cos(a)*r,y+Math.sin(a)*r*.32,i%3?'#e6d780':'#9ddbcf',2.3*(1-q));}}
      else if(fx.kind==='blackHoleRide'){for(let i=0;i<9;i++){const a=fx.seed+i*TAU/9+q*2,r=(fx.radius||230)*(1-ease*.78);AshBattleArt.ribbon(ctx,x,y,r,a,'#a88be0',(1-q)*.55,.30);}fog(x,y,80+ease*60,35+ease*25,'rgba(130,95,191,'+(.28*(1-q))+')');}
      else if(fx.kind==='windPursuit'){const x2=fx.toX-camera;line(x,y-45,x2,y-45,'rgba(206,250,255,.28)',24*(1-q));line(x,y-45,x2+(fx.face||1)*85,y-45,'#eaffff',4*(1-q)+1);for(let i=0;i<8;i++){const k=i/8;line(x+(x2-x)*k,y-72+i%3*18,x+(x2-x)*k-(fx.face||1)*45,y-65+i%3*18,'rgba(158,228,237,.48)',2);}}
      ctx.restore();
    }
  }
  function drawFX(){
    for(const f of art.items)if(f.kind==='wound'&&f.target){f.x=f.target.x;f.y=f.target.y-(f.target.z||0);}
    for(const f of art.items)if(f.kind==='touch'&&f.targetId){const e=visualScene().byId.get(f.targetId);if(e&&!e.furnaceCapture){f.x=e.x;f.y=e.y;f.z=(e.z||0)+48*e.scale;}}
    art.draw(ctx,camera);
    drawPostureShatters();drawDualEffects();
    ctx.save();ctx.globalCompositeOperation='lighter';for(const f of flowTrailFX){const q=f.t/f.life,x=f.x-camera;if(x<-30||x>W+30)continue;ctx.globalAlpha=(1-q)*.72;ellipse(x,f.y,f.size*(1-q*.45),f.size*.7,f.phase%2?'#8ce5f2':'#56bed8');}ctx.restore();
    for(const fx of timeSealDevourFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y-(fx.z||55),s=fx.scale||1;ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';if(q<.46){const k=q/.46,h=(72*s)*(1-k*k),w=(43*s)*(1+k*.24);ctx.globalAlpha=1-k*.25;const glow=ctx.createLinearGradient(-w,0,w,0);glow.addColorStop(0,'rgba(54,155,255,0)');glow.addColorStop(.42,'rgba(114,218,255,.72)');glow.addColorStop(.5,'#f3ffff');glow.addColorStop(.58,'rgba(114,218,255,.72)');glow.addColorStop(1,'rgba(54,155,255,0)');ctx.fillStyle=glow;ctx.fillRect(-w,-Math.max(2,h),w*2,Math.max(4,h*2));for(let i=0;i<7;i++){const yy=(i-3)*h*.24;line(-w*(.65+(i%2)*.08),yy,w*(.72-(i%3)*.06),yy,'rgba(127,224,255,.7)',1.2);}}else{const k=(q-.46)/.54,w=(54*s)*(1-k),alpha=1-k;ctx.shadowColor='#80e7ff';ctx.shadowBlur=25;ctx.globalAlpha=alpha;line(-w,0,w,0,k>.72?'#ffffff':'#a9efff',4-2*k);circle(0,0,Math.max(.7,5*(1-k)),'#ffffff');for(let i=0;i<8;i++){const a=fx.seed+i*TAU/8,rr=(18+30*k)*s;circle(Math.cos(a)*rr,Math.sin(a)*rr*.35,2*(1-k),'rgba(92,204,255,.7)');}}ctx.restore();}
    for(const fx of bellWaveFX){const q=clamp(fx.t/fx.life,0,1),ease=1-Math.pow(1-q,2),base=(fx.main?1050:850)*ease;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-q)*(fx.main?.62:.32);if(q<.32){const strike=1-q/.32,bx=fx.x,by=43+Math.sin(q*13)*4;ctx.save();ctx.globalAlpha*=strike;ctx.shadowColor='#f7d784';ctx.shadowBlur=23*strike;ctx.fillStyle='#d6b875';ctx.beginPath();ctx.moveTo(bx-29,by+3);ctx.quadraticCurveTo(bx-29,by-24,bx-12,by-30);ctx.lineTo(bx+12,by-30);ctx.quadraticCurveTo(bx+29,by-24,bx+29,by+3);ctx.closePath();ctx.fill();line(bx-33,by+4,bx+33,by+4,'#ffe8a0',4);circle(bx,by+13,6,'#f6dfa0');ctx.restore();}for(let i=0;i<(fx.main?4:3);i++){const lag=Math.max(0,ease-i*.075),rx=base*lag,ry=rx*.47;ctx.strokeStyle=i===0?'#ffe6a2':'rgba(226,207,148,.58)';ctx.lineWidth=(fx.main?4.5:2.5)*(1-q)+.7;ctx.beginPath();ctx.ellipse(fx.x,fx.y,rx,ry,0,.08,Math.PI-.08);ctx.stroke();}for(let i=0;i<(fx.main?14:7);i++){const a=.10+(Math.PI-.20)*i/Math.max(1,(fx.main?13:6)),rr=base*(.88+(i%3)*.035),x=fx.x+Math.cos(a)*rr,y=fx.y+Math.sin(a)*rr*.47;circle(x,y,fx.main?2.2:1.5,'rgba(255,229,164,.58)');}ctx.restore();}
    for(const fx of serumBurstFX){
      const q=clamp(fx.t/fx.life,0,1),ease=1-Math.pow(1-q,2),x=fx.x-camera,y=fx.y-(fx.z||0)*.20;
      const reach=(fx.posture?62:48)+(fx.posture?26:20)*ease+fx.rank*2,alpha=(1-q)*(fx.posture?.92:.84);
      const accent=fx.posture?'#defbf3':'#c9f5ea',mid=fx.posture?'#86dfcd':'#6ec9b5',deep=fx.posture?'#4a9586':'#407b71';
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      fog(x,y,18+reach*.62,12+reach*.22,'rgba(111,210,190,'+(0.16*alpha)+')');
      ctx.globalAlpha=alpha;
      ctx.shadowColor=mid;
      ctx.shadowBlur=18*(1-q)+8;
      circle(x,y,5+8*(1-q),accent);
      circle(x,y,12+reach*.16,'rgba(151,234,220,.18)');
      for(let i=0;i<8;i++){
        const a=fx.seed+i*TAU/8+q*.16,inner=10+q*5+(i%2)*2,len=reach*(.84+(i%2)*.08),x1=x+Math.cos(a)*inner,y1=y+Math.sin(a)*inner*.48,x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len*.58;
        line(x1,y1,x2,y2,i%2?accent:mid,2.5*(1-q)+.7);
        line(x1,y1,x1+Math.cos(a)*(len-inner)*.45,y1+Math.sin(a)*(len-inner)*.24,deep,1.1*(1-q)+.35);
        circle(x2,y2,(fx.posture?2.5:1.9)*(1-q)+.55,i%2?accent:'#92d7c6');
      }
      for(let i=0;i<10+fx.rank*2;i++){
        const a=fx.seed*1.4+i*2.399,rr=12+ease*(20+(i%3)*6),px=x+Math.cos(a)*rr,py=y+Math.sin(a*1.22)*rr*.42-ease*8;
        circle(px,py,((i%3)?1.4:2.0)*(1-q)+.35,i%4===0?accent:'rgba(120,205,188,.82)');
      }
      ctx.restore();
    }
    for(const fx of bladeRingFX)AshCombatFX.ring(ctx,{...fx,x:fx.x-camera});
    for(const fx of diveBombFX){const q=clamp(fx.t/fx.life,0,1),x=fx.x-camera,y=fx.y;ctx.save();ctx.globalCompositeOperation='lighter';if(fx.kind==='path'){ctx.globalAlpha=(1-q)*.7;const face=fx.face||1;for(let i=0;i<4;i++){const yy=y+18+i*17,reach=(120+i*62)*(1-q*.25);ctx.setLineDash([14,11]);line(x+face*26,yy,x+face*reach,yy+8,'rgba(255,185,91,.62)',2.4-i*.25);ctx.setLineDash([]);}for(let i=0;i<9;i++)circle(x+face*(45+i*25),y+22+(i%4)*17,2+(i%2),'rgba(255,215,139,.52)');}else{const impact=clamp(q/.56,0,1),sx=x-110*(1-impact),sy=y-350*(1-impact);ctx.globalAlpha=1-q*.72;ctx.shadowColor='#ff9b43';ctx.shadowBlur=22;line(sx-55,sy-105,sx,sy,'rgba(255,196,104,.24)',15);line(sx-44,sy-82,sx,sy,'#ffd38b',4.5);circle(sx,sy,7+4*(1-impact),'#fff0b7');if(q>.38){const k=clamp((q-.38)/.62,0,1);ctx.globalAlpha=(1-k)*.82;ctx.strokeStyle='#ffb162';ctx.lineWidth=4*(1-k)+1;ctx.beginPath();ctx.ellipse(x,y+5,18+92*k,5+29*k,0,0,TAU);ctx.stroke();for(let i=0;i<11;i++){const a=fx.seed+i*TAU/11,rr=20+75*k;line(x+Math.cos(a)*15,y+Math.sin(a)*5,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.32,'rgba(255,129,48,.58)',2);}}}ctx.restore();}
    for(const fx of phantomRushFX){const q=clamp(fx.t/fx.life,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-q;if(fx.kind==='hit'){const x1=(fx.fromX??fx.x)-camera,y1=(fx.fromY??fx.y)-45,x2=fx.x-camera,y2=fx.y-(fx.z||0)-45;ctx.shadowColor='#917bd2';ctx.shadowBlur=18;line(x1,y1,x2,y2,'rgba(133,113,191,.30)',18*(1-q));line(x1,y1,x2+(fx.face||1)*45,y2-8,'#c2b4f0',3.5);for(let i=0;i<5;i++){const k=(i+1)/6;circle(x1+(x2-x1)*k,y1+(y2-y1)*k,4-i*.45,'rgba(164,144,218,.42)');}}else{const x=fx.x-camera,y=fx.y-(fx.z||0)-48;fog(x,y,34+q*42,70+q*25,'rgba(64,53,100,'+(.22*(1-q))+')');}ctx.restore();}
    AshBattleArt.lightningMarks(ctx,game.enemies,game.time,camera,run?.upgrades?.lightningRod);
    for(const d of run?.effects?.doomPending||[]){const e=d.enemy;if(e.dead)continue;const x=e.x-camera,y=e.y-(e.z||0)-100*(e.scale||1)-Math.min(1,Math.max(0,d.t/.18))*48;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(game.time*7)*.065);ctx.scale(d.slay?1.35:1,d.slay?1.35:1);if(d.slay){ctx.shadowColor='#a16be8';ctx.shadowBlur=17;for(let i=0;i<5;i++){const a=game.time*4+i*TAU/5;circle(Math.cos(a)*13,Math.sin(a)*23,2,'#aa77df');}}path([[-5,-13],[5,-13],[6,9],[0,27],[-6,9]],'#b32949',1,true,true);line(0,-12,0,21,'#ef7895',1.5);line(-10,-16,10,-16,'#d79e90',3);line(0,-27,0,-15,'#6f3547',5);ctx.restore();}
    AshBattleArt.whirlwind(ctx,game.p,camera);drawFireWhirlwind();
    for(const b of run?.effects?.v11?.saw?.blades||[]){
      const x=b.x-camera,y=b.y-34;ctx.save();line(x-b.vx*.04,y-b.vy*.04,x,y,'#bfcbcb66',3);
      ctx.translate(x,y);ctx.rotate(game.time*22);const pts=[];
      for(let i=0;i<28;i++){const a=i*TAU/28,r=i%2?9:15;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
      path(pts,'#b9cac6',1,true,true);circle(0,0,7,'#596f73');circle(0,0,2.5,'#e4d5a9');
      for(let i=0;i<4;i++){const a=i*TAU/4;line(Math.cos(a)*4,Math.sin(a)*4,Math.cos(a)*8,Math.sin(a)*8,'#e1ece3',1);}
      ctx.restore();
    }
    for(const d of game.decoys){if(d.life<=0||d.blocks<=0)continue;fighter({...game.p,x:d.x,y:d.y,z:d.z||0,face:d.face||game.p.face,t:0,life:1,ghostColor:d.noAggro?'#171724':'#60658c',ghostAlpha:d.noAggro?.58:.46},true,true);}
    if(run){AshV16Art.marks(ctx,game,run.effects,camera,game.time);AshV16Art.followers(ctx,game,run.effects,camera,game.time);}
    // Persistent ascension visuals are drawn from their live simulation state so the picture matches hit logic.
    if(run){
      const p=game.p,px=p.x-camera,py=p.y-p.z;
      const ls=run.upgrades.lightningSpirit||0;if(ls){const a=realTime*2.4,rr=58;const sx=px+Math.cos(a)*rr,sy=py-62+Math.sin(a)*18;ctx.save();ctx.globalCompositeOperation='lighter';circle(sx,sy,(8+ls*1.5)*(run.hasDual('elementAffinity','synergy')?1.2:1),'#a9dcff');circle(sx,sy,16+ls*3,'rgba(113,187,242,.15)');for(let i=0;i<3;i++)line(sx,sy,sx+Math.cos(a+i*2.1)*18,sy+Math.sin(a+i*2.1)*12,'rgba(202,236,255,.65)',1);ctx.restore();}
      const hs=run.upgrades.healingSpirit||0;if(hs){const n=hs===3?2:1;for(let i=0;i<n;i++){const a=realTime*(1.1+i*.18)+i*Math.PI,rr=42+i*15,sx=px+Math.cos(a)*rr,sy=py-78+Math.sin(a)*14;ctx.save();ctx.globalCompositeOperation='lighter';circle(sx,sy,7*(run.hasDual('elementAffinity','synergy')?1.2:1),'#a6e2b2');circle(sx,sy,15,'rgba(132,218,151,.13)');ctx.restore();}}
      
      const v11=run.effects.v11||{};const con=v11.consecration?.field;if(con)AshV16Art.holy(ctx,con,camera,game.time);
      const pg=v11.pageStorm?.field;if(pg)AshBattleArt.pages(ctx,pg,camera,game.time);
      for(const t of v11.tornadoes||[]){if(t.x-camera<-240||t.x-camera>W+240)continue;const empowered=!!t.dragonEmpowered,visualRadius=empowered?142:95;AshBattleArt.vortex(ctx,t.x-camera,t.y,visualRadius,game.time*(empowered?1.28:1));if(t.fire){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<(empowered?30:18);i++){const a=game.time*(empowered?6.2:5)+i*2.4,q=i/(empowered?30:18);AshBattleArt.flame(ctx,t.x-camera+Math.cos(a)*(25+q*(empowered?70:40)),t.y-q*(empowered?185:130),(empowered?34:25)+i%4*8,i,game.time,empowered&&i%4===0?'#ffd064':'#f48b32');}ctx.restore();}}
      const storm=v11.tornadoStorm;if(storm){const pulse=1+Math.sin(game.time*7)*.04,x=storm.x-camera,frost=run.hasDual?.('frostTrace','tornado');AshBattleArt.vortex(ctx,x,storm.y,172*pulse,game.time*1.35);AshBattleArt.vortex(ctx,x,storm.y-12,125*pulse,-game.time*1.7);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.26+.09*Math.sin(game.time*9);ctx.strokeStyle=frost?'#c8eff8':'#b9e3e4';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,storm.y,190*pulse,59*pulse,0,0,TAU);ctx.stroke();if(frost){ctx.globalAlpha=.48;for(let i=0;i<10;i++){const a=game.time*2.8+i*TAU/10,rr=55+(i%4)*31;circle(x+Math.cos(a)*rr,storm.y-25-Math.sin(a)*rr*.38,2+i%2,'#d8f7ff');}}ctx.restore();}
      const sword=(x,y,a,color)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);path([[-10,-5],[26,-5],[43,0],[26,5],[-10,5]],color,1,true,true);line(-8,0,36,0,'#f3ffff',1);line(-12,-12,-12,12,'#c7b685',4);line(-14,0,-30,0,'#6e777c',5);circle(-32,0,4,'#e1cf96');ctx.restore();};
      const sweep=run.effects.v16.swordSweep;
      if(run.upgrades.attackSwordSpirit){const f=run.effects.v16.swordFlights?.[0],spin=run.effects.dualState.spiritSpin;let x=px+63,y=py-68,a=Math.PI/2;if(f?.started){const returning=f.t>=f.duration,q=Math.min(1,returning?Math.max(0,f.t-f.duration-(f.hold||0))/f.duration:f.t/f.duration),sx=returning?f.tx:f.x,sy=returning?f.ty:f.y,tx=returning?game.p.x+63:f.tx,ty=returning?py-68:f.ty;x=sx+(tx-sx)*q-camera;y=sy+(ty-sy)*q;a=Math.atan2(ty-sy,tx-sx);line(x-Math.cos(a)*42,y-Math.sin(a)*42,x,y,'#c8e8ed66',3);}if(spin?.life>0&&!(spin.delay>0)){a=(.42-spin.life)*28;x=spin.x-camera+Math.cos(a)*95;y=spin.y-45+Math.sin(a)*42;AshBattleArt.ribbon(ctx,spin.x-camera,spin.y-40,145,a,'#dff9f0',.8,.36);}if(sweep){a=sweep.t*13;x=px+Math.cos(a)*240;y=py-42+Math.sin(a)*95;AshBattleArt.ribbon(ctx,px,py-40,240,a,'#d6f9ef',.65,.4);}sword(x,y,a,'#a8d7d5');}
      if(run.upgrades.defenseSwordSpirit){const pos=run.effects.defenseSpiritPosition();sword(pos.x-camera,pos.y,pos.angle,'#c1dce9');}

    }
    if(run?.upgrades?.steadfast&&game.p.state==='charge'){
      const r=run.upgrades.steadfast,q=clamp(game.p.charge/Math.max(.01,game.p.chargeMax),0,1),x=game.p.x-camera,y=game.p.y-game.p.z;ctx.save();ctx.globalCompositeOperation='lighter';
      fog(x,y-43,30+r*7+q*12,46+r*8,'rgba(194,169,105,'+(0.08+q*.10)+')');
      for(let i=0;i<4+r;i++){const a=i*TAU/(4+r)+realTime*.12,rr=31+r*5+q*12;line(x+Math.cos(a)*rr,y-16+Math.sin(a)*rr*.28,x+Math.cos(a)*(rr+10),y-16+Math.sin(a)*(rr+10)*.28,'rgba(224,205,147,.28)',1.5);}
      if(r>=2){ctx.globalAlpha=.23+.10*Math.sin(realTime*8);ctx.strokeStyle='#e1cd93';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-42,31+q*8,49+q*6,0,0,TAU);ctx.stroke();}ctx.restore();
    }
    for(const w of run?.effects?.swordQi?.waves||[]){if(w.x-camera+w.length+100<0||w.x-camera-w.length-100>W)continue;if(w.windTornado){AshBattleArt.vortex(ctx,w.x-camera,w.y+34,72,game.time*2);continue;}
      const x=w.x-camera,y=w.y,tail=w.length*(w.strong?.72:.52),front=w.face*tail*.50,back=-w.face*tail*.50;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(w.life*2.2,0,1);
      const main=w.strong?'#e8f9ff':'#b6dfe9',core=w.strong?'#ffffff':'#dff6f9';ctx.shadowColor=main;ctx.shadowBlur=w.strong?28:16;
      path([[x+back,y+13],[x+front,y-8],[x+front+w.face*(w.strong?52:25),y-2],[x+back,y+22]],main,1,true,true);line(x+back,y+17,x+front+w.face*(w.strong?42:20),y-3,core,w.strong?4.2:2.4);
      if(w.strong){line(x+back*.0,y-18,x+w.face*(w.length*.40),y-35,'rgba(217,247,255,.62)',2);line(x-w.face*(w.length*.18),y+33,x+w.face*(w.length*.44),y+9,'rgba(193,237,250,.46)',1.5);}ctx.restore();
    }
    const rv=run?.effects?.v16;if(rv){rv.rockVisuals=(rv.rockVisuals||[]).filter(r=>game.time-r.t<AshEarthBloodFX.life.rock);for(const r of rv.rockVisuals){if(!effectInView({x:r.x,x2:r.x+r.face*r.length},70))continue;AshEarthBloodFX.rock(ctx,{...r,t:game.time-r.t},camera);}}
    for(const b of run?.effects?.v11?.soulBlades||[]){const x=b.x-camera,y=b.y-58-(b.age<.48?Math.sin(game.time*6)*7:0),target=visualScene().byId.get(b.targetId),a=target?Math.atan2(target.y-b.y,target.x-b.x):-.45;AshCombatFX.soulBlade(ctx,x,y,a,game.time,!!b.empowered);}
    for(const s of run?.effects?.skeletons||[]){
      if(s.x-camera<-120||s.x-camera>W+120)continue;
      const x=s.x-camera,y=s.y,fade=clamp(s.life/(s.despawning?.28:.75),0,1);ctx.save();ctx.globalAlpha=fade;ctx.translate(x,y);ctx.scale(s.face||1,1);
      ellipse(0,3,20,5,'#0a171944');const pose=AshEnemyArt.skeleton(ctx,s,AshMotion,game.time);
      weapon(pose.hand[0],pose.hand[1],pose.angle,s.type==='archer'?'bow':s.type==='soul'?'soulBlade':'sword',s.type==='soul'?'#d3b7ff':'#c6d1b3',.65,pose.pull);ctx.restore();
    }

    for(const z of run?.effects?.meteor?.zones||[])(z.pollution?AshBattleArt.pollutionField:AshBattleArt.fireField)(ctx,z,camera,game.time);
    const iceFlameTrail=!!run?.hasDual('frostTrace','fireTouch');
    for(const z of run?.effects?.v11?.fireTrail||[])AshBattleArt.fireField(ctx,z,camera,game.time,iceFlameTrail);
    for(const z of run?.effects?.frostGround||[]){ctx.save();ctx.globalAlpha=Math.min(1,z.life)*.65;ellipse(z.x-camera,z.y,z.radius,z.radius*.38,'#749ead55','#bce9f099',1.5);for(let i=0;i<7;i++){const a=i*2.4;line(z.x-camera+Math.cos(a)*z.radius*.7,z.y+Math.sin(a)*z.radius*.25,z.x-camera+Math.cos(a)*z.radius*.3,z.y+Math.sin(a)*z.radius*.1,'#c0f1ff88',1.5);}ctx.restore();}
    for(const s of run?.effects?.enchant?.shots||[]){ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#b996ff';ctx.shadowBlur=16;line(s.x-camera-s.face*26,s.y-s.z,s.x-camera,s.y-s.z,'#ae8eff88',5);circle(s.x-camera,s.y-s.z,6,'#eee0ff');ctx.restore();}
    const gh=run?.effects?.v11?.ghostHand;if(gh?.hold>0){const target=game.enemies.find(e=>!e.dead&&(e.id===gh.targetId||e.state==='stunned'));if(target)AshBattleArt.hand(ctx,target.x-camera,target.y,.70+Math.sin(game.time*3)*.04,game.time);}
    for(const m of meteorFX)AshBattleArt.meteor(ctx,m,camera);
    for(const d of run?.effects?.luckSpearPending||[]){const e=d.enemy;if(!e||e.dead||e.furnaceCapture)continue;const px=e.x-camera,fall=clamp((.2-d.t)/.2,0,1),sy=e.y-(e.z||0)-330+274*fall*fall;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp((d.duration-d.t)/.12,0,1);ctx.shadowColor='#ffe69a';ctx.shadowBlur=20;line(px,sy-100,px,sy+18,'#ffe49a',5);line(px-8,sy-58,px+8,sy-58,'#f7d270',3);path([[px,sy+24],[px-7,sy+7],[px+7,sy+7]],'#fff1b0',1,true,true);ctx.restore();}
    for(const fx of luckSpearFX){const q=fx.t/fx.life,px=fx.x-camera,sy=fx.y-56;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-q*.72;ctx.shadowColor='#ffe69a';ctx.shadowBlur=20;line(px,sy-100,px,sy+18,'#ffe49a',5);line(px-8,sy-58,px+8,sy-58,'#f7d270',3);path([[px,sy+24],[px-7,sy+7],[px+7,sy+7]],'#fff1b0',1,true,true);if(q>.56){const k=(q-.56)/.44;ctx.globalAlpha=(1-k)*.7;ctx.strokeStyle='#f4d278';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,fx.y,35+115*k,9+30*k,0,0,TAU);ctx.stroke();}ctx.restore();}
    for(const fx of dissolveFX){const q=fx.t/fx.life,px=fx.x-camera,py=fx.y-(fx.z||0)-48;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-q;for(let i=0;i<18;i++){const a=fx.seed+i*.81,rr=(14+i%4*5)*(1+q*2.2),xx=px+Math.cos(a+q*2)*rr,yy=py+Math.sin(a*1.7)*rr*.65-q*(35+i%3*12);circle(xx,yy,2+(i%3),'rgba(158,218,112,.72)');}fog(px,py+8,38+q*45,55+q*24,'rgba(115,178,77,'+(0.18*(1-q))+')');ctx.restore();}
    for(const bolt of lightningFX){
      if(!effectInView(bolt,100))continue;
      ctx.save();ctx.globalAlpha=1-bolt.t/bolt.life;ctx.shadowColor='#b6d4ff';ctx.shadowBlur=16;
      for(let i=1;i<bolt.points.length;i++){
        const a=bolt.points[i-1],b=bolt.points[i],points=[];
        for(let j=0;j<=8;j++){
          const t=j/8;points.push([a.x+(b.x-a.x)*t-camera+(j&&j<8?Math.sin(j*8+realTime*52)*10:0),a.y+(b.y-a.y)*t+(j&&j<8?Math.cos(j*5+realTime*43)*13:0)]);
        }
        path(points,bolt.critical?'#4777d5':'#cbdfff',bolt.critical?7:2.5);path(points,bolt.critical?'#8ec6ff':'rgba(244,250,255,.72)',bolt.critical?2.7:1.1);
      }
      if(bolt.primary){
        const px=bolt.primary.x-camera,py=bolt.primary.y+18,q=1-bolt.t/bolt.life;
        ctx.globalAlpha=q;ctx.strokeStyle='#e7f2ff';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(px,py,18+Math.sin(realTime*25)*2,0,TAU);ctx.stroke();
        line(px-18,py,px+18,py,'#e7f2ff',2);line(px,py-18,px,py+18,'#b8d3ff',1.4);
      }
      ctx.restore();
    }
    for(const r of rings){
      const q=r.t/r.life;ctx.save();ctx.globalAlpha=(1-q)*.8;ctx.strokeStyle=r.color;ctx.lineWidth=2*(1-q)+.5;
      if(r.healHalo){ctx.globalCompositeOperation='lighter';ctx.shadowColor=r.color;ctx.shadowBlur=22*(1-q);ctx.lineWidth=3*(1-q)+1;}
      ctx.beginPath();ctx.ellipse(r.x-camera,r.y,r.r*(r.healHalo ? .65+q*.45 : .2+q),r.r*(r.healHalo ? 1.35*(.65+q*.45) : (r.y>430 ? .22 : 1)*(.2+q)),0,0,TAU);ctx.stroke();ctx.restore();
    }
    for(const fx of bloodXFX){const q=fx.t/fx.life,alpha=Math.pow(1-q,.8),size=(60+q*62)*fx.scale,x=fx.x-camera,y=fx.y;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.shadowColor='#ed3d58';ctx.shadowBlur=24*(1-q);for(const side of [-1,1]){const ax=x-side*size*.53,ay=y-size*.61,bx=x+side*size*.53,by=y+size*.61;line(ax,ay,bx,by,'#790e27',14*(1-q)+2);line(ax,ay,bx,by,'#f33758',7*(1-q)+1.5);line(ax,ay,bx,by,'#fff0e2',2.5*(1-q)+.4);line(ax-size*.06,ay-size*.03,ax-size*.18,ay-size*.22,'#d22447',2.4*(1-q)+.5);}ctx.restore();}
    for(const s of slashes){
      const q=s.t/s.life;ctx.save();ctx.translate(s.x-camera,s.y);ctx.scale(s.face*(s.scale||1),s.scale||1);ctx.globalAlpha=1-q;
      ctx.strokeStyle=s.color;ctx.shadowBlur=14;ctx.shadowColor=s.color;ctx.lineCap='round';
      if(s.index===2){
        path([[15,-8],[146,-12],[190,-10]],s.color,3);line(20,-4,136,-8,s.color,1);
        if(s.returnBlade){path([[5,7],[45,-5],[193,-15],[145,-5],[40,15]],'rgba(142,221,243,.44)',1,true,true);line(12,4,187,-13,'#f5ffff',2.2);line(36,14,158,0,'rgba(179,242,255,.62)',1.4);}
      }else{
        ctx.rotate(s.index===1?.65:-.45);ctx.scale(1,.60);
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(20,0,85+i*7,-1.15+q*.2,1.2+q*.2);ctx.lineWidth=i===0?5:1.5;ctx.stroke();}
      }ctx.restore();
    }
    for(const p of particles){
      ctx.globalAlpha=clamp(p.life/.18,0,1);
      if(p.cross){const x=p.x-camera,y=p.y;ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor=p.color;ctx.shadowBlur=9;line(x-p.size,y,x+p.size,y,p.color,Math.max(1.5,p.size*.45));line(x,y-p.size,x,y+p.size,p.color,Math.max(1.5,p.size*.45));ctx.restore();}
      else{if(p.glowColor){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.55;AshCombatFX.glow(ctx,p.x-camera,p.y,p.size*2.3,p.glowColor);ctx.restore();}line(p.x-camera,p.y,p.x-camera-p.vx*.019,p.y-p.vy*.019,p.color,p.size);}
    }ctx.globalAlpha=1;
    for(const t of texts){
      const alpha=clamp((t.life-t.t)*3,0,1),x=t.x-camera,y=t.y-t.t*33;ctx.globalAlpha=alpha;
      if(t.critical){ctx.save();ctx.globalAlpha=alpha;ctx.font=`700 ${t.size}px "Microsoft YaHei","Segoe UI",sans-serif`;ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#5b2e00';ctx.lineWidth=4;ctx.shadowColor='#ffbf24';ctx.shadowBlur=14;ctx.strokeText(t.text,x,y);ctx.fillStyle=t.color;ctx.fillText(t.text,x,y);ctx.restore();}
      else text(t.text,x,y,t.size,t.color,'center');
    }ctx.globalAlpha=1;
  }
  function arrows(){
    for(const b of game.projectiles){
      if(b.finalArrow){AshBossArt.projectile(ctx,b,camera);continue;}
      if(AshBossModels.projectile(ctx,b,camera))continue;
      if(b.flags?.includes('boneHook')){const x=b.x-camera,y=b.y-b.z;line((b.originX||b.x)-camera,b.originY-48,x,y,'#a8a18c',2);ctx.save();ctx.translate(x,y);ctx.scale(Math.sign(b.vx),1);ctx.strokeStyle='#ded7bd';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,11,-1.8,1.2);ctx.stroke();ctx.restore();continue;}
      if(b.bomb){const q=Math.min(1,b.age/b.flight),x=b.x-camera,y=b.y-b.z,arcane=b.projectile==='arcaneBomb',rx=b.radius,ry=b.radius*(b.bossProjectile?.625:.42);ctx.save();ctx.globalAlpha=.18+q*.16;ctx.fillStyle=arcane?'#d54b62':'#e46d57';ctx.beginPath();ctx.ellipse(b.tx-camera,b.ty,rx,ry,0,0,TAU);ctx.fill();ctx.globalAlpha=.55+q*.4;ctx.strokeStyle=b.reflected?'#a6fbe6':b.poison?'#9fce78':'#ff7776';ctx.lineWidth=arcane?3:2;ctx.beginPath();ctx.ellipse(b.tx-camera,b.ty,rx,ry,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;if(arcane){fog(x,y,22,22,'#d450ba88');circle(x,y,10,'#d46cc4');circle(x-3,y-4,4,'#ffe0f1');}else if(b.poison){poisonOrb(x,y,b.reflected?'#a6fbe6':'#9fce78');}else{circle(x,y,9,b.tar?'#433526':'#b3452f');line(x-3,y-4,x+4,y+6,b.reflected?'#a6fbe6':'#f4be72',3);if(b.tar){line(x-4,y-9,x+4,y-9,'#bbaa83',4);}else{line(x,y-8,x+6,y-15,'#ffdaa0',2);circle(x+6,y-15,3,'#fff1b7');}}ctx.restore();continue;}
      const x=b.x-camera,y=b.y-b.z,flags=b.flags||[],poison=flags.includes('poison'),burn=flags.includes('burn'),slow=flags.includes('slow');
      const color=b.reflected?'#a6fbe6':b.warned?'#ff8c70':poison?'#9fce78':burn?'#efa055':flags.includes('holy')?'#fff1a6':slow?'#8dbfcf':'#d1bd91';
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.shadowBlur=b.reflected?14:(poison||burn?9:3);ctx.shadowColor=color;
      if(b.projectile==='dagger'){weapon(0,0,0,'dagger',color,.65);}else if(flags.includes('shuriken')){ctx.rotate(realTime*18);for(let i=0;i<4;i++){ctx.rotate(TAU/4);path([[0,-3],[5,-18],[9,-4]],'#d2d9d4',1,true,true);}circle(0,0,4,'#5b6362');}
      else if(flags.includes('boneSpine')){path([[-25,-5],[8,-8],[32,0],[8,8],[-25,5]],'#d3cbb0',1,true,true);line(-23,0,22,0,'#8d7d6d',2);}
      else if(flags.includes('holy')){circle(0,0,9,'#ffe9a3');circle(0,0,15,'#fff1b0',true,2);}
      else if(flags.includes('curse')){fog(0,0,22,22,'#be72ce66');circle(0,0,10,'#9060b4');circle(0,0,5,'#e3b4ec');ctx.rotate(realTime*4);line(-16,0,16,0,'#d696e4',2);line(0,-16,0,16,'#d696e4',2);}
      else if(b.javelin){line(-31,0,24,0,'#9f8c69',4);line(-31,-1,20,-1,'#c8bda2',1.1);path([[18,-4],[42,0],[18,4]],'#edf0df',1,true,true);line(-31,-4,-31,4,'#d5ad71',2);}
      else if(b.net){const grow=.90+Math.sin(realTime*11+b.x*.01)*.06;ctx.scale(grow,grow);ctx.rotate(Math.PI/4);ctx.fillStyle='rgba(102,142,139,.25)';ctx.fillRect(-20,-20,40,40);ctx.strokeStyle='#d2e0d7';ctx.lineWidth=2;ctx.strokeRect(-20,-20,40,40);for(let i=-1;i<=1;i++){line(-20,i*10,20,i*10,'#a4c8c2',1.2);line(i*10,-20,i*10,20,'#a4c8c2',1.2);}for(const a of [[-20,-20],[20,-20],[-20,20],[20,20]])circle(a[0],a[1],3,'#d4dcc9');}
      else if(poison)poisonOrb(0,0,color);
      else if(burn){circle(2,0,b.projectile==='fireball'?11:6,color);circle(4,0,4,'#ffe1a7');path([[-6,-7],[-33,0],[-7,7]],'rgba(238,132,62,.65)',1,true,true);}
      else if(slow){line(-18,0,10,0,color,2);for(let i=-1;i<=1;i++)line(-2,i*6,11,i*10,color,1.4);line(-4,-8,-4,8,color,1.2);}
      else{line(-27,0,9,0,color,2);path([[4,-4],[12,0],[4,4]],color,1,true,true);line(-25,0,-32,-4,color,1);line(-25,0,-32,4,color,1);}
      ctx.restore();
    }
  }
  function rain(){
    const biome=CHAPTERS[mode==='title'?selectedArena:run.arena].theme;
    if(biome!=='rain'){
      ctx.save();
      for(let i=0;i<60;i++){
        const x=(i*173.317+realTime*(biome==='snow'?23:44))%1510-35,y=(i*93.11+realTime*(biome==='snow'?35:49))%850-25;
        ctx.globalAlpha=.15+(i%4)*.09;
        if(biome==='snow')circle(x+Math.sin(realTime+i)*14,y,1+(i%3)*.45,'#d8e6df');
        else {ctx.save();ctx.translate(x,y);ctx.rotate(realTime*.8+i);ellipse(0,0,4,1.6,['#bb895a','#b67445','#d2a35f'][i%3]);ctx.restore();}
      }ctx.restore();return;
    }
    ctx.save();ctx.strokeStyle='#a2c5ca';ctx.lineWidth=.7;
    for(let i=0;i<95;i++){
      const x=(i*173.317+realTime*75)%1550-65,y=(i*93.11+realTime*(320+i%4*55))%850-25;
      ctx.globalAlpha=.045+(i%4)*.016;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+19);ctx.stroke();
    }ctx.restore();
  }
  function hud(){
    const p=game.p,fx=run?.effects,cooldownRows=fx?.cooldownRows()||[];
    const hudHeight=222+cooldownRows.length*18;
    const g=ctx.createLinearGradient(0,0,0,hudHeight);g.addColorStop(0,'#081316e0');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,hudHeight);
    ctx.save();ctx.translate(35,30);
    ctx.strokeStyle='#9b8970';ctx.lineWidth=1;ctx.strokeRect(0,0,43,43);text('刃',21,30,27,'#e1c49c','center','serif');
    text('无 名',60,10,13,'#d8e1d8');text('LV.'+run.level,142,10,11,'#c7b386','left','mono');
    const barX=60,barW=267,stable=p.hp/p.maxHp,gray=p.grayHp/p.maxHp;
    ctx.fillStyle='#263436';ctx.fillRect(barX,22,barW,9);
    ctx.fillStyle=p.hp+p.grayHp<45?'#d37c68':'#c2d3bb';ctx.fillRect(barX,22,barW*stable,9);
    ctx.fillStyle='#7f8985';ctx.fillRect(barX+barW*stable,22,barW*gray,9);
    for(let xx=barX+barW*stable;xx<barX+barW*(stable+gray);xx+=7)line(xx,23,Math.min(xx+4,barX+barW*(stable+gray)),30,'#b7bdb36a');
    text(Math.ceil(p.hp)+'+'+Math.ceil(p.grayHp)+'/'+p.maxHp,barX+barW,10,10,'#9fb4b1','right','mono');
    
    if(!run.training){
      text('经验',0,70,10,'#879c94');ctx.fillStyle='#263b36';ctx.fillRect(barX,61,barW,4);
      ctx.fillStyle='#9cbaa1';ctx.fillRect(barX,61,barW*run.xp/run.nextXP,4);
      text(Math.floor(run.xp)+' / '+run.nextXP,barX+barW,80,9,'#8b9d91','right','mono');
    }
    const burstCost=run.getMomentumBurstConfig().cost,canOverdraw=run.effects.canOverdraw(),burstReady=run.momentum>=burstCost||canOverdraw,burstRatio=burstCost/game.rules.momentumMax,momentumRatio=clamp(run.momentum/game.rules.momentumMax,0,1);
    text('战意',0,102,10,burstReady?'#f1d099':'#c2ac86');ctx.fillStyle=run.hasDual('maniac','roar')&&!canOverdraw?'#55585d':'#403b2e';ctx.fillRect(barX,94,barW,5);
    ctx.fillStyle=burstReady?'#e2bd76':'#d5b273';ctx.fillRect(barX,94,barW*momentumRatio,5);
    const temporaryMomentum=run.temporaryMomentum;
    if(temporaryMomentum>0){ctx.fillStyle='#a9dedb';ctx.fillRect(barX+barW*momentumRatio,94,barW*Math.min(temporaryMomentum/game.rules.momentumMax,1-momentumRatio),5);}
    line(barX+barW*burstRatio,91,barX+barW*burstRatio,102,burstReady?'#f6dda9':'#88765a',1);

    text(Math.floor(run.momentum)+(temporaryMomentum>0?' + '+Math.floor(temporaryMomentum):'')+' / '+game.rules.momentumMax,barX+barW,116,9,burstReady?'#d9bd86':'#a59675','right','mono');
    const dashReady=game.canDash();
    text('⇧',0,143,18,dashReady?'#b5ded1':'#536e70');



    text('冲刺',26,141,10,'#a3b2a6');const dashBase=game.dashCooldown(),dashPartial=p.dashCharges<p.dashMaxCharges?clamp(1-p.dashRegen/dashBase,0,1):0,dashRatio=clamp((p.dashCharges+dashPartial)/Math.max(1,p.dashMaxCharges),0,1);ctx.fillStyle='#293f40';ctx.fillRect(66,133,70,7);ctx.fillStyle=dashReady?'#bddccf':'#628b87';ctx.fillRect(66,133,70*dashRatio,7);ctx.strokeStyle='#58706d';ctx.strokeRect(66,133,70,7);text('␣ 跳跃',153,141,11,'#a3b2a6');for(let i=0;i<(p.jumpMax||2);i++)circle(222+i*15,137,3,i>=p.jumps?'#bddccf':'#354b4c');
    if(game.evasionChanceBase>0)text('闪避：'+Math.round(game.evasionChance*100)+'% / '+Math.round(game.evasionChanceBase*100)+'%',60,169,10,'#9fc5bf','left','mono');
    let cooldownY=game.evasionChanceBase>0?193:174;
    for(const row of cooldownRows){
      const english=AshI18n.language==='en';
      text(row.name,60,cooldownY,10,row.active?'#e4d9a5':row.ready?'#b8d6ca':'#879b96','left','sans-serif',english?152:undefined);
      const bx=english?220:126,bw=112,by=cooldownY-7,ratio=row.active||row.ready?1:clamp(1-row.remaining/row.max,0,1);
      ctx.fillStyle='#26393a';ctx.fillRect(bx,by,bw,5);ctx.fillStyle=row.active?'#d8c991':row.ready?'#9fcdbb':'#6c9691';ctx.fillRect(bx,by,bw*ratio,5);ctx.strokeStyle='#4f6967';ctx.strokeRect(bx,by,bw,5);
      const status=row.active?'生效':row.ready?'就绪':(row.remaining<10?row.remaining.toFixed(1):Math.ceil(row.remaining))+'s';text(status,english?375:267,cooldownY,9,row.active?'#e7dcae':row.ready?'#b8d7ca':'#829895','right','mono');cooldownY+=18;
    }

    ctx.restore();
    const alive=game.enemies.filter(e=>!e.dead).length;
    const elapsed=Math.max(0,Math.floor(run.time)),elapsedText=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');
    text('本局 '+elapsedText,W-142,68,11,'#899c90','right','mono');
    text(run.training?'稻草人试炼场':run.challenge?'BOSS RUSH':(alive+' 位敌人'),W-142,88,12,'#a8b8ab','right');
    if(run.training){const d=run.trainingHits.reduce((a,h)=>a+h.damage,0);text('近 5 秒伤害 '+Math.round(d)+' / DPS '+Math.round(d/5),W-142,112,12,'#d2c69f','right');}
    if(!run.challenge&&!run.training){
      const remaining=Math.max(0,run.nextWave-run.time),progress=1-remaining/run.currentWaveInterval;
      line(W-325,106,W-142,106,'#394b48',2);line(W-325,106,W-325+183*progress,106,'#bc9f6b',2);
      text('下一波 '+Math.ceil(remaining)+'s',W-142,126,10,'#899c90','right');
    }
    if(run.pendingLevels>0)text('E·擢升'+run.pendingLevels,W-142,153,18,'#f1d099','right');
    const target=game.executeTarget;
    if(target&&p.state!=='execute'){
      const xx=target.x-camera,yy=target.y-155*target.scale;
      ctx.save();ctx.globalAlpha=.85+Math.sin(realTime*9)*.15;ctx.fillStyle='#131f20ee';ctx.fillRect(xx-76,yy-26,152,33);ctx.strokeStyle='#cda566';ctx.strokeRect(xx-76,yy-26,152,33);
      text('Q',xx-53,yy-4,16,'#ffe0a2','center','mono');text('处决',xx+13,yy-5,12,'#edc489','center');ctx.restore();
    }
    const livingBosses=game.enemies.filter(e=>isBoss(e)&&!e.dead&&!e.bossProxy).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));const boss=livingBosses[0];
    if(boss){
      const xx=410,ww=620,yy=746;ctx.fillStyle='#0b171cc7';ctx.fillRect(xx-28,yy-27,ww+56,70);
      text(bossDisplayName(boss.type),W/2,yy-7,16,boss.enraged?'#ff5a52':'#d4bd98','center');
      ctx.fillStyle='#39403a';ctx.fillRect(xx,yy+6,ww,6);ctx.fillStyle='#bc957b';ctx.fillRect(xx,yy+6,ww*boss.hp/boss.maxHp,6);woundBar(boss,xx,yy+6,ww,6);
      ctx.fillStyle='#4e4735';ctx.fillRect(xx,yy+19,ww,3);ctx.fillStyle='#d0b271';ctx.fillRect(xx,yy+19,ww*boss.posture/boss.maxPosture,3);
      text(Math.ceil(boss.hp)+' / '+boss.maxHp,xx+ww+12,yy+13,9,'#9b9f8e');text('架势',xx-13,yy+23,9,'#a59978','right');
    }
    if(bannerTimer>0){
      ctx.save();ctx.globalAlpha=Math.min(1,bannerTimer*1.8);
      text(banner,W/2,202,26,'#dcc8a5','center','serif');line(W/2-38,218,W/2+38,218,'#a38d674d');
      if(bannerSub)text(bannerSub,W/2,244,11,'#a7b4ab','center');ctx.restore();
    }
  }
  function drawPeaShooter(){
    const s=run?.effects.peaShooter;if(!s?.active)return;
    const scale=run.hasDual('elementAffinity','synergy')?1.2:1,x=s.x-camera,y=s.y,bob=Math.sin(game.time*3.4)*3;
    ctx.save();ctx.shadowBlur=0;ctx.shadowColor='transparent';ellipse(x,y+3,26*scale,8*scale,'rgba(12,27,14,.4)');
    ctx.translate(x,y+bob);ctx.scale(scale*s.face,scale);
    // A root tuft, leaf collar and hollow pea pod keep the companion readable at game scale.
    ellipse(0,-5,15,9,'#5b7342');
    for(let i=0;i<4;i++)line(-11+i*7,-4,-16+i*10,5+(i%2)*4,'#a0b276',2);
    path([[-2,-10],[-27,-16],[-31,-28],[-10,-25],[1,-16]],'#477f47',1,true,true);
    path([[1,-10],[23,-12],[30,-23],[12,-26],[-2,-17]],'#78ac56',1,true,true);
    line(0,-12,2,-47,'#648d45',7);line(1,-15,3,-46,'#aed377',2);
    const recoil=Math.sin(clamp(s.recoil/.14)*Math.PI)*5;ctx.translate(-recoil,0);
    ellipse(0,-47,22,19,'#497c44');ellipse(2,-51,20,15,'#8fbd60');
    path([[10,-58],[32,-57],[37,-51],[36,-41],[11,-38]],'#87b757',1,true,true);
    ellipse(34,-48,7,10,'#b6d883');ellipse(36,-48,4,7,'#294d32');
    ellipse(-10,-54,4.2,5.5,'#163a2b');circle(-9,-56,1.6,'#f3f4c9');
    path([[-15,-62],[-23,-71],[-5,-68],[1,-62]],'#6fa450',1,true,true);
    ctx.restore();
    for(const shot of s.shots){const px=shot.x-camera,py=shot.y-shot.z;if(px<-60||px>W+60)continue;ctx.save();ctx.shadowBlur=0;line(px-shot.vx*.018,py-shot.vy*.018,px,py,'#a4d56899',2);circle(px,py,6*scale,shot.burst?'#c8ed87':'#95c85f');circle(px-2,py-2,2.1*scale,'#e2f7b5');ctx.restore();}
  }
  function drawV12PersistentFX(){
    for(const e of game.enemies){if(e.dead||!e.frightfulThrustMark)continue;const x=e.x-camera,y=e.y-(e.z||0)-100*(e.scale||1);if(x<-80||x>W+80)continue;ctx.save();ctx.shadowColor='#bbdbff';ctx.shadowBlur=9;path([[x+4,y-14],[x-7,y+1],[x,y+1],[x-4,y+14],[x+9,y-3],[x+2,y-3]],'#c5dfff',1,true,true);ctx.restore();}
    for(const e of medusaGazeFX){const q=e.t/e.life,x=e.x-camera,r=e.radius*Math.min(1,q*3);ctx.save();ctx.globalAlpha=(1-q)*.3;ctx.fillStyle='#9eab82';ctx.beginPath();ctx.moveTo(x,e.y);ctx.lineTo(x+e.face*r*.707,e.y-r*.707);ctx.arc(x,e.y,r,e.face>0?-Math.PI/4:Math.PI*3/4,e.face>0?Math.PI/4:Math.PI*5/4);ctx.closePath();ctx.fill();ctx.restore();}

    const v=run?.effects?.v12;if(!v||mode==='title')return;AshCombatFX.space(ctx,run.effects.space,camera);
    ctx.save();
    // Tar / burning tar.
    for(const f of v.tar||[]){const x=f.x-camera,y=f.y,r=f.radius||80;if(x+r+25<0||x-r-25>W)continue;const dive=!!f.dive;ctx.save();ctx.globalAlpha=dive?.52:.26;ctx.beginPath();for(let i=0;i<=28;i++){const a=i*TAU/28,rough=1+Math.sin(i*4.71+f.x*.017)*.10+Math.sin(i*1.9+f.y*.013)*.06,xx=x+Math.cos(a)*r*rough,yy=y+8+Math.sin(a)*r*.32*rough;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fillStyle=dive?'#160f0d':f.burning?'#8b3f25':'#241f22';ctx.fill();if(dive){ctx.globalCompositeOperation='lighter';const pulse=.6+.2*Math.sin(realTime*7);ellipse(x,y+7,r*.58,r*.13,'rgba(163,48,20,'+(.24*pulse)+')');for(let i=0;i<11;i++){const a=i*TAU/11+Math.sin(i*9.3)*.12,len=r*(.25+(i%4)*.12);line(x+Math.cos(a)*r*.12,y+Math.sin(a)*r*.04,x+Math.cos(a)*len,y+Math.sin(a)*len*.31,i%3?'rgba(220,75,29,.48)':'rgba(255,144,53,.55)',1.2+i%2);}for(let i=0;i<8;i++){const a=realTime*(.35+i%2*.17)+i*.81,rr=r*(.20+(i%4)*.16);circle(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.25,1.4+i%2,'rgba(255,132,48,.72)');}}
      ctx.globalAlpha=.55;for(let i=0;i<(dive?9:5);i++){const a=realTime*(f.burning?1.8:.35)+i*1.27,c=f.burning?'#e87835':'#3d3435',xx=x+Math.cos(a)*r*.55,yy=y+Math.sin(a*1.4)*r*.16;circle(xx,yy,3+i%2,c);if(f.burning&&(dive||i<4)){const h=18+(i%3)*9+Math.sin(realTime*8+i)*5;path([[xx-6,yy],[xx,yy-h],[xx+7,yy],[xx+1,yy-7]],i%2?'#f08a34':'#ffb052',1,true,true);circle(xx+Math.sin(realTime*3+i)*6,yy-h-5,1.6,'rgba(255,180,89,.68)');}}ctx.restore();}
    // Vines / control / frost-like markers are attached to actual enemies.
    const vineIds=new Set(v.vines?.slots||[]);for(const e of game.enemies){if(e.dead)continue;const x=e.x-camera,y=e.y-e.z;if(x<-180||x>W+180)continue;if(vineIds.has(e.id)){const purple=visualScene().ghostVines,color=purple?'#b085db':'#7eb85e',vineScale=e.scale*(run.hasDual('elementAffinity','synergy')?1.2:1);for(let side=0;side<2;side++){ctx.beginPath();for(let i=0;i<=36;i++){const q=i/36,a=q*Math.PI*5+side*Math.PI+game.time*.6,xx=x+Math.cos(a)*23*vineScale,yy=y-q*85*vineScale;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.strokeStyle=color;ctx.lineWidth=3.6;ctx.stroke();for(let i=3;i<=36;i+=6){const q=i/36,a=q*Math.PI*5+side*Math.PI+game.time*.6,xx=x+Math.cos(a)*23*vineScale,yy=y-q*85*vineScale;ctx.save();ctx.translate(xx,yy);ctx.rotate(Math.sin(a)*.8-.4);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(6,-10,16,-5);ctx.quadraticCurveTo(12,4,0,0);ctx.fillStyle=color;ctx.fill();ctx.restore();}}for(let j=0;j<6;j++){const q=j/6,a=q*Math.PI*5+game.time*.6;line(x+Math.cos(a)*23,y-q*85,x-Math.cos(a)*23,y-q*85,color+'66',1);}}if(e.mindControlT>0){const yy=y-87*e.scale;ctx.beginPath();for(let i=0;i<55;i++){const a=i*.27+game.time*3,r=i*.34,xx=x+Math.cos(a)*r,sy=yy+Math.sin(a)*r*.5;i?ctx.lineTo(xx,sy):ctx.moveTo(xx,sy);}ctx.strokeStyle='#83f4a0';ctx.lineWidth=2.4;ctx.stroke();if(v.mind.targetId===e.id&&v.mind.remaining<.8&&run.upgrades.mindControl===3)AshV16Art.aura(ctx,x,y,game.time,run.effects.pair('frostTrace','mindControl')?'#79dcff':'#65f893',e.scale);}}

    // Small orbiting charge orbs retain their elemental identities.
    for(const o of v.orbs||[]){const x=o.x-camera,y=o.y-(game.p.z||0),col=o.type==='lightning'?'#76d8ff':o.type==='frost'?'#bcecff':'#9b78c6',r=6+Math.min(2,(o.charge||0)*.25);fog(x,y,r*2,r*2,col+'33');circle(x,y,r,col);circle(x,y,r+2,col,true,1);for(let i=0;i<5;i++){const a=game.time*(o.type==='dark'?-3:3)+i*TAU/5;circle(x+Math.cos(a)*(r+5),y+Math.sin(a)*(r+5),1.1,col);}if(o.type==='lightning')path([[x+3,y-6],[x-2,y],[x+2,y],[x-3,y+6]],'#eafaff',1);else if(o.type==='frost'){line(x-4,y,x+4,y,'#ffffff',1);line(x,y-4,x,y+4,'#ffffff',1);}}

    // Star descent / invulnerability halo.
    if(v.star?.channel>0||v.star?.invuln>0){const x=game.p.x-camera,y=game.p.y-game.p.z,veil=run.hasDual?.('starBlessing','shadow');ctx.globalAlpha=v.star.invuln>0?.65:.35;const grd=ctx.createLinearGradient(x,y-260,x,y+30);grd.addColorStop(0,veil?'rgba(41,47,105,0)':'rgba(195,220,255,0)');grd.addColorStop(1,veil?'rgba(68,78,151,.52)':'rgba(205,230,255,.45)');ctx.fillStyle=grd;ctx.fillRect(x-(veil?78:42),y-250,veil?156:84,270);ctx.strokeStyle=veil?'#8999e0':'#dbeaff';ctx.lineWidth=2;if(veil&&v.star.channel>0){ctx.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const a=i*2.39+realTime*.22,rr=22+(i%5)*14;circle(x+Math.cos(a)*rr,y-38-Math.abs(Math.sin(a))*145,1.2+i%2,'rgba(174,190,255,.68)');}ctx.globalCompositeOperation='source-over';}ctx.globalAlpha=1;}
    ctx.restore();
  }

  // The long map only reuses the established gate, lantern and banner artwork. Adjacent
  // copies share immutable world coordinates, so the left/right seam is the same scene.
  function drawWorldLandmarks(){
    const length=run?.loopLength||17955,left=game?.bounds?.left||45,cell=length/15,offsets=run?.loopWorld?[-length,0,length]:[0];
    const bannerAt=x=>{line(x,300,x,460,'#25342f',5);line(x-5,305,x+65,305,'#435248',3);path([[x+5,307],[x+64,307],[x+64+Math.sin(realTime*1.4)*5,387],[x+33,402],[x+4,387]],'#655349',1,true,true);line(x+15,316,x+52,316,'#a38a69',1);text('守',x+34,356,25,'#bdab86','center','serif');};
    for(const offset of offsets)for(let i=0;i<15;i++){const base=left+i*cell+offset,gateX=base+cell*.18,lampX=base+cell*.62,bannerX=base+cell*.84;
      if(i%3===0){const x=gateX-camera;if(x>-260&&x<W+260)gate(x,458,i%2?.58:.67);}
      {const x=lampX-camera;if(x>-120&&x<W+120){ctx.fillStyle='#1a272b';ctx.fillRect(x,321,9,144);line(x-8,322,x+50,322,'#394943',4);lantern(x+39,357,.82);}}
      if(i%2===1){const x=bannerX-camera;if(x>-100&&x<W+100)bannerAt(x);}
    }
  }
  function demonSilhouette(x,y,scale,slot,time,alpha=1,silhouette=false){
    AshBossArt.draw(ctx,{x,y,scale,slot,time,alpha,silhouette,face:-1});
  }
  function drawDemon(e){
    if(e.medusaGold||e.medusaUntil>game.time||['stone','goldStone'].includes(e.deathFlavor))return fighter(e);
    const spec=AshCombat.ENEMY_CATALOG.BY_ID[e.type],intro=run.finalPhase==='intro',q=intro?clamp((run.finalIntro-.7)/3.5,0,1):1,x=e.x-camera;
    e.finalArtSlot=spec.slot;
    if(x>-450&&x<W+450){ctx.save();ctx.beginPath();ctx.rect(x-440,0,880,e.y+5);ctx.clip();let dx=x,dy=e.y-(e.z||0)+(1-q)*360;if(e.dead){const u=clamp(e.deathT/.40,0,1),fall=u*u*(3-2*u);ctx.translate(dx,dy-4*fall);ctx.rotate((e.face||1)*1.52*fall);dx=dy=0;}AshBossArt.draw(ctx,{x:dx,y:dy,scale:1.45,slot:spec.slot,time:e.dead?(e.bossDeathAt||0):game.time,alpha:e.dead?Math.max(0,1-e.deathT/.8):1,face:e.face,entity:e,dead:e.dead});ctx.restore();if(e.dead)AshBossArt.deathEffects(ctx,e,camera);}
    if(!intro&&!e.dead)AshBossArt.effects(ctx,e,camera,game.time);
  }
  function drawCrowdedBossIndicators(){
    const visible=game.enemies.filter(e=>!e.dead&&e.spawnDelay<=0&&e.x-camera>-100&&e.x-camera<W+100);
    if(visible.length<6)return;
    for(const e of visible){if(!isBoss(e))continue;const x=e.x-camera,y=e.y-(e.z||0)-(TYPES[e.type]?.final?290:148*(e.scale||1))-12;
      if(y<34||y>H-35)continue;const color=e.enraged?'#fa655a':'#ffd75d',pulse=.78+.22*Math.sin(realTime*7+e.id);ctx.save();ctx.globalAlpha=pulse;ctx.shadowColor=color;ctx.shadowBlur=14;path([[x,y+16],[x-11,y-3],[x+11,y-3]],color,1,true,true);ctx.shadowBlur=0;path([[x,y+10],[x-6,y-1],[x+6,y-1]],e.enraged?'#672025':'#765820',1,true,true);ctx.restore();
    }
  }
  function drawTitleComposition(){
    // Dedicated title-screen tableau. All helpers stay local so the title scene cannot
    // fail halfway through and leave only the sky gradient visible.
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#151025');sky.addColorStop(.42,'#4a2942');sky.addColorStop(.73,'#bd6557');sky.addColorStop(1,'#e5a06c');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    // Sunset and luminous haze behind the distant final boss.
    fog(1215,250,235,235,'#ffc07048');fog(1215,294,420,145,'#e98b6840');ellipse(1215,250,72,72,'#f6bd78');ellipse(1215,250,55,55,'#ffd28f');

    // Farthest ridge first. Buildings are deliberately inserted between mountain layers,
    // so the following ridges cover their foundations and make them feel built into the terrain.
    path([[0,585],[105,500],[205,538],[335,420],[455,520],[590,405],[710,520],[850,448],[975,552],[1085,458],[1200,548],[1335,430],[1440,505],[1440,760],[0,760]],'#4a3242',1,true,true);

    // Distant mountain-city: bases sit below the next ridge rather than floating in open sky.
    ctx.save();ctx.globalAlpha=.78;
    temple(760,590,.20);temple(925,575,.24);temple(1092,594,.18);temple(1360,580,.21);
    ctx.restore();

    // Middle ridge hides the lower sections of the far pagodas.
    path([[0,645],[145,555],[275,610],[420,486],[555,604],[710,500],[850,620],[1010,515],[1160,600],[1305,515],[1440,574],[1440,760],[0,760]],'#302b39',1,true,true);

    // A nearer pair of towers is also grounded by the foreground ridge drawn below.
    ctx.save();ctx.globalAlpha=.72;
    temple(835,635,.15);temple(1180,625,.17);
    ctx.restore();

    // Title-only final-boss silhouette. It is intentionally a single flat tone with no
    // armor lines, flames or purple highlights: readable, distant, and lower-contrast.
    const titleBossSilhouette=(x,y,s)=>{
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=.58;
      const col='#7a6175';ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
      // Horned head and crown.
      ellipse(0,-151,12,15,col);
      path([[-9,-158],[-26,-176],[-20,-149],[-12,-143]],col,1,true,true);
      path([[9,-158],[26,-176],[20,-149],[12,-143]],col,1,true,true);
      path([[-7,-169],[0,-184],[7,-169]],col,1,true,true);
      // One-piece shoulders, torso and tattered mantle: no internal detailing.
      path([[-22,-138],[-43,-126],[-55,-88],[-45,-44],[-31,-8],[-18,4],[18,4],[31,-8],[45,-44],[55,-88],[43,-126],[22,-138]],col,1,true,true);
      path([[-38,-119],[-67,-94],[-55,-80],[-32,-91]],col,1,true,true);
      path([[38,-119],[67,-94],[55,-80],[32,-91]],col,1,true,true);
      path([[-28,-45],[-45,2],[-27,-5],[-14,-38]],col,1,true,true);
      path([[28,-45],[45,2],[27,-5],[14,-38]],col,1,true,true);
      // A simple long weapon remains part of the silhouette but carries no highlight.
      ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(35,-83);ctx.lineTo(94,-18);ctx.stroke();
      path([[88,-25],[106,-7],[98,0],[80,-18]],col,1,true,true);
      ctx.restore();
    };
    titleBossSilhouette(1240,684,.68);

    // Nearest mountain layer covers feet/foundations for both the boss and the nearer towers.
    path([[0,695],[165,630],[320,667],[520,575],[690,666],[865,590],[1020,675],[1175,590],[1335,654],[1440,620],[1440,760],[0,760]],'#1b222d',1,true,true);

    // Mist softens all distant silhouettes without reintroducing bright internal detail.
    fog(1010,500,780,135,'#e5936b22');fog(1240,600,250,105,'#ba71852a');

    // Converging ruined causeway points the player's sword toward the distant silhouette.
    path([[520,810],[760,738],[1052,705],[1240,674],[1440,704],[1440,810]],'#0d1118',1,true,true);
    line(758,742,1237,677,'#a87d6542',2);line(1086,810,1245,677,'#bf8c6542',2);
    for(let i=0;i<8;i++){const q=i/7,x=760+(1240-760)*q,y=742+(676-742)*q,w=22*(1-q)+5;line(x-w,y,x+w,y,'#b3907350',1.3);}
    for(const [x,y,h] of [[705,705,75],[812,720,58],[1345,708,64],[1402,724,48]]){line(x,y-h,x,y,'#171820',4);path([[x,y-h+8],[x+30,y-h+13],[x+24,y-h+35],[x,y-h+30]],'#472a35',1,true,true);}

    // Foreground ground and the player, deliberately larger and darker than the distant boss.
    path([[0,751],[330,742],[610,750],[865,738],[1100,752],[1440,742],[1440,810],[0,810]],'#090d13',1,true,true);line(0,747,W,748,'#d19a7648',2);
    const x=985,y=746;
    line(x-12,y-30,x-18,y,'#070b10',11);line(x+10,y-30,x+16,y,'#070b10',11);
    path([[x-23,y-37],[x-20,y-91],[x+18,y-91],[x+25,y-37]],'#111923',1,true,true);ellipse(x,y-110,14,18,'#0b1119');
    path([[x-14,y-114],[x+7,y-125],[x+18,y-109]],'#060b10',1,true,true);
    path([[x-19,y-84],[x-30,y-60],[x-35,y-34]],'#0d151d',8);path([[x+16,y-85],[x+31,y-60],[x+39,y-51]],'#0d151d',8);
    line(x+37,y-51,x+156,y-94,'#e3c6a8',3);line(x+29,y-55,x+47,y-49,'#8b725a',5);
    path([[x-17,y-89],[x+15,y-92],[x+55,y-79],[x+74,y-88]],'#733d49',6);
    path([[x-15,y-83],[x-73,y-95],[x-112,y-77],[x-64,y-61],[x-103,y-45],[x-35,y-49]],'#351d29',1,true,true);
    for(let i=0;i<18;i++){const ex=800+(i*83)%610,ey=390+(i*47)%305,r=1+(i%3)*.6;circle(ex,ey,r,i%2?'#e189655e':'#f6b17252');}
  }

  function ritualSeal(x,y,r,alpha=1,color='#b479e8'){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,r,r*.3,0,0,TAU);ctx.stroke();for(let k=0;k<2;k++){ctx.beginPath();for(let i=0;i<3;i++){const a=-Math.PI/2+k*Math.PI+i*TAU/3,xx=x+Math.cos(a)*r*.88,yy=y+Math.sin(a)*r*.26;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.stroke();}ctx.restore();}
  function drawBattleFormationGround(){
    if(!run?.effects?.battleFormation?.active)return;
    const p=game.p,x=p.x-camera,y=p.y+2,r=42,pulse=.82+.10*Math.sin(game.time*3);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ellipse(x,y,r,13,'#e94d2520');
    ritualSeal(x,y,r,pulse,'#ed613b');
    ctx.globalAlpha=pulse*.75;ctx.strokeStyle='#ff9c53';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,y,r*.72,r*.22,0,0,TAU);ctx.stroke();
    for(let i=0;i<6;i++){const a=i*TAU/6;line(x+Math.cos(a)*r*.90,y+Math.sin(a)*r*.27,x+Math.cos(a)*r*1.08,y+Math.sin(a)*r*.324,'#ff8250',1.5);}
    ctx.restore();
  }
  function drawFlawGround(){
    const flaws=run?.effects?.v12?.flaws;if(!flaws)return;
    for(const e of game.enemies){const mark=flaws.get(e.id);if(e.dead||e.furnaceCapture||!mark||mark.until<game.time)continue;const x=e.x-camera,y=e.y+3,r=19*(e.scale||1);if(x<-80||x>W+80)continue;ctx.save();ctx.globalAlpha=.72+.16*Math.sin(game.time*6);ctx.strokeStyle='#b8bec7';ctx.lineWidth=2;ctx.shadowColor='#d7dbe1';ctx.shadowBlur=6;ctx.beginPath();ctx.ellipse(x,y,r,r*.34,0,0,TAU);ctx.stroke();ctx.restore();}
  }
  function drawHiddenEdgeTrails(x,y,z,s,face,charges){
    AshCombatFX.hiddenEdgeParticles(ctx,x,y,z,s,face,charges,realTime);
  }
  function drawHiddenEdgeSword(x,y,angle,charges){
    const q=clamp(charges/10,0,1);if(q<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25+q*.6;ctx.shadowColor='#cbd3dc';ctx.shadowBlur=5+q*16;line(12,0,86,0,'#9ba6b5',2+q*6);line(14,-1,83,-1,'#e4e9ee',1+q*1.5);for(let i=0;i<Math.ceil(q*4);i++)circle(24+i*17,-2+Math.sin(realTime*6+i)*3,1+q,'#dce2e8');ctx.restore();
  }
  function drawV18Ground(){
    drawBattleFormationGround();drawFlawGround();
    const souls=run.sacrificeSouls||[],stride=Math.max(1,Math.ceil(souls.length/96));
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<souls.length;i+=stride){const s=souls[i],x=s.x-camera,y=s.y;if(x<-40||x>W+40)continue;const dx=s.target.x-s.x,dy=s.target.y-60-s.y,d=Math.hypot(dx,dy)||1;line(x-dx/d*22,y-dy/d*22,x,y,'#a956d6',3);circle(x,y,4,'#df9cff');circle(x-dx/d*10,y-dy/d*10,2,'#b34a8c');}
    ctx.restore();
    for(const z of game.lateZones||[]){if(z.kind==='web')continue;const x=z.x-camera;ctx.save();ctx.globalAlpha=Math.min(.8,z.life);ellipse(x,z.y,z.radius,z.radius*.45,z.kind==='void'?'#67439566':'#b6d5c244');ritualSeal(x,z.y,z.radius,.6);ctx.restore();}
    for(const s of game.lateSigils||[]){ritualSeal(s.x-camera,s.y,100,.8);ellipse(s.x-camera,s.y,100*(1-s.t/1.1),35*(1-s.t/1.1),'#bc77e855');}
    if(run.effects.v11.meditation.active){const p=game.p;AshEnemyArt.meditation(ctx,p.x-camera,p.y-p.z,game.time);}

    for(const net of [...(game.netZones||[]),...(game.lateZones||[]).filter(z=>z.kind==='web').map(z=>({...z,maxLife:5,radiusX:z.radius,radiusY:z.radius*.45}))]){const x=net.x-camera,y=net.y,q=Math.max(0,net.life/net.maxLife);if(x<-180||x>W+180)continue;ctx.save();ctx.globalAlpha=Math.min(.9,q*1.4);ctx.fillStyle='rgba(45,83,84,.32)';ctx.strokeStyle='#8fc5bc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,net.radiusX,net.radiusY,0,0,TAU);ctx.fill();ctx.stroke();ctx.save();ctx.beginPath();ctx.ellipse(x,y,net.radiusX,net.radiusY,0,0,TAU);ctx.clip();for(let i=-5;i<=5;i++){const ox=i*25;line(x+ox-70,y-net.radiusY,x+ox+70,y+net.radiusY,'rgba(176,216,203,.7)',1.6);line(x+ox-70,y+net.radiusY,x+ox+70,y-net.radiusY,'rgba(176,216,203,.55)',1.4);}ctx.restore();for(let i=0;i<6;i++){const a=realTime*1.3+i*TAU/6;circle(x+Math.cos(a)*net.radiusX*.65,y+Math.sin(a)*net.radiusY*.7,2.3,'#c6ece1');}ctx.restore();}
    for(const zone of game.tarZones||[]){const x=zone.x-camera,q=Math.max(0,zone.life/zone.maxLife);if(x<-180||x>W+180)continue;ctx.save();ctx.globalAlpha=Math.min(.75,q);ctx.fillStyle=zone.poison?'rgba(100,156,75,.42)':zone.burning?'rgba(213,88,28,.52)':'rgba(39,28,20,.65)';ctx.strokeStyle=zone.poison?'#a6d586':zone.burning?'#ffae4b':'#9a704d';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=28;i++){const a=i*TAU/28,rough=1+Math.sin(i*4.71+zone.x*.017)*.10+Math.sin(i*1.9+zone.y*.013)*.06,xx=x+Math.cos(a)*zone.radius*rough,yy=zone.y+Math.sin(a)*zone.radius*.4*rough;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();ctx.stroke();for(let i=0;i<12;i++){const a=i*2.399,rr=zone.radius*(.2+(i%4)*.17),xx=x+Math.cos(a)*rr,yy=zone.y+Math.sin(a)*rr*.36;ellipse(xx,yy,12+i%3*6,3,zone.poison?'#b4d87c50':'#bd967944');if(zone.poison)fog(xx,yy-15-(game.time*13+i*7)%35,24,29,'#8eb96540');if(zone.burning)AshBattleArt.flame(ctx,xx,yy,26+i%3*9,i,game.time,'#eea04f');}ctx.restore();}
    for(const b of run.effects.v16.beams){const x=b.x-camera;if(x<-(b.rx||265)||x>W+(b.rx||265))continue;const rx=b.rx||265,ry=b.ry||100;ctx.save();ctx.globalAlpha=Math.min(1,(b.life-b.t)*2);ctx.fillStyle=b.t<b.warn?'rgba(238,134,68,.13)':b.blue?'rgba(33,63,95,.58)':'rgba(86,35,22,.62)';ctx.strokeStyle=b.blue?'#7dcaff':'#f29855';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,b.y,rx,ry,0,0,TAU);ctx.fill();ctx.stroke();if(b.t>=b.warn)for(let i=0;i<20;i++){const a=i*2.399,rad=Math.sqrt((i+.5)/20),xx=x+Math.cos(a)*rx*rad,yy=b.y+Math.sin(a)*ry*rad;AshBattleArt.flame(ctx,xx,yy,23+(i%3)*10,i,game.time,b.blue?'#7dcaff':'#ec923e');}ctx.restore();}
    for(const e of game.enemies){if(e.dead||e.x-camera<-100||e.x-camera>W+100)continue;if(e.sacrificial||e.sacrificeAt)ritualSeal(e.x-camera,e.y,47,(e.sacrificeAt?clamp(1-(e.sacrificeAt-run.time)/10,0,1):.7));}
    if(run.finalPhase==='intro'){for(const sign of [-1,1]){const x=run.finalCenter+sign*470-camera,t=run.finalIntro;ctx.save();ctx.globalAlpha=Math.min(1,t*2);fog(x,555,190,62,'#a458db55');for(let i=0;i<4;i++){ctx.strokeStyle=['#57288b','#8242b9','#ad6cdf','#dca8ff'][i];ctx.lineWidth=6-i;ctx.beginPath();ctx.ellipse(x,557,165-i*23,48-i*6,t*.1,0,TAU);ctx.stroke();}ritualSeal(x,557,170,.8);for(let j=0;j<12;j++)AshBattleArt.flame(ctx,x-155+j*28,551,45+20*Math.sin(j+t*4),j,realTime,'#a766e2');ctx.restore();}}

  }
  function drawV18Overlays(){
    for(const e of game.enemies)if(!e.dead&&e.fogT>0)mistCloud(e.x-camera,e.y,TYPES[e.type].auraRadius||230,Math.min(1,e.fogT),TYPES[e.type].stage==='abyss'?'#9f72cb':'#b17c8c');
    for(const h of game.enemyHazards||[]){const x=h.x-camera,q=1-h.life/h.maxLife;ctx.save();ctx.globalAlpha=1-q;
      if(h.kind==='arcaneBeam'||h.kind==='holyBeam')AshEnemyArt.spell(ctx,{...h,x},h.stage||TYPES[h.enemyType]?.stage,q);
      else if(h.kind==='crystalSpike'){for(let i=0;i<7;i++){const xx=x+h.face*h.radius*(i+.3)/7,hh=(38+i%3*16)*Math.sin(Math.min(1,q*4)*Math.PI/2);path([[xx-11,h.y],[xx-3,h.y-hh],[xx+5,h.y-hh-13],[xx+13,h.y]],'#82cadc',1,true,true);line(xx-3,h.y-hh,xx+2,h.y-4,'#e1ffff',2);}}
      else{ctx.strokeStyle='#ddbf91';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,h.y,h.radius*(.25+q*.75),h.radius*(.25+q*.75)/1.6,0,0,TAU);ctx.stroke();for(let i=0;i<12;i++){const a=i*TAU/12;line(x+Math.cos(a)*h.radius*.2,h.y+Math.sin(a)*h.radius*.12,x+Math.cos(a)*h.radius*.8,h.y+Math.sin(a)*h.radius*.5,'#ac9377',2);}}
      ctx.restore();}
    for(const e of game.enemies)if(!e.dead&&e.pageSlowUntil>game.time){const x=e.x-camera;if(x<-100||x>W+100)continue;for(let i=0;i<4;i++){const a=game.time*2.2+i*TAU/4,xx=x+Math.cos(a)*30,yy=e.y-e.z-40+Math.sin(a)*16-i*8;ctx.save();ctx.translate(xx,yy);ctx.rotate(Math.sin(a)*.4);ctx.fillStyle='#ded7bb';ctx.fillRect(-5,-7,10,14);line(-3,-3,3,-3,'#786d62',1);line(-3,1,2,1,'#786d62',1);ctx.restore();}}
    const b=run.effects.v16.scorchBreath;if(b){const life=b.until-game.time;if(life<=0)run.effects.v16.scorchBreath=null;else{ctx.save();ctx.globalAlpha=life*.65;for(let i=0;i<16;i++)AshBattleArt.flame(ctx,b.x-camera+b.face*i*35,b.y-70+i*4,28+i,i,game.time,'#f6ad54');ctx.restore();}}
  }
  function drawFireWhirlwind(){
    const p=game.p,a=p.attack;if(p.state!=='heavy'||!a?.fireWhirlArcs||p.t<a.wind||p.t>a.wind+a.active)return;
    const q=clamp((p.t-a.wind)/a.active,0,1),r=a.range*.95*1.3,phase=q*TAU,x=p.x-camera,y=p.y-p.z-35;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ff792e';ctx.shadowBlur=18;
    for(let i=0;i<a.fireWhirlArcs;i++){
      const angle=phase+i*TAU/a.fireWhirlArcs,alpha=.35+Math.sin(q*Math.PI)*.5;
      AshBattleArt.ribbon(ctx,x,y,r,angle,'#f46d25',alpha,.32);
      AshBattleArt.ribbon(ctx,x,y,r-5,angle+.05,'#ffd68a',alpha*.8,.32);
      for(let j=0;j<5;j++){const t=angle-j*.15;AshBattleArt.flame(ctx,x+Math.cos(t)*r,y+Math.sin(t)*r*.32,18+j*3,i*5+j,game.time,'#ff9c42');}
    }
    ctx.restore();
  }
  function render(){
    visualFrame=null;visualScene();
    ctx.clearRect(0,0,W,H);ctx.save();
    if(reviveCinematic){const q=clamp(reviveCinematic.t/reviveCinematic.life,0,1),gray=Math.max(0,Math.sin(q*Math.PI)*.72+(1-q)*.12);ctx.filter=`grayscale(${gray}) saturate(${1-gray*.38})`;}
    if(shake>0&&mode==='playing'&&!reviveCinematic)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.6);
    background();if(run?.continuousWorld&&mode!=='title')drawWorldLandmarks();
    if(run&&mode!=='title'){AshBattleArt.dragonGround(ctx,run.effects.dragonRoar,camera,W,game.time);drawV18Ground();}
    if(mode==='title'){
      drawTitleComposition();
    }else{
      const bh=run.effects.blackHole?.field;if(bh)AshBattleArt.vortex(ctx,bh.x-camera,bh.y,bh.radius,game.time,true);
      for(const ration of run.effects.fieldRations){
        const x=ration.x-camera,y=ration.y;
        if(x<-40||x>W+40)continue;
        ctx.save();ctx.translate(x,y);ctx.globalAlpha=Math.min(1,ration.life*2);
        ctx.fillStyle='rgba(26,36,31,.35)';ctx.beginPath();ctx.ellipse(0,2,14,5,0,0,TAU);ctx.fill();
        ctx.fillStyle=ration.size===3?'#f0bc78':ration.size===2?'#d5dca4':'#b7d89b';ctx.strokeStyle='#f8f5d0';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(-10,-14,20,12,4);ctx.fill();ctx.stroke();
        ctx.fillStyle='#79583b';ctx.fillRect(-3,-12,6,8);
        if(ration.size>1){ctx.fillStyle='#f8e7b2';ctx.fillRect(-2,-19,4,5);}
        ctx.restore();
      }
      for(const g of ghosts)fighter(g,true,true);
      const entities=[...game.enemies.filter(e=>!e.furnaceConsumed&&!e.timeErased&&(e.dummy||!e.dead||e.rushCorpseUntil>run.time||e.deathT<.8)),{...game.p,isPlayer:true}].sort((a,b)=>a.y-b.y);
      let detailedDeaths=0;
      for(const e of entities){if(e.dead&&!TYPES[e.type]?.boss&&++detailedDeaths>64){const x=e.x-camera;if(x>=-80&&x<=W+80){ctx.save();ctx.globalAlpha=Math.max(0,1-e.deathT/.8);ellipse(x,e.y,18*(e.scale||1),6,'#84748d');ctx.restore();}continue;}if(e.groundDragged&&e.dead)continue;if(e.groundDrag)drawGroundDrag(e);else if(TYPES[e.type]?.final)drawDemon(e);else fighter(e,!!e.isPlayer);}drawCrowdedBossIndicators();drawV18Overlays();AshBossModels.effects(ctx,game,camera,{warning:warningGlint,mist:mistCloud});
      drawV12PersistentFX();drawPeaShooter();drawKillingAuraFX();drawBreakMomentumWaves();drawIntimidationFX();drawCurseFX();drawSauronEyeFX();arrows();drawFX();for(const e of game.enemies)enemyBars(e);
    }
    rain();
    const vignette=ctx.createRadialGradient(W*.52,H*.45,260,W*.52,H*.45,850);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#020b12a6');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
    if(killInk>0){ctx.fillStyle=`rgba(4,12,17,${killInk*2.1})`;ctx.fillRect(0,0,W,H);line(W*.23,H*.67,W*.81,H*.30,'#ffe0a5',2);}
    if(run?.effects?.timeFlow?.remaining>0){const q=clamp(run.effects.timeFlow.remaining/1.5,0,1);ctx.fillStyle=`rgba(92,146,188,${.10+.07*q})`;ctx.fillRect(0,0,W,H);ctx.strokeStyle=`rgba(198,230,255,${.22*q})`;ctx.lineWidth=4;ctx.strokeRect(8,8,W-16,H-16);}
    if(game.p.stealth){ctx.fillStyle='rgba(68,50,92,.105)';ctx.fillRect(0,0,W,H);}
    if(screenFlash){ctx.fillStyle=screenFlash>0?`rgba(219,247,230,${screenFlash*1.5})`:`rgba(182,57,39,${-screenFlash*1.4})`;ctx.fillRect(0,0,W,H);}
    if(executeFlash>0){ctx.fillStyle=`rgba(8,15,21,${executeFlash})`;ctx.fillRect(0,0,W,H);}
    ctx.restore();if(mode!=='title')hud();
  }
  function frame(now){
    visualCounts.clear();
    if(mode==='enemyReview'){requestAnimationFrame(frame);drawEnemyReview();return;}
    // Keep the scheduler alive if a simulation or Canvas effect throws. A fresh run
    // must remain possible; expose the original exception for reproducible diagnosis.
    requestAnimationFrame(frame);
    let phase='simulation';
    try {
    const dt=Math.min((now-last)/1000,.05);last=now;if(!reviveCinematic)realTime+=dt;if(game&&realTime>=(rig.nextPrune||0)){rig.nextPrune=realTime+2;const live=new Set(game.enemies.map(e=>e.id));for(const id of rig.records.keys())if(typeof id==='number'&&!live.has(id))rig.records.delete(id);}
    if(mode==='playing'){
      if(reviveCinematic){
        accumulator=0;pressed={};reviveCinematic.t+=dt;
        if(reviveCinematic.t>=reviveCinematic.life){const done=reviveCinematic;reviveCinematic=null;screenFlash=Math.max(screenFlash,.16);ring(done.x,done.y,'#e4d9a5',145,done.z+35);burst(done.x,done.y,44,'#dccb92',300,done.z+50);sound('parry');}
      }else{
        accumulator+=dt;
        while(accumulator>=1/120){
          const events=pressed;pressed={};game.viewBounds={left:camera,right:camera+W};run.step(1/120,keys,events);processEvents();accumulator-=1/120;
          if(reviveCinematic){accumulator=0;break;}
          if(mode!=='playing'){accumulator=0;break;}
        }
        if(!reviveCinematic){const maxCamera=Math.max(0,game.bounds.right-W+80),target=run.loopWorld?game.p.x-620:clamp(game.p.x-620,0,maxCamera);camera+=(target-camera)*(1-Math.exp(-dt*5));updateFX(dt);}
      }
    }else if(mode==='dead')updateFX(dt);
    else accumulator=0;
    updateBattleMusic(dt);
    phase='render';render();
    if(mode==='victory')drawVictoryCG(!!run.challenge);
    }catch(error){showRuntimeError(error,phase);console.error(error);accumulator=0;resetDrawingContext();if(mode==='playing')pause();}
  }
  // Readable debug surface for local simulation / browser smoke tests.
  const trainingTest={
    require(){if(!run?.training)throw new Error('测试接口仅供测试场景使用');return run;},
    pick(id){return this.require().trainingPick(id);},
    spawn(type='sword',count=1,options={}){const r=this.require();if(!TYPES[type])throw new Error('未知敌人类型: '+type);return Array.from({length:Math.max(1,Math.min(100,Math.floor(count)))},(_,i)=>{const e=game.spawn(type,options.x??game.p.x+220+(i%8)*65,options.y??440+Math.floor(i/8)%5*48);e.spawnDelay=0;e.alerted=true;game.trigger('onEnemySpawn',{enemy:e,training:true});return e.id;});},
    fullHealth(){this.require();game.p.hp=game.p.maxHp;game.p.grayHp=0;return game.p.hp;},
    fullMomentum(){this.require();return run.momentum=game.rules.momentumMax;},
    suicide(){this.require();game.p.hp=game.p.grayHp=0;game.status='dead';game.emit('defeat');},
    restart(){const r=this.require();start(r.arena,false,true);return true;},
    snapshot(){const r=this.require();return {time:r.time,status:game.status,player:{hp:game.p.hp,grayHp:game.p.grayHp,momentum:r.momentum,state:game.p.state},enemies:game.enemies.map(e=>({id:e.id,type:e.type,hp:e.hp,posture:e.posture,state:e.state,dead:e.dead})),error:window.AshLastError||null};}
  };
  window.AshGame={test:trainingTest,get game(){return game;},get run(){return run;},get mode(){return mode;},get music(){return music.snapshot();},start,pause,chooseUpgrade,returnTitle};
  // Explicit opt-in review view: renders the same fighters, weapons and tells as combat.
  function drawEnemyReview(){
    camera=0;ctx.resetTransform();ctx.fillStyle='#152229';ctx.fillRect(0,0,W,H);
    text('敌人重做验收 · '+reviewParams.get('enemyReview')+' · '+(Number(reviewParams.get('page')||0)+1),35,40,22,'#e0dfc5');
    drawV18Ground();game.enemies.forEach((e,i)=>{const [x,y]=reviewPosition(i);e.x=x;e.y=y;e.face=Number(reviewParams.get('face'))===-1?-1:1;
      line(x-80,y+3,x+100,y+3,'#526060',1);if(TYPES[e.type].final)drawDemon(e);else fighter(e);text(TYPES[e.type].name+(reviewParams.get('enemyReview')==='forms'?' · '+['','少','中','多','很多'][e.swarmTier]:''),x,y+36,18,TYPES[e.type].elite?'#edca68':'#c6d8d5','center');text(e.type+' · '+TYPES[e.type].weapon,x,y+59,12,'#91a8a7','center');
      if(reviewParams.has('hurtbox')&&isBoss(e)){const b=game.enemyHurtbox(e);ctx.save();ctx.strokeStyle='#80efd2';ctx.fillStyle='#80efd218';ctx.lineWidth=1.5;ctx.fillRect(b.x-b.rx,b.y-b.top,b.rx*2,b.top-b.bottom);ctx.strokeRect(b.x-b.rx,b.y-b.top,b.rx*2,b.top-b.bottom);ctx.restore();}
    });if(reviewParams.has('projectileFX'))arrows();if(reviewParams.has('playerFX')){fighter(game.p,true);drawKillingAuraFX();drawFX();}drawV18Overlays();AshBossModels.effects(ctx,game,camera,{warning:warningGlint,mist:mistCloud});
  }
  function reviewPosition(i){if(reviewParams.has('focus')||reviewParams.get('enemyReview')==='bosses')return [180+i%4*360,350+Math.floor(i/4)*330];return reviewParams.get('enemyReview')==='effects'?[140+i%3*450,280+Math.floor(i/3)*310]:[110+i%6*240,260+Math.floor(i/6)*245];}
  const reviewParams=new URLSearchParams(location.search);
  if(reviewParams.has('enemyReview')){
    start(0,false,true);mode='enemyReview';music.setRunning(false);music.stop();camera=0;game.enemies=[];game.time=2;realTime=2;
    const group=reviewParams.get('enemyReview'),page=Number(reviewParams.get('page')||0),ids=reviewParams.has('ids')?reviewParams.get('ids').split(',').filter(id=>TYPES[id]).slice(0,12):group==='bosses'?AshCombat.ENEMY_CATALOG.BOSSES.map(b=>b.id).slice(page*8,page*8+8):group==='forms'?['e62','e62','e62','riot_swarm','riot_swarm','riot_swarm','riot_swarm','locust','locust','locust']:group==='effects'?['e13','e26','e44','mage','priest','e35']:Object.keys(TYPES).filter(id=>group==='summons'?['zombie','rot_tentacle','rot_tentacle_elite','poison_maggot'].includes(id):TYPES[id].stage===group&&!TYPES[id].boss&&!['zombie','rot_tentacle','rot_tentacle_elite','poison_maggot'].includes(id)).slice(page*12,page*12+12);
    for(const [i,id] of ids.entries()){const [x,y]=reviewPosition(i),e=game.spawn(id,x,y);e.spawnDelay=0;e.face=1;e.state='idle';if(reviewParams.get('pose')){const key=TYPES[id].moveKeys?.[Number(reviewParams.get('move')||0)];if(key){game.beginEnemyMove(e,key);e.state=reviewParams.get('pose');e.t=e.state==='active'?e.attack.active*.5:e.attack.wind*.75;}}if(reviewParams.has('shell'))e.shellBroken=true;
      if(group==='forms')e.swarmTier=[3,2,1,4,3,2,1,3,2,1][i];
      if(group==='effects'){
        if(id==='e13'||id==='e26')game.createEnemyZone({x:x+65,y,radius:110,tar:id==='e13',poison:id==='e26',flags:[]});
        else if(id==='e44')e.fogT=2.8;
        else{const key=id==='mage'?'mage_m2':id==='priest'?'priest_m3':'e35_m3';game.p.x=x+110;game.p.y=y;game.beginEnemyMove(e,key);e.state='active';e.t=e.attack.active*.5;game.resolveEnemySpell(e,e.attack);}
      }
    }
    if(group==='effects')for(const h of game.enemyHazards)h.life-=.12;
    if(reviewParams.has('meditation')){run.effects.v11.meditation.active=true;game.p.x=1150;game.p.y=510;}
  }
  requestAnimationFrame(frame);
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeGame,{once:true});
  else initializeGame();
}
if(typeof module==='object'&&module.exports){
  module.exports={Systems:AshSystems,BattleArt:AshBattleArt,Visuals:AshV16Art,VictoryArt:AshVictoryArt,sampleDaylight,
    get Survival(){return getSurvival();}};
  for(const name of ['Run','ASCENSIONS','DUAL_ASCENSIONS','XP','MOMENTUM_BURST','XP_FOR_LEVEL'])
    Object.defineProperty(module.exports,name,{enumerable:true,get:()=>getSurvival()[name]});
}
