const assert=require('node:assert/strict'),vm=require('node:vm'),{create}=require('./host-model.cjs'),data=require('../presets.json');
const controller='MA2 MotionAstra Progress';
function metadata(l){return JSON.parse(decodeURIComponent(l.comment.split('[MotionAstra2:')[1].split(']')[0]));}
for(const r of data.presets){
 const e=create();if(r.category==='Text')e.comp.add('text').selected=true;
 assert.equal(e.rpc({action:'apply',id:r.id,params:{}}).changed,1,r.id);
 const l=e.comp.selectedLayers[0];assert.equal(l.fx.items.filter(x=>x.name.startsWith('MA2 ')&&!x.name.startsWith('MA2 native ')).length,r.id==='switcher'?2:1,r.id+' compact controller count');
 assert(l.fx.property(controller));assert.equal(metadata(l).layout,'compact');
 const loaded=e.rpc({action:'load'});assert.equal(loaded.layout,'compact');assert(loaded.target);
 const before=l.fx.items.slice();assert.equal(e.rpc({action:'update',id:r.id,target:loaded.target,params:{...loaded.params,duration:3,tint:'#ee3355',color2:'#33ee55'}}).changed,1);
 assert.equal(e.rpc({action:'load'}).params.duration,3);assert.equal(l.fx.numProperties,before.length);assert(l.fx.property(controller));
 const remove=e.rpc({action:'tool',name:'remove'});assert.equal(remove.changed,1);assert.equal(l.fx.numProperties,0);
}
const e=create(),l=e.comp.add('text');l.selected=true;
assert.equal(e.rpc({action:'apply',id:'counter',params:{start:10,end:110,decimals:2,manual:true,progress:25}}).changed,1);
function number(){return Number(vm.runInNewContext(l.text.property('ADBE Text Document').expression,{Math,time:l.inPoint,inPoint:l.inPoint,thisComp:{frameDuration:1/30},marker:{numKeys:0},effect:n=>i=>({value:l.fx.property(n).property(i).value})}));}
assert.equal(number(),53.75); // default ease-out: 10 + 100*(1-.75*.75)
assert.equal(e.rpc({action:'update',id:'counter',params:{start:0,end:200,ease:0,manual:true,progress:50}}).changed,1);assert.equal(number(),100);
const p=l.fx.property(controller).property(1);p.setValueAtTime(l.inPoint,0);p.setValueAtTime(l.inPoint+2,100);const keys=JSON.stringify(p.keys);
assert.equal(e.rpc({action:'update',id:'counter',params:{start:0,end:200,ease:0,manual:true,tint:'#ff0000'}}).changed,1);assert.equal(JSON.stringify(p.keys),keys,'Color changes must preserve animated master');
const loaded=e.rpc({action:'load'}),other=e.comp.add('text');l.selected=false;other.selected=true;
assert.equal(e.rpc({action:'update',id:'counter',target:loaded.target,params:loaded.params}).ok,false);assert.equal(other.fx.numProperties,0);
const legacy=create(),old=legacy.comp.add('text');old.selected=true;
assert.equal(legacy.rpc({action:'apply',id:'counter',layout:'legacy',params:{start:25,end:85}}).changed,1);
const loadedOld=legacy.rpc({action:'load'});assert.equal(loadedOld.layout,'legacy');
const end=old.fx.property('MA2 end').property(1);end.setValueAtTime(1,85);end.setValueAtTime(2,90);let count=old.fx.numProperties;
assert.equal(legacy.rpc({action:'compact',target:loadedOld.target}).changed,0);assert.equal(old.fx.numProperties,count);assert.equal(end.numKeys,2);
while(end.numKeys)end.removeKey(1);
assert.equal(legacy.rpc({action:'compact',target:loadedOld.target}).changed,1);
assert.equal(legacy.rpc({action:'load'}).params.start,25);assert.equal(old.fx.items.filter(x=>x.name.startsWith('MA2 ')&&!x.name.startsWith('MA2 native ')).length,1);
console.log('PASS: compact controllers on all 14 presets, parameter updates, clock values, animated master preservation, target binding and guarded legacy conversion.');
for(const r of data.presets){const e=create();if(r.category==='Text')e.comp.add('text').selected=true;assert.equal(e.rpc({action:'apply',id:r.id,layout:'legacy',params:{duration:2.5}}).changed,1);const old=e.rpc({action:'load'}),l=e.comp.selectedLayers[0],native=l.fx.items.filter(x=>x.name.startsWith('MA2 native '));assert.equal(e.rpc({action:'compact',target:old.target}).changed,1,r.id+' conversion');assert.deepEqual(e.rpc({action:'load'}).params,old.params);assert.deepEqual(l.fx.items.filter(x=>x.name.startsWith('MA2 native ')),native);assert.equal(e.rpc({action:'update',id:r.id,params:old.params}).changed,1);}
{const e=create(),l=e.comp.add('text');l.selected=true;assert.equal(e.rpc({action:'apply',id:'counter',layout:'legacy',params:{}}).changed,1);const other=e.comp.add('solid');other.transform.property('ADBE Opacity').expression='thisComp.layer(2).effect("MA2 end")(1)';const before=l.fx.numProperties;assert.equal(e.rpc({action:'compact'}).changed,0);assert.equal(l.fx.numProperties,before);assert(l.fx.property('MA2 end'));}
{const e=create();assert.equal(e.rpc({action:'generateBackground',id:'neongrid',params:{}}).changed,1);const loaded=e.rpc({action:'load'}),n=e.comp.numLayers;e.comp.selectedLayers[0].selected=false;assert.equal(e.rpc({action:'update',id:'neongrid',target:loaded.target,params:loaded.params}).ok,false);assert.equal(e.comp.numLayers,n,'Tweaker must never generate a background after selection changes');}
console.log('PASS: conversion preserves values and rendering effects on all presets, external dependencies block compaction, Tweaker never generates on stale selection.');
