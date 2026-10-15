import test from 'node:test';
import assert from 'node:assert/strict';
import {Footsteps,waveFront,shoreX,sandHeight} from '../dist/journey-math.js';

test('real walking leaves alternating footprints, resting and scene jumps leave none',()=>{
 const feet=new Footsteps(12);feet.move(1.2,0,0);for(let i=1;i<=20;i++)feet.move(1.2,i*.5,i*.5);
 assert.equal(feet.total,20);assert.equal(feet.items.length,12);for(let i=1;i<feet.items.length;i++)assert.notEqual(feet.items[i].side,feet.items[i-1].side);
 const before=feet.total;feet.move(1.2,10,15);feet.move(1.2,30,16);assert.equal(feet.total,before);assert.ok(feet.items.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.z)));
});
test('shallow waves wash the sea-facing footprints while dry sand preserves the trail',()=>{
 const feet=new Footsteps();feet.items=[{x:-.5,z:0,fade:1},{x:5,z:0,fade:1}];for(let t=0;t<15;t+=.1)feet.wash(t,.1);
 assert.ok(feet.items[0].fade<.5);assert.ok(feet.items[1].fade>.98);
 for(let z=-40;z<40;z++){assert.ok(waveFront(3,z)>shoreX(z));assert.ok(Number.isFinite(sandHeight(2,z)));}
});
