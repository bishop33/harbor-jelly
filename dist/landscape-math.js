// Shared deterministic terrain and routes. All coordinates use the same 18 m display plinth.
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const riverX=z=>Math.sin(z*.43)*2.1+Math.sin(z*.17+.7)*.55;
export function terrainHeight(kind,x,z){
 if(kind==='mountain'){
  const peak=(px,pz,sx,sz,h)=>h*Math.exp(-(((x-px)/sx)**2+((z-pz)/sz)**2));
  const raw=.34+peak(-4,-4,3.1,3.6,5.2)+peak(2,-6,2.5,2.7,6.2)+peak(6,-3.8,2.4,3.1,4.1)+peak(-6,1,2.5,2.6,1.65);
  const lake=Math.exp(-(((x-1.6)/3.3)**4+((z-3.5)/2.8)**4));
  return Math.max(.17,raw+(Math.sin(x*2.8+z*.7)+Math.sin(z*3.9-x))*.11*(1-lake)-lake*.65);
 }
 const raw=.48+1.4*Math.exp(-(((x+5)/4.8)**2+((z+4)/4.8)**2))+1.05*Math.exp(-(((x-5)/4.1)**2+((z+5)/4.4)**2))+.15*Math.sin(x*.6)*Math.cos(z*.45);
 const channel=Math.exp(-(((x-riverX(z))/1.06)**4));
 return Math.max(.19,raw*(1-channel)+.16*channel);
}
export function cablePosition(t,direction=1){const f=(Math.sin(t*.14*direction)+1)/2;return {x:-5+10*f,y:3.7+f*3.55-Math.sin(f*Math.PI)*.4,z:1.2-6.4*f,progress:f};}
export function balloonPosition(t){return {x:Math.cos(t*.075)*3.6,y:4.9+Math.sin(t*.14)*.45,z:Math.sin(t*.075)*3.6+1};}
export function animalPosition(i,t){const x=i%2?-4.6:4.8,z=1.5+(i%4)*1.25;return {x:x+Math.sin(t*.13+i*2.1)*.58,z:z+Math.cos(t*.1+i)*.46};}
