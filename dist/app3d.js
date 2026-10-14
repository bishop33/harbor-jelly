import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SceneDirector } from './scene-director.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const wrap = $('canvasWrap');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f5f3eb');
scene.fog = new THREE.Fog('#f5f3eb', 25, 57);
const camera = new THREE.OrthographicCamera(-11, 11, 7, -7, .1, 100);
camera.position.set(14, 13, 19);
const controls = new OrbitControls(camera, canvas);
controls.target.set(-.2, .5, .1);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.minPolarAngle = .35;
controls.maxPolarAngle = 1.33;
controls.minZoom = .55;
controls.maxZoom = 5;
controls.enablePan = true;
controls.update();
controls.saveState();
const director=new SceneDirector(camera,controls,mode=>{
  $('cameraStatus').textContent={manual:'직접 탐험 중',travelling:'장면 전환 중',following:'배를 따라가는 중',scene:'이야기의 시선'}[mode];
  wrap.classList.toggle('is-travelling',mode==='travelling');
});

const ambient = new THREE.HemisphereLight('#fffaf0', '#879ca4', 1.45);
scene.add(ambient);
const sun = new THREE.DirectionalLight('#fff3db', 2.4);
sun.position.set(-7, 13, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -19;
sun.shadow.camera.right = 19;
sun.shadow.camera.top = 19;
sun.shadow.camera.bottom = -19;
sun.shadow.camera.near = .1;
sun.shadow.camera.far = 55;
sun.shadow.bias = -.0004;
sun.shadow.normalBias = .015;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);
const state = { time:'sunset', palette:'candy', waves:40, boats:true, birds:true, lighthouseOn:false, page:0, choice:'signal', arrivalReady:false, routeIndex:0, hint:false, boatClock:0, returnProgress:0, returning:false, ripples:[], fish:[] };
const palettes = {
  candy:['#eaa28c','#e9c267','#9cc4ad','#89a9c4','#d7a8b7','#c4b69d','#a7c7a1','#efba89','#98a5bd','#d19f88'],
  coastal:['#8daabb','#d9c9ae','#aabcae','#7399aa','#c7b2a7','#b8b8ab','#91b4ad','#e6d9be','#9fb7b6','#c6b6a1'],
  bright:['#ee7758','#f5c846','#65acc2','#d089a8','#e79b64','#82b690','#618cba','#f1a96d','#b984aa','#77b4af']
};
const themes = {
  day:{sky:'#f5f3eb',fog:'#f5f3eb',waterDeep:'#3c95a6',waterLight:'#a9dcda',sun:'#fff3db',sunPower:2.4,ambient:1.45,exposure:1.25,windows:.05},
  sunset:{sky:'#f0dfd0',fog:'#f0dfd0',waterDeep:'#287a89',waterLight:'#a0c9c2',sun:'#ffd1a1',sunPower:2.15,ambient:1.2,exposure:1.2,windows:.55},
  night:{sky:'#263d59',fog:'#263d59',waterDeep:'#1d4566',waterLight:'#5c8f9e',sun:'#9cb7d3',sunPower:.75,ambient:.85,exposure:1.25,windows:2.9}
};
const color = value => new THREE.Color(value);
const mat = (hex, extra={}) => new THREE.MeshStandardMaterial({ color:hex, roughness:.78, metalness:0, ...extra });
function makePlasterTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const g=c.getContext('2d');g.fillStyle='#888';g.fillRect(0,0,128,128);
  let seed=87123;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<2300;i++){const v=100+Math.floor(random()*84);g.fillStyle=`rgba(${v},${v},${v},${.08+random()*.15})`;g.fillRect(random()*128,random()*128,1+random()*3,1+random()*2)}
  const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);return texture;
}
const plasterBump=makePlasterTexture();
const sandMat = mat('#d9d0ac');
const stoneMat = mat('#b8bcb2');
const darkStoneMat = mat('#8c9a98');
const woodMat = mat('#a78d70');
const redMat = mat('#b76f5d');
const whiteMat = mat('#f3eee4');
const roofMat = mat('#bd7c65');
const greenMat = mat('#83a997');
const windowMat = mat('#f3d99b',{ emissive:'#ffc978',emissiveIntensity:.05,roughness:.2 });
const buildingMaterials = [];
roofMat.bumpMap=plasterBump;roofMat.bumpScale=.055;
stoneMat.bumpMap=plasterBump;stoneMat.bumpScale=.025;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickTargets = [];
const boats = [];
const birds = [];
const celebrationLights=[];
let waterMesh, waterUniforms, lighthouseTarget, lanternMat, lanternGlow, lanternLight, beam, returnBoat;
const routeBuoys=[];
const markerPoints=[new THREE.Vector3(4.5,1.25,5.8),new THREE.Vector3(3.35,.95,3.45),new THREE.Vector3(.3,.95,1.05),new THREE.Vector3(-3.15,.95,-.9)];
const returnPath=new THREE.CatmullRomCurve3([[4.5,.19,5.8],[3.35,.19,3.45],[.3,.19,1.05],[-3.15,.19,-.9],[-5.55,.19,-1.75]].map(p=>new THREE.Vector3(...p)));
let routeGlow, routeLine;
let toastTimer, pointerStart=null, lastFrame=performance.now();

