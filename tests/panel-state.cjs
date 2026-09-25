// Lightweight DOM fixture for actual panel event/state logic; not a layout renderer.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const ids=new Map(),nodes=[];
 class El{
  constructor(tag='div'){this.tagName=tag;this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.value='';this.checked=false;this.attrs={};this.classList={add(){},remove(){},toggle(){},contains(){return false;}};nodes.push(this);}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}
  set textContent(v){this.text=v;this.children=[];}get textContent(){return this.text||'';}
  append(...v){this.children.push(...v);}appendChild(v){this.children.push(v);return v;}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}focus(){}scrollIntoView(){}
 }
 const get=id=>{if(!ids.has(id)){const e=new El();e.id=id;}return ids.get(id);};
 for(const id of ['apply','update','inspector-load'])get(id).dataset.host='';
 const tabs=['Text','Background','Tools','Settings'].map(name=>{const e=new El();e.dataset.tab=name;return e;});
 const doc={getElementById:get,createElement:t=>new El(t),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-host]'?nodes.filter(x=>'host'in x.dataset):s==='[data-tab]'?tabs:s==='.card-apply'?nodes.filter(x=>x.className&&x.className.includes('card-apply')):[],addEventListener(){},body:new El(),hidden:false};
 const calls=[],bridge={isReady:()=>true,isAvailable:()=>true,call(payload){return new Promise(resolve=>calls.push({payload,resolve}));}};
 const presets=JSON.parse(fs.readFileSync(__dirname+'/../presets.json','utf8'));
 const ctx={document:doc,window:{MA_PRESETS:presets,MotionAstraBridge:bridge,addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},MotionPreview:{clear(){},attach(){},play(){},suspend(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){},console};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../js/main.js','utf8'),ctx);
 return {get,nodes,calls,tabs,card:()=>get('cards').children[0],ctx};
}
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const e=setup();const cardApply=()=>e.card().children[1].children[3].children[1];
 cardApply().onclick();assert.equal(e.calls.filter(c=>c.payload.action==='apply').length,1);
 e.calls[0].resolve({composition:'Comp',selected:1,version:'25',hostVersion:'2.8.0'});await flush();
 assert.equal(cardApply().disabled,true,'Late status response must not unlock a mutation');
 cardApply().onclick();assert.equal(e.calls.filter(c=>c.payload.action==='apply').length,1,'One mutation in flight');
 // Test retained edits in a fresh panel; select first Background using the actual tab function.
 const b=setup();b.calls[0].resolve({});await flush();
 b.tabs.find(t=>t.dataset.tab==='Background').onclick();
 const customize=b.card().children[1].children[3].children[0];customize.onclick();
 const color=b.get('param-color2');color.value='#ee2244';color.oninput();b.get('close').onclick();
 b.card().children[1].children[3].children[1].onclick();
 const sent=b.calls.find(c=>c.payload.action==='generateBackground');assert(sent);assert.equal(sent.payload.params.color2,'#ee2244');
 console.log('PASS: status cannot unlock mutation; card Generate retains customized colors.');
})().catch(e=>{console.error(e);process.exit(1);});
