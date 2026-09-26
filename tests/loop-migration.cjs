const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const id of ['counter','stretch','neongrid']){
 const e=create();if(id!=='neongrid')e.comp.add('text').selected=true;
 assert.equal(e.rpc({action:id==='neongrid'?'generateBackground':'apply',id,params:{}}).changed,1);
 const l=e.comp.selectedLayers[0];l.fx.property('MA2 loopMode').remove();const old=l.fx.addProperty('ADBE Checkbox Control');old.name='MA2 loop';old.property(1).value=0;l.comment=l.comment.replace(encodeURIComponent('2.8.3'),'old-build');
 const loaded=e.rpc({action:'load'});assert.equal(loaded.ok,true,loaded.message);assert.equal(loaded.params.loopMode,1,'Legacy instances present explicit Cycle default');
 assert.equal(e.rpc({action:'update',id,params:{...loaded.params,loopMode:0}}).changed,1);assert.equal(l.fx.property('MA2 loop'),undefined);assert.equal(e.rpc({action:'load'}).params.loopMode,0);
}
for(const mode of [-1,4,'bad']){const e=create();e.comp.add('text').selected=true;assert.equal(e.rpc({action:'apply',id:'counter',params:{loopMode:mode}}).ok,false);assert.equal(e.comp.selectedLayers[0].fx.numProperties,0);}
console.log('PASS: legacy checkbox controls migrate on Update; invalid loop modes reject before mutation.');
