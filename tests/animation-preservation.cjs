const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
function meta(l){return JSON.parse(decodeURIComponent(l.comment.split('[MotionAstra2:')[1].split(']')[0]));}
function save(l,m){l.comment='\n[MotionAstra2:'+encodeURIComponent(JSON.stringify(m))+']';}
for(const layout of ['compact','legacy']){
 const e=create(),l=e.comp.add('text');l.selected=true;e.rpc({action:'apply',id:'counter',layout,params:{manual:true}});
 const master=l.fx.property(layout==='compact'?'MA2 MotionAstra Progress':'MA2 progress').property(1);
 master.setValueAtTime(1.5,0);master.setValueAtTime(3.5,100);const keys=JSON.stringify(master.keys);
 const loaded=e.rpc({action:'load'});
 assert.equal(e.rpc({action:'update',id:'counter',target:loaded.target,params:{...loaded.params,end:500}}).changed,1);
 assert.equal(JSON.stringify(master.keys),keys,layout+' preserve Progress');assert.equal(master.numKeys,2);
 assert.equal(e.rpc({action:'update',id:'counter',params:{...loaded.params,progress:25},editProgress:true}).changed,1);
 assert.equal(master.keyValue(3),25);assert.equal(master.keyTime(3),e.comp.time);
 master.expression='value * 2';const before=l.comment;
 assert.equal(e.rpc({action:'update',id:'counter',params:{...loaded.params,progress:50},editProgress:true}).changed,0);
 assert.equal(l.comment,before);assert.equal(master.expression,'value * 2');
 const native=l.fx.property('MA2 native text color').property(3);native.setValueAtTime(1,[1,0,0,1]);native.setValueAtTime(2,[0,1,0,1]);const colorKeys=JSON.stringify(native.keys);
 const latest=e.rpc({action:'load'});
 assert.equal(e.rpc({action:'update',id:'counter',params:{...latest.params,end:600},editedParameters:['end']}).changed,1);
 assert.equal(JSON.stringify(native.keys),colorKeys);assert.equal(native.numKeys,2);
 native.expression='[1,0,1,1]';
 assert.equal(e.rpc({action:'update',id:'counter',params:{...latest.params,end:700},editedParameters:['end']}).changed,1);assert.equal(native.expression,'[1,0,1,1]');
 const beforeColor=l.comment;
 assert.equal(e.rpc({action:'update',id:'counter',params:{...latest.params,tint:'#ff0000'},editedParameters:['tint']}).changed,0);assert.equal(l.comment,beforeColor);
 native.expression='';assert.equal(e.rpc({action:'update',id:'counter',params:{...latest.params,tint:'#ff0000'},editedParameters:['tint']}).changed,1);assert.equal(native.numKeys,3);
}
for(const r of require('../presets.json').presets.filter(p=>p.category==='Background')){
 const e=create();e.rpc({action:'generateBackground',id:r.id,params:{}});const l=e.comp.selectedLayers[0],loaded=e.rpc({action:'load'}),cloud=['nebula','smoke'].includes(r.id),ramp=l.fx.property('MA2 native '+(cloud?'cloud colors':'ramp')),c=ramp.property(cloud?2:2);
 c.setValueAtTime(0,[1,0,0,1]);c.setValueAtTime(1,[0,0,1,1]);const keys=JSON.stringify(c.keys),old=meta(l);old.build='old';save(l,old);
 assert.equal(e.rpc({action:'update',id:r.id,params:{...loaded.params,duration:3},editedParameters:['duration']}).changed,1,r.id);assert.equal(l.fx.property(ramp.name),ramp);assert.equal(JSON.stringify(c.keys),keys);assert.equal(c.numKeys,2);
 if(r.parameters.some(p=>p.id==='count')){const comment=l.comment;assert.equal(e.rpc({action:'update',id:r.id,params:{...loaded.params,count:loaded.params.count+1},editedParameters:['count']}).changed,0,r.id+' animated artwork rebuild blocked');assert.equal(l.comment,comment);}
}
console.log('PASS: compact/legacy keyframe preservation, explicit playhead edits, expression guards, version migrations and protected artwork rebuilds.');
{
 const e=create(),l=e.comp.add('text');l.selected=true;const opt={mode:'IN',duration:1,stagger:.05,intensity:100,seed:1,group:'chars',order:'forward',easing:'preset',placement:'edges'};
 e.rpc({action:'yuText',operation:'apply',id:1,options:opt});const anim=l.text.property('ADBE Text Animators').property(1),prop=anim.property('ADBE Text Animator Properties').property(1),saved=l.comment;
 prop.setValueAtTime(1,5);prop.setValueAtTime(2,15);
 assert.equal(e.rpc({action:'yuText',operation:'apply',id:2,options:opt}).changed,0);assert.equal(l.comment,saved);assert.equal(prop.numKeys,2);
 while(prop.numKeys)prop.removeKey(1);
 const amount=anim.property('ADBE Text Selectors').property(1).property('ADBE Text Expressible Amount');amount.expression+='\n// My custom timing';
 assert.equal(e.rpc({action:'yuText',operation:'apply',id:2,options:opt}).changed,0);assert.equal(l.comment,saved);
 assert.equal(e.rpc({action:'yuText',operation:'apply',id:2,options:{...opt,mode:'OUT'}}).changed,1,'Other phase can still be applied');
 assert.equal(e.rpc({action:'yuText',operation:'clear'}).changed,1,'Explicit remove remains available');
}
console.log('PASS: Text Animate protects custom keys/expressions in replaced phases without blocking the other phase or explicit removal.');