function addMesh(parent,geometry,material,x=0,y=0,z=0,cast=true){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow=cast;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}
function box(parent,x,y,z,w,h,d,material,cast=true){return addMesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z,cast)}
function cylinder(parent,x,y,z,top,bottom,height,material,segments=12){return addMesh(parent,new THREE.CylinderGeometry(top,bottom,height,segments),material,x,y,z)}
function sphere(parent,x,y,z,r,material,sx=1,sy=1,sz=1){const mesh=addMesh(parent,new THREE.IcosahedronGeometry(r,1),material,x,y,z);mesh.scale.set(sx,sy,sz);return mesh}
function beamBetween(parent,a,b,r,material){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),mesh=addMesh(parent,new THREE.CylinderGeometry(r,r,delta.length(),8),material);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh}
function toast(message){const el=$('interactionToast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2200)}

function buildWater(){
  box(world,0,-.55,1.25,18,.62,11,mat('#417a8a'),false);
  const geometry=new THREE.PlaneGeometry(18,11,96,64);
  waterUniforms={uTime:{value:0},uAmplitude:{value:.075},uDeep:{value:color(themes.day.waterDeep)},uLight:{value:color(themes.day.waterLight)},uRipples:{value:Array.from({length:8},()=>new THREE.Vector3(0,0,-1))}};
  const material=new THREE.ShaderMaterial({ uniforms:waterUniforms,side:THREE.DoubleSide,vertexShader:`
    uniform float uTime; uniform float uAmplitude; uniform vec3 uRipples[8];
    varying vec3 vWorld; varying vec3 vNormalWorld; varying float vWave;
    void main(){
      vec4 base=modelMatrix*vec4(position,1.0); float x=base.x; float z=base.z;
      float a=sin(x*1.75+uTime*.78)*.55+sin(z*2.8-uTime*1.15)*.3+sin((x+z)*3.8+uTime*1.5)*.15;
      float wave=a*uAmplitude;
      for(int i=0;i<8;i++){float age=uRipples[i].z;if(age>=0.0&&age<2.4){float dist=distance(vec2(x,z),uRipples[i].xy);float crest=exp(-pow((dist-age*1.5)*4.5,2.0))*.14*(1.0-age/2.4);wave+=crest;}}
      vec3 p=position;p.z+=wave;
      vec4 wp=modelMatrix*vec4(p,1.0);vWorld=wp.xyz;vWave=wave;
      float dx=(cos(x*1.75+uTime*.78)*1.75*.55+cos((x+z)*3.8+uTime*1.5)*3.8*.15)*uAmplitude;
      float dz=(cos(z*2.8-uTime*1.15)*2.8*.3+cos((x+z)*3.8+uTime*1.5)*3.8*.15)*uAmplitude;
      vNormalWorld=normalize(vec3(-dx,1.0,-dz));
      gl_Position=projectionMatrix*viewMatrix*wp;
    }`,fragmentShader:`
    uniform float uTime;uniform vec3 uDeep;uniform vec3 uLight;
    varying vec3 vWorld; varying vec3 vNormalWorld; varying float vWave;
    void main(){
      vec3 n=normalize(vNormalWorld);vec3 viewDir=normalize(cameraPosition-vWorld);vec3 lightDir=normalize(vec3(-.55,1.0,.48));
      float fresnel=pow(1.0-max(dot(n,viewDir),0.0),2.3);
      float glint=pow(max(dot(reflect(-lightDir,n),viewDir),0.0),24.0);
      float soft=sin(vWorld.x*4.1+sin(vWorld.z*3.2+uTime*.4)*1.5+uTime*.35)*.5+.5;
      float fine=sin((vWorld.x+vWorld.z)*12.0+sin(vWorld.z*7.0+uTime)*2.0)*.5+.5;
      vec3 c=mix(uDeep,uLight,clamp(.43+vWave*1.6+soft*.13+fine*.045,0.0,1.0));
      c+=vec3(.32,.3,.23)*glint*.7+vec3(.1,.17,.17)*fresnel;
      gl_FragColor=vec4(c,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` });
  waterMesh=addMesh(world,geometry,material,0,.025,1.25,false);
  waterMesh.rotation.x=-Math.PI/2;
  waterMesh.receiveShadow=false;
  clickTargets.push(waterMesh);
}

function house(x,z,w,h,d,index){
  const group=new THREE.Group();world.add(group);
  const bodyMat=mat(palettes.candy[index%10]);bodyMat.bumpMap=plasterBump;bodyMat.bumpScale=.035;buildingMaterials.push({material:bodyMat,index:index%10});
  box(group,x,.72+h/2,z,w,h,d,bodyMat);
  box(group,x,.75,z+d/2+.012,w*.96,.09,.055,stoneMat,false);
  for(const sx of [-1,1])box(group,x+sx*w*.47,.72+h*.5,z+d/2+.012,.055,h,.065,whiteMat,false);
  if(index%3===0){
    const shape=new THREE.Shape();shape.moveTo(-w*.56,0);shape.lineTo(0,.42);shape.lineTo(w*.56,0);shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:d*1.09,bevelEnabled:false});
    addMesh(group,g,roofMat,x,.72+h,z-d*.545);
  }else if(index%3===1){box(group,x,.72+h+.08,z,w*1.08,.17,d*1.07,roofMat)}
  else{const roof=addMesh(group,new THREE.ConeGeometry(w*.72,.55,4),roofMat,x,.72+h+.24,z);roof.rotation.y=Math.PI/4}
  const count=Math.max(1,Math.floor(w/.34));
  for(let row=0;row<Math.floor(h/.52);row++)for(let i=0;i<count;i++){
    const wx=x-w/2+(i+.5)*w/count;
    box(group,wx,.94+row*.51,z+d/2+.012,.2,.27,.025,whiteMat,false);
    box(group,wx,.94+row*.51,z+d/2+.036,.14,.21,.035,windowMat,false);
    box(group,wx,.94+row*.51,z+d/2+.065,.018,.21,.012,whiteMat,false);
    box(group,wx,.94+row*.51,z-d/2-.016,.14,.21,.035,windowMat,false);
  }
  box(group,x,.93,z+d/2+.046,.27,.41,.065,mat('#557d75'));
  sphere(group,x+.085,.93,z+d/2+.09,.015,mat('#e9ca83'));
  box(group,x,.73,z+d/2+.22,.42,.075,.32,stoneMat);
  if(index%2===0){box(group,x,1.17,z+d/2+.17,w*.58,.06,.34,roofMat);for(const sx of [-1,1])box(group,x+sx*w*.27,1.04,z+d/2+.18,.035,.25,.035,woodMat)}
  if(index%3===0){for(const sx of [-1,1]){box(group,x+sx*w*.37,.79,z+d/2+.15,.22,.14,.23,mat('#8ca38b'));sphere(group,x+sx*w*.37,.92,z+d/2+.15,.17,greenMat,1,.65,1)}}
  if(index%4===0){cylinder(group,x+w*.25,.72+h+.34,z-d*.13,.075,.075,.48,stoneMat)}
}

