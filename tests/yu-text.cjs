/* Compare every integrated selector with the supplied YUGraphic engine. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{create}=require('./host-model.cjs');
const root=path.resolve(__dirname,'..'),ref=vm.createContext({});vm.runInContext(fs.readFileSync(root+'/vendor/yu-text-motion/core.js','utf8'),ref);const core=ref.YTMCore;
assert.equal(core.presets.length,120);
function options(p,mode='IN'){return {mode,duration:p.duration,stagger:p.stagger,intensity:100,seed:17,group:p.group,order:p.order,easing:'preset',placement:'edges',playhead:4.5};}
function evaluate(code,o,t,i=3,n=8){return JSON.parse(JSON.stringify(vm.runInNewContext(code,{time:t,inPoint:1.5,outPoint:7,thisComp:{frameDuration:1/30},textIndex:i,textTotal:n,effect:name=>()=>o[({Duration:'duration',Stagger:'stagger',Intensity:'intensity',Seed:'seed',Offset:'offset'})[name.split(' | ')[1]]]||0})));}
let expressions=0;
for(const p of core.presets){
 const e=create(),l=e.comp.add('text');l.selected=true;l.comment='User notes';const user=l.text.property('ADBE Text Animators').addProperty('ADBE Text Animator');user.name='User animation';
 for(const mode of ['IN','OUT','BOTH']){
  const o=options(p,mode),r=e.rpc({action:'yuText',operation:'apply',id:p.id,options:o});assert.equal(r.changed,1,r.message);assert.equal(l.fx.numProperties,0,'YU must not crowd Effect Controls');
  for(const a of l.text.property('ADBE Text Animators').items.filter(a=>a.name.startsWith('YTM '))){
   const parts=a.name.split(' | '),phase=parts[0].split(' ')[1],channel=parts[2],actual=a.property('ADBE Text Selectors').property(1).property('ADBE Text Expressible Amount').expression;
   const expected=core.expression(p,channel,phase,{...o,prefix:'YTM '});assert(!actual.includes('effect('));
   for(const t of [0,1.5,1.53,1.8,2.2,3.5,5.9,6.8,7,8])assert.deepEqual(evaluate(actual,o,t),evaluate(expected,o,t),p.name+' '+phase+' '+channel+' '+t);
   expressions++;
  }
 }
 const loaded=e.rpc({action:'yuText',operation:'load'});assert.equal(loaded.id,p.id);assert.equal(loaded.options.seed,17);
 const changed={...loaded.options,intensity:65,duration:.8,group:'words',order:'reverse',placement:'playhead',mode:'IN'};
 assert.equal(e.rpc({action:'yuText',operation:'apply',id:p.id,options:changed,target:loaded.target}).changed,1);
 assert.equal(e.rpc({action:'yuText',operation:'load'}).options.intensity,65);
 assert.equal(e.rpc({action:'yuText',operation:'clear'}).changed,1);assert.equal(l.comment,'User notes');assert.equal(l.text.property('ADBE Text Animators').numProperties,1);assert.equal(l.text.property('ADBE Text Animators').property(1),user);
}
const e=create(),l=e.comp.add('text');l.selected=true;let o=options(core.presets[0]);assert.equal(e.rpc({action:'yuText',operation:'apply',id:1,options:o}).changed,1);const loaded=e.rpc({action:'yuText',operation:'load'}),before=l.text.property('ADBE Text Animators').numProperties;
assert.equal(e.rpc({action:'yuText',operation:'apply',id:1,options:{...o,duration:'NaN'}}).ok,false);assert.equal(l.text.property('ADBE Text Animators').numProperties,before);
l.selected=false;const wrong=e.comp.add('solid');wrong.selected=true;assert.equal(e.rpc({action:'yuText',operation:'apply',id:1,options:o,target:loaded.target}).ok,false);assert.equal(wrong.fx.numProperties,0);
wrong.selected=false;l.selected=true;l.locked=true;assert.equal(e.rpc({action:'yuText',operation:'clear'}).changed,0);l.locked=false;
// Existing phase survives an incompatible new selector creation, via original staged apply.
const group=l.text.property('ADBE Text Animators'),original=group.addProperty.bind(group);group.addProperty=()=>{throw Error('Injected native failure');};assert.equal(e.rpc({action:'yuText',operation:'apply',id:21,options:o}).changed,0);assert.equal(group.numProperties,before);group.addProperty=original;
assert.equal(e.rpc({action:'tool',name:'eraseAll'}).changed,1);assert.equal(group.numProperties,0);assert(!l.comment.includes('[MA_YU]'));
console.log('PASS: 120 YUGraphic presets, '+expressions+' selector expressions match original numerically; compact parameters, phase replacement, load/update, target guards, cleanup and failure preservation. Native AE rendering remains a manual check.');
