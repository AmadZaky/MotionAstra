const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
for(const [shape,n] of [['circle',4],['square',4],['polygon',7]]) {
 const e=create();assert.equal(e.rpc({action:'tool',name:'newShape',shape,sides:7,size:200,color:'#123456'}).changed,1);
 const l=e.comp.selectedLayers[0],s=l.vectors.property(1).property('ADBE Vectors Group').property('ADBE Vector Shape - Group').property('ADBE Vector Shape').value;
 assert.equal(s.vertices.length,n);assert.equal(s.closed,true);
 if(shape==='circle')assert(s.inTangents.some(t=>t.some(v=>v!==0)),'Circle needs Bezier handles');
 if(shape==='square')assert.equal(Math.abs(s.vertices[0][0]),100);
}
{const e=create();e.context.app.fonts={allFonts:[[{postScriptName:'Inter-SemiBold',familyName:'Inter',styleName:'Semi Bold'}]]};
 const f=e.rpc({action:'fonts'}).fonts[0];assert.equal(f.family,'Inter');assert.equal(f.style,'Semi Bold');
 assert.equal(e.rpc({action:'tool',name:'newText',font:f.value,size:120,color:'#12abef',text:'Hello'}).changed,1);
 const doc=e.comp.selectedLayers[0].text.property('ADBE Text Document').value;assert.equal(doc.font,'Inter-SemiBold');assert.equal(doc.fontSize,120);assert.equal(doc.text,'Hello');assert.deepEqual(Array.from(doc.fillColor),[18/255,171/255,239/255]);}
for(const payload of [{name:'newShape',shape:'bad'},{name:'newShape',shape:'polygon',sides:2},{name:'newShape',size:0},{name:'newText',size:0},{name:'newText',color:'bad'},{name:'newText',text:''}]) {
 const e=create();assert.equal(e.rpc({action:'tool',...payload}).ok,false,JSON.stringify(payload));assert.equal(e.comp.numLayers,0);
}
{const e=create();const old=e.comp.add('text');assert.equal(e.rpc({action:'tool',name:'newSolid',color:'#112233',background:true}).changed,1);const l=e.comp.selectedLayers[0];assert.equal(e.comp.items[e.comp.items.length-1],l);assert.equal(l.inPoint,0);assert.equal(l.outPoint,e.comp.duration);assert.equal(e.comp.numLayers,2);assert.equal(old.fx.numProperties,0);}
console.log('PASS: three shape geometries, native font metadata/style/size/color, invalid-input guards, one full-duration background at stack bottom.');
{const e=create(),old=e.comp.add('text'),add=e.comp.layers.addText;old.selected=true;e.comp.layers.addText=text=>{const l=add(text);l.text.property('ADBE Text Document').setValue=()=>{throw Error('Simulated native setup failure');};return l;};const r=e.rpc({action:'tool',name:'newText',text:'Rollback'});assert.equal(r.ok,false);assert.equal(e.comp.numLayers,1);assert.equal(e.comp.layer(1),old);assert.equal(old.selected,true);}
console.log('PASS: failed native text setup removes only the new layer.');
