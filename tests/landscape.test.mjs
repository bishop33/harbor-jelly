import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight,cablePosition,balloonPosition,animalPosition,riverX} from '../dist/landscape-math.js';
import {buildNature} from '../dist/nature-world.js';

test('a complete cable-car trip keeps the cabin above the mountain terrain',()=>{
 for(let time=0;time<50;time+=.05)for(const direction of [-1,1]){const p=cablePosition(time,direction);assert.ok(p.y-terrainHeight('mountain',p.x,p.z)>1.1,'cabin intersects the mountain');assert.ok(p.progress>=0&&p.progress<=1);}
});
test('sheep remain on the meadow banks and the balloon stays inside the scene',()=>{
 for(let time=0;time<150;time+=.5){const b=balloonPosition(time);assert.ok(b.y>terrainHeight('meadow',b.x,b.z)+2.5);assert.ok(Math.abs(b.x)<8&&Math.abs(b.z)<8);for(let i=0;i<10;i++){const p=animalPosition(i,time);assert.ok(Math.abs(p.x-riverX(p.z))>1.2,'sheep walks into the river');assert.ok(Math.abs(p.x)<9&&Math.abs(p.z)<9);}}
});
test('both landscapes contain finite geometry and safely advance their weather and vehicles',()=>{
 for(const kind of ['mountain','meadow']){const world=buildNature(kind);for(const time of [0,20,80])world.update(time,.04,{wind:1,detail:true});world.root.updateMatrixWorld(true);assert.ok(world.features.trees>20);world.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry?.attributes.position)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});assert.ok(world.vehicle.position.toArray().every(Number.isFinite));}
});
