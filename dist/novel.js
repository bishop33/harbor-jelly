import {NOVELS,PEOPLE,EVIDENCE} from './novel-data.js';
import {CinematicScene} from './cinematic-scene.js';

const $=id=>document.getElementById(id);
const state={genre:'mystery',page:0,choices:{},read:new Set(),timeline:[],solved:false,sound:false};
const storageKey='harbor-jelly-novel-v2';
let stage,hotspotId='letter',toastTimer,audio;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000)}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({...state,read:[...state.read],sound:false}))}catch{}}
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&NOVELS[saved.genre]&&Number.isInteger(saved.page)&&saved.page>=0&&saved.page<12){state.genre=saved.genre;state.page=saved.page;state.choices=saved.choices||{};state.read=new Set((saved.read||[]).filter(id=>EVIDENCE[id]));state.solved=!!saved.solved}}catch{}

function updatePage(){
 const novel=NOVELS[state.genre],page=novel.pages[state.page];
 document.title='Harbor Jelly — '+novel.title;document.body.dataset.genre=state.genre;
 document.querySelectorAll('[data-genre]').forEach(b=>{const active=b.dataset.genre===state.genre;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 const chapter=state.page===0?'첫 번째 밤 · 귀항':state.page<2?'첫 번째 장 · 재회':state.page<6?'두 번째 장 · '+(state.genre==='mystery'?'남겨진 기록':'오래된 편지'):state.page<10?'세 번째 장 · '+(state.genre==='mystery'?'같은 밤의 기억':'같은 속도'):'에필로그 · 비가 그친 뒤';
 $('chapter').textContent=chapter;$('storyTitle').textContent=page.title;
 let paragraphs=[...page.paragraphs];
 if(state.genre==='romance'&&state.page===6&&state.choices[5]===1)paragraphs=['비숍은 편지를 잠시 접어두었다. 이브는 기록관에서 보내는 하루와, 좋아하게 된 도시의 골목들을 이야기했다.','조금 뒤 두 사람은 봉투를 함께 열었다. 오래된 문장은 지금의 목소리를 들은 뒤에야 조금 다르게 읽혔다.'];
 if(state.genre==='mystery'&&state.page===6&&state.choices[5]===0)paragraphs.unshift('히스의 설명을 들은 뒤, 비숍은 이번에는 후니의 말을 끝까지 듣기로 했다.');
 $('prose').replaceChildren(...paragraphs.map(text=>{const el=document.createElement('p');el.textContent=text;return el}));
 $('speaker').textContent=PEOPLE.find(person=>person.id===page.speaker)?.ko||page.speaker;$('spoken').textContent='“'+page.dialogue+'”';
 $('counter').textContent=String(state.page+1).padStart(2,'0')+' / 12';$('progressFill').style.width=(state.page+1)/12*100+'%';$('previous').disabled=state.page===0;
 $('next').querySelector('span').textContent=state.page===11?'첫 장으로 돌아가기':'다음 문장';
 $('choices').hidden=!page.choice;$('choices').replaceChildren();
 if(page.choice)page.choice.forEach((text,i)=>{const b=document.createElement('button');b.textContent=text;b.classList.toggle('selected',state.choices[state.page]===i);b.addEventListener('click',()=>{state.choices[state.page]=i;persist();next()});$('choices').append(b)});
 $('branchNotice').textContent=page.choice?'어느 말에 더 머무를까요?':state.page===11?'끝 · 다른 밤도 펼쳐보세요':'';
 $('inspectAction').hidden=!page.object;$('inspectAction').querySelector('span').textContent=page.object?EVIDENCE[page.object].title+' 살펴보기':'기록 살펴보기';
 hotspotId=page.object||((page.scene==='arrival'&&state.page<3)?state.genre==='mystery'?'packet':'letter':null);
 $('hotspot').hidden=!hotspotId;if(hotspotId){$('hotspot').setAttribute('aria-label',EVIDENCE[hotspotId].title+' 살펴보기');$('hotspot').querySelector('.hotspot-label').textContent=EVIDENCE[hotspotId].title;}
 $('noteCount').textContent=state.read.size;
 stage?.setPage(state.genre,state.page,page.scene,page.shot);
 $('reader').scrollTop=0;$('readingFlow').scrollTop=0;$('reader').classList.remove('turning');void $('reader').offsetWidth;$('reader').classList.add('turning');
 persist();
}
function next(){if(state.page===11){state.page=0;state.choices={}}else state.page++;updatePage()}
function setGenre(genre){if(genre===state.genre)return;state.genre=genre;state.page=0;state.choices={};state.read.clear();state.timeline=[];state.solved=false;showReading();updatePage();toast(NOVELS[genre].title+'의 첫 장을 펼쳤어요')}
function showReading(){document.body.classList.remove('landscape');$('toggleReading').querySelector('span').textContent='풍경만 보기';$('toggleReading').setAttribute('aria-expanded','true');$('reader').inert=false}

try{stage=new CinematicScene($('scene'),message=>$('cameraStatus').textContent=message,ok=>{if(ok){$('loading').classList.add('done');$('loading').setAttribute('aria-hidden','true')}else{$('loading').classList.add('done');toast('장면을 불러오지 못해 원화로 보여드려요. 새로고침으로 다시 시도할 수 있어요.')}})}catch(error){console.error(error);$('scene').hidden=true;$('loading').classList.add('done');toast('이 브라우저에서는 원화 화면으로 이야기를 읽을 수 있어요.')}
if(stage)stage.onFrame=()=>{
 if(!hotspotId)return;const e=EVIDENCE[hotspotId],page=NOVELS[state.genre].pages[state.page];
 if(e.scene!==page.scene){$('hotspot').hidden=true;return}
 const xy=stage.screenPoint(...e.position);if(!xy)return;
 $('hotspot').style.left=xy.x+'px';$('hotspot').style.top=xy.y+'px';
 const r=$('reader').getBoundingClientRect();const hidden=xy.x<15||xy.y<80||xy.x>innerWidth-15||xy.y>innerHeight-50||(!document.body.classList.contains('landscape')&&xy.x>r.left&&xy.x<r.right&&xy.y>r.top&&xy.y<r.bottom);
 $('hotspot').hidden=hidden;
};

for(const [i,person] of PEOPLE.entries()){
 const item=document.createElement('article');item.className='person';
 const portrait=document.createElement('div');portrait.className='portrait';portrait.style.backgroundPosition=(i*25)+'% center';portrait.setAttribute('role','img');portrait.setAttribute('aria-label',person.ko+'의 초상');
 const copy=document.createElement('div'),heading=document.createElement('h3'),role=document.createElement('span'),desc=document.createElement('p');
 heading.textContent=person.id+' · '+person.ko;role.textContent=person.role;heading.append(role);desc.textContent=person.description;copy.append(heading,desc);item.append(portrait,copy);$('castList').append(item);
}
function openEvidence(id){
 const data=EVIDENCE[id];if(!data)return;
 state.read.add(id);$('noteCount').textContent=state.read.size;persist();
 $('evidenceKind').textContent=data.kind;$('evidenceTitle').textContent=data.title;$('evidenceText').textContent=data.text;
 $('timeline').hidden=id!=='timeline';if(id==='timeline')buildTimeline();
 if(!$('evidenceDialog').open)$('evidenceDialog').showModal();
 if(NOVELS[state.genre].pages[state.page].scene===data.scene)stage?.focus(...data.position);
}
function buildTimeline(){
 const container=$('timeline').querySelector('.timeline-options');container.replaceChildren();
 const entries=[{time:'23:41',text:'히스가 전원을 복구했다.'},{time:'23:30',text:'주전원이 침수로 끊겼다.'},{time:'23:37',text:'창에서 세 번의 빛을 보냈다.'}];
 const expected=['23:30','23:37','23:41'];
 for(const entry of entries){const b=document.createElement('button');b.textContent=entry.time+' — '+entry.text;b.disabled=state.timeline.includes(entry.time);b.classList.toggle('done',b.disabled);b.addEventListener('click',()=>{
  if(entry.time===expected[state.timeline.length]){state.timeline.push(entry.time);if(state.timeline.length===3){state.solved=true;persist()}buildTimeline()}
  else{state.timeline=[];state.solved=false;buildTimeline();$('timelineStatus').textContent='이 기록보다 먼저 일어난 일이 있어요. 시각을 다시 살펴보세요.'}
 });container.append(b)}
 $('timelineStatus').textContent=state.solved?'열한 분이 이어졌어요. 불이 꺼졌다는 기록과, 빛이 남아 있었다는 기억은 함께 참이었어요.':state.timeline.length?state.timeline.join(' → '):'';
}
function openNotes(){
 $('notesList').replaceChildren();
 if(!state.read.size){const p=document.createElement('p');p.className='empty';p.textContent='장면 속 작은 빛이나 “기록 살펴보기”를 누르면, 읽은 기록이 여기 남아요.';$('notesList').append(p)}
 for(const id of state.read){const data=EVIDENCE[id],button=document.createElement('button'),small=document.createElement('small');button.className='note-item';button.textContent=data.title;small.textContent=data.kind;button.append(small);button.addEventListener('click',()=>{$('notesDialog').close();openEvidence(id)});$('notesList').append(button)}
 $('notesDialog').showModal();
}

// Browser-local synthesis: no external audio request and no autoplay.
async function toggleSound(){
 try{
  if(!audio){
   const Context=window.AudioContext||window.webkitAudioContext;const context=new Context(),volume=context.createGain();volume.gain.value=0;volume.connect(context.destination);
   const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),samples=buffer.getChannelData(0);let brown=0;
   for(let i=0;i<samples.length;i++){brown=(brown+Math.random()*.04-.02)/1.02;samples[i]=brown*3}
   const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;noise.connect(filter);filter.connect(volume);noise.start();
   const swell=context.createOscillator(),swellGain=context.createGain();swell.frequency.value=.13;swellGain.gain.value=250;swell.connect(swellGain);swellGain.connect(filter.frequency);swell.start();
   audio={context,volume};
  }
  await audio.context.resume();state.sound=!state.sound;audio.volume.gain.setTargetAtTime(state.sound?.15:0,audio.context.currentTime,.4);
  $('soundButton').setAttribute('aria-pressed',String(state.sound));$('soundButton').querySelector('img').src='./assets/icons/'+(state.sound?'speaker-high':'speaker-slash')+'.svg';
 }catch{toast('소리를 켜지 못했어요. 브라우저의 소리 설정을 확인해주세요.')}
}
document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden)audio.context.suspend();else if(state.sound)audio.context.resume()});

