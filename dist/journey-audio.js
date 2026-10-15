// Recorded CC0 nature sounds, filtered air noise and quiet wheel rumble. No music or tonal soundtrack.
export class NatureAudio{
 constructor(){this.enabled=false;this.volume=.42;this.chapter='train';this.ready=false;this.failed=false;this.clock=0}
 async start(){
  if(this.context){await this.context.resume();this.enabled=true;this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.8);return}
  const C=window.AudioContext||window.webkitAudioContext;this.context=new C();await this.context.resume();const c=this.context;
  this.master=c.createGain();this.master.gain.value=0;const compressor=c.createDynamicsCompressor();compressor.threshold.value=-12;compressor.ratio.value=5;this.master.connect(compressor);compressor.connect(c.destination);
  this.channels={};for(const name of ['air','birds','waves','wheels']){const g=c.createGain();g.gain.value=0;g.connect(this.master);this.channels[name]=g}
  const noise=c.createBuffer(2,c.sampleRate*8,c.sampleRate);for(let ch=0;ch<2;ch++){const d=noise.getChannelData(ch);let b=0;for(let i=0;i<d.length;i++){b=(b+(Math.random()*2-1)*.025)/1.025;d[i]=b*3.2;}}
  for(const [name,freq] of [['air',550],['wheels',130]]){const source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=freq;source.connect(filter);filter.connect(this.channels[name]);source.start();}
  this.enabled=true;this.master.gain.setTargetAtTime(this.volume,c.currentTime,.8);
  await Promise.allSettled([this.load('birds','./assets/audio/forest-birds.mp3'),this.load('waves','./assets/audio/wave-one.mp3'),this.load('waves','./assets/audio/wave-two.mp3',.45)]);this.ready=true;
 }
 async load(channel,url,mix=1){try{const r=await fetch(url);if(!r.ok)throw new Error('audio');const buffer=await this.context.decodeAudioData(await r.arrayBuffer()),source=this.context.createBufferSource(),g=this.context.createGain();source.buffer=buffer;source.loop=true;g.gain.value=mix;source.connect(g);g.connect(this.channels[channel]);source.start(0,channel==='waves'?Math.min(1.3,buffer.duration/3):0);}catch{this.failed=true}}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(this.enabled?v:0,this.context.currentTime,.35)}
 toggle(){if(!this.context)return this.start();this.enabled=!this.enabled;this.context.resume();this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.5);return Promise.resolve()}
 update(chapter,time,progress=0){this.chapter=chapter;if(!this.context||!this.channels)return;const c=this.context.currentTime;
  const values=chapter==='train'?{air:.28,birds:progress>.35?.08:.01,waves:progress>.65?.16:0,wheels:.2*(.9+.1*Math.sin(time*12))}:chapter==='forest'?{air:.3,birds:.55,waves:.035,wheels:0}:{air:.24,birds:.015,waves:.48+Math.sin(time*.42)*.12,wheels:0};
  for(const [name,value] of Object.entries(values))this.channels[name].gain.setTargetAtTime(value,c,1.2);
 }
}
