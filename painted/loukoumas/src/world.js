/* Shared production painter. Review Studio never loads narrative or save callbacks. */
(function(root){
const images={},ready={};let catalog;
function loadAsset(id){if(ready[id])return ready[id];return ready[id]=new Promise((resolve,reject)=>{const im=new Image;im.onload=()=>{images[id]=im;resolve(im)};im.onerror=()=>reject(Error('Unable to decode '+id));im.src=catalog.assets[id].url;});}
async function init(data){catalog=data;return api;}
async function loadScene(id){const s=catalog.scenes[id];await Promise.all([...new Set([s.background,...(id==='lobby'?['ceiling-fan','key']:[]),...((AMBIENT[id]||[]).flatMap(a=>[a.asset,...(catalog.assets[a.asset+'-reaction']?[a.asset+'-reaction']:[])])),...(['port','square','beach'].includes(id)?['gull']:[]),...(id==='square'?['square-far','square-hills']:[]),...(['port','beach'].includes(id)?[id+'-far']:[]),...s.actors.map(a=>a.asset),'hero','hairE','hairS','hairN'])].map(loadAsset));sceneryLayer(s);if(['port','beach'].includes(id))softLayer(id+'-sky',images[id+'-far'],(id==='port'?60:53)-24,(id==='port'?60:53)-7);else if(['square','disco'].includes(id))softLayer(id+'-sky',images[s.background],(id==='square'?24:90)-12,id==='square'?24:90);}
function poly(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
function scale(s,y){return Math.max(s.sFar*.92,Math.min(1.04,s.sFar+(1-s.sFar)*(y-s.far)/(176-s.far)));}
function shadow(g,x,y,w,alpha=.23){g.save();g.fillStyle=`rgba(45,31,39,${alpha})`;g.beginPath();g.ellipse(x,y,w,w*.20,0,0,Math.PI*2);g.fill();g.restore();}
function frame(id,clip,index){const a=catalog.assets[id];const c=a.clips?.[clip]||a.clips?.idle;return c?.frames[((index%c.frames.length)+c.frames.length)%c.frames.length];}
function sprite(g,id,clip,index,x,y,height,mirror=false,breath=0){const im=images[id],f=frame(id,clip,index);if(!im||!f)return;const spec=catalog.assets[id].clips[clip]||catalog.assets[id].clips.idle;g.save();g.translate(x,y);g.scale(1,1+breath);AdventureReview.drawClip(g,{images:new Map([[id,im]])},{...spec,asset:id,referenceHeight:f.referenceHeight,noShadow:true},0,{x:0,y:0,height,frame:index,flip:mirror});g.restore();}
function hero(g,s,h,t,F){if(!h)return;const moving=h.moving||h.dance;const view=h.heading||({front:'S',back:'N',side:h.face<0?'W':'E'}[h.dir])||'S';const mirror=['W','NW','SW'].includes(view);const v=({W:'E',NW:'NE',SW:'SE'})[view]||view;const c=h.dance?'dance':moving?v:'idle'+v;const a=catalog.assets.hero.clips[c]||catalog.assets.hero.clips[v];const i=h.dance?Math.floor(t*3)%a.frames.length:moving?Math.floor((h.travel||0)/3.6)%a.frames.length:0;const k=scale(s,h.y),height=70*(s.bodyScale||1)*k;shadow(g,h.x,h.y,8*k);sprite(g,'hero',c,i,h.x,h.y,height,mirror,moving?0:.0025*Math.sin(t*1.35));if(F.hair){const f=frame('hero',c,i),hair=images[v==='N'||v==='NE'?'hairN':v==='E'?'hairE':'hairS'];if(f?.head&&hair){const sk=height/f.referenceHeight,hh=height*.23,ww=hh*hair.width/hair.height;g.save();g.translate(h.x,h.y);g.scale(mirror?-1:1,1);g.drawImage(hair,(f.head[0]-f.anchor[0])*sk-ww/2,(f.head[1]-f.anchor[1])*sk-1.3*k,ww,hh);g.restore();}}if(F.chain){g.save();g.strokeStyle='#e6bf57';g.lineWidth=.45*k;g.beginPath();g.arc(h.x,h.y-height*.64,3*k,0,Math.PI);g.stroke();g.restore();}}
const reactions=new Map();
function actorState(s,a,t,h,speaking){const seed=[...a.asset].reduce((n,c)=>n+c.charCodeAt(0),0),key=s.id+':'+a.asset,previous=reactions.get(key),near=!!h&&Math.abs(h.x-a.x)<38&&Math.abs(h.y-a.y)<37;
 let r=previous;if(!r||t<r.time||t-r.time>1.5)r={time:t,near:false,start:-99,cooldown:-99};
 if(near&&!r.near&&t>r.cooldown){r.start=t;r.cooldown=t+6;}r.time=t;r.near=near;reactions.set(key,r);
 const elapsed=t-r.start,cycle=(t+seed*.173)%8.8;
 if(a.asset==='zozoSleep')return {pose:cycle>7.6?1:0,mode:'sleep',near};
 if(speaking===a.speaker)return {pose:Math.floor(t*2.4)%3===0?0:1,mode:'speaking',near};
 if(elapsed>=0&&elapsed<2.2)return {pose:elapsed<.85?1:elapsed<1.65?2:0,mode:'greeting',near};
 return {pose:cycle<2.8?0:cycle<4.9?3:cycle<5.1?2:cycle<6.5?0:cycle<7.7?3:2,mode:'activity',near};
}
function actor(g,s,a,t,F,speaking,options={}){if(a.when&&a.when.some(([key,val])=>!!F[key]!==val))return;const k=scale(s,a.y)*(a.scale||1),clip=(a.stateKey&&F[a.stateKey])?a.activeClip||'idle':a.clip||'idle';const def=catalog.assets[a.asset].clips[clip]||catalog.assets[a.asset].clips.idle;
 const state=actorState(s,a,t,options.hero,speaking);let idx=state.pose;
 if(s.id==='disco'&&(a.asset==='danaeDisco'||a.dance)&&state.mode!=='greeting')idx=F.jam&&!F.fixed?0:[0,1,2,1,2,3,2,1][Math.floor(t*2.4+(a.phase||0))%8];
 idx=options.frame??idx;shadow(g,a.x,a.y,(a.shadow||7)*k,.2);sprite(g,a.asset,clip,idx%def.frames.length,a.x,a.y,(a.height||55)*k,!!a.mirror,.0025*Math.sin(t*1.3+(a.phase||0)));
}
const ambientClock=new Map(),ambientLines=new Map();
const BARKS={
 'ambient-walker':[
 ['Ωπ, συγγνώμη! Πέρνα πρώτος.','Oh, sorry! You go first.'],
 ['Σιγά σιγά, διακοπές κάνουμε!','Easy now, we’re on holiday!'],
 ['Παραλίγο! Δεν σε είδα, φίλε.','That was close! Didn’t see you, mate.'],
 ['Πέρνα, φίλε. Δεν φεύγει το νησί.','Go ahead, mate. The island isn’t going anywhere.'],
 ['Μισό βήμα κι έπεφτα πάνω σου.','One more step and I’d have bumped into you.']
 ],
 'ambient-market':[
 ['Ωπ! Να μη σου έρθει το καλάθι!','Oops! Mind my basket!'],
 ['Πέρνα, παλικάρι μου. Έχω φορτωθεί.','Go on, dear. My hands are full.'],
 ['Συγγνώμη! Κοίταζα τη βιτρίνα.','Sorry! I was looking at the window.'],
 ['Στάσου να περάσεις, να μη στριμωχτούμε.','Let me stop so you can get through.'],
 ['Ευτυχώς που δεν πήρα και καρπούζι!','Good thing I didn’t buy a watermelon too!']
 ],
 'ambient-visitor':[
 ['Συγγνώμη! Χάζευα το τοπίο.','Sorry! I was admiring the view.'],
 ['Πέρνα. Το σακίδιο πιάνει χώρο.','Go ahead. This backpack takes up space.'],
 ['Ωπ, φρένο! Όλα καλά;','Whoa, brakes on! All right?'],
 ['Δεν βιάζομαι. Πέρνα εσύ.','I’m in no hurry. You go first.'],
 ['Πρώτη μέρα εδώ και χάθηκα ήδη!','First day here and I’m lost already!']
 ],
 'ambient-scooter':[
 ['Ωπ! Σε είδα. Πέρνα με την ησυχία σου.','Whoa! I see you. Take your time crossing.'],
 ['Πρώτα ο πεζός! Πέρασε.','Pedestrians first! Go ahead.'],
 ['Συγγνώμη, φίλε. Σταματάω εδώ.','Sorry, mate. I’ll stop here.'],
 ['Πέρνα, έχω πιάσει τα φρένα.','Go ahead. I’ve got the brakes on.']
 ]
};
function nextBark(asset){const lines=BARKS[asset],index=ambientLines.get(asset)||0;ambientLines.set(asset,index+1);return {index:index%lines.length,lines:lines[index%lines.length]};}
// One-way visits, separated by quiet gaps. Each identity returns at most once / 4.5 min.
const AMBIENT={
 port:[{id:'quay-local',asset:'ambient-walker',y:165,height:68,speed:18,at:0},{id:'quay-market',asset:'ambient-market',y:168,height:65,speed:17,at:55,mirror:true},{id:'quay-visitor',asset:'ambient-visitor',y:166,height:69,speed:19,at:113},{id:'quay-scooter',asset:'ambient-scooter',y:174,height:60,speed:47,at:177,mirror:true}],
 square:[{id:'village-market',asset:'ambient-market',y:169,height:65,speed:17,at:0},{id:'village-visitor',asset:'ambient-visitor',y:171,height:69,speed:19,at:57,mirror:true},{id:'village-local',asset:'ambient-walker',y:169,height:68,speed:17,at:116},{id:'village-scooter',asset:'ambient-scooter',y:175,height:60,speed:44,at:183,mirror:true}],
 beach:[{id:'shore-visitor',asset:'ambient-visitor',y:174,height:68,speed:18,at:0},{id:'shore-market',asset:'ambient-market',y:174,height:64,speed:16,at:65,mirror:true},{id:'shore-stroller',asset:'ambient-walker',y:174,height:65,speed:15,at:139}]
};
function resetAmbient(scene,t,h,force=false){if(ambientClock.has(scene)&&!force)return;const s=catalog.scenes[scene];if(!s)return;ambientClock.set(scene,{time:t,elapsed:0,firstX:Math.max(10,Math.min(s.w-10,(h?.x||90)+100)),holds:{},contacts:{},lastSpeech:-999});}
function ambientActors(s,t,h,options={}){if(options.ambientOff)return [];if(!ambientClock.has(s.id))resetAmbient(s.id,t,h);let state=ambientClock.get(s.id);if(t<state.time){state={time:t,elapsed:t,firstX:null,holds:{},contacts:{},lastSpeech:-999};ambientClock.set(s.id,state);}const dt=Math.max(0,t-state.time),rate=options.calm?.72:1;state.elapsed+=dt*rate;state.time=t;
 const result=[];for(const route of AMBIENT[s.id]||[]){if(!images[route.asset])continue;const period=270,episode=Math.floor((state.elapsed-route.at)/period);if(episode<0)continue;const elapsed=state.elapsed-route.at-episode*period,key=route.id+':'+episode,hold=state.holds[key]||0,initial=route.at===0&&episode===0&&state.firstX!==null?state.firstX+65:0,travel=initial+(elapsed-hold)*route.speed,span=s.w+130;if(travel>span)continue;
 const x=route.mirror?s.w+65-travel:travel-65,contact=state.contacts[key]||(state.contacts[key]={near:false,spoken:false,stopAt:-999,releasedAt:-999,lastBark:-999}),dist=h?Math.abs(h.x-x):999,ahead=h&&(route.mirror?h.x<x:h.x>x),clearance=route.asset==='ambient-scooter'?53:35,near=!!h&&Math.abs(h.y-route.y)<(contact.near?17:13)&&dist<(contact.near?clearance+10:clearance),blocked=near&&(ahead||dist<27||contact.near);
 if(blocked&&!contact.near){contact.stopAt=t;contact.lookMirror=h.x<x;contact.spoken=false;}if(!blocked&&contact.near)contact.releasedAt=t;
 if(blocked&&!contact.spoken&&!options.speechBusy&&t-contact.lastBark>24&&t-state.lastSpeech>9){contact.bark={...nextBark(route.asset),start:t};contact.lastBark=t;contact.spoken=true;state.lastSpeech=t;}
 contact.near=blocked;let lost=0;if(dt<1.5){if(blocked)lost=dt*rate;else if(t-contact.releasedAt<.28){const acceleration=.25+.75*Math.min(1,(t-contact.releasedAt)/.28);lost=dt*rate*(1-acceleration);}state.holds[key]=hold+lost;}
 const heldTravel=travel-lost*route.speed,heldX=route.mirror?s.w+65-heldTravel:heldTravel-65,bark=contact.bark&&t-contact.bark.start<4.2?contact.bark:null,elapsedStop=t-contact.stopAt;
 result.push({...route,x:heldX,moving:!blocked,travel:heldTravel,episode,mode:blocked?'yield':'travel',lookMirror:blocked?contact.lookMirror:!!route.mirror,gesture:blocked?(elapsedStop<.25?0:elapsedStop<1.65?1:2):0,bark:options.speechBusy?null:bark});
 }return result;}
function drawAmbient(g,s,a,t){const k=scale(s,a.y)*(s.bodyScale||1),height=a.height*k;shadow(g,a.x,a.y,(a.asset==='ambient-scooter'?17:6)*k,.20);if(catalog.assets[a.asset].clips?.walk){const reaction=a.asset+'-reaction';if(!a.moving&&images[reaction])sprite(g,reaction,'idle',a.gesture,a.x,a.y,height,a.lookMirror,.0015*Math.sin(t*1.2));else sprite(g,a.asset,a.moving?'walk':'idle',a.moving?Math.floor(a.travel/3.1)%8:0,a.x,a.y,height,a.mirror);} else{const im=images[a.asset],w=height*im.width/im.height;g.save();g.translate(a.x,a.y);g.scale(a.mirror?-1:1,1);g.drawImage(im,-w/2,-height+(a.moving?Math.sin(t*13)*.08:0),w,height);
 if(a.moving){g.strokeStyle='rgba(232,217,176,.32)';g.lineWidth=.19*k;for(const wheel of [[.165,.875],[.882,.87]]){const cx=-w/2+w*wheel[0],cy=-height+height*wheel[1],radius=height*.054;g.save();g.translate(cx,cy);g.rotate(a.travel/6);for(let i=0;i<3;i++){g.rotate(Math.PI*2/3);g.beginPath();g.moveTo(radius*.25,0);g.lineTo(radius,0);g.stroke();}g.restore();}}g.restore();}}
function ambientBubble(g,s,a,t,cam,options={}){const elapsed=t-a.bark.start,text=a.bark.lines[options.lang==='en'?1:0],shown=text.slice(0,Math.floor(elapsed*31)),font=4.4*(options.textScale||1),height=a.height*scale(s,a.y)*(s.bodyScale||1),portrait=13,width=96,bodyWidth=width-portrait-8;g.save();g.font=`${font}px Remake,serif`;const lines=[];let line='';for(const word of text.split(' ')){if(g.measureText(line+' '+word).width>bodyWidth&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);const boxHeight=Math.max(21,lines.length*font*1.28+8),x=Math.max(cam+3,Math.min(cam+317-width,a.x-width*.52)),y=Math.max(15,a.y-height-boxHeight-5),tipX=Math.max(x+8,Math.min(x+width-8,a.x));g.shadowColor='rgba(27,37,37,.2)';g.shadowBlur=1;g.fillStyle='#fff7df';g.strokeStyle='#6c5840';g.lineWidth=.38;g.beginPath();g.roundRect(x,y,width,boxHeight,2);g.fill();g.stroke();g.shadowBlur=0;g.beginPath();g.moveTo(tipX-2,y+boxHeight-.2);g.lineTo(a.x,a.y-height-1.4);g.lineTo(tipX+2,y+boxHeight-.2);g.fill();g.stroke();
 const id=images[a.asset+'-reaction']?a.asset+'-reaction':a.asset,f=frame(id,'idle',0),im=images[id];const headBox=f?.headBox||catalog.assets[id].portraitBox;if(headBox){const [sx,sy,sw,sh]=headBox;g.save();g.beginPath();g.roundRect(x+2,y+3,portrait,portrait,1.5);g.clip();g.fillStyle='#e8d9b4';g.fillRect(x+2,y+3,portrait,portrait);g.drawImage(im,sx,sy,sw,sh,x+2,y+3,portrait,portrait);g.restore();}
 g.fillStyle='#263b3c';let count=0;for(let i=0;i<lines.length;i++){const visible=Math.max(0,shown.length-count),part=lines[i].slice(0,visible);g.fillText(part,x+portrait+5,y+6+font+i*font*1.28);count+=lines[i].length+1;}g.restore();return {x,y,width,height:boxHeight,shown:shown.length,total:text.length,font};}
// Original painted foreground remains in world coordinates. Clean generated plates
// carry the independent sky/horizon/water planes; interaction geometry never pans twice.
const foregrounds={},softLayers={};
const kioskLayers={};
const fountainJetLayers={};
function fountainJets(s){if(fountainJetLayers[s.id])return fountainJetLayers[s.id];const im=images[s.background],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.scale(im.width/s.w,im.height/180);g.lineWidth=1.8;g.lineCap='round';g.strokeStyle='#fff';g.beginPath();g.moveTo(294,117.2);g.bezierCurveTo(287,115.5,284.3,137,286,143.4);g.moveTo(309.7,117.2);g.bezierCurveTo(318,116.6,313,134,316.5,142.4);g.stroke();g.globalCompositeOperation='source-in';g.drawImage(im,0,0,s.w,180);
const a=g.getImageData(0,0,c.width,c.height),d=a.data;for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2];if(!(gg>155&&b>r*.96&&gg>r*.98))d[i+3]=0;}g.putImageData(a,0,0);return fountainJetLayers[s.id]=c;}
function kioskLayer(s){if(kioskLayers[s.id])return kioskLayers[s.id];const im=images[s.background],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.scale(im.width/s.w,im.height/180);g.save();
// The painted outer ink contour, not a polygon containing the old sea around it.
g.beginPath();g.moveTo(290,61.5);g.quadraticCurveTo(289.5,61.5,289.5,62.5);g.lineTo(289.5,70.8);g.lineTo(285,70.8);g.lineTo(283,78.5);g.lineTo(284.7,79);g.lineTo(284.7,78.2);
for(let x=285;x<350;x+=4.15){g.lineTo(x,78.2);g.quadraticCurveTo(x+2.05,80.4,x+4.15,78.2);}
g.lineTo(351.7,78.7);g.lineTo(350.2,70.8);g.lineTo(345.3,70.8);g.lineTo(345.3,62.3);g.quadraticCurveTo(345.3,61.5,344.5,61.5);g.closePath();
g.moveTo(284.8,82.1);g.lineTo(291,78.8);g.lineTo(345.1,78.8);g.lineTo(345.1,139.1);g.lineTo(292.3,139.1);g.lineTo(284.8,137.1);g.closePath();
g.moveTo(347.2,79.3);g.lineTo(347.7,79.3);g.lineTo(347.7,86);g.lineTo(347.2,86);g.closePath();g.clip();g.drawImage(im,0,0,s.w,180);g.restore();
// The inflatable ring's center is genuinely transparent, revealing the moving sea plane.
g.setTransform(im.width/s.w,0,0,im.height/180,0,0);g.beginPath();g.ellipse(347.8,90.8,5.65,5.9,0,0,Math.PI*2);g.ellipse(348.1,90.8,2.55,2.5,0,0,Math.PI*2);g.clip('evenodd');g.drawImage(im,0,0,s.w,180);return kioskLayers[s.id]=c;}
function softLayer(key,im,start,end){if(softLayers[key])return softLayers[key];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-in';const a=g.createLinearGradient(0,start/180*c.height,0,end/180*c.height);a.addColorStop(0,'#fff');a.addColorStop(1,'transparent');g.fillStyle=a;g.fillRect(0,0,c.width,c.height);return softLayers[key]=c;}

function sceneryLayer(s){if(foregrounds[s.id]||!['port','beach','square'].includes(s.id))return foregrounds[s.id];const im=images[s.background],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.scale(im.width/s.w,im.height/180);g.drawImage(im,0,0,s.w,180);g.clearRect(0,0,s.w,s.id==='square'?126:s.id==='port'?98:103);
if(s.id==='square'){
 g.save();poly(g,[[0,58],[164,58],[164,64],[274,64],[274,74],[287,74],[287,62],[412,62],[412,91],[433.5,91],[433.5,31],[589,31],[589,124],[600,124],[600,180],[0,180]]);g.clip();g.drawImage(im,0,0,s.w,180);g.restore();
 // Restore only colored foliage extending above the near roof silhouettes.
 const a=g.getImageData(0,0,c.width,c.height),original=document.createElement('canvas');original.width=c.width;original.height=c.height;const q=original.getContext('2d');q.drawImage(im,0,0);const d=q.getImageData(0,0,c.width,c.height).data;
 for(const [x,y,w,h]of [[0,52,38,9],[139,57,46,11],[574,40,26,85]])for(let yy=Math.floor(y*c.height/180);yy<(y+h)*c.height/180;yy++)for(let xx=Math.floor(x*c.width/s.w);xx<(x+w)*c.width/s.w;xx++){const i=(yy*c.width+xx)*4,r=d[i],gg=d[i+1],b=d[i+2];if((r>gg*1.4&&b>gg*1.2)||(gg>r*1.05&&gg>b*1.1&&gg<135)){a.data.set(d.slice(i,i+4),i);}}g.putImageData(a,0,0);return foregrounds[s.id]=c;
}

const shapes=s.id==='port'?[
 [[5.5,55.4],[164.8,55.4],[181.2,68.2],[173.6,97.7],[10.8,97.7]],
 [[21.7,33.4],[138.0,33.4],[138.0,55.6],[21.7,55.6]],
 [[79.7,7.3],[82.0,6.3],[90.7,6.3],[92.7,7.3],[92.8,29.8],[79.5,29.8]],
 [[113.8,19.0],[140.0,19.0],[140.0,20.7],[138.8,20.7],[138.8,33.6],[115.0,33.6],[115.0,20.7],[113.8,20.7]],
 [[125.7,3],[126.7,3],[126.7,19.5],[125.7,19.5]],
 [[28.0,24.8],[47,24.8],[46.2,28.8],[44.3,31.5],[30.0,31.5],[28.2,28.3]],
 [[57.9,24.8],[75.8,24.8],[75.2,28.7],[73.5,31.5],[59.5,31.5],[58.0,28.3]],
 [[95.4,25.0],[113.8,25.0],[113.0,29.1],[111.3,31.5],[97.4,31.5],[95.9,28.4]],
 [[202,90],[218,90],[218,109],[234,109],[234,123],[202,123]],[[244,96],[263,96],[263,113],[244,113]],[[407,95],[423,95],[423,112],[407,112]]
]:[
 [[116,75],[129,74],[146,77],[177,84],[176,88],[121,88]],[[294,62],[299,62],[326,104],[289,108],[289,106],[296,106]],
 [[394,81],[417,71],[447,81],[448,86],[394,87]],[[416,82],[419,82],[419,117],[416,117]],[[145,82],[148,82],[148,115],[145,115]],[[474,49],[480,40],[502,45],[506,32],[640,31],[640,122],[501,120],[500,88],[478,80]]
];for(const p of shapes){g.save();poly(g,p);g.clip();g.drawImage(im,0,0,s.w,180);g.restore();}
if(s.id==='port')g.drawImage(kioskLayer(s),0,0,s.w,180);
if(s.id==='beach'){const kx=im.width/s.w,ky=im.height/180,a=g.getImageData(0,0,c.width,c.height),d=a.data;for(let y=0;y<Math.ceil(103*ky);y++)for(let x=Math.floor(472*kx);x<c.width;x++){const i=(y*c.width+x)*4,r=d[i],gg=d[i+1],b=d[i+2];if((b>r*1.18&&gg>r*1.12)||(x<510*kx&&y<60*ky&&Math.max(r,gg,b)-Math.min(r,gg,b)<45))d[i+3]=0;}g.putImageData(a,0,0);}
if(s.id==='port'){
 // Select actual rail strokes and lifeboat handles, leaving the sky between them transparent.
 g.save();
 const railing=document.createElement('canvas');railing.width=c.width;railing.height=c.height;const rail=railing.getContext('2d');rail.scale(im.width/s.w,im.height/180);rail.strokeStyle='#fff';rail.lineWidth=.52;
 // Reuse the same traced path as a source-only mask, rather than repainting metal over the ship.
 const path=new Path2D();for(const y of [29.9,31.7,33.3]){path.moveTo(21.6,y);path.lineTo(139,y);}for(let x=22;x<140;x+=3.55){path.moveTo(x,29.7);path.lineTo(x,33.5);}for(const x of [28.1,45.2,58.1,74.8,96.0,112.4]){path.moveTo(x,25);path.bezierCurveTo(x-1.1,21.6,x+1.4,20.9,x+1.9,23.0);}rail.stroke(path);rail.globalCompositeOperation='source-in';rail.drawImage(im,0,0,s.w,180);g.drawImage(railing,0,0,s.w,180);g.restore();
 g.save();g.beginPath();g.ellipse(60,102,10,14,0,0,Math.PI*2);g.clip();g.drawImage(im,0,0,s.w,180);g.restore();const rig=document.createElement('canvas');rig.width=c.width;rig.height=c.height;const q=rig.getContext('2d');q.scale(im.width/s.w,im.height/180);q.beginPath();q.moveTo(10,40);q.lineTo(126,3);q.lineTo(181,65);q.lineWidth=6;q.strokeStyle='#fff';q.stroke();q.globalCompositeOperation='source-in';q.drawImage(im,0,0,s.w,180);const a=q.getImageData(0,0,rig.width,rig.height),d=a.data;for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2];if(!((r>gg*1.35&&r>b*1.2)||(r>170&&gg>120&&b<r*.6)||(gg>r*1.1&&gg>b*1.2)||(gg<120&&b>r*1.35)||Math.max(r,gg,b)<100))d[i+3]=0;}q.putImageData(a,0,0);g.drawImage(rig,0,0,s.w,180);}
foregrounds[s.id]=c;return c;}
function background(g,s,t,cam,options={}){const im=images[s.background],far=images[s.id+'-far'],calm=!!options.calm,reduced=!!options.reduced;g.drawImage(im,0,0,s.w,180);
if(s.id==='square'&&far){const shift=ratio=>cam*(options.parallax===false?0:1-ratio)*(calm?.3:1);g.save();g.beginPath();g.rect(0,0,s.w,126);g.clip();g.drawImage(far,-100+shift(.18)+Math.sin(t*.035)*2*(calm?.3:1),0,s.w+200,180);g.drawImage(images['square-hills'],-100+shift(.55),-12,s.w+200,180);g.restore();g.drawImage(sceneryLayer(s),0,0,s.w,180);
}else if(far){const horizon=s.id==='port'?60:53,edge=s.id==='port'?98:103,amplitude=calm?.18:1;const offset=ratio=>cam*(options.parallax===false?0:(1-ratio)*(calm?.3:1));g.save();g.beginPath();g.rect(0,0,s.w,edge);g.clip();g.drawImage(far,-100+offset(.43),0,s.w+200,180);
g.save();const sky=softLayer(s.id+'-sky',far,horizon-24,horizon-7);g.drawImage(sky,-100+offset(.22)+Math.sin(t*.035)*3*amplitude,0,s.w+200,180);g.restore();
for(let y=horizon+1;y<edge;y+=1){const depth=(y-horizon)/(edge-horizon),drift=Math.sin(y*.6-t*1.65)*depth*.9*amplitude;g.save();g.beginPath();g.rect(0,y,s.w,1);g.clip();g.drawImage(far,-100+offset(.43+depth*.45)+drift,0,s.w+200,180);g.restore();}g.restore();g.drawImage(sceneryLayer(s),0,0,s.w,180);
}else if(s.id==='disco'){g.drawImage(softLayer(s.id+'-sky',im,78,90),-28+cam*(options.parallax===false?0:.1),0,s.w+56,180);}

effects(g,s,t,options.flags||{},calm,reduced,cam,options);}
// Light follows the authored opening/source in each shot, never the camera in interiors.
const SUN={port:{x:430,y:4,reach:280,strength:.18},square:{x:470,y:-18,reach:330,strength:.16},beach:{x:490,y:-12,reach:300,strength:.20},room:{x:287,y:38,reach:170,strength:.19},lobby:{x:29,y:82,reach:-160,strength:.17}};
function sunlight(g,s,t,cam,{calm,reduced}){const light=SUN[s.id];if(!light)return;const {x,y,reach,strength}=light,clock=t*(calm?.35:1);g.save();
 if(s.id==='room'){poly(g,[[250,25],[300,25],[300,155],[160,178],[92,178],[245,79]]);g.clip();}
 if(s.id==='lobby'){poly(g,[[8,76],[48,76],[248,180],[21,180]]);g.clip();}
 g.globalCompositeOperation='screen';
 for(let i=0;i<4;i++){const drift=Math.sin(clock*.25+i*1.7)*2.2,origin=x+i*2.4,gr=g.createLinearGradient(x,y,x-reach,180);gr.addColorStop(0,`rgba(255,226,153,${strength*(.85+.12*Math.sin(clock*.31+i))})`);gr.addColorStop(.65,`rgba(255,224,158,${strength*.32})`);gr.addColorStop(1,'rgba(255,230,178,0)');g.fillStyle=gr;g.beginPath();g.moveTo(origin,y);g.lineTo(origin-reach+drift-i*9,180);g.lineTo(origin-reach+36+drift+i*11,180);g.closePath();g.fill();}
 const radius=s.id==='room'?19:s.id==='lobby'?22:58,halo=g.createRadialGradient(x,y,0,x,y,radius);halo.addColorStop(0,`rgba(255,238,182,${strength*1.4})`);halo.addColorStop(1,'transparent');g.fillStyle=halo;g.fillRect(x-radius,y-radius,radius*2,radius*2);
 // Slow dust motes within the same sunbeam, rather than global brightness pulses.
 for(let i=0;i<(reduced?8:19);i++){const p=(clock*.035+i*.618)%1,xx=x-reach*p+Math.sin(i*3.7+clock*.4)*4,yy=y+(178-y)*p;g.fillStyle=`rgba(255,241,200,${Math.sin(p*Math.PI)*.38})`;g.beginPath();g.ellipse(xx,yy,.16+(i%3)*.04,.18,0,0,7);g.fill();}g.restore();}
function shopLife(g,s,t,calm,reduced){const clock=t*(calm?.4:1),im=images[s.background],kx=im.width/s.w,ky=im.height/180;
 // Existing painted spiral rolls INSIDE the barber pole glass; caps and mounting stay fixed.
 g.save();g.beginPath();g.rect(196.2,92,7.4,8);g.clip();for(let y=92;y<100;y+=.2){const sy=92+((y-92+clock*1.7)%8);g.drawImage(im,196.2*kx,sy*ky,7.4*kx,.24*ky,196.2,y,7.4,.24);}g.restore();
 // Barely visible heat / cooking steam rises from the actual grill, inside the open shop.
 g.save();g.beginPath();g.rect(41,87,43,19);g.clip();g.lineCap='round';for(let i=0;i<(reduced?2:4);i++){const p=(clock*.12+i*.27)%1,x=49+i*7+Math.sin(clock*.65+i)*1.2,y=104-p*16;g.strokeStyle=`rgba(238,222,186,${Math.sin(p*Math.PI)*.19})`;g.lineWidth=.75;g.beginPath();g.moveTo(x,y+3);g.bezierCurveTo(x-1.5,y+1,x+1.7,y-1,x,y-4);g.stroke();}g.restore();
 // Moving daylight on the shop glass stays within its recessed display plane.
 g.save();g.beginPath();g.rect(298,88,54,23);g.clip();const x=295+(Math.sin(clock*.13)*.5+.5)*58,gr=g.createLinearGradient(x-5,90,x+5,110);gr.addColorStop(0,'transparent');gr.addColorStop(.5,'rgba(255,242,197,.09)');gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(298,88,54,23);g.restore();
}
function seabirds(g,s,t,calm){if(!images.gull)return;const clock=t*(calm?.45:1),specs=s.id==='square'?[[83,96,4.1,20]]:s.id==='port'?[[0,68,5.1,16],[7,91,4.2,24],[112,82,4.7,11]]:[[22,77,4.7,19],[29,104,3.7,27],[152,72,5.2,14]];
 for(const [delay,period,height,alt]of specs){const elapsed=((clock-delay)%period+period)%period,duration=(s.w+100)/24;if(elapsed>duration)continue;const mirror=delay%2===1,x=mirror?s.w+50-elapsed*24:-50+elapsed*24,y=alt+Math.sin(elapsed*.33+delay)*1.3,gliding=elapsed%5>1.7,pose=gliding?(Math.floor(elapsed/6)%2?5:2):[0,1,2,3,4,1][Math.floor(elapsed*5)%6];sprite(g,'gull','fly',pose,x,y,height,mirror);}
}
function effects(g,s,t,F,calm,reduced,cam=0,options={}){g.save();
if(s.water){const {x,y,w,h}=s.water;g.beginPath();g.rect(x,y,w,h);g.clip();if(s.water.exclusions){g.beginPath();g.rect(0,0,s.w,180);for(const r of s.water.exclusions)g.rect(...r);g.clip('evenodd');}for(let i=0;i<(reduced?28:72);i++){const xx=((i*73.93+t*(calm?.4:3))%w)+x, yy=y+2+(i*7.37)%(h-4)+Math.sin(t*1.4+i)*.7;const a=.22+.14*Math.sin(t*1.7+i);g.strokeStyle=`rgba(255,247,211,${a})`;g.lineWidth=.3;g.beginPath();g.moveTo(xx+Math.sin(t*1.2+i)*2.3,yy);g.lineTo(xx+3+(i%5),yy);g.stroke();}g.restore();g.save();}
if(s.id==='beach'){g.save();g.beginPath();g.rect(0,91,s.w,13);g.clip();g.beginPath();g.rect(0,0,s.w,180);for(const r of s.water.exclusions)g.rect(...r);g.clip('evenodd');for(let i=0;i<3;i++){const p=(t*(calm?.09:.28)+i/3)%1;g.strokeStyle=`rgba(255,252,234,${Math.sin(p*Math.PI)*.65})`;g.lineWidth=.35+p*.7;g.beginPath();for(let x=0;x<=s.w;x+=2){const y=94+p*7+Math.sin(x*.08+t*.9+i)*.8;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();}g.restore();}
if(s.id==='port')g.drawImage(sceneryLayer(s),0,0,s.w,180);
if(s.id==='square'&&!options.lifeOff)shopLife(g,s,t,calm,reduced);
if(['port','square','beach'].includes(s.id)&&!options.lifeOff)seabirds(g,s,t,calm);
if(!options.sunOff)sunlight(g,s,t,cam,{calm,reduced});
if(s.id==='square'&&!options.waterOff){
const clock=t*(calm?.35:1),im=images[s.background],kx=im.width/s.w,ky=im.height/180;
// Carry the actual cool painted jet texture downward in small uneven packets.
const jets=fountainJets(s);g.save();g.globalAlpha=.9;for(let y=118.4;y<143.4;y+=.35){const advect=Math.sin(clock*7.5-y*.78)*1.1*(calm?.7:1),sway=Math.sin(clock*3.1-y*.47)*.30;g.drawImage(jets,(279-sway)*kx,(y+advect)*ky,42*kx,.52*ky,279,y,42,.52);}g.restore();
// Advect the existing brush texture inside water only; the stone and rim stay still.
g.save();g.beginPath();g.ellipse(301.5,142.5,24.4,4,0,0,Math.PI*2);g.clip();g.beginPath();g.rect(0,0,s.w,180);g.rect(296.5,136,8,6.4);g.clip('evenodd');
for(let y=138.5;y<146.5;y+=.4){const dx=(Math.sin(clock*2.5+y*.72)*.58+Math.sin(clock*3.1-y*1.3)*.25)*(calm?.65:1),dy=Math.sin(clock*1.2+y)*.035;g.drawImage(im,(276-dx)*kx,(y+dy)*ky,52*kx,.45*ky,276,y,52,.45);}
for(const [side,cx,cy]of [[-1,286,143.4],[1,316.5,142.4]])for(let i=0;i<4;i++){const p=(clock*.63+i/4+(side>0?.13:0))%1,start=i*1.73;g.strokeStyle=`rgba(192,225,208,${(1-p)*.48})`;g.lineWidth=.27;g.beginPath();g.ellipse(cx+Math.sin(i*2.4)*.4,cy,.65+p*5.4,.14+p*.8,0,start,start+Math.PI*1.2);g.stroke();}g.restore();
// Small irregular glints follow the painted streams instead of adding a second bright jet.
g.lineCap='round';for(const [side,p0,p1,p2,p3]of [[-1,[294,117.2],[287,115.5],[284.3,137],[286,143.4]],[1,[309.7,117.2],[318,116.6],[313,134],[316.5,142.4]]]){
const point=p=>[0,1].map(k=>(1-p)**3*p0[k]+3*(1-p)**2*p*p1[k]+3*(1-p)*p*p*p2[k]+p**3*p3[k]);
for(let i=0;i<(reduced?11:21);i++){const phase=(i*.6180339)%1,p=(clock*1.15+phase)%1,q=Math.min(1,p+.035+(i%3)*.01),a=point(p),b=point(q);g.strokeStyle=`rgba(225,237,215,${.58+(i%4)*.06})`;g.lineWidth=.30+(i%3)*.07;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
for(let i=0;i<5;i++){const p=(clock*1.4+i/5+(side>0?.2:0))%1;g.fillStyle=`rgba(223,237,216,${(1-p)*.65})`;g.beginPath();g.ellipse(p3[0]+Math.sin(i*2.3)*p*1.4,p3[1]-7.2*p*(1-p),.18,.38,0,0,7);g.fill();}}
}
if(s.id==='lobby'){
 const fan=images['ceiling-fan'];if(fan){g.save();g.translate(160,19.5);g.scale(1,.30);g.rotate(t*(calm?1.4:3.4));g.drawImage(fan,-37,-37,74,74);g.restore();
 g.save();g.strokeStyle='#725439';g.lineWidth=1.25;g.beginPath();g.moveTo(160,10);g.lineTo(160,19.8);g.stroke();const metal=g.createRadialGradient(159.2,18.8,.1,160,20,2.8);metal.addColorStop(0,'#f0d18b');metal.addColorStop(.6,'#b58b48');metal.addColorStop(1,'#665038');g.fillStyle=metal;g.beginPath();g.ellipse(160,20,2.7,1.9,0,0,7);g.fill();g.restore();}
 // One physical room-23 key. Once Zozo checks Takis in, this hook stays empty.
 if(!F.awake&&images.key)g.drawImage(images.key,169.2,46.5,7.9,7.2);
}
if(s.id==='disco'){const on=!F.jam||F.fixed;g.save();g.beginPath();g.rect(45,125,320,55);g.clip();if(on){for(let i=0;i<5;i++){const x=65+i*68+(calm?0:Math.sin(t*.55+i)*24);const gr=g.createRadialGradient(x,148,0,x,148,44);gr.addColorStop(0,`rgba(${i%2?'57,180,204':'208,77,139'},${calm?.05:.14+.045*Math.sin(t*.75+i)})`);gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(x-44,125,88,55);}}g.restore();if(on){g.strokeStyle='rgba(255,236,188,.7)';g.lineWidth=.2;for(let i=0;i<12;i++){const x=210+Math.sin(t*.3+i*2)*5,y=33+Math.cos(t*.3+i*2)*5;g.beginPath();g.moveTo(x-.4,y);g.lineTo(x+.4,y);g.stroke();}}}
g.restore();}
const sceneryCache={};
function cachedScenery(s,t,cam,width,height,options){const key=JSON.stringify([s.id,t,cam,width,height,options.calm,options.reduced,options.flags?.jam,options.flags?.fixed,options.sunOff,options.parallax,options.waterOff,options.lifeOff]);if(sceneryCache.key===key)return sceneryCache.canvas;const c=sceneryCache.canvas||(sceneryCache.canvas=document.createElement('canvas'));const w=Math.ceil(s.w*width/320);if(c.width!==w)c.width=w;if(c.height!==height)c.height=height;const g=c.getContext('2d');g.setTransform(width/320,0,0,height/180,0,0);g.clearRect(0,0,s.w,180);background(g,s,t,cam,options);sceneryCache.key=key;return c;}
function draw(g,width,height,state,t,options={}){const s=catalog.scenes[state.scene];if(!s||!images[s.background])return;const F=state.flags||{},cam=state.cam||0,k=width/320;g.save();g.setTransform(k,0,0,height/180,0,0);g.imageSmoothingEnabled=true;g.translate(-cam,0);const scenery=cachedScenery(s,t,cam,width,height,{...options,flags:F});g.drawImage(scenery,0,0,s.w,180);
const ambient=ambientActors(s,t,state.hero,{...options,speechBusy:state.speechBusy});const entries=s.actors.map(a=>({y:a.y,draw:()=>{g.save();if(s.id==='disco')g.filter='brightness(.75) saturate(.85)';actor(g,s,a,t,F,state.speaking,{...options,speechElapsed:state.speechElapsed,hero:state.hero});g.restore();}}));for(const a of ambient)entries.push({y:a.y,draw:()=>drawAmbient(g,s,a,t)});if(state.hero)entries.push({y:state.hero.y,draw:()=>{g.save();if(s.id==='disco')g.filter='brightness(.85) saturate(.9)';for(const m of s.masks||[]){if(m.heroOnly&&state.hero.y<m.depth){g.beginPath();g.rect(-100,-200,s.w+200,500);m.points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip('evenodd');}}hero(g,s,state.hero,t,F);g.restore();}});for(const m of s.masks||[])if(!m.heroOnly)entries.push({y:m.depth,draw:()=>{g.save();poly(g,m.points);g.clip();g.drawImage(scenery,0,0,s.w,180);g.restore();}});entries.sort((a,b)=>a.y-b.y);for(const e of entries)e.draw();
for(const a of ambient)if(a.bark)ambientBubble(g,s,a,t,cam,options);
if(s.id==='lobby'&&!F.pencil&&images.pencil){g.save();g.translate(185,101);g.rotate(Math.PI/4);g.drawImage(images.pencil,-5,-5,10,10);g.restore();}
if(options.overlays){g.lineWidth=.45;g.strokeStyle='#22eeae';poly(g,s.walk);g.stroke();g.strokeStyle='#f4ad62';for(const h of s.hotspots){if(h.rect)g.strokeRect(...h.rect)}g.fillStyle='#ffeb72';for(const a of s.actors){g.beginPath();g.arc(a.x,a.y,1.2,0,7);g.fill();}}
g.restore();}
const api={resetAmbient,actorState,ambientActors,ambientBubble,drawAmbient,BARKS,SUN,init,loadAsset,loadScene,draw,sprite,frame,scale,images,drawActor:actor,drawHero:hero,drawScenery:background,kioskLayer,sceneryLayer,get catalog(){return catalog}};root.LoukoumasWorld=api;
})(globalThis);

