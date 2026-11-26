/* Canvas plot of numerical results returned by Python. */
function chartGeometry(){const r=$('chart').getBoundingClientRect();return {w:r.width,h:r.height,left:48,right:r.width-16,top:20,bottom:r.height-30,end:Math.max(model?.parameters.duration||48,pinned?.parameters.duration||0)}}
function drawChart(){
 if(!model)return;
 const canvas=$('chart'),g=chartGeometry(),dpr=devicePixelRatio||1,ctx=canvas.getContext('2d');canvas.width=g.w*dpr;canvas.height=g.h*dpr;ctx.scale(dpr,dpr);
 const css=getComputedStyle(document.body),color=n=>css.getPropertyValue(n).trim();
 const bands=$('bands').checked,ref=s.scenario==='reference',band=ref?[5,20]:[2,4];
 const ymax=Math.max(1,model.metrics.peak*1.15,pinned?pinned.metrics.peak*1.15:0,bands?band[1]*1.12:0);
 const x=t=>g.left+t/g.end*(g.right-g.left),y=c=>g.bottom-c/ymax*(g.bottom-g.top);
 ctx.font='11px monospace';
 if(bands){ctx.fillStyle=ref?'#c4873520':'#a5523418';ctx.fillRect(g.left,y(band[1]),g.right-g.left,y(band[0])-y(band[1]));ctx.strokeStyle=color('--line');ctx.setLineDash([4,4]);for(const v of band){ctx.beginPath();ctx.moveTo(g.left,y(v));ctx.lineTo(g.right,y(v));ctx.stroke()}ctx.setLineDash([]);ctx.fillStyle=color('--muted');ctx.textAlign='right';ctx.fillText(ref?'Published reference: 5–20 mg/L':'Illustrative: 2–4 mg/L',g.right-4,y(band[1])-5)}
 for(let i=0;i<=4;i++){let value=ymax*i/4,py=y(value);ctx.strokeStyle=color('--line');ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(g.left,py);ctx.lineTo(g.right,py);ctx.stroke();ctx.fillStyle=color('--muted');ctx.textAlign='right';ctx.fillText(value>=1000?value.toExponential(1):value.toFixed(1),g.left-7,py+4);ctx.textAlign='center';ctx.fillText((g.end*i/4).toFixed(g.end<4?1:0),x(g.end*i/4),g.bottom+18)}
 function curve(data,stroke,dashed){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.setLineDash(dashed?[5,5]:[]);ctx.beginPath();for(let i=0;i<data.series.length;i++){const [t,c]=data.series[i];i?ctx.lineTo(x(t),y(c)):ctx.moveTo(x(t),y(c))}ctx.stroke();ctx.setLineDash([])}
 if(pinned)curve(pinned,color('--muted'),true);curve(model,color('--accent'),false);
 ctx.fillStyle=color('--orange');for(const dose of model.doses)ctx.fillRect(x(dose)-2,g.bottom+2,4,4);
 const xx=x(s.time),yy=y(concentration(s.time));ctx.strokeStyle=color('--orange');ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(xx,g.top);ctx.lineTo(xx,g.bottom);ctx.stroke();ctx.setLineDash([]);ctx.fillRect(xx-4,yy-4,8,8);ctx.fillStyle=color('--ink');ctx.textAlign='left';ctx.fillText(s.time.toFixed(1)+' h',Math.min(g.right-46,xx+7),g.top+9);
}
function setupChartInteraction(){
 const canvas=$('chart');let dragging=false;
 function inspect(e){if(!model||pending)return;const g=chartGeometry(),r=canvas.getBoundingClientRect(),t=Math.max(0,Math.min(g.end,(e.clientX-r.left-g.left)/(g.right-g.left)*g.end));const current=t<=s.duration?sampleAt(t).c.toFixed(2)+' mg/L':'outside current period';const other=pinned&&t<=pinned.parameters.duration?' · pinned '+sampleAt(t,pinned).c.toFixed(2)+' mg/L':'';$('chart-readout').textContent=t.toFixed(2)+' h · '+current+other;if(dragging){s.time=Math.min(t,s.duration);renderScene()}}
 canvas.addEventListener('pointermove',inspect);canvas.addEventListener('pointerdown',e=>{if(!model||pending)return;playing=false;updatePlaybackButton();dragging=true;canvas.setPointerCapture(e.pointerId);inspect(e)});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('pointerleave',()=>{if(!dragging)$('chart-readout').textContent='Time · hours'});
}
