import * as THREE from 'three';

const PLATES={arrival:['harbor-arrival.png','harbor-depth.png'],archive:['lighthouse-archive.png','archive-depth.png'],after:['harbor-after-rain.png','after-rain-depth.png']};
const lerp=THREE.MathUtils.lerp;
const clamp=THREE.MathUtils.clamp;

// A textured depth-relief mesh, rather than an orbitable solid architectural model.
// Keep movement shallow: unseen sides cannot be reconstructed from a single view.
export class CinematicScene{
 constructor(canvas,onStatus,onReady){
  this.canvas=canvas;this.onStatus=onStatus;this.onReady=onReady;this.width=28;this.height=20;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#172a32');
  this.camera=new THREE.OrthographicCamera(-14,14,10,-10,.1,100);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.layers={};this.active='arrival';this.genre='mystery';this.page=0;this.time=0;
  this.current={x:0,y:0,yaw:0,pitch:0,zoom:1};this.target={...this.current};this.pointer=null;this.manual=false;
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
  this.addRain();this.bind();this.resize();
  this.start=performance.now();this.last=this.start;this.running=true;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  this.load().catch(error=>{console.error('Harbor scene failed to load',error);this.canvas.hidden=true;onReady(false)});
 }
 async load(){
  const loader=new THREE.TextureLoader();
  const load=src=>new Promise((resolve,reject)=>loader.load('./assets/'+src,resolve,undefined,reject));
  for(const [id,files] of Object.entries(PLATES)){
   const [map,depth]=await Promise.all(files.map(load));map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
   const ratio=map.image.width/map.image.height, h=20,w=h*ratio;
   const geo=new THREE.PlaneGeometry(w,h,180,130);
   const uniforms={uMap:{value:map},uDepth:{value:depth},uOpacity:{value:id==='arrival'?1:0},uTime:{value:0},uCold:{value:0},uFog:{value:0},uOutdoor:{value:id==='archive'?0:1},uRipple:{value:new THREE.Vector3(-1,-1,-1)}};
   const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`
    uniform sampler2D uDepth;varying vec2 vUv;varying float vDepth;
    void main(){vUv=uv;vDepth=texture2D(uDepth,uv).r;vec3 p=position;p.z+=vDepth*2.7;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}
   `,fragmentShader:`
    uniform sampler2D uMap;uniform float uOpacity,uTime,uCold,uFog,uOutdoor;uniform vec3 uRipple;varying vec2 vUv;varying float vDepth;
    float noise(vec2 p){return sin(p.x*2.2+sin(p.y*3.1))*.5+.5;}
    void main(){
     vec2 uv=vUv;
     float water=smoothstep(.81,.87,uv.x)*(1.0-smoothstep(.4,.54,uv.y))*uOutdoor;
     uv.x+=sin(uv.y*150.0+uTime*.7)*.0007*water;uv.y+=sin(uv.x*110.0+uTime*.9)*.0005*water;
     float age=uTime-uRipple.z;
     if(age>0.0&&age<2.2){vec2 d=uv-uRipple.xy;float r=length(d);float crest=exp(-pow((r-age*.08)*48.0,2.0));uv+=normalize(d+vec2(.0001))*crest*.002*(1.0-age/2.2)*uOutdoor;}
     vec3 c=texture2D(uMap,uv).rgb;
     vec3 cold=vec3(c.r*.78,c.g*.91,c.b*1.04);c=mix(c,cold,uCold*.55);
     float mist=pow(1.0-vDepth,2.1)*uFog*(.08+.07*noise(uv*9.0+vec2(uTime*.015,0)));
     c=mix(c,vec3(.32,.41,.46),mist);
     gl_FragColor=vec4(c,uOpacity);
     #include <colorspace_fragment>
    }`});
   const mesh=new THREE.Mesh(geo,material);mesh.renderOrder=id==='arrival'?0:id==='archive'?1:2;this.scene.add(mesh);
   const sample=document.createElement('canvas');sample.width=depth.image.width;sample.height=depth.image.height;const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(depth.image,0,0);
   this.layers[id]={mesh,uniforms,w,h,sample:ctx};
   if(id==='arrival'){this.width=w;this.height=h;this.onReady(true);this.resize();}
  }
  this.loaded=true;this.canvas.dataset.assets='ready';
 }
 addRain(){
  const n=220,positions=new Float32Array(n*6);this.drops=[];
  for(let i=0;i<n;i++){const drop={x:(Math.random()-.5)*36,y:Math.random()*28-12,z:Math.random()*8+3,speed:3+Math.random()*5,len:.09+Math.random()*.14};this.drops.push(drop);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.rain=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#cbdde1',transparent:true,opacity:.08,depthWrite:false}));this.rain.renderOrder=5;this.scene.add(this.rain);
 }
 bind(){
  const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,drag:false,id:e.pointerId};c.setPointerCapture(e.pointerId)});
  c.addEventListener('pointermove',e=>{const p=this.pointer;if(!p)return;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>5)p.drag=true;if(p.drag){this.manual=true;this.onStatus('직접 둘러보는 중');this.target.yaw=clamp(this.target.yaw+(e.clientX-p.lastX)*.0009,-.12,.12);this.target.pitch=clamp(this.target.pitch+(e.clientY-p.lastY)*.0007,-.08,.08)}p.lastX=e.clientX;p.lastY=e.clientY});
  c.addEventListener('pointerup',e=>{const p=this.pointer;if(p&&!p.drag)this.ripple(e.clientX,e.clientY);this.pointer=null});c.addEventListener('pointercancel',()=>this.pointer=null);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?1/1.08:1.08)},{passive:false});
  let touchDistance=0;
  c.addEventListener('touchstart',e=>{if(e.touches.length===2){this.pointer=null;touchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}},{passive:true});
  c.addEventListener('touchmove',e=>{if(e.touches.length!==2)return;e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(touchDistance)this.zoom(d/touchDistance);touchDistance=d},{passive:false});
 }
 resize(){
  const {width:w,height:h}=this.canvas.getBoundingClientRect();if(!w||!h)return;
  this.renderer.setSize(w,h,false);const aspect=w/h;
  const plate=this.layers[this.active],ratio=plate?plate.w/plate.h:1.404;
  // Cover the viewport without letterboxing. Mobile favours the people, with text above.
  const span=Math.min(20,20*ratio/aspect)/1.055;
  this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
  this.mobile=w<760;this.mobileX=this.mobile?2.5:0;
 }
 setPage(genre,page,scene,shot){
  this.genre=genre;this.page=page;this.active=scene;this.manual=false;
  const poses={wide:{x:0,y:0,zoom:1},people:{x:1.2,y:-.3,zoom:1.13},friends:{x:1,y:-.1,zoom:1.06},letter:{x:-1.2,y:-.5,zoom:1.13},radio:{x:1.1,y:-.35,zoom:1.11},clock:{x:1.5,y:.6,zoom:1.16},lighthouse:{x:2,y:1,zoom:1.15}};
  this.target={...poses[shot]||poses.wide,yaw:0,pitch:0};this.canvas.dataset.scene=scene;this.onStatus('장면으로 이동하는 중');this.settleAt=performance.now()+1200;this.resize();
 }
 zoom(factor){this.manual=true;this.target.zoom=clamp(this.target.zoom*factor,1,1.7);this.onStatus('직접 둘러보는 중')}
 overview(){this.target={x:0,y:0,zoom:1,yaw:0,pitch:0};this.manual=true;this.onStatus('풍경 전체 보기')}
 focus(u,v){const plate=this.layers[this.active];if(!plate)return;this.target.x=clamp((u-.5)*plate.w*.3,-2,2);this.target.y=clamp((.5-v)*plate.h*.3,-1.5,1.5);this.target.zoom=1.4;this.onStatus('기록에 가까이');this.manual=true}
 point(u,v){
  const plate=this.layers[this.active];if(!plate)return null;
  const d=plate.sample.getImageData(Math.min(plate.sample.canvas.width-1,Math.floor(u*plate.sample.canvas.width)),Math.min(plate.sample.canvas.height-1,Math.floor(v*plate.sample.canvas.height)),1,1).data[0]/255;
  return new THREE.Vector3((u-.5)*plate.w,(.5-v)*plate.h,d*2.7);
 }
 screenPoint(u,v){const p=this.point(u,v);if(!p)return null;p.project(this.camera);const r=this.canvas.getBoundingClientRect();return {x:(p.x*.5+.5)*r.width,y:(-.5*p.y+.5)*r.height}}
 ripple(x,y){const r=this.canvas.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);const plate=this.layers[this.active];if(!plate)return;const hit=ray.intersectObject(plate.mesh)[0];if(hit)plate.uniforms.uRipple.value.set(hit.uv.x,hit.uv.y,this.time)}
 frame(ms){
  if(!this.running)return;const dt=Math.min((ms-this.last)/1000,.05);this.last=ms;this.time=(ms-this.start)/1000;
  const ease=this.reduced?1:1-Math.exp(-dt*4.2);
  for(const k of ['x','y','yaw','pitch','zoom'])this.current[k]=lerp(this.current[k],this.target[k],ease);
  const {x,y,yaw,pitch,zoom}=this.current;const cx=x+(this.mobileX||0),cy=y;
  this.camera.position.set(cx+Math.sin(yaw)*30,cy+Math.sin(pitch)*30,Math.cos(yaw)*Math.cos(pitch)*30);
  this.camera.lookAt(cx,cy,0);this.camera.zoom=zoom;this.camera.updateProjectionMatrix();
  const dark=this.genre==='mystery'&&this.page>=2;
  for(const [id,layer] of Object.entries(this.layers)){
   layer.uniforms.uOpacity.value=lerp(layer.uniforms.uOpacity.value,id===this.active?1:0,this.reduced?1:1-Math.exp(-dt*4));
   layer.mesh.visible=layer.uniforms.uOpacity.value>.005;layer.uniforms.uTime.value=this.time;
   layer.uniforms.uCold.value=lerp(layer.uniforms.uCold.value,dark?1:0,ease);layer.uniforms.uFog.value=lerp(layer.uniforms.uFog.value,dark?1:0,ease);
  }
  this.rain.visible=!this.reduced&&this.active==='arrival';
  if(this.rain.visible){const a=this.rain.geometry.attributes.position;for(let i=0;i<this.drops.length;i++){const d=this.drops[i];d.y-=dt*d.speed;d.x-=dt*.25;if(d.y< -14)d.y=14;a.setXYZ(i*2,d.x,d.y,d.z);a.setXYZ(i*2+1,d.x-.018,d.y-d.len,d.z)}a.needsUpdate=true;}
  if(this.settleAt&&ms>this.settleAt){this.settleAt=0;if(!this.manual)this.onStatus('이야기의 시선')}
  this.renderer.render(this.scene,this.camera);
  this.canvas.dataset.view=[x,y,yaw,pitch,zoom].map(v=>v.toFixed(3)).join(',');
  this.onFrame?.();requestAnimationFrame(this.frame);
 }
 save(){this.renderer.render(this.scene,this.camera);return this.canvas.toDataURL('image/png')}
}