$('next').addEventListener('click',next);$('previous').addEventListener('click',()=>{if(state.page>0){state.page--;updatePage()}});
$('restart').addEventListener('click',()=>{state.page=0;state.choices={};showReading();updatePage()});
$('home').addEventListener('click',e=>{e.preventDefault();state.page=0;showReading();updatePage()});
document.querySelectorAll('[data-genre]').forEach(button=>button.addEventListener('click',()=>setGenre(button.dataset.genre)));
$('castButton').addEventListener('click',()=>$('castDialog').showModal());$('aboutButton').addEventListener('click',()=>$('aboutDialog').showModal());
document.querySelectorAll('dialog .close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('closeEvidence').addEventListener('click',()=>$('evidenceDialog').close());
$('hotspot').addEventListener('click',()=>openEvidence(hotspotId));$('inspectAction').addEventListener('click',()=>openEvidence(NOVELS[state.genre].pages[state.page].object));
$('notesButton').addEventListener('click',openNotes);$('soundButton').addEventListener('click',toggleSound);
$('toggleReading').addEventListener('click',()=>{const hidden=document.body.classList.toggle('landscape');$('reader').inert=hidden;$('toggleReading').querySelector('span').textContent=hidden?'이야기 보기':'풍경만 보기';$('toggleReading').setAttribute('aria-expanded',String(!hidden));});
$('zoomIn').addEventListener('click',()=>stage?.zoom(1.12));$('zoomOut').addEventListener('click',()=>stage?.zoom(1/1.12));
$('resetView').addEventListener('click',()=>{const p=NOVELS[state.genre].pages[state.page];stage?.setPage(state.genre,state.page,p.scene,p.shot)});$('overviewView').addEventListener('click',()=>stage?.overview());
$('saveScene').addEventListener('click',()=>{if(!stage){toast('입체 장면이 준비된 뒤 저장할 수 있어요.');return}const a=document.createElement('a');a.download='harbor-jelly-'+state.genre+'.png';a.href=stage.save();a.click()});
document.addEventListener('keydown',event=>{if(document.querySelector('dialog[open]')||document.body.classList.contains('landscape'))return;if(['BUTTON','INPUT','A'].includes(document.activeElement?.tagName))return;if(event.key==='ArrowRight'){event.preventDefault();next()}if(event.key==='ArrowLeft'&&state.page>0){event.preventDefault();state.page--;updatePage()}});
updatePage();
