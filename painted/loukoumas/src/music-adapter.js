const MUSIC_BASE='assets/music/';
const localMusic=AdventureMusic.create({tracks:MUSIC_LIBRARY.tracks,base:new URL(MUSIC_BASE,document.baseURI)});
globalThis.REMAKE_MUSIC=localMusic;
let localCinemaTheme=null;
const originalCinePlay=CINE.play;CINE.play=function(shots,done,mood){localCinemaTheme=S.mode==='end'?'zefyr-88':S.mode==='title'?'village-day':'beach-breeze';return originalCinePlay.call(this,shots,()=>{localCinemaTheme=null;done?.();},mood);};
function sceneMusic(){if(CINE.busy()&&localCinemaTheme)return localCinemaTheme;if(S.mode==='end')return 'beach-breeze';if(S.mode==='title')return 'village-day';if(S.scene==='disco'&&F.jam&&!F.fixed)return null;return MUSIC_LIBRARY.scenes[S.scene]||'village-day';}
const beforeLocalMusicUpdate=update;update=function(dt){beforeLocalMusicUpdate(dt);localMusic.update(sceneMusic(),!!XP.music&&!document.hidden,D.active,S.scene==='disco'&&F.jam&&!F.fixed&&!CINE.busy());};
const synthesisedMusicTick=musicTick;musicTick=function(dt){if(!document.hidden&&sceneMusic()!==null&&!localMusic.externalActive)synthesisedMusicTick(dt);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)localMusic.update(null,false,false,true);});
