export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const trailX=z=>Math.sin(z*.052)*4.6+Math.sin(z*.13)*.8+4*clamp((z-37)/7,0,1);
export const riverZ=x=>12+Math.sin(x*.065)*2.2;
export function forestHeight(x,z){
 const stream=Math.exp(-(((z-riverZ(x))/3.9)**2));
 const hill=.4+Math.max(0,z-20)*.13+.3*Math.sin(x*.17)*Math.cos(z*.11)+.11*Math.sin(x*.8+z*.4);
 return hill*(1-stream)-2.4*stream;
}
export function walkHeight(x,z){
 if(Math.abs(x-trailX(z))<1.65&&z>=37)return forestHeight(x,z)+7*clamp((z-37)/7,0,1);
 if(Math.abs(x-trailX(z))<1.65&&z>6.7&&z<17.5)return .75;
 return forestHeight(x,z);
}
export const destinations=[
 {id:'trail',label:'숲길',x:trailX(-33),z:-33,yaw:-.12,pitch:.04},
 {id:'river',label:'강가',x:trailX(5.5),z:5.5,yaw:-.07,pitch:-.04},
 {id:'lookout',label:'전망대',x:trailX(44),z:44,yaw:.04,pitch:-.06}
];
export function stepWalker(position,dx,dz,colliders){
 let x=clamp(position.x+dx,-24,24),z=clamp(position.z+dz,-42,45.5);
 if(z>=37)x=clamp(x,trailX(z)-.85,trailX(z)+.85);
 // The river can only be crossed on the timber bridge.
 if(Math.abs(z-riverZ(x))<5.15&&Math.abs(x-trailX(z))>1.35){x=position.x;z=position.z;}
 for(const c of colliders){const vx=x-c.x,vz=z-c.z,d=Math.hypot(vx,vz),min=c.r+.3;if(d<min&&d>1e-6){x=c.x+vx/d*min;z=c.z+vz/d*min;}}
 return {x,z};
}
