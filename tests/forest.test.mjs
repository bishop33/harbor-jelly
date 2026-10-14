import test from 'node:test';
import assert from 'node:assert/strict';
import {buildForest} from '../dist/forest-world.js';
import {trailX,walkHeight,forestHeight,riverZ,stepWalker} from '../dist/forest-math.js';

test('the full walking route crosses the bridge and reaches the elevated lookout without getting stuck',()=>{
 const world=buildForest();let p={x:trailX(-33),z:-33},bridge=false;
 for(let i=0;i<3500&&p.z<43.9;i++){const z=Math.min(44,p.z+2),yaw=Math.atan2(trailX(z)-p.x,z-p.z);p=stepWalker(p,Math.sin(yaw)*.032,Math.cos(yaw)*.032,world.colliders);assert.ok(Number.isFinite(walkHeight(p.x,p.z)));if(p.z>8&&p.z<16){bridge=true;assert.equal(walkHeight(p.x,p.z),.75);}}
 assert.ok(bridge);assert.ok(p.z>=43.9,'walker became stuck');assert.ok(walkHeight(p.x,p.z)>forestHeight(p.x,p.z)+6.8,'lookout is not elevated');
});
test('free movement cannot enter the river off the bridge or walk through a tree trunk',()=>{
 const p={x:-10,z:riverZ(-10)-5.3},blocked=stepWalker(p,0,1,[]);assert.deepEqual(blocked,p);
 const q=stepWalker({x:0,z:0},.7,0,[{x:1,z:0,r:.3}]);assert.ok(Math.hypot(q.x-1,q.z)>=.599);
});
