import * as THREE from 'three';

export class SceneDirector {
  constructor(camera, controls, onMode) {
    this.camera=camera; this.controls=controls; this.onMode=onMode;
    this.transition=null; this.follow=null;
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.addEventListener('start',()=>this.cancel());
  }
  cancel() {
    this.transition=null; this.follow=null;
    this.controls.enableDamping=true;
    this.onMode('manual');
  }
  move(pose, follow=null) {
    this.controls.enableDamping=false;
    this.controls.update();
    const from=new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const theta=from.theta+Math.atan2(Math.sin(pose.theta-from.theta),Math.cos(pose.theta-from.theta));
    this.transition={start:performance.now(),duration:this.reducedMotion?0:(pose.duration||1700),
      fromTarget:this.controls.target.clone(),toTarget:new THREE.Vector3(...pose.target),
      fromTheta:from.theta,toTheta:theta,fromPhi:from.phi,toPhi:pose.phi,
      fromRadius:from.radius,toRadius:pose.radius||26,fromZoom:this.camera.zoom,toZoom:pose.zoom};
    this.follow=follow;
    this.onMode('travelling');
  }
  zoom(factor) {
    this.cancel();
    this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*factor,this.controls.minZoom,this.controls.maxZoom);
    this.camera.updateProjectionMatrix();
  }
  update(now,dt) {
    const motion=this.transition;
    if(motion) {
      const p=motion.duration?Math.min(1,(now-motion.start)/motion.duration):1;
      const ease=p*p*p*(p*(p*6-15)+10);
      this.controls.target.lerpVectors(motion.fromTarget,motion.toTarget,ease);
      const offset=new THREE.Vector3().setFromSpherical(new THREE.Spherical(
        THREE.MathUtils.lerp(motion.fromRadius,motion.toRadius,ease),
        THREE.MathUtils.lerp(motion.fromPhi,motion.toPhi,ease),
        THREE.MathUtils.lerp(motion.fromTheta,motion.toTheta,ease)));
      this.camera.position.copy(this.controls.target).add(offset);
      this.camera.zoom=THREE.MathUtils.lerp(motion.fromZoom,motion.toZoom,ease);
      this.camera.updateProjectionMatrix();
      if(p===1){this.transition=null;this.controls.enableDamping=true;this.onMode(this.follow?'following':'scene')}
    } else if(this.follow) {
      const old=this.controls.target.clone();
      this.controls.target.lerp(this.follow(),1-Math.exp(-dt*3));
      this.camera.position.add(this.controls.target.clone().sub(old));
    }
  }
}
