(()=>{
const video=document.getElementById('cinemaVideo');
if(!video)return;
const caption=document.getElementById('cinemaCaption'),counter=document.getElementById('cinemaCounter'),progress=document.getElementById('cinemaProgress'),replay=document.getElementById('cinemaReplay');
const scenes=[{end:4.5,text:'Mechanical testing'},{end:9,text:'Validation on the test rig'},{end:13.5,text:'In the machine shop'},{end:18,text:'Formula SAE / on the move'}];
function update(){const t=video.currentTime||0;const i=Math.max(0,scenes.findIndex(s=>t<s.end));caption.textContent=scenes[i].text;counter.textContent=String(i+1).padStart(2,'0')+' / 04';progress.style.width=((t/(video.duration||18))*100)+'%'}
video.addEventListener('timeupdate',update);video.addEventListener('loadedmetadata',update);
replay.addEventListener('click',()=>{video.currentTime=0;video.play().catch(()=>{});});
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
if(mq.matches)video.pause();
const io=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&!mq.matches)video.play().catch(()=>{});else video.pause()}},{threshold:.1});io.observe(video);
})();