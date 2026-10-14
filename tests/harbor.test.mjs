import test from 'node:test';
import assert from 'node:assert/strict';
import {HarborCycle,WaveField} from '../dist/harbor-sim.js';
import {shipPose} from '../dist/harbor-motion.js';

test('two automatic voyages visit every operational phase and count completed cargo transfers',()=>{
 const cycle=new HarborCycle(),seen=new Set();for(let i=0;i<60*220;i++){cycle.step(1/60);seen.add(cycle.phase)}
 assert.deepEqual([...seen].sort(),['unload','load','booms','tug','depart','sail','return','berth'].sort());assert.equal(cycle.voyages,2);assert.ok(cycle.boxes>=28);assert.ok(cycle.progress>=0&&cycle.progress<=1);
});
test('early cast-off completes the transfer in progress, then a return command leaves the sea phase',()=>{
 const cycle=new HarborCycle();for(let i=0;i<300;i++)cycle.step(1/60);assert.equal(cycle.command(),true);assert.equal(cycle.phase,'unload');
 for(let i=0;i<90;i++)cycle.step(1/60);assert.equal(cycle.phase,'booms');assert.equal(cycle.boxes,2);
 for(let i=0;i<1100&&cycle.phase!=='sail';i++)cycle.step(1/60);assert.equal(cycle.phase,'sail');cycle.step(4);const progress=cycle.progress;cycle.command();assert.equal(cycle.phase,'return');assert.equal(cycle.returnStart,progress);
});
test('water impulses propagate, remain finite at maximum firmness, and settle after damping',()=>{
 const water=new WaveField(40);water.firmness=1;water.damping=1;water.impulse(2,4,.4,.8);
 for(let i=0;i<60;i++)water.step(1/120);const peak=Math.max(...water.h.map(Math.abs));assert.ok(peak>.001);assert.ok(water.h.every(Number.isFinite));
 for(let i=0;i<6000;i++)water.step(1/120);const settled=Math.max(...water.h.map(Math.abs));assert.ok(settled<peak*.1);assert.ok(water.h.every(v=>Number.isFinite(v)&&Math.abs(v)<=.28));water.reset();assert.equal(Math.max(...water.h),0);
});
test('the cargo hull clears the quay, fishing piers and breakwater through a complete voyage',()=>{
 const cycle=new HarborCycle();const obstacles=[[-9,9,-9,-3.24],[3.41,4.19,-3.2,-.5],[5.81,6.59,-3.2,-.5],[6.8,8.4,-3,4.2]];
 for(let i=0;i<60*100;i++){
  cycle.step(1/60);const {position,angle}=shipPose(cycle),c=Math.cos(angle),s=Math.sin(angle);const corners=[];
  for(const x of [-2.15,2.28])for(const z of [-.625,.625])corners.push([position.x+x*c+z*s,position.z-x*s+z*c]);
  const minx=Math.min(...corners.map(p=>p[0])),maxx=Math.max(...corners.map(p=>p[0])),minz=Math.min(...corners.map(p=>p[1])),maxz=Math.max(...corners.map(p=>p[1]));
  assert.ok(minx> -9&&maxx<9&&minz> -9&&maxz<9,'hull stays inside the basin');
  for(const [left,right,back,front] of obstacles)assert.ok(maxx<left||minx>right||maxz<back||minz>front,cycle.phase+' intersects a fixed harbor structure');
 }
});
