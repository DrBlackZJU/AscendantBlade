'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let time=reduced?.46:0,paused=reduced,last=0;
function line(p,color,width=1){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill();}
function poly(p,color){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function actor(x,y,face=1){ctx.save();ctx.translate(x,y);ctx.scale(face,1);oval(0,3,24,5,'#0006');line([[-8,-32],[-15,-16],[-19,0]],'#434f39',8);line([[7,-32],[14,-15],[18,0]],'#79856b',7);poly([[-13,-65],[12,-65],[18,-45],[9,-31],[-13,-31],[-19,-48]],'#717e60');poly([[-12,-65],[-22,-53],[-21,-24],[-9,-32]],'#3b4833');oval(0,-79,10,13,'#909a7a');line([[-9,-79],[8,-79]],'#2a3425',4);line([[10,-61],[24,-47],[31,-62]],'#7f8e70',5);line([[31,-62],[52,-98]],'#bcc8a3',3);line([[26,-62],[36,-57]],'#a69773',3);ctx.restore();}
function specs(){const rank=Number($('rank').value),radius=rank===3?105:50;
 const panels=[{name:`飞龙幼崽 LV${rank}`,radius,damageRadius:rank===3?105:0,tag:rank===3?'新共用配方 · 基础范围 105':'新共用配方 · 单体 / 视觉尺寸 50'},{name:'熔渣炮',radius:165,damageRadius:165,tag:'新共用配方 · 基础范围 165'}];
 if($('compare').checked)panels.unshift({name:'原摩擦生火 · 配方对照',radius,damageRadius:rank===3?105:0,reference:true,tag:`按飞龙尺寸 ${radius} 展示原配方`});return panels;}
function projectile(t){if(t<-.32||t>=0)return;const q=clamp((t+.32)/.32),x=-135*(1-q),y=-36-75*(1-q);ctx.save();ctx.globalCompositeOperation='lighter';line([[x-28,y-16],[x,y]],'#ff8c3b66',7);line([[x-17,y-9],[x,y]],'#ffc774',2);oval(x,y,5,6,'#fff0bc');ctx.restore();}
function render(){ctx.clearRect(0,0,1200,440);ctx.fillStyle='#161d12';ctx.fillRect(0,0,1200,440);const panels=specs(),w=1200/panels.length;
 panels.forEach((s,i)=>{ctx.save();ctx.beginPath();ctx.rect(i*w,0,w,440);ctx.clip();ctx.translate(i*w+w/2,287);
  for(let j=-4;j<=3;j++)line([[-w/2,j*35],[w/2,j*35]],'#293420',.7);for(let j=-4;j<=4;j++)line([[j*60,-195],[j*90,140]],'#222e1c',.7);
  if($('range').checked&&s.damageRadius){ctx.save();ctx.setLineDash([4,6]);ctx.beginPath();ctx.ellipse(0,0,s.damageRadius,s.damageRadius*.36,0,0,TAU);ctx.strokeStyle='#71855b';ctx.stroke();ctx.restore();}
  if($('actors').checked){actor(0,0,-1);ctx.save();ctx.globalAlpha=.48;actor(Math.min(w/2-34,s.radius+28),23,1);ctx.restore();}
  const t=time-.32,fx={x:0,y:0,t,radius:s.radius,rank:3};projectile(t);
  if(s.reference)AshCombatFX.frictionHeatBurst(ctx,fx);else AshProjectileImpactFX.draw(ctx,fx);
  ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#8fa27d';ctx.fillText(s.reference?'地面环形扩散':'短焰翻开 · 熔亮碎屑 · 向上飞星',0,113);ctx.restore();
  if(i)line([[i*w,0],[i*w,440]],'#39482c');});
 $('timeline').value=time;$('clock').textContent=time.toFixed(2)+' s';}
function captions(){const panels=specs();$('captions').style.gridTemplateColumns=`repeat(${panels.length},1fr)`;$('captions').replaceChildren(...panels.map(s=>{const div=document.createElement('div'),span=document.createElement('span');div.textContent=s.name;span.textContent=s.tag;div.append(span);return div;}));}
function pause(value){paused=value;$('pause').textContent=value?'继续':'暂停';}
function seek(value){time=value;pause(true);render();}
$('pause').onclick=()=>pause(!paused);$('replay').onclick=()=>{time=0;pause(false);render();};$('step').onclick=()=>seek(Math.min(1.9,time+1/60));$('peak').onclick=()=>seek(.46);$('embers').onclick=()=>seek(.75);$('timeline').oninput=()=>seek(Number($('timeline').value));
$('rank').onchange=()=>{captions();render();};$('compare').onchange=()=>{captions();render();};$('actors').onchange=render;$('range').onchange=render;
function frame(ms){const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;if(!paused){time+=dt*Number($('speed').value);if(time>=1.9){if($('loop').checked)time%=1.9;else{time=1.9;pause(true);}}render();}requestAnimationFrame(frame);}
if(new URLSearchParams(location.search).has('still')){time=.46;paused=true;}
pause(paused);captions();render();requestAnimationFrame(frame);
