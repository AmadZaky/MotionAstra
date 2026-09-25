const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const r of require('../presets.json').presets.filter(r=>r.category==='Background')){
 const e=create();e.comp.add('solid').selected=true;e.comp.add('video').selected=true;const before=e.comp.numLayers;
 const params={color1:'#112233',color2:'#ff2200',color3:'#00aaff'};assert.equal(e.rpc({action:'generateBackground',id:r.id,params}).changed,1);assert.equal(e.comp.numLayers,before+1);
 const l=e.comp.selectedLayers[0],cloud=['nebula','smoke'].includes(r.id),fx=l.fx.property('MA2 native '+(cloud?'cloud colors':'ramp'));
 for(const [index,color] of cloud?[[1,[17/255,34/255,51/255,1]],[2,[1,34/255,0,1]]]:[[2,[1,34/255,0,1]],[4,[0,170/255,1,1]]]){const p=fx.property(index);assert.equal(p.expression,'','Background colors must be assigned directly to AE properties');assert.deepEqual(Array.from(p.value),color);}
 params.color2='#33cc66';assert.equal(e.rpc({action:'generateBackground',id:r.id,params}).changed,1);assert.equal(e.comp.numLayers,before+1);assert.deepEqual(Array.from(fx.property(cloud?2:2).value),[.2,.8,.4,1]);
}
console.log('PASS: one generated layer per trigger; chosen colors reach native Ramp/Tint values and update without duplicates.');
