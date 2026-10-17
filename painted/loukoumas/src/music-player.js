/* Optional local music. Missing files retain the original synthesised soundtrack. */
globalThis.AdventureMusic={create({tracks,base,fade=2}){
 const entries=new Map(),positions={},listeners=[];let wanted=null,enabled=true,duck=false,unlocked=false,last=performance.now();
 function ensure(id){let e=entries.get(id);if(e)return e;const track=tracks.find(t=>t.id===id);if(!track)return null;const audio=new Audio();audio.loop=true;audio.preload='auto';audio.volume=0;e={id,audio,status:'loading',volume:0,pending:false,retry:0};entries.set(id,e);audio.addEventListener('canplay',()=>{e.status='ready';});audio.addEventListener('error',()=>{e.status='missing';e.pending=false;e.retry=performance.now()+30000;});audio.addEventListener('pause',()=>{e.pending=false;});audio.src=new URL(track.file,base).href;audio.load();return e;}
 function retryMissing(){for(const e of entries.values())if(e.status==='missing'){e.status='loading';e.audio.src=new URL(tracks.find(t=>t.id===e.id).file,base).href+'?v='+Date.now();e.audio.load();}}
 function unlock(){unlocked=true;}
 for(const name of ['pointerdown','keydown']){const fn=()=>unlock();window.addEventListener(name,fn,true);listeners.push([name,fn]);}window.addEventListener('focus',retryMissing);
 function update(id,on,talking=false,immediate=false){wanted=id;enabled=on;duck=talking;const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;const selected=on&&id?ensure(id):null;
  if(selected?.status==='missing'&&now>=selected.retry)retryMissing();
  if(selected?.status==='ready'&&unlocked&&selected.audio.paused&&!selected.pending){selected.pending=true;selected.audio.play().then(()=>{selected.pending=false;}).catch(err=>{selected.pending=false;if(err.name==='NotAllowedError')unlocked=false;else if(err.name!=='AbortError'){selected.status='missing';selected.retry=now+30000;}});}
  for(const e of entries.values()){const active=enabled&&e===selected&&e.status==='ready'&&!e.audio.paused,target=active?(duck?.24:.46):0;e.volume=immediate||!enabled?target:e.volume+Math.max(-dt/fade*.46,Math.min(dt/fade*.46,target-e.volume));e.audio.volume=Math.max(0,Math.min(1,e.volume));if(target===0&&e.volume<.001){e.volume=0;e.audio.volume=0;e.audio.pause();}positions[e.id]=e.audio.currentTime;}
 }
 return {update,unlock,retry:retryMissing,get externalActive(){return [...entries.values()].some(e=>!e.audio.paused&&e.status==='ready');},get state(){return {wanted,enabled,duck,unlocked,tracks:[...entries.values()].map(e=>({id:e.id,status:e.status,paused:e.audio.paused,time:e.audio.currentTime,volume:e.audio.volume,loop:e.audio.loop,src:e.audio.src}))};},destroy(){for(const e of entries.values())e.audio.pause();for(const[n,fn]of listeners)window.removeEventListener(n,fn,true);window.removeEventListener('focus',retryMissing);}};
}};
