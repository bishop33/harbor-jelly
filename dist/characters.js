import * as THREE from 'three';

export const CHARACTERS={
 Bishop:{name:'Bishop',ko:'비숍',role:'돌아온 주인공',color:'#387c80',skin:'#e4b88d',hair:'#302c31',description:'떠난 항구로 돌아온 비숍. 오래된 친구들 사이에서, 자신이 놓친 기억과 미처 전하지 못한 마음을 마주한다.'},
 Tate:{name:'Tate',ko:'테이트',role:'사진과 기록을 남기는 사람',color:'#bb8e4e',skin:'#dfb38d',hair:'#69503a',description:'사진가이자 항구의 기록자. 낡은 사진의 작은 차이와, 친구들이 말하지 않은 순간을 알아차린다.'},
 Huni:{name:'Huni',ko:'후니',role:'밤바다를 건너는 선장',color:'#6d966f',skin:'#eac8a0',hair:'#343c32',description:'작은 우편배의 선장. 농담을 아끼지 않지만, 돌아오는 길과 친구들의 약속만큼은 진지하게 지킨다.'},
 Heath:{name:'Heath',ko:'히스',role:'불빛을 고치는 사람',color:'#647696',skin:'#cfa384',hair:'#443a35',description:'등대와 부표를 돌보는 정비사. 말수는 적어도 가장 먼저 손을 내민다. 손에 든 램프는 늘 켜져 있다.'},
 Eve:{name:'Eve',ko:'이브',role:'지도와 편지를 복원하는 사람',color:'#b76f86',skin:'#efd0ad',hair:'#4f303e',description:'오래된 지도와 편지를 복원하는 여성. 비숍의 오랜 친구이며, 그의 기억에서 가장 선명하게 남은 사람이다.'}
};

export function portraitSvg(id){
 const d=CHARACTERS[id];
 const hair=id==='Eve'?'<path d="M19 31Q17 12 32 12Q49 12 46 37L48 51H17Z" fill="'+d.hair+'"/>':'<path d="M20 26Q17 11 32 12Q48 12 45 28L39 20L21 25Z" fill="'+d.hair+'"/>';
 const detail=id==='Tate'?'<path d="M16 18H48M23 18L25 9H40L42 18" fill="#6e5436" stroke="#6e5436" stroke-width="3"/>':id==='Huni'?'<g fill="none" stroke="#37443a" stroke-width="2"><circle cx="27" cy="30" r="5"/><circle cx="38" cy="30" r="5"/><path d="M32 30H33"/></g>':id==='Heath'?'<path d="M21 35Q32 48 44 35L40 43H26Z" fill="'+d.hair+'"/><path d="M19 21Q21 9 33 9Q45 9 46 22" fill="#61718c"/>':id==='Eve'?'<path d="M42 17L50 21L42 24Z" fill="#ead09b"/>':'<path d="M25 47L38 47L34 62H26Z" fill="#d9b56d"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="'+d.color+'"/><circle cx="32" cy="31" r="21" fill="#ffffff15"/>'+hair+'<path d="M13 64V53Q32 39 51 53V64Z" fill="'+d.color+'"/><rect x="27" y="38" width="11" height="13" rx="4" fill="'+d.skin+'"/><ellipse cx="32" cy="30" rx="12" ry="15" fill="'+d.skin+'"/><circle cx="27" cy="30" r="1.2" fill="#40342e"/><circle cx="38" cy="30" r="1.2" fill="#40342e"/><path d="M29 37Q32 40 35 37" fill="none" stroke="#a77063" stroke-width="1.3"/>'+detail+'</svg>';
}

