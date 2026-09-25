/* Illustrative canvas studies. Native AE output can differ with fonts/resolution. */
window.MotionPreview=(()=>{
const entries=new Map();let raf=0,paused=false;
const defaults=p=>Object.fromEntries(p.parameters.map(d=>[d.id,d.default]));
const fract=n=>n-Math.floor(n),rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
function clock(time,p){let q=p.manual?Math.max(0,Math.min(1,p.progress/100)):p.loop?Math.max(0,time/p.duration)%1:Math.max(0,Math.min(1,time/p.duration));q=p.ease===1?q*q:p.ease===2?1-(1-q)*(1-q):p.ease===3?q*q*(3-2*q):q;return p.reverse?1-q:q;}
function render(canvas,r,time=0,settings={}){if(!r.legacy&&!["counter","switcher","typewriter","rise","elastic","wave","tracking","decode","sweep","cascade","gradient","waves","aurora","bokeh","particles","contours","grid","sunburst","tiles","speedlines"].includes(r.id))return render25(canvas,r,time,settings);const p=Object.assign(defaults(r),settings),q=clock(time,p),T=q*Math.PI*2,ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height,id=r.id,n=Math.round(p.count||1),a=p.color2||'#ffad70',b=p.color3||'#ffe3c8';
ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=p.color1||'#101011';ctx.fillRect(0,0,w,h);if(r.category==='Text'){const glow=ctx.createRadialGradient(w*.5,h*.2,0,w*.5,h*.3,w*.65);glow.addColorStop(0,'#ffffff0d');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);}ctx.save();ctx.translate(w/2,h/2);
if(r.category==='Text'){
ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4e9';const size=w*.105;ctx.font=`650 ${size}px -apple-system,Arial,sans-serif`;let text='Make it move';
if(id==='counter'){const factor=Math.pow(10,p.decimals),value=Math.round((p.start+(p.end-p.start)*q)*factor)/factor,parts=Math.abs(value).toFixed(p.decimals).split('.');if(p.format)parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,p.format===1?',':'.');text=p.prefix+(value<0?'-':'')+parts[0]+(p.decimals?(p.format===2?',':'.')+parts[1]:'')+p.suffix;ctx.font=`650 ${Math.min(w*.15,w*.86/Math.max(1,text.length*.62))}px -apple-system,Arial,sans-serif`;ctx.fillStyle=a;ctx.fillText(text,0,0);}
else if(id==='switcher'){const list=p.phrases.split('\n'),i=p.switchMode?Math.min(list.length-1,Math.floor(q*list.length)):Math.max(0,Math.min(list.length-1,Math.round(p.choice)-1));text=list[i]||'';ctx.font=`650 ${Math.min(w*.13,w*.86/Math.max(1,text.length*.62))}px -apple-system,Arial,sans-serif`;ctx.fillStyle=a;ctx.fillText(text,0,0);}
else if(id==='typewriter'){text=text.slice(0,Math.floor(q*text.length))+(p.cursor&&q<1?p.cursorText:'');ctx.fillText(text,0,0);}
else if(id==='decode'){let out='';for(let i=0;i<text.length;i++)out+=i<Math.floor(q*text.length)||q>=1||/\s/.test(text[i])?text[i]:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(rand(i+p.seed+Math.floor(q*p.steps))*36)];ctx.fillText(out,0,0);}
else if(id==='cascade'){const words=text.split(' '),width=ctx.measureText(text).width;let cursor=-width/2;ctx.textAlign='left';words.forEach((word,i)=>{const progress=Math.max(0,Math.min(1,(q-i/Math.max(1,words.length-1)*p.stagger/100)/(1-p.stagger/100)));ctx.save();ctx.globalAlpha=progress;ctx.translate(cursor+(p.direction?p.distance*(1-progress)*w/960:0),p.direction?0:p.distance*(1-progress)*h/540);ctx.fillText(word,0,0);ctx.restore();cursor+=ctx.measureText(word+' ').width;});}
else{const advance=size*.55+(id==='tracking'?(p.trackingStart+(p.trackingEnd-p.trackingStart)*q)*.13:0);for(let i=0;i<text.length;i++){ctx.save();let x=(i-(text.length-1)/2)*advance,y=0,local=Math.max(0,Math.min(1,(q-i/(text.length-1)*(p.stagger||0)/100)/(1-(p.stagger||0)/100)));
if(id==='rise'){ctx.globalAlpha=local;if(p.direction)x+=(1-local)*p.distance*w/960;else y+=(1-local)*p.distance*h/540;}
if(id==='wave')y=Math.sin(T*p.cycles-i*p.spacing*Math.PI/180)*p.height*h/540;
if(id==='tracking'&&p.fade)ctx.globalAlpha=q;
if(id==='sweep'){const hit=q>0&&q<1?Math.max(0,1-Math.abs((i+.5)/text.length-(q*1.6-.3))/(p.width/100))*p.intensity/100:0;ctx.fillStyle=hit>.25?p.highlight:'#fff4e9';}
ctx.translate(x,y);if(id==='elastic'){const amount=local<=0?0:local>=1?1:1-Math.exp(-local*(9-p.bounce*.04))*Math.cos(local*(8+p.bounce*.1))*(1-local);ctx.scale(amount,amount);}ctx.fillText(text[i],0,0);ctx.restore();}}
}else{
ctx.strokeStyle=a;ctx.fillStyle=a;ctx.lineWidth=Math.max(.5,(p.stroke||2)*w/960);const phase=T*(p.cycles||1);
if(id==='gradient'){const angle=p.angle*Math.PI/180+Math.sin(phase)*p.drift/100;const gradient=ctx.createLinearGradient(-Math.cos(angle)*w/2,-Math.sin(angle)*h/2,Math.cos(angle)*w/2,Math.sin(angle)*h/2);const mix=(1-Math.cos(phase))/2;function blend(a,b,v){const aa=a.match(/\w\w/g).map(x=>parseInt(x,16)),bb=b.match(/\w\w/g).map(x=>parseInt(x,16));return 'rgb('+aa.map((x,i)=>Math.round(x+(bb[i]-x)*v)).join(',')+')';}gradient.addColorStop(0,blend(a,b,mix));gradient.addColorStop(1,blend(b,p.color1,mix));ctx.fillStyle=gradient;ctx.fillRect(-w/2,-h/2,w,h);}
else if(id==='waves'||id==='aurora'){for(let i=0;i<n;i++){ctx.beginPath();const y=(i/(n-1)-.5)*h;for(let j=0;j<=64;j++){const x=(j/64-.5)*w,yy=y+Math.sin(j/64*Math.PI*2/(id==='waves'?p.wavelength/100:1)+phase+i*.35)*p.amplitude*h/540;if(j)ctx.lineTo(x,yy);else ctx.moveTo(x,yy);}if(id==='aurora'){for(let j=64;j>=0;j--)ctx.lineTo((j/64-.5)*w,y+Math.sin(j/64*Math.PI*2+phase+i*.35)*p.amplitude*h/540+p.width*h/540);ctx.closePath();ctx.fillStyle=i%2?a:b;ctx.globalAlpha=.55;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=p.softness*w/960;ctx.fill();}else ctx.stroke();}}
else if(id==='contours'){for(let i=0;i<n;i++){ctx.beginPath();for(let j=0;j<=96;j++){const angle=j/96*Math.PI*2,radius=(i+1)/n*Math.max(w,h)*.6*(1+p.amplitude/100*Math.sin(angle*p.lobes+phase+i*.2));if(j)ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);else ctx.moveTo(Math.cos(angle)*radius,Math.sin(angle)*radius);}ctx.stroke();}}
else if(id==='grid'){ctx.rotate(p.angle*Math.PI/180);const d=Math.sin(phase)*p.travel*w/960;for(let i=0;i<=n;i++){ctx.beginPath();ctx.moveTo((i/n-.5)*w+d,-h);ctx.lineTo((i/n-.5)*w+d,h);ctx.moveTo(-w,(i/n-.5)*h+d);ctx.lineTo(w,(i/n-.5)*h+d);ctx.stroke();}}
else if(id==='sunburst'){ctx.translate((p.centerX/100-.5)*w,(p.centerY/100-.5)*h);for(let i=0;i<n;i++){const angle=i/n*Math.PI*2+q*p.turns*Math.PI*2,spread=Math.PI*2/n*p.spread/100,radius=Math.sqrt(w*w+h*h);ctx.fillStyle=i%2?a:b;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);ctx.lineTo(Math.cos(angle+spread)*radius,Math.sin(angle+spread)*radius);ctx.closePath();ctx.fill();}}
else if(id==='tiles'){for(let i=0;i<n*n;i++){ctx.save();ctx.translate(((i%n+.5)/n-.5)*w,((Math.floor(i/n)+.5)/n-.5)*h);ctx.rotate(q*p.turns*Math.PI*2+(i%3)*Math.PI/12);const size=Math.min(w,h)/n*p.size/100*(1+Math.sin(phase+i)*p.pulse/100);ctx.fillStyle=i%2?a:b;ctx.fillRect(-size/2,-size/2,size,size);ctx.restore();}}
else if(id==='speedlines'){for(let i=0;i<n;i++){const angle=i/n*Math.PI*2,rmax=Math.sqrt(w*w+h*h)*.6,r=Math.min(w,h)*.1+(rmax-Math.min(w,h)*.1)*fract(q*p.cycles+rand(i+p.seed)),len=rmax*p.length/100;ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);ctx.lineTo(Math.cos(angle)*(r+len),Math.sin(angle)*(r+len));ctx.stroke();}}
else{for(let i=0;i<n;i++){let x=(rand(i+p.seed)-.5)*w,y=(rand(i+p.seed+100)-.5)*h;if(id==='bokeh'){x+=Math.cos(phase+i)*p.travel*w/960;y+=Math.sin(phase+i)*p.travel*h/540;ctx.globalAlpha=.3+.2*Math.sin(phase+i);ctx.shadowColor=a;ctx.shadowBlur=p.softness*w/960;}else{const angle=p.direction*Math.PI/180,d=q*p.travel/100*w;x=fract((x+d*Math.cos(angle)+w/2)/w)*w-w/2;y=fract((y+d*Math.sin(angle)+h/2)/h)*h-h/2;}ctx.fillStyle=i%2?a:b;ctx.beginPath();ctx.arc(x,y,Math.max(.4,p.radius*w/960*(.4+rand(i+7)*.6)),0,Math.PI*2);ctx.fill();}}
}
ctx.restore();ctx.font='9px Arial';ctx.fillStyle='#d3b89b66';ctx.textAlign='right';
}
function render25(canvas,r,time,settings){const p=Object.assign(defaults(r),settings),q=clock(time,p),ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height,T=q*Math.PI*2*(p.cycles||1),a=p.color2||p.tint||'#ffad70',b=p.color3||(['gold','extrusion'].includes(r.id)?'#654010':'#cba27c'),amount=(p.amount||0)/100,n=p.count||16;
ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=p.color1||'#111113';ctx.fillRect(0,0,w,h);if(r.category==='Text'){const glow=ctx.createRadialGradient(w*.5,h*.2,0,w*.5,h*.3,w*.65);glow.addColorStop(0,'#ffffff0d');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);}ctx.save();ctx.translate(w/2,h/2);
function line(x,y,xx,yy){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
function gradient(){const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
if(r.category==='Text'){
 const text=r.id==='matrix'?'MOTION':r.id==='gold'||r.id==='extrusion'?'GOLD':r.id==='ember'?'EMBER':r.id==='glass'?'GLASS':r.id==='stamp'?'APPROVED':'MOTION';const size=w/(text.length*.76+1);ctx.font=`600 ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=gradient();
 if(r.id==='matrix'){const abc='01ABCDEFGHIJKLMNOPQRSTUVWXYZ';let s='';for(let i=0;i<text.length;i++)s+=q>=1||i<q*text.length?text[i]:abc[Math.floor(rand(i+p.seed+Math.floor(q*p.steps))*abc.length)];ctx.fillStyle=p.tint;ctx.fillText(s,0,0);}
 else if(r.id==='stretch'||r.id==='stamp'){
  if(r.id==='stamp'){const v=1+(1-q)*.8*Math.cos(q*(5+p.detail));ctx.scale(v,v);ctx.rotate((1-q)*-.25);ctx.globalAlpha=Math.min(1,q*3);ctx.fillStyle='#e4eef5';ctx.strokeStyle='#e4eef5';ctx.lineWidth=2;ctx.strokeRect(-w*.41,-h*.23,w*.82,h*.46);ctx.fillText(text,0,0);}
  else for(let i=0;i<text.length;i++){let x=Math.max(0,Math.min(1,(q-i/(text.length-1)*(p.stagger/100))/(1-p.stagger/100))),v=x>=1?0:Math.exp(-x*3)*(1-x)*Math.cos(x*(5+p.detail));ctx.save();ctx.translate((i-(text.length-1)/2)*size*.73,0);ctx.scale(1+v*amount*2,1-v*.9);ctx.globalAlpha=1-v;ctx.fillText(text[i],0,0);ctx.restore();}
 }else{
  if(r.id==='extrusion'){ctx.fillStyle='#503311';for(let i=Math.round(amount*16);i>0;i--)ctx.fillText(text,i,i);ctx.fillStyle=gradient();}
  if(r.id==='glass'){ctx.strokeStyle='#f1fbff';ctx.lineWidth=1.5;ctx.strokeText(text,1,1);ctx.globalAlpha=.8;}
  if(r.id==='vhs'){ctx.fillStyle='#b8e7ff';ctx.globalAlpha=.5;ctx.fillText(text,(q>=1?0:Math.sin(Math.floor(q*30))*amount*12),2);ctx.globalAlpha=1;ctx.fillStyle='#f0f5ff';}
  if(r.id==='ember'){ctx.shadowColor=p.tint;ctx.shadowBlur=20;ctx.globalAlpha=q>=1?1:.6+.4*Math.sin(T*p.detail);}
  ctx.fillText(text,0,0);if(r.id==='gold'){const shine=ctx.createLinearGradient((q-.6)*w,0,(q-.4)*w,0);shine.addColorStop(0,'#fff2c900');shine.addColorStop(.5,'#fff2c9bb');shine.addColorStop(1,'#fff2c900');ctx.fillStyle=shine;ctx.fillText(text,0,0);}
 }
}else if(r.category==='Background'){
 ctx.strokeStyle=a;ctx.fillStyle=gradient();ctx.lineWidth=Math.max(1,(p.size||50)*.045*w/960);
 if(r.id==='nebula'||r.id==='smoke'){ctx.globalCompositeOperation='screen';for(let i=0;i<30;i++){let x=(rand(i+2)-.5)*w+Math.sin(T+i)*w*.09,y=(rand(i+4)-.5)*h+Math.cos(T+i)*h*.12,radius=w*(.12+rand(i)*.25);const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,a+'55');g.addColorStop(1,a+'00');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);}}
 else if(r.id==='liquidgradient'||r.id==='glassbg'){ctx.fillStyle=gradient();ctx.fillRect(-w/2,-h/2,w,h);for(let i=0;i<4;i++){let x=Math.sin(T+i)*w*.4,y=Math.cos(T*.7+i)*h*.5,g=ctx.createRadialGradient(x,y,0,x,y,w*.5);g.addColorStop(0,(i%2?a:b)+'cc');g.addColorStop(1,(i%2?a:b)+'00');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);}if(r.id==='glassbg'){ctx.fillStyle='#ffffff20';ctx.strokeStyle='#ffffff55';ctx.fillRect(-w*.3,-h*.28,w*.6,h*.56);ctx.strokeRect(-w*.3,-h*.28,w*.6,h*.56);}}
 else if(r.id==='neongrid'||r.id==='blueprint'){const d=Math.sin(T)*amount*w*.04;for(let i=0;i<n;i++){let x=(i/n-.5)*w+d,y=(i/n-.5)*h+d;line(x,-h/2,x,h/2);line(-w/2,y,w/2,y);}if(r.id==='blueprint')for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(0,0,h*i*.13,0,Math.PI*2);ctx.stroke();}}
 else if(r.id==='softbokeh'){ctx.filter=`blur(${p.softness*w/960}px)`;for(let i=0;i<n;i++){ctx.globalAlpha=.55;ctx.beginPath();ctx.arc((rand(i+p.seed)-.5)*w+Math.cos(T+i)*amount*w*.08,(rand(i+p.seed+5)-.5)*h+Math.sin(T+i)*amount*h*.08,Math.max(1,p.size*w/960*(.3+rand(i))),0,Math.PI*2);ctx.fill();}}
 else if(r.id==='retrosun'){for(let i=0;i<n;i++){const ang=i/n*Math.PI*2+q*amount*.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*w,Math.sin(ang)*w);ctx.lineTo(Math.cos(ang+Math.PI/n)*w,Math.sin(ang+Math.PI/n)*w);ctx.closePath();ctx.fill();}}
 else if(r.id==='tunnel'){for(let i=0;i<n;i++){const f=(i/n+q*(p.cycles||1)*amount)%1;ctx.strokeRect(-w*f*.7,-h*f*.7,w*f*1.4,h*f*1.4);}}
 else for(let i=0;i<n;i++){const ang=i/n*Math.PI*2,r0=h*(.1+((q+rand(i+p.seed))%1)*.7),len=(p.size+amount*300)*w/960;line(Math.cos(ang)*r0,Math.sin(ang)*r0,Math.cos(ang)*(r0+len),Math.sin(ang)*(r0+len));}
}
ctx.restore();ctx.font='9px Arial';ctx.fillStyle='#9cb3c77a';ctx.textAlign='right';
}

const reduced=()=>document.body.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(now){raf=0;if(paused)return;let active=false;entries.forEach((e,c)=>{if(!c.isConnected){observer.unobserve(c);entries.delete(c);return;}if(e.active&&e.visible&&!document.hidden&&!reduced()){const elapsed=(now-e.start)/1000,p=Object.assign(defaults(e.preset),e.params);const done=p.manual||(!p.loop&&elapsed>=p.duration);if(done||now-e.last>=1000/30){render(c,e.preset,elapsed,e.params);e.last=now;}if(done)e.active=false;else active=true;}});if(active)raf=requestAnimationFrame(tick);}
function run(){if(!paused&&!raf)raf=requestAnimationFrame(tick);}
function suspend(value){paused=value;if(paused&&raf){cancelAnimationFrame(raf);raf=0;}if(!paused)run();}
const observer=new IntersectionObserver(list=>list.forEach(x=>{const e=entries.get(x.target);if(e){e.visible=x.isIntersecting;run();}}));
function attach(canvas,preset,params={},always=false){if(!entries.has(canvas))observer.observe(canvas);entries.set(canvas,{preset,params,active:always,visible:true,start:performance.now(),last:-Infinity});render(canvas,preset,.9,params);run();}
function play(canvas,active){const e=entries.get(canvas);if(e){e.active=active;e.start=performance.now();if(!active)render(canvas,e.preset,.9,e.params);run();}}
function clear(){entries.forEach((e,c)=>observer.unobserve(c));entries.clear();}
document.addEventListener('visibilitychange',run);return {attach,play,clear,render,clock,suspend};
})();
