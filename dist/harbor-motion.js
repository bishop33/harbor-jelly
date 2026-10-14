import * as T from './vendor/three.module.js';
export const sailPath=new T.CatmullRomCurve3([[-3,.5],[0,2.1],[4,4.6],[2.6,6.6],[-3.6,6],[-5.8,2.4],[-3,.5]].map(([x,z])=>new T.Vector3(x,0,z)));
const smooth=v=>v*v*(3-2*v);
export function shipPose(cycle){let position=new T.Vector3(-3,0,-1.7),angle=0;const p=smooth(cycle.progress);
 if(cycle.phase==='depart'){position.z=T.MathUtils.lerp(-1.7,.5,p);angle=-.65*Math.max(0,(p-.7)/.3)}
 if(cycle.phase==='sail'){position=sailPath.getPoint(cycle.progress);const d=sailPath.getTangent(cycle.progress);angle=-Math.atan2(d.z,d.x)}
 if(cycle.phase==='return'){position=sailPath.getPoint(cycle.returnStart).lerp(new T.Vector3(-3,0,.5),p);angle=0}
 if(cycle.phase==='berth')position.z=T.MathUtils.lerp(.5,-1.7,p);
 return {position,angle};
}
