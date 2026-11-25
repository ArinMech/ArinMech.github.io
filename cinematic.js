(()=>{
'use strict';
const stage=document.getElementById('montageStage'); if(!stage)return;
const scenes=[...stage.querySelectorAll('.montage-scene')];
const indicators=[...document.querySelectorAll('.montage-indicator')];
const back=document.getElementById('montageBack'),next=document.getElementById('montageNext'),pause=document.getElementById('montagePause');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current=0, paused=reduce, elapsed=0, last=0, raf=0, visible=true;
const durations=scenes.map(s=>Number(s.dataset.duration)||5000);
function show(index){
 scenes[current].querySelector('video')?.pause();
 current=(index+scenes.length)%scenes.length;elapsed=0;
 scenes.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current));});
 indicators.forEach((bar,i)=>{bar.classList.toggle('done',i<current);bar.classList.toggle('current',i===current);const fill=bar.firstElementChild;fill.style.width=i<current?'100%':'0%';});
 const media=scenes[current].querySelector('video');
 if(media){media.currentTime=0;media.muted=true;if(!paused&&visible)media.play().catch(()=>{});}
}
function tick(time){
 const dt=last?Math.min(80,time-last):0;last=time;
 if(!paused&&visible){
  elapsed+=dt;
  const ms=durations[current];
  indicators[current].firstElementChild.style.width=Math.min(100,elapsed/ms*100)+'%';
  if(elapsed>=ms)show(current+1);
 }
 raf=requestAnimationFrame(tick);
}
back.addEventListener('click',()=>show(current-1));
next.addEventListener('click',()=>show(current+1));
pause.addEventListener('click',()=>{
 paused=!paused;pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Play montage':'Pause montage');
 const media=scenes[current].querySelector('video');if(media){if(paused)media.pause();else if(visible)media.play().catch(()=>{});}
});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;const v=scenes[current].querySelector('video');if(v){if(visible&&!paused)v.play().catch(()=>{});else v.pause();}},{threshold:.08});
observer.observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)scenes[current].querySelector('video')?.pause();else if(!paused&&visible)scenes[current].querySelector('video')?.play().catch(()=>{});});
scenes.forEach((s,i)=>{const v=s.querySelector('video');if(v){v.addEventListener('error',()=>{if(i===current)show(current+1);});v.querySelector('source')?.addEventListener('error',()=>{if(i===current)show(current+1);});}});
if(reduce){pause.textContent='▶';pause.setAttribute('aria-label','Play montage');}
show(0);raf=requestAnimationFrame(tick);
})();