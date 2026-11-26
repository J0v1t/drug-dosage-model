/* UI state and local Python API. No pharmacokinetic solver runs in the browser. */
const $ = id => document.getElementById(id);
const defaults = {dose:100,interval:8,ka:1,half:6,bio:80,volume:40,duration:48,repeated:true,scenario:'hypothetical'};
const reference = {dose:250,interval:8,ka:Math.log(2)/.44,half:Math.log(2)/(.041/.46),bio:100,volume:28.52,duration:48,repeated:false,scenario:'reference'};
let s={...defaults,time:0},model=null,pinned=null,playing=false,pending=true,requestId=0,controller=null,timer=null,phase=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const body=$('body'),b=body.getContext('2d');
const bounds={dose:[0,1000,25],interval:[1,24,1],ka:[.05,5,.05],half:[.5,48,.5],bio:[0,100,1],volume:[1,200,1],duration:[1,168,1]};
const graphics=['ka','half','bio','volume','duration'];

function updatePlaybackButton(){
 $('play').classList.toggle('is-playing',playing);$('play').setAttribute('aria-pressed',playing);$('play').setAttribute('aria-label',playing?'Pause simulation':'Play simulation');$('play').dataset.tooltip=playing?'Pause simulation':'Play simulation';
}
function medicineIcon(repeated){
 const capsule='<path d="M3 0h10v1h2v2h1v4h-1v2h-2v1H3V9H1V7H0V3h1V1h2z" fill="#684437"/><path d="M3 1h5v8H3V8H2V6H1V4h1V2h1z" fill="#d97980"/><path d="M8 1h5v1h1v2h1v2h-1v2h-1v1H8z" fill="#fff0d8"/><path d="M4 2h3v1H4zM2 3h2v2H2z" fill="#ffd2c3"/><path d="M8 1h1v8H8z" fill="#a56656"/>';
 const placements=repeated?[[8,16,.85],[22,16,.85],[36,16,.85]]:[[22,16,1.45]];
 return '<svg class="medicine-icon" viewBox="0 0 44 32" width="36" height="30" aria-hidden="true" focusable="false" shape-rendering="crispEdges">'+placements.map(([x,y,scale])=>'<g transform="translate('+x+' '+y+') rotate(-35) scale('+scale+') translate(-8 -5)">'+capsule+'</g>').join('')+'</svg>';
}

