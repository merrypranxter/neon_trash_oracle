/* Neon Trash Oracle - WebGL2 recombinant engine.
 * The original archived shader programs are NOT represented as identical to this engine.
 * Uses a real ping-pong reaction-diffusion state, image history feedback and post effects.
 */
(function(){
"use strict";
const VERT = `#version 300 es
precision highp float;
out vec2 vUV;
void main(){
 vec2 p = vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
 vUV = p;
 gl_Position = vec4(p*2.0-1.0,0.0,1.0);
}`;
const SIM = `#version 300 es
precision highp float;
in vec2 vUV;out vec4 frag;
uniform sampler2D uState;
uniform vec2 uSimRes;uniform float uReset,uSeed,uDt,uGrowth,uSpread;
uniform vec3 uPointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 uv=clamp(vUV,0.0,1.0);
 vec2 px=1.0/uSimRes;
 if(uReset>0.5){
  vec2 g=floor(uv*19.0);
  float h=hash(g+uSeed*17.3);
  float cell=step(0.83,h)*step(length(fract(uv*19.0)-0.5),0.35);
  float init= max(cell*0.95,0.025*hash(floor(uv*135.0)+uSeed));
  frag=vec4(1.0-init*0.65,init,hash(g+uSeed),1.0);return;
 }
 vec4 c=texture(uState,uv),n=texture(uState,uv+vec2(0.0,px.y)),
 s=texture(uState,uv-vec2(0.0,px.y)),e=texture(uState,uv+vec2(px.x,0.0)),w=texture(uState,uv-vec2(px.x,0.0));
 vec2 lap=(n.rg+s.rg+e.rg+w.rg)*0.25-c.rg;
 float reaction=c.r*c.g*c.g;
 float feed=0.021+uGrowth*0.036;
 float kill=0.047+uSpread*0.021;
 float injected=uPointer.z*exp(-dot(uv-uPointer.xy,uv-uPointer.xy)*650.0)*0.35;
 float a=clamp(c.r+uDt*(0.7*lap.r-reaction+feed*(1.0-c.r)-injected*0.6),0.0,1.0);
 float b=clamp(c.g+uDt*(0.32*lap.g+reaction-(kill+feed)*c.g+injected),0.0,1.0);
 frag=vec4(a,b,c.b,1.0);
}`;
const SCENE = `#version 300 es
precision highp float;
in vec2 vUV;out vec4 frag;
uniform sampler2D uState,uHistory;
uniform vec2 uRes,uPointer;
uniform vec3 uC0,uC1,uC2,uC3,uC4;
uniform float uTime,uSeed,uDensity,uWarp,uMoire,uFoam,uGlitch,uPrism,uFeedback,uDepth,uTape,uPixel,uHue,uSpeed,uGlow,uCell,uColorMotion;
uniform int uPattern;
#define PI 3.14159265359
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int j=0;j<4;j++){s+=a*noise(p);p=p*2.07+7.0;a*=0.5;}return s;}
float voronoi(vec2 p,float t){
 vec2 i=floor(p),f=fract(p);float d=9.0;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 o=vec2(float(x),float(y)),h=vec2(hash(i+o),hash(i+o+63.2));
  vec2 r=o+0.5+0.43*sin(t*vec2(0.67,0.91)+6.283*h)-f;
  d=min(d,dot(r,r));
 }
 return sqrt(d);
}
vec3 pal(float x){
 x=fract(x);
 float z=x*4.0;int k=int(floor(z));float f=fract(z);f=f*f*(3.0-2.0*f);
 if(k==0)return mix(uC0,uC1,f);
 if(k==1)return mix(uC1,uC2,f);
 if(k==2)return mix(uC2,uC3,f);
 return mix(uC3,uC4,f);
}
vec3 hueShift(vec3 c,float ang){
 vec3 axis=normalize(vec3(1.0));return clamp(c*cos(ang)+cross(axis,c)*sin(ang)+axis*dot(axis,c)*(1.0-cos(ang)),0.0,1.6);
}
void main(){
 vec2 uv=clamp(vUV,0.0,1.0);
 float t=uTime*0.43;
 float ratio=uRes.x/max(1.0,uRes.y);
 vec2 p=(uv-0.5)*vec2(ratio,1.0)*2.3;
 vec2 touch=(uPointer-0.5)*vec2(ratio,1.0)*2.3;
 float nearTouch=exp(-dot(p-touch,p-touch)*3.0);
 p += uWarp*0.26*vec2(fbm(p*2.4+t*0.29),fbm(p.yx*2.3-t*0.22))*2.0-uWarp*0.26;
 p += nearTouch*uWarp*0.34*(p-touch)/(0.2+length(p-touch));
 float r=length(p),ang=atan(p.y,p.x);
 float n=fbm(p*2.0+uSeed*0.1+t*0.25);
 float sim=texture(uState,fract(uv+vec2(0.015*sin(t),0.012*cos(t)))).g;
 float ss=texture(uState,fract(uv)).r;
 float zoom=uDensity*0.6+1.0;
 float wave=0.0,detail=0.0,body=0.0;
 if(uPattern==0){
   float a=sin(r*(20.0*zoom)+t*2.0+sin(ang*7.0)*uWarp*3.0);
   float b=sin(r*(21.8*zoom)-t*1.4+cos(ang*11.0)*uWarp);
   wave=a*b;
   detail=sin(ang*(13.0+uDensity*2.0)+t*1.5)*sin(r*18.0);
   body=sin(r*7.0-t+sim*8.0);
 }else if(uPattern==1){
   float v=voronoi(p*(2.3+uCell*3.0)+0.2*t,t);
   wave=sin(v*18.0-sim*11.0-t*2.0);
   detail=1.0-smoothstep(0.06,0.23,v);
   body=1.0-smoothstep(0.15,0.76,v+sim*uFoam*0.45);
 }else if(uPattern==2){
   float q=0.0;
   for(int i=0;i<7;i++){float a=float(i)*PI/7.0;q+=sin(dot(p,vec2(cos(a),sin(a)))*zoom*11.0+t*(mod(float(i),2.0)*2.0-1.0));}
   wave=sin(q*2.0+t);detail=cos(q*4.0-uWarp*n*3.0);body=q/7.0;
 }else if(uPattern==3){
   float y=p.y+uTape*0.15*sin(p.x*11.0+t*2.0)+sim*0.23;
   wave=sin(y*zoom*23.0+t*1.3);
   detail=sin(p.x*zoom*24.0-t*1.9)*sin(y*12.0);
   body=sin((p.x+p.y)*7.0+uTape*n*12.0-t);
 }else if(uPattern==4){
   float sector=floor((ang+PI)/(2.0*PI)*16.0);
   float g=abs(sin(ang*8.0+sin(r*17.0+t)*0.5));
   wave=sin(r*zoom*27.0-t*2.0)*g;
   detail=sin(sector*5.5+floor(r*18.0)*9.0+t*0.5);
   body=cos(ang*16.0+r*8.0+sim*9.0);
 }else if(uPattern==5){
   vec2 block=floor(p*(4.0+zoom*10.0)+vec2(0.0,t*0.4));
   float dat=hash(block+uSeed);
   wave=sin(p.x*zoom*35.0)*sin(p.y*zoom*27.0);
   detail=dat*2.0-1.0;
   body=sin((p.x+p.y)*zoom*9.0+t)+dat*0.6;
 }else{
   vec2 hp=p/(0.18+r*0.7);
   float tunnel=atan(hp.y,hp.x)*7.0+1.7/(0.08+r)-t*2.0;
   wave=sin(tunnel*zoom);
   detail=sin(atan(p.y,p.x)*20.0+r*zoom*42.0-t*3.0);
   body=cos(1.8/(0.15+r)+t+sim*8.0);
 }
 float moire=sin((p.x*0.85+p.y*0.62)*31.0*zoom+t)*cos((p.x*0.78-p.y*0.68)*32.3*zoom-t);
 float foam=sin(sim*20.0+ss*4.0+n*6.0);
 float shape=wave*0.38+detail*0.24+body*0.25+moire*uMoire*0.4+foam*uFoam*0.33;
 float phase=shape*0.32+n*0.24+t*uColorMotion*0.3+uSeed*0.071;
 vec3 col=pal(phase);
 vec3 alt=pal(phase+0.23);
 col=mix(col,alt,0.34+0.31*wave);
 float luminous=pow(clamp(0.53+0.5*shape,0.0,1.0),2.0);
 col *=0.40+1.22*luminous;
 col += pal(phase+0.44)*pow(max(0.0,detail*wave),4.0)*0.65*uGlow;
 col += pal(phase+0.72)*pow(max(0.0,moire),4.0)*uMoire*0.45;
 col += pal(sim+phase+0.28)*pow(sim,1.3)*0.52*uFoam;
 col += nearTouch*0.32*pal(phase+0.7);
 vec2 memUV=uv+vec2(0.008*uFeedback*sin(t*1.4+uv.y*14.0),0.008*uFeedback*cos(t*1.5+uv.x*14.0));
 float band=floor(uv.y*(38.0+uDensity*14.0)+floor(t*3.0));
 float damage=step(0.88,hash(vec2(band,floor(t*5.0)+uSeed)));
 memUV.x+=(hash(vec2(band,uSeed+floor(t*7.0)))-0.5)*damage*uGlitch*0.17;
 vec3 prev=texture(uHistory,clamp(memUV,0.001,0.999)).rgb;
 col=mix(col,prev,uFeedback*(0.24+damage*0.46));
 float pixel=max(1.0,uPixel*110.0);
 vec2 q=floor(uv*vec2(pixel*ratio,pixel))/vec2(pixel*ratio,pixel);
 vec3 corrupt=texture(uHistory,clamp(q+vec2(damage*uGlitch*0.16,0.0),0.0,1.0)).rgb;
 col=mix(col,corrupt,damage*uGlitch*0.65);
 vec2 ab=vec2(uPrism*0.009*(1.0+r),0.0);
 vec3 split=vec3(texture(uHistory,clamp(memUV+ab,0.0,1.0)).r,col.g,texture(uHistory,clamp(memUV-ab,0.0,1.0)).b);
 col=mix(col,split,uPrism*0.42);
 col=hueShift(col,uHue*6.28318);
 col=mix(col,col*col*(3.0-2.0*col),uDepth*0.2);
 frag=vec4(clamp(col,0.0,1.0),1.0);
}`;
const PRESENT = `#version 300 es
precision highp float;
in vec2 vUV;out vec4 frag;
uniform sampler2D uTexture;
uniform vec2 uRes;
uniform float uBloom,uCRT,uTime;
void main(){
 vec2 uv=clamp(vUV,0.0,1.0),px=1.0/uRes;
 vec3 col=texture(uTexture,uv).rgb;
 vec3 glow=vec3(0.0);
 for(int j=0;j<8;j++){
  float a=float(j)*0.785398;
  glow+=texture(uTexture,clamp(uv+vec2(cos(a),sin(a))*px*4.0,0.0,1.0)).rgb;
 }
 glow/=8.0;
 col+=glow*uBloom*0.55;
 float line=0.5+0.5*sin(uv.y*uRes.y*3.14159265);
 col*=1.0-uCRT*0.28*(1.0-line);
 float vignette=1.0-smoothstep(0.27,1.65,length((uv-0.5)*2.0));
 col*=mix(1.0,vignette,uCRT*0.28);
 float grain=fract(sin(dot(floor(uv*uRes*0.55),vec2(12.9898,78.233))+floor(uTime*14.0))*43758.5453);
 col+=(grain-0.5)*uCRT*0.065;
 frag=vec4(clamp(col,0.0,1.0),1.0);
}`;
class CorruptionEngine{
 constructor(canvas,onStatus){
  this.canvas=canvas;this.status=onStatus||function(){};
  this.gl=canvas.getContext("webgl2",{antialias:false,alpha:false,preserveDrawingBuffer:false,depth:false,stencil:false,powerPreference:"high-performance"});
  if(!this.gl)throw Error("WebGL2 is required. Try current iOS Safari or another WebGL2-capable browser.");
  this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,1);
  this.programs={sim:this.compile(SIM),scene:this.compile(SCENE),present:this.compile(PRESENT)};
  this.params={pattern:0,density:1.2,warp:0.55,moire:0.7,foam:0.75,glitch:0.24,prism:0.4,feedback:0.2,depth:0.7,tape:0.4,pixel:0.06,hue:0.0,glow:0.8,cell:0.5,growth:0.46,spread:0.39,bloom:0.45,crt:0.2,speed:0.7,colorMotion:0.34};
  this.colors=["#ff27bf","#23f9ff","#d7ff31","#8a2fff","#ff6840"];
  this.width=1;this.height=1;this.time=0;this.last=performance.now();this.paused=false;this.resetPending=true;
  this.seed=Math.random()*10000;this.pointer={x:0.5,y:0.5,down:false};
  this.simSize=256;
  this.sim=[this.makeTarget(256,256),this.makeTarget(256,256)];
  this.history=[this.makeTarget(2,2),this.makeTarget(2,2)];
  this.si=0;this.hi=0;
  this.vao=this.gl.createVertexArray();this.gl.bindVertexArray(this.vao);
  this.resize();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  canvas.addEventListener("pointerdown",e=>{this.pointer.down=true;this.capturePointer(e);try{canvas.setPointerCapture(e.pointerId)}catch(_){}});
  canvas.addEventListener("pointermove",e=>{if(this.pointer.down)this.capturePointer(e)});
  canvas.addEventListener("pointerup",()=>{this.pointer.down=false});
  canvas.addEventListener("pointercancel",()=>{this.pointer.down=false});
  window.addEventListener("resize",()=>this.resize());
  canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();this.paused=true;this.status("WebGL context lost. Reload to restore.")});
 }
 compile(fragSource){
  const gl=this.gl;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error("GLSL: "+gl.getShaderInfoLog(s));return s;}
  const vs=shader(gl.VERTEX_SHADER,VERT),fs=shader(gl.FRAGMENT_SHADER,fragSource);
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error("Shader link: "+gl.getProgramInfoLog(p));
  gl.deleteShader(vs);gl.deleteShader(fs);return p;
 }
 makeTarget(w,h){
  const gl=this.gl,t=gl.createTexture(),f=gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error("GPU render target unavailable: "+status);
  return {f,t,w,h};
 }
 dropTarget(t){if(!t)return;this.gl.deleteFramebuffer(t.f);this.gl.deleteTexture(t.t);}
 resize(){
  const rect=this.canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const w=Math.max(1,Math.min(1800,Math.round(rect.width*dpr))),h=Math.max(1,Math.min(1800,Math.round(rect.height*dpr)));
  if(w===this.width&&h===this.height)return;
  this.width=w;this.height=h;this.canvas.width=w;this.canvas.height=h;
  for(const x of this.history)this.dropTarget(x);
  this.history=[this.makeTarget(w,h),this.makeTarget(w,h)];this.hi=0;
  const gl=this.gl;
  for(const x of this.history){gl.bindFramebuffer(gl.FRAMEBUFFER,x.f);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 capturePointer(e){const r=this.canvas.getBoundingClientRect();this.pointer.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));this.pointer.y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));}
 bindTexture(program,uniform,unit,target){
  const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,target.t);const loc=gl.getUniformLocation(program,uniform);if(loc!==null)gl.uniform1i(loc,unit);
 }
 uniform(p,n,v){const gl=this.gl;const loc=gl.getUniformLocation(p,n);if(loc===null)return;
  if(typeof v==="number")gl.uniform1f(loc,v);
  else if(v.length===2)gl.uniform2f(loc,v[0],v[1]);
  else if(v.length===3)gl.uniform3f(loc,v[0],v[1],v[2]);
 }
 hexColor(x){const h=x.replace("#","");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);}
 pass(p,target,w,h){const gl=this.gl;gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.f:null);gl.viewport(0,0,w,h);gl.drawArrays(gl.TRIANGLES,0,3);}
 simPass(){
  const gl=this.gl,p=this.programs.sim,read=this.sim[this.si],write=this.sim[1-this.si];
  gl.useProgram(p);this.bindTexture(p,"uState",0,read);
  this.uniform(p,"uSimRes",[this.simSize,this.simSize]);this.uniform(p,"uReset",this.resetPending?1:0);
  this.uniform(p,"uSeed",this.seed);this.uniform(p,"uDt",1.0);
  this.uniform(p,"uGrowth",this.params.growth);this.uniform(p,"uSpread",this.params.spread);
  this.uniform(p,"uPointer",[this.pointer.x,this.pointer.y,this.pointer.down?1:0]);
  this.pass(p,write,this.simSize,this.simSize);
  this.si=1-this.si;this.resetPending=false;
 }
 scenePass(target,w,h){
  const gl=this.gl,p=this.programs.scene,q=this.params;
  gl.useProgram(p);this.bindTexture(p,"uState",0,this.sim[this.si]);this.bindTexture(p,"uHistory",1,this.history[this.hi]);
  this.uniform(p,"uRes",[w,h]);this.uniform(p,"uPointer",[this.pointer.x,this.pointer.y]);this.uniform(p,"uTime",this.time);
  this.uniform(p,"uSeed",this.seed);this.uniform(p,"uDensity",q.density);this.uniform(p,"uWarp",q.warp);
  this.uniform(p,"uMoire",q.moire);this.uniform(p,"uFoam",q.foam);this.uniform(p,"uGlitch",q.glitch);
  this.uniform(p,"uPrism",q.prism);this.uniform(p,"uFeedback",q.feedback);this.uniform(p,"uDepth",q.depth);
  this.uniform(p,"uTape",q.tape);this.uniform(p,"uPixel",q.pixel);this.uniform(p,"uHue",q.hue);
  this.uniform(p,"uGlow",q.glow);this.uniform(p,"uCell",q.cell);this.uniform(p,"uColorMotion",q.colorMotion);
  const idx=gl.getUniformLocation(p,"uPattern");if(idx!==null)gl.uniform1i(idx,q.pattern|0);
  for(let i=0;i<5;i++)this.uniform(p,"uC"+i,this.hexColor(this.colors[i]));
  this.pass(p,target,w,h);
 }
 presentPass(src,target,w,h){
  const p=this.programs.present;
  this.gl.useProgram(p);this.bindTexture(p,"uTexture",0,src);
  this.uniform(p,"uRes",[w,h]);this.uniform(p,"uBloom",this.params.bloom);
  this.uniform(p,"uCRT",this.params.crt);this.uniform(p,"uTime",this.time);
  this.pass(p,target,w,h);
 }
 frame(now){
  if(!this.paused){
   this.resize();this.time+=Math.min(0.05,(now-this.last)/1000)*this.params.speed;
   this.simPass();
   const next=1-this.hi;
   this.scenePass(this.history[next],this.width,this.height);
   this.hi=next;
   this.presentPass(this.history[this.hi],null,this.width,this.height);
  }
  this.last=now;this.raf=requestAnimationFrame(this.frame);
 }
 reseed(){this.seed=Math.random()*10000;this.resetPending=true;}
 setParams(x){Object.assign(this.params,x)}
 pauseToggle(){this.paused=!this.paused;return this.paused;}
 async savePNG(scale){
  const gl=this.gl,max=gl.getParameter(gl.MAX_TEXTURE_SIZE),factor=Math.max(1,Number(scale)||1);
  const w=Math.max(1,Math.min(max,4096,Math.round(this.width*factor)));
  const h=Math.max(1,Math.min(max,4096,Math.round(this.height*factor)));
  let scene=null,final=null;
  try{
   scene=this.makeTarget(w,h);final=this.makeTarget(w,h);
   this.scenePass(scene,w,h);this.presentPass(scene,final,w,h);
   gl.bindFramebuffer(gl.FRAMEBUFFER,final.f);
   const raw=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,raw);
   const flipped=new Uint8ClampedArray(raw.length),row=w*4;
   for(let y=0;y<h;y++)flipped.set(raw.subarray((h-1-y)*row,(h-y)*row),y*row);
   const out=document.createElement("canvas");out.width=w;out.height=h;
   const ctx=out.getContext("2d");ctx.putImageData(new ImageData(flipped,w,h),0,0);
   return await new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(Error("PNG conversion failed")),"image/png"));
  }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.dropTarget(scene);this.dropTarget(final);}
 }
}
window.CorruptionEngine=CorruptionEngine;
})();
