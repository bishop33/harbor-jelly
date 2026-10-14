import * as T from 'three';

const mats=new Map(),geometries=new Map();
const material=(color,metalness=0,roughness=.65)=>{const key=[color,metalness,roughness].join();if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return mats.get(key)};
const geo=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)};
function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
const box=(p,x,y,z,w,h,d,m)=>{const o=mesh(p,geo('box',()=>new T.BoxGeometry(1,1,1)),m,x,y,z);o.scale.set(w,h,d);return o};
const cyl=(p,x,y,z,r,h,m,top=r,n=12)=>mesh(p,geo(['c',r,h,top,n].join(),()=>new T.CylinderGeometry(top,r,h,n)),m,x,y,z);
const ball=(p,x,y,z,r,m,s=[1,1,1])=>{const o=mesh(p,geo('sphere',()=>new T.SphereGeometry(1,12,8)),m,x,y,z);o.scale.set(r*s[0],r*s[1],r*s[2]);return o};
const beam=(p,a,b,r,m)=>{const v=new T.Vector3(...a),w=new T.Vector3(...b),delta=w.clone().sub(v),o=cyl(p,0,0,0,r,delta.length(),m,r,6);o.position.copy(v.add(w).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o};
const cream=material('#f3eee0'),stone=material('#c6c5b7'),dark=material('#415252'),wood=material('#a18b65'),rubber=material('#313c3c'),red=material('#c06b59'),roof=material('#ad6d52'),green=material('#6d9573'),brass=material('#b9a572',.35,.32);
const paints=['#bd6858','#d5ac64','#668f9d','#83aa9c','#dfcbb4','#b9858e','#7895b4','#8b9d72','#c88455','#94b4b3'].map(c=>material(c,.1,.5));
const glass=new T.MeshStandardMaterial({color:'#b4d8db',metalness:.3,roughness:.22,emissive:'#b1a66e',emissiveIntensity:.06});

function house(parent,x,y,z,w,h,d,color,index){
 const g=new T.Group();g.position.set(x,y,z);parent.add(g);
 box(g,0,h/2,0,w,h,d,color);box(g,0,.06,0,w*1.04,.12,d*1.04,stone);
 const shape=new T.Shape();shape.moveTo(-w*.54,0);shape.lineTo(0,.34);shape.lineTo(w*.54,0);shape.closePath();
 const rg=new T.ExtrudeGeometry(shape,{depth:d*1.08,bevelEnabled:false});mesh(g,rg,roof,0,h,-d*.54);
 for(let k=0;k<8;k++){const off=(k-3.5)*d/7;for(const side of [-1,1]){const tile=box(g,side*w*.28,h+.17,off,w*.58,.025,d/8.6,index%3===0?dark:roof);tile.rotation.z=-side*Math.atan(.34/(w*.54));}}
 box(g,0,h+.34,0,.035,.035,d*1.1,roof);
 for(const side of [-1,1]){
  for(let row=0;row<Math.max(1,Math.floor(h/.43));row++)for(let col=0;col<2;col++){
   const xx=(col-.5)*w*.46,yy=.25+row*.43,zz=side*(d/2+.012);
   box(g,xx,yy,zz,.19,.23,.035,cream);box(g,xx,yy,zz+side*.021,.14,.18,.025,glass);
   box(g,xx,yy,zz+side*.039,.013,.19,.015,cream);box(g,xx,yy-.125,zz+side*.05,.22,.028,.07,stone);
  }
 }
 box(g,0,.2,d/2+.04,.15,.34,.055,dark);ball(g,.047,.18,d/2+.08,.01,brass);
 box(g,0,.023,d/2+.16,.26,.045,.24,stone);cyl(g,w*.27,h+.21,-d*.22,.037,.39,stone,.044,8);
 for(const side of [-1,1]){box(g,side*w*.5,h*.5,d*.5+.015,.025,h,.035,cream);box(g,side*w*.55,h+.1,-d*.51,.018,.018,d*1.1,dark);}
 if(index%4===0){box(g,0,.57,d/2+.12,w*.7,.055,.24,red);for(const side of [-1,1])box(g,side*w*.32,.38,d/2+.22,.025,.38,.025,wood)}
}
function container(parent,x,y,z,w=.66,h=.33,d=.33,index=0){
 const g=new T.Group();g.position.set(x,y,z);parent.add(g);const m=paints[index%paints.length];box(g,0,0,0,w,h,d,m);
 for(let i=0;i<9;i++)for(const side of [-1,1])box(g,(i-4)*w/10,0,side*(d/2+.008),.014,h*.91,.02,m);
 for(const end of [-1,1]){box(g,end*w/2,0,0,.023,h*.97,.012,dark);for(const zc of [-.075,.075]){box(g,end*(w/2+.012),0,zc,.018,h*.85,.012,brass)}}
 for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])box(g,xx,0,zz,.023,h,.026,m);
 return g;
}
function hull(parent,len,width,color){
 const shape=new T.Shape();shape.moveTo(-len*.48,-width*.44);shape.lineTo(len*.27,-width*.5);shape.quadraticCurveTo(len*.54,-width*.24,len*.53,0);shape.quadraticCurveTo(len*.54,width*.24,len*.27,width*.5);shape.lineTo(-len*.48,width*.44);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelSize:.025,bevelThickness:.035,bevelSegments:2});geometry.rotateX(Math.PI/2);mesh(parent,geometry,material(color,.12,.4),0,.08,0);
 const lower=geometry.clone();lower.scale(.96,.36,.96);mesh(parent,lower,red,0,-.16,0);
 box(parent,-len*.05,.1,0,len*.83,.045,width*.88,wood);
 return geometry;
}
function boat(parent,len,width,color,tug=false){
 const g=new T.Group();parent.add(g);hull(g,len,width,color);
 box(g,-len*.27,.36,0,len*.22,.49,width*.76,cream);box(g,-len*.27,.63,0,len*.27,.035,width*.85,tug?red:cream);
 for(const side of [-1,1]){for(let i=0;i<3;i++)box(g,-len*.33+i*len*.07,.48,side*width*.395,len*.055,.14,.018,glass);beam(g,[-len*.4,.23,side*width*.49],[len*.34,.23,side*width*.49],.01,cream)}
 cyl(g,-len*.3,.82,0,.045,.35,dark);cyl(g,-len*.3,.85,0,.048,.055,brass);
 beam(g,[-len*.18,.61,0],[-len*.18,1.05,0],.012,dark);const radar=box(g,-len*.18,1.05,0,.23,.025,.055,cream);
 if(tug)for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const ring=mesh(g,geo('tugtyre',()=>new T.TorusGeometry(.065,.027,6,10)),rubber,Math.cos(a)*len*.41,.1,Math.sin(a)*width*.52);ring.rotation.y=a;}
 return {g,radar};
}
function crane(parent,x,index){
 const g=new T.Group();g.position.set(x,.68,-3.8);parent.add(g);const m=material(index?'#557e99':'#c27158',.25,.43);
 for(const xx of [-.43,.43])for(const zz of [-.42,.42]){
  box(g,xx,1.37,zz,.12,2.74,.15,m);box(g,xx,.13,zz,.25,.12,.3,dark);for(const zx of [-.1,.1])cyl(g,xx,.065,zz+zx,.047,.04,rubber,.047,8).rotation.z=Math.PI/2;
 }
 for(const zz of [-.42,.42])beam(g,[-.43,.15,zz],[.43,2.62,zz],.025,m);
 box(g,0,2.7,0,1.09,.21,1.1,m);box(g,.34,2.97,-.38,.32,.29,.38,cream);box(g,.35,3.01,-.17,.25,.15,.018,glass);
 beam(g,[-.25,2.85,0],[-.25,4,-.4],.047,m);beam(g,[.25,2.85,0],[.25,4,-.4],.047,m);beam(g,[-.25,4,-.4],[.25,4,-.4],.04,m);
 for(const xx of [-.3,.3])beam(g,[xx,4,-.4],[xx,2.9,-1.75],.018,dark);
 const boom=new T.Group();boom.position.set(0,2.85,0);g.add(boom);
 for(const xx of [-.3,.3]){beam(boom,[xx,0,-1.75],[xx,0,2.5],.055,m);beam(boom,[xx,0,0],[xx,1.15,-.4],.017,dark)}
 for(let z=-1.6;z<2.5;z+=.32)beam(boom,[-.3,0,z],[.3,0,z+.25],.025,m);
 const trolley=new T.Group();g.add(trolley);box(trolley,0,2.97,0,.7,.12,.37,dark);box(trolley,.29,2.72,0,.19,.38,.24,cream);box(trolley,.3,2.76,.125,.14,.23,.012,glass);
 const hook=new T.Group();g.add(hook);box(hook,0,0,0,.71,.1,.34,material('#d8b550',.35,.45));const cargo=container(hook,0,-.21,0,.65,.33,.31,index+1);
 const cables=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(24),3)),new T.LineBasicMaterial({color:'#414c4b'}));g.add(cables);
 return {g,boom,trolley,hook,cargo,cables,index};
}
function batchStatic(root){
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)});
 const batched=new T.Group();for(const meshes of groups.values()){const m=new T.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((o,i)=>{m.setMatrixAt(i,o.matrixWorld);o.removeFromParent()});m.castShadow=true;m.receiveShadow=true;batched.add(m)}root.add(batched);
}

