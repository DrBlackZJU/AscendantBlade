/* Test-only artwork. No hooks, game imports, random combat rolls or persistent FX state. */
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
 // Seven low tongues in a symmetric upward fan; outer tongues are 45 degrees
 // above the ground. Airborne sparks carry the height and most of the impact.
 function projectileBurst(c,fx){const t=fx.t,r=fx.radius||50;if(t<0||t>=1.05)return;c.save();c.translate(fx.x,fx.y);const width=r*.68,q=ease(t/.13),fade=1-sat((t-.09)/.34),sourceY=-36;
 if(t<.10){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-t/.10;glow(c,0,sourceY,Math.min(34,width*.7),'#ffd48799');oval(c,0,sourceY,7+7*ease(t/.08),9+10*ease(t/.08),'#fff3cd');c.restore();}
 if(t<.43){for(let i=0;i<7;i++){const n=noise(i+27),side=(i-3)/3,a=-Math.PI/2+side*Math.PI/4,len=(37+Math.min(25,r*.15))*(.84+n*.16)*q,sx=side*5,sy=sourceY,xx=sx+Math.cos(a)*len,yy=sy+Math.sin(a)*len,w=2.3+n*2.5,bend=side*4;c.save();c.globalAlpha=fade*.82;
 c.beginPath();c.moveTo(sx-w,sy);c.bezierCurveTo(sx+Math.cos(a)*len*.35-w,sy+Math.sin(a)*len*.35,xx+bend-w,yy+15,xx,yy);c.bezierCurveTo(xx+bend+w,yy+12,sx+w+Math.cos(a)*len*.24,sy+Math.sin(a)*len*.24,sx+w,sy);c.closePath();const g=c.createLinearGradient(sx,sy,xx,yy);g.addColorStop(0,'#ce491a');g.addColorStop(.42,'#ff9539');g.addColorStop(.85,'#ffd47e');g.addColorStop(1,'#fff0b8');c.fillStyle=g;c.fill();line(c,[[sx,sy-2],[sx+(xx-sx)*.58,sy+(yy-sy)*.58],[xx,yy+3]],'#ffe3a1',.9+n*.5);c.restore();}}
 // Bright ballistic-looking sparks rise much higher than the short flame tongues.
 c.globalCompositeOperation='lighter';for(let i=0;i<62;i++){const n=noise(i+200),delay=noise(i+501)*.035,age=t-delay,life=.40+n*.43;if(age<0||age>life)continue;const progress=age/life,side=(noise(i+450)-.5)*2,reach=width*(.30+n*.64),lift=88+n*137,xx=side*reach*ease(age/.40),yy=sourceY-lift*ease(age/.28)+185*age*age,back=Math.max(0,age-.014-n*.013),bx=side*reach*ease(back/.40),by=sourceY-lift*ease(back/.28)+185*back*back;c.globalAlpha=(1-progress)*.98;line(c,[[bx,by],[xx,yy]],i%4?'#ffc66d':'#fff8db',1+n*1.25);oval(c,xx,yy,.7+n*.7,.7+n*.7,i%4?'#ffda8a':'#fff8dd');}
 c.globalCompositeOperation='source-over';if(t>.20){c.globalAlpha=(1-sat((t-.20)/.7))*.09;for(let i=0;i<4;i++){const n=noise(i+311),xx=(n-.5)*width*.6,yy=-50-(20+n*36)*ease(t/.7);oval(c,xx,yy,5+n*5,6+n*8,'#867153');}}
 if(t<.18){c.globalAlpha=(1-t/.18)*.38;ring(c,0,-7,width*q*.64,width*q*.18,'#ffcb7a',1.6);}c.restore();}
 root.FireFamiliesStudy={projectileBurst};
})(globalThis);
