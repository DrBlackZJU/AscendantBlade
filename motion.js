/* Continuous skeletal clips. Timelines share endpoints across startup / strike / recovery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AshMotion=api;})(globalThis,()=>{
  'use strict';
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const BASE={hipX:0,hipY:-35,lean:0,head:0,hx:23,hy:-51,bx:-15,by:-43,angle:-.8,backAngle:-2.2,
    fx:18,fy:0,rx:-15,ry:0,bodyLift:0,rotation:0,bowPull:0,yaw:0};
  function blend(a,b,t){const out={};for(const k of Object.keys(BASE))out[k]=a[k]+(b[k]-a[k])*t;return out;}
  function pose(values={}){return {...BASE,...values};}
  function curve(frames,t){
    if(t<=frames[0][0])return frames[0][1];
    for(let i=1;i<frames.length;i++)if(t<=frames[i][0]){
      const a=frames[i-1],b=frames[i];return blend(a[1],b[1],smooth((t-a[0])/(b[0]-a[0])));
    }
    return frames[frames.length-1][1];
  }
  function strikePoses(style,heavy=false){
    let anticipate,impact,follow;
    if(style==='guard'){
      anticipate=pose({hipY:-32,lean:-.08,hx:27,hy:-57,bx:18,by:-49,angle:-1.35,fx:22,rx:-21});impact=anticipate;follow=anticipate;
    }else if(style==='shieldBash'){
      anticipate=pose({hipX:-4,lean:-.13,hx:21,hy:-48,bx:13,by:-40,angle:0,fx:23,rx:-23});
      impact=pose({hipX:9,lean:.25,hx:46,hy:-47,bx:35,by:-40,angle:0,fx:31,rx:-24});
      follow=pose({hipX:11,lean:.25,hx:43,hy:-46,bx:32,by:-39,angle:0,fx:32,rx:-23});
    }else if(style==='offhand'){
      anticipate=pose({hipX:-5,lean:-.18,hx:20,hy:-48,bx:-22,by:-80,angle:-1,backAngle:-2.25,fx:22,rx:-24});
      impact=pose({hipX:8,lean:.22,hx:16,hy:-55,bx:41,by:-53,angle:-1.1,backAngle:.05,fx:30,rx:-23});
      follow=pose({hipX:10,lean:.28,hx:13,hy:-53,bx:29,by:-28,angle:-.9,backAngle:1.3,fx:32,rx:-24});
    }else if(style==='cast'){
      anticipate=pose({hipY:-34,lean:-.08,hx:10,hy:-70,bx:29,by:-67,angle:-1.52,backAngle:-.3,fx:20,rx:-18});
      impact=pose({hipX:5,lean:.12,hx:17,hy:-63,bx:43,by:-60,angle:-1.36,backAngle:0,fx:24,rx:-21});
      follow=pose({hipX:3,lean:.1,hx:17,hy:-60,bx:39,by:-58,angle:-1.35,fx:23,rx:-20});
    }else if(style==='staffSlam'){
      anticipate=pose({hipY:-38,hx:22,hy:-78,bx:17,by:-64,angle:-Math.PI/2,fx:23,rx:-22});
      impact=pose({hipY:-28,lean:.18,hx:27,hy:-42,bx:25,by:-55,angle:-Math.PI/2,fx:29,rx:-25});follow=impact;
    }else if(style==='throw'||style==='spit'){
      anticipate=pose({hipX:-7,lean:-.25,hx:-8,hy:-78,bx:-22,by:-44,angle:-2.1,fx:23,rx:-22});
      impact=pose({hipX:10,lean:.37,hx:44,hy:-61,bx:-5,by:-40,angle:0,fx:32,rx:-25});
      follow=pose({hipX:12,lean:.33,hx:38,hy:-47,bx:-2,by:-43,angle:.4,fx:33,rx:-25});
    }else if(style==='consume'||style==='reload'||style==='sacrifice'){
      anticipate=pose({hipY:-20,lean:.62,head:.35,hx:19,hy:-21,bx:8,by:-24,angle:1.2,backAngle:1.8,fx:25,rx:-25});
      impact=pose({hipY:-26,lean:.28,hx:13,hy:-59,bx:7,by:-57,angle:1.5,backAngle:1.5,fx:23,rx:-22});
      follow=style==='sacrifice'?pose({hipY:-18,lean:.8,hx:27,hy:-13,bx:-6,by:-15,angle:1.4,fx:29,rx:-24}):impact;
    }else if(style==='overhead'||style==='leap'){
      anticipate=pose({hipX:-5,hipY:-32,lean:-.20,hx:-7,hy:-99,bx:5,by:-84,angle:-2.16,fx:24,rx:-23,head:-.08,bodyLift:style==='leap'?30:0});
      impact=pose({hipX:9,hipY:-28,lean:.35,hx:33,hy:-44,bx:18,by:-51,angle:.32,fx:34,rx:-25,bodyLift:0});
      follow=pose({hipX:12,hipY:-25,lean:.43,hx:30,hy:-26,bx:8,by:-46,angle:1.18,fx:37,rx:-24});
    }else if(style==='thrust'||style==='draw'){
      anticipate=pose({hipX:-8,hipY:-30,lean:-.15,hx:style==='draw'?-9:-24,hy:-48,bx:-23,by:-54,angle:style==='draw'?2.55:-.08,fx:25,rx:-26});
      impact=pose({hipX:12,hipY:-32,lean:.38,hx:48,hy:-58,bx:-12,by:-59,angle:-.03,fx:36,rx:-28});
      follow=pose({hipX:16,hipY:-31,lean:.45,hx:52,hy:-54,bx:-9,by:-49,angle:.12,fx:40,rx:-27});
    }else if(style==='bow'||style==='crossbow'){
      anticipate=pose({lean:-.10,hx:27,hy:-61,bx:-19,by:-62,angle:0,bowPull:25,fx:18,rx:-20});
      impact=pose({lean:-.14,hx:25,hy:-61,bx:-26,by:-62,angle:-.025,bowPull:0,fx:18,rx:-20});
      follow=pose({lean:-.10,hx:26,hy:-60,bx:-18,by:-57,angle:.015,bowPull:0,fx:18,rx:-20});
    }else if(style==='bash'){
      anticipate=pose({hipX:-5,hipY:-30,lean:-.2,hx:11,hy:-48,bx:8,by:-57,angle:.75,fx:24,rx:-23});
      impact=pose({hipX:10,lean:.42,hx:17,hy:-44,bx:39,by:-59,angle:.25,fx:32,rx:-25});
      follow=pose({hipX:14,lean:.35,hx:20,hy:-40,bx:43,by:-52,angle:.48,fx:34,rx:-26});
    }else if(style==='reverse'){
      anticipate=pose({hipX:-3,lean:-.1,hx:14,hy:-33,bx:-21,by:-71,angle:1.65,backAngle:-1.85,fx:22,rx:-22});
      impact=pose({hipX:7,lean:.21,hx:35,hy:-50,bx:23,by:-51,angle:-.02,backAngle:-.45,fx:28,rx:-25});
      follow=pose({hipX:10,lean:.1,hx:16,hy:-81,bx:18,by:-42,angle:-1.56,backAngle:.50,fx:29,rx:-22});
    }else{
      anticipate=pose({hipX:-7,hipY:-33,lean:-.24,hx:-19,hy:-72,bx:-14,by:-41,angle:-2.48,fx:24,rx:-24});
      impact=pose({hipX:7,hipY:style==='lowSweep'?-23:-32,lean:.23,hx:33,hy:style==='lowSweep'?-25:-53,bx:-11,by:-48,angle:.02,fx:32,rx:-27});
      follow=pose({hipX:11,hipY:-29,lean:.29,hx:19,hy:-34,bx:8,by:-50,angle:style==='spin'?2.7:1.52,fx:35,rx:-26});
    }
    const settle=blend(follow,BASE,.45);
    return {anticipate,impact,follow,settle};
  }
  function spinPose(q,turns){
    const angle=-.5+Math.PI*2*turns*q,c=Math.cos(angle),s=Math.sin(angle);
    return pose({yaw:angle,hipY:-30-Math.sin(q*Math.PI)*3,lean:Math.sin(angle)*.12,
      hx:38*c,hy:-48+14*s,bx:-25*c,by:-48-9*s,angle:Math.atan2(s*.28,c),
      fx:19*c,rx:-19*c,fy:-Math.max(0,s)*7,ry:-Math.max(0,-s)*7,head:s*.12});
  }
  function attackClip(e,player){
    const a=e.attack;if(!a)return pose();
    const flags=a.flags||[];
    const authored=['guard','shieldBash','offhand','cast','staffSlam','throw','spit','consume','reload','sacrifice'].includes(a.pose);
    const enemyStyle=authored?a.pose:a.ranged?(flags.includes('poison')||flags.includes('burn')?'thrust':(a.pose||'bow')):
      a.ground?'overhead':a.lunge>220?'thrust':flags.includes('pull')?'thrust':(a.pose||'sweep');
    const style=player?(e.state==='heavy'&&e.whirlwindRank?'spin':e.state==='heavy'||e.state==='thrust'||e.attackIndex===2?'thrust':e.attackIndex===3?'overhead':e.attackIndex===1?'reverse':'sweep'):enemyStyle;
    const v=strikePoses(style,e.attackIndex===3);
    let phase,q;
    if(player){if(e.t<a.wind){phase='windup';q=e.t/a.wind;}else if(e.t<a.wind+a.active){phase='active';q=(e.t-a.wind)/a.active;}else {phase='recovery';q=(e.t-a.wind-a.active)/a.recovery;}}
    else{phase=e.state;q=phase==='windup'?e.t/a.wind:phase==='active'?e.t/a.active:1-e.t/(e.recoveryTotal||a.recovery);}
    if(player&&e.state==='heavy'&&e.whirlwindRank){
      const turns=a.whirlTurns||1,end=spinPose(1,turns);
      if(phase==='windup')return blend(BASE,spinPose(0,turns),smooth(q));
      if(phase==='active')return spinPose(q,turns);
      return blend(end,BASE,smooth(q));
    }
    if(phase==='windup')return player&&e.state==='heavy'?v.anticipate:curve([[0,pose()],[.24,blend(BASE,v.anticipate,.28)],[.78,v.anticipate],[1,v.anticipate]],q);
    if(phase==='active')return curve([[0,v.anticipate],[.35,v.impact],[.78,v.follow],[1,v.follow]],q);
    return curve([[0,v.follow],[.28,v.settle],[1,pose()]],q);
  }
  function samplePose(e,player,time){
    const state=e.state||'idle';let p=pose();
    const walking=player?e.moving:e.walking;
    if(walking&&(state==='idle'||state==='charge')){
      const phase=(e.walkDistance||0)/23,walkSpeed=Math.min(1,Math.hypot(e.vx||0,e.vy||0)/100);
      p.fx=Math.sin(phase)*23*walkSpeed+5;p.rx=Math.sin(phase+Math.PI)*23*walkSpeed-3;
      p.fy=-Math.max(0,Math.cos(phase))*12*walkSpeed;p.ry=-Math.max(0,Math.cos(phase+Math.PI))*12*walkSpeed;
      p.hipY-=Math.cos(phase*2)*1.8*walkSpeed;p.lean=.09*walkSpeed;
      p.hx+=Math.sin(phase)*4;p.bx-=Math.sin(phase)*9;p.by+=Math.cos(phase)*3;
    }else {p.hipY+=Math.sin(time*2.7+(e.id||0))*1.1;p.hy+=Math.sin(time*2.7)*.8;}
    const gait={...p};
    if(['attack','heavy','thrust'].includes(state)||!player&&['windup','active','recovery'].includes(state)&&e.attack)p=attackClip(e,player);
    if(state==='charge'){
      const q=clamp((e.charge||0)/(e.chargeMax||1.05)),a=strikePoses('thrust').anticipate;
      p=blend(BASE,a,smooth(Math.min(1,q*3)));p.hipY+=q*3;
      if(walking){p.fx=gait.fx;p.fy=gait.fy;p.rx=gait.rx;p.ry=gait.ry;p.hipY=gait.hipY;p.hipX=0;}
      if(q>=.98){p.hx+=Math.sin(time*42)*.8;p.hy+=Math.cos(time*39)*.6;}
    }
    if(state==='guard'||player&&e.guardFlash>0){
      p=pose({hipY:-31,lean:-.1,hx:26,hy:-63,bx:19,by:-52,angle:-1.32,fx:22,rx:-19});
      if(e.guardFlash>0){p.hx-=Math.sin(e.guardFlash/.22*Math.PI)*7;p.lean-=.12*Math.sin(e.guardFlash/.22*Math.PI);}
    }
    if(state==='dash')p=pose({hipY:-26,lean:.58,hx:-23,hy:-52,bx:-31,by:-42,angle:2.90,fx:34,fy:-2,rx:-33,ry:-8});
    if(state==='plunge')p=pose({hipY:-37,lean:.05,hx:13,hy:-32,bx:-17,by:-76,angle:1.50,fx:11,fy:-8,rx:-13,ry:-5});
    if(state==='landing')p=blend(p,pose({hipY:-23,lean:.2,fx:24,rx:-21,hy:-36,angle:.6}),1-smooth((e.t||0)/.22));
    if(state==='stunned')p=pose({hipY:-19,hipX:4,lean:.48,hx:26,hy:-17,bx:-9,by:-20,angle:.74,fx:26,rx:-20,head:.3});
    if(state==='hurt'||state==='flinch')p=pose({hipY:-32,lean:-.28,hx:9,hy:-44,bx:-28,by:-53,angle:.4,fx:23,rx:-20,head:-.18});
    if(state==='execute'){
      const v=strikePoses('draw');p=curve([[0,pose()],[.18,v.anticipate],[.28,v.anticipate],[.34,v.impact],[.55,v.follow],[.83,pose()]],e.t*.83/(e.execDuration||.83));
    }
    if(e.z>4&&!['plunge','execute','dash'].includes(state)){
      const fall=clamp((-(e.vz||0)+180)/800);p.fx=18;p.fy=-10+fall*8;p.rx=-17;p.ry=-17+fall*12;
      if(state==='idle'){p.bx=-22;p.by=-63;p.angle=-.65-fall*.2;}
    }
    if(e.dead){p=pose({rotation:-1.52*smooth(e.deathT/.40),hipY:-30,hy:-40,angle:.7,fx:22,rx:-25});p.bodyLift=-8*smooth(e.deathT/.4);}
    if(e.guardReaction>0){p.bx=27;p.by=-55;p.lean-=e.guardReaction;}
    return p;
  }
  // Two-link IK preserves limb lengths through all authored keyframes.
  function ik(start,end,lenA,lenB,bend=1){
    const dx=end[0]-start[0],dy=end[1]-start[1],raw=Math.hypot(dx,dy)||.001,d=clamp(raw,.01,lenA+lenB-.001);
    const nx=dx/raw,ny=dy/raw,along=(lenA*lenA-lenB*lenB+d*d)/(2*d),h=Math.sqrt(Math.max(0,lenA*lenA-along*along));
    return [start[0]+nx*along-ny*h*bend,start[1]+ny*along+nx*h*bend];
  }
  function joints(p){
    const hip=[p.hipX,p.hipY-p.bodyLift],chest=[hip[0]+Math.sin(p.lean)*31,hip[1]-Math.cos(p.lean)*31];
    const head=[chest[0]+Math.sin(p.head+p.lean)*14,chest[1]-Math.cos(p.head+p.lean)*14];
    const front=[p.fx,p.fy],rear=[p.rx,p.ry],hand=[p.hx,p.hy-p.bodyLift],back=[p.bx,p.by-p.bodyLift];
    return {hip,chest,head,front,rear,hand,back,knee:ik(hip,front,24,25,-1),rearKnee:ik(hip,rear,24,25,1),elbow:ik(chest,hand,23,24,1),backElbow:ik(chest,back,23,24,-1)};
  }
  // Independent biped rigs: a crouched long-armed scavenger and a rigid stone soldier.
  function bipedCreatureRig(e,anatomy,time){
    const stone=anatomy==='statue',zombie=anatomy==='zombie',crawling=e.type==='devourer',a=e.attack,state=e.state;
    const mix=(a,b,t)=>Array.isArray(a)?a.map((v,i)=>mix(v,b[i],t)):typeof a==='object'?Object.fromEntries(Object.keys(a).map(k=>[k,mix(a[k],b[k],t)])):a+(b-a)*t;
    const rest=zombie?{hip:[-10,-41],chest:[-4,-77],head:[20,-94],hands:[[-28,-44],[41,-53]],feet:[[-26,0],[25,0]],weaponAngles:[0,0],jaw:.15}:
      stone?{hip:[-7,-57],chest:[0,-104],head:[5,-127],hands:[[-47,-66],[48,-65]],feet:[[-33,0],[31,0]],weaponAngles:[-1.95,-1.12],jaw:0}:
      crawling?{hip:[-38,-38],chest:[5,-65],head:[42,-65],hands:[[36,-5],[82,-3]],feet:[[-69,0],[-19,0]],weaponAngles:[0,0],jaw:0}:
      {hip:[-19,-44],chest:[-10,-87],head:[24,-91],hands:[[28,-54],[60,-72]],feet:[[-48,0],[28,0]],weaponAngles:[0,0],jaw:0};
    let r=mix(rest,rest,0),gait=0;
    const walking=e.walking&&state==='idle',phase=(e.walkDistance||0)/(stone?29:20);
    if(walking){
      gait=Math.sin(phase);r.feet[0][0]-=gait*(stone?12:19);r.feet[1][0]+=gait*(stone?12:19);
      r.feet[0][1]=-Math.max(0,Math.cos(phase))*(stone?6:12);r.feet[1][1]=-Math.max(0,-Math.cos(phase))*(stone?6:12);
      r.hip[1]+=Math.abs(gait)*(stone?1.4:4);r.chest[0]+=gait*(stone?1:3);
      r.hands[0][0]+=gait*(stone?2:7);r.hands[1][0]-=gait*(stone?2:7);
      r.weaponAngles[0]+=gait*.025;r.weaponAngles[1]-=gait*.025;
      if(zombie){const stumble=Math.sin(phase*.5);r.chest[0]+=stumble*4;r.head[0]+=stumble*6;r.hands[0][1]+=stumble*6;r.feet[0][0]+=Math.max(0,gait)*5;}
    }else if(state!=='dormant'){const breath=Math.sin(time*2+(e.id||0))*(stone?.18:1.1);r.chest[1]+=breath;r.head[1]+=breath;}
    if(a&&['windup','active','recovery'].includes(state)){
      const wind=mix(rest,rest,0),hit=mix(rest,rest,0),follow=mix(rest,rest,0);
      const consume=a.pose==='consume',stomp=stone&&a.flags?.includes('quake'),over=a.pose==='overhead',spin=a.pose==='spin';
      if(zombie&&a.pose==='bite'){
        wind.head=[8,-96];wind.chest=[-10,-79];wind.hands=[[-18,-60],[28,-64]];wind.jaw=1;
        hit.head=[49,-78];hit.chest=[13,-65];hit.hands=[[6,-53],[49,-56]];hit.jaw=.2;
      }else if(zombie&&a.pose==='leap'){
        wind.hip=[-18,-30];wind.chest=[-16,-56];wind.head=[12,-72];wind.hands=[[-37,-30],[22,-40]];
        hit.hip=[3,-35];hit.chest=[15,-61];hit.head=[44,-75];hit.hands=[[29,-51],[67,-47]];hit.feet=[[-37,0],[35,0]];hit.jaw=.8;
      }else if(zombie&&a.flags?.includes('selfDestruct')){
        wind.hip=[-4,-36];wind.chest=[4,-68];wind.head=[17,-85];wind.hands=[[-8,-65],[26,-65]];wind.jaw=.8;
        hit.chest=[7,-72];hit.head=[24,-92];hit.hands=[[-39,-80],[58,-81]];hit.jaw=1;
      }else if(consume){
        wind.hip=[-23,-33];wind.chest=[0,-62];wind.head=[33,-62];wind.hands=[[-8,-12],[44,-12]];wind.jaw=.55;
        hit.hip=[-23,-37];hit.chest=[-3,-73];hit.head=[29,-83];hit.hands=[[16,-61],[43,-59]];hit.jaw=1;
      }else if(stomp){
        wind.hip[1]-=6;wind.chest[1]-=6;wind.head[1]-=6;wind.feet[1]=[29,-24];wind.hands=[[-53,-75],[48,-76]];
        hit.hip[1]+=5;hit.chest[1]+=5;hit.head[1]+=5;hit.feet[1]=[42,0];hit.weaponAngles=[-1.75,-.95];
      }else if(over){
        const arm=stone&&a.name?.includes('巨斧')?0:1;
        wind.hip[0]-=4;wind.chest[0]-=8;wind.head[0]-=8;wind.hands[arm]=[stone?-21:0,stone?-152:-149];
        wind.hands[1-arm]=stone?[-42,-74]:[-60,-104];wind.weaponAngles[arm]=-2.5;
        hit.hip[0]+=7;hit.chest[0]+=13;hit.chest[1]+=7;hit.head[0]+=14;hit.head[1]+=9;
        hit.hands[arm]=[stone?55:82,stone?-53:-23];hit.weaponAngles[arm]=.58;hit.jaw=1;
        if(!stone)hit.hands[0]=[-17,-34];
      }else{
        wind.chest[0]-=7;wind.head[0]-=11;wind.hands=stone?[[-58,-93],[15,-89]]:[[-60,-101],[22,-117]];
        wind.weaponAngles=[-2.9,-2.4];wind.jaw=.1;
        hit.chest[0]+=stone?7:18;hit.head[0]+=stone?7:22;hit.hands=stone?[[-57,-77],[68,-84]]:[[-26,-54],[88,-60]];
        hit.weaponAngles=spin?[-3.6,.1]:[-2,.15];hit.jaw=1;
      }
      Object.assign(follow,mix(hit,rest,stone?.08:.18));
      if(over&&!stomp){const arm=stone&&a.name?.includes('巨斧')?0:1;follow.weaponAngles[arm]+=.18;}
      const at=(frames,q)=>{for(let i=1;i<frames.length;i++)if(q<=frames[i][0])return mix(frames[i-1][1],frames[i][1],smooth((q-frames[i-1][0])/(frames[i][0]-frames[i-1][0])));return frames.at(-1)[1];};
      if(state==='windup')r=at([[0,rest],[stone?.86:.72,wind],[1,wind]],clamp(e.t/a.wind));
      else if(state==='active')r=at([[0,wind],[zombie?(a.contactFraction??.35):consume?(a.contactFraction||.75):.35,hit],[.9,follow],[1,follow]],clamp(e.t/a.active));
      else r=at([[0,follow],[stone?.32:.15,mix(follow,rest,.08)],[1,rest]],clamp(1-e.t/(e.recoveryTotal||a.recovery)));
    }
    if(state==='dormant'||state==='petrifying'){
      const settled=mix(rest,rest,0);settled.head[1]+=5;settled.hands=[[-45,-56],[45,-55]];settled.weaponAngles=[-1.45,-1.65];
      r=mix(rest,settled,state==='dormant'?1:smooth((e.petrifyT||0)/.85));
    }
    if(state==='stunned'||state==='flinch'){r.chest[0]-=8;r.head[0]-=12;r.chest[1]+=stone?2:7;r.head[1]+=stone?2:10;}
    const hips=[[r.hip[0]-9,r.hip[1]],[r.hip[0]+14,r.hip[1]]];
    const shoulders=[[r.chest[0]-(stone?29:24),r.chest[1]+1],[r.chest[0]+(stone?29:23),r.chest[1]+3]];
    // Clamp the endpoint too: an elbow-only clamp visibly stretched forearms at extreme poses.
    const limit=(from,to,max,min=0)=>{const dx=to[0]-from[0],dy=to[1]-from[1],d=Math.hypot(dx,dy),reach=clamp(d,min,max);return d===reach?to:[from[0]+(d?dx/d:1)*reach,from[1]+(d?dy/d:0)*reach];};
    const armA=stone?34:37,armB=stone?35:42;
    r.hands=r.hands.map((h,i)=>limit(shoulders[i],h,armA+armB-.01,Math.abs(armA-armB)+.01));
    const knees=hips.map((h,i)=>ik(h,r.feet[i],stone?37:35,stone?37:36,i===0?-1:1));
    const elbows=shoulders.map((h,i)=>ik(h,r.hands[i],armA,armB,i===0?-1:1));
    return {...r,hips,shoulders,knees,elbows,gait,lean:0,crawling,consume:a?.pose==='consume'?r.jaw:0};
  }
  // Creature clips use simulation time, distance-driven gait and the same .35 contact as combat.
  function hookBroodPose(e,time){
    const young=e.type==='hook_young',a=e.attack,state=e.state;
    const attacking=a&&['windup','active','recovery'].includes(state);
    const summon=attacking&&a.flags?.includes('spawnMinion'),pull=attacking&&a.flags?.includes('pull');
    const phase=(e.walkDistance||0)/(young?13:22),walking=e.walking&&state==='idle';
    let drive=0,coil=0;
    if(attacking){
      if(state==='windup'){coil=smooth(e.t/Math.max(.001,a.wind));drive=-.28*coil;}
      else if(state==='active'){const q=clamp(e.t/Math.max(.001,a.active)),contact=a.contactFraction??.35;drive=q<=contact?-.28+1.28*smooth(q/contact):1-.25*smooth((q-contact)/(1-contact));coil=1-smooth(q/contact);}
      else drive=.75*(1-smooth(1-e.t/Math.max(.001,e.recoveryTotal||a.recovery)));
    }
    const breath=Math.sin(time*(young?3.4:2.4)+(e.id||0));
    const root=[summon?0:drive*(pull?(young?13:18):10),breath*(young?.8:1.4)+(summon?-coil*4:coil*3)];
    const legs=[];
    for(let i=0;i<6;i++){
      const pair=Math.floor(i/2),far=i%2===0,gait=phase+pair*.7+(far?Math.PI:0);
      const hip=[-33+pair*24,-28],spread=(far?-1:1)*(young?14:18);
      const foot=[hip[0]+spread+(walking?Math.sin(gait)*(young?11:9):0)-drive*4,2-(walking?Math.max(0,Math.cos(gait))*8:0)];
      const knee=ik(hip,foot,25,25,far?-1:1);legs.push([hip,knee,foot]);
    }
    const hooks=[-1,1].map(side=>({
      x:summon?-coil*7:pull?drive*(young?31:43):drive*(side<0?10:23),
      y:summon?-coil*12:pull?-coil*8:drive*side*15,
      angle:summon?-coil*.35:pull?-drive*.18:drive*side*.6,
      open:pull?Math.max(0,drive)*7:0
    }));
    return {root,legs,hooks,head:[drive*(summon?0:4),coil*2],segments:[],tendrils:[],drive,coil,breath,phase,
      anchor:[44+root[0]+hooks[1].x,-38+root[1]+hooks[1].y],
      rotation:state==='knockdown'?.6:e.dead?-1.3*smooth((e.deathT||0)/.4):0};
  }
  function creaturePose(e,anatomy,time){
    if(anatomy==='maggot'){
      const a=e.attack,state=e.state,walking=e.walking&&state==='idle',phase=(e.walkDistance||0)/10;
      let coil=0,drive=0,hop=0;
      if(a&&['windup','active','recovery'].includes(state)){
        const contact=a.contactFraction??.35;
        if(state==='windup'){coil=smooth(clamp(e.t/a.wind));drive=-.18*coil;}
        else if(state==='active'){
          const q=clamp(e.t/a.active),strike=smooth(clamp(q/contact));
          coil=1-strike;drive=q<=contact?-.18+1.18*strike:1-.4*smooth((q-contact)/(1-contact));
          if(a.pose==='leap')hop=q<contact?Math.sin(q/contact*Math.PI)*36:0;
        }else drive=.6*(1-smooth(clamp(1-e.t/Math.max(.001,e.recoveryTotal||a.recovery))));
      }
      const segments=Array.from({length:6},(_,i)=>[-32+i*(11-coil*2)+drive*i,-11+Math.sin(phase-i*.8)*(walking?2.5:.5)+coil*(i%2?-1:2)]);
      const head=[segments[5][0]+12+drive*9,segments[5][1]-2-coil*3];
      return {root:[drive*5,-hop],legs:[],segments,tendrils:[],head,jaw:Math.max(0,drive)*7+coil*2,drive,coil,hop,anchor:[head[0]+drive*5,head[1]-hop],rotation:state==='knockdown'?.45:e.dead?.8*smooth((e.deathT||0)/.4):0};
    }
    if(anatomy==='hookYoung'||anatomy==='brood'&&e.type==='e69')return hookBroodPose(e,time);
    const a=e.attack,state=e.state,phase=(e.walkDistance||0)/19;
    const speed=e.walking&&state==='idle'?clamp(Math.hypot(e.vx||0,e.vy||0)/100):0;
    let drive=0,coil=0;
    if(a&&['windup','active','recovery'].includes(state)){
      if(state==='windup'){coil=smooth(e.t/Math.max(.001,a.wind));drive=-.28*coil;}
      else if(state==='active'){const q=clamp(e.t/Math.max(.001,a.active));drive=q<=.35?-.28+1.28*smooth(q/.35):1-.25*smooth((q-.35)/.65);coil=1-smooth(q/.35);}
      else drive=.75*(1-smooth(1-e.t/Math.max(.001,e.recoveryTotal||a.recovery)));
    }
    if(anatomy==='ghoul'||anatomy==='statue'||anatomy==='zombie'){
      const articulated=bipedCreatureRig(e,anatomy,time);
      const hop=anatomy==='zombie'&&a?.pose==='leap'&&state==='active'?Math.sin(clamp(e.t/(a.active*(a.contactFraction??.7)))*Math.PI)*23:0;
      return {root:[0,-hop],legs:[],segments:[],tendrils:[],drive,coil,breath:0,phase,anchor:[articulated.hands[1][0],articulated.hands[1][1]-hop],articulated,rotation:state==='knockdown'?.6:e.dead?-1.3*smooth((e.deathT||0)/.4):0};
    }
    const breath=Math.sin(time*2.4+(e.id||0)),reach=a?Math.min(36,(a.range||100)*.16):18;
    const root=[drive*reach,breath*1.4-Math.cos(phase*2)*speed*1.5+coil*3];
    const legs=[],segments=[],tendrils=[];
    const count=anatomy==='quadruped'?4:['brood','stitchBeast'].includes(anatomy)?6:anatomy==='centipede'?18:0;
    for(let i=0;i<count;i++){
      const pair=Math.floor(i/2),offset=anatomy==='quadruped'?[0,Math.PI,Math.PI,0][i]:i%2*Math.PI+pair*.65;
      const gait=phase+offset,xx=anatomy==='stitchBeast'?-59+i*24:count===4?-27+i*18:count===6?-30+i*12:-52+pair*13;
      const height=anatomy==='centipede'?22:28,hip=[xx,-height];
      const foot=[xx+Math.sin(gait)*13*speed-drive*7,3-Math.max(0,Math.cos(gait))*10*speed];
      const knee=ik(hip,foot,height*.7,height*.7,i%2?1:-1);
      legs.push([hip,knee,foot]);
    }
    const n=anatomy==='centipede'?9:7;
    for(let i=0;i<n;i++){const wave=Math.sin(phase-i*.7)*speed*5+Math.sin(time*2-i*.65)*1.4;segments.push([-48+i*(anatomy==='centipede'?13:16),-20+wave-(anatomy==='worm'&&i>4?i*2:0)+drive*i*.7]);}
    for(let i=0;i<6;i++){const x=-21+i*8;const sway=Math.sin(time*2.2-i*.6)*8; tendrils.push([[x,-28],[x+sway-drive*8,-6],[x+sway*1.4-drive*15,14+i%2*8]]);}
    const anchors={tower:[10,-76],pillar:[10,-76],floater:[26,-62],worm:[60,-32],quadruped:[48,-42],roller:[28,-34],swarm:[20,-48],centipede:[70,-25],cocoon:[18,-60],bell:[24,-50],brood:[44,-38],blob:[28,-35],crawler:[37,-78],ghoul:[34,-98],aggregate:[35,-74],statue:[50,-100],maw:[60,-48]};
    const anchor=anchors[anatomy]||anchors.blob;
    let articulated=null;
    if(anatomy==='crawler'){
      const statue=anatomy==='statue',crawler=anatomy==='crawler',walking=e.walking&&state==='idle';
      const gait=walking?Math.sin((e.walkDistance||0)/(statue?26:crawler?15:19)):0;
      const lift=walking?Math.abs(gait)*(statue?2:3):0;
      const consume=a?.pose==='consume'&&['windup','active','recovery'].includes(state);
      const consumeQ=consume?(state==='windup'?.3*smooth(e.t/Math.max(.01,a.wind)):state==='active'?.3+.7*smooth(e.t/Math.max(.01,a.active)):1-smooth(1-e.t/Math.max(.01,e.recoveryTotal||a.recovery))):0;
      const lean=drive*(statue?3:9)-coil*(statue?2:5)+(crawler?2:0);
      const hip=[crawler?-14:statue?-8:-4,(crawler?-39:statue?-51:-46)+lift+consumeQ*(statue?7:11)];
      const chest=[(crawler?3:statue?7:2)+lean,(crawler?-71:statue?-98:-91)+lift+consumeQ*(statue?8:13)];
      const head=[(crawler?25:statue?16:9)+lean*1.3,(crawler?-88:statue?-120:-119)+lift+consumeQ*(statue?9:19)];
      const hips=crawler?[[hip[0]-13,hip[1]],[hip[0]+14,hip[1]]]:statue?[[hip[0]-12,hip[1]],[hip[0]+22,hip[1]]]:[[hip[0]-14,hip[1]],[hip[0]+19,hip[1]]];
      const feet=crawler?[[-51-gait*11,2-Math.max(0,gait)*8],[18+gait*11,2+Math.min(0,gait)*8]]:statue?[[-33-gait*9,0-Math.max(0,gait)*5],[24+gait*9,0+Math.min(0,gait)*5]]:[[-29-gait*10,1-Math.max(0,gait)*7],[28+gait*10,1+Math.min(0,gait)*7]];
      const shoulders=crawler?[[chest[0]-12,chest[1]+2],[chest[0]+14,chest[1]+2]]:statue?[[chest[0]-25,chest[1]+1],[chest[0]+23,chest[1]+4]]:[[chest[0]-25,chest[1]-5],[chest[0]+25,chest[1]-3]];
      let hands=crawler?[[-37-gait*8,-2], [45+gait*8,-4]]:statue?[[-55-gait*3,-68],[58+gait*3,-64]]:[[-47-gait*8,-24],[53+gait*8,-27]];
      hands=hands.map(p=>[...p]);
      if(a&&['windup','active','recovery'].includes(state)){
        if(consume){hands[0]=[head[0]-19-consumeQ*3,head[1]+34-consumeQ*18];hands[1]=[head[0]+22+consumeQ*4,head[1]+39-consumeQ*23];}
        else if(a.pose==='overhead'){const arm=statue&&a.name?.includes('巨斧')?0:1;hands[arm][0]+=drive*(statue?16:25);hands[arm][1]-=coil*(statue?58:44);hands[arm][1]+=Math.max(0,drive)*(statue?53:40);hands[1-arm][1]-=coil*12;}
        else if(a.pose==='spin'){hands[0][0]-=drive*(statue?24:32);hands[1][0]+=drive*(statue?29:39);hands[0][1]-=Math.max(0,drive)*20;hands[1][1]-=Math.max(0,drive)*22;}
        else{hands[1][0]+=drive*(statue?37:48);hands[1][1]-=drive*(statue?10:19);hands[0][0]-=coil*12;}
      }
      const knees=hips.map((h,i)=>ik(h,feet[i],crawler?28:statue?29:27,crawler?26:statue?28:27,i===0?-1:1));
      const elbows=shoulders.map((h,i)=>ik(h,hands[i],statue?29:crawler?27:31,statue?29:crawler?27:31,i===0?-1:1));
      articulated={hip,chest,head,hips,feet,knees,shoulders,hands,elbows,gait,lean,consume:consumeQ};
    }
    return {root,legs,segments,tendrils,drive,coil,breath,phase,anchor:[anchor[0]+root[0],anchor[1]+root[1]],articulated,rotation:state==='knockdown'?.6:e.dead?-1.3*smooth((e.deathT||0)/.4):0};
  }
  class Rig{
    constructor(){this.records=new Map();}
    clear(){this.records.clear();}
    get(e,player,time){
      const key=player?'player':e.id??`preview-${e.type}`,target=samplePose(e,player,time),signature=`${e.state}:${player?e.attackIndex:e.moveKey}`;
      let r=this.records.get(key);
      if(!r){r={value:target,signature,time,age:1,from:target};this.records.set(key,r);}
      const dt=Math.max(0,Math.min(.05,time-r.time));r.time=time;
      if(r.signature!==signature){
        const coherent=!player&&r.signature.split(':')[1]===e.moveKey&&['active','recovery'].includes(e.state);
        r.from=r.value;r.age=coherent?1:0;r.signature=signature;
      }
      r.age+=dt;const duration=e.state==='dash'?.045:e.state==='guard'?.04:e.state==='idle'?.105:.065;
      r.value=blend(r.from,target,smooth(r.age/duration));return r.value;
    }
  }
  return {Rig,creaturePose,samplePose,joints,ik,blend,strikePoses};
});
