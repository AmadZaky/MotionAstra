const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const r of require('../presets.json').presets.filter(p=>p.category==='Text')){
 const e=create(),result=e.rpc({action:'apply',id:r.id,params:{}});
 assert.equal(result.ok,false,r.name+' must require selection');assert.equal(e.comp.numLayers,0);
 e.comp.add('text').selected=true;assert.equal(e.rpc({action:'apply',id:r.id,params:{}}).changed,1);
}
console.log('PASS: all Text FX require an existing selected text layer.');
