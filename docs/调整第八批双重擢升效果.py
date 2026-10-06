"""落实双重110–199的数值与效果；精确替换，保留其他修改。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'ascensions.js'
code = path.read_text(encoding='utf-8')

def replace(old, new):
    global code
    assert code.count(old) == 1, (old[:160], code.count(old))
    code = code.replace(old, new)

replace("wrap('updateSkeletons',(old,dt)=>{if(pair('necromancer','synergy')){const varied=new Set(f.skeletons.map(x=>x.type)).size>1;for(const sk of f.skeletons)sk.cd-=dt*(varied?.3:.2);}old(dt);});", "// Skeleton haste is applied to both recovery and attack animation in updateSkeletons.")
replace("if(Number.isFinite(w.pierce))w.pierce+=3;", "w.growthOriginX=w.x;w.growthOriginY=w.y;w.growthDistance=w.speed*w.life;w.travelled=0;")
replace("shot(near(p,1000)[0],65,42,'slag',165)", "shot(near(p,1000)[0],88,66,'slag',165)")
replace("wrap('rollCritical',(old,e)=>{const target=e.enemy;", "wrap('rollCritical',(old,e)=>{const target=e.enemy;if(pair('dismantle','bully')&&target?.bullyVulnT>0)e.critMultBonus=(e.critMultBonus||0)+.1;")
replace("const threshold=.08+((p.downStrikeCount||0)+1)*.05;", "const threshold=.15+Math.min(.25,Math.max(0,p.downStrikeCount||0)*.05);")
replace("hit(e,65*f.v11SummonDamage(),42,['attackSwordSpirit'])", "hit(e,75*f.v11SummonDamage(),55,['attackSwordSpirit'])")
replace("f.bloodGuardState.posture+=12", "f.bloodGuardState.posture+=25")
replace("dt*.5*(p.chargeRateBoost||1)*(p.chargeSpeedPenalty||1)", "dt*(p.chargeRateBoost||1)*(p.chargeSpeedPenalty||1)")
replace("const steps=Math.floor((f.v12.forgeLevels||0)/6),n=Math.max(0,Math.min(8,steps)-s.forge);", "const steps=Math.floor((f.v12.forgeLevels||0)/(pair('rapidGrowth','forgedBlade')?4:6))+(f.rank('forgedBlade')===3?(f.v12.forgeBossSteps||0):0),n=Math.max(0,steps-s.forge);")
replace("if(s.boundSpirit>0)f.lightningSpirit.cooldown-=dt*.6;", "// Bound Spirit haste advances its own clock in updateLightningSpirit.")
replace("pulse(e,110,30,14,['fire'])", "pulse(e,110,64,16,['fire'])")
replace("pulse(c,c.radius,24,20,['holy'])", "pulse(c,c.radius,81,63,['holy'])")
replace("if(e)hit(e,14,0,['curse'])", "if(e)hit(e,29,0,['curse'])")
replace("if(this.rank('dragonRoar')===3)this.dragonRoar.cooldown=Math.max(0,this.dragonRoar.cooldown-3);", "if(this.rank('dragonRoar')===3)this.dragonRoar.cooldown=Math.max(0,this.dragonRoar.cooldown-(this.pair('dragonRoar','newSun')?6:3));")
replace("if(pair('dragonRoar','newSun')&&!f.dragonRoar.pending){f.dragonRoar.cooldown=Math.max(0,f.dragonRoar.cooldown-6);if(f.dragonRoar.cooldown<=0)", "if(pair('dragonRoar','newSun')&&!f.dragonRoar.pending){if(f.dragonRoar.cooldown<=0)")
replace("Math.min(4,(this.executioner.stacks||0)+1)", "Math.min(this.pair('alpha','executioner')?8:4,(this.executioner.stacks||0)+1)")
replace("if(tags.includes('critical'))this.multiplyEnemyDamage(event,1+(e.bullyVuln||0),'vulnerability');", "/* The extra critical multiplier is added before the critical roll. */")
replace("this.game.heal(5,{source:'beastFlaw'});this.run.xp+=6;this.run.totalXP+=6;", "this.game.heal(5,{source:'beastFlaw'});")
replace("modifyKillXP(event){", "modifyKillXP(event){if(this.pair('beastSlayer','flaw')&&TYPES[event.enemy?.type]?.humanoid===false&&(event.tags||[]).some(t=>['heavy','comboFinisher','thrust','downStrike'].includes(t)))event.value*=1.30;")

# Freeze charge-orb expiration and capacity activations until the slow-time ends.
replace("o.life-=dt;o.tick-=dt;o.charge+=dt;", "if(!(this.pair('cooldown','perfectMachine')&&(this.timeFlow.remaining>0||this.dualState.overclock)))o.life-=dt;o.tick-=dt;o.charge+=dt;")
replace("if(this.v12.orbs.length>=3)this.v12ActivateOrb(this.v12.orbs.shift());", "if(this.v12.orbs.length>=3&&!(this.pair('cooldown','perfectMachine')&&(this.timeFlow.remaining>0||this.dualState.overclock)))this.v12ActivateOrb(this.v12.orbs.shift());")
replace("for(let i=0;i<3;i++){const type=['lightning','frost','dark'][Math.floor(g.random()*3)];this.v12.orbs.push({type,rank:3,x:p.x+(i-1)*55,y:p.y-60,life:1.6+i*.25,tick:.15,charge:5,overflow:true});}", "const count=4+Math.min(2,Math.floor(g.random()*3));for(let i=0;i<count;i++){const type=['lightning','frost','dark'][Math.floor(g.random()*3)];this.v12.orbs.push({type,rank:3,x:p.x+(i-(count-1)/2)*55,y:p.y-60,life:1.6+i*.25,tick:.15,charge:5,overflow:true});}")
replace("for(const o of this.v12.orbs.filter(o=>o.overflow))this.v12ActivateOrb(o);this.v12.orbs=this.v12.orbs.filter(o=>!o.overflow);", "const orbs=this.v12.orbs;this.v12.orbs=[];for(const o of orbs)this.v12ActivateOrb(o);")

# Wave travel growth uses each wave's original full travel distance, independent of timestep.
replace("w.y+=(w.scatterVy||0)*dt;w.life-=dt;", "w.y+=(w.scatterVy||0)*dt;w.travelled=(w.travelled||0)+Math.hypot(w.x-old,(w.scatterVy||0)*dt);w.life-=dt;")
replace("let sd=w.damage,sp=w.posture,crit=false;", "const growth=w.growthDistance?1+clamp(Math.min(w.travelled,Math.max(0,(e.x-w.growthOriginX)*w.face-w.length*.30))/w.growthDistance,0,1):1;let sd=w.damage*growth,sp=w.posture,crit=false;")

# Count only living, present unique skeleton types; accelerate animation as well as recovery.
replace("const targets=this.near(p,800).filter(e=>!(e.mindControlT>0)),view=g.viewBounds||{left:p.x-720,right:p.x+720};", "const targets=this.near(p,800).filter(e=>!(e.mindControlT>0)),view=g.viewBounds||{left:p.x-720,right:p.x+720};\n      const kinds=new Set(this.skeletons.filter(s=>!s.dead&&!s.despawning&&s.life>0&&s.x>=view.left-24&&s.x<=view.right+24).map(s=>s.type)).size,haste=this.pair('necromancer','synergy')?1.2+kinds*.2:1;")
replace("s.cd=Math.max(0,s.cd-dt);", "s.cd=Math.max(0,s.cd-dt*haste);")
replace("s.attackAge=before+dt*(s.type==='soul'?1.2:1);", "s.attackAge=before+dt*haste*(s.type==='soul'?1.2:1);")

# A shared visited set permits guaranteed cascades without repeatedly relaunching a victim.
replace("const hit=projectile?.hit||(body._bowlingHit??=new Set());", "const hit=projectile?.hit||(body._bowlingHit??=new Set()),chain=this.pair('bullRush','bowling')?(body._bowlingChainVisited??=new Set([body.id])):null;")
replace("if(body===target||hit.has(target.id)||!g.segmentContact", "if(body===target||hit.has(target.id)||chain?.has(target.id)||!g.segmentContact")
replace("hit.add(target.id);const damage=(corpse?12:10)", "hit.add(target.id);if(chain)chain.add(target.id);const damage=(corpse?12:10)")
replace("this.pair('bullRush','bowling')&&!body._bowlingChainSecondary", "this.pair('bullRush','bowling')")
replace("duration:.58,bowlingChainSecondary:true});\n          g.emit", "duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});\n          g.emit")
# Legacy saved virtual corpse bodies also enter the shared visited-set path.
replace("const x=c.x,y=c.y;c.life-=dt;", "const x=c.x,y=c.y,chain=this.pair('bullRush','bowling')?(c.bowlingChainVisited??=new Set()):null;c.life-=dt;")
replace("if(c.hit.has(e.id)||!g.segmentContact", "if(c.hit.has(e.id)||chain?.has(e.id)||!g.segmentContact")
replace("c.hit.add(e.id);const sp=", "c.hit.add(e.id);if(chain)chain.add(e.id);const sp=")
replace("this.pair('bullRush','bowling')&&!c.bowlingChainSecondary", "this.pair('bullRush','bowling')")
replace("duration:.58,bowlingChainSecondary:true});g.emit", "duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});g.emit")

replace("this.lightningSpirit.cooldown-=dt;if(this.lightningSpirit.cooldown>0)return;", "this.lightningSpirit.cooldown-=dt*(this.v16.boundSpirit>0?1.6:1);if(this.lightningSpirit.cooldown>0)return;")
replace("const chains=[0,1,2,3][r]+(this.pair('lightning','lightningSpirit')?1:0)", "const chains=[0,1,2,3][r]+(this.pair('lightning','lightningSpirit')&&this.v16.boundSpirit>0?1:0)")
# Carry the same visited set through lethal collisions and the physical corpse launch.
replace("if(chain)chain.add(target.id);", "if(chain){chain.add(target.id);target._bowlingChainVisited=chain;}")
replace("if(chain)chain.add(e.id);", "if(chain){chain.add(e.id);e._bowlingChainVisited=chain;}")
replace("if(rank===3&&g.isSmallEnemy?.(target)&&(this.pair('bullRush','bowling')||g.random()<this.chance(.40,'bowlingChain')))g.launchEnemy(target,body.x-(body.knockX||1)*.01,body.y-(body.knockY||0)*.01,{force:corpse?650:620,lift:corpse?230:220,duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});", "if(rank===3&&g.isSmallEnemy?.(target)&&(this.pair('bullRush','bowling')||g.random()<this.chance(.40,'bowlingChain'))){const fromX=body.x-(body.knockX||1)*.01,fromY=body.y-(body.knockY||0)*.01;if(chain&&target.dead)g.launchCorpse(target,fromX,fromY,{force:650,lift:230,rank:3});else g.launchEnemy(target,fromX,fromY,{force:corpse?650:620,lift:corpse?230:220,duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});}")
replace("if(c.rank===3&&g.isSmallEnemy?.(e)&&(this.pair('bullRush','bowling')||g.random()<this.chance(.40,'bowlingChain')))g.launchEnemy(e,c.x-c.vx*.01,c.y-c.vy*.01,{force:650,lift:230,duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});", "if(c.rank===3&&g.isSmallEnemy?.(e)&&(this.pair('bullRush','bowling')||g.random()<this.chance(.40,'bowlingChain'))){if(chain&&e.dead)g.launchCorpse(e,c.x-c.vx*.01,c.y-c.vy*.01,{force:650,lift:230,rank:3});else g.launchEnemy(e,c.x-c.vx*.01,c.y-c.vy*.01,{force:650,lift:230,duration:.58,bowlingChainSecondary:true,bowlingChainVisited:chain});}")

path.write_bytes(code.encode('utf-8'))
path = ROOT / 'combat.js'
code = path.read_text(encoding='utf-8')
replace("source=null,bowlingChainSecondary=false}={}", "source=null,bowlingChainSecondary=false,bowlingChainVisited=null}={}")
replace("e._bowlingChainSecondary=bowlingChainSecondary;e._bowlingLastX", "e._bowlingChainSecondary=bowlingChainSecondary;e._bowlingChainVisited=bowlingChainVisited;e._bowlingLastX")
path.write_bytes(code.encode('utf-8'))
print('PASS: batch-eight mechanics updated')
