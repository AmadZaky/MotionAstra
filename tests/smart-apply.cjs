const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const r of require('../presets.json').presets.filter(p=>p.category==='Text')){
 const e=create(),l=e.comp.add('text');l.selected=true;
 const payload={action:'apply',id:r.id,params:{},smart:true};
 assert.equal(e.rpc(payload).changed,1,r.id);
 const count=l.fx.numProperties;
 assert.equal(e.rpc(payload).changed,1,r.id+' updates');
 assert.equal(l.fx.numProperties,count,r.id+' must not duplicate controls');
 const fresh=e.comp.add('text');fresh.selected=true;
 assert.equal(e.rpc(payload).changed,2,r.id+' mixed selection');
 assert.equal(l.fx.numProperties,count);assert.equal(fresh.fx.numProperties,count);
}
console.log('PASS: smart Apply updates existing Text FX and applies fresh layers without duplicate controls.');
