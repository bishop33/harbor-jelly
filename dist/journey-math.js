export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const shoreX=z=>-2+Math.sin(z*.09)*.55;
export const sandHeight=(x,z)=>.07+Math.max(-1.4,x-shoreX(z)-1.9)*.13;
export const waveFront=(t,z)=>shoreX(z)+2.2+Math.sin(t*.42+z*.09)*.8;
export class Footsteps{
 constructor(limit=96){this.limit=limit;this.reset()}
 reset(){this.items=[];this.last=null;this.side=1;this.total=0}
 move(x,z,time){if(!this.last){this.last={x,z};return false}const dx=x-this.last.x,dz=z-this.last.z,d=Math.hypot(dx,dz);if(d<.44)return false;if(d>2){this.last={x,z};return false}const yaw=Math.atan2(dx,dz),offset=.11*this.side;this.items.push({x:x+Math.cos(yaw)*offset,z:z-Math.sin(yaw)*offset,yaw,born:time,fade:1,side:this.side});if(this.items.length>this.limit)this.items.shift();this.total++;this.side*=-1;this.last={x,z};return true}
 wash(time,dt){for(const f of this.items){const covered=waveFront(time,f.z)>f.x;f.fade=Math.max(0,f.fade-dt*(covered?.15:.0006));}}
}
export const chapters=[
 {id:'train',name:'기차에 기대어',place:'THE WINDOW SEAT',next:'작은 역에 내리기',lines:[
 ['떠나도 괜찮은 아침','어디까지 가는 표인지,\n오늘은 자꾸 확인하지 않기로 했다.'],
 ['차창에 남은 도시','익숙한 건물들이 멀어졌다.\n유리에 비친 얼굴도 조금씩 편안해졌다.'],
 ['초록이 길어질수록','논과 작은 집, 이름 모를 숲.\n창밖에는 대답하지 않아도 되는 것들이 있었다.'],
 ['바다가 가까워졌다','나무 사이로 푸른 빛이 번졌다.\n문득, 다음 역에서 내려도 좋겠다고 생각했다.']]},
 {id:'forest',name:'숲의 속도로',place:'A PATH BETWEEN TREES',next:'바람을 따라 바다로',lines:[
 ['작은 역 뒤의 숲길','한 걸음 옮길 때마다\n젖은 흙과 풀 냄새가 조금씩 달라졌다.'],
 ['아주 작은 것들','꽃 위에 내려앉은 빛, 가지를 건너는 새.\n서두르지 않으니 보이는 것들이 있었다.'],
 ['잠깐 마주친 눈','작은 토끼가 길가에 멈춰 섰다.\n아무 말 없이, 서로의 하루를 지나갔다.'],
 ['숲 끝에서 들려오는 소리','잎이 흔들리는 소리 뒤로\n낮은 파도 소리가 천천히 가까워졌다.']]},
 {id:'beach',name:'발자국을 돌아보며',place:'WHERE THE DAY SOFTENS',next:'이 하루를 다시 걷기',lines:[
 ['바다에 닿은 오후','파도는 발끝 가까이 왔다가\n아무 일도 없었다는 듯 돌아갔다.'],
 ['모래가 기억하는 걸음','걸음을 옮길 때마다\n내가 지나온 자리가 조용히 남았다.'],
 ['뒤돌아본 자리','생각보다 긴 길을 걸어왔구나.\n오늘은, 그것만으로도 충분했다.'],
 ['조금 가벼워진 채로','파도가 발자국 몇 개를 지웠다.\n남겨두고 가도 되는 마음이 있을 것 같았다.']]}
];
