'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v)),noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let time=reduced?.43:0,paused=reduced,last=0;
const IMPACT=.32,DURATION=1.8;
function line(p,color,w=1){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill();}
function poly(p,color){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function actor(x,y,{face=1,z=0,role='enemy',alpha=1,recoil=0}={}){
 ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;oval(0,4,23,5,'#0005');ctx.translate(0,-z);ctx.scale(face,1);ctx.rotate(recoil);
 const player=role==='player',skin=player?'#b9bda0':'#adb397',cloth=player?'#778881':'#778464',shade=player?'#3d5655':'#3c4934';
 line([[-8,-33],[-14,-17],[-19,0]],shade,8);line([[7,-33],[14,-15],[18,0]],cloth,7);
 poly([[-14,-65],[12,-65],[18,-45],[9,-31],[-13,-31],[-20,-48]],cloth);poly([[-12,-65],[-23,-53],[-21,-27],[-9,-32]],shade);
 line([[-13,-51],[13,-48]],'#aca78d',2);oval(0,-80,10,13,skin);line([[-9,-79],[8,-79]],'#2b3830',4);
 if(player){poly([[-13,-67],[-22,-28],[-6,-33],[-6,-67]],'#465a58');line([[10,-61],[24,-47],[35,-63]],skin,5);line([[35,-63],[61,-101]],'#e2e7c7',3.5);line([[30,-66],[41,-59]],'#c2ab78',3);}
 else{line([[10,-61],[24,-49],[34,-55]],skin,5);line([[34,-55],[65,-72]],'#bcc7ab',3);line([[30,-61],[37,-49]],'#a18e66',3);}
 ctx.restore();
}
function floor(w,h){
 const g=ctx.createLinearGradient(0,-h*.7,0,h*.4);g.addColorStop(0,'#16201b');g.addColorStop(.65,'#25382e');g.addColorStop(1,'#19291f');ctx.fillStyle=g;ctx.fillRect(-w/2,-h*.72,w,h);
 for(let row=-2;row<=4;row++){const y=row*34,shift=(row%2)*62;for(let col=-6;col<=6;col++){const x=col*124+shift,n=noise(row*317+col*71);poly([[x+2,y+2],[x+119,y+2],[x+112,y+31],[x-5,y+31]],n>.5?'#344338':'#2c3e33');line([[x+3,y+3],[x+116,y+3]],'#71816a24',1);if(n>.62)line([[x+43,y+3],[x+55,y+17],[x+49,y+29]],'#18281f',1);}}
}
function reference(kind,t,r){
 if(t<0)return;ReferenceImpactStudy.draw(ctx,kind,t,r);
}
function laser(t,z){if(t<0||t>.22)return;const q=t/.22,fade=1-clamp((q-.35)/.65),pulse=.75+.25*Math.sin(q*TAU*3);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade;line([[0,-48-z],[176,-64-z]],'#790d2844',18*pulse);line([[0,-48-z],[176,-64-z]],'#ef3151',7*pulse);line([[0,-48-z],[176,-64-z]],'#ffe0d5',2.2);for(let i=0;i<7;i++){const a=i*TAU/7;line([[176,-64-z],[176+Math.cos(a)*(12+q*25),-64-z+Math.sin(a)*(12+q*25)]],'#ff8e8a',1.4);}ctx.restore();}
function panel(kind,index,old=false){
 const w=700,h=450,row=old?1:0;ctx.save();ctx.beginPath();ctx.rect(index*w,row*h,w,h);ctx.clip();ctx.translate(index*w+w/2,row*h+295);floor(w,h);
 const t=time-IMPACT,z=Number($('height').value),r=kind==='overkill'?210:[0,115,165,225][Number($('rank').value)];
 ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillStyle=old?'#a59e84':'#94aa9c';ctx.fillText(old?'原效果 / 现有绘制配方':'新方案 / 身体高度起爆',-w/2+20,-267);
 if($('range').checked){ctx.save();ctx.setLineDash([4,6]);ctx.beginPath();ctx.ellipse(0,0,r,r*.36,0,0,TAU);ctx.strokeStyle='#91a57666';ctx.lineWidth=1;ctx.stroke();ctx.restore();ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#aec095';ctx.fillText('R '+r,0,r*.36+20);}
 if($('actors').checked){
  for(const [x,y] of [[-175,24],[176,-13],[112,65]]){const struck=t>=0&&t<.5,within=Math.hypot(x,y)<=r;actor(x,y,{face:x>0?-1:1,z,alpha:.54,recoil:struck&&within?Math.sin(clamp(t/.4)*Math.PI)*Math.sign(x)*.1:0});}
  // Preparation, collision and aftermath make the trigger readable without game logic.
  if(kind==='overkill'){
   const dead=t>=0,deathQ=clamp(t/.5);actor(0,0,{z,face:-1,alpha:dead?1-deathQ*.85:1,recoil:dead?deathQ*.7:0});
   const swing=t<0?Math.sin(clamp((t+.18)/.18)*Math.PI):Math.max(0,1-t/.15);actor(-84,7,{z,role:'player',recoil:-swing*.09});
   if(t>-.12&&t<.07){const q=clamp((t+.12)/.19);ctx.save();ctx.globalAlpha=Math.sin(q*Math.PI)*.85;line([[-55,-75-z],[-12,-39-z],[28,-65-z]],'#e6d7bc',3);ctx.restore();}
  }else{actor(-54,8,{z,role:'player',recoil:t>=0?Math.sin(clamp(t/.25)*Math.PI)*-.08:0});actor(42,0,{z,face:-1,recoil:t>=0?Math.sin(clamp(t/.32)*Math.PI)*.12:0});}
 }
 if(old)reference(kind,t,r);else OverkillBladeShockStudy[kind](ctx,{x:0,y:0,z,t,radius:r});
 if(kind==='overkill'&&$('laser').checked)laser(t,z);
 ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillStyle='#99ae9e';
 ctx.fillText(old?(kind==='overkill'?'血色地面盘 · 螺旋弧 · 血粒子':'石色地面盘 · 地裂 · 石粒子'):(kind==='overkill'?'余力从身体撕开 / 胸口起爆 / 210 范围':'刀锋碰撞 / 三拍金属震颤 / '+r+' 范围'),0,130);
 ctx.restore();
}
function render(){const compare=$('compare').checked,h=compare?900:450;if(canvas.height!==h)canvas.height=h;ctx.clearRect(0,0,1400,h);panel('overkill',0);panel('bladeShock',1);if(compare){panel('overkill',0,true);panel('bladeShock',1,true);line([[0,450],[1400,450]],'#425440');}line([[700,0],[700,h]],'#425440');$('timeline').value=time;$('clock').textContent=time.toFixed(2)+' s';}
function pause(value){paused=value;$('pause').textContent=value?'继续':'暂停';}
function seek(value){time=Math.max(0,Math.min(DURATION,value));pause(true);render();}
$('replay').onclick=()=>{time=0;pause(false);render();};$('pause').onclick=()=>pause(!paused);$('step').onclick=()=>seek(time+1/60);$('peak').onclick=()=>seek(IMPACT+.095);$('tail').onclick=()=>seek(IMPACT+.38);$('timeline').oninput=()=>seek(Number($('timeline').value));
for(const id of ['compare','actors','range','laser','rank','height'])$(id).onchange=render;
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,button'))return;if(e.code==='Space'){e.preventDefault();pause(!paused);}if(e.code==='ArrowRight'){e.preventDefault();seek(time+1/60);}});
function frame(ms){const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;if(!paused){time+=dt*Number($('speed').value);if(time>=DURATION){if($('loop').checked)time%=DURATION;else{time=DURATION;pause(true);}}render();}requestAnimationFrame(frame);}
window.OverkillBladeShockPreview={seek,get state(){return {time,paused,compare:$('compare').checked,rank:Number($('rank').value),z:Number($('height').value)};}};
if(new URLSearchParams(location.search).has('still')){time=IMPACT+.095;paused=true;}
pause(paused);render();requestAnimationFrame(frame);
