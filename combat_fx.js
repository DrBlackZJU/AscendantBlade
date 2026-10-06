/* Combat artwork entry point. Load this file once before game.js.
 * Each effect family keeps its private helpers and existing public API.
 * Sections: shared combat, fire families, projectile impacts, overkill /
 * blade shock, heavy impacts, Sauron eye, wind death, earth / blood.
 */
/* Shared player / boss combat effects. Times are simulation seconds. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 // Bounded, reusable artwork. No simulation state or random rolls live here.
 const ribbonCache=new Map(),flameColors=new Map(),pageCache=new Map();
 function retain(cache,key,value,limit){if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,value);return value;}
 function visible(c,x,y,rx=100,ry=rx){if(!c.canvas)return true;if(c.getTransform){const m=c.getTransform(),xx=m.a*x+m.c*y+m.e,yy=m.b*x+m.d*y+m.f,rrx=Math.abs(m.a)*rx+Math.abs(m.c)*ry,rry=Math.abs(m.b)*rx+Math.abs(m.d)*ry;x=xx;y=yy;rx=rrx;ry=rry;}return x+rx>=0&&x-rx<=c.canvas.width&&y+ry>=0&&y-ry<=c.canvas.height;}
 function segmentVisible(c,x1,y1,x2,y2,pad=60){return visible(c,(x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2+pad,Math.abs(y2-y1)/2+pad);}
 function line(c,p,color,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=color;c.lineWidth=w;c.stroke();}
 function poly(c,p,color){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=color;c.fill();}
 function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
 function glow(c,x,y,r,color){
  if(!(r>0))return;
  // Direct gradients rasterize faster than rescaled transparent stamps in profiling.
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 function flamePalette(color){
  let palette=flameColors.get(color);if(!palette){const cold=parseInt(color.slice(5,7),16)>parseInt(color.slice(1,3),16)||parseInt(color.slice(3,5),16)>parseInt(color.slice(1,3),16)+20;palette={cold,hot:cold?color:'#ffbb65',pale:color==='#8bdcff'?'#f1fcff':cold?'#d4fff5':'#ffe1a8'};retain(flameColors,color,palette,16);}return palette;
 }
 const artNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const acidDrops=Array.from({length:48},(_,i)=>{const a=i*2.399+.15,n=artNoise(i+21);return{a,n,len:.30+n*.70,land:.22+n*.27,size:2+n*3.3}});
const acidSheets=Array.from({length:12},(_,i)=>({a:i*TAU/12+artNoise(i)*.27,n:artNoise(i+80)}));
const iceShards=Array.from({length:38},(_,i)=>({a:i*2.399,n:artNoise(i+24),size:3+artNoise(i+45)*5,life:.38+artNoise(i+73)*.4}));
function acidBloodLiquid(c,t,r,z=0){if(t<0||t>=1.05)return;c.save();const sourceY=-58-z,fade=1-smooth((t-.60)/.45);
// Small, opaque liquid tongues make a ragged rupture instead of a circular spell.
if(t<.25){const q=smooth(t/.16),alpha=(1-smooth((t-.10)/.15))*.86;c.globalAlpha=alpha;for(const p of acidSheets){const ex=Math.cos(p.a)*r*(.30+p.n*.28)*q,ey=sourceY+Math.sin(p.a)*r*.25*q+18*q,width=(5+p.n*6)*(1-q*.45),nx=-Math.sin(p.a)*width,ny=Math.cos(p.a)*width*.5;c.beginPath();c.moveTo(-nx*.45,sourceY-ny*.45);c.bezierCurveTo(ex*.28+nx,sourceY+(ey-sourceY)*.2+ny,ex*.73+nx*.35,ey+ny*.35,ex,ey);c.bezierCurveTo(ex*.52-nx*.55,ey-ny*.55,ex*.20-nx*.4,sourceY-ny, nx*.45,sourceY+ny*.45);c.closePath();c.fillStyle=p.n>.5?'#8caf39':'#526a22';c.fill();line(c,[[0,sourceY],[ex*.42,sourceY+(ey-sourceY)*.3],[ex*.92,ey]],'#d5e79b',1.1)}}
for(const p of acidDrops){const ex=Math.cos(p.a)*r*p.len,ey=Math.sin(p.a)*r*p.len*.32,land=p.land+z*.0013,u=clamp(t/land),x=ex*u,y=sourceY+(ey-sourceY)*u-Math.sin(u*Math.PI)*(16+p.n*38),size=p.size*(.72+u*.28);
if(t<land){const back=clamp((t-.026)/land),bx=ex*back,by=sourceY+(ey-sourceY)*back-Math.sin(back*Math.PI)*(16+p.n*38);c.globalAlpha=.35;line(c,[[bx,by],[x,y]],'#718d34',size*1.15);c.globalAlpha=.96;const angle=Math.atan2(y-by,x-bx);c.save();c.translate(x,y);c.rotate(angle);ellipse(c,0,0,size*1.2,size*.72,'#273c17');ellipse(c,-size*.1,-size*.1,size*.85,size*.49,p.n>.48?'#bbd65b':'#90af3e');ellipse(c,-size*.4,-size*.3,size*.29,size*.12,'#eaf1b6');c.restore()}
else{const age=t-land,poolFade=(1-smooth(age/.45))*fade;if(poolFade<=0)continue;c.globalAlpha=poolFade*.52;const spread=1+smooth(age/.13)*.75;ellipse(c,ex,ey,size*2.4*spread,size*.62*spread,'#253d1c');ellipse(c,ex,ey-.6,size*1.8*spread,size*.40*spread,'#829d33');if(age<.18){c.globalAlpha=poolFade*.9;const hop=Math.sin(age/.18*Math.PI)*8;for(const side of [-1,1])ellipse(c,ex+side*age*28,ey-hop,size*.36,size*.48,'#c5d98a')}if(p.n>.40&&age>.04&&age<.42){const q=clamp((age-.04)/.38),by=ey-q*(9+p.n*12);c.globalAlpha=(1-q)*.6;c.beginPath();c.arc(ex+Math.sin(p.a)*3,by,1.2+p.n*2.3,0,TAU);c.strokeStyle='#b9d778';c.lineWidth=1;c.stroke()}}}
// Local contact glow remains brief and translucent, so attack poses stay legible.
if(t<.15){c.globalCompositeOperation='lighter';c.globalAlpha=(1-t/.15)*.48;glow(c,0,sourceY,29,'#d5ee8566')}c.restore()}
function iceArmorRupture(c,t,lift,rank,side,radius){if(t<0||t>=1.05)return;const sx=side*18,sy=-55-lift;
// A directional impact flares locally; the armor's radial fragments follow afterwards.
if(t<.14){const q=clamp(t/.14);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)*.86;glow(c,sx,sy,28+q*13,'#d3f5ff88');for(let i=0;i<7;i++){const a=side<0?Math.PI+i*.34-1: i*.34-1;line(c,[[sx,sy],[sx+Math.cos(a)*(12+q*25),sy+Math.sin(a)*(12+q*25)]],'#edfaff',1.5*(1-q))}c.restore()}
const age=t-.075;if(age<0)return;for(const [i,p] of iceShards.entries()){if(age>p.life)continue;const q=age/p.life,v=85+p.n*160,x=Math.cos(p.a)*v*age,y=-55-lift+Math.sin(p.a)*v*age*.46-(12+p.n*45)*Math.sin(q*Math.PI)+85*age*age;c.save();c.translate(x,y);c.rotate(p.a+age*(i%2?-4:3));c.globalAlpha=(1-smooth((q-.55)/.45))*.85;const z=p.size*(rank===3?1.12:1);poly(c,[[-z,-z*.5],[z*.2,-z],[z,z*.1],[-z*.5,z*.7]],i%3?'#89bbd1':'#d8f3fc');line(c,[[-z,-z*.5],[z*.2,-z],[z,z*.1]],'#ecfbff',.8);c.restore()}
const wave=smooth((t-.10)/.52),fade=1-smooth((t-.28)/.7),r=radius*wave;if(r>1&&fade>0){c.save();c.globalAlpha=fade*.52;for(let i=0;i<16;i++){const a=i*TAU/16,n=artNoise(i+100);c.beginPath();c.ellipse(0,-2,r*(.96+n*.04),r*.30,0,a,a+.15+n*.05);c.strokeStyle=i%3?'#87b9d2':'#d2f0ff';c.lineWidth=1.4+n*1.3;c.stroke();const x=Math.cos(a)*r,y=Math.sin(a)*r*.30;poly(c,[[x-3,y],[x,y-8*(1-wave*.5)],[x+5,y+2]],'#bde8f0')}
// Low, soft frost puffs keep the core of the character clear.
c.globalAlpha=fade*.16;for(let i=0;i<12;i++){const a=i*TAU/12,n=artNoise(i+71);ellipse(c,Math.cos(a)*r*.84,-5+Math.sin(a)*r*.27,13+n*17,6+n*5,'#b3dce9')}c.restore()}}

 // Approved acid spray and ice shatter share event lifetimes; their recipes are cached.
 function acidBloodImpact(c,fx,camera=0){
  if(fx.t<0||fx.t>=1.05)return;const x=fx.x-camera,z=fx.z||0,r=fx.radius||135;
  if(!visible(c,x,fx.y-z*.5,r+40,z*.5+r*.35+115))return;
  c.save();c.translate(x,fx.y);c.lineCap=c.lineJoin='round';acidBloodLiquid(c,fx.t,r,z);c.restore();
 }
 function iceArmorBreak(c,fx,camera=0){
  if(fx.t<0||fx.t>=1.05)return;const x=fx.x-camera,z=fx.z||0,s=fx.scale||1,r=fx.radius||180;
  if(!visible(c,x,fx.y-z*.5,r+100*s,z*.5+r*.35+140*s))return;
  c.save();c.translate(x,fx.y);c.scale(s,s);c.lineCap=c.lineJoin='round';iceArmorRupture(c,fx.t,z/s,fx.rank||1,fx.face||1,r/s);c.restore();
 }
 function page(c,x,y,angle,width){
  const w=Math.round(width*2)/2;let shape=pageCache.get(w);if(!shape&&typeof Path2D!=='undefined'){const p=new Path2D();p.moveTo(-w,-9);p.quadraticCurveTo(0,-13,w,-7);p.lineTo(w,9);p.quadraticCurveTo(0,5,-w,10);p.closePath();const ink=new Path2D();for(let k=0;k<4;k++){ink.moveTo(-w+3,-4+k*3);ink.lineTo(w-3,-5+k*3);}shape={p,ink};retain(pageCache,w,shape,16);}
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#d9dac3';c.strokeStyle='#958c7b';c.lineWidth=.7;
  if(shape){c.fill(shape.p);c.stroke(shape.p);c.strokeStyle='#676e77';c.lineWidth=.65;c.stroke(shape.ink);}else{c.beginPath();c.moveTo(-w,-9);c.quadraticCurveTo(0,-13,w,-7);c.lineTo(w,9);c.quadraticCurveTo(0,5,-w,10);c.closePath();c.fill();c.stroke();for(let k=0;k<4;k++)line(c,[[-w+3,-4+k*3],[w-3,-5+k*3]],'#676e77',.65);}c.restore();
 }
 function resonanceColor(base,stacks=0){const q=clamp(stacks/4),target='#ffda65';return '#'+[1,3,5].map(i=>Math.round(parseInt(base.slice(i,i+2),16)*(1-q)+parseInt(target.slice(i,i+2),16)*q).toString(16).padStart(2,'0')).join('');}
 function probeGeometry(e){
  const spec=root.AshCombat?.TYPES?.[e.enemyType||e.type],final=!!spec?.final,s=final?1.45:(e.scale||1);
  return {x:e.x,y:e.y-(e.lift??e.z??0)-(final?110:spec?.boss?50:35)*s,rx:(final?38:28)*s,ry:(final?12:9)*s,s};
 }
 function probeStyle(stacks){const n=Math.max(1,Math.min(5,stacks||1));return {alpha:.34+n*.12,width:1.2+n*.3,glow:3+n*2};}
 function probeRing(c,e,camera=0,time=0){
  if(!(e.probeStacks>0)||e.dead||e.furnaceCapture)return;
  const g=probeGeometry(e),x=g.x-camera,y=g.y,{alpha,width,glow:blur}=probeStyle(e.probeStacks);
  if(!visible(c,x,y,g.rx+20,g.ry+20))return;
  c.save();c.globalCompositeOperation='lighter';c.strokeStyle='#39cce8';c.shadowColor='#21c4ef';c.shadowBlur=blur;c.lineWidth=width*g.s;
  // The dim rear arc and bright front arc read as one ring around the waist.
  for(const [a,b,k] of [[Math.PI,TAU,.42],[0,Math.PI,1]]){c.globalAlpha=alpha*k;c.beginPath();c.ellipse(x,y,g.rx,g.ry,0,a,b);c.stroke();}
  c.shadowBlur=0;c.globalAlpha=alpha*.8;c.strokeStyle='#c1faff';c.lineWidth=.8*g.s;const a=time*1.8;
  c.beginPath();c.ellipse(x,y,g.rx,g.ry,0,a,a+.48);c.stroke();c.restore();
 }
 function probeBreak(c,e,camera=0){
  const q=clamp(e.t/e.life);if(q>=1)return;
  const g=probeGeometry(e),x=g.x-camera,y=g.y,{alpha,width,glow:blur}=probeStyle(e.stacks),face=e.face||1;
  if(!visible(c,x,y,g.rx+110*g.s,g.ry+70*g.s))return;
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha*(1-q);c.strokeStyle='#61e4f5';c.shadowColor='#27d7ff';c.shadowBlur=blur;c.lineWidth=width*g.s*(1-q*.65);
  if(e.heavy){
   // Separated pieces of the waist ring fly out; no continuous ground wave.
   const spread=(1-(1-q)**3)*54*g.s;
   for(let i=0;i<12;i++){const a=i*TAU/12,dx=Math.cos(a)*spread,dy=Math.sin(a)*spread*.65;
    c.beginPath();c.ellipse(x+dx,y+dy,g.rx,g.ry,0,a+.06,a+TAU/12-.09);c.stroke();
    line(c,[[x+Math.cos(a)*g.rx+dx*.7,y+Math.sin(a)*g.ry+dy*.7],[x+Math.cos(a)*g.rx+dx,y+Math.sin(a)*g.ry+dy]],i%3?'#49d9f1':'#dcffff',1.5*g.s*(1-q));
   }
  }else{
   const a=face>0?0:Math.PI,gap=.20+q*.85;
   c.beginPath();c.ellipse(x,y,g.rx*(1-q*.12),g.ry*(1-q*.12),0,a+gap,a+TAU-gap);c.stroke();
   const tip=x+face*g.rx;
   line(c,[[tip-face*18*g.s,y],[tip+face*(14+q*52)*g.s,y]],'#dbffff',2.3*g.s*(1-q));
   for(let i=0;i<6;i++){const side=i%2?1:-1,dx=face*q*(24+i*7)*g.s,dy=side*q*(10+i*3)*g.s;
    line(c,[[tip+dx,y+dy],[tip+dx-face*5*g.s,y+dy-side*4*g.s]],'#7feefa',1.6*g.s*(1-q));
   }
  }
  c.restore();
 }
 function executionParticles(c,x,y,time,stacks,remaining,scale=1){
  if(!(remaining>0)||!(stacks>0))return;const n=2+Math.min(20,Math.ceil(stacks));c.save();c.globalCompositeOperation='lighter';
  for(let i=0;i<n;i++){const q=(time*.65+i*.618)%1,a=i*2.399+time*.7,rr=(23+(i%3)*6)*scale,xx=x+Math.cos(a)*rr,yy=y-(12+q*83)*scale;c.globalAlpha=Math.sin(q*Math.PI)*.65*Math.min(1,remaining/.35);ellipse(c,xx,yy,(1.4+i%2*.45)*scale,(2.1+i%3*.3)*scale,i%3?'#b75b96':'#ed88bd');}c.restore();
 }
 function deadDoorFlames(c,x,y,time,scale=1){
  c.save();c.translate(x,y);c.scale(scale,scale);
  for(let i=0;i<4;i++){const side=i%2?1:-1,xx=side*(23+i*4),h=72+i%3*19,wave=Math.sin(time*8+i*2)*8;c.beginPath();c.moveTo(xx-5,-8);c.bezierCurveTo(xx-side*18,-h*.36,xx+wave+side*15,-h*.66,xx+wave,-h-22);c.bezierCurveTo(xx+wave-side*9,-h*.60,xx+side*10,-h*.24,xx+4,-8);c.closePath();c.fillStyle=i%2?'#680c24aa':'#8f123b99';c.fill();line(c,[[xx,-18],[xx+side*5,-h*.45],[xx+wave,-h-16]],'#d13b5477',1.2);}
  c.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const q=(time*.8+i*.618)%1;c.globalAlpha=Math.sin(q*Math.PI)*.65;line(c,[[Math.sin(i*7)*42,-q*130],[Math.sin(i*7)*42+3,-q*130-8]],'#bd1d46',1.5);}c.restore();
 }
 function swiftEchoes(c,x,y,angle,stacks,max=6,phase=0){
  if(!(stacks>0))return;const q=clamp(stacks/max),n=1+Math.floor(q*3),side=Math.sin(phase*TAU)>=0?1:-1;c.save();c.translate(x,y);
  for(let i=n;i>=1;i--){c.save();c.rotate(angle-side*i*.055);c.translate(-i*2,side*i*3);c.globalAlpha=(.10+q*.10)*(1-i/(n+1)*.45);poly(c,[[10,-3],[70,-3],[87,0],[70,3],[10,3]],'#d3d9dc');line(c,[[12,0],[84,0]],'#eff1f2',.7);c.restore();}c.restore();
 }
 function rockNails(c,x,y,scale=1,time=0){
  scale*=1.1;
  if(!visible(c,x,y,45*scale))return;c.save();c.translate(x,y);c.scale(scale,scale);
  for(let i=0;i<3;i++){c.save();c.translate((i-1)*13,-Math.abs(i-1)*4);c.rotate((i-1)*.20);ellipse(c,0,6,7,3,'#291f2399');poly(c,[[-4,7],[-5,-9],[-1,-20],[4,-10],[3,7]],'#82766c');poly(c,[[-1,-20],[4,-10],[3,7],[0,4]],'#c0aa86');line(c,[[-4,-8],[-1,-20],[0,3]],'#e8d7ae',1);line(c,[[-7,8],[-2,5],[5,9]],'#e1b66f',1.2);c.restore();}c.restore();
 }
 function rockBurst(c,fx,camera=0){
  const q=clamp(fx.t/fx.life),x=fx.x-camera,y=fx.y-(fx.z||0),r=fx.radius||185;if(!visible(c,x,y,r+40,r*.6+70))return;
  const ease=1-(1-q)**2;c.save();c.globalAlpha=1-q;
  for(let i=0;i<3;i++){const xx=x+(i-1)*13*(1+ease*3),yy=y-Math.abs(i-1)*4-q*22;c.save();c.translate(xx,yy);c.rotate((i-1)*.2+q*(i%2?-5:5));poly(c,[[-4,7],[-5,-9],[-1,-20],[4,-10],[3,7]],'#b7a080');line(c,[[-1,-18],[0,5]],'#f0ddaa',1.5);c.restore();}
  for(let i=0;i<12;i++){const a=fx.seed+i*2.399,rr=10+ease*(36+i%4*14),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.65-q*(10+i%3*8);c.save();c.translate(xx,yy);c.rotate(a+q*5);poly(c,[[-5,-3],[1,-7],[6,-1],[2,5]],i%3?'#968575':'#d6c3a0');line(c,[[-3,-2],[1,-5],[4,-1]],'#ecdbb7',.9);c.restore();}
  c.globalAlpha=(1-q)*.65;c.strokeStyle='#dfb978';c.lineWidth=3*(1-q)+.5;c.beginPath();c.ellipse(x,fx.y,14+ease*r,5+ease*r*.30,0,0,TAU);c.stroke();c.restore();
 }
 function touchIgnition(c,fx,camera=0){
  const q=clamp(fx.t/fx.life),x=fx.x-camera,y=fx.y-(fx.z??48),cold=fx.iceFlame,s=(fx.scale||1)*1.1;if(!visible(c,x,y,65*s,100*s))return;
  c.save();c.translate(x,y);c.scale(s,s);c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)*.92;const edge=cold?'#85d8ff':'#ffa153',core=cold?'#edfdff':'#fff0c9';
  // Three narrow tongues catch on the body: no floor ring or radial shockwave.
  for(let i=0;i<3;i++){const xx=(i-1)*12,yy=9-Math.abs(i-1)*4,h=(27+i%2*11)*(1-q*.25),sway=Math.sin(fx.seed+i*2+q*5)*7;c.beginPath();c.moveTo(xx-5,yy+7);c.bezierCurveTo(xx-12,yy-h*.15,xx+sway-6,yy-h*.75,xx+sway,yy-h);c.quadraticCurveTo(xx+sway+1,yy-h*.45,xx+6,yy+4);c.closePath();c.fillStyle=edge+'aa';c.fill();line(c,[[xx,yy+3],[xx+sway*.4,yy-h*.40],[xx+sway,yy-h*.78]],core,1.6);}
  for(let i=0;i<6;i++){const a=fx.seed+i*2.399,rr=12+q*(13+i%3*7),xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.65-q*25;line(c,[[xx,yy],[xx+Math.cos(a)*3,yy-5]],i%2?edge:core,1.4);}c.restore();
 }
 function soulBlade(c,x,y,angle,time,empowered=false){
  if(!visible(c,x,y,105,65))return;c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='lighter';
  if(empowered){c.globalAlpha=.72;glow(c,3,0,36,'#ac6ced44');c.globalAlpha=.5;for(let i=0;i<3;i++){const yy=(i-1)*12,xx=-13-i*7;line(c,[[xx-21,yy],[xx-8,yy*.55],[23,yy*.22]],'#aa73e0',1.5);}c.globalAlpha=1;}else{c.save();c.scale(1,12/35);glow(c,0,0,35,'#b686e955');c.restore();}
  const k=empowered?1.28:1;c.scale(k,k);poly(c,[[-20,-5],[16,-7],[34,0],[16,7],[-20,5]],empowered?'#e3cbff':'#d3b7ff');line(c,[[-15,0],[28,0]],'#ffffff',empowered?2.4:2);
  if(empowered){poly(c,[[-9,-5],[-2,-10],[5,-5],[1,0]],'#b978e8');line(c,[[-17,-5],[16,-7],[32,0]],'#f6e8ff',1.2);for(let i=0;i<3;i++){const q=(time*1.4+i/3)%1;c.globalAlpha=(1-q)*.6;ellipse(c,-24-q*29,Math.sin(i*2.4+time*7)*6,1.5,2.3,'#d8aaff');}}
  else for(let j=0;j<4;j++)line(c,[[-22-j*11,Math.sin(time*12+j)*4],[-31-j*11,0]],'#a681d988',2-j*.3);c.restore();
 }
 function hiddenEdgeParticles(c,x,y,z,scale,face,charges,time){
  const q=clamp(charges/10);if(q<=0)return;
  c.save();c.globalCompositeOperation='lighter';c.shadowColor='#c2cbd6';c.shadowBlur=3+q*4;
  const n=4+Math.ceil(q*14);
  for(let i=0;i<n;i++){const phase=(time*.8+i*.618)%1,back=16+phase*(26+q*60),xx=x-face*back*scale,yy=y-z-(35+i%4*12)*scale+Math.sin(i*2.4+time*3)*5*scale,size=(1+q*1.2)*(1-phase*.45)*scale;c.globalAlpha=(.20+q*.38)*Math.sin(phase*Math.PI);ellipse(c,xx,yy,size,size*.8,i%3?'#b2becb':'#e4eaf0');}
  c.restore();
 }
 function soulImpact(c,fx,camera=0){
  const q=clamp(fx.t/fx.life),x=fx.x-camera,y=fx.y-(fx.z||48);if(!visible(c,x,y,100,100))return;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-q;
  const r=10+q*43;c.strokeStyle='#d9b1ff';c.lineWidth=2.8*(1-q)+.7;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  for(let i=0;i<6;i++){const a=fx.seed+i*TAU/6,rr=r*(.85+i%2*.2);poly(c,[[x+Math.cos(a)*rr,y+Math.sin(a)*rr],[x+Math.cos(a+.1)*(rr+9),y+Math.sin(a+.1)*(rr+9)],[x+Math.cos(a+.2)*rr,y+Math.sin(a+.2)*rr]],i%2?'#b277e6':'#eed9ff');}
  line(c,[[x-19*(1-q),y-25],[x+19*(1-q),y+25]],'#f5e7ff',3*(1-q)+.8);c.restore();
 }
 // The ascension ring's separated arcs, tangential cutting blades and core flash.
 function ring(c,{x,y,radius=130,t=0,life=.42,seed=0,black=false,demon=false,z=0}){
  const q=clamp(t/life);if(q>=1)return;const r=radius*(.35+.72*(1-(1-q)**2)),rot=seed+q*(black?8:5.5),edge=demon?'#ff78da':black?'#b48ce7':'#9fdae4',core=demon?'#ffdeff':black?'#eee7ff':'#f4ffff';
  c.save();c.translate(x,y-z*.18);c.scale(1,.34);c.rotate(rot);c.globalCompositeOperation='lighter';c.globalAlpha=1-q;c.shadowColor=edge;c.shadowBlur=18;
  for(let i=0;i<(black?9:6);i++){const a=i*TAU/(black?9:6)+(i%2)*.13,span=.42+i%3*.12;c.strokeStyle=i%2?edge:core;c.lineWidth=(black?5:4)-q*2;c.beginPath();c.arc(0,0,r*(.78+i%3*.10),a,a+span);c.stroke();c.save();c.translate(Math.cos(a+span)*r,Math.sin(a+span)*r);c.rotate(a+span+Math.PI/2);poly(c,[[-18,-2],[16,-1],[30,0],[16,2],[-18,2]],core);c.restore();}
  c.scale(1,1/.34);glow(c,0,0,black?28:18,edge+'88');if(black)for(let i=0;i<7;i++){const a=rot+i*TAU/7;line(c,[[Math.cos(a)*r*.12,Math.sin(a)*r*.04],[Math.cos(a)*r*.58,Math.sin(a)*r*.20]],core,2);}c.restore();
 }
 // Same tapered ribbon used by the player's whirlwind; optional palette.
 function ribbon(c,x,y,r,phase,color,alpha=1,tilt=.32){
  // Callers cull the complete vortex; avoid a transform read for every inner ribbon.
  c.save();c.translate(x,y);c.scale(1,tilt);c.globalAlpha=alpha;
  const radius=Math.round(r*2)/2,angleStep=((Math.round(phase/TAU*64)%64)+64)%64,angle=angleStep/64*TAU,key=radius+':'+angleStep;let shape=ribbonCache.get(key);
  if(!shape){const p=[],edge=[];for(let i=0;i<30;i++){const q=i/29,a=angle-q*2.3;edge.push([Math.cos(a)*radius,Math.sin(a)*radius]);}p.push(...edge);for(let i=29;i>=0;i--){const q=i/29,a=angle-q*2.3,rr=radius-20*(1-q);p.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
   shape={p,edge};if(typeof Path2D!=='undefined'){shape.fill=new Path2D();shape.edgePath=new Path2D();for(const [i,pt] of p.entries())shape.fill[i?'lineTo':'moveTo'](...pt);shape.fill.closePath();for(const [i,pt] of edge.entries())shape.edgePath[i?'lineTo':'moveTo'](...pt);}retain(ribbonCache,key,shape,1024);
  }
  if(shape.fill){c.fillStyle=color;c.fill(shape.fill);c.strokeStyle='#fff2ff';c.lineWidth=1.6;c.stroke(shape.edgePath);}else{poly(c,shape.p,color);line(c,shape.edge,'#fff2ff',1.6);}c.restore();
 }
 // Filled crescent, layered wake, bright cutting edge and escaping sparks.
 function slash(c,{x,y,face=1,kind='sword',t=0,radius=230,index=0}){
  const q=clamp(t/.24);if(q>=1)return;c.save();c.translate(x,y);c.scale(face,1);c.globalCompositeOperation='lighter';c.globalAlpha=1-q;
  const thrust=['spear','dagger','swordThrust'].includes(kind),r=kind==='dagger'?150:radius;
  if(thrust){const len=r*(.75+q*.25);poly(c,[[-42,-16],[len*.8,-6],[len+35,0],[len*.8,6],[-42,16],[len*.48,0]],'#d67aff88');poly(c,[[5,-5],[len+35,0],[5,5],[len*.5,0]],'#ffe9ff');for(let i=0;i<5;i++)line(c,[[-70-i*12,(i-2)*10],[len*.62-i*14,(i-2)*4]],i%2?'#f9b7ff':'#a65bff',1.8);glow(c,len,0,24,'#e39cff88');}
  else {c.translate(28,-30);c.rotate(-.35+(index%2)*.28);for(let layer=2;layer>=0;layer--){const pts=[],start=-1.7+q*.35,end=1.5+q*.2,rr=r-layer*14;for(let i=0;i<=32;i++){const u=i/32,a=start+(end-start)*u;pts.push([Math.cos(a)*rr,Math.sin(a)*rr*.83]);}for(let i=32;i>=0;i--){const u=i/32,a=start+(end-start)*u,thick=Math.sin(u*Math.PI)*(30-layer*5)*(1-q*.6);pts.push([Math.cos(a)*(rr-thick),Math.sin(a)*(rr-thick)*.83]);}poly(c,pts,layer===0?'#edb0ffbb':layer===1?'#b94fff77':'#f352b144');line(c,pts.slice(0,33),layer?'#ca84ed':'#fff0ff',layer?1:2.5);}for(let i=0;i<12;i++){const a=-1.5+i*.24,rr=r+q*(30+i%3*25);line(c,[[Math.cos(a)*rr,Math.sin(a)*rr*.83],[Math.cos(a)*(rr+12),Math.sin(a)*(rr+12)*.83]],'#efb2ff',1.4);}}
  c.restore();
 }
 // Recolored holy-strike column, strictly vertical in screen space.
 function holy(c,x,y,r,q,color='#f8e4a6'){
  if(q<0||q>=1)return;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,(1-q)*2);const beam=c.createLinearGradient(x-r*.45,0,x+r*.45,0);beam.addColorStop(0,color+'00');beam.addColorStop(.32,color+'99');beam.addColorStop(.5,'#fff5ff');beam.addColorStop(.68,color+'99');beam.addColorStop(1,color+'00');c.fillStyle=beam;c.fillRect(x-r*.45,y-850,r*.9,850);glow(c,x,y,r,color+'99');c.fillStyle='#ffedff';c.beginPath();c.ellipse(x,y,r*.6,r*.19,0,0,TAU);c.fill();for(let j=0;j<18;j++){const yy=y-((q*550+j*47)%760),xx=x+Math.sin(j*7)*r*.36;line(c,[[xx,yy],[xx,yy-25]],color,1.8);}c.restore();
 }
 function electricity(c,a,b,time,color='#cd8cff',width=2){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,p=[a];for(let i=1;i<25;i++){const q=i/25,j=Math.sin(i*17.3+Math.floor(time*36)*7.7)*18;p.push([a[0]+dx*q-dy/len*j,a[1]+dy*q+dx/len*j]);}p.push(b);line(c,p,color,width*3);line(c,p,'#fff1ff',width*.65);}

 function illusionCloud(c,x,y,time,scale=1){
  if(!visible(c,x,y-25*scale,65*scale,80*scale))return;
  c.save();try{c.globalCompositeOperation='lighter';for(let i=0;i<42;i++){
   const q=(time*.55+i*.173)%1,a=i*2.4+time*.8,xx=x+Math.cos(a)*(16+q*30)*scale,yy=y-q*50*scale+Math.sin(a)*7*scale;
   c.globalAlpha=Math.sin(q*Math.PI)*.69;glow(c,xx,yy,(8+q*9)*scale,i%2?'#9c43d855':'#6225bb66');ellipse(c,xx,yy,1.4*scale,2.0*scale,'#e5b4eecc');
  }}finally{c.restore();}
 }
 let fearCrownPath=null;
 function traceFearCrown(path){
  path.moveTo(-32,0);
  for(let i=1;i<=32;i++){const a=Math.PI+i*Math.PI/32;path.lineTo(Math.cos(a)*32,Math.sin(a)*29);}
  for(let i=32;i>=0;i--){const a=Math.PI+i*Math.PI/32;path.lineTo(Math.cos(a)*25,Math.sin(a)*23+1);}
  path.closePath();
  for(let i=0;i<5;i++){
   const a=Math.PI+i*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a),tx=-dy,ty=dx,len=i===2?19:15;
   path.moveTo(dx*26-tx*4,dy*26-ty*4);path.lineTo(dx*(29+len),dy*(29+len));path.lineTo(dx*26+tx*4,dy*26+ty*4);path.closePath();
  }
 }
 function fearCrown(c,x,y,time,scale=1,age=1){
  if(!visible(c,x,y-24*scale,70*scale,80*scale))return;
  const entry=1-Math.exp(-Math.max(0,age)*20),impact=Math.sin(clamp(age/.28)*Math.PI)*.19,k=entry+impact+Math.sin(time*4.2)*.018;
  if(k<=0)return;
  c.save();try{
   c.globalCompositeOperation='source-over';c.translate(x+Math.sin(time*38)*.65*scale,y+(1-entry)*9*scale);c.scale(scale*k,scale*k);c.rotate(Math.sin(time*17)*.016);c.globalAlpha*=entry;
   c.fillStyle='#000000';c.shadowColor='rgba(255,255,255,.30)';c.shadowBlur=7*scale;c.shadowOffsetX=c.shadowOffsetY=0;
   if(typeof Path2D!=='undefined'){if(!fearCrownPath){fearCrownPath=new Path2D();traceFearCrown(fearCrownPath);}c.fill(fearCrownPath);}
   else{c.beginPath();traceFearCrown(c);c.fill();}
  }finally{c.restore();}
 }
 // Dedicated bull contact and permanent-fear artwork, shared with the approved study.
 const bullNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function permanentFear(c,x,y,time,scale=1,age=time,particles=true){
  const entry=1-Math.exp(-Math.max(0,age)*20),impact=Math.sin(clamp(age/.28)*Math.PI)*.19,k=entry+impact+Math.sin(time*4.2)*.018;
  if(k<=0||!visible(c,x,y-37*scale,75*scale,105*scale))return;c.save();try{
   c.translate(x,y);c.scale(scale,scale);c.globalCompositeOperation='source-over';
   // A sparse, local ash drift. Particles do not travel with the jittering crown.
   if(particles)for(let i=0;i<12;i++){const q=(time*(.35+bullNoise(i+8)*.13)+i/12)%1,a=i*2.399,r=37+bullNoise(i+25)*17,xx=Math.cos(a)*r+Math.sin(time*1.8+i)*4,yy=-8-q*(49+bullNoise(i+41)*22);c.globalAlpha=entry*Math.sin(q*Math.PI)*(.48+bullNoise(i+61)*.32);c.shadowColor='rgba(255,255,255,.18)';c.shadowBlur=2.5;const size=1.1+bullNoise(i+74)*1.35;ellipse(c,xx,yy,size,size*1.45,'#030405');}
   const j={x:Math.sin(time*53)*2.25+Math.sin(time*89)*.65,y:Math.sin(time*61)*.95,angle:Math.sin(time*37)*.055+Math.sin(time*71)*.015};c.globalAlpha=entry;c.translate(j.x,(1-entry)*9+j.y);c.scale(k,k);c.rotate(j.angle);c.shadowColor='rgba(255,255,255,.30)';c.shadowBlur=7*scale;c.shadowOffsetX=c.shadowOffsetY=0;c.fillStyle='#000000';c.beginPath();traceFearCrown(c);c.fill();
  }finally{c.restore();}
 }
 const bullPalettes={
  stone:{ground:'#d4b384',arc:'#ffe4b0',core:'#fff6dc',glow:'#f7d09777',shock:'#e4c490',bright:'#ffe3b0',mid:'#c2a077',dark:'#847362',dust:'#d0b694'},
  fire:{ground:'#ff7438',arc:'#ff8b45',core:'#ffe4a0',glow:'#ff512488',shock:'#f9562d',bright:'#ffd083',mid:'#ff7d32',dark:'#db3e25',dust:'#e45b2e'}
 };
 function drawBullImpact(c,t,{face=1,rank=3,fire=false}={}){
  if(t<0||t>=.85)return;
  const power=rank===3?1.12:.94,p=bullPalettes[fire?'fire':'stone'];
  c.save();try{c.scale(face*1.3,1.3);c.globalCompositeOperation='source-over';
   // Bright contact rays and a forward fire fan distinguish the two impacts.
   if(t<.32){const q=t/.32;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)*.9;glow(c,8,-42,(65+q*30)*power,p.glow);for(let i=0;i<7;i++){const a=-1.2+i*.4,r=(38+q*100)*power;line(c,[[8+Math.cos(a)*18,-42+Math.sin(a)*18],[8+Math.cos(a)*r,-42+Math.sin(a)*r]],i%2?p.arc:p.core,(1-q)*4+1);}c.restore();}
   if(fire&&t<.55){const q=t/.55;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const a=-1.1+i*.2,r=(22+q*(90+bullNoise(i+310)*60))*power,xx=8+Math.cos(a)*r,yy=-42+Math.sin(a)*r-q*22;c.globalAlpha=(1-q)*.8;poly(c,[[xx-15*(1-q),yy+9],[xx,yy-22*(1-q)],[xx+12*(1-q),yy+8]],i%3?p.mid:p.core);}c.restore();}
   // Larger contact flash and a longer, thicker arc make the hit readable in combat.
   if(t<.42){const q=clamp(t/.42),r=18+Math.pow(q,.65)*135*power;c.globalAlpha=(1-q)*.88;c.beginPath();c.ellipse(12,0,r,r*.19,0,-2.9,.15);c.strokeStyle=p.ground;c.lineWidth=(1-q)*5.5+.6;c.stroke();}
   if(t<.34){const q=t/.34;c.globalAlpha=(1-q)*.98;c.save();c.translate(8+q*40,-43);c.scale(.6+q*.22,1);c.beginPath();c.arc(0,0,20+q*70*power,-1.4,1.4);c.strokeStyle=p.arc;c.lineWidth=(1-q)*14+.9;c.stroke();c.restore();}
   if(t<.14){const q=t/.14;c.globalAlpha=(1-q)*.98;const r=(22+q*38)*power;poly(c,[[-32,-40],[-9,-50],[0,-40],[7,-76],[16,-48],[r,-43],[16,-34],[4,-10],[-2,-33]],p.core);glow(c,3,-42,49*power,p.glow);}
   if(rank===3&&t>.07&&t<.34){const q=(t-.07)/.27;c.globalAlpha=(1-q)*.62;c.beginPath();c.ellipse(q*28,1,40+q*107,10+q*23,0,0,TAU);c.strokeStyle=p.shock;c.lineWidth=(1-q)*3.5+.5;c.stroke();}
   const count=rank===3?46:34;
   for(let i=0;i<count;i++){const life=.29+bullNoise(i+2)*.43;if(t>life)continue;const angle=-1.28+bullNoise(i+15)*2.15,v=(115+bullNoise(i+29)*230)*power,vx=Math.cos(angle)*v,vy=Math.sin(angle)*v-42,xx=5+vx*t,yy=-36+vy*t+215*t*t,sz=(1.5+bullNoise(i+50)*3.2)*(1-t/life*.6);c.globalAlpha=clamp((life-t)/.19);c.save();c.translate(xx,yy);c.rotate(i*1.7+t*(3+bullNoise(i+71)*9));poly(c,[[-sz,-sz*.65],[sz*.4,-sz],[sz,sz*.6],[-sz*.5,sz]],i%5===0?p.bright:i%2?p.mid:p.dark);c.restore();}
   // Only the ground wake remains; fire variants use warm embers, never a body flame ring.
   for(let i=0;i<11;i++){const delay=bullNoise(i+200)*.08,age=t-delay,life=.4+bullNoise(i+220)*.34;if(age<0||age>life)continue;const q=age/life,x=(i%3===0?-1:1)*(17+age*(80+bullNoise(i+241)*190))*power,y=-3-Math.sin(q*Math.PI)*(4+bullNoise(i+260)*10),r=3+q*(5+bullNoise(i+280)*8);c.globalAlpha=Math.sin(q*Math.PI)*.21;ellipse(c,x,y,r*1.65,r,p.dust);}
  }finally{c.restore();}
 }
 function bullImpact(c,e,camera=0){
  if(e.t<0||e.t>=.85)return;
  const face=e.face<0?-1:1,x=e.x-camera-face*21,y=e.y-(e.z||0);
  if(!visible(c,x,y-45,320,205))return;
  c.save();try{c.translate(x,y);drawBullImpact(c,e.t,{face,rank:e.rank||3,fire:!!e.fire});}finally{c.restore();}
 }
 function space(c,s,camera){if(!s)return;c.save();c.globalCompositeOperation='lighter';for(const l of s.lines){const q=l.age-l.delay,dx=Math.cos(l.a)*l.length/2,dy=Math.sin(l.a)*l.length/2;c.globalAlpha=q<0?.55+Math.sin(l.age*30)*.12:Math.max(0,1-q/.23);line(c,[[l.x-dx-camera,l.y-dy-35],[l.x+dx-camera,l.y+dy-35]],q<0?'#489fff':'#9de8ff',q<0?1.1:7*(1-q/.23));if(q>=0)line(c,[[l.x-dx-camera,l.y-dy-35],[l.x+dx-camera,l.y+dy-35]],'#f1fcff',1.7);}for(const b of s.bursts){const q=b.t/.65,r=q<.3?30*(1-q/.3):8+(q-.3)*90;c.globalAlpha=1-q;c.strokeStyle='#cabaff';c.lineWidth=3;c.beginPath();c.arc(b.x-camera,b.y,r,0,TAU);c.stroke();if(q>.3)for(let i=0;i<18;i++){const a=i*2.4,d=(q-.3)*(65+i%4*25);ellipse(c,b.x-camera+Math.cos(a)*d,b.y+Math.sin(a)*d,2.5,2.5,i%2?'#9b87ff':'#edddff');}}c.restore();}
 // Capture one bounded silhouette per trigger; no per-frame pixel reads.
 function woundAsset(source,ox,oy,modelScale=1){
  const width=source.width,height=source.height,c=source.getContext('2d'),d=c.getImageData(0,0,width,height).data;
  let x0=width,y0=height,x1=0,y1=0;
  for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2)if(d[(y*width+x)*4+3]>45){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  if(x1<=x0||y1<=y0)return null;
  const image=document.createElement('canvas');image.width=x1-x0+9;image.height=y1-y0+9;image.getContext('2d').drawImage(source,-x0+4,-y0+4);
  const w=image.width,h=image.height,pixels=image.getContext('2d').getImageData(0,0,w,h).data,points=[];
  for(let y=Math.floor(h*.32);y<h*.75;y+=3)for(let x=Math.floor(w*.25);x<w*.75;x+=3)if(pixels[(y*w+x)*4+3]>140)points.push([x,y]);
  const center=points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[w/2*(points.length?0:1),h/2*(points.length?0:1)]);
  const origin=points.reduce((a,p)=>Math.hypot(p[0]-center[0],p[1]-center[1])<Math.hypot(a[0]-center[0],a[1]-center[1])?p:a,points[0]||center);
  const tint=document.createElement('canvas');tint.width=w;tint.height=h;const tc=tint.getContext('2d');tc.drawImage(image,0,0);tc.globalCompositeOperation='source-in';tc.fillStyle='#3c1b36';tc.fillRect(0,0,w,h);
  const scar=document.createElement('canvas');scar.width=w;scar.height=h;
  const scale=Math.max(1,Math.min(3,modelScale));
  return {image,tint,scar,w,h,ox:ox-x0+4,oy:oy-y0+4,cx:origin[0],cy:origin[1],size:Math.max(13*scale,Math.min(30*scale,h*.23))};
 }
 function woundHaze(c,x,y,rx,ry,color){if(rx<=0||ry<=0)return;c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();}
 function drawWound(c,a,t,amount=1){
  if(t<0||t>=.58)return;const r=a.size,k=Math.sqrt(amount),reveal=smooth(t/.055),fade=1-smooth((t-.18)/.27),opening=smooth((t-.045)/.095);
  const sc=a.scar.getContext('2d');sc.clearRect(0,0,a.w,a.h);sc.globalCompositeOperation='source-over';sc.globalAlpha=1;sc.lineCap=sc.lineJoin='round';
  sc.save();sc.translate(a.cx,a.cy);sc.scale(1.8,1.8);sc.translate(-a.cx,-a.cy);
  for(let i=0;i<5;i++){
   const angle=-1.32+i*1.43,dx=Math.cos(angle),dy=Math.sin(angle),length=r*(.7+(i%3)*.22)*reveal;
   const p=[[a.cx-dx*r*.20,a.cy-dy*r*.20],[a.cx+dx*length*.3-dy*3,a.cy+dy*length*.3+dx*3],[a.cx+dx*length*.58+dy*2,a.cy+dy*length*.58-dx*2],[a.cx+dx*length,a.cy+dy*length]];
   line(sc,p,'#190e25',5+opening*3*k);line(sc,p,'#8f3d73',2.4+opening*1.4*k);line(sc,p,opening>.25?'#ee9db7':'#b878c6',.8+opening*.6);
   if(opening>.1)poly(sc,[p[0],[p[1][0]-dy*opening*2.8*k,p[1][1]+dx*opening*2.8*k],p[3],[p[2][0]+dy*opening*2.8*k,p[2][1]-dx*opening*2.8*k]],'#d15d88');
  }
  sc.restore();sc.globalCompositeOperation='destination-in';sc.drawImage(a.image,0,0);sc.globalCompositeOperation='source-over';
  c.save();c.globalAlpha=fade;c.drawImage(a.scar,0,0);c.restore();
  c.save();c.lineCap=c.lineJoin='round';c.translate(a.cx,a.cy);c.scale(1.8,1.8);c.translate(-a.cx,-a.cy);
  // A compact pulse on the torso, without whitening the entire actor.
  const flash=Math.sin(clamp((t-.055)/.15)*Math.PI);if(flash>0)woundHaze(c,a.cx,a.cy,r*.68,r*.84,'#ca51895c');
  const age=t-.095;
  if(age>0){
   const u=clamp(age/.28),ease=1-(1-u)**3,alpha=(1-smooth((age-.03)/.29));
   c.save();c.translate(a.cx,a.cy);c.globalAlpha=alpha;
   for(let i=0;i<7;i++){
    const ang=i*2.399+.42,dx=Math.cos(ang),dy=Math.sin(ang),len=r*(.6+(i%3)*.40)*k,tip=r*.35+len*ease,tail=Math.max(3,tip-len*(1-u)*.77),width=(1-u)*(2+i%2)*k;
    poly(c,[[dx*tail-dy*width,dy*tail+dx*width],[dx*tip,dy*tip],[dx*tail+dy*width,dy*tail-dx*width],[dx*tail*.6,dy*tail*.6]],i%2?'#581e4b':'#97324f');
    line(c,[[dx*tail,dy*tail],[dx*(tip-2),dy*(tip-2)]],i%3?'#cc648d':'#eb9db2',.65*(1-u));
   }
   c.restore();
  }
  for(let i=0;i<Math.round(17*amount);i++){
   const age=t-.105-(i%4)*.014;if(age<=0||age>=.41)continue;const u=age/.41,angle=i*2.399+.7,dist=r*(.18+u*(.9+i%4*.3))*k;
   const x=a.cx+Math.cos(angle)*dist,y=a.cy+Math.sin(angle)*dist*.85-u*u*r*.48;
   c.save();c.globalAlpha=(1-u)**1.8*(i%3?.68:.9);c.translate(x,y);c.rotate(angle+u*2);
   poly(c,[[-2.5,-.6],[1.6,-1.1],[3.3,0],[-1,1.1]],i%4?'#a7476c':'#d795ab');c.restore();
  }
  if(t>.18)for(let i=0;i<5;i++){const u=clamp((t-.18-i*.012)/.38);c.save();c.globalAlpha=Math.sin(u*Math.PI)*.36;woundHaze(c,a.cx+Math.sin(i*4)*r*(.3+u*.65),a.cy-u*r*(.8+i*.15),r*(.22+u*.28),r*(.17+u*.21),'#63325888');c.restore();}
  c.restore();
 }
 function woundImpact(c,fx,camera=0){
  const a=fx.asset;if(!a||fx.t<0||fx.t>=.58)return;
  const x=fx.x-camera,y=fx.y,reach=a.size*1.8*4;
  if(!visible(c,x-a.ox+a.cx,y-a.oy+a.cy,reach,reach))return;
  c.save();c.translate(x-a.ox,y-a.oy);
  if(fx.t<.17){c.globalAlpha=Math.sin(clamp(fx.t/.17)*Math.PI)*.24;c.drawImage(a.tint,0,0);c.globalAlpha=1;}
  drawWound(c,a,fx.t,fx.intensity||1);c.restore();
 }
 function bountyStroke(c,a,b,color,w=1){c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke();}
function bountyCoin(c,x,y,size,turn){c.save();c.translate(x,y);c.scale(.30+Math.abs(Math.cos(turn))*.70,1);c.fillStyle='#d6a456';c.beginPath();c.moveTo(0,-size);c.lineTo(size*.8,-size*.5);c.lineTo(size*.8,size*.5);c.lineTo(0,size);c.lineTo(-size*.8,size*.5);c.lineTo(-size*.8,-size*.5);c.fill();bountyStroke(c,[0,-size*.56],[size*.43,0],'#ffe4a1',.8);bountyStroke(c,[size*.43,0],[0,size*.56],'#ffe4a1',.8);c.restore()}
function bountyMarker(c,x,y,r,a,color='#da6957'){c.save();c.globalAlpha=a;c.strokeStyle=color;c.lineWidth=1.7;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();for(const q of [-1,1]){bountyStroke(c,[x+q*r*.7,y],[x+q*r*1.65,y],color,1.7);bountyStroke(c,[x,y+q*r*.7],[x,y+q*r*1.65],color,1.7)}c.fillStyle='#ffd1a2';c.fillRect(x-2,y-2,4,4);c.restore()}
function bountySeal(c,t,k=1,amount=1){if(t<0||t>=.78)return;const gold='#dbab62',pale='#ffdda0',r=(30-9*smooth(t/.10))*k,split=smooth((t-.19)/.13);if(t<.32){c.save();c.globalAlpha=1-split;glow(c,0,0,42*k,'#cd8d3436');for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2+Math.PI/4);const rr=r+9*(1-smooth(t/.1))+split*14;bountyStroke(c,[rr,-9*k],[rr,9*k],i%2?gold:pale,2.2*k);bountyStroke(c,[rr,9*k],[rr-7*k,9*k],i%2?gold:pale,2.2*k);c.restore()}for(let i=0;i<8;i++){const a=i*TAU/8+.16;c.beginPath();c.arc(0,0,r*.82,a,a+.44);c.strokeStyle=i%2?gold:pale;c.lineWidth=1.2*k;c.stroke()}c.fillStyle='#252126';c.beginPath();c.moveTo(0,-r*.56);c.lineTo(r*.46,0);c.lineTo(0,r*.56);c.lineTo(-r*.46,0);c.fill();for(let i=0;i<4;i++){const a=i*Math.PI/2;bountyStroke(c,[Math.cos(a)*r*.46,Math.sin(a)*r*.56],[Math.cos(a+Math.PI/2)*r*.46,Math.sin(a+Math.PI/2)*r*.56],gold,1.5*k)}c.restore()}
const slash=clamp((t-.095)/.17);if(t>.095&&t<.265){c.save();c.rotate(-.62);c.globalAlpha=Math.sin(slash*Math.PI);const l=(25+slash*19)*k;c.fillStyle=pale;c.beginPath();c.moveTo(-l,-2*k);c.lineTo(-4*k,-3.6*k);c.lineTo(l,0);c.lineTo(5*k,3.6*k);c.lineTo(-l,2*k);c.fill();bountyStroke(c,[-l*.85,-1],[l,0],'#fff4cf',1.3*k);glow(c,0,0,24*k,'#efb94b88');c.restore()}
const end=[0,-48*k];for(let i=0;i<Math.round(7*amount);i++){const age=t-.19-i*.017;if(age<=0||age>=.45)continue;const u=age/.45,a=i*2.399-.2,start=[Math.cos(a)*12*k,Math.sin(a)*12*k],control=[Math.cos(a)*(40+i%3*9)*k,(-39-i%4*10)*k],x=(1-u)**2*start[0]+2*(1-u)*u*control[0]+u*u*end[0],y=(1-u)**2*start[1]+2*(1-u)*u*control[1]+u*u*end[1];c.save();c.globalAlpha=Math.min(1,age/.04)*(1-smooth((u-.76)/.24));bountyStroke(c,start,[x,y],'#c09b5d77',1.1*k);bountyCoin(c,x,y,(3.2+i%2*.7)*k,i+u*8);c.restore()}
if(t>.49){const u=clamp((t-.49)/.29);c.save();c.translate(...end);c.globalAlpha=Math.sin(u*Math.PI);glow(c,0,0,17*k,'#ffc96866');c.fillStyle=pale;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?2*k:7*k;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.fill();c.restore()}}
 function bountyImpact(c,fx,camera=0){
  if(fx.t<0||fx.t>=.78)return;
  const scale=Math.max(.35,Math.min(3,fx.scale||1)),amount=fx.boss?1.4:(fx.rank||1)>=2?1:.65;
  const x=fx.x-camera,y=fx.y-(fx.z??76*scale),k=scale*amount;
  if(!visible(c,x,y-48*k,110*k,135*k))return;
  c.save();c.translate(x,y);c.scale(fx.face||1,1);c.globalCompositeOperation='source-over';
  if(fx.t<.15){const q=smooth(fx.t/.15);bountyMarker(c,0,-76*scale*(1-q),12*scale*(1-q),1-q,'#c99358');}
  bountySeal(c,fx.t,k,amount);c.restore();
 }
 // Dedicated recoil and friction-burst recipes: visual time only, no combat rolls.
 function impactEllipse(c,x,y,rx,ry,color,w=1,a=0,b=TAU){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,a,b);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
 function impactEase(v){return 1-Math.pow(1-clamp(v),3);}
 function impactFlame(c,x,y,h,w,t,seed,alpha){if(h<=0||alpha<=0)return;c.save();c.globalAlpha*=alpha;const sway=Math.sin(t*15+seed)*w*.7;c.beginPath();c.moveTo(x-w,y);c.bezierCurveTo(x-w*1.6,y-h*.38,x+sway,y-h*.45,x+sway,y-h);c.bezierCurveTo(x+w*.4,y-h*.7,x+w*1.5,y-h*.24,x+w,y);c.closePath();const g=c.createLinearGradient(x,y,x,y-h);g.addColorStop(0,'#e65b20');g.addColorStop(.45,'#ffac45');g.addColorStop(.82,'#ffe2a0');g.addColorStop(1,'#fff2ce00');c.fillStyle=g;c.fill();line(c,[[x,y-3],[x+sway*.4,y-h*.5]],'#fff2cb',w*.55);c.restore();}
 function heavyRecoilImpact(c,fx,camera=0){const t=fx.t,r=fx.radius||150,rank=Math.max(1,Math.min(3,fx.rank||1)),x=fx.x-camera,y=fx.y;if(t<0||t>=1.55||!visible(c,x,y-55,r+110,180))return;
 c.save();c.translate(x,y);const q=impactEase((t-.045)/.44),fade=1-clamp((t-.22)/1.2);
 if(t<.16){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.16;glow(c,-23,-68,45,'#ead7a477');line(c,[[-38,-93],[-8,-45]],'#fff4cc',4);c.restore();}
 for(let i=0;i<9;i++){const a=i*TAU/9,rr=r*(.5+artNoise(i)*.48),pts=[[0,0]];for(let j=1;j<=5;j++){const len=rr*j/5,off=(artNoise(i*9+j)-.5)*14;pts.push([Math.cos(a)*len+Math.sin(a)*off,Math.sin(a)*len*.33+Math.cos(a)*off*.35]);}c.globalAlpha=fade*clamp((t-.04)/.1)*.7;line(c,pts,'#0a0c09',3);line(c,pts,'#ab9570',.8);}
 if(q>0&&q<1){c.globalAlpha=(1-q)*.9;impactEllipse(c,0,-3,r*q,r*q*.33,'#d7c795',4*(1-q)+1);impactEllipse(c,0,0,r*q*.9,r*q*.3,'#8a795b',8*(1-q));}
 for(let i=0;i<20+rank*5;i++){const a=i*2.399,n=artNoise(i),age=t-n*.085;if(age<0||age>.85)continue;const rr=r*(.5+n*.5)*impactEase(age/.65),xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.33,jump=Math.sin(clamp(age/.65)*Math.PI)*(14+n*29);c.globalAlpha=(1-clamp(age/.85))*.65;ellipse(c,xx,yy-jump*.22,16+n*19,6+n*7,'#897b60');c.save();c.translate(xx,yy-jump);c.rotate(a+age*5);const s=2+n*4;poly(c,[[-s,-s*.5],[s*.4,-s],[s,s*.7],[-s,s]],i%3?'#847b64':'#c0b38b');c.restore();}
 // Fast, directional splinters complement the low dust wave; fixed count and lifetime.
 c.globalCompositeOperation='lighter';for(let i=0;i<18+rank*4;i++){const n=artNoise(i+130),a=i*2.399,life=.32+n*.3;if(t>life)continue;const vx=Math.cos(a)*(140+n*r*1.6),vy=Math.sin(a)*(65+n*80)-90,xx=vx*t,yy=-38+vy*t+175*t*t,tail=.015+n*.012;c.globalAlpha=(1-t/life)*.88;line(c,[[xx-vx*tail,yy-(vy+350*t)*tail],[xx,yy]],i%4?'#d7bf87':'#fff1c1',.8+n*1.4);}
 c.restore();}
 function frictionHeatBurst(c,fx,camera=0){const t=fx.t,r=fx.radius||150,rank=Math.max(1,Math.min(3,fx.rank||1)),x=fx.x-camera,y=fx.y-(fx.z||0);if(t<0||t>=.9||!visible(c,x,y-45,r+70,r*.36+110))return;
 c.save();c.translate(x,y);if(t<.16){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.16;glow(c,0,-49,Math.min(75,r*.6),'#ffd18ccc');ellipse(c,0,-46,16+t*110,32+t*140,'#ffeccc');c.restore();}
 // Inset the ring by its flame width so the visible edge fits the damage radius.
 if(t<.62){const wave=impactEase(t/.42),fade=1-clamp((t-.08)/.54),rim=r-Math.min(18,r*.15);for(let i=0;i<18;i++){const a=i*TAU/18,rr=rim*wave,xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.36;c.globalAlpha=1;impactFlame(c,xx,yy,20+artNoise(i)*40*(1-wave),Math.min(7+artNoise(i)*4,r*.045),t,i,fade*.98);c.globalAlpha=fade*.9;impactEllipse(c,0,-8,rr,rr*.36,'#ffbf69',3,a,a+.19);c.globalAlpha=fade*.8;impactEllipse(c,0,-8,rr,rr*.36,'#fff0ba',1.2,a,a+.16);}}
 c.globalCompositeOperation='lighter';for(let i=0;i<32+rank*7;i++){const n=artNoise(i+4),a=i*2.399,life=.25+n*.55;if(t>life)continue;const q=t/life,d=r*(.45+n*.5)*impactEase(t/.5),xx=Math.cos(a)*d,yy=-48+Math.sin(a)*d*.36-Math.sin(q*Math.PI)*(10+n*25);c.globalAlpha=(1-q)*.98;line(c,[[xx-Math.cos(a)*Math.min(4+n*10,r*.1)*(1-q),yy-Math.sin(a)*6],[xx,yy]],i%5?'#ffc16d':'#fff8dd',1.3+n);}
 c.restore();}
 function shadowSlash(c,fx,camera=0){
  const t=fx.t;if(t<0||t>=.20)return;
  const scale=Math.max(.8,Math.min(1.6,fx.scale||1)),x=fx.x-camera,y=fx.y-(fx.z||48);
  if(!visible(c,x,y,125*scale,30*scale))return;
  c.save();c.globalCompositeOperation='source-over';c.shadowBlur=0;c.translate(x,y);
  // A straight black blade flashes past the hit, tapered at both ends.
  if(t<.12){
   const progress=clamp(t/.035),half=(70+45*progress)*scale,width=5*scale;
   c.save();c.rotate(-.16*(fx.face||1));c.translate((fx.face||1)*(t/.12-.5)*28,0);
   c.globalAlpha=1-smooth((t-.045)/.075);poly(c,[[-half,0],[-8,-width],[half,0],[8,width]],'#020204');c.restore();
  }
  c.globalAlpha=1-smooth((t-.08)/.12);c.strokeStyle='#020204';c.lineWidth=2*scale;
  c.beginPath();c.arc(0,0,5*scale,0,TAU);c.stroke();c.restore();
 }
 root.AshCombatFX={shadowSlash,heavyRecoilImpact,frictionHeatBurst,acidBloodImpact,iceArmorBreak,bountySeal,bountyImpact,woundAsset,drawWound,woundImpact,ring,ribbon,slash,holy,electricity,illusionCloud,fearCrown,permanentFear,bullImpact,space,glow,visible,segmentVisible,resonanceColor,probeGeometry,probeStyle,probeRing,probeBreak,executionParticles,deadDoorFlames,swiftEchoes,rockNails,rockBurst,touchIgnition,soulBlade,soulImpact,hiddenEdgeParticles,flamePalette,page,cacheSizes:()=>({ribbon:ribbonCache.size,flameColors:flameColors.size,page:pageCache.size})};
})(globalThis);

/* ===== Fire families: poison, serum and flame spread ===== */
/* Approved poison, serum and flame-spread artwork. Visual time only; no damage or combat rolls. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,sat=v=>Math.max(0,Math.min(1,v)),ease=v=>1-Math.pow(1-sat(v),3);
 // Match the production friction recipe's deterministic particle positions.
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const palettes={fire:{base:'#e65b20',mid:'#ffac45',tip:'#ffe2a0',end:'#fff2ce00',core:'#fff2cb',rim:'#ffbf69',edge:'#fff0ba',spark:'#ffc16d',white:'#fff8dd',flash:'#eaffe6',glow:'#ffd18ccc'},poison:{base:'#168646',mid:'#55e967',tip:'#c9ff91',end:'#eeffd000',core:'#e4ffbd',rim:'#87fa7c',edge:'#e6ffb3',spark:'#90fb79',white:'#efffcb',flash:'#efffdc',glow:'#a5f78ccc'}};
 function line(c,p,col,w=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function oval(c,x,y,rx,ry,col){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill();}
 function ring(c,x,y,r,ry,col,w=1,a=0,b=TAU){if(r<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,r,ry,0,a,b);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function glow(c,x,y,r,col){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}
 function poly(c,p,col){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();}
 function flame(c,x,y,h,w,t,seed,alpha,p=palettes.fire){if(h<=0||alpha<=0)return;c.save();c.globalAlpha*=alpha;const sway=Math.sin(t*15+seed)*w*.7;c.beginPath();c.moveTo(x-w,y);c.bezierCurveTo(x-w*1.6,y-h*.38,x+sway,y-h*.45,x+sway,y-h);c.bezierCurveTo(x+w*.4,y-h*.7,x+w*1.5,y-h*.24,x+w,y);c.closePath();const g=c.createLinearGradient(x,y,x,y-h);g.addColorStop(0,p.base);g.addColorStop(.45,p.mid);g.addColorStop(.82,p.tip);g.addColorStop(1,p.end);c.fillStyle=g;c.fill();line(c,[[x,y-3],[x+sway*.4,y-h*.5]],p.core,w*.55);c.restore();}
 // Same geometry and timing as the current frictionHeatBurst, with only its palette changed.
 function poisonBurst(c,fx){const t=fx.t,r=fx.radius||155,rank=3,p=palettes.poison;if(t<0||t>=.9)return;c.save();c.translate(fx.x,fx.y);
 if(t<.16){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.16;glow(c,0,-49,Math.min(75,r*.6),p.glow);oval(c,0,-46,16+t*110,32+t*140,p.flash);c.restore();}
 if(t<.62){const wave=ease(t/.42),fade=1-sat((t-.08)/.54),rim=r-Math.min(18,r*.15);for(let i=0;i<18;i++){const a=i*TAU/18,rr=rim*wave,xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.36;c.globalAlpha=1;flame(c,xx,yy,20+noise(i)*40*(1-wave),Math.min(7+noise(i)*4,r*.045),t,i,fade*.98,p);c.globalAlpha=fade*.9;ring(c,0,-8,rr,rr*.36,p.rim,3,a,a+.19);c.globalAlpha=fade*.8;ring(c,0,-8,rr,rr*.36,p.edge,1.2,a,a+.16);}}
 c.globalCompositeOperation='lighter';for(let i=0;i<32+rank*7;i++){const n=noise(i+4),a=i*2.399,life=.25+n*.55;if(t>life)continue;const q=t/life,d=r*(.45+n*.5)*ease(t/.5),xx=Math.cos(a)*d,yy=-48+Math.sin(a)*d*.36-Math.sin(q*Math.PI)*(10+n*25);c.globalAlpha=(1-q)*.98;line(c,[[xx-Math.cos(a)*Math.min(4+n*10,r*.1)*(1-q),yy-Math.sin(a)*6],[xx,yy]],i%5?p.spark:p.white,1.3+n);}c.restore();}
 // Serum reference follows the existing rank-3 posture burst: 8 spokes, mint core.
 // The candidates retain this visual language and add 8 thin radiating spokes.
 function serumBurst(c,fx){const t=fx.t,reference=!!fx.reference,life=1.05;if(t<0||t>=life)return;c.save();c.translate(fx.x,fx.y-10);const q=sat(t/life),growth=1-(1-q)**2,reach=reference?68+26*growth:Math.min(fx.radius,112+34*growth),alpha=(1-q)*.92,accent='#defbf3',mid='#86dfcd',deep='#4a9586';c.globalCompositeOperation='lighter';c.globalAlpha=1;glow(c,0,0,18+reach*.62,'#6fd2be26');c.globalAlpha=alpha;c.shadowColor=mid;c.shadowBlur=18*(1-q)+8;oval(c,0,0,5+8*(1-q),5+8*(1-q),accent);oval(c,0,0,12+reach*.16,12+reach*.16,'#97eadc2e');
 for(let i=0;i<(reference?8:16);i++){const a=.37+i*TAU/(reference?8:16)+q*.16,inner=10+q*5+(i%2)*2,len=reach*(.84+(i%2)*.08),x1=Math.cos(a)*inner,y1=Math.sin(a)*inner*.48,x2=Math.cos(a)*len,y2=Math.sin(a)*len*.58,thin=!reference&&i%2===1;line(c,[[x1,y1],[x2,y2]],i%2?accent:mid,(thin?1.6:2.5)*(1-q)+.7);line(c,[[x1,y1],[x1+Math.cos(a)*(len-inner)*.45,y1+Math.sin(a)*(len-inner)*.24]],deep,1.1*(1-q)+.35);oval(c,x2,y2,(thin?1.5:2.5)*(1-q)+.55,(thin?1.5:2.5)*(1-q)+.55,i%2?accent:'#92d7c6');}
 c.shadowBlur=0;for(let i=0;i<(reference?16:24);i++){const a=.37*1.4+i*2.399,rr=12+growth*(reference?20+(i%3)*6:35+(i%3)*9),xx=Math.cos(a)*rr,yy=Math.sin(a*1.22)*rr*.42-growth*8,s=(i%3?1.4:2)*(1-q)+.35;oval(c,xx,yy,s,s,i%4===0?accent:'#78cdbc');}
 if(t<.38){const spread=ease(t/.38),rr=(reference?84:reach)*spread;c.globalAlpha=(1-t/.38)*.7;ring(c,0,0,rr,rr*.42,mid,1.7);ring(c,0,0,rr*.58,rr*.58*.42,deep,1);}
 // Extra fine spokes extend into the large catalyst footprint without enlarging the core excessively.
 if(!reference&&fx.radius>150&&t<.7){c.globalAlpha=(1-sat((t-.06)/.64))*.58;for(let i=0;i<8;i++){const a=.37+(i+.5)*TAU/8,rr=fx.radius*.96*ease(t/.28);line(c,[[Math.cos(a)*rr*.54,Math.sin(a)*rr*.54*.58],[Math.cos(a)*rr,Math.sin(a)*rr*.58]],'#b2f2de',.85);}}c.restore();}
 // One explosive ignition, a fast outward flame collar, then ballistic ember spray.
 function flameSpread(c,fx){const t=fx.t,r=fx.radius||145,density=Math.max(.45,Math.min(1,fx.density||1));if(t<0||t>=.85)return;c.save();c.translate(fx.x,fx.y);const wave=ease(t/.11),rim=r-Math.min(13,r*.10),rr=rim*wave,power=.80+density*.20;
 // The initial flash is a torn mass of fire, rather than crossed lines or stacked rings.
 if(t<.13){const expand=ease(t/.045),fade=(1-t/.13)**2;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=fade*power;glow(c,0,-25,Math.min(68,r*.60),'#ffb453bb');const burst=[];for(let i=0;i<20;i++){const a=i*TAU/20,reach=(i%2?12:27+noise(i+400)*16)*expand;burst.push([Math.cos(a)*reach,-25+Math.sin(a)*reach*.72]);}poly(c,burst,'#ffd993');oval(c,0,-25,6+expand*10,10+expand*15,'#fff1cd');c.restore();for(let i=0;i<7;i++){const n=noise(i+320),a=i*TAU/7,reach=(9+n*13)*expand;c.globalAlpha=1;flame(c,Math.cos(a)*reach,-14+Math.sin(a)*reach*.32,(26+n*31)*expand,4+n*4,t,i+50,fade*power);}}
 // A single irregular sheet of flame sweeps out to the existing spread radius.
 if(t<.31){const fade=1-sat((t-.055)/.255),crestFade=1-sat((t-.035)/.25),thickness=Math.min(15,r*.12)*(1-wave*.40),outer=[],inner=[],segments=80;
 for(let i=0;i<=segments;i++){const a=i*TAU/segments,n=noise((i%segments)+520),radius=rr-(2+n*3)*wave,crest=(4+n*17)*crestFade*wave;outer.push([Math.cos(a)*radius,Math.sin(a)*radius*.34-crest]);const inside=Math.max(0,radius-thickness);inner.push([Math.cos(a)*inside,Math.sin(a)*inside*.34+2]);}
 const g=c.createLinearGradient(0,-rr*.34-25,0,rr*.34+6);g.addColorStop(0,'#d7501d');g.addColorStop(.35,'#fa862b');g.addColorStop(.72,'#ffb953');g.addColorStop(1,'#f28129');c.globalAlpha=fade*power;poly(c,outer.concat([...inner].reverse()),g);c.globalCompositeOperation='lighter';c.globalAlpha=fade*.83*power;line(c,inner,'#ffe1a1',1.8);c.globalAlpha=fade*.45*power;line(c,outer,'#ffc674',1.2);c.globalCompositeOperation='source-over';
 const tongues=density>.8?26:22;for(let i=0;i<tongues;i++){const a=i*TAU/tongues,n=noise(i+73),xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.34,h=(13+n*31)*crestFade*Math.min(1,t/.025),w=Math.min(4+n*3,r*.047);c.globalAlpha=1;flame(c,xx,yy,h,w,t*1.8,i,fade*power*.9);}}
 // Low outward fragments and higher embers all leave the source in the same short burst.
 c.globalCompositeOperation='lighter';const count=density>.8?116:88;for(let i=0;i<count;i++){const n=noise(i+120),age=t-noise(i+641)*.022,life=.24+n*.42;if(age<0||age>life)continue;const a=i*2.399,reach=r*(.30+noise(i+720)*.67),high=i%4===0,lift=(high?55+n*65:8+n*25)*power,back=Math.max(0,age-.011-n*.015),d=reach*ease(age/.145),bd=reach*ease(back/.145),xx=Math.cos(a)*d,yy=-15+Math.sin(a)*d*.34-lift*ease(age/.13)+155*age*age,bx=Math.cos(a)*bd,by=-15+Math.sin(a)*bd*.34-lift*ease(back/.13)+155*back*back,q=age/life;c.globalAlpha=(1-sat((q-.22)/.78))*.98*power;const color=i%5?'#ffc16a':'#fff3c9';line(c,[[bx,by],[xx,yy]],color,.9+n*1.4);oval(c,xx,yy,.7+n*.7,.7+n*.7,color);}
 c.restore();}
 root.AshFireFamiliesFX={poisonBurst,serumBurst,flameSpread};
})(globalThis);

/* ===== Projectile impacts: wyvern and slag ===== */
/* Shared wyvern / slag impact artwork, approved from study 006. Visual time only. */
(function(root){
 'use strict';
 const clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>1-(1-clamp(n))**3;
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const LIFE=.95;
 function oval(c,x,y,rx,ry,color){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
 function glow(c,x,y,r,color){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function stroke(c,points,color,width){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 // Curved, tapering flame lobes share one impact origin, rather than a ground ring.
 function lobe(c,angle,length,width,bend,t,seed,color){
  c.save();c.rotate(angle);const sway=Math.sin(t*19+seed)*width*.3;
  c.beginPath();c.moveTo(-width*.6,4);
  c.bezierCurveTo(-width*1.2,-length*.22,bend-width+sway,-length*.57,bend+sway,-length);
  c.bezierCurveTo(bend+width*.28+sway,-length*.7,width*1.25,-length*.34,width*.7,4);c.closePath();
  const g=c.createLinearGradient(0,0,bend,-length);g.addColorStop(0,'#ba3214');g.addColorStop(.24,'#ed5518');g.addColorStop(.58,color);g.addColorStop(.83,'#ffd27b');g.addColorStop(1,'#fff0b100');c.fillStyle=g;c.fill();
  c.beginPath();c.moveTo(-width*.22,1);c.quadraticCurveTo(width*.18,-length*.38,bend*.65+sway*.5,-length*.76);c.quadraticCurveTo(width*.48,-length*.3,width*.27,1);c.closePath();c.fillStyle='#ffe6a4';c.fill();c.restore();
 }
 function draw(c,fx,camera=0){
  const t=fx.t,r=fx.radius||105;if(t<0||t>=LIFE)return;
  const size=Math.sqrt(r/105),width=r*.86,origin=-36;
  c.save();c.translate(fx.x-camera,fx.y-(fx.z||0));
  // The heat haze is local to the hit; no long-lasting burning floor.
  c.globalAlpha=(1-clamp(t/.6))*.23;glow(c,0,origin,width*.82,'#ef651866');
  if(t>.13){c.globalAlpha=clamp((t-.13)/.12)*(1-clamp((t-.2)/.55))*.17;
   for(let i=0;i<6;i++){const n=noise(i+11),x=(n-.5)*width*.8,y=origin-22-size*(24+n*34)*ease((t-.12)/.55);oval(c,x,y,(12+n*12)*size,(10+n*9)*size,'#776452');}}
  // Low, broken pressure arcs. They disappear before the airborne embers.
  if(t<.25){const q=ease(t/.14);c.globalAlpha=(1-clamp(t/.25))*.75;
   for(let i=0;i<2;i++){c.beginPath();c.ellipse(0,-5,width*q*(1-i*.15),width*q*.21*(1-i*.15),0,i?Math.PI+.16:.1,i?Math.PI*2-.1:Math.PI-.16);c.strokeStyle=i?'#f37932':'#ffc379';c.lineWidth=(2.4-i*.6)*(1-clamp(t/.25))+.4;c.stroke();}}
  if(t<.46){const growth=ease(t/.09),shrink=1-clamp((t-.1)/.36),fade=1-clamp((t-.07)/.39);
   c.save();c.translate(0,origin);c.globalAlpha=fade;
   // Nine organic tongues form a broad upward splash, with different lengths.
   for(let i=0;i<9;i++){const side=(i-4)/4,n=noise(i+82),a=side*1.13;
    const len=(47+20*(1-Math.abs(side))+n*18)*size*growth*(.48+.52*shrink);
    c.save();c.translate(side*width*.10*growth,Math.abs(side)*3);lobe(c,a,len,(7+n*4.5)*size*(.4+.6*shrink),side*(11+n*8)*size,t,i,'#ff9b36');c.restore();}
   c.globalCompositeOperation='lighter';c.globalAlpha=fade*.72;
   glow(c,0,-12*size,32*size,'#ffb74199');oval(c,0,-4,15*size*growth,10*size*growth,'#ffd789');c.restore();
  }
  // Very brief white-hot flash, then the silhouette and sparks stay readable.
  if(t<.085){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.085;glow(c,0,origin,42*size,'#ffd48daa');oval(c,0,origin,9+10*ease(t/.045),13+8*ease(t/.045),'#fff3c9');stroke(c,[[-22*size,origin],[22*size,origin]],'#fff5d5',2.2);c.restore();}
  c.globalCompositeOperation='lighter';
  // Deterministic ballistic trails: upward fan, gravity, fade before the floor.
  for(let i=0;i<48;i++){
   const n=noise(i+200),delay=noise(i+400)*.035,age=t-delay,life=.34+n*.48;if(age<0||age>=life)continue;
   const side=(noise(i+310)-.5)*2,vx=side*width*(1.25+noise(i+620)*.65),vy=-(145+n*170)*size,gravity=300*size;
   const pos=a=>[vx*a/(1+a*.8),origin+vy*a+gravity*a*a];
   const [x,y]=pos(age),back=Math.max(0,age-(.014+n*.022)),[bx,by]=pos(back),fade=(1-age/life)**.8;
   c.globalAlpha=fade*(i%5?.87:1);const color=i%5?'#ffbb58':'#fff1bb';stroke(c,[[bx,by],[x,y]],color,(.85+n*.85)*size);
   oval(c,x,y,(.55+n*.65)*size,(.55+n*.65)*size,color);
   // A few larger molten fragments give the fireball its bursting-shell feel.
   if(i%8===0){c.save();c.translate(x,y);c.rotate(age*(6+n*8)+i);c.beginPath();const s=(1.7+n*1.6)*size;c.moveTo(-s,-s*.6);c.lineTo(s*.3,-s);c.lineTo(s,s*.35);c.lineTo(-s*.4,s*.8);c.closePath();c.fillStyle='#ffae42';c.fill();stroke(c,[[-s*.5,-s*.3],[s*.5,s*.25]],'#ffe7a4',.8);c.restore();}
  }
  c.restore();
 }
 root.AshProjectileImpactFX=Object.freeze({draw,life:LIFE});
})(globalThis);

/* ===== Overkill ruptures and blade shock ===== */
/* Approved study 007: shared overkill rupture and metallic blade shock artwork. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const petals=Array.from({length:15},(_,i)=>({a:i*TAU/15+noise(i+5)*.24,n:noise(i+21),k:noise(i+72)}));
 const motes=Array.from({length:50},(_,i)=>({a:i*2.399,n:noise(i+15),k:noise(i+32)}));
 function line(c,p,color,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=color;c.lineWidth=w;c.stroke();}
 function poly(c,p,color){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=color;c.fill();}
 function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
 function glow(c,x,y,r,color){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function overkill(c,fx,camera=0){
  const t=fx.t;if(t<0||t>=.82)return;
  const r=fx.radius||210,power=fx.power||1,z=fx.z||0;
  c.save();c.translate((fx.x||0)-camera,(fx.y||0)-z-48*(fx.scale||1));c.lineCap='round';c.lineJoin='round';
  // A body-height rupture: open, ragged blades of pressure, never a filled floor disc.
  if(t<.29){const spread=1-Math.pow(1-clamp(t/.18),3),fade=1-smooth((t-.09)/.20);
   c.globalAlpha=fade*.82;
   for(const p of petals){const a=p.a,len=r*(.57+p.n*.43)*spread,width=(9+p.k*12)*(.65+.35*power),dx=Math.cos(a),dy=Math.sin(a)*.57,nx=-Math.sin(a),ny=Math.cos(a)*.57;
    const point=(d,w)=>[dx*d+nx*w,dy*d+ny*w];
    poly(c,[point(10,1),point(len*.31,width*.76),point(len*.48,width*.17),point(len*.66,width*.55),point(len,0),point(len*.64,-width*.20),point(len*.38,-width*.49)],p.n>.48?'#b62e46':'#661e35');
    c.globalAlpha=fade*(.65+p.k*.28);
    poly(c,[point(len*.10,0),point(len*.4,width*.20),point(len*.76,width*.10),point(len*.94,0),point(len*.40,-width*.10)],p.n>.50?'#ffb7a1':'#ed6b72');
    c.globalAlpha=fade*.82;
   }
   c.globalCompositeOperation='lighter';c.globalAlpha=fade*.40;glow(c,0,0,33+spread*12,'#fb4b5c99');c.globalCompositeOperation='source-over';
  }
  // Split chips carry the excess force; irregular trajectories keep the explosion organic.
  for(const [i,p] of motes.entries()){
   const birth=.014+p.k*.045,age=t-birth,life=.35+p.n*.39;if(age<0||age>life)continue;
   const q=age/life,dist=r*(.35+p.n*.65)*(1-Math.exp(-age*11)),x=Math.cos(p.a)*dist,y=Math.sin(p.a)*dist*.56-(12+p.k*38)*Math.sin(q*Math.PI)+55*age*age;
   const back=r*(.35+p.n*.65)*(1-Math.exp(-Math.max(0,age-.02)*11));
   c.globalAlpha=(1-smooth((q-.40)/.60))*.84;
   line(c,[[Math.cos(p.a)*back,y+2],[x,y]],i%4?'#b54459':'#ffb6a3',1+p.k*1.7);
   c.save();c.translate(x,y);c.rotate(p.a+q*(i%2?2:-2));const size=(2+p.k*4)*(1-q*.45);
   poly(c,[[-size*1.7,0],[0,-size*.66],[size,0],[0,size*.4]],i%5?'#d85b6b':'#ffd4ba');c.restore();
  }
  if(t<.075){const q=t/.075;c.globalAlpha=1-q;c.globalCompositeOperation='lighter';poly(c,[[-7,-36],[-2,-7],[21,10],[1,6],[7,34],[-5,10],[-25,-11],[-8,-7]],'#fff0d6');glow(c,0,0,26,'#ffbeb199');}
  c.restore();
 }
 function bladeShock(c,fx,camera=0){
  const t=fx.t;if(t<0||t>=.62)return;const r=fx.radius||225,z=fx.z||0;
  c.save();c.translate((fx.x||0)-camera,(fx.y||0)-z-52*(fx.scale||1));c.lineCap='round';c.lineJoin='round';
  // Three audible-looking pulses: broken upright metal facets, rather than floor circles.
  for(let wave=2;wave>=0;wave--){const age=t-wave*.047;if(age<0||age>.37)continue;
   const q=clamp(age/.20),spread=1-Math.pow(1-q,3),fade=1-smooth((age-.075)/.295),rad=r*spread*(1-wave*.14);
   // Upright, split pressure sheets give the metal fragments a ringing wavefront.
   for(const side of [-1,1]){const height=(39+wave*5)*(.5+spread*.5);
    c.globalAlpha=fade*(wave?.30:.68);
    for(const part of [-1,1]){c.beginPath();c.moveTo(side*rad*.74,part*height);c.bezierCurveTo(side*rad*.92,part*height*.70,side*rad*1.04,part*height*.34,side*rad,part*5);c.strokeStyle=wave?'#9dbbbe':'#eee8c4';c.lineWidth=wave?1:2.1;c.stroke();
     c.beginPath();c.moveTo(side*(rad*.74-5),part*(height-3));c.bezierCurveTo(side*(rad*.92-7),part*height*.70,side*(rad*1.04-7),part*height*.34,side*(rad-6),part*7);c.strokeStyle='#657f7d';c.lineWidth=1;c.stroke();
    }
   }
   for(let i=0;i<12;i++){const a=i*TAU/12+.10+(wave%2)*.12,n=noise(i+41),x=Math.cos(a)*rad,y=Math.sin(a)*rad*.37;
    const length=(18+n*26)*(1-q*.38),width=(3+n*4)*(1-wave*.16);
    c.globalAlpha=fade*(wave?.38:.88);
    c.save();c.translate(x,y);c.rotate(Math.cos(a)*.19);
    poly(c,[[0,-length*.80],[width,-length*.22],[width*.44,length*.65],[0,length],[-width*.40,length*.23],[-width*.63,-length*.30]],i%3?'#bacccc':'#d6bc7f');
    line(c,[[0,-length*.73],[width*.22,0],[0,length*.70]],i%3?'#eff5e6':'#fff0bf',1.1);c.restore();
    c.globalAlpha=fade*.50;
    // The trailing double nick says vibration; each segment stays disconnected.
    const dx=Math.cos(a),dy=Math.sin(a)*.37;
    for(let k=1;k<=2;k++)line(c,[[x-dx*(8+k*9)-2,y-dy*(8+k*9)-8],[x-dx*(8+k*9)+2,y-dy*(8+k*9)+6]],'#a9c4c4',.9);
   }
  }
  // A dry, sharp collision flash and short ringing traces along the crossed blades.
  if(t<.14){const q=t/.14,fade=1-q;c.globalAlpha=fade;c.globalCompositeOperation='lighter';
   line(c,[[-38,-26],[38,26]],'#dce6da',2.4*fade+.2);line(c,[[-17,31],[17,-31]],'#fff0b0',2.3*fade+.2);
   glow(c,0,0,23,'#f3e1a166');
   for(let i=0;i<16;i++){const a=i*2.399,n=noise(i+84),d=12+q*(18+n*44);line(c,[[Math.cos(a)*d*.55,Math.sin(a)*d*.74],[Math.cos(a)*d,Math.sin(a)*d*.74]],i%3?'#fff1c0':'#c8e1de',1.2*fade+.2);}
  }
  c.restore();
 }
 root.AshOverkillBladeShockFX={overkill,bladeShock,life:{overkill:.82,bladeShock:.62}};
})(globalThis);

/* ===== Heavy impacts: twin cleave, pressure, resonance and kick ===== */
/* Approved study 008. Shared gold fissures, air pressure and parry additions. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,sat=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{v=sat(v);return v*v*(3-2*v);},ease=v=>1-(1-sat(v))**3;
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function line(c,p,col,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function poly(c,p,col){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=col;c.fill();}
 function oval(c,x,y,rx,ry,col){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill();}
 function glow(c,x,y,r,col){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 const cracks=Array.from({length:6},(_,i)=>{const a=i*TAU/6+.12+noise(i+12)*.24;return Array.from({length:7},(_,j)=>{const d=j/6*(.69+noise(i+31)*.29),wiggle=j?(noise(i*17+j)-.5)*.10:0;return [Math.cos(a)*d-Math.sin(a)*wiggle,Math.sin(a)*d*.32+Math.cos(a)*wiggle*.38];});});
 const jets=cracks.flatMap((p,i)=>[3,5].map((j,k)=>({x:p[j][0],y:p[j][1],n:noise(i*5+k+110),delay:.075+k*.035+noise(i+13)*.027,side:i%2?-1:1})));
 function fissureJet(c,x,y,h,w,bend,t,n,alpha){
  if(h<=0||alpha<=0)return;c.save();c.translate(x,y);c.globalAlpha=alpha;
  // Torn, ascending force ribbons with molten bases, rather than a burning floor.
  c.beginPath();c.moveTo(-w,0);c.bezierCurveTo(-w*1.5,-h*.23,bend-w*.9,-h*.5,bend,-h);c.lineTo(bend+w*.22,-h*.70);c.lineTo(bend+w*.80,-h*.77);c.bezierCurveTo(w*1.05,-h*.30,w*.35,-h*.11,w,0);c.closePath();
  const g=c.createLinearGradient(0,0,bend,-h);g.addColorStop(0,'#b65d28');g.addColorStop(.22,'#f3a84e');g.addColorStop(.60,'#ffe0a0');g.addColorStop(1,'#fff1c300');c.fillStyle=g;c.fill();
  line(c,[[0,0],[bend*.16,-h*.28],[bend*.55,-h*.55],[bend,-h*.91]],'#fff1c4',Math.max(.7,w*.28));
  line(c,[[-w*.70,0],[bend*.3-w,-h*.28],[bend*.62-w*.30,-h*.58]],'#e38739',1.2);c.restore();
 }
 function twin(c,fx,camera=0){const t=fx.t,r=fx.radius||225;if(t<0||t>=1.05)return;c.save();c.translate((fx.x||0)-camera,fx.y||0);c.lineCap=c.lineJoin='round';
  const grow=ease(t/.13),fade=1-smooth((t-.40)/.60);
  for(const [i,path] of cracks.entries()){
   const points=path.map(([x,y])=>[x*r*grow,y*r*grow]);c.globalAlpha=fade*.86;line(c,points,'#995a2d',4.6);line(c,points,'#f3ba60',2.1);line(c,points,'#ffe2a0',.75);
   const p=points[4],end=points[6];line(c,[p,[p[0]+(i%2?-1:1)*18,p[1]+9],[end[0]*.9+(i%2?-1:1)*22,end[1]+15]],'#b67d3d',1.2);
  }
  if(t<.20){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-t/.20)*.44;glow(c,0,-3,49,'#efb55777');c.restore();}
  // Crack light leads each upward eruption; jets are distributed along the broken ground.
  for(const p of [...jets].sort((a,b)=>a.y-b.y)){const age=t-p.delay;if(age<0||age>.53)continue;const q=age/.53,up=ease(age/.12),alpha=1-smooth((age-.13)/.40),h=(48+p.n*78)*Math.sqrt(r/225)*up*(1-q*.55),w=(5+p.n*5)*Math.sqrt(r/225);
   fissureJet(c,p.x*r,p.y*r,h,w,p.side*(8+p.n*17),age,p.n,alpha*.89);
  }
  for(let i=0;i<45;i++){const n=noise(i+120),age=t-(.10+noise(i+15)*.10),life=.40+n*.38;if(age<0||age>life)continue;const p=jets[i%jets.length],q=age/life,vx=(noise(i+95)-.5)*80,x=p.x*r+vx*age,y=p.y*r-(140+n*130)*age+230*age*age;
   c.globalAlpha=(1-smooth((q-.5)/.5))*.86;c.save();c.translate(x,y);c.rotate(i+age*6);const s=1.3+n*2.2;poly(c,[[-s,-s],[s*.6,-s*.5],[s,s*.6],[-s*.5,s]],i%3?'#bb965c':'#ffe3a3');c.restore();
  }c.restore();
 }
 function pressure(c,fx,camera=0){const t=fx.t,r=fx.radius||230;if(t<0||t>=.68)return;c.save();c.translate((fx.x||0)-camera,(fx.y||0)-(fx.z||0)-38);c.lineCap='round';
  // Hollow pressure fronts swell through the air. The rear hemisphere is deliberately faint.
  for(let layer=2;layer>=0;layer--){const age=t-layer*.025;if(age<0||age>.40)continue;const q=ease(age/.23),rad=Math.max(.01,r*q*(1-layer*.12)),fade=1-smooth((age-.10)/.30),thick=(13-layer*3)*(1-q*.70);
   c.save();c.scale(1,.51);c.globalAlpha=fade*(layer?.22:.36);c.strokeStyle='#bfcfc4';c.lineWidth=thick;c.beginPath();c.arc(0,0,rad,Math.PI,TAU);c.stroke();
   c.globalAlpha=fade*(layer?.36:.78);c.strokeStyle=layer?'#b5c4b2':'#d6d9b5';c.lineWidth=thick;c.beginPath();c.arc(0,0,rad,.02,Math.PI-.02);c.stroke();
   c.globalAlpha=fade*.92;c.strokeStyle=layer?'#d9dfca':'#fff0c6';c.lineWidth=layer?1.1:2.0;c.beginPath();c.arc(0,0,rad,.10,Math.PI-.10);c.stroke();c.restore();
   // Local torn edges and compressed wakes make the front feel like force, not a magic seal.
   for(let i=0;i<16;i++){const a=i*TAU/16+.08,n=noise(i+200),x=Math.cos(a)*rad,y=Math.sin(a)*rad*.51;c.globalAlpha=fade*(layer?.22:.54);line(c,[[x-Math.cos(a)*(10+n*20),y-Math.sin(a)*(6+n*9)],[x+Math.cos(a)*7,y+Math.sin(a)*4]],i%3?'#dae0c7':'#fff0c5',1.0+n*.6);}
  }
  if(t<.15){const q=t/.15;c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)*.70;glow(c,0,0,31+q*20,'#eee3b277');poly(c,[[-5,-26],[5,-26],[13,-6],[31,0],[12,7],[5,25],[-5,25],[-13,6],[-30,0],[-12,-7]],'#fff0d4');}
  c.globalCompositeOperation='source-over';for(let i=0;i<20;i++){const age=t-.06,life=.26+noise(i+19)*.26;if(age<0||age>life)continue;const a=i*2.399,n=noise(i+50),rr=r*(.30+n*.57)*ease(age/.25),x=Math.cos(a)*rr,y=38+Math.sin(a)*rr*.31-Math.sin(age/life*Math.PI)*(8+n*16);c.globalAlpha=(1-age/life)*.40;line(c,[[x-6,y],[x+6,y-1]],'#b9b393',1.3);}
  c.restore();
 }
 function resonance(c,fx,camera=0){root.AshOverkillBladeShockFX.bladeShock(c,fx,camera);const t=fx.t,r=fx.radius||225,stacks=Math.max(0,Math.min(4,fx.stacks||0)),count=stacks*6;if(!count||t<0||t>=.62)return;
  c.save();c.translate((fx.x||0)-camera,(fx.y||0)-(fx.z||0)-52*(fx.scale||1));c.lineCap='round';
  for(let wave=2;wave>=0;wave--){const age=t-wave*.047;if(age<0||age>.37)continue;const q=sat(age/.20),spread=ease(q),fade=1-smooth((age-.075)/.295),rad=r*spread*(1-wave*.14);
   for(let i=0;i<count;i++){const a=(i+.45)*TAU/count+.10,n=noise(i+41),x=Math.cos(a)*rad,y=Math.sin(a)*rad*.37,length=(18+n*26)*(1-q*.38),width=(3+n*4)*(1-wave*.16);c.globalAlpha=fade*(wave?.38:.88);c.save();c.translate(x,y);c.rotate(Math.cos(a)*.19);poly(c,[[0,-length*.80],[width,-length*.22],[width*.44,length*.65],[0,length],[-width*.40,length*.23],[-width*.63,-length*.30]],i%3?'#bacccc':'#d6bc7f');line(c,[[0,-length*.73],[width*.22,0],[0,length*.70]],i%3?'#eff5e6':'#fff0bf',1.1);c.restore();
   }
  }c.restore();
 }
 function smallRecoil(c,fx,camera=0){if(fx.t<0||fx.t>=1.55)return;c.save();c.translate((fx.x||0)-camera,fx.y||0);c.scale(.58,.58);root.AshCombatFX.heavyRecoilImpact(c,{x:0,y:0,t:fx.t,radius:230,rank:3});c.restore();}
 function strongRecoil(c,fx,camera=0){if(fx.t<0||fx.t>=1.55)return;root.AshOverkillBladeShockFX.bladeShock(c,fx,camera);if(fx.small===false){root.AshCombatFX.heavyRecoilImpact(c,{...fx,z:0,radius:230,rank:3},camera);return;}smallRecoil(c,fx,camera);}
 function kick(c,fx,camera=0){const t=fx.t,r=fx.radius||135;if(t<0||t>=.84)return;c.save();c.translate((fx.x||0)-camera,(fx.y||0)-18);c.lineJoin=c.lineCap='round';
  if(t<.24){const grow=ease(t/.10),fade=1-smooth((t-.07)/.17);
   for(let i=0;i<11;i++){const a=-Math.PI+.15+i*(Math.PI-.3)/10,n=noise(i+230),len=r*(.64+n*.43)*grow,w=(7+n*10)*(1-t/.24*.45),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;
    const p=(d,b)=>[dx*d+nx*b,dy*d+ny*b];c.globalAlpha=fade*.77;
    poly(c,[p(4,-3),p(len*.28,w),p(len*.57,w*.28),p(len*.68,w*.60),p(len,0),p(len*.51,-w*.28),p(len*.24,-w*.62)],i%3?'#d5a951':'#a37531');
    c.globalAlpha=fade*.91;poly(c,[p(len*.08,0),p(len*.39,w*.20),p(len*.91,0),p(len*.40,-w*.10)],i%2?'#ffe7a5':'#fff4ce');
   }
   c.globalCompositeOperation='lighter';c.globalAlpha=fade*.65;glow(c,0,0,39,'#ffe2a366');c.globalCompositeOperation='source-over';
  }
  // Low, fast shrapnel spreads across the full projected damage area, including its near side.
  for(let i=0;i<176;i++){const n=noise(i+410),birth=noise(i+610)*.025,age=t-birth,life=.34+n*.40;if(age<0||age>life)continue;
   const a=i*2.399963229728653,reach=r*Math.sqrt((i+.5)/176),flight=.115+n*.075,lift=8+noise(i+810)*27;
   const position=at=>{const spread=ease(at/flight),hop=Math.sin(sat(at/life)*Math.PI);return [Math.cos(a)*reach*spread,18+Math.sin(a)*reach*.36*spread-lift*hop];};
   const [x,y]=position(age),[px,py]=position(Math.max(0,age-.026));c.globalAlpha=(1-smooth((age/life-.40)/.60))*.95;
   line(c,[[px,py],[x,y]],i%4?'#edc365':'#fff2c6',1.1+n*1.5);
   // Short jagged splinters stay legible after the initial high-speed streak.
   c.save();c.translate(x,y);c.rotate(a+age*(i%2?9:-11));const s=1.5+n*3.2;
   poly(c,[[-s*1.8,-s*.30],[s*.95,-s*.48],[s*1.8,0],[-s*.5,s*.42]],i%4?'#dfb05c':'#fff0b2');c.restore();
  }
  for(let i=0;i<84;i++){const n=noise(i+29),birth=noise(i+72)*.04,age=t-birth,life=.30+n*.47;if(age<0||age>life)continue;const a=-Math.PI+.12+(i*.618%1)*(Math.PI-.24),vx=Math.cos(a)*(120+n*r*1.50),vy=Math.sin(a)*(190+n*190)-15,x=vx*age,y=vy*age+270*age*age,q=age/life,s=1.7+n*3.8;
   c.globalAlpha=(1-smooth((q-.42)/.58))*.95;line(c,[[x-vx*.028,y-(vy+540*age)*.028],[x,y]],i%3?'#e2bd72':'#fff0bd',1.1+n*1.4);
   if(i%3===0){c.save();c.translate(x,y);c.rotate(i+age*7);poly(c,[[-s,-s*.5],[s,-s*.2],[s*.45,s],[-s,s*.3]],'#bb9859');c.restore();}
  }
  if(t<.09){c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.09;poly(c,[[-5,-32],[4,-12],[26,-20],[11,-3],[27,9],[6,9],[0,28],[-6,8],[-30,9],[-12,-3],[-26,-21],[-6,-12]],'#fff4d9');}
  c.restore();
 }
 root.AshHeavyImpactFX={twin,pressure,resonance,smallRecoil,strongRecoil,kick,life:{kick:.84,twin:1.05,pressure:.68,resonance:.62,smallRecoil:1.55,strongRecoil:1.55}};
})(globalThis);

/* ===== Persistent Sauron eye ===== */
(function(root){
"use strict";
function drawSauronEye(ctx,x,y,t,scale=1,attack=0){
 const TAU=Math.PI*2;
 function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill()}
 function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
 function eyePath(){ctx.beginPath();ctx.moveTo(-54,0);ctx.bezierCurveTo(-29,-30,24,-30,54,0);ctx.bezierCurveTo(26,25,-27,25,-54,0);ctx.closePath()}
 ctx.save();ctx.translate(x,y+Math.sin(t*2.1)*3*scale);ctx.scale(scale,scale);
 glow(0,0,100,'rgba(144,51,175,.17)');glow(0,-1,70,`rgba(255,101,21,${.16+attack*.2})`);
 ctx.globalCompositeOperation='lighter';
 // Broken occult halo, quieter than the burning silhouette.
 ctx.strokeStyle='rgba(149,91,174,.38)';ctx.lineWidth=.7;
 for(let i=0;i<12;i++){let a=i*TAU/12+t*.13;ctx.beginPath();ctx.ellipse(0,0,68,38,0,a,a+.24);ctx.stroke();let xx=Math.cos(a)*74,yy=Math.sin(a)*43;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx*1.06,yy*1.08);ctx.stroke()}
 // Deterministic flame tongues: stable animation, no per-frame randomness.
 for(let i=0;i<38;i++){const a=i*TAU/38,edgeX=Math.cos(a)*51,edgeY=Math.sin(a)*19;const flick=.5+.5*Math.sin(t*7+i*2.39);const len=8+flick*18+attack*15;const dx=Math.cos(a),dy=Math.sin(a);ctx.strokeStyle=i%3===0?'rgba(169,76,192,.55)':`rgba(245,${95+i%5*17},35,${.35+flick*.35})`;ctx.lineWidth=1+i%3*.5;ctx.beginPath();ctx.moveTo(edgeX,edgeY);ctx.quadraticCurveTo(edgeX+dx*len*.4+Math.sin(t*5+i)*5,edgeY+dy*len*.5,edgeX+dx*len+Math.sin(t*6+i)*4,edgeY+dy*len-5);ctx.stroke()}
 ctx.globalCompositeOperation='source-over';eyePath();let fire=ctx.createLinearGradient(0,-24,0,24);fire.addColorStop(0,'#f5b14b');fire.addColorStop(.35,'#bc4017');fire.addColorStop(.52,'#5c1613');fire.addColorStop(.75,'#d05c19');fire.addColorStop(1,'#ffca67');ctx.fillStyle=fire;ctx.fill();
 ctx.save();eyePath();ctx.clip();
 for(let i=0;i<55;i++){const a=i*TAU/55;ctx.strokeStyle=i%3===0?'rgba(255,215,119,.65)':'rgba(45,9,21,.56)';ctx.lineWidth=.6+i%2*.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*9,Math.sin(a)*17);ctx.quadraticCurveTo(Math.cos(a+.08)*30,Math.sin(a)*23,Math.cos(a)*60,Math.sin(a)*28);ctx.stroke()}
 glow(0,0,25,'rgba(255,169,47,.62)');ctx.restore();
 ctx.shadowColor='#ff8d27';ctx.shadowBlur=10+attack*12;eyePath();ctx.strokeStyle='#ffc575';ctx.lineWidth=1.5;ctx.stroke();
 // A sharp black slit remains readable even during a hit flash.
 ctx.shadowBlur=9;ctx.strokeStyle='#ffe7ac';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-21);ctx.bezierCurveTo(-10,-10,-10,11,0,22);ctx.bezierCurveTo(9,8,9,-10,0,-21);ctx.closePath();ctx.fillStyle='#09060b';ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 ctx.globalCompositeOperation='lighter';
 for(let i=0;i<22;i++){const q=(t*.36+i*.618)%1,xx=Math.sin(i*13.7)*66+Math.sin(t*2+i)*4,yy=18-q*84;ctx.globalAlpha=Math.sin(q*Math.PI)*.65;ellipse(xx,yy,.65+i%3*.25,1.4,'#ffb764')}
 ctx.restore();
}
 const api={draw:drawSauronEye};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.SauronEyeFX=api;
})(typeof globalThis!=="undefined"?globalThis:this);

