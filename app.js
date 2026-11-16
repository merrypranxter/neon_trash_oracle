/* NEON TRASH ORACLE — responsive controls and archive.
 * All original sketches are loaded separately, unchanged except the legacy Three.js CDN address.
 * The live mutation engine is explicitly a new, shared shader descendant.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const filesBase="https://raw.githubusercontent.com/merrypranxter/shaderslop_designs/main/";
const githubBase="https://github.com/merrypranxter/shaderslop_designs/blob/main/";
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const palettes={
 "Hyperpop Rupture":["#ff22b4","#1efff4","#ffff36","#4b16fa","#ff642d"],
 "Cuttlefish Disco":["#f5ff30","#ff2d88","#391aff","#1cffff","#ffa8c6"],
 "Toxic Bubblegum":["#ff9de9","#ff3f61","#9afb2a","#6723d4","#0df5e8"],
 "Laser Lemonade":["#ffff06","#ec37ec","#28f8fd","#ff7a09","#7118ff"],
 "Forbidden Lisa Frank":["#ff1cc8","#7820ff","#31ff88","#fff000","#ff6241"],
 "Dead CRT":["#00ffbb","#71bafc","#d900ff","#f8faea","#ff3d80"],
 "VHS Meltdown":["#ff3e5e","#ffb300","#1bc2dd","#242aff","#ff2ca7"],
 "Iridescent Corpse":["#bbf5ff","#e7a2ff","#9cf6ab","#fbd683","#d7f9ff"],
 "Radiation Valentine":["#e6ff26","#ff328e","#0a18ee","#fef6de","#34fdff"],
 "Neon Cemetery":["#00ffbc","#fe2dff","#effd62","#5f3eff","#e6faff"],
 "Holographic Bruise":["#8c64ff","#4feeff","#ff8ae0","#fbf7dc","#4b62d8"],
 "Acid Sunrise":["#ffec22","#ff6d22","#ff149d","#6230ef","#2deccc"]
};
const sliderGroups={
 mutation:[
 ["density","Pattern density",0.3,4,0.01],["warp","Geometry warp",0,2,0.01],
 ["moire","Moiré pressure",0,2,0.01],["foam","Slime / foam",0,2,0.01],
 ["cell","Cell territory size",0,2,0.01],["growth","Growth chemistry",0,1,0.01],
 ["spread","Chemical kill rate",0,1,0.01],["tape","Tape distortion",0,2,0.01],
 ["feedback","Memory feedback",0,0.95,0.01],["glitch","Signal corruption",0,1,0.01],
 ["prism","RGB prism split",0,1,0.01],["pixel","Pixel damage",0,1,0.01],
 ["depth","Contrast depth",0,2,0.01],["speed","Animation speed",0,3,0.01]
 ],
 color:[
 ["hue","Hue rotation",0,1,0.01],["colorMotion","Color cycle speed",0,2,0.01],
 ["glow","Luminous veins",0,2,0.01],["bloom","Phosphor glow",0,2,0.01],
 ["crt","CRT / scanlines",0,1,0.01]
 ],
 breed:[["inherit","Parent B influence",0,1,0.01],["mutagen","Mutation intensity",0,1,0.01]]
};
let manifest=[],engine=null,sourceIndex=0,exactMode=false,recording=null,recordTimer=null;
let customBreed={inherit:0.5,mutagen:0.18};
let toastTimer=null;
const paintStatus=s=>{$("status").textContent=s};
const format=v=>Number(v).toFixed(2);
function toast(msg){
 const el=$("toast");el.textContent=msg;el.style.display="block";
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.style.display="none"},3100);
}
function download(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;a.rel="noopener";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function safeName(){return "neon-trash-oracle-"+new Date().toISOString().replace(/[:.]/g,"-");}
function hashName(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRandom(seed){let x=seed>>>0;return function(){x=(x+0x6D2B79F5)|0;let z=Math.imul(x^(x>>>15),1|x);z^=z+Math.imul(z^(z>>>7),61|z);return((z^(z>>>14))>>>0)/4294967296;};}
function makeProfile(item){
 const r=seededRandom(hashName(item.name));
 const tape=item.family==="tape";
 const q={
 pattern:tape?pickSeed(r,[3,6,2,0,4]):item.style,
 density:0.8+r()*2.3,warp:0.3+r()*1.0,moire:0.4+r()*1.1,
 foam:(tape?0.3:0.6)+r()*0.7,cell:r()*1.7,growth:0.25+r()*0.55,
 spread:0.17+r()*0.56,tape:(tape?0.8:0.2)+r()*0.9,
 feedback:(tape?0.32:0.14)+r()*0.37,glitch:(tape?0.35:0.15)+r()*0.46,
 prism:0.2+r()*0.75,pixel:r()*0.35,depth:0.4+r()*1.1,
 speed:0.35+r()*1.1,hue:r()*0.2,colorMotion:0.12+r()*0.8,
 glow:0.4+r()*1.1,bloom:0.3+r()*0.85,crt:r()*0.5
 };
 return q;
}
function pickSeed(r,a){return a[Math.floor(r()*a.length)];}
function populateSources(){
 const opts=manifest.map((s,i)=>({text:(s.family==="neon"?"⚡ ":"💿 ")+s.name,value:i}));
 for(const id of ["source","parentA","parentB"]){
  const el=$(id);el.innerHTML="";
  for(const o of opts){const x=document.createElement("option");x.value=o.value;x.textContent=o.text;el.append(x);}
 }
 $("parentB").selectedIndex=Math.min(manifest.length-1,7);
 $("aboutText").textContent=manifest.filter(x=>x.family==="neon").length+" Neon Trash Oracle + "+manifest.filter(x=>x.family==="tape").length+" Prismatic Tape Oracle originals located in shaderslop_designs. These archive programs are independent from the recombinant studio.";
 const list=$("sourceList");
 for(const s of manifest){
  const a=document.createElement("a");a.href=githubBase+s.code;a.target="_blank";a.rel="noopener";
  a.textContent=(s.family==="neon"?"⚡ ":"💿 ")+s.name;
  const p=document.createElement("p");p.style.margin="6px 0";p.append(a);list.append(p);
 }
}
function renderSliders(group,container){
 for(const [key,label,min,max,step] of sliderGroups[group]){
  const wrap=document.createElement("div");wrap.className="field";
  const l=document.createElement("label");const caption=document.createElement("span");caption.textContent=label;
  const out=document.createElement("output");out.id="out-"+key;
  l.append(caption,out);
  const inp=document.createElement("input");inp.type="range";inp.min=min;inp.max=max;inp.step=step;inp.id="param-"+key;
  inp.addEventListener("input",()=>{
   const v=Number(inp.value);out.textContent=format(v);
   if(group==="breed")customBreed[key]=v;
   else{if(exactMode)setMode("remix");engine.params[key]=v;}
  });
  wrap.append(l,inp);$(container).append(wrap);
 }
}
function refreshControls(){
 if(!engine)return;
 for(const group of ["mutation","color"]){
  for(const [key] of sliderGroups[group]){
   const el=$("param-"+key);el.value=engine.params[key];
   $("out-"+key).textContent=format(engine.params[key]);
  }
 }
 for(const [key] of sliderGroups.breed){$("param-"+key).value=customBreed[key];$("out-"+key).textContent=format(customBreed[key]);}
 $("pattern").value=String(engine.params.pattern);
 for(let i=0;i<5;i++)$("stop-"+i).value=engine.colors[i];
}
function setPalette(name){
 if(!engine)return;
 engine.colors=(palettes[name]||palettes["Hyperpop Rupture"]).slice();
 refreshControls();
}
function makeColorStops(){
 const host=document.createElement("div");host.className="two";host.style.gridTemplateColumns="repeat(5,minmax(0,1fr))";host.style.margin="10px 0";
 for(let i=0;i<5;i++){
  const label=document.createElement("label");label.style.fontSize="9px";label.style.color="#e9c5f1";label.textContent="STOP "+(i+1);
  const input=document.createElement("input");input.type="color";input.id="stop-"+i;input.style.width="100%";input.style.height="37px";input.style.padding="0";input.style.background="transparent";input.style.border="0";
  input.value=palettes["Hyperpop Rupture"][i];
  input.addEventListener("input",()=>{if(exactMode)setMode("remix");engine.colors[i]=input.value;});
  label.append(input);host.append(label);
 }
 $("palette").parentElement.after(host);
}
function chooseSource(index,applyProfile=true){
 if(!manifest.length||!engine)return;
 sourceIndex=clamp(index|0,0,manifest.length-1);
 $("source").value=String(sourceIndex);
 const s=manifest[sourceIndex];$("sourceName").textContent=s.name+" · "+(s.family==="tape"?"PRISMATIC TAPE":"NEON TRASH");
 $("sourceDesc").textContent=s.description||"Archived original source shader; click Exact Original to see its unmodified visual logic.";
 if(applyProfile){
  engine.setParams(makeProfile(s));
  engine.colors=palettes[s.family==="tape"?"Holographic Bruise":"Hyperpop Rupture"].slice();
  $("palette").value=s.family==="tape"?"Holographic Bruise":"Hyperpop Rupture";
  engine.reseed();refreshControls();
 }
 if(exactMode)loadExact();
 $("overlay").textContent=(exactMode?"ORIGINAL · ":"LIVE DESCENDANT · ")+s.name;
}
function setMode(mode){
 exactMode=(mode==="original");
 $("art").style.display=exactMode?"none":"block";
 $("original").style.display=exactMode?"block":"none";
 $("remix").className=exactMode?"btn":"btn main";
 $("exact").className=exactMode?"btn main":"btn";
 $("overlay").textContent=(exactMode?"ORIGINAL · ":"LIVE DESCENDANT · ")+(manifest[sourceIndex]?.name||"");
 if(exactMode){if(engine)engine.paused=true;loadExact();}
 else{
  $("original").srcdoc="";if(engine)engine.paused=false;
 }
}
async function loadExact(){
 const s=manifest[sourceIndex];if(!s)return;
 const index=sourceIndex;paintStatus("loading original "+s.name);
 try{
  const res=await fetch(filesBase+s.source);
  if(!res.ok)throw Error("GitHub returned "+res.status);
  let html=await res.text();
  if(!exactMode||sourceIndex!==index)return;
  // Source code stays identical; only restore a browser-compatible location for the old global Three.js build.
  html=html.replaceAll("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js","https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js");
  $("original").srcdoc=html;
  paintStatus("original sketch · loaded from GitHub");
 }catch(err){paintStatus("original load failed");toast("Original couldn't load: "+err.message);}
}
function surprise(){
 if(!manifest.length)return;
 setMode("remix");
 const index=Math.floor(Math.random()*manifest.length);chooseSource(index);
 const q=engine.params;
 q.pattern=Math.floor(rand(0,7));
 const keys=["density","warp","moire","foam","cell","growth","spread","tape","feedback","glitch","prism","pixel","depth","speed","hue","colorMotion","glow","bloom","crt"];
 const spans={density:[0.5,3.9],warp:[0.15,1.8],moire:[0.05,1.9],foam:[0.05,1.9],cell:[0,1.8],
 growth:[0.12,0.88],spread:[0.08,0.84],tape:[0.08,1.9],feedback:[0.07,0.82],glitch:[0.03,0.86],
 prism:[0.07,0.96],pixel:[0,0.78],depth:[0.2,1.85],speed:[0.25,1.8],hue:[0,1],colorMotion:[0.04,1.8],
 glow:[0.3,1.85],bloom:[0.1,1.65],crt:[0.03,0.8]};
 for(const key of keys)q[key]=rand(...spans[key]);
 const palette=pick(Object.keys(palettes));$("palette").value=palette;setPalette(palette);
 engine.reseed();refreshControls();toast("SURPRISE. This monstrosity is fully editable.");
}
function mutateOnce(){
 setMode("remix");
 const keys=Object.keys(engine.params).filter(x=>x!=="pattern");
 for(const key of keys){
  const spec=[...sliderGroups.mutation,...sliderGroups.color].find(x=>x[0]===key);
  if(!spec)continue;
  const amount=(spec[3]-spec[2])*rand(-0.32,0.32);
  engine.params[key]=clamp(engine.params[key]+amount,spec[2],spec[3]);
 }
 if(Math.random()<0.55)engine.params.pattern=Math.floor(rand(0,7));
 engine.reseed();refreshControls();toast("Mutated. Tweak literally anything.");
}
function breed(){
 const a=manifest[Number($("parentA").value)],b=manifest[Number($("parentB").value)];
 if(!a||!b)return;
 setMode("remix");
 const pA=makeProfile(a),pB=makeProfile(b);
 const out={};const mix=customBreed.inherit,mut=customBreed.mutagen;
 for(const key of Object.keys(pA)){
  if(key==="pattern")continue;
  const spec=[...sliderGroups.mutation,...sliderGroups.color].find(x=>x[0]===key);
  const base=pA[key]*(1-mix)+pB[key]*mix;
  out[key]=spec?clamp(base+rand(-1,1)*mut*(spec[3]-spec[2])*0.48,spec[2],spec[3]):base;
 }
 out.pattern=Math.random()<mut*0.7?Math.floor(rand(0,7)):(Math.random()<mix?pB.pattern:pA.pattern);
 engine.setParams(out);
 const names=Object.keys(palettes);const colA=palettes[names[hashName(a.name)%names.length]];
 const colB=palettes[names[hashName(b.name)%names.length]];
 engine.colors=colA.map((c,i)=>{
  const ca=parseInt(c.slice(1),16),cb=parseInt(colB[i].slice(1),16);
  const blend=channel=>Math.round(((ca>>channel)&255)*(1-mix)+((cb>>channel)&255)*mix);
  return "#"+[16,8,0].map(ch=>blend(ch).toString(16).padStart(2,"0")).join("");
 });
 sourceIndex=Number($("parentA").value);
 $("source").value=String(sourceIndex);
 $("sourceName").textContent="CHILD · "+a.name+" × "+b.name;
 $("sourceDesc").textContent="Independent recombinant child. Both parents influenced its genome.";
 engine.reseed();refreshControls();toast("GENETIC FILTH SUCCESSFULLY CREATED.");
}
function setupPanelResize(){
 let startY=0,startH=0,active=false;
 const bar=$("handle"),panel=$("panel");
 bar.addEventListener("pointerdown",e=>{active=true;startY=e.clientY;startH=panel.getBoundingClientRect().height;bar.setPointerCapture(e.pointerId);});
 bar.addEventListener("pointermove",e=>{
  if(!active)return;
  const max=Math.max(150,window.innerHeight-120),next=clamp(startH+(startY-e.clientY),145,max);
  panel.style.height=next+"px";
  if(engine&&!exactMode)engine.resize();
 });
 for(const e of ["pointerup","pointercancel"])bar.addEventListener(e,()=>{active=false});
}
async function exportPNG(){
 if(!engine)return;setMode("remix");paintStatus("rendering high-resolution PNG…");
 try{
  const b=await engine.savePNG(Number($("scale").value));
  download(b,safeName()+".png");paintStatus("PNG ready");
 }catch(e){paintStatus("PNG failed");toast("PNG export failed: "+e.message);}
}
function recordVideo(){
 if(recording){recording.stop();return;}
 if(!engine||!HTMLCanvasElement.prototype.captureStream||!window.MediaRecorder){toast("This browser cannot record canvas video.");return;}
 setMode("remix");
 const choices=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
 const mime=choices.find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime){toast("No supported MP4 or WebM recorder on this device.");return;}
 try{
  const stream=$("art").captureStream(30);
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:16000000});
  const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  rec.onstop=()=>{
   clearTimeout(recordTimer);stream.getTracks().forEach(x=>x.stop());
   if(chunks.length)download(new Blob(chunks,{type:mime}),safeName()+(mime.includes("mp4")?".mp4":".webm"));
   paintStatus("recording finished");$("stopVideo").disabled=true;$("video").textContent="RECORD VIDEO";recording=null;
  };
  rec.onerror=()=>{toast("Recording failed");paintStatus("recorder error")};
  rec.start(1000);recording=rec;$("stopVideo").disabled=false;$("video").textContent="STOP RECORDING";
  const seconds=Number($("seconds").value);recordTimer=setTimeout(()=>{if(rec.state==="recording")rec.stop()},seconds*1000);
  paintStatus("recording "+seconds+" seconds · "+(mime.includes("mp4")?"MP4":"WebM"));
 }catch(err){toast("Cannot record: "+err.message);}
}
function savePreset(){
 if(!engine)return;
 const data={q:engine.params,colors:engine.colors,source:sourceIndex,seed:engine.seed};
 try{localStorage.setItem("neonTrashPresetV1",JSON.stringify(data));toast("Preset saved in this browser.");}
 catch(e){toast("Local storage unavailable here.");}
}
function loadPreset(){
 try{
  const s=JSON.parse(localStorage.getItem("neonTrashPresetV1")||"null");if(!s)throw Error("No saved preset");
  setMode("remix");sourceIndex=clamp(s.source|0,0,manifest.length-1);
  chooseSource(sourceIndex,false);engine.setParams(s.q||{});if(s.colors?.length===5)engine.colors=s.colors;
  engine.seed=Number(s.seed)||rand(0,9999);engine.resetPending=true;refreshControls();toast("Saved monster restored.");
 }catch(e){toast("Unable to restore preset: "+e.message);}
}
async function start(){
 renderSliders("mutation","sliders");renderSliders("color","colorsliders");renderSliders("breed","breedSliders");
 makeColorStops();
 const palSel=$("palette");
 for(const key of Object.keys(palettes)){const op=document.createElement("option");op.value=key;op.textContent=key;palSel.append(op)}
 setupPanelResize();
 try{engine=new window.CorruptionEngine($("art"),paintStatus);}
 catch(e){paintStatus("WebGL2 unavailable");toast(e.message);return;}
 try{
  const r=await fetch("./catalog.json",{cache:"no-cache"});if(!r.ok)throw Error("Catalog "+r.status);
  manifest=(await r.json()).sketches;
  if(!manifest.length)throw Error("Empty catalog");
  populateSources();chooseSource(0);
  paintStatus("WebGL2 ready · "+manifest.length+" archive originals");
 }catch(e){paintStatus("archive unavailable: "+e.message);toast("Catalog did not load. Run via GitHub Pages or localhost.");}
 $("tabs").addEventListener("click",e=>{
  const tab=e.target.closest("[data-tab]");if(!tab)return;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===tab));
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("on",x.id==="view-"+tab.dataset.tab));
  $("pane").scrollTop=0;
 });
 $("source").addEventListener("change",e=>chooseSource(Number(e.target.value)));
 $("pattern").addEventListener("change",e=>{setMode("remix");engine.params.pattern=Number(e.target.value);});
 $("palette").addEventListener("change",e=>{setMode("remix");setPalette(e.target.value);});
 $("remix").onclick=()=>setMode("remix");
 $("exact").onclick=()=>setMode("original");
 $("sourceLink").onclick=()=>{const s=manifest[sourceIndex];if(s)window.open(githubBase+s.code,"_blank","noopener")};
 $("reseed").onclick=()=>{setMode("remix");engine.reseed();toast("New cellular seed")};
 $("mutateOnce").onclick=mutateOnce;
 $("surprise").onclick=surprise;
 $("new").onclick=()=>{if(!confirm("Start a brand-new design? Your unsaved changes will be replaced."))return;setMode("remix");chooseSource(0);engine.time=0;toast("New design. No old settings retained.")};
 $("pause").onclick=()=>{if(exactMode){toast("Original sketches control their own animation.");return;}const paused=engine.pauseToggle();$("pause").textContent=paused?"▶":"❚❚"};
 $("palShuffle").onclick=()=>{setMode("remix");const p=pick(Object.keys(palettes));$("palette").value=p;setPalette(p);toast("Palette rearranged")};
 $("colorCycle").onclick=()=>{setMode("remix");const q=engine.params;const on=q.colorMotion>0;q.colorMotion=on?0:0.5;$("colorCycle").textContent="COLOR CYCLE: "+(on?"OFF":"ON");refreshControls()};
 $("parentA").onchange=()=>{};$("parentB").onchange=()=>{};
 $("breed").onclick=breed;
 $("breedSurprise").onclick=()=>{
  $("parentA").value=Math.floor(rand(0,manifest.length));
  $("parentB").value=Math.floor(rand(0,manifest.length));customBreed.mutagen=rand(0.1,0.8);customBreed.inherit=rand(0.2,0.8);refreshControls();breed();
 };
 $("png").onclick=exportPNG;$("video").onclick=recordVideo;
 $("stopVideo").onclick=()=>{if(recording&&recording.state==="recording")recording.stop()};
 $("savePreset").onclick=savePreset;$("restorePreset").onclick=loadPreset;
 window.addEventListener("keydown",e=>{if(e.key===" "&&e.target.tagName!=="INPUT"){e.preventDefault();$("pause").click()}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
