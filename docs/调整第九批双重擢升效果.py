"""精确落实200–311效果调整，保留现有其他修改。只运行一次。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'ascensions.js'
code = path.read_text(encoding='utf-8')

def replace(old, new):
    global code
    assert code.count(old) == 1, (old[:180], code.count(old))
    code = code.replace(old, new)

# Temporary bounty follows actual Bully procs and gives 35% of the basic bounty package.
replace("marked=e.id===f.v11.bountyId,over=", "marked=e.id===f.v11.bountyId,beastMarked=e.id===f.dualState.beastBountyId,over=")
replace("if(ready){e.bullyT=now+", "if(ready){if(this.pair('bully','bounty'))e.weakBounty=now+3;e.bullyT=now+")
replace("if(pair('bully','bounty')&&wasBully)e.weakBounty=g.time+3;", "")
replace(",wasBully=!f.bully.has(e.id);old(event);", ";old(event);")
replace("if(e.weakBounty>g.time&&!marked){run.xp+=7;run.totalXP+=7;f.addGray(5,'weakBounty');g.emit('bountyClaim',{x:e.x,y:e.y,z:(e.z||0)+76*e.scale,targetId:e.id,scale:e.scale,face:e.face,rank:1,boss:isBoss(e)});}", "if(pair('bully','bounty')&&e.weakBounty>g.time&&!marked&&!beastMarked){const r=f.rank('bounty'),bossReward=boss(e)&&r===3,xp=(bossReward?35:[0,8,13,20][r])*.35;run.xp+=xp;run.totalXP+=xp;f.addGray((bossReward?18:[0,7,11,14][r])*.35,'weakBounty');if(r>=2)g.heal((bossReward?16:7)*.35,{source:'weakBounty'});g.emit('bountyClaim',{x:e.x,y:e.y,z:(e.z||0)+76*e.scale,targetId:e.id,scale:e.scale,face:e.face,rank:1,boss:isBoss(e)});}")
replace("v11ModifyKillXP(event){if(event.enemy?.id===this.v11.bountyId||event.enemy?.id===this.dualState.beastBountyId)event.value*=[1,1.35,1.55,1.85][this.rank('bounty')||0];}", "v11ModifyKillXP(event){const full=event.enemy?.id===this.v11.bountyId||event.enemy?.id===this.dualState.beastBountyId,mult=[1,1.35,1.55,1.85][this.rank('bounty')||0];if(full)event.value*=mult;else if(this.pair('bully','bounty')&&event.enemy?.weakBounty>this.game.time)event.value*=1+(mult-1)*.35;}")

replace("for(const o of near(e,115))hit(o,28,16,['fire']);", "for(const o of near(e,115))hit(o,50,30,['fire']);")
replace("p.evasionFatigue-2);});", "p.evasionFatigue-5);});")
replace("p.dashRegen-.8);if(p.dashCharges", "p.dashRegen-.3);if(p.dashCharges")
replace("if(c.burning){g.heal(.4*dt,{source:'holyFire',quiet:true});", "if(c.burning){if(inside)g.heal(.4*dt,{source:'holyFire',quiet:true});")

replace("if(pair('delayedWound','bounty')&&e.id===f.v11.bountyId)", "if(pair('delayedWound','bounty')&&(e.id===f.v11.bountyId||e.id===f.dualState.beastBountyId))")
replace("if(!e.dead&&!e.furnaceCapture&&w.amount>=e.hp)f.slay(e,'woundBounty');", "if(!e.dead&&!e.furnaceCapture&&w.amount>=e.hp)f.v11DetonateWounds(e,'woundBounty');")

# Any curse-caused death, including periodic damage and the merged Eye, earns two layers.
replace("if(pair('curse','executioner')&&['curse','endEye','dualEye'].includes(source)){f.executioner.stacks=Math.min(20,f.executioner.stacks+2);f.executioner.remaining=12;}", "")
replace("old(event);if(e.suppressDeathrattle)return;", "old(event);if(e.suppressDeathrattle)return;if(pair('curse','executioner')&&tags.some(t=>['curse','endEye','dualEye'].includes(t))){f.executioner.stacks=Math.min(20,f.executioner.stacks+2);f.executioner.remaining=12;}")

# Each third wind cyclone is strengthened independently of unrelated sword-Qi waves.
replace("w.damage=w.strong?100:70;w.posture=w.strong?120:90;", "f.swordQi.windCount=(f.swordQi.windCount||0)+1;w.windStrong=f.swordQi.windCount%3===0;w.strong=w.strong||w.windStrong;w.damage=w.windStrong?100:70;w.posture=w.windStrong?120:90;")

replace("if(dex)d+=e.maxHp*(isBoss(e)?.01:.02);", "if(dex)d+=e.maxHp*(isBoss(e)?.008:.018);")
replace("this.ringBladePulse({x:rb.startX+(e.x-rb.startX)*q,y:rb.startY+(e.y-rb.startY)*q,z:e.z||0},'dashPath',.62)", "this.ringBladePulse({x:rb.startX+(e.x-rb.startX)*q,y:rb.startY+(e.y-rb.startY)*q,z:e.z||0},'dashPath',.60)")
replace("this.ringBladePulse(p,'dashPath',.62)", "this.ringBladePulse(p,'dashPath',.60)")
replace("this.ringBladePulse(p,'evasion',.82)", "this.ringBladePulse(p,'evasion',.80)")

# Controlled corpses keep strong explosions even if Overkill also fires, with stronger random DoTs.
replace("rank:cb,maxHpBonus:corpseMaxHpBonus,overkillBonus:over*.50", "rank:cb,strong:this.pair('mindControl','corpseBomb')&&controlled,maxHpBonus:corpseMaxHpBonus,overkillBonus:over*.50")
replace("this.addStatus(e,k,8,6,['corpseBomb',tag]);", "this.addStatus(e,k,b.strong?15:8,6,['corpseBomb',tag]);")

replace("if(event._flawDismantle){const xp=6;", "if(event._flawDismantle&&!isBoss(e)){const xp=this.run.enemyBaseKillXP(e)*.03;")
replace("20+e.maxPosture*(isBoss(e)?.012:.035)", "20+e.maxPosture*(isBoss(e)?.02:.05)")

# A subsequent armor-rending attack detonates the nail; all nearby posture damage is exactly 55%.
replace("if(nail&&nail.serial!==serial&&tags.some(t=>['comboFinisher','heavy'].includes(t)))", "if(nail&&nail.serial!==serial&&this.v11IsHeavy(tags))")
replace("8,38+e.maxPosture*(isBoss(e)?.018:.055),['rockNail','shockwave']", "14*.55,(52+e.maxPosture*(isBoss(e)?.035:.10))*.55,['rockNail','shockwave']")
replace("if(t.includes('quakeStomp'))f.quakeEffectHit(event);", "if(t.includes('quakeStomp'))f.quakeEffectHit(event);if(t.includes('sawStorm')&&pair('armorRend','sawStorm')&&e.armorRend>0&&pair('armorRend','rockThrust'))f.detonateRockNail(e,'armorRend');")
replace("this.chance(.76,'levelDoom')", "this.chance(.80,'levelDoom')")

# Frost storm pulses keep their fractional clock at 0.6s, including under larger simulation steps.
replace("e.frostSlow=Math.min(e.frostSlow||1,isBoss(e)?.58:.48);", "e.frostSlow=Math.min(e.frostSlow||1,.48);")
replace("if(frostStorm&&(storm.frostHits.get(e.id)||0)>=.6){storm.frostHits.set(e.id,0);this.applyFrostStack(e,this.rank('frostTrace'),{storm:true});}", "if(frostStorm){let elapsed=storm.frostHits.get(e.id)||0;while(elapsed>=.6-1e-9&&!e.dead){elapsed=Math.max(0,elapsed-.6);this.applyFrostStack(e,this.rank('frostTrace'),{storm:true});}storm.frostHits.set(e.id,elapsed);}")

path.write_bytes(code.encode('utf-8'))

# Share the normal enemy XP basis, including enemy multipliers and difficulty, with Flaw exploitation.
path = ROOT / 'survival.js'
code = path.read_text(encoding='utf-8')
replace("    rewardKill({enemy,tags}){", "    enemyBaseKillXP(enemy){const rawBase=TYPES[enemy.type]?.xp||XP[enemy.type]||16;return Math.max(rawBase,Math.round(rawBase*(enemy.xpMultiplier||1)))*this.enemyXPFactor();}\n    rewardKill({enemy,tags}){")
replace("const rawBase=TYPES[enemy.type]?.xp||XP[enemy.type]||16,base=Math.max(rawBase,Math.round(rawBase*(enemy.xpMultiplier||1)))*this.enemyXPFactor();", "const base=this.enemyBaseKillXP(enemy);")
path.write_bytes(code.encode('utf-8'))
print('PASS batch-nine mechanics updated')