/* ===== Wind death: silhouette capture and dissolution ===== */
/* Shared wind-death presentation. Snapshot once; dissolve the native silhouette. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AshWindDeath=api;})(globalThis,()=>{
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function capture(source,ox,oy){
    const w=source.width,h=source.height,pixels=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
    let x0=w,y0=h,x1=-1,y1=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>30){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
    if(x1<x0||y1<y0)return null;
    x0=Math.max(0,x0-5);y0=Math.max(0,y0-5);x1=Math.min(w-1,x1+5);y1=Math.min(h-1,y1+5);
    const image=canvas(x1-x0+1,y1-y0+1);image.getContext('2d').drawImage(source,-x0,-y0);
    return prepare({image,w:image.width,h:image.height,ox:ox-x0,oy:oy-y0});
  }
  function prepare(a){
    const pixels=a.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,a.w,a.h).data;
    a.cells=[];const step=2;let farthest=0;
    for(let y=0;y<a.h;y+=step)for(let x=0;x<a.w;x+=step){
      let opacity=0;for(let yy=y;yy<Math.min(y+step,a.h);yy++)for(let xx=x;xx<Math.min(x+step,a.w);xx++)opacity+=pixels[(yy*a.w+xx)*4+3];
      if(opacity<50)continue;
      const distance=Math.abs((y/a.h-.50)-.45*(x/a.w-.50));farthest=Math.max(farthest,distance);
      a.cells.push({x,y,w:Math.min(step,a.w-x),h:Math.min(step,a.h-y),distance,seed:noise(x,y),opacity:opacity/(step*step*255)});
    }
    for(const p of a.cells)p.release=.18+.28*p.distance/Math.max(.01,farthest)+.035*p.seed;
    a.ink=canvas(a.w,a.h);const c=a.ink.getContext('2d');c.drawImage(a.image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#555249';c.fillRect(0,0,a.w,a.h);
    a.remnant=canvas(a.w,a.h);a.remnantContext=a.remnant.getContext('2d');a.cachedTime=-1;return a;
  }
  function motion(a,p,t){
    const u=clamp(Math.max(0,t-p.release)/.27),n=p.seed;
    return {x:p.x+a.w*(.10+.25*n)*u,y:p.y-a.h*(.08+.23*noise(p.y,p.x))*u-12*u*u,
      size:(.9+n*.8)*(1-u*.8),alpha:clamp(p.opacity*(1-ease(u))*.75),angle:(n-.5)*5*u};
  }
  function remnant(a,t){
    const key=Math.round(t*1000);if(a.cachedTime===key)return a.remnant;a.cachedTime=key;
    const c=a.remnantContext;c.clearRect(0,0,a.w,a.h);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.drawImage(a.image,0,0);
    c.globalAlpha=ease((t-.06)/.11)*.94;c.drawImage(a.ink,0,0);c.globalAlpha=1;c.globalCompositeOperation='destination-out';
    for(const p of a.cells)if(t>=p.release){c.globalAlpha=ease((t-p.release)/.035);c.fillRect(p.x,p.y,p.w,p.h);}
    c.globalAlpha=1;c.globalCompositeOperation='source-over';return a.remnant;
  }
  function draw(c,a,t,x,y,scale=1,face=1,dust=true){
    if(!a||t>=.8)return;c.save();c.translate(x,y);c.scale(face*scale,scale);c.translate(-a.ox,-a.oy);c.drawImage(remnant(a,t),0,0);
    const alpha=c.globalAlpha;
    if(dust)for(const p of a.cells){
      if(t<=p.release||t>=p.release+.27||p.seed>.36)continue;
      const m=motion(a,p,t);c.save();c.globalAlpha=alpha*m.alpha;c.translate(m.x,m.y);c.rotate(m.angle);
      c.fillStyle=p.seed<.08?'#beb58c':p.seed<.16?'#99957e':'#777365';
      c.fillRect(-p.w*m.size*.5,-p.h*m.size*.5,p.w*m.size,p.h*m.size);c.restore();
    }
    c.restore();
  }
  return {capture,prepare,draw,motion,duration:.8};
});

/* Approved study 009 — shared ground impacts, rock thrust and blood bursts. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,sat=v=>Math.max(0,Math.min(1,v)),ease=v=>1-(1-sat(v))**3;
 const smooth=v=>{v=sat(v);return v*v*(3-2*v);};
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function line(c,p,col,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function poly(c,p,col){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=col;c.fill();}
 function oval(c,x,y,rx,ry,col){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill();}
 function glow(c,x,y,r,col){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function begin(c,f,camera){c.save();c.translate((f.x||0)-camera,f.y||0);c.lineCap=c.lineJoin='round';}
 // Same torn upward ribbon profile as the approved twin-cleave art.
 function jet(c,x,y,h,w,bend,alpha){if(h<=0||alpha<=0)return;c.save();c.translate(x,y);c.globalAlpha*=alpha;c.beginPath();c.moveTo(-w,0);c.bezierCurveTo(-w*1.5,-h*.23,bend-w*.9,-h*.5,bend,-h);c.lineTo(bend+w*.22,-h*.70);c.lineTo(bend+w*.8,-h*.77);c.bezierCurveTo(w*1.05,-h*.3,w*.35,-h*.11,w,0);c.closePath();const g=c.createLinearGradient(0,0,bend,-h);g.addColorStop(0,'#b65d28');g.addColorStop(.22,'#f3a84e');g.addColorStop(.60,'#ffe0a0');g.addColorStop(1,'#fff1c300');c.fillStyle=g;c.fill();line(c,[[0,0],[bend*.16,-h*.28],[bend*.55,-h*.55],[bend,-h*.91]],'#fff1c4',Math.max(.7,w*.28));line(c,[[-w*.7,0],[bend*.3-w,-h*.28],[bend*.62-w*.3,-h*.58]],'#e38739',1.2);c.restore();}
 const riftPath=Array.from({length:15},(_,i)=>[i/14,(noise(i+502)-.5)*(i?15:0)]);
 function rift(c,f,camera=0){const t=f.t,length=f.length||420;if(t<0||t>=1.16)return;begin(c,f,camera);c.scale(f.face||1,1);
  const reveal=ease(t/.23),fade=1-smooth((t-.48)/.65),end=length*reveal;
  const points=riftPath.filter(p=>p[0]*length<end).map(p=>[p[0]*length,p[1]]);const k=Math.min(13,Math.floor(reveal*14)),a=riftPath[k],b=riftPath[k+1],u=sat((reveal-a[0])/(b[0]-a[0]));points.push([end,a[1]+(b[1]-a[1])*u]);
  c.globalAlpha=fade;line(c,points,'#32241d',8);line(c,points,'#995a2d',4.6);line(c,points,'#f3ba60',2.1);line(c,points,'#ffe2a0',.75);
  for(let i=2;i<14;i++){const p=riftPath[i],x=p[0]*length;if(x>end)continue;const side=i%2?-1:1;line(c,[[x,p[1]],[x+9,p[1]+side*9],[x+28,p[1]+side*13]],'#c48948',1.3);}
  for(let i=1;i<=9;i++){const x=i/10*length,age=t-(.045+i*.013);if(age<0||age>.53||x>end)continue;const n=noise(i+622),h=(48+n*78)*ease(age/.12)*(1-age/.53*.55),alpha=1-smooth((age-.13)/.4),y=riftPath[Math.round(i/10*14)][1];jet(c,x,y,h,5+n*5,(i%2?-1:1)*(8+n*17),alpha*.89);}
  for(let i=0;i<34;i++){const n=noise(i+680),x0=(.12+noise(i+740)*.84)*length,age=t-(.09+x0/length*.13),life=.38+n*.32;if(age<0||age>life||x0>end)continue;c.globalAlpha=fade*(1-age/life);const x=x0+(noise(i+818)-.5)*70*age,y=-4-(150+n*100)*age+230*age*age;c.save();c.translate(x,y);c.rotate(i+age*6);const s=1.4+n*2;poly(c,[[-s,-s],[s,-s*.3],[s*.5,s],[-s,s*.6]],i%3?'#bb965c':'#ffe3a3');c.restore();}
  c.restore();
 }
 function aftershock(c,f,camera=0){root.AshHeavyImpactFX.twin(c,f,camera);if(f.full!==false)rift(c,f,camera);}
 // Asymmetric slabs: wide roots, stepped shoulders and a separate lit fracture plane.
 function slab(c,x,y,w,h,n,lean=0){if(h<=0||w<=0)return;c.save();c.translate(x,y);const tip=w*(.1+noise(n+5)*.23)+lean,shoulder=-h*(.69+noise(n+8)*.16),ledge=h*.12;
  const outline=[[-w*.65,2],[-w*.7,-h*.28],[-w*.58,-h*.64],[-w*.38,shoulder],[tip-w*.30,-h+ledge],[tip,-h],[tip+w*.35,-h*.86],[w*.62,-h*.58],[w*.68,-h*.12],[w*.57,2]];
  const g=c.createLinearGradient(-w,0,w,-h);g.addColorStop(0,'#373a36');g.addColorStop(.45,'#696e61');g.addColorStop(1,'#9c9e87');poly(c,outline,g);
  poly(c,[[-w*.65,2],[-w*.38,shoulder],[tip-w*.20,-h+ledge],[tip,-h],[tip-w*.06,-h*.59],[-w*.08,-h*.33],[w*.06,2]],'#484b43');
  poly(c,[[tip,-h],[tip+w*.29,-h*.83],[w*.47,-h*.47],[w*.68,-h*.12],[w*.15,-h*.27],[tip-w*.06,-h*.59]],'#898d7a');
  line(c,[[tip,-h],[tip-w*.06,-h*.59],[w*.15,-h*.27]],'#c8bea0',1.15);
  line(c,[[-w*.38,shoulder],[tip-w*.20,-h+ledge],[tip,-h]],'#b1b39b',1.3);
  for(let j=0;j<3;j++){const yy=-h*(.2+j*.20),xx=-w*.4+(j%2)*w*.12;line(c,[[xx,yy],[xx+w*.25,yy+3],[xx+w*.61,yy+1]],j%2?'#353a33':'#bdbaa04d',.7);}
  for(let j=0;j<6;j++){const xx=(noise(n*13+j+40)-.5)*w*.68,yy=-h*(.15+noise(n+j+85)*.5);line(c,[[xx,yy],[xx+2+noise(n+j)*4,yy-1]],'#222b2b55',.8);}
  c.restore();
 }
 function dust(c,x,y,rx,ry,alpha,col='#b8a785'){c.save();c.translate(x,y);c.scale(1,ry/Math.max(1,rx));c.globalAlpha*=alpha;glow(c,0,0,rx,col+'66');c.restore();}
 function chips(c,t,r,count,large=false){for(let i=0;i<count;i++){const n=noise(i+960),age=t-.035-noise(i+1100)*.08,life=.38+n*.48;if(age<0||age>life)continue;const a=i*2.399,rr=r*(.1+n*.7)*ease(age/.28),x=Math.cos(a)*rr,y=Math.sin(a)*rr*.32-(110+n*(large?300:110))*age+260*age*age;c.globalAlpha=(1-smooth((age/life-.5)/.5))*.9;c.save();c.translate(x,y);c.rotate(i+age*(3+n*5));const w=(large?3:1.6)+n*(large?6:3),h=w*(.65+n*.7);poly(c,[[-w,0],[-w*.3,-h],[w,-h*.4],[w*.7,h*.6],[-w*.6,h*.4]],i%4?'#857b66':'#c6b48e');poly(c,[[-w*.3,-h],[w,-h*.4],[0,0]],'#d2c5a4');c.restore();}}
 function rock(c,f,camera=0){const t=f.t,len=f.length||262;if(t<0||t>=.82)return;begin(c,f,camera);c.scale(f.face||1,1);const fade=1-smooth((t-.30)/.43);
  // Sparse ankle-height stones disturbed beside the feet as the dash advances.
  const stones=Array.from({length:5},(_,i)=>({i,x:12+i*len/5,y:i%2?5:-4,n:noise(i+420)})).sort((a,b)=>a.y-b.y);
  for(const p of stones){const age=t-p.i*.045;if(age<0)continue;const rise=ease(age/.055),settle=1-smooth((age-.20)/.26),h=(10+p.n*8)*(f.full===false?.9:1)*rise*settle,w=8+p.n*6,lift=Math.sin(sat(age/.38)*Math.PI)*(4+p.n*3);c.globalAlpha=fade;oval(c,p.x,p.y+2,w,2,'#111d1988');slab(c,p.x,p.y-lift,w,h,p.i+820,2);dust(c,p.x,p.y+2,13+age*14,3+age*4,(1-smooth(age/.38))*.27);}
  for(let i=0;i<14;i++){const age=t-.025-(i%5)*.045,n=noise(i+1001),life=.28+n*.18;if(age<0||age>life)continue;c.globalAlpha=(1-age/life)*fade;const x=12+(i%5)*len/5+(noise(i+1082)-.5)*42*age,y=(i%2?5:-4)-(30+n*70)*age+190*age*age;c.save();c.translate(x,y);c.rotate(i+age*4);slab(c,0,0,.8+n,1.4+n*1.8,i+930);c.restore();}
  c.restore();
 }
 // Ground-wave front: lifted fractured plates, dirt curls, and low flying grit.
 function stone(c,f,camera=0){const t=f.t,r=f.radius||175;if(t<0||t>=.98)return;begin(c,f,camera);const spread=ease(t/.23),fade=1-smooth((t-.20)/.72),rad=r*spread;
  for(let i=0;i<11;i++){const a=i*TAU/11+noise(i+303)*.24,n=noise(i+320),end=r*(.54+n*.4)*spread,p=[[0,0],[Math.cos(a+.12)*end*.38,Math.sin(a+.12)*end*.13],[Math.cos(a-.04)*end*.74,Math.sin(a-.04)*end*.24],[Math.cos(a)*end,Math.sin(a)*end*.32]];c.globalAlpha=fade*.88;line(c,p,'#10201c',4.5);line(c,p,'#8d7957',1.4);if(t<.25)line(c,p,'#e3c795',(1-t/.25)*1.1);}
  // Broken arcs are dusty pressure fronts, not solid luminous floor disks.
  for(let i=0;i<24;i++){const a=i*TAU/24,n=noise(i+385),x=Math.cos(a)*rad,y=Math.sin(a)*rad*.32;c.globalAlpha=fade*.65;dust(c,x,y-4,18+n*13,6+n*6,.72);c.globalAlpha=fade*.86;c.save();c.translate(x,y);c.rotate(Math.cos(a)*.13);poly(c,[[-10-n*7,2],[-5-n*4,-3-n*8],[6,-4-n*5],[12,1]],i%3?'#676c58':'#9a957b');line(c,[[-5-n*4,-3-n*8],[6,-4-n*5],[12,1]],'#ccbd9d',.95);c.restore();}
  chips(c,t,r,56);c.restore();
 }
 // Great stomp has a crater and a rising, layered crown, rather than an enlarged stone wave.
 function greatStomp(c,f,camera=0){const t=f.t,r=f.radius||320;if(t<0||t>=1.6)return;begin(c,f,camera);const grow=ease(t/.18),fade=1-smooth((t-.57)/.96);
  c.globalAlpha=fade;const rim=Array.from({length:27},(_,i)=>{const a=i*TAU/26,rr=r*(.30+noise(i+15)*.08)*grow;return [Math.cos(a)*rr,Math.sin(a)*rr*.31];});poly(c,rim,'#101a16');line(c,rim,'#7a6950',4);line(c,rim,'#b5a07d',1.3);
  for(let i=0;i<13;i++){const a=i*TAU/13+.09,n=noise(i+160),end=r*(.72+n*.28)*ease(t/.31),p=[[Math.cos(a)*r*.28*grow,Math.sin(a)*r*.28*.32*grow],[Math.cos(a-.05)*end*.61,Math.sin(a-.05)*end*.61*.32],[Math.cos(a+.03)*end*.81,Math.sin(a+.03)*end*.81*.32],[Math.cos(a)*end,Math.sin(a)*end*.32]];c.globalAlpha=fade;line(c,p,'#111b17',8);line(c,p,'#766347',3.5);line(c,p,'#d6ac65',1);}
  for(let wave=0;wave<2;wave++){const age=t-.04-wave*.13;if(age<0||age>.72)continue;const rr=r*ease(age/.30)*(1-wave*.13),alpha=(1-smooth((age-.12)/.6))*(wave?.55:.75);for(let i=0;i<28;i++){const a=i*TAU/28; c.globalAlpha=alpha;dust(c,Math.cos(a)*rr,Math.sin(a)*rr*.32-8,26+noise(i+151)*16,10+noise(i+152)*13,.7);}}
  const blocks=Array.from({length:16},(_,i)=>{const a=i*TAU/16+.12;return {i,a,x:Math.cos(a)*r*.39,y:Math.sin(a)*r*.39*.32};}).sort((a,b)=>a.y-b.y);
  for(const p of blocks){const n=noise(p.i+750),age=t-.05-n*.055;if(age<0)continue;const rise=ease(age/.12)*(1-smooth((age-.35)/.56)),h=(38+n*56)*rise;c.globalAlpha=fade;slab(c,p.x,p.y,16+n*14,h,p.i+216,Math.cos(p.a)*12);dust(c,p.x,p.y,39,17,(1-smooth(age/.8))*.42);}
  // Short central compression is followed by heavy vertical dirt columns.
  if(t<.16){c.globalAlpha=(1-t/.16)*.6;glow(c,0,-12,54,'#ffe2a688');line(c,[[-26,0],[0,-45],[26,0]],'#fff0ca',2);}
  for(let i=0;i<12;i++){const n=noise(i+191),age=t-.09-n*.06;if(age<0||age>.56)continue;const x=(noise(i+581)-.5)*r*.9,y=(noise(i+613)-.5)*r*.16,h=(48+n*74)*Math.sin(sat(age/.56)*Math.PI);c.globalAlpha=(1-age/.56)*.46;dust(c,x,y-h*.5,12+n*10,h*.5+5,.7);}
  chips(c,t,r,105,true);c.restore();
 }
 function bloodRibbon(c,x,y,a,len,w,bend,col){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(0,-w*.36);c.bezierCurveTo(len*.25,-w*1.5,len*.52,bend-w*.15,len*.80,bend-w*.3);c.bezierCurveTo(len*.93,bend-w*.65,len*1.02,bend-w*.25,len,bend+w*.14);c.bezierCurveTo(len*.99,bend+w*.55,len*.82,bend+w*.4,len*.72,bend+w*.15);c.bezierCurveTo(len*.49,bend+w*.23,len*.23,w*.8,0,w*.36);c.closePath();c.fillStyle=col;c.fill();c.restore();}
 function blood(c,f,camera=0){const t=f.t,r=f.radius||240;if(t<0||t>=1.24)return;begin(c,f,camera);const strength=Math.max(1,Math.min(6,f.count||1)),power=1+(strength-1)*.065,fade=1-smooth((t-.28)/.92),spread=ease(t/.20);
  // Irregular stain clusters stay on the floor while the fluid crown bursts above them.
  for(let i=0;i<25;i++){const a=i*2.399,n=noise(i+78),age=t-.16-n*.1;if(age<0)continue;const d=r*(.22+n*.63)*ease(age/.16);c.globalAlpha=fade*.58;oval(c,Math.cos(a)*d,Math.sin(a)*d*.31,4+n*11,1.5+n*3.2,'#4d1824');}
  c.translate(0,-(f.z||0)-30);if(t<.18){c.globalAlpha=(1-t/.18)*.62;glow(c,0,0,56*power,'#e8335877');oval(c,0,-4,8+spread*19,13+spread*15,'#f2b5ad');}
  // A torn fluid crown replaces the concentric rings / straight spokes.
  const tendrils=12+strength;
  for(let i=0;i<tendrils;i++){const n=noise(i+90),a=i*TAU/tendrils+.13,age=t-n*.018;if(age<0||age>.56)continue;const q=age/.56,reach=r*(.45+n*.48)*ease(age/.13),up=Math.sin(q*Math.PI)*(10+n*34)*power,x=Math.cos(a)*reach,y=Math.sin(a)*reach*.38-up,w=(8+n*13)*power*(1-q*.65),alpha=(1-smooth((age-.09)/.47));c.globalAlpha=alpha;
   const startX=Math.cos(a)*12,startY=Math.sin(a)*8,angle=Math.atan2(y-startY,x-startX),len=Math.hypot(x-startX,y-startY);
   const bend=(i%2?-1:1)*(14+n*35)*(1-q*.25);bloodRibbon(c,startX,startY,angle,len,w,bend,'#65152b');bloodRibbon(c,startX,startY,angle,len*.94,w*.57,bend*.88,i%3?'#b92b45':'#d84c59');bloodRibbon(c,startX,startY,angle,len*.72,w*.09,bend*.68,'#e78580');
  }
  // Separate ballistic droplets give real volume, weight and falling tails.
  for(let i=0;i<95+strength*9;i++){const n=noise(i+254),age=t-.035-noise(i+641)*.04,life=.44+n*.54;if(age<0||age>life)continue;const a=i*2.399+.3,speed=r*(.72+n*.74),drag=(1-Math.exp(-age*4))/4,xx=Math.cos(a)*speed*drag,yy=Math.sin(a)*speed*drag*.35-(60+n*260)*age*power+230*age*age,w=(1+n*2.5)*(1-age/life*.45),vx=Math.cos(a)*speed*Math.exp(-age*4),vy=Math.sin(a)*speed*Math.exp(-age*4)*.35-(60+n*260)*power+460*age;c.globalAlpha=(1-smooth((age/life-.62)/.38))*.91;c.save();c.translate(xx,yy);c.rotate(Math.atan2(vy,vx));oval(c,0,0,w*(1+Math.min(2,Math.hypot(vx,vy)/240)),w,i%4?'#b4304a':'#e98585');oval(c,-w*.45,-w*.2,w*.48,w*.3,'#f3b0a1');c.restore();}
  // Wisps disperse locally; no opaque red disk covering the combat area.
  c.globalAlpha=fade;for(let i=0;i<8;i++){const a=i*TAU/8;dust(c,Math.cos(a)*r*.25*spread,Math.sin(a)*r*.11*spread-14,30+spread*27,18,.18*(1-smooth(t/.67)),'#aa263e');}c.restore();
 }
 root.AshEarthBloodFX={aftershock,rift,rock,stone,greatStomp,blood,life:{aftershock:1.16,rock:.82,stone:.98,greatStomp:1.6,blood:1.24}};
})(globalThis);
