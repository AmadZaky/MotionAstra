/* MotionAstra's original cubic-Bezier editor; no third-party easing assets. */
window.MotionCurve=(()=>{
'use strict';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const presets=[['Linear',[.333,.333,.667,.667]],['Easy Ease',[.333,0,.667,1]],['Accelerate',[.42,0,.75,.58]],['Decelerate',[.25,.42,.58,1]],['Smooth',[.42,0,.58,1]],['Snappy',[.7,0,.85,1]],['Gentle',[.2,0,.8,1]],['Slow finish',[.15,.6,.3,1]]];
let api,curve=[.333,0,.667,1],busy=false,visible=false,drag=null,raf=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
function valueAt(x,v){let lo=0,hi=1;for(let i=0;i<28;i++){const t=(lo+hi)/2;if(mix(t,v[0],v[2])<x)lo=t;else hi=t;}return mix((lo+hi)/2,v[1],v[3]);}
function valid(v){return v.length===4&&v.every((n,i)=>Number.isFinite(n)&&n>=(i%2?0:.001)&&n<=(i%2?1:.999))&&v[0]<=v[2];}
function read(){return ['x1','y1','x2','y2'].map(k=>$('curve-'+k).value===''?NaN:Number($('curve-'+k).value));}
function fields(){['x1','y1','x2','y2'].forEach((k,i)=>$('curve-'+k).value=Number(curve[i].toFixed(3)));}
function sync(){if(!api)return;$('curve-apply').disabled=busy||!api.ready()||!valid(read());$('curve-inputs').querySelectorAll('input').forEach(e=>e.disabled=busy);$('curve-presets').querySelectorAll('button').forEach(e=>e.disabled=busy);$('curve-mirror').disabled=busy;$('curve-reset').disabled=busy;$('curve-graph').setAttribute('aria-disabled',String(busy));}
function draw(){
 const pt=(x,y)=>(30+x*260)+','+(270-y*240),p1=pt(curve[0],curve[1]),p2=pt(curve[2],curve[3]);
 $('curve-path').setAttribute('d','M30,270 C'+p1+' '+p2+' 290,30');$('curve-arm1').setAttribute('d','M30,270 L'+p1);$('curve-arm2').setAttribute('d','M290,30 L'+p2);
 [1,2].forEach((n)=>{const h=$('curve-h'+n),i=(n-1)*2;h.setAttribute('cx',30+curve[i]*260);h.setAttribute('cy',270-curve[i+1]*240);h.setAttribute('aria-valuetext',curve[i].toFixed(3)+', '+curve[i+1].toFixed(3));});
 $('curve-presets').querySelectorAll('button').forEach(b=>{const v=JSON.parse(b.dataset.curve),active=v.every((n,i)=>Math.abs(n-curve[i])<.001);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $('curve-code').textContent=curve.map(n=>n.toFixed(3)).join(' · ');try{localStorage.setItem('ma-motion-curve',JSON.stringify(curve));}catch(e){}
}
function stop(){cancelAnimationFrame(raf);raf=0;}
function replay(){stop();const duration=1.4,started=performance.now();function tick(now){if(!visible||document.hidden||busy||document.body.classList.contains('reduced')){stop();return;}const t=Math.min(1,(now-started)/1000/duration),y=valueAt(t,curve);$('curve-dot').style.left=(4+92*y)+'%';$('curve-playhead').setAttribute('cx',30+t*260);$('curve-playhead').setAttribute('cy',270-y*240);if(t<1)raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);}
function commit(v){if(!valid(v))return;curve=v;$('curve-error').hidden=true;fields();draw();sync();replay();}
function init(adapter){api=adapter;try{const saved=JSON.parse(localStorage.getItem('ma-motion-curve'));if(Array.isArray(saved)&&valid(saved))curve=saved;}catch(e){}
 presets.forEach(([name,v])=>{
 const b=document.createElement('button'),svg=document.createElementNS(ns,'svg'),axis=document.createElementNS(ns,'path'),path=document.createElementNS(ns,'path'),label=document.createElement('span');
 b.dataset.curve=JSON.stringify(v);b.setAttribute('aria-label',name);svg.setAttribute('viewBox','0 0 100 76');svg.setAttribute('aria-hidden','true');
 axis.setAttribute('d','M12 8V64H88');axis.setAttribute('class','curve-thumb-axis');
 path.setAttribute('d','M12 64 C'+(12+v[0]*76)+' '+(64-v[1]*56)+' '+(12+v[2]*76)+' '+(64-v[3]*56)+' 88 8');path.setAttribute('class','curve-thumb-path');
 svg.append(axis,path);label.textContent=name;b.append(svg,label);b.onclick=()=>commit(v.slice());$('curve-presets').appendChild(b);
 });
 $('curve-inputs').oninput=()=>{const v=read();$('curve-error').hidden=valid(v);if(valid(v)){curve=v;draw();replay();}sync();};
 const graph=$('curve-graph');
 function move(e){if(drag===null||busy)return;const p=graph.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(graph.getScreenCTM().inverse()),i=(drag-1)*2,v=curve.slice();v[i]=clamp((q.x-30)/260,i===0?.001:curve[0],i===0?curve[2]:.999);v[i+1]=clamp((270-q.y)/240,0,1);curve=v.map(x=>Math.round(x*1000)/1000);$('curve-error').hidden=true;fields();draw();sync();}
 [1,2].forEach(n=>{const h=$('curve-h'+n);h.onpointerdown=e=>{if(busy)return;stop();drag=n;h.setPointerCapture(e.pointerId);e.preventDefault();};h.onpointermove=move;h.onpointerup=()=>{drag=null;replay();};h.onpointercancel=()=>{drag=null;};h.onkeydown=e=>{if(busy||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const v=curve.slice(),i=(n-1)*2,step=e.shiftKey?.05:.01;if(e.key==='ArrowLeft'||e.key==='ArrowRight')v[i]=clamp(v[i]+(e.key==='ArrowRight'?step:-step),i===0?.001:v[0],i===0?v[2]:.999);else v[i+1]=clamp(v[i+1]+(e.key==='ArrowUp'?step:-step),0,1);commit(v);};});
 $('curve-mirror').onclick=()=>commit([1-curve[2],1-curve[3],1-curve[0],1-curve[1]]);$('curve-reset').onclick=()=>commit([.333,0,.667,1]);$('curve-replay').onclick=replay;
 $('curve-apply').onclick=()=>{if(valid(read()))api.action({action:'tool',name:'curve',curve:read()});};fields();draw();sync();document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
return {init,setBusy(on){busy=on;if(on)stop();sync();},setVisible(on){visible=on;if(!on)stop();else if(api)replay();},valueAt};
})();