function buildTown(){
  box(world,-2.15,.28,-4.91,12.5,.85,2.85,sandMat);
  box(world,-2.15,.54,-3.52,12.5,.33,.32,stoneMat);
  for(let x=-7.85;x<=3.65;x+=.72){box(world,x,.79,-3.33,.075,.16,.095,darkStoneMat,false)}
  const specs=[[-7.7,-5.15,.84,1.32],[-6.68,-5.15,.9,1.6],[-5.56,-5.17,.98,1.4],[-4.4,-5.19,.97,1.97],[-3.26,-5.17,1.02,1.48],[-2.04,-5.2,1.05,1.74],[-.8,-5.19,.98,1.52],[.4,-5.16,1.02,2.02],[1.65,-5.17,1.08,1.43],[2.89,-5.17,.94,1.75]];
  specs.forEach(([x,z,w,h],i)=>house(x,z,w,h,.89,i));
  for(let i=0;i<4;i++){const x=-6.6+i*2.75;box(world,x,.96,-3.59,.065,.51,.065,darkStoneMat);sphere(world,x,1.25,-3.59,.085,windowMat,.8,1,.8)}
  for(const x of [-5.7,-2.1,1.6]){
    box(world,x,.56,-2.16,.69,.25,2.65,woodMat);
    for(const z of [-3,-2,-1.2])for(const sx of [-.27,.27])box(world,x+sx,.14,z,.09,.56,.09,darkStoneMat);
  }
  for(let i=0;i<22;i++){
    const x=-7.7+i*.52;
    box(world,x,.745,-3.94,.23,.014,.15,i%4===0?stoneMat:mat('#e9dbc3'),false);
  }
  for(const x of [-7.3,-4.1,-.9,2.7]){
    cylinder(world,x,.83,-3.64,.035,.035,.5,darkStoneMat,8);
    sphere(world,x,1.14,-3.64,.11,windowMat,1.05,1.3,1.05);
  }
  const containerMats=palettes.candy.slice(0,8).map(c=>mat(c));
  for(let row=0;row<2;row++)for(let i=0;i<7;i++){const x=-7.25+i*.68+row*.19,z=-3.95-row*.37;box(world,x,.86,z,.56,.35,.3,containerMats[(i*3+row)%8]);if(i%3===0)box(world,x,1.2,z,.56,.28,.3,containerMats[(i*5+2)%8])}
  buildCrane(-5.1,-3.74,mat('#d78169'));
  buildCrane(-.65,-3.72,mat('#779ab2'));
}

function buildCrane(x,z,material){
  const y=.7;
  box(world,x,y+1.05,z,.29,2.1,.33,material);
  box(world,x,y+2.13,z,.58,.18,.44,material);
  beamBetween(world,[x-.07,y+2.22,z],[x-1.75,y+2.22,z],.055,material);
  beamBetween(world,[x+.14,y+3.28,z],[x-1.66,y+2.22,z],.022,darkStoneMat);
  beamBetween(world,[x+.14,y+3.28,z],[x,y+2.22,z],.042,material);
  beamBetween(world,[x-1.6,y+2.22,z],[x-1.6,y+.87,z],.011,darkStoneMat);
  box(world,x-1.6,y+.85,z,.43,.13,.32,material);
}

function buildIsland(){
  cylinder(world,6.1,.0,2.15,1.68,1.92,.85,darkStoneMat,16);
  cylinder(world,6.1,.47,2.15,1.56,1.66,.12,greenMat,16);
  for(let i=0;i<14;i++){const a=i*2.4,r=1.42+(i%3)*.1;sphere(world,6.1+Math.cos(a)*r,.23,2.15+Math.sin(a)*r,.26,i%3?stoneMat:darkStoneMat,1.2,.7,.9)}
  for(let i=0;i<20;i++){const a=i*2.15,r=.62+(i%4)*.18;const m=i%5===0?mat('#f4e6bd'):greenMat;sphere(world,6.1+Math.cos(a)*r,.58,2.15+Math.sin(a)*r,.05,m,1,.75,1)}
  for(const [x,z,s] of [[5.28,1.66,.37],[6.93,1.47,.3],[6.95,2.76,.25]]){
    cylinder(world,x,.68,z,.045,.052,.35,woodMat);
    sphere(world,x,.95,z,s,greenMat,1,1.15,1);
  }
  box(world,6.98,.72,2.28,.71,.48,.64,mat('#e7c7a7'));
  const roof=addMesh(world,new THREE.ConeGeometry(.58,.38,4),roofMat,6.98,1.15,2.28);roof.rotation.y=Math.PI/4;
  box(world,6.98,.75,2.62,.16,.2,.04,windowMat,false);
  const tower=new THREE.Group();world.add(tower);
  cylinder(tower,5.82,1.85,1.87,.26,.42,2.53,whiteMat,12);
  for(const y of [.88,1.59,2.26])cylinder(tower,5.82,y,1.87,.37,.39,.19,redMat,12);
  cylinder(tower,5.82,3.17,1.87,.48,.48,.14,darkStoneMat,12);
  lanternMat=mat('#e0dfc8',{emissive:'#ffe6a1',emissiveIntensity:0,transparent:true,opacity:.9});
  cylinder(tower,5.82,3.42,1.87,.32,.32,.39,lanternMat,10);
  cylinder(tower,5.82,3.68,1.87,.43,.42,.14,redMat,12);
  addMesh(tower,new THREE.ConeGeometry(.39,.3,12),redMat,5.82,3.82,1.87);
  lighthouseTarget=addMesh(world,new THREE.CylinderGeometry(.62,.62,3.7,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),5.82,2.1,1.87,false);
  lighthouseTarget.userData.action='lighthouse';clickTargets.unshift(lighthouseTarget);
  lanternLight=new THREE.PointLight('#ffe8a0',0,7,2);lanternLight.position.set(5.82,3.43,1.87);lanternLight.visible=false;scene.add(lanternLight);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const g=glowCanvas.getContext('2d'),gradient=g.createRadialGradient(64,64,3,64,64,64);gradient.addColorStop(0,'rgba(255,252,205,1)');gradient.addColorStop(.16,'rgba(255,226,145,.72)');gradient.addColorStop(1,'rgba(255,220,130,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);
  lanternGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));lanternGlow.position.set(5.82,3.43,1.87);lanternGlow.scale.set(2.1,2.1,1);lanternGlow.visible=false;scene.add(lanternGlow);
  beam=addMesh(world,new THREE.ConeGeometry(1.75,5,24,1,true),new THREE.MeshBasicMaterial({color:'#fff0b4',transparent:true,opacity:.105,depthWrite:false,side:THREE.DoubleSide}),5.82,3.43,1.87,false);beam.visible=false;
  const pier=box(world,6.15,.44,3.68,.52,.21,2.2,woodMat);
  for(const z of [2.95,3.7,4.4])for(const x of [5.94,6.37])box(world,x,.12,z,.07,.47,.07,darkStoneMat);
}

