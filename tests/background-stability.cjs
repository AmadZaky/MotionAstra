const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const p of require('../presets.json').presets.filter(p=>p.category==='Background')){
 const e=create();assert.equal(e.rpc({action:'generateBackground',id:p.id,params:{}}).changed,1);
 const l=e.comp.selectedLayers[0],mask=l.masks.property(1),native=l.fx.items.filter(x=>x.name.startsWith('MA2 native '));
 const r=e.rpc({action:'generateBackground',id:p.id,params:{color2:'#ee2244'}});assert.equal(r.changed,1,r.message);
 assert.equal(e.comp.numLayers,1,'Repeat Generate should update matching selected background: '+p.id);
 assert.equal(e.rpc({action:'load'}).params.color2,'#ee2244');
 assert.equal(l.masks.property(1),mask,'Color-only edit must keep mask identities');
 assert.deepEqual(l.fx.items.filter(x=>x.name.startsWith('MA2 native ')),native,'Color-only edit must keep effect identities');
 if(p.parameters.some(x=>x.id==='count')){
  assert.equal(e.rpc({action:'update',id:p.id,params:{count:20}}).changed,1);assert.notEqual(l.masks.property(1),mask,'Count must rebuild geometry');
 }
 l.selected=false;assert.equal(e.rpc({action:'generateBackground',id:p.id,params:{}}).changed,1);assert.equal(e.comp.numLayers,2,'Deselect permits intentional new instance');
}
console.log('PASS: repeat Generate avoids duplicates; color updates reuse artwork; count rebuilds; intentional new instances remain possible.');

// Previously installed builds migrate expressions once, then preserve native objects.
{const e=create();e.rpc({action:'generateBackground',id:'neongrid',params:{}});const l=e.comp.selectedLayers[0];l.comment=l.comment.replace(encodeURIComponent('2.8.3'),'old-build');const first=l.masks.property(1);assert.equal(e.rpc({action:'update',id:'neongrid',params:{}}).changed,1);assert.notEqual(l.masks.property(1),first);const migrated=l.masks.property(1);e.rpc({action:'update',id:'neongrid',params:{}});assert.equal(l.masks.property(1),migrated);}
