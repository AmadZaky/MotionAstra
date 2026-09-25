const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
const presets=require('../presets.json').presets.filter(p=>p.category==='Background');
for(const p of presets)for(const action of ['apply','update'])for(const kind of [null,'solid','video','text']){
 const e=create(),old=kind?e.comp.add(kind):null;if(old)old.selected=true;
 const before=e.comp.numLayers,r=e.rpc({action,id:p.id,params:{duration:2}});
 assert.equal(r.changed,1,p.name+' '+action+': '+r.message);assert.equal(e.comp.numLayers,before+1);
 if(old){assert.equal(old.fx.numProperties,0);assert.equal(old.selected,false);}
 const made=e.comp.selectedLayers[0];assert(made);assert.equal(made.index,e.comp.numLayers);
 assert.equal(e.rpc({action:'load'}).id,p.id);
 assert.equal(e.rpc({action:'update',id:p.id,params:{duration:3}}).changed,1);
 assert.equal(e.comp.numLayers,before+1,'Update matching layer must not duplicate');
}
console.log('PASS: all 10 backgrounds create independent layers for Apply/unmatched Update; matching Update does not duplicate.');