function createBoat(x,z,s,hullColor,sail=false){
  const group=new THREE.Group();group.position.set(x,.19,z);group.scale.setScalar(s);world.add(group);
  const hull=mat(hullColor);
  box(group,0,.04,0,.91,.22,.36,hull);
  const bow=addMesh(group,new THREE.ConeGeometry(.22,.38,4),hull,.53,.04,0);bow.rotation.z=-Math.PI/2;bow.rotation.y=Math.PI/4;
  box(group,0,.17,0,.77,.075,.3,whiteMat);
  if(sail){beamBetween(group,[0,.2,0],[0,1.15,0],.015,darkStoneMat);const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute([.02,.3,0,.02,1.08,0,.45,.31,0],3));geom.computeVertexNormals();addMesh(group,geom,new THREE.MeshStandardMaterial({color:'#fff3dc',side:THREE.DoubleSide,roughness:.9}),0,0,0,false)}
  else{box(group,-.12,.35,0,.38,.34,.29,whiteMat);box(group,.17,.24,0,.07,.1,.25,redMat)}
  boats.push({group,x,z,s,phase:Math.random()*6});
  return group;
}
function buildBoats(){
  createBoat(-5.9,-1.5,.62,'#e9b16d',false);
  createBoat(-3.35,1.9,.85,'#d98377',true);
  createBoat(.25,-.43,.8,'#8daec7',false);
  createBoat(2.4,3.1,.64,'#e2c16e',true);
  returnBoat=createBoat(4.5,5.8,.77,'#e59569',true);
  const flag=box(returnBoat,-.015,1.13,0,.24,.11,.015,mat('#d57561'),false);flag.rotation.z=.15;
}
function buildBirds(){
  const wingMat=new THREE.LineBasicMaterial({color:'#668187',transparent:true,opacity:.75});
  for(let i=0;i<6;i++){const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.13,0,0),new THREE.Vector3(0,-.055,0),new THREE.Vector3(.13,0,0)]);const line=new THREE.Line(geom,wingMat);line.position.set(-5+i*1.35,4.1+(i%3)*.2,-4.4);world.add(line);birds.push({line,baseX:line.position.x,phase:i*1.4})}
}

function buildRoute(){
  const buoyMat=mat('#d17360');
  const buoyBase=mat('#e9dfc8');
  const buoyLamp=mat('#ffe8a3',{emissive:'#ffce72',emissiveIntensity:.2});
  for(let i=0;i<3;i++){
    const p=markerPoints[i+1],g=new THREE.Group();g.position.set(p.x,0,p.z);world.add(g);
    cylinder(g,0,.12,0,.21,.27,.24,buoyBase,12);
    cylinder(g,0,.38,0,.11,.17,.41,buoyMat,12);
    cylinder(g,0,.62,0,.2,.2,.08,buoyBase,12);
    const lampMat=buoyLamp.clone();
    sphere(g,0,.77,0,.14,lampMat,1,1.2,1);
    const light=new THREE.PointLight('#ffe5a4',0,2.7,2);light.position.set(0,.85,0);g.add(light);
    const ring=addMesh(g,new THREE.TorusGeometry(.39,.018,8,40),new THREE.MeshBasicMaterial({color:'#ffe9b1',transparent:true,opacity:.7}),0,.1,0,false);ring.rotation.x=-Math.PI/2;
    g.visible=false;routeBuoys.push({group:g,light,lamp:lampMat,ring});
  }
  routeGlow=new THREE.Group();world.add(routeGlow);
}
function buildCelebration(){
  const gold=new THREE.MeshBasicMaterial({color:'#ffe6a6',transparent:true,opacity:.92});
  const coral=new THREE.MeshBasicMaterial({color:'#ffb893',transparent:true,opacity:.9});
  for(let i=0;i<28;i++){
    const x=-7.5+(i%14)*.81,y=1.55+Math.floor(i/14)*.8,z=-3.17+(i%3)*.07;
    const light=sphere(world,x,y,z,.045,i%4===0?coral:gold,1,1.2,1);
    light.visible=false;celebrationLights.push({mesh:light,baseY:y,phase:i*.71});
  }
}
function lightRoute(index){
  const buoy=routeBuoys[index];
  if(buoy.lit){state.ripples.push({x:buoy.group.position.x,z:buoy.group.position.z,start:performance.now()/1000});return}
  buoy.lit=true;buoy.light.intensity=2.6;buoy.lamp.emissiveIntensity=3;
  buoy.group.scale.setScalar(1.22);
  const a=markerPoints[index],b=markerPoints[index+1];
  const dotMat=new THREE.MeshBasicMaterial({color:'#ffe2a0',transparent:true,opacity:.85});
  for(let n=0;n<=15;n++){
    const t=n/15;
    sphere(routeGlow,a.x+(b.x-a.x)*t,.11,a.z+(b.z-a.z)*t,.038,dotMat,1,.5,1);
  }
  state.ripples.push({x:b.x,z:b.z,start:performance.now()/1000});
}

buildWater();buildTown();buildIsland();buildBoats();buildBirds();buildRoute();buildCelebration();