export class CharacterCast{
 constructor(world,clickTargets){
  this.actors={};
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.85});
  const add=(parent,g,m,p)=>{const mesh=new THREE.Mesh(g,m);mesh.position.set(...p);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
  for(const [id,d] of Object.entries(CHARACTERS)){
   const root=new THREE.Group(),model=new THREE.Group();root.add(model);world.add(root);
   const coat=material(d.color),skin=material(d.skin),hair=material(d.hair),dark=material('#34383e'),gold=material('#dfbd79');
   add(model,new THREE.CylinderGeometry(.14,id==='Eve'?.23:.18,.39,18),coat,[0,.38,0]);
   add(model,new THREE.SphereGeometry(.135,18,12),skin,[0,.71,0]);
   const crown=add(model,new THREE.SphereGeometry(.142,18,12),hair,[0,.766,-.035]);crown.scale.set(1,.68,1);
   if(id==='Eve'){
    const back=add(model,new THREE.SphereGeometry(.14,16,12),hair,[0,.65,-.09]);back.scale.set(1,1.45,.55);
    add(model,new THREE.SphereGeometry(.055,12,8),gold,[.12,.76,-.02]);
   }
   const eyes=material('#2b2928');for(const x of [-.047,.047])add(model,new THREE.SphereGeometry(.011,8,6),eyes,[x,.721,.122]);
   add(model,new THREE.SphereGeometry(.018,8,6),skin,[0,.683,.133]);
   const arms=[];
   for(const x of [-.18,.18]){
    const arm=add(model,new THREE.CapsuleGeometry(.034,.2,4,8),coat,[x,.43,0]);arm.rotation.z=x<0?.12:-.12;arms.push(arm);
    add(model,new THREE.SphereGeometry(.035,10,8),skin,[x,.285,.01]);
   }
   const legs=[];for(const x of [-.075,.075]){
    const leg=add(model,new THREE.CapsuleGeometry(.034,.13,4,8),dark,[x,.13,0]);legs.push(leg);
    const boot=add(model,new THREE.SphereGeometry(.047,10,8),dark,[x,.044,.025]);boot.scale.set(1,.65,1.4);
   }
   if(id==='Bishop'){add(model,new THREE.BoxGeometry(.21,.047,.16),gold,[0,.56,.018]);add(model,new THREE.BoxGeometry(.07,.21,.025),gold,[-.045,.44,.16])}
   if(id==='Tate'){
    add(model,new THREE.CylinderGeometry(.19,.19,.025,18),material('#765536'),[0,.825,0]);
    add(model,new THREE.CylinderGeometry(.115,.13,.085,16),material('#765536'),[0,.87,0]);
    add(model,new THREE.BoxGeometry(.18,.15,.075),dark,[0,.37,.18]);add(model,new THREE.CylinderGeometry(.045,.045,.055,12),dark,[0,.38,.235]).rotation.x=Math.PI/2;
   }
   if(id==='Huni'){
    for(const x of [-.047,.047]){const glasses=add(model,new THREE.TorusGeometry(.035,.006,6,20),dark,[x,.721,.133]);glasses.rotation.y=0}
    add(model,new THREE.BoxGeometry(.035,.009,.008),dark,[0,.721,.141]);
    add(model,new THREE.CylinderGeometry(.145,.15,.045,18),material('#f2e6d0'),[0,.812,0]);
    add(model,new THREE.BoxGeometry(.15,.026,.065),dark,[0,.817,.117]);
   }
   if(id==='Heath'){
    add(model,new THREE.SphereGeometry(.142,16,10),coat,[0,.79,-.015]).scale.set(1,.5,1);
    add(model,new THREE.SphereGeometry(.096,14,10),hair,[0,.64,.05]).scale.set(1,.6,1);
    const lampMat=material('#ebce8d');lampMat.emissive.set('#edbb65');lampMat.emissiveIntensity=1.6;
    add(model,new THREE.CylinderGeometry(.065,.065,.13,12),lampMat,[.23,.22,.045]);
   }
   const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=72;
   const g=labelCanvas.getContext('2d');g.fillStyle='#152a30d9';g.beginPath();g.roundRect(4,4,248,64,18);g.fill();g.fillStyle='#fff6df';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText(d.name,128,46);
   const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(labelCanvas),transparent:true,depthWrite:false}));label.position.set(0,1.13,0);label.scale.set(.64,.18,1);root.add(label);
   const target=add(root,new THREE.SphereGeometry(.35,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.5,0]);target.castShadow=false;target.userData.action='character';target.userData.character=id;clickTargets.unshift(target);
   const initial=new THREE.Vector3(-4.3+Object.keys(this.actors).length, .74,-3.35);root.position.copy(initial);
   root.visible=false;
   this.actors[id]={root,model,label,arms,legs,targetPosition:initial.clone(),targetScale:1,boat:false,phase:Object.keys(this.actors).length*1.2};
  }
 }
 layout(placements){
  for(const [id,a] of Object.entries(this.actors)){
   const pose=placements[id];
   if(pose){if(!a.root.visible)a.root.scale.setScalar(.05);a.root.visible=true;a.boat=!!pose.boat;a.targetScale=pose.scale||1;if(pose.position)a.targetPosition.set(...pose.position);a.offset=pose.offset||[0,.42,0]}
   else a.root.visible=false;
  }
 }
 focus(id){const a=this.actors[id];if(!a.root.visible){a.root.visible=true;a.root.scale.setScalar(1);a.boat=false;a.root.position.copy(a.targetPosition)}return a.root.position.clone().add(new THREE.Vector3(0,.55,0))}
 update(t,dt,boat){
  for(const a of Object.values(this.actors))if(a.root.visible){
   if(a.boat){a.root.position.copy(boat.localToWorld(new THREE.Vector3(...a.offset)));a.root.rotation.y=boat.rotation.y}
   else {a.root.position.lerp(a.targetPosition,1-Math.exp(-dt*4));a.root.rotation.y=0}
   const size=THREE.MathUtils.lerp(a.root.scale.x,a.targetScale,1-Math.exp(-dt*5));a.root.scale.setScalar(size);
   const walking=!a.boat&&a.root.position.distanceTo(a.targetPosition)>.07;
   a.model.position.y=Math.sin(t*1.4+a.phase)*.008;
   a.arms.forEach((arm,i)=>arm.rotation.x=walking?Math.sin(t*8+i*Math.PI)*.35:Math.sin(t*1.8+a.phase)*.04);
   a.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(t*8+i*Math.PI)*.25:0);
  }
 }
}