function sampleAt(time,data=model){
 if(!data)return {c:0,gut:0};
 const rows=data.series,t=Math.max(0,Math.min(time,data.parameters.duration));
 let lo=0,hi=rows.length-1;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(rows[mid][0]<=t)lo=mid;else hi=mid-1}
 const a=rows[lo],z=rows[Math.min(lo+1,rows.length-1)],f=z[0]===a[0]?0:(t-a[0])/(z[0]-a[0]);
 return {c:a[1]+(z[1]-a[1])*f,gut:a[2]*Math.exp(-data.parameters.ka*(t-a[0]))};
}
function concentration(time){return sampleAt(time).c}
function isLocked(key){return false}
function limit(key){return bounds[key]}
function format(key,value){return key==='dose'?value+' mg':key==='ka'?value.toFixed(2)+' h⁻¹':key==='half'?value.toFixed(1)+' h':key==='bio'?value+'%':key==='volume'?value.toFixed(1)+' L':value+' h'}
function setValue(key,value){
 if(isLocked(key))return;
 if(typeof value==='number'){const [min,max,step]=limit(key);value=Math.max(min,Math.min(max,Math.round(value/step)*step));value=Number(value.toFixed(8))}
 if(s[key]===value)return;
 if(s.scenario==='reference')s.scenario='inspired';
 s[key]=value;s.time=Math.min(s.time,s.duration);renderControls();queueSimulation();
}
function renderControls(){
 for(const key of Object.keys(bounds)){
  $(key+'-out').textContent=format(key,s[key]);
  const [min,max]=limit(key),el=$(key);el.setAttribute('aria-valuemin',min);el.setAttribute('aria-valuemax',max);el.setAttribute('aria-valuenow',s[key]);el.setAttribute('aria-valuetext',format(key,s[key]));el.setAttribute('aria-disabled',isLocked(key));el.tabIndex=isLocked(key)?-1:0;
  if(graphics.includes(key)){const f=(s[key]-min)/(max-min);el.style.setProperty('--position',f*100+'%');[...el.children].forEach((cell,i)=>cell.classList.toggle('active',i/23<=f))}
 }
 $('liquid').style.transform='scaleY('+(s.dose/1000)+')';const angle=s.interval/24*360;$('interval').style.setProperty('--sweep',angle+'deg');$('hand').style.transform='rotate('+angle+'deg)';
 $('single').setAttribute('aria-pressed',!s.repeated);$('repeat').setAttribute('aria-pressed',s.repeated);
 $('interval').closest('.instrument').hidden=!s.repeated;$('default-panel').dataset.single=String(!s.repeated);
 const ref=s.scenario==='reference';$('scenario').value=s.scenario;
 $('scenario').querySelector('[value=inspired]').hidden=s.scenario!=='inspired';
 $('scenario').querySelector('[value=reference]').textContent='Theophylline';
 $('headline').textContent=s.scenario==='inspired'?'Theophylline - Modified':ref?'Theophylline, under the lens.':'What happens after a dose?';
 $('band-label').textContent=ref?'Published reference range':'Illustrative target band';
 $('time').max=s.duration;$('time').value=s.time;$('scenario').dispatchEvent(new Event('scenario-sync'));
}
function queueSimulation(immediate=false){
 clearTimeout(timer);controller?.abort();requestId++;pending=true;playing=false;updatePlaybackButton();$('play').disabled=true;$('compare').disabled=true;document.body.dataset.pending='true';$('status').textContent='';$('loading').hidden=false;$('status').dataset.error='false';
 const id=requestId;timer=setTimeout(()=>runSimulation(id),immediate?0:160);
}
async function runSimulation(id){
 const active=new AbortController();controller=active;
 const payload=Object.fromEntries(Object.keys(defaults).map(key=>[key,s[key]]));
 try{
  const response=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:active.signal});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to calculate this scenario.');if(id!==requestId)return;
  model=data;Object.assign(s,data.parameters);pending=false;$('loading').hidden=true;document.body.dataset.pending='false';$('status').textContent='';$('play').disabled=false;$('compare').disabled=false;renderControls();renderMetrics();renderScene();
 }catch(error){if(error.name==='AbortError'||id!==requestId)return;$('loading').hidden=true;$('status').textContent=error.message+' Adjust a control or reset to try again.';$('status').dataset.error='true';}
}
function renderMetrics(){
 const m=model.metrics;
 $('peak').innerHTML=m.peak.toFixed(2)+' <small>mg/L</small>';$('peak-time').innerHTML=m.peak_time.toFixed(2)+' <small>h</small>';
 $('trough').innerHTML=m.latest_trough===null?'—':m.latest_trough.toFixed(2)+' <small>mg/L</small>';$('auc').innerHTML=m.auc.toFixed(2)+' <small>mg·h/L</small>';
}
function renderScene(){
 $('time').value=s.time;$('time-out').textContent=s.time.toFixed(1)+' / '+s.duration+' h';$('systemic').textContent=concentration(s.time).toFixed(2)+' mg/L';
 drawBody(phase);drawChart();
}
function attachSlider(key,position){
 const el=$(key);let dragging=false;
 function move(e){if(!dragging||isLocked(key))return;setValue(key,position(e,el.getBoundingClientRect()))}
 el.addEventListener('pointerdown',e=>{if(isLocked(key))return;dragging=true;el.focus();el.setPointerCapture(e.pointerId);move(e)});
 el.addEventListener('pointermove',move);el.addEventListener('pointerup',()=>dragging=false);el.addEventListener('pointercancel',()=>dragging=false);
 el.addEventListener('keydown',e=>{if(isLocked(key))return;const [min,max,step]=limit(key);if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();setValue(key,e.key==='Home'?min:e.key==='End'?max:s[key]+(['ArrowUp','ArrowRight'].includes(e.key)?step:-step))}});
}
function selectTab(key){
 const panel=$(key+'-panel'),changed=panel.hidden;
 document.querySelector('.instrument-tabs').dataset.selected=key;
 for(const name of ['default','advanced']){$(name+'-tab').setAttribute('aria-selected',name===key);$(name+'-tab').tabIndex=name===key?0:-1;$(name+'-panel').getAnimations().forEach(animation=>animation.cancel());$(name+'-panel').hidden=name!==key}
 if(changed&&!reduced)panel.animate([{opacity:.25,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,0,0,1)'});
}

document.addEventListener('DOMContentLoaded',()=>{
 $('single').innerHTML=medicineIcon(false);$('repeat').innerHTML=medicineIcon(true);updatePlaybackButton();
 const mode=document.querySelector('.mode');document.querySelector('.instruments').append(mode);mode.setAttribute('aria-label','Dosing mode');mode.setAttribute('role','group');

 for(const key of graphics){for(let i=0;i<24;i++){const cell=document.createElement('i');cell.style.height=(key==='half'?49-i*1.65:key==='bio'?18+i*1.1:key==='duration'?16+Math.floor(i/4)*6:22+Math.sin(i/23*Math.PI)*25)+'px';$(key).append(cell)}attachSlider(key,(e,r)=>{const [min,max]=limit(key);return min+(e.clientX-r.left)/r.width*(max-min)})}
 attachSlider('dose',(e,r)=>(1-(e.clientY-r.top)/r.height)*1000);
 attachSlider('interval',(e,r)=>{let a=Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)+Math.PI/2;if(a<0)a+=Math.PI*2;return a/(Math.PI*2)*24});
 $('dose-up').onclick=()=>setValue('dose',s.dose+limit('dose')[2]);$('dose-down').onclick=()=>setValue('dose',s.dose-limit('dose')[2]);
 $('single').onclick=()=>setValue('repeated',false);$('repeat').onclick=()=>setValue('repeated',true);
 $('time').oninput=e=>{s.time=+e.target.value;if(!pending)renderScene()};
 $('play').onclick=()=>{if(pending)return;playing=!playing;if(s.time>=s.duration)s.time=0;updatePlaybackButton();renderScene()};
 $('restart').onclick=()=>{playing=false;s.time=0;phase=0;updatePlaybackButton();if(!pending)renderScene()};
 $('scenario').onchange=e=>{s={...(e.target.value==='reference'?reference:defaults),time:0};renderControls();queueSimulation(true)};
 $('reset').onclick=()=>{const kind=s.scenario;s={...(kind==='hypothetical'?defaults:reference),scenario:kind,time:0};phase=0;renderControls();queueSimulation(true)};
 for(const key of ['default','advanced']){const el=$(key+'-tab');el.onclick=()=>selectTab(key);el.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'default':e.key==='End'?'advanced':key==='default'?'advanced':'default';selectTab(next);$(next+'-tab').focus()}}}
 $('compare').onclick=()=>{pinned=pinned?null:structuredClone(model);$('compare').setAttribute('aria-pressed',!!pinned);$('compare').setAttribute('aria-label',pinned?'Unpin comparison curve':'Pin curve to compare');$('compare').dataset.tooltip=pinned?'Unpin comparison curve':'Pin curve to compare';$('comparison-label').textContent=pinned?'Dashed curve · '+pinned.parameters.dose+' mg '+(pinned.parameters.repeated?'every '+pinned.parameters.interval+' h':'single dose')+' · '+(pinned.parameters.scenario==='reference'?'theophylline reference':pinned.parameters.scenario==='inspired'?'theophylline-inspired sandbox':'hypothetical sandbox'):'';drawChart()};
 $('bands').onchange=()=>drawChart();$('sources-open').onclick=()=>{$('sources').showModal();if(!reduced)$('sources').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,0,0,1)'})};$('sources-close').onclick=()=>$('sources').close();
 window.addEventListener('resize',()=>{if(model&&!pending)renderScene()});
 setupChartInteraction();renderControls();queueSimulation(true);
 let last=0,acc=0;function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;acc=playing&&!pending?acc+dt:0;if(playing&&!pending&&acc>=1/30){s.time=Math.min(s.duration,s.time+acc*1.8);if(!reduced)phase+=acc;acc=0;if(s.time>=s.duration){playing=false;$('play').textContent='▶ Play'}renderScene()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
});
