// Contract checks for the scalar/color mismatches reported by real AE.
// This is not a rendering model or a complete Adobe effect schema.
const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
function strictLayer(layer,percentMax=1){
 const add=layer.fx.addProperty.bind(layer.fx);
 layer.fx.addProperty=function(name){
  const fx=add(name);
  const define=(id,value,min,max)=>{const p=fx.property(name+'-'+id);p.value=value;p.hasMin=typeof min==='number';p.hasMax=typeof max==='number';p.minValue=min;p.maxValue=max;p.setValue=function(v){if(Array.isArray(value)){if(!Array.isArray(v)||v.length!==4)throw Error('Color must have four channels');}else{if(typeof v!=='number')throw Error('Array is not a number');if(p.hasMin&&v<min||p.hasMax&&v>max)throw Error('Value '+v+' out of range '+min+' to '+max);}this.value=v;};};
  if(name==='ADBE Fill'){define('0002',[1,0,0,1]);define('0003',0,0,10000);}
  if(name==='ADBE Glo2'){define('0001',1,1,2);define('0002',.6,0,percentMax);define('0003',10,0,10000);define('0004',1,0,1000);}
  if(name==='ADBE Ramp')define('0007',0,0,percentMax);
  return fx;
 };
}
const data=require('../fx-tools.json');let failed=0;
for(const max of [1,100])for(const r of data.effects){
 const e=create(),l=e.comp.add('shape');l.selected=true;strictLayer(l,max);
 const params=Object.fromEntries(r.parameters.map(p=>[p.id,p.default]));
 if(r.id==='bloom')params.tint=true;
 if(r.id==='prism')params.blend=70;
 const out=e.rpc({action:'fxTools',operation:'apply',id:r.id,params});
 try {assert.equal(out.changed,1,r.name+': '+out.message);
 if(r.id==='bloom')assert.equal(l.fx.property('MAFT bloom | source tint').property('ADBE Fill-0002').value.length,4);
 const glow=l.fx.items.find(p=>p.matchName==='ADBE Glo2');assert.equal(glow.property('ADBE Glo2-0001').value,1);
 assert.equal(glow.property('ADBE Glo2-0003').value,params.radius);assert.equal(glow.property('ADBE Glo2-0004').value,r.id==='bloom'?params.intensity:params.glow);
 const threshold=r.id==='bloom'?params.threshold:r.id==='glass'?65:35;
 assert.equal(glow.property('ADBE Glo2-0002').value,threshold/100*max);
 if(r.id!=='bloom')assert.equal(l.fx.property('MAFT '+r.id+' | '+(r.id==='glass'?'tint':'gradient')).property('ADBE Ramp-0007').value,(r.id==='glass'?100-params.tint:params.blend)/100*max);
 const changed={...params};if(r.id==='bloom')changed.threshold=100;else if(r.id==='glass')changed.tint=0;else changed.blend=100;const update=e.rpc({action:'fxTools',operation:'update',id:r.id,params:changed});assert.equal(update.changed,1,update.message);
 }catch(err){failed++;console.error(err.message);}
}
if(failed)process.exit(1);
console.log('PASS: all FXTools native scalar/color contracts and both normalized/percentage host ranges.');