function buildStoryObjects(){
  const entrance=[];
  const character=new THREE.Group();character.position.set(5.22,.58,2.38);world.add(character);
  const coat=mat('#db9276'),hair=mat('#493f34');
  cylinder(character,0,.34,0,.13,.2,.42,coat,12);
  sphere(character,0,.68,0,.13,mat('#f2ceb0'),1,1.1,1);
  sphere(character,0,.75,-.035,.14,hair,1,.7,1);
  for(const x of [-.08,.08])cylinder(character,x,.09,0,.035,.04,.18,darkStoneMat,8);
  for(const x of [-.16,.16])beamBetween(character,[x,.5,0],[x*.9,.24,.035],.035,coat);
  const memory=character.clone(true);memory.position.set(6.22,.58,1.3);world.add(memory);
  memory.traverse(obj=>{if(obj.isMesh){obj.material=obj.material.clone();obj.material.color.set('#e6d6aa');obj.material.transparent=true;obj.material.opacity=.3;obj.material.emissive.set('#d7b76e');obj.material.emissiveIntensity=.4;obj.castShadow=false}});
  const moon=sphere(world,-4.8,6.5,-7,.62,new THREE.MeshBasicMaterial({color:'#f8e5b4'}));
  const stars=new THREE.Group();world.add(stars);
  for(let i=0;i<36;i++){const x=-9+(i*2.73)%18,z=-9+(i*1.19)%8;sphere(stars,x,5.5+(i%6)*.42,z,.025,new THREE.MeshBasicMaterial({color:'#eedca8'}))}
  const signal=new THREE.Sprite(lanternGlow.material.clone());signal.scale.set(1.2,1.2,1);signal.position.set(0,1.2,0);returnBoat.add(signal);
  const shipTarget=addMesh(returnBoat,new THREE.SphereGeometry(.72,12,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.55,0,false);shipTarget.userData.action='ship';clickTargets.unshift(shipTarget);
  const boatMail=new THREE.Group();boatMail.position.set(-.23,.4,0);returnBoat.add(boatMail);
  box(boatMail,0,0,0,.33,.24,.035,mat('#fff0d0'));
  sphere(boatMail,0,0,.03,.035,redMat);
  const letter=new THREE.Group();letter.position.set(-5.55,1.05,-1.75);letter.rotation.y=-.5;world.add(letter);
  box(letter,0,-.35,0,1.25,.78,.06,mat('#e8d3a8'));
  const paperCanvas=document.createElement('canvas');paperCanvas.width=512;paperCanvas.height=640;
  const pen=paperCanvas.getContext('2d');pen.fillStyle='#fff8e5';pen.fillRect(0,0,512,640);
  pen.strokeStyle='#d7c397';pen.strokeRect(20,20,472,600);pen.fillStyle='#3c3326';pen.font='bold 30px serif';pen.textAlign='center';
  ['오래된 등대에게','', '매일 밤 길을 밝혀줘서', '고마워.', '', '오늘은 우리가', '너의 밤을 밝혀줄게.', '', '— 항구의 사람들'].forEach((line,i)=>pen.fillText(line,256,95+i*52));
  const paperTexture=new THREE.CanvasTexture(paperCanvas);paperTexture.colorSpace=THREE.SRGBColorSpace;
  const paper=addMesh(letter,new THREE.PlaneGeometry(1.28,1.6),new THREE.MeshBasicMaterial({map:paperTexture,side:THREE.DoubleSide}),0,.38,.055,false);
  paper.userData.action='letter';clickTargets.unshift(paper);
  const lanterns=new THREE.Group();world.add(lanterns);
  for(let i=0;i<12;i++){
    const g=new THREE.Group();g.position.set(-6.7+(i%6)*1.65,1.6+Math.floor(i/6)*.65,-3.1);lanterns.add(g);
    cylinder(g,0,0,0,.14,.13,.24,mat(i%3?'#eebd72':'#e39d83',{emissive:'#ffbe62',emissiveIntensity:1.3,transparent:true,opacity:.9}),12);
    cylinder(g,0,-.15,0,.055,.055,.025,darkStoneMat,8);
    g.userData.baseY=g.position.y;g.userData.phase=i*.73;
  }
  routeBuoys.forEach((b,i)=>{
    const target=addMesh(b.group,new THREE.SphereGeometry(.42,12,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.5,0,false);
    target.userData.action='buoy';target.userData.index=i;clickTargets.unshift(target);
  });
  entrance.push(character,memory,moon,letter,lanterns);
  return {character,memory,moon,stars,signal,boatMail,letter,paper,lanterns,shipTarget,entrance};
}
const storyObjects=buildStoryObjects();
function revealStoryObjects(){
  const page=state.page;
  const show=(obj,visible)=>{if(visible&&!obj.visible)obj.scale.setScalar(.01);obj.visible=visible};
  show(storyObjects.character,page>=1);
  show(storyObjects.memory,(page===3&&state.choice==='memory')||page===7);
  show(storyObjects.moon,page>=3);
  show(storyObjects.letter,page===10);
  show(storyObjects.lanterns,page>=10);
  storyObjects.stars.visible=page>=3;
  storyObjects.signal.visible=page>=2&&page<=9;
  storyObjects.shipTarget.visible=page>=2&&page<=9;
  storyObjects.boatMail.visible=page>=3&&page<=9;
}
function animateStoryObjects(t,dt){
  for(const obj of storyObjects.entrance)if(obj.visible){const size=THREE.MathUtils.lerp(obj.scale.x,1,1-Math.exp(-dt*4));obj.scale.setScalar(size)}
  storyObjects.signal.material.opacity=.25+Math.pow(Math.max(0,Math.sin(t*3)),6)*.75;
  storyObjects.memory.position.y=.63+Math.sin(t*1.2)*.04;
  for(const lantern of storyObjects.lanterns.children)if(storyObjects.lanterns.visible){
    lantern.position.y=lantern.userData.baseY+(Math.sin(t*.45+lantern.userData.phase)+1)*1.2;
    lantern.rotation.z=Math.sin(t*.6+lantern.userData.phase)*.12;
  }
  storyObjects.paper.rotation.x=state.page===10?Math.sin(t*.6)*.025:0;
}

const storyShots=[
 {label:'항구 전경',target:[-.2,.5,.1],theta:.64,phi:1.08,zoom:1},
 {label:'등대섬에 돌아온 윤',target:[5.55,1.25,2.05],theta:1.12,phi:1.03,zoom:2.15},
 {label:'멀리서 깜박이는 신호',target:[4.5,.7,5.8],theta:.28,phi:1.2,zoom:2.3},
 {label:'우편배와 작은 봉투',target:[4.5,.68,5.8],theta:-.45,phi:1.18,zoom:3.45},
 {label:'첫 번째 부표',target:[3.35,.5,3.45],theta:-.65,phi:1.04,zoom:3.1},
 {label:'두 번째 불빛',target:[.3,.5,1.05],theta:.1,phi:1.18,zoom:2.9},
 {label:'하나로 이어진 항로',target:[.6,.5,1.6],theta:-.7,phi:.68,zoom:1.4,duration:2100},
 {label:'등대 꼭대기의 기억',target:[5.82,2.75,1.87],theta:1.15,phi:1.23,zoom:3.6,duration:2100},
 {label:'바다로 건너가는 빛',target:[5.82,2.4,1.87],theta:1.9,phi:1.09,zoom:2.8},
 {label:'우편배의 귀항',target:[4.5,.65,5.8],theta:.8,phi:1.06,zoom:2.5},
 {label:'등대 앞으로 온 편지',target:[-5.55,1.13,-1.75],theta:-.5,phi:1.28,zoom:3.7},
 {label:'불빛이 남은 항구',target:[-.8,.8,-.2],theta:-.65,phi:.9,zoom:1,duration:2400}
];
function focusStoryPage(){
  const shot=storyShots[state.page];$('shotLabel').textContent=shot.label;
  const boatFocus=()=>returnBoat.position.clone().add(new THREE.Vector3(0,.55,0));
  director.move(state.page===9?{...shot,target:boatFocus().toArray()}:shot,state.page===9?boatFocus:null);
}


function applyTheme(){
  const theme=themes[state.time];
  scene.background.set(theme.sky);
  scene.fog.color.set(theme.fog);
  sun.color.set(theme.sun);
  sun.intensity=theme.sunPower;
  ambient.intensity=theme.ambient;
  renderer.toneMappingExposure=theme.exposure;
  windowMat.emissiveIntensity=theme.windows;
  waterUniforms.uDeep.value.set(theme.waterDeep);
  waterUniforms.uLight.value.set(theme.waterLight);
  $('sceneLabel').textContent={day:'SUNNY AFTERNOON',sunset:'GOLDEN HOUR',night:'MOONLIT HARBOR'}[state.time];
}
function applyPalette(){for(const {material,index} of buildingMaterials)material.color.set(palettes[state.palette][index]);document.querySelectorAll('.palette').forEach(button=>button.classList.toggle('active',button.dataset.palette===state.palette))}
function setLighthouse(on,announce=true){
  state.lighthouseOn=on;
  $('lighthouseToggle').checked=on;
  lanternMat.emissiveIntensity=on?3.5:0;
  lanternLight.visible=on;
  lanternLight.intensity=state.time==='night'?7:3.5;
  lanternGlow.visible=on;
  beam.visible=on;
  if(announce)toast(on?'등대에 불이 켜졌어요 ✨':'등대 불빛이 꺼졌어요');
}
const storyPages=[
 {kicker:'프롤로그 · 해가 머무는 항구',title:'등대의 마지막 편지.',paragraphs:['그날 저녁, 항구의 모든 시계가 여섯 시에서 멈춘 듯했다.','내일이면 오래된 등대는 불을 끈다. 그런데 마지막 우편배는 아직 돌아오지 않았다.'],speaker:'항구의 오래된 이야기',dialogue:'그 밤의 일은, 지금도 누군가에게 편지가 된다.',action:'첫 장을 펼치다'},
 {kicker:'첫 번째 장 · 돌아온 사람',title:'윤은 다시 이곳에 서 있었다.',paragraphs:['십 년 만에 돌아온 항구에서도 소금 냄새는 그대로였다. 윤은 등대 난간에 손을 얹었다.','할아버지는 늘 이 시간에 바다를 바라보았다. 돌아올 배가 없어도 그랬다.'],speaker:'윤',dialogue:'“오늘 밤만큼은, 내가 곁에 있을게.”',action:'바다를 바라본다'},
 {kicker:'첫 번째 장 · 멀리서 온 불빛',title:'수평선이 한 번 깜박였다.',paragraphs:['별이라고 하기엔 낮았고, 파도라고 하기엔 규칙적이었다. 불빛은 켜졌다가, 잠시 머물렀다가, 다시 사라졌다.'],speaker:'바다',dialogue:'빛 하나. 그리고 긴 침묵.',action:'그 불빛을 오래 바라본다',alternate:'할아버지의 말을 떠올린다'},
 {kicker:'두 번째 장 · 작은 우편배',title:'봉투 한 통이 남아 있었다.',paragraphs:['밤이 내려앉자 작은 우편배의 윤곽이 드러났다. 젖은 돛 아래에서 누군가 봉투를 가슴에 안고 있었다.'],speaker:'우편배의 선장',dialogue:'“이 편지만은 오늘 도착해야 해요. 받는 사람이 오래 기다렸거든요.”',action:'낡은 항로를 따라 시선을 옮긴다'},
 {kicker:'두 번째 장 · 첫 불빛',title:'바다는 길을 기억하고 있었다.',paragraphs:['윤의 손끝 아래에서 첫 부표가 따뜻하게 밝아졌다.','어린 날 할아버지와 함께 세던 불빛이었다. 하나. 집으로 돌아오는 길의 시작.'],speaker:'윤의 기억',dialogue:'“아무리 멀리 가도, 첫 불빛은 여기 있단다.”',action:'두 번째 불빛으로 이어진다'},
 {kicker:'두 번째 장 · 두 번째 불빛',title:'멀리서 작은 답이 왔다.',paragraphs:['두 번째 부표가 켜지자 우편배도 한 번 빛을 보냈다.','윤은 자기도 모르게 웃었다. 바다 건너의 누군가와 같은 길을 보고 있다는 것이 이상하게 든든했다.'],speaker:'윤',dialogue:'“응. 여기 있어. 보고 있어.”',action:'마지막 불빛을 잇는다'},
 {kicker:'두 번째 장 · 이어진 길',title:'세 개의 빛이 한 문장이 되었다.',paragraphs:['마지막 부표가 밝아지자 어둠 속에 느슨한 선이 생겼다.','배에서 항구까지, 말로 적지 않은 한 문장. 윤은 그 문장을 천천히 읽었다.'],speaker:'불빛이 전한 말',dialogue:'여기로. 천천히. 돌아와.',action:'등대의 계단을 오른다'},
 {kicker:'세 번째 장 · 등대의 심장',title:'유리 속에 밤이 담겨 있었다.',paragraphs:['등대 꼭대기에서 윤은 차가운 손잡이를 잡았다. 기계는 오래된 숨처럼 낮게 울었다.','할아버지는 짧은 빛 두 번이면 충분하다고 했다. 기다리고 있다는 뜻이라고.'],speaker:'할아버지의 목소리',dialogue:'“불빛은 바다를 이기는 게 아니야. 혼자가 아니라는 걸 알려주는 거지.”',action:'첫 번째 빛을 보낸다'},
 {kicker:'세 번째 장 · 한 번의 응답',title:'빛은 바다 위를 건너갔다.',paragraphs:['등대가 크게 숨을 쉬듯 밝아졌다. 금빛이 검은 수면을 스치고, 우편배의 돛에 잠시 머물렀다.','윤은 손잡이를 놓지 않았다.'],speaker:'윤',dialogue:'“한 번 더. 우리가 기다리고 있다는 걸 알 수 있게.”',action:'두 번째 빛을 보낸다'},
 {kicker:'세 번째 장 · 돌아오는 시간',title:'배가 천천히 몸을 돌렸다.',paragraphs:['두 번째 빛이 닿자 작은 배가 고개를 돌렸다. 세 개의 부표를 따라, 익숙한 선착장 쪽으로.','윤은 아무 말도 하지 않았다. 돌아오는 것을 바라보는 데에도 시간이 필요했다.'],speaker:'윤',dialogue:'“이제 괜찮아.”',action:'봉투를 연다'},
 {kicker:'마지막 장 · 등대 앞으로',title:'편지에는 이름이 없었다.',paragraphs:['봉투에는 그저 ‘항구의 오래된 등대에게’라고 적혀 있었다.','윤이 편지를 펼치자 마을의 창마다 불이 들어왔다. 오늘 밤은 항구가 등대를 바라보고 있었다.'],speaker:'마지막 편지',dialogue:'“매일 밤 우리의 길을 밝혀줘서 고마워. 오늘은 우리가 너의 밤을 밝혀줄게.”',action:'마지막 문장을 읽는다'},
 {kicker:'에필로그 · 불빛이 남는 곳',title:'밤은 더 이상 어둡지 않았다.',paragraphs:['윤은 편지를 난간 위에 놓았다. 등대의 빛은 내일 꺼지겠지만, 누군가를 기다리는 마음까지 사라지는 건 아니었다.','항구에는 아직 돌아올 사람들의 자리가 남아 있었다.'],speaker:'이야기의 끝',dialogue:'어떤 불빛은, 눈을 감아도 오래 남는다.',action:'처음부터 다시 읽다'}
];
let flashUntil=0;
function setTime(time){
 state.time=time;
 document.querySelectorAll('.time-option').forEach(el=>el.classList.toggle('active',el.dataset.time===time));
 applyTheme();
}
function updateGameUI(){
 const page=state.page,data=storyPages[page];
 $('missionKicker').textContent=data.kicker;
 $('missionTitle').textContent=data.title;
 const paragraphs=[...data.paragraphs];
 if(page===3&&state.choice==='memory')paragraphs.unshift('“두 번 깜박이면 기다리고 있다는 뜻이야.” 할아버지의 말이 그제야 돌아왔다.');
 if(page===11&&state.choice==='memory')paragraphs[1]='윤은 이제 알았다. 할아버지가 돌아올 배가 없는 날에도 바다를 바라보던 이유를.';
 $('storyProse').replaceChildren(...paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p}));
 $('dialogueSpeaker').textContent=data.speaker;
 $('dialogueText').textContent=data.dialogue;
 $('stageCounter').textContent=String(page+1).padStart(2,'0')+' / 12';
 $('progressBar').style.width=((page+1)/12*100)+'%';
 const waiting=page===9&&!state.arrivalReady;
 $('primaryAction').disabled=waiting;
 $('primaryAction').textContent=waiting?'배가 가까워지고 있다…':data.action+' →';
 $('secondaryAction').hidden=!data.alternate;
 $('secondaryAction').textContent=data.alternate||'';
 $('previousAction').disabled=page===0;
 $('readingStatus').textContent=waiting?'문장 너머에서 배가 돌아오는 중':page===2?'어느 쪽에 마음이 머무나요':page===11?'끝 · 풍경은 조금 더 머물러도 좋아요':'← → 키로도 넘길 수 있어요';
 const card=document.querySelector('.reading-card');card.classList.remove('page-turn');void card.offsetWidth;card.classList.add('page-turn');
 fitReader();
}
function clearRoute(){
 routeGlow.children.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose()});routeGlow.clear();
 routeBuoys.forEach(b=>{b.lit=false;b.light.intensity=0;b.lamp.emissiveIntensity=.2;b.group.scale.setScalar(1);b.group.visible=state.page>=3});
}
function setStoryPage(page){
 state.page=Math.max(0,Math.min(11,page));
 setTime(state.page>=3?'night':'sunset');
 clearRoute();
 for(let i=0;i<Math.min(3,Math.max(0,state.page-3));i++)lightRoute(i);
 setLighthouse(state.page>=8,false);
 if(state.page===8||state.page===9)flashUntil=performance.now()/1000+.6;
 state.returning=state.page>=9;
 state.returnProgress=state.page>=10?1:0;
 state.arrivalReady=state.page>=10;
 celebrationLights.forEach(l=>l.mesh.visible=state.page>=10);
 if(state.page>=10)windowMat.emissiveIntensity=4.5;
 revealStoryObjects();
 updateGameUI();
 focusStoryPage();
}
function nextStory(choice){
 if(state.page===9&&!state.arrivalReady)return;
 if(state.page===2)state.choice=choice||'signal';
 if(state.page===11){resetGame();return}
 setStoryPage(state.page+1);
}
function resetGame(){state.choice='signal';setStoryPage(0)}
function fitReader(){
 if(window.innerWidth<=900){
  const stage=document.querySelector('.novel-stage'),card=document.querySelector('.reading-card');
  wrap.style.top=(card.offsetTop+card.offsetHeight+8)+'px';
 }else wrap.style.top='';
}
new ResizeObserver(fitReader).observe(document.querySelector('.reading-card'));
window.addEventListener('resize',fitReader);
function spawnFish(x,z){
  const group=new THREE.Group();
  group.position.set(x,.1,z);
  world.add(group);
  const fishMat=mat('#edaa6a');
  sphere(group,0,0,0,.13,fishMat,1.5,.55,.65);
  const tail=addMesh(group,new THREE.ConeGeometry(.095,.18,3),fishMat,-.23,0,0);tail.rotation.z=Math.PI/2;
  state.fish.push({group,start:performance.now()/1000,x,z});
}
function touchWater(point){
  const now=performance.now()/1000;
  state.ripples.push({x:point.x,z:point.z,start:now});
  state.ripples=state.ripples.slice(-8);
  if(Math.random()<.3){spawnFish(point.x,point.z);toast('물고기가 깜짝 놀랐어요 🐟')}
  else toast('물결이 퍼져나가요 🌊');
}
function sceneClick(event){
  const rect=canvas.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const visibleTargets=clickTargets.filter(mesh=>{let obj=mesh;while(obj){if(!obj.visible)return false;obj=obj.parent}return true});
  const hits=raycaster.intersectObjects(visibleTargets,false);
  if(!hits.length)return;
  const hit=hits[0];
  if(hit.object.userData.action==='lighthouse'){if(state.page===7||state.page===8)nextStory();else setLighthouse(!state.lighthouseOn);return}
  if(hit.object.userData.action==='ship'){if(state.page===2)nextStory('signal');else toast('선장은 마지막 편지를 품고 있었다.');return}
  if(hit.object.userData.action==='letter'){if(state.page===10)nextStory();return}
  if(hit.object.userData.action==='buoy'){const index=hit.object.userData.index;if(state.page===index+3)nextStory();else{lightRoute(index);toast('바다 위에 작은 불빛이 남았다.')}return}
  if(hit.object===waterMesh){touchWater(hit.point)}
}

