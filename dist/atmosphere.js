import * as THREE from 'three';

export class HarborMist{
 constructor(world){
  this.uniforms={uTime:{value:0},uAmount:{value:0}};
  const material=new THREE.ShaderMaterial({uniforms:this.uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uAmount;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 p=vUv*vec2(8.,5.)+vec2(uTime*.035,-uTime*.015);float cloud=noise(p)*.6+noise(p*2.2)*.3+noise(p*4.4)*.1;float edge=smoothstep(0.,.12,vUv.x)*smoothstep(0.,.12,1.-vUv.x)*smoothstep(0.,.14,vUv.y)*smoothstep(0.,.14,1.-vUv.y);gl_FragColor=vec4(vec3(.46,.58,.61),smoothstep(.25,.7,cloud)*edge*uAmount*.23);}`});
  this.layers=[];
  for(let i=0;i<3;i++){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(25,17),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(i*.5,.6+i*.7,.5-i);mesh.renderOrder=4+i;world.add(mesh);this.layers.push(mesh)}
 }
 update(t,mystery){this.uniforms.uTime.value=t;this.uniforms.uAmount.value=THREE.MathUtils.lerp(this.uniforms.uAmount.value,mystery?1:0,.04);this.layers.forEach(layer=>layer.visible=this.uniforms.uAmount.value>.005)}
}
