/* Additional views of the same numerical simulation. */
{
 const variants={A:['Concentration','A · Concentration trail'],B:['Gut reservoir','B · Pixel reservoir'],C:['Absorption flow','C · Flow columns']};
 let view=new URLSearchParams(location.search).get('variant')||'A';if(!variants[view])view='A';
 let hoverTime=null;
 const originalDrawChart=drawChart;
 const style=document.createElement('style');style.textContent=`
 .graph-study-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.graph-study-tabs button{font-size:.75rem;padding:8px 12px}.graph-study-tabs button[aria-pressed=true]{background:#f3bb8e!important;color:#573b30!important}
 .study-readout{display:flex;justify-content:flex-end;align-items:center;padding:14px 0;font-size:.8125rem;color:var(--muted);gap:12px}.study-readout strong{font:700 1.2rem var(--mono);color:var(--ink)}
 .study-switcher{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:40;background:var(--ink);color:var(--panel);display:flex;align-items:center;gap:14px;padding:7px;border:1px solid #c7a789;box-shadow:3px 3px 0 #b48b6d66;font:.75rem var(--mono)}.study-switcher span{min-width:170px;text-align:center}.study-switcher button{padding:4px 10px!important}.study-note{font:.75rem/1.6 var(--mono);color:var(--muted);margin:8px 0 16px}.study-switcher a{color:var(--panel);padding:0 7px}
 .results>.section-top{flex-wrap:wrap;gap:8px;margin-bottom:10px!important}.graph-study-tabs{margin:0 0 0 auto;justify-content:flex-end;max-width:100%}.graph-study-tabs button{font-size:.6875rem;padding:7px 9px}.study-caption{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:9px 0 14px}.study-caption .study-note{margin:0;line-height:1.5;flex:1}.study-caption .study-readout{padding:0;flex:none}.study-caption .study-readout strong{font-size:1rem;white-space:nowrap}@media(max-width:540px){.study-caption{align-items:flex-start;gap:8px}.study-caption .study-note{font-size:.6875rem}.study-caption .study-readout strong{font-size:.875rem}}
 .chartbox>.study-readout{position:absolute;z-index:4;display:block;padding:6px 8px;margin:0;background:#fff0e1;border:1px solid #bc9274;border-radius:2px;box-shadow:2px 2px 0 #b48b6d26;pointer-events:none;max-width:calc(100% - 24px)}.chartbox>.study-readout strong{font:700 .8125rem/1.4 var(--mono);white-space:nowrap}.study-caption{display:block}
 .results>#study-note{margin:0 0 13px;font:.75rem/1.55 var(--mono);color:var(--muted)}
 .results>.section-top{margin-bottom:5px!important}
 body[data-variant=E] .results>.chartbox{padding:18px 16px 8px}
 body[data-variant=E] .chartbox>.graph-study-tabs{display:flex;position:relative;margin:-18px -16px 16px;padding:0;gap:0;max-width:none;border-bottom:1px solid #c4a183}
 body[data-variant=E] .graph-study-tabs button{flex:1;border:0;border-right:1px solid #c4a183;border-radius:0;padding:12px 8px;min-height:44px;background:#e3d4c0;color:#765646;font:.75rem var(--mono);box-shadow:none;transform:none;transition:background-color 200ms,color 200ms}
 body[data-variant=E] .graph-study-tabs button:last-child{border-right:0}
 body[data-variant=E] .graph-study-tabs button[aria-pressed=true]{background:#f3bb8e!important;color:#573b30!important;font-weight:700}
 body[data-variant=E] .graph-study-tabs button:hover{background:#f0cfad;box-shadow:none;transform:none}
 .graph-study-tabs:before{content:'';position:absolute;left:0;bottom:0;width:33.333333%;height:3px;background:#ad6542;z-index:2;pointer-events:none;transform:translateX(0);transition:transform 220ms cubic-bezier(.2,0,0,1)}
 .graph-study-tabs[data-selected=B]:before{transform:translateX(100%)}
 .graph-study-tabs[data-selected=C]:before{transform:translateX(200%)}
 body[data-variant=E] .chartbox>.pin-tab{top:61px}
 @media(max-width:540px){body[data-variant=E] .graph-study-tabs button{font-size:.625rem;padding:11px 4px}}
 @media(prefers-reduced-motion:reduce){.graph-study-tabs:before{transition:none}}
 body[data-variant=E] .chartbox canvas{height:285px}.study-switcher button{color:var(--ink)}
 `;document.head.append(style);
 function selectView(next){view=next;hoverTime=null;delete $('chart').dataset.hoverTime;$('chart-readout').textContent='Time · hours';const url=new URL(location);url.searchParams.set('variant',view);history.replaceState(null,'',url);document.querySelector('.graph-study-tabs').dataset.selected=view;document.querySelectorAll('.graph-study-tabs button').forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.view===view));$('results-title').textContent=view==='A'?'The concentration trail':view==='B'?'The gut reservoir':'The absorption flow';$('chart').style.pointerEvents='auto';document.querySelector('.chart-title').textContent=view==='A'?'Systemic concentration · mg/L':view==='B'?'Drug remaining in the gut · mg':'Rate entering the systemic compartment · mg/h';document.querySelector('.stats').hidden=view!=='A';$('compare').hidden=view!=='A';document.querySelector('.band-control').hidden=view!=='A';$('study-note').textContent=view==='A'?'A familiar curve with a shared time cursor and dose markers.':view==='B'?'Pixel columns refill at each dose and drain as absorption proceeds.':'A short input burst after each dose, followed by a decline as the gut empties.';drawChart();}
 function cycle(n){selectView('ABC'[('ABC'.indexOf(view)+n+3)%3])}
 function positionReadout(time,value,geometry){
  const el=document.querySelector('.study-readout');if(!el)return;
  const canvas=$('chart'),box=document.querySelector('.chartbox'),r=canvas.getBoundingClientRect(),br=box.getBoundingClientRect();
  const x=geometry.left+time/geometry.end*(geometry.right-geometry.left),y=geometry.bottom-value/geometry.max*(geometry.bottom-geometry.top);
  const width=el.offsetWidth,height=el.offsetHeight;
  el.style.left=Math.max(8,Math.min(box.clientWidth-width-8,r.left-br.left+x+10))+'px';
  el.style.top=Math.max(r.top-br.top+28,Math.min(r.top-br.top+geometry.bottom-height-8,r.top-br.top+y-height-10))+'px';
  el.dataset.time=time.toFixed(3);
 }
 function drawInspection(time,value,geometry){
  if(time===null)return;
  const ctx=$('chart').getContext('2d'),x=geometry.left+time/geometry.end*(geometry.right-geometry.left),y=geometry.bottom-value/geometry.max*(geometry.bottom-geometry.top);
  ctx.strokeStyle='#a68c76';ctx.lineWidth=1;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(x,geometry.top);ctx.lineTo(x,geometry.bottom);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#fff0d8';ctx.fillRect(x-3,y-3,6,6);ctx.strokeRect(x-3,y-3,6,6);ctx.fillStyle='#8e7663';ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText(time.toFixed(1)+' h',Math.min(geometry.right-46,x+7),geometry.top+24);
 }
 drawChart=function(){
  if(!model)return;
  const cursorTime=hoverTime??s.time,v=sampleAt(cursorTime);if($('study-value'))$('study-value').textContent=view==='A'?v.c.toFixed(2)+' mg/L':view==='B'?v.gut.toFixed(1)+' mg':(s.bio/100*s.ka*v.gut).toFixed(1)+' mg/h';
  if(view==='A'){
   originalDrawChart();
   const g=chartGeometry(),band=s.scenario==='reference'?20:4;
   const max=Math.max(1,model.metrics.peak*1.15,pinned?pinned.metrics.peak*1.15:0,$('bands').checked?band*1.12:0);
   drawInspection(hoverTime,v.c,{...g,max});positionReadout(cursorTime,v.c,{...g,max});return;
  }
  const canvas=$('chart'),r=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;canvas.width=r.width*dpr;canvas.height=r.height*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const w=r.width,h=r.height,left=view==='B'&&w>450?120:48,right=w-16,top=30,bottom=h-30;
  const rate=view==='C',value=t=>{const row=sampleAt(t);return rate?s.bio/100*s.ka*row.gut:row.gut};
  const max=Math.max(1,...model.series.map(row=>rate?s.bio/100*s.ka*row[2]:row[2]))*1.08;
  const x=t=>left+t/s.duration*(right-left),y=q=>bottom-q/max*(bottom-top);
  ctx.font='11px monospace';for(let i=0;i<=4;i++){const py=y(max*i/4);ctx.strokeStyle='#d4b694';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(right,py);ctx.stroke();ctx.fillStyle='#765646';ctx.textAlign='right';ctx.fillText((max*i/4).toFixed(0),left-7,py+4);ctx.textAlign='center';ctx.fillText((s.duration*i/4).toFixed(0),x(s.duration*i/4),bottom+18)}
  const count=Math.max(40,Math.floor((right-left)/5)),barWidth=(right-left)/count;
  for(let i=0;i<count;i++){
   const time=i/count*s.duration,height=bottom-y(value(time)),xx=x(time);
   if(rate){ctx.fillStyle=time<=s.time?'#c6853b':'#dec19e';ctx.fillRect(xx,y(value(time)),Math.max(2,barWidth-2),height);ctx.fillStyle=time<=s.time?'#ffdf48':'#e5d1b5';ctx.fillRect(xx,y(value(time)),Math.max(2,barWidth-2),3)}
   else{for(let yy=bottom-4;yy>bottom-height;yy-=6){ctx.fillStyle=time<=s.time?'#d88795':'#e5b8b3';ctx.fillRect(xx,yy,Math.max(2,barWidth-1),4)}}
  }
  // Preserve exact dosing peaks rather than letting display-bin spacing miss them.
  for(const dose of model.doses){const xx=x(dose),height=bottom-y(value(dose));if(rate){ctx.fillStyle=dose<=s.time?'#c6853b':'#dec19e';ctx.fillRect(xx,y(value(dose)),3,height)}else for(let yy=bottom-4;yy>bottom-height;yy-=6){ctx.fillStyle=dose<=s.time?'#d88795':'#e5b8b3';ctx.fillRect(xx,yy,3,4)}}
  if(!rate&&w>450){const tankX=18,tankY=top+15,tankW=44,tankH=bottom-tankY;ctx.strokeStyle='#765646';ctx.lineWidth=2;ctx.strokeRect(tankX,tankY,tankW,tankH);const fill=Math.min(1,v.gut/(max/1.08));for(let yv=bottom-6;yv>bottom-tankH*fill;yv-=7)for(let xv=tankX+5;xv<tankX+tankW-4;xv+=7){ctx.fillStyle='#d88795';ctx.fillRect(xv,yv,5,5)}ctx.fillStyle='#765646';ctx.textAlign='center';ctx.fillText('Gut',tankX+tankW/2,tankY-10)}
  for(const dose of model.doses){ctx.fillStyle='#a55234';ctx.fillRect(x(dose)-2,bottom+2,4,4)}
  const xx=x(s.time),yy=y(value(s.time));ctx.strokeStyle='#a55234';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,bottom);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=rate?'#ffdf48':'#a55234';ctx.fillRect(xx-4,yy-4,8,8);ctx.fillStyle='#573b30';ctx.textAlign='left';ctx.fillText(s.time.toFixed(1)+' h',Math.min(right-46,xx+7),16);
  drawInspection(hoverTime,value(cursorTime),{left,right,top,bottom,max,end:s.duration});
  positionReadout(cursorTime,value(cursorTime),{left,right,top,bottom,max,end:s.duration});
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const canvas=$('chart');let scrubbing=false;
  const pauseForScrub=()=>{playing=false;updatePlaybackButton()};
  canvas.addEventListener('mousedown',pauseForScrub,true);
  canvas.addEventListener('click',pauseForScrub,true);
  document.addEventListener('pointerdown',event=>{if(event.target===canvas)pauseForScrub()},true);
  function inspectGraph(event){
   event.stopImmediatePropagation();if(!model||pending)return;
   const rect=canvas.getBoundingClientRect(),left=view==='B'&&rect.width>450?120:48,right=rect.width-16;
   const time=Math.max(0,Math.min(s.duration,(event.clientX-rect.left-left)/(right-left)*(view==='A'?chartGeometry().end:s.duration)));
   hoverTime=time;canvas.dataset.hoverTime=time.toFixed(3);
   if(scrubbing){s.time=time;renderScene()}else drawChart();
   const row=sampleAt(time),value=view==='A'?row.c:view==='B'?row.gut:s.bio/100*s.ka*row.gut;
   $('chart-readout').textContent=time.toFixed(2)+' h · '+value.toFixed(2)+(view==='A'?' mg/L':view==='B'?' mg':' mg/h');
  }
  canvas.addEventListener('pointermove',inspectGraph,true);
  canvas.addEventListener('pointerdown',event=>{event.stopImmediatePropagation();if(!model||pending)return;playing=false;updatePlaybackButton();scrubbing=true;canvas.setPointerCapture(event.pointerId);inspectGraph(event)},true);
  canvas.addEventListener('pointerup',event=>{event.stopImmediatePropagation();scrubbing=false},true);
  function clearHover(event){event.stopImmediatePropagation();scrubbing=false;hoverTime=null;delete canvas.dataset.hoverTime;drawChart();$('chart-readout').textContent='Time · hours'}
  canvas.addEventListener('pointerleave',event=>{if(!scrubbing)clearHover(event)},true);
  canvas.addEventListener('pointercancel',clearHover,true);
  const tabs=document.createElement('div');tabs.className='graph-study-tabs';tabs.setAttribute('aria-label','Graph design preview');
  for(const [key,[label]]of Object.entries(variants)){const btn=document.createElement('button');btn.textContent=label;btn.dataset.view=key;btn.onclick=()=>selectView(key);tabs.append(btn)}
  document.querySelector('.chartbox').prepend(tabs);
  const readout=document.createElement('div');readout.className='study-readout';readout.innerHTML='<strong id="study-value">—</strong>';document.querySelector('.chartbox').append(readout);
  const note=document.createElement('p');note.id='study-note';note.className='study-note';document.querySelector('.results>.section-top').after(note);
  selectView(view);
 });
}