function resize(){
  const rect=wrap.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const aspect=rect.width/rect.height;
  const span=Math.max(13.5,(window.innerWidth<=900?22:21.2)/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;
  camera.top=span/2;camera.bottom=-span/2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2.25));
  renderer.setSize(rect.width,rect.height,false);
}
const observer=new ResizeObserver(resize);observer.observe(wrap);resize();

function animate(ms){
  const dt=Math.min((ms-lastFrame)/1000,.05);lastFrame=ms;
  const t=ms/1000;
  director.update(ms,dt);
  controls.update();
  animateStoryObjects(t,dt);
  waterUniforms.uTime.value=t;
  waterUniforms.uAmplitude.value=.014+state.waves*.00125;
  state.ripples=state.ripples.filter(r=>t-r.start<2.4);
  for(let i=0;i<8;i++){const ripple=state.ripples[i];waterUniforms.uRipples.value[i].set(ripple?ripple.x:0,ripple?ripple.z:0,ripple?t-ripple.start:-1)}
  if(state.boats)state.boatClock+=dt;
  for(let i=0;i<boats.length;i++){
    const boat=boats[i];if(boat.group===returnBoat)continue;
    boat.group.position.x=boat.x+Math.sin(state.boatClock*(.32+i*.035)+boat.phase)*.55;
    boat.group.position.z=boat.z+Math.cos(state.boatClock*(.2+i*.045)+boat.phase)*.12;
    boat.group.position.y=.19+Math.sin(t*1.9+boat.phase)*(.016+state.waves*.00034);
    boat.group.rotation.z=Math.sin(t*.8+boat.phase)*.024;
  }
  if(state.returning)state.returnProgress=Math.min(1,state.returnProgress+dt/8);
  const p=state.returnProgress;
  const boatPoint=returnPath.getPoint(p),boatAhead=returnPath.getPoint(Math.min(1,p+.008));
  returnBoat.position.set(boatPoint.x,.19+Math.sin(t*1.7)*.028,boatPoint.z);
  returnBoat.rotation.y=state.returning?-Math.atan2(boatAhead.z-boatPoint.z,boatAhead.x-boatPoint.x):0;
  if(state.page===9&&p>=1&&!state.arrivalReady){state.arrivalReady=true;updateGameUI()}
  for(const bird of birds){bird.line.visible=state.birds;bird.line.position.x=bird.baseX+Math.sin(t*.35+bird.phase)*.48;bird.line.position.y=4.1+Math.sin(t*1.2+bird.phase)*.14;bird.line.rotation.z=Math.sin(t*2+bird.phase)*.16}
  for(let i=state.fish.length-1;i>=0;i--){const fish=state.fish[i],age=t-fish.start;if(age>1.05){world.remove(fish.group);state.fish.splice(i,1)}else{fish.group.position.y=.09+Math.sin(age/1.05*Math.PI)*.66;fish.group.rotation.z=-age*1.8}}
  if(state.lighthouseOn){
    const source=new THREE.Vector3(5.82,3.43,1.87),dir=new THREE.Vector3(Math.cos(t*.55),-.22,Math.sin(t*.55)).normalize();
    beam.position.copy(source).addScaledVector(dir,2.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir);
    beam.material.opacity=state.time==='night'?.16:.07;
    lanternGlow.material.opacity=t<flashUntil?1:.85+Math.sin(t*3)*.1;
    lanternGlow.scale.setScalar(t<flashUntil?3.2:2.1);
    lanternLight.intensity=t<flashUntil?13:state.time==='night'?7:3.5;
  }
  for(let i=0;i<routeBuoys.length;i++)if(routeBuoys[i].group.visible){routeBuoys[i].group.position.y=Math.sin(t*1.6+i)*.025;routeBuoys[i].ring.material.opacity=.55+Math.sin(t*3+i)*.25}
  for(const light of celebrationLights)if(light.mesh.visible){light.mesh.position.y=light.baseY+Math.sin(t*2+light.phase)*.17;light.mesh.scale.setScalar(.75+Math.sin(t*4+light.phase)*.25)}
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
applyPalette();setStoryPage(0);requestAnimationFrame(animate);

canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY}});
canvas.addEventListener('pointerup',event=>{if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<7)sceneClick(event);pointerStart=null});
canvas.addEventListener('pointercancel',()=>pointerStart=null);
document.querySelectorAll('.time-option').forEach(button=>button.addEventListener('click',()=>setTime(button.dataset.time)));
document.querySelectorAll('.palette').forEach(button=>button.addEventListener('click',()=>{state.palette=button.dataset.palette;applyPalette()}));
$('waveRange').addEventListener('input',event=>{state.waves=Number(event.target.value);$('waveValue').textContent=`${state.waves}%`});
$('boatsToggle').addEventListener('change',event=>state.boats=event.target.checked);
$('birdsToggle').addEventListener('change',event=>state.birds=event.target.checked);
$('lighthouseToggle').addEventListener('change',event=>setLighthouse(event.target.checked));
$('resetView').addEventListener('click',focusStoryPage);
$('zoomIn').addEventListener('click',()=>director.zoom(1.22));
$('zoomOut').addEventListener('click',()=>director.zoom(1/1.22));
$('overviewView').addEventListener('click',()=>{$('shotLabel').textContent='항구 전체 보기';director.move(storyShots[0])});
$('downloadImage').addEventListener('click',()=>{renderer.render(scene,camera);const link=document.createElement('a');link.download='harbor-jelly-3d.png';link.href=canvas.toDataURL('image/png');link.click()});
$('primaryAction').addEventListener('click',()=>nextStory('signal'));
$('secondaryAction').addEventListener('click',()=>nextStory('memory'));
$('previousAction').addEventListener('click',()=>setStoryPage(state.page-1));
$('restartButton').addEventListener('click',resetGame);
document.addEventListener('keydown',event=>{
 if(['BUTTON','INPUT','SUMMARY'].includes(document.activeElement?.tagName)||$('aboutDialog').open)return;
 if(event.code==='ArrowRight'){event.preventDefault();nextStory('signal')}
 if(event.code==='ArrowLeft'&&state.page>0){event.preventDefault();setStoryPage(state.page-1)}
});
$('aboutButton').addEventListener('click',()=>$('aboutDialog').showModal());
$('closeAbout').addEventListener('click',()=>$('aboutDialog').close());
