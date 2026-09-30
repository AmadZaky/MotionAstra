const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
const r=require('../fx-tools.json').effects.find(x=>x.id==='glass');
assert(r,'Glass Surface must be registered');
for(const kind of ['text','shape','solid','video']){
 const e=create(),l=e.comp.add(kind);l.selected=true;l.comment='My artwork';
 const p=Object.fromEntries(r.parameters.map(x=>[x.id,x.default]));
 const run=(operation,params=p,target)=>e.rpc({action:'fxTools',operation,id:'glass',params,target});
 assert.equal(run('apply').changed,1);assert.equal(l.fx.numProperties,5);assert.equal(e.comp.numLayers,1);
 const loaded=run('load');assert(loaded.ok);assert.deepEqual(loaded.params,p);
 assert.equal(run('update',{...p,color:'#1299cc',blur:12},loaded.target).changed,1);
 assert.equal(l.fx.numProperties,5);
 assert.deepEqual(Array.from(l.fx.property('MAFT glass | tint').property('ADBE Ramp-0002').value),[18/255,153/255,204/255,1]);
 assert.equal(l.fx.property('MAFT glass | frost').property('ADBE Gaussian Blur 2-0001').value,12);
 assert.equal(run('remove',p,loaded.target).changed,1);assert.equal(l.fx.numProperties,0);assert.equal(l.comment,'My artwork');
}
console.log('PASS: Glass Surface Apply/Load/Update/Remove, colors, blur, stable layer/effect counts and source preservation.');
