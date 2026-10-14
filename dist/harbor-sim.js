export class WaveField{
 constructor(n=80,size=18){this.n=n;this.size=size;this.h=new Float32Array(n*n);this.v=new Float32Array(n*n);this.next=new Float32Array(n*n);this.firmness=.4;this.damping=.35;this.tide=0;}
 index(x,z){return Math.max(1,Math.min(this.n-2,Math.round((x/this.size+.5)*(this.n-1))))+Math.max(1,Math.min(this.n-2,Math.round((z/this.size+.5)*(this.n-1))))*this.n}
 height(x,z){return .16+this.tide+this.h[this.index(x,z)]}
 impulse(x,z,power=.22,radius=.6){const n=this.n;for(let j=1;j<n-1;j++)for(let i=1;i<n-1;i++){const wx=(i/(n-1)-.5)*this.size,wz=(j/(n-1)-.5)*this.size;if(wz< -3.05)continue;const d=((wx-x)**2+(wz-z)**2)/radius**2;if(d<8)this.v[j*n+i]+=power*Math.exp(-d)*3}}
 step(dt){const n=this.n,h=this.h,v=this.v,speed=15+this.firmness*45,decay=Math.exp(-dt*(.25+this.damping*3));
  for(let j=1;j<n-1;j++)for(let i=1;i<n-1;i++){const k=j*n+i;if((j/(n-1)-.5)*this.size< -3.05){v[k]=h[k]=0;continue}const lap=h[k-1]+h[k+1]+h[k-n]+h[k+n]-4*h[k];v[k]=(v[k]+lap*speed*dt)*decay;this.next[k]=Math.max(-.28,Math.min(.28,h[k]+v[k]*dt));}
  [this.h,this.next]=[this.next,this.h];
 }
 reset(){this.h.fill(0);this.v.fill(0);this.next.fill(0)}
}
export const DURATIONS={unload:24,load:18,booms:3,tug:5,depart:8,sail:30,return:10,berth:8};
const phases=Object.keys(DURATIONS);
export class HarborCycle{
 constructor(){this.reset()}
 reset(){this.phase='unload';this.elapsed=0;this.boxes=0;this.voyages=0;this.request=false;this.lastBatch=0;this.returnStart=0;}
 command(){if(this.phase==='sail'){this.returnStart=this.progress;this.phase='return';this.elapsed=0;return true}if(['unload','load'].includes(this.phase)){this.request=true;return true}return false}
 get progress(){return Math.min(1,this.elapsed/DURATIONS[this.phase])}
 step(dt){this.elapsed+=dt;
  if(['unload','load'].includes(this.phase)){const batch=Math.min(Math.floor(this.elapsed/6),DURATIONS[this.phase]/6);if(batch>this.lastBatch){this.boxes+=(batch-this.lastBatch)*2;this.lastBatch=batch;}if(this.request&&batch>0&&this.elapsed%6<dt+.00001){this.phase='booms';this.elapsed=0;this.lastBatch=0;this.request=false;return}}
  if(this.elapsed>=DURATIONS[this.phase]){const index=phases.indexOf(this.phase);if(this.phase==='berth')this.voyages++;if(this.phase==='sail')this.returnStart=1;this.phase=phases[(index+1)%phases.length];this.elapsed=0;this.lastBatch=0;}
 }
 get label(){return {unload:'하역 중',load:'적재 중',booms:'크레인 붐 올리는 중',tug:'예인선 접근',depart:'출항 중',sail:'항구를 항해하는 중',return:'귀항 중',berth:'접안 중'}[this.phase]}
}
