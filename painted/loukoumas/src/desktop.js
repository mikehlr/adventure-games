/* Desktop adapter: original scenario functions remain the narrative source of truth. */
const WORLD=LoukoumasWorld;let HD_READY=false,HD_TRAVEL=0,lastScene='',pendingSave=false;
const gameId='loukoumas-almyriki-painted-v1';
const loc=(el,en)=>LANG==='en'?en:el;
const add=(tag,id,parent=stage)=>{const e=document.createElement(tag);e.id=id;parent.append(e);return e;};
const loading=add('div','loadingHD');loading.textContent='Ο Λουκουμάς στο Αλμυρίκι · Ζωγραφίζουμε το καλοκαίρι…';
const handle=add('button','actionsHandle');handle.textContent='Ενέργειες · Tab';handle.onclick=()=>stage.classList.toggle('tools');
const menuButton=add('button','mainMenu');menuButton.textContent='☰  Μενού';menuButton.onclick=()=>{$('menu').hidden=!$('menu').hidden;stage.classList.remove('tools')};
const sceneLabel=add('div','sceneName');
const dlgNext=add('button','dlgNext',$('dlgBody'));dlgNext.textContent='Συνέχεια';dlgNext.onclick=e=>{e.stopPropagation();advance()};dlgEl.setAttribute('role','dialog');dlgEl.setAttribute('aria-live','polite');
const speechScroll=document.createElement('div');speechScroll.id='speechScroll';$('dlgBody').insertBefore(speechScroll,dlgText);speechScroll.append(dlgText,dlgOpts);
dlgNext.remove();speechScroll.tabIndex=0;
const speechOverflow=document.createElement('div');speechOverflow.id='speechOverflow';speechOverflow.hidden=true;$('dlgBody').append(speechOverflow);
let speechFollow=true,speechLastShown=-1,speechAutoTop=0;
speechScroll.addEventListener('scroll',()=>{if(speechScroll.scrollTop+speechScroll.clientHeight>=speechScroll.scrollHeight-2)speechFollow=true;else if(Math.abs(speechScroll.scrollTop-speechAutoTop)>2)speechFollow=false;},{passive:true});
speechScroll.addEventListener('wheel',e=>{if(e.deltaY<0)speechFollow=false;else if(speechScroll.scrollTop+speechScroll.clientHeight>=speechScroll.scrollHeight-4)speechFollow=true;},{passive:true});
speechScroll.addEventListener('keydown',e=>{if(['ArrowUp','PageUp','Home'].includes(e.key))speechFollow=false;},{capture:true});
const speechTail=document.createElementNS('http://www.w3.org/2000/svg','svg');speechTail.id='speechTail';speechTail.setAttribute('aria-hidden','true');const speechPath=document.createElementNS(speechTail.namespaceURI,'path');speechTail.append(speechPath);dlgEl.append(speechTail);
let bubbleSpeaker='narrator',bubbleMeasureKey='',bubbleLineKey='',speechGeneration=0,speechSeen=-1,speechClock=0,speechDelay=.032;
const speechMeasure=document.createElement('div');Object.assign(speechMeasure.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',left:'-10000px',top:'0',overflowWrap:'anywhere'});document.body.append(speechMeasure);
const sourcePtSet=ptSet;ptSet=function(line){speechGeneration++;const result=sourcePtSet(line),match=line?.match(/^([^:«"]{2,16}):/);bubbleSpeaker=(match&&PTMAP[match[1].trim()])||'narrator';if(line&&PORTRAITS&&!PT.id){PT.id=bubbleSpeaker;PT.t0=T;ptName.textContent=bubbleSpeaker==='narrator'?loc('Αφηγητής','Narrator'):match?.[1]||loc('Τάκης','Takis');dlgEl.classList.add('pt');}return result;};
function revealComicText(dt){if(speechSeen!==speechGeneration){speechSeen=speechGeneration;speechClock=0;speechDelay=.032;}speechClock+=dt;let typed=0;while(speechClock>=speechDelay&&D.shown<D.text.length){speechClock-=speechDelay;const ch=String.fromCodePoint(D.text.codePointAt(D.shown));D.shown+=ch.length;typed++;speechDelay=/[.!?;…]/u.test(ch)?.19:/[,·:]/u.test(ch)?.09:ch==='\n'?.12:.032;}dlgText.textContent=D.text.slice(0,D.shown);if(typed&&D.shown%3===0)sfx('type');}
const sourceChoose=choose;choose=function(prompt,opts){sourceChoose(prompt,opts);bubbleSpeaker='takis';if(PORTRAITS){PT.id='takis';PT.t0=T;ptName.textContent=loc('Τάκης','Takis');dlgEl.classList.add('pt');}};
function layoutSpeechBubble(){if(!D.active||dlgEl.hidden)return;const s=CATALOG.scenes[S.scene];if(!s)return;
 speechScroll.setAttribute('aria-label',loc('Διάλογος. Κλικ ή Enter για ολοκλήρωση και επόμενη ατάκα.','Dialogue. Click or Enter to reveal and advance.'));
 const narration=bubbleSpeaker==='narrator';speechTail.toggleAttribute('hidden',narration);dlgEl.classList.toggle('narration',narration);
 const r=stage.getBoundingClientRect(),sx=r.width/320,sy=r.height/180;
 const a=bubbleSpeaker!=='takis'&&s.actors.find(a=>a.speaker===bubbleSpeaker&&(!a.when||a.when.every(([k,v])=>!!F[k]===v)));
 const x=a?a.x:S.x,y=a?a.y:S.y,height=(a?a.height*(a.scale||1):70*(s.bodyScale||1))*WORLD.scale(s,y);
 const anchorX=narration?r.width/2:Math.max(14,Math.min(r.width-14,(x-S.cam)*sx)),anchorY=narration?r.height*.68:Math.max(170,Math.min(r.height-28,(y-height)*sy-12));
 const width=Math.min(r.width-32,Math.max(680,r.width*(narration?.72:.55))+(TS-1)*160),left=Math.max(16,Math.min(r.width-width-16,anchorX-width/2)),bodyLimit=narration?Math.max(160,r.height*.48):Math.max(130,Math.min(r.height*.62,anchorY-44)-40),lineHeight=parseFloat(getComputedStyle(dlgText).lineHeight),maxBody=Math.floor((bodyLimit-12)/lineHeight)*lineHeight+12;
 dlgEl.style.setProperty('--bubble-width',width+'px');dlgEl.style.setProperty('--bubble-body-max',maxBody+'px');
 const style=getComputedStyle(dlgText),key=[D.text,dlgText.clientWidth,maxBody,TS,PT.id,LANG].join('|');if(key!==bubbleMeasureKey){bubbleMeasureKey=key;speechMeasure.style.font=style.font;speechMeasure.style.lineHeight=style.lineHeight;speechMeasure.style.textWrap=style.textWrap;speechMeasure.style.width=dlgText.clientWidth+'px';speechMeasure.textContent=D.text;dlgText.style.removeProperty('min-height');speechScroll.style.minHeight=Math.min(maxBody,Math.ceil(speechMeasure.getBoundingClientRect().height)+12)+'px';}
 const lineKey=[S.scene,D.text,!!D.opts,speechGeneration].join('|');if(lineKey!==bubbleLineKey){bubbleLineKey=lineKey;speechFollow=true;speechLastShown=-1;speechScroll.scrollTop=0;}
 if(speechLastShown!==D.shown){if(speechFollow&&!D.opts){speechScroll.scrollTop=speechScroll.scrollHeight;speechAutoTop=speechScroll.scrollTop;}speechLastShown=D.shown;}
 const overflow=speechScroll.scrollHeight>speechScroll.clientHeight+2;speechOverflow.hidden=!overflow;speechOverflow.textContent=loc('↕ Κύλιση για όλο το κείμενο','↕ Scroll to read the full text');
 const h=dlgEl.offsetHeight,top=narration?Math.max(18,r.height*.045):Math.max(14,anchorY-h-24);dlgEl.style.setProperty('--bubble-x',left+'px');dlgEl.style.setProperty('--bubble-y',top+'px');
 const base=Math.max(30,Math.min(width-30,anchorX-left)),tipX=anchorX-left,tipY=Math.max(h+8,anchorY-top);speechPath.setAttribute('d',`M ${base-12} ${h-2} Q ${base+2} ${h+10} ${tipX} ${tipY} Q ${base+15} ${h+6} ${base+12} ${h-2}`);
 dlgEl.dataset.speaker=bubbleSpeaker;dlgEl.dataset.anchorX=anchorX;dlgEl.dataset.anchorY=anchorY;
}
stage.append($('score'));
let toolsPinned=false;
handle.onclick=()=>{toolsPinned=true;stage.classList.add('tools');};
stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();if(e.clientY-r.top<14&&!D.active&&!modal())stage.classList.add('tools');else if(!toolsPinned&&e.clientY-r.top>138&&!e.target.closest('#vbar,#actionsHandle'))stage.classList.remove('tools');});
OUT.addEventListener('pointerdown',()=>{toolsPinned=false;stage.classList.remove('tools')});
$('vbar').addEventListener('click',()=>{toolsPinned=false;stage.classList.remove('tools')});
document.querySelector('#title h1 .v2').textContent='HD REMAKE · DESKTOP · v6';
const titleP=document.querySelector('#title p');if(titleP)titleP.textContent='Καλοκαίρι 1988. Ένα νησί. Ένας λογιστής. Καμία ελπίδα. Σχεδόν.';
const studioLink=document.createElement('a');studioLink.href='review/index.html';studioLink.target='_blank';studioLink.textContent='Review Studio ↗';Object.assign(studioLink.style,{color:'#eac589',fontSize:'13px',marginTop:'18px'});$('title').append(studioLink);
setCtrl(CTRL);
for(const s of Object.values(SC))s.gfx=false;
// Stationary people have ground footprints distinct from their full painted silhouettes.
for(const id of Object.keys(SC)){const s=CATALOG.scenes[id];SC[id].block=s.block.map(r=>r.slice());for(const h of SC[id].hs){const geo=s.geometry?.[h.id];if(geo)Object.assign(h,geo);}buildGrid(SC[id]);}
/* The HD compositor owns all visible world pixels; inherited post-effects cannot redraw old actors. */
composite=function(dt,cam){if(!HD_READY)return;octx.setTransform(1,0,0,1,0,0);octx.globalAlpha=1;octx.globalCompositeOperation='source-over';WORLD.draw(octx,OW,OH,{scene:S.scene,cam,flags:{...F,chain:has('chain')},speaking:D.active&&D.shown<D.text.length?PT.id:null,speechElapsed:T-PT.t0,speechBusy:D.active||CINE.busy()||!!modal(),hero:S.mode==='title'?null:{x:S.x,y:S.y,dir:S.dir,face:S.face,heading:S.heading,moving:S.moving,travel:HD_TRAVEL,dance:S.dance}},T,{calm:XP.calm,reduced:!FXFULL,lang:LANG,textScale:TS});if(S.fade>.001){octx.fillStyle=`rgba(23,45,49,${S.fade})`;octx.fillRect(0,0,OW,OH)}if(HL>0){drawHL(cam);if(HL<99)HL=Math.max(0,HL-dt)}};
hdCursor=function(){};drawCursor=function(){};
const cursor=AdventureCursorHD.create({host:stage,world:OUT,size:44,resolve:()=>({verb:S.hover?.exit&&S.verb==='walk'?'exit':S.verb,item:S.verb==='item'?S.sel:null,hot:!!S.hover}),visible:()=>HD_READY&&S.mode==='play'&&!D.active&&!S.trans&&[invEl,$('menu'),$('settings'),slotsP,$('detail')].every(e=>e?.hidden!==false),itemURL:id=>CATALOG.assets[id]?.url});
OUT.style.cursor='none';
const oldFaceTo=faceTo;faceTo=function(h){oldFaceTo(h);S.heading=S.dir==='side'?(S.face>0?'E':'W'):S.dir==='back'?'N':'S'};
/* Full bodies, including the cinematics, use exactly the same authored atlas. */
drawTakisHD=function(g,x,y,sc,dir,face,ph,moving,dance){const v=dir==='side'?(face<0?'W':'E'):dir==='back'?'N':'S';WORLD.drawHero(g,{far:0,sFar:1,bodyScale:sc},{x,y,heading:v,moving,dance,travel:ph*1.27*3.6},ph*1.27/3,F)};
function jsonSafe(v,n=0){return n<12&&(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||Array.isArray(v)&&v.every(x=>jsonSafe(x,n+1))||v&&Object.getPrototypeOf(v)===Object.prototype&&Object.entries(v).every(([k,x])=>!['__proto__','constructor','prototype'].includes(k)&&jsonSafe(x,n+1)))}
function validState(v){return v&&Object.hasOwn(SC,v.scene)&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.x<=SC[v.scene].w&&v.y>=SC[v.scene].far-5&&v.y<=180&&Array.isArray(v.inv)&&new Set(v.inv).size===v.inv.length&&v.inv.every(id=>Object.hasOwn(ITEMS,id))&&v.F&&jsonSafe(v.F)&&Number.isFinite(v.F.money)&&v.F.money>=0&&Number.isFinite(v.F.score)&&v.F.score>=0&&v.F.score<=100}
let storage;try{storage=localStorage}catch(e){storage={getItem(){throw e},setItem(){throw e},removeItem(){throw e}}}
const saveStore=AdventureSaveStore.create({storage,namespace:gameId,gameId,version:2,validate:validState});
function stable(){return S.mode==='play'&&!D.active&&!S.path.length&&!S.onArrive&&!S.trans&&!S.fadeDur&&!S.lock&&!CINE.busy()&&!timers.length&&!detailState}
function snapshot(){return JSON.parse(JSON.stringify({scene:S.scene,x:S.x,y:S.y,dir:S.dir,face:S.face,heading:S.heading,cam:S.cam,inv:S.inv,F}))}
function payload(name){return {state:snapshot(),label:(name||SCN[S.scene][LANG==='en'?1:0]).slice(0,80),when:Date.now()}}
function writeSave(id,name){const result=saveStore.write(id,payload(name));tip(result.ok?loc('Αποθηκεύτηκε.','Saved.'):loc('Η αποθήκευση απέτυχε. Εξάγαγε αρχείο προόδου.','Save failed. Export your progress.'),3000);return result.ok}
save=function(){if(S.mode==='play')pendingSave=true};load=function(){return saveStore.read('auto').value?.state||null};clearSave=function(){saveStore.remove('auto');pendingSave=false};
const oldStart=startGame;startGame=function(data){if(data&&!validState(data)){tip(loc('Μη έγκυρο save.','Invalid save.'),3000);return}D.active=false;D.q=[];D.opts=null;D.cb=null;dlgEl.hidden=true;timers.length=0;S.fadeDur=0;S.fadeCb=null;S.trans=0;S.path=[];S.onArrive=null;S.sel=null;detail.hidden=true;detailState=null;$('settings').hidden=true;$('menu').hidden=true;slotsP.hidden=true;oldStart(data);WORLD.resetAmbient(S.scene,T,{x:S.x,y:S.y});HD_TRAVEL=0;S.heading=data?.heading||(S.dir==='side'?(S.face>0?'E':'W'):S.dir==='back'?'N':'S');if(data){S.cam=data.cam??S.cam;S.dir=data.dir||S.dir;S.face=data.face||1}pendingSave=!data};
function restore(v){startGame(JSON.parse(JSON.stringify(v)))}
for(const id of ['mSlots','tSlots']){const old=$(id),fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.onclick=e=>{e.stopPropagation();openSlots()};}
function downloadSave(p,name='progress'){const envelope={gameId,version:2,payload:p,checksum:saveStore.checksum(JSON.stringify(p))};downloadJSON(envelope,gameId+'-'+name+'.json')}
function downloadJSON(v,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(v,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function btn(label,fn,parent){const b=document.createElement('button');b.textContent=label;b.onclick=e=>{e.stopPropagation();fn()};parent.append(b);return b}
openSlots=function(){closeInv();$('menu').hidden=true;slotsP.replaceChildren();const h=document.createElement('h3');h.textContent=loc('Αποθήκευση / Φόρτωση','Save / Load');slotsP.append(h);const input=document.createElement('input');input.placeholder=loc('Όνομα αποθήκευσης','Save name');input.id='remakeSaveName';input.maxLength=48;slotsP.append(input);
for(let n=1;n<=4;n++){const p=saveStore.read('slot'+n),row=document.createElement('div');row.className='srow';const sp=document.createElement('span');sp.textContent=loc('Θέση ','Slot ')+n+' · '+(p.value?p.value.label+' · '+p.value.state.F.score+'/100'+(p.recovered?loc(' · ανάκτηση',' · recovered'):''):loc('κενή','empty'));row.append(sp);let confirmed=false;const b=btn(loc('Αποθήκευση','Save'),()=>{if(p.value&&!confirmed){confirmed=true;b.textContent=loc('Αντικατάσταση;','Overwrite?');return}if(writeSave('slot'+n,input.value))openSlots()},row);b.disabled=!stable();btn(loc('Φόρτωση','Load'),()=>restore(p.value.state),row).disabled=!p.value;if(p.value)btn(loc('Εξαγωγή','Export'),()=>downloadSave(p.value,'slot'+n),row);slotsP.append(row)}
const auto=saveStore.read('auto').value;if(auto)btn(loc('Συνέχεια από αυτόματη αποθήκευση','Continue autosave'),()=>restore(auto.state),slotsP);
const note=document.createElement('p');note.textContent=loc('Έτοιμα saves τοποθεσιών · ανεξάρτητα από τη δική σου πρόοδο','Location checkpoints · separate from your progress');slotsP.append(note);const grid=document.createElement('div');grid.className='presetRow';for(const p of PRESETS)btn(p.label[LANG==='en'?1:0],()=>restore(p.state),grid);slotsP.append(grid);
btn(loc('Εξαγωγή τρέχουσας προόδου','Export current progress'),()=>downloadSave(payload()),slotsP).disabled=!stable();const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=async()=>{try{const f=file.files[0];if(!f||f.size>500000)throw Error('size');const p=saveStore.decode(await f.text());restore(p.state)}catch(e){tip(loc('Μη έγκυρο ή ασύμβατο αρχείο.','Invalid or incompatible file.'),4000)}};slotsP.append(file);btn(loc('Εισαγωγή save','Import save'),()=>file.click(),slotsP);btn(loc('Κλείσιμο','Close'),()=>{slotsP.hidden=true;menuButton.focus()},slotsP).className='close';slotsP.hidden=false;input.focus()};
/* Inventory: click equips; inspection and combining have explicit, separate controls. */
let inspected=null,combineFrom=null,detailState=null;const detail=add('section','detail');detail.hidden=true;detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');detail.innerHTML='<div class="inner"><canvas width="640" height="640"></canvas><div><h2></h2><p></p><button id="detailUse"></button> <button id="detailClose"></button></div></div>';
function paintItem(c,id){const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);const im=WORLD.images[id];if(!im)return;const k=Math.min(c.width*.8/im.width,c.height*.8/im.height);g.drawImage(im,(c.width-im.width*k)/2,(c.height-im.height*k)/2,im.width*k,im.height*k)}
function inspectItem(id){if(!id)return;inspected=id;detailState=id;closeInv();detail.hidden=false;paintItem(detail.querySelector('canvas'),id);detail.querySelector('h2').textContent=tr(ITEMS[id].n);const d=ITEMS[id].d;detail.querySelector('p').textContent=(typeof d==='function'?d():d).map(tr).join('\n\n');$('detailUse').textContent=loc('Χρησιμοποίησε','Use');$('detailClose').textContent=loc('Πίσω στην τσάντα','Back to inventory');$('detailClose').focus()}
$('detailClose').onclick=()=>{detail.hidden=true;detailState=null;openInv();$('bClose').focus()};$('detailUse').onclick=()=>{detail.hidden=true;detailState=null;setSel(inspected);closeInv()};
const combineButton=btn('Συνδύασε',()=>{combineFrom=inspected||S.sel||S.inv[0];capEl.textContent=loc('Διάλεξε δεύτερο αντικείμενο για: ','Choose second item for: ')+tr(ITEMS[combineFrom].n)},$('invBar'));
renderInv=function(){$('bExam').disabled=!S.inv.length;slotsEl.replaceChildren();for(const id of S.inv){const b=document.createElement('button');b.className='slot'+(S.sel===id?' on':'');b.setAttribute('aria-label',tr(ITEMS[id].n));b.setAttribute('aria-pressed',String(S.sel===id));const c=document.createElement('canvas');c.width=c.height=160;paintItem(c,id);const name=document.createElement('span');name.textContent=tr(ITEMS[id].n);b.append(c,name);b.onclick=()=>{inspected=id;if(combineFrom){const source=combineFrom;combineFrom=null;setSel(source);invTap(id);return}setSel(id);closeInv()};b.oncontextmenu=e=>{e.preventDefault();inspectItem(id)};b.onfocus=()=>inspected=id;slotsEl.append(b)}combineButton.textContent=loc('Συνδύασε','Combine');capEl.textContent=loc('Κλικ: κράτησε · Δεξί κλικ: εξέτασε · Συνδύασε: διάλεξε δεύτερο αντικείμενο','Click: equip · Right-click: inspect · Combine: choose a second item')};
$('bExam').addEventListener('click',e=>{e.stopImmediatePropagation();inspectItem(inspected||S.sel||S.inv[0])},true);
const oldOpenInv=openInv;openInv=function(){combineFrom=null;inspected=S.sel||S.inv[0];oldOpenInv();renderInv()};
function modal(){return [detail,slotsP,$('settings'),invEl,$('menu')].find(e=>!e.hidden)}
globalThis.adventureKeyboardGuard=e=>{if(D.active&&!CINE.busy()){if(e.key==='Tab'){const choices=[...dlgOpts.querySelectorAll('button')],buttons=choices.length?choices:[speechScroll];const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();e.stopImmediatePropagation();return;}if(['Enter',' '].includes(e.key)){if(!D.opts){e.preventDefault();advance();}e.stopImmediatePropagation();return;}if(e.key!=='Escape'){e.stopImmediatePropagation();return;}}const m=modal();if(m){if(e.key==='Escape'){e.preventDefault();if(m===detail)$('detailClose').click();else{m.hidden=true;menuButton.focus()}}if(e.key==='Tab'){const bs=[...m.querySelectorAll('button:not(:disabled),input:not([hidden])')].filter(e=>e.getClientRects().length),i=bs.indexOf(document.activeElement);if(bs.length){e.preventDefault();bs[(i+(e.shiftKey?-1:1)+bs.length)%bs.length].focus()}}e.stopImmediatePropagation();return}if(e.key==='Tab'&&!D.active&&!CINE.busy()){e.preventDefault();stage.classList.toggle('tools');e.stopImmediatePropagation();if(stage.classList.contains('tools'))$('vbar').querySelector('button').focus()}if(e.key==='Escape'&&!D.active&&!CINE.busy()){e.preventDefault();$('menu').hidden=!$('menu').hidden;e.stopImmediatePropagation()}if(e.target.closest?.('button')&&[' ','Enter'].includes(e.key))e.stopImmediatePropagation()};
const oldUpdateHD=update;update=function(dt){const paused=!!modal();stage.classList.toggle('ui-modal',paused);if(!paused)oldUpdateHD(dt);else{ptDraw();S.moving=false}cursor.update();const dialogue=D.active||CINE.busy();stage.classList.toggle('dialogue',dialogue);dlgNext.hidden=!D.active||!!D.opts;dlgNext.textContent=loc('Συνέχεια','Continue');$('vbar').inert=!stage.classList.contains('tools')||dialogue;menuButton.hidden=handle.hidden=sceneLabel.hidden=score.hidden=S.mode!=='play';sceneLabel.textContent=SCN[S.scene][LANG==='en'?1:0]+' · 1988';handle.textContent=loc('Ενέργειες · Tab','Actions · Tab');menuButton.textContent=loc('☰  Μενού','☰  Menu');if(S.scene!==lastScene){lastScene=S.scene;WORLD.resetAmbient(S.scene,T,{x:S.x,y:S.y});S.heading=S.dir==='side'?(S.face<0?'W':'E'):S.dir==='back'?'N':'S'}if(pendingSave&&stable()){pendingSave=false;const result=saveStore.write('auto',payload());if(!result.ok)tip(loc('Η αυτόματη αποθήκευση απέτυχε.','Autosave failed.'),3500)}};
const oldPoints=pts;pts=function(...args){oldPoints(...args);save()};
/* Shared painted cutscene shots; original timing, captions, order and callbacks preserved. */
function installPaintedCinema(){const cfg=CS_loukoumasHD();const paint=(scene,hero=false)=>function(g,t,p){const s=CATALOG.scenes[scene],cam=(s.w-320)*(scene==='port'?.12:scene==='beach'?.45:.5);g.save();g.translate(-cam,0);WORLD.drawScenery(g,s,t,cam,{flags:F,calm:XP.calm,reduced:!FXFULL});g.restore();if(hero)drawTakisHD(g,160,178,1.8,'front',1,t*3,false,false)};cfg.intro[0].hd=paint('port');cfg.intro[1].hd=paint('port',true);cfg.intro[2].hd=function(g,t,p){const im=WORLD.images.invitation,k=Math.min(180/im.width,140/im.height);g.fillStyle='#17343c';g.fillRect(0,0,320,180);g.drawImage(im,160-im.width*k/2,88-im.height*k/2,im.width*k,im.height*k)};cfg.mid[0].hd=function(g,t,p){paint('beach')(g,t,p);g.fillStyle='rgba(45,25,73,'+(.18+p*.48)+')';g.fillRect(0,0,320,180);g.fillStyle='rgba(228,130,73,'+(.20*(1-p))+')';g.fillRect(0,0,320,180)};cfg.mid[1].hd=paint('disco');const end=cfg.ending;cfg.ending=()=>{const shots=end();shots[0].hd=function(g,t,p){paint('port')(g,t,p);g.fillStyle='rgba(10,16,49,.78)';g.fillRect(0,0,320,180);if(!XP.calm){csFirework(g,80,40,t,'236,178,110',0);csFirework(g,230,30,t,'232,103,153',.3)}};shots[1].hd=function(g,t,p){paint('disco')(g,t,p);drawTakisHD(g,130,168,1.5,'front',1,t*6,true,true);WORLD.sprite(g,'danaeDisco','idle',Math.floor(t*2)%4,195,168,85)};return shots};cineInstall(cfg)}
window.REMAKE={snapshot,validState,stable,restore,saveStore,WORLD,get travel(){return HD_TRAVEL},get ready(){return HD_READY},presets:PRESETS};
(async()=>{await WORLD.init(CATALOG);await Promise.all([...Object.keys(CATALOG.scenes).map(id=>WORLD.loadScene(id)),...Object.keys(ITEMS).map(id=>WORLD.loadAsset(id)),...Object.keys(CATALOG.assets).filter(id=>id.startsWith('portrait-')).map(id=>WORLD.loadAsset(id))]);
for(const [id,a]of Object.entries(CATALOG.assets)){if(!id.startsWith('portrait-'))continue;const name=id.slice(9);PTD[name]=function(g,talk,blink){const c=a.clips.idle,idx=name==='narrator'?(blink?2:talk?1:0):talk?1+Math.floor(T*2.8)%2:0,f=c.frames[idx];g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,g.canvas.width,g.canvas.height);const im=WORLD.images[id],k=Math.min(g.canvas.width/f.box[2],g.canvas.height/f.box[3]);g.drawImage(im,...f.box,(g.canvas.width-f.box[2]*k)/2,(g.canvas.height-f.box[3]*k)/2,f.box[2]*k,f.box[3]*k)}}
const pixelPortrait=ptDraw;ptDraw=function(){if(!PT.id||dlgEl.hidden)return;const talking=D.shown<D.text.length&&Math.floor((T-PT.t0)*2.8)%4!==3;PTD[PT.id]?.(ptG,talking,PT.id==='narrator'&&T%4.6<.12)};ptCv.width=ptCv.height=256;
installPaintedCinema();HD_READY=true;loading.hidden=true;document.title='Ο Λουκουμάς στο Αλμυρίκι · HD Remake v6';$('tCont').hidden=!load();renderInv();})().catch(e=>{loading.textContent='Δεν φορτώθηκαν τα γραφικά: '+e.message;console.error(e)});

const updateBeforeSpeech=update;update=function(dt){updateBeforeSpeech(dt);layoutSpeechBubble();};



/* Larger desktop controls; keep original listeners when grouping preferences. */
const uiLabels=[];
function uiText(e,el,en){uiLabels.push([e,el,en]);e.textContent=loc(el,en);return e;}
for(const b of $('vbar').querySelectorAll('.vb')){
 const names={walk:['Περπάτα','Walk'],look:['Κοίτα','Look'],hand:['Χρήση','Use'],talk:['Μίλα','Talk'],item:['Κρατάς','Held item'],bInv:['Τσάντα','Inventory'],bMenu:['Μενού','Menu'],bHint:['Βοήθεια','Hint'],bHL:['Σημεία','Hotspots']};
 const n=names[b.dataset.v||b.id];if(n){const label=document.createElement('span');label.className='verbLabel';uiText(label,...n);b.append(label);}
}
const settingsPanel=$('settings'),settingsTitle=settingsPanel.querySelector('h3');
const settingsHead=document.createElement('header');settingsHead.className='settingsHead';settingsHead.append(settingsTitle);
const settingsIntro=document.createElement('p');uiText(settingsIntro,'Φτιάξε το καλοκαίρι στα μέτρα σου. Οι επιλογές αποθηκεύονται αυτόματα.','Make summer your own. Preferences are saved automatically.');settingsHead.append(settingsIntro);
const settingsGrid=document.createElement('div');settingsGrid.className='settingsGrid';
function preferenceGroup(el,en,ids){const card=document.createElement('section');card.className='preferenceGroup';const h=document.createElement('h4');uiText(h,el,en);card.append(h);for(const id of ids){const row=$(id);if(!row)continue;const label=row.previousElementSibling;if(label?.classList.contains('lab'))card.append(label);card.append(row);}settingsGrid.append(card);return card;}
preferenceGroup('Διάλογοι & γλώσσα','Dialogue & language',['lgRow','tsRow','ptRow']);
preferenceGroup('Εικόνα & άνεση','Picture & comfort',['fxRow','accCalm','accContrast']);
preferenceGroup('Χειρισμός & ρυθμός','Controls & pace',['ctRow','accSpeed']);
const audio=preferenceGroup('Ήχος','Audio',[]);const audioNote=document.createElement('p');uiText(audioNote,'Ξεχωριστός έλεγχος για μουσική και ηχητικά εφέ.','Separate controls for music and sound effects.');audio.append(audioNote,$('sSound'),$('sMusic'));
const settingsFooter=document.createElement('footer');settingsFooter.className='settingsFooter';settingsFooter.append($('sFull'),$('sClose'));
settingsPanel.replaceChildren(settingsHead,settingsGrid,settingsFooter);settingsPanel.setAttribute('aria-labelledby',settingsTitle.id='settingsTitle');
const textSizes=[['Κανονικό','Normal'],['Μεγάλο','Large'],['Πολύ μεγάλο','Extra large'],['Μέγιστο','Maximum']];$('tsRow').querySelectorAll('button').forEach((b,i)=>uiText(b,...textSizes[i]));
const inventoryTitle=document.createElement('h2');inventoryTitle.id='inventoryTitle';uiText(inventoryTitle,'Η τσάντα του Τάκη','Takis’ inventory');invEl.prepend(inventoryTitle);invEl.setAttribute('role','dialog');invEl.setAttribute('aria-labelledby','inventoryTitle');
const languageBeforeUI=setLang;setLang=function(l){languageBeforeUI(l);for(const[e,el,en]of uiLabels)e.textContent=loc(el,en);};

// Contextual unsuccessful use: preserve every authored success before adding incidental humour.
const itemReplyCounts=new Map();
function contextualItemUse(target,item){const key=S.scene+'/'+target+'/'+item+'/'+LANG,n=itemReplyCounts.get(key)||0;itemReplyCounts.set(key,n+1);say([LoukoumasItemResponses.resolve(S.scene,target,item,LANG,n)]);}
const narrativeDoVerb=doVerb;doVerb=function(h,v){if(v!=='item'||!S.sel)return narrativeDoVerb(h,v);const item=S.sel;if(h.item&&h.item(item))return;return contextualItemUse(h.id,item);};
const narrativeClickAt=clickAt;clickAt=function(sx,sy,touch){if(HD_READY&&S.mode==='play'&&!S.lock&&!S.trans&&!D.active&&!modal()&&S.verb==='item'&&S.sel&&!hotAt(sx+S.cam,sy)){closeInv();S.path=[];S.onArrive=null;return contextualItemUse('ground',S.sel);}return narrativeClickAt(sx,sy,touch);};

const authoredFaceTo=faceTo;faceTo=function(h){authoredFaceTo(h);S.heading={back:'N',front:'S',left:'W',right:'E'}[h.face]||S.heading;};

/* A painted last postcard; the original ending still owns every line and restart. */
const endScreen=$('end'),endPainting=document.createElement('canvas');
endPainting.id='endPainting';endPainting.width=1600;endPainting.height=900;endPainting.setAttribute('aria-hidden','true');
const endLayout=document.createElement('div');endLayout.className='endLayout';
const endSouvenir=document.createElement('div');endSouvenir.className='endSouvenir';
const endPlace=document.createElement('span');uiText(endPlace,'ΑΛΜΥΡΙΚΙ · ΚΑΛΟΚΑΙΡΙ 1988','ALMYRIKI · SUMMER 1988');
const endWish=document.createElement('span');uiText(endWish,'Ένα καλοκαίρι να το θυμάσαι.','A summer to remember.');endSouvenir.append(endPlace,endWish);
const endCard=document.createElement('section');endCard.className='endCard';endCard.setAttribute('aria-labelledby','endH');
const endEyebrow=document.createElement('div');endEyebrow.className='endEyebrow';uiText(endEyebrow,'ΚΑΡΤ ΠΟΣΤΑΛ ΑΠΟ ΤΟ ΑΛΜΥΡΙΚΙ','A POSTCARD FROM ALMYRIKI');
const endStamp=document.createElement('span');endStamp.className='endStamp';endStamp.textContent='1988';endStamp.setAttribute('aria-hidden','true');
endCard.append(endEyebrow,endStamp,$('endH'),$('endT'),$('endB'));endLayout.append(endSouvenir,endCard);endScreen.replaceChildren(endPainting,endLayout);
let endingVisible=false;
const updateBeforePostcard=update;update=function(dt){updateBeforePostcard(dt);const visible=S.mode==='end'&&!endScreen.hidden&&!CINE.busy();if(!visible){endingVisible=false;return;}if(!endingVisible){endingVisible=true;$('endT').scrollTop=0;$('endB').focus({preventScroll:true});}endScreen.style.setProperty('--end-text-scale',Math.sqrt(TS));if(!HD_READY)return;
 const g=endPainting.getContext('2d'),s=CATALOG.scenes.beach,t=XP.calm||!FXFULL?0:T;g.setTransform(5,0,0,5,0,0);g.clearRect(0,0,320,180);const cam=45;g.save();g.translate(-cam,0);WORLD.drawScenery(g,s,t,cam,{flags:F,calm:XP.calm,reduced:!FXFULL});g.restore();
 const light=g.createLinearGradient(0,0,0,180);light.addColorStop(0,'rgba(245,197,133,.22)');light.addColorStop(.65,'rgba(246,197,132,.02)');light.addColorStop(1,'rgba(37,63,64,.34)');g.fillStyle=light;g.fillRect(0,0,320,180);
 WORLD.drawHero(g,{far:0,sFar:1,bodyScale:1.05},{x:66,y:164,heading:'SE',moving:false},t,{...F,chain:has('chain')});WORLD.sprite(g,'danaeDisco','idle',XP.calm||!FXFULL?0:Math.floor(t*.8)%4,105,164,72);
};
