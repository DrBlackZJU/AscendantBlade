/* Frozen original Effects drawing recipe, copied from game.js for visual comparison only. */
(function(root){
'use strict';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function stroke(c,p,color,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=color;c.lineWidth=w;c.lineCap=c.lineJoin='round';c.stroke();}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=color;c.fill();}
function glow(...args){return AshCombatFX.glow(...args);}
function ribbon(...args){return AshCombatFX.ribbon(...args);}
  const IMPACTS={giantImpact:'stone',probeConsume:'probe',finalHoly:'holy',holyStrike:'holy',bountyClaim:'bounty',enemyExplosion:'fire',quake:'stone',shockwave:'stone',twinShock:'stone',burstEcho:'burst',peakShock:'stone',bullImpact:'bull',posturePulse:'stone',corpseBomb:'blood',overkill:'blood',bloodTide:'blood',flyingKickExplosion:'kick',heatBurst:'fire',projectileFireBurst:'projectileFire',frictionBurst:'frictionHeat',poisonFlameBlast:'poisonFlame',serumReactionBurst:'serumReaction',emberSpreadBurst:'flameSpread',heavyRecoil:'heavyRecoil',ignite:'fire',meteorImpact:'meteor',fireTouch:'fire',acidBlood:'acidBlood',plague:'poison',iceBarrierBreak:'iceArmor',freeze:'ice',consecrationEnd:'holy',furnace:'fire',timeReturn:'void'};
  class Effects{
    constructor(){this.items=[];}
    clear(){this.items=[];}
    ingest(e,view=null){if(!IMPACTS[e.type]&&e.type!=='damageShield'&&e.type!=='ghostHand'&&e.type!=='lightningRod')return;if(view){let lo=Number.isFinite(e.x)?e.x:Infinity,hi=Number.isFinite(e.x)?e.x:-Infinity;for(const p of e.points||[]){lo=Math.min(lo,p.x);hi=Math.max(hi,p.x);}const pad=(e.radius||120)+150;if(lo!==Infinity&&(hi+pad<view.left||lo-pad>view.right))return;}if(e.type==='bountyClaim'&&e.targetId){const prior=this.items.find(f=>f.kind==='bounty'&&f.targetId===e.targetId&&f.t<.04);if(prior){prior.rank=Math.max(prior.rank||1,e.rank||1);prior.boss=prior.boss||e.boss;prior.beast=prior.beast||e.beast;return;}}if(e.type==='damageShield')this.items.push({...e,kind:'shield',t:0,life:.4});const kind=e.type==='meteorImpact'&&e.pollution?'void':e.type==='fireTouch'?'touch':e.type==='twinShock'&&e.blood?'blood':e.type==='ignite'&&e.spread?'flameSpread':IMPACTS[e.type];if(kind&&Number.isFinite(e.x)&&Number.isFinite(e.y)){this.items.push({...e,kind,seed:noise(e.x+e.y)*TAU,t:0,life:kind==='projectileFire'?AshProjectileImpactFX.life:kind==='poisonFlame'?.9:kind==='serumReaction'?1.05:kind==='flameSpread'?.85:kind==='heavyRecoil'?1.55:kind==='frictionHeat'?.9:kind==='bull'?.85:kind==='bounty'?.78:kind==='probe'?(e.heavy?.55:.36):['meteor','acidBlood','iceArmor'].includes(kind)?1.05:kind==='touch'?.45:.7,radius:kind==='bull'?320:kind==='bounty'?140*(e.scale||1):e.radius||(kind==='iceArmor'?180:kind==='acidBlood'?135:90)});}
      if(e.type==='ghostHand')this.items.push({...e,kind:'hand',t:0,life:.95,radius:70});
      if(e.type==='lightningRod'&&e.points?.length)this.items.push({...e,kind:'bolt',t:0,life:.48});
      if(this.items.length>90)this.items.splice(0,this.items.length-90);
    }
    update(dt){for(const e of this.items)e.t+=dt;this.items=this.items.filter(e=>e.t<e.life);}
    draw(c,camera){for(const e of this.items){const q=e.t/e.life,x=e.x-camera,y=e.y;if(e.kind!=='bolt'&&(x<-(e.radius||100)-100||x>c.canvas.width+(e.radius||100)+100))continue;if(e.kind==='projectileFire'){AshProjectileImpactFX.draw(c,e,camera);continue;}if(e.kind==='heavyRecoil'){AshCombatFX.heavyRecoilImpact(c,e,camera);continue;}if(e.kind==='frictionHeat'){AshCombatFX.frictionHeatBurst(c,e,camera);continue;}if(e.kind==='poisonFlame'){AshFireFamiliesFX.poisonBurst(c,{...e,x,y});continue;}if(e.kind==='serumReaction'){AshFireFamiliesFX.serumBurst(c,{...e,x,y});continue;}if(e.kind==='flameSpread'){AshFireFamiliesFX.flameSpread(c,{...e,x,y,density:e.type==='ignite'?1:.65});continue;}if(e.kind==='bull'){AshCombatFX.bullImpact(c,e,camera);continue;}if(e.kind==='acidBlood'){AshCombatFX.acidBloodImpact(c,e,camera);continue;}if(e.kind==='iceArmor'){AshCombatFX.iceArmorBreak(c,e,camera);continue;}if(e.kind==='touch'){AshCombatFX.touchIgnition(c,e,camera);continue;}if(e.kind==='wound'){AshCombatFX.woundImpact(c,e,camera);continue;}if(e.kind==='bounty'){AshCombatFX.bountyImpact(c,e,camera);continue;}c.save();
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
        else if(e.kind==='ice'){c.beginPath();c.moveTo(xx,yy-22*(1-q));c.lineTo(xx+5,yy);c.lineTo(xx,yy+8);c.lineTo(xx-4,yy);c.closePath();c.fillStyle=i%2?'#eafcff':color;c.fill();}
        else if(e.kind==='blood'){stroke(c,[[xx-Math.cos(a)*15,yy+5],[xx,yy],[xx+Math.cos(a)*9,yy-3]],color,2+3*n);}
        else if(e.kind==='poison'){glow(c,xx,yy-8,13+n*17,'#9ecb6877');oval(c,xx,yy,2+n*3,3+n*4,'#d8ef9c');}
        else{c.save();c.translate(xx,yy);c.rotate(a+q*4);c.fillStyle=i%3?color:'#f9e9cc';c.fillRect(-3,-2,4+n*5,2+n*4);c.restore();}
      }
      for(let i=0;i<3;i++)ribbon(c,x,y+2,r*spread,TAU*i/3+q*.8,color,(1-q)*.7,.32);c.restore();
    }}
  }
const samples=new Map();
root.ReferenceImpactStudy={draw(c,kind,t,r){
if(t<0)return;
const key=kind+':'+r;let effect=samples.get(key);
if(!effect){effect=new Effects();effect.ingest({type:kind==='overkill'?'overkill':'posturePulse',x:0,y:0,...(kind==='overkill'?{}:{radius:r})});samples.set(key,effect);}
for(const item of effect.items)item.t=t;
if(t<.7)effect.draw(c,0);
if(t<.38){const q=t/.38;c.save();c.globalAlpha=(1-q)*.8;c.strokeStyle=kind==='overkill'?'#d38976':'#d3c990';c.lineWidth=2*(1-q)+.5;c.beginPath();const rad=kind==='overkill'?120:r;c.ellipse(0,0,rad*(.2+q),rad*.22*(.2+q),0,0,TAU);c.stroke();c.restore();}
}};
})(globalThis);
