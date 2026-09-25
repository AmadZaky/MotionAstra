const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{create}=require('./host-model.cjs');
const data=require('../presets.json');assert.equal(data.presets.length,20);for(const category of ['Text','Background'])assert.equal(data.presets.filter(p=>p.category===category).length,10);
function expressions(g,out=[]){for(let i=1;i<=g.numProperties;i++){const p=g.property(i);if(p.expression)out.push(p.expression);if(p.numProperties)expressions(p,out);}return out;}
for(const r of data.presets){const e=create();if(r.category==='Text')e.comp.add('text').selected=true;const res=e.rpc({action:'apply',id:r.id,params:{}});assert.equal(res.changed,1,r.name+': '+res.message);const l=e.comp.selectedLayers[0];assert(l);const start=l.inPoint,end=l.markers.keyTime(l.markers.numKeys);assert(end>start);const code=expressions(l);assert(code.length,r.id+' expressions');for(const s of code)new vm.Script(s,{filename:r.id});let loaded=e.rpc({action:'load'});assert.equal(loaded.id,r.id);const params=loaded.params;params.amount=35;params.duration=1.8;const up=e.rpc({action:'update',id:r.id,params});assert.equal(up.changed,1,up.message);e.reload();assert.equal(e.rpc({action:'load'}).id,r.id);
const external=l.fx.addProperty('Other');external.name='User FX';const removed=e.rpc({action:'tool',name:'remove'});assert.equal(removed.changed,1,removed.message);assert(l.fx.property('User FX'));assert.equal(l.fx.items.filter(x=>x.name.startsWith('MA2 ')).length,0);assert.equal(l.masks.numProperties,0);
assert.equal(e.rpc({action:'tool',name:'eraseAll'}).changed,1);assert.equal(l.fx.numProperties,0);
}
// Solid-target backgrounds must not silently alter footage; mixed selection reports skipped layers.
{const e=create(),solid=e.comp.add('solid'),video=e.comp.add('video');solid.selected=video.selected=true;const r=e.rpc({action:'apply',id:'neongrid',params:{}});assert.equal(r.changed,1);assert.equal(r.severity,'success');assert.equal(solid.fx.numProperties,0);assert.equal(video.fx.numProperties,0);assert.equal(e.comp.numLayers,3);}
// New effects reject conflicting instances and source-text animation.
{const e=create(),l=e.comp.add('text');l.selected=true;l.text.property('ADBE Text Document').expression='"Existing"';assert.equal(e.rpc({action:'apply',id:'matrix',params:{}}).changed,0);assert.equal(l.fx.numProperties,0);}
// Old projects are still editable by recipe id, without adding legacy cards to the catalog.
for(const r of data.legacy){const e=create();if(r.category==='Text')e.comp.add('text').selected=true;assert.equal(e.rpc({action:'apply',id:r.id,params:{}}).changed,1,r.id);assert.equal(e.rpc({action:'load'}).id,r.id);}
for(const name of ['main.js','bridge.js','preview.js','presets-data.js'])new vm.Script(fs.readFileSync(path.join(__dirname,'../js',name),'utf8'));
console.log('PASS 20 recipes, legacy read/update paths, syntax, ownership/removal, type validation and target validation. AE native rendering remains a separate gate.');

for(const id of ['zoom','whip','lightleak','rgbglitch','warp','filmburn','bounce','anamorphic','page','pixel']){const e=create();e.comp.add('text').selected=true;for(const action of ['apply','update']){const r=e.rpc({action,id,params:{}});assert.equal(r.ok,false);assert.equal(e.comp.numLayers,1);assert.equal(e.comp.selectedLayers[0].fx.numProperties,0);}}
console.log('PASS removed transition IDs cannot create or update layers.');