export function buildHarbor(world,waves){
 const fixed=new T.Group();world.add(fixed);
 for(let i=0;i<4;i++)box(fixed,0,-1.62+i*.11,0,18,.11,18,material(['#b6a386','#cfb68e','#e1c9a0','#ede0bf'][i]));
 const floorGeo=new T.PlaneGeometry(18,18);floorGeo.rotateX(-Math.PI/2);
 const caustic=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec3 p;void main(){float a=sin(p.x*7.+sin(p.z*4.+time*.7)*1.7+time*.6);float b=sin(p.z*8.+sin(p.x*5.-time*.5)*1.6);float c=pow(max(0.,1.-abs(a+b)*1.8),3.);gl_FragColor=vec4(vec3(.43,.54,.41)+c*.18,1.);}' });mesh(world,floorGeo,caustic,0,-1.17,0);
 box(fixed,0,-.15,-6.12,18,1.75,5.76,stone);box(fixed,-4.7,.742,-4.73,8.3,.07,2.68,material('#727b75'));
 for(let x=-8.3;x< -.9;x+=.67){box(fixed,x,.786,-4.4,.016,.008,2.1,cream)}
 for(const z of [-4.12,-3.6])box(fixed,-4.6,.794,z,8.3,.035,.025,dark);
 for(let i=0;i<45;i++){const x=-8.7+i*.39;box(fixed,x,.73,-3.25,.34,.055,.19,cream);if(i%3===0){cyl(fixed,x,.82,-3.15,.045,.16,dark,.05,8);cyl(fixed,x,.88,-3.15,.07,.035,dark,.07,8)}}
 for(let i=0;i<15;i++){const x=-8.2+i*1.13;const f=mesh(fixed,geo('fender',()=>new T.TorusGeometry(.14,.045,7,14)),rubber,x,.18,-3.225);for(const xx of [-.2,.2])beam(fixed,[x+xx,.72,-3.23],[x+xx,.32,-3.26],.013,dark);f.rotation.y=0;}
 for(const x of [-7.6,-1.5,3.1]){for(let y=-.8;y<.7;y+=.15)beam(fixed,[x-.1,y,-3.31],[x+.1,y,-3.31],.012,brass);for(const xx of [-.11,.11])beam(fixed,[x+xx,-1,-3.31],[x+xx,.85,-3.31],.017,dark)}
 for(let row=0;row<3;row++)for(let i=0;i<10;i++){const x=-8.05+i*1.65+(row%2)*.22,z=-5.4-row*1.14,y=.8+row*.24;house(fixed,x,y,z,.73+(i%3)*.11,.88+(i%4)*.2,.77,paints[(i+row*3)%10],i+row);}
 for(let row=0;row<3;row++)for(let i=0;i<10;i++)for(let level=0;level<1+(i+row)%3;level++)container(fixed,-8+i*.7,.98+level*.345,-4.2-row*.47,.64,.32,.34,i+row+level*4);
 house(fixed,2,.88,-7.65,1.05,1.48,1.13,cream,0);box(fixed,2,2.48,-7.3,.43,.92,.47,cream);mesh(fixed,new T.ConeGeometry(.38,.85,4),material('#71958b',.2,.6),2,3.35,-7.3).rotation.y=Math.PI/4;for(const zz of [-7.55,-7.05])box(fixed,2,2.64,zz,.17,.29,.014,dark);
 for(let i=0;i<15;i++){const x=-8+i*1.12,z=-8.44+(i%3)*.16;cyl(fixed,x,1.25,z,.045,.7,wood,.03,7);for(let j=0;j<5;j++)ball(fixed,x+Math.cos(j*2.4)*.16,1.55+(j%2)*.12,z+Math.sin(j*2.4)*.15,.24,green,[1,1.2,1]);}
 for(const x of [-7.9,-5.9,-3.9,-1.9,1,3.6,5.7,7.6]){cyl(fixed,x,1.11,-3.48,.024,.74,dark,.024,8);box(fixed,x,1.51,-3.48,.12,.17,.12,glass);mesh(fixed,new T.ConeGeometry(.1,.06,4),dark,x,1.62,-3.48).rotation.y=Math.PI/4;}
 for(let i=0;i<14;i++)for(let j=0;j<5;j++)box(fixed,.65+i*.55+(j%2)*.25,.772,-3.7-j*.26,.51,.016,.22,i%3?cream:stone);
 for(const x of [3.8,6.2]){for(let i=0;i<25;i++)box(fixed,x,.48,-3.13+i*.105,.78,.075,.098,wood);for(const z of [-2.8,-1.9,-1.05])for(const xx of [-.31,.31]){cyl(fixed,x+xx,-.28,z,.039,1.58,wood,.045,8);ball(fixed,x+xx,-.8,z,.085,green,[1,.9,1]);}for(const z of [-2.75,-1.4])beam(fixed,[x-.3,-.8,z],[x+.3,.42,z+.4],.024,wood);}
 house(fixed,5.4,.8,-4.4,1.3,.61,.67,material('#bcc9c3'),2);
 for(let i=0;i<58;i++){const z=-2.8+(i%19)*.35,x=7.6+Math.sin(i*2.4)*.45;ball(fixed,x,-.3+(i%3)*.26,z,.24+(i%4)*.07,i%3?stone:dark,[1.1,.85,1]);}box(fixed,7.55,.19,.23,.64,.15,6.9,stone);
 const lx=7.5,lz=3.36;for(let i=0;i<5;i++)cyl(fixed,lx,.54+i*.43,lz,.27-i*.012,.43,i%2?red:cream,.26-i*.012,24);
 cyl(fixed,lx,2.72,lz,.46,.09,dark,.46,24);cyl(fixed,lx,2.94,lz,.25,.35,glass,.25,20);cyl(fixed,lx,3.15,lz,.33,.09,red,.33,20);mesh(fixed,new T.ConeGeometry(.33,.27,20),red,lx,3.33,lz);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;beam(fixed,[lx+Math.cos(a)*.4,2.74,lz+Math.sin(a)*.4],[lx+Math.cos(a)*.4,2.99,lz+Math.sin(a)*.4],.008,cream);}const ring=mesh(fixed,new T.TorusGeometry(.4,.014,6,32),cream,lx,2.99,lz);ring.rotation.x=Math.PI/2;
 for(let i=0;i<55;i++){const x=Math.sin(i*5.4)*8.2,z=-2.1+((i*7)%100)/100*10.2;ball(fixed,x,-1.12,z,.06+(i%5)*.024,i%4?stone:green,[1.4,.5,1]);if(i%3===0){for(let j=0;j<3;j++)beam(fixed,[x,-1.14,z],[x+.04*Math.sin(j),-.71-(j%2)*.1,z+.04*j],.012,green)}}
 for(let i=0;i<9;i++){const x=-7+(i*2.1)%15,z=(i*1.2)%7;for(let a=0;a<5;a++)beam(fixed,[x,-1.1,z],[x+Math.cos(a*Math.PI*.4)*.13,-1.1,z+Math.sin(a*Math.PI*.4)*.13],.027,material('#d48f63'));}
 const anchor=new T.Group();anchor.position.set(-4,-1.1,3);fixed.add(anchor);beam(anchor,[-.25,0,0],[.25,0,0],.022,dark);beam(anchor,[0,0,-.2],[0,0,.25],.026,dark);for(const side of [-1,1])beam(anchor,[0,0,.25],[side*.2,0,.1],.02,dark);
 const tyre=mesh(fixed,new T.TorusGeometry(.17,.053,8,16),rubber,-6,-1.05,5);tyre.rotation.x=Math.PI/2;
 batchStatic(fixed);
 const ship=boat(world,4.3,1.25,'#334c62'),tug=boat(world,1.18,.56,'#303e3e',true);ship.g.position.set(-3,.22,-1.7);tug.g.position.set(-6,.22,.2);
 const cargo=[];for(let level=1;level>=0;level--)for(let i=0;i<6;i++)for(let row=0;row<4;row++){const c=container(ship.g,-.9+i*.45,.35+level*.24,(row-1.5)*.27,.42,.22,.25,i+row+level*3);cargo.push(c)}
 const cranes=[crane(world,-4.65,0),crane(world,-1.2,1)];
 const floating=[];for(const [x,z,c] of [[3.16,-1.6,'#527f91'],[6.86,-2.1,'#9a615b']]){const b=boat(world,.82,.33,c,true);b.g.position.set(x,.23,z);b.g.rotation.y=Math.PI/2;box(b.g,.16,.2,0,.2,.16,.22,wood);cyl(b.g,.24,.29,0,.085,.06,brass,.085,12);floating.push({g:b.g,x,z});}
 for(const [x,z] of [[-7.3,6.5],[6.1,7.2]]){const b=boat(world,.94,.32,'#d8e2dd');b.g.position.set(x,.23,z);beam(b.g,[.1,.3,0],[.1,1.2,0],.012,dark);box(b.g,.1,.87,0,.045,.6,.07,cream);floating.push({g:b.g,x,z});}
 for(const [x,z,c] of [[-7,1.4,'#c6b352'],[6.9,5.8,'#cbb052'],[1,7.5,'#709787']]){const g=new T.Group();world.add(g);g.position.set(x,.16,z);cyl(g,0,.08,0,.13,.18,material(c),.09);beam(g,[0,.13,0],[0,.65,0],.018,dark);ball(g,0,.64,0,.035,brass);floating.push({g,x,z});}
 const lifeRing=mesh(world,new T.TorusGeometry(.24,.075,10,28),new T.MeshStandardMaterial({color:'#e79454',roughness:.35}),3.1,.2,-.48);lifeRing.rotation.x=Math.PI/2;lifeRing.userData.action='ring';
 const fish=[];for(let i=0;i<52;i++){const g=new T.Group();world.add(g);const fm=material(i%5===0?'#d9934e':i%2?'#658e9b':'#bbc5b7',.35,.38);ball(g,0,0,0,.075,fm,[1.8,.55,.55]);const tail=mesh(g,new T.ConeGeometry(.055,.09,3),fm,-.16,0,0);tail.rotation.z=Math.PI/2;ball(g,.09,.015,.034,.008,dark);fish.push({g,x:Math.sin(i*8)*7,z:-2+(i%17)*.57,y:-.85+(i%4)*.16,phase:i*1.73});}
 const jelly=[];for(let i=0;i<6;i++){const g=new T.Group();world.add(g);g.position.set(-5+i*2.1,-.43,1.3+(i%3)*2.1);ball(g,0,0,0,.16,new T.MeshPhysicalMaterial({color:'#d1b6d0',transmission:.85,thickness:.15,roughness:.1,transparent:true,opacity:.8}),[1,.55,1]);for(let j=0;j<7;j++){const points=[new T.Vector3(Math.cos(j)*.1,-.04,Math.sin(j)*.1),new T.Vector3(Math.cos(j)*.14,-.17,Math.sin(j)*.14),new T.Vector3(Math.cos(j)*.17,-.35,Math.sin(j)*.17)];g.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#b9a2bf',transparent:true,opacity:.5})));}jelly.push(g);}
 const gulls=[];for(let i=0;i<12;i++){const g=new T.Group();world.add(g);ball(g,0,0,0,.055,cream,[1.4,.7,.7]);ball(g,.07,.018,0,.024,cream);beam(g,[.08,.015,0],[.12,.009,0],.009,brass);const wings=[];for(const s of [-1,1]){const wing=box(g,-.025,0,s*.075,.045,.011,.18,cream);wing.rotation.x=s*.2;wings.push(wing)}gulls.push({g,wings,phase:i*.8});}
 const beamLight=mesh(world,new T.ConeGeometry(.7,4,24,1,true),new T.MeshBasicMaterial({color:'#eadfac',transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}),lx,2.9,lz);beamLight.castShadow=false;
 return {ship,tug,cargo,cranes,floating,lifeRing,fish,jelly,gulls,beamLight,caustic,lighthouse:[lx,2.94,lz],helpers:{box,cyl,ball,material}};
}
