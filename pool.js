/* Arin's pool portfolio. Pure Canvas + JavaScript; no dependencies. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas=$('poolCanvas'), ctx=canvas.getContext('2d');
const chapters=[
 {name:'About Me',short:'ABOUT',section:'about',color:'#f3cc5d',number:1,desc:'What makes me, me — the stories that don’t fit on a résumé.'},
 {name:'Experience',short:'WORK',section:'experience',color:'#5bc7b7',number:2,desc:'What I worked on, the people I learned from, and the problems I helped solve.'},
 {name:'FSAE Chassis',short:'FSAE',section:'projects',url:'project-fsae.html',color:'#e98c68',number:3,desc:'A deep dive into designing and validating our carbon-fiber monocoque.'},
 {name:'ME 370',short:'370',section:'projects',url:'project-me370.html',color:'#a7b8ed',number:4,desc:'My ME 370 project and the engineering behind it.'},
 {name:'ME 371',short:'371',section:'projects',url:'project-me371.html',color:'#e5a5b9',number:5,desc:'Design, analysis, and experiments from ME 371.'},
 {name:'Topology Optimization',short:'TOPO',section:'projects',url:'project-topology.html',color:'#b7afd9',number:6,desc:'Planar FEA, material distribution, and five topology optimization trials.'},
 {name:'Contact',short:'HELLO',section:'contact',color:'#f4a84e',number:7,desc:'Want to talk engineering, pool, or where to eat next?'}
];
const world={w:1000,h:494,x0:64,x1:936,y0:62,y1:432,r:15};
const pockets=[{x:64,y:62},{x:500,y:59},{x:936,y:62},{x:64,y:432},{x:500,y:435},{x:936,y:432}];
const balls=[],cue={x:275,y:246,vx:0,vy:0,r:world.r,white:true,active:true};
const physics={drag:0.990,wall:0.79,impact:0.96};
let sizing={w:0,h:0,scale:1,ox:0,oy:0,dpr:1};
let dragging=false,aim=null,moving=false,paused=false,modalOpen=false,assisted=null,selectedChapter=null,toastTimer=null,lastTime=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const anyMoving=()=>balls.concat(cue).some(b=>b.active&&Math.hypot(b.vx||0,b.vy||0)>.15);
function setup(){balls.length=0; const positions=[[666,246],[699,228],[699,264],[732,210],[732,246],[732,282],[765,246]];chapters.forEach((ch,i)=>balls.push({...ch,x:positions[i][0],y:positions[i][1],vx:0,vy:0,r:world.r,active:true}));Object.assign(cue,{x:273,y:246,vx:0,vy:0,active:true});assisted=null;moving=false;modalOpen=false;$('poolDialog').classList.add('hidden');refreshSelect();setStatus('YOUR SHOT.','Drag back from the white ball and release. Or choose a chapter for an easy shot.');}
function refreshSelect(){const select=$('ballChoice'),current=select.value; select.innerHTML='';balls.filter(b=>b.active).forEach(b=>{const opt=document.createElement('option');opt.value=b.section+':'+b.number;opt.textContent=b.name;select.append(opt)});if([...select.options].some(o=>o.value===current))select.value=current;$('assistShot').disabled=!select.options.length;if(!select.options.length)setStatus('TABLE CLEARED!','All chapters pocketed. Reset to play again.');}
function selectedBall(){return balls.find(b=>b.active && (b.section+':'+b.number)===$('ballChoice').value)}
function setStatus(title,detail){$('gameStatus').textContent=title;$('gameHint').textContent=detail;}
function resize(){const box=canvas.getBoundingClientRect();sizing.w=Math.max(box.width,10);sizing.h=Math.max(box.height,10);sizing.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(sizing.w*sizing.dpr);canvas.height=Math.round(sizing.h*sizing.dpr);const scale=Math.min(sizing.w/world.w,sizing.h/world.h);sizing.scale=scale;sizing.ox=(sizing.w-world.w*scale)/2;sizing.oy=(sizing.h-world.h*scale)/2;ctx.setTransform(sizing.dpr*scale,0,0,sizing.dpr*scale,sizing.dpr*sizing.ox,sizing.dpr*sizing.oy);}
function localPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left-sizing.ox)/sizing.scale,y:(e.clientY-r.top-sizing.oy)/sizing.scale};}
function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function line(x1,y1,x2,y2,color,width,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([])}
function draw(){const s=sizing;ctx.setTransform(s.dpr,0,0,s.dpr,0,0);ctx.clearRect(0,0,s.w,s.h);ctx.setTransform(s.dpr*s.scale,0,0,s.dpr*s.scale,s.dpr*s.ox,s.dpr*s.oy);
 // Rich felt table, framed against the minimal warm page.
 ctx.shadowColor='#243a3330';ctx.shadowBlur=20;ctx.shadowOffsetY=14;roundRect(13,13,974,468,29,'#9f724b');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 roundRect(23,23,954,448,23,'#d6ab76');roundRect(33,33,934,428,21,'#24594c');roundRect(48,47,904,400,15,'#154f45');
 const felt=ctx.createLinearGradient(70,70,900,460);felt.addColorStop(0,'#267965');felt.addColorStop(.55,'#21705d');felt.addColorStop(1,'#145344');roundRect(world.x0,world.y0,world.x1-world.x0,world.y1-world.y0,7,felt);
 line(302,63,302,431,'#def0da3c',2);ctx.beginPath();ctx.arc(302,246,96,Math.PI/2,-Math.PI/2);ctx.strokeStyle='#def0da29';ctx.lineWidth=2;ctx.stroke();
 ctx.beginPath();ctx.arc(650,246,4,0,Math.PI*2);ctx.fillStyle='#e7f5db65';ctx.fill();
 for(let i=0;i<5;i++){const x=158+i*170;[34,458].forEach(y=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#fbe6bf';ctx.fillRect(-4,-4,8,8);ctx.restore()})}
 pockets.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.fillStyle='#09221f';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,20,0,Math.PI*2);ctx.fillStyle='#071c1c';ctx.fill();});
 if(assisted)drawAssist();
 if(!moving&&!assisted&&cue.active&&!modalOpen&&!paused)drawAim();
 [...balls,cue].filter(b=>b.active).forEach(drawBall);
 // Instructions etched into the frame.
 ctx.fillStyle='#fff3dd';ctx.textAlign='center';ctx.font='bold 10px Arial';ctx.letterSpacing='0px';ctx.fillText('ARIN’S BREAK ROOM',500,26);
 }
function drawBall(b){ctx.save();ctx.shadowColor='#001e1c80';ctx.shadowBlur=8;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=b.white?'#fcfcf6':b.color;ctx.fill();ctx.restore();const glow=ctx.createRadialGradient(b.x-6,b.y-7,1,b.x,b.y,20);glow.addColorStop(0,'#ffffff9c');glow.addColorStop(.55,'#ffffff03');glow.addColorStop(1,'#00000039');ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();if(b.white){ctx.beginPath();ctx.arc(b.x-5,b.y-6,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();return;}ctx.beginPath();ctx.arc(b.x,b.y,7.8,0,Math.PI*2);ctx.fillStyle='#f9f5eb';ctx.fill();ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#172c2e';ctx.fillText(b.number,b.x,b.y+.7);ctx.textBaseline='alphabetic';
 // Label above each ball. Keep easy to read even on small screens.
 const label=b.short,ww=label.length*8+20;roundRect(b.x-ww/2,b.y-43,ww,19,8,'#f7f7ee');ctx.textAlign='center';ctx.fillStyle='#173b38';ctx.font='bold 11px Arial';ctx.fillText(label,b.x,b.y-30);
 }
function drawAim(){const target=aim||{x:cue.x+120,y:cue.y};let dx=cue.x-target.x,dy=cue.y-target.y;let m=Math.hypot(dx,dy);if(m<2){dx=1;dy=0;m=1;}const vx=dx/m,vy=dy/m;
 // If not dragging, cue points towards racked balls; dragging pulls it back.
 let power=dragging?Math.min(m,185):36;const dir=dragging?{x:vx,y:vy}:{x:1,y:0};
 line(cue.x,cue.y,cue.x+dir.x*400,cue.y+dir.y*400,'#effbe666',1.8,[9,10]);
 line(cue.x-dir.x*(20+power*.32),cue.y-dir.y*(20+power*.32),cue.x-dir.x*(185+power*.32),cue.y-dir.y*(185+power*.32),'#c69b63',8);
 line(cue.x-dir.x*(20+power*.32),cue.y-dir.y*(20+power*.32),cue.x-dir.x*(39+power*.32),cue.y-dir.y*(39+power*.32),'#f0e6d3',8);
 if(dragging){roundRect(cue.x-50,cue.y+30,100,21,10,'#11372b');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 11px Arial';ctx.fillText('POWER '+Math.round(power/185*100)+'%',cue.x,cue.y+45)}}
function drawAssist(){const a=assisted;if(!a)return;const t=Math.min(1,a.t/a.duration),ease=t*t*(3-2*t);a.ball.x=a.sx+(a.pocket.x-a.sx)*ease;a.ball.y=a.sy+(a.pocket.y-a.sy)*ease;ctx.beginPath();ctx.arc(a.ball.x,a.ball.y,22+9*t,0,2*Math.PI);ctx.strokeStyle='#f4e9ab80';ctx.lineWidth=3;ctx.stroke();if(t>=1){const b=a.ball;assisted=null;pocketBall(b);}}
function integrate(dt){if(!moving||paused||modalOpen||assisted)return;const steps=Math.max(1,Math.ceil(dt/8));for(let k=0;k<steps;k++){const f=(dt/16)/steps;for(const b of [cue,...balls]){if(!b.active)continue;b.x+=b.vx*f;b.y+=b.vy*f;const damping=Math.pow(physics.drag,f);b.vx*=damping;b.vy*=damping;if(Math.hypot(b.vx,b.vy)<.10){b.vx=0;b.vy=0;}const r=b.r;if(b.x<world.x0+r){b.x=world.x0+r;b.vx=Math.abs(b.vx)*physics.wall}if(b.x>world.x1-r){b.x=world.x1-r;b.vx=-Math.abs(b.vx)*physics.wall}if(b.y<world.y0+r){b.y=world.y0+r;b.vy=Math.abs(b.vy)*physics.wall}if(b.y>world.y1-r){b.y=world.y1-r;b.vy=-Math.abs(b.vy)*physics.wall}}
 const active=[cue,...balls].filter(b=>b.active);for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;if(d>=a.r+b.r)continue;const nx=dx/d,ny=dy/d,push=(a.r+b.r-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){const impulse=-(1+physics.impact)*rv/2;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}}}
 for(const b of [...balls,cue]){if(!b.active)continue;const p=pockets.find(p=>distance(p,b)<29);if(p){if(b.white){cue.active=false;setTimeout(()=>{cue.x=274;cue.y=246;cue.vx=0;cue.vy=0;cue.active=true;setStatus('SCRATCH!','Cue ball returned to the table. Take another shot.');},800)}else pocketBall(b);break}}
 if(!anyMoving()) {moving=false;if(!modalOpen)setStatus('YOUR SHOT.','Pull back from the white cue ball to shoot.');}}
function pocketBall(b){if(!b.active)return;b.active=false;b.vx=0;b.vy=0;moving=false;for(const other of [cue,...balls]){other.vx=0;other.vy=0;}selectedChapter=b;refreshSelect();$('pocketTitle').textContent=b.name;$('pocketDesc').textContent=b.desc;$('pocketSwatch').style.background=b.color;modalOpen=true;$('poolDialog').classList.remove('hidden');setStatus('BALL POCKETED!','You unlocked '+b.name+'.');}
function shoot(dx,dy,power){if(moving||assisted||paused||modalOpen||!cue.active)return;const mag=Math.hypot(dx,dy);if(mag<3)return;cue.vx=dx/mag*power;cue.vy=dy/mag*power;moving=true;setStatus('BALLS IN MOTION','Watch the shot…');}
canvas.addEventListener('pointerdown',e=>{if(moving||assisted||paused||modalOpen)return;const p=localPoint(e);if(distance(p,cue)<90){dragging=true;aim=p;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(dragging){aim=localPoint(e);}});
function release(){if(!dragging)return;dragging=false;const dx=cue.x-aim.x,dy=cue.y-aim.y,p=Math.hypot(dx,dy);aim=null;if(p>12)shoot(dx,dy,Math.min(29,Math.max(5,p*.15)));}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{dragging=false;aim=null;});
// Accessible, always-successful alternative: a guided shot pockets the chosen ball.
$('assistShot').addEventListener('click',()=>{if(moving||assisted||modalOpen)return;const b=selectedBall();if(!b)return;let pocket=pockets.reduce((best,p)=>distance(b,p)<distance(b,best)?p:best,pockets[0]);const vx=b.x-cue.x,vy=b.y-cue.y,mag=Math.hypot(vx,vy)||1;cue.vx=vx/mag*8;cue.vy=vy/mag*8;moving=false;assisted={ball:b,pocket,sx:b.x,sy:b.y,t:0,duration:850};setStatus('LINING UP '+b.name.toUpperCase(),'A little help with the angles.');});
$('resetGame').addEventListener('click',setup);
$('keepPlaying').addEventListener('click',()=>{modalOpen=false;$('poolDialog').classList.add('hidden');setStatus('NICE SHOT.','Pick your next chapter.');});
$('openChapter').addEventListener('click',()=>{if(!selectedChapter)return;const b=selectedChapter;modalOpen=false;$('poolDialog').classList.add('hidden');if(b.url){location.href=b.url;}else{document.getElementById(b.section)?.scrollIntoView({behavior:'smooth'});}});
function scrollToAbout(){paused=true;dragging=false;aim=null;$('pauseBtn').textContent='↗ Back to the table';document.getElementById('about').scrollIntoView({behavior:'smooth'});}
$('pauseBtn').addEventListener('click',()=>{if(paused){paused=false;$('pauseBtn').textContent='Pause & Explore ↓';document.getElementById('race').scrollIntoView({behavior:'smooth'});}else{scrollToAbout();}});
for(const id of ['driveAgain','footerRace'])$(id)?.addEventListener('click',()=>{paused=false;$('pauseBtn').textContent='Pause & Explore ↓';document.getElementById('race').scrollIntoView({behavior:'smooth'});});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen){$('keepPlaying').click();}if(e.key.toLowerCase()==='p'&&!e.repeat&&document.activeElement.tagName!=='SELECT')$('pauseBtn').click();});
function frame(time){const dt=lastTime?Math.min(40,time-lastTime):16;lastTime=time;if(assisted&&!paused)assisted.t+=dt;integrate(dt);draw();requestAnimationFrame(frame)}
window.addEventListener('resize',resize);setup();resize();requestAnimationFrame(frame);
})();
