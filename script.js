/* Arin's racing portfolio — no packages, assets or backend needed. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('track'); if (!canvas) return;
const ctx = canvas.getContext('2d');
const race = $('race'), intro = $('raceIntro'), hud = $('raceHud'), modal = $('discovery');
const chapters = [
 {title:'ABOUT ME', label:'About Me', section:'about', desc:'The person behind the engineering.'},
 {title:'EXPERIENCE', label:'Experience', section:'experience', desc:'The teams, challenges, and work that shaped me.'},
 {title:'FSAE CHASSIS', label:'FSAE Chassis', section:'projects', url:'project-fsae.html', desc:'A carbon-fiber chassis, an obsession with making it lighter, and the testing to prove it.'},
 {title:'ME 370', label:'ME 370', section:'projects', url:'project-me370.html', desc:'A closer look at a mechanical design project.'},
 {title:'ME 371', label:'ME 371', section:'projects', url:'project-me371.html', desc:'Engineering design, analysis, and iteration.'},
 {title:'CONTACT', label:'Contact', section:'contact', desc:'The next chapter starts with a conversation.'}
];
const colors = ['#ff7444','#42bdb7','#f9c95b','#8a9ef9','#f08eb4','#48a9e6'];
const state = {started:false,paused:false,modal:false,t:0,run:0,speed:170,lane:0,targetLane:0,keys:{},index:0,passing:false,last:0};
let w=0,h=0,dpr=1;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
function resize(){const rect=canvas.getBoundingClientRect(); w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
window.addEventListener('resize',resize);resize();
function polygon(points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function line(points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
function rect(x,y,ww,hh,color){ctx.fillStyle=color;ctx.fillRect(x,y,ww,hh)}
function text(value,x,y,size,color='#fff',weight='700',align='center'){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${weight} ${size}px 'DM Sans', Arial, sans-serif`;ctx.fillText(value,x,y)}
function perspective(depth){let z=1-depth;return Math.pow(z,2.4)}
function roadAt(yNorm){const k=perspective(yNorm);const curve=Math.sin(state.run*.00055+(1-yNorm)*2.4)*w*.038*(1-yNorm);return {x:w*.5+curve+state.lane*w*.19*k, width:mix(w*.055,w*.79,k), y:h*(.445+.60*k),k};}
function render(){
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#8ed4ed');sky.addColorStop(.45,'#d6f3ee');sky.addColorStop(.55,'#fff0d0');sky.addColorStop(1,'#e6d6bd');rect(0,0,w,h,sky);
  // clouds
  for(let j=0;j<9;j++){const x=((j*241-state.run*.012)%(w+370)+w+370)%(w+370)-160;const y=h*(.11+.055*Math.sin(j*3));ctx.fillStyle='rgba(255,255,255,.62)';ctx.beginPath();ctx.ellipse(x,y,88+j%3*22,17,0,0,Math.PI*2);ctx.fill();}
  // distant grandstand and trees
  const hy=h*.455;polygon([[0,hy-48],[w*.33,hy-25],[w*.43,hy],[0,hy+7]],'#9cadad');polygon([[w*.64,hy],[w,hy-53],[w,hy+8]],'#9cab9f');
  for(let j=0;j<55;j++){const x=j*w/54;const y=hy+Math.sin(x/w*7)*4;const size=5+j%4*2;ctx.fillStyle=j%2?'#699f76':'#82b68a';ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill()}
  // sweeping grass and asphalt road
  polygon([[0,hy],[w,hy],[w,h],[0,h]],'#7ab98c');
  const samples=[];for(let i=0;i<=52;i++)samples.push(roadAt(i/52));
  const left=samples.map(p=>[p.x-p.width*.52,p.y]);const right=samples.map(p=>[p.x+p.width*.52,p.y]);
  polygon([...left,...right.reverse()],'#626f79');
  const leftC=samples.map(p=>[p.x-p.width*.52,p.y]); const rightC=samples.map(p=>[p.x+p.width*.52,p.y]);
  for(let i=1;i<samples.length;i++){
    const p=samples[i-1],q=samples[i];if(i%2===0){polygon([[p.x-p.width*.52,p.y],[q.x-q.width*.52,q.y],[q.x-q.width*.48,q.y],[p.x-p.width*.48,p.y]],'#f9efe5');polygon([[p.x+p.width*.48,p.y],[q.x+q.width*.48,q.y],[q.x+q.width*.52,q.y],[p.x+p.width*.52,p.y]],'#f9efe5')}
  }
  line(leftC,'#ff8766',Math.max(3,w*.007));line(rightC,'#ff8766',Math.max(3,w*.007));
  // lane stripes move with road
  for(let lane of [-1/6,1/6])for(let d=0;d<1;d+=.085){let at=((d+(state.run*.00025)% .17)%.94),p=roadAt(at),q=roadAt(Math.min(.995,at+.033));polygon([[p.x+p.width*lane-p.width*.004,p.y],[p.x+p.width*lane+p.width*.004,p.y],[q.x+q.width*lane+q.width*.004,q.y],[q.x+q.width*lane-q.width*.004,q.y]],'rgba(255,255,255,.68)')}
  // trackside markers
  for(let j=0;j<11;j++){let depth=((j/11 + state.run*.00012)%1),p=roadAt(depth);let rw=p.width*.63;const y=p.y, hh=3+65*p.k;rect(p.x-rw,y-hh,3+7*p.k,hh,'#f9f6df');rect(p.x+rw,y-hh,3+7*p.k,hh,'#f9f6df');}
  drawBots();drawCockpit();
  // bright readable vignette
  const vign=ctx.createLinearGradient(0,0,0,h);vign.addColorStop(0,'rgba(17,40,54,.13)');vign.addColorStop(.5,'rgba(20,40,50,0)');vign.addColorStop(1,'rgba(8,22,35,.45)');rect(0,0,w,h,vign);
}
function drawBots(){
  if(!state.started && state.t<1) {drawCar(w*.54,h*.61,1.0,colors[0],'ABOUT ME');drawCar(w*.76,h*.52,.55,colors[1],'EXPERIENCE');return}
  const n=chapters.length;
  for(let ahead=3;ahead>=0;ahead--){const ix=(state.index+ahead)%n;let progress=clamp(state.run/1700,0,1);let depth=ahead===0?(.17+progress*.74):(.06+Math.max(0,progress-.24)*.23)/(ahead*.9+1);depth=clamp(depth,.04,.99);
   let p=roadAt(1-depth);const lateral=[-.12,.14,-.18,.08][ix%4];let x=p.x+lateral*p.width;let scale=.15+depth*1.8;drawCar(x,p.y-5,scale,colors[ix],chapters[ix].title);
  }
}
function drawCar(x,y,s,color,label){
 const cw=Math.min(w*.22,190)*s, ch=cw*.54;if(cw<5)return;
 ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(5,19,25,.25)';ctx.shadowBlur=14*s;ctx.shadowOffsetY=8*s;
 polygon([[-cw*.54,0],[-cw*.47,-ch*.45],[-cw*.28,-ch*.55],[cw*.28,-ch*.55],[cw*.47,-ch*.45],[cw*.54,0]],color);
 ctx.shadowBlur=0;polygon([[-cw*.34,-ch*.55],[-cw*.23,-ch*.86],[cw*.23,-ch*.86],[cw*.34,-ch*.55]],'#263c4b');polygon([[-cw*.4,-ch*.52],[cw*.4,-ch*.52],[cw*.46,-ch*.40],[-cw*.46,-ch*.40]],'#f9e9d6');rect(-cw*.51,-ch*.33,cw*.2,ch*.19,'#242d33');rect(cw*.31,-ch*.33,cw*.2,ch*.19,'#242d33');rect(-cw*.45,-ch*.38,cw*.13,ch*.08,'#fcd99a');rect(cw*.32,-ch*.38,cw*.13,ch*.08,'#fcd99a');polygon([[-cw*.61,-ch*.18],[cw*.61,-ch*.18],[cw*.53,-ch*.03],[-cw*.53,-ch*.03]],'#1e303a');
 if(s>.2){const font=clamp(cw*.092,10,17);ctx.textAlign='center';ctx.font=`800 ${font}px 'DM Sans',sans-serif`;const tw=ctx.measureText(label).width+22;const tagY=-ch-31*s;ctx.fillStyle='#ffffff';ctx.fillRect(-tw/2,tagY-font,tw,font+13);ctx.fillStyle='#1b3035';ctx.fillText(label,0,tagY+2);}
 ctx.restore();
}
function drawCockpit(){
 const wheelY=h*1.015,ww=Math.min(w*.59,720);ctx.save();ctx.translate(w*.5,wheelY);
 ctx.fillStyle='#202e39';ctx.beginPath();ctx.ellipse(0,0,ww*.61,h*.19,0,Math.PI,Math.PI*2);ctx.fill();
 polygon([[-ww*.50,0],[-ww*.29,-h*.19],[-ww*.24,-h*.19],[-ww*.17,0]],'#2d4149');polygon([[ww*.17,0],[ww*.24,-h*.19],[ww*.29,-h*.19],[ww*.50,0]],'#2d4149');
 ctx.strokeStyle='#121e27';ctx.lineWidth=Math.max(16,w*.024);ctx.beginPath();ctx.ellipse(0,-h*.007,ww*.29,h*.115,0,Math.PI,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#152831';ctx.beginPath();ctx.roundRect(-ww*.22,-h*.052,ww*.44,h*.13,24);ctx.fill();
 rect(-ww*.09,-h*.035,ww*.18,h*.041,'#394c53');text(String(Math.round(state.speed)),0,-h*.005,Math.max(16,Math.min(32,w*.03)),'#c9fcb0');text('ARIN / 27',0,h*.041,Math.max(10,Math.min(16,w*.017)),'#fff');ctx.restore();
}
function setTarget(){let chapter=chapters[state.index%chapters.length];$('targetName').textContent=chapter.title;$('targetCounter').textContent=`${String(state.index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;}
function toast(t){$('raceMessage').textContent=t;$('raceMessage').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('raceMessage').classList.remove('show'),2300)}
function start(){if(!state.started){state.started=true;state.run=0;state.index=0;setTarget()}state.paused=false;state.modal=false;intro.classList.add('hidden');hud.classList.remove('hidden');modal.classList.add('hidden');$('mobileControls').classList.toggle('hidden',!matchMedia('(pointer:coarse)').matches);$('pauseBtn').textContent='Ⅱ  Pause & Explore';race.scrollIntoView({behavior:'smooth'});}
function openPortfolio(target='about'){state.paused=true;state.modal=false;modal.classList.add('hidden');race.classList.add('is-paused');$('pauseBtn').textContent='↗ Resume race';$('mobileControls').classList.add('hidden');document.getElementById(target).scrollIntoView({behavior:'smooth'});}
function backToRace(){race.scrollIntoView({behavior:'smooth'});state.paused=false;race.classList.remove('is-paused');$('pauseBtn').textContent='Ⅱ  Pause & Explore';if(state.started)$('mobileControls').classList.toggle('hidden',!matchMedia('(pointer:coarse)').matches);}
function triggerPass(){state.modal=true;state.paused=true;const ch=chapters[state.index];$('discoveryTitle').textContent=ch.label;$('discoveryDescription').textContent=ch.desc;$('discoveryNumber').textContent=`${String(state.index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;modal.classList.remove('hidden');}
function continueRace(){modal.classList.add('hidden');state.modal=false;state.paused=false;state.run=0;state.index=(state.index+1)%chapters.length;setTarget();toast('Next chapter ahead. Keep driving!')}
$('startBtn').addEventListener('click',start);$('skipBtn').addEventListener('click',()=>openPortfolio());$('bottomSkip').addEventListener('click',()=>openPortfolio());$('pauseBtn').addEventListener('click',()=>{if(state.paused&&!state.modal)backToRace();else openPortfolio()});$('seeSection').addEventListener('click',()=>{const ch=chapters[state.index]; if(ch.url)window.location.href=ch.url;else openPortfolio(ch.section)});$('keepDriving').addEventListener('click',continueRace);
$('driveAgain').addEventListener('click',backToRace);$('footerRace').addEventListener('click',backToRace);
// Brand jumps to about, and regular scrolling always remains available.
$('race-brand').addEventListener('click',()=>{state.paused=true});
const drivingKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s',' ']);
window.addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P'){if(state.paused&&!state.modal)backToRace();else openPortfolio();return}if(drivingKeys.has(e.key)&&window.scrollY<race.offsetHeight*.75 && state.started&&!state.paused){e.preventDefault();state.keys[e.key]=true}});
window.addEventListener('keyup',e=>{state.keys[e.key]=false});window.addEventListener('blur',()=>state.keys={});
for(const [id,key] of [['steerLeft','ArrowLeft'],['steerRight','ArrowRight'],['accelerate','ArrowUp']]){const el=$(id);for(const ev of ['pointerdown','pointerup','pointercancel','pointerleave'])el.addEventListener(ev,e=>{e.preventDefault();state.keys[key]=ev==='pointerdown'})}
let last=performance.now();function frame(now){let dt=Math.min(.05,(now-last)/1000);last=now;state.t+=dt;
 if(state.started&&!state.paused&&window.scrollY<race.offsetHeight){const steer=(state.keys.ArrowRight||state.keys.d?1:0)-(state.keys.ArrowLeft||state.keys.a?1:0);state.targetLane=clamp(state.targetLane+steer*dt*1.24,-.95,.95);state.lane=mix(state.lane,state.targetLane,Math.min(1,dt*5));state.speed=mix(state.speed,state.keys.ArrowUp||state.keys.w?270:state.keys.ArrowDown||state.keys.s?100:178,Math.min(1,dt*1.4));state.run+=dt*state.speed*1.85; if(state.run>1700){const carLane=[-.12,.14,-.18,.08][state.index%4]; if(Math.abs(state.targetLane-carLane)>.27){triggerPass()}else{state.run=930;state.speed=105;toast('Too close! Steer around the car to overtake.')}} }
 $('speedValue').textContent=Math.round(state.speed);render();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
})();
